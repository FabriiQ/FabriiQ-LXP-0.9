'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import { ActivityRegistryProvider } from './activity-registry-provider';
// ActivityPerformanceProvider is temporarily removed until we implement a simplified version
// import { ActivityPerformanceProvider } from './activity-performance-provider';

// Define routes that need activity functionality
const ACTIVITY_ROUTES = [
  // Teacher activity routes
  '/teacher/activities',
  '/teacher/classes/[classId]/activities',
  '/teacher/classes/[classId]/activities/create',
  '/teacher/classes/[classId]/activities/[activityId]',

  // Student activity routes
  '/student/activities',
  '/student/activities/view',

  // Admin activity routes
  '/admin/campus/classes/[id]/activities',
  '/admin/campus/classes/[id]/activities/new',

  // Content studio routes
  '/teacher/content-studio',
  '/admin/content-studio',

  // Example routes
  '/examples/activities',

  // Lesson plan routes that include activities
  '/teacher/classes/[classId]/lesson-plans/[id]',
  '/teacher/lesson-plans/[id]',
  '/admin/lesson-plans/[id]',
];

interface ConditionalActivityProviderProps {
  children: ReactNode;
}

export function ConditionalActivityProvider({ children }: ConditionalActivityProviderProps) {
  const pathname = usePathname();

  // Check if the current route needs activity functionality
  const needsActivityFunctionality = useMemo(() => {
    // Convert dynamic route patterns to regex patterns
    const routePatterns = ACTIVITY_ROUTES.map(route => {
      return new RegExp(
        '^' + route.replace(/\[.*?\]/g, '[^/]+') + '(/.*)?$'
      );
    });

    // Check if current pathname matches any of the patterns
    return routePatterns.some(pattern => pattern.test(pathname));
  }, [pathname]);

  // Only load activity providers if needed
  if (needsActivityFunctionality) {
    return (
      <ActivityRegistryProvider>
        {/*
          Note: ActivityPerformanceProvider is temporarily removed
          until we implement a simplified version that doesn't depend
          on the old registry system
        */}
        {children}
      </ActivityRegistryProvider>
    );
  }

  // Otherwise, just render children
  return <>{children}</>;
}
