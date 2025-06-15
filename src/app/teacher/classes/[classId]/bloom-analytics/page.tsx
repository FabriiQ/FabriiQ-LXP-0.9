'use client';

import React from 'react';
import { BloomsAnalyticsDashboard } from '@/features/bloom/components/analytics';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BloomAnalyticsPageProps {
  params: {
    classId: string;
  };
}

export default function BloomAnalyticsPage({ params }: BloomAnalyticsPageProps) {
  const { classId } = params;
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Get class data
  const { data: classData, isLoading: isLoadingClass } = api.teacher.getClassById.useQuery({
    classId
  });

  // Show loading state
  if (status === 'loading' || isLoadingClass) {
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
        <Alert className="bg-destructive/15 border-destructive/50 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the class analytics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if class exists
  if (!classData) {
    return (
      <div className="container py-8">
        <Alert className="bg-destructive/15 border-destructive/50 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Class Not Found</AlertTitle>
          <AlertDescription>
            The class you are trying to view does not exist or you do not have permission to access it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href={`/teacher/classes/${classId}`}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {classData.name} - Bloom's Taxonomy Analytics
        </h1>
      </div>

      <BloomsAnalyticsDashboard
        classId={classId}
        teacherId={session.user.id}
        className={classData.name}
      />
    </div>
  );
}
