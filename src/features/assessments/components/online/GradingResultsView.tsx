'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/atoms/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, AlertCircle } from 'lucide-react';
import { Question } from '../../types/question';
import { GradingResult } from '../../types/grading';
import { QuestionRenderer } from './QuestionRenderer';

interface GradingResultsViewProps {
  assessment: {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
    maxScore: number;
    passingScore?: number;
  };
  answers: Record<string, any>;
  gradingResults: {
    questionResults: Record<string, GradingResult>;
    totalScore: number;
    maxScore: number;
    percentageScore: number;
    requiresManualGrading: boolean;
  };
  className?: string;
}

export function GradingResultsView({
  assessment,
  answers,
  gradingResults,
  className = '',
}: GradingResultsViewProps) {
  const { questionResults, totalScore, maxScore, percentageScore, requiresManualGrading } = gradingResults;
  const isPassing = assessment.passingScore ? totalScore >= assessment.passingScore : true;

  // Get grade letter based on percentage
  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{assessment.title} - Results</CardTitle>
            <CardDescription>
              {assessment.description}
            </CardDescription>
          </div>

          <Badge variant={isPassing ? 'success' : 'destructive'}>
            {isPassing ? 'Passed' : 'Failed'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Overall score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Overall Score</h3>
            <div className="text-2xl font-bold">
              {totalScore}/{maxScore} ({Math.round(percentageScore)}%)
            </div>
          </div>

          <Progress
            value={percentageScore}
            className="h-2"
            indicatorClassName={isPassing ? "bg-green-500" : "bg-red-500"}
          />

          <div className="flex items-center justify-between text-sm">
            <span>Grade: {getGradeLetter(percentageScore)}</span>
            {assessment.passingScore && (
              <span>
                Passing Score: {assessment.passingScore}/{maxScore} ({Math.round((assessment.passingScore / maxScore) * 100)}%)
              </span>
            )}
          </div>

          {requiresManualGrading && (
            <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                Some questions require manual grading. Your final score may change after teacher review.
              </span>
            </div>
          )}
        </div>

        {/* Question results */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Question Results</h3>

          {assessment.questions.map((question, index) => {
            const questionId = question.id || '';
            const result = questionResults[questionId];

            if (!questionId || !result) return null;

            return (
              <div key={questionId} className="border rounded-md overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                  <div className="flex items-center">
                    {result.isCorrect ? (
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="font-medium">Question {index + 1}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {result.score}/{result.maxScore} points
                  </div>
                </div>

                <div className="p-4">
                  <QuestionRenderer
                    question={question}
                    value={answers[questionId]}
                    onChange={() => {}} // Read-only
                    readOnly={true}
                  />

                  {result.feedback && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${
                      result.isCorrect
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      <p className="font-medium mb-1">Feedback:</p>
                      <p>{result.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="border-t p-6">
        <div className="text-sm text-gray-500">
          This assessment was automatically graded on {new Date().toLocaleDateString()}.
        </div>
      </CardFooter>
    </Card>
  );
}
