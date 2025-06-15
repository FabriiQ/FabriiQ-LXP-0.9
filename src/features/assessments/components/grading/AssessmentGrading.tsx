'use client';

/**
 * Assessment Grading Component
 *
 * This component allows teachers to grade assessment submissions
 * using Bloom's Taxonomy and rubrics.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/core/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/feedback/alert';
import { Separator } from '@/components/ui/separator';
import { BloomsTaxonomyBadge } from '@/features/bloom/components/taxonomy/BloomsTaxonomyBadge';
import { RubricGrading, CognitiveGrading, GradingInterface } from '@/features/bloom/components/grading';
import { GradableContentType } from '@/features/bloom/types/grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { EnhancedGradingInterface } from './EnhancedGradingInterface';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { GradingType as APIGradingType, SubmissionStatus as APISubmissionStatus } from '@/server/api/constants'; // For backend enum types

interface AssessmentGradingProps {
  assessmentId: string;
  studentId: string;
  submissionId: string;
  onGraded?: () => void;
  className?: string;
}

/**
 * AssessmentGrading component
 */
export function AssessmentGrading({
  assessmentId,
  studentId,
  submissionId,
  onGraded,
  className = '',
}: AssessmentGradingProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('submission');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch assessment data
  const { data: assessment, isLoading: assessmentLoading } = api.assessment.getById.useQuery({
    assessmentId
  });

  // Fetch submission data
  const { data: submission, isLoading: submissionLoading } = api.assessment.getSubmission.useQuery({
    id: submissionId,
  });

  // Get rubric from assessment data (no separate API call needed)
  const rubric = assessment?.bloomsRubric;
  const rubricLoading = false; // Since rubric is included in assessment query

  // Fetch student data
  const { data: student, isLoading: studentLoading } = api.user.getById.useQuery(
    studentId
  );

  const utils = api.useContext(); // Get tRPC utils for invalidation

  // Use the correct mutation for grading: api.assessment.grade
  const gradeSubmissionMutation = api.assessment.grade.useMutation({
    onSuccess: () => {
      toast({
        title: 'Grading saved',
        description: 'The grading has been saved successfully',
      });
      // Invalidate queries to refetch submission & assessment data after grading
      utils.assessment.getSubmission.invalidate({ id: submissionId });
      utils.assessment.getById.invalidate({ assessmentId });
      if (assessment?.classId) { // Invalidate class analytics if classId is available
        utils.mastery.getClassAnalytics.invalidate({ classId: assessment.classId });
      }
      // Potentially invalidate student grades or broader teacher queries if needed
      // utils.teacher.getTeacherClasses.invalidate(); // Example if this data could change

      if (onGraded) {
        onGraded();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error Submitting Grading',
        description: error.message || 'An unexpected error occurred.',
        variant: 'error',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // This is the callback passed as onGradeSubmit to EnhancedGradingInterface
  const handleEnhancedGrading = (result: {
    score: number;
    feedback?: string; // Overall feedback
    criteriaGrades?: Array<{ // From structured Bloom's rubric
      criterionId: string;
      levelId: string;
      score: number;
      feedback?: string;
    }>;
    customRubricGrades?: Array<{ // From custom JSON rubric (mapped by EnhancedGradingInterface)
        criterionId: string;
        levelId?: string;
        points: number;
        feedback?: string;
        levelName?: string;
    }>;
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    if (!submission || !assessment) {
        console.error("Submission or assessment data is not available for grading.");
        toast({ title: "Error", description: "Cannot save grade, submission/assessment data missing.", variant: "error" });
        setIsSubmitting(false); // Ensure submitting state is reset
        return;
    }
    setIsSubmitting(true);

    let backendRubricResults: Array<{
      criteriaId: string;
      performanceLevelId: string; // Backend expects performanceLevelId
      score: number;
      feedback?: string;
    }> | undefined = undefined;

    // Use determinedGradingMethodUI which is now hoisted
    if (determinedGradingMethodUI === 'RUBRIC_BASED' && result.criteriaGrades) {
        backendRubricResults = result.criteriaGrades.map(cg => ({
           criteriaId: cg.criterionId,
           performanceLevelId: cg.levelId, // Ensure this maps to what backend expects
           score: cg.score,
           feedback: cg.feedback
        }));
    } else if (determinedGradingMethodUI === 'CUSTOM_JSON_RUBRIC' && result.customRubricGrades) {
        backendRubricResults = result.customRubricGrades.map(customGrade => ({
            criteriaId: customGrade.criterionId,
            performanceLevelId: customGrade.levelId || '', // Ensure a string, even if empty, if backend expects it
            score: customGrade.points,
            feedback: customGrade.feedback,
            // levelName is not part of backendRubricResults schema, so it's omitted here
        }));
    }

    // Determine the backend gradingType
    let backendGradingType: APIGradingType;
    if (determinedGradingMethodUI === 'RUBRIC_BASED' || determinedGradingMethodUI === 'CUSTOM_JSON_RUBRIC') {
        backendGradingType = APIGradingType.RUBRIC_BASED; // Both use RUBRIC_BASED for backend if they involve rubrics
    } else { // SCORE_BASED
        backendGradingType = APIGradingType.SCORE_BASED;
    }
    // Consider if assessment.gradingType (e.g. MANUAL) should override:
    if (assessment.gradingType === APIGradingType.MANUAL && determinedGradingMethodUI === 'SCORE_BASED') {
        backendGradingType = APIGradingType.MANUAL; // Or keep as SCORE_BASED if MANUAL maps to score input
    }


    gradeSubmissionMutation.mutate({
      submissionId: submission.id,
      gradingType: backendGradingType,
      score: result.score, // Overall score
      feedback: result.feedback, // Overall feedback text
      rubricResults: backendRubricResults,
      bloomsLevelScores: result.bloomsLevelScores,
      status: APISubmissionStatus.GRADED // Set status to GRADED
    });
  };

  // Handle cognitive grade change (This seems like an older/alternative grading path, may need review or removal)
  // If EnhancedGradingInterface handles cognitive grading and calls onGradeSubmit (handleEnhancedGrading), this might be redundant.
  // For now, assuming it might be used by a different UI path not shown.
  const handleCognitiveGradeChange = (cognitiveResult: {
    score: number;
    feedback?: string;
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    if (!submission) return;

    setIsSubmitting(true);

    submitGradesMutation.mutate({
      id: submission.id,
      data: {
        score: cognitiveResult.score,
        feedback: JSON.stringify({
          feedback: cognitiveResult.feedback,
          bloomsLevelScores: cognitiveResult.bloomsLevelScores,
        }),
        status: 'GRADED' as any,
        gradedById: undefined, // Will be set by the server
      }
    }, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  // Check if submission is already graded
  const isGraded = submission?.status === 'GRADED';

  // Render loading state
  if (assessmentLoading || submissionLoading || studentLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>
            Loading assessment data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state if assessment or submission not found
  if (!assessment || !submission) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Assessment or Submission Not Found</CardTitle>
          <CardDescription>
            The assessment or submission could not be found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-destructive/15 text-destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              The assessment or submission could not be found. Please check the assessment and student IDs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render the submission content
  const renderSubmission = () => {
    if (!submission.content) {
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
            <h2 className="text-xl font-semibold">
              {student?.name || 'Student'}'s Submission
            </h2>
            <p className="text-sm text-muted-foreground">
              Submitted on {new Date(submission.submittedAt || '').toLocaleDateString()} at {new Date(submission.submittedAt || '').toLocaleTimeString()}
            </p>
          </div>
          {assessment.bloomsDistribution && (
            <div className="flex space-x-2">
              {Object.entries(assessment.bloomsDistribution as Record<BloomsTaxonomyLevel, number>)
                .filter(([_, percentage]) => percentage > 0)
                .map(([level, _]) => (
                  <BloomsTaxonomyBadge key={level} level={level as BloomsTaxonomyLevel} />
                ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Submission Content</h3>

          {/* Display the submission content */}
          {/* This would need to be adapted based on your actual submission structure */}
          <div className="p-4 border rounded-md bg-muted whitespace-pre-wrap">
            {typeof submission.content === 'string'
              ? submission.content
              : JSON.stringify(submission.content, null, 2)}
          </div>

          {/* If there are attachments, display them */}
          {submission.attachments && (
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-medium">Attachments</h3>
              <div className="p-4 border rounded-md bg-muted">
                {typeof submission.attachments === 'string'
                  ? submission.attachments
                  : JSON.stringify(submission.attachments, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle enhanced grading interface
  const handleEnhancedGrading = (result: {
    score: number;
    feedback?: string;
    criteriaGrades?: Array<{
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
      id: submission.id,
      data: {
        score: result.score,
        feedback: JSON.stringify({
          feedback: result.feedback,
          bloomsLevelScores: result.bloomsLevelScores,
          criteriaResults: result.criteriaGrades?.map(grade => ({
            criterionId: grade.criterionId,
            score: grade.score,
            feedback: grade.feedback,
          })),
        }),
        status: 'GRADED' as any,
        gradedById: undefined, // Will be set by the server
      }
    }, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  // --- Refactoring: Hoisted determination logic for rubric/grading method ---
  let activeRubricDataUI: any | undefined = undefined;
  let determinedGradingMethodUI: 'SCORE_BASED' | 'RUBRIC_BASED' | 'CUSTOM_JSON_RUBRIC' = 'SCORE_BASED';

  if (assessment && !(assessmentLoading || submissionLoading || studentLoading)) { // Ensure data is loaded
     if (assessment.bloomsRubric) {
         activeRubricDataUI = {
             id: assessment.bloomsRubric.id,
             criteria: assessment.bloomsRubric.criteria,
             performanceLevels: assessment.bloomsRubric.performanceLevels,
         };
         determinedGradingMethodUI = 'RUBRIC_BASED';
         console.log('[AssessmentGrading] Using linked Blooms Rubric (UI determination).');
     } else if (assessment.rubric && typeof assessment.rubric === 'object' && (assessment.rubric as any).criteria) {
         activeRubricDataUI = assessment.rubric as any;
         determinedGradingMethodUI = 'CUSTOM_JSON_RUBRIC';
         console.log('[AssessmentGrading] Using custom JSON Rubric from assessment.rubric (UI determination).');
     } else if (assessment.gradingType === APIGradingType.SCORE_BASED || assessment.gradingType === APIGradingType.MANUAL || (!assessment.bloomsRubric && !assessment.rubric)) {
         determinedGradingMethodUI = 'SCORE_BASED';
         console.log('[AssessmentGrading] Using SCORE_BASED grading (UI determination).');
     } else {
         determinedGradingMethodUI = 'SCORE_BASED'; // Fallback safely
         console.warn('[AssessmentGrading] Assessment gradingType might be RUBRIC, but no rubric data found. Defaulting to SCORE_BASED (UI determination).');
     }
  }
  // --- End of Hoisted Logic ---


  // Render the enhanced grading interface
  const renderGradingInterface = () => {
    if (assessmentLoading || submissionLoading || studentLoading || !assessment || !submission) {
      // This check is defensive; main loading state handles this for the whole component.
      // However, if this function were called independently, it's good practice.
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-2 text-muted-foreground">Loading grading tools...</p>
        </div>
      );
    }

    // Debug logging (can be removed or made conditional for production)
    // Moved to be after data loading checks
    console.log('Assessment Grading Debug (Render):', {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      hasBloomsRubric: !!assessment.bloomsRubric,
      hasJsonRubric: !!assessment.rubric,
      determinedGradingMethodUI, // Use hoisted variable
      gradingTypeFromAssessmentDB: assessment.gradingType,
    });

    const bloomsDistribution = assessment.bloomsDistribution as Record<BloomsTaxonomyLevel, number> | undefined;

    let initialFeedbackString = '';
    let initialCriteriaGrades: any[] | undefined = undefined;
    let initialCustomRubricSelections: any | undefined = undefined; // For custom rubrics
    let initialBloomsLevelScores: Record<BloomsTaxonomyLevel, number> | undefined = undefined;

    if (submission.feedback && typeof submission.feedback === 'string') {
      try {
        const parsedDetails = JSON.parse(submission.feedback);
        initialFeedbackString = parsedDetails.overallFeedback || parsedDetails.feedback || '';
        // Check which type of rubric results are present
        if (parsedDetails.criteriaResults) { // This was the old common field
            if (determinedGradingMethodUI === 'RUBRIC_BASED') { // Assume it's for Blooms
                initialCriteriaGrades = parsedDetails.criteriaResults;
            } else if (determinedGradingMethodUI === 'CUSTOM_JSON_RUBRIC') {
                // Map criteriaResults back to customRubricSelections format if possible, or expect a different field
                // For now, if it's custom, we expect customRubricSelections to be stored differently or not at all directly in criteriaResults.
                // The `handleEnhancedGrading` now receives `customRubricGrades` (array) or `criteriaGrades` (array).
                // The stringified `feedback` field in the DB stores `gradingDetailsPayload` which has `overallFeedback` and `criteriaResults` (mapped from custom/structured).
                // So, when rehydrating, `parsedDetails.criteriaResults` *is* the `backendRubricResults`.
                // We need to map this back to `customRubricSelections` for the CustomJsonRubricGrading component.
                if (determinedGradingMethodUI === 'CUSTOM_JSON_RUBRIC' && parsedDetails.criteriaResults) {
                    initialCustomRubricSelections = parsedDetails.criteriaResults.reduce((acc: any, res: any) => {
                        acc[res.criteriaId] = { levelId: res.performanceLevelId, points: res.score, feedback: res.feedback, levelName: res.levelName /* if stored */ };
                        return acc;
                    }, {});
                } else { // blooms
                     initialCriteriaGrades = parsedDetails.criteriaResults;
                }
            }
        }
        initialBloomsLevelScores = parsedDetails.bloomsLevelScores;
      } catch (e) {
        console.warn("Failed to parse submission.feedback JSON for initial values, using as raw string.", e);
        initialFeedbackString = submission.feedback;
      }
    } else if (typeof submission.feedback === 'object' && submission.feedback !== null) {
        const feedbackObj = submission.feedback as any;
        initialFeedbackString = feedbackObj.overallFeedback || feedbackObj.feedback || '';
        if (determinedGradingMethodUI === 'CUSTOM_JSON_RUBRIC' && feedbackObj.criteriaResults) {
            initialCustomRubricSelections = feedbackObj.criteriaResults.reduce((acc: any, res: any) => {
                acc[res.criteriaId] = { levelId: res.performanceLevelId, points: res.score, feedback: res.feedback, levelName: res.levelName };
                return acc;
            }, {});
        } else {
            initialCriteriaGrades = feedbackObj.criteriaResults;
        }
        initialBloomsLevelScores = feedbackObj.bloomsLevelScores;
    }


    return (
      <EnhancedGradingInterface
        assessmentId={assessmentId}
        submissionId={submission.id}
        maxScore={assessment.maxScore || 100}
        gradingMethod={determinedGradingMethodUI} // Use hoisted variable
        rubric={activeRubricDataUI} // Use hoisted variable
        bloomsDistribution={bloomsDistribution}
        initialValues={{
          score: submission.score || 0,
          feedback: initialFeedbackString,
          criteriaGrades: initialCriteriaGrades,
          customRubricSelections: initialCustomRubricSelections,
          bloomsLevelScores: initialBloomsLevelScores,
        }}
        onGradeSubmit={handleEnhancedGrading}
        readOnly={isGraded}
        // showTopicMasteryImpact={true} // This prop seems to be from a different context, remove if not used by EGI directly
        topicMasteryData={[
          // Mock data - replace with real API call
          {
            topicId: '1',
            topicName: 'Sample Topic',
            currentMastery: 75,
            projectedMastery: 82,
            impact: 7,
          },
        ]}
      />
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>
          Grade: {assessment.title}
        </CardTitle>
        <CardDescription>
          Student: {student?.name || 'Unknown Student'}
        </CardDescription>
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
