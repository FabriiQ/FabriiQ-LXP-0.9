"use client";

import { useState, useEffect, ReactNode } from "react";
import { AchievementNotification } from "@/components/rewards/AchievementNotification";
import { PointsAnimation } from "@/components/rewards/PointsAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  type?: string;
  icon?: string;
}

export interface RewardResult {
  points: number;
  levelUp?: boolean;
  newLevel?: number;
  achievements?: Achievement[];
}

export interface ActivityCompletionHandlerProps {
  children: ReactNode;
  onComplete?: (data: any) => void;
  rewardResult?: RewardResult | null;
}

export function ActivityCompletionHandler({
  children,
  onComplete,
  rewardResult,
}: ActivityCompletionHandlerProps) {
  const [showPoints, setShowPoints] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [completionData, setCompletionData] = useState<any>(null);

  // Process reward results when they become available
  useEffect(() => {
    if (rewardResult) {
      // Show points animation first
      if (rewardResult.points > 0) {
        setShowPoints(true);
      }

      // Queue up achievements
      if (rewardResult.achievements && rewardResult.achievements.length > 0) {
        setAchievementQueue(rewardResult.achievements);
      }

      // Store level up info for later
      if (rewardResult.levelUp && rewardResult.newLevel) {
        setShowLevelUp(true);
      }

      // Store completion data
      setCompletionData(rewardResult);
    }
  }, [rewardResult]);

  // Handle points animation completion
  const handlePointsComplete = () => {
    setShowPoints(false);

    // Show level up notification next if available
    if (showLevelUp) {
      setTimeout(() => {
        showLevelUpNotification();
      }, 500);
    }
    // Otherwise show achievements if available
    else if (achievementQueue.length > 0) {
      setTimeout(() => {
        showNextAchievement();
      }, 500);
    }
    // Otherwise complete the process
    else {
      finalizeCompletion();
    }
  };

  // Show level up notification
  const showLevelUpNotification = () => {
    // Level up notification will auto-close after 5 seconds
    setTimeout(() => {
      setShowLevelUp(false);

      // Show achievements next if available
      if (achievementQueue.length > 0) {
        setTimeout(() => {
          showNextAchievement();
        }, 500);
      } else {
        finalizeCompletion();
      }
    }, 5000);
  };

  // Show the next achievement in the queue
  const showNextAchievement = () => {
    if (achievementQueue.length > 0) {
      const nextAchievement = achievementQueue[0];
      setCurrentAchievement(nextAchievement);
      setAchievementQueue(achievementQueue.slice(1));
    } else {
      setCurrentAchievement(null);
      finalizeCompletion();
    }
  };

  // Handle achievement notification close
  const handleAchievementClose = () => {
    setCurrentAchievement(null);

    // Show next achievement if available
    if (achievementQueue.length > 0) {
      setTimeout(() => {
        showNextAchievement();
      }, 500);
    } else {
      finalizeCompletion();
    }
  };

  // Finalize the completion process
  const finalizeCompletion = () => {
    if (onComplete && completionData) {
      onComplete(completionData);
    }
  };

  return (
    <div className="relative">
      {/* Main content */}
      {children}

      {/* Points animation */}
      <PointsAnimation
        points={rewardResult?.points || 0}
        isVisible={showPoints}
        onComplete={handlePointsComplete}
      />

      {/* Level up notification */}
      <AnimatePresence>
        {showLevelUp && rewardResult?.newLevel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
          >
            <motion.div
              className="bg-gradient-to-r from-teal-600 to-green-600 text-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-sm mx-auto"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Award className="h-16 w-16 text-yellow-300 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Level Up!</h2>
              <p className="text-xl mb-4">You've reached Level {rewardResult.newLevel}!</p>
              <p className="text-sm text-center opacity-80">
                Keep completing activities to earn more points and unlock new levels!
              </p>

              {/* Auto-close progress bar */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-1 bg-white/30 mt-4 w-full rounded-full overflow-hidden"
              >
                <div className="h-full bg-white/70 rounded-full" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement notification */}
      {currentAchievement && (
        <AchievementNotification
          title={currentAchievement.title}
          description={currentAchievement.description}
          type={currentAchievement.type}
          isVisible={!!currentAchievement}
          onClose={handleAchievementClose}
          autoCloseDelay={5000}
        />
      )}
    </div>
  );
}
