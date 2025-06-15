"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy } from "@/components/ui/icons/trophy-medal";
import { Share2 } from "@/components/shared/entities/students/icons";
import { AchievementIcons } from "@/components/ui/icons/achievement-icons";
import { cn } from "@/lib/utils";

export interface AchievementBadgeProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  progress: number;
  total: number;
  unlocked: boolean;
  newlyUnlocked?: boolean;
  colors?: {
    unlocked: string;
    locked: string;
    progress: string;
  };
  className?: string;
  onClick?: () => void;
  onShare?: () => void;
  showShareButton?: boolean;
}

export function AchievementBadge({
  title,
  description,
  icon,
  progress,
  total,
  unlocked,
  newlyUnlocked = false,
  colors = {
    unlocked: "#1F504B", // Primary Green
    locked: "#757575", // Dark Gray
    progress: "#5A8A84", // Medium Teal
  },
  className,
  onClick,
  onShare,
  showShareButton = false,
}: AchievementBadgeProps) {
  const [showNewBadge, setShowNewBadge] = useState(newlyUnlocked);

  // Auto-hide the "New" badge after 5 seconds
  useEffect(() => {
    if (newlyUnlocked) {
      const timer = setTimeout(() => {
        setShowNewBadge(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newlyUnlocked]);

  // Calculate progress percentage
  const progressPercentage = Math.min(Math.round((progress / total) * 100), 100);

  // Default icon if none provided
  const defaultIcon = unlocked ? <Trophy size={24} /> : AchievementIcons.lock;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative",
        className
      )}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden border",
        unlocked
          ? "bg-gradient-to-br from-green-50 to-teal-100 border-teal-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          : "bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors duration-200"
      )}>
        <CardContent className="p-4">
          {/* New badge */}
          <AnimatePresence>
            {showNewBadge && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: [0, 1.2, 1], rotate: [0, 10, 0] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center z-10"
              >
                New
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-3">
            {/* Icon with micro-interaction */}
            <motion.div
              className={cn(
                "rounded-full p-2 flex items-center justify-center",
                unlocked
                  ? "bg-teal-600 text-white"
                  : "bg-gray-300 text-gray-600"
              )}
              whileHover={{ rotate: unlocked ? [0, -5, 5, 0] : 0 }}
              animate={unlocked ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3, repeat: 0 }}
            >
              {icon || defaultIcon}
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{title}</h4>
                <div className="flex items-center gap-2">
                  {unlocked && (
                    <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-200">
                      Unlocked
                    </Badge>
                  )}
                  {showShareButton && unlocked && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-teal-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare?.();
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                      <span className="sr-only">Share</span>
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{description}</p>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>{progress} of {total}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.1,
                      ease: "easeOut"
                    }}
                    className={cn(
                      "h-full relative",
                      unlocked ? "bg-teal-600" : "bg-blue-500"
                    )}
                  >
                    {/* Shimmer effect for progress bar */}
                    {unlocked && (
                      <motion.div
                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                        animate={{
                          x: ["0%", "100%"],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "linear",
                          repeatDelay: 0.5,
                        }}
                      />
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
