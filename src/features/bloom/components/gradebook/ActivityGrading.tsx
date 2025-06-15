'use client';

/**
 * Activity Grading Component with Bloom's Taxonomy Integration
 *
 * This component provides an interface for grading activities with
 * Bloom's Taxonomy integration, using either rubric-based or
 * cognitive level-based grading.
 */

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Alert, AlertDescription } from '@/components/ui/feedback/alert';
import { Button } from '@/components/ui/core/button';
import { RubricGrading, CognitiveGrading } from '@/features/bloom/components/grading';
import { GradableContentType } from '@/features/bloom/types/grading';
// import { SubmissionStatus } from '@/server/api/constants';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Define the props for the component
interface ActivityGradingProps {
  activityId: string;
  studentId: string;
  onGraded?: () => void;
}

/**
 * ActivityGrading Component
 */
export function ActivityGrading({
  activityId,
  studentId,
  onGraded
}: ActivityGradingProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch activity data
  const { data: activity, isLoading: activityLoading } = api.activity.getById.useQuery({
    id: activityId
  });

  // Fetch submission data
  const { data: submission, isLoading: submissionLoading } = api.activityGrade.get.useQuery({
    activityId,
    studentId
  });

  // Fetch rubric if available
  const { data: rubric, isLoading: rubricLoading } = api.rubric.getById.useQuery(
    { id: activity?.rubricId || '' },
    { enabled: !!activity?.rubricId }
  );

  // Submit grades mutation
  const submitGradesMutation = api.bloomGrading.submitGrades.useMutation({
    onSuccess: () => {
      toast({
        title: 'Grades submitted',
        description: 'The activity has been graded successfully.',
      });
      if (onGraded) onGraded();
    },
    onError: (error) => {
      toast({
        title: 'Error submitting grades',
        description: error.message,
        variant: 'error',
      });
    }
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
      submissionId: submission.id,
      contentType: GradableContentType.ACTIVITY,
      score: rubricResult.score,
      bloomsLevelScores: rubricResult.bloomsLevelScores,
      criteriaResults: rubricResult.criteriaGrades.map(grade => ({
        criterionId: grade.criterionId,
        score: grade.score,
        feedback: grade.feedback
      }))
    }, {
      onSettled: () => setIsSubmitting(false)
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
      submissionId: submission.id,
      contentType: GradableContentType.ACTIVITY,
      score: cognitiveResult.score,
      feedback: cognitiveResult.feedback,
      bloomsLevelScores: cognitiveResult.bloomsLevelScores
    }, {
      onSettled: () => setIsSubmitting(false)
    });
  };

  // Handle loading state
  const isLoading = activityLoading || submissionLoading || (activity?.rubricId && rubricLoading);
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-64" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Handle missing data
  if (!activity) {
    return (
      <Alert>
        <AlertDescription>
          Activity not found.
        </AlertDescription>
      </Alert>
    );
  }

  if (!submission) {
    return (
      <Alert>
        <AlertDescription>
          No submission found for this activity.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if already graded
  const isGraded = submission.status === "GRADED";

  // Use rubric grading if a rubric is available
  if (activity.rubricId && rubric) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Submission</CardTitle>
            <CardDescription>
              {activity.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display submission content here */}
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-64">
              {JSON.stringify(submission.content, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <RubricGrading
          rubricId={rubric.id}
          rubricType={rubric.type as any}
          criteria={rubric.criteria as any}
          performanceLevels={rubric.performanceLevels as any}
          maxScore={activity.maxScore || 100}
          initialValues={{
            criteriaGrades: (submission.attachments as any)?.gradingDetails?.criteriaResults,
            score: submission.score || 0
          }}
          onGradeChange={handleRubricGradeChange}
          readOnly={isGraded}
          showBloomsLevels={true}
        />

        {isSubmitting && (
          <div className="flex justify-center">
            <Button disabled>
              <Skeleton className="h-4 w-24" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Use cognitive grading if no rubric is available
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity Submission</CardTitle>
          <CardDescription>
            {activity.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Display submission content here */}
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-64">
            {JSON.stringify(submission.content, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <CognitiveGrading
        bloomsLevels={activity.bloomsLevel ? [activity.bloomsLevel as BloomsTaxonomyLevel] : [BloomsTaxonomyLevel.UNDERSTAND]}
        maxScorePerLevel={{
          [BloomsTaxonomyLevel.REMEMBER]: activity.maxScore || 100,
          [BloomsTaxonomyLevel.UNDERSTAND]: activity.maxScore || 100,
          [BloomsTaxonomyLevel.APPLY]: activity.maxScore || 100,
          [BloomsTaxonomyLevel.ANALYZE]: activity.maxScore || 100,
          [BloomsTaxonomyLevel.EVALUATE]: activity.maxScore || 100,
          [BloomsTaxonomyLevel.CREATE]: activity.maxScore || 100
        }}
        initialValues={{
          bloomsLevelScores: (submission.attachments as any)?.gradingDetails?.bloomsLevelScores,
          score: submission.score || 0,
          feedback: submission.feedback || ''
        }}
        onGradeChange={handleCognitiveGradeChange}
        readOnly={isGraded}
        showAnalysis={true}
      />

      {isSubmitting && (
        <div className="flex justify-center">
          <Button disabled>
            <Skeleton className="h-4 w-24" />
          </Button>
        </div>
      )}
    </div>
  );
}
