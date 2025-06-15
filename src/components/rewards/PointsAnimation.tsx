"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PointsAnimationProps {
  points: number;
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export function PointsAnimation({
  points,
  isVisible,
  onComplete,
  duration = 2000,
  className,
}: PointsAnimationProps) {
  const [visible, setVisible] = useState(isVisible);

  // Auto-hide the animation after the specified duration
  useEffect(() => {
    setVisible(isVisible);

    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.2, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "fixed inset-0 flex items-center justify-center z-50 pointer-events-none",
            className
          )}
        >
          <div className="relative">
            {/* Background glow effect */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-green-500/20 rounded-full blur-xl"
            />

            {/* Points display */}
            <motion.div
              className="bg-gradient-to-r from-teal-600 to-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1, repeat: 1 }}
            >
              <Award className="h-5 w-5 text-yellow-300" />
              <div className="flex items-baseline">
                <span className="text-xl font-bold">+{points}</span>
                <span className="ml-1 text-sm opacity-90">points</span>
              </div>
            </motion.div>

            {/* Floating particles */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-yellow-300"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1
                }}
                animate={{
                  x: Math.random() * 60 - 30,
                  y: -Math.random() * 60 - 10,
                  opacity: 0
                }}
                transition={{
                  duration: 1 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
                style={{
                  left: `${50 + Math.random() * 20 - 10}%`,
                  top: `${50 + Math.random() * 20 - 10}%`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
