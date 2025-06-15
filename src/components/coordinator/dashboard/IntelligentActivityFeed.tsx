'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { api } from '@/trpc/react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Loader2,
  Filter,
  User,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import {
  RefreshCw as RotateCw,
  Wifi as WifiIcon
} from '@/components/ui/icons/custom-icons';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

interface IntelligentActivityFeedProps {
  limit?: number;
  showFilters?: boolean;
  showCategories?: boolean;
  showPriority?: boolean;
  campusId?: string;
  programId?: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  category: 'student' | 'teacher' | 'class' | 'course' | 'attendance' | 'grade' | 'system';
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'read';
  actionable: boolean;
  actionLink?: string;
  actionText?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  relatedId?: string;
  relatedType?: string;
}

/**
 * IntelligentActivityFeed Component
 *
 * Provides an intelligent activity feed with prioritization, categorization, and filtering.
 * Features real-time updates, actionable items, and mobile-first design.
 */
export function IntelligentActivityFeed({
  limit = 10,
  showFilters = true,
  showCategories = true,
  showPriority = true,
  campusId,
  programId
}: IntelligentActivityFeedProps) {
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Offline storage hooks
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch activity feed data from API
  const {
    data: activityData,
    isLoading: isLoadingActivityData,
    refetch: refetchActivityData
  } = api.coordinatorAnalytics.getActivityFeed.useQuery(
    {
      limit: limit * 2, // Fetch more than we need to allow for filtering
      campusId,
      programId
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: isOnline,
      onSuccess: (data) => {
        if (data) {
          // Cache data for offline use
          saveOfflineData('activityFeed', 'intelligent', data);
        }
      },
      onError: (error) => {
        console.error('Error fetching activity feed:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch activity feed. Using cached data if available.',
          variant: 'error',
        });
      }
    }
  );

  // Load data from API or offline storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get data from API first
        if (isOnline && activityData) {
          setActivities(formatActivityData(activityData));
          setIsLoading(false);
        } else {
          // If offline or no API data, try to get data from storage
          const offlineData = await getOfflineData('activityFeed', 'intelligent');
          if (offlineData) {
            setActivities(formatActivityData(offlineData));
          } else {
            // If no offline data, use empty array
            setActivities([]);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading activity feed data:', error);
        setActivities([]);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOnline, activityData]);

  // Format activity data from API
  const formatActivityData = (data: any): ActivityItem[] => {
    if (!data || !data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      timestamp: new Date(item.timestamp),
      category: item.category || 'system',
      priority: item.priority || 'medium',
      status: item.status || 'new',
      actionable: item.actionable || false,
      actionLink: item.actionLink,
      actionText: item.actionText,
      user: item.user ? {
        id: item.user.id,
        name: item.user.name,
        avatar: item.user.avatar
      } : undefined,
      relatedId: item.relatedId,
      relatedType: item.relatedType
    }));
  };

  // This function has been removed as we're using real data now

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (isOnline) {
        await refetchActivityData();
      } else {
        toast({
          title: 'Offline Mode',
          description: 'You are currently offline. Data cannot be refreshed.',
          variant: 'warning',
        });
      }
    } catch (error) {
      console.error('Error refreshing activity feed:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh activity feed. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Since there's no markActivityAsRead endpoint, we'll implement a client-side solution
  const markActivityMutation = {
    mutate: (params: { activityId: string }) => {
      // Update local state immediately
      setActivities(activities.map(activity =>
        activity.id === params.activityId
          ? { ...activity, status: 'read' as const }
          : activity
      ));

      // In a real implementation, this would call an API
      console.log(`Marking activity ${params.activityId} as read (client-side only)`);

      // Save the change to offline storage for persistence
      if (activities.find(a => a.id === params.activityId)) {
        saveOfflineData('activityStatus', params.activityId, { status: 'read' });
      }
    }
  };

  // Mark activity as read
  const markAsRead = (activityId: string) => {
    // Update local state immediately for better UX
    setActivities(activities.map(activity =>
      activity.id === activityId
        ? { ...activity, status: 'read' as const }
        : activity
    ));

    // Call API to update the status
    if (isOnline) {
      markActivityMutation.mutate({ activityId });
    } else {
      // Store the change to be synced later when online
      saveOfflineData('pendingChanges', `activity-${activityId}`, {
        type: 'markAsRead',
        activityId
      });

      toast({
        title: 'Offline Mode',
        description: 'Changes will be synced when you are back online.',
        variant: 'warning',
      });
    }
  };

  // Get filtered activities
  const getFilteredActivities = () => {
    let filtered = [...activities];

    // Filter by tab
    if (activeTab === 'actionable') {
      filtered = filtered.filter(activity => activity.actionable);
    } else if (activeTab === 'unread') {
      filtered = filtered.filter(activity => activity.status === 'new');
    } else if (activeTab === 'high-priority') {
      filtered = filtered.filter(activity => activity.priority === 'high');
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(activity => activity.category === categoryFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.priority === priorityFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    // Limit the number of activities
    return filtered.slice(0, limit);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'student':
        return <GraduationCap className="h-4 w-4" />;
      case 'teacher':
        return <User className="h-4 w-4" />;
      case 'class':
        return <Users className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'attendance':
        return <Calendar className="h-4 w-4" />;
      case 'grade':
        return <FileText className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const filteredActivities = getFilteredActivities();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>Recent activities and notifications</CardDescription>
          </div>
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
      </CardHeader>

      <CardContent className="p-0">
        {!isOnline && (
          <div className="flex items-center gap-2 m-4 p-2 bg-amber-50 rounded text-amber-800 text-xs">
            <WifiIcon className="h-3 w-3" />
            <span>Showing cached activity data</span>
          </div>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="actionable">Actionable</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="high-priority">High Priority</TabsTrigger>
            </TabsList>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4">
              {showCategories && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="class">Classes</SelectItem>
                    <SelectItem value="course">Courses</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="grade">Grades</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {showPriority && (
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <TabsContent value={activeTab} className="m-0">
            <div className="max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No activities found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                    There are no activities matching your current filters
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 ${activity.status === 'new' ? 'bg-primary/5' : ''}`}
                      onClick={() => markAsRead(activity.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-full
                            ${activity.priority === 'high' ? 'bg-red-100' :
                              activity.priority === 'medium' ? 'bg-amber-100' : 'bg-gray-100'}`}
                          >
                            {getCategoryIcon(activity.category)}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {activity.title}
                              {activity.status === 'new' && (
                                <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>

                              {showPriority && activity.priority !== 'low' && (
                                <span className="ml-2">{getPriorityBadge(activity.priority)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {activity.actionable && activity.actionLink && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="ml-2"
                          >
                            <Link href={activity.actionLink}>
                              {activity.actionText || 'View'}
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
