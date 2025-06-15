'use client';

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Users,
  GraduationCap,
  BarChart as BarChartIcon,
  Calendar,
  Clock,
} from "lucide-react";
import { PieChart as PieChartIcon, WifiOff, RefreshCw } from "@/components/ui/icons/custom-icons";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/form/select";
import { DatePicker } from "@/components/ui/date-picker";
import { LineChart } from "@/components/ui/charts/LineChart";
import { BarChart } from "@/components/ui/charts/BarChart";
import { PieChart } from "@/components/ui/charts/PieChart";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { useOfflineStorage, OfflineStorageType } from "@/features/coordinator/offline";
import { useToast } from "@/components/ui/use-toast";
import { useResponsive } from "@/lib/hooks/use-responsive";

interface ProgramAnalyticsDashboardProps {
  programId: string;
  programName: string;
  selectedCampus?: string;
  campusName?: string;
  campuses?: {
    id: string;
    name: string;
    code: string;
  }[];
  onViewCourses?: () => void;
}

export function ProgramAnalyticsDashboard({
  programId,
  programName,
  selectedCampus: initialSelectedCampus,
  campusName,
  campuses = [],
  onViewCourses
}: ProgramAnalyticsDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState("enrollment");
  const [selectedCampus, setSelectedCampus] = useState<string>(initialSelectedCampus || "");
  const [dateRange, setDateRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: new Date()
  });
  const [groupBy, setGroupBy] = useState<string>("month");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cachedEnrollmentData, setCachedEnrollmentData] = useState<any>(null);
  const [cachedPerformanceData, setCachedPerformanceData] = useState<any>(null);

  // Use offline storage hook
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch enrollment analytics
  const {
    data: enrollmentData,
    isLoading: enrollmentLoading,
    refetch: refetchEnrollment
  } = api.programAnalytics.getEnrollmentAnalytics.useQuery({
    programId,
    campusId: selectedCampus || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    groupBy: groupBy as any
  }, {
    enabled: isOnline, // Only fetch when online
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      if (data) {
        // Cache data for offline use
        const cacheKey = `enrollment-${programId}-${selectedCampus || 'all'}-${groupBy}`;
        saveOfflineData('enrollment', programId, data, cacheKey);
      }
    },
    onError: (error) => {
      console.error('Error fetching enrollment analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enrollment analytics',
        variant: 'error',
      });
    }
  });

  // Fetch performance analytics
  const {
    data: performanceData,
    isLoading: performanceLoading,
    refetch: refetchPerformance
  } = api.programAnalytics.getPerformanceAnalytics.useQuery({
    programId,
    campusId: selectedCampus || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    groupBy: groupBy as any
  }, {
    enabled: isOnline, // Only fetch when online
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      if (data) {
        // Cache data for offline use
        const cacheKey = `performance-${programId}-${selectedCampus || 'all'}-${groupBy}`;
        saveOfflineData('performance', programId, data, cacheKey);
      }
    },
    onError: (error) => {
      console.error('Error fetching performance analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance analytics',
        variant: 'error',
      });
    }
  });

  // Load data from cache if offline
  useEffect(() => {
    if (!isOnline) {
      const loadOfflineData = async () => {
        try {
          // Load enrollment data
          const enrollmentCacheKey = `enrollment-${programId}-${selectedCampus || 'all'}-${groupBy}`;
          const cachedEnrollment = await getOfflineData('enrollment', programId, enrollmentCacheKey);
          if (cachedEnrollment) {
            console.log('Using cached enrollment data');
            setCachedEnrollmentData(cachedEnrollment);
          }

          // Load performance data
          const performanceCacheKey = `performance-${programId}-${selectedCampus || 'all'}-${groupBy}`;
          const cachedPerformance = await getOfflineData('performance', programId, performanceCacheKey);
          if (cachedPerformance) {
            console.log('Using cached performance data');
            setCachedPerformanceData(cachedPerformance);
          }
        } catch (error) {
          console.error('Error loading offline analytics data:', error);
        }
      };

      loadOfflineData();
    }
  }, [isOnline, programId, selectedCampus, groupBy, getOfflineData]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!isOnline) {
      // If offline, try to sync
      toast({
        title: 'Offline Mode',
        description: 'You are currently offline. Using cached data.',
        variant: 'warning',
      });

      try {
        await sync();
      } catch (error) {
        console.error('Error syncing data:', error);
      }

      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all([refetchEnrollment(), refetchPerformance()]);
      toast({
        title: 'Data refreshed',
        description: 'Analytics data has been updated',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use cached data when offline
  const effectiveEnrollmentData = enrollmentData || cachedEnrollmentData;
  const effectivePerformanceData = performanceData || cachedPerformanceData;

  const isLoading = (enrollmentLoading || performanceLoading) && !cachedEnrollmentData && !cachedPerformanceData;

  // Format enrollment trend data for the line chart
  const enrollmentTrendData = effectiveEnrollmentData?.enrollmentTrend || [];

  // Format grade distribution data for the pie chart
  const gradeDistributionData = effectivePerformanceData?.gradeDistribution?.map(item => ({
    name: item.grade,
    value: item.count,
    color: getGradeColor(item.grade)
  })) || [];

  // Format course performance data for the bar chart
  const coursePerformanceData = effectivePerformanceData?.coursePerformance || [];

  // Format enrollment by campus data for the pie chart
  const enrollmentByCampusData = effectiveEnrollmentData?.enrollmentByCampus?.map(item => ({
    name: item.campusName,
    value: item.count,
    color: getCampusColor(item.campusId)
  })) || [];

  // Format enrollment by gender data for the pie chart
  const enrollmentByGenderData = effectiveEnrollmentData?.enrollmentByGender ? [
    { name: 'Male', value: effectiveEnrollmentData.enrollmentByGender.male, color: '#3b82f6' },
    { name: 'Female', value: effectiveEnrollmentData.enrollmentByGender.female, color: '#ec4899' },
    { name: 'Other', value: effectiveEnrollmentData.enrollmentByGender.other, color: '#10b981' },
    { name: 'Unspecified', value: effectiveEnrollmentData.enrollmentByGender.unspecified, color: '#6b7280' }
  ] : [];

  // Helper function to get color for grade
  function getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return '#10b981'; // green
      case 'B': return '#3b82f6'; // blue
      case 'C': return '#f59e0b'; // yellow
      case 'D': return '#f97316'; // orange
      case 'F': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  }

  // Helper function to get color for campus
  function getCampusColor(campusId: string): string {
    // Generate a deterministic color based on campus ID
    const hash = campusId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // yellow
      '#ec4899', // pink
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ef4444', // red
      '#6b7280', // gray
    ];

    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="space-y-6">
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <div>
            <p className="font-medium">Offline Mode</p>
            <p className="text-xs">You're viewing cached analytics data. Some features may be limited.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/admin/coordinator/programs/${programId}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{programName} - Analytics</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="hidden md:flex"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-auto">
          <Select
            value={selectedCampus}
            onValueChange={setSelectedCampus}
            disabled={!isOnline}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Campuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Campuses</SelectItem>
              {campuses.map(campus => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <DatePicker
            value={dateRange.startDate}
            onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
            placeholder="Start Date"
            className="w-full md:w-auto"
            disabled={!isOnline}
          />
          <DatePicker
            value={dateRange.endDate}
            onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
            placeholder="End Date"
            className="w-full md:w-auto"
            disabled={!isOnline}
          />
        </div>

        <div className="w-full md:w-auto">
          <Select
            value={groupBy}
            onValueChange={setGroupBy}
            disabled={!isOnline}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="md:hidden w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="enrollment" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enrollment">Enrollment Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Current Enrollment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {effectiveEnrollmentData?.currentEnrollment || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total students enrolled
                    </p>
                    {!isOnline && cachedEnrollmentData && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Using cached data
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Gender Ratio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {effectiveEnrollmentData?.enrollmentByGender ? (
                        `${Math.round((effectiveEnrollmentData.enrollmentByGender.male / effectiveEnrollmentData.currentEnrollment) * 100)}% / ${Math.round((effectiveEnrollmentData.enrollmentByGender.female / effectiveEnrollmentData.currentEnrollment) * 100)}%`
                      ) : '0% / 0%'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Male / Female ratio
                    </p>
                    {!isOnline && cachedEnrollmentData && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Using cached data
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Time Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium">
                      {dateRange.startDate?.toLocaleDateString()} - {dateRange.endDate?.toLocaleDateString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selected date range
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollmentTrendData.length > 0 ? (
                  <LineChart
                    title="Enrollment Trend"
                    description={`Enrollment trend over time (${groupBy})`}
                    data={enrollmentTrendData}
                    xAxisKey="date"
                    lines={[
                      { dataKey: "count", name: "Students", color: "#3b82f6" }
                    ]}
                    height={300}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enrollment Trend</CardTitle>
                      <CardDescription>{`Enrollment trend over time (${groupBy})`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center items-center h-[300px] bg-muted/20 rounded-md">
                        <p className="text-muted-foreground">No enrollment trend data available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enrollmentByCampusData.length > 0 ? (
                  <PieChart
                    title="Enrollment by Campus"
                    description="Distribution of students across campuses"
                    data={enrollmentByCampusData}
                    height={300}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enrollment by Campus</CardTitle>
                      <CardDescription>Distribution of students across campuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center items-center h-[300px] bg-muted/20 rounded-md">
                        <p className="text-muted-foreground">No campus distribution data available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {enrollmentByGenderData.length > 0 ? (
                <PieChart
                  title="Enrollment by Gender"
                  description="Distribution of students by gender"
                  data={enrollmentByGenderData}
                  height={300}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment by Gender</CardTitle>
                    <CardDescription>Distribution of students by gender</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center h-[300px] bg-muted/20 rounded-md">
                      <p className="text-muted-foreground">No gender distribution data available</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChartIcon className="mr-2 h-4 w-4" />
                      Average Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {effectivePerformanceData?.averageGrade?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      GPA scale (0-4)
                    </p>
                    {!isOnline && cachedPerformanceData && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Using cached data
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Attendance Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {effectivePerformanceData?.attendanceRate?.toFixed(1) || '0.0'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average attendance
                    </p>
                    {!isOnline && cachedPerformanceData && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Using cached data
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {effectivePerformanceData?.completionRate?.toFixed(1) || '0.0'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Program completion
                    </p>
                    {!isOnline && cachedPerformanceData && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Using cached data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gradeDistributionData.length > 0 ? (
                  <PieChart
                    title="Grade Distribution"
                    description="Distribution of grades across all courses"
                    data={gradeDistributionData}
                    height={300}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Grade Distribution</CardTitle>
                      <CardDescription>Distribution of grades across all courses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center items-center h-[300px] bg-muted/20 rounded-md">
                        <p className="text-muted-foreground">No grade distribution data available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {coursePerformanceData.length > 0 ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Course Performance</CardTitle>
                        <CardDescription>Average grades by course</CardDescription>
                      </div>
                      {onViewCourses && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onViewCourses}
                          className="ml-auto"
                        >
                          View Course Analytics
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      <BarChart
                        data={coursePerformanceData}
                        xAxisKey="courseName"
                        bars={[
                          { dataKey: "averageGrade", name: "Average Grade", color: "#3b82f6" }
                        ]}
                        height={300}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Course Performance</CardTitle>
                        <CardDescription>Average grades by course</CardDescription>
                      </div>
                      {onViewCourses && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onViewCourses}
                          className="ml-auto"
                        >
                          View Course Analytics
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center items-center h-[300px] bg-muted/20 rounded-md">
                        <p className="text-muted-foreground">No course performance data available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {coursePerformanceData.length > 0 ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Course Pass Rates</CardTitle>
                      <CardDescription>Pass rates by course</CardDescription>
                    </div>
                    {onViewCourses && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewCourses}
                        className="ml-auto"
                      >
                        View Course Analytics
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={coursePerformanceData}
                      xAxisKey="courseName"
                      bars={[
                        { dataKey: "passRate", name: "Pass Rate (%)", color: "#10b981" }
                      ]}
                      height={300}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Course Pass Rates</CardTitle>
                      <CardDescription>Pass rates by course</CardDescription>
                    </div>
                    {onViewCourses && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewCourses}
                        className="ml-auto"
                      >
                        View Course Analytics
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center h-[300px] bg-muted/20 rounded-md">
                      <p className="text-muted-foreground">No course pass rate data available</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
