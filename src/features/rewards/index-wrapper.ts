/**
 * Reward System Wrapper
 *
 * This module provides a simplified wrapper around the reward system
 * to make it easier to use in the application.
 */

import { PrismaClient } from '@prisma/client';
import { RewardSystem } from './index';
import { ActivityRewardIntegration } from './activity-integration';
import { createRewardSystemPrisma } from './utils';

/**
 * Create a reward system instance with proper type handling
 */
export function createRewardSystem(prisma: PrismaClient): RewardSystem {
  return new RewardSystem({ prisma });
}

/**
 * Create an activity reward integration instance with proper type handling
 */
export function createActivityRewardIntegration(prisma: PrismaClient): ActivityRewardIntegration {
  return new ActivityRewardIntegration(prisma);
}

/**
 * Initialize the reward system
 * This ensures all required models are available and properly typed
 */
export function initializeRewardSystem(prisma: PrismaClient): {
  rewardSystem: RewardSystem;
  activityRewardIntegration: ActivityRewardIntegration;
} {
  // Ensure the Prisma client has the reward system models
  createRewardSystemPrisma(prisma);

  // Create the reward system instances
  const rewardSystem = createRewardSystem(prisma);
  const activityRewardIntegration = createActivityRewardIntegration(prisma);

  return {
    rewardSystem,
    activityRewardIntegration
  };
}

// Re-export types and classes
export * from './index';
export * from './activity-integration';
export * from './types';
export * from './utils';

// Export offline functionality
export * from './offline';
export * from './analytics';
export * from './offline/sync';
export * from './offline/hooks';

// Export components directly
import {
  OfflineStatusBadge,
  AchievementSyncIndicator,
  PointsSyncIndicator,
  LevelSyncIndicator
} from './offline/components';

export {
  OfflineStatusBadge,
  AchievementSyncIndicator,
  PointsSyncIndicator,
  LevelSyncIndicator
};

// Initialize offline support
export async function initializeOfflineSupport(): Promise<boolean> {
  // Import dynamically to avoid SSR issues
  const { initOfflineSupport } = await import('./offline/sync');
  return initOfflineSupport();
}
