'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isOnline } from '@/features/coordinator/offline/sync';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
  variant?: 'badge' | 'banner' | 'icon';
}

/**
 * OfflineIndicator component for the coordinator portal
 * 
 * Displays an indicator when the user is offline with different variants
 */
export function OfflineIndicator({
  className,
  showOnlineStatus = false,
  variant = 'badge'
}: OfflineIndicatorProps) {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    // Function to update online status
    const updateOnlineStatus = () => {
      setOnline(navigator.onLine);
    };

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // If online and not showing online status, don't render anything
  if (online && !showOnlineStatus) {
    return null;
  }

  // Render based on variant
  switch (variant) {
    case 'banner':
      return (
        <div
          className={cn(
            'w-full py-2 px-4 flex items-center justify-center text-sm font-medium',
            online
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
            className
          )}
        >
          {online ? (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              <span>You are online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 mr-2" />
              <span>You are offline. Some features may be limited.</span>
            </>
          )}
        </div>
      );

    case 'icon':
      return online && showOnlineStatus ? (
        <Wifi
          className={cn(
            'h-5 w-5 text-green-600 dark:text-green-400',
            className
          )}
        />
      ) : (
        <WifiOff
          className={cn(
            'h-5 w-5 text-amber-600 dark:text-amber-400',
            className
          )}
        />
      );

    case 'badge':
    default:
      return (
        <div
          className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            online
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
            className
          )}
        >
          {online ? (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              <span>Offline</span>
            </>
          )}
        </div>
      );
  }
}
