"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/core/input";
import { Button } from "@/components/ui/core/button";
import { api } from "@/trpc/react";
import { SystemStatus } from "@/server/api/constants";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/feedback/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  BloomsDistributionChart
} from "@/features/bloom/components/taxonomy/BloomsDistributionChart";
import {
  BloomsTaxonomyLevel,
  BloomsDistribution
} from "@/features/bloom/types";
import {
  DEFAULT_BLOOMS_DISTRIBUTION,
  GRADE_LEVEL_DISTRIBUTIONS
} from "@/features/bloom/constants/bloom-levels";
import {
  isDistributionBalanced
} from "@/features/bloom/utils/bloom-helpers";
import { Card } from "@/components/ui/data-display/card";
import { InfoCircledIcon } from "@radix-ui/react-icons";

const subjectSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  credits: z.number().min(0),
  courseId: z.string().min(1, "Course is required"),
  status: z.nativeEnum(SystemStatus).optional(),
  syllabus: z.record(z.any()).optional(),
  bloomsDistribution: z.record(z.number()).optional(),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectFormProps {
  initialData?: Partial<SubjectFormData>;
  subjectId?: string;
  onSuccess?: () => void;
}

export function SubjectForm({
  initialData,
  subjectId,
  onSuccess,
}: SubjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!subjectId;

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      credits: initialData?.credits || 0,
      courseId: initialData?.courseId || "",
      status: initialData?.status || SystemStatus.ACTIVE,
      syllabus: initialData?.syllabus || {},
      bloomsDistribution: initialData?.bloomsDistribution || DEFAULT_BLOOMS_DISTRIBUTION,
    },
  });

  // Function to handle distribution changes
  const handleDistributionChange = (newDistribution: BloomsDistribution) => {
    form.setValue("bloomsDistribution", newDistribution);
  };

  const { data: coursesData } = api.course.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  const createSubject = api.subject.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject created successfully",
        variant: "success",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/system/subjects");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subject",
        variant: "error",
      });
    },
  });

  const updateSubject = api.subject.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject updated successfully",
        variant: "success",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/system/subjects");
      }
    },
    onError: (error) => {
      console.error("Error updating subject:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subject",
        variant: "error",
      });
    },
  });

  const handleSubmit = async (data: SubjectFormData) => {
    try {
      // Validate that the Bloom's distribution percentages add up to 100%
      const distribution = data.bloomsDistribution as BloomsDistribution;
      const total = Object.values(distribution).reduce((sum, value) => sum + (value || 0), 0);

      if (Math.abs(total - 100) > 1) { // Allow for small rounding errors
        toast({
          title: "Validation Error",
          description: `Bloom's Taxonomy distribution percentages must add up to 100%. Current total: ${total.toFixed(1)}%`,
          variant: "error",
        });
        return;
      }

      if (isEditing && subjectId) {
        updateSubject.mutate({
          id: subjectId,
          data: {
            name: data.name,
            status: data.status,
            credits: data.credits,
            syllabus: data.syllabus,
            bloomsDistribution: data.bloomsDistribution
          }
        });
      } else {
        createSubject.mutate({
          code: data.code,
          name: data.name,
          credits: data.credits,
          courseId: data.courseId,
          status: data.status,
          syllabus: data.syllabus,
          bloomsDistribution: data.bloomsDistribution
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "error",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="credits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credits</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {coursesData?.courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bloom's Taxonomy Distribution */}
        <FormField
          control={form.control}
          name="bloomsDistribution"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Bloom's Taxonomy Distribution</FormLabel>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDistributionChange(DEFAULT_BLOOMS_DISTRIBUTION)}
                  >
                    Reset to Default
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDistributionChange(GRADE_LEVEL_DISTRIBUTIONS.elementary)}
                  >
                    Elementary
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDistributionChange(GRADE_LEVEL_DISTRIBUTIONS.middle)}
                  >
                    Middle School
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDistributionChange(GRADE_LEVEL_DISTRIBUTIONS.high)}
                  >
                    High School
                  </Button>
                </div>
              </div>

              <Card className="p-4">
                <div className="h-64">
                  <BloomsDistributionChart
                    distribution={field.value as BloomsDistribution}
                    onChange={handleDistributionChange}
                    editable={true}
                    showLabels={true}
                    showPercentages={true}
                    variant="bar"
                  />
                </div>

                <div className="mt-4 flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <InfoCircledIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Set the recommended distribution of cognitive levels for this subject. The percentages should add up to 100%.</p>
                    <p className="mt-1">This distribution will guide the creation of learning outcomes, activities, and assessments.</p>
                    {!isDistributionBalanced(field.value as BloomsDistribution) && (
                      <p className="mt-2 text-amber-600 dark:text-amber-500">
                        Note: The current distribution differs significantly from recommended best practices.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createSubject.isLoading || updateSubject.isLoading}>
          {isEditing ? "Update" : "Create"} Subject
        </Button>
      </form>
    </Form>
  );
}