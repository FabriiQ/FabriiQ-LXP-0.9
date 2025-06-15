'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { LessonPlanStatus, LessonPlanType } from '@/server/api/schemas/lesson-plan.schema';
import { BloomsTaxonomyLevel, BloomsDistribution } from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA, BLOOMS_LEVEL_ACTION_VERBS } from '@/features/bloom/constants/bloom-levels';
import { BloomsDistributionChart } from '@/features/bloom/components/taxonomy/BloomsDistributionChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface CoordinatorLessonPlanReviewProps {
  id: string;
}

export default function CoordinatorLessonPlanReview({ id }: CoordinatorLessonPlanReviewProps) {
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
  const approveMutation = api.lessonPlan.coordinatorApprove.useMutation({
    onSuccess: () => {
      toast({
        title: 'Lesson plan approved',
        description: 'The lesson plan has been approved and sent to admin for final approval.',
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
  const rejectMutation = api.lessonPlan.coordinatorReject.useMutation({
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
    router.back();
  };

  // Helper function to get color for Bloom's level
  const getBloomsLevelColor = (level: BloomsTaxonomyLevel) => {
    return BLOOMS_LEVEL_METADATA[level]?.color || '#888888';
  };

  // Helper function to analyze cognitive balance
  const getCognitiveBalanceDescription = (distribution: BloomsDistribution) => {
    // Find the highest percentage level
    let highestLevel = BloomsTaxonomyLevel.REMEMBER;
    let highestPercentage = 0;

    // Find the second highest percentage level
    let secondHighestLevel = BloomsTaxonomyLevel.REMEMBER;
    let secondHighestPercentage = 0;

    // Calculate total percentage
    let totalPercentage = 0;

    // Check if lower-order thinking or higher-order thinking is dominant
    let lowerOrderPercentage = 0; // Remember, Understand, Apply
    let higherOrderPercentage = 0; // Analyze, Evaluate, Create

    Object.entries(distribution).forEach(([level, percentage]) => {
      const bloomsLevel = level as BloomsTaxonomyLevel;
      const percentageValue = percentage ? Number(percentage) : 0;
      totalPercentage += percentageValue;

      // Update highest and second highest
      if (percentageValue > highestPercentage) {
        secondHighestLevel = highestLevel;
        secondHighestPercentage = highestPercentage;
        highestLevel = bloomsLevel;
        highestPercentage = percentageValue;
      } else if (percentageValue > secondHighestPercentage) {
        secondHighestLevel = bloomsLevel;
        secondHighestPercentage = percentageValue;
      }

      // Update lower/higher order percentages
      if (
        bloomsLevel === BloomsTaxonomyLevel.REMEMBER ||
        bloomsLevel === BloomsTaxonomyLevel.UNDERSTAND ||
        bloomsLevel === BloomsTaxonomyLevel.APPLY
      ) {
        lowerOrderPercentage += percentageValue;
      } else {
        higherOrderPercentage += percentageValue;
      }
    });

    // Generate description
    const highestLevelName = BLOOMS_LEVEL_METADATA[highestLevel]?.name;
    const secondHighestLevelName = BLOOMS_LEVEL_METADATA[secondHighestLevel]?.name;

    let description = '';

    if (totalPercentage === 0) {
      return 'no specific cognitive levels';
    }

    if (highestPercentage >= 50) {
      description = `primarily ${highestLevelName} skills (${highestPercentage}%)`;
    } else if (highestPercentage >= 30) {
      description = `${highestLevelName} skills (${highestPercentage}%) with significant ${secondHighestLevelName} components (${secondHighestPercentage}%)`;
    } else {
      if (lowerOrderPercentage > higherOrderPercentage + 20) {
        description = 'predominantly lower-order thinking skills (Remember, Understand, Apply)';
      } else if (higherOrderPercentage > lowerOrderPercentage + 20) {
        description = 'predominantly higher-order thinking skills (Analyze, Evaluate, Create)';
      } else {
        description = 'a balanced mix of lower and higher-order thinking skills';
      }
    }

    return description;
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
  const canReview = lessonPlan.status === LessonPlanStatus.SUBMITTED;

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
        {canReview && (
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M17 14V2"></path>
                    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                  </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M7 10v12"></path>
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                </svg>
              )}
              Approve
            </Button>
          </div>
        )}
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
            <TabsList className="flex flex-wrap mb-4">
              <TabsTrigger value="objectives" className="flex-grow basis-1/2 sm:basis-1/3 md:basis-1/6">Learning Objectives</TabsTrigger>
              <TabsTrigger value="topics" className="flex-grow basis-1/2 sm:basis-1/3 md:basis-1/6">Topics</TabsTrigger>
              <TabsTrigger value="methods" className="flex-grow basis-1/2 sm:basis-1/3 md:basis-1/6">Teaching Methods</TabsTrigger>
              <TabsTrigger value="activities" className="flex-grow basis-1/2 sm:basis-1/3 md:basis-1/6">Activities</TabsTrigger>
              <TabsTrigger value="assessments" className="flex-grow basis-1/2 sm:basis-1/3 md:basis-1/6">Assessments</TabsTrigger>
              <TabsTrigger value="blooms" className="flex-grow basis-1/2 sm:basis-1/3 md:basis-1/6">Bloom's Taxonomy</TabsTrigger>
            </TabsList>
            <TabsContent value="objectives" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ul className="list-disc pl-5 space-y-2">
                    {content.learningObjectives?.map((objective: string, index: number) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                  {content.learningOutcomes && content.learningOutcomes.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Learning Outcomes</h3>
                      <div className="space-y-3">
                        {content.learningOutcomes.map((outcome: any, index: number) => (
                          <div key={index} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <p className="font-medium">{outcome.statement}</p>
                              {outcome.bloomsLevel && (
                                <div className="px-2 py-1 text-xs rounded-full"
                                  style={{
                                    backgroundColor: getBloomsLevelColor(outcome.bloomsLevel as BloomsTaxonomyLevel),
                                    color: '#fff'
                                  }}>
                                  {outcome.bloomsLevel}
                                </div>
                              )}
                            </div>
                            {outcome.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{outcome.description}</p>
                            )}
                            {outcome.topic && (
                              <p className="mt-1 text-xs text-muted-foreground">Topic: {outcome.topic.title}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : content.learningOutcomeIds && content.learningOutcomeIds.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Learning Outcomes</h3>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          {content.learningOutcomeIds.length} learning outcomes selected
                        </p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="topics" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {content.topics && content.topics.length > 0 ? (
                    <div className="space-y-4">
                      {content.topics.map((topic: string, index: number) => {
                        // Check if the topic is an ID (long string of alphanumeric characters)
                        const isTopicId = topic.length > 20 && /^[a-z0-9]+$/.test(topic);

                        // If it's a topic ID, try to find the topic name in the fetched learning outcomes
                        if (isTopicId && content.learningOutcomes) {
                          const matchingOutcome = content.learningOutcomes.find(
                            (outcome: any) => outcome.topic && outcome.topic.id === topic
                          );

                          if (matchingOutcome && matchingOutcome.topic) {
                            return (
                              <div key={index} className="border rounded-md p-4">
                                <h3 className="font-medium">{matchingOutcome.topic.title}</h3>
                                {matchingOutcome.topic.code && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Code: {matchingOutcome.topic.code}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        }

                        // If not an ID or no matching topic found, display as is
                        return (
                          <div key={index} className="border rounded-md p-4">
                            <h3 className="font-medium">{topic}</h3>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No topics defined for this lesson plan.</p>
                  )}
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
            <TabsContent value="activities" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {content.activities && content.activities.length > 0 ? (
                    <div className="space-y-4">
                      {content.activities.map((activity: any, index: number) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{activity.name}</h3>
                              {activity.type && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Type: {activity.type}
                                </p>
                              )}
                            </div>
                            {activity.bloomsLevel && (
                              <div className="px-2 py-1 text-xs rounded-full"
                                style={{
                                  backgroundColor: getBloomsLevelColor(activity.bloomsLevel),
                                  color: '#fff'
                                }}>
                                {activity.bloomsLevel}
                              </div>
                            )}
                          </div>
                          {activity.description && (
                            <p className="mt-2 text-sm">{activity.description}</p>
                          )}
                          {activity.date && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Date: {activity.date}
                            </p>
                          )}
                          {activity.learningObjectives && activity.learningObjectives.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium">Learning Objectives:</h4>
                              <ul className="list-disc pl-5 mt-1 text-sm">
                                {activity.learningObjectives.map((obj: string, i: number) => (
                                  <li key={i}>{obj}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No activities defined for this lesson plan.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="assessments" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {content.assessments && content.assessments.length > 0 ? (
                    <div className="space-y-4">
                      {content.assessments.map((assessment: any, index: number) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{assessment.name}</h3>
                              {assessment.type && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Type: {assessment.type}
                                </p>
                              )}
                            </div>
                            {assessment.bloomsLevel && (
                              <div className="px-2 py-1 text-xs rounded-full"
                                style={{
                                  backgroundColor: getBloomsLevelColor(assessment.bloomsLevel),
                                  color: '#fff'
                                }}>
                                {assessment.bloomsLevel}
                              </div>
                            )}
                          </div>
                          {assessment.description && (
                            <p className="mt-2 text-sm">{assessment.description}</p>
                          )}
                          {assessment.date && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Date: {assessment.date}
                            </p>
                          )}
                          {assessment.learningObjectives && assessment.learningObjectives.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium">Learning Objectives:</h4>
                              <ul className="list-disc pl-5 mt-1 text-sm">
                                {assessment.learningObjectives.map((obj: string, i: number) => (
                                  <li key={i}>{obj}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No assessments defined for this lesson plan.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="blooms" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cognitive Balance Analysis</CardTitle>
                  <CardDescription>Distribution of cognitive levels based on Bloom's Taxonomy</CardDescription>
                </CardHeader>
                <CardContent>
                  {lessonPlan.bloomsDistribution || content.bloomsDistribution ? (
                    <div className="space-y-6">
                      <div className="h-64">
                        <BloomsDistributionChart
                          distribution={lessonPlan.bloomsDistribution as any || content.bloomsDistribution}
                          showLabels={true}
                          showPercentages={true}
                          variant="horizontal-bar"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(BLOOMS_LEVEL_METADATA).map(([level, metadata]) => {
                          const bloomsLevel = level as BloomsTaxonomyLevel;
                          const distribution = lessonPlan.bloomsDistribution as any || content.bloomsDistribution;
                          const percentage = distribution[bloomsLevel] || 0;

                          return (
                            <div key={level} className="border rounded-md p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium">{metadata.name}</h3>
                                <div
                                  className="px-2 py-1 text-xs rounded-full text-white"
                                  style={{ backgroundColor: metadata.color }}
                                >
                                  {percentage}%
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{metadata.description}</p>
                              <div className="mt-2">
                                <h4 className="text-xs font-medium mb-1">Example Verbs:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {BLOOMS_LEVEL_ACTION_VERBS[level as BloomsTaxonomyLevel].slice(0, 5).map((verb, i) => (
                                    <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">{verb}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-muted p-4 rounded-md">
                        <h3 className="font-medium mb-2">Cognitive Balance Analysis</h3>
                        <p className="text-sm">
                          This lesson plan focuses on {getCognitiveBalanceDescription(lessonPlan.bloomsDistribution as any || content.bloomsDistribution)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No Bloom's Taxonomy distribution defined for this lesson plan.</p>
                  )}
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
