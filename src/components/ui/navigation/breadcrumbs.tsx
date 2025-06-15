'use client';

import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';

// Types
export interface BreadcrumbItem {
  /**
   * Label to display
   */
  label: React.ReactNode;
  /**
   * URL to navigate to
   */
  href?: string;
  /**
   * Icon to display before the label
   */
  icon?: React.ReactNode;
  /**
   * Whether this item is the current page
   */
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  /**
   * Array of breadcrumb items
   */
  items: BreadcrumbItem[];
  /**
   * Show home icon at the beginning
   * @default true
   */
  showHomeIcon?: boolean;
  /**
   * URL for the home icon
   * @default '/'
   */
  homeHref?: string;
  /**
   * Custom separator between items
   * @default <ChevronRight className="h-4 w-4" />
   */
  separator?: React.ReactNode;
  /**
   * Custom class for the breadcrumbs container
   */
  className?: string;
  /**
   * Custom class for each breadcrumb item
   */
  itemClassName?: string;
  /**
   * Custom class for the current breadcrumb item
   */
  currentItemClassName?: string;
  /**
   * Custom class for the separator
   */
  separatorClassName?: string;
}

export function Breadcrumbs({
  items,
  showHomeIcon = true,
  homeHref = '/',
  separator = <ChevronRight className="h-4 w-4" />,
  className,
  itemClassName,
  currentItemClassName,
  separatorClassName,
}: BreadcrumbsProps) {
  // Create home item if needed
  const allItems = React.useMemo(() => {
    if (showHomeIcon) {
      return [
        {
          label: 'Home',
          href: homeHref,
          icon: <Home className="h-4 w-4" />,
          isCurrent: false,
        } as BreadcrumbItem,
        ...items,
      ];
    }
    return items;
  }, [items, showHomeIcon, homeHref]);

  return (
    <nav aria-label="Breadcrumbs" className={cn("flex", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isCurrent = item.isCurrent || isLast;

          // Determine the content of the breadcrumb item
          const itemContent = (
            <span className="flex items-center gap-1">
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className={item.icon ? "sr-only sm:not-sr-only sm:ml-1" : ""}>
                {item.label}
              </span>
            </span>
          );

          return (
            <li
              key={index}
              className="flex items-center"
            >
              {/* Breadcrumb item */}
              <div
                className={cn(
                  "flex items-center text-sm font-medium",
                  isCurrent
                    ? cn("text-foreground", currentItemClassName)
                    : cn("text-muted-foreground hover:text-foreground", itemClassName),
                  "transition-colors"
                )}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {item.href && !isCurrent ? (
                  <ViewTransitionLink
                    href={item.href}
                    className="flex items-center"
                    ariaLabel={typeof item.label === 'string' ? item.label : 'Navigate to breadcrumb'}
                    hapticFeedback={true}
                  >
                    {itemContent}
                  </ViewTransitionLink>
                ) : (
                  itemContent
                )}
              </div>

              {/* Separator */}
              {!isLast && (
                <span
                  className={cn("mx-2 text-muted-foreground", separatorClassName)}
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;