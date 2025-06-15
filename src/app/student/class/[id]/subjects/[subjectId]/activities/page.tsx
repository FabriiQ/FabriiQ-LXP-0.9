'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import Head from 'next/head';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SubjectActivitiesView } from '@/components/student/SubjectActivitiesView';


/**
 * Subject Activities page for a specific subject in a class
 *
 * Features:
 * - Multiple view options (pending, completed, upcoming, chapters, calendar)
 * - Icon-based view switching
 * - Clear page title for location awareness
 * - Consistent layout with other class pages
 * - Direct API calls without view transitions
 */
export default function SubjectActivitiesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string || "";
  const subjectId = params?.subjectId as string || "";

  // Direct API call without using ClassContext
  const {
    data: classData,
    isLoading: isLoadingClass,
    error: classError,
    refetch: refetchClass
  } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  );

  // Fetch subject details
  const {
    data: subjectData,
    isLoading: isLoadingSubject,
    error: subjectError
  } = api.subject.getById.useQuery(
    { id: subjectId },
    {
      enabled: !!subjectId,
      retry: 1
    }
  );

  // Handle back button click
  const handleBack = () => {
    router.push(`/student/class/${classId}/subjects`);
  };

  // Simple loading state
  if (isLoadingClass || isLoadingSubject) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/student/class/${classId}/subjects`)}
            className="h-8 w-8 mr-2"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>

          <div>
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground">
            View and complete your learning activities
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Simple error state
  if (classError || subjectError || !classData || !subjectData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/student/class/${classId}/subjects`)}
            className="h-8 w-8 mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>

          <div>
            <h1 className="text-2xl font-bold">Back to Subjects</h1>
          </div>
        </div>

        <div className="mb-4 p-4 border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>Error Loading Activities</span>
          </div>
          <div className="mt-2">
            {classError ? classError.message : subjectError ? subjectError.message : "Failed to load data"}
          </div>
          <div className="mt-4">
            <Button onClick={() => {
              if (classError) refetchClass();
              if (subjectError) window.location.reload();
            }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const className = classData?.className || 'Class';
  const subjectName = subjectData?.name || 'Subject';

  return (
    <>
      {/* Page title for SEO and browser tab */}
      <Head>
        <title>{`${className} - ${subjectName} Activities`}</title>
      </Head>

      <div className="container mx-auto p-6 space-y-6">
        {/* Simple header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>

          <div>
            <h1 className="text-2xl font-bold">{className}</h1>
            <p className="text-muted-foreground">
              {classData?.courseName} {classData?.termName ? `• ${classData.termName}` : ''}
            </p>
          </div>
        </div>

        {/* Subject activities view with multiple view options */}
        <div className="mt-6">
          <SubjectActivitiesView
            subjectId={subjectId}
            classId={classId}
            subjectName={subjectName}
            onBack={handleBack}
          />
        </div>
      </div>
    </>
  );
}
