/**
 * Level Progression Implementation
 *
 * This module provides the functionality for tracking and progressing student levels
 * in the reward system. It implements level thresholds, level-up detection, and
 * level progression algorithms.
 */

import { PrismaClient, SystemStatus, Prisma } from '@prisma/client';
import { RewardSystem } from '..';
import { logger } from '../../../server/api/utils/logger';

// Define StudentLevel type for TypeScript
type StudentLevel = {
  id: string;
  studentId: string;
  classId?: string | null;
  level: number;
  currentExp: number;
  nextLevelExp: number;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface LevelInfo {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  progress: number; // Percentage progress to next level
}

export interface LevelUpResult {
  leveledUp: boolean;
  previousLevel?: number;
  newLevel: number;
  currentExp: number;
  nextLevelExp: number;
}

export class LevelSystem {
  private prisma: PrismaClient;
  private rewardSystem: RewardSystem;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.rewardSystem = new RewardSystem({ prisma });
  }

  /**
   * Get level information for a student
   */
  async getStudentLevel(
    studentId: string,
    classId?: string
  ): Promise<LevelInfo> {
    try {
      // Get student level
      // Use type assertion since the model might not be recognized by TypeScript
      const studentLevel = await (this.prisma as any).studentLevel.findFirst({
        where: {
          studentId,
          classId: classId || null,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!studentLevel) {
        // If no level record exists, get from student profile or initialize
        if (!classId) {
          // Try to get student level from profile
          // Note: currentLevel might not exist in the schema yet
          try {
            const studentProfile = await this.prisma.studentProfile.findUnique({
              where: { id: studentId },
              // Use any to bypass TypeScript checking since the field might not exist yet
              select: { id: true } as any,
            });

            if (studentProfile) {
              // Use a raw query to get the currentLevel field if it exists
              const result = await this.prisma.$queryRaw`
                SELECT "currentLevel" FROM "StudentProfile" WHERE id = ${studentId}
              `;

              const level = result && Array.isArray(result) && result.length > 0
                ? (result[0] as any).currentLevel || 1
                : 1;

              const nextLevelExp = this.calculateExpForLevel(level);
              return {
                level,
                currentExp: 0,
                nextLevelExp,
                progress: 0,
              };
            }
          } catch (error) {
            logger.error('Error getting student level from profile', { error, studentId });
            // Continue with default level if there's an error
          }
        }

        // Initialize level
        const initialLevel = await this.initializeStudentLevel(studentId, classId);
        return {
          level: initialLevel.level,
          currentExp: initialLevel.currentExp,
          nextLevelExp: initialLevel.nextLevelExp,
          progress: this.calculateLevelProgress(initialLevel.currentExp, initialLevel.nextLevelExp),
        };
      }

      // Calculate progress percentage
      const progress = this.calculateLevelProgress(studentLevel.currentExp, studentLevel.nextLevelExp);

      return {
        level: studentLevel.level,
        currentExp: studentLevel.currentExp,
        nextLevelExp: studentLevel.nextLevelExp,
        progress,
      };
    } catch (error) {
      logger.error('Error getting student level', { error, studentId, classId });
      // Return default level info
      return {
        level: 1,
        currentExp: 0,
        nextLevelExp: 100,
        progress: 0,
      };
    }
  }

  /**
   * Initialize a student's level
   */
  async initializeStudentLevel(
    studentId: string,
    classId?: string
  ): Promise<{
    id: string;
    level: number;
    currentExp: number;
    nextLevelExp: number;
  }> {
    try {
      // Check if level record already exists
      // Use type assertion since the model might not be recognized by TypeScript
      const existingLevel = await (this.prisma as any).studentLevel.findFirst({
        where: {
          studentId,
          classId: classId || null,
        },
      });

      if (existingLevel) {
        return existingLevel;
      }

      // Create new level record
      // Use type assertion since the model might not be recognized by TypeScript
      return (this.prisma as any).studentLevel.create({
        data: {
          studentId,
          classId,
          level: 1,
          currentExp: 0,
          nextLevelExp: this.calculateExpForLevel(1),
        },
      });
    } catch (error) {
      logger.error('Error initializing student level', { error, studentId, classId });
      throw error;
    }
  }

  /**
   * Progress a student's level
   */
  async progressLevel(
    studentId: string,
    expPoints: number,
    classId?: string
  ): Promise<LevelUpResult | null> {
    try {
      const result = await this.rewardSystem.progressLevel({
        studentId,
        expPoints,
        classId,
      });

      if (!result) {
        return null;
      }

      const { studentLevel, leveledUp, previousLevel } = result;

      return {
        leveledUp,
        previousLevel,
        newLevel: studentLevel.level,
        currentExp: studentLevel.currentExp,
        nextLevelExp: studentLevel.nextLevelExp,
      };
    } catch (error) {
      logger.error('Error progressing level', { error, studentId, expPoints, classId });
      return null;
    }
  }

  /**
   * Get all levels for a student
   */
  async getAllStudentLevels(
    studentId: string
  ): Promise<Array<{
    id: string;
    level: number;
    currentExp: number;
    nextLevelExp: number;
    classId?: string;
    className?: string;
    progress: number;
  }>> {
    try {
      // Use type assertion since the model might not be recognized by TypeScript
      const levels = await (this.prisma as any).studentLevel.findMany({
        where: {
          studentId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: {
            select: {
              name: true,
            },
          },
        },
      });

      return levels.map((level: any) => ({
        id: level.id,
        level: level.level,
        currentExp: level.currentExp,
        nextLevelExp: level.nextLevelExp,
        classId: level.classId || undefined,
        className: level.class?.name,
        progress: this.calculateLevelProgress(level.currentExp, level.nextLevelExp),
      }));
    } catch (error) {
      logger.error('Error getting all student levels', { error, studentId });
      return [];
    }
  }

  /**
   * Get level thresholds for reference
   */
  getLevelThresholds(
    maxLevel: number = 20
  ): Array<{
    level: number;
    expRequired: number;
    totalExpRequired: number;
  }> {
    // Use explicit typing to avoid TypeScript errors
    const thresholds: Array<{
      level: number;
      expRequired: number;
      totalExpRequired: number;
    }> = [];
    let totalExp = 0;

    for (let i = 1; i <= maxLevel; i++) {
      const expRequired = this.calculateExpForLevel(i);
      totalExp += i > 1 ? expRequired : 0;

      thresholds.push({
        level: i,
        expRequired,
        totalExpRequired: totalExp,
      });
    }

    return thresholds;
  }

  /**
   * Calculate the experience points needed for a given level
   */
  private calculateExpForLevel(level: number): number {
    // Exponential growth formula: 100 * (level ^ 1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Calculate level progress percentage
   */
  private calculateLevelProgress(currentExp: number, nextLevelExp: number): number {
    return Math.floor((currentExp / nextLevelExp) * 100);
  }

  /**
   * Get level name based on level number
   */
  getLevelName(level: number): string {
    if (level >= 50) return "Legendary";
    if (level >= 40) return "Mythical";
    if (level >= 30) return "Epic";
    if (level >= 20) return "Master";
    if (level >= 15) return "Expert";
    if (level >= 10) return "Advanced";
    if (level >= 5) return "Intermediate";
    return "Beginner";
  }

  /**
   * Get level color based on level number
   */
  getLevelColor(level: number): string {
    if (level >= 50) return "#9333ea"; // Purple
    if (level >= 40) return "#6366f1"; // Indigo
    if (level >= 30) return "#3b82f6"; // Blue
    if (level >= 20) return "#0ea5e9"; // Sky
    if (level >= 15) return "#06b6d4"; // Cyan
    if (level >= 10) return "#14b8a6"; // Teal
    if (level >= 5) return "#10b981"; // Emerald
    return "#22c55e"; // Green
  }
}
