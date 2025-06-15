'use client';

import { useState, useEffect } from 'react';

// Define breakpoints based on Tailwind's default breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect if the current viewport is below a specified breakpoint
 * @param breakpoint - The breakpoint to check against
 * @returns Boolean indicating if the viewport is below the breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  // Default to false for SSR
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(false);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const checkBreakpoint = () => {
      setIsBelowBreakpoint(window.innerWidth < breakpoints[breakpoint]);
    };

    // Initial check
    checkBreakpoint();

    // Add event listener for resize
    window.addEventListener('resize', checkBreakpoint);

    // Cleanup
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isBelowBreakpoint;
}

/**
 * Safe hook to get responsive layout information that works with SSR
 * @returns Object with boolean flags for different device types
 */
export function useResponsive() {
  // Default to desktop for SSR
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only run breakpoint hooks if mounted (client-side)
  const isMobileBreakpoint = useBreakpoint('md');
  const isTabletBreakpoint = useBreakpoint('lg');

  // Use these values only when mounted
  const isMobile = isMounted ? isMobileBreakpoint : false;
  const isTablet = isMounted ? (!isMobileBreakpoint && isTabletBreakpoint) : false;
  const isDesktop = isMounted ? (!isMobileBreakpoint && !isTabletBreakpoint) : true; // Default to desktop for SSR

  return {
    isMobile,
    isTablet,
    isDesktop,
    // Utility for conditional rendering
    only: {
      mobile: isMobile,
      tablet: isTablet,
      desktop: isDesktop,
    },
    // Utility for "up" queries (e.g., "md and up" means tablet and desktop)
    up: {
      tablet: !isMobile,
      desktop: isDesktop,
    },
    // Utility for "down" queries (e.g., "lg and down" means mobile and tablet)
    down: {
      tablet: isMobile || isTablet,
      mobile: isMobile,
    },
  };
}
