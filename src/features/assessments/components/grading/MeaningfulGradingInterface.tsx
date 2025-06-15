'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, TrendingUp, Target, Brain, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

import { RubricGrading } from '@/features/bloom/components/grading/RubricGrading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { api } from '@/trpc/react';

interface LearningOutcome {
  id: string;
  statement: string;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  achievementThreshold?: number;
}

interface LearningOutcomeProgress {
  outcomeId: string;
  currentScore: number;
  maxScore: number;
  isAchieved: boolean;
  contributingCriteria: string[];
}

interface AssessmentAlignment {
  totalLearningOutcomes: number;
  achievedOutcomes: number;
  bloomsLevelCoverage: Record<BloomsTaxonomyLevel, boolean>;
  overallAlignment: number; // Percentage
}

interface MeaningfulGradingInterfaceProps {
  assessmentId: string;
  submissionId: string;
  studentId: string;
  classId: string;
  onGradingComplete?: (result: any) => void;
  className?: string;
}

export function MeaningfulGradingInterface({
  assessmentId,
  submissionId,
  studentId,
  classId,
  onGradingComplete,
  className = '',
}: MeaningfulGradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'grading' | 'outcomes' | 'alignment'>('grading');
  const [learningOutcomeProgress, setLearningOutcomeProgress] = useState<LearningOutcomeProgress[]>([]);
  const [assessmentAlignment, setAssessmentAlignment] = useState<AssessmentAlignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch assessment data with learning outcomes
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({
    id: assessmentId,
  });

  // Fetch learning outcomes for the assessment
  const { data: learningOutcomes = [], isLoading: isLoadingOutcomes } = api.learningOutcome.getByAssessment.useQuery({
    assessmentId,
  }, {
    enabled: !!assessmentId,
  });

  // Fetch existing submission data
  const { data: submission, isLoading: isLoadingSubmission } = api.assessment.getSubmission.useQuery({
    submissionId,
  }, {
    enabled: !!submissionId,
  });

  // Grade submission mutation
  const gradeSubmissionMutation = api.assessment.grade.useMutation({
    onSuccess: (result) => {
      setIsSubmitting(false);
      onGradingComplete?.(result);
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error('Grading failed:', error);
    },
  });

  // Calculate assessment alignment
  useEffect(() => {
    if (learningOutcomes.length > 0 && learningOutcomeProgress.length > 0) {
      const achievedOutcomes = learningOutcomeProgress.filter(p => p.isAchieved).length;
      
      // Check Bloom's level coverage
      const bloomsLevelCoverage = Object.values(BloomsTaxonomyLevel).reduce((acc, level) => {
        const hasOutcomeAtLevel = learningOutcomes.some(lo => lo.bloomsLevel === level);
        const isAchievedAtLevel = learningOutcomeProgress.some(p => {
          const outcome = learningOutcomes.find(lo => lo.id === p.outcomeId);
          return outcome?.bloomsLevel === level && p.isAchieved;
        });
        acc[level] = hasOutcomeAtLevel && isAchievedAtLevel;
        return acc;
      }, {} as Record<BloomsTaxonomyLevel, boolean>);

      const overallAlignment = learningOutcomes.length > 0 
        ? (achievedOutcomes / learningOutcomes.length) * 100 
        : 0;

      setAssessmentAlignment({
        totalLearningOutcomes: learningOutcomes.length,
        achievedOutcomes,
        bloomsLevelCoverage,
        overallAlignment,
      });
    }
  }, [learningOutcomes, learningOutcomeProgress]);

  // Handle rubric grading changes
  const handleRubricGradeChange = (gradingResult: any) => {
    if (gradingResult.learningOutcomeProgress) {
      setLearningOutcomeProgress(gradingResult.learningOutcomeProgress);
    }
  };

  // Handle final grade submission
  const handleSubmitGrades = async (gradingData: any) => {
    setIsSubmitting(true);
    
    try {
      await gradeSubmissionMutation.mutateAsync({
        submissionId,
        gradingType: 'RUBRIC',
        score: gradingData.score,
        feedback: gradingData.feedback,
        rubricResults: gradingData.criteriaGrades,
        bloomsLevelScores: gradingData.bloomsLevelScores,
        learningOutcomeProgress: learningOutcomeProgress,
        updateTopicMastery: true,
      });
    } catch (error) {
      console.error('Failed to submit grades:', error);
      setIsSubmitting(false);
    }
  };

  if (isLoadingAssessment || isLoadingOutcomes || isLoadingSubmission) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!assessment || !submission) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Assessment Not Found</AlertTitle>
        <AlertDescription>
          The assessment or submission could not be loaded.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{assessment.title}</span>
            {assessmentAlignment && (
              <Badge 
                variant={assessmentAlignment.overallAlignment >= 70 ? "default" : "secondary"}
                className={assessmentAlignment.overallAlignment >= 70 ? "bg-green-100 text-green-800" : ""}
              >
                {Math.round(assessmentAlignment.overallAlignment)}% Aligned
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Meaningful grading with learning outcome tracking and Bloom's taxonomy analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{learningOutcomes.length}</div>
              <div className="text-sm text-muted-foreground">Learning Outcomes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assessmentAlignment?.achievedOutcomes || 0}
              </div>
              <div className="text-sm text-muted-foreground">Achieved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {assessment.maxScore || 100}
              </div>
              <div className="text-sm text-muted-foreground">Max Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grading Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grading" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Rubric Grading
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Learning Outcomes
          </TabsTrigger>
          <TabsTrigger value="alignment" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Alignment Analysis
          </TabsTrigger>
        </TabsList>

        {/* Rubric Grading Tab */}
        <TabsContent value="grading" className="space-y-4">
          {assessment.rubric ? (
            <RubricGrading
              rubricId={assessment.rubric.id}
              rubricType={assessment.rubric.type}
              criteria={assessment.rubric.criteria}
              performanceLevels={assessment.rubric.performanceLevels}
              maxScore={assessment.maxScore || 100}
              learningOutcomes={learningOutcomes}
              showLearningOutcomes={true}
              onGradeChange={handleRubricGradeChange}
              initialValues={{
                score: submission.score || 0,
                criteriaGrades: submission.gradingDetails?.criteriaResults || [],
              }}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Rubric Available</AlertTitle>
              <AlertDescription>
                This assessment does not have a rubric configured for grading.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Learning Outcomes Tab */}
        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Learning Outcome Progress
              </CardTitle>
              <CardDescription>
                Track student progress towards achieving specific learning outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningOutcomes.map(outcome => {
                  const progress = learningOutcomeProgress.find(p => p.outcomeId === outcome.id);
                  const percentage = progress && progress.maxScore > 0 
                    ? (progress.currentScore / progress.maxScore) * 100 
                    : 0;
                  
                  return (
                    <div key={outcome.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {progress?.isAchieved ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            )}
                            <span className={cn(
                              "text-sm font-medium",
                              progress?.isAchieved ? "text-green-600" : "text-orange-600"
                            )}>
                              {progress?.isAchieved ? "Achieved" : "In Progress"}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{outcome.statement}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${BLOOMS_LEVEL_METADATA[outcome.bloomsLevel].color}20`,
                                borderColor: BLOOMS_LEVEL_METADATA[outcome.bloomsLevel].color,
                                color: BLOOMS_LEVEL_METADATA[outcome.bloomsLevel].color
                              }}
                            >
                              {BLOOMS_LEVEL_METADATA[outcome.bloomsLevel].name}
                            </Badge>
                            {outcome.actionVerbs.map(verb => (
                              <Badge key={verb} variant="secondary" className="text-xs">
                                {verb}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-medium">
                            {progress?.currentScore || 0}/{progress?.maxScore || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round(percentage)}%
                          </div>
                        </div>
                      </div>
                      
                      <Progress
                        value={percentage}
                        className="h-2"
                        indicatorClassName={progress?.isAchieved ? "bg-green-500" : "bg-orange-500"}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alignment Analysis Tab */}
        <TabsContent value="alignment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Assessment Alignment Analysis
              </CardTitle>
              <CardDescription>
                Analyze how well the grading aligns with learning outcomes and Bloom's taxonomy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentAlignment ? (
                <div className="space-y-6">
                  {/* Overall Alignment */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Alignment</span>
                      <span className="text-sm text-muted-foreground">
                        {assessmentAlignment.achievedOutcomes}/{assessmentAlignment.totalLearningOutcomes} outcomes achieved
                      </span>
                    </div>
                    <Progress value={assessmentAlignment.overallAlignment} className="h-3" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(assessmentAlignment.overallAlignment)}% alignment
                    </div>
                  </div>

                  {/* Bloom's Level Coverage */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Bloom's Taxonomy Coverage</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(assessmentAlignment.bloomsLevelCoverage).map(([level, isAchieved]) => {
                        const metadata = BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel];
                        return (
                          <div
                            key={level}
                            className={cn(
                              "p-3 rounded-lg border",
                              isAchieved ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: metadata.color }}
                              />
                              <span className="text-sm font-medium">{metadata.name}</span>
                              {isAchieved ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {assessmentAlignment.overallAlignment < 70 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Consider providing additional support or feedback to help the student achieve more learning outcomes.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {Object.values(assessmentAlignment.bloomsLevelCoverage).filter(Boolean).length < 3 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            The student may benefit from activities targeting different cognitive levels in Bloom's taxonomy.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Complete the grading to see alignment analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => handleSubmitGrades({
            score: learningOutcomeProgress.reduce((sum, p) => sum + p.currentScore, 0),
            feedback: "Graded with learning outcome tracking",
            criteriaGrades: [], // This would come from the rubric grading
            bloomsLevelScores: {}, // This would come from the rubric grading
          })}
          disabled={isSubmitting || learningOutcomeProgress.length === 0}
          className="min-w-32"
        >
          {isSubmitting ? "Submitting..." : "Submit Grades"}
        </Button>
      </div>
    </div>
  );
}
