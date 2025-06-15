'use client';

import React from 'react';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Question, QuestionType } from '../../../types/question';

interface EssayRendererProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function EssayRenderer({
  question,
  value,
  onChange,
  readOnly = false,
}: EssayRendererProps) {
  // Type guard for essay questions
  const isEssayQuestion = question.type === QuestionType.ESSAY;

  // Custom properties for essay questions
  const maxLength: number | undefined = isEssayQuestion && 'maxLength' in question ?
    (question.maxLength as number) : undefined;

  // Type for rubric criteria
  interface RubricCriterion {
    criterion: string;
    points: number;
  }

  const rubric: RubricCriterion[] | undefined = isEssayQuestion && 'rubric' in question ?
    (question.rubric as RubricCriterion[]) : undefined;

  return (
    <div className="space-y-2">
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer here..."
        className="min-h-[200px] w-full"
        disabled={readOnly}
      />

      {maxLength && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Maximum length: {maxLength} characters</span>
          <span>{value?.length || 0} / {maxLength}</span>
        </div>
      )}

      {rubric && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium mb-2">Grading Criteria:</p>
          <ul className="text-sm space-y-1 list-disc pl-5">
            {Array.isArray(rubric) && rubric.map((criterion, index) => (
              <li key={index}>
                {criterion.criterion} ({criterion.points} points)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
