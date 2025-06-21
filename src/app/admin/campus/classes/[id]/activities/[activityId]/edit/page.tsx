'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import dynamic from 'next/dynamic';

// Import the new ActivityEditor from features/activities
const DynamicActivityEditor = dynamic(
  () => import('@/components/teacher/activities-new/ActivityEditor').then(mod => ({ default: mod.ActivityEditor })),
  {
    loading: () => <div className="animate-pulse p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">Loading activity editor...</div>,
    ssr: false
  }
);

export default function EditActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const activityId = params?.activityId as string;

  const { data: activity, isLoading } = api.activity.getById.useQuery({
    id: activityId
  });

  const { data: classData } = api.class.getById.useQuery({
    classId,
  });

  const updateActivity = api.activity.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Activity updated successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/activities/${activityId}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update activity: ${error.message}`,
        variant: 'error',
      });
    },
  });

  const handleSave = (updatedActivity: any) => {
    updateActivity.mutate({
      id: activityId,
      ...updatedActivity,
    });
  };

  const handleCancel = () => {
    router.push(`/admin/campus/classes/${classId}/activities/${activityId}`);
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
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Activity Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The activity you are looking for does not exist or has been deleted.
          </p>
          <Button asChild>
            <Link href={`/admin/campus/classes/${classId}/activities`}>Back to Activities</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Edit Activity: ${activity.title}`}
      description="Edit activity details"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Activities', href: `/admin/campus/classes/${classId}/activities` },
        { label: activity.title, href: `/admin/campus/classes/${classId}/activities/${activityId}` },
        { label: 'Edit', href: '#' },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/admin/campus/classes/${classId}/activities/${activityId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Activity
          </Link>
        </Button>
      }
    >
      {/* Use the new ActivityEditor component */}
      <DynamicActivityEditor
        activity={activity.content}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </PageLayout>
  );
}
