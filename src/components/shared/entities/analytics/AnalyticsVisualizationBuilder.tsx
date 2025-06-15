import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Label } from '@/components/ui/core/label';
import { Textarea } from '@/components/ui/core/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/core/tabs';
import { 
  AnalyticsVisualization, 
  AnalyticsVisualizationType, 
  AnalyticsEntityType, 
  AnalyticsMetricType, 
  AnalyticsTimePeriod, 
  AnalyticsGranularity,
  AnalyticsDataset
} from './types';
import { BarChart, LineChart, PieChart, HeatMap, MetricCard } from './charts';

export interface AnalyticsVisualizationBuilderProps {
  visualization?: AnalyticsVisualization;
  onSave: (visualization: Partial<AnalyticsVisualization>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
  availableDatasets?: AnalyticsDataset[];
  className?: string;
}

export function AnalyticsVisualizationBuilder({
  visualization,
  onSave,
  onCancel,
  isLoading = false,
  error,
  availableDatasets = [],
  className = '',
}: AnalyticsVisualizationBuilderProps) {
  // State for the visualization being built
  const [title, setTitle] = useState(visualization?.title || '');
  const [description, setDescription] = useState(visualization?.description || '');
  const [type, setType] = useState<AnalyticsVisualizationType>(
    visualization?.type || AnalyticsVisualizationType.BAR_CHART
  );
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    visualization?.dataset?.id || ''
  );
  const [isRealTime, setIsRealTime] = useState(visualization?.isRealTime || false);
  const [refreshInterval, setRefreshInterval] = useState(
    visualization?.refreshInterval || 60
  );
  
  // Find the selected dataset
  const selectedDataset = availableDatasets.find(d => d.id === selectedDatasetId);
  
  // State for custom dataset creation
  const [customDataset, setCustomDataset] = useState<Partial<AnalyticsDataset>>(
    visualization?.dataset || {
      title: '',
      entityType: AnalyticsEntityType.USER,
      metricType: AnalyticsMetricType.COUNT,
      metricName: '',
      timePeriod: AnalyticsTimePeriod.MONTH,
      granularity: AnalyticsGranularity.DAILY,
      series: [],
    }
  );
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState('existing');
  
  // Handle save
  const handleSave = () => {
    const dataset = activeTab === 'existing' 
      ? selectedDataset 
      : customDataset as AnalyticsDataset;
    
    if (!dataset) {
      // Show error
      return;
    }
    
    onSave({
      title,
      description,
      type,
      dataset,
      isRealTime,
      refreshInterval: isRealTime ? refreshInterval : undefined,
      config: {},
    });
  };
  
  // Render preview based on visualization type
  const renderPreview = () => {
    const dataset = activeTab === 'existing' 
      ? selectedDataset 
      : customDataset as AnalyticsDataset;
    
    if (!dataset) {
      return (
        <div className="flex items-center justify-center h-[300px] border rounded-md">
          <p className="text-muted-foreground">
            Select a dataset to preview
          </p>
        </div>
      );
    }
    
    const commonProps = {
      title,
      description,
      dataset,
      height: 300,
    };
    
    switch (type) {
      case AnalyticsVisualizationType.BAR_CHART:
        return <BarChart {...commonProps} />;
      case AnalyticsVisualizationType.LINE_CHART:
        return <LineChart {...commonProps} />;
      case AnalyticsVisualizationType.PIE_CHART:
        return <PieChart {...commonProps} />;
      case AnalyticsVisualizationType.AREA_CHART:
        return <LineChart {...commonProps} enableArea={true} />;
      case AnalyticsVisualizationType.HEATMAP:
        return <HeatMap {...commonProps} />;
      case AnalyticsVisualizationType.NUMBER:
        return <MetricCard {...commonProps} />;
      default:
        return (
          <div className="flex items-center justify-center h-[300px] border rounded-md">
            <p className="text-muted-foreground">
              Visualization type not supported: {type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>
            {visualization ? 'Edit Visualization' : 'Create Visualization'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter visualization title"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter visualization description"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Visualization Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as AnalyticsVisualizationType)}
              disabled={isLoading}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select visualization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AnalyticsVisualizationType.BAR_CHART}>Bar Chart</SelectItem>
                <SelectItem value={AnalyticsVisualizationType.LINE_CHART}>Line Chart</SelectItem>
                <SelectItem value={AnalyticsVisualizationType.PIE_CHART}>Pie Chart</SelectItem>
                <SelectItem value={AnalyticsVisualizationType.AREA_CHART}>Area Chart</SelectItem>
                <SelectItem value={AnalyticsVisualizationType.HEATMAP}>Heat Map</SelectItem>
                <SelectItem value={AnalyticsVisualizationType.NUMBER}>Metric Card</SelectItem>
                <SelectItem value={AnalyticsVisualizationType.TABLE}>Table</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Data Source</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Dataset</TabsTrigger>
                <TabsTrigger value="custom">Custom Dataset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="dataset">Select Dataset</Label>
                  <Select
                    value={selectedDatasetId}
                    onValueChange={setSelectedDatasetId}
                    disabled={isLoading || availableDatasets.length === 0}
                  >
                    <SelectTrigger id="dataset">
                      <SelectValue placeholder="Select a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDatasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          {dataset.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {availableDatasets.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No datasets available. Create a custom dataset instead.
                    </p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="datasetTitle">Dataset Title</Label>
                  <Input
                    id="datasetTitle"
                    value={customDataset.title || ''}
                    onChange={(e) => setCustomDataset({
                      ...customDataset,
                      title: e.target.value,
                    })}
                    placeholder="Enter dataset title"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type</Label>
                  <Select
                    value={customDataset.entityType}
                    onValueChange={(value) => setCustomDataset({
                      ...customDataset,
                      entityType: value as AnalyticsEntityType,
                    })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="entityType">
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AnalyticsEntityType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metricType">Metric Type</Label>
                  <Select
                    value={customDataset.metricType}
                    onValueChange={(value) => setCustomDataset({
                      ...customDataset,
                      metricType: value as AnalyticsMetricType,
                    })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="metricType">
                      <SelectValue placeholder="Select metric type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AnalyticsMetricType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metricName">Metric Name</Label>
                  <Input
                    id="metricName"
                    value={customDataset.metricName || ''}
                    onChange={(e) => setCustomDataset({
                      ...customDataset,
                      metricName: e.target.value,
                    })}
                    placeholder="Enter metric name"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timePeriod">Time Period</Label>
                  <Select
                    value={customDataset.timePeriod}
                    onValueChange={(value) => setCustomDataset({
                      ...customDataset,
                      timePeriod: value as AnalyticsTimePeriod,
                    })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="timePeriod">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AnalyticsTimePeriod).map((period) => (
                        <SelectItem key={period} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="granularity">Granularity</Label>
                  <Select
                    value={customDataset.granularity}
                    onValueChange={(value) => setCustomDataset({
                      ...customDataset,
                      granularity: value as AnalyticsGranularity,
                    })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="granularity">
                      <SelectValue placeholder="Select granularity" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AnalyticsGranularity).map((granularity) => (
                        <SelectItem key={granularity} value={granularity}>
                          {granularity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Note: In a real implementation, you would add UI for creating series and data points */}
                <p className="text-sm text-muted-foreground">
                  Note: This is a simplified version. In a real implementation, you would add UI for creating series and data points.
                </p>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRealTime"
                checked={isRealTime}
                onChange={(e) => setIsRealTime(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isRealTime">Enable real-time updates</Label>
            </div>
            
            {isRealTime && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  min={5}
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !title || (activeTab === 'existing' && !selectedDatasetId)}
          >
            {isLoading ? 'Saving...' : 'Save Visualization'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {renderPreview()}
        </CardContent>
      </Card>
    </div>
  );
}
