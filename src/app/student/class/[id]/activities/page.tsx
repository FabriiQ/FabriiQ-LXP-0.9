'use client';

import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { Loader2, AlertCircle, BookOpen, ChevronLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { LaborIllusionLoader } from '@/components/ui/loading/LaborIllusionLoader';

/**
 * Simplified Activities page for a class in the student portal
 *
 * View transitions and complex loading states are disabled,
 * but all subjects data and UI components are included
 */
export default function ClassActivitiesPage() {
  const params = useParams();
  const classId = params?.id as string || "";

  // Direct API call without using ClassContext
  const {
    data: classData,
    isLoading: isClassLoading,
    error: classError,
    refetch: refetchClass
  } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  );

  // Fetch activities for the class
  const {
    data: activities,
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = api.activity.listByClass.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  );

  const isLoading = isClassLoading || isActivitiesLoading;
  const error = classError || activitiesError;

  // Enhanced loading state with educational facts and labor illusion
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-muted-foreground">
            Select a subject to view and complete activities
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
          <h2 className="text-xl font-semibold mb-4">Loading Your Subjects</h2>
          <LaborIllusionLoader
            isLoading={true}
            showTimeRemaining={true}
            totalEstimatedTime={7}
            steps={[
              { label: 'Loading subject information...', duration: 1.5, weight: 15 },
              { label: 'Fetching activity counts...', duration: 1.5, weight: 15 },
              { label: 'Calculating progress data...', duration: 2, weight: 25 },
              { label: 'Preparing subject materials...', duration: 1.5, weight: 15 },
              { label: 'Checking for new activities...', duration: 1.5, weight: 15 },
              { label: 'Finalizing subject data...', duration: 1, weight: 15 },
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
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ? error.message : "Failed to load subjects"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => {
          refetchClass();
          refetchActivities();
        }}>Try Again</Button>
      </div>
    );
  }

  // Group activities by subject
  const subjectMap = new Map();

  // Initialize subjects from class data
  if (classData.subjects) {
    classData.subjects.forEach(subject => {
      subjectMap.set(subject.id, {
        ...subject,
        totalActivities: 0,
        completedActivities: 0,
        pendingActivities: 0,
        inProgressActivities: 0,
        upcomingActivities: 0,
        completionPercentage: 0,
        hasUrgentDeadlines: false,
        nextDeadline: null
      });
    });
  }

  // Count activities by subject
  if (activities) {
    activities.forEach(activity => {
      if (!activity.subject) return;

      const subjectId = activity.subject.id;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          id: subjectId,
          name: activity.subject.name,
          code: activity.subject.code,
          totalActivities: 0,
          completedActivities: 0,
          pendingActivities: 0,
          inProgressActivities: 0,
          upcomingActivities: 0,
          completionPercentage: 0,
          hasUrgentDeadlines: false,
          nextDeadline: null
        });
      }

      const stats = subjectMap.get(subjectId);
      stats.totalActivities++;

      // Count by status
      if (activity.status === 'completed') {
        stats.completedActivities++;
      } else if (activity.status === 'in-progress') {
        stats.inProgressActivities++;
      } else if (activity.status === 'upcoming' || activity.status === 'scheduled') {
        stats.upcomingActivities++;
      } else {
        stats.pendingActivities++;
      }

      // Check for urgent deadlines
      if (activity.dueDate) {
        const dueDate = new Date(activity.dueDate);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3 && daysDiff >= 0) {
          stats.hasUrgentDeadlines = true;
        }

        // Track next deadline
        if (!stats.nextDeadline || dueDate < new Date(stats.nextDeadline)) {
          stats.nextDeadline = activity.dueDate;
        }
      }
    });
  }

  // Calculate completion percentage for each subject
  subjectMap.forEach(stats => {
    if (stats.totalActivities > 0) {
      stats.completionPercentage = Math.round((stats.completedActivities / stats.totalActivities) * 100);
    }
  });

  const subjects = Array.from(subjectMap.values());

  // If no subjects are available, show empty state
  if (subjects.length === 0) {
    return (
      <div className="container mx-auto p-6">
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

        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No subjects available</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Your class doesn't have any subjects assigned yet. Check back soon!
          </p>
        </div>
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
        <h1 className="text-3xl font-bold">Subjects</h1>
        <p className="text-muted-foreground">
          Select a subject to view and complete activities
        </p>
      </div>

      {/* Simplified subjects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white dark:bg-gray-800 border rounded-lg shadow overflow-hidden hover:shadow-md transition-all duration-300"
          >
            {/* Subject color accent */}
            <div className="h-2 bg-primary" />

            <div className="p-5">
              <h3 className="font-medium text-lg">{subject.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {subject.code || 'No code'}
              </p>

              {/* Progress section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {subject.completionPercentage}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${subject.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Activity stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-lg font-medium">{subject.completedActivities}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>

                <div className="bg-muted/50 rounded p-2">
                  <div className="text-lg font-medium">{subject.pendingActivities}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>

                <div className="bg-muted/50 rounded p-2">
                  <div className="text-lg font-medium">{subject.upcomingActivities}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
              </div>

              {/* Action button */}
              <Button
                className="w-full"
                variant="outline"
                asChild
              >
                <Link href={`/student/class/${classId}/subjects/${subject.id}/activities`}>
                  {subject.inProgressActivities > 0 ? 'Continue Learning' : 'View Activities'}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
