'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Search, Plus, Filter, FileText, Edit, Eye, Trash2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActivityPurpose, SystemStatus } from '@/server/api/constants';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';

interface ActivityListProps {
  classId: string;
  className?: string;
}

export function ActivityList({ classId, className }: ActivityListProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activityType, setActivityType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
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

  // Delete activity mutation
  const deleteActivity = api.activity.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
      refetch();
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete activity: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Handle activity deletion
  const handleDeleteActivity = (id: string) => {
    setActivityToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete activity
  const confirmDeleteActivity = () => {
    if (activityToDelete) {
      deleteActivity.mutate({ id: activityToDelete });
    }
  };

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
    // Implement duplicate functionality
    toast({
      title: "Not implemented",
      description: "Duplicate functionality is not yet implemented",
    });
  };

  // Handle create activity
  const handleCreateActivity = () => {
    router.push(`/teacher/classes/${classId}/activities/create`);
  };

  // Filter activities based on search query, active tab, and activity type
  const filteredActivities = activities?.items ? activities.items.filter(activity => {
    // Filter by search query
    const matchesSearch =
      !searchQuery ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by tab (status)
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'published' && activity.status === SystemStatus.ACTIVE) ||
      (activeTab === 'draft' && activity.status === SystemStatus.INACTIVE);

    // Filter by activity type
    const matchesType =
      activityType === 'all' ||
      activity.activityType === activityType;

    // Filter by date range
    const matchesDateRange =
      !dateRange?.from ||
      (activity.createdAt && new Date(activity.createdAt) >= dateRange.from &&
        (!dateRange.to || new Date(activity.createdAt) <= dateRange.to));

    return matchesSearch && matchesTab && matchesType && matchesDateRange;
  }) : [];

  // Get activity type name from the activity type
  const getActivityTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'multiple-response': 'Multiple Response',
      'fill-in-the-blanks': 'Fill in the Blanks',
      'matching': 'Matching',
      'sequence': 'Sequence',
      'drag-and-drop': 'Drag and Drop',
      'drag-the-words': 'Drag the Words',
      'flash-cards': 'Flash Cards',
      'numeric': 'Numeric',
      'quiz': 'Quiz',
      'reading': 'Reading',
      'video': 'Video'
    };

    return typeMap[type] || type;
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Activities</h1>
          <p className="text-muted-foreground">
            Manage learning and assessment activities for your class
          </p>
        </div>

        <Button onClick={handleCreateActivity}>
          <Plus className="h-4 w-4 mr-2" />
          Create Activity
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(activityType !== 'all' || dateRange) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {((activityType !== 'all' ? 1 : 0) + (dateRange ? 1 : 0))}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Activities</h4>

              <div className="space-y-2">
                <h5 className="text-sm font-medium">Activity Type</h5>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="multiple-response">Multiple Response</option>
                  <option value="fill-in-the-blanks">Fill in the Blanks</option>
                  <option value="matching">Matching</option>
                  <option value="sequence">Sequence</option>
                  <option value="drag-and-drop">Drag and Drop</option>
                  <option value="drag-the-words">Drag the Words</option>
                  <option value="flash-cards">Flash Cards</option>
                  <option value="numeric">Numeric</option>
                  <option value="quiz">Quiz</option>
                  <option value="reading">Reading</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium">Date Created</h5>
                {/* Date range picker would go here */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange(undefined)}
                    disabled={!dateRange}
                  >
                    Clear Dates
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActivityType('all');
                    setDateRange(undefined);
                  }}
                  disabled={activityType === 'all' && !dateRange}
                >
                  Reset All
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ActivityGrid
            activities={filteredActivities}
            isLoading={isLoading}
            onView={handleViewActivity}
            onEdit={handleEditActivity}
            onDuplicate={handleDuplicateActivity}
            onDelete={handleDeleteActivity}
          />
        </TabsContent>

        <TabsContent value="published" className="mt-6">
          <ActivityGrid
            activities={filteredActivities}
            isLoading={isLoading}
            onView={handleViewActivity}
            onEdit={handleEditActivity}
            onDuplicate={handleDuplicateActivity}
            onDelete={handleDeleteActivity}
          />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <ActivityGrid
            activities={filteredActivities}
            isLoading={isLoading}
            onView={handleViewActivity}
            onEdit={handleEditActivity}
            onDuplicate={handleDuplicateActivity}
            onDelete={handleDeleteActivity}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this activity. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteActivity} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ActivityGridProps {
  activities: any[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function ActivityGrid({
  activities,
  isLoading,
  onView,
  onEdit,
  onDuplicate,
  onDelete
}: ActivityGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded m-4"></div>
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mx-4 mb-2"></div>
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mx-4 mb-4"></div>
            <div className="h-20 bg-gray-100 dark:bg-gray-800 p-4">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No activities found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your filters or create a new activity
          </p>
        </CardContent>
      </Card>
    );
  }

  // Activity grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map(activity => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onView={() => onView(activity.id)}
          onEdit={() => onEdit(activity.id)}
          onDuplicate={() => onDuplicate(activity.id)}
          onDelete={() => onDelete(activity.id)}
        />
      ))}
    </div>
  );
}

interface ActivityCardProps {
  activity: any;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ActivityCard({
  activity,
  onView,
  onEdit,
  onDuplicate,
  onDelete
}: ActivityCardProps) {
  // Get activity type name from the activity type
  const getActivityTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'multiple-response': 'Multiple Response',
      'fill-in-the-blanks': 'Fill in the Blanks',
      'matching': 'Matching',
      'sequence': 'Sequence',
      'drag-and-drop': 'Drag and Drop',
      'drag-the-words': 'Drag the Words',
      'flash-cards': 'Flash Cards',
      'numeric': 'Numeric',
      'quiz': 'Quiz',
      'reading': 'Reading',
      'video': 'Video'
    };

    return typeMap[type] || type;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline">
            {getActivityTypeName(activity.activityType)}
          </Badge>
          <Badge variant={activity.purpose === ActivityPurpose.LEARNING ? "secondary" : "default"}>
            {activity.purpose === ActivityPurpose.LEARNING ? "Learning" : "Assessment"}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1">{activity.title}</CardTitle>
        {activity.description && (
          <CardDescription className="line-clamp-2">
            {activity.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Calendar className="h-4 w-4 mr-1" />
          <span>
            {activity.createdAt ? format(new Date(activity.createdAt), 'MMM d, yyyy') : 'No date'}
          </span>
          {activity.estimatedTime && (
            <>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{activity.estimatedTime} min</span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
