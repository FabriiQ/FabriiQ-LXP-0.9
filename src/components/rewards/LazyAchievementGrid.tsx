"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { AchievementBadge } from "./AchievementBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";

// Import icons from a custom icons file to avoid lucide-react issues
import { AchievementIcons } from "@/components/ui/icons/achievement-icons";

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
  newlyUnlocked?: boolean;
}

export interface LazyAchievementGridProps {
  achievements: Achievement[];
  loading?: boolean;
  onAchievementClick?: (achievement: Achievement) => void;
  onAchievementShare?: (achievement: Achievement) => void;
  className?: string;
  batchSize?: number;
  showShareButtons?: boolean;
}

export function LazyAchievementGrid({
  achievements,
  loading = false,
  onAchievementClick,
  onAchievementShare,
  className,
  batchSize = 9,
  showShareButtons = false,
}: LazyAchievementGridProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const gridRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for lazy loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Get unique achievement types
  const types = Array.from(new Set(achievements.map(a => a.type)));

  // Filter achievements based on active tab and search query
  const filteredAchievements = achievements.filter(achievement => {
    const matchesTab = activeTab === "all" || achievement.type === activeTab;
    const matchesSearch =
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Sort achievements: unlocked first, then by progress percentage
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? -1 : 1;
    }

    const aProgress = a.progress / a.total;
    const bProgress = b.progress / b.total;
    return bProgress - aProgress;
  });

  // Get visible achievements
  const visibleAchievements = sortedAchievements.slice(0, visibleCount);

  // Load more achievements when the load more trigger is in view
  useEffect(() => {
    if (inView && visibleCount < sortedAchievements.length) {
      setVisibleCount(prev => Math.min(prev + batchSize, sortedAchievements.length));
    }
  }, [inView, sortedAchievements.length, visibleCount, batchSize]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [activeTab, searchQuery, batchSize]);

  // Get icon for achievement type
  const getIconForType = useCallback((type: string) => {
    return AchievementIcons[type] || AchievementIcons.default;
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (achievements.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        {AchievementIcons.empty}
        <h3 className="text-lg font-medium text-gray-700 mt-4">No Achievements Yet</h3>
        <p className="text-sm text-gray-500 mt-2">
          Complete activities and challenges to earn achievements!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {types.map(type => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Input
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {filteredAchievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          {AchievementIcons.empty}
          <h3 className="text-lg font-medium text-gray-700 mt-4">No Matching Achievements</h3>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div ref={gridRef}>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {visibleAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.05, 0.5) // Cap the delay at 0.5s for better performance
                }}
              >
                <AchievementBadge
                  title={achievement.title}
                  description={achievement.description}
                  icon={getIconForType(achievement.type)}
                  progress={achievement.progress}
                  total={achievement.total}
                  unlocked={achievement.unlocked}
                  newlyUnlocked={achievement.newlyUnlocked}
                  onClick={() => onAchievementClick?.(achievement)}
                  onShare={() => onAchievementShare?.(achievement)}
                  showShareButton={showShareButtons}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Load more trigger */}
          {visibleCount < sortedAchievements.length && (
            <div
              ref={loadMoreRef}
              className="h-20 flex items-center justify-center mt-4"
            >
              <div className="animate-pulse text-gray-400">Loading more achievements...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
