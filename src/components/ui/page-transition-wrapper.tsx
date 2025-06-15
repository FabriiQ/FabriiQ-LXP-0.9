'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';

interface PageTransitionWrapperProps {
  children: ReactNode;
  className?: string;
  preserveState?: boolean;
  preserveScroll?: boolean;
  transitionDirection?: 'forward' | 'backward';
}

/**
 * PageTransitionWrapper - A component that wraps page content for transitions
 *
 * This component adds the necessary classes and structure for page transitions
 * to work properly with the View Transitions API while preserving data during transitions.
 *
 * Features:
 * - Preserves component state during transitions
 * - Maintains scroll position if desired
 * - Supports directional transitions (forward/backward)
 * - Shows loading indicator for slow transitions
 * - Optimized for reduced motion preferences
 */
export function PageTransitionWrapper({
  children,
  className = '',
  preserveState = true,
  preserveScroll = true,
  transitionDirection = 'forward'
}: PageTransitionWrapperProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Check for transition state in the DOM
  useEffect(() => {
    const checkTransitionState = () => {
      const isPageTransitioning = document.documentElement.classList.contains('page-transitioning');
      setIsTransitioning(isPageTransitioning);
    };

    // Check initially
    checkTransitionState();

    // Set up a mutation observer to watch for class changes on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTransitionState();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Save scroll position before transition
  useEffect(() => {
    if (isTransitioning && preserveScroll) {
      scrollPositionRef.current = window.scrollY;

      // Log transition start for debugging
      console.log('[PageTransition] Starting transition, preserving scroll position:', scrollPositionRef.current);

      // Add a class to indicate we're preserving state
      if (preserveState) {
        document.documentElement.classList.add('preserve-state');
      }
    }
  }, [isTransitioning, preserveScroll, preserveState]);

  // Restore scroll position after transition
  useEffect(() => {
    if (!isTransitioning) {
      // Log transition end for debugging
      console.log('[PageTransition] Transition ended');

      if (preserveScroll && scrollPositionRef.current > 0) {
        console.log('[PageTransition] Restoring scroll position:', scrollPositionRef.current);
        window.scrollTo(0, scrollPositionRef.current);
      }

      // Remove the preserve-state class
      document.documentElement.classList.remove('preserve-state');
    }
  }, [isTransitioning, preserveScroll]);

  // Apply direction-specific classes
  useEffect(() => {
    if (transitionDirection === 'backward') {
      document.documentElement.classList.add('transition-backward');
    } else {
      document.documentElement.classList.remove('transition-backward');
    }

    return () => {
      document.documentElement.classList.remove('transition-backward');
    };
  }, [transitionDirection]);

  // Add a class to the document to indicate we're using view transitions
  useEffect(() => {
    // Check if the View Transitions API is supported
    const isViewTransitionsSupported =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as any).startViewTransition === 'function';

    if (isViewTransitionsSupported) {
      document.documentElement.classList.add('using-view-transitions');
    } else {
      document.documentElement.classList.add('no-view-transitions');
    }

    return () => {
      document.documentElement.classList.remove('using-view-transitions');
      document.documentElement.classList.remove('no-view-transitions');
    };
  }, []);

  return (
    <div
      ref={contentRef}
      className={`page-content ${isTransitioning ? 'transitioning' : ''} ${preserveState ? 'preserve-content' : ''} ${className}`}
    >
      {/* Loading indicator for slow transitions */}
      <div className="loading-indicator" />

      {/* Page content */}
      {children}
    </div>
  );
}
