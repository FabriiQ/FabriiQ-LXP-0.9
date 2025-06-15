'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { NumericContent } from '../../models/types';

interface NumericEditorProps {
  content: NumericContent;
  onChange: (content: NumericContent) => void;
}

/**
 * Numeric Question Editor for Question Bank
 * 
 * This component provides an interface for creating and editing
 * numeric questions with:
 * - Question text editing
 * - Correct answer configuration
 * - Acceptable range configuration
 * - Unit specification
 * - Explanation and hint fields
 * - Media attachment
 */
export const NumericEditor: React.FC<NumericEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<NumericContent>(
    content.text ? content : {
      text: 'What is the value of π (pi) to 2 decimal places?',
      correctAnswer: 3.14,
      acceptableRange: {
        min: 3.13,
        max: 3.15
      },
      unit: '',
      explanation: 'The value of π (pi) is approximately 3.14159...',
      hint: 'Round to 2 decimal places.'
    }
  );

  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<{
    correctAnswer?: string;
    acceptableRange?: string;
  }>({});

  // Update the local content and call onChange
  const updateContent = (updates: Partial<NumericContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle question text change
  const handleQuestionTextChange = (text: string) => {
    updateContent({ text });
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateContent({ correctAnswer: value });
      
      // Clear validation error when user starts typing
      if (validationErrors.correctAnswer) {
        setValidationErrors({ ...validationErrors, correctAnswer: undefined });
      }
    }
  };

  // Handle unit change
  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateContent({ unit: e.target.value });
  };

  // Handle min range change
  const handleMinRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateContent({
        acceptableRange: {
          min: value,
          max: localContent.acceptableRange?.max ?? localContent.correctAnswer
        }
      });
      
      // Clear validation error when user starts typing
      if (validationErrors.acceptableRange) {
        setValidationErrors({ ...validationErrors, acceptableRange: undefined });
      }
    }
  };

  // Handle max range change
  const handleMaxRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateContent({
        acceptableRange: {
          min: localContent.acceptableRange?.min ?? localContent.correctAnswer,
          max: value
        }
      });
      
      // Clear validation error when user starts typing
      if (validationErrors.acceptableRange) {
        setValidationErrors({ ...validationErrors, acceptableRange: undefined });
      }
    }
  };

  // Handle explanation change
  const handleExplanationChange = (explanation: string) => {
    updateContent({ explanation });
  };

  // Handle hint change
  const handleHintChange = (hint: string) => {
    updateContent({ hint });
  };

  // Handle media change
  const handleMediaChange = (media?: any) => {
    // Convert MediaItem to QuestionMedia if needed
    if (media) {
      const questionMedia = {
        type: media.type,
        url: media.url,
        alt: media.alt,
        caption: media.caption
      };
      updateContent({ media: questionMedia });
    } else {
      updateContent({ media: undefined });
    }
  };

  // Validate numeric inputs
  const validateNumericInputs = () => {
    const errors: { correctAnswer?: string; acceptableRange?: string } = {};
    
    // Validate correct answer
    if (isNaN(localContent.correctAnswer)) {
      errors.correctAnswer = 'Please enter a valid number';
    }
    
    // Validate acceptable range
    if (localContent.acceptableRange) {
      const { min, max } = localContent.acceptableRange;
      
      if (isNaN(min) || isNaN(max)) {
        errors.acceptableRange = 'Please enter valid numbers for the range';
      } else if (min > max) {
        errors.acceptableRange = 'Minimum value must be less than or equal to maximum value';
      } else if (min > localContent.correctAnswer || max < localContent.correctAnswer) {
        errors.acceptableRange = 'The correct answer must be within the acceptable range';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Label htmlFor="questionText" className="mb-2 block">Question Text</Label>
            <RichTextEditor
              content={localContent.text}
              onChange={handleQuestionTextChange}
              placeholder="Enter your question"
              minHeight="100px"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="correctAnswer" className="mb-2 block">Correct Answer</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Input
                  id="correctAnswer"
                  type="number"
                  value={localContent.correctAnswer}
                  onChange={handleCorrectAnswerChange}
                  onBlur={validateNumericInputs}
                  step="any"
                  className={validationErrors.correctAnswer ? 'border-red-500' : ''}
                />
                {validationErrors.correctAnswer && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.correctAnswer}</p>
                )}
              </div>
              <div className="w-1/4">
                <Input
                  id="unit"
                  type="text"
                  value={localContent.unit || ''}
                  onChange={handleUnitChange}
                  placeholder="Unit (optional)"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the correct numeric answer. Add a unit if applicable (e.g., "kg", "m/s").
            </p>
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Acceptable Range (Optional)</Label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full sm:w-1/2">
                  <Label className="mb-2 block text-sm">Minimum</Label>
                  <Input
                    type="number"
                    value={localContent.acceptableRange?.min ?? ''}
                    onChange={handleMinRangeChange}
                    onBlur={validateNumericInputs}
                    step="any"
                    className={validationErrors.acceptableRange ? 'border-red-500' : ''}
                    placeholder="Min value"
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <Label className="mb-2 block text-sm">Maximum</Label>
                  <Input
                    type="number"
                    value={localContent.acceptableRange?.max ?? ''}
                    onChange={handleMaxRangeChange}
                    onBlur={validateNumericInputs}
                    step="any"
                    className={validationErrors.acceptableRange ? 'border-red-500' : ''}
                    placeholder="Max value"
                  />
                </div>
              </div>
              {validationErrors.acceptableRange && (
                <p className="text-red-500 text-xs mt-2">{validationErrors.acceptableRange}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                If left empty, only the exact answer will be accepted.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Explain the correct answer"
              minHeight="100px"
              simple={true}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="hint" className="mb-2 block">Hint (Optional)</Label>
            <RichTextEditor
              content={localContent.hint || ''}
              onChange={handleHintChange}
              placeholder="Provide a hint for students"
              minHeight="100px"
              simple={true}
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Media (Optional)</Label>
            <MediaSelector
              media={localContent.media ? 
                {
                  type: localContent.media.type as 'image' | 'video' | 'audio',
                  url: localContent.media.url || '',
                  alt: localContent.media.alt,
                  caption: localContent.media.caption
                } : undefined
              }
              onChange={handleMediaChange}
              allowedTypes={['image', 'video', 'audio']}
              enableJinaAI={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NumericEditor;
