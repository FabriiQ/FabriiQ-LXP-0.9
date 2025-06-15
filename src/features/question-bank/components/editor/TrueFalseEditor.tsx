'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { TrueFalseContent } from '../../models/types';

interface TrueFalseEditorProps {
  content: TrueFalseContent;
  onChange: (content: TrueFalseContent) => void;
}

/**
 * True/False Question Editor for Question Bank
 *
 * This component provides an interface for creating and editing
 * true/false questions with:
 * - Question text editing
 * - True/False selection
 * - Explanation and hint fields
 * - Media attachment
 */
export const TrueFalseEditor: React.FC<TrueFalseEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<TrueFalseContent>(
    content.text ? content : {
      text: '',
      isTrue: true
    }
  );

  // Update the local content and call onChange
  const updateContent = (updates: Partial<TrueFalseContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle question text change
  const handleQuestionTextChange = (text: string) => {
    updateContent({ text });
  };

  // Handle true/false selection
  const handleTrueFalseChange = (value: string) => {
    updateContent({ isTrue: value === 'true' });
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
            <Label htmlFor="questionText" className="mb-2 block">Statement</Label>
            <RichTextEditor
              content={localContent.text}
              onChange={handleQuestionTextChange}
              placeholder="Enter your statement"
              minHeight="100px"
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">This statement is:</Label>
            <RadioGroup
              value={localContent.isTrue ? 'true' : 'false'}
              onValueChange={handleTrueFalseChange}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" className="accent-primary-green dark:accent-medium-teal" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" className="accent-primary-green dark:accent-medium-teal" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Explain why the statement is true or false"
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

export default TrueFalseEditor;
