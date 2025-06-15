'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { AssessmentTaker } from '@/features/assessments/components/online';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function TakeAssessmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get assessment for taking
  const { data: assessment, error } = api.assessment.getForTaking.useQuery(
    { id: params.id },
    {
      retry: false,
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load assessment',
          variant: 'destructive',
        });
        setIsLoading(false);
      },
      onSuccess: () => {
        setIsLoading(false);
      },
    }
  );
  
  // Redirect if not a student
  useEffect(() => {
    if (session && session.user && session.user.userType !== 'CAMPUS_STUDENT') {
      toast({
        title: 'Access Denied',
        description: 'Only students can take assessments',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [session, router, toast]);
  
  // Handle back button click
  const handleBack = () => {
    router.push('/student/assessments');
  };
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Loading Assessment..."
          description="Please wait while we load your assessment."
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Assessment Unavailable"
          description="This assessment is not available or you don't have permission to access it."
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
  
  if (!assessment) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Assessment Not Found"
          description="The assessment you're looking for doesn't exist or has been removed."
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
  
  return (
    <div className="container py-6">
      <PageHeader
        title={assessment.title}
        description={assessment.description || 'Complete the assessment below.'}
      />
      
      <div className="mt-6">
        <AssessmentTaker
          assessmentId={params.id}
          studentId={session?.user?.id || ''}
          className="w-full"
        />
      </div>
    </div>
  );
}
