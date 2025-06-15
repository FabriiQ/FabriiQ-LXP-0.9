'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';
import { ArrowLeft } from '@/components/ui/icons/custom-icons';
import { api } from '@/trpc/react';
import { SubmissionStatus } from '../../types/enums';
import { GradingResultsView } from './GradingResultsView';

interface SubmissionConfirmationPageProps {
  assessmentId: string;
  submissionId: string;
  className?: string;
}

export function SubmissionConfirmationPage({
  assessmentId,
  submissionId,
  className = '',
}: SubmissionConfirmationPageProps) {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);

  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );

  // Fetch submission details
  const { data: submission, isLoading: isLoadingSubmission } = api.assessment.getSubmission.useQuery(
    { id: submissionId },
    { enabled: !!submissionId }
  );

  // Determine if results can be shown immediately
  useEffect(() => {
    if (assessment && submission) {
      // Show results immediately if:
      // 1. The assessment is auto-graded
      // 2. The submission is already graded
      // 3. The assessment settings allow showing results immediately
      const canShowResults =
        assessment.gradingType === 'AUTOMATIC' ||
        submission.status === SubmissionStatus.GRADED ||
        assessment.showResultsImmediately;

      setShowResults(canShowResults);
    }
  }, [assessment, submission]);

  // Handle view results click
  const handleViewResults = () => {
    setShowResults(true);
  };

  // Handle return to dashboard click
  const handleReturnToDashboard = () => {
    router.push('/student/dashboard');
  };

  if (isLoadingAssessment || isLoadingSubmission) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p>Loading submission details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment || !submission) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p>Assessment or submission not found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If showing results and we have grading data
  if (showResults && submission.gradingResults) {
    return (
      <GradingResultsView
        assessment={assessment}
        answers={submission.content?.answers || {}}
        gradingResults={submission.gradingResults}
        className={className}
      />
    );
  }

  // Otherwise show confirmation page
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Assessment Submitted</CardTitle>
        <CardDescription>
          Your submission for {assessment.title} has been received.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-center">
            Thank you for completing the assessment!
          </h2>

          <p className="text-center text-gray-500 max-w-md">
            Your submission has been recorded successfully.
            {assessment.gradingType === 'AUTOMATIC'
              ? 'Your results are available now.'
              : 'Your submission will be graded by your teacher.'}
          </p>

          {submission.submittedAt && (
            <div className="flex items-center text-sm text-gray-500 mt-4">
              <Clock className="h-4 w-4 mr-2" />
              <span>Submitted on {new Date(submission.submittedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-center gap-4 border-t p-6">
        {assessment.gradingType === 'AUTOMATIC' && !showResults && (
          <Button onClick={handleViewResults}>
            View Results
          </Button>
        )}

        <Button variant="outline" onClick={handleReturnToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
