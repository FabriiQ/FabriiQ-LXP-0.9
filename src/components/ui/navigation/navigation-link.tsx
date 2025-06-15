'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNavigationHandler, NavigationOptions } from '@/utils/navigation-handler';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NavigationLinkProps extends NavigationOptions {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  ariaLabel?: string;
  showLoadingIndicator?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * NavigationLink - An improved link component with proper navigation handling
 *
 * Features:
 * - Debounced navigation to prevent multiple clicks
 * - Proper error handling
 * - Support for view transitions
 * - Loading indicator
 * - Haptic feedback
 * - Active state styling
 */
export function NavigationLink({
  href,
  children,
  className = '',
  activeClassName = '',
  ariaLabel,
  showLoadingIndicator = true,
  disabled = false,
  onClick,
  ...navigationOptions
}: NavigationLinkProps) {
  const pathname = usePathname();
  const { navigate, isNavigating } = useNavigationHandler();
  const [showLoader, setShowLoader] = useState(false);

  // Determine if this link is active
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  // Handle click
  const handleClick = async (e: React.MouseEvent) => {
    // Allow custom onClick handler to run first
    if (onClick) {
      onClick(e);
    }

    // Don't navigate if disabled or default prevented
    if (disabled || e.defaultPrevented) {
      return;
    }

    e.preventDefault();

    // Show loader after a short delay if navigation takes time
    const loaderTimeout = setTimeout(() => {
      if (showLoadingIndicator) {
        setShowLoader(true);
      }
    }, 300);

    // Navigate with options
    await navigate(href, {
      ...navigationOptions,
      onAfterNavigate: () => {
        clearTimeout(loaderTimeout);
        setShowLoader(false);

        if (navigationOptions.onAfterNavigate) {
          navigationOptions.onAfterNavigate();
        }
      },
      onNavigationError: (error) => {
        clearTimeout(loaderTimeout);
        setShowLoader(false);

        if (navigationOptions.onNavigationError) {
          navigationOptions.onNavigationError(error);
        }
      }
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        className,
        isActive && activeClassName,
        disabled && 'pointer-events-none opacity-50',
        isNavigating && 'pointer-events-none'
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-label={ariaLabel}
      aria-disabled={disabled || isNavigating}
    >
      {children}
      {showLoader && isNavigating && (
        <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
      )}
    </Link>
  );
}

/**
 * NavigationButton - A button that navigates to a URL
 */
export function NavigationButton({
  href,
  children,
  className = '',
  activeClassName = '',
  ariaLabel,
  showLoadingIndicator = true,
  disabled = false,
  onClick,
  ...navigationOptions
}: NavigationLinkProps) {
  const pathname = usePathname();
  const { navigate, isNavigating } = useNavigationHandler();
  const [showLoader, setShowLoader] = useState(false);

  // Determine if this button is active
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  // Handle click
  const handleClick = async (e: React.MouseEvent) => {
    // Allow custom onClick handler to run first
    if (onClick) {
      onClick(e);
    }

    // Don't navigate if disabled or default prevented
    if (disabled || e.defaultPrevented) {
      return;
    }

    e.preventDefault();

    // Show loader after a short delay if navigation takes time
    const loaderTimeout = setTimeout(() => {
      if (showLoadingIndicator) {
        setShowLoader(true);
      }
    }, 300);

    // Navigate with options
    await navigate(href, {
      ...navigationOptions,
      onAfterNavigate: () => {
        clearTimeout(loaderTimeout);
        setShowLoader(false);

        if (navigationOptions.onAfterNavigate) {
          navigationOptions.onAfterNavigate();
        }
      },
      onNavigationError: (error) => {
        clearTimeout(loaderTimeout);
        setShowLoader(false);

        if (navigationOptions.onNavigationError) {
          navigationOptions.onNavigationError(error);
        }
      }
    });
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        className,
        isActive && activeClassName,
        isNavigating && 'pointer-events-none'
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-label={ariaLabel}
      disabled={disabled || isNavigating}
      variant={navigationOptions.variant || 'default'}
      size={navigationOptions.size || 'default'}
    >
      {children}
      {showLoader && isNavigating && (
        <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
      )}
    </Button>
  );
}
