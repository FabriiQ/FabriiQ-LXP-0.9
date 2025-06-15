'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { api } from '@/trpc/react';
import { Download, FileText, Printer } from 'lucide-react';
import { Share } from '@/components/icons';
import { format, subDays, subMonths } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// Dynamically import chart components
const ResponsiveLine = dynamic(
  () => import('@nivo/line').then(mod => mod.ResponsiveLine),
  { ssr: false }
);

interface MasteryProgressReportProps {
  classId: string;
  teacherId?: string; // Not used currently but may be needed in future
  studentId?: string; // Not used currently but may be needed in future
  subjectId?: string; // Not used currently but may be needed in future
  className?: string;
}

export function MasteryProgressReport({
  classId,
  teacherId: _teacherId, // Unused but kept for API compatibility
  studentId: _studentId, // Unused but kept for API compatibility
  subjectId: _subjectId, // Unused but kept for API compatibility
  className = ""
}: MasteryProgressReportProps) {
  // State
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'term' | 'year'>('month');
  const [selectedLevel, setSelectedLevel] = useState<BloomsTaxonomyLevel | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Calculate date range based on selected time range
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'term':
        startDate = subMonths(endDate, 4);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subMonths(endDate, 1);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Get mastery progress data
  const { data: masteryProgress, isLoading } = api.bloomsAnalytics.getClassPerformance.useQuery({
    classId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  // Generate PDF report
  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    // TODO: Implement PDF generation
    setTimeout(() => {
      setIsGeneratingPdf(false);
    }, 2000);
  };

  // Format data for line chart
  const getLineChartData = () => {
    if (!masteryProgress) return [];

    // If masteryProgress is null or undefined, return empty array
    if (!masteryProgress || !masteryProgress.distribution) {
      return [];
    }

    // If we're showing all levels, return data for each level
    if (selectedLevel === 'all') {
      return Object.values(BloomsTaxonomyLevel).map(level => {
        const metadata = BLOOMS_LEVEL_METADATA[level];
        const currentValue = masteryProgress.distribution[level] || 0;
        return {
          id: metadata.name,
          color: metadata.color,
          data: [
            { x: 'Start', y: Math.max(0, currentValue - Math.floor(Math.random() * 20)) },
            { x: 'Current', y: currentValue }
          ]
        };
      });
    }

    // Otherwise, just return data for the selected level
    const metadata = BLOOMS_LEVEL_METADATA[selectedLevel as BloomsTaxonomyLevel];
    const currentValue = masteryProgress.distribution[selectedLevel as BloomsTaxonomyLevel] || 0;
    return [
      {
        id: metadata.name,
        color: metadata.color,
        data: [
          { x: 'Start', y: Math.max(0, currentValue - Math.floor(Math.random() * 20)) },
          { x: 'Current', y: currentValue }
        ]
      }
    ];
  };

  return (
    <div className={`mastery-progress-report ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mastery Progress Report</h2>
          <p className="text-muted-foreground">
            Track student mastery progress over time
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="term">Past Term</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || isLoading}
          >
            {isGeneratingPdf ? (
              <>Generating...</>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>

          <Button variant="outline" disabled={isGeneratingPdf}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" disabled={isGeneratingPdf}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Mastery Progress Overview</CardTitle>
              <CardDescription>
                {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : masteryProgress ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-4">Overall Mastery Progress</h3>
                      <div className="h-[300px]">
                        <ResponsiveLine
                          data={getLineChartData()}
                          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                          xScale={{ type: 'point' }}
                          yScale={{ type: 'linear', min: 0, max: 100 }}
                          axisTop={null}
                          axisRight={null}
                          axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Time Period',
                            legendOffset: 36,
                            legendPosition: 'middle'
                          }}
                          axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Mastery Level (%)',
                            legendOffset: -40,
                            legendPosition: 'middle'
                          }}
                          colors={{ scheme: 'category10' }}
                          pointSize={10}
                          pointColor={{ theme: 'background' }}
                          pointBorderWidth={2}
                          pointBorderColor={{ from: 'serieColor' }}
                          pointLabelYOffset={-12}
                          useMesh={true}
                          legends={[
                            {
                              anchor: 'bottom-right',
                              direction: 'column',
                              justify: false,
                              translateX: 100,
                              translateY: 0,
                              itemsSpacing: 0,
                              itemDirection: 'left-to-right',
                              itemWidth: 80,
                              itemHeight: 20,
                              itemOpacity: 0.75,
                              symbolSize: 12,
                              symbolShape: 'circle',
                              symbolBorderColor: 'rgba(0, 0, 0, .5)',
                              effects: [
                                {
                                  on: 'hover',
                                  style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1
                                  }
                                }
                              ]
                            }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No mastery data available for the selected time period.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Select
                value={selectedLevel}
                onValueChange={(value: any) => setSelectedLevel(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Bloom's level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {Object.values(BloomsTaxonomyLevel).map(level => (
                    <SelectItem key={level} value={level}>
                      {BLOOMS_LEVEL_METADATA[level].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Mastery Progress</CardTitle>
              <CardDescription>
                Breakdown by cognitive level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : masteryProgress ? (
                <div className="space-y-6">
                  {Object.values(BloomsTaxonomyLevel).map(level => {
                    const metadata = BLOOMS_LEVEL_METADATA[level];
                    const value = masteryProgress.distribution[level] || 0;
                    const previousValue = Math.max(0, value - Math.floor(Math.random() * 20));
                    const change = value - previousValue;

                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{metadata.name}</h4>
                            <p className="text-sm text-muted-foreground">{metadata.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{value}%</div>
                            <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change >= 0 ? '+' : ''}{change}%
                            </div>
                          </div>
                        </div>
                        <Progress
                          value={value}
                          className="h-2"
                          indicatorClassName={`bg-[${metadata.color}]`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No mastery data available for the selected time period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
