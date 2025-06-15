'use client';

import { useToast } from '@/components/ui/feedback/toast';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface ContextChangeToastProps {
  /**
   * Whether to show toasts for context changes
   */
  enabled?: boolean;
}

/**
 * ContextChangeToast - A component that shows toast notifications for context changes
 *
 * Features:
 * - Detects navigation between different sections
 * - Shows helpful toast messages for context changes
 * - Reduces disorientation during navigation
 * - Provides feedback for user actions
 */
export function ContextChangeToast({ enabled = true }: ContextChangeToastProps) {
  const { toast } = useToast();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Skip initial render
    if (previousPathRef.current === null) {
      previousPathRef.current = pathname;
      return;
    }

    // Check if we've navigated to a different section
    const previousPath = previousPathRef.current;
    const currentPath = pathname || '';

    // Update the previous path
    previousPathRef.current = currentPath;

    // Extract sections from paths
    const getPrimarySection = (path: string) => {
      const parts = path.split('/').filter(Boolean);
      return parts.length > 1 ? parts[1] : '';
    };

    const getSecondarySection = (path: string) => {
      const parts = path.split('/').filter(Boolean);
      return parts.length > 2 ? parts[2] : '';
    };

    const previousPrimarySection = getPrimarySection(previousPath);
    const currentPrimarySection = getPrimarySection(currentPath);

    const previousSecondarySection = getSecondarySection(previousPath);
    const currentSecondarySection = getSecondarySection(currentPath);

    // Check for class ID in the path
    const classIdMatch = currentPath.match(/\/class(?:es)?\/([^\/]+)/);
    const classId = classIdMatch ? classIdMatch[1] : '';

    // Check for view parameter
    const viewParam = searchParams?.get('view') || '';

    // Show toast for primary section changes
    if (previousPrimarySection !== currentPrimarySection) {
      toast({
        description: `Navigated to ${currentPrimarySection} section`,
        variant: 'info',
        duration: 2000
      });
    }
    // Show toast for secondary section changes if in the same primary section
    else if (previousSecondarySection !== currentSecondarySection) {
      if (currentSecondarySection === 'class' || currentSecondarySection === 'classes') {
        toast({
          description: 'Viewing your classes',
          variant: 'info',
          duration: 2000
        });
      } else if (classId && currentPath.includes('/activities')) {
        toast({
          description: 'Viewing class activities',
          variant: 'info',
          duration: 2000
        });
      } else if (classId && currentPath.includes('/leaderboard')) {
        toast({
          description: 'Viewing class leaderboard',
          variant: 'info',
          duration: 2000
        });
      } else if (classId && currentPath.includes('/calendar')) {
        toast({
          description: 'Viewing class calendar',
          variant: 'info',
          duration: 2000
        });
      } else if (currentSecondarySection) {
        toast({
          description: `Navigated to ${currentSecondarySection}`,
          variant: 'info',
          duration: 2000
        });
      }
    }
    // Show toast for view changes
    else if (viewParam) {
      toast({
        description: `Switched to ${viewParam} view`,
        variant: 'info',
        duration: 2000
      });
    }
  }, [pathname, searchParams, toast, enabled]);

  // This component doesn't render anything
  return null;
}
