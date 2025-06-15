'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Download, Filter, HelpCircle, Info, Search, TrendingDown, TrendingUp, BarChart as ChartIcon } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';

export interface LeaderboardHistoryEntry {
  date: Date;
  rank: number;
  points: number;
  academicScore?: number;
  eventType?: 'rank_change' | 'points_earned' | 'achievement' | 'level_up' | 'system_update';
  eventDescription?: string;
  metadata?: Record<string, any>;
}

export interface LeaderboardHistoryViewerProps {
  studentId: string;
  entityId?: string;
  entityType?: 'class' | 'subject' | 'course' | 'campus';
  timeframe?: 'weekly' | 'monthly' | 'term' | 'all-time';
  isLoading?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
}

// Mock data generator for demonstration
const generateMockHistoryData = (studentId: string, timeframe: string): LeaderboardHistoryEntry[] => {
  const now = new Date();
  const entries: LeaderboardHistoryEntry[] = [];

  // Determine number of entries and time interval based on timeframe
  let numEntries = 0;
  let dayInterval = 1;

  if (timeframe === 'weekly') {
    numEntries = 7;
    dayInterval = 1;
  } else if (timeframe === 'monthly') {
    numEntries = 30;
    dayInterval = 1;
  } else if (timeframe === 'term') {
    numEntries = 90;
    dayInterval = 3;
  } else {
    numEntries = 180;
    dayInterval = 7;
  }

  // Generate entries with realistic rank and point progression
  let currentRank = Math.floor(Math.random() * 10) + 5; // Start at rank 5-15
  let currentPoints = 1000 + Math.floor(Math.random() * 500); // Start at 1000-1500 points

  for (let i = numEntries - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * dayInterval));

    // Randomly adjust rank (lower is better)
    const rankChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    currentRank = Math.max(1, currentRank + rankChange);

    // Always increase points, but by varying amounts
    const pointsIncrease = Math.floor(Math.random() * 50) + 10; // 10-60 points
    currentPoints += pointsIncrease;

    // Determine if this is a special event
    let eventType: LeaderboardHistoryEntry['eventType'] = undefined;
    let eventDescription: string | undefined = undefined;

    if (i % 10 === 0) {
      // Every 10th entry is a level up
      eventType = 'level_up';
      eventDescription = 'Reached a new level';
    } else if (i % 7 === 0) {
      // Every 7th entry is an achievement
      eventType = 'achievement';
      eventDescription = 'Earned a new achievement';
    } else if (rankChange < 0) {
      // Rank improved
      eventType = 'rank_change';
      eventDescription = `Rank improved from ${currentRank - rankChange} to ${currentRank}`;
    } else if (pointsIncrease > 40) {
      // Significant points earned
      eventType = 'points_earned';
      eventDescription = `Earned ${pointsIncrease} points`;
    }

    entries.push({
      date,
      rank: currentRank,
      points: currentPoints,
      academicScore: 70 + Math.floor(Math.random() * 30),
      eventType,
      eventDescription
    });
  }

  return entries;
};

export function LeaderboardHistoryViewer({
  studentId,
  entityId,
  entityType = 'class',
  timeframe = 'monthly',
  isLoading = false,
  onTimeframeChange,
  className
}: LeaderboardHistoryViewerProps) {
  const [historyData, setHistoryData] = useState<LeaderboardHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('chart');
  const [filterValue, setFilterValue] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Import LeaderboardEntityType and TimeGranularity
  const { LeaderboardEntityType, TimeGranularity } = require('@/features/leaderboard/types/standard-leaderboard');

  // Fetch leaderboard history data from API
  const { data: historyApiData, isLoading: isLoadingHistory } = api.unifiedLeaderboard.getLeaderboardHistory.useQuery(
    {
      type: entityType === 'class' ? LeaderboardEntityType.CLASS :
            entityType === 'subject' ? LeaderboardEntityType.SUBJECT :
            entityType === 'course' ? LeaderboardEntityType.COURSE :
            LeaderboardEntityType.CAMPUS,
      referenceId: entityId || '',
      timeGranularity: timeframe === 'weekly' ? TimeGranularity.WEEKLY :
                      timeframe === 'monthly' ? TimeGranularity.MONTHLY :
                      timeframe === 'term' ? TimeGranularity.TERM :
                      TimeGranularity.ALL_TIME,
      limit: 100
    },
    {
      enabled: !!entityId && !!entityType,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get student position history - using getStudentPosition since getStudentPositionHistory doesn't exist
  const { data: positionData, isLoading: isLoadingPosition } = api.unifiedLeaderboard.getStudentPosition.useQuery(
    {
      studentId,
      type: entityType === 'class' ? LeaderboardEntityType.CLASS :
            entityType === 'subject' ? LeaderboardEntityType.SUBJECT :
            entityType === 'course' ? LeaderboardEntityType.COURSE :
            LeaderboardEntityType.CAMPUS,
      referenceId: entityId || '',
      timeGranularity: timeframe === 'weekly' ? TimeGranularity.WEEKLY :
                      timeframe === 'monthly' ? TimeGranularity.MONTHLY :
                      timeframe === 'term' ? TimeGranularity.TERM :
                      TimeGranularity.ALL_TIME
    },
    {
      enabled: !!studentId && !!entityId && !!entityType,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Transform API data to component format
  useEffect(() => {
    if (isLoading || isLoadingHistory || isLoadingPosition) return;

    // Check if we have real history data from the API
    if (historyApiData?.snapshots && historyApiData.snapshots.length > 0) {
      // Transform API data to our component format
      const historyEntries: LeaderboardHistoryEntry[] = historyApiData.snapshots.map((snapshot: any) => {
        return {
          date: new Date(snapshot.snapshotDate),
          rank: snapshot.studentPosition?.rank || 0,
          points: snapshot.studentPosition?.rewardPoints || 0,
          academicScore: snapshot.studentPosition?.academicScore,
          eventType: snapshot.eventType,
          eventDescription: snapshot.eventDescription,
          metadata: snapshot.metadata
        };
      });

      setHistoryData(historyEntries);
    } else if (positionData) {
      // If we have current position data but no history, create a single entry
      const currentEntry: LeaderboardHistoryEntry = {
        date: new Date(),
        rank: positionData.rank,
        points: positionData.rewardPoints,
        academicScore: positionData.academicScore,
        eventType: undefined,
        eventDescription: 'Current position'
      };

      setHistoryData([currentEntry]);
    } else {
      // No data available, set empty array
      setHistoryData([]);
    }
  }, [studentId, entityId, entityType, timeframe, isLoading, isLoadingHistory, isLoadingPosition, historyApiData, positionData]);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  // Filter history data
  const filteredHistoryData = historyData.filter(entry => {
    // Filter by search term
    const matchesSearch = !filterValue ||
      (entry.eventDescription && entry.eventDescription.toLowerCase().includes(filterValue.toLowerCase()));

    // Filter by event type
    const matchesEventType = eventTypeFilter === 'all' || entry.eventType === eventTypeFilter;

    return matchesSearch && matchesEventType;
  });

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: timeframe === 'all-time' ? 'numeric' : undefined
    });
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <div className="text-sm mt-1">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Rank: {payload[0].value}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Points: {payload[1].value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get event badge
  const getEventBadge = (eventType?: string) => {
    if (!eventType) return null;

    switch (eventType) {
      case 'rank_change':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Rank Change</Badge>;
      case 'points_earned':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Points Earned</Badge>;
      case 'achievement':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Achievement</Badge>;
      case 'level_up':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Level Up</Badge>;
      case 'system_update':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">System Update</Badge>;
      default:
        return null;
    }
  };

  // Get trend icon
  const getTrendIcon = (current: number, previous: number | undefined, isRank: boolean = false) => {
    if (!previous) return null;

    const improved = isRank ? current < previous : current > previous;

    if (improved) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current !== previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }

    return null;
  };

  // Prepare chart data
  const chartData = historyData.map(entry => ({
    date: entry.date,
    rank: entry.rank,
    points: entry.points,
    academicScore: entry.academicScore
  }));

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Leaderboard History</CardTitle>
            <CardDescription>
              Track your progress over time
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
                  This history shows your rank and points over time, along with significant events
                  that affected your position on the leaderboard.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
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
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              {chartData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ChartIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p>No chart data available</p>
                  <p className="text-xs max-w-md text-center">
                    Chart visualization will appear here once leaderboard history data is available.
                  </p>
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => formatDate(date)}
                        minTickGap={30}
                      />
                      <YAxis yAxisId="left" orientation="left" domain={[1, 'dataMax']} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="rank"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                        name="Rank"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="points"
                        stroke="#22c55e"
                        activeDot={{ r: 8 }}
                        name="Points"
                      />
                      <ReferenceLine yAxisId="left" y={1} stroke="#3b82f6" strokeDasharray="3 3" label="Top Rank" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-8"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                </div>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="rank_change">Rank Changes</SelectItem>
                    <SelectItem value="points_earned">Points Earned</SelectItem>
                    <SelectItem value="achievement">Achievements</SelectItem>
                    <SelectItem value="level_up">Level Ups</SelectItem>
                    <SelectItem value="system_update">System Updates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Event</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistoryData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="h-8 w-8 text-muted-foreground/50" />
                            <p>No history data available</p>
                            <p className="text-xs max-w-md">
                              Leaderboard history will be displayed here once data is available.
                              Check back after participating in more activities.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistoryData.map((entry, index) => {
                        const prevEntry = index < filteredHistoryData.length - 1 ? filteredHistoryData[index + 1] : undefined;

                        return (
                          <TableRow key={index} className={entry.eventType ? "bg-muted/30" : undefined}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatDate(entry.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {entry.rank}
                                {getTrendIcon(entry.rank, prevEntry?.rank, true)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {entry.points.toLocaleString()}
                                {getTrendIcon(entry.points, prevEntry?.points)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {entry.eventType ? (
                                <div className="flex flex-col gap-1">
                                  <div>{getEventBadge(entry.eventType)}</div>
                                  <div className="text-xs text-muted-foreground">{entry.eventDescription}</div>
                                </div>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {new Date().toLocaleString()}
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </CardFooter>
    </Card>
  );
}
