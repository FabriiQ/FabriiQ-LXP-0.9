'use client';

import React, { useState, useEffect } from 'react';
import {
  StandardLeaderboard,
  LeaderboardHistoryViewer,
  PointsBreakdownComponent,
  RankingAlgorithmDocumentation,
  ScoringSystemVisualizer
} from '@/features/leaderboard/components/client-components';
import { LeaderboardEntityType, TimeGranularity } from '@/features/leaderboard/types/standard-leaderboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LeaderboardPersonalBestIndicator } from '@/features/leaderboard/components/LeaderboardPersonalBestIndicator';
import { useLeaderboardAnimations } from '@/features/leaderboard/hooks/useLeaderboardAnimations';
import { Trophy, Medal, Star } from '@/components/ui/icons/reward-icons';
import { Info, BarChart, History, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { api } from '@/utils/api';

interface StudentClassLeaderboardClientProps {
  classId: string;
  className: string;
  studentId: string;
  courseId?: string;
  courseName?: string;
  campusId?: string;
  campusName?: string;
}

export function StudentClassLeaderboardClient({
  classId,
  className,
  studentId,
  courseId,
  courseName,
  campusId,
  campusName
}: StudentClassLeaderboardClientProps) {
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>(TimeGranularity.ALL_TIME);
  const [activeTab, setActiveTab] = useState<string>('performance');
  const [showTransparencyFeatures, setShowTransparencyFeatures] = useState<boolean>(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<string>('class');

  // Check if we're on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Check for reduced motion preference
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Initialize leaderboard animations
  const { triggerHapticFeedback } = useLeaderboardAnimations({
    enableHapticFeedback: true,
    reducedMotion: prefersReducedMotion
  });

  // Get class details to get the courseId
  const { data: classData } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Fetch subject data for this class using the courseId
  const { data: subjectsData } = api.subject.list.useQuery(
    {
      courseId: classData?.courseId,
      take: 100
    },
    {
      enabled: !!classData?.courseId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Extract subjects array from the response
  const subjects = subjectsData?.items || [];

  // Fetch student personal bests from API
  const {
    data: personalBestsData,
    isLoading: isLoadingPersonalBests
  } = api.personalBest.getStudentPersonalBests.useQuery({
    studentId,
    classId
  }, {
    enabled: !!studentId && !!classId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform personal bests data into a more usable format
  const personalBests = React.useMemo(() => {
    if (!personalBestsData || personalBestsData.length === 0) {
      return {};
    }

    const result: Record<string, { value: any, date: Date }> = {};

    personalBestsData.forEach(pb => {
      result[pb.type] = {
        value: pb.value,
        date: new Date(pb.date)
      };
    });

    return result;
  }, [personalBestsData]);

  // Fetch student position in leaderboard
  const {
    data: studentPosition,
    isLoading: isLoadingPosition,
    refetch: refetchStudentPosition
  } = api.unifiedLeaderboard.getStudentPosition.useQuery({
    type: LeaderboardEntityType.CLASS,
    referenceId: classId,
    studentId,
    timeGranularity: timeGranularity
  }, {
    enabled: !!studentId && !!classId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refetch student position when time granularity changes
  useEffect(() => {
    if (timeGranularity) {
      refetchStudentPosition();
    }
  }, [timeGranularity, refetchStudentPosition]);

  // Create milestones based on student position
  const milestones = React.useMemo(() => {
    const defaultMilestones = [
      {
        id: 'rank-top-10',
        title: 'Reach Top 10',
        description: 'Achieve a rank in the top 10 of the leaderboard',
        type: 'rank',
        targetValue: 10,
        progress: studentPosition?.rank && studentPosition.rank <= 10 ? 100 :
                 studentPosition?.rank ? Math.max(0, 100 - ((studentPosition.rank - 10) * 5)) : 0,
        icon: <Trophy className="h-4 w-4 text-yellow-500" />,
        color: '#FFD700',
        rewardPoints: 100
      },
      {
        id: 'points-1000',
        title: 'Score 1,000 Points',
        description: 'Earn a total of 1,000 points',
        type: 'points',
        targetValue: 1000,
        progress: studentPosition?.rewardPoints ? Math.min(100, (studentPosition.rewardPoints / 1000) * 100) : 0,
        icon: <Star className="h-4 w-4 text-green-500" />,
        color: '#4CAF50',
        rewardPoints: 50
      }
    ];

    return defaultMilestones;
  }, [studentPosition]);

  // Loading state for goals/milestones
  const isLoadingGoals = isLoadingPosition;

  // Trigger haptic feedback when tab changes
  useEffect(() => {
    if (activeTab !== 'performance') {
      triggerHapticFeedback('light');
    }
  }, [activeTab, triggerHapticFeedback]);

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 w-full">
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <Info className="h-4 w-4 text-blue-500" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6 mt-2">
          {/* Personal stats and milestones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  Your Performance
                </CardTitle>
                <CardDescription>
                  Track your progress and achievements in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingPersonalBests ? (
                    <div className="animate-pulse space-y-2 mb-4">
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                      <div className="h-8 bg-muted rounded w-1/4"></div>
                    </div>
                  ) : Object.entries(personalBests).length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(personalBests).map(([type, value]) => (
                        <LeaderboardPersonalBestIndicator
                          key={type}
                          personalBests={[type as any]}
                          isNewBest={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-4">
                      Complete activities to set personal bests
                    </div>
                  )}

                  {/* Display milestones */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Milestones</h3>
                    {isLoadingGoals ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    ) : milestones.length > 0 ? (
                      <div className="space-y-3">
                        {milestones.map((milestone) => (
                          <div key={milestone.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full" style={{ backgroundColor: `${milestone.color}20` }}>
                                  {milestone.icon}
                                </div>
                                <span className="text-sm font-medium">{milestone.title}</span>
                              </div>
                              <span className="text-xs font-medium">{Math.round(milestone.progress)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${milestone.progress}%`,
                                  backgroundColor: milestone.color
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">{milestone.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No milestones available
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Medal className="h-5 w-5 text-blue-500 mr-2" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Your badges and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Fetch achievements from the leaderboard data */}
                  {isLoadingPosition ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  ) : studentPosition?.achievements && studentPosition.achievements > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Medal className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">{studentPosition.achievements} achievements earned</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Keep up the good work to earn more achievements!
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24 text-muted-foreground">
                      Complete activities to earn achievements
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Your Position Card */}
          {studentPosition && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle>Your Position</CardTitle>
                <CardDescription>
                  Your current ranking in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Rank and position */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                        <span className="text-3xl font-bold">{studentPosition.rank}</span>
                        <span className="text-xs text-muted-foreground">Rank</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">Change:</span>
                          <span className={`text-xs ${
                            studentPosition.rankChange > 0 ? "text-green-500" :
                            studentPosition.rankChange < 0 ? "text-red-500" : "text-gray-400"
                          }`}>
                            {studentPosition.rankChange > 0 ? "+" : ""}
                            {studentPosition.rankChange}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">Points:</span>
                          <span>{studentPosition.rewardPoints}</span>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">Academic:</span>
                          <span>{studentPosition.academicScore?.toFixed(1) || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Distance to next rank */}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-2">Next Goal</h4>
                    <div className="space-y-2">
                      {studentPosition.distanceToNextRank ? (
                        <div className="text-sm">
                          <span className="font-medium">{studentPosition.distanceToNextRank}</span> points to next rank
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          You're at the top of the leaderboard!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard tabs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Leaderboards</CardTitle>
              <CardDescription>
                View rankings by class and subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeLeaderboardTab} onValueChange={setActiveLeaderboardTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="class">Class</TabsTrigger>
                  {subjects.map(subject => (
                    <TabsTrigger key={subject.id} value={subject.id}>
                      {subject.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Class leaderboard tab */}
                <TabsContent value="class">
                  <StandardLeaderboard
                    entityType={LeaderboardEntityType.CLASS}
                    entityId={classId}
                    title={`Class Leaderboard: ${className}`}
                    description="Student rankings and performance metrics"
                    currentStudentId={studentId}
                    showTimeGranularitySelector={true}
                    defaultTimeGranularity={timeGranularity}
                    showRankChange={true}
                    showAcademicScore={true}
                    showRewardPoints={true}
                    showLevel={true}
                    showAchievements={true}
                    limit={50}
                    className={cn("border-primary/20")}
                    metadata={{
                      courseId,
                      courseName,
                      campusId,
                      campusName
                    }}
                    // Enable all microinteractions
                    enableAnimations={!prefersReducedMotion}
                    enableHapticFeedback={true}
                    reducedMotion={prefersReducedMotion}
                    // Real-time updates
                    refreshInterval={60000} // Refresh every minute
                    showDataFreshnessIndicator={true}
                  />
                </TabsContent>

                {/* Subject leaderboard tabs */}
                {subjects.map(subject => (
                  <TabsContent key={subject.id} value={subject.id}>
                    <StandardLeaderboard
                      entityType={LeaderboardEntityType.SUBJECT}
                      entityId={subject.id}
                      title={`${subject.name} Leaderboard`}
                      description={`Student rankings and performance metrics for ${subject.name}`}
                      currentStudentId={studentId}
                      showTimeGranularitySelector={true}
                      defaultTimeGranularity={timeGranularity}
                      showRankChange={true}
                      showAcademicScore={true}
                      showRewardPoints={true}
                      showLevel={true}
                      showAchievements={true}
                      limit={50}
                      className={cn("border-primary/20")}
                      metadata={{
                        courseId,
                        courseName,
                        campusId,
                        campusName
                      }}
                      // Enable all microinteractions
                      enableAnimations={!prefersReducedMotion}
                      enableHapticFeedback={true}
                      reducedMotion={prefersReducedMotion}
                      // Real-time updates
                      refreshInterval={60000} // Refresh every minute
                      showDataFreshnessIndicator={true}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Show transparency features toggle */}
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransparencyFeatures(!showTransparencyFeatures)}
              className="text-xs"
            >
              {showTransparencyFeatures ? "Hide Transparency Features" : "Show Transparency Features"}
            </Button>
          </div>

          {/* Transparency features */}
          {showTransparencyFeatures && (
            <Card className="border-dashed border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transparency Features</CardTitle>
                <CardDescription>
                  Understand how the leaderboard works and how points are calculated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="points" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4 w-full">
                    <TabsTrigger value="points" className="flex items-center gap-1">
                      <BarChart className="h-3 w-3" />
                      <span className={isMobile ? "sr-only" : ""}>Points</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-1">
                      <History className="h-3 w-3" />
                      <span className={isMobile ? "sr-only" : ""}>History</span>
                    </TabsTrigger>
                    <TabsTrigger value="algorithm" className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span className={isMobile ? "sr-only" : ""}>Algorithm</span>
                    </TabsTrigger>
                    <TabsTrigger value="scoring" className="flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      <span className={isMobile ? "sr-only" : ""}>Scoring</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="points">
                    <PointsBreakdownComponent
                      studentId={studentId}
                      entityType="class"
                      entityId={classId}
                    />
                  </TabsContent>

                  <TabsContent value="history">
                    <LeaderboardHistoryViewer
                      studentId={studentId}
                      entityType="class"
                      entityId={classId}
                      timeframe="monthly"
                    />
                  </TabsContent>

                  <TabsContent value="algorithm">
                    <RankingAlgorithmDocumentation />
                  </TabsContent>

                  <TabsContent value="scoring">
                    <ScoringSystemVisualizer
                      className=""
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Leaderboard Insights</CardTitle>
              <CardDescription>
                Understand your performance and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="points" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4 w-full">
                  <TabsTrigger value="points">Points Analysis</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="points">
                  <PointsBreakdownComponent
                    studentId={studentId}
                    entityType="class"
                    entityId={classId}
                  />
                </TabsContent>

                <TabsContent value="history">
                  <LeaderboardHistoryViewer
                    studentId={studentId}
                    entityType="class"
                    entityId={classId}
                    timeframe="monthly"
                  />
                </TabsContent>

                <TabsContent value="trends">
                  <div className="p-4 text-center text-muted-foreground">
                    <p>Trend analysis will be available soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
