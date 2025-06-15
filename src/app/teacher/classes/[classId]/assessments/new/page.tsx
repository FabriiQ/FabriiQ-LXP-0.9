'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { EnhancedAssessmentDialog } from '@/features/assessments/components/creation/EnhancedAssessmentDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function NewAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const classId = params?.classId as string;
  const [dialogOpen, setDialogOpen] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Get class details
  const { isLoading: isLoadingClass } = api.class.getById.useQuery(
    { id: classId },
    { enabled: !!classId }
  );

  // Check if user is a teacher for this class
  const { data: isTeacher, isLoading: isCheckingTeacher, error: teacherCheckError } = api.teacherRole.isClassTeacher.useQuery(
    { classId },
    {
      enabled: !!classId && status === 'authenticated',
      retry: 5, // Increase retries to 5
      retryDelay: 1000, // Wait 1 second between retries
      onError: (error) => {
        console.error('Error checking teacher role:', error);
      }
    }
  );

  // Show loading state
  if (status === 'loading' || isLoadingClass || isCheckingTeacher) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-24 mr-4" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is authorized
  if (!isTeacher || teacherCheckError) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                You do not have permission to create assessments for this class.
              </div>
            </div>
          </div>
        </div>

        {teacherCheckError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {teacherCheckError.message || "There was an error checking your permissions. Please try logging out and back in."}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant="outline"
            asChild
          >
            <Link href={`/teacher/classes/${classId}/assessments`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Link>
          </Button>

          <Button variant="outline" onClick={() => router.push('/api/auth/signout')}>
            Sign Out
          </Button>

          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }



  const handleAssessmentCreated = (assessmentId: string) => {
    setDialogOpen(false);
    router.push(`/teacher/classes/${classId}/assessments/${assessmentId}`);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href={`/teacher/classes/${classId}/assessments`}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          Create New Assessment
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Enhanced Assessment Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Use our enhanced assessment creation dialog with Bloom's Taxonomy integration,
            learning outcomes selection, and rubric-based grading.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Open Assessment Creator
          </Button>
        </CardContent>
      </Card>

      <EnhancedAssessmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            router.push(`/teacher/classes/${classId}/assessments`);
          }
        }}
        onSuccess={handleAssessmentCreated}
        classId={classId}

      />
    </div>
  );
}
