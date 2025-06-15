/**
 * Example Router
 * Demonstrates the use of various middlewares
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc';
import { 
  withCache, 
  withPerformanceMonitoring, 
  withRateLimit,
  combineMiddlewareHelpers
} from '@/server/api/middleware';
import { TRPCError } from '@trpc/server';

export const exampleRouter = createTRPCRouter({
  /**
   * Public hello endpoint with caching
   */
  hello: publicProcedure
    .meta({
      ...withCache({ ttl: 60 }), // Cache for 60 seconds
      ...withPerformanceMonitoring({ logAll: true }),
    })
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Protected endpoint with rate limiting
   */
  getSecretMessage: protectedProcedure
    .meta({
      ...withRateLimit({ limit: 5, windowInSeconds: 60 }), // 5 requests per minute
      ...withPerformanceMonitoring({ warnThreshold: 200 }),
    })
    .query(() => {
      return {
        message: "This is a secret message!",
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Endpoint with combined middleware helpers
   */
  complexOperation: protectedProcedure
    .meta(combineMiddlewareHelpers(
      withCache({ ttl: 300 }), // Cache for 5 minutes
      withRateLimit({ limit: 10, windowInSeconds: 60 }), // 10 requests per minute
      withPerformanceMonitoring({ warnThreshold: 300, errorThreshold: 800 })
    ))
    .input(z.object({ 
      id: z.string().uuid(),
      operation: z.enum(['analyze', 'process', 'transform'])
    }))
    .mutation(async ({ input, ctx }) => {
      // Simulate a complex operation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Simulate potential errors
      if (Math.random() < 0.1) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Random error occurred during processing',
        });
      }
      
      return {
        result: `Operation ${input.operation} completed for ID ${input.id}`,
        timestamp: new Date().toISOString(),
        userId: ctx.session.userId,
      };
    }),

  /**
   * Endpoint that demonstrates error handling
   */
  simulateError: publicProcedure
    .input(z.object({ 
      errorType: z.enum(['client', 'server', 'validation', 'none'])
    }))
    .query(({ input }) => {
      switch (input.errorType) {
        case 'client':
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This is a simulated client error',
          });
        case 'server':
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'This is a simulated server error',
          });
        case 'validation':
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Validation failed',
            cause: {
              errors: [
                { path: ['field1'], message: 'Field1 is required' },
                { path: ['field2'], message: 'Field2 must be a string' },
              ]
            }
          });
        case 'none':
          return {
            message: 'No error occurred',
            timestamp: new Date().toISOString(),
          };
      }
    }),
}); 