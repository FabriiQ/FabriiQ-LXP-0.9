'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { ShortAnswerContent } from '../../models/types';

interface ShortAnswerEditorProps {
  content: ShortAnswerContent;
  onChange: (content: ShortAnswerContent) => void;
}

/**
 * Short Answer Question Editor for Question Bank
 * 
 * This component provides an interface for creating and editing
 * short answer questions with:
 * - Question text editing
 * - Multiple correct answers
 * - Case sensitivity option
 * - Explanation and hint fields
 * - Media attachment
 */
export const ShortAnswerEditor: React.FC<ShortAnswerEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<ShortAnswerContent>(
    content.text ? content : {
      text: 'What is the capital of France?',
      correctAnswers: ['Paris', 'paris'],
      caseSensitive: false,
      explanation: 'The capital of France is Paris.',
      hint: 'Think of the Eiffel Tower.'
    }
  );

  // Update the local content and call onChange
  const updateContent = (updates: Partial<ShortAnswerContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle question text change
  const handleQuestionTextChange = (text: string) => {
    updateContent({ text });
  };

  // Handle case sensitivity change
  const handleCaseSensitivityChange = (checked: boolean) => {
    updateContent({ caseSensitive: checked });
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (index: number, value: string) => {
    const newCorrectAnswers = [...localContent.correctAnswers];
    newCorrectAnswers[index] = value;
    updateContent({ correctAnswers: newCorrectAnswers });
  };

  // Add a new correct answer
  const handleAddCorrectAnswer = () => {
    updateContent({
      correctAnswers: [...localContent.correctAnswers, '']
    });
  };

  // Remove a correct answer
  const handleRemoveCorrectAnswer = (index: number) => {
    const newCorrectAnswers = [...localContent.correctAnswers];
    newCorrectAnswers.splice(index, 1);
    updateContent({ correctAnswers: newCorrectAnswers });
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
            <div className="flex items-center justify-between mb-2">
              <Label className="block">Correct Answers</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="caseSensitive"
                  checked={localContent.caseSensitive || false}
                  onCheckedChange={handleCaseSensitivityChange}
                />
                <Label htmlFor="caseSensitive" className="text-sm font-normal">
                  Case sensitive
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              {localContent.correctAnswers.map((answer, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={answer}
                    onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                    placeholder={`Correct answer ${index + 1}`}
                    className="flex-grow"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCorrectAnswer(index)}
                    disabled={localContent.correctAnswers.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCorrectAnswer}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Answer
            </Button>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Add multiple correct answers to account for different ways students might express the same answer.
              {!localContent.caseSensitive && " Answers are not case sensitive."}
            </p>
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

export default ShortAnswerEditor;
