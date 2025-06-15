"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/feedback/toast";
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  RefreshCcw,
  Lock,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TeacherAchievementsViewProps {
  teacherId: string;
  classId?: string;
}

/**
 * TeacherAchievementsView Component
 *
 * Displays achievements for a specific teacher with progress tracking.
 * Supports mobile-first design with responsive layout.
 */
export function TeacherAchievementsView({
  teacherId,
  classId
}: TeacherAchievementsViewProps) {
  // State
  const [activeTab, setActiveTab] = useState<"all" | "unlocked" | "locked">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Fetch teacher achievements
  const { data, isLoading, refetch } = api.teacherLeaderboard.getTeacherAchievements.useQuery(
    {
      teacherId,
      classId,
      includeUnlocked: activeTab === "all" || activeTab === "unlocked",
      includeLocked: activeTab === "all" || activeTab === "locked",
    },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load teacher achievements",
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
      description: "Teacher achievements have been updated",
      variant: "success",
    });
  };

  // Get icon component based on achievement type
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "performance":
        return <Award className="h-5 w-5" />;
      case "activity_creation":
        return <BookOpen className="h-5 w-5" />;
      case "attendance":
        return <Calendar className="h-5 w-5" />;
      case "feedback":
        return <MessageCircle className="h-5 w-5" />;
      case "class":
        return <Users className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  // Get badge color based on achievement type
  const getAchievementBadgeColor = (type: string) => {
    switch (type) {
      case "performance":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "activity_creation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "attendance":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "feedback":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "class":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Teacher Achievements</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
            <TabsTrigger value="locked">In Progress</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-full mb-3" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No achievements found.
              </div>
            ) : (
              <div className="space-y-4">
                {data.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={cn(
                      "p-4 border rounded-lg transition-all",
                      achievement.unlocked
                        ? "bg-muted/30 border-primary/20"
                        : "hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-full",
                        achievement.unlocked
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {getAchievementIcon(achievement.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", getAchievementBadgeColor(achievement.type))}
                          >
                            {achievement.type.replace("_", " ")}
                          </Badge>
                          {achievement.unlocked && (
                            <Badge variant="outline" className="ml-auto text-xs gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Unlocked {achievement.unlockedAt && format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        {!achievement.unlocked && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progress</span>
                              <span>{achievement.progress} / {achievement.total}</span>
                            </div>
                            <Progress
                              value={(achievement.progress / achievement.total) * 100}
                              className="h-1.5"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
