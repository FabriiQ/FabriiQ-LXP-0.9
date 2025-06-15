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
import { DirectActivityViewer } from '@/components/activities/DirectActivityViewer';
import { toast } from '@/components/ui/feedback/toast';

/**
 * Activity Detail page for a specific activity in a subject
 *
 * Features:
 * - Activity viewer with interactive elements
 * - Back navigation to subject activities
 * - Clear page title for location awareness
 * - Consistent layout with other class pages
 * - Uses ClassContext for data
 */
export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string || "";
  const subjectId = params?.subjectId as string || "";
  const activityId = params?.activityId as string || "";
  const { className, error, errorMessage, retry, data } = useClass();

  // Find subject info from class data
  const subject = data?.subjects?.find((s: any) => s.id === subjectId);
  const subjectName = subject?.name || 'Subject';

  // Validate activityId before making the API call
  const isValidId = activityId && activityId !== 'grade' && activityId !== 'edit' && activityId.trim() !== '';

  // Fetch activity data
  const { data: activity, isLoading: activityLoading } = api.activity.getById.useQuery(
    { id: activityId },
    {
      enabled: !!activityId && isValidId,
      // Fix TypeScript error by ensuring enabled is a boolean
      refetchOnWindowFocus: false
    }
  );

  // Handle back button click
  const handleBack = () => {
    router.push(`/student/class/${classId}/subjects/${subjectId}/activities`);
  };

  return (
    <>
      {/* Page title for SEO and browser tab */}
      <Head>
        <title>{`${className || 'Class'} - Activity`}</title>
      </Head>

      <div className="container mx-auto p-6 space-y-6">
        {/* Class context header with breadcrumbs */}
        <ClassContextHeader />

        {/* Back button and activity title */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to activities</span>
          </Button>

          <div>
            <h2 className="text-xl font-bold">Activity Viewer</h2>
            <p className="text-sm text-muted-foreground">
              {subjectName}
            </p>
          </div>
        </div>

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

        {/* Invalid activity ID */}
        {!isValidId && (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Invalid activity ID. Please use the correct URL format.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="mt-4"
            >
              Back to Activities
            </Button>
          </div>
        )}

        {/* Activity viewer */}
        {isValidId && !error && !activityLoading && activity ? (
          <div className="space-y-4">
            <DirectActivityViewer
              activity={activity}
              mode="student"
              disableAnalytics={false}
              institutionId={'default-institution'}
              submitButtonProps={{
                className: "w-full mt-4",
                priority: 10
              }}
              onComplete={(data) => {
                console.log('Activity completed:', data);
                // Show success message
                toast({
                  title: "Activity completed",
                  description: "Your results have been saved.",
                  variant: "success",
                });
                // Redirect back to activities list after a short delay
                setTimeout(() => {
                  router.push(`/student/class/${classId}/subjects/${subjectId}/activities`);
                }, 2000);
              }}
            />
          </div>
        ) : isValidId && !error && activityLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading activity...</p>
          </div>
        ) : isValidId && !error ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Activity not found</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="mt-4"
            >
              Back to Activities
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}
