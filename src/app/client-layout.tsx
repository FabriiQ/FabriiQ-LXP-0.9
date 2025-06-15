'use client';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme-provider";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { TRPCProvider } from "@/trpc/provider";
import { ConditionalActivityProvider } from "./conditional-activity-provider";
import { NavigationProvider } from "@/providers/navigation-provider";
import { InstitutionProvider } from "@/providers/institution-provider";
import dynamic from 'next/dynamic';

// Dynamically import ViewTransitionProvider with error handling
const ViewTransitionProvider = dynamic(
  () => import('@/components/ui/view-transition-provider').then(mod => ({ default: mod.ViewTransitionProvider }))
    .catch(() => {
      console.error('Failed to load ViewTransitionProvider, using fallback');
      // Return a simple wrapper component as fallback
      return { default: ({ children }: { children: React.ReactNode }) => <>{children}</> };
    }),
  { ssr: false }
);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <TRPCProvider>
              <ThemeProvider>
                <NavigationProvider>
                  <InstitutionProvider defaultInstitutionId="default">
                    <ViewTransitionProvider>
                      <ConditionalActivityProvider>
                        {children}
                      </ConditionalActivityProvider>
                    </ViewTransitionProvider>
                  </InstitutionProvider>
                </NavigationProvider>
              </ThemeProvider>
            </TRPCProvider>
          </QueryClientProvider>
        </SessionProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}



