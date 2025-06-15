"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, Trophy, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LevelProgressProps {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  className?: string;
  showLevelUpAnimation?: boolean;
  previousLevel?: number;
}

export function LevelProgress({
  level,
  currentExp,
  nextLevelExp,
  className,
  showLevelUpAnimation = false,
  previousLevel,
}: LevelProgressProps) {
  const [showAnimation, setShowAnimation] = useState(showLevelUpAnimation && previousLevel !== undefined);

  // Auto-hide the level up animation after 5 seconds
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  // Calculate progress percentage
  const progressPercentage = Math.round((currentExp / nextLevelExp) * 100);
  
  // Determine level color based on level
  const getLevelColor = (level: number) => {
    if (level >= 20) return "from-purple-600 to-indigo-700"; // Legendary
    if (level >= 15) return "from-indigo-600 to-blue-700"; // Epic
    if (level >= 10) return "from-blue-600 to-cyan-700"; // Rare
    if (level >= 5) return "from-teal-600 to-green-700"; // Uncommon
    return "from-green-600 to-teal-700"; // Common
  };

  // Get level title based on level
  const getLevelTitle = (level: number) => {
    if (level >= 20) return "Legendary";
    if (level >= 15) return "Epic";
    if (level >= 10) return "Rare";
    if (level >= 5) return "Uncommon";
    return "Beginner";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn(
        "bg-gradient-to-r text-white pb-2",
        getLevelColor(level)
      )}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Level {level}
          </CardTitle>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            {getLevelTitle(level)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 relative">
        {/* Level up animation */}
        <AnimatePresence>
          {showAnimation && previousLevel !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 rounded-b-lg"
            >
              <motion.div
                className="flex flex-col items-center text-white"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Sparkles className="h-10 w-10 text-yellow-400 mb-2" />
                <h3 className="text-xl font-bold">Level Up!</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-300">Level {previousLevel}</span>
                  <ArrowUp className="h-4 w-4 text-green-400" />
                  <span className="text-white font-bold">Level {level}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Experience</span>
            </div>
            <div className="text-sm font-medium">
              {currentExp} / {nextLevelExp}
            </div>
          </div>

          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Current</span>
              <span>{progressPercentage}% to Level {level + 1}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            <p>Complete activities and earn points to level up!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
