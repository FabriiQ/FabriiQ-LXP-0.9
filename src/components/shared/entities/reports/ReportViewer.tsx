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
import { Badge } from '@/components/ui/core/badge';
// Import the tabs components we created earlier
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/core/tabs';
import {
  Download,
  Edit,
  Printer,
  Search,
  Calendar,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { Report, ReportStatus, ReportFormat, ReportSection } from './types';
import { AnalyticsVisualization } from '../analytics/types';
import { BarChart, LineChart, PieChart, HeatMap, MetricCard } from '../analytics/charts';

export interface ReportViewerProps {
  report: Report;
  visualizations?: Record<string, AnalyticsVisualization>;
  isLoading?: boolean;
  error?: string;
  onEdit?: () => void;
  onShare?: () => void;
  onDownload?: (format: ReportFormat) => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function ReportViewer({
  report,
  visualizations = {},
  isLoading = false,
  error,
  onEdit,
  onShare,
  onDownload,
  onPrint,
  onRefresh,
  className = '',
}: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      setRefreshing(true);
      onRefresh();
      setRefreshing(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PUBLISHED:
        return 'success';
      case ReportStatus.DRAFT:
        return 'secondary';
      case ReportStatus.SCHEDULED:
        return 'warning';
      case ReportStatus.ARCHIVED:
        return 'outline';
      default:
        return 'default';
    }
  };

  // Render visualization based on type
  const renderVisualization = (visualization: AnalyticsVisualization) => {
    const { type, dataset, title, description } = visualization;

    const commonProps = {
      title,
      description,
      dataset,
      visualization,
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

  // Render section content
  const renderSectionContent = (section: ReportSection) => {
    if (section.visualizationId && visualizations[section.visualizationId]) {
      return renderVisualization(visualizations[section.visualizationId]);
    }

    if (section.content) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: section.content }} />
      );
    }

    return (
      <div className="flex items-center justify-center h-[100px] border rounded-md">
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <Badge variant={getStatusBadgeVariant(report.status) as any}>
              {report.status}
            </Badge>
          </div>
          {report.description && (
            <p className="text-muted-foreground mt-1">{report.description}</p>
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

          {onEdit && report.status !== ReportStatus.ARCHIVED && (
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

          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}

          {onPrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          )}

          {onDownload && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onDownload(report.format)}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {report.sections.length === 0 ? (
                <div className="text-center p-8 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">No sections found in this report.</p>
                </div>
              ) : (
                report.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <Card key={section.id} className="overflow-hidden">
                      <CardHeader>
                        <CardTitle>{section.title}</CardTitle>
                        {section.description && (
                          <CardDescription>{section.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {renderSectionContent(section)}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Report Type</h3>
                    <p className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {report.type}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Format</h3>
                    <p className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {report.format}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created By</h3>
                    <p className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {report.createdBy}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(report.createdAt, 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {report.lastGeneratedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Generated</h3>
                      <p className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(report.lastGeneratedAt, 'PPP p')}
                      </p>
                    </div>
                  )}

                  {report.scheduledAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Scheduled For</h3>
                      <p className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(report.scheduledAt, 'PPP p')}
                      </p>
                    </div>
                  )}

                  {report.nextGenerationAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Next Generation</h3>
                      <p className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(report.nextGenerationAt, 'PPP p')}
                      </p>
                    </div>
                  )}

                  {report.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {report.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
