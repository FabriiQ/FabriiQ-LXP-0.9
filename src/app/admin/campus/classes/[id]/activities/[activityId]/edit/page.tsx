'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Switch } from '@/components/ui/forms/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { SystemStatus } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Update the status type to use SystemStatus enum
const updateActivitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isGradable: z.boolean(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED']).default('ACTIVE'),
});

type FormData = z.infer<typeof updateActivitySchema>;

export default function EditActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const activityId = params?.activityId as string;
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(updateActivitySchema),
  });
  
  const { data: activity, isLoading } = api.class.getActivity.useQuery({
    id: activityId
  });
  
  const { data: classData } = api.class.getById.useQuery({
    classId,
  });

  const updateActivity = api.class.updateActivity.useMutation({
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

  useEffect(() => {
    if (activity && !isDirty) {
      reset({
        title: activity.title || '',
        content: activity.content?.toString() || '',
        isGradable: activity.isGradable,
        maxScore: activity.maxScore || undefined,
        passingScore: activity.passingScore || undefined,
        weightage: activity.weightage || undefined,
        status: activity.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DELETED',
      });
    }
  }, [activity, reset, isDirty]);

  const onSubmit = async (data: FormData) => {
    updateActivity.mutate({
      id: activityId,
      title: data.title,
      content: data.content,
      status: data.status,
      isGradable: data.isGradable,
      maxScore: data.maxScore,
      passingScore: data.passingScore,
      weightage: data.weightage,
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
      <Card>
        <CardHeader>
          <CardTitle>Edit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input {...register('title')} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea {...register('content')} rows={5} />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DELETED')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {['ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED'].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('isGradable')}
                onCheckedChange={(checked) => setValue('isGradable', checked)}
              />
              <label className="text-sm font-medium">Is Gradable</label>
            </div>

            {watch('isGradable') && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Score</label>
                  <Input
                    type="number"
                    {...register('maxScore', { valueAsNumber: true })}
                  />
                  {errors.maxScore && (
                    <p className="text-sm text-destructive">{errors.maxScore.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Passing Score</label>
                  <Input
                    type="number"
                    {...register('passingScore', { valueAsNumber: true })}
                  />
                  {errors.passingScore && (
                    <p className="text-sm text-destructive">
                      {errors.passingScore.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Weightage (%)</label>
                  <Input
                    type="number"
                    {...register('weightage', { valueAsNumber: true })}
                  />
                  {errors.weightage && (
                    <p className="text-sm text-destructive">{errors.weightage.message}</p>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Activity'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 
