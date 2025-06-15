/**
 * @deprecated This component has been replaced by StandardLeaderboard in src/features/leaderboard/components/StandardLeaderboard.tsx
 * This file is kept for reference only and will be removed in a future update.
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "./LeaderboardTable";
import { LeaderboardPeriod, LeaderboardType } from "@/server/api/types/leaderboard";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { Trophy, Medal, Award, Users, BookOpen, GraduationCap, School } from "lucide-react";

interface UnifiedLeaderboardProps {
  classId?: string;
  subjectId?: string;
  courseId?: string;
  campusId: string;
  className?: string;
  subjectName?: string;
  courseName?: string;
  campusName?: string;
  defaultTab?: LeaderboardType;
  showOnlyClassTab?: boolean;
}

export function UnifiedLeaderboard({
  classId,
  subjectId,
  courseId,
  campusId,
  className,
  subjectName,
  courseName,
  campusName,
  defaultTab = LeaderboardType.CLASS,
  showOnlyClassTab = false,
}: UnifiedLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardType>(
    classId ? LeaderboardType.CLASS :
    subjectId ? LeaderboardType.SUBJECT :
    courseId ? LeaderboardType.COURSE :
    LeaderboardType.OVERALL
  );

  const [classPeriod, setClassPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);
  const [subjectPeriod, setSubjectPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);
  const [coursePeriod, setCoursePeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);
  const [overallPeriod, setOverallPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);

  // Class leaderboard query
  const {
    data: classLeaderboardData,
    isLoading: isLoadingClassLeaderboard
  } = api.leaderboard.getClassLeaderboard.useQuery(
    {
      classId: classId || "",
      period: classPeriod,
      limit: 100
    },
    {
      enabled: !!classId && activeTab === LeaderboardType.CLASS,
      keepPreviousData: true
    }
  );

  // Subject leaderboard query
  const {
    data: subjectLeaderboardData,
    isLoading: isLoadingSubjectLeaderboard
  } = api.leaderboard.getSubjectLeaderboard.useQuery(
    {
      subjectId: subjectId || "",
      period: subjectPeriod,
      limit: 100
    },
    {
      enabled: !!subjectId && activeTab === LeaderboardType.SUBJECT,
      keepPreviousData: true
    }
  );

  // Course leaderboard query
  const {
    data: courseLeaderboardData,
    isLoading: isLoadingCourseLeaderboard
  } = api.leaderboard.getCourseLeaderboard.useQuery(
    {
      courseId: courseId || "",
      period: coursePeriod,
      limit: 100
    },
    {
      enabled: !!courseId && activeTab === LeaderboardType.COURSE,
      keepPreviousData: true
    }
  );

  // Overall leaderboard query
  const {
    data: overallLeaderboardData,
    isLoading: isLoadingOverallLeaderboard
  } = api.leaderboard.getOverallLeaderboard.useQuery(
    {
      campusId,
      period: overallPeriod,
      limit: 100
    },
    {
      enabled: activeTab === LeaderboardType.OVERALL,
      keepPreviousData: true
    }
  );

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as LeaderboardType);
  };

  // Determine which tabs to show based on available data
  const showClassTab = !!classId;
  const showSubjectTab = !!subjectId;
  const showCourseTab = !!courseId;

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          {showClassTab && (
            <TabsTrigger value={LeaderboardType.CLASS} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Class</span>
            </TabsTrigger>
          )}
          {showSubjectTab && (
            <TabsTrigger value={LeaderboardType.SUBJECT} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">Subject</span>
            </TabsTrigger>
          )}
          {showCourseTab && (
            <TabsTrigger value={LeaderboardType.COURSE} className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden md:inline">Course</span>
            </TabsTrigger>
          )}
          {!showOnlyClassTab && (
            <TabsTrigger value={LeaderboardType.OVERALL} className="flex items-center gap-2">
              <School className="h-4 w-4" />
              <span className="hidden md:inline">Campus</span>
            </TabsTrigger>
          )}
        </TabsList>

        {showClassTab && (
          <TabsContent value={LeaderboardType.CLASS} className="mt-6">
            {isLoadingClassLeaderboard && !classLeaderboardData ? (
              <LoadingSpinner />
            ) : (
              <LeaderboardTable
                title={`Class Leaderboard: ${className || classLeaderboardData?.metadata?.className || "Class"}`}
                description="Rankings based on activity and assessment grades"
                leaderboard={classLeaderboardData?.leaderboard || []}
                totalStudents={classLeaderboardData?.totalStudents || 0}
                currentPeriod={classPeriod}
                onPeriodChange={setClassPeriod}
                isLoading={isLoadingClassLeaderboard}
                showPagination={true}
              />
            )}
          </TabsContent>
        )}

        {showSubjectTab && (
          <TabsContent value={LeaderboardType.SUBJECT} className="mt-6">
            {isLoadingSubjectLeaderboard && !subjectLeaderboardData ? (
              <LoadingSpinner />
            ) : (
              <LeaderboardTable
                title={`Subject Leaderboard: ${subjectName || subjectLeaderboardData?.metadata?.subjectName || "Subject"}`}
                description="Rankings based on subject-specific activities and assessments"
                leaderboard={subjectLeaderboardData?.leaderboard || []}
                totalStudents={subjectLeaderboardData?.totalStudents || 0}
                currentPeriod={subjectPeriod}
                onPeriodChange={setSubjectPeriod}
                isLoading={isLoadingSubjectLeaderboard}
                showPagination={true}
              />
            )}
          </TabsContent>
        )}

        {showCourseTab && (
          <TabsContent value={LeaderboardType.COURSE} className="mt-6">
            {isLoadingCourseLeaderboard && !courseLeaderboardData ? (
              <LoadingSpinner />
            ) : (
              <LeaderboardTable
                title={`Course Leaderboard: ${courseName || courseLeaderboardData?.metadata?.courseName || "Course"}`}
                description="Rankings based on course-wide performance"
                leaderboard={courseLeaderboardData?.leaderboard || []}
                totalStudents={courseLeaderboardData?.totalStudents || 0}
                currentPeriod={coursePeriod}
                onPeriodChange={setCoursePeriod}
                isLoading={isLoadingCourseLeaderboard}
                showPagination={true}
              />
            )}
          </TabsContent>
        )}

        {!showOnlyClassTab && (
          <TabsContent value={LeaderboardType.OVERALL} className="mt-6">
            {isLoadingOverallLeaderboard && !overallLeaderboardData ? (
              <LoadingSpinner />
            ) : (
              <LeaderboardTable
                title={`Campus Leaderboard: ${campusName || overallLeaderboardData?.metadata?.campusName || "Campus"}`}
                description="Overall rankings across all classes and courses"
                leaderboard={overallLeaderboardData?.leaderboard || []}
                totalStudents={overallLeaderboardData?.totalStudents || 0}
                currentPeriod={overallPeriod}
                onPeriodChange={setOverallPeriod}
                isLoading={isLoadingOverallLeaderboard}
                showPagination={true}
              />
            )}
          </TabsContent>
        )}
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Students with highest scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const currentData =
                  activeTab === LeaderboardType.CLASS ? classLeaderboardData?.leaderboard :
                  activeTab === LeaderboardType.SUBJECT ? subjectLeaderboardData?.leaderboard :
                  activeTab === LeaderboardType.COURSE ? courseLeaderboardData?.leaderboard :
                  overallLeaderboardData?.leaderboard;

                const isLoading =
                  activeTab === LeaderboardType.CLASS ? isLoadingClassLeaderboard :
                  activeTab === LeaderboardType.SUBJECT ? isLoadingSubjectLeaderboard :
                  activeTab === LeaderboardType.COURSE ? isLoadingCourseLeaderboard :
                  isLoadingOverallLeaderboard;

                if (isLoading) {
                  return <LoadingSpinner />;
                }

                if (!currentData || currentData.length === 0) {
                  return <p className="text-muted-foreground text-center">No data available</p>;
                }

                return currentData.slice(0, 3).map((entry, index) => (
                  <div key={`top-performer-${entry.studentId}-${index}`} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {index === 0 ? (
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="h-6 w-6 text-gray-400" />
                      ) : (
                        <Award className="h-6 w-6 text-amber-700" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{entry.studentName || 'Student'}</div>
                      <div className="text-xs text-muted-foreground">
                        {typeof entry.score === 'number' ? `${entry.score.toFixed(1)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Award className="mr-2 h-5 w-5 text-blue-500" />
              Most Improved
            </CardTitle>
            <CardDescription>Students showing greatest improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const currentData =
                  activeTab === LeaderboardType.CLASS ? classLeaderboardData?.leaderboard :
                  activeTab === LeaderboardType.SUBJECT ? subjectLeaderboardData?.leaderboard :
                  activeTab === LeaderboardType.COURSE ? courseLeaderboardData?.leaderboard :
                  overallLeaderboardData?.leaderboard;

                const isLoading =
                  activeTab === LeaderboardType.CLASS ? isLoadingClassLeaderboard :
                  activeTab === LeaderboardType.SUBJECT ? isLoadingSubjectLeaderboard :
                  activeTab === LeaderboardType.COURSE ? isLoadingCourseLeaderboard :
                  isLoadingOverallLeaderboard;

                if (isLoading) {
                  return <LoadingSpinner />;
                }

                if (!currentData || currentData.length === 0) {
                  return <p className="text-muted-foreground text-center">No data available</p>;
                }

                // Filter students with improvement data and sort by improvement
                const studentsWithImprovement = currentData
                  .filter(entry => entry.improvement !== undefined && entry.previousScore !== undefined)
                  .sort((a, b) => (b.improvement || 0) - (a.improvement || 0))
                  .slice(0, 3);

                if (studentsWithImprovement.length === 0) {
                  return <p className="text-muted-foreground text-center">No improvement data available yet</p>;
                }

                return studentsWithImprovement.map((entry, index) => (
                  <div key={`improved-${entry.studentId}-${index}`} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{entry.studentName || 'Student'}</span>
                      <span className="text-sm text-green-600">
                        +{typeof entry.improvement === 'number' ? entry.improvement.toFixed(1) : '0'}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {typeof entry.previousScore === 'number' ? `${entry.previousScore.toFixed(1)}%` : '0%'} →
                        {typeof entry.score === 'number' ? `${entry.score.toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5 text-green-500" />
              Participation
            </CardTitle>
            <CardDescription>Students with highest activity completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const currentData =
                  activeTab === LeaderboardType.CLASS ? classLeaderboardData?.leaderboard :
                  activeTab === LeaderboardType.SUBJECT ? subjectLeaderboardData?.leaderboard :
                  activeTab === LeaderboardType.COURSE ? courseLeaderboardData?.leaderboard :
                  overallLeaderboardData?.leaderboard;

                const isLoading =
                  activeTab === LeaderboardType.CLASS ? isLoadingClassLeaderboard :
                  activeTab === LeaderboardType.SUBJECT ? isLoadingSubjectLeaderboard :
                  activeTab === LeaderboardType.COURSE ? isLoadingCourseLeaderboard :
                  isLoadingOverallLeaderboard;

                if (isLoading) {
                  return <LoadingSpinner />;
                }

                if (!currentData || currentData.length === 0) {
                  return <p className="text-muted-foreground text-center">No data available</p>;
                }

                // Sort by completion rate
                const sortedByCompletion = [...currentData]
                  .sort((a, b) => b.completionRate - a.completionRate)
                  .slice(0, 3);

                return sortedByCompletion.map((entry, index) => (
                  <div key={`completion-${entry.studentId}-${index}`} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{entry.studentName || 'Student'}</span>
                      <span className="text-sm">
                        {typeof entry.completionRate === 'number' ? `${entry.completionRate.toFixed(0)}%` : '0%'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {entry.completedActivities || 0} / {entry.totalActivities || 0} activities
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
