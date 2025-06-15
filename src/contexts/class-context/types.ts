/**
 * Types for the Class Context
 *
 * These types define the data structure for the class context, which provides
 * information about a student's class, including performance metrics, achievements,
 * and attendance.
 */

import { SystemStatus } from '@prisma/client';

/**
 * Class data structure
 * Represents a class with all its details and student-specific information
 */
export interface ClassData {
  // Basic class information
  classId: string;
  className: string;
  courseId?: string;
  courseName?: string;
  termId?: string;
  termName?: string;

  // Subject information
  subjects: {
    id: string;
    name: string;
    code?: string;
  }[];

  // Student performance metrics
  averageGrade: number;
  leaderboardPosition: number;
  points: number;
  level: number;

  // Achievements and badges
  achievements: Achievement[];

  // Attendance statistics
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    percentage: number;
  };

  // Class status
  status: SystemStatus;
}

/**
 * Achievement data structure
 * Represents an achievement or badge earned by a student
 */
export interface Achievement {
  id: string;
  title: string; // Changed from 'name' to 'title' to match the API response
  description: string;
  iconUrl?: string;
  earnedAt: Date;
  type: AchievementType;
  progress?: number; // For partially completed achievements (0-100)
}

/**
 * Achievement types
 */
export enum AchievementType {
  ATTENDANCE = 'ATTENDANCE',
  GRADES = 'GRADES',
  PARTICIPATION = 'PARTICIPATION',
  COMPLETION = 'COMPLETION',
  STREAK = 'STREAK',
  SPECIAL = 'SPECIAL',
}

/**
 * Class context state
 * Represents the current state of the class context
 */
export interface ClassContextState {
  classId: string;
  className: string;
  loading: boolean;
  error: boolean;
  errorMessage: string;
  data: ClassData | null;
  learningFact: string; // Educational micro-content during loading
  retry: () => void; // Error recovery function
}

/**
 * Learning facts for loading states
 * Educational micro-content to display during loading
 */
export const LEARNING_FACTS = [
  "Regular practice improves retention by 80%",
  "Taking short breaks between study sessions improves focus",
  "Teaching others what you've learned reinforces your own understanding",
  "Connecting new information to things you already know helps memory",
  "Testing yourself is more effective than re-reading material",
  "Spaced repetition is the most effective way to memorize information",
  "Your brain processes information better when you're well-rested",
  "Visual learning can improve understanding by up to 400%",
  "Setting specific goals increases motivation and achievement",
  "Growth mindset students achieve more than fixed mindset students",
  "Handwriting notes helps you remember information better than typing",
  "Explaining concepts in your own words improves understanding",
  "Studying in different locations can improve memory recall",
  "Reading material out loud increases retention by 10-15%",
  "The brain needs 8 hours of sleep to properly consolidate memories",
  "Exercise before studying can improve concentration and learning",
  "Listening to instrumental music can enhance focus while studying",
  "Visualizing success can improve actual performance by 13%",
  "Positive emotions enhance learning and memory formation",
  "Interleaving different subjects in one study session improves learning"
];

/**
 * Error messages with empathetic framing
 */
export const ERROR_MESSAGES = {
  NETWORK: "We're having trouble connecting. This doesn't affect your progress.",
  NOT_FOUND: "We couldn't find your class information. Your work is still saved.",
  SERVER: "Our system is taking a short break. Your progress is safely stored.",
  UNAUTHORIZED: "You need to sign in again to view this information. Your work is saved.",
  DEFAULT: "Something went wrong, but don't worry - your progress is safe."
};
