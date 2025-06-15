"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/data-display/card";
import { Award, BookOpen } from "lucide-react";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { AchievementIcons } from "@/components/ui/icons/achievement-icons";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

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

interface SubjectAchievementsProps {
  studentId: string;
  classId: string;
  subjectId: string;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
  animated?: boolean;
  title?: string;
}

export function SubjectAchievements({
  studentId,
  classId,
  subjectId,
  limit = 3,
  showViewAll = true,
  className,
  animated = false,
  title = "Subject Achievements"
}: SubjectAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isVisible, setIsVisible] = useState(animated ? false : true);

  // Fetch achievements using tRPC
  const { data, isLoading, error } = api.achievement.getStudentAchievements.useQuery(
    {
      studentId,
      classId,
      subjectId
    },
    {
      enabled: !!studentId && !!subjectId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      onSuccess: (data) => {
        if (data) {
          // Transform API data to component-expected format
          const adaptedAchievements = data.map(achievement => ({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            type: achievement.type,
            progress: achievement.progress,
            total: achievement.total,
            unlocked: achievement.unlocked,
            unlockedAt: achievement.unlockedAt || undefined,
            icon: achievement.icon || undefined,
            classId: achievement.classId || undefined,
            className: achievement.class?.name,
            subjectId: achievement.subjectId || undefined,
            subjectName: achievement.subject?.name,
            // Check if unlocked in the last 24 hours
            newlyUnlocked: achievement.unlocked && achievement.unlockedAt
              ? (new Date().getTime() - achievement.unlockedAt.getTime()) < 24 * 60 * 60 * 1000
              : false,
          }));
          
          setAchievements(adaptedAchievements);
        }
      }
    }
  );

  // Animation effect
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  // Get icon for achievement type
  const getIconForType = (type: string) => {
    return AchievementIcons[type] || AchievementIcons.default;
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={cn("mt-8", className)}>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full mr-4" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-2 w-full mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If error or no achievements, show empty state
  if (error || !achievements || achievements.length === 0) {
    return (
      <div className={cn("mt-8", className)}>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          {title}
        </h2>
        <Card className="overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No Subject Achievements Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Complete activities in this subject to earn achievements
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort achievements: unlocked first, then by progress percentage for in-progress ones
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? -1 : 1;
    }
    
    const aProgress = a.progress / a.total;
    const bProgress = b.progress / b.total;
    return bProgress - aProgress;
  });

  // Render achievements
  return (
    <div className={cn("mt-8", className, animated && !isVisible ? "opacity-0" : "opacity-100 transition-opacity duration-500")}>
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Award className="h-5 w-5 mr-2 text-primary" />
        {title}
      </h2>

      <div className="space-y-4">
        {sortedAchievements.slice(0, limit).map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={animated ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    {getIconForType(achievement.type)}
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{achievement.title}</h3>
                      {achievement.unlocked && (
                        <span className="text-xs text-green-600 font-medium flex items-center">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress: {achievement.progress}/{achievement.total}</span>
                        <span>{Math.round((achievement.progress / achievement.total) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(achievement.progress / achievement.total) * 100} 
                        className="h-1"
                        indicatorClassName={achievement.unlocked ? "bg-green-500" : undefined}
                      />
                    </div>
                    
                    {achievement.unlockedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {achievement.newlyUnlocked 
                          ? "Recently unlocked!" 
                          : `Unlocked on ${new Date(achievement.unlockedAt).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {showViewAll && achievements.length > 0 && (
        <div className="mt-4 text-center">
          <Button variant="outline" asChild>
            <Link href={`/student/class/${classId}/profile`}>
              View All Achievements
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
