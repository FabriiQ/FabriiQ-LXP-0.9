'use client';

import React from 'react';
import { BloomsAssessmentGrading } from '@/features/bloom/components/assessments';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { api } from '@/trpc/react';

interface BloomGradingPageProps {
  params: {
    id: string;
  };
}

export default function BloomGradingPage({ params }: BloomGradingPageProps) {
  const { id: assessmentId } = params;
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Get assessment data to get the class ID
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({
    assessmentId
  });

  // Show loading state
  if (status === 'loading' || isLoadingAssessment) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-8 w-1/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Check if user is a teacher
  if (session?.user?.userType !== 'TEACHER' && session?.user?.userType !== 'CAMPUS_TEACHER') {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the assessment grading.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if assessment exists
  if (!assessment) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Assessment Not Found</AlertTitle>
          <AlertDescription>
            The assessment you are trying to grade does not exist or you do not have permission to access it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <BloomsAssessmentGrading 
        assessmentId={assessmentId} 
        classId={assessment.classId || ''} 
        teacherId={session.user.id} 
      />
    </div>
  );
}
