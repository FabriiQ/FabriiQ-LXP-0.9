/**
 * Utility functions for the reward system
 */
import { PrismaClient } from '@prisma/client';
import { RewardSystemPrismaClient } from './types';

/**
 * Cast PrismaClient to RewardSystemPrismaClient
 * This is a type assertion helper to make TypeScript happy
 */
export function getRewardSystemPrisma(prisma: PrismaClient): RewardSystemPrismaClient {
  return prisma as unknown as RewardSystemPrismaClient;
}

/**
 * Create a reward system-ready Prisma client
 * This wraps the standard Prisma client with proper error handling for reward system models
 */
export function createRewardSystemPrisma(prisma: PrismaClient): RewardSystemPrismaClient {
  const rewardPrisma = prisma as unknown as RewardSystemPrismaClient;
  
  // Ensure the client has the required models
  if (!prisma['studentPoints'] || !prisma['studentLevel'] || 
      !prisma['studentAchievement'] || !prisma['studentPointsAggregate'] || 
      !prisma['leaderboardSnapshot']) {
    console.warn('Reward system models not found in Prisma client. Make sure you have run `npx prisma generate` after updating the schema.');
  }
  
  return rewardPrisma;
}
