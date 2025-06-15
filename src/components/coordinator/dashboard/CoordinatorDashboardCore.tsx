'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { api } from '@/trpc/react';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Bell,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Minus as MinusIcon } from '@/components/ui/icons/lucide-icons';
import {
  RefreshCw as RotateCw,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from '@/components/ui/icons/custom-icons';

// Alias for Activity
const ActivityIcon = Activity;
import Link from 'next/link';
import { DashboardSection, DashboardGrid } from '@/components/ui/specialized/dashboard/dashboard-layout';
import { ActivityFeed } from '@/components/ui/specialized/dashboard/activity-feed';

interface KeyMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  link?: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  link?: string;
}

/**
 * CoordinatorDashboardCore Component
 *
 * Provides an intuitive dashboard layout with key metrics display and intelligent activity feed.
 * Features real-time updates, mobile-first design, and offline capabilities.
 */
export function CoordinatorDashboardCore() {
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetric[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch key metrics from the API
  const {
    data: metricsData,
    isLoading: isLoadingMetricsData,
    refetch: refetchMetrics
  } = api.coordinatorAnalytics.getKeyMetrics.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: isOnline,
      onSuccess: (data) => {
        if (data) {
          // Cache data for offline use
          saveOfflineData('keyMetrics', 'dashboard', data);
        }
      }
    }
  );

  // Fetch activity feed from the API
  const {
    data: activityData,
    isLoading: isLoadingActivityData,
    refetch: refetchActivity
  } = api.coordinatorAnalytics.getActivityFeed.useQuery(
    { limit: 10 },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: isOnline,
      onSuccess: (data) => {
        if (data) {
          // Cache data for offline use
          saveOfflineData('activityFeed', 'dashboard', data);
        }
      }
    }
  );

  // Load data from API or offline storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get data from API first
        if (isOnline) {
          if (metricsData) {
            setKeyMetrics(formatKeyMetrics(metricsData));
            setIsLoadingMetrics(false);
          }

          if (activityData) {
            setActivityItems(formatActivityItems(activityData));
            setIsLoadingActivity(false);
          }
        } else {
          // If offline, try to get data from storage
          const offlineMetrics = await getOfflineData('keyMetrics', 'dashboard');
          if (offlineMetrics) {
            setKeyMetrics(formatKeyMetrics(offlineMetrics));
          }

          const offlineActivity = await getOfflineData('activityFeed', 'dashboard');
          if (offlineActivity) {
            setActivityItems(formatActivityItems(offlineActivity));
          }

          setIsLoadingMetrics(false);
          setIsLoadingActivity(false);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'error',
        });
        setIsLoadingMetrics(false);
        setIsLoadingActivity(false);
      }
    };

    loadData();
  }, [isOnline, metricsData, activityData]);



  // Format key metrics data from API response
  const formatKeyMetrics = (data: any): KeyMetric[] => {
    if (!data) return [];

    return [
      {
        id: 'teachers',
        title: 'Active Teachers',
        value: data.teacherCount || 0,
        change: data.teacherChange || 0,
        changeType: data.teacherChange > 0 ? 'positive' : data.teacherChange < 0 ? 'negative' : 'neutral',
        icon: <Users className="h-5 w-5" />,
        link: '/admin/coordinator/teachers'
      },
      {
        id: 'attendance',
        title: 'Avg. Attendance',
        value: `${data.attendanceRate || 0}%`,
        change: data.attendanceChange || 0,
        changeType: data.attendanceChange > 0 ? 'positive' : data.attendanceChange < 0 ? 'negative' : 'neutral',
        icon: <Calendar className="h-5 w-5" />,
        link: '/admin/coordinator/analytics/attendance'
      },
      {
        id: 'performance',
        title: 'Avg. Performance',
        value: `${data.performanceRate || 0}%`,
        change: data.performanceChange || 0,
        changeType: data.performanceChange > 0 ? 'positive' : data.performanceChange < 0 ? 'negative' : 'neutral',
        icon: <ActivityIcon className="h-5 w-5" />,
        link: '/admin/coordinator/analytics/performance'
      }
    ];
  };

  // Format activity items from API response
  const formatActivityItems = (data: any): ActivityItem[] => {
    if (!data || !data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      timestamp: new Date(item.timestamp),
      type: item.type || 'info',
      user: item.user ? {
        id: item.user.id,
        name: item.user.name,
        avatar: item.user.avatar
      } : undefined,
      link: item.link
    }));
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (isOnline) {
        await Promise.all([
          refetchMetrics(),
          refetchActivity()
        ]);
      } else {
        toast({
          title: 'Offline Mode',
          description: 'You are currently offline. Data cannot be refreshed.',
          variant: 'warning',
        });
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh dashboard data. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render change indicator
  const renderChangeIndicator = (change: number, type: 'positive' | 'negative' | 'neutral') => {
    if (type === 'positive') {
      return (
        <div className="flex items-center text-green-600 text-xs font-medium">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {Math.abs(change).toFixed(1)}%
        </div>
      );
    } else if (type === 'negative') {
      return (
        <div className="flex items-center text-red-600 text-xs font-medium">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {Math.abs(change).toFixed(1)}%
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500 text-xs font-medium">
          <MinusIcon className="h-3 w-3 mr-1" />
          0%
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || !isOnline}
        >
          <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <DashboardSection title="Key Metrics" description="Overview of important metrics across your programs">
        <DashboardGrid columns={3} className="gap-4">
          {isLoadingMetrics ? (
            // Skeleton loaders for metrics
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            // Actual metrics
            keyMetrics.map((metric) => (
              <Card key={metric.id} className="overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <div className="text-muted-foreground">{metric.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {renderChangeIndicator(metric.change, metric.changeType)}
                </CardContent>
                <CardFooter className="p-2 pt-0">
                  {metric.link && (
                    <Link
                      href={metric.link}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      View details →
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </DashboardGrid>
      </DashboardSection>

      <DashboardSection title="Recent Activity" description="Latest events and notifications">
        <Card>
          <CardContent className="p-4">
            <ActivityFeed
              items={activityItems.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                timestamp: item.timestamp,
                type: item.type,
                user: item.user,
                link: item.link ? {
                  text: item.link.includes('students') ? 'View Student' :
                        item.link.includes('teachers') ? 'View Teacher' :
                        item.link.includes('classes') ? 'View Class' :
                        'View Details',
                  url: item.link
                } : undefined
              }))}
              isLoading={isLoadingActivity}
              showTimeAgo
              maxItems={10}
              emptyMessage="No recent activity"
              showViewMore
              onViewMore={() => {/* Handle view more */}}
              role="coordinator"
            />
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}
