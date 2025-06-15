'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronUp, ChevronDown, Search, Trophy, Award, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LeaderboardEntityType, TimeGranularity } from '../types/standard-leaderboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LeaderboardRankChangeAnimation } from './LeaderboardRankChangeAnimation';
import { LeaderboardPersonalBestIndicator } from './LeaderboardPersonalBestIndicator';
import { LeaderboardMilestonesWithSuspense } from './client-components';
import { useLeaderboardGoals } from '../hooks/useLeaderboardGoals';
import { VirtualizedLeaderboardTable } from './VirtualizedLeaderboardTable';

export interface StudentLeaderboardViewProps {
  entityType: LeaderboardEntityType;
  entityId: string;
  currentStudentId: string;
  timeGranularity?: TimeGranularity;
  showPersonalStats?: boolean;
  showMilestones?: boolean;
  showAchievements?: boolean;
  limit?: number;
  className?: string;
}

/**
 * Enhanced student leaderboard view with microinteractions and transparency features
 */
export function StudentLeaderboardView({
  entityType,
  entityId,
  currentStudentId,
  timeGranularity = TimeGranularity.ALL_TIME,
  showPersonalStats = true,
  showMilestones = true,
  showAchievements = true,
  limit = 50,
  className,
}: StudentLeaderboardViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeGranularity>(timeGranularity);
  const [searchQuery, setSearchQuery] = useState('');

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
    timeGranularity: selectedTimeframe,
    filterOptions: {
      limit,
      includeCurrentStudent: true,
      currentStudentId,
      searchQuery: searchQuery.length > 2 ? searchQuery : undefined
    },
  });

  // Fetch student goals and milestones
  const { 
    personalBests, 
    milestones, 
    isLoadingGoals 
  } = useLeaderboardGoals({
    entityType,
    entityId,
    studentId: currentStudentId,
    timeGranularity: selectedTimeframe
  });

  // Find current student in leaderboard
  const currentStudentEntry = data?.leaderboard.find(entry => entry.studentId === currentStudentId);
  
  // Get entity name for display
  const entityName = data?.metadata?.entityName || 
    (entityType === LeaderboardEntityType.CLASS ? 'Class' :
     entityType === LeaderboardEntityType.SUBJECT ? 'Subject' :
     entityType === LeaderboardEntityType.COURSE ? 'Course' : 'Campus');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Personal stats card */}
      {showPersonalStats && currentStudentEntry && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle>Your Position</CardTitle>
            <CardDescription>
              Your current ranking in {entityName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Rank and position */}
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                    <span className="text-3xl font-bold">{currentStudentEntry.rank}</span>
                    <span className="text-xs text-muted-foreground">Rank</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Position Change</span>
                      <LeaderboardRankChangeAnimation
                        rankChange={currentStudentEntry.rankChange}
                        isAnimating={false}
                        showValue={true}
                        size="md"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(personalBests).map(([type, value]) => (
                        <LeaderboardPersonalBestIndicator
                          key={type}
                          personalBests={[type as any]}
                          isNewBest={false}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Points and stats */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Academic Score</span>
                    <span className="text-sm font-medium">{currentStudentEntry.academicScore}%</span>
                  </div>
                  <Progress value={currentStudentEntry.academicScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Reward Points</span>
                    <span className="text-sm font-medium">{currentStudentEntry.rewardPoints.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (currentStudentEntry.rewardPoints / 1000) * 100)} 
                    className="h-2 bg-muted" 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Level {currentStudentEntry.level || 1}</span>
                  </div>
                  
                  {currentStudentEntry.achievements !== undefined && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{currentStudentEntry.achievements} Achievements</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Milestones */}
      {showMilestones && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle>Your Milestones</CardTitle>
            <CardDescription>
              Goals and achievements to reach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardMilestonesWithSuspense
              entityType={entityType}
              entityId={entityId}
              studentId={currentStudentId}
              isLoading={isLoadingGoals}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Main leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{entityName} Leaderboard</CardTitle>
              <CardDescription>
                Student rankings and performance metrics
              </CardDescription>
            </div>
            
            <Tabs 
              value={selectedTimeframe} 
              onValueChange={(value) => setSelectedTimeframe(value as TimeGranularity)}
              className="w-auto"
            >
              <TabsList className="grid grid-cols-3 h-8 w-auto">
                <TabsTrigger value={TimeGranularity.WEEKLY} className="text-xs px-2">Week</TabsTrigger>
                <TabsTrigger value={TimeGranularity.MONTHLY} className="text-xs px-2">Month</TabsTrigger>
                <TabsTrigger value={TimeGranularity.ALL_TIME} className="text-xs px-2">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load leaderboard data.</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <VirtualizedLeaderboardTable
              leaderboard={data?.leaderboard || []}
              currentStudentId={currentStudentId}
              isLoading={isLoading && !isUsingCachedData}
              showRankChange={true}
              showAcademicScore={true}
              showRewardPoints={true}
              showLevel={true}
              enableAnimations={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
