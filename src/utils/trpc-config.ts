import superjson from 'superjson';

/**
 * Configuration for tRPC
 * This is used by both client and server
 */
export const trpcConfig = {
  transformer: superjson,
} as const; 