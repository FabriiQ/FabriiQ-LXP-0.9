'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Question, QuestionType } from '../../../types/question';

interface ShortAnswerRendererProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function ShortAnswerRenderer({
  question,
  value,
  onChange,
  readOnly = false,
}: ShortAnswerRendererProps) {
  // Type guard for short answer questions
  const isShortAnswerQuestion = question.type === QuestionType.SHORT_ANSWER;

  // Custom properties for short answer questions
  const maxLength: number | undefined = isShortAnswerQuestion && 'maxLength' in question ?
    (question.maxLength as number) : undefined;

  return (
    <div className="space-y-2">
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer here..."
        disabled={readOnly}
        className="w-full"
      />

      {maxLength && (
        <p className="text-xs text-gray-500">
          Maximum length: {maxLength} characters
        </p>
      )}
    </div>
  );
}
