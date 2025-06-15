'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Brain,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  Calculator
} from 'lucide-react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { RubricGrading } from '@/features/bloom/components/grading/RubricGrading';
import { CognitiveGrading } from '@/features/bloom/components/grading/CognitiveGrading';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  maxScore: number;
  performanceLevels: PerformanceLevel[];
}

interface PerformanceLevel {
  id: string;
  name: string;
  description: string;
  score: number;
  minScore: number;
  maxScore: number;
}

interface CriteriaGrade {
  criterionId: string;
  levelId: string;
  score: number;
  feedback?: string;
}

interface TopicMasteryImpact {
  topicId: string;
  topicName: string;
  currentMastery: number;
  projectedMastery: number;
  impact: number;
}

interface EnhancedGradingInterfaceProps {
  assessmentId: string;
  submissionId: string;
  maxScore: number;
  gradingMethod: 'SCORE_BASED' | 'RUBRIC_BASED';
  rubric?: {
    id: string;
    criteria: RubricCriterion[];
    performanceLevels: PerformanceLevel[];
  };
  bloomsDistribution?: Record<BloomsTaxonomyLevel, number>;
  initialValues?: {
    score?: number;
    feedback?: string;
    criteriaGrades?: CriteriaGrade[];
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  };
  onGradeSubmit: (result: {
    score: number;
    feedback?: string;
    criteriaGrades?: CriteriaGrade[];
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => void;
  readOnly?: boolean;
  showTopicMasteryImpact?: boolean;
  topicMasteryData?: TopicMasteryImpact[];
  className?: string;
}

export function EnhancedGradingInterface({
  assessmentId,
  submissionId,
  maxScore,
  gradingMethod,
  rubric,
  bloomsDistribution,
  initialValues,
  onGradeSubmit,
  readOnly = false,
  showTopicMasteryImpact = true,
  topicMasteryData = [],
  className = '',
}: EnhancedGradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'grading' | 'analysis' | 'mastery'>('grading');
  const [score, setScore] = useState<number>(initialValues?.score || 0);
  const [feedback, setFeedback] = useState<string>(initialValues?.feedback || '');
  const [criteriaGrades, setCriteriaGrades] = useState<CriteriaGrade[]>(
    initialValues?.criteriaGrades || []
  );
  const [bloomsLevelScores, setBloomsLevelScores] = useState<Record<BloomsTaxonomyLevel, number>>(
    initialValues?.bloomsLevelScores || {} as Record<BloomsTaxonomyLevel, number>
  );

  // Handle score-based grading
  const handleScoreBasedGrading = () => {
    onGradeSubmit({
      score,
      feedback,
      bloomsLevelScores: calculateBloomsScoresFromTotal(score),
    });
  };

  // Calculate Bloom's level scores from total score based on distribution
  const calculateBloomsScoresFromTotal = (totalScore: number): Record<BloomsTaxonomyLevel, number> => {
    if (!bloomsDistribution) return {} as Record<BloomsTaxonomyLevel, number>;

    const scores: Record<BloomsTaxonomyLevel, number> = {} as any;
    const percentage = totalScore / maxScore;

    Object.entries(bloomsDistribution).forEach(([level, distribution]) => {
      const levelMaxScore = (maxScore * distribution) / 100;
      scores[level as BloomsTaxonomyLevel] = Math.round(levelMaxScore * percentage);
    });

    return scores;
  };

  // Handle rubric grading - prevent infinite loops by not calling onGradeSubmit immediately
  const handleRubricGrading = useCallback((result: {
    score: number;
    criteriaGrades: CriteriaGrade[];
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    setCriteriaGrades(result.criteriaGrades);
    setScore(result.score);
    if (result.bloomsLevelScores) {
      setBloomsLevelScores(result.bloomsLevelScores);
    }
    // Don't call onGradeSubmit here to prevent infinite loops
    // The parent will handle the submission when needed
  }, []);

  // Handle cognitive grading
  const handleCognitiveGrading = (result: {
    score: number;
    feedback?: string;
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    setScore(result.score);
    setFeedback(result.feedback || '');
    if (result.bloomsLevelScores) {
      setBloomsLevelScores(result.bloomsLevelScores);
    }

    onGradeSubmit({
      score: result.score,
      feedback: result.feedback,
      bloomsLevelScores: result.bloomsLevelScores,
    });
  };

  // Get Bloom's level analysis data
  const getBloomsAnalysis = () => {
    if (!bloomsDistribution) return [];

    return Object.entries(bloomsDistribution).map(([level, distribution]) => {
      const levelScore = bloomsLevelScores[level as BloomsTaxonomyLevel] || 0;
      const levelMaxScore = (maxScore * distribution) / 100;
      const percentage = levelMaxScore > 0 ? (levelScore / levelMaxScore) * 100 : 0;

      return {
        level: level as BloomsTaxonomyLevel,
        score: levelScore,
        maxScore: levelMaxScore,
        percentage,
      };
    }).filter(item => item.maxScore > 0);
  };

  const bloomsAnalysis = getBloomsAnalysis();

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grading">
            <CheckCircle className="h-4 w-4 mr-2" />
            Grading
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Brain className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          {showTopicMasteryImpact && (
            <TabsTrigger value="mastery">
              <Target className="h-4 w-4 mr-2" />
              Topic Mastery
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="grading" className="space-y-4">
          {gradingMethod === 'SCORE_BASED' ? (
            // Score-based grading interface
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Score-Based Grading
                </CardTitle>
                <CardDescription>
                  Enter the total score and feedback for this submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Score</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={score}
                        onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={maxScore}
                        disabled={readOnly}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">/ {maxScore}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Percentage: {maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : 0}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grade</label>
                    <div className="flex items-center h-10">
                      <Badge
                        variant={
                          score >= maxScore * 0.9 ? "default" :
                          score >= maxScore * 0.8 ? "secondary" :
                          score >= maxScore * 0.7 ? "outline" :
                          "destructive"
                        }
                        className="text-lg px-3 py-1"
                      >
                        {score >= maxScore * 0.9 ? 'A' :
                         score >= maxScore * 0.8 ? 'B' :
                         score >= maxScore * 0.7 ? 'C' :
                         score >= maxScore * 0.6 ? 'D' : 'F'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Feedback</label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student..."
                    disabled={readOnly}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Bloom's Level Breakdown for Score-Based */}
                {bloomsDistribution && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Cognitive Level Breakdown</h4>
                    <div className="space-y-2">
                      {bloomsAnalysis.map((item) => {
                        const metadata = BLOOMS_LEVEL_METADATA[item.level];
                        return (
                          <div key={item.level} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: metadata.color }}
                                />
                                <span>{metadata.name}</span>
                              </div>
                              <span>{item.score.toFixed(1)}/{item.maxScore.toFixed(1)}</span>
                            </div>
                            <Progress value={item.percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!readOnly && (
                  <div className="flex justify-end">
                    <Button onClick={handleScoreBasedGrading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Grade
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : rubric ? (
            // Rubric-based grading interface
            <div className="space-y-4">
              <RubricGrading
                rubricId={rubric.id}
                rubricType="ASSESSMENT" as any
                criteria={rubric.criteria as any}
                performanceLevels={rubric.performanceLevels as any}
                maxScore={maxScore}
                initialValues={{
                  criteriaGrades,
                  score,
                }}
                onGradeChange={handleRubricGrading}
                readOnly={readOnly}
                showBloomsLevels={true}
              />
              {!readOnly && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      console.log('Save Rubric Grade clicked!');
                      console.log('Current state:', {
                        score,
                        feedback,
                        criteriaGrades,
                        bloomsLevelScores,
                      });

                      const gradeData = {
                        score,
                        feedback,
                        criteriaGrades,
                        bloomsLevelScores,
                      };

                      console.log('Calling onGradeSubmit with:', gradeData);
                      onGradeSubmit(gradeData);
                    }}
                    disabled={criteriaGrades.length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Rubric Grade
                  </Button>
                </div>
              )}
            </div>
          ) : bloomsDistribution ? (
            // Cognitive grading interface
            <CognitiveGrading
              bloomsLevels={Object.keys(bloomsDistribution) as BloomsTaxonomyLevel[]}
              maxScorePerLevel={Object.fromEntries(
                Object.entries(bloomsDistribution).map(([level, distribution]) => [
                  level,
                  (maxScore * distribution) / 100
                ])
              ) as Record<BloomsTaxonomyLevel, number>}
              initialValues={{
                bloomsLevelScores,
                score,
                feedback,
              }}
              onGradeChange={handleCognitiveGrading}
              readOnly={readOnly}
              showAnalysis={true}
            />
          ) : (
            // Fallback to simple score-based grading
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Grading Method Available</h3>
                  <p className="text-muted-foreground">
                    Please configure a grading method for this assessment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Cognitive Level Analysis
              </CardTitle>
              <CardDescription>
                Performance breakdown across Bloom's Taxonomy levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bloomsAnalysis.length > 0 ? (
                <div className="space-y-4">
                  {bloomsAnalysis.map((item) => {
                    const metadata = BLOOMS_LEVEL_METADATA[item.level];
                    return (
                      <div key={item.level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: metadata.color }}
                            />
                            <span className="font-medium">{metadata.name}</span>
                          </div>
                          <div className="text-sm">
                            {item.score.toFixed(1)}/{item.maxScore.toFixed(1)} ({item.percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <Progress
                          value={item.percentage}
                          className="h-2"
                          style={{
                            '--progress-background': metadata.color,
                          } as any}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
                  <p className="text-muted-foreground">
                    Cognitive level analysis will be available after grading.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showTopicMasteryImpact && (
          <TabsContent value="mastery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Topic Mastery Impact
                </CardTitle>
                <CardDescription>
                  How this grade affects student topic mastery levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topicMasteryData.length > 0 ? (
                  <div className="space-y-4">
                    {topicMasteryData.map((topic) => (
                      <div key={topic.topicId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{topic.topicName}</h4>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">
                              +{topic.impact.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current Mastery</span>
                            <span>{topic.currentMastery.toFixed(1)}%</span>
                          </div>
                          <Progress value={topic.currentMastery} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span>Projected Mastery</span>
                            <span>{topic.projectedMastery.toFixed(1)}%</span>
                          </div>
                          <Progress value={topic.projectedMastery} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Topic Mastery Data</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Topic mastery impact will be calculated after grading is complete.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
