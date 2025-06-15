'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { AssessmentCard } from './AssessmentCard';
import { DateRangeSelector } from './DateRangeSelector';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import {
  Search,
  Plus,
  Filter,
  ClipboardList,
  BarChart,
  AlertCircle
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
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/feedback/alert';
import { EnhancedAssessmentDialog } from '@/features/assessments/components/creation/EnhancedAssessmentDialog';

interface AssessmentGridProps {
  classId: string;
  className?: string;
}

/**
 * AssessmentGrid component for displaying and filtering assessments
 *
 * Features:
 * - Responsive grid layout
 * - Search and filter functionality
 * - Date range filtering
 * - Assessment type filtering
 * - Status tabs (All, Upcoming, Completed, Grading)
 */
export function AssessmentGrid({ classId, className }: AssessmentGridProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { data: session, status: sessionStatus } = useSession();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [assessmentType, setAssessmentType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [enhancedDialogOpen, setEnhancedDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assessmentToEdit, setAssessmentToEdit] = useState<string | null>(null);

  // Fetch assessments for this class
  const { data: assessments, isLoading, error, refetch } = api.teacher.getClassAssessments.useQuery(
    { classId },
    {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: 1000,
      enabled: sessionStatus === 'authenticated' && !!session?.user?.id,
      onSuccess: (data) => {
        console.log('Successfully fetched assessments:', {
          count: data?.length || 0,
          classId
        });
      },
      onError: (err) => {
        console.error('Error fetching assessments:', err);
        if (err.data?.code === 'UNAUTHORIZED') {
          setAuthError('Authentication error. Please try refreshing the page or logging in again.');
        } else {
          setAuthError(`Error loading assessments: ${err.message}`);
        }
      }
    }
  );

  // Delete assessment mutation
  const deleteAssessment = api.teacher.deleteAssessment.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    },
  });

  // Handle assessment deletion
  const handleDeleteAssessment = (id: string) => {
    setAssessmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAssessment = () => {
    if (assessmentToDelete) {
      deleteAssessment.mutate({ assessmentId: assessmentToDelete });
    }
  };

  // Filter assessments based on all filters
  const filteredAssessments = assessments
    ? assessments.filter(assessment => {
        // Filter by search query
        const matchesSearch =
          assessment.title.toLowerCase().includes(searchQuery.toLowerCase());

        // Filter by status tab
        const matchesStatus = (() => {
          if (activeTab === 'all') return true;
          if (activeTab === 'upcoming') return assessment.status === 'published';
          return assessment.status === activeTab;
        })();

        // Filter by assessment type
        const matchesType =
          assessmentType === 'all' ||
          assessment.assessmentType.toLowerCase() === assessmentType.toLowerCase();

        // Filter by date range
        const matchesDateRange = !dateRange || !dateRange.from || !assessment.dueDate
          ? true
          : (() => {
              const assessmentDate = new Date(assessment.dueDate);
              const from = new Date(dateRange.from);
              from.setHours(0, 0, 0, 0);

              if (!dateRange.to) {
                return assessmentDate >= from;
              }

              const to = new Date(dateRange.to);
              to.setHours(23, 59, 59, 999);

              return assessmentDate >= from && assessmentDate <= to;
            })();

        return matchesSearch && matchesStatus && matchesType && matchesDateRange;
      })
    : [];

  // Get unique assessment types
  const assessmentTypes = assessments
    ? ['all', ...new Set(assessments.map(assessment => assessment.assessmentType))]
    : ['all'];

  // Handle view assessment
  const handleViewAssessment = (id: string) => {
    router.push(`/teacher/classes/${classId}/assessments/${id}`);
  };

  // Handle edit assessment
  const handleEditAssessment = (id: string) => {
    setAssessmentToEdit(id);
    setEditDialogOpen(true);
  };

  // Handle duplicate assessment
  const handleDuplicateAssessment = (id: string) => {
    router.push(`/teacher/classes/${classId}/assessments/${id}/duplicate`);
  };

  // Handle grade assessment
  const handleGradeAssessment = (id: string) => {
    router.push(`/teacher/classes/${classId}/assessments/${id}/grade`);
  };



  const handleEnhancedAssessmentCreated = (assessmentId: string) => {
    setEnhancedDialogOpen(false);
    refetch(); // Refresh the assessments list
    // Stay on the assessments page to show the new assessment
  };

  const handleAssessmentEdited = (assessmentId: string) => {
    setEditDialogOpen(false);
    setAssessmentToEdit(null);
    refetch(); // Refresh the assessments list
  };



  return (
    <div className={cn("space-y-4", className)}>
      {/* Authentication error alert */}
      {authError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {authError}
          </AlertDescription>
        </Alert>
      )}

      {/* Session status alert */}
      {sessionStatus === 'loading' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Loading session</AlertTitle>
          <AlertDescription>
            Please wait while we verify your session...
          </AlertDescription>
        </Alert>
      )}

      {/* Search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assessments..."
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
            variant="outline"
            className="hidden sm:flex"
            onClick={() => setEnhancedDialogOpen(true)}
            disabled={sessionStatus !== 'authenticated'}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Enhanced Creator
          </Button>

          <Button
            className="flex-1 sm:flex-none"
            onClick={() => router.push(`/teacher/classes/${classId}/assessments/new`)}
            disabled={sessionStatus !== 'authenticated'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter assessments by type and date
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assessment Type</label>
              <Select
                value={assessmentType}
                onValueChange={setAssessmentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTypes.map(type => (
                    <SelectItem key={type} value={type}>
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setAssessmentType('all');
                setDateRange(undefined);
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
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Assessment count */}
      <div className="text-sm text-muted-foreground">
        {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'}
      </div>

      {/* Assessments grid */}
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
      ) : filteredAssessments.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
        )}>
          {filteredAssessments.map(assessment => {
            // Transform assessment to match AssessmentCard props
            const transformedAssessment = {
              id: assessment.id,
              title: assessment.title,
              description: '', // Empty string since description doesn't exist
              assessmentType: assessment.assessmentType || 'ASSIGNMENT',
              subject: assessment.subjectName || '', // Use the subjectName property
              topic: assessment.topicId ? 'Topic' : '',
              createdAt: assessment.createdAt?.toString() || '',
              dueDate: assessment.dueDate?.toString() || '',
              status: (assessment.status || 'draft') as 'draft' | 'published' | 'completed' | 'grading',
              completionRate: assessment.completionRate || 0,
              averageScore: assessment.averageScore || 0,
              maxScore: assessment.maxScore || 0,
              passingScore: assessment.passingScore || 0
            };

            return (
              <AssessmentCard
                key={assessment.id}
                assessment={transformedAssessment}
                onView={handleViewAssessment}
                onEdit={handleEditAssessment}
                onDuplicate={handleDuplicateAssessment}
                onDelete={handleDeleteAssessment}
                onGrade={handleGradeAssessment}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No assessments found</h3>
            <p className="text-muted-foreground mb-2">
              {searchQuery || showFilters || activeTab !== 'all' || assessmentType !== 'all' || dateRange
                ? 'Try adjusting your filters or search query'
                : 'This class doesn\'t have any assessments yet'}
            </p>
            {error && (
              <p className="text-destructive text-sm mb-4">
                Error: {error.message}
              </p>
            )}
            <div className="mb-6">
              <p className="text-muted-foreground text-sm">
                Class ID: {classId}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setEnhancedDialogOpen(true)}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Enhanced Creator
              </Button>
              <Button onClick={() => router.push(`/teacher/classes/${classId}/assessments/new`)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics summary - temporarily disabled until data format is fixed */}
      {false && filteredAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Analytics</CardTitle>
            <CardDescription>
              Performance overview for all assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p>Analytics are being updated. Check back soon!</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/teacher/classes/${classId}/reports`)}
            >
              <BarChart className="mr-2 h-4 w-4" />
              View Detailed Reports
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
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
              onClick={confirmDeleteAssessment}
              disabled={deleteAssessment.isLoading}
            >
              {deleteAssessment.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Assessment Dialog */}
      <EnhancedAssessmentDialog
        open={enhancedDialogOpen}
        onOpenChange={setEnhancedDialogOpen}
        onSuccess={handleEnhancedAssessmentCreated}
        classId={classId}
      />

      {/* Edit Assessment Dialog */}
      {assessmentToEdit && (
        <EnhancedAssessmentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleAssessmentEdited}
          classId={classId}
          assessmentId={assessmentToEdit}
        />
      )}
    </div>
  );
}
