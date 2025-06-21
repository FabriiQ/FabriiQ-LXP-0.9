'use client';

/**
 * Teacher Assessment Grading Page
 *
 * This page allows teachers to grade student submissions for assessments.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ClassNavigation } from '@/components/teacher/classes/ClassNavigation';
import { PageHeader } from '@/components/ui/page-header';
import { AssessmentGrading } from '@/features/assessments/components/grading/AssessmentGrading';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';

export default function TeacherAssessmentGradingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const assessmentId = params.assessmentId as string;
  const studentId = params.studentId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch assessment data
  const { data: assessment, isLoading: assessmentLoading } = api.assessment.getById.useQuery({
    id: assessmentId,
  });
  
  // Fetch student data
  const { data: student, isLoading: studentLoading } = api.user.getById.useQuery({
    id: studentId,
  });
  
  // Fetch submission data
  const { data: submission, isLoading: submissionLoading } = api.assessment.getSubmission.useQuery({
    assessmentId,
    studentId,
  });
  
  // Update loading state
  useEffect(() => {
    setIsLoading(assessmentLoading || studentLoading || submissionLoading);
  }, [assessmentLoading, studentLoading, submissionLoading]);
  
  // Handle graded event
  const handleGraded = () => {
    toast({
      title: 'Grading saved',
      description: 'The grading has been saved successfully',
    });
  };
  
  // Handle back button click
  const handleBack = () => {
    router.back();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container py-6">
        <ClassNavigation />
        <div className="mt-6 space-y-6">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }
  
  // Render error state if assessment or submission not found
  if (!assessment || !submission) {
    return (
      <div className="container py-6">
        <ClassNavigation />
        <div className="mt-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              The assessment or submission could not be found. Please check the assessment and student IDs.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <ClassNavigation />
      <div className="mt-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <PageHeader
          title={`Grade: ${assessment.title}`}
          description={`Student: ${student?.name || 'Unknown Student'}`}
        />
        
        <Separator className="my-6" />
        
        <AssessmentGrading
          assessmentId={assessmentId}
          studentId={studentId}
          submissionId={submission.id}
          onGraded={handleGraded}
        />
      </div>
    </div>
  );
}
