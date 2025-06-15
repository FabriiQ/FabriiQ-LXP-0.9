"use client";

import { useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/forms/select";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/forms/date-picker";
import { ActivityType } from "@prisma/client";

interface ClassActivityCreatorProps {
  classId: string;
}

interface DateFieldProps {
  field: {
    value: Date;
    onChange: (date: Date | null) => void;
  };
}

// Add FieldProps interface
interface FieldProps<T extends FieldValues = any> {
  field: {
    value: T;
    onChange: (value: T) => void;
    name: string;
    onBlur: () => void;
    ref: React.Ref<any>;
  };
}

// Add interface for class details type
interface ClassDetails {
  id: string;
  name: string;
  courseCampus: {
    course: {
      subjects: Array<{
        id: string;
        name: string;
      }>;
    };
  };
  // ... other properties
}

const activitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.nativeEnum(ActivityType), // Use the Prisma enum
  scheduledDate: z.date(),
  duration: z.coerce.number().min(5, "Duration must be at least 5 minutes"),
  materials: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

export default function ClassActivityCreator({ classId }: ClassActivityCreatorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get class details
  const { data: classDetails, isLoading: isLoadingClass } = api.class.getById.useQuery(
    {
      classId,
      include: {
        students: false,
        teachers: false
      }
    },
    {
      // Optional: Add error handling
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to load class details",
          variant: "error",
        });
      },
    }
  );

  // Get the subject ID from the courseCampus relationship
  const subjectId = classDetails?.courseCampus?.course?.subjects[0]?.id;

  // Create activity mutation
  const createActivityMutation = api.activity.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Activity created",
        description: "The class activity has been created successfully.",
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create activity. Please try again.",
        variant: "error",
      });
      setIsSubmitting(false);
    },
  });

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      description: "",
      type: ActivityType.OTHER,
      scheduledDate: new Date(),
      duration: 30,
      materials: "",
    },
  });

  const onSubmit = (data: ActivityFormValues) => {
    if (!subjectId) {
      toast({
        title: "Error",
        description: "No subject found for this class",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);

    createActivityMutation.mutate({
      classId,
      title: data.title,
      type: data.type,
      description: data.description,
      content: {
        duration: data.duration,
        materials: data.materials || "",
        scheduledDate: data.scheduledDate.toISOString(),
      },
      subjectId,
    });
  };

  if (isLoadingClass) {
    return <ClassActivityCreatorSkeleton />;
  }

  if (!classDetails) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Class not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Class Activity</CardTitle>
        <CardDescription>
          Plan a new activity for {classDetails.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }: FieldProps) => (
                <FormItem>
                  <FormLabel>Activity Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ActivityType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }: FieldProps) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Scheduled Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: FieldProps) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the activity"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="materials"
              render={({ field }: FieldProps) => (
                <FormItem>
                  <FormLabel>Materials (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any materials or resources needed"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter any materials, links, or resources needed for this activity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Activity"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ClassActivityCreatorSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-[120px] w-full" />
          </div>

          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-[80px] w-full" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>

          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
