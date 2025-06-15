'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, XCircle, Target, Brain, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';

interface LearningOutcome {
  id: string;
  statement: string;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
}

interface RubricCriteria {
  id: string;
  name: string;
  bloomsLevel: BloomsTaxonomyLevel;
  learningOutcomeIds: string[];
  weight: number;
}

interface AssessmentData {
  title: string;
  learningOutcomes: LearningOutcome[];
  rubricCriteria: RubricCriteria[];
  bloomsDistribution?: Record<BloomsTaxonomyLevel, number>;
  gradingType: 'RUBRIC' | 'SCORE' | 'HYBRID';
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  recommendations: string[];
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'learning_outcomes' | 'rubric' | 'blooms' | 'alignment';
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface AssessmentAlignmentValidatorProps {
  assessmentData: AssessmentData;
  onValidationChange?: (result: ValidationResult) => void;
  className?: string;
}

export function AssessmentAlignmentValidator({
  assessmentData,
  onValidationChange,
  className = '',
}: AssessmentAlignmentValidatorProps) {
  
  // Validate assessment alignment
  const validateAssessment = (): ValidationResult => {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // 1. Learning Outcomes Validation
    if (assessmentData.learningOutcomes.length === 0) {
      issues.push({
        type: 'error',
        category: 'learning_outcomes',
        message: 'No learning outcomes selected',
        severity: 'high',
      });
      score -= 30;
      recommendations.push('Select at least 2-3 learning outcomes for meaningful assessment');
    } else if (assessmentData.learningOutcomes.length < 2) {
      issues.push({
        type: 'warning',
        category: 'learning_outcomes',
        message: 'Only one learning outcome selected',
        severity: 'medium',
      });
      score -= 10;
      recommendations.push('Consider adding more learning outcomes for comprehensive assessment');
    }

    // 2. Rubric Validation
    if (assessmentData.gradingType === 'RUBRIC') {
      if (assessmentData.rubricCriteria.length === 0) {
        issues.push({
          type: 'error',
          category: 'rubric',
          message: 'No rubric criteria defined for rubric-based grading',
          severity: 'high',
        });
        score -= 25;
        recommendations.push('Create rubric criteria aligned with learning outcomes');
      } else {
        // Check if criteria are aligned with learning outcomes
        const unalignedCriteria = assessmentData.rubricCriteria.filter(
          criteria => criteria.learningOutcomeIds.length === 0
        );
        
        if (unalignedCriteria.length > 0) {
          issues.push({
            type: 'warning',
            category: 'alignment',
            message: `${unalignedCriteria.length} criteria not linked to learning outcomes`,
            severity: 'medium',
          });
          score -= 15;
          recommendations.push('Link all rubric criteria to specific learning outcomes');
        }
      }
    }

    // 3. Bloom's Taxonomy Validation
    const learningOutcomeBloomsLevels = new Set(
      assessmentData.learningOutcomes.map(lo => lo.bloomsLevel)
    );
    const criteriaBloomsLevels = new Set(
      assessmentData.rubricCriteria.map(c => c.bloomsLevel)
    );

    // Check if rubric criteria cover all learning outcome Bloom's levels
    const missingBloomsLevels = Array.from(learningOutcomeBloomsLevels).filter(
      level => !criteriaBloomsLevels.has(level)
    );

    if (missingBloomsLevels.length > 0) {
      issues.push({
        type: 'warning',
        category: 'blooms',
        message: `Missing rubric criteria for ${missingBloomsLevels.length} Bloom's levels`,
        severity: 'medium',
      });
      score -= 10;
      recommendations.push('Add rubric criteria for all Bloom\'s levels represented in learning outcomes');
    }

    // 4. Cognitive Balance Validation
    if (learningOutcomeBloomsLevels.size < 2) {
      issues.push({
        type: 'info',
        category: 'blooms',
        message: 'Assessment focuses on single cognitive level',
        severity: 'low',
      });
      score -= 5;
      recommendations.push('Consider including learning outcomes from different cognitive levels');
    }

    // 5. Distribution Validation
    if (assessmentData.bloomsDistribution) {
      const totalDistribution = Object.values(assessmentData.bloomsDistribution).reduce(
        (sum, value) => sum + value, 0
      );
      
      if (Math.abs(totalDistribution - 100) > 1) {
        issues.push({
          type: 'error',
          category: 'blooms',
          message: 'Bloom\'s distribution does not sum to 100%',
          severity: 'high',
        });
        score -= 15;
        recommendations.push('Ensure Bloom\'s distribution percentages sum to 100%');
      }
    }

    const result: ValidationResult = {
      isValid: score >= 70 && !issues.some(i => i.type === 'error'),
      score: Math.max(0, score),
      issues,
      recommendations,
    };

    onValidationChange?.(result);
    return result;
  };

  const validationResult = validateAssessment();

  // Get validation status color
  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <CheckCircle className="h-5 w-5 text-blue-600" />;
    if (score >= 50) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusText = (score: number) => {
    if (score >= 90) return 'Excellent Alignment';
    if (score >= 70) return 'Good Alignment';
    if (score >= 50) return 'Fair Alignment';
    return 'Poor Alignment';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Alignment Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Assessment Alignment
            </span>
            <div className="flex items-center gap-2">
              {getStatusIcon(validationResult.score)}
              <Badge className={cn("border", getStatusColor(validationResult.score))}>
                {validationResult.score}/100
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Validation of assessment alignment with learning outcomes and grading methodology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{getStatusText(validationResult.score)}</span>
                <span className="text-sm text-muted-foreground">
                  {validationResult.score}% alignment score
                </span>
              </div>
              <Progress value={validationResult.score} className="h-3" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {assessmentData.learningOutcomes.length}
                </div>
                <div className="text-xs text-muted-foreground">Learning Outcomes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {assessmentData.rubricCriteria.length}
                </div>
                <div className="text-xs text-muted-foreground">Rubric Criteria</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {new Set(assessmentData.learningOutcomes.map(lo => lo.bloomsLevel)).size}
                </div>
                <div className="text-xs text-muted-foreground">Bloom's Levels</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Issues */}
      {validationResult.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Validation Issues
            </CardTitle>
            <CardDescription>
              Issues that may affect the quality of assessment and grading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationResult.issues.map((issue, index) => (
                <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-2">
                    {issue.type === 'error' ? (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    ) : issue.type === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertTitle className="text-sm">
                        {issue.category.replace('_', ' ').toUpperCase()} - {issue.severity.toUpperCase()}
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        {issue.message}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Outcome Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Learning Outcome Coverage
          </CardTitle>
          <CardDescription>
            How well rubric criteria align with selected learning outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assessmentData.learningOutcomes.map(outcome => {
              const alignedCriteria = assessmentData.rubricCriteria.filter(
                criteria => criteria.learningOutcomeIds.includes(outcome.id) ||
                           criteria.bloomsLevel === outcome.bloomsLevel
              );
              
              const isFullyCovered = alignedCriteria.length > 0;
              
              return (
                <div key={outcome.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isFullyCovered ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="text-sm font-medium">
                        {outcome.statement.substring(0, 50)}...
                      </span>
                    </div>
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
                      {outcome.actionVerbs.slice(0, 2).map(verb => (
                        <Badge key={verb} variant="secondary" className="text-xs">
                          {verb}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium">
                      {alignedCriteria.length} criteria
                    </div>
                    <div className={cn(
                      "text-xs",
                      isFullyCovered ? "text-green-600" : "text-orange-600"
                    )}>
                      {isFullyCovered ? "Covered" : "Not Covered"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bloom's Taxonomy Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Cognitive Level Distribution
          </CardTitle>
          <CardDescription>
            Distribution of learning outcomes and criteria across Bloom's taxonomy levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(BloomsTaxonomyLevel).map(level => {
              const metadata = BLOOMS_LEVEL_METADATA[level];
              const outcomeCount = assessmentData.learningOutcomes.filter(
                lo => lo.bloomsLevel === level
              ).length;
              const criteriaCount = assessmentData.rubricCriteria.filter(
                c => c.bloomsLevel === level
              ).length;
              
              const hasContent = outcomeCount > 0 || criteriaCount > 0;
              
              return (
                <div key={level} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  hasContent ? "bg-gray-50" : "bg-gray-25"
                )}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: metadata.color }}
                    />
                    <div>
                      <div className="font-medium text-sm">{metadata.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {metadata.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {outcomeCount} outcomes, {criteriaCount} criteria
                    </div>
                    <div className={cn(
                      "text-xs",
                      hasContent ? "text-green-600" : "text-gray-400"
                    )}>
                      {hasContent ? "Included" : "Not Included"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {validationResult.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Suggestions to improve assessment alignment and grading quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationResult.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-md">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
