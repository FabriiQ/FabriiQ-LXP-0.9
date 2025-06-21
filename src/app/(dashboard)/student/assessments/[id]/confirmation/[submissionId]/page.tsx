'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { SubmissionConfirmationPage } from '@/features/assessments/components/online';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AssessmentConfirmationPage({
  params
}: {
  params: Promise<{ id: string; submissionId: string }>
}) {
  // Unwrap the params promise
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  
  // Get submission details
  const { data: submission, error } = api.assessment.getSubmissionResults.useQuery(
    { id: resolvedParams.submissionId },
    {
      retry: false,
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load submission details',
          variant: 'destructive',
        });
      },
    }
  );
  
  // Handle back button click
  const handleBack = () => {
    router.push('/student/assessments');
  };
  
  if (error) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Submission Unavailable"
          description="This submission is not available or you don't have permission to access it."
        />
        <div className="mt-6">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }
  
  if (!submission) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Loading Submission..."
          description="Please wait while we load your submission details."
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <PageHeader
        title="Assessment Submitted"
        description="Your assessment has been submitted successfully."
      />
      
      <div className="mt-6">
        <SubmissionConfirmationPage
          assessmentId={resolvedParams.id}
          submissionId={resolvedParams.submissionId}
          className="w-full"
        />
      </div>
    </div>
  );
}
