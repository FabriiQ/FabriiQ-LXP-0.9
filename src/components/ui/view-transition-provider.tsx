'use client';

import { ReactNode, useEffect } from 'react';

interface ViewTransitionProviderProps {
  children: ReactNode;
}

/**
 * ViewTransitionProvider - A component that provides view transition context
 *
 * This is a safer implementation that doesn't rely on the external next-view-transitions package.
 * It uses the native View Transitions API when available, and falls back gracefully when not.
 */
export function ViewTransitionProvider({ children }: ViewTransitionProviderProps) {
  // Add a class to the document to indicate we're using view transitions
  useEffect(() => {
    // Check if the View Transitions API is supported
    const isViewTransitionsSupported =
      'startViewTransition' in document &&
      typeof (document as any).startViewTransition === 'function';

    if (isViewTransitionsSupported) {
      document.documentElement.classList.add('using-view-transitions');
    } else {
      // Add a class to indicate view transitions are not supported
      document.documentElement.classList.add('no-view-transitions');
      console.warn('View Transitions API is not supported in this browser. Falling back to regular navigation.');
    }

    return () => {
      document.documentElement.classList.remove('using-view-transitions');
      document.documentElement.classList.remove('no-view-transitions');
    };
  }, []);

  return <>{children}</>;
}
