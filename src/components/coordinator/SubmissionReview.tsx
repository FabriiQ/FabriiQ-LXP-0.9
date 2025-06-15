'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, CheckCircle, FileText, User, Save } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SubmissionStatus } from '@/server/api/constants';

interface SubmissionReviewProps {
  assessmentId: string;
  submissionId: string;
}

export function SubmissionReview({ assessmentId, submissionId }: SubmissionReviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('submission');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  // Fetch submission details
  const { data: submission, isLoading: isLoadingSubmission, refetch } = api.assessment.getSubmission.useQuery(
    { id: submissionId },
    { enabled: !!submissionId }
  );

  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { assessmentId },
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
      refetch();
      router.push(`/admin/coordinator/assessments/${assessmentId}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grade submission',
        variant: 'error',
      });
    },
  });

  const isLoading = isLoadingSubmission || isLoadingAssessment;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!submission || !assessment) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground">Submission or assessment not found</p>
              <Button
                className="mt-4"
                onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApproveSubmission = () => {
    if (score === null) {
      toast({
        title: 'Error',
        description: 'Please enter a score',
        variant: 'error',
      });
      return;
    }

    gradeMutation.mutate({
      submissionId,
      score,
      feedback,
      status: SubmissionStatus.GRADED,
    });
  };

  const getSubmissionStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
        return <Badge variant="outline">Submitted</Badge>;
      case SubmissionStatus.LATE:
        return <Badge variant="warning">Late</Badge>;
      case SubmissionStatus.GRADED:
        return <Badge variant="success">Graded</Badge>;
      case SubmissionStatus.RESUBMIT:
        return <Badge variant="error">Resubmit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessment
        </Button>
        {submission.status !== SubmissionStatus.GRADED && (
          <Button onClick={handleApproveSubmission} disabled={gradeMutation.isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve & Grade
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{assessment.title}</CardTitle>
              <CardDescription>
                Submission by {submission.student?.user?.name || 'Unknown Student'}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getSubmissionStatusBadge(submission.status as SubmissionStatus)}
              <span className="text-sm text-muted-foreground">
                Submitted: {submission.submittedAt ? formatDate(new Date(submission.submittedAt)) : 'Unknown'}
              </span>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="px-6">
            <TabsTrigger value="submission">Submission</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
            <TabsTrigger value="student">Student Info</TabsTrigger>
          </TabsList>

          <CardContent className="pt-6">
            <TabsContent value="submission" className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Submission Content</h3>
                {submission.content ? (
                  <div className="whitespace-pre-wrap">
                    {typeof submission.content === 'string'
                      ? submission.content
                      : JSON.stringify(submission.content, null, 2)}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No content submitted</p>
                )}
              </div>

              {submission.attachments && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Attachments</h3>
                  {Array.isArray(submission.attachments) ? (
                    <ul className="list-disc pl-5">
                      {submission.attachments.map((attachment: any, index: number) => (
                        <li key={index}>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {attachment.name || `Attachment ${index + 1}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      {JSON.stringify(submission.attachments)}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="grading" className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-4">Grade Submission</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score">Score</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max={assessment.maxScore || 100}
                        value={score !== null ? score : submission.score || ''}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="w-24"
                        disabled={submission.status === SubmissionStatus.GRADED}
                      />
                      <span className="text-sm text-muted-foreground">
                        / {assessment.maxScore || 100}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Provide feedback to the student"
                      value={feedback || (submission.feedback ? JSON.stringify(submission.feedback) : '')}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-[100px]"
                      disabled={submission.status === SubmissionStatus.GRADED}
                    />
                  </div>
                </div>
              </div>

              {submission.status === SubmissionStatus.GRADED ? (
                <div className="border rounded-md p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Grading Information</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Score:</span> {submission.score} /{' '}
                      {assessment.maxScore || 100}
                    </p>
                    <p>
                      <span className="font-medium">Graded At:</span>{' '}
                      {submission.gradedAt ? formatDate(new Date(submission.gradedAt)) : 'Unknown'}
                    </p>
                    {submission.feedback && (
                      <div>
                        <span className="font-medium">Feedback:</span>
                        <p className="mt-1 whitespace-pre-wrap">
                          {typeof submission.feedback === 'string'
                            ? submission.feedback
                            : JSON.stringify(submission.feedback, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button onClick={handleApproveSubmission} disabled={gradeMutation.isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save & Approve
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="student" className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-4">Student Information</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Name:</span> {submission.student?.user?.name || 'Unknown'}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {submission.student?.user?.email || 'Unknown'}
                  </p>
                  {submission.student?.enrollments && submission.student.enrollments.length > 0 && (
                    <>
                      <p>
                        <span className="font-medium">Program:</span>{' '}
                        {submission.student.enrollments[0].program?.name || 'Unknown'}
                      </p>
                      <p>
                        <span className="font-medium">Campus:</span>{' '}
                        {submission.student.enrollments[0].campus?.name || 'Unknown'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {submission.student?.grades && submission.student.grades.length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-4">Recent Grades</h3>
                  <ul className="space-y-2">
                    {submission.student.grades.map((grade: any) => (
                      <li key={grade.id} className="flex justify-between">
                        <span>{grade.assessment?.title || 'Unknown Assessment'}</span>
                        <span>
                          {grade.score !== null
                            ? `${grade.score}/${grade.assessment?.maxScore || 100}`
                            : 'Not graded'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="flex justify-between border-t p-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Student ID: {submission.studentId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Submission ID: {submission.id}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
