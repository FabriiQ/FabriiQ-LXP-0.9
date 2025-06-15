/**
 * @deprecated This component has been replaced by VirtualizedLeaderboardTable in src/features/leaderboard/components/VirtualizedLeaderboardTable.tsx
 * This file is kept for reference only and will be removed in a future update.
 */

"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { Award, Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Trophy, Medal, Minus } from "@/components/ui/icons/reward-icons";
import { cn } from "@/lib/utils";
import { LeaderboardPeriod } from "@/server/api/types/leaderboard";

export interface EnhancedLeaderboardEntry {
  rank: number;
  studentId: string;
  studentName?: string;
  enrollmentNumber?: string;
  score: number;
  totalPoints?: number;
  completionRate?: number;
  level?: number;
  achievements?: number;
  rewardPoints?: number;
  previousRank?: number;
}

export interface EnhancedLeaderboardTableProps {
  leaderboard: EnhancedLeaderboardEntry[];
  currentStudentId?: string;
  title?: string;
  description?: string;
  totalStudents: number;
  currentPeriod: LeaderboardPeriod;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  isLoading?: boolean;
  limit?: number;
  showPagination?: boolean;
  className?: string;
}

/**
 * EnhancedLeaderboardTable component displays a table of student rankings
 * with support for reward system data (points, levels, achievements)
 */
export function EnhancedLeaderboardTable({
  leaderboard,
  currentStudentId,
  title = "Leaderboard",
  description = "Student rankings based on performance",
  totalStudents,
  currentPeriod,
  onPeriodChange,
  isLoading = false,
  limit = 10,
  showPagination = false,
  className,
}: EnhancedLeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Filter leaderboard by search query
  const filteredLeaderboard = leaderboard.filter(
    (entry) =>
      !searchQuery ||
      (entry.studentName &&
        entry.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.enrollmentNumber &&
        entry.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredLeaderboard.length / limit);

  // Get current page data
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const currentPageData = filteredLeaderboard.slice(startIndex, endIndex);

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

  // Get rank change indicator
  const getRankChangeIndicator = (current: number, previous?: number) => {
    if (!previous) return <Minus className="h-4 w-4 text-gray-400" />;
    if (previous > current)
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (previous < current)
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Get medal for top ranks
  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Trophy className="h-3 w-3 mr-1" />
            1st
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-gray-400 hover:bg-gray-500">
            <Medal className="h-3 w-3 mr-1" />
            2nd
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-amber-700 hover:bg-amber-800">
            <Award className="h-3 w-3 mr-1" />
            3rd
          </Badge>
        );
      default:
        return <span className="text-gray-500">{rank}th</span>;
    }
  };

  // Get level badge color
  const getLevelBadgeColor = (level?: number) => {
    if (!level) return "bg-gray-200 text-gray-700";
    if (level >= 20) return "bg-purple-100 text-purple-800 border-purple-300";
    if (level >= 15) return "bg-indigo-100 text-indigo-800 border-indigo-300";
    if (level >= 10) return "bg-blue-100 text-blue-800 border-blue-300";
    if (level >= 5) return "bg-teal-100 text-teal-800 border-teal-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Skeleton className="h-10 w-full md:w-64" />
            <Skeleton className="h-10 w-full md:w-48" />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">
                    <Skeleton className="h-4 w-12" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-32" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-10" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {/* Search and Period Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {onPeriodChange && (
            <Select value={currentPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeaderboardPeriod.ALL_TIME}>All Time</SelectItem>
                <SelectItem value={LeaderboardPeriod.CURRENT_TERM}>Current Term</SelectItem>
                <SelectItem value={LeaderboardPeriod.CURRENT_MONTH}>Current Month</SelectItem>
                <SelectItem value={LeaderboardPeriod.CURRENT_WEEK}>Current Week</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Level</TableHead>
                {leaderboard.some((entry) => entry.achievements !== undefined) && (
                  <TableHead className="text-right">Achievements</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                currentPageData.map((entry, index) => (
                  <TableRow
                    key={`enhanced-leaderboard-${entry.studentId}-${index}`}
                    className={cn(
                      entry.studentId === currentStudentId && "bg-muted/50"
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {getRankChangeIndicator(entry.rank, entry.previousRank)}
                        {getMedal(entry.rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.studentName || "Student"}`}
                            alt={entry.studentName || "Student"}
                          />
                          <AvatarFallback>
                            {entry.studentName
                              ? entry.studentName.charAt(0)
                              : "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {entry.studentName || "Student"}
                          </p>
                          {entry.enrollmentNumber && (
                            <p className="text-xs text-muted-foreground">
                              {entry.enrollmentNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {typeof entry.score === 'number'
                          ? Math.round(entry.score)
                          : entry.score}
                        {entry.score <= 100 && "%"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {entry.rewardPoints || entry.totalPoints || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.level ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-semibold",
                            getLevelBadgeColor(entry.level)
                          )}
                        >
                          Lvl {entry.level}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {leaderboard.some((entry) => entry.achievements !== undefined) && (
                      <TableCell className="text-right">
                        {entry.achievements !== undefined ? (
                          <span className="font-medium">{entry.achievements}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredLeaderboard.length)} of {filteredLeaderboard.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages}
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
