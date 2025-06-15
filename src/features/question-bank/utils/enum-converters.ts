/**
 * Enum Converters
 *
 * This file provides utility functions for converting between different enum representations
 * in the application, particularly for handling SystemStatus values between client and server.
 */

import { SystemStatus as PrismaSystemStatus } from '@prisma/client';
import { SystemStatus as QuestionBankSystemStatus } from '../models/types';

/**
 * Convert a string or enum value to the Prisma SystemStatus enum
 *
 * @param status The status value to convert (can be string or enum)
 * @returns The corresponding Prisma SystemStatus enum value, or ACTIVE if invalid
 */
export function toPrismaSystemStatus(status: string | QuestionBankSystemStatus | undefined): PrismaSystemStatus {
  if (!status) {
    return PrismaSystemStatus.ACTIVE;
  }

  try {
    // Convert to string for consistent handling
    const statusStr = status.toString();

    // Direct mapping for known values
    switch (statusStr) {
      case 'ACTIVE':
        return PrismaSystemStatus.ACTIVE;
      case 'INACTIVE':
        return PrismaSystemStatus.INACTIVE;
      case 'ARCHIVED':
        return PrismaSystemStatus.ARCHIVED;
      case 'DELETED':
        return PrismaSystemStatus.DELETED;
      case 'ARCHIVED_CURRENT_YEAR':
        return PrismaSystemStatus.ARCHIVED_CURRENT_YEAR;
      case 'ARCHIVED_PREVIOUS_YEAR':
        return PrismaSystemStatus.ARCHIVED_PREVIOUS_YEAR;
      case 'ARCHIVED_HISTORICAL':
        return PrismaSystemStatus.ARCHIVED_HISTORICAL;
      default:
        // If we can't map it directly, try to use it as a key
        if (statusStr in PrismaSystemStatus) {
          return PrismaSystemStatus[statusStr as keyof typeof PrismaSystemStatus];
        }

        // Default to ACTIVE if all else fails
        console.warn(`Invalid SystemStatus value: ${statusStr}, defaulting to ACTIVE`);
        return PrismaSystemStatus.ACTIVE;
    }
  } catch (error) {
    console.error(`Error converting SystemStatus: ${error}`);
    return PrismaSystemStatus.ACTIVE;
  }
}

/**
 * Convert a Prisma SystemStatus enum to the QuestionBank SystemStatus enum
 *
 * @param status The Prisma SystemStatus enum value
 * @returns The corresponding QuestionBank SystemStatus enum value
 */
export function toQuestionBankSystemStatus(status: PrismaSystemStatus): QuestionBankSystemStatus {
  try {
    // Convert to string for consistent handling
    const statusStr = status.toString();

    // Direct mapping for known values
    switch (statusStr) {
      case 'ACTIVE':
        return QuestionBankSystemStatus.ACTIVE;
      case 'INACTIVE':
        return QuestionBankSystemStatus.INACTIVE;
      case 'ARCHIVED':
        return QuestionBankSystemStatus.ARCHIVED;
      case 'DELETED':
        return QuestionBankSystemStatus.DELETED;
      case 'ARCHIVED_CURRENT_YEAR':
        return QuestionBankSystemStatus.ARCHIVED_CURRENT_YEAR;
      case 'ARCHIVED_PREVIOUS_YEAR':
        return QuestionBankSystemStatus.ARCHIVED_PREVIOUS_YEAR;
      case 'ARCHIVED_HISTORICAL':
        return QuestionBankSystemStatus.ARCHIVED_HISTORICAL;
      default:
        // If we can't map it directly, try to use it as a key
        if (statusStr in QuestionBankSystemStatus) {
          return QuestionBankSystemStatus[statusStr as keyof typeof QuestionBankSystemStatus];
        }

        // Default to ACTIVE if all else fails
        console.warn(`Invalid SystemStatus value: ${statusStr}, defaulting to ACTIVE`);
        return QuestionBankSystemStatus.ACTIVE;
    }
  } catch (error) {
    console.error(`Error converting Prisma SystemStatus to QuestionBank SystemStatus: ${error}`);
    return QuestionBankSystemStatus.ACTIVE;
  }
}
