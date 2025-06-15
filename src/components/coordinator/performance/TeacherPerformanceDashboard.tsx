'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { api } from '@/utils/api';
import { TeacherPerformanceCard } from './TeacherPerformanceCard';
import { ActivityCreationMetrics } from '@/components/coordinator/performance/ActivityCreationMetrics';
import { StudentImprovementChart } from '@/components/coordinator/performance/StudentImprovementChart';
import { ClassPerformanceMetrics } from './ClassPerformanceMetrics';
import { SubjectPerformanceComparison } from './SubjectPerformanceComparison';
import { TeacherPerformanceDashboardSkeleton } from './skeletons/TeacherPerformanceDashboardSkeleton';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { BarChart, BookOpen, GraduationCap } from 'lucide-react';
import { LineChart, RefreshCw, WifiOff } from '@/components/ui/icons/custom-icons';
import { Badge } from '@/components/ui/badge';

interface TeacherPerformanceDashboardProps {
  campusId: string;
  programId?: string;
  classId?: string;
  teacherId?: string;
  timeframe?: 'week' | 'month' | 'term' | 'year';
  onTeacherSelect?: (teacherId: string) => void;
}

export function TeacherPerformanceDashboard({
  campusId,
  programId,
  classId,
  teacherId,
  timeframe = 'month',
  onTeacherSelect
}: TeacherPerformanceDashboardProps) {
  // State for filters and selections
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cachedPerformanceData, setCachedPerformanceData] = useState<any>(null);

  // Responsive hooks
  const { isMobile } = useResponsive();

  // Use offline storage hook for analytics data
  const {
    isOnline,
    getData: getOfflineAnalytics,
    saveData: saveOfflineAnalytics,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch teacher performance data
  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
    refetch: refetchPerformance
  } = api.analytics.getTimeTrackingAnalytics.useQuery(
    {
      classId: classId || campusId || '', // Using classId or campusId as fallback
      timeframe: selectedTimeframe as any
    },
    {
      enabled: isOnline, // Only fetch when online
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data) {
          // Cache data for offline use
          saveOfflineAnalytics('teacher-performance', campusId, data, selectedTimeframe);
        }
      }
    }
  );

  // Load data from cache if offline
  useEffect(() => {
    if (!isOnline && !performanceData) {
      const loadOfflineData = async () => {
        try {
          const cachedData = await getOfflineAnalytics('teacher-performance', campusId, selectedTimeframe);
          if (cachedData) {
            console.log('Using cached teacher performance data');
            setCachedPerformanceData(cachedData);
          }
        } catch (error) {
          console.error('Error loading offline performance data:', error);
        }
      };

      loadOfflineData();
    }
  }, [isOnline, performanceData, campusId, selectedTimeframe, getOfflineAnalytics]);

  // Handle teacher selection
  const handleTeacherSelect = (id: string) => {
    setSelectedTeacherId(id);
    if (onTeacherSelect) {
      onTeacherSelect(id);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!isOnline) {
      // If offline, try to sync
      try {
        await sync();
      } catch (error) {
        console.error('Error syncing data:', error);
      }
      return;
    }

    setIsRefreshing(true);
    try {
      await refetchPerformance();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use cached data when offline
  const rawPerformanceData = performanceData || cachedPerformanceData;

  // Process raw data to create display data
  const displayPerformanceData = rawPerformanceData ? {
    ...rawPerformanceData,
    // Use teachers from API response or empty array
    teachers: rawPerformanceData.teachers || []
  } : null;

  // Show loading state
  if (isLoadingPerformance && !displayPerformanceData) {
    return <TeacherPerformanceDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Teacher Performance</h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!isOnline && (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </Badge>
          )}
          <Select
            value={selectedTimeframe}
            onValueChange={(value) => setSelectedTimeframe(value as 'term' | 'week' | 'month' | 'year')}
            disabled={!isOnline}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="term">This Term</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={handleRefresh}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Teacher performance cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPerformanceData?.teachers.map((teacher: any) => (
              <TeacherPerformanceCard
                key={teacher.id}
                teacher={teacher}
                onSelect={() => handleTeacherSelect(teacher.id)}
                isSelected={selectedTeacherId === teacher.id}
                isOffline={!isOnline}
              />
            ))}
          </div>

          {/* Selected teacher metrics */}
          {selectedTeacherId && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Key metrics for selected teacher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Activity Creation</h3>
                    <ActivityCreationMetrics
                      teacherId={selectedTeacherId}
                      timeframe={selectedTimeframe}
                      isOffline={!isOnline}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Student Improvement</h3>
                    <StudentImprovementChart
                      teacherId={selectedTeacherId}
                      timeframe={selectedTimeframe}
                      isOffline={!isOnline}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Creation Analysis</CardTitle>
              <CardDescription>
                Detailed metrics on teacher activity creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityCreationMetrics
                teacherId={selectedTeacherId}
                timeframe={selectedTimeframe}
                detailed={true}
                isOffline={!isOnline}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Improvement Analysis</CardTitle>
              <CardDescription>
                Detailed metrics on student improvement under this teacher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentImprovementChart
                teacherId={selectedTeacherId}
                timeframe={selectedTimeframe}
                detailed={true}
                isOffline={!isOnline}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance Analysis</CardTitle>
              <CardDescription>
                Performance metrics by class and subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClassPerformanceMetrics
                  teacherId={selectedTeacherId}
                  timeframe={selectedTimeframe}
                  isOffline={!isOnline}
                />
                <SubjectPerformanceComparison
                  teacherId={selectedTeacherId}
                  timeframe={selectedTimeframe}
                  isOffline={!isOnline}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
