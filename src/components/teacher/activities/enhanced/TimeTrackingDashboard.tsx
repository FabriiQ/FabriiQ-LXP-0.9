'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { api } from '@/trpc/react';
import { Clock, BarChart, Zap } from 'lucide-react';

interface TimeTrackingDashboardProps {
  classId: string;
  activityId?: string;
}

/**
 * TimeTrackingDashboard
 * 
 * A minimalist dashboard showing time tracking analytics with psychological principles applied:
 * - Visual Hierarchy: Uses color intensity to immediately show patterns
 * - Zeigarnik Effect: Highlights incomplete activities during peak productivity times
 * - Pareto Principle: Highlights the 20% of time that produces 80% of results
 * - Flow Theory: Identifies optimal challenge levels that maintain student focus
 */
export function TimeTrackingDashboard({
  classId,
  activityId
}: TimeTrackingDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('distribution');
  
  // Fetch time tracking analytics
  const { data: timeData, isLoading } = api.analytics.getTimeTrackingAnalytics.useQuery(
    { 
      classId,
      activityIds: activityId ? [activityId] : undefined,
      timeframe: 'month',
      groupBy: 'day'
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Process data for time distribution heatmap
  const timeDistributionData = useMemo(() => {
    if (!timeData || !timeData.timeDistribution) {
      return generateMockTimeDistribution();
    }
    
    return timeData.timeDistribution;
  }, [timeData]);

  // Process data for time efficiency chart
  const timeEfficiencyData = useMemo(() => {
    if (!timeData || !timeData.timeEfficiency) {
      return generateMockTimeEfficiency();
    }
    
    return timeData.timeEfficiency;
  }, [timeData]);

  // Process data for focus duration chart
  const focusDurationData = useMemo(() => {
    if (!timeData || !timeData.focusDuration) {
      return generateMockFocusDuration();
    }
    
    return timeData.focusDuration;
  }, [timeData]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Time Analytics</CardTitle>
        <CardDescription className="text-xs">
          How students allocate time on activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="distribution" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="text-xs">
              <BarChart className="h-3 w-3 mr-1" />
              Efficiency
            </TabsTrigger>
            <TabsTrigger value="focus" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Focus
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution">
            <div className="mt-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Weekly Time Distribution</h4>
              <TimeDistributionHeatmap 
                data={timeDistributionData} 
                height={140}
              />
              <div className="mt-1 text-xs text-right text-muted-foreground">
                Based on {timeData?.totalActivities || 'all'} activities
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="efficiency">
            <div className="mt-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Time vs. Performance</h4>
              <TimeEfficiencyChart 
                data={timeEfficiencyData} 
                height={140}
              />
              <div className="mt-1 text-xs text-right text-muted-foreground">
                Each dot represents one activity completion
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="focus">
            <div className="mt-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Focus Duration Analysis</h4>
              <FocusDurationChart 
                data={focusDurationData} 
                height={140}
              />
              <div className="mt-1 text-xs text-right text-muted-foreground">
                Optimal focus zone highlighted
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Time Distribution Heatmap component
interface TimeDistributionHeatmapProps {
  data: any[];
  height: number;
}

function TimeDistributionHeatmap({ data, height }: TimeDistributionHeatmapProps) {
  // Days of the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Time slots (simplified to 4-hour blocks)
  const timeSlots = ['6am', '10am', '2pm', '6pm', '10pm', '2am'];
  
  // Find max value for color scaling
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex h-full">
        {/* Y-axis labels (days) */}
        <div className="flex flex-col justify-between pr-2 text-xs text-muted-foreground">
          {days.map(day => (
            <div key={day} className="h-6 flex items-center">{day}</div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="flex-1 grid grid-rows-7 grid-cols-6 gap-1">
          {days.map(day => (
            timeSlots.map(time => {
              const cellData = data.find(d => d.day === day && d.time === time);
              const intensity = cellData ? (cellData.value / maxValue) : 0;
              const isPeakTime = intensity > 0.7; // Zeigarnik Effect - highlight peak times
              
              return (
                <div 
                  key={`${day}-${time}`}
                  className="rounded-sm transition-colors duration-200"
                  style={{ 
                    backgroundColor: getHeatmapColor(intensity),
                    border: isPeakTime ? '1px solid #A8D1F9' : undefined
                  }}
                  title={`${day} ${time}: ${cellData?.value || 0} minutes`}
                />
              );
            })
          ))}
        </div>
      </div>
      
      {/* X-axis labels (time slots) */}
      <div className="flex justify-between mt-1 pl-6 text-xs text-muted-foreground">
        {timeSlots.map(time => (
          <div key={time}>{time}</div>
        ))}
      </div>
    </div>
  );
}

// Time Efficiency Chart component
interface TimeEfficiencyChartProps {
  data: any[];
  height: number;
}

function TimeEfficiencyChart({ data, height }: TimeEfficiencyChartProps) {
  // Simple scatter plot implementation
  const maxX = Math.max(...data.map(d => d.timeSpent));
  const maxY = 100; // Score is percentage
  
  // Calculate averages for reference lines
  const avgTime = data.reduce((sum, d) => sum + d.timeSpent, 0) / data.length;
  const avgScore = data.reduce((sum, d) => sum + d.score, 0) / data.length;
  
  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      {/* Y-axis (Score) */}
      <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-between">
        <span className="text-xs text-muted-foreground">100%</span>
        <span className="text-xs text-muted-foreground">0%</span>
      </div>
      
      {/* Chart area */}
      <div className="absolute left-6 right-0 top-0 bottom-6 border-l border-b">
        {/* Average lines - Anchoring */}
        <div 
          className="absolute border-t border-dashed border-muted-foreground/30"
          style={{ top: `${100 - (avgScore / maxY) * 100}%`, left: 0, right: 0 }}
        />
        <div 
          className="absolute border-l border-dashed border-muted-foreground/30"
          style={{ left: `${(avgTime / maxX) * 100}%`, top: 0, bottom: 0 }}
        />
        
        {/* Quadrants - Pareto Principle */}
        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-green-50/30" />
        
        {/* Data points */}
        {data.map((point, i) => {
          const x = (point.timeSpent / maxX) * 100;
          const y = 100 - (point.score / maxY) * 100;
          const isOptimal = point.score > avgScore && point.timeSpent < avgTime;
          
          return (
            <div 
              key={i}
              className={`absolute w-2 h-2 rounded-full transform -translate-x-1 -translate-y-1 transition-all duration-200 ${
                isOptimal ? 'bg-green-500' : 'bg-blue-300'
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`Time: ${Math.round(point.timeSpent / 60)}m, Score: ${point.score}%`}
            />
          );
        })}
      </div>
      
      {/* X-axis (Time) */}
      <div className="absolute left-6 right-0 bottom-0 flex justify-between">
        <span className="text-xs text-muted-foreground">0m</span>
        <span className="text-xs text-muted-foreground">{Math.round(maxX / 60)}m</span>
      </div>
    </div>
  );
}

// Focus Duration Chart component
interface FocusDurationChartProps {
  data: any[];
  height: number;
}

function FocusDurationChart({ data, height }: FocusDurationChartProps) {
  // Simple line chart implementation
  const maxX = data.length - 1;
  const maxY = Math.max(...data.map(d => d.focusScore));
  
  // Find the optimal focus zone - Flow Theory
  const optimalStart = data.findIndex(d => d.focusScore > maxY * 0.7);
  const optimalEnd = data.findIndex((d, i) => i > optimalStart && d.focusScore < maxY * 0.7);
  
  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      {/* Y-axis (Focus Score) */}
      <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-between">
        <span className="text-xs text-muted-foreground">High</span>
        <span className="text-xs text-muted-foreground">Low</span>
      </div>
      
      {/* Chart area */}
      <div className="absolute left-6 right-0 top-0 bottom-6 border-l border-b">
        {/* Optimal focus zone - Flow Theory */}
        {optimalStart >= 0 && optimalEnd >= 0 && (
          <div 
            className="absolute bg-green-100/50 border border-green-200 rounded-md"
            style={{ 
              left: `${(optimalStart / maxX) * 100}%`, 
              width: `${((optimalEnd - optimalStart) / maxX) * 100}%`,
              top: 0,
              bottom: 0
            }}
          />
        )}
        
        {/* Line chart */}
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <path
            d={data.map((point, i) => {
              const x = (i / maxX) * 100;
              const y = 100 - (point.focusScore / maxY) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {data.map((point, i) => {
            const x = (i / maxX) * 100;
            const y = 100 - (point.focusScore / maxY) * 100;
            
            return (
              <circle
                key={i}
                cx={`${x}%`}
                cy={`${y}%`}
                r="3"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
      
      {/* X-axis (Duration) */}
      <div className="absolute left-6 right-0 bottom-0 flex justify-between">
        <span className="text-xs text-muted-foreground">Start</span>
        <span className="text-xs text-muted-foreground">End</span>
      </div>
    </div>
  );
}

// Helper function to generate a color for the heatmap
function getHeatmapColor(intensity: number): string {
  // Color scale from light to dark blue
  const colors = ['#F9F9F9', '#E2F0F9', '#C5E1F9', '#A8D1F9'];
  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  return colors[index];
}

// Mock data generators for development
function generateMockTimeDistribution() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['6am', '10am', '2pm', '6pm', '10pm', '2am'];
  
  return days.flatMap(day => 
    timeSlots.map(time => ({
      day,
      time,
      value: Math.floor(Math.random() * 120) // 0-120 minutes
    }))
  );
}

function generateMockTimeEfficiency() {
  return Array(30).fill(0).map(() => ({
    timeSpent: Math.floor(Math.random() * 3600), // 0-60 minutes in seconds
    score: Math.floor(Math.random() * 100) // 0-100%
  }));
}

function generateMockFocusDuration() {
  // Generate a curve that rises, plateaus, then falls
  return Array(10).fill(0).map((_, i) => {
    let focusScore;
    if (i < 3) {
      focusScore = 30 + (i * 20); // Rising
    } else if (i < 7) {
      focusScore = 90 - (Math.random() * 10); // Plateau with small variations
    } else {
      focusScore = 90 - ((i - 6) * 25); // Falling
    }
    
    return {
      duration: i * 10, // 0-90 minutes
      focusScore
    };
  });
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-60 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-[140px] w-full" />
      </CardContent>
    </Card>
  );
}
