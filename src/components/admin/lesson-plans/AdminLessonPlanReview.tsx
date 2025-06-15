'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { LessonPlanStatus, LessonPlanType } from '@/server/api/schemas/lesson-plan.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/core/skeleton';
import { format } from 'date-fns';
// Import standard icons from lucide-react
import {
  CalendarIcon,
  Clock,
  FileText,
  Loader2,
  User
} from 'lucide-react';
import { LessonPlanRelatedActivitiesButton } from '@/components/lesson-plan/LessonPlanRelatedActivitiesButton';
import { LessonPlanRelatedAssessmentsButton } from '@/components/lesson-plan/LessonPlanRelatedAssessmentsButton';
import { LessonPlanCreateActivityButton } from '@/components/lesson-plan/LessonPlanCreateActivityButton';
import { LessonPlanCreateAssessmentButton } from '@/components/lesson-plan/LessonPlanCreateAssessmentButton';

// Custom icon components for missing icons
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const Send = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ThumbsUp = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

const ThumbsDown = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
  </svg>
);
import { useToast } from '@/components/ui/use-toast';
import { StatusBadge } from '@/components/teacher/lesson-plans/LessonPlanCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminLessonPlanReviewProps {
  id: string;
}

export default function AdminLessonPlanReview({ id }: AdminLessonPlanReviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch lesson plan
  const { data: lessonPlan, isLoading, refetch } = api.lessonPlan.getById.useQuery(id);

  // Approve mutation
  const approveMutation = api.lessonPlan.adminApprove.useMutation({
    onSuccess: () => {
      toast({
        title: 'Lesson plan approved',
        description: 'The lesson plan has been approved and is now ready for implementation.',
      });
      refetch();
    },
    onError: (error) => {
      setIsApproving(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Reject mutation
  const rejectMutation = api.lessonPlan.adminReject.useMutation({
    onSuccess: () => {
      toast({
        title: 'Lesson plan rejected',
        description: 'The lesson plan has been rejected and sent back to the teacher.',
      });
      setShowRejectDialog(false);
      refetch();
    },
    onError: (error) => {
      setIsRejecting(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Handle actions
  const handleApprove = () => {
    setIsApproving(true);
    approveMutation.mutate({
      id,
      note: note.trim() || undefined,
    });
  };

  const handleReject = () => {
    if (!rejectionNote.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'error',
      });
      return;
    }

    setIsRejecting(true);
    rejectMutation.mutate({
      id,
      note: rejectionNote,
    });
  };

  const handleBack = () => {
    router.push('/admin/lesson-plans');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="container mx-auto p-4 md:p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Lesson Plan Not Found</h1>
        <p className="mb-6">The requested lesson plan could not be found.</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lesson Plans
        </Button>
      </div>
    );
  }

  const content = lessonPlan.content as any;
  const canReview = lessonPlan.status === LessonPlanStatus.COORDINATOR_APPROVED;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{lessonPlan.title}</h1>
            <div className="flex items-center mt-1 text-muted-foreground">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>
                {format(new Date(lessonPlan.startDate), 'MMM d')} - {format(new Date(lessonPlan.endDate), 'MMM d, yyyy')}
              </span>
              <span className="mx-2">•</span>
              <StatusBadge status={lessonPlan.status as unknown as LessonPlanStatus} />
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {canReview && (
            <>
              <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Lesson Plan</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for rejection. This will be shared with the teacher.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Reason for rejection..."
                    className="min-h-[100px] mt-4"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                  />
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isRejecting || !rejectionNote.trim()}
                    >
                      {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Reject Lesson Plan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={handleApprove} disabled={isApproving} className="flex items-center gap-2">
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                Approve
              </Button>
            </>
          )}

          {lessonPlan.classId && (
            <>
              <LessonPlanRelatedActivitiesButton
                lessonPlanId={id}
                classId={lessonPlan.classId}
              />
              <LessonPlanRelatedAssessmentsButton
                lessonPlanId={id}
                classId={lessonPlan.classId}
              />
              {/* Only show create buttons for approved lesson plans */}
              {lessonPlan.status === LessonPlanStatus.APPROVED && (
                <>
                  <LessonPlanCreateActivityButton
                    lessonPlanId={id}
                    classId={lessonPlan.classId}
                  />
                  <LessonPlanCreateAssessmentButton
                    lessonPlanId={id}
                    classId={lessonPlan.classId}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Teacher</h3>
                  <p className="mt-1">{lessonPlan.teacher.user.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Class</h3>
                  <p className="mt-1">{lessonPlan.class.name}</p>
                </div>
                {lessonPlan.subject && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
                    <p className="mt-1">{lessonPlan.subject.name}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Plan Type</h3>
                  <p className="mt-1">{lessonPlan.planType === LessonPlanType.WEEKLY ? 'Weekly' : 'Monthly'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Period</h3>
                  <p className="mt-1">
                    {format(new Date(lessonPlan.startDate), 'MMM d, yyyy')} - {format(new Date(lessonPlan.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Submitted</h3>
                  <p className="mt-1">
                    {lessonPlan.submittedAt ? format(new Date(lessonPlan.submittedAt), 'MMM d, yyyy') : 'Not submitted'}
                  </p>
                </div>
              </div>
              {lessonPlan.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1">{lessonPlan.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="objectives" className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
              <TabsTrigger value="methods">Teaching Methods</TabsTrigger>
            </TabsList>
            <TabsContent value="objectives" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ul className="list-disc pl-5 space-y-2">
                    {content.learningObjectives?.map((objective: string, index: number) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="topics" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ul className="list-disc pl-5 space-y-2">
                    {content.topics?.map((topic: string, index: number) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="methods" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ul className="list-disc pl-5 space-y-2">
                    {content.teachingMethods?.map((method: string, index: number) => (
                      <li key={index}>{method}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {content.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{content.notes}</p>
              </CardContent>
            </Card>
          )}

          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Review Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add your notes about this lesson plan (optional)..."
                  className="min-h-[100px]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coordinator Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {lessonPlan.coordinator && lessonPlan.coordinatorApprovedAt ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{lessonPlan.coordinator.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Approved on {format(new Date(lessonPlan.coordinatorApprovedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {lessonPlan.coordinatorNote && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Coordinator Notes</h3>
                      <p className="mt-1 whitespace-pre-line">{lessonPlan.coordinatorNote}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No coordinator approval information available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teacher Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">{lessonPlan.teacher.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{lessonPlan.teacher.user.email}</p>
                </div>
              </div>
              {lessonPlan.teacher.specialization && (
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Specialization</h3>
                  <p className="mt-1">{lessonPlan.teacher.specialization}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Created</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(lessonPlan.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {lessonPlan.submittedAt && (
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      <Send className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Submitted</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(lessonPlan.submittedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {lessonPlan.coordinatorApprovedAt && (
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Coordinator Approved</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(lessonPlan.coordinatorApprovedAt), 'MMM d, yyyy')}
                      </p>
                      {lessonPlan.coordinator && (
                        <p className="text-sm text-muted-foreground">
                          By: {lessonPlan.coordinator.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {lessonPlan.adminApprovedAt && (
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Admin Approved</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(lessonPlan.adminApprovedAt), 'MMM d, yyyy')}
                      </p>
                      {lessonPlan.admin && (
                        <p className="text-sm text-muted-foreground">
                          By: {lessonPlan.admin.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(lessonPlan.coordinatorNote || lessonPlan.adminNote) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    {lessonPlan.coordinatorNote && (
                      <div>
                        <h3 className="text-sm font-medium">Coordinator Note</h3>
                        <p className="mt-1 text-sm">{lessonPlan.coordinatorNote}</p>
                      </div>
                    )}
                    {lessonPlan.adminNote && (
                      <div>
                        <h3 className="text-sm font-medium">Admin Note</h3>
                        <p className="mt-1 text-sm">{lessonPlan.adminNote}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 border-l border-muted">
                <div className="mb-6 relative">
                  <div className="absolute -left-[25px] p-1 rounded-full bg-background border border-muted">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-medium">Created</h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(lessonPlan.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>

                {lessonPlan.submittedAt && (
                  <div className="mb-6 relative">
                    <div className="absolute -left-[25px] p-1 rounded-full bg-background border border-muted">
                      <Send className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-medium">Submitted for Review</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lessonPlan.submittedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}

                {lessonPlan.coordinatorApprovedAt && (
                  <div className="mb-6 relative">
                    <div className="absolute -left-[25px] p-1 rounded-full bg-background border border-muted">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-medium">Coordinator Approved</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lessonPlan.coordinatorApprovedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}

                {lessonPlan.adminApprovedAt && (
                  <div className="mb-6 relative">
                    <div className="absolute -left-[25px] p-1 rounded-full bg-background border border-muted">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-medium">Admin Approved</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lessonPlan.adminApprovedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
