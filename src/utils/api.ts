import { type CreateTRPCClientOptions } from '@trpc/client';
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";
import superjson from "superjson";
// No need to import React here

export const api = createTRPCReact<AppRouter>();

/**
 * Get the base URL for API requests
 */
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

/**
 * Create a tRPC client
 */
export const getApiClient = () => {
  return createTRPCClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        // You can pass any HTTP headers you wish here
        headers() {
          return {
            'Content-Type': 'application/json',
          };
        },
      }),
    ],
  });
};

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Export the router types for use in components