/**
 * Type definitions for the reward system
 */
import { PrismaClient, SystemStatus } from '@prisma/client';

/**
 * Extended PrismaClient type with reward system models
 */
export interface RewardSystemPrismaClient extends PrismaClient {
  studentPoints: {
    create: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    update: (args: any) => Promise<any>;
    aggregate: (args: any) => Promise<any>;
  };
  studentPointsAggregate: {
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    groupBy: (args: any) => Promise<any[]>;
  };
  studentLevel: {
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  studentAchievement: {
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  leaderboardSnapshot: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    updateMany: (args: any) => Promise<any>;
  };
}

/**
 * StudentProfile with reward system fields
 */
export interface StudentProfileWithRewards {
  id: string;
  totalPoints?: number;
  currentLevel?: number;
  [key: string]: any;
}

/**
 * StudentPoints model
 */
export interface StudentPoints {
  id: string;
  studentId: string;
  amount: number;
  source: string;
  sourceId?: string;
  classId?: string;
  subjectId?: string;
  description?: string;
  createdAt: Date;
  status: SystemStatus;
}

/**
 * StudentLevel model
 */
export interface StudentLevel {
  id: string;
  studentId: string;
  level: number;
  currentExp: number;
  nextLevelExp: number;
  classId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: SystemStatus;
}

/**
 * StudentAchievement model
 */
export interface StudentAchievement {
  id: string;
  studentId: string;
  title: string;
  description: string;
  type: string;
  classId?: string;
  subjectId?: string;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: Date;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  status: SystemStatus;
}

/**
 * StudentPointsAggregate model
 */
export interface StudentPointsAggregate {
  id: string;
  studentId: string;
  classId?: string;
  subjectId?: string;
  courseId?: string;
  campusId?: string;
  date: Date;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  termPoints: number;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LeaderboardSnapshot model
 */
export interface LeaderboardSnapshot {
  id: string;
  type: string;
  referenceId: string;
  snapshotDate: Date;
  entries: any;
  metadata?: any;
  createdAt: Date;
  status: SystemStatus;
}
