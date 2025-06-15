'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { SimpleCard } from '../extended/card';
import { Badge } from '@/components/ui/atoms/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';

// Data card variants
const dataCardVariants = cva(
  "overflow-hidden",
  {
    variants: {
      layout: {
        default: "",
        horizontal: "flex flex-row",
        grid: "grid",
        list: "flex flex-col",
      },
      size: {
        default: "",
        sm: "p-2",
        lg: "p-6",
      },
    },
    defaultVariants: {
      layout: "default",
      size: "default",
    },
  }
);

export interface DataItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  status?: string;
  statusVariant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline';
  metadata?: { label: string; value: string | number }[];
  actions?: React.ReactNode;
  [key: string]: any;
}

export interface DataCardProps {
  data: DataItem;
  isLoading?: boolean;
  className?: string;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  renderCustomContent?: (data: DataItem) => React.ReactNode;
  onCardClick?: (data: DataItem) => void;
  layout?: 'default' | 'horizontal' | 'grid' | 'list';
  size?: 'default' | 'sm' | 'lg';
}

/**
 * DataCard component for displaying data items
 *
 * Features:
 * - Multiple layout options (default, horizontal, grid, list)
 * - Loading state with skeleton
 * - Status badge
 * - Metadata display
 * - Custom content rendering
 * - Role-specific styling
 * - Mobile-optimized with responsive design
 *
 * @example
 * ```tsx
 * <DataCard
 *   data={{
 *     id: '1',
 *     title: 'Item Title',
 *     description: 'Item description',
 *     status: 'Active',
 *     statusVariant: 'primary',
 *     metadata: [
 *       { label: 'Created', value: '2023-01-01' },
 *       { label: 'Author', value: 'John Doe' }
 *     ],
 *     actions: <Button>View</Button>
 *   }}
 *   layout="horizontal"
 *   role="teacher"
 * />
 * ```
 */
export function DataCard({
  data,
  layout,
  size,
  isLoading = false,
  className,
  role,
  renderCustomContent,
  onCardClick,
}: DataCardProps) {
  // Handle card click
  const handleClick = () => {
    if (onCardClick) {
      onCardClick(data);
    }
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <SimpleCard
        className={cn(dataCardVariants({ layout, size }), className)}
        role={role}
        variant="outline"
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex flex-wrap gap-2 mt-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </SimpleCard>
    );
  }

  // If custom content renderer is provided, use it
  if (renderCustomContent) {
    return (
      <SimpleCard
        className={cn(
          dataCardVariants({ layout, size }),
          onCardClick && "cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        role={role}
        onClick={handleClick}
      >
        {renderCustomContent(data)}
      </SimpleCard>
    );
  }

  // Default rendering based on layout
  return (
    <SimpleCard
      className={cn(
        dataCardVariants({ layout, size }),
        onCardClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      role={role}
      title={
        <div className="flex items-center justify-between">
          <span>{data.title}</span>
          {data.status && (
            <Badge variant={data.statusVariant || 'default'}>
              {data.status}
            </Badge>
          )}
        </div>
      }
      description={data.description}
      footer={data.actions}
      onClick={handleClick}
    >
      {/* Metadata display */}
      {data.metadata && data.metadata.length > 0 && (
        <div className={cn(
          "grid gap-2",
          layout === 'horizontal' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}>
          {data.metadata.map((item, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </SimpleCard>
  );
}

/**
 * DataCardGrid component for displaying multiple data items in a grid
 */
export interface DataCardGridProps extends Omit<DataCardProps, 'data'> {
  items: DataItem[];
  columns?: number;
  gap?: number;
}

export function DataCardGrid({
  items,
  columns = 3,
  gap = 4,
  isLoading = false,
  layout = 'default',
  size,
  className,
  role,
  renderCustomContent,
  onCardClick,
}: DataCardGridProps) {
  // Generate skeleton items for loading state
  const skeletonItems = isLoading ? Array(columns * 2).fill(null).map((_, i) => ({
    id: `skeleton-${i}`,
    title: 'Loading...'
  })) : [];

  // Determine the data to display
  const displayItems = isLoading ? skeletonItems : items;

  return (
    <div
      className={cn(
        "grid gap-4",
        `grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns}`,
        `gap-${gap}`,
        className
      )}
    >
      {displayItems.map((item) => (
        <DataCard
          key={item.id}
          data={item}
          isLoading={isLoading}
          layout={layout}
          size={size}
          role={role}
          renderCustomContent={renderCustomContent}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
