'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { ActivityViewer, ActivityEditor } from '@/components/teacher/activities-new';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ActivityDetailPage() {
  const params = useParams<{ classId: string; activityId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const classId = params?.classId || '';
  const activityId = params?.activityId || '';

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Validate activityId before making the API call
  const isValidId = activityId && activityId !== 'grade' && activityId !== 'edit' && activityId.trim() !== '';

  // Fetch activity
  const { data: activity, isLoading, error, refetch } = api.activity.getById.useQuery({
    id: activityId
  }, {
    // Only enable the query if we have a valid ID
    enabled: isValidId
  });

  // Update activity mutation
  const updateActivity = api.activity.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity updated successfully",
      });
      setMode('view');
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update activity: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Delete activity mutation
  const deleteActivity = api.activity.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
      router.push(`/teacher/classes/${classId}/activities-new`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete activity: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Handle edit
  const handleEdit = () => {
    setMode('edit');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setMode('view');
  };

  // Handle save
  const handleSave = (updatedActivity: any) => {
    updateActivity.mutate({
      id: activityId,
      title: updatedActivity.title,
      content: updatedActivity,
      isGradable: updatedActivity.isGradable,
    });
  };

  // Handle delete
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    deleteActivity.mutate({ id: activityId });
  };

  // Handle grade
  const handleGrade = () => {
    router.push(`/teacher/classes/${classId}/activities-new/${activityId}/grade`);
  };

  // Handle analytics
  const handleAnalytics = () => {
    // Navigate to analytics page (not implemented yet)
    toast({
      title: "Not implemented",
      description: "Analytics functionality is not yet implemented",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Error state
  if (!isValidId) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Invalid activity ID. Please use the correct URL format.</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to load activity: {error?.message || 'Activity not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {mode === 'view' ? (
        <ActivityViewer
          activity={activity.content}
          classId={classId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGrade={handleGrade}
          onAnalytics={handleAnalytics}
        />
      ) : (
        <ActivityEditor
          activity={activity.content}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this activity. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
