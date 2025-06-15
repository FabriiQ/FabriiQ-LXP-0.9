'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { LessonPlanStatus, LessonPlanType } from '@/server/api/schemas/lesson-plan.schema';
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/atoms/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { CalendarIcon, ClipboardList, FilePlus, Filter, Pencil, Eye } from 'lucide-react';
import { format } from 'date-fns';

// Status badge component
const StatusBadge = ({ status }: { status: LessonPlanStatus }) => {
  const statusConfig = {
    [LessonPlanStatus.DRAFT]: {
      label: 'Draft',
      variant: 'outline' as const,
    },
    [LessonPlanStatus.SUBMITTED]: {
      label: 'Submitted',
      variant: 'secondary' as const,
    },
    [LessonPlanStatus.COORDINATOR_APPROVED]: {
      label: 'Coordinator Approved',
      variant: 'secondary' as const,
    },
    [LessonPlanStatus.APPROVED]: {
      label: 'Approved',
      variant: 'success' as const,
    },
    [LessonPlanStatus.REJECTED]: {
      label: 'Rejected',
      variant: 'destructive' as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

// Lesson plan card props
interface LessonPlanCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: LessonPlanStatus;
  startDate: Date;
  endDate: Date;
  planType: LessonPlanType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

// Lesson plan card component
const LessonPlanCard = ({
  id,
  title,
  description,
  status,
  startDate,
  endDate,
  planType,
  onView,
  onEdit,
}: LessonPlanCardProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
          {description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">{planType === LessonPlanType.WEEKLY ? 'Weekly' : 'Monthly'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period:</span>
            <span className="font-medium">
              {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 p-4 flex gap-2">
        <Button variant="outline" className="flex-1 h-9" onClick={() => onView(id)}>
          <Eye className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">View</span>
        </Button>
        {status === LessonPlanStatus.DRAFT && (
          <Button variant="default" className="flex-1 h-9" onClick={() => onEdit(id)}>
            <Pencil className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Edit</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Skeleton loader for lesson plan card
const LessonPlanCardSkeleton = () => (
  <Card className="h-full flex flex-col">
    <CardHeader className="pb-2 p-4">
      <div className="flex justify-between items-start gap-2">
        <Skeleton className="h-5 sm:h-6 w-3/4" />
        <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
      </div>
      <Skeleton className="h-3 sm:h-4 w-full mt-2" />
      <Skeleton className="h-3 sm:h-4 w-2/3 mt-1" />
    </CardHeader>
    <CardContent className="flex-grow p-4 pt-0">
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
          <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
          <Skeleton className="h-3 sm:h-4 w-28 sm:w-32" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="pt-0 p-4">
      <Skeleton className="h-9 w-full" />
    </CardFooter>
  </Card>
);

// Props for the dashboard component
interface ClassLessonPlanDashboardProps {
  classId: string;
  teacherId: string;
}

// Main dashboard component
export function ClassLessonPlanDashboard({ classId, teacherId }: ClassLessonPlanDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch lesson plans for this class
  const { data: lessonPlanData, isLoading } = api.lessonPlan.getByClassAndTeacher.useQuery({
    classId,
    teacherId,
  }, {
    refetchOnWindowFocus: false,
  });

  // Extract lesson plans from the response
  const lessonPlans = lessonPlanData?.lessonPlans || [];

  // Filter lesson plans based on active tab
  const filteredLessonPlans = lessonPlans.filter(plan => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return plan.status === LessonPlanStatus.DRAFT;
    if (activeTab === 'submitted') return plan.status === LessonPlanStatus.SUBMITTED;
    if (activeTab === 'approved') return plan.status === LessonPlanStatus.APPROVED || plan.status === LessonPlanStatus.COORDINATOR_APPROVED;
    return true;
  });

  // Handle view lesson plan
  const handleView = (id: string) => {
    router.push(`/teacher/classes/${classId}/lesson-plans/${id}`);
  };

  // Handle edit lesson plan
  const handleEdit = (id: string) => {
    router.push(`/teacher/classes/${classId}/lesson-plans/${id}/edit`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <LessonPlanCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredLessonPlans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredLessonPlans.map((plan) => (
                <LessonPlanCard
                  key={plan.id}
                  id={plan.id}
                  title={plan.title}
                  description={plan.description}
                  status={plan.status}
                  startDate={plan.startDate}
                  endDate={plan.endDate}
                  planType={plan.planType}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No lesson plans found</h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'all'
                  ? "You haven't created any lesson plans for this class yet"
                  : `No ${activeTab} lesson plans found`}
              </p>
              <Button
                onClick={() => router.push(`/teacher/classes/${classId}/lesson-plans/new`)}
                className="w-full sm:w-auto"
              >
                <FilePlus className="mr-2 h-4 w-4" />
                Create Lesson Plan
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
