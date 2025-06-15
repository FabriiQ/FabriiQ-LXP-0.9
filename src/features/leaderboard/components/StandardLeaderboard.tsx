/**
 * Standard Leaderboard Component
 *
 * This component provides a standardized leaderboard with time granularity selection,
 * loading states, and error handling.
 */

'use client';

import React, { useState } from 'react';
import {
  LeaderboardEntityType,
  TimeGranularity,
  LeaderboardFilterOptions
} from '../types/standard-leaderboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { BaseLeaderboardTable } from './BaseLeaderboardTable';

// Assuming we have UI components from a design system
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface StandardLeaderboardProps {
  entityType: LeaderboardEntityType | string;
  entityId: string;
  title?: string;
  description?: string;
  currentStudentId?: string;
  showTimeGranularitySelector?: boolean;
  defaultTimeGranularity?: TimeGranularity;
  showRankChange?: boolean;
  showAcademicScore?: boolean;
  showRewardPoints?: boolean;
  showLevel?: boolean;
  showAchievements?: boolean;
  limit?: number;
  className?: string;
  metadata?: Record<string, any>;
  // Microinteraction props
  enableAnimations?: boolean;
  enableHapticFeedback?: boolean;
  reducedMotion?: boolean;
  // Real-time updates props
  refreshInterval?: number;
  showDataFreshnessIndicator?: boolean;
  // Transparency features
  showPointsBreakdown?: boolean;
  showRankingAlgorithmInfo?: boolean;
}

export function StandardLeaderboard({
  entityType,
  entityId,
  title,
  description,
  currentStudentId,
  showTimeGranularitySelector = true,
  defaultTimeGranularity = TimeGranularity.ALL_TIME,
  showRankChange = true,
  showAcademicScore = true,
  showRewardPoints = true,
  showLevel = true,
  showAchievements = false,
  limit = 10,
  className,
  metadata,
  // Microinteraction props
  enableAnimations = true,
  enableHapticFeedback = true,
  reducedMotion = false,
  // Real-time updates props
  refreshInterval = 0,
  showDataFreshnessIndicator = true,
  // Transparency features
  showPointsBreakdown = false,
  showRankingAlgorithmInfo = false,
}: StandardLeaderboardProps) {
  // State for time granularity
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>(defaultTimeGranularity);

  // Filter options
  const filterOptions: LeaderboardFilterOptions = {
    limit,
    includeCurrentStudent: !!currentStudentId,
    currentStudentId,
  };

  // Fetch leaderboard data
  const {
    data,
    isLoading,
    isUsingCachedData,
    error,
    refetch
  } = useLeaderboard({
    entityType,
    entityId,
    timeGranularity,
    filterOptions,
  });

  // Generate title if not provided (using React.useMemo to prevent unnecessary recalculations)
  const leaderboardTitle = React.useMemo(() => {
    return title || `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Leaderboard`;
  }, [title, entityType]);

  // Generate description if not provided (using React.useMemo to prevent unnecessary recalculations)
  const leaderboardDescription = React.useMemo(() => {
    return description ||
      (data?.metadata?.entityName ? `Rankings for ${data.metadata.entityName}` : `Student rankings based on performance`);
  }, [description, data?.metadata?.entityName]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{leaderboardTitle}</CardTitle>
          <CardDescription>{leaderboardDescription}</CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          {isUsingCachedData && (
            <div className="flex items-center text-amber-500 text-sm">
              <WifiOff className="h-4 w-4 mr-1" />
              <span>Offline</span>
            </div>
          )}

          {showTimeGranularitySelector && (
            <Select
              value={timeGranularity}
              onValueChange={(value) => setTimeGranularity(value as TimeGranularity)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TimeGranularity.DAILY}>Daily</SelectItem>
                <SelectItem value={TimeGranularity.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={TimeGranularity.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={TimeGranularity.TERM}>Term</SelectItem>
                <SelectItem value={TimeGranularity.ALL_TIME}>All Time</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load leaderboard data. Please try again.
            </AlertDescription>
          </Alert>
        ) : (
          <BaseLeaderboardTable
            leaderboard={data?.leaderboard || []}
            title=""
            description=""
            currentStudentId={currentStudentId}
            isLoading={isLoading && !isUsingCachedData}
            showRankChange={showRankChange}
            showAcademicScore={showAcademicScore}
            showRewardPoints={showRewardPoints}
            showLevel={showLevel}
            showAchievements={showAchievements}
            lastUpdated={data?.lastUpdated ? new Date(data.lastUpdated) : undefined}
            hasNewData={data?.hasNewData}
            onRefresh={refetch}
            enableAnimations={enableAnimations}
            enableHapticFeedback={enableHapticFeedback}
            reducedMotion={reducedMotion}
          />
        )}

        {data?.currentStudentPosition && !data.leaderboard.some(entry => entry.studentId === currentStudentId) && (
          <div className="mt-4 p-3 border rounded-md bg-muted/50">
            <div className="text-sm font-medium mb-1">Your Position</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-bold mr-2">#{data.currentStudentPosition.rank}</span>
                {data.currentStudentPosition.rankChange && (
                  <span className={`text-xs ${
                    data.currentStudentPosition.rankChange > 0 ? "text-green-500" :
                    data.currentStudentPosition.rankChange < 0 ? "text-red-500" : "text-gray-400"
                  }`}>
                    {data.currentStudentPosition.rankChange > 0 ? "+" : ""}
                    {data.currentStudentPosition.rankChange}
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">{data.currentStudentPosition.rewardPoints.toLocaleString()}</span> points
              </div>
            </div>
            {data.currentStudentPosition.distanceToNextRank && (
              <div className="text-xs text-muted-foreground mt-1">
                {data.currentStudentPosition.distanceToNextRank} points to next rank
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
