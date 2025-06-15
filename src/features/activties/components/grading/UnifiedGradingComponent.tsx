'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Check, X, Clock } from 'lucide-react';
import { RubricGrading, CognitiveGrading } from '@/features/bloom/components/grading';
import { GradableContentType } from '@/features/bloom/types/grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { SubmissionStatus } from '@/server/api/constants';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';
import { ScoreGradingForm } from './ScoreGradingForm';

interface UnifiedGradingComponentProps {
  activity: any;
  studentId: string;
  submissionId?: string;
  onGraded?: () => void;
  className?: string;
}

/**
 * UnifiedGradingComponent
 * 
 * A component that handles both auto and manual grading with support for
 * both score-based and rubric-based grading methods.
 */
export function UnifiedGradingComponent({
  activity,
  studentId,
  submissionId,
  onGraded,
  className = '',
}: UnifiedGradingComponentProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('submission');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingMethod, setGradingMethod] = useState<'score' | 'rubric'>(
    activity.settings?.gradingType === 'rubric' ? 'rubric' : 'score'
  );

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

  // Mutation for submitting grades
  const submitGradesMutation = api.activityGrade.grade.useMutation({
    onSuccess: () => {
      toast({
        title: 'Grades submitted',
        description: 'The activity has been graded successfully.',
        variant: 'success',
      });
      
      if (onGraded) {
        onGraded();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error submitting grades',
        description: error.message || 'An error occurred while submitting grades.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Check if the submission is already graded
  const isGraded = submission?.status === SubmissionStatus.GRADED;

  // Handle score-based grading
  const handleScoreGrading = (data: { score: number, feedback?: string }) => {
    if (!submission) return;

    setIsSubmitting(true);

    submitGradesMutation.mutate({
      activityId: activity.id,
      studentId: studentId,
      score: data.score,
      feedback: data.feedback,
      attachments: {
        gradingDetails: {
          bloomsLevelScores: activity.bloomsLevel ? {
            [activity.bloomsLevel]: data.score
          } : undefined
        }
      },
      status: SubmissionStatus.GRADED
    }, {
      onSettled: () => setIsSubmitting(false),
    });
  };

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

  // Determine if auto-grading is available
  const canAutoGrade = activity.settings?.gradingMethod === 'auto';

  // Handle auto-grading
  const handleAutoGrade = () => {
    if (!submission) return;

    setIsSubmitting(true);

    // Call the auto-grading API
    api.activityGrade.autoGrade.mutate({
      activityId: activity.id,
      studentId: studentId,
    }, {
      onSuccess: () => {
        toast({
          title: 'Auto-graded',
          description: 'The activity has been auto-graded successfully.',
          variant: 'success',
        });
        
        if (onGraded) {
          onGraded();
        }
      },
      onError: (error) => {
        toast({
          title: 'Error auto-grading',
          description: error.message || 'An error occurred while auto-grading.',
          variant: 'destructive',
        });
      },
      onSettled: () => setIsSubmitting(false),
    });
  };

  if (submissionLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No submission found</AlertTitle>
        <AlertDescription>
          The student has not submitted this activity yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Tabs defaultValue="submission" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submission">Submission</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
        </TabsList>
        
        <TabsContent value="submission" className="space-y-4">
          {/* Submission content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Submission</CardTitle>
              <CardDescription>
                Submitted on {new Date(submission.updatedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Display submission content based on type */}
              {submission.attachments?.text && (
                <div className="prose dark:prose-invert max-w-none">
                  <h3>Text Submission</h3>
                  <div className="p-4 border rounded-md bg-muted/50">
                    {submission.attachments.text}
                  </div>
                </div>
              )}
              
              {submission.attachments?.files && submission.attachments.files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">File Submissions</h3>
                  <ul className="space-y-2">
                    {submission.attachments.files.map((file: any, index: number) => (
                      <li key={index} className="flex items-center p-2 border rounded-md">
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {submission.attachments?.links && submission.attachments.links.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Link Submissions</h3>
                  <ul className="space-y-2">
                    {submission.attachments.links.map((link: string, index: number) => (
                      <li key={index} className="flex items-center p-2 border rounded-md">
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grading" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Grading</CardTitle>
                <Badge variant={isGraded ? "success" : "outline"}>
                  {isGraded ? "Graded" : "Not Graded"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-grading button for activities that support it */}
              {canAutoGrade && !isGraded && (
                <div className="mb-4">
                  <Button 
                    onClick={handleAutoGrade} 
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Auto-grading...
                      </>
                    ) : (
                      <>Auto-grade Submission</>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Manual grading options */}
              {(activity.settings?.gradingMethod === 'manual' || !canAutoGrade) && (
                <>
                  {/* Grading method selector */}
                  <div className="flex items-center space-x-4">
                    <Label>Grading Method:</Label>
                    <RadioGroup
                      value={gradingMethod}
                      onValueChange={(value) => setGradingMethod(value as 'score' | 'rubric')}
                      className="flex space-x-4"
                      disabled={isGraded}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="score" id="score" />
                        <Label htmlFor="score">Score-based</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rubric" id="rubric" />
                        <Label htmlFor="rubric">Rubric-based</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Render appropriate grading component based on selection */}
                  {gradingMethod === 'score' ? (
                    <ScoreGradingForm
                      initialScore={submission.score}
                      initialFeedback={submission.feedback}
                      maxScore={activity.maxScore || 100}
                      onSubmit={handleScoreGrading}
                      readOnly={isGraded}
                    />
                  ) : (
                    activity.rubricId && !rubricLoading ? (
                      <RubricGrading
                        rubricId={activity.rubricId}
                        rubricType={rubric?.type as any}
                        criteria={rubric?.criteria as any}
                        performanceLevels={rubric?.performanceLevels as any}
                        maxScore={activity.maxScore || 100}
                        initialValues={{
                          criteriaGrades: (submission.attachments as any)?.gradingDetails?.criteriaResults,
                          score: submission.score || 0,
                        }}
                        onGradeChange={handleRubricGradeChange}
                        readOnly={isGraded}
                        showBloomsLevels={true}
                      />
                    ) : (
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
                    )
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
