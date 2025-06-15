'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateConfetti, playSound, triggerHapticFeedback } from '@/lib/utils/confetti';
import { Button } from '@/components/ui/button';

// Custom icon components for missing Lucide icons
const Share2 = (props: React.SVGProps<SVGSVGElement>) => (
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
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const Target = (props: React.SVGProps<SVGSVGElement>) => (
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
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const Zap = (props: React.SVGProps<SVGSVGElement>) => (
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
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

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

const Crown = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

export interface AchievementPopupProps {
  title: string;
  description?: string;
  type?: 'class' | 'subject' | 'login' | 'streak' | 'milestone' | 'special' | 'grade' | 'activity';
  isVisible: boolean;
  onClose: () => void;
  onShare?: () => void;
  onSnooze?: () => void;
  autoCloseDelay?: number;
  showConfetti?: boolean;
  className?: string;
}

// Map achievement types to icons and colors
const typeConfig: Record<string, { icon: React.ReactNode; color: string; sound: string }> = {
  class: {
    icon: <BookOpen className="h-6 w-6" />,
    color: 'from-blue-600 to-blue-700',
    sound: '/sounds/achievement-class.mp3'
  },
  subject: {
    icon: <Target className="h-6 w-6" />,
    color: 'from-purple-600 to-purple-700',
    sound: '/sounds/achievement-subject.mp3'
  },
  login: {
    icon: <Zap className="h-6 w-6" />,
    color: 'from-yellow-500 to-yellow-600',
    sound: '/sounds/achievement-login.mp3'
  },
  streak: {
    icon: <Zap className="h-6 w-6" />,
    color: 'from-orange-500 to-orange-600',
    sound: '/sounds/achievement-streak.mp3'
  },
  milestone: {
    icon: <Award className="h-6 w-6" />,
    color: 'from-teal-600 to-teal-700',
    sound: '/sounds/achievement-milestone.mp3'
  },
  special: {
    icon: <Crown className="h-6 w-6" />,
    color: 'from-pink-600 to-pink-700',
    sound: '/sounds/achievement-special.mp3'
  },
  grade: {
    icon: <Award className="h-6 w-6" />,
    color: 'from-green-600 to-green-700',
    sound: '/sounds/achievement-grade.mp3'
  },
  activity: {
    icon: <Star className="h-6 w-6" />,
    color: 'from-indigo-600 to-indigo-700',
    sound: '/sounds/achievement-activity.mp3'
  },
};

// Growth mindset phrases to randomly select from
const growthPhrases = [
  "Your hard work is paying off!",
  "You're making great progress!",
  "Your persistence is impressive!",
  "Keep challenging yourself!",
  "Your effort is leading to growth!",
  "You're developing new skills!",
  "Your dedication shows!",
  "You're on a path of improvement!",
  "Your learning journey continues!",
  "You're building momentum!"
];

/**
 * AchievementPopup component
 *
 * Displays a popup notification when a user earns an achievement
 * Features:
 * - Animated entrance/exit
 * - Confetti celebration effect
 * - Haptic feedback
 * - Sound effects (optional)
 * - Positive framing with growth mindset language
 * - Share and snooze options
 * - Accessibility features
 */
export function AchievementPopup({
  title,
  description,
  type = 'milestone',
  isVisible,
  onClose,
  onShare,
  onSnooze,
  autoCloseDelay = 8000,
  showConfetti = true,
  className,
}: AchievementPopupProps) {
  const confettiRef = useRef<HTMLDivElement>(null);
  const [growthPhrase, setGrowthPhrase] = useState('');
  const config = typeConfig[type] || typeConfig.milestone;

  // Select a random growth mindset phrase
  useEffect(() => {
    if (isVisible) {
      const randomIndex = Math.floor(Math.random() * growthPhrases.length);
      setGrowthPhrase(growthPhrases[randomIndex]);
    }
  }, [isVisible]);

  // Handle confetti, sound, and haptic feedback when achievement appears
  useEffect(() => {
    if (isVisible) {
      // Trigger haptic feedback
      triggerHapticFeedback([100, 50, 200]);

      // Play sound effect
      playSound(config.sound, 0.4);

      // Generate confetti
      if (showConfetti && confettiRef.current) {
        generateConfetti(confettiRef.current, {
          reducedMotion: localStorage.getItem('reducedMotion') === 'true'
        });
      }

      // Auto-close after delay
      if (autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, showConfetti, config.sound, autoCloseDelay, onClose]);

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

          {/* Achievement popup */}
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
              "relative max-w-md w-full rounded-lg overflow-hidden shadow-xl",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="achievement-title"
          >
            {/* Confetti container */}
            <div
              ref={confettiRef}
              className="absolute inset-0 overflow-hidden pointer-events-none"
              aria-hidden="true"
            />

            {/* Achievement content */}
            <div className={cn(
              "bg-gradient-to-r text-white p-6",
              config.color
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-full p-3 mr-3">
                    {config.icon}
                  </div>
                  <div>
                    <h2
                      id="achievement-title"
                      className="text-xl font-bold"
                    >
                      Achievement Unlocked!
                    </h2>
                    <p className="text-lg font-medium">{title}</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close achievement popup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Description with growth mindset language */}
              <div className="mb-4">
                {description && (
                  <p className="text-white/90 mb-2">{description}</p>
                )}
                <p className="text-white/90 italic">{growthPhrase}</p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  {onShare && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white border-none"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  )}

                  {onSnooze && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSnooze();
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white border-none"
                    >
                      Remind Me Later
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onClose}
                  className="bg-white text-gray-800 hover:bg-white/90"
                >
                  Continue
                </Button>
              </div>

              {/* Auto-close progress bar */}
              {autoCloseDelay > 0 && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                  className="h-1 bg-white/30 mt-4 w-full rounded-full overflow-hidden"
                >
                  <div className="h-full bg-white/70 rounded-full" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
