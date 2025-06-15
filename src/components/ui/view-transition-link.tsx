'use client';

import { ReactNode, useEffect } from 'react';
import { NavigationLink, NavigationLinkProps } from '@/components/ui/navigation/navigation-link';
import { InstitutionNavigationLink } from '@/components/ui/navigation/institution-navigation-link';

// Extend the NavigationLinkProps to include ViewTransition specific props
interface ViewTransitionLinkProps extends NavigationLinkProps {
  transitionName?: string; // Optional custom transition name
  preserveState?: boolean; // Whether to preserve component state
  includeInstitution?: boolean; // Whether to include institution context
  prefetch?: boolean; // Enable prefetching for perceived performance
}

/**
 * ViewTransitionLink - A component that enhances navigation with smooth transitions
 *
 * This component uses the View Transitions API to create smooth page transitions
 * while reducing cognitive load by maintaining context between pages.
 *
 * Features:
 * - Prefetches target pages for perceived instant loading
 * - Provides haptic feedback on mobile devices
 * - Shows loading indicator for slow connections
 * - Supports accessibility with ARIA attributes
 * - Optimized for reduced motion preferences
 */
/**
 * ViewTransitionLink - A component that enhances navigation with smooth transitions
 *
 * This component now uses our unified navigation system with proper error handling,
 * debouncing, and loading indicators, while maintaining the view transition functionality.
 */
export function ViewTransitionLink({
  href,
  children,
  className,
  prefetch = true,
  hapticFeedback = true,
  ariaLabel,
  direction = 'forward',
  preserveScroll = true,
  preserveState = true,
  includeInstitution = true,
  ...props
}: ViewTransitionLinkProps) {
  // Check if this is a class-related navigation
  const isClassNavigation = href.includes('/student/class/');

  // Store class ID in sessionStorage for class navigation
  useEffect(() => {
    if (isClassNavigation) {
      // Extract class ID from the URL
      const match = href.match(/\/student\/class\/([^\/]+)/);
      const classId = match ? match[1] : null;

      if (classId) {
        console.log('[ViewTransitionLink] Class navigation detected, preserving class ID:', classId);

        // Store the current class ID in sessionStorage to help with transitions
        try {
          sessionStorage.setItem('current-class-id', classId);
        } catch (e) {
          console.error('[ViewTransitionLink] Error storing class ID:', e);
        }
      }
    }
  }, [href, isClassNavigation]);

  // Use the appropriate navigation component based on whether to include institution context
  if (includeInstitution) {
    return (
      <InstitutionNavigationLink
        href={href}
        className={className}
        ariaLabel={ariaLabel}
        hapticFeedback={hapticFeedback}
        preserveScroll={preserveScroll}
        direction={direction}
        useTransitions={true}
        showLoadingIndicator={true}
        {...props}
      >
        {children}
      </InstitutionNavigationLink>
    );
  }

  return (
    <NavigationLink
      href={href}
      className={className}
      ariaLabel={ariaLabel}
      hapticFeedback={hapticFeedback}
      preserveScroll={preserveScroll}
      direction={direction}
      useTransitions={true}
      showLoadingIndicator={true}
      {...props}
    >
      {children}
    </NavigationLink>
  );
}
