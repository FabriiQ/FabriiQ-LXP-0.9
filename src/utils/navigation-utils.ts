'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/feedback/toast';

/**
 * Utility to redirect from old activity paths to class-specific ones
 * @param classId The class ID to redirect to
 */
export function useActivityRedirect(classId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Only redirect if we have a classId and are on an old activity path
    if (!classId || !pathname) return;

    // Check if we're on an old activity path
    const isOldActivityPath = pathname.startsWith('/student/activities') ||
                             pathname.startsWith('/activities');

    if (isOldActivityPath) {
      // Extract activity ID if present in the path
      const activityIdMatch = pathname.match(/\/activities\/([^\/]+)/);
      const activityId = activityIdMatch ? activityIdMatch[1] : null;

      // Construct the new path
      const newPath = activityId
        ? `/student/class/${classId}/activities/${activityId}`
        : `/student/class/${classId}/activities`;

      // Show toast notification
      toast({
        title: 'Redirecting',
        description: 'Taking you to your class-specific activities',
        variant: 'info',
        duration: 3000
      });

      // Redirect with a slight delay to allow the toast to be seen
      setTimeout(() => {
        router.push(newPath);
      }, 500);
    }
  }, [pathname, classId, router, toast]);
}

/**
 * Hook to preserve scroll position during navigation
 * @param key A unique key for the scroll position (usually the route)
 */
export function useScrollPreservation(key: string) {
  useEffect(() => {
    // Get saved scroll position from sessionStorage
    const savedPosition = sessionStorage.getItem(`scroll_${key}`);

    if (savedPosition) {
      // Restore scroll position
      window.scrollTo(0, parseInt(savedPosition, 10));
      // Clear the saved position
      sessionStorage.removeItem(`scroll_${key}`);
    }

    // Save scroll position before navigating away
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll_${key}`, window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [key]);
}

/**
 * Get the previous page from history or fallback to a default
 * @param defaultPath Default path to return if no history is available
 */
export function getPreviousPage(defaultPath: string = '/student/classes'): string {
  if (typeof window === 'undefined') return defaultPath;

  // Check if we have history
  if (window.history.length > 1) {
    return 'back'; // Special value to trigger router.back()
  }

  return defaultPath;
}

/**
 * Navigate back or to a fallback path
 * @param router Next.js router
 * @param fallbackPath Path to navigate to if can't go back
 */
export function goBack(router: any, fallbackPath: string = '/student/classes') {
  const previousPage = getPreviousPage(fallbackPath);

  if (previousPage === 'back') {
    router.back();
  } else {
    router.push(previousPage);
  }
}

/**
 * Generate breadcrumb items for student navigation
 * @param path Current path
 * @param className Optional class name
 * @param subjectName Optional subject name
 * @param activityName Optional activity name
 */
export function generateStudentBreadcrumbs(
  path: string,
  className?: string,
  subjectName?: string,
  activityName?: string
): Array<{
  label: string;
  href: string;
  isCurrent?: boolean;
}> {
  const breadcrumbs: Array<{
    label: string;
    href: string;
    isCurrent?: boolean;
  }> = [
    { label: 'Home', href: '/student/classes' }
  ];

  // Extract class ID from path
  const classIdMatch = path.match(/\/class(?:es)?\/([^\/]+)/);
  const classId = classIdMatch ? classIdMatch[1] : null;

  if (classId) {
    breadcrumbs.push({
      label: className || `Class ${classId}`,
      href: `/student/class/${classId}/dashboard`
    });

    // Check for subject in path
    const subjectIdMatch = path.match(/\/subjects\/([^\/]+)/);
    const subjectId = subjectIdMatch ? subjectIdMatch[1] : null;

    if (subjectId) {
      breadcrumbs.push({
        label: subjectName || `Subject ${subjectId}`,
        href: `/student/class/${classId}/subjects/${subjectId}`
      });
    }

    // Check for activities section
    if (path.includes('/activities')) {
      if (!subjectId) {
        breadcrumbs.push({
          label: 'Activities',
          href: `/student/class/${classId}/activities`
        });
      } else {
        breadcrumbs.push({
          label: 'Activities',
          href: `/student/class/${classId}/subjects/${subjectId}/activities`
        });
      }

      // Check for specific activity
      const activityIdMatch = path.match(/\/activities\/([^\/]+)/);
      const activityId = activityIdMatch ? activityIdMatch[1] : null;

      if (activityId && activityName) {
        breadcrumbs.push({
          label: activityName,
          href: path,
          isCurrent: true
        });
      }
    }

    // Check for other sections
    const sectionMatch = path.match(/\/class(?:es)?\/[^\/]+\/([^\/]+)/);
    const section = sectionMatch ? sectionMatch[1] : null;

    if (section && !['activities', 'subjects', 'dashboard'].includes(section)) {
      breadcrumbs.push({
        label: section.charAt(0).toUpperCase() + section.slice(1),
        href: path,
        isCurrent: true
      });
    }
  }

  return breadcrumbs;
}
