/**
 * Leaderboard Milestones Component
 *
 * This component displays achievable milestone markers within leaderboards
 * to motivate students by showing clear, attainable goals.
 *
 * It integrates with the existing learning goals system to make milestones
 * trackable and persistent.
 */

'use client';

import React from 'react';
import {
  LeaderboardEntityType,
  StudentPositionInfo
} from '../types/standard-leaderboard';
import { useLeaderboardGoals, MilestoneIcons } from '../hooks/useLeaderboardGoals';

// Assuming we have UI components from a design system
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Flag } from '@/components/ui/icons/reward-icons';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  type: 'rank' | 'points' | 'academic' | 'completion';
  targetValue: number;
  icon: React.ReactNode;
  color: string;
  rewardPoints?: number;
  achievementId?: string;
  progress?: number;
  total?: number;
}

export interface LeaderboardMilestonesProps {
  entityType: LeaderboardEntityType | string;
  entityId: string;
  studentId: string;
  currentStudentPosition?: StudentPositionInfo;
  onMilestoneClick?: (milestone: Milestone) => void;
  className?: string;
}

export function LeaderboardMilestones({
  entityType,
  entityId,
  studentId,
  currentStudentPosition,
  onMilestoneClick,
  className,
}: LeaderboardMilestonesProps) {
  // Use the leaderboard goals hook to get milestones from learning goals
  const {
    milestones,
    isLoading,
    error,
    refetch
  } = useLeaderboardGoals({
    entityType,
    entityId,
    studentId,
    currentStudentPosition
  });

  // Sort milestones by how close they are to being achieved
  const sortedMilestones = React.useMemo(() => {
    if (!currentStudentPosition || !milestones) return [];

    return [...milestones].sort((a, b) => {
      const aProgress = a.progress !== undefined ? a.progress : getMilestoneProgress(a, currentStudentPosition);
      const bProgress = b.progress !== undefined ? b.progress : getMilestoneProgress(b, currentStudentPosition);

      // Sort by progress (descending)
      return bProgress - aProgress;
    });
  }, [milestones, currentStudentPosition]);

  // Get the next milestone to achieve (closest to completion but not completed)
  const nextMilestone = React.useMemo(() => {
    if (!currentStudentPosition || !sortedMilestones.length) return null;

    return sortedMilestones.find(milestone => {
      const progress = milestone.progress !== undefined ? milestone.progress : getMilestoneProgress(milestone, currentStudentPosition);
      return progress < 100;
    });
  }, [sortedMilestones, currentStudentPosition]);

  // Calculate milestone progress
  function getMilestoneProgress(
    milestone: Milestone,
    position: StudentPositionInfo
  ): number {
    switch (milestone.type) {
      case 'rank':
        // Lower rank is better, so we invert the progress calculation
        return Math.min(100, Math.max(0,
          (milestone.targetValue === 0 ? 0 : (1 - (position.rank - 1) / milestone.targetValue)) * 100
        ));
      case 'points':
        return Math.min(100, Math.max(0,
          (position.rewardPoints / milestone.targetValue) * 100
        ));
      case 'academic':
        return Math.min(100, Math.max(0,
          (position.academicScore / milestone.targetValue) * 100
        ));
      case 'completion':
        // This would require additional data about completion rate
        return 0;
      default:
        return 0;
    }
  }

  // Check if milestone is achieved
  function isMilestoneAchieved(
    milestone: Milestone,
    position: StudentPositionInfo
  ): boolean {
    switch (milestone.type) {
      case 'rank':
        return position.rank <= milestone.targetValue;
      case 'points':
        return position.rewardPoints >= milestone.targetValue;
      case 'academic':
        return position.academicScore >= milestone.targetValue;
      case 'completion':
        // This would require additional data about completion rate
        return false;
      default:
        return false;
    }
  }

  // Get milestone value display
  function getMilestoneValueDisplay(milestone: Milestone): string {
    switch (milestone.type) {
      case 'rank':
        return `Rank ${milestone.targetValue}`;
      case 'points':
        return `${milestone.targetValue.toLocaleString()} points`;
      case 'academic':
        return `${milestone.targetValue}% academic score`;
      case 'completion':
        return `${milestone.targetValue}% completion`;
      default:
        return `${milestone.targetValue}`;
    }
  }

  if (!currentStudentPosition) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Milestones</CardTitle>
        <CardDescription>
          Achievable goals to improve your ranking
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-4 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Failed to load milestones</span>
          </div>
        ) : (
          <>
            {/* Next milestone highlight */}
            {nextMilestone && (
              <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 p-1.5 rounded-full" style={{ backgroundColor: `${nextMilestone.color}20` }}>
                      {nextMilestone.icon}
                    </div>
                    <div>
                      <div className="font-medium">{nextMilestone.title}</div>
                      <div className="text-xs text-muted-foreground">{getMilestoneValueDisplay(nextMilestone)}</div>
                    </div>
                  </div>
                  {nextMilestone.rewardPoints && (
                    <Badge variant="secondary">
                      +{nextMilestone.rewardPoints} pts
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs flex justify-between">
                    <span>Next milestone</span>
                    <span>
                      {nextMilestone.progress !== undefined
                        ? nextMilestone.progress
                        : Math.round(getMilestoneProgress(nextMilestone, currentStudentPosition))}%
                    </span>
                  </div>
                  <Progress
                    value={nextMilestone.progress !== undefined
                      ? nextMilestone.progress
                      : getMilestoneProgress(nextMilestone, currentStudentPosition)}
                    className="h-1.5"
                    style={{
                      '--progress-background': `${nextMilestone.color}40`,
                      '--progress-foreground': nextMilestone.color
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            )}

            {/* All milestones */}
            <div className="space-y-2">
              {sortedMilestones.map((milestone) => {
                const progress = milestone.progress !== undefined
                  ? milestone.progress
                  : getMilestoneProgress(milestone, currentStudentPosition);
                const achieved = milestone.progress === 100 || isMilestoneAchieved(milestone, currentStudentPosition);

                return (
                  <TooltipProvider key={milestone.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                            achieved
                              ? 'bg-primary/10 hover:bg-primary/20'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => onMilestoneClick?.(milestone)}
                        >
                          <div
                            className="mr-3 p-1.5 rounded-full"
                            style={{
                              backgroundColor: achieved
                                ? `${milestone.color}40`
                                : `${milestone.color}20`
                            }}
                          >
                            {milestone.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-medium truncate">{milestone.title}</div>
                              {achieved && (
                                <Badge variant="success" className="ml-2">Achieved</Badge>
                              )}
                            </div>

                            <div className="mt-1">
                              <Progress
                                value={progress}
                                className="h-1"
                                style={{
                                  '--progress-background': `${milestone.color}20`,
                                  '--progress-foreground': milestone.color
                                } as React.CSSProperties}
                              />
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-bold">{milestone.title}</div>
                          <div>{milestone.description}</div>
                          <div className="mt-1 text-xs">
                            Target: {getMilestoneValueDisplay(milestone)}
                          </div>
                          {milestone.rewardPoints && (
                            <div className="mt-1 text-xs">
                              Reward: +{milestone.rewardPoints} points
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            // Refresh milestones
            refetch();
          }}
        >
          <Flag className="h-4 w-4 mr-2" />
          View All Milestones
        </Button>
      </CardFooter>
    </Card>
  );
}

// The Milestone type is already exported above
