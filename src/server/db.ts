/**
 * Prisma Client Initialization
 *
 * This file initializes and exports the Prisma client instance for database access.
 * It ensures that only one instance is created in development to prevent connection issues.
 * It also initializes server components when the application starts.
 */

import { PrismaClient } from '@prisma/client';
import { initializeServer } from './init';

// Define a global type for the Prisma client to enable singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  serverInitialized: boolean | undefined;
};

// Create a new Prisma client or reuse the existing one
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// In development, save the client instance to avoid multiple connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize server components if not already initialized
// This ensures initialization happens only once, even with hot reloading
if (!globalForPrisma.serverInitialized) {
  // Only initialize in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BACKGROUND_JOBS === 'true') {
    initializeServer(prisma);
    globalForPrisma.serverInitialized = true;
  }
}

// Export the Prisma client
export { prisma };