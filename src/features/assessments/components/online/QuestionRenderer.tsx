'use client';

import React from 'react';
import { Question, QuestionType } from '../../types/question';
import { MultipleChoiceRenderer } from './renderers/MultipleChoiceRenderer';
import { ShortAnswerRenderer } from './renderers/ShortAnswerRenderer';
import { EssayRenderer } from './renderers/EssayRenderer';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  readOnly = false,
}: QuestionRendererProps) {
  // Render the appropriate question type component
  const renderQuestionByType = () => {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceRenderer
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
          />
        );
      case QuestionType.SHORT_ANSWER:
        return (
          <ShortAnswerRenderer
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
          />
        );
      case QuestionType.ESSAY:
        return (
          <EssayRenderer
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
          />
        );
      // Add more question types as they are implemented
      default:
        return (
          <div className="p-4 border rounded-md bg-gray-50">
            <p>Unsupported question type: {question.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">{question.text}</div>
      {question.bloomsLevel && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
          Bloom's Level: {question.bloomsLevel}
        </div>
      )}
      {renderQuestionByType()}
    </div>
  );
}
