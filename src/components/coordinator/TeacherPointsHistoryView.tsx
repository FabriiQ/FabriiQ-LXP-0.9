"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/feedback/toast";
import {
  Search,
  BarChart as RefreshCcw,
  Filter,
  BookOpen,
  MessageCircle,
  Calendar,
  Users,
  Award,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TeacherPointsHistoryViewProps {
  teacherId: string;
  classId?: string;
  subjectId?: string;
}

/**
 * TeacherPointsHistoryView Component
 *
 * Displays points history for a specific teacher with filtering options.
 * Supports mobile-first design with responsive layout.
 */
export function TeacherPointsHistoryView({
  teacherId,
  classId,
  subjectId
}: TeacherPointsHistoryViewProps) {
  // State
  const [source, setSource] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Fetch teacher points history
  const { data, isLoading, refetch } = api.teacherLeaderboard.getTeacherPointsHistory.useQuery(
    {
      teacherId,
      classId,
      subjectId,
      source,
      startDate,
      endDate,
      limit,
      offset,
    },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load points history",
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
      description: "Points history has been updated",
      variant: "success",
    });
  };

  // Filter points history based on search query
  const filteredHistory = data?.history.filter(point =>
    point.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.subjectName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get icon component based on point source
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "activity_creation":
        return <BookOpen className="h-4 w-4" />;
      case "feedback":
        return <MessageCircle className="h-4 w-4" />;
      case "attendance":
        return <Calendar className="h-4 w-4" />;
      case "student_performance":
        return <Users className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  // Get badge color based on point source
  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "activity_creation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "feedback":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "attendance":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "student_performance":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Points History</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <div className="px-4 py-3 border-b">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search points..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Source</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sources</SelectItem>
                  <SelectItem value="activity_creation">Activity Creation</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="student_performance">Student Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                className="h-8"
              />
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 border-b last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No points history found. Try adjusting your filters.
          </div>
        ) : (
          <div className="divide-y">
            {filteredHistory.map((point) => (
              <div
                key={point.id}
                className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full bg-muted",
                  getSourceBadgeColor(point.source)
                )}>
                  {getSourceIcon(point.source)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{point.description}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className={cn("text-xs", getSourceBadgeColor(point.source))}>
                        {point.source.replace("_", " ")}
                      </Badge>
                    </span>
                    {point.className && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {point.className}
                      </span>
                    )}
                    {point.subjectName && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {point.subjectName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(point.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary flex items-center">
                    <Plus className="h-3 w-3" />
                    {point.amount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    points
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
