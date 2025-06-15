"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/feedback/toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/forms/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { TRPCClientErrorLike } from "@trpc/client";
import { AppRouter } from "@/server/api/root";

const enrollmentFormSchema = z.object({
  classId: z.string({
    required_error: "Please select a class",
  }),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

interface EnrollmentFormProps {
  studentId: string;
  studentName: string;
  classes: {
    id: string;
    name: string;
    courseCampus: {
      course: {
        name: string;
      }
    };
    term: {
      name: string;
    };
  }[];
  adminId: string;
}

export function EnrollmentForm({
  studentId,
  studentName,
  classes,
  adminId,
}: EnrollmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof enrollmentFormSchema>>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      classId: "",
      startDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const enrollStudentMutation = api.enrollment.createEnrollment.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: "Success",
        description: `${studentName} has been enrolled successfully`,
      });
      router.push(`/admin/campus/students/${studentId}`);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "error",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof enrollmentFormSchema>) => {
    setIsSubmitting(true);
    
    enrollStudentMutation.mutate({
      studentId: studentId,
      classId: data.classId,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      notes: data.notes,
      createdById: adminId,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name} - {classItem.courseCampus.course.name} ({classItem.term.name})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available classes found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                Date when the enrollment becomes active
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional enrollment notes"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/campus/students/${studentId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || classes.length === 0}
          >
            {isSubmitting ? "Enrolling..." : "Enroll Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 