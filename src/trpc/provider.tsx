/**
 * tRPC Provider Component
 * Provides tRPC client to the React component tree with optimized caching
 */

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { api } from "./react";
import superjson from "superjson";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createOptimizedQueryClient } from "@/utils/query-config";
import { batchFilterLink, loggingLink } from "@/utils/trpc-batch-filter";

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // Use the optimized query client with enhanced caching configuration
  const [queryClient] = useState(() => createOptimizedQueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        // Add our custom batch filter link to filter out invalid procedures
        batchFilterLink(),

        // Add logging link for debugging (optional, can be removed in production)
        loggingLink(),

        // Standard HTTP batch link
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              'x-trpc-source': 'react',
              'Content-Type': 'application/json',
            };
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include', // This ensures cookies are sent with the request
            });
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}


