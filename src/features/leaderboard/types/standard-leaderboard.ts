/**
 * Standard Leaderboard Types
 * 
 * This file defines the standardized types for the unified leaderboard implementation.
 * It provides a clear separation between academic performance metrics and reward points.
 */

import { SystemStatus } from '@prisma/client';

/**
 * Leaderboard time granularity options
 */
export enum TimeGranularity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  TERM = 'term',
  ALL_TIME = 'all-time',
}

/**
 * Leaderboard entity types
 */
export enum LeaderboardEntityType {
  CLASS = 'class',
  SUBJECT = 'subject',
  COURSE = 'course',
  CAMPUS = 'campus',
  CUSTOM_GROUP = 'custom-group',
}

/**
 * Standard leaderboard entry interface with clear separation between
 * academic performance metrics and reward points
 */
export interface StandardLeaderboardEntry {
  // Core identification
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  enrollmentNumber?: string;
  
  // Academic performance (grades-based)
  academicScore: number;        // 0-100% based on grades
  totalGradePoints: number;     // Sum of earned points in graded activities
  totalMaxGradePoints: number;  // Maximum possible points in graded activities
  
  // Reward system (gamification)
  rewardPoints: number;         // Gamification points
  level?: number;               // Student level
  achievements?: number;        // Number of achievements
  
  // Progress tracking
  completionRate: number;       // % of activities completed
  totalActivities: number;
  completedActivities: number;
  
  // Ranking and movement
  rank: number;                 // Current position
  previousRank?: number;        // Previous position
  rankChange?: number;          // Change in rank (positive or negative)
  
  // Additional metrics
  consistencyScore?: number;    // Measure of regular engagement
  helpingScore?: number;        // Measure of peer assistance
  challengeScore?: number;      // Measure of tackling difficult content
  
  // Privacy controls
  isAnonymous?: boolean;        // Whether the student has opted for anonymity
  
  // Metadata
  lastUpdated?: Date;           // When this entry was last updated
}

/**
 * Standard leaderboard response interface
 */
export interface StandardLeaderboardResponse {
  leaderboard: StandardLeaderboardEntry[];
  metadata: LeaderboardMetadata;
  currentStudentPosition?: StudentPositionInfo;
  totalStudents: number;
}

/**
 * Leaderboard metadata interface
 */
export interface LeaderboardMetadata {
  entityType: LeaderboardEntityType;
  entityId: string;
  entityName?: string;
  timeGranularity: TimeGranularity;
  generatedAt: Date;
  institutionId?: string;
  institutionName?: string;
  academicYear?: string;
  termId?: string;
  termName?: string;
}

/**
 * Student position information interface
 */
export interface StudentPositionInfo {
  studentId: string;
  rank: number;
  previousRank?: number;
  rankChange?: number;
  rewardPoints: number;
  academicScore: number;
  isInTopRanks: boolean;
  distanceToNextRank?: number;
  distanceToPreviousRank?: number;
}

/**
 * Leaderboard snapshot interface (for database model)
 */
export interface LeaderboardSnapshot {
  id: string;
  type: string;
  referenceId: string;
  snapshotDate: Date;
  entries: StandardLeaderboardEntry[];
  metadata: LeaderboardMetadata;
  timeGranularity: string;
  partitionKey?: string;
  institutionId?: string;
  createdAt: Date;
  status: SystemStatus;
}

/**
 * Leaderboard filter options interface
 */
export interface LeaderboardFilterOptions {
  timeGranularity?: TimeGranularity;
  limit?: number;
  offset?: number;
  includeCurrentStudent?: boolean;
  currentStudentId?: string;
  searchQuery?: string;
  sortBy?: 'rank' | 'academicScore' | 'rewardPoints' | 'completionRate';
  sortDirection?: 'asc' | 'desc';
  minLevel?: number;
  maxLevel?: number;
  achievementFilter?: string[];
}
