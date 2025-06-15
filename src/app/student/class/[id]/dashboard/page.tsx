'use client';

import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { AlertCircle, GraduationCap, Calendar, BookOpen, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy } from '@/components/ui/icons/reward-icons';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { LaborIllusionLoader } from '@/components/ui/loading/LaborIllusionLoader';
import { RecentAchievements } from '@/components/rewards/RecentAchievements';
import { LearningTimeInvestment } from '@/components/student/LearningTimeInvestment';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SystemStatus } from '@prisma/client';

/**
 * Full Dashboard page for a specific class in the student portal
 *
 * View transitions and complex loading states are disabled,
 * but all dashboard data and UI components are included
 */
export default function ClassDashboardPage() {
  const params = useParams();
  const classId = params?.id as string || "";
  const { data: session } = useSession();
  const studentId = session?.user?.id || "";

  // Define type for class data
  type ClassData = {
    className?: string;
    courseName?: string;
    termName?: string;
    averageGrade?: number;
    leaderboardPosition?: number;
    points?: number;
    level?: number;
    attendance?: {
      present: number;
      total: number;
    };
    achievements?: Array<{
      id?: string;
      title?: string;
      description?: string;
    }>;
  };

  // Direct API call without using ClassContext
  const {
    data: classData,
    isLoading: isLoadingClass,
    error: classError,
    refetch: refetchClass
  } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  ) as { data: ClassData | undefined, isLoading: boolean, error: any, refetch: () => void };

  // Fetch class activities
  const {
    data: activities,
    isLoading: isLoadingActivities,
    error: activitiesError
  } = api.student.getClassActivities.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  );

  // Enhanced loading state with educational facts and labor illusion
  if (isLoadingClass || isLoadingActivities) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            View your progress and activities
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
          <h2 className="text-xl font-semibold mb-4">Loading Your Dashboard</h2>
          <LaborIllusionLoader
            isLoading={true}
            showTimeRemaining={true}
            totalEstimatedTime={8}
            steps={[
              { label: 'Loading class information...', duration: 1.5, weight: 15 },
              { label: 'Fetching your progress data...', duration: 2, weight: 20 },
              { label: 'Calculating your achievements...', duration: 1.5, weight: 15 },
              { label: 'Preparing activity recommendations...', duration: 2, weight: 20 },
              { label: 'Updating leaderboard position...', duration: 1.5, weight: 15 },
              { label: 'Finalizing your dashboard...', duration: 1.5, weight: 15 },
            ]}
          />
        </div>
      </div>
    );
  }

  // Simple error state
  if (classError || !classData) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4 p-4 border border-red-200 rounded bg-red-50 text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>Error</span>
          </div>
          <div className="mt-2">
            {classError ? classError.message : "Failed to load class data"}
          </div>
        </div>
        <Button onClick={() => refetchClass()}>Try Again</Button>
      </div>
    );
  }

  // Handle activities error separately - we can still show the dashboard
  const activitiesErrorMessage = activitiesError ? (
    <div className="mb-4 p-4 border border-red-200 rounded bg-red-50 text-red-800">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle className="h-4 w-4" />
        <span>Error Loading Activities</span>
      </div>
      <div className="mt-2">
        {activitiesError.message}
      </div>
    </div>
  ) : null;

  // Get color based on value (color psychology)
  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate attendance percentage with safety checks
  const attendancePercentage = classData.attendance && classData.attendance.total > 0
    ? Math.round((classData.attendance.present / classData.attendance.total) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Class header with basic info */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          View your progress and activities
        </p>
      </div>

      {/* Class header with basic info */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{classData?.className || 'No Class Name'}</h1>
        <p className="text-muted-foreground">
          {classData?.courseName || 'No Course Name'} {classData?.termName ? `• ${classData.termName}` : ''}
        </p>
      </div>

      {/* Primary metrics - most important information first */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grade Card */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-primary" />
              <span>Average Grade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeof classData?.averageGrade === 'number' ? (
              <>
                <div className="text-3xl font-bold mb-1">
                  {classData.averageGrade}%
                </div>
                <Progress
                  value={classData.averageGrade}
                  className="h-2 mb-2"
                  indicatorClassName={getProgressColor(classData.averageGrade)}
                />
                <div className="text-sm text-muted-foreground flex items-center">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span>Leaderboard Position: #{classData?.leaderboardPosition || 'N/A'}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="text-muted-foreground text-sm">No grades available</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-primary" />
              <span>Points & Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeof classData?.points === 'number' ? (
              <>
                <div className="text-3xl font-bold mb-1">{classData.points}</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Level {classData?.level || 1}</span>
                  <span className="text-sm">
                    {`${classData.points % 100}/100 to next level`}
                  </span>
                </div>
                <Progress
                  value={classData.points % 100}
                  className="h-2"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="text-muted-foreground text-sm">No points earned yet</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Card */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span>Attendance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{attendancePercentage || 0}%</div>
            <Progress
              value={attendancePercentage || 0}
              className="h-2 mb-2"
              indicatorClassName={getProgressColor(attendancePercentage || 0)}
            />
            <div className="text-sm text-muted-foreground">
              Present: {classData?.attendance?.present || 0}/{classData?.attendance?.total || 0} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-primary" />
          Continue Learning
        </h2>

        {activitiesErrorMessage}

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                <>
                  {activities.slice(0, 2).map((activity) => (
                    <div
                      key={activity.id}
                      className="border rounded-md p-4 transition-all duration-300 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{activity.title}</h3>
                          <p className="text-sm text-muted-foreground">{activity.learningType || 'Activity'}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.status === SystemStatus.ACTIVE ? 'In Progress' : 'Completed'}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{activity.status === SystemStatus.ACTIVE ? '0' : '100'}%</span>
                        </div>
                        <Progress value={activity.status === SystemStatus.ACTIVE ? 0 : 100} className="h-1" />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2">
                    View All Activities
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium">No Activities Available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There are no activities available for this class yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements Section */}
      {studentId && (
        <RecentAchievements
          studentId={studentId}
          classId={classId}
          limit={3}
          showViewAll={true}
          animated={true}
          title="Recent Achievements"
        />
      )}

      {/* Time Investment Tracking */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Your Learning Investment
          </h2>
          <Link href={`/student/class/${classId}/learning-time`}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>

        <LearningTimeInvestment classId={classId} />
      </div>
    </div>
  );
}
