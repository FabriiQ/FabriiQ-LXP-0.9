'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import {
  FileText,
  Plus,
  Trash2,
  Settings,
  Activity,
  CheckCircle,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';
import { EssayGradingCriterion, AIGradingMode } from '../../types/essay';

interface EssayQuestionEditorProps {
  question: {
    id?: string;
    text: string;
    points: number;
    wordLimit?: { min?: number; max?: number };
    timeLimit?: number;
    allowDrafts?: boolean;
    enablePlagiarismCheck?: boolean;
    plagiarismThreshold?: number;
    enableAIGrading?: boolean;
    aiGradingMode?: AIGradingMode;
    rubric?: EssayGradingCriterion[];
    sampleAnswer?: string;
    keywordsConcepts?: string[];
  };
  onChange: (question: any) => void;
  onRemove?: () => void;
}

export const EssayQuestionEditor: React.FC<EssayQuestionEditorProps> = ({
  question,
  onChange,
  onRemove
}) => {
  const [activeTab, setActiveTab] = useState('question');

  const updateQuestion = useCallback((updates: Partial<typeof question>) => {
    onChange({ ...question, ...updates });
  }, [question, onChange]);

  const updateRubric = useCallback((rubric: EssayGradingCriterion[]) => {
    updateQuestion({ rubric });
  }, [updateQuestion]);

  const addCriterion = useCallback(() => {
    const newCriterion: EssayGradingCriterion = {
      id: `criterion_${Date.now()}`,
      name: 'New Criterion',
      description: '',
      weight: 1,
      maxScore: 10,
      levels: [
        {
          id: `level_${Date.now()}_4`,
          name: 'Excellent',
          description: 'Exceeds expectations',
          score: 10
        },
        {
          id: `level_${Date.now()}_3`,
          name: 'Good',
          description: 'Meets expectations',
          score: 8
        },
        {
          id: `level_${Date.now()}_2`,
          name: 'Satisfactory',
          description: 'Partially meets expectations',
          score: 6
        },
        {
          id: `level_${Date.now()}_1`,
          name: 'Needs Improvement',
          description: 'Below expectations',
          score: 4
        }
      ]
    };

    const updatedRubric = [...(question.rubric || []), newCriterion];
    updateRubric(updatedRubric);
  }, [question.rubric, updateRubric]);

  const updateCriterion = useCallback((index: number, updates: Partial<EssayGradingCriterion>) => {
    const updatedRubric = [...(question.rubric || [])];
    updatedRubric[index] = { ...updatedRubric[index], ...updates };
    updateRubric(updatedRubric);
  }, [question.rubric, updateRubric]);

  const removeCriterion = useCallback((index: number) => {
    const updatedRubric = [...(question.rubric || [])];
    updatedRubric.splice(index, 1);
    updateRubric(updatedRubric);
  }, [question.rubric, updateRubric]);

  const totalPoints = (question.rubric || []).reduce((sum, criterion) => sum + criterion.maxScore, 0);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg">Essay Question</CardTitle>
          <Badge variant="secondary">{totalPoints} points</Badge>
        </div>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="rubric">Rubric</TabsTrigger>
            <TabsTrigger value="ai-settings">AI & Plagiarism</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="space-y-4">
            <div>
              <Label htmlFor="questionText">Question Text *</Label>
              <RichTextEditor
                content={question.text}
                onChange={(text) => updateQuestion({ text })}
                placeholder="Enter your essay question..."
                minHeight="120px"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="points">Points *</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={question.timeLimit || ''}
                  onChange={(e) => updateQuestion({ timeLimit: parseInt(e.target.value) || undefined })}
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minWords">Minimum Words</Label>
                <Input
                  id="minWords"
                  type="number"
                  min="0"
                  value={question.wordLimit?.min || ''}
                  onChange={(e) => updateQuestion({ 
                    wordLimit: { 
                      ...question.wordLimit, 
                      min: parseInt(e.target.value) || undefined 
                    }
                  })}
                  placeholder="No minimum"
                />
              </div>
              <div>
                <Label htmlFor="maxWords">Maximum Words</Label>
                <Input
                  id="maxWords"
                  type="number"
                  min="1"
                  value={question.wordLimit?.max || ''}
                  onChange={(e) => updateQuestion({ 
                    wordLimit: { 
                      ...question.wordLimit, 
                      max: parseInt(e.target.value) || undefined 
                    }
                  })}
                  placeholder="No maximum"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowDrafts"
                checked={question.allowDrafts ?? true}
                onCheckedChange={(checked) => updateQuestion({ allowDrafts: checked })}
              />
              <Label htmlFor="allowDrafts">Allow students to save drafts</Label>
            </div>
          </TabsContent>

          <TabsContent value="rubric" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Grading Rubric</h3>
                <p className="text-sm text-muted-foreground">
                  Define criteria and performance levels for grading
                </p>
              </div>
              <Button onClick={addCriterion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Criterion
              </Button>
            </div>

            {question.rubric?.map((criterion, index) => (
              <Card key={criterion.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Input
                      value={criterion.name}
                      onChange={(e) => updateCriterion(index, { name: e.target.value })}
                      placeholder="Criterion name"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={criterion.maxScore}
                      onChange={(e) => updateCriterion(index, { maxScore: parseInt(e.target.value) || 0 })}
                      placeholder="Max points"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={criterion.weight}
                      onChange={(e) => updateCriterion(index, { weight: parseInt(e.target.value) || 1 })}
                      placeholder="Weight"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCriterion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  value={criterion.description || ''}
                  onChange={(e) => updateCriterion(index, { description: e.target.value })}
                  placeholder="Describe what this criterion evaluates..."
                  className="mb-3"
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Performance Levels</Label>
                  {criterion.levels.map((level, levelIndex) => (
                    <div key={level.id} className="grid grid-cols-4 gap-2 items-center">
                      <Input
                        value={level.name}
                        onChange={(e) => {
                          const updatedLevels = [...criterion.levels];
                          updatedLevels[levelIndex] = { ...level, name: e.target.value };
                          updateCriterion(index, { levels: updatedLevels });
                        }}
                        placeholder="Level name"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={level.score}
                        onChange={(e) => {
                          const updatedLevels = [...criterion.levels];
                          updatedLevels[levelIndex] = { ...level, score: parseInt(e.target.value) || 0 };
                          updateCriterion(index, { levels: updatedLevels });
                        }}
                        placeholder="Points"
                        className="text-sm"
                      />
                      <Input
                        value={level.description}
                        onChange={(e) => {
                          const updatedLevels = [...criterion.levels];
                          updatedLevels[levelIndex] = { ...level, description: e.target.value };
                          updateCriterion(index, { levels: updatedLevels });
                        }}
                        placeholder="Description"
                        className="text-sm col-span-2"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {(!question.rubric || question.rubric.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rubric criteria defined</p>
                <p className="text-sm">Add criteria to enable structured grading</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-settings" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">AI Grading</h3>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableAIGrading"
                  checked={question.enableAIGrading ?? false}
                  onCheckedChange={(checked) => updateQuestion({ enableAIGrading: checked })}
                />
                <Label htmlFor="enableAIGrading">Enable AI-assisted grading</Label>
              </div>

              {question.enableAIGrading && (
                <div className="ml-6 space-y-3">
                  <div>
                    <Label htmlFor="aiGradingMode">AI Grading Mode</Label>
                    <select
                      id="aiGradingMode"
                      value={question.aiGradingMode || AIGradingMode.DISABLED}
                      onChange={(e) => updateQuestion({ aiGradingMode: e.target.value as AIGradingMode })}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value={AIGradingMode.MANUAL}>Manual - Teacher grades manually</option>
                      <option value={AIGradingMode.ASSIST}>Assist - AI provides suggestions</option>
                      <option value={AIGradingMode.AUTO}>Auto - AI grades with teacher review</option>
                      <option value={AIGradingMode.AUTOMATIC}>Automatic - AI grades immediately on submission</option>
                    </select>
                  </div>

                  {question.aiGradingMode === AIGradingMode.AUTOMATIC && (
                    <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Automatic AI Grading</span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Essays will be automatically graded by AI immediately upon submission.
                        Teachers can review and adjust grades later if needed.
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="sampleAnswer">Sample Answer (Optional)</Label>
                    <Textarea
                      id="sampleAnswer"
                      value={question.sampleAnswer || ''}
                      onChange={(e) => updateQuestion({ sampleAnswer: e.target.value })}
                      placeholder="Provide a sample answer to help AI grading..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="keywords">Key Concepts (Optional)</Label>
                    <Input
                      id="keywords"
                      value={question.keywordsConcepts?.join(', ') || ''}
                      onChange={(e) => updateQuestion({ 
                        keywordsConcepts: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      })}
                      placeholder="concept1, concept2, concept3..."
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-medium">Plagiarism Detection</h3>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enablePlagiarismCheck"
                  checked={question.enablePlagiarismCheck ?? false}
                  onCheckedChange={(checked) => updateQuestion({ enablePlagiarismCheck: checked })}
                />
                <Label htmlFor="enablePlagiarismCheck">Enable plagiarism detection</Label>
              </div>

              {question.enablePlagiarismCheck && (
                <div className="ml-6">
                  <Label htmlFor="plagiarismThreshold">Similarity Threshold (%)</Label>
                  <Input
                    id="plagiarismThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={question.plagiarismThreshold || 20}
                    onChange={(e) => updateQuestion({ plagiarismThreshold: parseInt(e.target.value) || 20 })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Essays with similarity above this threshold will be flagged for review
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium">Advanced Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Auto-save Settings</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Student work will be automatically saved every 60 seconds
                </p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Auto-save enabled</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Submission Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="allowLateSubmission" defaultChecked />
                    <Label htmlFor="allowLateSubmission" className="text-sm">Allow late submissions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="showWordCount" defaultChecked />
                    <Label htmlFor="showWordCount" className="text-sm">Show word count to students</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="allowFileAttachments" />
                    <Label htmlFor="allowFileAttachments" className="text-sm">Allow file attachments</Label>
                  </div>
                </div>
              </div>

              {(question.enableAIGrading || question.enablePlagiarismCheck) && (
                <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">AI Features Notice</h4>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    AI grading and plagiarism detection require additional processing time. 
                    Results may take a few minutes to appear after submission.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
