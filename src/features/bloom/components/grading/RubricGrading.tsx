'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  RubricCriteria,
  PerformanceLevel,
  RubricType,
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { GradingFormValues } from '../../types/grading';

// Learning Outcome types
interface LearningOutcome {
  id: string;
  statement: string;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  achievementThreshold?: number; // Minimum score percentage to achieve outcome
}

interface LearningOutcomeProgress {
  outcomeId: string;
  currentScore: number;
  maxScore: number;
  isAchieved: boolean;
  contributingCriteria: string[];
}

interface RubricGradingProps {
  rubricId: string;
  rubricType: RubricType;
  criteria: RubricCriteria[];
  performanceLevels: PerformanceLevel[];
  maxScore: number;
  initialValues?: GradingFormValues;
  onGradeChange: (values: GradingFormValues & {
    learningOutcomeProgress?: LearningOutcomeProgress[];
  }) => void;
  readOnly?: boolean;
  showBloomsLevels?: boolean;
  learningOutcomes?: LearningOutcome[];
  showLearningOutcomes?: boolean;
  className?: string;
}

/**
 * RubricGrading component for grading using rubrics with Bloom's Taxonomy integration
 */
export function RubricGrading({
  rubricId, // Used for interface compatibility - may be used for future features
  rubricType,
  criteria,
  performanceLevels,
  maxScore,
  initialValues,
  onGradeChange,
  readOnly = false,
  showBloomsLevels = true,
  learningOutcomes = [],
  showLearningOutcomes = true,
  className = '',
}: RubricGradingProps) {
  // Sort criteria by Bloom's level if showBloomsLevels is true
  const sortedCriteria = showBloomsLevels
    ? [...criteria].sort((a, b) => {
        const aLevel = BLOOMS_LEVEL_METADATA[a.bloomsLevel].order;
        const bLevel = BLOOMS_LEVEL_METADATA[b.bloomsLevel].order;
        return aLevel - bLevel;
      })
    : criteria;

  // Group criteria by Bloom's level if showBloomsLevels is true
  const criteriaByLevel = showBloomsLevels
    ? sortedCriteria.reduce((acc, criterion) => {
        const level = criterion.bloomsLevel;
        if (!acc[level]) {
          acc[level] = [];
        }
        acc[level].push(criterion);
        return acc;
      }, {} as Record<BloomsTaxonomyLevel, RubricCriteria[]>)
    : { all: sortedCriteria } as Record<string, RubricCriteria[]>;

  // State for selected performance levels and feedback
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>(
    initialValues?.criteriaGrades?.reduce(
      (acc, grade) => ({ ...acc, [grade.criterionId]: grade.levelId }),
      {}
    ) || {}
  );

  const [feedback, setFeedback] = useState<Record<string, string>>(
    initialValues?.criteriaGrades?.reduce(
      (acc, grade) => ({ ...acc, [grade.criterionId]: grade.feedback || '' }),
      {}
    ) || {}
  );

  // Calculate total score based on selected levels
  const calculateTotalScore = () => {
    let total = 0;

    criteria.forEach(criterion => {
      const levelId = selectedLevels[criterion.id];
      if (levelId) {
        const level = criterion.performanceLevels.find(l => l.levelId === levelId);
        if (level) {
          total += level.score;
        }
      }
    });

    return total;
  };

  // Calculate learning outcome progress
  const calculateLearningOutcomeProgress = (): LearningOutcomeProgress[] => {
    return learningOutcomes.map(outcome => {
      // Find criteria that contribute to this learning outcome
      const contributingCriteria = criteria.filter(criterion =>
        criterion.learningOutcomeIds?.includes(outcome.id) ||
        criterion.bloomsLevel === outcome.bloomsLevel
      );

      // Calculate current score for this outcome
      let currentScore = 0;
      let maxScore = 0;
      const contributingCriteriaIds: string[] = [];

      contributingCriteria.forEach(criterion => {
        const levelId = selectedLevels[criterion.id];
        if (levelId) {
          const level = criterion.performanceLevels.find(l => l.levelId === levelId);
          if (level) {
            currentScore += level.score;
            contributingCriteriaIds.push(criterion.id);
          }
        }
        // Calculate max possible score for this criterion
        const maxLevel = criterion.performanceLevels.reduce((max, level) =>
          level.score > max ? level.score : max, 0
        );
        maxScore += maxLevel;
      });

      // Determine if outcome is achieved (default threshold is 70%)
      const achievementThreshold = outcome.achievementThreshold || 0.7;
      const isAchieved = maxScore > 0 && (currentScore / maxScore) >= achievementThreshold;

      return {
        outcomeId: outcome.id,
        currentScore,
        maxScore,
        isAchieved,
        contributingCriteria: contributingCriteriaIds,
      };
    });
  };

  // Update parent component when selections change - with debouncing to prevent infinite loops
  useEffect(() => {
    // Only update if we have actual selections
    if (Object.keys(selectedLevels).length === 0 && Object.keys(feedback).length === 0) {
      return;
    }

    const criteriaGrades = Object.entries(selectedLevels).map(([criterionId, levelId]) => {
      const criterion = criteria.find(c => c.id === criterionId);
      const level = criterion?.performanceLevels.find(l => l.levelId === levelId);

      return {
        criterionId,
        levelId,
        score: level?.score || 0,
        feedback: feedback[criterionId] || '',
      };
    });

    // Calculate Bloom's level scores
    const bloomsLevelScores = criteria.reduce((acc, criterion) => {
      const levelId = selectedLevels[criterion.id];
      if (levelId) {
        const level = criterion.performanceLevels.find(l => l.levelId === levelId);
        if (level) {
          const bloomsLevel = criterion.bloomsLevel;
          acc[bloomsLevel] = (acc[bloomsLevel] || 0) + level.score;
        }
      }
      return acc;
    }, {} as Record<BloomsTaxonomyLevel, number>);

    // Calculate learning outcome progress
    const learningOutcomeProgress = calculateLearningOutcomeProgress();

    // Use a timeout to debounce the callback and prevent infinite loops
    const timeoutId = setTimeout(() => {
      onGradeChange({
        score: calculateTotalScore(),
        criteriaGrades,
        bloomsLevelScores,
        learningOutcomeProgress,
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedLevels, feedback]); // Removed criteria and learningOutcomes to prevent loops

  // Handle level selection
  const handleLevelSelect = (criterionId: string, levelId: string) => {
    if (readOnly) return;

    setSelectedLevels(prev => ({
      ...prev,
      [criterionId]: levelId,
    }));
  };

  // Handle feedback change
  const handleFeedbackChange = (criterionId: string, value: string) => {
    if (readOnly) return;

    setFeedback(prev => ({
      ...prev,
      [criterionId]: value,
    }));
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Rubric-Based Grading</CardTitle>
        <CardDescription>
          {rubricType === RubricType.ANALYTIC
            ? "Grade each criterion individually"
            : "Select the overall performance level"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showBloomsLevels ? (
          <Tabs defaultValue={Object.keys(criteriaByLevel)[0]} className="w-full">
            <TabsList className="mb-4">
              {Object.entries(criteriaByLevel).map(([level, _]) => {
                const metadata = BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel];
                return (
                  <TabsTrigger
                    key={level}
                    value={level}
                    className="flex items-center gap-2"
                    style={{
                      borderBottomColor: metadata.color,
                      borderBottomWidth: '2px'
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metadata.color }}
                    />
                    <span>{metadata.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(criteriaByLevel).map(([level, levelCriteria]) => (
              <TabsContent key={level} value={level} className="space-y-6">
                {levelCriteria.map(criterion => renderCriterion(criterion))}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-6">
            {sortedCriteria.map(criterion => renderCriterion(criterion))}
          </div>
        )}

        {/* Learning Outcome Progress Summary */}
        {showLearningOutcomes && learningOutcomes.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Learning Outcome Progress</h4>
            <div className="space-y-2">
              {calculateLearningOutcomeProgress().map(progress => {
                const outcome = learningOutcomes.find(lo => lo.id === progress.outcomeId);
                if (!outcome) return null;

                const percentage = progress.maxScore > 0 ? (progress.currentScore / progress.maxScore) * 100 : 0;

                return (
                  <div key={progress.outcomeId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {outcome.statement.substring(0, 40)}...
                        </span>
                        {progress.isAchieved ? (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            Achieved
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                            In Progress
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {progress.currentScore}/{progress.maxScore} pts ({Math.round(percentage)}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex justify-between items-center">
          <div>
            <span className="text-sm font-medium">Total Score:</span>
            <span className="ml-2 text-lg font-bold">{calculateTotalScore()}</span>
            <span className="ml-1 text-sm text-muted-foreground">/ {maxScore}</span>
          </div>

          {!readOnly && (
            <Button
              type="button"
              onClick={() => {
                console.log('Apply Grades clicked for rubric:', rubricId);
                console.log('Selected levels:', selectedLevels);
                console.log('Feedback:', feedback);

                const criteriaGrades = Object.entries(selectedLevels).map(([criterionId, levelId]) => {
                  const criterion = criteria.find(c => c.id === criterionId);
                  const level = criterion?.performanceLevels.find(l => l.levelId === levelId);

                  return {
                    criterionId,
                    levelId,
                    score: level?.score || 0,
                    feedback: feedback[criterionId] || '',
                  };
                });

                const gradeData = {
                  score: calculateTotalScore(),
                  criteriaGrades,
                  bloomsLevelScores: criteria.reduce((acc, criterion) => {
                    const levelId = selectedLevels[criterion.id];
                    if (levelId) {
                      const level = criterion.performanceLevels.find(l => l.levelId === levelId);
                      if (level) {
                        const bloomsLevel = criterion.bloomsLevel;
                        acc[bloomsLevel] = (acc[bloomsLevel] || 0) + level.score;
                      }
                    }
                    return acc;
                  }, {} as Record<BloomsTaxonomyLevel, number>),
                  learningOutcomeProgress: calculateLearningOutcomeProgress(),
                };

                console.log('Grade data to submit:', gradeData);
                onGradeChange(gradeData);
              }}
              disabled={Object.keys(selectedLevels).length === 0}
            >
              Apply Grades
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Helper function to render a criterion
  function renderCriterion(criterion: RubricCriteria) {
    return (
      <div
        key={criterion.id}
        className={cn(
          "p-4 rounded-md border",
          showBloomsLevels && `border-l-4`
        )}
        style={showBloomsLevels ? {
          borderLeftColor: BLOOMS_LEVEL_METADATA[criterion.bloomsLevel].color
        } : {}}
      >
        <div className="mb-3">
          <h3 className="text-base font-medium">{criterion.name}</h3>
          {criterion.description && (
            <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {showBloomsLevels && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${BLOOMS_LEVEL_METADATA[criterion.bloomsLevel].color}20`,
                  color: BLOOMS_LEVEL_METADATA[criterion.bloomsLevel].color
                }}
              >
                {BLOOMS_LEVEL_METADATA[criterion.bloomsLevel].name}
              </span>
            )}

            {/* Learning Outcome Indicators */}
            {showLearningOutcomes && criterion.learningOutcomeIds && criterion.learningOutcomeIds.length > 0 && (
              <div className="flex items-center gap-1">
                {criterion.learningOutcomeIds.map(outcomeId => {
                  const outcome = learningOutcomes.find(lo => lo.id === outcomeId);
                  if (!outcome) return null;

                  return (
                    <span
                      key={outcomeId}
                      className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
                      title={outcome.statement}
                    >
                      LO: {outcome.statement.substring(0, 20)}...
                    </span>
                  );
                })}
              </div>
            )}

            {/* Weight indicator */}
            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
              Weight: {Math.round(criterion.weight * 100)}%
            </span>
          </div>
        </div>

        <RadioGroup
          value={selectedLevels[criterion.id] || ''}
          onValueChange={(value) => handleLevelSelect(criterion.id, value)}
          disabled={readOnly}
          className="space-y-3"
        >
          {/* Use fallback performance levels if criterion doesn't have them */}
          {(() => {
            const levelsToUse = criterion.performanceLevels && criterion.performanceLevels.length > 0
              ? criterion.performanceLevels
              : performanceLevels?.map(pl => ({
                  levelId: pl.id,
                  description: pl.description || '',
                  score: pl.scoreRange ? (pl.scoreRange.min + pl.scoreRange.max) / 2 : 0
                })) || [];

            if (levelsToUse.length === 0) {
              return (
                <div className="text-sm text-muted-foreground p-3 border rounded-md">
                  No performance levels available for this criterion.
                </div>
              );
            }

            return levelsToUse.map(level => {
              const performanceLevel = performanceLevels?.find(pl => pl.id === level.levelId);
              const isSelected = selectedLevels[criterion.id] === level.levelId;

            // Determine performance quality color
            const getPerformanceColor = (score: number, maxScore: number) => {
              const percentage = (score / maxScore) * 100;
              if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
              if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
              if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
              if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
              return 'text-red-600 bg-red-50 border-red-200';
            };

            return (
              <div
                key={level.levelId}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-muted/50 hover:border-muted-foreground/20"
                )}
              >
                <RadioGroupItem
                  value={level.levelId}
                  id={`${criterion.id}-${level.levelId}`}
                  disabled={readOnly}
                  className="mt-1"
                />
                <div className="flex-1 grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`${criterion.id}-${level.levelId}`}
                      className="font-medium cursor-pointer text-base"
                    >
                      {performanceLevel?.name || level.levelId}
                    </Label>
                    <div className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium border",
                      getPerformanceColor(level.score, maxScore)
                    )}>
                      {level.score} pts
                    </div>
                  </div>

                  {level.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {level.description}
                    </p>
                  )}

                  {performanceLevel?.description && performanceLevel.description !== level.description && (
                    <p className="text-xs text-muted-foreground/80 italic">
                      {performanceLevel.description}
                    </p>
                  )}

                  {/* Score range indicator */}
                  {performanceLevel?.scoreRange && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Range: {performanceLevel.scoreRange.min}% - {performanceLevel.scoreRange.max}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          });
          })()}
        </RadioGroup>

        <div className="mt-3">
          <Label htmlFor={`feedback-${criterion.id}`} className="text-sm font-medium">
            Feedback
          </Label>
          <Textarea
            id={`feedback-${criterion.id}`}
            value={feedback[criterion.id] || ''}
            onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
            placeholder="Provide specific feedback for this criterion..."
            disabled={readOnly}
            className="mt-1"
            rows={2}
          />
        </div>
      </div>
    );
  }
}
