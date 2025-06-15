'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cva, type VariantProps } from 'class-variance-authority';

// Dashboard layout variants
const dashboardLayoutVariants = cva(
  "w-full",
  {
    variants: {
      variant: {
        default: "",
        compact: "max-w-7xl mx-auto px-4",
        fluid: "px-4",
      },
      spacing: {
        default: "gap-6",
        tight: "gap-4",
        loose: "gap-8",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: "default",
    },
  }
);

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  variant?: 'default' | 'compact' | 'fluid';
  spacing?: 'default' | 'tight' | 'loose';
}

/**
 * DashboardLayout component for creating responsive dashboard layouts
 *
 * Features:
 * - Responsive grid system
 * - Mobile-specific layout
 * - Collapsible sidebar
 * - Role-based customization
 *
 * @example
 * ```tsx
 * <DashboardLayout
 *   sidebar={<Sidebar />}
 *   header={<Header />}
 *   footer={<Footer />}
 *   role="teacher"
 * >
 *   <DashboardSection title="Overview">
 *     <DashboardGrid columns={3}>
 *       <StatCard title="Users" value={1234} />
 *       <StatCard title="Revenue" value="$5,678" />
 *       <StatCard title="Orders" value={90} />
 *     </DashboardGrid>
 *   </DashboardSection>
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  children,
  className,
  sidebar,
  header,
  footer,
  variant,
  spacing,
  sidebarWidth = '240px',
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
  role,
}: DashboardLayoutProps) {
  const { isMobile } = useResponsive();

  // Get role-specific styles
  const getRoleStyles = () => {
    if (!role) return {};

    switch (role) {
      case 'systemAdmin':
        return { borderColor: '#1F504B' };
      case 'campusAdmin':
        return { borderColor: '#004EB2' };
      case 'teacher':
        return { borderColor: '#5A8A84' };
      case 'student':
        return { borderColor: '#2F96F4' };
      case 'parent':
        return { borderColor: '#6126AE' };
      default:
        return {};
    }
  };

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!collapsed);
    }
  };

  // For mobile, we stack everything vertically
  if (isMobile) {
    return (
      <div className={cn(dashboardLayoutVariants({ variant, spacing }), "flex flex-col", className)}>
        {header && (
          <div className="sticky top-0 z-10 bg-background border-b">
            {header}
          </div>
        )}

        <div className="flex flex-col space-y-4 py-4">
          {children}
        </div>

        {footer && (
          <div className="border-t mt-auto py-4">
            {footer}
          </div>
        )}
      </div>
    );
  }

  // For desktop, we use a sidebar layout
  return (
    <div className={cn(dashboardLayoutVariants({ variant, spacing }), className)}>
      <div className="flex h-screen overflow-hidden">
        {sidebar && (
          <div
            className={cn(
              "shrink-0 border-r overflow-y-auto transition-all duration-300",
              collapsed ? "w-16" : `w-[${sidebarWidth}]`
            )}
            style={getRoleStyles()}
          >
            {sidebar}
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {header && (
            <div className="sticky top-0 z-10 bg-background border-b">
              {header}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {footer && (
            <div className="border-t mt-auto py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface DashboardSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * DashboardSection component for grouping dashboard content
 */
export function DashboardSection({
  children,
  title,
  description,
  className,
  actions,
}: DashboardSectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || description || actions) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export interface DashboardGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

/**
 * DashboardGrid component for creating responsive grid layouts
 */
export function DashboardGrid({
  children,
  columns = 3,
  gap = 6,
  className,
}: DashboardGridProps) {
  const { isMobile, isTablet } = useResponsive();

  // Determine the number of columns based on screen size
  const getResponsiveColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return Math.min(columns, 2);
    return columns;
  };

  const responsiveColumns = getResponsiveColumns();

  return (
    <div
      className={cn(
        "grid",
        `gap-${gap}`,
        `grid-cols-${responsiveColumns}`,
        className
      )}
    >
      {children}
    </div>
  );
}
