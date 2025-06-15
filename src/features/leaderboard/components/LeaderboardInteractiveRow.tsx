'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Award, TrendingUp } from 'lucide-react';
import { Trophy } from '@/components/ui/icons/trophy-medal';
import { Star } from '@/components/ui/icons/reward-icons';
import { Target } from '@/components/ui/icons/reward-icons';
import { cn } from '@/lib/utils';
import { StandardLeaderboardEntry } from '../types/standard-leaderboard';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LeaderboardRankChangeAnimation } from './LeaderboardRankChangeAnimation';
import { LeaderboardPersonalBestIndicator, PersonalBestType } from './LeaderboardPersonalBestIndicator';

export interface LeaderboardInteractiveRowProps {
  entry: StandardLeaderboardEntry;
  isCurrentStudent?: boolean;
  isAnimating?: boolean;
  isHighlighted?: boolean;
  personalBests?: PersonalBestType[];
  isNewPersonalBest?: boolean;
  showRankChange?: boolean;
  showAcademicScore?: boolean;
  showRewardPoints?: boolean;
  showLevel?: boolean;
  showAchievements?: boolean;
  showDetails?: boolean;
  onRowClick?: (entry: StandardLeaderboardEntry) => void;
  className?: string;
}

/**
 * Interactive row component for the leaderboard table
 */
export function LeaderboardInteractiveRow({
  entry,
  isCurrentStudent = false,
  isAnimating = false,
  isHighlighted = false,
  personalBests = [],
  isNewPersonalBest = false,
  showRankChange = true,
  showAcademicScore = true,
  showRewardPoints = true,
  showLevel = true,
  showAchievements = false,
  showDetails = true,
  onRowClick,
  className,
}: LeaderboardInteractiveRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to get rank medal for top 3
  const getRankMedal = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-700" />;
    return null;
  };

  // Handle row click
  const handleRowClick = () => {
    if (showDetails) {
      setIsExpanded(!isExpanded);
    }

    if (onRowClick) {
      onRowClick(entry);
    }
  };

  // Row animation variants
  const rowVariants = {
    initial: {
      backgroundColor: "transparent"
    },
    highlighted: {
      backgroundColor: ["rgba(var(--primary-rgb), 0.05)", "rgba(var(--primary-rgb), 0.15)", "rgba(var(--primary-rgb), 0.05)"],
      transition: {
        duration: 1.5,
        repeat: 0,
        ease: "easeInOut"
      }
    },
    animating: {
      y: [0, -5, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  // Details animation variants
  const detailsVariants = {
    closed: {
      height: 0,
      opacity: 0,
      marginTop: 0
    },
    open: {
      height: "auto",
      opacity: 1,
      marginTop: 8,
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  };

  return (
    <>
      <motion.tr
        className={cn(
          "transition-colors cursor-pointer",
          isCurrentStudent ? "bg-primary/10" : "",
          className
        )}
        onClick={handleRowClick}
        variants={rowVariants}
        initial="initial"
        animate={
          isAnimating ? "animating" :
          isHighlighted ? "highlighted" :
          "initial"
        }
      >
        <TableCell className="font-medium">
          <div className="flex items-center">
            {getRankMedal(entry.rank)}
            <span className={getRankMedal(entry.rank) ? "ml-1" : undefined}>
              {entry.rank}
            </span>

            {personalBests.length > 0 && (
              <div className="ml-2">
                <LeaderboardPersonalBestIndicator
                  personalBests={personalBests}
                  isNewBest={isNewPersonalBest}
                  size="sm"
                />
              </div>
            )}
          </div>
        </TableCell>

        {showRankChange && (
          <TableCell>
            <LeaderboardRankChangeAnimation
              rankChange={entry.rankChange}
              isAnimating={isAnimating}
              size="sm"
            />
          </TableCell>
        )}

        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={entry.studentAvatar} />
              <AvatarFallback>
                {entry.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              {entry.isAnonymous ? "Anonymous Student" : entry.studentName}
              {isCurrentStudent && (
                <Badge variant="outline" className="ml-2">You</Badge>
              )}
            </div>
          </div>
        </TableCell>

        {showAcademicScore && (
          <TableCell className="text-right">
            {entry.academicScore}%
          </TableCell>
        )}

        {showRewardPoints && (
          <TableCell className="text-right font-medium">
            {entry.rewardPoints.toLocaleString()}
          </TableCell>
        )}

        {showLevel && (
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              {entry.level || 1}
            </div>
          </TableCell>
        )}

        {showAchievements && (
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Award className="h-4 w-4 text-blue-500" />
              {entry.achievements || 0}
            </div>
          </TableCell>
        )}

        {showDetails && (
          <TableCell className="w-8 text-right">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </TableCell>
        )}
      </motion.tr>

      {showDetails && (
        <tr>
          <TableCell colSpan={7} className="p-0 border-0">
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="bg-muted/50 px-4 py-3 rounded-md mx-2"
                  variants={detailsVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Target className="h-4 w-4 text-purple-500" />
                        Academic Performance
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Grade Points:</span>
                          <span className="font-medium">
                            {entry.totalGradePoints}/{entry.totalMaxGradePoints}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Completion Rate:</span>
                          <span className="font-medium">
                            {entry.completionRate}%
                          </span>
                        </div>
                        <Progress value={entry.completionRate} className="h-1.5" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Reward Points
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Total Points:</span>
                          <span className="font-medium">
                            {entry.rewardPoints.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Level:</span>
                          <span className="font-medium">
                            {entry.level || 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Progress Metrics
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Activities:</span>
                          <span className="font-medium">
                            {entry.completedActivities}/{entry.totalActivities}
                          </span>
                        </div>
                        {entry.consistencyScore !== undefined && (
                          <div className="flex justify-between text-xs">
                            <span>Consistency:</span>
                            <span className="font-medium">
                              {entry.consistencyScore}/100
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TableCell>
        </tr>
      )}
    </>
  );
}
