"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/feedback/toast";
import {
  ChevronUp,
  ChevronDown,
  ArrowRight as Minus,
  Search,
  Calendar,
  Award,
  BookOpen,
  Clock,
  Users,
  BarChart,
  RotateCw,
  Filter,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherLeaderboardViewProps {
  courseId?: string;
  classId?: string;
  programId?: string;
  campusId?: string;
}

/**
 * TeacherLeaderboardView Component
 *
 * Displays a leaderboard of teachers with various filtering and sorting options.
 * Supports mobile-first design with responsive layout.
 */
export function TeacherLeaderboardView({
  courseId,
  classId,
  programId,
  campusId
}: TeacherLeaderboardViewProps) {
  // State
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "term" | "all">("all");
  const [sortBy, setSortBy] = useState<"points" | "activityCreation" | "studentPerformance" | "attendance" | "feedback">("points");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTransparency, setShowTransparency] = useState(false);
  const { toast } = useToast();

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Fetch teacher leaderboard data
  const { data, isLoading, refetch } = api.teacherLeaderboard.getTeacherLeaderboard.useQuery(
    {
      courseId,
      classId,
      programId,
      campusId,
      timeframe,
      limit,
      offset,
      sortBy,
    },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load teacher leaderboard",
          variant: "error",
        });
      },
    }
  );

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Teacher leaderboard data has been updated",
      variant: "success",
    });
  };

  // Define the teacher type
  interface Teacher {
    position: number;
    teacherId: string;
    name: string;
    avatar: null | string;
    points: number;
    classCount: number;
    rankChange?: number;
    metrics: {
      studentPerformance: number;
      attendanceRate: number;
      feedbackTime: number;
      activityCreation: number;
      activityEngagement: number;
      classPerformance: number;
      overallRating: number;
    };
  }

  // Filter leaderboard data based on search query
  const filteredLeaderboard = (data?.leaderboard.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []) as Teacher[];

  // Get metric label based on sort option
  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "points": return "Points";
      case "activityCreation": return "Activities";
      case "studentPerformance": return "Student Perf.";
      case "attendance": return "Attendance";
      case "feedback": return "Feedback Time";
      default: return "Points";
    }
  };

  // Get metric value based on sort option
  const getMetricValue = (teacher: Teacher, metric: string) => {
    switch (metric) {
      case "points": return teacher.points;
      case "activityCreation": return teacher.metrics.activityCreation;
      case "studentPerformance": return `${teacher.metrics.studentPerformance}%`;
      case "attendance": return `${teacher.metrics.attendanceRate}%`;
      case "feedback": return `${teacher.metrics.feedbackTime}h`;
      default: return teacher.points;
    }
  };

  // Render rank change indicator
  const renderRankChange = (rankChange?: number) => {
    if (!rankChange) return <Minus className="h-4 w-4 text-gray-400" />;
    if (rankChange > 0) return <ChevronUp className="h-4 w-4 text-green-500" />;
    if (rankChange < 0) return <ChevronDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-muted/50 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-xl">Teacher Leaderboard</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransparency(!showTransparency)}
              className="h-8"
            >
              <Info className="h-4 w-4 mr-1" />
              How Points Work
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <div className="px-4 py-2 bg-muted/30 border-b">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="term">Term</SelectItem>
                  <SelectItem value="all">All-time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-8 w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="activityCreation">Activities</SelectItem>
                  <SelectItem value="studentPerformance">Student Perf.</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="feedback">Feedback Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {showTransparency && (
        <div className="px-4 py-3 bg-muted/30 border-b">
          <h3 className="font-medium text-sm mb-2 flex items-center">
            <Info className="h-4 w-4 mr-1 text-blue-500" />
            How Teacher Points Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">Point Sources</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-blue-500" />
                  <span>Lesson Plan Creation: 10-50 points</span>
                </li>
                <li className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-amber-500" />
                  <span>Activity Creation: 5-30 points</span>
                </li>
                <li className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-green-500" />
                  <span>Feedback Timeliness: 1-20 points</span>
                </li>
                <li className="flex items-center gap-1">
                  <BarChart className="h-3 w-3 text-purple-500" />
                  <span>Class Performance: 0-100 points</span>
                </li>
                <li className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-red-500" />
                  <span>Attendance: 0-10 points per day</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Leaderboard Calculation</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Points are calculated based on the selected timeframe</li>
                <li>• Rankings are updated in real-time as points are awarded</li>
                <li>• Coordinators can award bonus points for exceptional work</li>
                <li>• Rank changes show movement since the previous period</li>
                <li>• Metrics are updated daily based on teacher activity</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No teachers found. Try adjusting your filters.
          </div>
        ) : (
          <div className="divide-y">
            {filteredLeaderboard.map((teacher) => (
              <div
                key={teacher.teacherId}
                className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-center w-6 font-medium">
                  {teacher.position}
                </div>
                <div className="flex items-center gap-1">
                  {renderRankChange(teacher.rankChange || undefined)}
                </div>
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={teacher.avatar || ""} alt={teacher.name} />
                  <AvatarFallback>
                    {teacher.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{teacher.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {teacher.classCount} {teacher.classCount === 1 ? "class" : "classes"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {getMetricValue(teacher, sortBy)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getMetricLabel(sortBy)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination && (
          <div className="p-3 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {offset + 1}-{Math.min(offset + limit, data.pagination.total)} of {data.pagination.total}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasMore}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
