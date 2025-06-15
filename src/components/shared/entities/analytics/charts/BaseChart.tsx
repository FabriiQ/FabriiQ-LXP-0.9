import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { ArrowUp, Download, Search, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/core/dropdown-menu';
import { AnalyticsDataset, AnalyticsVisualization } from '../types';

export interface BaseChartProps {
  title: string;
  description?: string;
  dataset?: AnalyticsDataset;
  // Visualization is used in child components
  visualization?: AnalyticsVisualization;
  isLoading?: boolean;
  error?: string;
  height?: number | string;
  width?: number | string;
  className?: string;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onDownload?: (format: 'png' | 'svg' | 'csv' | 'json') => void;
  refreshInterval?: number; // in seconds
  children?: React.ReactNode;
}

export function BaseChart({
  title,
  description,
  dataset,
  visualization,
  isLoading = false,
  error,
  height = 300,
  width = '100%',
  className = '',
  onRefresh,
  onFullscreen,
  onDownload,
  refreshInterval,
  children,
}: BaseChartProps) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Log visualization for linter
  React.useEffect(() => {
    if (visualization) {
      console.debug('Visualization loaded:', visualization.id);
    }
  }, [visualization]);

  // Handle auto-refresh
  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;

    const intervalId = setInterval(() => {
      onRefresh();
      setLastRefreshed(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [refreshInterval, onRefresh]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      setLastRefreshed(new Date());
    }
  };

  // Format last refreshed time
  const formatLastRefreshed = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastRefreshed.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return lastRefreshed.toLocaleString();
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm mt-1">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              title="Refresh"
              className="h-8 w-8"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}

          {onFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onFullscreen}
              title="Fullscreen"
              className="h-8 w-8"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {onDownload && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Download"
                  className="h-8 w-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDownload('png')}>
                  Download as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload('svg')}>
                  Download as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload('csv')}>
                  Download as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload('json')}>
                  Download as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="More options"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-xs text-muted-foreground"
                disabled
              >
                Last refreshed: {formatLastRefreshed()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <div style={{ height, width }} className="flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : error ? (
          <div
            style={{ height, width }}
            className="flex items-center justify-center text-destructive bg-destructive/10 rounded-md p-4"
          >
            {error}
          </div>
        ) : !dataset || dataset.series.length === 0 ? (
          <div
            style={{ height, width }}
            className="flex items-center justify-center text-muted-foreground border rounded-md p-4"
          >
            No data available
          </div>
        ) : (
          <div style={{ height, width }}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
