'use client';

import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  className?: string;
}

/**
 * Notification badge component for the teacher assistant button
 * 
 * Shows a small red dot or a count if provided
 */
export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white",
        className
      )}
    >
      {count && count > 0 ? count : ''}
    </div>
  );
}
