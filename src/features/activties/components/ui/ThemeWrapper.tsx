'use client';

import React, { useEffect, forwardRef } from 'react';
import { useTheme } from '@/providers/theme-provider';

/**
 * ThemeWrapper component
 *
 * This component ensures that all activity components respect the current theme.
 * It adds a data-theme attribute to the wrapped component and forces a re-render
 * when the theme changes.
 */
// Extend from React.HTMLAttributes<HTMLDivElement> to include all standard HTML div props
interface ThemeWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const ThemeWrapper = forwardRef<HTMLDivElement, ThemeWrapperProps>(
  ({ children, className, ...props }, ref) => {
    const { theme, resolvedTheme } = useTheme();

    // Force re-render when theme changes
    useEffect(() => {
      // Apply theme to document body to ensure all components respect the theme
      document.body.setAttribute('data-theme', theme || 'light');

      // This is needed to force Tailwind's dark mode to update properly
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [theme, resolvedTheme]);

    return (
      <div
        ref={ref}
        data-theme={theme}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export default ThemeWrapper;
