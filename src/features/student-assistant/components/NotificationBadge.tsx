'use client';

import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  className?: string;
  count?: number;
}

/**
 * NotificationBadge component
 * 
 * Displays a notification badge for the assistant button
 * 
 * @param props Component props
 * @returns JSX element
 */
export function NotificationBadge({ className, count }: NotificationBadgeProps) {
  return (
    <div 
      className={cn(
        "absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center",
        className
      )}
    >
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
      <span className="sr-only">Notification</span>
    </div>
  );
}
