'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUp,
  ArrowDown,
  Award
} from 'lucide-react';
import {
  Minus,
  Star,
  Trophy,
  Medal
} from '@/components/ui/icons/reward-icons';
import { cn } from '@/lib/utils';
import { TimeGranularity } from '../types/standard-leaderboard';
import { LeaderboardRankChangeAnimation } from './LeaderboardRankChangeAnimation';

export interface VirtualizedLeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  score?: number;
  totalPoints?: number;
  rewardPoints?: number;
  academicScore?: number;
  completionRate?: number;
  level?: number;
  achievements?: number;
  previousRank?: number;
  avatarUrl?: string;
}

export interface VirtualizedLeaderboardTableProps {
  leaderboard: VirtualizedLeaderboardEntry[];
  currentStudentId?: string;
  title?: string;
  description?: string;
  totalStudents: number;
  currentPeriod: TimeGranularity;
  onPeriodChange?: (period: TimeGranularity) => void;
  isLoading?: boolean;
  pageSize?: number;
  className?: string;
  showRankChange?: boolean;
  showAcademicScore?: boolean;
  showRewardPoints?: boolean;
  showLevel?: boolean;
  showAchievements?: boolean;
  onRowClick?: (entry: VirtualizedLeaderboardEntry) => void;
  enableAnimations?: boolean;
  reducedMotion?: boolean;
}

/**
 * VirtualizedLeaderboardTable component displays a table of student rankings
 * with virtualization for handling large datasets efficiently
 */
export function VirtualizedLeaderboardTable({
  leaderboard,
  currentStudentId,
  title = "Leaderboard",
  description = "Student rankings based on performance",
  totalStudents,
  currentPeriod,
  onPeriodChange,
  isLoading = false,
  pageSize = 50,
  className,
  showRankChange = true,
  showAcademicScore = true,
  showRewardPoints = true,
  showLevel = true,
  showAchievements = false,
  onRowClick,
  enableAnimations = true,
  reducedMotion = false,
}: VirtualizedLeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);
  const [animatingEntries, setAnimatingEntries] = useState<Record<string, boolean>>({});

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.enrollmentNumber && entry.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle period change
  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      onPeriodChange(value as TimeGranularity);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredLeaderboard.length / pageSize);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // Set up virtualization
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLeaderboard.length);
  const currentPageData = filteredLeaderboard.slice(startIndex, endIndex);

  const rowVirtualizer = useVirtualizer({
    count: currentPageData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Estimated row height
    overscan: 5,
  });

  // Trigger animations for rank changes
  useEffect(() => {
    if (!enableAnimations || reducedMotion) return;

    const newAnimatingEntries: Record<string, boolean> = {};

    leaderboard.forEach(entry => {
      if (entry.previousRank !== undefined && entry.previousRank !== entry.rank) {
        newAnimatingEntries[entry.studentId] = true;
      }
    });

    setAnimatingEntries(newAnimatingEntries);

    // Clear animations after a delay
    const timer = setTimeout(() => {
      setAnimatingEntries({});
    }, 2000);

    return () => clearTimeout(timer);
  }, [leaderboard, enableAnimations, reducedMotion]);

  // Render a row
  const renderRow = useCallback((entry: VirtualizedLeaderboardEntry, index: number) => {
    const isCurrentStudent = entry.studentId === currentStudentId;
    const isAnimating = animatingEntries[entry.studentId];

    // Calculate rank change
    let rankChange = 0;
    if (entry.previousRank !== undefined) {
      rankChange = entry.previousRank - entry.rank;
    }

    return (
      <div
        className={cn(
          "flex items-center p-3 border-b last:border-b-0 transition-colors",
          isCurrentStudent ? "bg-primary/10" : "hover:bg-muted/50",
          isAnimating ? "animate-pulse" : ""
        )}
        onClick={() => onRowClick?.(entry)}
      >
        {/* Rank */}
        <div className="flex items-center justify-center w-10 font-medium">
          {entry.rank}
        </div>

        {/* Rank Change */}
        {showRankChange && (
          <div className="flex items-center justify-center w-10">
            <LeaderboardRankChangeAnimation
              rankChange={rankChange}
              isAnimating={isAnimating && enableAnimations && !reducedMotion}
            />
          </div>
        )}

        {/* Student */}
        <div className="flex items-center flex-1 min-w-0">
          <Avatar className="h-8 w-8 mr-2">
            {entry.avatarUrl ? (
              <AvatarImage src={entry.avatarUrl} alt={entry.studentName} />
            ) : (
              <AvatarFallback>
                {entry.studentName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="truncate">
            <div className="font-medium truncate">{entry.studentName}</div>
            {entry.enrollmentNumber && (
              <div className="text-xs text-muted-foreground truncate">
                {entry.enrollmentNumber}
              </div>
            )}
          </div>
        </div>

        {/* Academic Score */}
        {showAcademicScore && (
          <div className="w-24 text-right">
            <div className="font-medium">
              {entry.academicScore !== undefined ? `${entry.academicScore}%` : '-'}
            </div>
          </div>
        )}

        {/* Reward Points */}
        {showRewardPoints && (
          <div className="w-24 text-right">
            <div className="font-medium">
              {entry.rewardPoints !== undefined ? entry.rewardPoints.toLocaleString() : '-'}
            </div>
          </div>
        )}

        {/* Level */}
        {showLevel && (
          <div className="w-16 text-right">
            <Badge variant="outline" className="font-mono">
              {entry.level !== undefined ? `Lvl ${entry.level}` : '-'}
            </Badge>
          </div>
        )}

        {/* Achievements */}
        {showAchievements && (
          <div className="w-16 text-right">
            <div className="font-medium flex items-center justify-end">
              <Award className="h-4 w-4 mr-1 text-amber-500" />
              {entry.achievements !== undefined ? entry.achievements : '-'}
            </div>
          </div>
        )}
      </div>
    );
  }, [
    currentStudentId,
    animatingEntries,
    showRankChange,
    showAcademicScore,
    showRewardPoints,
    showLevel,
    showAchievements,
    onRowClick,
    enableAnimations,
    reducedMotion
  ]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-8 h-9 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={currentPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-9 w-full sm:w-[150px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TimeGranularity.DAILY}>Daily</SelectItem>
                <SelectItem value={TimeGranularity.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={TimeGranularity.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={TimeGranularity.TERM}>Term</SelectItem>
                <SelectItem value={TimeGranularity.ALL_TIME}>All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Header row */}
        <div className="flex items-center p-3 border-b font-medium text-sm text-muted-foreground">
          <div className="w-10">Rank</div>
          {showRankChange && <div className="w-10">Δ</div>}
          <div className="flex-1">Student</div>
          {showAcademicScore && <div className="w-24 text-right">Academic</div>}
          {showRewardPoints && <div className="w-24 text-right">Points</div>}
          {showLevel && <div className="w-16 text-right">Level</div>}
          {showAchievements && <div className="w-16 text-right">Badges</div>}
        </div>

        {/* Virtualized table body */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-500">Loading leaderboard data...</p>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="py-20 text-center">
            <Trophy className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? "Try a different search term" : "No leaderboard data available"}
            </p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="h-[400px] overflow-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const entry = currentPageData[virtualRow.index];
                return (
                  <div
                    key={`virtual-row-${virtualRow.index}-${entry?.studentId || virtualRow.index}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderRow(entry, virtualRow.index)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {filteredLeaderboard.length} students
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
