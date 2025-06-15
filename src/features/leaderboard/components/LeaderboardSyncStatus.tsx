/**
 * Leaderboard Sync Status Component
 *
 * This component displays the synchronization status and provides
 * controls for manual synchronization.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NetworkInfo, ConnectionType } from '../utils/data-efficient-api';
import { UpdateStrategy } from '../utils/battery-efficient-updates';

export interface LeaderboardSyncStatusProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  updateStrategy: UpdateStrategy;
  onRefresh: () => void;
  networkInfo: NetworkInfo;
  className?: string;
}

/**
 * LeaderboardSyncStatus component displays the current sync status
 * and allows manual refresh of the leaderboard data
 */
export function LeaderboardSyncStatus({
  lastUpdated,
  isLoading,
  updateStrategy,
  onRefresh,
  networkInfo,
  className,
}: LeaderboardSyncStatusProps) {
  // Format last updated time
  const formattedLastUpdated = lastUpdated
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
      }).format(lastUpdated)
    : 'Never';

  // Get update frequency text
  const getUpdateFrequencyText = () => {
    switch (updateStrategy) {
      case UpdateStrategy.REAL_TIME:
        return 'Real-time updates';
      case UpdateStrategy.FREQUENT:
        return 'Updates every few seconds';
      case UpdateStrategy.NORMAL:
        return 'Updates every few minutes';
      case UpdateStrategy.INFREQUENT:
        return 'Updates infrequently';
      case UpdateStrategy.MANUAL:
        return 'Manual updates only';
      default:
        return 'Unknown update frequency';
    }
  };

  // Get connection status icon and text
  const getConnectionStatus = () => {
    if (networkInfo.connectionType === ConnectionType.OFFLINE) {
      return {
        text: 'Offline',
        className: 'text-red-500',
      };
    }

    if (
      networkInfo.connectionType === ConnectionType.SLOW_2G ||
      networkInfo.connectionType === ConnectionType.CELLULAR_2G
    ) {
      return {
        text: `${networkInfo.effectiveType.toUpperCase()} (${networkInfo.downlink} Mbps)`,
        className: 'text-yellow-500',
      };
    }

    return {
      text: `${networkInfo.effectiveType.toUpperCase()} (${networkInfo.downlink} Mbps)`,
      className: 'text-green-500',
    };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm", className)}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className={cn("h-2 w-2 rounded-full mr-1", connectionStatus.className)} />
          <span className="text-muted-foreground">
            {connectionStatus.text}
          </span>
        </div>

        <div className="flex items-center">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="ml-1 text-muted-foreground">
            Last updated: {formattedLastUpdated}
          </span>
        </div>

        <div className="hidden md:flex items-center">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          <span className="ml-1 text-muted-foreground">
            {getUpdateFrequencyText()}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading || networkInfo.connectionType === ConnectionType.OFFLINE}
        className="mt-2 sm:mt-0"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current mr-2" />
            Updating...
          </>
        ) : (
          <>
            <ArrowRight className="h-4 w-4 mr-2" />
            Refresh
          </>
        )}
      </Button>
    </div>
  );
}
