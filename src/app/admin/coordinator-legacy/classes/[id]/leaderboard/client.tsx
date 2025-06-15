'use client';

import React, { useState } from 'react';
import {
  StandardLeaderboard,
  PointsBreakdownComponent,
  LeaderboardHistoryViewer,
  RankingAlgorithmDocumentation,
  ScoringSystemVisualizer
} from '@/features/leaderboard/components/client-components';
import { LeaderboardEntityType, TimeGranularity } from '@/features/leaderboard/types/standard-leaderboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BarChart, Clock, HelpCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface CoordinatorClassLeaderboardClientProps {
  classId: string;
  className: string;
  courseId: string;
  courseName: string;
  campusId: string;
  campusName: string;
}

export function CoordinatorClassLeaderboardClient({
  classId,
  className,
  courseId,
  courseName,
  campusId,
  campusName
}: CoordinatorClassLeaderboardClientProps) {
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>(TimeGranularity.ALL_TIME);
  const [activeTab, setActiveTab] = useState<string>('leaderboard');

  // Check if we're on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Check for reduced motion preference
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Main leaderboard */}
      <StandardLeaderboard
        entityType={LeaderboardEntityType.CLASS}
        entityId={classId}
        title={`Class Leaderboard: ${className}`}
        description="Student rankings and performance metrics for this class"
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

      {/* Transparency and Trust Features */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Leaderboard Insights</CardTitle>
          <CardDescription>
            Understand how the leaderboard works and view detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full rounded-none border-b">
              <TabsTrigger value="points" className="flex items-center gap-1 rounded-none">
                <BarChart className="h-4 w-4" />
                <span className={isMobile ? "sr-only" : ""}>Points</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1 rounded-none">
                <Clock className="h-4 w-4" />
                <span className={isMobile ? "sr-only" : ""}>History</span>
              </TabsTrigger>
              <TabsTrigger value="algorithm" className="flex items-center gap-1 rounded-none">
                <Info className="h-4 w-4" />
                <span className={isMobile ? "sr-only" : ""}>Algorithm</span>
              </TabsTrigger>
              <TabsTrigger value="scoring" className="flex items-center gap-1 rounded-none">
                <HelpCircle className="h-4 w-4" />
                <span className={isMobile ? "sr-only" : ""}>Scoring</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points" className="p-4">
              <PointsBreakdownComponent
                studentId=""
                entityType="class"
                entityId={classId}
              />
            </TabsContent>

            <TabsContent value="history" className="p-4">
              <LeaderboardHistoryViewer
                studentId=""
                entityType="class"
                entityId={classId}
                timeframe="monthly"
              />
            </TabsContent>

            <TabsContent value="algorithm" className="p-4">
              <RankingAlgorithmDocumentation />
            </TabsContent>

            <TabsContent value="scoring" className="p-4">
              <ScoringSystemVisualizer
                className=""
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
