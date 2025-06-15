"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, BookOpen, Star, Zap, Target, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AchievementNotificationProps {
  title: string;
  description?: string;
  type?: string;
  icon?: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
  className?: string;
}

// Map achievement types to icons
const typeIcons: Record<string, React.ReactNode> = {
  class: <BookOpen size={24} />,
  subject: <Target size={24} />,
  login: <Zap size={24} />,
  streak: <Zap size={24} />,
  milestone: <Award size={24} />,
  special: <Crown size={24} />,
  grade: <Award size={24} />,
  activity: <Star size={24} />,
};

export function AchievementNotification({
  title,
  description,
  type,
  icon,
  isVisible,
  onClose,
  autoCloseDelay = 5000,
  className,
}: AchievementNotificationProps) {
  // Auto-close the notification after the specified delay
  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay, onClose]);

  // Get icon based on type or use provided icon
  const displayIcon = icon || (type ? typeIcons[type] : <Award size={24} />);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "fixed top-4 right-4 z-50 max-w-sm",
            className
          )}
        >
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Achievement icon with animated background */}
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="absolute inset-0 bg-white rounded-full opacity-20"
                  />
                  <div className="relative bg-teal-500 rounded-full p-3 flex items-center justify-center">
                    {displayIcon}
                  </div>
                </div>

                {/* Achievement content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
                      <h4 className="font-medium">{title}</h4>
                      {description && (
                        <p className="text-sm text-teal-100 mt-1">{description}</p>
                      )}
                    </div>
                    <button
                      onClick={onClose}
                      className="text-teal-200 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Animated progress bar for auto-close */}
            {autoCloseDelay > 0 && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                className="h-1 bg-teal-400"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
