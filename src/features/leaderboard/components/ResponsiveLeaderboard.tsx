'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  BarChart,
  Award,
  ArrowRight
} from 'lucide-react';
import { Trophy } from '@/components/ui/icons/reward-icons';
import { cn } from '@/lib/utils';
import {
  VirtualizedLeaderboardTable,
  LeaderboardMilestonesWithSuspense,
  LeaderboardSyncStatus
} from './index';
import type { VirtualizedLeaderboardEntry } from './VirtualizedLeaderboardTable';
import { TimeGranularity } from '../types/standard-leaderboard';
import {
  useProgressiveLoading,
  LoadPriority,
  isMobileDevice,
  getDeviceOrientation,
  prefersReducedMotion,
  useDataEfficientApi,
  useBatteryEfficientUpdates,
  UpdateStrategy
} from '../utils';

export interface ResponsiveLeaderboardProps {
  classId: string;
  currentStudentId?: string;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * ResponsiveLeaderboard component with optimized layout and performance
 *
 * Features:
 * - Virtualized list for efficient rendering of large datasets
 * - Progressive loading of components based on priority
 * - Responsive layout with minimal reflows
 * - Battery-efficient updates
 * - Data-efficient API calls
 * - Touch-optimized interactions
 */
export function ResponsiveLeaderboard({
  classId,
  currentStudentId,
  title = "Class Leaderboard",
  description = "Student rankings based on performance",
  className,
}: ResponsiveLeaderboardProps) {
  // State
  const [currentPeriod, setCurrentPeriod] = useState<TimeGranularity>(TimeGranularity.WEEKLY);
  const [currentView, setCurrentView] = useState<'leaderboard' | 'milestones' | 'analytics'>('leaderboard');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(getDeviceOrientation());
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Get network and device information
  const { networkInfo, optimizationOptions, getOptimizedQueryParams } = useDataEfficientApi();

  // Fetch leaderboard data with battery-efficient updates
  const {
    data: leaderboardData,
    isLoading,
    error,
    lastUpdated,
    refresh,
    updateStrategy,
    setStrategy
  } = useBatteryEfficientUpdates<{
    entries: VirtualizedLeaderboardEntry[];
    totalStudents: number;
  }>(
    async () => {
      // In a real implementation, this would be an API call
      // For this example, we'll simulate a fetch with mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            entries: Array(50).fill(0).map((_, i) => ({
              rank: i + 1,
              studentId: `student-${i}`,
              studentName: `Student ${i + 1}`,
              enrollmentNumber: `EN${1000 + i}`,
              score: Math.floor(Math.random() * 100),
              totalPoints: Math.floor(Math.random() * 10000),
              rewardPoints: Math.floor(Math.random() * 5000),
              academicScore: Math.floor(Math.random() * 100),
              completionRate: Math.floor(Math.random() * 100),
              level: Math.floor(Math.random() * 10) + 1,
              achievements: Math.floor(Math.random() * 20),
              previousRank: i === 0 ? 2 : i === 1 ? 1 : i + 1,
            })),
            totalStudents: 50,
          });
        }, 500);
      });
    },
    UpdateStrategy.NORMAL,
    {
      enabled: true,
      onSuccess: (data) => {
        console.log('Leaderboard data updated', data);
      },
      onError: (error) => {
        console.error('Failed to fetch leaderboard data', error);
      },
    }
  );

  // Check device capabilities on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setReducedMotion(prefersReducedMotion());

    // Listen for orientation changes
    const handleResize = () => {
      setOrientation(getDeviceOrientation());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Adjust update strategy based on view
  useEffect(() => {
    if (currentView === 'leaderboard') {
      setStrategy(UpdateStrategy.NORMAL);
    } else {
      setStrategy(UpdateStrategy.INFREQUENT);
    }
  }, [currentView, setStrategy]);

  // Handle period change
  const handlePeriodChange = (period: TimeGranularity) => {
    setCurrentPeriod(period);
  };

  // Render loading state
  if (isLoading && !leaderboardData) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-500">Loading leaderboard data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error && !leaderboardData) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-20 text-center">
            <div className="inline-block rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
              <ChevronRight className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Failed to load leaderboard</h3>
            <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            <Button onClick={refresh} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full",
        "contain-layout", // CSS containment for layout optimization
        "contain-paint", // CSS containment for paint optimization
        className
      )}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>

            {/* Progressive loading for non-critical UI */}
            {useProgressiveLoading(LoadPriority.MEDIUM) && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('leaderboard')}
                  className={cn(
                    currentView === 'leaderboard' ? 'bg-primary text-primary-foreground' : ''
                  )}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Leaderboard</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('milestones')}
                  className={cn(
                    currentView === 'milestones' ? 'bg-primary text-primary-foreground' : ''
                  )}
                >
                  <Award className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Milestones</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('analytics')}
                  className={cn(
                    currentView === 'analytics' ? 'bg-primary text-primary-foreground' : ''
                  )}
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Sync status indicator */}
          <div className="mb-4">
            <LeaderboardSyncStatus
              lastUpdated={lastUpdated}
              isLoading={isLoading}
              updateStrategy={updateStrategy}
              onRefresh={refresh}
              networkInfo={networkInfo}
            />
          </div>

          {/* Time period selector */}
          {useProgressiveLoading(LoadPriority.HIGH) && (
            <div className="mb-4">
              <Tabs value={currentPeriod} onValueChange={(value) => handlePeriodChange(value as TimeGranularity)}>
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value={TimeGranularity.DAILY}>Daily</TabsTrigger>
                  <TabsTrigger value={TimeGranularity.WEEKLY}>Weekly</TabsTrigger>
                  <TabsTrigger value={TimeGranularity.MONTHLY}>Monthly</TabsTrigger>
                  <TabsTrigger value={TimeGranularity.TERM}>Term</TabsTrigger>
                  <TabsTrigger value={TimeGranularity.ALL_TIME}>All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Main content */}
          <div className="mt-4">
            {currentView === 'leaderboard' && leaderboardData && (
              <VirtualizedLeaderboardTable
                leaderboard={leaderboardData.entries}
                currentStudentId={currentStudentId}
                totalStudents={leaderboardData.totalStudents}
                currentPeriod={currentPeriod}
                onPeriodChange={handlePeriodChange}
                isLoading={isLoading}
                showRankChange={true}
                showAcademicScore={true}
                showRewardPoints={true}
                showLevel={true}
                showAchievements={true}
                enableAnimations={!reducedMotion}
                reducedMotion={reducedMotion}
              />
            )}

            {currentView === 'milestones' && (
              <LeaderboardMilestonesWithSuspense
                classId={classId}
                studentId={currentStudentId}
              />
            )}

            {currentView === 'analytics' && (
              <div className="py-20 text-center">
                <BarChart className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Analytics Coming Soon</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Detailed analytics for the leaderboard will be available soon.
                </p>
              </div>
            )}
          </div>

          {/* Mobile navigation (only shown on mobile) */}
          {isMobile && useProgressiveLoading(LoadPriority.LOW) && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-2 flex justify-around items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('leaderboard')}
                className={cn(
                  "flex flex-col items-center",
                  currentView === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Trophy className="h-5 w-5" />
                <span className="text-xs mt-1">Rankings</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('milestones')}
                className={cn(
                  "flex flex-col items-center",
                  currentView === 'milestones' ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Award className="h-5 w-5" />
                <span className="text-xs mt-1">Goals</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('analytics')}
                className={cn(
                  "flex flex-col items-center",
                  currentView === 'analytics' ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <BarChart className="h-5 w-5" />
                <span className="text-xs mt-1">Stats</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
