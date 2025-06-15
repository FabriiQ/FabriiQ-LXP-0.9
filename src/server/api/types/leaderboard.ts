/**
 * Leaderboard Types
 *
 * @deprecated These types have been replaced by standard-leaderboard.ts in features/leaderboard/types
 * This file is kept for reference only and will be removed in a future update.
 */

export enum LeaderboardType {
  CLASS = "CLASS",
  SUBJECT = "SUBJECT",
  COURSE = "COURSE",
  OVERALL = "OVERALL",
}

export enum LeaderboardPeriod {
  ALL_TIME = "ALL_TIME",
  CURRENT_TERM = "CURRENT_TERM",
  CURRENT_MONTH = "CURRENT_MONTH",
  CURRENT_WEEK = "CURRENT_WEEK",
  // New period types for enhanced leaderboard
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  TERM = "TERM",
}

export interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}

export interface LeaderboardEntry {
  rank?: number;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  score: number;
  totalPoints: number;
  totalMaxPoints: number;
  completionRate: number;
  totalActivities: number;
  completedActivities: number;
  improvement?: number; // Percentage improvement over previous period
  previousScore?: number; // Score from previous period for comparison
  improvementRank?: number; // Rank based on improvement
  rewardPoints?: number; // Reward points earned by the student
  level?: number; // Current level of the student
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalStudents: number;
  filters: LeaderboardFilters;
  metadata?: {
    classId?: string;
    className?: string;
    subjectId?: string;
    subjectName?: string;
    courseId?: string;
    courseName?: string;
    campusId?: string;
    campusName?: string;
  };
}
