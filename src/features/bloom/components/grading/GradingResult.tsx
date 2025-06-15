'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Printer, 
  Share2, 
  CheckCircle, 
  BarChart, 
  FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  BloomsTaxonomyLevel,
  RubricCriteria,
  RubricType
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { 
  GradingResult as GradingResultType,
  CriteriaGradingResult,
  QuestionGradingResult,
  SubmissionStatus,
  GradableContentType
} from '../../types/grading';
import { BloomsCognitiveDistributionChart } from '../analytics/BloomsCognitiveDistributionChart';

interface GradingResultProps {
  result: GradingResultType;
  contentType: GradableContentType;
  studentName: string;
  criteria?: RubricCriteria[];
  showBloomsLevels?: boolean;
  onPrint?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

/**
 * GradingResult component
 * 
 * This component displays the results of a grading operation, including
 * scores, feedback, and Bloom's Taxonomy level analysis.
 */
export function GradingResult({
  result,
  contentType,
  studentName,
  criteria = [],
  showBloomsLevels = true,
  onPrint,
  onDownload,
  onShare,
  className = '',
}: GradingResultProps) {
  // Calculate Bloom's distribution from level scores
  const calculateBloomsDistribution = () => {
    if (!result.bloomsLevelScores) return {};
    
    const distribution: Record<BloomsTaxonomyLevel, number> = {} as Record<BloomsTaxonomyLevel, number>;
    let totalScore = 0;
    
    // Calculate total score across all levels
    Object.entries(result.bloomsLevelScores).forEach(([level, score]) => {
      totalScore += score;
    });
    
    // Calculate percentage for each level
    Object.entries(result.bloomsLevelScores).forEach(([level, score]) => {
      if (totalScore > 0) {
        distribution[level as BloomsTaxonomyLevel] = Math.round((score / totalScore) * 100);
      } else {
        distribution[level as BloomsTaxonomyLevel] = 0;
      }
    });
    
    return distribution;
  };

  // Get criteria by Bloom's level
  const getCriteriaByLevel = (level: BloomsTaxonomyLevel) => {
    return criteria.filter(criterion => criterion.bloomsLevel === level);
  };

  // Get criteria result
  const getCriteriaResult = (criterionId: string) => {
    return result.criteriaResults?.find(cr => cr.criterionId === criterionId);
  };

  // Render score section
  const renderScoreSection = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h3 className="text-lg font-medium">Score Summary</h3>
            <p className="text-sm text-muted-foreground">
              Overall performance assessment
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={result.passed ? "success" : "destructive"} className="text-sm">
              {result.passed ? "Passed" : "Failed"}
            </Badge>
            <Badge variant="outline" className="text-lg font-bold">
              {result.score}/{result.maxScore} ({Math.round((result.score / result.maxScore) * 100)}%)
            </Badge>
          </div>
        </div>

        <Progress 
          value={(result.score / result.maxScore) * 100} 
          max={100} 
          className="h-2" 
        />

        {result.feedback && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="text-sm font-medium mb-2">Feedback</h4>
            <p className="text-sm">{result.feedback}</p>
          </div>
        )}
      </div>
    );
  };

  // Render Bloom's level analysis
  const renderBloomsAnalysis = () => {
    if (!result.bloomsLevelScores || Object.keys(result.bloomsLevelScores).length === 0) {
      return null;
    }

    const distribution = calculateBloomsDistribution();
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Cognitive Level Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Performance across Bloom's Taxonomy levels
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              {Object.entries(result.bloomsLevelScores).map(([level, score]) => {
                const bloomsLevel = level as BloomsTaxonomyLevel;
                const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
                const percentage = distribution[bloomsLevel] || 0;
                
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: metadata.color }}
                        />
                        <span className="text-sm font-medium">{metadata.name}</span>
                      </div>
                      <span className="text-sm">{score} points ({percentage}%)</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      max={100} 
                      className="h-2" 
                      style={{ 
                        "--progress-background": metadata.color 
                      } as React.CSSProperties}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-[200px]">
            <BloomsCognitiveDistributionChart
              distribution={distribution}
              height={200}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render criteria results
  const renderCriteriaResults = () => {
    if (!result.criteriaResults || result.criteriaResults.length === 0 || criteria.length === 0) {
      return null;
    }
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Criteria Assessment</h3>
          <p className="text-sm text-muted-foreground">
            Detailed breakdown by assessment criteria
          </p>
        </div>

        {showBloomsLevels ? (
          // Group criteria by Bloom's level
          Object.values(BloomsTaxonomyLevel).map(level => {
            const levelCriteria = getCriteriaByLevel(level);
            if (levelCriteria.length === 0) return null;
            
            const metadata = BLOOMS_LEVEL_METADATA[level];
            
            return (
              <div key={level} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: metadata.color }}
                  >
                    {metadata.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{metadata.description}</span>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criterion</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelCriteria.map(criterion => {
                      const criteriaResult = getCriteriaResult(criterion.id);
                      
                      return (
                        <TableRow key={criterion.id}>
                          <TableCell className="font-medium">{criterion.name}</TableCell>
                          <TableCell>
                            {criteriaResult ? (
                              <div className="flex items-center gap-2">
                                <span>{criteriaResult.score}</span>
                                <Progress 
                                  value={(criteriaResult.score / criterion.weight) * 100} 
                                  max={100} 
                                  className="h-2 w-16" 
                                />
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {criteriaResult?.feedback || <span className="text-muted-foreground">No feedback</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })
        ) : (
          // Show all criteria without grouping
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criterion</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criteria.map(criterion => {
                const criteriaResult = getCriteriaResult(criterion.id);
                
                return (
                  <TableRow key={criterion.id}>
                    <TableCell className="font-medium">{criterion.name}</TableCell>
                    <TableCell>
                      {criteriaResult ? (
                        <div className="flex items-center gap-2">
                          <span>{criteriaResult.score}</span>
                          <Progress 
                            value={(criteriaResult.score / criterion.weight) * 100} 
                            max={100} 
                            className="h-2 w-16" 
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {criteriaResult?.feedback || <span className="text-muted-foreground">No feedback</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  // Render question results
  const renderQuestionResults = () => {
    if (!result.questionResults || result.questionResults.length === 0) {
      return null;
    }
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Question Assessment</h3>
          <p className="text-sm text-muted-foreground">
            Detailed breakdown by question
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              {showBloomsLevels && <TableHead>Cognitive Level</TableHead>}
              <TableHead>Score</TableHead>
              <TableHead>Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.questionResults.map((question, index) => (
              <TableRow key={question.questionId}>
                <TableCell className="font-medium">Question {index + 1}</TableCell>
                {showBloomsLevels && question.bloomsLevel && (
                  <TableCell>
                    <Badge
                      className="text-white"
                      style={{ backgroundColor: BLOOMS_LEVEL_METADATA[question.bloomsLevel].color }}
                    >
                      {BLOOMS_LEVEL_METADATA[question.bloomsLevel].name}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{question.score}/{question.maxScore}</span>
                    <Progress 
                      value={(question.score / question.maxScore) * 100} 
                      max={100} 
                      className="h-2 w-16" 
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {question.feedback || <span className="text-muted-foreground">No feedback</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Grading Result
            </CardTitle>
            <CardDescription>
              {contentType === GradableContentType.ASSESSMENT ? "Assessment" : 
               contentType === GradableContentType.ACTIVITY ? "Activity" : 
               "Submission"} grading for {studentName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Score section */}
          {renderScoreSection()}
          
          <Separator />
          
          {/* Bloom's level analysis */}
          {showBloomsLevels && renderBloomsAnalysis()}
          
          {showBloomsLevels && <Separator />}
          
          {/* Criteria results */}
          {renderCriteriaResults()}
          
          {result.criteriaResults && result.criteriaResults.length > 0 && <Separator />}
          
          {/* Question results */}
          {renderQuestionResults()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="flex items-center gap-2">
          <Badge variant={result.passed ? "success" : "destructive"}>
            {result.passed ? "Passed" : "Failed"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Graded on {result.gradedAt.toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="font-medium">Final Score:</span>
          <span className="ml-2 text-lg font-bold">{result.score}/{result.maxScore}</span>
          <span className="ml-1 text-sm text-muted-foreground">
            ({Math.round((result.score / result.maxScore) * 100)}%)
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
