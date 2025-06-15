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
// Define custom icon components
import { Calendar } from 'lucide-react';
import { LessonPlanRelatedActivitiesButton } from '@/components/lesson-plan/LessonPlanRelatedActivitiesButton';
import { LessonPlanRelatedAssessmentsButton } from '@/components/lesson-plan/LessonPlanRelatedAssessmentsButton';
import { LessonPlanCreateActivityButton } from '@/components/lesson-plan/LessonPlanCreateActivityButton';
import { LessonPlanCreateAssessmentButton } from '@/components/lesson-plan/LessonPlanCreateAssessmentButton';

// Custom icon components
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

const CalendarIcon = Calendar;

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

const Clock = (props: React.SVGProps<SVGSVGElement>) => (
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const Edit = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const FileText = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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
import { useToast } from '@/components/ui/use-toast';
import { StatusBadge } from './LessonPlanCard';

interface LessonPlanViewProps {
  id: string;
}

export default function LessonPlanView({ id }: LessonPlanViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingReflection, setIsAddingReflection] = useState(false);

  // Fetch lesson plan
  const { data: lessonPlan, isLoading, refetch } = api.lessonPlan.getById.useQuery(id);

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
        variant: 'error',
      });
    },
  });

  // Add reflection mutation
  const addReflectionMutation = api.lessonPlan.addReflection.useMutation({
    onSuccess: () => {
      toast({
        title: 'Reflection added',
        description: 'Your reflection has been added to the lesson plan.',
      });
      setIsAddingReflection(false);
      setReflection('');
      refetch();
    },
    onError: (error) => {
      setIsAddingReflection(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Handle actions
  const handleEdit = () => {
    router.push(`/teacher/lesson-plans/${id}/edit`);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitMutation.mutate({ id });
  };

  const handleAddReflection = () => {
    if (!reflection.trim()) {
      toast({
        title: 'Error',
        description: 'Reflection cannot be empty',
        variant: 'error',
      });
      return;
    }

    setIsAddingReflection(true);
    addReflectionMutation.mutate({
      id,
      reflection,
    });
  };

  const handleBack = () => {
    router.push('/teacher/lesson-plans');
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
  const canEdit = lessonPlan.status === LessonPlanStatus.DRAFT || lessonPlan.status === LessonPlanStatus.REJECTED;
  const canSubmit = lessonPlan.status === LessonPlanStatus.DRAFT;
  const canAddReflection = lessonPlan.status === LessonPlanStatus.APPROVED && !lessonPlan.reflection;

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
          {canEdit && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit for Review
            </Button>
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

          {(lessonPlan.reflection || canAddReflection) && (
            <Card>
              <CardHeader>
                <CardTitle>Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                {lessonPlan.reflection ? (
                  <p className="whitespace-pre-line">{lessonPlan.reflection}</p>
                ) : canAddReflection ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Add your reflection on how this lesson plan worked in practice.
                    </p>
                    <Textarea
                      placeholder="Enter your reflection here..."
                      className="min-h-[150px]"
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddReflection}
                        disabled={isAddingReflection || !reflection.trim()}
                      >
                        {isAddingReflection && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Add Reflection
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
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
