'use client';

import React, { useState, useEffect } from 'react';
import { isOnline, addSyncListener, removeSyncListener, SyncStatus } from './sync';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineStatusBadgeProps {
  className?: string;
  showSyncStatus?: boolean;
}

/**
 * OfflineStatusBadge component for displaying offline status
 * 
 * Features:
 * - Shows offline status with icon
 * - Optionally shows sync status
 * - Updates automatically when status changes
 */
export function OfflineStatusBadge({ className, showSyncStatus = true }: OfflineStatusBadgeProps) {
  const [offline, setOffline] = useState(!isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);

  // Update offline status when online/offline events occur
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    // Set initial state
    setOffline(!isOnline());

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for sync status changes
  useEffect(() => {
    if (!showSyncStatus) return;

    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);
    };

    // Add sync listener
    addSyncListener(handleSyncStatusChange);

    return () => {
      // Remove sync listener
      removeSyncListener(handleSyncStatusChange);
    };
  }, [showSyncStatus]);

  // If online and not syncing, don't show anything
  if (!offline && (!showSyncStatus || syncStatus === SyncStatus.IDLE)) {
    return null;
  }

  // If offline, show offline badge
  if (offline) {
    return (
      <Badge variant="outline" className={cn("bg-yellow-100 text-yellow-800 border-yellow-300", className)}>
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  }

  // If syncing, show sync badge
  if (showSyncStatus && syncStatus === SyncStatus.SYNCING) {
    return (
      <Badge variant="outline" className={cn("bg-blue-100 text-blue-800 border-blue-300", className)}>
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Syncing{syncProgress !== undefined ? ` ${syncProgress}%` : ''}
      </Badge>
    );
  }

  // If sync success, show success badge
  if (showSyncStatus && syncStatus === SyncStatus.SUCCESS) {
    return (
      <Badge variant="outline" className={cn("bg-green-100 text-green-800 border-green-300", className)}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Synced
      </Badge>
    );
  }

  // If sync error, show error badge
  if (showSyncStatus && syncStatus === SyncStatus.ERROR) {
    return (
      <Badge variant="outline" className={cn("bg-red-100 text-red-800 border-red-300", className)}>
        <AlertCircle className="h-3 w-3 mr-1" />
        Sync Error
      </Badge>
    );
  }

  return null;
}

interface OfflineIndicatorProps {
  className?: string;
  showSyncStatus?: boolean;
  position?: 'top' | 'bottom';
  variant?: 'banner' | 'floating' | 'inline';
}

/**
 * OfflineIndicator component for displaying offline status
 * 
 * Features:
 * - Shows offline status with icon
 * - Optionally shows sync status
 * - Updates automatically when status changes
 * - Multiple position and variant options
 */
export function OfflineIndicator({
  className,
  showSyncStatus = true,
  position = 'top',
  variant = 'banner'
}: OfflineIndicatorProps) {
  const [offline, setOffline] = useState(!isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);

  // Update offline status when online/offline events occur
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    // Set initial state
    setOffline(!isOnline());

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for sync status changes
  useEffect(() => {
    if (!showSyncStatus) return;

    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);
    };

    // Add sync listener
    addSyncListener(handleSyncStatusChange);

    return () => {
      // Remove sync listener
      removeSyncListener(handleSyncStatusChange);
    };
  }, [showSyncStatus]);

  // If online and not syncing, don't show anything
  if (!offline && (!showSyncStatus || syncStatus === SyncStatus.IDLE)) {
    return null;
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          "w-full px-4 py-2 text-sm font-medium text-center",
          offline ? "bg-yellow-100 text-yellow-800" : 
            syncStatus === SyncStatus.SYNCING ? "bg-blue-100 text-blue-800" :
            syncStatus === SyncStatus.SUCCESS ? "bg-green-100 text-green-800" :
            syncStatus === SyncStatus.ERROR ? "bg-red-100 text-red-800" : "",
          position === 'top' ? "sticky top-0 z-50" : "sticky bottom-0 z-50",
          className
        )}
      >
        {offline ? (
          <div className="flex items-center justify-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>You're offline. Changes will be saved and synced when you reconnect.</span>
          </div>
        ) : showSyncStatus && syncStatus === SyncStatus.SYNCING ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Syncing your changes{syncProgress !== undefined ? ` (${syncProgress}%)` : ''}...</span>
          </div>
        ) : showSyncStatus && syncStatus === SyncStatus.SUCCESS ? (
          <div className="flex items-center justify-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>All changes synced successfully!</span>
          </div>
        ) : showSyncStatus && syncStatus === SyncStatus.ERROR ? (
          <div className="flex items-center justify-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Some changes couldn't be synced. We'll try again later.</span>
          </div>
        ) : null}
      </div>
    );
  }

  // Floating variant
  if (variant === 'floating') {
    return (
      <div
        className={cn(
          "fixed z-50 px-4 py-2 rounded-full shadow-md text-sm font-medium",
          offline ? "bg-yellow-100 text-yellow-800" : 
            syncStatus === SyncStatus.SYNCING ? "bg-blue-100 text-blue-800" :
            syncStatus === SyncStatus.SUCCESS ? "bg-green-100 text-green-800" :
            syncStatus === SyncStatus.ERROR ? "bg-red-100 text-red-800" : "",
          position === 'top' ? "top-4 right-4" : "bottom-20 right-4", // Bottom position adjusted for bottom nav
          className
        )}
      >
        {offline ? (
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>Offline</span>
          </div>
        ) : showSyncStatus && syncStatus === SyncStatus.SYNCING ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Syncing{syncProgress !== undefined ? ` ${syncProgress}%` : ''}</span>
          </div>
        ) : showSyncStatus && syncStatus === SyncStatus.SUCCESS ? (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>Synced</span>
          </div>
        ) : showSyncStatus && syncStatus === SyncStatus.ERROR ? (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Sync Error</span>
          </div>
        ) : null}
      </div>
    );
  }

  // Inline variant (default to OfflineStatusBadge)
  return (
    <OfflineStatusBadge className={className} showSyncStatus={showSyncStatus} />
  );
}
