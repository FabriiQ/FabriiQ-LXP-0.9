'use client';

import { useEffect, useState } from 'react';
import { roleThemes } from '@/styles/design-tokens';

export type UserRole = 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';

/**
 * Hook to apply role-based theming
 * 
 * This hook applies the appropriate CSS variables for the user's role
 * and returns the current role and theme information.
 * 
 * @param initialRole - The initial user role
 * @returns An object containing the current role and a function to change the role
 * 
 * @example
 * ```tsx
 * const { role, setRole } = useRoleTheme('teacher');
 * 
 * // Change the role
 * setRole('student');
 * ```
 */
export function useRoleTheme(initialRole: UserRole = 'student') {
  const [role, setRole] = useState<UserRole>(initialRole);
  
  useEffect(() => {
    // Get the theme for the current role
    const theme = roleThemes[role];
    
    // Apply CSS variables to the document root
    const root = document.documentElement;
    
    // Set primary colors
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-foreground', '#ffffff');
    
    // Set secondary colors
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--secondary-foreground', '#ffffff');
    
    // Set accent colors
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-foreground', '#ffffff');
    
    // Set background colors
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.foreground);
    
    // Set muted colors
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--muted-foreground', theme.mutedForeground);
    
    // Set border color
    root.style.setProperty('--border', theme.border);
    
    // Add a data attribute to the body for CSS selectors
    document.body.setAttribute('data-role', role);
    
    // Add a class to the body for CSS selectors
    document.body.classList.remove(
      'theme-system-admin',
      'theme-campus-admin',
      'theme-teacher',
      'theme-student',
      'theme-parent'
    );
    document.body.classList.add(`theme-${role.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    
  }, [role]);
  
  return { role, setRole };
}
