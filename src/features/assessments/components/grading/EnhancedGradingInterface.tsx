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
import { EssayRubric } from '@/features/question-bank/models/types'; // For the custom JSON rubric type
import { CustomJsonRubricGrading, CustomRubricSelections, CustomRubricCriterionSelection } from './CustomJsonRubricGrading'; // Import the new component


// Keep existing or adapt if necessary
interface RubricCriterion { // This is for StructuredBloomRubric
  id: string;
  name: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  maxScore: number; // This might be specific to how Bloom's criteria are structured
  // performanceLevels: PerformanceLevel[]; // performanceLevels are usually global in StructuredBloomRubric
}

interface PerformanceLevel { // This is for StructuredBloomRubric
  id: string;
  name: string;
  description: string;
  score: number; // This score is often what's awarded for selecting this level for a criterion
  // minScore: number; // These might be part of the definition but not directly used in grading selection
  // maxScore: number;
}

interface CriteriaGrade { // Represents a graded criterion for StructuredBloomRubric
  criterionId: string;
  levelId: string; // ID of the selected PerformanceLevel
  score: number;   // Score awarded for this criterion based on selected level
  feedback?: string;
}

// For Custom JSON Rubric, the structure might be different when submitting
// For example, it might be an array of { criterionId: string, selectedLevelId: string, points: number, feedback?: string }
interface CustomRubricGradeValue {
    criterionId: string;
    levelId?: string; // ID of the selected level from the custom rubric's levels array
    levelName?: string; // Name of the selected level
    points: number;    // Points awarded for this criterion from the custom rubric
    feedback?: string;
}


interface TopicMasteryImpact {
  topicId: string;
  topicName: string;
  currentMastery: number;
  projectedMastery: number;
  impact: number;
}

interface StructuredBloomRubric {
   id: string;
   criteria: RubricCriterion[];
   performanceLevels: PerformanceLevel[];
}

interface EnhancedGradingInterfaceProps {
  assessmentId: string;
  submissionId: string;
  maxScore: number;
  gradingMethod: 'SCORE_BASED' | 'RUBRIC_BASED' | 'CUSTOM_JSON_RUBRIC'; // Add CUSTOM_JSON_RUBRIC
  rubric?: StructuredBloomRubric | EssayRubric; // Union type for different rubric structures
  bloomsDistribution?: Record<BloomsTaxonomyLevel, number>;
  initialValues?: {
    score?: number;
    feedback?: string;
    criteriaGrades?: CriteriaGrade[]; // This structure is primarily for Bloom's rubrics
    customRubricSelections?: CustomRubricSelections; // Use imported type
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  };
  onGradeSubmit: (result: {
    score: number;
    feedback?: string;
    criteriaGrades?: CriteriaGrade[]; // For Bloom's (structured rubric)
    customRubricGrades?: CustomRubricGradeValue[]; // For custom JSON rubric, processed by parent
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

  // For structured Bloom's Rubric
  const [criteriaGrades, setCriteriaGrades] = useState<CriteriaGrade[]>(
    initialValues?.criteriaGrades || []
  );

  // For Custom JSON Rubric (e.g., EssayRubric)
  const [customRubricSelections, setCustomRubricSelections] =
    useState<CustomRubricSelections>(initialValues?.customRubricSelections || {});

  const [bloomsLevelScores, setBloomsLevelScores] = useState<Record<BloomsTaxonomyLevel, number>>(
    initialValues?.bloomsLevelScores || {} as Record<BloomsTaxonomyLevel, number> // Ensure it's properly initialized
  );

  // Effect to update score if bloomsDistribution and bloomsLevelScores change (e.g. from cognitive grading)
  // Or if parent wants to recalculate based on bloomsLevelScores from any source
  useEffect(() => {
    if (gradingMethod !== 'RUBRIC_BASED' && gradingMethod !== 'CUSTOM_JSON_RUBRIC' && bloomsDistribution && Object.keys(bloomsLevelScores).length > 0) {
        const calculatedScore = Object.values(bloomsLevelScores).reduce((sum, s) => sum + s, 0);
        if (Math.abs(calculatedScore - score) > 0.01) { // Check to prevent infinite loops if score is also a dependency
            setScore(calculatedScore);
        }
    }
  }, [bloomsLevelScores, bloomsDistribution, gradingMethod, score]);


  // Calculate Bloom's level scores from total score based on distribution
  const calculateBloomsScoresFromTotal = useCallback((totalScoreParam: number): Record<BloomsTaxonomyLevel, number> => {
    if (!bloomsDistribution) return {} as Record<BloomsTaxonomyLevel, number>;

    const newScores: Record<BloomsTaxonomyLevel, number> = {} as any;
    // Ensure totalScoreParam is not NaN or Infinity, default to 0 if it is.
    const validTotalScore = Number.isFinite(totalScoreParam) ? totalScoreParam : 0;
    const percentage = maxScore > 0 ? validTotalScore / maxScore : 0;

    Object.entries(bloomsDistribution).forEach(([level, distribution]) => {
      const levelMaxScore = (maxScore * distribution) / 100;
      newScores[level as BloomsTaxonomyLevel] = Math.round(levelMaxScore * percentage);
    });
    return newScores;
  }, [bloomsDistribution, maxScore]);

  // Update bloomsLevelScores when score changes for SCORE_BASED or if distribution exists
  useEffect(() => {
    if (gradingMethod === 'SCORE_BASED' && bloomsDistribution) {
        setBloomsLevelScores(calculateBloomsScoresFromTotal(score));
    }
    // For rubric methods, bloomsLevelScores are often set directly by their respective handlers
  }, [score, gradingMethod, bloomsDistribution, calculateBloomsScoresFromTotal]);


  // Handler for structured Bloom's Rubric grading
  const handleStructuredRubricGrading = useCallback((result: {
    score: number;
    criteriaGrades: CriteriaGrade[];
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    setCriteriaGrades(result.criteriaGrades);
    setScore(result.score);
    if (result.bloomsLevelScores) {
      setBloomsLevelScores(result.bloomsLevelScores);
    }
    // The main "Save" button will call onGradeSubmit with the collective state
  }, []);

  // Handler for Custom JSON Rubric grading
  const handleCustomJsonRubricGrading = useCallback((result: {
    score: number;
    selections: CustomRubricSelections; // Use imported type
  }) => {
    setScore(result.score);
    setCustomRubricSelections(result.selections); // selections already includes levelName if CustomJsonRubricGrading adds it
    if (bloomsDistribution) { // If blooms is also relevant (e.g. overall assessment has distribution)
      setBloomsLevelScores(calculateBloomsScoresFromTotal(result.score));
    }
    // Main "Save" button will use 'score', 'feedback', and 'customRubricSelections' (mapped)
  }, [bloomsDistribution, calculateBloomsScoresFromTotal]);


  // This is the function called by the main "Save Grade" button for any method
  const handleSaveGrade = () => {
    let submissionData: Parameters<typeof onGradeSubmit>[0] = {
        score,
        feedback,
        bloomsLevelScores,
    };

    if (gradingMethod === 'RUBRIC_BASED') {
        submissionData.criteriaGrades = criteriaGrades;
    } else if (gradingMethod === 'CUSTOM_JSON_RUBRIC') {
        // Map customRubricSelections to CustomRubricGradeValue[]
        submissionData.customRubricGrades = Object.entries(customRubricSelections).map(([criterionId, selection]) => ({
            criterionId,
            criterionId,
            levelId: selection.levelId,
            points: selection.points,
            feedback: selection.feedback,
            levelName: selection.levelName, // Ensure CustomRubricCriterionSelection includes levelName
        }));
    }
    onGradeSubmit(submissionData);
  };


  // Handle cognitive grading (seems like a direct score input per Bloom's level)
  const handleCognitiveGrading = (result: {
    score: number; // This is the overall score, sum of bloomsLevelScores
    feedback?: string; // Overall feedback
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>; // Scores per level
  }) => {
    setScore(result.score); // Overall score
    setFeedback(result.feedback || ''); // Overall feedback
    if (result.bloomsLevelScores) {
      setBloomsLevelScores(result.bloomsLevelScores); // Specific scores per Bloom's level
    }
    // The main "Save" button will call onGradeSubmit with the collective state
    // No direct onGradeSubmit call here unless CognitiveGrading is the *only* method.
  };


  // Get Bloom's level analysis data
  const getBloomsAnalysis = useCallback(() => {
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
            {gradingMethod === 'SCORE_BASED' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Score-Based Grading
                </CardTitle>
                  <CardDescription>Enter the total score and overall feedback for this submission.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  {/* Score Input Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label htmlFor="totalScoreInput" className="text-sm font-medium">Score</label>
                    <div className="flex items-center gap-2">
                      <Input
                          id="totalScoreInput"
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
                        <Badge variant={ score >= maxScore * 0.9 ? "default" : score >= maxScore * 0.8 ? "secondary" : score >= maxScore * 0.7 ? "outline" : "destructive" } className="text-lg px-3 py-1" >
                          {score >= maxScore * 0.9 ? 'A' : score >= maxScore * 0.8 ? 'B' : score >= maxScore * 0.7 ? 'C' : score >= maxScore * 0.6 ? 'D' : 'F'}
                      </Badge>
                    </div>
                  </div>
                </div>
                  {/* Feedback Textarea */}
                <div className="space-y-2">
                    <label htmlFor="overallFeedbackInput" className="text-sm font-medium">Overall Feedback</label>
                  <Textarea
                      id="overallFeedbackInput"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide overall feedback for the student..."
                    disabled={readOnly}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {gradingMethod === 'RUBRIC_BASED' && rubric && 'performanceLevels' in rubric && (
              <RubricGrading
                rubricId={(rubric as StructuredBloomRubric).id}
                rubricType="ASSESSMENT" as any // May need to adjust if RubricGrading component's prop changes
                criteria={(rubric as StructuredBloomRubric).criteria}
                performanceLevels={(rubric as StructuredBloomRubric).performanceLevels}
                maxScore={maxScore}
                initialValues={{ criteriaGrades, score }}
                onGradeChange={handleStructuredRubricGrading} // Use specific handler
                readOnly={readOnly}
                showBloomsLevels={true}
              />
            )}

            {gradingMethod === 'CUSTOM_JSON_RUBRIC' && rubric && 'criteria' in rubric && !('performanceLevels' in rubric) && (
              <CustomJsonRubricGrading
                rubric={rubric as EssayRubric}
                initialSelections={customRubricSelections}
                onSelectionsChange={handleCustomJsonRubricGrading}
                readOnly={readOnly}
                // maxScore is passed to the main component, CustomJsonRubricGrading uses rubric.totalPoints or sums criteria
              />
            )}

            {/* Fallback for unhandled or misconfigured grading methods, or if only blooms is available */}
            {gradingMethod !== 'SCORE_BASED' &&
             gradingMethod !== 'RUBRIC_BASED' &&
             gradingMethod !== 'CUSTOM_JSON_RUBRIC' &&
             bloomsDistribution && (
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
          )}

          {/* Save Grade Button - Common for all methods that update state handled by this component */}
          {!readOnly && (gradingMethod === 'SCORE_BASED' || gradingMethod === 'RUBRIC_BASED' || gradingMethod === 'CUSTOM_JSON_RUBRIC' || bloomsDistribution) && (
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveGrade} disabled={readOnly /* Can add other disabled conditions, e.g. if score is invalid */}>
                <Save className="h-4 w-4 mr-2" />
                Save Grade
              </Button>
            </div>
          )}

          {/* Fallback message if no valid grading method is determined and no blooms distribution for cognitive */}
          {gradingMethod !== 'SCORE_BASED' &&
           gradingMethod !== 'RUBRIC_BASED' &&
           gradingMethod !== 'CUSTOM_JSON_RUBRIC' &&
           !bloomsDistribution && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Grading Method Available</h3>
                  <p className="text-muted-foreground">
                    This assessment does not have a configured grading method (score, rubric, or cognitive distribution).
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
