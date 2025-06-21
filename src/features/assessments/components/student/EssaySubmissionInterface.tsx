'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EssayRichTextEditor } from '../ui/EssayRichTextEditor';
import {
  FileText,
  Save,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Clock as TimerIcon,
  Award
} from 'lucide-react';
import { EssaySubmissionStatus } from '../../types/essay';
import { useToast } from '@/components/ui/use-toast';

interface EssaySubmissionInterfaceProps {
  assessmentId: string;
  questionId: string;
  question: {
    text: string;
    points: number;
    wordLimit?: { min?: number; max?: number };
    timeLimit?: number; // in minutes
    allowDrafts?: boolean;
    rubric?: Array<{
      name: string;
      description?: string;
      maxScore: number;
      levels: Array<{
        name: string;
        description: string;
        score: number;
      }>;
    }>;
  };
  existingSubmission?: {
    id: string;
    content: string;
    status: EssaySubmissionStatus;
    lastSavedAt: Date;
    submittedAt?: Date;
    wordCount: number;
  };
  onSave: (content: string, isDraft: boolean) => Promise<void>;
  onSubmit: (content: string) => Promise<void>;
  readOnly?: boolean;
}

export const EssaySubmissionInterface: React.FC<EssaySubmissionInterfaceProps> = ({
  assessmentId,
  questionId,
  question,
  existingSubmission,
  onSave,
  onSubmit,
  readOnly = false
}) => {
  const { toast } = useToast();
  const [content, setContent] = useState(existingSubmission?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(existingSubmission?.lastSavedAt || null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showRubric, setShowRubric] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<Date>(new Date());

  // Calculate word count
  const calculateWordCount = useCallback((text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    return plainText ? plainText.split(/\s+/).length : 0;
  }, []);

  // Update word count when content changes
  useEffect(() => {
    const count = calculateWordCount(content);
    setWordCount(count);
  }, [content, calculateWordCount]);

  // Auto-save functionality
  useEffect(() => {
    if (!question.allowDrafts || readOnly) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (content.trim() && content !== existingSubmission?.content) {
        handleSave(true);
      }
    }, 60000); // Auto-save every 60 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, question.allowDrafts, readOnly, existingSubmission?.content]);

  // Timer functionality
  useEffect(() => {
    if (!question.timeLimit || readOnly) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000 / 60);
      const remaining = question.timeLimit! - elapsed;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        // Auto-submit when time is up
        if (content.trim()) {
          handleSubmit();
        }
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [question.timeLimit, readOnly, content]);

  const handleSave = async (isAutoSave = false) => {
    if (readOnly) return;

    setIsSaving(true);
    try {
      await onSave(content, true);
      setLastSaved(new Date());
      
      if (!isAutoSave) {
        toast({
          title: "Draft saved",
          description: "Your work has been saved as a draft.",
        });
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save your work. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (readOnly) return;

    // Validation
    if (!content.trim()) {
      toast({
        title: "Cannot submit",
        description: "Please write your essay before submitting.",
        variant: "error",
      });
      return;
    }

    if (question.wordLimit?.min && wordCount < question.wordLimit.min) {
      toast({
        title: "Word count too low",
        description: `Your essay must be at least ${question.wordLimit.min} words. Current: ${wordCount}`,
        variant: "error",
      });
      return;
    }

    if (question.wordLimit?.max && wordCount > question.wordLimit.max) {
      toast({
        title: "Word count too high",
        description: `Your essay must not exceed ${question.wordLimit.max} words. Current: ${wordCount}`,
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      toast({
        title: "Essay submitted",
        description: "Your essay has been submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit your essay. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWordCountStatus = () => {
    if (!question.wordLimit) return 'default';
    
    const { min, max } = question.wordLimit;
    
    if (min && wordCount < min) return 'destructive';
    if (max && wordCount > max) return 'destructive';
    if (min && wordCount >= min && wordCount <= (max || Infinity)) return 'default';
    
    return 'default';
  };

  const getWordCountProgress = () => {
    if (!question.wordLimit?.max) return 0;
    return Math.min((wordCount / question.wordLimit.max) * 100, 100);
  };

  const isSubmitted = existingSubmission?.status === EssaySubmissionStatus.SUBMITTED;
  const canEdit = !readOnly && !isSubmitted;

  return (
    <div className="space-y-6">
      {/* Question Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <CardTitle>Essay Question</CardTitle>
              <Badge variant="secondary">{question.points} points</Badge>
            </div>
            {question.rubric && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRubric(!showRubric)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showRubric ? 'Hide' : 'Show'} Rubric
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: question.text }}
          />
          
          {/* Requirements */}
          <div className="mt-4 flex flex-wrap gap-2">
            {question.wordLimit?.min && (
              <Badge variant="outline">
                <Award className="h-3 w-3 mr-1" />
                Min: {question.wordLimit.min} words
              </Badge>
            )}
            {question.wordLimit?.max && (
              <Badge variant="outline">
                <Award className="h-3 w-3 mr-1" />
                Max: {question.wordLimit.max} words
              </Badge>
            )}
            {question.timeLimit && (
              <Badge variant="outline">
                <TimerIcon className="h-3 w-3 mr-1" />
                Time limit: {question.timeLimit} minutes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rubric Display */}
      {showRubric && question.rubric && (
        <Card>
          <CardHeader>
            <CardTitle>Grading Rubric</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {question.rubric.map((criterion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{criterion.name}</h4>
                    <Badge>{criterion.maxScore} points</Badge>
                  </div>
                  {criterion.description && (
                    <p className="text-sm text-muted-foreground mb-3">{criterion.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {criterion.levels.map((level, levelIndex) => (
                      <div key={levelIndex} className="border rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{level.name}</span>
                          <span className="text-xs text-muted-foreground">{level.score}pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{level.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status and Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Submission Status */}
          {existingSubmission && (
            <div className="flex items-center space-x-2">
              {isSubmitted ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">
                Status: {isSubmitted ? 'Submitted' : 'Draft'}
              </span>
            </div>
          )}

          {/* Last Saved */}
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Timer */}
        {timeRemaining !== null && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className={`text-sm font-medium ${timeRemaining <= 5 ? 'text-red-600' : 'text-orange-600'}`}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
            </span>
          </div>
        )}
      </div>

      {/* Essay Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Essay</CardTitle>
            <div className="flex items-center space-x-4">
              {/* Word Count */}
              <div className="text-right">
                <div className={`text-sm font-medium ${getWordCountStatus() === 'destructive' ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {wordCount} words
                </div>
                {question.wordLimit?.max && (
                  <Progress 
                    value={getWordCountProgress()} 
                    className="w-20 h-2"
                  />
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <EssayRichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your essay here..."
              minHeight="400px"
              disabled={!canEdit}
              preventPaste={true}
            />
          ) : (
            <div 
              className="prose dark:prose-invert max-w-none min-h-[400px] p-4 border rounded-md bg-muted/50"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {/* Word Count Warnings */}
          {question.wordLimit && (
            <div className="mt-4">
              {question.wordLimit.min && wordCount < question.wordLimit.min && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your essay is below the minimum word count of {question.wordLimit.min} words.
                  </AlertDescription>
                </Alert>
              )}
              {question.wordLimit.max && wordCount > question.wordLimit.max && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your essay exceeds the maximum word count of {question.wordLimit.max} words.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {question.allowDrafts && (
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isSaving || !content.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Essay'}
          </Button>
        </div>
      )}

      {/* Submission Confirmation */}
      {isSubmitted && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your essay has been submitted successfully. 
            {existingSubmission?.submittedAt && (
              <span className="block text-sm text-muted-foreground mt-1">
                Submitted on {existingSubmission.submittedAt.toLocaleString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
