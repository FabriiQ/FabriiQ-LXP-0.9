/**
 * Base Leaderboard Table Component
 *
 * This component provides a basic table for displaying leaderboard data.
 * Enhanced with microinteractions and animations.
 */

import React, { useEffect, useState } from 'react';
import { StandardLeaderboardEntry } from '../types/standard-leaderboard';
import { useLeaderboardAnimations } from '../hooks/useLeaderboardAnimations';
import { LeaderboardInteractiveRow } from './LeaderboardInteractiveRow';
import { LeaderboardRealTimeUpdates } from './LeaderboardRealTimeUpdates';
import { PersonalBestType } from './LeaderboardPersonalBestIndicator';

// Assuming we have UI components from a design system
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface BaseLeaderboardTableProps {
  leaderboard: StandardLeaderboardEntry[];
  title?: string;
  description?: string;
  currentStudentId?: string;
  isLoading?: boolean;
  showRankChange?: boolean;
  showAcademicScore?: boolean;
  showRewardPoints?: boolean;
  showLevel?: boolean;
  showAchievements?: boolean;
  showDetails?: boolean;
  lastUpdated?: Date;
  hasNewData?: boolean;
  onRefresh?: () => void;
  onRowClick?: (entry: StandardLeaderboardEntry) => void;
  personalBests?: Record<string, PersonalBestType[]>;
  className?: string;
  enableAnimations?: boolean;
  enableHapticFeedback?: boolean;
  reducedMotion?: boolean;
}

export function BaseLeaderboardTable({
  leaderboard,
  title = "Leaderboard",
  description = "Student rankings based on performance",
  currentStudentId,
  isLoading = false,
  showRankChange = true,
  showAcademicScore = true,
  showRewardPoints = true,
  showLevel = true,
  showAchievements = false,
  showDetails = true,
  lastUpdated,
  hasNewData = false,
  onRefresh,
  onRowClick,
  personalBests = {},
  className,
  enableAnimations = true,
  enableHapticFeedback = true,
  reducedMotion = false,
}: BaseLeaderboardTableProps) {
  const [previousLeaderboard, setPreviousLeaderboard] = useState<StandardLeaderboardEntry[]>([]);
  const [newPersonalBests, setNewPersonalBests] = useState<Record<string, boolean>>({});

  // Use the animation hook
  const {
    animatingEntries,
    highlightedEntries,
    processLeaderboardUpdate,
    triggerHapticFeedback
  } = useLeaderboardAnimations({
    enableHapticFeedback,
    reducedMotion
  });

  // Process leaderboard updates for animations
  useEffect(() => {
    // Skip if loading, animations disabled, or no data
    if (isLoading || !enableAnimations || leaderboard.length === 0) {
      return;
    }

    // Skip if the leaderboard data hasn't changed
    const leaderboardString = JSON.stringify(leaderboard.map(entry => ({
      id: entry.studentId,
      rank: entry.rank
    })));
    const previousLeaderboardString = JSON.stringify(previousLeaderboard.map(entry => ({
      id: entry.studentId,
      rank: entry.rank
    })));

    if (leaderboardString === previousLeaderboardString) {
      return;
    }

    // Process animations
    processLeaderboardUpdate(leaderboard);

    // Check for new personal bests
    const newBests: Record<string, boolean> = {};

    Object.entries(personalBests).forEach(([studentId, bests]) => {
      if (bests.length > 0) {
        // Check if the most recent best is new (within the last minute)
        const mostRecent = [...bests].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        const isNew = new Date().getTime() - new Date(mostRecent.date).getTime() < 60000;
        if (isNew) {
          newBests[studentId] = true;

          // Trigger haptic feedback for new personal best
          if (studentId === currentStudentId) {
            triggerHapticFeedback('heavy');
          }
        }
      }
    });

    if (Object.keys(newBests).length > 0) {
      setNewPersonalBests(newBests);
    }

    // Update previous leaderboard for next comparison
    setPreviousLeaderboard(leaderboard);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboard, isLoading, enableAnimations]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        {lastUpdated && (
          <LeaderboardRealTimeUpdates
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            hasNewData={hasNewData}
            onRefresh={onRefresh}
          />
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              {showRankChange && <TableHead className="w-12">Change</TableHead>}
              <TableHead>Student</TableHead>
              {showAcademicScore && <TableHead className="text-right">Academic Score</TableHead>}
              {showRewardPoints && <TableHead className="text-right">Points</TableHead>}
              {showLevel && <TableHead className="text-right">Level</TableHead>}
              {showAchievements && <TableHead className="text-right">Achievements</TableHead>}
              {showDetails && <TableHead className="w-8"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                  {showRankChange && <TableCell><Skeleton className="h-6 w-6" /></TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  {showAcademicScore && <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>}
                  {showRewardPoints && <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>}
                  {showLevel && <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>}
                  {showAchievements && <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>}
                  {showDetails && <TableCell><Skeleton className="h-4 w-4 ml-auto" /></TableCell>}
                </TableRow>
              ))
            ) : (
              // Actual leaderboard data with interactive rows
              leaderboard.map((entry) => (
                <LeaderboardInteractiveRow
                  key={entry.studentId}
                  entry={entry}
                  isCurrentStudent={entry.studentId === currentStudentId}
                  isAnimating={animatingEntries[entry.studentId]}
                  isHighlighted={highlightedEntries[entry.studentId]}
                  personalBests={personalBests[entry.studentId] || []}
                  isNewPersonalBest={newPersonalBests[entry.studentId]}
                  showRankChange={showRankChange}
                  showAcademicScore={showAcademicScore}
                  showRewardPoints={showRewardPoints}
                  showLevel={showLevel}
                  showAchievements={showAchievements}
                  showDetails={showDetails}
                  onRowClick={onRowClick}
                />
              ))
            )}

            {!isLoading && leaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={showDetails ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  No leaderboard data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
