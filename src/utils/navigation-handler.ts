'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect } from 'react';

// Navigation states
export type NavigationState = 'idle' | 'navigating' | 'error';

// Options for navigation
export interface NavigationOptions {
  // Whether to preserve scroll position
  preserveScroll?: boolean;
  // Whether to use view transitions API
  useTransitions?: boolean;
  // Direction of transition (for animations)
  direction?: 'forward' | 'backward';
  // Whether to provide haptic feedback on mobile
  hapticFeedback?: boolean;
  // Whether to open in a new tab
  newTab?: boolean;
  // Whether to use hard navigation (window.location)
  hardNavigation?: boolean;
  // Callback to run before navigation
  onBeforeNavigate?: () => void;
  // Callback to run after navigation
  onAfterNavigate?: () => void;
  // Callback to run if navigation fails
  onNavigationError?: (error: Error) => void;
  // Timeout for navigation (ms)
  navigationTimeout?: number;
  // Whether to include institution context in URL
  includeInstitution?: boolean;
  // Institution ID to use (overrides context)
  institutionId?: string;
}

// Default navigation options
const DEFAULT_OPTIONS: NavigationOptions = {
  preserveScroll: true,
  useTransitions: true,
  direction: 'forward',
  hapticFeedback: true,
  newTab: false,
  hardNavigation: false,
  navigationTimeout: 5000, // 5 seconds timeout by default
  includeInstitution: true, // Include institution context by default
};

/**
 * Hook for handling navigation with proper error handling and debouncing
 */
export function useNavigationHandler() {
  const router = useRouter();
  const [navigationState, setNavigationState] = useState<NavigationState>('idle');
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavigationTimeRef = useRef<number>(0);
  const isNavigatingRef = useRef<boolean>(false);

  // Try to get institution context if available
  let institutionContext: { institutionId: string } | null = null;
  try {
    // This will throw an error if InstitutionProvider is not in the component tree
    // We catch it silently to make this hook usable without the provider
    const { useInstitution } = require('@/providers/institution-provider');
    try {
      institutionContext = useInstitution();
    } catch (contextError) {
      // Institution context not available, will use default behavior
      console.log('[NavigationHandler] Institution context not available:', contextError);
    }
  } catch (e) {
    // Module not available, will use default behavior
    console.log('[NavigationHandler] Institution provider module not available');
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Handle navigation
  const navigate = useCallback(async (href: string, options: NavigationOptions = {}) => {
    // Merge with default options
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    // Don't allow navigation if already navigating
    if (isNavigatingRef.current) {
      console.log('[NavigationHandler] Navigation already in progress, ignoring request');
      return false;
    }

    // Debounce navigation - prevent multiple rapid clicks
    const now = Date.now();
    if (now - lastNavigationTimeRef.current < 300) { // 300ms debounce
      console.log('[NavigationHandler] Navigation debounced, ignoring request');
      return false;
    }

    // Handle institution context in URL if needed
    let finalHref = href;
    if (mergedOptions.includeInstitution && href.startsWith('/')) {
      // Get institution ID from options or context
      let contextInstitutionId = null;
      if (institutionContext && typeof institutionContext === 'object' && 'institutionId' in institutionContext) {
        contextInstitutionId = institutionContext.institutionId;
      }

      const institutionId = mergedOptions.institutionId || contextInstitutionId;

      if (institutionId && typeof institutionId === 'string') {
        // Only prepend if not already present
        if (!href.startsWith(`/${institutionId}/`)) {
          finalHref = `/${institutionId}${href}`;
          console.log(`[NavigationHandler] Added institution context: ${finalHref}`);
        }
      }
    }

    lastNavigationTimeRef.current = now;
    isNavigatingRef.current = true;
    setNavigationState('navigating');

    // Run before navigation callback
    if (mergedOptions.onBeforeNavigate) {
      mergedOptions.onBeforeNavigate();
    }

    // Provide haptic feedback if enabled
    if (mergedOptions.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10); // Subtle 10ms vibration
    }

    // Add transition classes if using transitions
    if (mergedOptions.useTransitions) {
      document.documentElement.classList.add('page-transitioning');
      if (mergedOptions.direction === 'backward') {
        document.documentElement.classList.add('transition-backward');
      } else {
        document.documentElement.classList.add('transition-forward');
      }
    }

    // Set a timeout to handle navigation failures
    navigationTimeoutRef.current = setTimeout(() => {
      if (isNavigatingRef.current) {
        console.error('[NavigationHandler] Navigation timeout, forcing navigation');

        // Force navigation using window.location as a fallback
        window.location.href = finalHref;

        // Clean up
        cleanupNavigation();

        // Set error state
        setNavigationState('error');

        // Run error callback
        if (mergedOptions.onNavigationError) {
          mergedOptions.onNavigationError(new Error('Navigation timeout'));
        }
      }
    }, mergedOptions.navigationTimeout);

    try {
      // Handle new tab navigation
      if (mergedOptions.newTab) {
        window.open(finalHref, '_blank');
        cleanupNavigation();
        return true;
      }

      // Handle hard navigation
      if (mergedOptions.hardNavigation) {
        window.location.href = finalHref;
        return true;
      }

      // Use View Transitions API if supported and enabled
      const isViewTransitionsSupported =
        'startViewTransition' in document &&
        typeof (document as any).startViewTransition === 'function' &&
        mergedOptions.useTransitions;

      if (isViewTransitionsSupported) {
        await (document as any).startViewTransition(async () => {
          router.push(finalHref);

          // Wait a bit to ensure the transition has started
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 100);
          });
        });
      } else {
        // Standard navigation
        router.push(finalHref);
      }

      // Clean up after a short delay to ensure the new page has loaded
      setTimeout(() => {
        cleanupNavigation();

        // Run after navigation callback
        if (mergedOptions.onAfterNavigate) {
          mergedOptions.onAfterNavigate();
        }
      }, 300);

      return true;
    } catch (error) {
      console.error('[NavigationHandler] Navigation error:', error);

      // Clean up
      cleanupNavigation();

      // Set error state
      setNavigationState('error');

      // Run error callback
      if (mergedOptions.onNavigationError && error instanceof Error) {
        mergedOptions.onNavigationError(error);
      }

      return false;
    }
  }, [router]);

  // Helper to clean up navigation state
  const cleanupNavigation = useCallback(() => {
    // Clear timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // Reset navigation state
    isNavigatingRef.current = false;
    setNavigationState('idle');

    // Remove transition classes
    document.documentElement.classList.remove('page-transitioning');
    document.documentElement.classList.remove('transition-backward');
    document.documentElement.classList.remove('transition-forward');
  }, []);

  return {
    navigate,
    navigationState,
    isNavigating: navigationState === 'navigating',
    hasError: navigationState === 'error',
  };
}
