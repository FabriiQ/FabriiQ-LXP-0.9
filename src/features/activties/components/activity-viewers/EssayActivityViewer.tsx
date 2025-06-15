'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // Assuming this exists
import { Progress } from "@/components/ui/progress"; // Assuming this exists for loading

import { EssayActivity } from '../../models/essay';
import { EssayRubricCriterion, EssayRubricLevel } from '../../../question-bank/models/types';
import { RichTextEditor } from '../ui/RichTextEditor';
import { gradeEssayActivity } from '../../grading/essay';
import { GradingResult } from '../../models/base';

interface EssayActivityViewerProps {
  activity: EssayActivity;
  studentSubmission?: string;
  onAutoGradeComplete: (gradingResult: GradingResult) => void;
  initialMode?: 'view' | 'submit' | 'graded';
  initialGradingResult?: GradingResult;
}

export const EssayActivityViewer: React.FC<EssayActivityViewerProps> = ({
  activity,
  studentSubmission,
  onAutoGradeComplete,
  initialMode,
  initialGradingResult,
}) => {
  const [essayText, setEssayText] = useState<string>(''); // Initialize empty, useEffect will set
  const [wordCount, setWordCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'view' | 'submit' | 'graded'>(
    initialMode || (initialGradingResult ? 'graded' : (studentSubmission ? 'view' : 'submit'))
  );
  const [currentGradingResult, setCurrentGradingResult] = useState<GradingResult | undefined>(initialGradingResult);

  useEffect(() => {
    if (initialGradingResult) {
        setCurrentGradingResult(initialGradingResult);
        setEssayText(studentSubmission || ''); // Show submission if graded
        setCurrentMode('graded');
    } else if (studentSubmission) {
        setEssayText(studentSubmission);
        setCurrentMode('view');
    } else {
        setCurrentMode('submit');
        setEssayText(''); // Ensure editor is clear for new submission
    }
  }, [initialGradingResult, studentSubmission]);

  useEffect(() => {
    const words = essayText.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [essayText]);

  const handleSubmitClick = async () => {
    if (currentMode === 'submit' && canSubmit()) {
      setIsLoading(true);
      try {
        const result = await gradeEssayActivity(activity, essayText);
        setCurrentGradingResult(result);
        onAutoGradeComplete(result);
        setCurrentMode('graded');
      } catch (error) {
        console.error("Error grading essay:", error);
        // TODO: Display error to user (e.g., toast notification)
        alert(`Error grading essay: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canSubmit = () => {
    if (currentMode !== 'submit') return false;
    if (activity.wordCountMin && wordCount < activity.wordCountMin) return false;
    if (activity.wordCountMax && wordCount > activity.wordCountMax) return false;
    return essayText.trim().length > 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{activity.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.description && <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>}
          {activity.instructions && <p className="mb-4 whitespace-pre-wrap">{activity.instructions}</p>}

          <div className="prose dark:prose-invert max-w-none mb-4 p-4 border rounded-md bg-background">
            <h3>Essay Prompt</h3>
            <div dangerouslySetInnerHTML={{ __html: activity.prompt }} />
          </div>

          {activity.rubric && (currentMode === 'submit' || currentMode === 'graded') && (
            <Card className="mb-4 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Grading Rubric (Total: {activity.rubric.totalPoints} points)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  {activity.rubric.criteria.map((criterion: EssayRubricCriterion) => (
                    <div key={criterion.id} className="mb-3 p-2 border rounded bg-background">
                      <h4 className="font-semibold">{criterion.name} ({criterion.points} pts)</h4>
                      <p className="text-xs text-muted-foreground mb-1">{criterion.description}</p>
                      <ul className="list-disc pl-5 text-xs">
                        {criterion.levels.map((level: EssayRubricLevel) => (
                          <li key={level.id}>
                            <strong>{level.name} ({level.points} pts):</strong> {level.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-2">
            <p>Grading your essay, please wait...</p>
            <Progress value={50} className="w-1/2 animate-pulse" /> {/* Indeterminate or pulsing progress */}
        </div>
      )}

      {currentMode === 'submit' && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Your Essay</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={essayText}
              onChange={setEssayText}
              placeholder="Start writing your essay here..."
              minHeight="300px"
            />
            <div className="mt-2 text-sm text-muted-foreground flex justify-between">
              <span>Word Count: {wordCount}</span>
              <span>
                {activity.wordCountMin && `Min: ${activity.wordCountMin} `}
                {activity.wordCountMax && `Max: ${activity.wordCountMax}`}
              </span>
            </div>
            {activity.wordCountMin && wordCount < activity.wordCountMin && essayText.trim().length > 0 && (
               <p className="text-xs text-red-500 mt-1">
                   Your essay is below the minimum word count of {activity.wordCountMin}.
               </p>
            )}
            {activity.wordCountMax && wordCount > activity.wordCountMax && (
               <p className="text-xs text-red-500 mt-1">
                   Your essay is above the maximum word count of {activity.wordCountMax}.
               </p>
            )}
          </CardContent>
        </Card>
      )}

      {currentMode === 'view' && !isLoading && (
        <Card>
          <CardHeader><CardTitle>Your Submission</CardTitle></CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted" dangerouslySetInnerHTML={{ __html: studentSubmission || essayText }} />
          </CardContent>
        </Card>
      )}

      {currentMode === 'graded' && currentGradingResult && !isLoading && (
        <Card>
          <CardHeader><CardTitle>Grading Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p><strong>Overall Score:</strong> {currentGradingResult.score.toFixed(2)} / {currentGradingResult.maxScore.toFixed(2)} ({currentGradingResult.percentage.toFixed(2)}%)</p>
            <p><strong>Status:</strong> {currentGradingResult.passed ? 'Passed' : 'Failed'}</p>
            {currentGradingResult.overallFeedback && <p><strong>Overall Feedback from AI:</strong> <span className="whitespace-pre-wrap">{currentGradingResult.overallFeedback}</span></p>}

            <h4 className="font-semibold mt-4 text-md">Criteria Breakdown:</h4>
            <ScrollArea className="h-[300px] pr-3 border rounded-md p-3 bg-muted/20">
               {currentGradingResult.questionResults[0]?.feedback?.split('\n---\n')
                 .filter(fb => fb.trim().length > 0 && !fb.startsWith("Overall Feedback from AI Assistant:")) // Filter out empty and overall summary
                 .map((critFeedback, index) => (
                   <div key={index} className="p-3 border rounded mb-3 bg-background shadow-sm">
                       <pre className="whitespace-pre-wrap text-sm font-sans">{critFeedback.trim()}</pre>
                   </div>
               ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {currentMode === 'submit' && !isLoading && (
        <div className="flex justify-end">
          <Button onClick={handleSubmitClick} disabled={!canSubmit() || isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Essay for Grading'}
          </Button>
        </div>
      )}
    </div>
  );
};
