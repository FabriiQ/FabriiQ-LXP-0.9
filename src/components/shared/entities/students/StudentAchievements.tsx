"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "@/components/rewards/AchievementBadge";
import { LazyAchievementGrid } from "@/components/rewards/LazyAchievementGrid";
import { Award, Filter, Search, BookOpen } from "lucide-react";
import { Trophy, Medal, Star, Zap, Target, Crown } from "@/components/ui/icons/reward-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback/skeleton";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: Date;
  icon?: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;
  newlyUnlocked?: boolean;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  byType: Record<string, { total: number; unlocked: number }>;
}

export interface StudentAchievementsProps {
  studentId: string;
  achievements: Achievement[];
  stats: AchievementStats;
  classes?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

// Map achievement types to icons
const typeIcons: Record<string, React.ReactNode> = {
  class: <BookOpen size={20} />,
  subject: <Target size={20} />,
  login: <Zap size={20} />,
  streak: <Zap size={20} />,
  milestone: <Trophy size={20} />,
  special: <Crown size={20} />,
  grade: <Medal size={20} />,
  activity: <Star size={20} />,
  "class-completion": <BookOpen size={20} />,
  "subject-completion": <Target size={20} />,
  "perfect-score": <Star size={20} />,
  "high-achiever": <Award size={20} />,
  "activity-count": <Star size={20} />,
  "class-activity-count": <BookOpen size={20} />,
  "subject-activity-count": <Target size={20} />,
  "activity-type": <Star size={20} />,
  onboarding: <Zap size={20} />,
  points: <Trophy size={20} />,
  level: <Crown size={20} />,
};

/**
 * StudentAchievements component displays a student's achievements with filtering and sorting options
 */
export function StudentAchievements({
  studentId,
  achievements,
  stats,
  classes = [],
  subjects = [],
  isLoading = false,
  onAchievementClick,
  className,
}: StudentAchievementsProps) {
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Get unique achievement types
  const achievementTypes = Array.from(
    new Set(achievements.map((achievement) => achievement.type))
  );

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    // Search query filter
    if (
      searchQuery &&
      !achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Type filter
    if (typeFilter !== "all" && achievement.type !== typeFilter) {
      return false;
    }

    // Status filter
    if (
      statusFilter === "unlocked" && !achievement.unlocked ||
      statusFilter === "locked" && achievement.unlocked
    ) {
      return false;
    }

    // Class filter
    if (classFilter !== "all" && achievement.classId !== classFilter) {
      return false;
    }

    // Subject filter
    if (subjectFilter !== "all" && achievement.subjectId !== subjectFilter) {
      return false;
    }

    return true;
  });

  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        // Sort by unlock date (most recent first) and then by progress
        if (a.unlocked && b.unlocked) {
          return new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime();
        } else if (a.unlocked) {
          return -1;
        } else if (b.unlocked) {
          return 1;
        } else {
          return (b.progress / b.total) - (a.progress / a.total);
        }
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "progress":
        // Sort by progress percentage
        return (b.progress / b.total) - (a.progress / a.total);
      case "type":
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 w-full md:w-64" />
          <Skeleton className="h-10 w-full md:w-48" />
          <Skeleton className="h-10 w-full md:w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Achievements</h2>
          <p className="text-muted-foreground">
            Track your progress and unlock new achievements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm font-medium">
            {stats.unlocked} / {stats.total} Unlocked
          </Badge>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Total Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Medal className="h-4 w-4 text-emerald-500" />
              Unlocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unlocked}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.unlocked / stats.total) * 100)}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total - stats.unlocked}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Achievements to unlock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search achievements..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unlocked">Unlocked</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Achievement Categories */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 w-full flex flex-wrap h-auto">
          <TabsTrigger value="all" className="flex-grow">All</TabsTrigger>
          {achievementTypes.length > 0 && achievementTypes.map((type) => (
            <TabsTrigger
              key={type}
              value={type}
              className="flex-grow flex items-center gap-1"
              onClick={() => setTypeFilter(type)}
            >
              {typeIcons[type] || <Trophy size={16} />}
              <span className="capitalize">
                {type.split('-').join(' ')}
              </span>
              <Badge variant="outline" className="ml-1 text-xs">
                {stats.byType[type]?.unlocked || 0}/{stats.byType[type]?.total || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <LazyAchievementGrid
            achievements={sortedAchievements}
            onAchievementClick={onAchievementClick}
          />
        </TabsContent>

        {achievementTypes.length > 0 && achievementTypes.map((type) => (
          <TabsContent key={type} value={type}>
            <LazyAchievementGrid
              achievements={achievements.filter(a => a.type === type)}
              onAchievementClick={onAchievementClick}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Class and Subject Filters (if available) */}
      {(classes.length > 0 || subjects.length > 0) && (
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-semibold">Filter by Context</h3>
          <div className="flex flex-col md:flex-row gap-4">
            {classes.length > 0 && (
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {subjects.length > 0 && (
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {/* No results message */}
      {filteredAchievements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No Matching Achievements</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Try adjusting your search or filter criteria to find achievements.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
              setClassFilter("all");
              setSubjectFilter("all");
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
