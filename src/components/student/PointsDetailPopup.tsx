'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Calendar, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateConfetti, playSound, triggerHapticFeedback } from '@/lib/utils/confetti';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Custom icon components for missing Lucide icons
const Star = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrendingUp = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const CheckCircle2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export interface PointsDetailPopupProps {
  isVisible: boolean;
  onClose: () => void;
  points: {
    current: number;
    total: number;
    recentlyEarned: number;
    breakdown?: Array<{
      source: string;
      amount: number;
      date: string;
    }>;
  };
  level: {
    current: number;
    progress: number;
    pointsToNextLevel: number;
  };
  streak?: {
    days: number;
    maxDays: number;
  };
  autoCloseDelay?: number;
  className?: string;
}

/**
 * PointsDetailPopup component
 *
 * Displays detailed information about a student's points and progress
 * Features:
 * - Animated entrance/exit
 * - Progress visualization
 * - Variable rewards for streaks
 * - Haptic feedback
 * - Sound effects (optional)
 * - Accessibility features
 */
export function PointsDetailPopup({
  isVisible,
  onClose,
  points,
  level,
  streak,
  autoCloseDelay = 0, // 0 means no auto-close
  className,
}: PointsDetailPopupProps) {
  const confettiRef = useRef<HTMLDivElement>(null);

  // Handle confetti, sound, and haptic feedback when popup appears
  useEffect(() => {
    if (isVisible) {
      // Trigger haptic feedback
      triggerHapticFeedback(50);

      // Play sound effect
      playSound('/sounds/points-detail.mp3', 0.3);

      // Auto-close after delay if specified
      if (autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoCloseDelay, onClose]);

  // Handle keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVisible) {
        if (e.key === 'Escape') {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  // Determine if streak deserves celebration (5+ days)
  const isStreakNotable = streak && streak.days >= 5;

  // Show confetti for notable streaks
  useEffect(() => {
    if (isVisible && isStreakNotable && confettiRef.current) {
      generateConfetti(confettiRef.current, {
        count: 50,
        reducedMotion: localStorage.getItem('reducedMotion') === 'true'
      });
    }
  }, [isVisible, isStreakNotable]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Points detail popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            className={cn(
              "relative max-w-md w-full bg-background rounded-lg overflow-hidden shadow-xl",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="points-detail-title"
          >
            {/* Confetti container for streaks */}
            <div
              ref={confettiRef}
              className="absolute inset-0 overflow-hidden pointer-events-none"
              aria-hidden="true"
            />

            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  <h2
                    id="points-detail-title"
                    className="text-lg font-bold"
                  >
                    Your Points & Progress
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close points detail popup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Points summary */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Total Points</h3>
                  <div className="text-2xl font-bold text-primary">{points.total}</div>
                </div>

                {points.recentlyEarned > 0 && (
                  <div className="bg-primary/10 text-primary rounded-md p-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Recently earned
                    </span>
                    <span className="font-medium">+{points.recentlyEarned} points</span>
                  </div>
                )}
              </div>

              {/* Level progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    Level {level.current}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {level.pointsToNextLevel} points to next level
                  </span>
                </div>

                <div className="space-y-2">
                  <Progress value={level.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress: {level.progress}%</span>
                    <span>Level {level.current + 1}</span>
                  </div>
                </div>
              </div>

              {/* Streak information with variable rewards */}
              {streak && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Activity Streak
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {streak.days} {streak.days === 1 ? 'day' : 'days'}
                    </span>
                  </div>

                  <div className="bg-muted rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Current streak</span>
                      <span className="font-medium">{streak.days} {streak.days === 1 ? 'day' : 'days'}</span>
                    </div>

                    <div className="flex space-x-1 mb-3">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-2 rounded-full",
                            i < (streak.days % 7) ? "bg-primary" : "bg-muted-foreground/20"
                          )}
                        />
                      ))}
                    </div>

                    {/* Variable rewards based on streak length */}
                    <div className="text-sm">
                      {streak.days < 3 && (
                        <p>Keep going! You'll earn bonus points after 3 consecutive days.</p>
                      )}
                      {streak.days >= 3 && streak.days < 5 && (
                        <p className="flex items-center text-amber-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          3-day streak bonus: +15 points
                        </p>
                      )}
                      {streak.days >= 5 && streak.days < 7 && (
                        <p className="flex items-center text-amber-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          5-day streak bonus: +25 points
                        </p>
                      )}
                      {streak.days >= 7 && (
                        <p className="flex items-center text-amber-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          7-day streak bonus: +50 points
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent points breakdown */}
              {points.breakdown && points.breakdown.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Recent Activity
                  </h3>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {points.breakdown.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-muted/50 rounded-md"
                      >
                        <div className="text-sm">
                          <div>{item.source}</div>
                          <div className="text-xs text-muted-foreground">{item.date}</div>
                        </div>
                        <div className="font-medium text-primary">+{item.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>

            {/* Auto-close progress bar */}
            {autoCloseDelay > 0 && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                className="h-1 bg-primary/30 w-full"
              >
                <div className="h-full bg-primary rounded-full" />
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
