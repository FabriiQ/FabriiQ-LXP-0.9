'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { MultipleResponseContent, MultipleResponseOption } from '../../models/types';
import { generateId } from '@/features/activties/models/base';

interface MultipleResponseEditorProps {
  content: MultipleResponseContent;
  onChange: (content: MultipleResponseContent) => void;
}

/**
 * Multiple Response Question Editor for Question Bank
 *
 * This component provides an interface for creating and editing
 * multiple response questions with:
 * - Question text editing
 * - Multiple option management with checkboxes
 * - Explanation and hint fields
 * - Media attachment
 */
export const MultipleResponseEditor: React.FC<MultipleResponseEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<MultipleResponseContent>(
    content.text ? content : {
      text: '',
      options: [
        { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
        { id: generateId(), text: 'Option 2', isCorrect: true, feedback: 'Correct!' },
        { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
        { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
      ],
      partialCredit: true
    }
  );

  // Update the local content and call onChange
  const updateContent = (updates: Partial<MultipleResponseContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle question text change
  const handleQuestionTextChange = (text: string) => {
    updateContent({ text });
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

  // Handle option change
  const handleOptionChange = (optionIndex: number, updates: Partial<MultipleResponseOption>) => {
    const newOptions = [...localContent.options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      ...updates
    };
    updateContent({ options: newOptions });
  };

  // Add a new option
  const handleAddOption = () => {
    updateContent({
      options: [
        ...localContent.options,
        { id: generateId(), text: 'New option', isCorrect: false, feedback: '' }
      ]
    });
  };

  // Remove an option
  const handleRemoveOption = (optionIndex: number) => {
    const newOptions = [...localContent.options];
    newOptions.splice(optionIndex, 1);
    updateContent({ options: newOptions });
  };

  // Handle partial credit toggle
  const handlePartialCreditChange = (checked: boolean) => {
    updateContent({ partialCredit: checked });
  };

  // Handle min/max correct options
  const handleMinCorrectOptionsChange = (value: string) => {
    const minCorrectOptions = parseInt(value) || undefined;
    updateContent({ minCorrectOptions });
  };

  const handleMaxCorrectOptionsChange = (value: string) => {
    const maxCorrectOptions = parseInt(value) || undefined;
    updateContent({ maxCorrectOptions });
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
            <Label className="mb-2 block">Options (Select all correct answers)</Label>
            <div className="space-y-3">
              {localContent.options.map((option, index) => (
                <div key={option.id} className="flex items-start gap-2 p-3 border rounded-md">
                  <div className="flex items-center h-6 mt-1">
                    <Checkbox
                      checked={option.isCorrect}
                      onCheckedChange={(checked) =>
                        handleOptionChange(index, { isCorrect: !!checked })
                      }
                      className="accent-primary-green dark:accent-medium-teal"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <RichTextEditor
                      content={option.text}
                      onChange={(text) => handleOptionChange(index, { text })}
                      placeholder="Option text"
                      minHeight="50px"
                      simple={true}
                    />
                    <RichTextEditor
                      content={option.feedback || ''}
                      onChange={(feedback) => handleOptionChange(index, { feedback })}
                      placeholder="Feedback for this option (optional)"
                      minHeight="50px"
                      simple={true}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    disabled={localContent.options.length <= 2}
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
              onClick={handleAddOption}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Option
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minCorrectOptions" className="mb-2 block">Min Correct Options</Label>
              <Input
                id="minCorrectOptions"
                type="number"
                min={1}
                max={localContent.options.length}
                value={localContent.minCorrectOptions || ''}
                onChange={(e) => handleMinCorrectOptionsChange(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="maxCorrectOptions" className="mb-2 block">Max Correct Options</Label>
              <Input
                id="maxCorrectOptions"
                type="number"
                min={1}
                max={localContent.options.length}
                value={localContent.maxCorrectOptions || ''}
                onChange={(e) => handleMaxCorrectOptionsChange(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-2 mt-8">
                <Checkbox
                  id="partialCredit"
                  checked={localContent.partialCredit}
                  onCheckedChange={handlePartialCreditChange}
                />
                <Label htmlFor="partialCredit">Allow partial credit</Label>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Explain the correct answers"
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

export default MultipleResponseEditor;
