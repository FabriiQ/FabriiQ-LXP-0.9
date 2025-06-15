'use client';

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Question, QuestionType } from '../../../types/question';

interface MultipleChoiceRendererProps {
  question: Question;
  value: string | null;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function MultipleChoiceRenderer({
  question,
  value,
  onChange,
  readOnly = false,
}: MultipleChoiceRendererProps) {
  // Ensure the question has choices
  const options = question.type === QuestionType.MULTIPLE_CHOICE
    ? question.choices || []
    : [];

  return (
    <RadioGroup
      value={value || ''}
      onValueChange={onChange}
      disabled={readOnly}
      className="space-y-3"
    >
      {options.map((option) => (
        <div key={option.id} className="flex items-start space-x-2 p-3 rounded-md hover:bg-gray-50">
          <RadioGroupItem
            value={option.id || ''}
            id={`option-${option.id}`}
            disabled={readOnly}
          />
          <Label
            htmlFor={`option-${option.id}`}
            className="cursor-pointer flex-1"
          >
            {option.text}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
