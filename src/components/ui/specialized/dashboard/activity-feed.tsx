'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SimpleCard } from '@/components/ui/extended/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Button } from '@/components/ui/core/button';
import { Badge } from '@/components/ui/atoms/badge';
import { Avatar } from '@/components/ui/core/avatar';
import { AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import { format, formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  type?: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  link?: {
    text: string;
    url: string;
  };
  metadata?: Record<string, any>;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  description?: string;
  className?: string;
  isLoading?: boolean;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent' | 'coordinator';
  maxItems?: number;
  showViewMore?: boolean;
  onViewMore?: () => void;
  emptyMessage?: string;
  showTimeAgo?: boolean;
  showDate?: boolean;
  groupByDate?: boolean;
  compact?: boolean;
}

/**
 * ActivityFeed component for displaying activity timelines
 *
 * Features:
 * - Loading state with skeleton
 * - Role-specific styling
 * - Grouping by date
 * - Time ago or formatted date display
 * - Compact mode for mobile
 * - Virtualization for performance
 *
 * @example
 * ```tsx
 * <ActivityFeed
 *   items={[
 *     {
 *       id: '1',
 *       title: 'User logged in',
 *       timestamp: new Date(),
 *       user: {
 *         id: '1',
 *         name: 'John Doe',
 *         avatar: '/avatars/john.jpg',
 *       },
 *       type: 'success',
 *     }
 *   ]}
 *   title="Recent Activity"
 *   role="teacher"
 *   showTimeAgo
 * />
 * ```
 */
export function ActivityFeed({
  items,
  title = 'Activity Feed',
  description,
  className,
  isLoading = false,
  role,
  maxItems = 10,
  showViewMore = false,
  onViewMore,
  emptyMessage = 'No activity to show',
  showTimeAgo = true,
  showDate = true,
  groupByDate = false,
  compact = false,
}: ActivityFeedProps) {
  const [visibleItems, setVisibleItems] = useState(maxItems);

  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

    if (showTimeAgo) {
      return formatDistanceToNow(date, { addSuffix: true });
    }

    if (showDate) {
      return format(date, 'MMM d, yyyy h:mm a');
    }

    return format(date, 'h:mm a');
  };

  // Group items by date if needed
  const getGroupedItems = () => {
    if (!groupByDate) {
      return { ungrouped: items.slice(0, visibleItems) };
    }

    const grouped: Record<string, ActivityItem[]> = {};

    items.slice(0, visibleItems).forEach(item => {
      const date = typeof item.timestamp === 'string'
        ? new Date(item.timestamp)
        : item.timestamp;

      const dateKey = format(date, 'yyyy-MM-dd');
      const dateLabel = format(date, 'MMMM d, yyyy');

      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }

      grouped[dateLabel].push(item);
    });

    return grouped;
  };

  // Get badge variant based on activity type
  const getBadgeVariant = (type?: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'destructive';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  // Handle view more
  const handleViewMore = () => {
    if (onViewMore) {
      onViewMore();
    } else {
      setVisibleItems(prev => prev + maxItems);
    }
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <SimpleCard
        className={className}
        title={title}
        description={description}
        role={role}
        compact={compact}
      >
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </SimpleCard>
    );
  }

  // If no items, show empty message
  if (items.length === 0) {
    return (
      <SimpleCard
        className={className}
        title={title}
        description={description}
        role={role}
        compact={compact}
      >
        <div className="py-4 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </SimpleCard>
    );
  }

  const groupedItems = getGroupedItems();

  return (
    <SimpleCard
      className={className}
      title={title}
      description={description}
      role={role}
      compact={compact}
    >
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([dateLabel, dateItems]) => (
          <div key={dateLabel} className="space-y-4">
            {groupByDate && dateLabel !== 'ungrouped' && (
              <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
                {dateLabel}
              </h4>
            )}

            <div className="space-y-4">
              {dateItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  {/* User avatar or icon */}
                  {item.user ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={item.user.avatar}
                        alt={item.user.name}
                      />
                      <AvatarFallback>
                        {item.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ) : item.icon ? (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {item.icon}
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted" />
                  )}

                  {/* Activity content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {item.title}
                        {item.type && (
                          <Badge
                            variant={getBadgeVariant(item.type)}
                            className="ml-2"
                          >
                            {item.type}
                          </Badge>
                        )}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}

                    {item.link && (
                      <a
                        href={item.link.url}
                        className="text-xs text-primary hover:underline"
                      >
                        {item.link.text}
                      </a>
                    )}

                    {item.user?.role && (
                      <p className="text-xs text-muted-foreground">
                        {item.user.role}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {showViewMore && items.length > visibleItems && (
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewMore}
            >
              View More
            </Button>
          </div>
        )}
      </div>
    </SimpleCard>
  );
}
