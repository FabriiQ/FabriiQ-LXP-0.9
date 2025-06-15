'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { LessonPlanStatus } from '@/server/api/schemas/lesson-plan.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/core/skeleton';
import { CalendarIcon, ClipboardList, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/teacher/lesson-plans/LessonPlanCard';

// Coordinator lesson plan card component
const CoordinatorLessonPlanCard = ({
  id,
  title,
  description,
  status,
  startDate,
  endDate,
  className,
  subjectName,
  teacherName,
  submittedAt,
  onView,
}: {
  id: string;
  title: string;
  description?: string | null;
  status: LessonPlanStatus;
  startDate: Date;
  endDate: Date;
  className: string;
  subjectName?: string | null;
  teacherName: string;
  submittedAt?: Date | null;
  onView: (id: string) => void;
}) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription className="line-clamp-2">
          {description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Teacher:</span>
            <span className="font-medium">{teacherName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Class:</span>
            <span className="font-medium">{className}</span>
          </div>
          {subjectName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subject:</span>
              <span className="font-medium">{subjectName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period:</span>
            <span className="font-medium">
              {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}
            </span>
          </div>
          {submittedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted:</span>
              <span className="font-medium">
                {format(new Date(submittedAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full" onClick={() => onView(id)}>
          Review
        </Button>
      </CardFooter>
    </Card>
  );
};

// Skeleton loader for lesson plan cards
const LessonPlanCardSkeleton = () => (
  <Card className="h-full flex flex-col">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-2/3 mt-1" />
    </CardHeader>
    <CardContent className="flex-grow">
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="pt-2">
      <Skeleton className="h-9 w-full" />
    </CardFooter>
  </Card>
);

// Main dashboard component
export default function CoordinatorLessonPlanDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [teacherFilter, setTeacherFilter] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);

  // Fetch ALL lesson plans without status filter - we'll filter on the client side
  const { data, isLoading, error } = api.lessonPlan.getByStatus.useQuery({
    // No status filter here - we'll filter in the client
    status: undefined,
    teacherId: teacherFilter || undefined,
    classId: classFilter || undefined,
  }, {
    // Ensure we refetch when filters change
    refetchOnWindowFocus: false,
    retry: 1,
    onError: (err) => {
      console.error('Error fetching lesson plans:', err);
    }
  });

  // Get the user session
  const { data: sessionData } = api.user.getCurrent.useQuery();

  // Fetch teachers for filter
  const { data: teachersData } = api.teacher.getAllTeachers.useQuery({
    campusId: sessionData?.primaryCampusId || ''
  }, {
    enabled: !!sessionData?.primaryCampusId
  });

  // Fetch classes for filter
  const { data: classesData } = api.class.list.useQuery({
    status: 'ACTIVE'
  });

  // Handle view action
  const handleView = (id: string) => {
    router.push(`/admin/coordinator/lesson-plans/${id}`);
  };

  // Filter lesson plans based on active tab
  const getFilteredLessonPlans = () => {
    if (!data?.lessonPlans) {
      console.log('No lesson plans data available');
      return [];
    }

    console.log(`Total lesson plans: ${data.lessonPlans.length}`);

    // Log the statuses of all lesson plans
    const allStatusCounts = data.lessonPlans.reduce((acc, plan) => {
      acc[plan.status] = (acc[plan.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('All lesson plan status counts:', allStatusCounts);

    // Apply status filter based on active tab
    let filtered = [...data.lessonPlans];

    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(plan => plan.status === LessonPlanStatus.SUBMITTED);
        console.log(`Filtered pending lesson plans: ${filtered.length}`);
        break;
      case 'approved':
        filtered = filtered.filter(plan =>
          plan.status === LessonPlanStatus.COORDINATOR_APPROVED ||
          plan.status === LessonPlanStatus.APPROVED
        );
        console.log(`Filtered approved lesson plans: ${filtered.length}`);
        break;
      case 'rejected':
        filtered = filtered.filter(plan => plan.status === LessonPlanStatus.REJECTED);
        console.log(`Filtered rejected lesson plans: ${filtered.length}`);
        break;
      case 'all':
        // Show all lesson plans, no filtering by status
        console.log(`Showing all lesson plans: ${filtered.length}`);
        break;
      default:
        console.log(`Unknown tab: ${activeTab}, showing all lesson plans`);
    }

    // Sort by submission date (newest first) or updated date if no submission date
    filtered.sort((a, b) => {
      const dateA = a.submittedAt || a.updatedAt;
      const dateB = b.submittedAt || b.updatedAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // Log the first few filtered lesson plans
    if (filtered.length > 0) {
      console.log('First filtered lesson plan:');
      console.log(`ID: ${filtered[0].id}, Title: ${filtered[0].title}, Status: ${filtered[0].status}`);
    }

    return filtered;
  };

  const filteredLessonPlans = getFilteredLessonPlans();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lesson Plan Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve teacher lesson plans
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Teacher</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setTeacherFilter(null)}>
                  All Teachers
                </DropdownMenuItem>
                {teachersData?.map((teacher) => (
                  <DropdownMenuItem
                    key={teacher.id}
                    onClick={() => setTeacherFilter(teacher.id)}
                  >
                    {teacher.user.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Class</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setClassFilter(null)}>
                  All Classes
                </DropdownMenuItem>
                {classesData?.items?.map((classItem) => (
                  <DropdownMenuItem
                    key={classItem.id}
                    onClick={() => setClassFilter(classItem.id)}
                  >
                    {classItem.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Pending Review</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.SUBMITTED).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <span>Approved</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan =>
                  plan.status === LessonPlanStatus.COORDINATOR_APPROVED ||
                  plan.status === LessonPlanStatus.APPROVED
                ).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <span>Rejected</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.REJECTED).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <span>All Plans</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LessonPlanCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-red-500">⚠️</div>
              <h3 className="mt-4 text-lg font-semibold">Error loading lesson plans</h3>
              <p className="mt-2 text-muted-foreground">
                There was a problem loading your lesson plans. Please try again later.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          ) : filteredLessonPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessonPlans.map((plan) => (
                <CoordinatorLessonPlanCard
                  key={plan.id}
                  id={plan.id}
                  title={plan.title}
                  description={plan.description}
                  status={plan.status}
                  startDate={plan.startDate}
                  endDate={plan.endDate}
                  className={plan.class.name}
                  subjectName={plan.subject?.name}
                  teacherName={plan.teacher.user.name}
                  submittedAt={plan.submittedAt}
                  onView={handleView}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No lesson plans found</h3>
              <p className="mt-2 text-muted-foreground">
                {activeTab === 'pending'
                  ? "There are no lesson plans pending review."
                  : activeTab === 'approved'
                  ? "You haven't approved any lesson plans yet."
                  : activeTab === 'rejected'
                  ? "You haven't rejected any lesson plans yet."
                  : "No lesson plans found for your managed classes."}
              </p>
              {activeTab === 'all' && data?.lessonPlans && data.lessonPlans.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md max-w-md mx-auto">
                  <p className="text-sm text-amber-800">
                    Debug info: No lesson plans were found for your managed classes.
                    This could be because:
                  </p>
                  <ul className="text-sm text-amber-800 list-disc list-inside mt-2">
                    <li>You don't have any classes assigned to you</li>
                    <li>Your assigned classes don't have any lesson plans</li>
                    <li>There's an issue with your coordinator profile</li>
                  </ul>
                  <p className="text-sm text-amber-800 mt-2">
                    Please contact your administrator for assistance.
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
