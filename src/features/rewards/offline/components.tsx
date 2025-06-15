'use client';

import React, { useState, useEffect } from 'react';
import { isOnline, addSyncListener, removeSyncListener, SyncStatus } from './sync';
import { Badge } from '@/components/ui/atoms/badge';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
// Use a simple span with emoji for WifiOff since it's not available
const WifiOff = ({ className }: { className?: string }) => (
  <span className={className} role="img" aria-label="offline">📶</span>
);

interface OfflineStatusBadgeProps {
  className?: string;
  showSyncStatus?: boolean;
}

/**
 * Component to display offline status for rewards
 */
export const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({
  className = '',
  showSyncStatus = true,
}) => {
  const [online, setOnline] = useState(isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);

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
    const handleSyncStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    addSyncListener(handleSyncStatusChange);

    return () => {
      removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  // If online and not syncing, show nothing or success
  if (online && syncStatus !== SyncStatus.SYNCING && syncStatus !== SyncStatus.ERROR) {
    if (!showSyncStatus) return null;

    return (
      <Badge
        variant="success"
        className={`flex items-center gap-1 ${className}`}
      >
        <CheckCircle className="h-3 w-3" />
        <span>Synced</span>
      </Badge>
    );
  }

  // If offline
  if (!online) {
    return (
      <Badge
        variant="warning"
        className={`flex items-center gap-1 ${className}`}
      >
        <WifiOff className="h-3 w-3" />
        <span>Offline</span>
      </Badge>
    );
  }

  // If syncing
  if (syncStatus === SyncStatus.SYNCING) {
    return (
      <Badge
        variant="info"
        className={`flex items-center gap-1 ${className}`}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Syncing</span>
      </Badge>
    );
  }

  // If error
  if (syncStatus === SyncStatus.ERROR) {
    return (
      <Badge
        variant="destructive"
        className={`flex items-center gap-1 ${className}`}
      >
        <AlertCircle className="h-3 w-3" />
        <span>Sync Error</span>
      </Badge>
    );
  }

  return null;
};

interface AchievementSyncIndicatorProps {
  synced: boolean;
  className?: string;
}

/**
 * Component to display sync status for an achievement
 */
export const AchievementSyncIndicator: React.FC<AchievementSyncIndicatorProps> = ({
  synced,
  className = '',
}) => {
  if (synced) {
    return (
      <Badge
        variant="success"
        className={`flex items-center gap-1 text-xs ${className}`}
      >
        <CheckCircle className="h-3 w-3" />
        <span>Synced</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="warning"
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      <WifiOff className="h-3 w-3" />
      <span>Not synced</span>
    </Badge>
  );
};

interface PointsSyncIndicatorProps {
  synced: boolean;
  className?: string;
}

/**
 * Component to display sync status for points
 */
export const PointsSyncIndicator: React.FC<PointsSyncIndicatorProps> = ({
  synced,
  className = '',
}) => {
  if (synced) {
    return (
      <Badge
        variant="success"
        className={`flex items-center gap-1 text-xs ${className}`}
      >
        <CheckCircle className="h-3 w-3" />
        <span>Synced</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="warning"
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      <WifiOff className="h-3 w-3" />
      <span>Not synced</span>
    </Badge>
  );
};

interface LevelSyncIndicatorProps {
  synced: boolean;
  className?: string;
}

/**
 * Component to display sync status for level
 */
export const LevelSyncIndicator: React.FC<LevelSyncIndicatorProps> = ({
  synced,
  className = '',
}) => {
  if (synced) {
    return (
      <Badge
        variant="success"
        className={`flex items-center gap-1 text-xs ${className}`}
      >
        <CheckCircle className="h-3 w-3" />
        <span>Synced</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="warning"
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      <WifiOff className="h-3 w-3" />
      <span>Not synced</span>
    </Badge>
  );
};
