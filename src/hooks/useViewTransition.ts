'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@/providers/navigation-provider';

/**
 * Custom hook for managing view transitions with data persistence
 *
 * This hook helps manage the state of view transitions and ensures
 * that data is properly preserved during transitions.
 */
/**
 * This hook is now a wrapper around the useNavigation hook
 * to maintain backward compatibility with existing code.
 *
 * New code should use the useNavigation hook directly.
 */
export function useViewTransition() {
  const { navigate, isNavigating } = useNavigation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  // Update isTransitioning when isNavigating changes
  useEffect(() => {
    setIsTransitioning(isNavigating);
  }, [isNavigating]);

  // Function to start a transition
  const startTransition = useCallback((direction: 'forward' | 'backward' = 'forward') => {
    console.log('[useViewTransition] Starting transition:', direction);

    setIsTransitioning(true);
    setTransitionDirection(direction);
    document.documentElement.classList.add('page-transitioning');

    // Add direction-specific class
    if (direction === 'forward') {
      document.documentElement.classList.add('transition-forward');
    } else {
      document.documentElement.classList.add('transition-backward');
    }

    // Add a class to indicate we're preserving state during transition
    document.documentElement.classList.add('preserve-state-transition');

    // Show loading indicator after a delay if transition takes too long
    const loadingTimeout = setTimeout(() => {
      if (document.documentElement.classList.contains('page-transitioning')) {
        console.log('[useViewTransition] Transition taking longer than expected, showing loading indicator');
        document.documentElement.classList.add('show-loading-indicator');
      }
    }, 300);

    return loadingTimeout;
  }, []);

  // Function to end a transition
  const endTransition = useCallback((loadingTimeout?: NodeJS.Timeout) => {
    console.log('[useViewTransition] Ending transition');

    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }

    // Use a short timeout to ensure the new page has time to render
    setTimeout(() => {
      setIsTransitioning(false);
      document.documentElement.classList.remove('page-transitioning');
      document.documentElement.classList.remove('show-loading-indicator');
      document.documentElement.classList.remove('transition-forward');
      document.documentElement.classList.remove('transition-backward');
      document.documentElement.classList.remove('preserve-state-transition');

      console.log('[useViewTransition] Transition classes removed');
    }, 50);
  }, []);

  // Function to navigate with transition
  const navigateWithTransition = useCallback(async (
    href: string,
    options?: {
      direction?: 'forward' | 'backward';
      preserveScroll?: boolean;
      preserveState?: boolean;
      includeInstitution?: boolean;
    }
  ) => {
    const direction = options?.direction || 'forward';
    const preserveState = options?.preserveState !== false;
    const preserveScroll = options?.preserveScroll !== false;
    const includeInstitution = options?.includeInstitution !== false;

    console.log('[useViewTransition] Navigating to:', href, {
      direction,
      preserveScroll,
      preserveState,
      includeInstitution
    });

    // Check if this is a class-related navigation
    const isClassNavigation = href.includes('/student/class/');
    if (isClassNavigation && preserveState) {
      console.log('[useViewTransition] Class navigation detected, ensuring state preservation');

      // Extract class ID from the URL
      const match = href.match(/\/student\/class\/([^\/]+)/);
      const classId = match ? match[1] : null;

      if (classId) {
        console.log('[useViewTransition] Class ID extracted:', classId);

        // Store the target class ID in sessionStorage
        try {
          sessionStorage.setItem('target-class-id', classId);
        } catch (e) {
          console.error('[useViewTransition] Error storing target class ID:', e);
        }
      }
    }

    // Use the unified navigation system
    await navigate(href, {
      direction,
      preserveScroll,
      useTransitions: true,
      includeInstitution,
      onBeforeNavigate: () => {
        // Add a special class for class navigation
        if (isClassNavigation) {
          document.documentElement.classList.add('class-navigation');
        }
        startTransition(direction);
      },
      onAfterNavigate: () => {
        // Remove the class-navigation class
        document.documentElement.classList.remove('class-navigation');
        endTransition();
      },
      onNavigationError: (error) => {
        console.error('[useViewTransition] Navigation error:', error);
        document.documentElement.classList.remove('class-navigation');
        endTransition();
      }
    });
  }, [navigate, startTransition, endTransition]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log('[useViewTransition] Cleaning up transition classes');
      document.documentElement.classList.remove('page-transitioning');
      document.documentElement.classList.remove('show-loading-indicator');
      document.documentElement.classList.remove('transition-forward');
      document.documentElement.classList.remove('transition-backward');
      document.documentElement.classList.remove('preserve-state-transition');
      document.documentElement.classList.remove('class-navigation');
    };
  }, []);

  return {
    isTransitioning,
    transitionDirection,
    startTransition,
    endTransition,
    navigateWithTransition
  };
}
