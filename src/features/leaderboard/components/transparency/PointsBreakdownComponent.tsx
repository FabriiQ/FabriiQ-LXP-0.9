'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, HelpCircle, Calendar, Award, BookOpen, Clock, MessageSquare } from 'lucide-react';
import { BarChart as ChartIcon } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';

export interface PointSource {
  source: string;
  amount: number;
  percentage: number;
  color: string;
  icon?: React.ReactNode;
  description?: string;
  timestamp?: Date;
}

export interface PointsBreakdownProps {
  studentId: string;
  entityId?: string;
  entityType?: 'class' | 'subject' | 'course' | 'campus';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'term' | 'all-time';
  isLoading?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
}

// This function has been removed as we're now using real data only

export function PointsBreakdownComponent({
  studentId,
  entityId,
  entityType = 'class',
  timeframe = 'all-time',
  isLoading = false,
  onTimeframeChange,
  className
}: PointsBreakdownProps) {
  const [pointsData, setPointsData] = useState<PointSource[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [totalPoints, setTotalPoints] = useState<number>(0);

  // Fetch points data from API
  const { data: pointsSummary, isLoading: isLoadingPoints } = api.points.getPointsSummary.useQuery(
    {
      studentId,
      classId: entityType === 'class' ? entityId : undefined,
      subjectId: entityType === 'subject' ? entityId : undefined
    },
    {
      enabled: !!studentId && !!entityId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get points history for breakdown
  const { data: pointsHistory, isLoading: isLoadingHistory } = api.points.getPointsHistory.useQuery(
    {
      studentId,
      classId: entityType === 'class' ? entityId : undefined,
      subjectId: entityType === 'subject' ? entityId : undefined,
      limit: 100
    },
    {
      enabled: !!studentId && !!entityId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Transform API data to component format
  useEffect(() => {
    if (isLoading || isLoadingPoints || isLoadingHistory) return;

    // First check if we have points summary data
    if (pointsSummary) {
      console.log('Points summary data:', pointsSummary);

      // If pointsSummary has totalPoints, use it
      if (pointsSummary.totalPoints !== undefined) {
        setTotalPoints(pointsSummary.totalPoints);
      }
    }

    // Then process points history for the breakdown
    if (pointsHistory && Array.isArray(pointsHistory) && pointsHistory.length > 0) {
      // Group points by source
      const sourceMap = new Map<string, PointSource>();

      pointsHistory.forEach(item => {
        const source = item.source || 'Other';
        if (!sourceMap.has(source)) {
          sourceMap.set(source, {
            source,
            amount: 0,
            percentage: 0,
            color: getColorForSource(source),
            icon: getIconForSource(source),
            description: getDescriptionForSource(source)
          });
        }

        const sourceData = sourceMap.get(source)!;
        sourceData.amount += item.amount;
      });

      // Calculate total and percentages
      const total = Array.from(sourceMap.values()).reduce((sum, source) => sum + source.amount, 0);

      const formattedData = Array.from(sourceMap.values()).map(source => ({
        ...source,
        percentage: total > 0 ? (source.amount / total) * 100 : 0
      }));

      setPointsData(formattedData);

      // If we didn't get a total from pointsSummary, use the calculated total
      if (!pointsSummary?.totalPoints) {
        setTotalPoints(total);
      }
    } else {
      // No real data, set empty array
      setPointsData([]);

      // If we don't have a total from pointsSummary, set to 0
      if (!pointsSummary?.totalPoints) {
        setTotalPoints(0);
      }
    }
  }, [studentId, entityId, entityType, timeframe, isLoading, pointsHistory, pointsSummary, isLoadingPoints, isLoadingHistory]);

  // Helper functions for data transformation
  const getColorForSource = (source: string): string => {
    const colorMap: Record<string, string> = {
      'Activity': '#4CAF50',
      'Attendance': '#2196F3',
      'Participation': '#9C27B0',
      'Achievement': '#FF9800',
      'Bonus': '#F44336'
    };

    return colorMap[source] || '#607D8B';
  };

  const getIconForSource = (source: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      'Activity': <BookOpen className="h-4 w-4" />,
      'Attendance': <Calendar className="h-4 w-4" />,
      'Participation': <MessageSquare className="h-4 w-4" />,
      'Achievement': <Award className="h-4 w-4" />,
      'Bonus': <Award className="h-4 w-4" />
    };

    return iconMap[source] || <ChartIcon className="h-4 w-4" />;
  };

  const getDescriptionForSource = (source: string): string => {
    const descriptionMap: Record<string, string> = {
      'Activity': 'Points earned from completing activities',
      'Attendance': 'Points earned from class attendance',
      'Participation': 'Points earned from class participation',
      'Achievement': 'Points earned from unlocking achievements',
      'Bonus': 'Bonus points awarded by teachers'
    };

    return descriptionMap[source] || 'Points earned from various sources';
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <div className="flex items-center gap-2">
            {data.icon}
            <span className="font-medium">{data.source}</span>
          </div>
          <div className="text-sm mt-1">
            <div>{data.amount.toLocaleString()} points</div>
            <div>{data.percentage.toFixed(1)}% of total</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Points Breakdown</CardTitle>
            <CardDescription>
              How points are earned and calculated
            </CardDescription>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center" className="max-w-xs">
                <p className="text-sm">
                  This breakdown shows how points are earned from different sources.
                  Points contribute to your position on the leaderboard.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            variant={timeframe === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeframeChange('daily')}
          >
            Daily
          </Button>
          <Button
            variant={timeframe === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeframeChange('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant={timeframe === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeframeChange('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={timeframe === 'term' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeframeChange('term')}
          >
            Term
          </Button>
          <Button
            variant={timeframe === 'all-time' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeframeChange('all-time')}
          >
            All Time
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold">{totalPoints.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>

              {pointsData.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ChartIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p>No points data available</p>
                  <p className="text-xs max-w-md text-center">
                    Points breakdown will appear here once you've earned points from activities.
                  </p>
                </div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pointsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {pointsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              {pointsData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ChartIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p>No points data available</p>
                  <p className="text-xs max-w-md text-center">
                    Detailed points breakdown will appear here once you've earned points from activities.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pointsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="amount" name="Points">
                          {pointsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 mt-4">
                    {pointsData.map((source, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full" style={{ backgroundColor: `${source.color}30` }}>
                            {source.icon}
                          </div>
                          <div>
                            <div className="font-medium">{source.source}</div>
                            <div className="text-xs text-muted-foreground">{source.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{source.amount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{source.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {new Date().toLocaleString()}
        </div>
        <Button variant="ghost" size="sm">
          <Info className="h-4 w-4 mr-2" />
          How Points Work
        </Button>
      </CardFooter>
    </Card>
  );
}
