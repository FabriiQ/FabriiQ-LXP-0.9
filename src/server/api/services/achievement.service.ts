import { PrismaClient, SystemStatus, StudentAchievement } from '@prisma/client';

export interface AchievementServiceContext {
  prisma: PrismaClient;
}

export interface CreateAchievementInput {
  studentId: string;
  title: string;
  description: string;
  type: string;
  classId?: string;
  subjectId?: string;
  progress: number;
  total: number;
  icon?: string;
}

export interface UpdateAchievementProgressInput {
  id: string;
  progress: number;
  unlocked?: boolean;
}

export class AchievementService {
  private prisma: PrismaClient;

  constructor({ prisma }: AchievementServiceContext) {
    this.prisma = prisma;
  }

  /**
   * Create a new achievement for a student
   */
  async createAchievement(data: CreateAchievementInput): Promise<StudentAchievement> {
    const { studentId, title, description, type, classId, subjectId, progress, total, icon } = data;

    // Check if achievement already exists
    const existingAchievement = await this.prisma.studentAchievement.findFirst({
      where: {
        studentId,
        title,
        type,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        status: SystemStatus.ACTIVE,
      },
    });

    if (existingAchievement) {
      return existingAchievement;
    }

    // Create new achievement
    return this.prisma.studentAchievement.create({
      data: {
        studentId,
        title,
        description,
        type,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        progress,
        total,
        unlocked: progress >= total,
        unlockedAt: progress >= total ? new Date() : null,
        icon,
      },
    });
  }

  /**
   * Update achievement progress
   */
  async updateAchievementProgress(data: UpdateAchievementProgressInput): Promise<StudentAchievement> {
    const { id, progress, unlocked } = data;

    const achievement = await this.prisma.studentAchievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      throw new Error(`Achievement with ID ${id} not found`);
    }

    const wasUnlocked = achievement.unlocked;
    const isNowUnlocked = unlocked !== undefined ? unlocked : progress >= achievement.total;
    const unlockedNow = !wasUnlocked && isNowUnlocked;

    return this.prisma.studentAchievement.update({
      where: { id },
      data: {
        progress,
        unlocked: isNowUnlocked,
        ...(unlockedNow && { unlockedAt: new Date() }),
      },
    });
  }

  /**
   * Get achievements for a student
   */
  async getStudentAchievements(studentId: string, options?: {
    type?: string;
    classId?: string;
    subjectId?: string;
    unlocked?: boolean;
  }): Promise<StudentAchievement[]> {
    const { type, classId, subjectId, unlocked } = options || {};

    return this.prisma.studentAchievement.findMany({
      where: {
        studentId,
        ...(type && { type }),
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(unlocked !== undefined && { unlocked }),
        status: SystemStatus.ACTIVE,
      },
      orderBy: [
        { unlocked: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  /**
   * Get a specific achievement by ID
   */
  async getAchievementById(id: string): Promise<StudentAchievement | null> {
    return this.prisma.studentAchievement.findUnique({
      where: { id },
    });
  }

  /**
   * Check and update achievement progress
   * Returns true if the achievement was unlocked during this update
   */
  async checkAndUpdateProgress(
    achievementId: string,
    progressIncrement: number = 1
  ): Promise<{ achievement: StudentAchievement; newlyUnlocked: boolean }> {
    const achievement = await this.prisma.studentAchievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new Error(`Achievement with ID ${achievementId} not found`);
    }

    const wasUnlocked = achievement.unlocked;
    const newProgress = Math.min(achievement.progress + progressIncrement, achievement.total);
    const isNowUnlocked = newProgress >= achievement.total;
    const newlyUnlocked = !wasUnlocked && isNowUnlocked;

    const updatedAchievement = await this.prisma.studentAchievement.update({
      where: { id: achievementId },
      data: {
        progress: newProgress,
        unlocked: isNowUnlocked,
        ...(newlyUnlocked && { unlockedAt: new Date() }),
      },
    });

    return { achievement: updatedAchievement, newlyUnlocked };
  }

  /**
   * Delete an achievement
   */
  async deleteAchievement(id: string): Promise<StudentAchievement> {
    return this.prisma.studentAchievement.update({
      where: { id },
      data: { status: SystemStatus.DELETED },
    });
  }
}
