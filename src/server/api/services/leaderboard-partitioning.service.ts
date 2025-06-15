/**
 * Leaderboard Partitioning Service
 *
 * This service manages the partitioning of leaderboard data for improved performance
 * and efficient data management. It implements:
 *
 * 1. Time-based partitioning (daily, weekly, monthly)
 * 2. Entity-based partitioning (class, subject, campus)
 * 3. Institution-based partitioning for multi-tenancy
 * 4. Linear archiving methodology for historical data
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { subDays, subMonths, format } from 'date-fns';
import { startOfMonth } from 'date-fns/startOfMonth';
import { RewardSystem } from '@/features/rewards';
import { getRewardSystemPrisma } from '@/features/rewards/utils';
import { RewardSystemPrismaClient } from '@/features/rewards/types';

// Time granularity options
export enum TimeGranularity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  TERM = 'term',
  ALL_TIME = 'all-time',
}

// Entity types for partitioning
export enum EntityType {
  CLASS = 'CLASS',
  SUBJECT = 'SUBJECT',
  CAMPUS = 'CAMPUS',
}

// Institution-specific retention configuration
interface InstitutionRetentionConfig {
  institutionId: string;
  retentionPeriods: {
    [key in TimeGranularity]?: number; // Days to retain before archiving
  };
}

// Partition configuration
interface PartitionConfig {
  retentionPeriods: {
    [key in TimeGranularity]: number; // Days to retain before archiving
  };
  institutionConfigs: InstitutionRetentionConfig[]; // Institution-specific configurations
  batchSize: number; // Number of records to process in a batch
  archiveThreshold: number; // Number of days before archiving
}

export class LeaderboardPartitioningService {
  private prisma: RewardSystemPrismaClient;
  private rewardSystem: RewardSystem;
  private config: PartitionConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = getRewardSystemPrisma(prisma);
    this.rewardSystem = new RewardSystem({ prisma });

    // Default configuration
    this.config = {
      retentionPeriods: {
        [TimeGranularity.DAILY]: 30, // Keep daily snapshots for 30 days
        [TimeGranularity.WEEKLY]: 90, // Keep weekly snapshots for 90 days
        [TimeGranularity.MONTHLY]: 365, // Keep monthly snapshots for 1 year
        [TimeGranularity.TERM]: 730, // Keep term snapshots for 2 years
        [TimeGranularity.ALL_TIME]: 1095, // Keep all-time snapshots for 3 years
      },
      institutionConfigs: [], // Will be populated from database as needed
      batchSize: 100,
      archiveThreshold: 90, // Archive snapshots older than 90 days
    };
  }

  /**
   * Load institution-specific retention configurations from the database
   * This allows different institutions to have different retention policies
   */
  async loadInstitutionConfigs(): Promise<void> {
    try {
      // Get all active institutions
      const institutions = await this.prisma.institution.findMany({
        where: { status: SystemStatus.ACTIVE }
      });

      // Clear existing configs
      this.config.institutionConfigs = [];

      // For now, just add default configurations for each institution
      // In a real implementation, you would load custom settings from the database
      for (const institution of institutions) {
        // Add institution-specific config with default settings
        this.config.institutionConfigs.push({
          institutionId: institution.id,
          retentionPeriods: {
            [TimeGranularity.DAILY]: 30,
            [TimeGranularity.WEEKLY]: 90,
            [TimeGranularity.MONTHLY]: 365,
            [TimeGranularity.TERM]: 730,
            [TimeGranularity.ALL_TIME]: 1095,
          }
        });

        logger.info(`Added default retention settings for institution ${institution.name}`, {
          institutionId: institution.id
        });
      }

      logger.info(`Loaded institution configs: ${this.config.institutionConfigs.length} institutions`);
    } catch (error) {
      logger.error('Error loading institution configurations', { error });
    }
  }

  /**
   * Create a partitioned leaderboard snapshot
   *
   * @param options Options for creating the snapshot
   * @returns The created snapshot
   */
  async createPartitionedSnapshot(options: {
    type: EntityType;
    referenceId: string;
    timeGranularity: TimeGranularity;
    institutionId: string;
    limit?: number;
  }): Promise<any> {
    try {
      const { type, referenceId, timeGranularity, institutionId, limit = 100 } = options;

      // Validate institution exists
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId, status: SystemStatus.ACTIVE },
      });

      if (!institution) {
        throw new Error(`Institution with ID ${institutionId} not found or not active`);
      }

      // Map type to the format expected by getLeaderboard
      let leaderboardType: 'class' | 'subject' | 'overall' = 'overall';
      if (type === EntityType.CLASS) leaderboardType = 'class';
      if (type === EntityType.SUBJECT) leaderboardType = 'subject';

      // Map time granularity to timeframe
      let timeframe: 'daily' | 'weekly' | 'monthly' | 'term' | 'all-time' = 'all-time';
      switch (timeGranularity) {
        case TimeGranularity.DAILY:
          timeframe = 'daily';
          break;
        case TimeGranularity.WEEKLY:
          timeframe = 'weekly';
          break;
        case TimeGranularity.MONTHLY:
          timeframe = 'monthly';
          break;
        case TimeGranularity.TERM:
          timeframe = 'term';
          break;
      }

      // Get current leaderboard
      const leaderboard = await this.rewardSystem.getLeaderboard({
        type: leaderboardType,
        referenceId,
        timeframe,
        limit,
      });

      // Generate partition key with institution ID
      const now = new Date();
      const partitionKey = this.generatePartitionKey(institutionId, type, now);

      // Create snapshot with partition key and institution ID
      const snapshot = await this.prisma.leaderboardSnapshot.create({
        data: {
          type,
          referenceId,
          institutionId, // Add institution ID to the snapshot
          entries: leaderboard,
          snapshotDate: now,
          timeGranularity,
          partitionKey,
          metadata: {
            createdAt: now.toISOString(),
            entityType: type,
            timeframe,
            institutionId, // Also include in metadata for easier querying
          },
        },
      });

      logger.info(`Created partitioned leaderboard snapshot`, {
        type,
        referenceId,
        institutionId,
        timeGranularity,
        partitionKey,
      });

      return snapshot;
    } catch (error) {
      logger.error('Error creating partitioned leaderboard snapshot', { error, options });
      throw error;
    }
  }

  /**
   * Generate a partition key for a leaderboard snapshot
   *
   * @param institutionId Institution ID
   * @param type Entity type
   * @param date Snapshot date
   * @returns Partition key
   */
  private generatePartitionKey(institutionId: string, type: string, date: Date): string {
    // Format: INSTITUTION_ID_TYPE_YYYY-MM
    const monthKey = format(startOfMonth(date), 'yyyy-MM');
    return `${institutionId}_${type}_${monthKey}`;
  }

  /**
   * Archive old leaderboard snapshots using linear archiving methodology
   *
   * @param options Options for archiving
   * @returns Result of the archiving operation
   */
  async archiveSnapshots(options?: {
    olderThanDays?: number;
    timeGranularity?: TimeGranularity;
    entityType?: EntityType;
    institutionId?: string;
    dryRun?: boolean;
  }): Promise<{
    success: boolean;
    archived: number;
    errors: number;
  }> {
    try {
      const {
        olderThanDays = this.config.archiveThreshold,
        timeGranularity,
        entityType,
        institutionId,
        dryRun = false,
      } = options || {};

      logger.info(`Starting archival of leaderboard snapshots`, {
        olderThanDays,
        timeGranularity,
        entityType,
        institutionId,
        dryRun,
      });

      const cutoffDate = subDays(new Date(), olderThanDays);

      // Build where clause
      const whereClause: any = {
        snapshotDate: { lt: cutoffDate },
        status: SystemStatus.ACTIVE,
      };

      if (timeGranularity) {
        whereClause.timeGranularity = timeGranularity;
      }

      if (entityType) {
        whereClause.type = entityType;
      }

      if (institutionId) {
        whereClause.institutionId = institutionId;
      }

      // Get snapshots to archive
      const snapshots = await this.prisma.leaderboardSnapshot.findMany({
        where: whereClause,
        take: this.config.batchSize,
      });

      logger.info(`Found ${snapshots.length} snapshots to archive`, {
        institutionId: institutionId || 'all',
        timeGranularity: timeGranularity || 'all',
      });

      if (dryRun) {
        return {
          success: true,
          archived: snapshots.length,
          errors: 0,
        };
      }

      // Process each snapshot
      let archived = 0;
      let errors = 0;

      for (const snapshot of snapshots) {
        try {
          // Get academic year and term information
          const academicYear = this.getAcademicYearFromDate(snapshot.snapshotDate);
          let termId: string | null = null;

          // For class and subject snapshots, try to get the term ID
          if (snapshot.type === EntityType.CLASS || snapshot.type === EntityType.SUBJECT) {
            termId = await this.getTermIdForEntity(snapshot.type, snapshot.referenceId, snapshot.snapshotDate);
          }

          // Create archive record
          await this.prisma.$executeRaw`
            INSERT INTO archived_leaderboard_snapshots
            (id, "originalId", type, "referenceId", "snapshotDate", entries, metadata, "createdAt", "archivedAt", "timeGranularity", "academicYear", "termId")
            VALUES
            (${`archived_${snapshot.id}`}, ${snapshot.id}, ${snapshot.type}, ${snapshot.referenceId}, ${snapshot.snapshotDate},
            ${snapshot.entries}, ${snapshot.metadata || null}, ${snapshot.createdAt}, ${new Date()},
            ${snapshot.timeGranularity}, ${academicYear}, ${termId})
          `;

          // Mark original as archived
          await this.prisma.leaderboardSnapshot.updateMany({
            where: { id: snapshot.id },
            data: { status: SystemStatus.ARCHIVED },
          });

          archived++;
        } catch (error) {
          logger.error('Error archiving leaderboard snapshot', { error, snapshotId: snapshot.id });
          errors++;
        }
      }

      logger.info(`Archived ${archived} leaderboard snapshots with ${errors} errors`);

      return {
        success: true,
        archived,
        errors,
      };
    } catch (error) {
      logger.error('Error archiving leaderboard snapshots', { error });
      return {
        success: false,
        archived: 0,
        errors: 1,
      };
    }
  }

  /**
   * Apply linear archiving methodology
   * This method implements a tiered retention policy based on time granularity
   * and institution-specific configurations
   */
  async applyLinearArchiving(): Promise<{
    success: boolean;
    results: Record<string, any>;
  }> {
    try {
      logger.info('Starting linear archiving process for leaderboard snapshots');

      // Ensure institution configs are loaded
      await this.loadInstitutionConfigs();

      const results: Record<string, any> = {
        global: {},
        institutions: {},
      };

      // First, process global retention policies for all institutions
      for (const [granularity, retentionDays] of Object.entries(this.config.retentionPeriods)) {
        const result = await this.archiveSnapshots({
          olderThanDays: retentionDays,
          timeGranularity: granularity as TimeGranularity,
        });

        results.global[granularity] = result;
      }

      // Then, process institution-specific retention policies
      for (const institutionConfig of this.config.institutionConfigs) {
        const institutionResults: Record<string, any> = {};

        // Process each time granularity with its institution-specific retention period
        for (const [granularity, retentionDays] of Object.entries(institutionConfig.retentionPeriods)) {
          if (retentionDays) {
            const result = await this.archiveSnapshots({
              olderThanDays: retentionDays,
              timeGranularity: granularity as TimeGranularity,
              institutionId: institutionConfig.institutionId,
            });

            institutionResults[granularity] = result;
          }
        }

        results.institutions[institutionConfig.institutionId] = institutionResults;
      }

      logger.info('Completed linear archiving process', {
        globalResults: results.global,
        institutionCount: Object.keys(results.institutions).length
      });

      return {
        success: true,
        results,
      };
    } catch (error) {
      logger.error('Error applying linear archiving', { error });
      return {
        success: false,
        results: {},
      };
    }
  }

  /**
   * Get academic year from date
   * Format: YYYY-YYYY (e.g., 2023-2024)
   */
  private getAcademicYearFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Academic year typically starts in August/September
    // If month is before August, it's part of the previous academic year
    if (month < 7) {
      return `${year-1}-${year}`;
    } else {
      return `${year}-${year+1}`;
    }
  }

  /**
   * Get term ID for a class or subject
   */
  private async getTermIdForEntity(
    type: EntityType,
    referenceId: string,
    date: Date
  ): Promise<string | null> {
    try {
      if (type === EntityType.CLASS) {
        // Get class and its term
        const classEntity = await this.prisma.class.findUnique({
          where: { id: referenceId },
          select: { termId: true },
        });

        return classEntity?.termId || null;
      } else if (type === EntityType.SUBJECT) {
        // For subjects, we need to find a class that has this subject
        // and is active during the given date
        const classWithSubject = await this.prisma.class.findFirst({
          where: {
            activities: {
              some: {
                subjectId: referenceId,
              },
            },
            term: {
              startDate: { lte: date },
              endDate: { gte: date },
            },
          },
          select: { termId: true },
        });

        return classWithSubject?.termId || null;
      }

      return null;
    } catch (error) {
      logger.error('Error getting term ID for entity', { error, type, referenceId });
      return null;
    }
  }

  /**
   * Get historical leaderboard data with partitioning support
   */
  async getHistoricalLeaderboard(options: {
    type: EntityType;
    referenceId: string;
    institutionId: string;
    timeGranularity?: TimeGranularity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    try {
      const {
        type,
        referenceId,
        institutionId,
        timeGranularity = TimeGranularity.ALL_TIME,
        startDate,
        endDate,
        limit = 10,
      } = options;

      // Validate institution exists
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId, status: SystemStatus.ACTIVE },
      });

      if (!institution) {
        throw new Error(`Institution with ID ${institutionId} not found or not active`);
      }

      // Build where clause
      const whereClause: any = {
        type,
        referenceId,
        institutionId,
        status: SystemStatus.ACTIVE,
        timeGranularity,
      };

      if (startDate) {
        whereClause.snapshotDate = { gte: startDate };
      }

      if (endDate) {
        whereClause.snapshotDate = {
          ...whereClause.snapshotDate,
          lte: endDate,
        };
      }

      // Get snapshots
      const snapshots = await this.prisma.leaderboardSnapshot.findMany({
        where: whereClause,
        orderBy: {
          snapshotDate: 'desc',
        },
        take: limit,
      });

      logger.info(`Retrieved ${snapshots.length} historical leaderboard snapshots`, {
        type,
        referenceId,
        institutionId,
        timeGranularity,
      });

      return snapshots;
    } catch (error) {
      logger.error('Error getting historical leaderboard data', { error, options });
      throw error;
    }
  }

  /**
   * Get leaderboard trends over time
   */
  async getLeaderboardTrends(options: {
    type: EntityType;
    referenceId: string;
    institutionId: string;
    timeGranularity: TimeGranularity;
    months?: number;
    studentId?: string;
  }): Promise<any> {
    try {
      const {
        type,
        referenceId,
        institutionId,
        timeGranularity,
        months = 3,
        studentId,
      } = options;

      // Validate institution exists
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId, status: SystemStatus.ACTIVE },
      });

      if (!institution) {
        throw new Error(`Institution with ID ${institutionId} not found or not active`);
      }

      const startDate = subMonths(new Date(), months);
      const endDate = new Date();

      // Get snapshots for the period
      const snapshots = await this.prisma.leaderboardSnapshot.findMany({
        where: {
          type,
          referenceId,
          institutionId,
          timeGranularity,
          snapshotDate: {
            gte: startDate,
            lte: endDate,
          },
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          snapshotDate: 'asc',
        },
      });

      logger.info(`Retrieved ${snapshots.length} leaderboard trend snapshots`, {
        type,
        referenceId,
        institutionId,
        timeGranularity,
        months,
      });

      // If tracking a specific student
      if (studentId) {
        return this.extractStudentTrend(snapshots, studentId);
      }

      // Otherwise return overall trends
      return this.extractOverallTrends(snapshots);
    } catch (error) {
      logger.error('Error getting leaderboard trends', { error, options });
      throw error;
    }
  }

  /**
   * Extract trend data for a specific student
   */
  private extractStudentTrend(snapshots: any[], studentId: string): any {
    const trend = snapshots.map(snapshot => {
      const entries = snapshot.entries as any[];
      const studentEntry = entries.find(entry => entry.studentId === studentId);

      return {
        date: snapshot.snapshotDate,
        rank: studentEntry?.rank || 0,
        points: studentEntry?.points || 0,
        totalStudents: entries.length,
      };
    });

    return {
      studentId,
      trend,
    };
  }

  /**
   * Extract overall trends from snapshots
   */
  private extractOverallTrends(snapshots: any[]): any {
    // Calculate average points, top performer consistency, etc.
    const trends = snapshots.map(snapshot => {
      const entries = snapshot.entries as any[];

      // Calculate average points
      const totalPoints = entries.reduce((sum, entry) => sum + (entry.points || 0), 0);
      const averagePoints = entries.length > 0 ? totalPoints / entries.length : 0;

      // Get top 3 performers
      const topPerformers = entries.slice(0, 3).map(entry => ({
        studentId: entry.studentId,
        studentName: entry.studentName,
        points: entry.points,
        rank: entry.rank,
      }));

      return {
        date: snapshot.snapshotDate,
        totalStudents: entries.length,
        averagePoints,
        topPerformers,
      };
    });

    return {
      trends,
    };
  }
}
