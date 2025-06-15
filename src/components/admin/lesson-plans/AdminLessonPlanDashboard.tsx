'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { LessonPlanStatus } from '@/server/api/schemas/lesson-plan.schema';
import { UserType } from '@/server/api/types/user';
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

// Admin lesson plan card component
const AdminLessonPlanCard = ({
  id,
  title,
  description,
  status,
  startDate,
  endDate,
  className,
  subjectName,
  teacherName,
  coordinatorName,
  coordinatorApprovedAt,
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
  coordinatorName?: string | null;
  coordinatorApprovedAt?: Date | null;
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
          {coordinatorName && coordinatorApprovedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved by:</span>
              <span className="font-medium">
                {coordinatorName} ({format(new Date(coordinatorApprovedAt), 'MMM d')})
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
export default function AdminLessonPlanDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [teacherFilter, setTeacherFilter] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [coordinatorFilter, setCoordinatorFilter] = useState<string | null>(null);

  // Fetch lesson plans
  const { data, isLoading } = api.lessonPlan.getByStatus.useQuery({
    status: activeTab === 'pending' ? LessonPlanStatus.COORDINATOR_APPROVED : undefined,
    teacherId: teacherFilter || undefined,
    classId: classFilter || undefined,
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

  // Fetch coordinators for filter - using a more generic approach
  const { data: usersData } = api.user.getCurrent.useQuery();
  const coordinatorsData = usersData ?
    [usersData].filter(user => user.userType === UserType.CAMPUS_COORDINATOR) :
    [];

  // Handle view action
  const handleView = (id: string) => {
    router.push(`/admin/lesson-plans/${id}`);
  };

  // Filter lesson plans based on active tab
  const getFilteredLessonPlans = () => {
    if (!data?.lessonPlans) return [];

    let filtered = data.lessonPlans;

    // Apply coordinator filter if set
    if (coordinatorFilter) {
      filtered = filtered.filter(plan => plan.coordinatorId === coordinatorFilter);
    }

    switch (activeTab) {
      case 'pending':
        return filtered.filter(plan => plan.status === LessonPlanStatus.COORDINATOR_APPROVED);
      case 'approved':
        return filtered.filter(plan => plan.status === LessonPlanStatus.APPROVED);
      case 'rejected':
        return filtered.filter(plan => plan.status === LessonPlanStatus.REJECTED && plan.adminId);
      default:
        return filtered;
    }
  };

  const filteredLessonPlans = getFilteredLessonPlans();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lesson Plan Approval</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve coordinator-approved lesson plans
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
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Coordinator</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setCoordinatorFilter(null)}>
                  All Coordinators
                </DropdownMenuItem>
                {coordinatorsData?.length > 0 && coordinatorsData.map((coordinator) => (
                  <DropdownMenuItem
                    key={coordinator.id}
                    onClick={() => setCoordinatorFilter(coordinator.id)}
                  >
                    {coordinator.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Pending Approval</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.COORDINATOR_APPROVED).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <span>Approved</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.APPROVED).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <span>Rejected</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan =>
                  plan.status === LessonPlanStatus.REJECTED && plan.adminId
                ).length}
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
          ) : filteredLessonPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessonPlans.map((plan) => (
                <AdminLessonPlanCard
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
                  coordinatorName={plan.coordinator?.name}
                  coordinatorApprovedAt={plan.coordinatorApprovedAt}
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
                  ? "There are no lesson plans pending your approval."
                  : activeTab === 'approved'
                  ? "You haven't approved any lesson plans yet."
                  : "You haven't rejected any lesson plans yet."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
