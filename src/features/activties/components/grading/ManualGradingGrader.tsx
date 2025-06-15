'use client';

/**
 * Manual Grading Grader Component
 *
 * This component allows teachers to grade manual grading activities
 * using Bloom's Taxonomy and rubrics.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User, Check, X, Clock } from 'lucide-react';
import { RubricGrading, CognitiveGrading, GradingInterface } from '@/features/bloom/components/grading';
import { GradableContentType } from '@/features/bloom/types/grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { SubmissionStatus } from '@/server/api/constants';
import { ManualGradingActivity, ManualGradingSubmission } from '../../models/manual-grading';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';

interface ManualGradingGraderProps {
  activity: ManualGradingActivity;
  studentId: string;
  submissionId: string;
  onGraded?: () => void;
  className?: string;
}

/**
 * ManualGradingGrader component
 */
export function ManualGradingGrader({
  activity,
  studentId,
  submissionId,
  onGraded,
  className = '',
}: ManualGradingGraderProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('submission');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch submission data
  const { data: submission, isLoading: submissionLoading } = api.activityGrade.get.useQuery({
    activityId: activity.id,
    studentId,
  });

  // Fetch rubric if available
  const { data: rubric, isLoading: rubricLoading } = api.rubric.getById.useQuery(
    { id: activity.rubricId || '' },
    { enabled: !!activity.rubricId }
  );

  // Fetch student data
  const { data: student, isLoading: studentLoading } = api.user.getById.useQuery(
    studentId
  );

  // Submit grades mutation
  const submitGradesMutation = api.activityGrade.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Grades submitted',
        description: 'The grades have been submitted successfully',
      });

      if (onGraded) {
        onGraded();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error submitting grades',
        description: error.message || 'There was an error submitting the grades',
        variant: 'error',
      });
    },
  });

  // Handle rubric grade change
  const handleRubricGradeChange = (rubricResult: {
    score: number;
    criteriaGrades: Array<{
      criterionId: string;
      levelId: string;
      score: number;
      feedback?: string;
    }>;
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    if (!submission) return;

    setIsSubmitting(true);

    submitGradesMutation.mutate({
      activityId: activity.id,
      studentId: studentId,
      score: rubricResult.score,
      feedback: 'Graded using rubric',
      attachments: {
        gradingDetails: {
          bloomsLevelScores: rubricResult.bloomsLevelScores,
          criteriaResults: rubricResult.criteriaGrades.map(grade => ({
            criterionId: grade.criterionId,
            score: grade.score,
            feedback: grade.feedback,
          }))
        }
      },
      status: SubmissionStatus.GRADED
    }, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  // Handle cognitive grade change
  const handleCognitiveGradeChange = (cognitiveResult: {
    score: number;
    feedback?: string;
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    if (!submission) return;

    setIsSubmitting(true);

    submitGradesMutation.mutate({
      activityId: activity.id,
      studentId: studentId,
      score: cognitiveResult.score,
      feedback: cognitiveResult.feedback,
      attachments: {
        gradingDetails: {
          bloomsLevelScores: cognitiveResult.bloomsLevelScores
        }
      },
      status: SubmissionStatus.GRADED
    }, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  // Check if submission is already graded
  const isGraded = submission?.status === 'GRADED';

  // Render loading state
  if (submissionLoading || studentLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>
            Loading submission data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state if submission not found
  if (!submission) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Submission Not Found</CardTitle>
          <CardDescription>
            The submission could not be found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-destructive/15 text-destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              The submission for this activity could not be found. Please check the activity and student IDs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render the submission content
  const renderSubmission = () => {
    const attachments = submission.attachments as any;

    if (!attachments || attachments.length === 0) {
      return (
        <Alert>
          <AlertTitle>No Submission Content</AlertTitle>
          <AlertDescription>
            The student has not provided any content for this submission.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              {student?.name || 'Student'}'s Submission
            </h2>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Submitted on {new Date(submission.submittedAt || '').toLocaleDateString()} at {new Date(submission.submittedAt || '').toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="capitalize">{activity.bloomsLevel.toLowerCase()}</Badge>
            {submission.score !== null && (
              <Badge variant={submission.score >= (activity.maxScore || 100) * 0.6 ? "success" : "destructive"}>
                {submission.score}/{activity.maxScore || 100}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {attachments.map((attachment, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-medium">
              {attachment.name} ({attachment.type})
            </h3>

            {attachment.type === 'text' && (
              <div className="p-4 border rounded-md bg-muted whitespace-pre-wrap">
                {attachment.content}
              </div>
            )}

            {attachment.type === 'link' && (
              <div className="p-4 border rounded-md bg-muted">
                <a
                  href={attachment.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {attachment.content}
                </a>
              </div>
            )}

            {attachment.type === 'file' && (
              <div className="p-4 border rounded-md bg-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{attachment.name}</p>
                    <p className="text-sm text-muted-foreground">Size: {Math.round((attachment.size || 0) / 1024)} KB</p>
                  </div>
                  {/* In a real implementation, you would provide a download link */}
                  <Button variant="outline" size="sm" className="ml-4">
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render the grading interface based on the available options
  const renderGradingInterface = () => {
    // If the activity has a rubric, use rubric grading
    if (rubric && !rubricLoading) {
      return (
        <RubricGrading
          rubricId={rubric.id}
          rubricType={rubric.type as any}
          criteria={rubric.criteria as any}
          performanceLevels={rubric.performanceLevels as any}
          maxScore={activity.maxScore || 100}
          initialValues={{
            criteriaGrades: (submission.attachments as any)?.gradingDetails?.criteriaResults,
            score: submission.score || 0,
          }}
          onGradeChange={handleRubricGradeChange}
          readOnly={isGraded}
          showBloomsLevels={true}
        />
      );
    }

    // Otherwise, use cognitive grading based on the activity's Bloom's level
    return (
      <CognitiveGrading
        bloomsLevels={activity.bloomsLevel ? [activity.bloomsLevel] : [BloomsTaxonomyLevel.UNDERSTAND]}
        maxScorePerLevel={{
          [BloomsTaxonomyLevel.REMEMBER]: 100,
          [BloomsTaxonomyLevel.UNDERSTAND]: 100,
          [BloomsTaxonomyLevel.APPLY]: 100,
          [BloomsTaxonomyLevel.ANALYZE]: 100,
          [BloomsTaxonomyLevel.EVALUATE]: 100,
          [BloomsTaxonomyLevel.CREATE]: 100
        }}
        initialValues={{
          bloomsLevelScores: (submission.attachments as any)?.gradingDetails?.bloomsLevelScores,
          score: submission.score || 0,
          feedback: submission.feedback || '',
        }}
        onGradeChange={handleCognitiveGradeChange}
        readOnly={isGraded}
        showAnalysis={true}
      />
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold">
              Grade: {activity.title}
            </CardTitle>
            <CardDescription className="mt-1">
              Student: {student?.name || 'Unknown Student'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {submission.status || 'SUBMITTED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submission">Submission</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
          </TabsList>

          <TabsContent value="submission" className="pt-4">
            {renderSubmission()}
          </TabsContent>

          <TabsContent value="grading" className="pt-4">
            {renderGradingInterface()}

            {isSubmitting && (
              <div className="flex justify-center mt-4">
                <Button disabled className="w-32">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
