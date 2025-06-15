'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { FillInTheBlanksContent, FillInTheBlankBlank } from '../../models/types';
import { generateId } from '@/features/activties/models/base';

interface FillInTheBlanksEditorProps {
  content: FillInTheBlanksContent;
  onChange: (content: FillInTheBlanksContent) => void;
}

/**
 * Fill in the Blanks Question Editor for Question Bank
 *
 * This component provides an interface for creating and editing
 * fill in the blanks questions with:
 * - Text with placeholders for blanks
 * - Correct answers for each blank
 * - Explanation and hint fields
 * - Media attachment
 */
export const FillInTheBlanksEditor: React.FC<FillInTheBlanksEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<FillInTheBlanksContent>(() => {
    if (content.text) return content;

    const blank1Id = generateId();
    const blank2Id = generateId();

    return {
      text: `The capital of France is {{${blank1Id}}} and the capital of Italy is {{${blank2Id}}}.`,
      blanks: [
        {
          id: blank1Id,
          correctAnswers: ['Paris'],
          caseSensitive: false,
          feedback: 'Paris is the capital of France.'
        },
        {
          id: blank2Id,
          correctAnswers: ['Rome'],
          caseSensitive: false,
          feedback: 'Rome is the capital of Italy.'
        }
      ],
      partialCredit: true
    };
  });

  // Parse text to extract blanks and text parts
  const [parsedText, setParsedText] = useState<{ type: 'text' | 'blank', content: string }[]>([]);

  // Update parsed text when content changes
  useEffect(() => {
    setParsedText(parseTextWithBlanks(localContent.text));
  }, [localContent.text]);

  // Update the local content and call onChange
  const updateContent = (updates: Partial<FillInTheBlanksContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle text change
  const handleTextChange = (text: string) => {
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

  // Handle blank change
  const handleBlankChange = (blankId: string, updates: Partial<FillInTheBlankBlank>) => {
    const newBlanks = localContent.blanks.map(blank =>
      blank.id === blankId ? { ...blank, ...updates } : blank
    );
    updateContent({ blanks: newBlanks });
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (blankId: string, index: number, value: string) => {
    const blank = localContent.blanks.find(b => b.id === blankId);
    if (!blank) return;

    const newAnswers = [...blank.correctAnswers];
    newAnswers[index] = value;

    handleBlankChange(blankId, { correctAnswers: newAnswers });
  };

  // Add a new correct answer to a blank
  const handleAddCorrectAnswer = (blankId: string) => {
    const blank = localContent.blanks.find(b => b.id === blankId);
    if (!blank) return;

    handleBlankChange(blankId, {
      correctAnswers: [...blank.correctAnswers, '']
    });
  };

  // Remove a correct answer from a blank
  const handleRemoveCorrectAnswer = (blankId: string, index: number) => {
    const blank = localContent.blanks.find(b => b.id === blankId);
    if (!blank || blank.correctAnswers.length <= 1) return;

    const newAnswers = [...blank.correctAnswers];
    newAnswers.splice(index, 1);

    handleBlankChange(blankId, { correctAnswers: newAnswers });
  };

  // Handle case sensitivity toggle
  // Note: FillInTheBlankBlank doesn't have caseSensitive property in the question bank model
  // We'll handle this at the content level instead
  const handleCaseSensitiveChange = (_: string, checked: boolean) => {
    // This is a workaround since the FillInTheBlankBlank doesn't have caseSensitive property
    // We'll update the content's caseSensitive property instead
    updateContent({ caseSensitive: checked });
  };

  // Handle feedback change
  const handleFeedbackChange = (blankId: string, feedback: string) => {
    handleBlankChange(blankId, { feedback });
  };

  // Handle partial credit toggle
  const handlePartialCreditChange = (checked: boolean) => {
    updateContent({ partialCredit: checked });
  };

  // Add a new blank
  const handleAddBlank = () => {
    const newBlankId = generateId();
    const newBlank: FillInTheBlankBlank = {
      id: newBlankId,
      correctAnswers: [''],
      feedback: ''
    };

    // Add the blank to the content
    updateContent({
      blanks: [...localContent.blanks, newBlank],
      // Add a placeholder for the new blank at the end of the text
      text: `${localContent.text} {{${newBlankId}}}`
    });
  };

  // Parse text with blanks
  function parseTextWithBlanks(text: string): { type: 'text' | 'blank', content: string }[] {
    const parts: { type: 'text' | 'blank', content: string }[] = [];
    let currentIndex = 0;

    // Regular expression to match {{blankId}}
    const blankRegex = /\{\{([^}]+)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = blankRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push({
          type: 'text',
          content: text.substring(currentIndex, match.index)
        });
      }

      // Add the blank
      parts.push({
        type: 'blank',
        content: match[1] // The blank ID
      });

      currentIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (currentIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex)
      });
    }

    return parts;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Label htmlFor="questionText" className="mb-2 block">Question Text with Blanks</Label>
            <div className="mb-2 text-sm text-gray-500">
              Use double curly braces syntax to add blanks. Example: "The capital of France is &#123;&#123;id&#125;&#125;."
            </div>
            <RichTextEditor
              content={localContent.text}
              onChange={handleTextChange}
              placeholder="Enter your question with blanks"
              minHeight="100px"
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Preview</Label>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              {parsedText.map((part, index) => (
                <span key={index}>
                  {part.type === 'text' ? (
                    part.content
                  ) : (
                    <span className="px-2 py-1 mx-1 bg-blue-100 dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">
                      {part.content}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Blanks</Label>
            <div className="space-y-4">
              {localContent.blanks.map((blank) => (
                <div key={blank.id} className="p-4 border rounded-md">
                  <div className="mb-2 font-medium">Blank ID: {blank.id}</div>

                  <div className="mb-3">
                    <Label className="mb-2 block">Correct Answers</Label>
                    {blank.correctAnswers.map((answer, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <Input
                          value={answer}
                          onChange={(e) => handleCorrectAnswerChange(blank.id, index, e.target.value)}
                          placeholder="Enter correct answer"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCorrectAnswer(blank.id, index)}
                          disabled={blank.correctAnswers.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCorrectAnswer(blank.id)}
                      className="mt-1"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Alternative Answer
                    </Button>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`caseSensitive-${blank.id}`}
                        checked={localContent.caseSensitive || false}
                        onCheckedChange={(checked) => handleCaseSensitiveChange(blank.id, !!checked)}
                      />
                      <Label htmlFor={`caseSensitive-${blank.id}`}>Case sensitive</Label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label className="mb-2 block">Feedback (Optional)</Label>
                    <RichTextEditor
                      content={blank.feedback || ''}
                      onChange={(feedback) => handleFeedbackChange(blank.id, feedback)}
                      placeholder="Feedback for this blank"
                      minHeight="80px"
                      simple={true}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBlank}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Blank
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="partialCredit"
                checked={localContent.partialCredit}
                onCheckedChange={(checked) => handlePartialCreditChange(!!checked)}
              />
              <Label htmlFor="partialCredit">Allow partial credit</Label>
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

export default FillInTheBlanksEditor;
