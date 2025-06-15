'use client';

/**
 * Teacher Activity Grading Page
 *
 * This page allows teachers to grade student submissions for activities.
 * It supports different activity types, including manual grading activities.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, Loader2 } from 'lucide-react';
// Using standard components instead of custom navigation components
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UnifiedGradingComponent } from '@/features/activties/components/grading/UnifiedGradingComponent';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';

export default function TeacherActivityGradingPage() {
  const params = useParams<{ activityId: string; studentId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const activityId = params?.activityId || '';
  const studentId = params?.studentId || '';

  const [isLoading, setIsLoading] = useState(true);

  // Fetch activity data
  const { data: activity, isLoading: activityLoading } = api.activity.getById.useQuery({
    id: activityId,
  });

  // Fetch student data
  const { data: student, isLoading: studentLoading } = api.user.getById.useQuery(
    studentId,
    { enabled: !!studentId }
  );

  // Fetch submission data
  const { data: submission, isLoading: submissionLoading } = api.activityGrade.get.useQuery({
    activityId,
    studentId,
  });

  // Update loading state
  useEffect(() => {
    setIsLoading(activityLoading || studentLoading || submissionLoading);
  }, [activityLoading, studentLoading, submissionLoading]);

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
        <div className="mt-6 space-y-6">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  // Render error state if activity or submission not found
  if (!activity || !submission) {
    return (
      <div className="container py-6">
        <div className="mt-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              The activity or submission could not be found. Please check the activity and student IDs.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mt-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{`Grade: ${activity.title}`}</CardTitle>
            <CardDescription>{`Student: ${student?.name || 'Unknown Student'}`}</CardDescription>
          </CardHeader>
        </Card>

        <Separator className="my-6" />

        {/* Use the unified grading component for all activity types */}
        <UnifiedGradingComponent
          activity={activity}
          studentId={studentId}
          submissionId={submission.id}
          onGraded={handleGraded}
        />
      </div>
    </div>
  );
}
