# Centralized Leaderboard Implementation Guide

## Overview

This guide provides detailed implementation steps for creating a centralized leaderboard system with clear separation between academic performance metrics and reward points. The implementation leverages the existing partitioned leaderboard architecture to create a single source of truth for all portals.

## 1. Database Schema

The system already has a partitioned leaderboard architecture with the following key models:

1. **LeaderboardSnapshot**: A partitioned table that stores leaderboard data
   ```prisma
   model LeaderboardSnapshot {
     id              String       @id @default(cuid())
     type            String       // CLASS, SUBJECT, COURSE, OVERALL
     referenceId     String       // classId, subjectId, courseId, or campusId
     snapshotDate    DateTime     @default(now())
     entries         Json         // Array of leaderboard entries
     metadata        Json?        // Additional metadata
     timeGranularity String       @default("all-time")
     partitionKey    String?      // For database partitioning
     institutionId   String?      // Institution reference
     // ...indexes and relations
   }
   ```

2. **StudentPoints**: Records individual point awards
3. **StudentPointsAggregate**: Stores pre-calculated aggregates
4. **ActivityGrade**: Stores student grades for activities

## 2. Standardized Leaderboard Entry Structure

Define a standard structure for the entries JSON field in the LeaderboardSnapshot model:

```typescript
export interface StandardLeaderboardEntry {
  // Core identification
  studentId: string;
  studentName: string;
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
  
  // Ranking
  rank: number;                 // Current position
  previousRank?: number;        // Previous position
  improvement?: number;         // % improvement
}
```

## 3. Centralized Leaderboard Service

Create a new `StandardLeaderboardService` that will be the single source of truth:

```typescript
// src/server/api/services/standard-leaderboard.service.ts

import { PrismaClient, SystemStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import { LeaderboardPartitioningService } from './leaderboard-partitioning.service';
import { 
  StandardLeaderboardEntry, 
  LeaderboardPeriod, 
  StandardLeaderboardResponse 
} from '../types/standard-leaderboard';

export class StandardLeaderboardService {
  private prisma: PrismaClient;
  private partitioningService: LeaderboardPartitioningService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }
  
  /**
   * Get leaderboard data for any entity type
   */
  async getLeaderboard(options: {
    type: 'class' | 'subject' | 'course' | 'campus';
    referenceId: string;
    period?: LeaderboardPeriod;
    limit?: number;
    offset?: number;
    includeCurrentStudent?: boolean;
    currentStudentId?: string;
  }): Promise<StandardLeaderboardResponse> {
    try {
      const { 
        type, 
        referenceId, 
        period = LeaderboardPeriod.ALL_TIME,
        limit = 50,
        offset = 0,
        includeCurrentStudent = false,
        currentStudentId
      } = options;
      
      // Map period to timeGranularity
      const timeGranularity = this.mapPeriodToTimeGranularity(period);
      
      // Get institution ID based on entity type
      const institutionId = await this.getInstitutionId(type, referenceId);
      
      // Get the latest leaderboard snapshot
      const snapshot = await this.prisma.leaderboardSnapshot.findFirst({
        where: {
          type: type.toUpperCase(),
          referenceId,
          timeGranularity,
          institutionId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          snapshotDate: 'desc',
        },
      });
      
      if (!snapshot) {
        // If no snapshot exists, create one
        return this.createAndReturnLeaderboard(type, referenceId, period, limit, offset, includeCurrentStudent, currentStudentId);
      }
      
      // Parse entries from the snapshot
      const entries = snapshot.entries as StandardLeaderboardEntry[];
      
      // Apply pagination
      let paginatedEntries = entries.slice(offset, offset + limit);
      
      // If includeCurrentStudent is true and currentStudentId is provided,
      // ensure the current student is included in the results
      if (includeCurrentStudent && currentStudentId) {
        const currentStudentEntry = entries.find(entry => entry.studentId === currentStudentId);
        if (currentStudentEntry && !paginatedEntries.some(entry => entry.studentId === currentStudentId)) {
          // Add the current student to the paginated results
          paginatedEntries.push(currentStudentEntry);
        }
      }
      
      // Get metadata based on entity type
      const metadata = await this.getMetadata(type, referenceId);
      
      return {
        leaderboard: paginatedEntries,
        totalStudents: entries.length,
        filters: {
          period,
          limit,
          offset,
        },
        metadata,
      };
    } catch (error) {
      logger.error('Error getting leaderboard', { error, options });
      throw error;
    }
  }
  
  /**
   * Create a new leaderboard snapshot and return the data
   */
  private async createAndReturnLeaderboard(
    type: 'class' | 'subject' | 'course' | 'campus',
    referenceId: string,
    period: LeaderboardPeriod,
    limit: number,
    offset: number,
    includeCurrentStudent: boolean,
    currentStudentId?: string
  ): Promise<StandardLeaderboardResponse> {
    // Implementation to create a new snapshot and return the data
    // This would use the partitioning service to create the snapshot
    // and then return the data in the standard format
  }
  
  /**
   * Map LeaderboardPeriod to timeGranularity
   */
  private mapPeriodToTimeGranularity(period: LeaderboardPeriod): string {
    switch (period) {
      case LeaderboardPeriod.DAILY:
        return 'daily';
      case LeaderboardPeriod.WEEKLY:
      case LeaderboardPeriod.CURRENT_WEEK:
        return 'weekly';
      case LeaderboardPeriod.MONTHLY:
      case LeaderboardPeriod.CURRENT_MONTH:
        return 'monthly';
      case LeaderboardPeriod.TERM:
      case LeaderboardPeriod.CURRENT_TERM:
        return 'term';
      case LeaderboardPeriod.ALL_TIME:
      default:
        return 'all-time';
    }
  }
  
  /**
   * Get institution ID based on entity type and reference ID
   */
  private async getInstitutionId(type: string, referenceId: string): Promise<string> {
    // Implementation to get the institution ID based on the entity type and reference ID
  }
  
  /**
   * Get metadata based on entity type and reference ID
   */
  private async getMetadata(type: string, referenceId: string): Promise<any> {
    // Implementation to get metadata based on the entity type and reference ID
  }
  
  // Additional methods for specific entity types, student positions, etc.
}
```

## 4. Standardized API Endpoints

Update the leaderboard router to use the new standardized service:

```typescript
// src/server/api/routers/leaderboard.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { StandardLeaderboardService } from "../services/standard-leaderboard.service";
import { LeaderboardPeriod } from "../types/standard-leaderboard";

export const leaderboardRouter = createTRPCRouter({
  // Get leaderboard for any entity type
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        type: z.enum(['class', 'subject', 'course', 'campus']),
        referenceId: z.string(),
        period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().optional().default(0),
        includeCurrentStudent: z.boolean().optional().default(false),
        currentStudentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const leaderboardService = new StandardLeaderboardService({ prisma: ctx.prisma });
      return leaderboardService.getLeaderboard(input);
    }),
    
  // Maintain backward compatibility with existing endpoints
  getClassLeaderboard: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const leaderboardService = new StandardLeaderboardService({ prisma: ctx.prisma });
      return leaderboardService.getLeaderboard({
        type: 'class',
        referenceId: input.classId,
        period: input.period,
        limit: input.limit,
      });
    }),
    
  // Similar endpoints for subject, course, and campus leaderboards
});
```

## 5. Standardized Frontend Components

Create a set of standardized UI components that clearly separate academic performance from reward points:

```tsx
// src/components/leaderboard/StandardLeaderboardTable.tsx

import { useState } from "react";
import { StandardLeaderboardEntry, LeaderboardPeriod } from "@/server/api/types/standard-leaderboard";

interface StandardLeaderboardTableProps {
  title: string;
  description?: string;
  leaderboard: StandardLeaderboardEntry[];
  totalStudents: number;
  currentPeriod: LeaderboardPeriod;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  isLoading?: boolean;
  limit?: number;
  showPagination?: boolean;
  currentStudentId?: string;
}

export function StandardLeaderboardTable({
  title,
  description,
  leaderboard,
  totalStudents,
  currentPeriod,
  onPeriodChange,
  isLoading = false,
  limit = 10,
  showPagination = false,
  currentStudentId,
}: StandardLeaderboardTableProps) {
  // Implementation of the standardized leaderboard table
  // This would include clear separation between academic performance and reward points
}
```

## 6. Fixing the Single Student Issue

The single student issue is likely caused by incorrect data mapping in the optimized queries. To fix this:

1. Update the `createOptimizedLeaderboardSnapshot` function to use the standardized entry structure:

```typescript
export async function createOptimizedLeaderboardSnapshot(
  prisma: PrismaClient,
  type: string,
  referenceId: string,
  limit: number = 100
): Promise<any> {
  try {
    // Get student data with proper joins
    const students = await prisma.studentEnrollment.findMany({
      where: {
        classId: type === 'class' ? referenceId : undefined,
        student: {
          // Additional filters based on type
        },
        status: SystemStatus.ACTIVE,
      },
      select: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
            enrollmentNumber: true,
            // Other fields
          },
        },
      },
      take: limit,
    });

    // Get additional data (points, grades, etc.)
    // ...

    // Create standardized entries
    const entries: StandardLeaderboardEntry[] = students.map(enrollment => {
      const student = enrollment.student;
      // Create standardized entry
      // ...
    });

    // Sort and assign ranks
    const rankedEntries = assignRanks(entries);

    // Create snapshot
    const snapshot = await prisma.leaderboardSnapshot.create({
      data: {
        type,
        referenceId,
        entries: rankedEntries,
        // Other fields
      },
    });

    return snapshot;
  } catch (error) {
    logger.error('Error creating optimized leaderboard snapshot', { error, type, referenceId });
    throw error;
  }
}
```

## 7. Implementation Plan

1. **Phase 1: Data Model Standardization**
   - Create the `StandardLeaderboardEntry` interface
   - Update the leaderboard snapshot creation process

2. **Phase 2: Service Implementation**
   - Implement the `StandardLeaderboardService`
   - Update the leaderboard router

3. **Phase 3: Frontend Updates**
   - Create standardized UI components
   - Update portal-specific views

4. **Phase 4: Testing and Validation**
   - Test with various datasets
   - Verify consistent behavior across all portals

## Conclusion

By implementing this centralized leaderboard system, we will create a single source of truth for leaderboard data with clear separation between academic performance and reward points. This will ensure a consistent user experience across all portals, fix the single student issue, and improve overall system performance and maintainability.
