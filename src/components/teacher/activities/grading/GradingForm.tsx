"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/forms/form";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/forms/textarea";
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

  if (!selectedStudentId || !selectedStudent) {
    return (
      <div className="flex flex-col items-center justify-center h-full border rounded-md p-8">
        <p className="text-gray-500 mb-4">
          Select a student from the list to grade their submission
        </p>
      </div>
    );
  }

  // Extract learning time information from submission
  const timeSpentMinutes = selectedStudent.submission?.timeSpentMinutes ||
    (selectedStudent.submission?.content as any)?.timeSpent || 0;

  // Format time spent for display
  const formattedTimeSpent = timeSpentMinutes > 60
    ? `${Math.floor(timeSpentMinutes / 60)}h ${timeSpentMinutes % 60}m`
    : `${timeSpentMinutes}m`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Grade Student: {selectedStudent.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Learning Time Information */}
        {timeSpentMinutes > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800">Learning Time Investment</h3>
            <p className="text-sm text-blue-700">
              This student spent <span className="font-semibold">{formattedTimeSpent}</span> on this activity
            </p>
            {selectedStudent.submission?.learningStartedAt && selectedStudent.submission?.learningCompletedAt && (
              <p className="text-xs text-blue-600 mt-1">
                From {new Date(selectedStudent.submission.learningStartedAt).toLocaleString()}
                to {new Date(selectedStudent.submission.learningCompletedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Submission Content */}
        {selectedStudent.submission?.content && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md border">
            <h3 className="text-sm font-medium">Submission Content</h3>
            <div className="mt-2 text-sm">
              {typeof selectedStudent.submission.content === 'object' ? (
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                  {JSON.stringify(selectedStudent.submission.content, null, 2)}
                </pre>
              ) : (
                <p>{String(selectedStudent.submission.content)}</p>
              )}
            </div>
          </div>
        )}

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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
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
