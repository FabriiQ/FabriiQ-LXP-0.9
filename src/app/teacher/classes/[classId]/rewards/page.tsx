'use client';

import { useParams } from 'next/navigation';
import { ClassRewardsPanelOptimized } from '@/components/teacher/rewards/ClassRewardsPanelOptimized';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function ClassRewardsPage() {
  const params = useParams();

  // Handle null params case
  if (!params) {
    return notFound();
  }

  const classId = params.classId as string;

  // Fetch class details using the existing API with enhanced caching
  const { data: classData, isLoading: isLoadingClass, error: classError } =
    api.class.getById.useQuery({ classId }, {
      onError: (error) => {
        console.error("Error fetching class details:", error);
      },
      staleTime: 30 * 60 * 1000, // 30 minutes - much longer cache time
      refetchOnWindowFocus: false, // Don't refetch on window focus
    });

  if (isLoadingClass) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] mt-8" />
      </div>
    );
  }

  if (classError || !classData) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {classError?.message || 'Failed to load class data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <ClassRewardsPanelOptimized
        classId={classId}
        className={classData?.name || 'Class'}
      />
    </div>
  );
}
