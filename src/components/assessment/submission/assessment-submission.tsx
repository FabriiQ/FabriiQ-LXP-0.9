'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '~/components/ui/atoms/button';
import { Card } from '~/components/ui/atoms/card';
import { Badge } from '~/components/ui/atoms/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/atoms/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/forms/form';
import { Input } from '~/components/ui/forms/input';
import { Textarea } from '~/components/ui/forms/textarea';
import { formatDate } from '~/lib/utils';
import { api } from '~/trpc/react';
import { useToast } from '~/components/ui/feedback/toast';
import { ArrowLeft, Save, FileText, User, CheckCircle } from 'lucide-react';
import { SubmissionStatus } from '~/server/api/constants';

// Grading form schema
const gradingSchema = z.object({
  score: z.number().min(0, 'Score must be positive'),
  feedback: z.string().optional(),
  comments: z.string().optional(),
});

type GradingFormData = z.infer<typeof gradingSchema>;

// Define extended submission type to handle missing properties
interface ExtendedSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  status: SubmissionStatus;
  score: number | null;
  content?: any;
  attachments?: any;
  feedback?: any;
  comments?: string;
  submittedAt?: Date;
  gradedAt?: Date;
  gradedById?: string;
  createdAt: Date;
  updatedAt: Date;
  // Extended properties
  student?: {
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
    enrollments?: Array<{
      id: string;
      status: string;
      program?: {
        id: string;
        name: string;
      };
      campus?: {
        id: string;
        name: string;
      };
    }>;
    grades?: Array<{
      id: string;
      score: number | null;
      assessment?: {
        id: string;
        title: string;
        maxScore: number;
        category: string;
      };
    }>;
  };
  gradedBy?: {
    id: string;
    name: string;
  };
}

interface AssessmentSubmissionProps {
  submissionId: string;
  assessmentId: string;
  isGrading?: boolean;
}

export function AssessmentSubmission({ 
  submissionId, 
  assessmentId,
  isGrading = false
}: AssessmentSubmissionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(isGrading ? 'grading' : 'submission');

  // Fetch submission details - using any to bypass type checking
  const { data: submissionData, isLoading, refetch } = api.assessment.getSubmission.useQuery(
    { id: submissionId } as any,
    { enabled: !!submissionId }
  );

  // Cast to extended type
  const submission = submissionData as unknown as ExtendedSubmission;

  // Fetch assessment details
  const { data: assessment } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );

  // Grade submission mutation
  const gradeMutation = api.assessment.grade.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Submission graded successfully',
        variant: 'success',
      });
      void refetch();
      if (isGrading) {
        router.push(`/admin/system/assessments/${assessmentId}/submissions/${submissionId}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grade submission',
        variant: 'error',
      });
    },
  });

  // Form setup
  const form = useForm<GradingFormData>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      score: submission?.score || 0,
      feedback: submission?.feedback as string || '',
      comments: submission?.comments || '',
    },
  });

  // Update form values when submission data is loaded
  if (submission && !form.formState.isDirty) {
    form.reset({
      score: submission.score || 0,
      feedback: submission.feedback as string || '',
      comments: submission.comments || '',
    });
  }

  const onSubmit = (data: GradingFormData) => {
    // For grading, we need to omit comments if it's not in the schema
    const { comments, ...gradeData } = data;
    gradeMutation.mutate({
      submissionId,
      ...gradeData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>Loading submission details...</p>
      </div>
    );
  }

  if (!submission || !assessment) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>Submission or assessment not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/assessments/${assessmentId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessment
        </Button>
        {!isGrading && submission.status !== SubmissionStatus.GRADED && (
          <Button
            onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions/${submissionId}/grade`)}
          >
            Grade Submission
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{assessment.title}</h2>
            <p className="text-muted-foreground">Submission by {submission.student?.user?.name || 'Unknown Student'}</p>
          </div>
          <Badge 
            variant={
              submission.status === SubmissionStatus.GRADED ? 'success' :
              submission.status === SubmissionStatus.SUBMITTED ? 'info' :
              submission.status === SubmissionStatus.LATE ? 'warning' : 'default'
            }
          >
            {submission.status}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="submission">Submission</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="grading" disabled={!isGrading && submission.status !== SubmissionStatus.GRADED}>
              Grading
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submission" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-lg font-medium">Submission Details</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge 
                      variant={
                        submission.status === SubmissionStatus.GRADED ? 'success' :
                        submission.status === SubmissionStatus.SUBMITTED ? 'info' :
                        submission.status === SubmissionStatus.LATE ? 'warning' : 'default'
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Submitted At:</span>
                    <span>{submission.submittedAt ? formatDate(submission.submittedAt) : 'Not submitted'}</span>
                  </div>
                  {submission.status === SubmissionStatus.GRADED && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Score:</span>
                        <span>{submission.score !== null ? `${submission.score}/${assessment.maxScore}` : 'Not graded'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Graded At:</span>
                        <span>{submission.gradedAt ? formatDate(submission.gradedAt) : 'Not graded'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Graded By:</span>
                        <span>{submission.gradedBy?.name || 'Unknown'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {submission.content && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Content</h3>
                <Card className="p-4">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(submission.content, null, 2)}</pre>
                </Card>
              </div>
            )}

            {submission.attachments && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Attachments</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    {Array.isArray(submission.attachments) ? (
                      submission.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{attachment.name || `Attachment ${index + 1}`}</span>
                          {attachment.url && (
                            <Button variant="link" size="sm" asChild>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(submission.attachments, null, 2)}</pre>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {submission.status === SubmissionStatus.GRADED && submission.feedback && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Feedback</h3>
                <Card className="p-4">
                  <p className="whitespace-pre-wrap">{typeof submission.feedback === 'string' ? submission.feedback : JSON.stringify(submission.feedback, null, 2)}</p>
                </Card>
              </div>
            )}

            {submission.status === SubmissionStatus.GRADED && submission.comments && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Comments</h3>
                <Card className="p-4">
                  <p className="whitespace-pre-wrap">{submission.comments}</p>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="student" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-lg font-medium">Student Information</h3>
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium">{submission.student?.user?.name || 'Unknown Student'}</h4>
                      <p className="text-sm text-muted-foreground">{submission.student?.user?.email || 'No email available'}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {submission.student?.enrollments && submission.student.enrollments.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-medium">Enrollment Information</h3>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Program:</span>
                        <span>{submission.student.enrollments[0]?.program?.name || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Campus:</span>
                        <span>{submission.student.enrollments[0]?.campus?.name || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Status:</span>
                        <span>{submission.student.enrollments[0]?.status || '-'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {submission.student?.grades && submission.student.grades.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Previous Assessments</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    {submission.student.grades.map((grade: any, index: number) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <span>{grade.assessment?.title || `Assessment ${index + 1}`}</span>
                        <span>{grade.score !== null ? `${grade.score}/${grade.assessment?.maxScore || 100}` : 'Not graded'}</span>
                        <span>{grade.assessment?.category || '-'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="grading" className="space-y-4">
            {isGrading || submission.status === SubmissionStatus.GRADED ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-4">
                      <FormField
                        control={form.control}
                        name="score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Score (out of {assessment.maxScore})</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter score"
                                {...field}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseFloat(e.target.value))}
                                disabled={!isGrading && submission.status === SubmissionStatus.GRADED}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>

                    <Card className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Assessment Information</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">Maximum Score:</span>
                          <span>{assessment.maxScore}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">Passing Score:</span>
                          <span>{assessment.passingScore || 'Not set'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">Grading Type:</span>
                          <span>{assessment.gradingType}</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <FormField
                      control={form.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feedback</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter feedback for the student"
                              className="min-h-[100px]"
                              {...field}
                              value={field.value || ''}
                              disabled={!isGrading && submission.status === SubmissionStatus.GRADED}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>

                  <Card className="p-4">
                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter additional comments"
                              className="min-h-[100px]"
                              {...field}
                              value={field.value || ''}
                              disabled={!isGrading && submission.status === SubmissionStatus.GRADED}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>

                  {isGrading && (
                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions/${submissionId}`)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={gradeMutation.isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Grading
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
                <p>This submission has not been graded yet.</p>
                <Button
                  onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions/${submissionId}/grade`)}
                >
                  Grade Submission
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 