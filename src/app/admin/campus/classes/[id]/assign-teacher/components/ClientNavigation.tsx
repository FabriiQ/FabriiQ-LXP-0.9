'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { NavigationButton } from '@/components/ui/navigation/navigation-link';
import { InstitutionNavigationButton } from '@/components/ui/navigation/institution-navigation-link';

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
 * BackToClassButton - A button that navigates back to the class page
 *
 * This component has been updated to use the unified navigation system
 * with proper error handling, debouncing, and loading indicators.
 */
export function BackToClassButton({ classId }: { classId: string }) {
  return (
    <InstitutionNavigationButton
      href={`/admin/campus/classes/${classId}`}
      variant="outline"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Class
    </InstitutionNavigationButton>
  );
}

/**
 * AssignTeacherButton - A button that navigates to the assign teacher page
 *
 * This component has been updated to use the unified navigation system
 * with proper error handling, debouncing, and loading indicators.
 */
export function AssignTeacherButton({ classId }: { classId: string }) {
  return (
    <InstitutionNavigationButton
      href={`/admin/campus/classes/${classId}/assign-teacher`}
      variant="outline"
    >
      <UserPlus className="h-4 w-4 mr-2" />
      Assign Teacher
    </InstitutionNavigationButton>
  );
}
