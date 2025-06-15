'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Brain, Target, BookOpen, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';

interface CriteriaResult {
  criteriaId: string;
  criteriaName: string;
  bloomsLevel: BloomsTaxonomyLevel;
  performanceLevelName: string;
  score: number;
  maxScore: number;
  feedback?: string;
  learningOutcomeIds: string[];
}

interface LearningOutcomeResult {
  outcomeId: string;
  outcomeStatement: string;
  bloomsLevel: BloomsTaxonomyLevel;
  achieved: boolean;
  score: number;
  maxScore: number;
  criteriaResults: CriteriaResult[];
}

interface BloomsLevelResult {
  level: BloomsTaxonomyLevel;
  score: number;
  maxScore: number;
  percentage: number;
  criteriaCount: number;
  masteryLevel: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Poor';
}

interface EnhancedAssessmentResultsProps {
  assessmentTitle: string;
  studentName: string;
  totalScore: number;
  maxScore: number;
  passingScore?: number;
  criteriaResults: CriteriaResult[];
  learningOutcomeResults: LearningOutcomeResult[];
  bloomsLevelResults: BloomsLevelResult[];
  submittedAt: Date;
  gradedAt?: Date;
  feedback?: string;
  topicMasteryChanges?: Array<{
    topicId: string;
    topicName: string;
    previousMastery: number;
    newMastery: number;
    change: number;
  }>;
  className?: string;
}

export function EnhancedAssessmentResults({
  assessmentTitle,
  studentName,
  totalScore,
  maxScore,
  passingScore,
  criteriaResults,
  learningOutcomeResults,
  bloomsLevelResults,
  submittedAt,
  gradedAt,
  feedback,
  topicMasteryChanges = [],
  className = '',
}: EnhancedAssessmentResultsProps) {
  const percentage = (totalScore / maxScore) * 100;
  const isPassing = passingScore ? totalScore >= passingScore : true;

  // Calculate grade letter
  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Get mastery level color
  const getMasteryColor = (masteryLevel: string) => {
    switch (masteryLevel) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Satisfactory': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Needs Improvement': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{assessmentTitle}</CardTitle>
              <CardDescription>Assessment Results for {studentName}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{getGradeLetter(percentage)}</div>
              <div className="text-sm text-muted-foreground">
                {totalScore}/{maxScore} ({Math.round(percentage)}%)
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Score Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-sm text-muted-foreground">
                  {totalScore} / {maxScore} points
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-3"
                indicatorClassName={isPassing ? "bg-green-500" : "bg-red-500"}
              />
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isPassing ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  isPassing ? "text-green-600" : "text-red-600"
                )}>
                  {isPassing ? "Passed" : "Failed"}
                </span>
              </div>

              {passingScore && (
                <div className="text-sm text-muted-foreground">
                  Passing Score: {passingScore}/{maxScore} ({Math.round((passingScore / maxScore) * 100)}%)
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Submitted: {submittedAt.toLocaleDateString()}</span>
              {gradedAt && <span>Graded: {gradedAt.toLocaleDateString()}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results Tabs */}
      <Tabs defaultValue="criteria" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="criteria">Criteria Breakdown</TabsTrigger>
          <TabsTrigger value="outcomes">Learning Outcomes</TabsTrigger>
          <TabsTrigger value="blooms">Bloom's Analysis</TabsTrigger>
          <TabsTrigger value="mastery">Topic Mastery</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Criteria Results */}
        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Rubric Criteria Performance
              </CardTitle>
              <CardDescription>
                Detailed breakdown of performance on each assessment criterion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criteriaResults.map((result) => (
                  <div key={result.criteriaId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{result.criteriaName}</h4>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${BLOOMS_LEVEL_METADATA[result.bloomsLevel].color}20`,
                            borderColor: BLOOMS_LEVEL_METADATA[result.bloomsLevel].color,
                            color: BLOOMS_LEVEL_METADATA[result.bloomsLevel].color
                          }}
                        >
                          {BLOOMS_LEVEL_METADATA[result.bloomsLevel].name}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{result.score}/{result.maxScore}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.performanceLevelName}
                        </div>
                      </div>
                    </div>

                    <Progress
                      value={(result.score / result.maxScore) * 100}
                      className="h-2 mb-2"
                    />

                    {result.feedback && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {result.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Outcomes */}
        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Learning Outcome Achievement
              </CardTitle>
              <CardDescription>
                Progress towards achieving specific learning outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningOutcomeResults.map((outcome) => (
                  <div key={outcome.outcomeId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {outcome.achieved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          )}
                          <span className={cn(
                            "text-sm font-medium",
                            outcome.achieved ? "text-green-600" : "text-orange-600"
                          )}>
                            {outcome.achieved ? "Achieved" : "Not Achieved"}
                          </span>
                        </div>
                        <p className="text-sm">{outcome.outcomeStatement}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium">{outcome.score}/{outcome.maxScore}</div>
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
                      </div>
                    </div>

                    <Progress
                      value={(outcome.score / outcome.maxScore) * 100}
                      className="h-2"
                      indicatorClassName={outcome.achieved ? "bg-green-500" : "bg-orange-500"}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bloom's Analysis */}
        <TabsContent value="blooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Cognitive Level Analysis
              </CardTitle>
              <CardDescription>
                Performance breakdown by Bloom's Taxonomy cognitive levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bloomsLevelResults.map((levelResult) => {
                  const metadata = BLOOMS_LEVEL_METADATA[levelResult.level];
                  return (
                    <div key={levelResult.level} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: metadata.color }}
                          />
                          <div>
                            <h4 className="font-medium">{metadata.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {levelResult.criteriaCount} criteria
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {levelResult.score}/{levelResult.maxScore}
                          </div>
                          <div className={cn(
                            "text-xs px-2 py-1 rounded-md border",
                            getMasteryColor(levelResult.masteryLevel)
                          )}>
                            {levelResult.masteryLevel}
                          </div>
                        </div>
                      </div>

                      <Progress
                        value={levelResult.percentage}
                        className="h-2"
                        style={{
                          backgroundColor: `${metadata.color}20`
                        }}
                        indicatorStyle={{
                          backgroundColor: metadata.color
                        }}
                      />

                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(levelResult.percentage)}% mastery
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topic Mastery */}
        <TabsContent value="mastery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Topic Mastery Impact
              </CardTitle>
              <CardDescription>
                How this assessment affected your topic mastery levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topicMasteryChanges.length > 0 ? (
                <div className="space-y-4">
                  {topicMasteryChanges.map((change) => (
                    <div key={change.topicId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{change.topicName}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {Math.round(change.previousMastery)}%
                          </span>
                          <span className="text-sm">→</span>
                          <span className="text-sm font-medium">
                            {Math.round(change.newMastery)}%
                          </span>
                          <Badge
                            variant={change.change > 0 ? "default" : "secondary"}
                            className={change.change > 0 ? "bg-green-100 text-green-800" : ""}
                          >
                            {change.change > 0 ? "+" : ""}{Math.round(change.change)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Previous</div>
                          <Progress value={change.previousMastery} className="h-2" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Current</div>
                          <Progress value={change.newMastery} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No topic mastery changes recorded for this assessment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Performance Insights
              </CardTitle>
              <CardDescription>
                AI-powered analysis of student performance and learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Strengths */}
                <div>
                  <h4 className="font-medium text-green-700 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Strengths Identified
                  </h4>
                  <div className="space-y-2">
                    {bloomsLevelResults
                      .filter(level => level.percentage >= 80)
                      .map(level => (
                        <div key={level.level} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: BLOOMS_LEVEL_METADATA[level.level].color }}
                            />
                            <span className="font-medium text-green-800">
                              Strong {BLOOMS_LEVEL_METADATA[level.level].name} Skills
                            </span>
                          </div>
                          <p className="text-sm text-green-700">
                            Excellent performance at {Math.round(level.percentage)}% mastery.
                            Student demonstrates solid understanding of {BLOOMS_LEVEL_METADATA[level.level].description.toLowerCase()}.
                          </p>
                        </div>
                      ))}

                    {learningOutcomeResults
                      .filter(outcome => outcome.achieved)
                      .slice(0, 2)
                      .map(outcome => (
                        <div key={outcome.outcomeId} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-800">Learning Outcome Achieved</span>
                          </div>
                          <p className="text-sm text-green-700">
                            Successfully achieved: "{outcome.outcomeStatement.substring(0, 60)}..."
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h4 className="font-medium text-orange-700 mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Areas for Improvement
                  </h4>
                  <div className="space-y-2">
                    {bloomsLevelResults
                      .filter(level => level.percentage < 60)
                      .map(level => (
                        <div key={level.level} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: BLOOMS_LEVEL_METADATA[level.level].color }}
                            />
                            <span className="font-medium text-orange-800">
                              {BLOOMS_LEVEL_METADATA[level.level].name} Skills Need Development
                            </span>
                          </div>
                          <p className="text-sm text-orange-700">
                            Performance at {Math.round(level.percentage)}% suggests need for additional practice with {BLOOMS_LEVEL_METADATA[level.level].description.toLowerCase()}.
                          </p>
                        </div>
                      ))}

                    {learningOutcomeResults
                      .filter(outcome => !outcome.achieved)
                      .slice(0, 2)
                      .map(outcome => (
                        <div key={outcome.outcomeId} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            <span className="font-medium text-orange-800">Learning Outcome Not Yet Achieved</span>
                          </div>
                          <p className="text-sm text-orange-700">
                            Needs more work: "{outcome.outcomeStatement.substring(0, 60)}..."
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Recommendations for Growth
                  </h4>
                  <div className="space-y-2">
                    {percentage < 70 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>Focus on Fundamentals:</strong> Consider reviewing basic concepts before moving to more advanced topics.
                        </p>
                      </div>
                    )}

                    {bloomsLevelResults.filter(l => l.percentage < 60).length > 2 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>Cognitive Skills Development:</strong> Practice activities targeting different thinking skills across Bloom's taxonomy.
                        </p>
                      </div>
                    )}

                    {learningOutcomeResults.filter(o => !o.achieved).length > learningOutcomeResults.filter(o => o.achieved).length && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>Learning Outcome Focus:</strong> Concentrate on specific learning outcomes that need attention with targeted practice.
                        </p>
                      </div>
                    )}

                    {percentage >= 80 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>Advanced Challenges:</strong> Ready for more complex problems and higher-order thinking activities.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Steps */}
                <div>
                  <h4 className="font-medium text-purple-700 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Suggested Next Steps
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h5 className="font-medium text-purple-800 mb-1">For Student</h5>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Review feedback on each criterion</li>
                        <li>• Practice skills in lower-performing areas</li>
                        <li>• Seek help for challenging concepts</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h5 className="font-medium text-purple-800 mb-1">For Teacher</h5>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Provide targeted interventions</li>
                        <li>• Adjust instruction based on gaps</li>
                        <li>• Monitor progress on learning outcomes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Overall Feedback */}
      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{feedback}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
