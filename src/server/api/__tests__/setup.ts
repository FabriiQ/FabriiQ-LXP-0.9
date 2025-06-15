/**
 * Jest Test Setup
 * Configures the test environment for all tests
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock the Prisma client
jest.mock('@/server/db', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Import the mocked Prisma client
import { prisma } from '@/server/db';

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prisma);
});

// Global test timeout
jest.setTimeout(10000);

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 