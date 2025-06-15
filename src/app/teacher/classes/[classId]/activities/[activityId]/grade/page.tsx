'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { ActivityGrading } from '@/components/teacher/activities-new';

export default function ActivityGradingPage() {
  const params = useParams<{ classId: string; activityId: string }>();
  const classId = params?.classId || '';
  const activityId = params?.activityId || '';

  // Validate activityId before making the API call
  const isValidId = activityId && activityId !== 'grade' && activityId.trim() !== '';

  // Fetch activity to check if it exists and is gradable
  const { data: activity, isLoading, error } = api.activity.getById.useQuery({
    id: activityId
  }, {
    // Only enable the query if we have a valid ID
    enabled: isValidId
  });

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

  // Check if activity is gradable
  if (!activity.isGradable) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>This activity is not gradable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ActivityGrading
        activityId={activityId}
        classId={classId}
      />
    </div>
  );
}
