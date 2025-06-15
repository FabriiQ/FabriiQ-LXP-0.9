import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Skeleton } from '@/components/ui/core/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/core/dropdown-menu';
import {
  Download,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash
} from 'lucide-react';
import { AnalyticsDashboard as AnalyticsDashboardType, AnalyticsVisualization } from './types';
import { BarChart, LineChart, PieChart, HeatMap, MetricCard } from './charts';

export interface AnalyticsDashboardProps {
  dashboard: AnalyticsDashboardType;
  visualizations: AnalyticsVisualization[];
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDownload?: (format: 'pdf' | 'png' | 'csv' | 'json') => void;
  onAddVisualization?: () => void;
  onEditVisualization?: (visualizationId: string) => void;
  onRemoveVisualization?: (visualizationId: string) => void;
  className?: string;
}

export function AnalyticsDashboard({
  dashboard,
  visualizations,
  isLoading = false,
  error,
  onRefresh,
  onEdit,
  onDelete,
  onShare,
  onDownload,
  onAddVisualization,
  onEditVisualization,
  onRemoveVisualization, // eslint-disable-line @typescript-eslint/no-unused-vars
  className = '',
}: AnalyticsDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      setRefreshing(true);
      onRefresh();
      setRefreshing(false);
    }
  };

  // Render visualization based on type
  const renderVisualization = (visualization: AnalyticsVisualization) => {
    const { type, dataset, title, description, id } = visualization;

    const commonProps = {
      title,
      description,
      dataset,
      visualization,
      onRefresh: () => onEditVisualization?.(id),
      height: 300,
    };

    switch (type) {
      case 'BAR_CHART':
        return <BarChart {...commonProps} />;
      case 'LINE_CHART':
        return <LineChart {...commonProps} />;
      case 'PIE_CHART':
        return <PieChart {...commonProps} />;
      case 'AREA_CHART':
        return <LineChart {...commonProps} enableArea={true} />;
      case 'HEATMAP':
        return <HeatMap {...commonProps} />;
      case 'NUMBER':
        return <MetricCard {...commonProps} />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px] border rounded-md">
                <p className="text-muted-foreground">
                  Visualization type not supported: {type}
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.title}</h1>
          {dashboard.description && (
            <p className="text-muted-foreground mt-1">{dashboard.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-1"
          >
            <Search className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {onAddVisualization && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddVisualization}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Chart</span>
            </Button>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onShare && (
                <DropdownMenuItem onClick={onShare} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
              )}

              {onDownload && (
                <>
                  <DropdownMenuItem
                    onClick={() => onDownload('pdf')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDownload('png')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download as PNG
                  </DropdownMenuItem>
                </>
              )}

              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visualizations.map((visualization) => (
            <div key={visualization.id}>
              {renderVisualization(visualization)}
            </div>
          ))}

          {visualizations.length === 0 && (
            <div className="col-span-full text-center p-8 border rounded-md bg-muted/10">
              <p className="text-muted-foreground">No visualizations found.</p>
              {onAddVisualization && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={onAddVisualization}
                >
                  Add your first visualization
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
