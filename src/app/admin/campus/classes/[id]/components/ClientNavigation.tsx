'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { NavigationButton, NavigationLink } from '@/components/ui/navigation/navigation-link';
import { InstitutionNavigationButton, InstitutionNavigationLink } from '@/components/ui/navigation/institution-navigation-link';

interface ClientNavigationProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  includeInstitution?: boolean;
}

/**
 * ClientNavButton - A button that navigates to a URL
 *
 * This component has been updated to use the unified navigation system
 * with proper error handling, debouncing, and loading indicators.
 */
export function ClientNavButton({
  href,
  children,
  variant = 'default',
  className,
  size = 'default',
  includeInstitution = true
}: ClientNavigationProps) {
  // Use the appropriate navigation component based on whether to include institution context
  if (includeInstitution) {
    return (
      <InstitutionNavigationButton
        href={href}
        variant={variant}
        className={className}
        size={size}
      >
        {children}
      </InstitutionNavigationButton>
    );
  }

  return (
    <NavigationButton
      href={href}
      variant={variant}
      className={className}
      size={size}
    >
      {children}
    </NavigationButton>
  );
}

/**
 * ClientLink - A link component that navigates to a URL
 *
 * This component has been updated to use the unified navigation system
 * with proper error handling, debouncing, and loading indicators.
 */
export function ClientLink({
  href,
  children,
  className,
  includeInstitution = true
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  includeInstitution?: boolean;
}) {
  // Use the appropriate navigation component based on whether to include institution context
  if (includeInstitution) {
    return (
      <InstitutionNavigationLink href={href} className={className}>
        {children}
      </InstitutionNavigationLink>
    );
  }

  return (
    <NavigationLink href={href} className={className}>
      {children}
    </NavigationLink>
  );
}
