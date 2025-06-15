'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { LessonPlanStatus, LessonPlanType } from '@/server/api/schemas/lesson-plan.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, ClipboardList, FilePlus, Filter } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';

// Status badge component
const StatusBadge = ({ status }: { status: LessonPlanStatus }) => {
  const getStatusColor = () => {
    switch (status) {
      case LessonPlanStatus.DRAFT:
        return 'bg-gray-200 text-gray-800';
      case LessonPlanStatus.SUBMITTED:
        return 'bg-blue-200 text-blue-800';
      case LessonPlanStatus.COORDINATOR_APPROVED:
        return 'bg-purple-200 text-purple-800';
      case LessonPlanStatus.APPROVED:
        return 'bg-green-200 text-green-800';
      case LessonPlanStatus.REJECTED:
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case LessonPlanStatus.DRAFT:
        return 'Draft';
      case LessonPlanStatus.SUBMITTED:
        return 'Submitted';
      case LessonPlanStatus.COORDINATOR_APPROVED:
        return 'Coordinator Approved';
      case LessonPlanStatus.APPROVED:
        return 'Approved';
      case LessonPlanStatus.REJECTED:
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <Badge className={getStatusColor()}>
      {getStatusText()}
    </Badge>
  );
};

// Type for lesson plan card props
interface LessonPlanCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: LessonPlanStatus;
  startDate: Date;
  endDate: Date;
  planType: LessonPlanType;
  className: string;
  subjectName?: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSubmit?: (id: string) => void;
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
  className,
  subjectName,
  onView,
  onEdit,
  onSubmit
}: LessonPlanCardProps) => {
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
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onView(id)}>
          View
        </Button>
        <div className="space-x-2">
          {status === LessonPlanStatus.DRAFT && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
                Edit
              </Button>
              {onSubmit && (
                <Button variant="default" size="sm" onClick={() => onSubmit(id)}>
                  Submit
                </Button>
              )}
            </>
          )}
          {status === LessonPlanStatus.REJECTED && (
            <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
              Edit
            </Button>
          )}
        </div>
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
    <CardFooter className="pt-2 flex justify-between">
      <Skeleton className="h-9 w-16" />
      <div className="space-x-2">
        <Skeleton className="h-9 w-16 inline-block" />
        <Skeleton className="h-9 w-16 inline-block" />
      </div>
    </CardFooter>
  </Card>
);

// Main dashboard component
export default function LessonPlanDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<LessonPlanStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<LessonPlanType | null>(null);

  // Fetch lesson plans
  const { data, isLoading, refetch } = api.lessonPlan.getByTeacher.useQuery({
    status: statusFilter || undefined,
    planType: typeFilter || undefined,
  });

  // Submit mutation
  const submitMutation = api.lessonPlan.submit.useMutation({
    onSuccess: () => {
      toast({
        title: 'Lesson plan submitted',
        description: 'Your lesson plan has been submitted for review.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle actions
  const handleView = (id: string) => {
    router.push(`/teacher/lesson-plans/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/teacher/lesson-plans/${id}/edit`);
  };

  const handleSubmit = (id: string) => {
    submitMutation.mutate({ id });
  };

  const handleCreate = () => {
    router.push('/teacher/lesson-plans/new');
  };

  // Filter lesson plans based on active tab
  const getFilteredLessonPlans = () => {
    if (!data?.lessonPlans) return [];
    
    switch (activeTab) {
      case 'draft':
        return data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.DRAFT);
      case 'submitted':
        return data.lessonPlans.filter(plan => 
          plan.status === LessonPlanStatus.SUBMITTED || 
          plan.status === LessonPlanStatus.COORDINATOR_APPROVED
        );
      case 'approved':
        return data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.APPROVED);
      case 'rejected':
        return data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.REJECTED);
      default:
        return data.lessonPlans;
    }
  };

  const filteredLessonPlans = getFilteredLessonPlans();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lesson Plans</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your weekly and monthly lesson plans
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter(LessonPlanStatus.DRAFT)}>
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter(LessonPlanStatus.SUBMITTED)}>
                  Submitted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter(LessonPlanStatus.COORDINATOR_APPROVED)}>
                  Coordinator Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter(LessonPlanStatus.APPROVED)}>
                  Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter(LessonPlanStatus.REJECTED)}>
                  Rejected
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter(LessonPlanType.WEEKLY)}>
                  Weekly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter(LessonPlanType.MONTHLY)}>
                  Monthly
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            <span>Create New</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>All</span>
            {data?.totalCount && <Badge variant="outline">{data.totalCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            <span>Draft</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.DRAFT).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="flex items-center gap-2">
            <span>In Review</span>
            {data?.lessonPlans && (
              <Badge variant="outline">
                {data.lessonPlans.filter(plan => 
                  plan.status === LessonPlanStatus.SUBMITTED || 
                  plan.status === LessonPlanStatus.COORDINATOR_APPROVED
                ).length}
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
                {data.lessonPlans.filter(plan => plan.status === LessonPlanStatus.REJECTED).length}
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
                <LessonPlanCard
                  key={plan.id}
                  id={plan.id}
                  title={plan.title}
                  description={plan.description}
                  status={plan.status}
                  startDate={plan.startDate}
                  endDate={plan.endDate}
                  planType={plan.planType}
                  className={plan.class.name}
                  subjectName={plan.subject?.name}
                  onView={handleView}
                  onEdit={handleEdit}
                  onSubmit={handleSubmit}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No lesson plans found</h3>
              <p className="mt-2 text-muted-foreground">
                {activeTab === 'all'
                  ? "You haven't created any lesson plans yet."
                  : `You don't have any ${activeTab} lesson plans.`}
              </p>
              <Button onClick={handleCreate} className="mt-4">
                Create your first lesson plan
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
