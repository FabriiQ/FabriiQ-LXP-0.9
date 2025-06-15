'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { ActivityCard } from './ActivityCard';
import { DateRangeSelector } from './DateRangeSelector';
import { LessonPlanFilter } from './LessonPlanFilter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import {
  Search,
  Plus,
  Filter,
  FileText,
  Calendar,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ActivityGridProps {
  classId: string;
  className?: string;
}

/**
 * ActivityGrid component for displaying and filtering activities
 *
 * Features:
 * - Responsive grid layout
 * - Search and filter functionality
 * - Date range filtering
 * - Lesson plan filtering
 * - Activity type filtering
 * - Status tabs (All, Published, Draft)
 */
export function ActivityGrid({ classId, className }: ActivityGridProps) {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activityType, setActivityType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedLessonPlans, setSelectedLessonPlans] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  // Fetch activities for this class
  const { data: activities, isLoading, refetch } = api.class.listActivities.useQuery(
    {
      classId,
      status: 'ACTIVE',
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Fetch lesson plans for this class
  const { data: lessonPlans } = api.lessonPlan.getByClassAndTeacher.useQuery(
    {
      classId,
      teacherId: '', // This will be filled by the server using the current user's teacher profile
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Delete activity mutation
  const deleteActivity = api.activity.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    },
  });

  // Handle activity deletion
  const handleDeleteActivity = (id: string) => {
    setActivityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteActivity = () => {
    if (activityToDelete) {
      deleteActivity.mutate({ id: activityToDelete });
    }
  };

  // Map API activity data to the format expected by ActivityCard
  const mapActivityForDisplay = (activity: any) => {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.content && typeof activity.content === 'object' && 'description' in activity.content &&
                  typeof activity.content.description === 'string' ? activity.content.description : '',
      activityType: activity.activityType || 'Unknown',
      subject: activity.subject?.name,
      topic: activity.topic?.title,
      createdAt: activity.createdAt.toString(),
      dueDate: activity.endDate?.toString(),
      status: activity.status.toLowerCase() as 'draft' | 'published' | 'archived',
      lessonPlan: activity.lessonPlanId ? {
        id: activity.lessonPlanId,
        title: 'Lesson Plan' // Fallback title if actual title not available
      } : undefined
    };
  };

  // Filter activities based on all filters
  const filteredActivities = activities && activities.items
    ? activities.items.filter(activity => {
        // Filter by search query
        const matchesSearch =
          activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (activity.content && typeof activity.content === 'object' && 'description' in activity.content &&
           typeof activity.content.description === 'string' && activity.content.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Filter by status tab
        const matchesStatus =
          activeTab === 'all' ||
          activity.status.toLowerCase() === activeTab;

        // Filter by activity type
        const matchesType =
          activityType === 'all' ||
          (activity.activityType && activity.activityType.toLowerCase() === activityType.toLowerCase());

        // Filter by date range
        const matchesDateRange = !dateRange || !dateRange.from || !activity.endDate
          ? true
          : (() => {
              const activityDate = new Date(activity.endDate);
              const from = new Date(dateRange.from);
              from.setHours(0, 0, 0, 0);

              if (!dateRange.to) {
                return activityDate >= from;
              }

              const to = new Date(dateRange.to);
              to.setHours(23, 59, 59, 999);

              return activityDate >= from && activityDate <= to;
            })();

        // Filter by lesson plan
        const matchesLessonPlan =
          selectedLessonPlans.length === 0 ||
          (activity.lessonPlanId && selectedLessonPlans.includes(activity.lessonPlanId));

        return matchesSearch && matchesStatus && matchesType && matchesDateRange && matchesLessonPlan;
      })
    : [];

  // Get unique activity types
  const activityTypes = activities && activities.items
    ? ['all', ...new Set(activities.items.map(activity => activity.activityType || 'Unknown').filter(Boolean))]
    : ['all'];

  // Handle view activity
  const handleViewActivity = (id: string) => {
    router.push(`/teacher/classes/${classId}/activities/${id}`);
  };

  // Handle edit activity
  const handleEditActivity = (id: string) => {
    router.push(`/teacher/classes/${classId}/activities/${id}/edit`);
  };

  // Handle duplicate activity
  const handleDuplicateActivity = (id: string) => {
    router.push(`/teacher/classes/${classId}/activities/${id}/duplicate`);
  };

  // Handle assign activity
  const handleAssignActivity = (id: string) => {
    router.push(`/teacher/classes/${classId}/activities/${id}/assign`);
  };

  // Determine grid columns based on screen size and number of items
  const getGridCols = () => {
    if (isMobile) return 1;
    if (isTablet) return Math.min(2, filteredActivities.length);
    return Math.min(3, filteredActivities.length);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="pl-8 w-full sm:w-[260px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Toggle filters</span>
          </Button>

          <Button
            className="flex-1 sm:flex-none"
            onClick={() => router.push(`/teacher/content-studio?classId=${classId}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Activity
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter activities by type, date, and lesson plan
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select
                value={activityType}
                onValueChange={setActivityType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type as string} value={type as string}>
                      {type === 'all' ? 'All Types' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <DateRangeSelector
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            {lessonPlans && lessonPlans.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Lesson Plan</label>
                <LessonPlanFilter
                  lessonPlans={lessonPlans}
                  selectedLessonPlans={selectedLessonPlans}
                  onSelectionChange={setSelectedLessonPlans}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setActivityType('all');
                setDateRange(undefined);
                setSelectedLessonPlans([]);
              }}
            >
              Reset Filters
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(false)}
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Status tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Activity count */}
      <div className="text-sm text-muted-foreground">
        {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
      </div>

      {/* Activities grid */}
      {isLoading ? (
        <div className={cn(
          "grid gap-4",
          `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
        )}>
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredActivities.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
        )}>
          {filteredActivities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={mapActivityForDisplay(activity)}
              onView={handleViewActivity}
              onEdit={handleEditActivity}
              onDuplicate={handleDuplicateActivity}
              onDelete={handleDeleteActivity}
              onAssign={handleAssignActivity}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No activities found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || showFilters || activeTab !== 'all' || activityType !== 'all' || dateRange || selectedLessonPlans.length > 0
                ? 'Try adjusting your filters or search query'
                : 'This class doesn\'t have any activities yet'}
            </p>
            <Button onClick={() => router.push(`/teacher/content-studio?classId=${classId}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Activity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteActivity}
              disabled={deleteActivity.isLoading}
            >
              {deleteActivity.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
