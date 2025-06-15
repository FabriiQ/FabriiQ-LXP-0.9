'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { BloomsAnalyticsDashboard } from '@/features/bloom/components/analytics';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BloomsAnalyticsPageProps {
  params: {
    classId: string;
  };
}

export default function BloomsAnalyticsPage({ params }: BloomsAnalyticsPageProps) {
  const { classId } = params;
  const { data: session, status } = useSession();
  
  // Get class details
  const { data: classDetails, isLoading: isLoadingClass } = api.class.getClassById.useQuery(
    { id: classId },
    { enabled: !!classId }
  );
  
  // Get teacher ID
  const { data: teacher, isLoading: isLoadingTeacher } = api.teacher.getTeacherByUserId.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  );
  
  // Loading state
  if (status === 'loading' || isLoadingClass || isLoadingTeacher) {
    return (
      <div className="container py-6">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            You must be signed in to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // No teacher found
  if (!teacher) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>
            You must be a teacher to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // No class found
  if (!classDetails) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Class Not Found</AlertTitle>
          <AlertDescription>
            The requested class could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <BloomsAnalyticsDashboard
        classId={classId}
        teacherId={teacher.id}
      />
    </div>
  );
}
