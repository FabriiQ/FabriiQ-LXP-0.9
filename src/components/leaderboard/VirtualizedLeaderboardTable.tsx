"use client";

import { useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardPeriod } from "@/server/api/services/optimized-queries";
import { TrophyIcon, MedalIcon, AwardIcon } from "@/components/ui/icons/leaderboard-icons";

export interface EnhancedLeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  score: number;
  totalPoints?: number;
  completionRate?: number;
  level?: number;
  achievements?: number;
  rewardPoints?: number;
  previousRank?: number;
}

export interface VirtualizedLeaderboardTableProps {
  leaderboard: EnhancedLeaderboardEntry[];
  currentStudentId?: string;
  title?: string;
  description?: string;
  totalStudents: number;
  currentPeriod: LeaderboardPeriod;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  isLoading?: boolean;
  pageSize?: number;
  className?: string;
}

// Helper functions for styling and rendering
const getRankBadgeColor = (rank: number) => {
  if (rank === 1) return "bg-yellow-100 border-yellow-400 text-yellow-700";
  if (rank === 2) return "bg-gray-100 border-gray-400 text-gray-700";
  if (rank === 3) return "bg-amber-100 border-amber-400 text-amber-700";
  return "";
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <TrophyIcon className="h-4 w-4 text-yellow-600" />;
  if (rank === 2) return <MedalIcon className="h-4 w-4 text-gray-600" />;
  if (rank === 3) return <AwardIcon className="h-4 w-4 text-amber-600" />;
  return null;
};

const getGradeColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-teal-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

const getGradeLetter = (score: number) => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
};

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
}: VirtualizedLeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.enrollmentNumber && entry.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredLeaderboard.length / pageSize);

  // Handle period change
  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      onPeriodChange(value as LeaderboardPeriod);
    }
  };

  // Handle pagination
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

  // Render a row
  const renderRow = useCallback((entry: EnhancedLeaderboardEntry, index: number) => {
    const isCurrentStudent = entry.studentId === currentStudentId;

    return (
      <div
        key={`virtualized-row-${entry.studentId}-${index}`}
        className={cn(
          "flex items-center border-b border-gray-100 py-3 px-4",
          isCurrentStudent ? "bg-blue-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
        )}
        style={{
          height: "64px",
        }}
      >
        {/* Rank */}
        <div className="w-16 flex justify-center">
          <div className={cn(
            "flex items-center justify-center h-8 w-8 rounded-full",
            entry.rank <= 3 ? getRankBadgeColor(entry.rank) : ""
          )}>
            {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
          </div>
        </div>

        {/* Student */}
        <div className="flex-1 flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.studentName || 'Student'}`}
              alt={entry.studentName || 'Student'}
            />
            <AvatarFallback>
              {entry.studentName ? entry.studentName.split(" ").map(n => n[0]).join("").toUpperCase() : 'ST'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{entry.studentName || 'Student'}</div>
            {entry.enrollmentNumber && (
              <div className="text-xs text-gray-500">{entry.enrollmentNumber}</div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="w-20 text-center">
          <div className="flex flex-col items-center">
            <span className={cn("text-sm font-bold", getGradeColor(entry.score))}>
              {getGradeLetter(entry.score)}
            </span>
            <span className="text-xs text-gray-500">
              {typeof entry.score === 'number' ? `${entry.score.toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Points (if available) */}
        {entry.rewardPoints !== undefined && (
          <div className="w-20 text-center">
            <span className="text-sm font-medium">{entry.rewardPoints}</span>
          </div>
        )}

        {/* Level (if available) */}
        {entry.level !== undefined && (
          <div className="w-20 text-center">
            <span className="text-sm font-medium">Lvl {entry.level}</span>
          </div>
        )}

        {/* Achievements (if available) */}
        {entry.achievements !== undefined && (
          <div className="w-20 text-center">
            <span className="text-sm font-medium">{entry.achievements}</span>
          </div>
        )}

        {/* Completion */}
        <div className="w-32 hidden md:block">
          <Progress value={entry.score} className="h-2" />
        </div>
      </div>
    );
  }, [currentStudentId]);

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
                <SelectItem value={LeaderboardPeriod.ALL_TIME}>All Time</SelectItem>
                <SelectItem value={LeaderboardPeriod.TERM}>This Term</SelectItem>
                <SelectItem value={LeaderboardPeriod.MONTHLY}>This Month</SelectItem>
                <SelectItem value={LeaderboardPeriod.WEEKLY}>This Week</SelectItem>
                <SelectItem value={LeaderboardPeriod.DAILY}>Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table header */}
        <div className="flex items-center border-b border-gray-200 py-3 px-4 font-medium text-sm text-gray-500">
          <div className="w-16 text-center">Rank</div>
          <div className="flex-1">Student</div>
          <div className="w-20 text-center">Score</div>
          {leaderboard.length > 0 && leaderboard[0].rewardPoints !== undefined && (
            <div className="w-20 text-center">Points</div>
          )}
          {leaderboard.length > 0 && leaderboard[0].level !== undefined && (
            <div className="w-20 text-center">Level</div>
          )}
          {leaderboard.length > 0 && leaderboard[0].achievements !== undefined && (
            <div className="w-20 text-center">Badges</div>
          )}
          <div className="w-32 hidden md:block text-right">Completion</div>
        </div>

        {/* Virtualized table body */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-500">Loading leaderboard data...</p>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="py-20 text-center">
            <TrophyIcon className="mx-auto h-12 w-12 text-gray-300" />
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
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {filteredLeaderboard.length > 0 ? startIndex + 1 : 0} to {endIndex} of {filteredLeaderboard.length} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
