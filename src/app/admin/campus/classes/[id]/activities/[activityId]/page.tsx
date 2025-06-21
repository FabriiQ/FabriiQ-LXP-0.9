'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/core/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
// Import SVG icons directly
import { ChevronLeft, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { Badge } from '@/components/ui/data-display/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Import the new ActivityViewer from features/activities
const DynamicActivityViewer = dynamic(
  () => import('@/components/teacher/activities-new/ActivityViewer').then(mod => ({ default: mod.ActivityViewer })),
  {
    loading: () => <div className="animate-pulse p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">Loading activity...</div>,
    ssr: false
  }
);

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const activityId = params?.activityId as string;
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: activity, isLoading } = api.activity.getById.useQuery({
    id: activityId,
  });

  const { data: classData } = api.class.getById.useQuery({
    classId,
  });

  const deleteActivityMutation = api.activity.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Activity deleted successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/activities`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete activity: ${error.message}`,
        variant: 'error',
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    setIsDeleting(true);
    deleteActivityMutation.mutate({ id: activityId });
  };

  const handleEdit = () => {
    router.push(`/admin/campus/classes/${classId}/activities/${activityId}/edit`);
  };

  const handleGrade = () => {
    router.push(`/admin/campus/classes/${classId}/activities/${activityId}/grades`);
  };

  const handleAnalytics = () => {
    // Navigate to analytics page when available
    toast({
      title: 'Coming Soon',
      description: 'Activity analytics will be available soon',
      variant: 'info',
    });
  };

  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading activity details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Activities', href: `/admin/campus/classes/${classId}/activities` },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (!activity) {
    return (
      <PageLayout
        title="Activity Not Found"
        description="The activity you're looking for does not exist"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Activities', href: `/admin/campus/classes/${classId}/activities` },
          { label: 'Not Found', href: '#' },
        ]}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Activity Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The activity you are looking for does not exist or has been deleted.
              </p>
              <Button asChild>
                <Link href={`/admin/campus/classes/${classId}/activities`}>Back to Activities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={activity.title}
      description="Activity Details"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Activities', href: `/admin/campus/classes/${classId}/activities` },
        { label: activity.title, href: '#' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${classId}/activities`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Activities
            </Link>
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {activity.isGradable && (
            <Button onClick={handleGrade}>
              Manage Grades
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this
                  activity and remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
    >
      {/* Use the new ActivityViewer component */}
      <DynamicActivityViewer
        activity={activity.content}
        classId={classId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGrade={handleGrade}
        onAnalytics={handleAnalytics}
      />
    </PageLayout>
  );
}
