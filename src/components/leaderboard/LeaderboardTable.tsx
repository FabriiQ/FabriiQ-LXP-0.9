/**
 * @deprecated This component has been replaced by BaseLeaderboardTable in src/features/leaderboard/components/BaseLeaderboardTable.tsx
 * This file is kept for reference only and will be removed in a future update.
 */

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { LeaderboardEntry, LeaderboardPeriod } from "@/server/api/types/leaderboard";
import { Trophy, Medal, Award, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  title: string;
  description?: string;
  leaderboard: LeaderboardEntry[];
  totalStudents: number;
  currentPeriod: LeaderboardPeriod;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  isLoading?: boolean;
  limit?: number;
  showPagination?: boolean;
}

export function LeaderboardTable({
  title,
  description,
  leaderboard,
  totalStudents,
  currentPeriod,
  onPeriodChange,
  isLoading = false,
  limit = 10,
  showPagination = false,
}: LeaderboardTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(leaderboard.length / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const currentPageData = leaderboard.slice(startIndex, endIndex);

  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      onPeriodChange(value as LeaderboardPeriod);
    }
  };

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

  // Function to get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="font-semibold">{rank}</span>;
    }
  };

  // Function to get rank badge color
  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-300";
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Function to get grade letter
  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  // Function to get grade color
  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onPeriodChange && (
          <Select value={currentPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No data available for the selected period.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-24 text-center">Score</TableHead>
                    <TableHead className="hidden md:table-cell">Progress</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageData.map((entry, index) => (
                    <TableRow key={`leaderboard-entry-${entry.studentId}-${index}`}>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {entry.rank && entry.rank <= 3 ? (
                            <div className={cn("flex items-center justify-center h-8 w-8 rounded-full border", getRankBadgeColor(entry.rank))}>
                              {getRankIcon(entry.rank)}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-8 w-8">
                              {entry.rank || index + 1}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {entry.studentName ? entry.studentName.split(" ").map(n => n[0]).join("").toUpperCase() : 'ST'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{entry.studentName || 'Student'}</div>
                            <div className="text-xs text-muted-foreground">{entry.enrollmentNumber || ''}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn("text-lg font-bold", getGradeColor(entry.score))}>
                            {getGradeLetter(entry.score)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {typeof entry.score === 'number' ? `${entry.score.toFixed(1)}%` : '0%'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Progress value={entry.score} className="h-2" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        <Badge variant="outline">
                          {entry.completedActivities || 0} / {entry.totalActivities || 0} activities
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {showPagination && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, leaderboard.length)} of {leaderboard.length} students
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
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
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
