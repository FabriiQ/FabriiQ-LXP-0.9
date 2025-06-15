'use client';

import React, { useState, useEffect } from 'react';
import { isOnline, addSyncListener, removeSyncListener, SyncStatus } from '../persistence/syncManager';
import './OfflineIndicator.css';

interface OfflineIndicatorProps {
  className?: string;
  showSyncStatus?: boolean;
  position?: 'top' | 'bottom';
  variant?: 'banner' | 'floating' | 'inline';
}

/**
 * Component to display offline status and sync progress
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showSyncStatus = true,
  position = 'top',
  variant = 'banner',
}) => {
  const [online, setOnline] = useState(isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync status
  useEffect(() => {
    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);
    };

    addSyncListener(handleSyncStatusChange);

    return () => {
      removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  // If online and not syncing, don't show anything
  if (online && syncStatus !== SyncStatus.SYNCING) {
    return null;
  }

  // Determine indicator content
  let content: React.ReactNode;

  if (!online) {
    content = (
      <div className="offline-content">
        <span className="offline-icon">📶</span>
        <span className="offline-text">You are offline. Your work will be saved and synced when you reconnect.</span>
      </div>
    );
  } else if (syncStatus === SyncStatus.SYNCING && showSyncStatus) {
    content = (
      <div className="sync-content">
        <span className="sync-icon">🔄</span>
        <span className="sync-text">Syncing your work...</span>
        {syncProgress !== undefined && (
          <div className="sync-progress">
            <div className="sync-progress-bar" style={{ width: `${syncProgress}%` }}></div>
          </div>
        )}
      </div>
    );
  } else {
    return null;
  }

  // Determine indicator class based on variant and position
  let indicatorClass = 'offline-indicator';

  if (variant === 'banner') {
    indicatorClass += ' offline-indicator-banner';
    indicatorClass += position === 'top' ? ' offline-indicator-top' : ' offline-indicator-bottom';
  } else if (variant === 'floating') {
    indicatorClass += ' offline-indicator-floating';
    indicatorClass += position === 'top' ? ' offline-indicator-top-right' : ' offline-indicator-bottom-right';
  } else {
    indicatorClass += ' offline-indicator-inline';
  }

  // Add status-specific class
  if (!online) {
    indicatorClass += ' offline-indicator-offline';
  } else if (syncStatus === SyncStatus.SYNCING) {
    indicatorClass += ' offline-indicator-syncing';
  }

  return (
    <div className={`${indicatorClass} ${className}`}>
      {content}
    </div>
  );
};
