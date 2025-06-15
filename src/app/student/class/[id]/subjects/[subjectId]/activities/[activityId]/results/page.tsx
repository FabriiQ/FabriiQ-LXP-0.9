
'use client';

import { useParams } from 'next/navigation';
import { useClass } from '@/contexts/class-context';
import Head from 'next/head';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ClassContextHeader } from '@/components/student/ClassContextHeader';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { ActivityResultsView } from '@/components/student/ActivityResultsView';

/**
 * Activity Results page for a specific activity in a subject
 *
 * Features:
 * - Displays activity results with score, grade, and feedback
 * - Back navigation to subject activities
 * - Clear page title for location awareness
 * - Consistent layout with other class pages
 * - Uses ClassContext for data
 */
export default function ActivityResultsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string || "";
  const subjectId = params?.subjectId as string || "";
  const activityId = params?.activityId as string || "";
  const { className, error, errorMessage, retry, data } = useClass();

  // Find subject info from class data
  const subject = data?.subjects?.find((s: any) => s.id === subjectId);
  const subjectName = subject?.name || 'Subject';

  // Handle back button click
  const handleBack = () => {
    router.push(`/student/class/${classId}/subjects/${subjectId}/activities`);
  };

  // Fetch activity details directly
  const { data: activity, isLoading: activityLoading, error: activityError } = api.activity.getById.useQuery(
    { id: activityId },
    { enabled: !!activityId }
  );

  return (
    <>
      {/* Page title for SEO and browser tab */}
      <Head>
        <title>{`${className || 'Class'} - Activity Results`}</title>
      </Head>

      <div className="container mx-auto p-6 space-y-6">
        {/* Class context header with breadcrumbs */}
        <ClassContextHeader />

        {/* Error state with empathetic messaging */}
        {error && (
          <div className="my-4">
            <Alert className="border-destructive/50 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage || "We couldn't load this activity. Please try again."}
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retry}
                  >
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Activity loading state */}
        {!error && activityLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Activity error state */}
        {!error && activityError && (
          <div className="my-4">
            <Alert className="border-destructive/50 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                We couldn't load the activity details. Please try again later.
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                  >
                    Back to Activities
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Activity results */}
        {!error && !activityLoading && !activityError && activity && (
          <ActivityResultsView
            activityId={activityId}
            classId={classId}
            subjectId={subjectId}
            onBack={handleBack}
            activity={activity}
          />
        )}
      </div>
    </>
  );
}
