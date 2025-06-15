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

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const activityId = params?.activityId as string;
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: activity, isLoading } = api.class.getActivity.useQuery({
    id: activityId,
    includeGrades: false
  });

  const { data: classData } = api.class.getById.useQuery({
    classId,
  });

  const deleteActivityMutation = api.class.deleteActivity.useMutation({
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
    deleteActivityMutation.mutate(activityId);
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
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${classId}/activities/${activityId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {activity.isGradable && (
            <Button asChild>
              <Link href={`/admin/campus/classes/${classId}/activities/${activityId}/grades`}>
                Manage Grades
              </Link>
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
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{activity.title}</CardTitle>
                <CardDescription>
                  <Badge className="mt-2">{activity.purpose}</Badge>
                  {activity.purpose === 'LEARNING' && activity.learningType && (
                      <span className="ml-2 mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {activity.learningType}
                    </span>
                  )}
                  {activity.purpose === 'ASSESSMENT' && activity.assessmentType && (
                    <span className="ml-2 mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {activity.assessmentType}
                    </span>
                  )}
                  {activity.status === 'ACTIVE' ? (
                    <span className="ml-2 mt-2 inline-flex items-center rounded-full border-transparent bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-semibold">
                      {activity.status}
                    </span>
                  ) : (
                    <span className="ml-2 mt-2 inline-flex items-center rounded-full border-transparent bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
                      {activity.status}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Activity Content</h3>
                <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-wrap">
                  {typeof activity.content === 'string'
                    ? activity.content
                    : JSON.stringify(activity.content, null, 2)}
                </div>
              </div>

              {/* Subject and Topic information */}
              {activity.subjectId && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Subject</h3>
                  <p>{activity.subjectId}</p>
                </div>
              )}

              {activity.topicId && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Topic</h3>
                  <p>{activity.topicId}</p>
                </div>
              )}

              {activity.isGradable && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-1">Max Score</h4>
                    <p>{activity.maxScore}</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-1">Passing Score</h4>
                    <p>{activity.passingScore}</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-1">Weightage</h4>
                    <p>{activity.weightage}%</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-1">Subject</h4>
                  <p>{activity.subjectId || 'Not specified'}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-1">Topic</h4>
                  <p>{activity.topicId || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
