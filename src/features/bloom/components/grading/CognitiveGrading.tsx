'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Info, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  BloomsTaxonomyLevel,
  BloomsDistribution
} from '../../types';
import { BLOOMS_LEVEL_METADATA, ORDERED_BLOOMS_LEVELS } from '../../constants/bloom-levels';
import { GradingFormValues, CognitiveGradingAnalysis } from '../../types/grading';

interface CognitiveGradingProps {
  bloomsLevels: BloomsTaxonomyLevel[];
  maxScorePerLevel: Record<BloomsTaxonomyLevel, number>;
  initialValues?: GradingFormValues;
  onGradeChange: (values: GradingFormValues) => void;
  readOnly?: boolean;
  showAnalysis?: boolean;
  className?: string;
}

/**
 * CognitiveGrading component for grading based on Bloom's Taxonomy levels
 * 
 * This component allows teachers to grade student work based on cognitive levels,
 * providing a more nuanced assessment of student understanding across the
 * spectrum of Bloom's Taxonomy.
 */
export function CognitiveGrading({
  bloomsLevels,
  maxScorePerLevel,
  initialValues,
  onGradeChange,
  readOnly = false,
  showAnalysis = true,
  className = '',
}: CognitiveGradingProps) {
  // Sort levels by Bloom's taxonomy order
  const sortedLevels = [...bloomsLevels].sort((a, b) => {
    const aOrder = BLOOMS_LEVEL_METADATA[a].order;
    const bOrder = BLOOMS_LEVEL_METADATA[b].order;
    return aOrder - bOrder;
  });

  // State for scores and feedback
  const [scores, setScores] = useState<Record<BloomsTaxonomyLevel, number>>(() => {
    const initialScores: Record<BloomsTaxonomyLevel, number> = {} as Record<BloomsTaxonomyLevel, number>;
    bloomsLevels.forEach(level => {
      initialScores[level] = initialValues?.bloomsLevelScores?.[level] || 0;
    });
    return initialScores;
  });

  const [feedback, setFeedback] = useState<Record<BloomsTaxonomyLevel, string>>(() => {
    const initialFeedback: Record<BloomsTaxonomyLevel, string> = {} as Record<BloomsTaxonomyLevel, string>;
    bloomsLevels.forEach(level => {
      initialFeedback[level] = '';
    });
    return initialFeedback;
  });

  const [generalFeedback, setGeneralFeedback] = useState(initialValues?.feedback || '');
  const [activeTab, setActiveTab] = useState<BloomsTaxonomyLevel | 'overview'>(sortedLevels[0] || 'overview');

  // Calculate total score
  const calculateTotalScore = (): number => {
    return Object.entries(scores).reduce((total, [_, score]) => total + score, 0);
  };

  // Calculate maximum possible score
  const calculateMaxScore = (): number => {
    return Object.entries(maxScorePerLevel).reduce((total, [_, maxScore]) => total + maxScore, 0);
  };

  // Calculate percentage for each level
  const calculatePercentage = (level: BloomsTaxonomyLevel): number => {
    const maxScore = maxScorePerLevel[level];
    if (!maxScore) return 0;
    return Math.round((scores[level] / maxScore) * 100);
  };

  // Calculate overall percentage
  const calculateOverallPercentage = (): number => {
    const totalScore = calculateTotalScore();
    const maxScore = calculateMaxScore();
    if (!maxScore) return 0;
    return Math.round((totalScore / maxScore) * 100);
  };

  // Generate cognitive grading analysis
  const generateAnalysis = (): CognitiveGradingAnalysis => {
    // Calculate distribution
    const distribution: BloomsDistribution = {} as BloomsDistribution;
    let totalPercentage = 0;
    let count = 0;

    bloomsLevels.forEach(level => {
      const percentage = calculatePercentage(level);
      distribution[level] = percentage;
      totalPercentage += percentage;
      count++;
    });

    // Identify strengths and weaknesses
    const strengths: BloomsTaxonomyLevel[] = [];
    const weaknesses: BloomsTaxonomyLevel[] = [];

    bloomsLevels.forEach(level => {
      const percentage = distribution[level];
      if (percentage >= 80) {
        strengths.push(level);
      } else if (percentage < 60) {
        weaknesses.push(level);
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (weaknesses.length > 0) {
      weaknesses.forEach(level => {
        const metadata = BLOOMS_LEVEL_METADATA[level];
        recommendations.push(`Focus on improving ${metadata.name.toLowerCase()} skills through targeted practice.`);
      });
    }

    if (strengths.length > 0 && weaknesses.length > 0) {
      recommendations.push('Leverage strengths to address areas needing improvement.');
    }

    // Generate next level suggestions
    const nextLevelSuggestions: string[] = [];
    
    // Find the highest mastered level
    const highestMasteredLevel = [...bloomsLevels]
      .sort((a, b) => BLOOMS_LEVEL_METADATA[b].order - BLOOMS_LEVEL_METADATA[a].order)
      .find(level => distribution[level] >= 70);

    if (highestMasteredLevel) {
      const currentOrder = BLOOMS_LEVEL_METADATA[highestMasteredLevel].order;
      const nextLevel = ORDERED_BLOOMS_LEVELS.find(level => BLOOMS_LEVEL_METADATA[level].order > currentOrder);
      
      if (nextLevel) {
        const nextMetadata = BLOOMS_LEVEL_METADATA[nextLevel];
        nextLevelSuggestions.push(`Ready to advance to ${nextMetadata.name} level activities.`);
      }
    }

    return {
      bloomsDistribution: distribution,
      strengths,
      weaknesses,
      recommendations,
      nextLevelSuggestions,
    };
  };

  // Update parent component when scores or feedback change
  useEffect(() => {
    const bloomsLevelScores = { ...scores };
    
    onGradeChange({
      score: calculateTotalScore(),
      feedback: generalFeedback,
      bloomsLevelScores,
    });
  }, [scores, generalFeedback, onGradeChange]);

  // Handle score change
  const handleScoreChange = (level: BloomsTaxonomyLevel, value: number[]) => {
    if (readOnly) return;
    
    setScores(prev => ({
      ...prev,
      [level]: value[0],
    }));
  };

  // Handle feedback change
  const handleFeedbackChange = (level: BloomsTaxonomyLevel, value: string) => {
    if (readOnly) return;
    
    setFeedback(prev => ({
      ...prev,
      [level]: value,
    }));
  };

  // Render level grading form
  const renderLevelGrading = (level: BloomsTaxonomyLevel) => {
    const metadata = BLOOMS_LEVEL_METADATA[level];
    const maxScore = maxScorePerLevel[level];
    const percentage = calculatePercentage(level);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              className="text-white"
              style={{ backgroundColor: metadata.color }}
            >
              {metadata.name}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{metadata.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{scores[level]}/{maxScore}</span>
            <Badge variant={percentage >= 80 ? "success" : percentage >= 60 ? "warning" : "destructive"}>
              {percentage}%
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>0</span>
            <span>{maxScore}</span>
          </div>
          <Slider
            value={[scores[level]]}
            max={maxScore}
            step={0.5}
            onValueChange={(value) => handleScoreChange(level, value)}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`feedback-${level}`}>Feedback for {metadata.name} Level</Label>
          <Textarea
            id={`feedback-${level}`}
            placeholder={`Provide feedback on ${metadata.name.toLowerCase()} skills...`}
            value={feedback[level]}
            onChange={(e) => handleFeedbackChange(level, e.target.value)}
            disabled={readOnly}
            className="min-h-[100px]"
          />
        </div>
      </div>
    );
  };

  // Render overview tab
  const renderOverview = () => {
    const analysis = generateAnalysis();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Score Summary</h3>
            <div className="space-y-4">
              {sortedLevels.map(level => {
                const metadata = BLOOMS_LEVEL_METADATA[level];
                const percentage = calculatePercentage(level);
                
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{scores[level]}/{maxScorePerLevel[level]}</span>
                        <span className="text-xs font-medium">({percentage}%)</span>
                      </div>
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
              
              <div className="pt-4 mt-4 border-t">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span>{calculateTotalScore()}/{calculateMaxScore()}</span>
                      <Badge variant={calculateOverallPercentage() >= 80 ? "success" : calculateOverallPercentage() >= 60 ? "warning" : "destructive"}>
                        {calculateOverallPercentage()}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={calculateOverallPercentage()} max={100} className="h-2" />
                </div>
              </div>
            </div>
          </div>

          {showAnalysis && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cognitive Analysis</h3>
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {analysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.strengths.map(level => (
                            <Badge
                              key={level}
                              className="text-white"
                              style={{ backgroundColor: BLOOMS_LEVEL_METADATA[level].color }}
                            >
                              {BLOOMS_LEVEL_METADATA[level].name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.weaknesses.map(level => (
                            <Badge
                              key={level}
                              variant="outline"
                              style={{ 
                                color: BLOOMS_LEVEL_METADATA[level].color,
                                borderColor: BLOOMS_LEVEL_METADATA[level].color
                              }}
                            >
                              {BLOOMS_LEVEL_METADATA[level].name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {analysis.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm">{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.nextLevelSuggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Next Steps</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {analysis.nextLevelSuggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="general-feedback">Overall Feedback</Label>
          <Textarea
            id="general-feedback"
            placeholder="Provide overall feedback..."
            value={generalFeedback}
            onChange={(e) => setGeneralFeedback(e.target.value)}
            disabled={readOnly}
            className="min-h-[100px]"
          />
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Cognitive Level Grading</CardTitle>
        <CardDescription>
          Grade based on Bloom's Taxonomy cognitive levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BloomsTaxonomyLevel | 'overview')}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {sortedLevels.map(level => {
              const metadata = BLOOMS_LEVEL_METADATA[level];
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
                  <span style={{ color: metadata.color }}>{metadata.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>

          {sortedLevels.map(level => (
            <TabsContent key={level} value={level}>
              {renderLevelGrading(level)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          <span className="text-sm font-medium">Total Score:</span>
          <span className="ml-2 text-lg font-bold">{calculateTotalScore()}</span>
          <span className="ml-1 text-sm text-muted-foreground">/ {calculateMaxScore()}</span>
        </div>

        {!readOnly && (
          <Button
            type="button"
            onClick={() => onGradeChange({
              score: calculateTotalScore(),
              feedback: generalFeedback,
              bloomsLevelScores: scores,
            })}
          >
            Apply Grades
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
