'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentGradesList from './StudentGradesList';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { isOnline, registerConnectivityListeners } from '@/utils/offline-storage';
import { toast } from '@/components/ui/feedback/toast';

// Define the grade type
export interface Grade {
  id: string;
  title: string;
  subject: string;
  type: string;
  date: Date;
  score: number;
  totalScore: number;
  grade: string;
  feedback?: string;
  classId: string;
  className: string;
  term?: string;
}

interface StudentGradesListClientProps {
  grades: Grade[];
}

export default function StudentGradesListClient({ grades: initialGrades }: StudentGradesListClientProps) {
  const router = useRouter();
  const [grades] = useState<Grade[]>(initialGrades);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!isOnline());

  // Register connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);

      // Show toast notification
      toast({
        title: "You're back online",
        description: "Refreshing your grades...",
        variant: "default",
      });

      // Refresh the page to get updated data
      router.refresh();
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "You're offline",
        description: "You can still view your grades. They will update when you're back online.",
        variant: "warning",
      });
    };

    const cleanup = registerConnectivityListeners(handleOnline, handleOffline);

    // Initial check
    setIsOffline(!isOnline());

    return cleanup;
  }, [router]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!isOffline) {
      setIsLoading(true);
      router.refresh();

      // Add a small delay to show loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  // Show offline banner if needed
  const offlineBanner = isOffline ? (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            You are currently offline. You can still view your grades.
            They will update when you're back online.
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div>
      {offlineBanner}
      <StudentGradesList
        grades={grades}
        onRefresh={handleRefresh}
        isOffline={isOffline}
      />
    </div>
  );
}
