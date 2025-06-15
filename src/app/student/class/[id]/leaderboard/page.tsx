'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { LaborIllusionLoader } from '@/components/ui/loading/LaborIllusionLoader';
import { StudentClassLeaderboardClient } from './client';

/**
 * Simplified Leaderboard page for a class in the student portal
 *
 * View transitions and complex loading states are disabled,
 * but all leaderboard data and UI components are included
 */
export default function ClassLeaderboardPage() {
  const params = useParams();
  const classId = params?.id as string || "";
  const { data: session } = useSession();
  const currentStudentId = session?.user?.id;

  // Direct API call without using ClassContext
  const {
    data: classData,
    isLoading,
    error,
    refetch
  } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  );

  // Enhanced loading state with educational facts and labor illusion
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">
            View class rankings and track your progress
          </p>
        </div>

        {/* Educational loading fact */}
        <div className="mb-8">
          <EducationalLoadingFact
            isLoading={true}
            autoRotate={true}
            interval={5000}
          />
        </div>

        {/* Labor illusion loader */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Loading Leaderboard</h2>
          <LaborIllusionLoader
            isLoading={true}
            showTimeRemaining={true}
            totalEstimatedTime={8}
            steps={[
              { label: 'Loading class information...', duration: 1.5, weight: 15 },
              { label: 'Fetching student rankings...', duration: 2, weight: 20 },
              { label: 'Calculating performance metrics...', duration: 1.5, weight: 15 },
              { label: 'Preparing leaderboard data...', duration: 2, weight: 20 },
              { label: 'Finding your position...', duration: 1.5, weight: 15 },
              { label: 'Finalizing leaderboard...', duration: 1.5, weight: 15 },
            ]}
          />
        </div>
      </div>
    );
  }

  // Simple error state
  if (error || !classData) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="mb-4 border-red-600 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ? error.message : "Failed to load leaderboard"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Simple header with back button */}
      <div className="flex items-center mb-6">
        <Link
          href="/student/classes"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Classes
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{classData.className}</h1>
          <p className="text-muted-foreground">
            {classData.courseName} {classData.termName ? `• ${classData.termName}` : ''}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          View class rankings and track your progress
        </p>
      </div>

      {/* Enhanced leaderboard with microinteractions and transparency features */}
      <StudentClassLeaderboardClient
        classId={classId}
        className={classData.className}
        studentId={currentStudentId || ''}
        courseId={classData.courseId}
        courseName={classData.courseName}
        // The API doesn't return campusId and campusName directly, so we'll pass undefined
        campusId={undefined}
        campusName={undefined}
      />
    </div>
  );
}
