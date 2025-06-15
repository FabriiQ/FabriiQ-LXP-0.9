/**
 * Test Utilities
 * Helper functions for testing services
 */

import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';
import { prisma } from '@/server/db';

// Type for mocked Prisma client
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/**
 * Get the mocked Prisma client
 */
export function getMockPrisma(): MockPrismaClient {
  return prisma as unknown as MockPrismaClient;
}

/**
 * Create a mock context for service testing
 */
export function createMockContext() {
  return {
    prisma: getMockPrisma(),
  };
}

/**
 * Helper to create a test service instance
 * @param ServiceClass - The service class to instantiate
 * @returns An instance of the service with mocked dependencies
 */
export function createTestService<T>(
  ServiceClass: new (context: { prisma: PrismaClient }) => T
): T {
  const context = createMockContext();
  return new ServiceClass(context);
} 