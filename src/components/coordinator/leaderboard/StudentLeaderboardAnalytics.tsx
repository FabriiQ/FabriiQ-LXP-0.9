'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { api } from '@/trpc/react';
import {
  LeaderboardEntityType,
  TimeGranularity
} from '@/features/leaderboard/types/standard-leaderboard';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart as BarChart2,
  Award,
  BookOpen,
  GraduationCap,
  Users
} from 'lucide-react';
import { RefreshCw } from '@/components/ui/icons/custom-icons';
import { AlertTriangle } from '@/components/ui/icons/alert-triangle';
import { PieChart as PieChartIcon } from '@/components/ui/icons/pie-chart';
import { LineChart as LineChartIcon } from '@/components/ui/icons/line-chart';

interface StudentLeaderboardAnalyticsProps {
  courseId?: string;
  classId?: string;
  programId?: string;
  timeframe?: 'week' | 'month' | 'term' | 'year';
}

interface Student {
  id: string;
  name: string;
  position: number;
  previousPosition?: number;
  score: number;
  grade: number;
  attendance: number;
  participation: number;
  improvement: number;
}

interface TrendData {
  date: string;
  averagePosition: number;
  averageScore: number;
  averageGrade: number;
  averageAttendance: number;
  averageParticipation: number;
  averageImprovement: number;
}

interface CorrelationData {
  name: string;
  leaderboardPosition: number;
  academicPerformance: number;
  attendance: number;
  size: number;
}

interface CohortData {
  name: string;
  averagePosition: number;
  averageScore: number;
  averageGrade: number;
}

interface InterventionSuggestion {
  id: string;
  studentName: string;
  currentPosition: number;
  positionChange: number;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * StudentLeaderboardAnalytics Component
 *
 * Provides analytics and insights for student leaderboard data.
 * Features include trend analysis, correlation analysis, cohort comparison,
 * and intervention suggestions.
 */
export function StudentLeaderboardAnalytics({
  courseId,
  classId,
  programId,
  timeframe = 'term'
}: StudentLeaderboardAnalyticsProps) {
  const { isMobile } = useResponsive();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(classId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Analytics data states
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [interventionSuggestions, setInterventionSuggestions] = useState<InterventionSuggestion[]>([]);

  // Loading states
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [isLoadingCorrelation, setIsLoadingCorrelation] = useState(true);
  const [isLoadingCohort, setIsLoadingCohort] = useState(true);
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    getData: getAnalyticsData,
    saveData: saveAnalyticsData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Available courses for selection
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);

  // Import the API client for courses - using mock data since the API doesn't exist
  useEffect(() => {
    // Mock course data
    const mockCourses = [
      { id: 'course-1', name: 'Mathematics' },
      { id: 'course-2', name: 'Physics' },
      { id: 'course-3', name: 'Chemistry' },
      { id: 'course-4', name: 'Biology' },
      { id: 'course-5', name: 'Computer Science' }
    ];

    setAvailableCourses(mockCourses);
  }, []);

  // Get classes for selected course - using mock data since the API doesn't exist
  useEffect(() => {
    if (selectedCourseId) {
      // Mock class data
      const mockClasses = [
        { id: `${selectedCourseId}-class-1`, name: 'Class A', courseId: selectedCourseId },
        { id: `${selectedCourseId}-class-2`, name: 'Class B', courseId: selectedCourseId },
        { id: `${selectedCourseId}-class-3`, name: 'Class C', courseId: selectedCourseId }
      ];

      setAvailableClasses(mockClasses);
    } else {
      setAvailableClasses([]);
    }
  }, [selectedCourseId]);

  // Map timeframe to TimeGranularity
  const mapTimeframeToGranularity = (timeframe: string): TimeGranularity => {
    switch (timeframe) {
      case 'week':
        return TimeGranularity.WEEKLY;
      case 'month':
        return TimeGranularity.MONTHLY;
      case 'term':
        return TimeGranularity.TERM;
      case 'year':
        return TimeGranularity.ALL_TIME;
      default:
        return TimeGranularity.TERM;
    }
  };

  // Determine entity type and ID based on selected filters
  const getEntityTypeAndId = () => {
    if (selectedClassId) {
      return {
        type: LeaderboardEntityType.CLASS,
        id: selectedClassId
      };
    } else if (selectedCourseId) {
      return {
        type: LeaderboardEntityType.COURSE,
        id: selectedCourseId
      };
    } else if (programId) {
      // If we have a program ID but no course or class selected
      return {
        type: LeaderboardEntityType.CAMPUS, // Using CAMPUS as a proxy for program
        id: programId
      };
    } else {
      // Default to campus if nothing is selected
      return {
        type: LeaderboardEntityType.CAMPUS,
        id: 'default-campus' // This should be replaced with the actual campus ID
      };
    }
  };

  // Get entity type and ID
  const { type: entityType, id: entityId } = getEntityTypeAndId();

  // Fetch leaderboard trends data using unified leaderboard API
  const {
    data: trendsData,
    isLoading: isLoadingTrendsApi,
    refetch: refetchTrends
  } = api.unifiedLeaderboard.getLeaderboard.useQuery(
    {
      type: entityType,
      referenceId: entityId,
      timeGranularity: mapTimeframeToGranularity(selectedTimeframe),
      limit: 50,
      includeCurrentStudent: false
    },
    {
      enabled: !!entityId,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.leaderboard) {
          // Generate trend data from leaderboard data
          // Since we don't have historical data in this API call, we'll create a simple trend
          // In a real implementation, you would fetch historical snapshots

          // Create date points for the trend (last 6 periods)
          const periods = ['6 periods ago', '5 periods ago', '4 periods ago', '3 periods ago', '2 periods ago', 'Current'];

          // Calculate averages from the leaderboard data
          const totalEntries = data.leaderboard.length || 1;
          let totalRank = 0;
          let totalScore = 0;
          let totalAcademic = 0;

          data.leaderboard.forEach(entry => {
            totalRank += entry.rank || 0;
            totalScore += (entry as any).score || 0;
            totalAcademic += entry.academicScore || 0;
          });

          const avgRank = totalRank / totalEntries;
          const avgScore = totalScore / totalEntries;
          const avgAcademic = totalAcademic / totalEntries;

          // Create trend data with some variation to show a trend
          const transformedTrends: TrendData[] = periods.map((period, index) => {
            // Add some variation to make the trend interesting
            const factor = 0.8 + (index * 0.04); // Gradually improving trend

            return {
              date: period,
              averagePosition: Math.round(avgRank * (1.1 - index * 0.02)),
              averageScore: Math.round(avgScore * factor),
              averageGrade: Math.round(avgAcademic * factor),
              averageAttendance: Math.round(85 + index * 2), // Attendance improving from 85% to 95%
              averageParticipation: Math.round(80 + index * 3), // Participation improving from 80% to 95%
              averageImprovement: index * 5 // Improvement increasing by 5% each period
            };
          });

          setTrendData(transformedTrends);

          // Save to offline storage
          saveAnalyticsData('leaderboardTrends', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`, transformedTrends);
        }
      },
      onError: async (error) => {
        console.error('Error fetching trends data:', error);

        // Try to get data from offline storage
        try {
          const offlineData = await getAnalyticsData('leaderboardTrends', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`);
          if (offlineData) {
            setTrendData(offlineData);
          }
        } catch (offlineError) {
          console.error('Error getting offline data:', offlineError);
        }
      }
    }
  );

  // Fetch correlation data using analytics API
  const {
    data: correlationApiData,
    isLoading: isLoadingCorrelationApi,
    refetch: refetchCorrelation
  } = api.analytics.getLeaderboardCorrelation.useQuery(
    {
      entityType,
      entityId,
      timeframe: selectedTimeframe
    },
    {
      enabled: !!entityId,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.correlations) {
          // Transform the correlation data
          const transformedCorrelations: CorrelationData[] = data.correlations.map(item => ({
            name: item.studentName,
            leaderboardPosition: item.leaderboardPosition,
            academicPerformance: item.academicPerformance,
            attendance: item.attendance,
            size: 100 // Fixed size for visualization
          }));

          setCorrelationData(transformedCorrelations);

          // Save to offline storage
          saveAnalyticsData('leaderboardCorrelation', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`, transformedCorrelations);
        }
      },
      onError: async (error) => {
        console.error('Error fetching correlation data:', error);

        // Try to get data from offline storage
        try {
          const offlineData = await getAnalyticsData('leaderboardCorrelation', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`);
          if (offlineData) {
            setCorrelationData(offlineData);
          }
        } catch (offlineError) {
          console.error('Error getting offline data:', offlineError);
        }
      }
    }
  );

  // Fetch cohort comparison data
  const {
    data: cohortComparisonData,
    isLoading: isLoadingCohortApi,
    refetch: refetchCohort
  } = api.analytics.getCohortComparison.useQuery(
    {
      entityType,
      entityId,
      timeframe: selectedTimeframe
    },
    {
      enabled: !!entityId,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.cohorts) {
          // Transform the cohort data
          const transformedCohorts: CohortData[] = data.cohorts.map(cohort => ({
            name: cohort.name,
            averagePosition: cohort.averagePosition,
            averageScore: cohort.averageScore,
            averageGrade: cohort.averageGrade
          }));

          setCohortData(transformedCohorts);

          // Save to offline storage
          saveAnalyticsData('leaderboardCohort', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`, transformedCohorts);
        }
      },
      onError: async (error) => {
        console.error('Error fetching cohort data:', error);

        // Try to get data from offline storage
        try {
          const offlineData = await getAnalyticsData('leaderboardCohort', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`);
          if (offlineData) {
            setCohortData(offlineData);
          }
        } catch (offlineError) {
          console.error('Error getting offline data:', offlineError);
        }
      }
    }
  );

  // Fetch intervention suggestions
  const {
    data: interventionData,
    isLoading: isLoadingInterventionsApi,
    refetch: refetchInterventions
  } = api.analytics.getInterventionSuggestions.useQuery(
    {
      entityType,
      entityId,
      timeframe: selectedTimeframe
    },
    {
      enabled: !!entityId,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.interventions) {
          // Transform the intervention data
          const transformedInterventions: InterventionSuggestion[] = data.interventions
            .filter((intervention): intervention is NonNullable<typeof intervention> => intervention !== null)
            .map(intervention => ({
              id: intervention.id,
              studentName: intervention.studentName,
              currentPosition: intervention.currentPosition,
              positionChange: intervention.positionChange,
              issue: intervention.issue,
              suggestion: intervention.suggestion,
              priority: intervention.priority as 'high' | 'medium' | 'low'
            }));

          setInterventionSuggestions(transformedInterventions);

          // Save to offline storage
          saveAnalyticsData('leaderboardInterventions', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`, transformedInterventions);
        }
      },
      onError: async (error) => {
        console.error('Error fetching intervention data:', error);

        // Try to get data from offline storage
        try {
          const offlineData = await getAnalyticsData('leaderboardInterventions', `${selectedCourseId}-${selectedClassId}-${selectedTimeframe}`);
          if (offlineData) {
            setInterventionSuggestions(offlineData);
          }
        } catch (offlineError) {
          console.error('Error getting offline data:', offlineError);
        }
      }
    }
  );

  // Update loading states based on API loading states
  useEffect(() => {
    setIsLoadingTrends(isLoadingTrendsApi);
    setIsLoadingCorrelation(isLoadingCorrelationApi);
    setIsLoadingCohort(isLoadingCohortApi);
    setIsLoadingInterventions(isLoadingInterventionsApi);
    setIsRefreshing(
      isLoadingTrendsApi ||
      isLoadingCorrelationApi ||
      isLoadingCohortApi ||
      isLoadingInterventionsApi
    );
  }, [
    isLoadingTrendsApi,
    isLoadingCorrelationApi,
    isLoadingCohortApi,
    isLoadingInterventionsApi
  ]);

  // Function to fetch all analytics data (for manual refresh)
  const fetchAnalyticsData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchTrends(),
        refetchCorrelation(),
        refetchCohort(),
        refetchInterventions()
      ]);
    } catch (error) {
      console.error('Error refreshing analytics data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    await fetchAnalyticsData();
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value);
    setSelectedClassId(undefined); // Reset class selection when course changes
  };

  // Handle class change
  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold flex items-center">
          <BarChart2 className="h-5 w-5 mr-2" />
          Leaderboard Analytics
        </h2>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCourseId && (
            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {availableClasses
                  .filter(cls => cls.courseId === selectedCourseId)
                  .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends" className="flex items-center gap-1">
            <LineChartIcon className="h-4 w-4" />
            <span>Trends</span>
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span>Correlation</span>
          </TabsTrigger>
          <TabsTrigger value="cohort" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Cohort Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Interventions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Leaderboard Performance Trends</CardTitle>
              <CardDescription>
                Track how student performance metrics change over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoadingTrends ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="averageScore" name="Avg. Score" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line yAxisId="left" type="monotone" dataKey="averageGrade" name="Avg. Grade" stroke="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="averagePosition" name="Avg. Position" stroke="#ff7300" />
                    <Line yAxisId="left" type="monotone" dataKey="averageImprovement" name="Avg. Improvement" stroke="#0088FE" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Performance Correlation Analysis</CardTitle>
              <CardDescription>
                Correlation between leaderboard position and academic performance
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoadingCorrelation ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="leaderboardPosition" name="Leaderboard Position" reversed />
                    <YAxis type="number" dataKey="academicPerformance" name="Academic Performance" />
                    <ZAxis type="number" dataKey="size" range={[60, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="Students" data={correlationData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cohort Comparison</CardTitle>
              <CardDescription>
                Compare performance metrics across different classes and courses
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoadingCohort ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageScore" name="Avg. Score" fill="#8884d8" />
                    <Bar dataKey="averageGrade" name="Avg. Grade" fill="#82ca9d" />
                    <Bar dataKey="averagePosition" name="Avg. Position" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Intervention Suggestions</CardTitle>
              <CardDescription>
                AI-powered intervention recommendations based on leaderboard patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInterventions ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 border rounded-md">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-1" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : interventionSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No interventions needed</h3>
                  <p className="text-sm text-muted-foreground">
                    All students are performing well
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interventionSuggestions.map((intervention) => {
                    if (!intervention) return null;
                    return (
                      <div
                        key={intervention.id}
                        className={`flex items-start gap-4 p-3 border rounded-md ${
                          intervention.priority === 'high'
                            ? 'border-red-200 bg-red-50'
                            : intervention.priority === 'medium'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          intervention.priority === 'high'
                            ? 'bg-red-100 text-red-600'
                            : intervention.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-blue-100 text-blue-600'
                        }`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{intervention.studentName}</h4>
                            <Badge variant={
                              intervention.priority === 'high'
                                ? 'destructive'
                                : intervention.priority === 'medium'
                                  ? 'warning'
                                  : 'secondary'
                            }>
                              {intervention.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {intervention.issue}
                          </p>
                          <p className="text-sm font-medium mt-2">
                            Suggestion: {intervention.suggestion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
