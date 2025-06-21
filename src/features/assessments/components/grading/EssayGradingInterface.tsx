'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  User,
  Clock,
  Award,
  Activity,
  CheckCircle as ShieldIcon,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  BarChart
} from 'lucide-react';
import { EssaySubmission, EssayGradingCriterion, AIGradingResult, PlagiarismResult } from '../../types/essay';
import { AutomaticGradingStatus } from './AutomaticGradingStatus';
import { useToast } from '@/components/ui/use-toast';

interface EssayGradingInterfaceProps {
  submission: EssaySubmission & {
    student: {
      id: string;
      name: string;
      email: string;
    };
    assessment: {
      title: string;
      question: {
        text: string;
        points: number;
        rubric?: EssayGradingCriterion[];
      };
    };
  };
  aiGradingResult?: AIGradingResult;
  plagiarismResult?: PlagiarismResult;
  onGrade: (grading: {
    criteriaScores: Array<{
      criterionId: string;
      score: number;
      feedback?: string;
    }>;
    overallFeedback?: string;
    totalScore: number;
  }) => Promise<void>;
  onRequestAIAssist?: () => Promise<void>;
  onSaveDraft?: (grading: any) => Promise<void>;
  readOnly?: boolean;
}

export const EssayGradingInterface: React.FC<EssayGradingInterfaceProps> = ({
  submission,
  aiGradingResult,
  plagiarismResult,
  onGrade,
  onRequestAIAssist,
  onSaveDraft,
  readOnly = false
}) => {
  const { toast } = useToast();
  const [criteriaScores, setCriteriaScores] = useState<Record<string, { score: number; feedback: string }>>(() => {
    const initial: Record<string, { score: number; feedback: string }> = {};
    submission.assessment.question.rubric?.forEach(criterion => {
      const existingScore = submission.manualGrading?.criteriaScores?.find(
        cs => cs.criterionId === criterion.id
      );
      initial[criterion.id] = {
        score: existingScore?.score || 0,
        feedback: existingScore?.feedback || ''
      };
    });
    return initial;
  });
  
  const [overallFeedback, setOverallFeedback] = useState(
    submission.manualGrading?.feedback || ''
  );
  const [isGrading, setIsGrading] = useState(false);
  const [activeTab, setActiveTab] = useState('grading');

  const rubric = submission.assessment.question.rubric || [];
  const totalPossibleScore = rubric.reduce((sum, criterion) => sum + criterion.maxScore, 0);
  const currentTotalScore = Object.values(criteriaScores).reduce((sum, cs) => sum + cs.score, 0);

  const updateCriterionScore = useCallback((criterionId: string, score: number, feedback: string) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: { score, feedback }
    }));
  }, []);

  const handleGrade = async () => {
    if (readOnly) return;

    setIsGrading(true);
    try {
      const gradingData = {
        criteriaScores: Object.entries(criteriaScores).map(([criterionId, data]) => ({
          criterionId,
          score: data.score,
          feedback: data.feedback
        })),
        overallFeedback,
        totalScore: currentTotalScore
      };

      await onGrade(gradingData);
      
      toast({
        title: "Essay graded",
        description: "The essay has been graded successfully.",
      });
    } catch (error) {
      toast({
        title: "Grading failed",
        description: "Failed to save the grade. Please try again.",
        variant: "error",
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft || readOnly) return;

    try {
      await onSaveDraft({
        criteriaScores: Object.entries(criteriaScores).map(([criterionId, data]) => ({
          criterionId,
          score: data.score,
          feedback: data.feedback
        })),
        overallFeedback,
        totalScore: currentTotalScore
      });
      
      toast({
        title: "Draft saved",
        description: "Your grading progress has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save draft. Please try again.",
        variant: "error",
      });
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const wordCount = submission.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>{submission.student.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{submission.student.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                <Award className="h-3 w-3 mr-1" />
                {wordCount} words
              </Badge>
              {submission.submittedAt && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {submission.submittedAt.toLocaleDateString()}
                </Badge>
              )}
              <Badge variant={currentTotalScore > 0 ? 'default' : 'secondary'}>
                {currentTotalScore}/{totalPossibleScore} points
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {plagiarismResult?.flagged && (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
          <ShieldIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Plagiarism Alert:</strong> This submission has {plagiarismResult.similarityPercentage}% similarity to other sources.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => setActiveTab('plagiarism')}>
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {aiGradingResult && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            AI grading suggestions are available.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => setActiveTab('ai-assist')}>
              View AI Analysis
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Automatic Grading Status */}
      <AutomaticGradingStatus
        submission={{
          id: submission.id || '',
          status: submission.status,
          score: submission.manualGrading?.score || submission.aiGrading?.overallScore || null,
          gradedAt: submission.manualGrading?.gradedAt || submission.aiGrading?.gradedAt || null,
          metadata: {
            gradingType: submission.aiGrading ? 'AUTOMATIC_AI' : 'MANUAL',
            aiGrading: submission.aiGrading
          }
        }}
        onRequestManualReview={() => {
          // Reset to manual grading mode
          setActiveTab('grading');
          toast({
            title: "Manual Review Mode",
            description: "Switched to manual grading mode for detailed review.",
          });
        }}
        onAcceptAIGrading={() => {
          if (submission.aiGrading) {
            // Use AI grading scores
            const criteriaScores = submission.aiGrading.criteriaScores.map(cs => ({
              criterionId: cs.criterionId,
              score: cs.score,
              feedback: cs.feedback || ''
            }));

            onGrade({
              criteriaScores,
              overallFeedback: submission.aiGrading.overallFeedback,
              totalScore: submission.aiGrading.overallScore
            });

            toast({
              title: "AI Grade Accepted",
              description: "The AI grading has been accepted and finalized.",
            });
          }
        }}
        onRejectAIGrading={() => {
          // Clear AI grading and switch to manual
          setActiveTab('grading');
          // Reset criteria scores
          Object.keys(criteriaScores).forEach(criterionId => {
            updateCriterionScore(criterionId, 0, '');
          });
          setOverallFeedback('');
          toast({
            title: "AI Grade Rejected",
            description: "AI grading rejected. Please provide manual grading.",
            variant: "error",
          });
        }}
        readOnly={readOnly}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Question and Essay */}
        <div className="space-y-6">
          {/* Question */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Question</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: submission.assessment.question.text }}
              />
            </CardContent>
          </Card>

          {/* Student Essay */}
          <Card>
            <CardHeader>
              <CardTitle>Student Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose dark:prose-invert max-w-none max-h-96 overflow-y-auto border rounded-md p-4"
                dangerouslySetInnerHTML={{ __html: submission.content }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Grading Interface */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="grading">Grading</TabsTrigger>
              <TabsTrigger value="ai-assist">AI Assist</TabsTrigger>
              <TabsTrigger value="plagiarism">Plagiarism</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="grading" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rubric Grading</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {rubric.map((criterion) => (
                    <div key={criterion.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{criterion.name}</h4>
                          {criterion.description && (
                            <p className="text-sm text-muted-foreground">{criterion.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">{criterion.maxScore} pts</Badge>
                      </div>

                      {/* Performance Levels */}
                      <div className="grid grid-cols-2 gap-2">
                        {criterion.levels.map((level) => (
                          <Button
                            key={level.id}
                            variant={criteriaScores[criterion.id]?.score === level.score ? 'default' : 'outline'}
                            size="sm"
                            className="h-auto p-3 text-left justify-start"
                            onClick={() => updateCriterionScore(
                              criterion.id, 
                              level.score, 
                              criteriaScores[criterion.id]?.feedback || ''
                            )}
                            disabled={readOnly}
                          >
                            <div>
                              <div className="font-medium">{level.name}</div>
                              <div className="text-xs opacity-70">{level.score} pts</div>
                              <div className="text-xs opacity-70 mt-1">{level.description}</div>
                            </div>
                          </Button>
                        ))}
                      </div>

                      {/* Custom Score Input */}
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`score-${criterion.id}`} className="text-sm">Custom Score:</Label>
                        <Input
                          id={`score-${criterion.id}`}
                          type="number"
                          min="0"
                          max={criterion.maxScore}
                          value={criteriaScores[criterion.id]?.score || 0}
                          onChange={(e) => updateCriterionScore(
                            criterion.id,
                            parseInt(e.target.value) || 0,
                            criteriaScores[criterion.id]?.feedback || ''
                          )}
                          className="w-20"
                          disabled={readOnly}
                        />
                        <span className="text-sm text-muted-foreground">/ {criterion.maxScore}</span>
                      </div>

                      {/* Feedback */}
                      <Textarea
                        placeholder="Feedback for this criterion..."
                        value={criteriaScores[criterion.id]?.feedback || ''}
                        onChange={(e) => updateCriterionScore(
                          criterion.id,
                          criteriaScores[criterion.id]?.score || 0,
                          e.target.value
                        )}
                        rows={2}
                        disabled={readOnly}
                      />
                    </div>
                  ))}

                  {/* Overall Feedback */}
                  <div className="space-y-2">
                    <Label htmlFor="overallFeedback">Overall Feedback</Label>
                    <Textarea
                      id="overallFeedback"
                      placeholder="Provide overall feedback for the student..."
                      value={overallFeedback}
                      onChange={(e) => setOverallFeedback(e.target.value)}
                      rows={4}
                      disabled={readOnly}
                    />
                  </div>

                  {/* Score Summary */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Total Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(currentTotalScore, totalPossibleScore)}`}>
                        {currentTotalScore} / {totalPossibleScore}
                      </span>
                    </div>
                    <Progress 
                      value={(currentTotalScore / totalPossibleScore) * 100} 
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round((currentTotalScore / totalPossibleScore) * 100)}%
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {!readOnly && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-2">
                        {onSaveDraft && (
                          <Button variant="outline" onClick={handleSaveDraft}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                          </Button>
                        )}
                        {onRequestAIAssist && (
                          <Button variant="outline" onClick={onRequestAIAssist}>
                            <Activity className="h-4 w-4 mr-2" />
                            Get AI Suggestions
                          </Button>
                        )}
                      </div>
                      <Button 
                        onClick={handleGrade}
                        disabled={isGrading || currentTotalScore === 0}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isGrading ? 'Grading...' : 'Submit Grade'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-assist" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>AI Grading Assistance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiGradingResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">AI Suggested Score</span>
                        <Badge variant="secondary">
                          {aiGradingResult.overallScore} / {aiGradingResult.maxScore}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {aiGradingResult.strengths.map((strength, index) => (
                              <li key={index} className="text-sm">{strength}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-orange-600 mb-2">Areas for Improvement</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {aiGradingResult.improvements.map((improvement, index) => (
                              <li key={index} className="text-sm">{improvement}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">AI Feedback</h4>
                          <p className="text-sm bg-muted p-3 rounded-md">
                            {aiGradingResult.overallFeedback}
                          </p>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          AI Confidence: {Math.round(aiGradingResult.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No AI analysis available</p>
                      {onRequestAIAssist && (
                        <Button variant="outline" className="mt-4" onClick={onRequestAIAssist}>
                          Request AI Analysis
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plagiarism" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShieldIcon className="h-5 w-5 text-red-600" />
                    <span>Plagiarism Check</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plagiarismResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Similarity Score</span>
                        <Badge variant={plagiarismResult.flagged ? 'destructive' : 'secondary'}>
                          {plagiarismResult.similarityPercentage}%
                        </Badge>
                      </div>

                      {plagiarismResult.sources.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Similar Sources</h4>
                          <div className="space-y-2">
                            {plagiarismResult.sources.slice(0, 5).map((source, index) => (
                              <div key={index} className="border rounded-md p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">{source.source}</span>
                                  <Badge variant="outline">{source.similarity}%</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{source.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Checked on {plagiarismResult.checkedAt.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShieldIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No plagiarism check performed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart className="h-5 w-5 text-purple-600" />
                    <span>Essay Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-md">
                      <div className="text-2xl font-bold">{wordCount}</div>
                      <div className="text-sm text-muted-foreground">Words</div>
                    </div>
                    <div className="text-center p-4 border rounded-md">
                      <div className="text-2xl font-bold">{submission.revisionCount}</div>
                      <div className="text-sm text-muted-foreground">Revisions</div>
                    </div>
                    {submission.timeSpent && (
                      <div className="text-center p-4 border rounded-md">
                        <div className="text-2xl font-bold">{Math.round(submission.timeSpent)}</div>
                        <div className="text-sm text-muted-foreground">Minutes</div>
                      </div>
                    )}
                    <div className="text-center p-4 border rounded-md">
                      <div className="text-2xl font-bold">
                        {totalPossibleScore > 0 ? Math.round((currentTotalScore / totalPossibleScore) * 100) : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Score</div>
                    </div>
                  </div>

                  {aiGradingResult?.bloomsLevelAnalysis && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Bloom's Taxonomy Analysis</h4>
                      <div className="space-y-2">
                        {Object.entries(aiGradingResult.bloomsLevelAnalysis).map(([level, score]) => (
                          <div key={level} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{level.toLowerCase()}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={score} className="w-20 h-2" />
                              <span className="text-sm w-8">{score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
