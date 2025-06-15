import { PrismaClient, SystemStatus, StudentLevel } from '@prisma/client';

export interface LevelServiceContext {
  prisma: PrismaClient;
}

export interface LevelProgressionResult {
  studentLevel: StudentLevel;
  leveledUp: boolean;
  previousLevel?: number;
}

export class LevelService {
  private prisma: PrismaClient;

  constructor({ prisma }: LevelServiceContext) {
    this.prisma = prisma;
  }

  /**
   * Calculate the experience points needed for a given level
   */
  private calculateExpForLevel(level: number): number {
    // Exponential growth formula: 100 * (level ^ 1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Initialize a student's level
   */
  async initializeStudentLevel(studentId: string, classId?: string): Promise<StudentLevel> {
    // Check if level record already exists
    const existingLevel = await this.prisma.studentLevel.findFirst({
      where: {
        studentId,
        classId: classId || null,
      },
    });

    if (existingLevel) {
      return existingLevel;
    }

    // Create new level record
    return this.prisma.studentLevel.create({
      data: {
        studentId,
        classId,
        level: 1,
        currentExp: 0,
        nextLevelExp: this.calculateExpForLevel(1),
      },
    });
  }

  /**
   * Add experience points to a student
   */
  async addExperience(
    studentId: string,
    expPoints: number,
    classId?: string
  ): Promise<LevelProgressionResult> {
    // Get or create student level
    let studentLevel = await this.prisma.studentLevel.findFirst({
      where: {
        studentId,
        classId: classId || null,
      },
    });

    if (!studentLevel) {
      studentLevel = await this.initializeStudentLevel(studentId, classId);
    }

    const currentLevel = studentLevel.level;
    let currentExp = studentLevel.currentExp + expPoints;
    let nextLevelExp = studentLevel.nextLevelExp;
    let newLevel = currentLevel;
    let leveledUp = false;

    // Check if student has leveled up
    while (currentExp >= nextLevelExp) {
      newLevel++;
      currentExp -= nextLevelExp;
      nextLevelExp = this.calculateExpForLevel(newLevel);
      leveledUp = true;
    }

    // Update student level
    const updatedLevel = await this.prisma.studentLevel.update({
      where: { id: studentLevel.id },
      data: {
        level: newLevel,
        currentExp,
        nextLevelExp,
      },
    });

    // If leveled up, update student profile's current level
    if (leveledUp && !classId) {
      await this.prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          currentLevel: newLevel,
        },
      });
    }

    return {
      studentLevel: updatedLevel,
      leveledUp,
      previousLevel: leveledUp ? currentLevel : undefined,
    };
  }

  /**
   * Get a student's level
   */
  async getStudentLevel(studentId: string, classId?: string): Promise<StudentLevel | null> {
    return this.prisma.studentLevel.findFirst({
      where: {
        studentId,
        classId: classId || null,
        status: SystemStatus.ACTIVE,
      },
    });
  }

  /**
   * Get all levels for a student
   */
  async getAllStudentLevels(studentId: string): Promise<StudentLevel[]> {
    return this.prisma.studentLevel.findMany({
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
      },
      include: {
        class: true,
      },
    });
  }

  /**
   * Calculate level progress percentage
   */
  calculateLevelProgress(currentExp: number, nextLevelExp: number): number {
    return Math.floor((currentExp / nextLevelExp) * 100);
  }

  /**
   * Get level thresholds for reference
   */
  getLevelThresholds(maxLevel: number = 20): { level: number; expRequired: number }[] {
    const thresholds = [];
    for (let i = 1; i <= maxLevel; i++) {
      thresholds.push({
        level: i,
        expRequired: this.calculateExpForLevel(i),
      });
    }
    return thresholds;
  }
}
