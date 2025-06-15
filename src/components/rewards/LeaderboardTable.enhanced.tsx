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
import { LeaderboardPeriod } from "@/server/api/types/leaderboard";
import { Trophy, Medal, Award, Star, ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EnhancedLeaderboardEntry {
  rank?: number;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  score: number;
  totalPoints: number;
  totalMaxPoints: number;
  completionRate: number;
  totalActivities: number;
  completedActivities: number;
  improvement?: number;
  previousScore?: number;
  improvementRank?: number;
  rewardPoints?: number; // New field for reward points
  level?: number; // New field for student level
}

interface EnhancedLeaderboardTableProps {
  title: string;
  description?: string;
  leaderboard: EnhancedLeaderboardEntry[];
  totalStudents: number;
  currentPeriod: LeaderboardPeriod;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  isLoading?: boolean;
  limit?: number;
  showPagination?: boolean;
  className?: string;
}

export function EnhancedLeaderboardTable({
  title,
  description,
  leaderboard,
  totalStudents,
  currentPeriod,
  onPeriodChange,
  isLoading = false,
  limit = 10,
  showPagination = false,
  className,
}: EnhancedLeaderboardTableProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'rank' | 'rewardPoints' | 'level' | 'improvement'>('rank');

  // Calculate total pages
  const totalPages = Math.ceil(totalStudents / limit);
  
  // Sort leaderboard based on selected criteria
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (sortBy) {
      case 'rewardPoints':
        return (b.rewardPoints || 0) - (a.rewardPoints || 0);
      case 'level':
        return (b.level || 0) - (a.level || 0);
      case 'improvement':
        return (b.improvement || 0) - (a.improvement || 0);
      case 'rank':
      default:
        return (a.rank || 0) - (b.rank || 0);
    }
  });

  // Get rank icon based on position
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
    return null;
  };

  // Get level badge color based on level
  const getLevelBadgeColor = (level: number = 1) => {
    if (level >= 20) return "bg-purple-100 text-purple-800 border-purple-200";
    if (level >= 15) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (level >= 10) return "bg-blue-100 text-blue-800 border-blue-200";
    if (level >= 5) return "bg-teal-100 text-teal-800 border-teal-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="animate-pulse bg-gray-200 h-6 w-1/3 rounded"></CardTitle>
          <CardDescription className="animate-pulse bg-gray-200 h-4 w-1/2 rounded"></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
            </div>
            <div className="border rounded-md">
              <div className="h-10 border-b bg-gray-50"></div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 border-b animate-pulse bg-gray-100"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="rewardPoints">Reward Points</SelectItem>
                <SelectItem value="level">Level</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currentPeriod}
              onValueChange={(value) => onPeriodChange?.(value as LeaderboardPeriod)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeaderboardPeriod.DAILY}>Daily</SelectItem>
                <SelectItem value={LeaderboardPeriod.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={LeaderboardPeriod.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={LeaderboardPeriod.TERM}>Term</SelectItem>
                <SelectItem value={LeaderboardPeriod.ALL_TIME}>All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <Coins className="h-4 w-4" />
                      <span>Points</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">Level</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No data available for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLeaderboard.map((entry) => (
                    <TableRow key={entry.studentId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getRankIcon(entry.rank || 0)}
                          <span className={cn(
                            "ml-1",
                            (entry.rank || 0) <= 3 ? "font-bold" : ""
                          )}>
                            {entry.rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.studentName}`} />
                            <AvatarFallback>{entry.studentName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{entry.studentName}</div>
                            <div className="text-xs text-gray-500">{entry.enrollmentNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{Math.round(entry.score)}%</div>
                        {entry.improvement !== undefined && (
                          <div className={cn(
                            "text-xs",
                            entry.improvement > 0 ? "text-green-600" : 
                            entry.improvement < 0 ? "text-red-600" : "text-gray-500"
                          )}>
                            {entry.improvement > 0 ? "+" : ""}
                            {Math.round(entry.improvement)}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <div className="font-medium">{entry.rewardPoints || 0}</div>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <Badge variant="outline" className={cn(
                          getLevelBadgeColor(entry.level)
                        )}>
                          Level {entry.level || 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={entry.completionRate} className="h-2 w-24" />
                          <span className="text-xs w-10 text-right">{Math.round(entry.completionRate)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {showPagination && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, totalStudents)} of {totalStudents}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
