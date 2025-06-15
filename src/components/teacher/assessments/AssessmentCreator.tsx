"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from '@/utils/api';
import { TRPCClientError, type TRPCClientErrorLike } from '@trpc/client';
import { type RouterOutputs } from '@/utils/api';
import { toast } from '@/components/ui/feedback/toast';
import type { ToastVariant } from '@/components/ui/feedback/toast';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { AssessmentCategory, GradingType, SystemStatus } from "@/server/api/constants";

// Define the field props interface
interface FieldProps {
  field: {
    value: any;
    onChange: (value: any) => void;
  };
}

type ClassData = RouterOutputs['class']['getById'];

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  totalPoints: z.coerce.number().min(1, "Total points must be at least 1"),
  dueDate: z.date({
    required_error: "Due date is required",
  }).min(new Date(), "Due date must be in the future"),
  assessmentType: z.enum(["QUIZ", "TEST", "ASSIGNMENT", "PROJECT", "EXAM"]),
  category: z.nativeEnum(AssessmentCategory),
  gradingType: z.nativeEnum(GradingType),
  status: z.nativeEnum(SystemStatus),
  subjectId: z.string().min(1),
  maxScore: z.number().min(0),
  weightage: z.number().min(0).max(100),
  instructions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssessmentCreatorProps {
  classId: string;
}

export default function AssessmentCreator({ classId }: AssessmentCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: classData } = api.class.getById.useQuery(
    {
      classId,
      include: {
        students: false,
        teachers: false
      }
    },
    {
      enabled: !!classId,
      onSuccess: (data: ClassData) => {
        const subjectId = data?.courseCampus?.course?.subjects[0]?.id;
        if (subjectId) {
          form.setValue('subjectId', subjectId);
        }
      },
      onError: (error: TRPCClientErrorLike<any>) => {
        toast({
          title: "Error",
          description: "Failed to load class data",
          variant: "error"
        });
      }
    }
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      topic: "",
      totalPoints: 100,
      assessmentType: "ASSIGNMENT",
      category: AssessmentCategory.ASSIGNMENT,
      gradingType: GradingType.MANUAL,
      status: SystemStatus.ACTIVE,
      maxScore: 100,
      weightage: 0,
      subjectId: "",
    },
  });

  const createAssessment = api.assessment.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment created successfully",
        variant: "success"
      });
      form.reset();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment",
        variant: "error"
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    createAssessment.mutate({
      title: data.title,
      description: data.description,
      category: data.category,
      subjectId: data.subjectId,
      maxScore: data.maxScore,
      weightage: data.weightage,
      gradingType: data.gradingType,
      dueDate: data.dueDate,
      instructions: data.instructions,
      status: data.status,
    });
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }: FieldProps) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter topic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentType"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                        <SelectItem value="TEST">Test</SelectItem>
                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="EXAM">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }: FieldProps) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter assessment description"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalPoints"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Total Points</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum points students can earn
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }: FieldProps) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the assessment is due
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Assessment"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
