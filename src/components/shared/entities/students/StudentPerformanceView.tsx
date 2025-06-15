'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
// TODO: Fix Progress import
// import { Progress } from '@/components/ui/core/progress';
import { Badge } from '@/components/ui/core/badge';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Calendar,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Minus, Star } from './icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  StudentData,
  StudentPerformanceMetric,
  UserRole
} from './types';

// Import chart components
// Note: You would need to install these dependencies
// npm install @nivo/bar @nivo/line @nivo/pie
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

export interface StudentPerformanceViewProps {
  /**
   * Student data
   */
  student: StudentData;

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * Performance metrics to display
   */
  metrics?: StudentPerformanceMetric[];

  /**
   * Time range for metrics
   * @default 'last30days'
   */
  timeRange?: 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'all';

  /**
   * Whether to show export button
   * @default true
   */
  showExport?: boolean;

  /**
   * Export callback
   */
  onExport?: () => void;

  /**
   * Time range change callback
   */
  onTimeRangeChange?: (range: string) => void;

  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentPerformanceView component with mobile-first design
 *
 * Features:
 * - Performance metrics display
 * - Charts and visualizations
 * - Time range selection
 * - Role-based metric visibility
 *
 * @example
 * ```tsx
 * <StudentPerformanceView
 *   student={student}
 *   userRole={UserRole.TEACHER}
 *   metrics={metrics}
 *   timeRange="last30days"
 *   onTimeRangeChange={handleTimeRangeChange}
 * />
 * ```
 */
export const StudentPerformanceView: React.FC<StudentPerformanceViewProps> = ({
  student,
  userRole,
  metrics = [],
  timeRange = 'last30days',
  showExport = true,
  onExport,
  onTimeRangeChange,
  isLoading = false,
  error,
  className,
}) => {
  // State for selected time range
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value as any);
    if (onTimeRangeChange) {
      onTimeRangeChange(value);
    }
  };

  // Get trend icon
  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Get trend text
  const getTrendText = (change?: number) => {
    if (!change) return 'No change';
    if (change > 0) return `+${change.toFixed(1)}%`;
    return `${change.toFixed(1)}%`;
  };

  // Get trend color
  const getTrendColor = (change?: number) => {
    if (!change) return 'text-muted-foreground';
    if (change > 0) return 'text-green-500';
    return 'text-red-500';
  };

  // Get time range label
  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case 'last7days':
        return 'Last 7 Days';
      case 'last30days':
        return 'Last 30 Days';
      case 'last90days':
        return 'Last 90 Days';
      case 'lastYear':
        return 'Last Year';
      case 'all':
        return 'All Time';
      default:
        return 'Last 30 Days';
    }
  };

  // Generate sample performance data if not provided
  const generateSamplePerformanceData = () => {
    // Sample academic performance data
    const academicData = Array.from({ length: 10 }, (_, i) => ({
      x: `Week ${i + 1}`,
      y: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
    }));

    // Sample attendance data
    const attendanceData = Array.from({ length: 10 }, (_, i) => ({
      x: `Week ${i + 1}`,
      y: Math.floor(Math.random() * 20) + 80, // Random attendance between 80-100
    }));

    // Sample participation data
    const participationData = Array.from({ length: 10 }, (_, i) => ({
      x: `Week ${i + 1}`,
      y: Math.floor(Math.random() * 40) + 60, // Random participation between 60-100
    }));

    return [
      {
        id: 'Academic',
        data: academicData,
      },
      {
        id: 'Attendance',
        data: attendanceData,
      },
      {
        id: 'Participation',
        data: participationData,
      },
    ];
  };

  // Generate sample grade distribution data if not provided
  const generateSampleGradeDistribution = () => {
    return [
      { id: 'A', label: 'A', value: 8 },
      { id: 'B', label: 'B', value: 12 },
      { id: 'C', label: 'C', value: 5 },
      { id: 'D', label: 'D', value: 2 },
      { id: 'F', label: 'F', value: 1 },
    ];
  };

  // Generate sample subject performance data if not provided
  const generateSampleSubjectPerformance = () => {
    return [
      { subject: 'Math', score: 85 },
      { subject: 'Science', score: 92 },
      { subject: 'English', score: 78 },
      { subject: 'History', score: 88 },
      { subject: 'Art', score: 95 },
    ];
  };

  // Sample performance data
  const performanceData = generateSamplePerformanceData();
  const gradeDistribution = generateSampleGradeDistribution();
  const subjectPerformance = generateSampleSubjectPerformance();

  // Default metrics if none provided
  const defaultMetrics: StudentPerformanceMetric[] = [
    {
      id: 'academic',
      name: 'Academic Score',
      value: student.academicScore || 0,
      previousValue: (student.academicScore || 0) - 2.5,
      change: 2.5,
      target: 90,
      color: 'bg-blue-500',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      id: 'attendance',
      name: 'Attendance Rate',
      value: student.attendanceRate || 0,
      previousValue: (student.attendanceRate || 0) - 1.2,
      change: 1.2,
      target: 95,
      color: 'bg-green-500',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: 'participation',
      name: 'Participation Rate',
      value: student.participationRate || 0,
      previousValue: (student.participationRate || 0) + 3.7,
      change: -3.7,
      target: 85,
      color: 'bg-purple-500',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 'rank',
      name: 'Class Rank',
      value: student.leaderboardPosition || 0,
      previousValue: (student.leaderboardPosition || 0) + 2,
      change: 2,
      color: 'bg-amber-500',
      icon: <Award className="h-5 w-5" />,
    },
  ];

  // Use provided metrics or default ones
  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics;

  // Filter metrics based on user role
  const visibleMetrics = displayMetrics.filter(metric => {
    // Students can't see rank
    if (metric.id === 'rank' && userRole === UserRole.STUDENT) {
      return false;
    }
    return true;
  });

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>

              <Skeleton className="h-64 w-full" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                {getTimeRangeLabel(selectedTimeRange)}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedTimeRange}
                onValueChange={handleTimeRangeChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              {showExport && onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Performance metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleMetrics.map((metric) => (
                <Card key={metric.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={cn("p-2 rounded-full mr-3", metric.color)}>
                          {metric.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{metric.name}</p>
                          <h3 className="text-2xl font-bold">
                            {metric.id === 'rank' ? `#${metric.value}` : `${metric.value.toFixed(1)}%`}
                          </h3>
                        </div>
                      </div>

                      {metric.change !== undefined && (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center">
                            {getTrendIcon(metric.change)}
                            <span className={cn("ml-1 text-sm", getTrendColor(metric.change))}>
                              {getTrendText(metric.change)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">vs previous</p>
                        </div>
                      )}
                    </div>

                    {metric.target && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{Math.min(100, (metric.value / metric.target) * 100).toFixed(0)}%</span>
                        </div>
                        {/* TODO: Fix Progress component */}
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Target: {metric.target}%</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance trend chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Trend</CardTitle>
                <CardDescription>
                  Academic, attendance, and participation trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveLine
                    data={performanceData}
                    margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                    xScale={{ type: 'point' }}
                    yScale={{
                      type: 'linear',
                      min: 'auto',
                      max: 'auto',
                      stacked: false,
                      reverse: false
                    }}
                    yFormat=" >-.1f"
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
                      legend: 'Score (%)',
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
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 50,
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
              </CardContent>
            </Card>

            {/* Subject performance and grade distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subject Performance</CardTitle>
                  <CardDescription>
                    Performance across different subjects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveBar
                      data={subjectPerformance.map(item => ({
                        subject: item.subject,
                        score: item.score,
                      }))}
                      keys={['score']}
                      indexBy="subject"
                      margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                      padding={0.3}
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={{ scheme: 'blues' }}
                      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Subject',
                        legendPosition: 'middle',
                        legendOffset: 32
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Score',
                        legendPosition: 'middle',
                        legendOffset: -40
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Grade distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grade Distribution</CardTitle>
                  <CardDescription>
                    Distribution of grades across all subjects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsivePie
                      data={gradeDistribution}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      borderWidth={1}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor="#333333"
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                      colors={{ scheme: 'set3' }}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 20,
                          itemsSpacing: 0,
                          itemWidth: 40,
                          itemHeight: 20,
                          itemTextColor: '#999',
                          itemDirection: 'left-to-right',
                          itemOpacity: 1,
                          symbolSize: 18,
                          symbolShape: 'circle',
                        }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent grades */}
            {student.performance?.recentGrades && student.performance.recentGrades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Grades</CardTitle>
                  <CardDescription>
                    Latest assessment results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Subject</th>
                          <th className="text-left py-3 px-4 font-medium">Score</th>
                          <th className="text-left py-3 px-4 font-medium">Grade</th>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.performance.recentGrades.map((grade) => (
                          <tr key={grade.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{grade.subject}</td>
                            <td className="py-3 px-4">{grade.score}%</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{grade.letterGrade}</Badge>
                            </td>
                            <td className="py-3 px-4">{format(grade.date, 'MMM d, yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths and weaknesses */}
            {(student.performance?.strengths || student.performance?.weaknesses) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                {student.performance?.strengths && student.performance.strengths.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-lg">Strengths</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {student.performance.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-amber-500 mt-0.5" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Weaknesses */}
                {student.performance?.weaknesses && student.performance.weaknesses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {student.performance.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPerformanceView;
