"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { StudentWithSubmission } from "./StudentList";

// Define the schema for grading form
const gradingSchema = z.object({
  score: z.coerce.number().min(0, "Score must be at least 0"),
  feedback: z.string().optional(),
});

export type GradingFormValues = z.infer<typeof gradingSchema>;

interface GradingFormProps {
  selectedStudentId: string | null;
  students: StudentWithSubmission[];
  maxScore: number;
  onSubmit: (data: GradingFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  defaultValues?: GradingFormValues;
}

export function GradingForm({
  selectedStudentId,
  students,
  maxScore,
  onSubmit,
  onCancel,
  isSubmitting,
  defaultValues = { score: 0, feedback: "" },
}: GradingFormProps) {
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues,
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Check if the student has a submission
  const hasSubmission = selectedStudent?.submission !== undefined;

  console.log('GradingForm - Selected student:', selectedStudent);
  console.log('GradingForm - Has submission:', hasSubmission);

  if (!selectedStudentId || !selectedStudent) {
    return (
      <div className="flex flex-col items-center justify-center h-full border rounded-md p-8">
        <p className="text-gray-500 mb-4">
          Select a student from the list to grade their submission
        </p>
      </div>
    );
  }

  // If the student doesn't have a submission, show a message with option to create a submission
  if (!hasSubmission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Grade Student: {selectedStudent.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-4">
            <p className="text-amber-600 mb-4">
              This student has not submitted their work yet.
            </p>
            <p className="text-gray-500 mb-6">
              You can create a submission for this student to grade their work.
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 w-full"
              >
                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Score</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={maxScore}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum score: {maxScore}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide feedback to the student"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Submission...
                      </>
                    ) : (
                      "Create Submission & Grade"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Grade Student: {selectedStudent.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={maxScore}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum score: {maxScore}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide feedback to the student"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Grade"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
