'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, AlertCircle, Check, Edit, Eye } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { DragTheWordsContent, DraggableWord } from '../../models/types';
import { generateId } from '@/features/activties/models/base';

interface DragTheWordsEditorProps {
  content: DragTheWordsContent;
  onChange: (content: DragTheWordsContent) => void;
}

/**
 * Drag the Words Question Editor for Question Bank
 * 
 * This component provides an interface for creating and editing
 * drag the words questions with:
 * - Text with placeholders for draggable words
 * - Word management
 * - Explanation and hint fields
 * - Media attachment
 */
export const DragTheWordsEditor: React.FC<DragTheWordsEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<DragTheWordsContent>(
    content.text ? content : {
      text: 'The quick *brown* fox jumps over the *lazy* dog.',
      words: [
        {
          id: generateId(),
          text: 'brown',
          correctIndex: 0,
          feedback: 'Correct! The fox is brown.'
        },
        {
          id: generateId(),
          text: 'lazy',
          correctIndex: 1,
          feedback: 'Correct! The dog is lazy.'
        }
      ]
    }
  );

  // State for UI feedback
  const [showPreview, setShowPreview] = useState(false);
  const [textHighlighted, setTextHighlighted] = useState(false);

  // Update the local content and call onChange
  const updateContent = (updates: Partial<DragTheWordsContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle text with placeholders change
  const handleTextWithPlaceholdersChange = (text: string) => {
    // Extract words from the text
    const words = createDraggableWordsFromText(text);

    // Update the content
    updateContent({
      text,
      words
    });

    // Highlight the text briefly to show changes
    setTextHighlighted(true);
    setTimeout(() => {
      setTextHighlighted(false);
    }, 1500);
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

  // Handle word change
  const handleWordChange = (wordIndex: number, updates: Partial<DraggableWord>) => {
    const newWords = [...localContent.words];
    newWords[wordIndex] = {
      ...newWords[wordIndex],
      ...updates
    };
    updateContent({ words: newWords });
  };

  // Add a new word
  const handleAddWord = () => {
    const newWord: DraggableWord = {
      id: generateId(),
      text: 'new word',
      correctIndex: localContent.words.length,
      feedback: 'Correct!'
    };
    
    updateContent({
      words: [...localContent.words, newWord]
    });
  };

  // Remove a word
  const handleRemoveWord = (wordIndex: number) => {
    const newWords = [...localContent.words];
    newWords.splice(wordIndex, 1);
    
    // Update correctIndex for remaining words
    const updatedWords = newWords.map((word, index) => ({
      ...word,
      correctIndex: index
    }));
    
    updateContent({ words: updatedWords });
  };

  // Create draggable words from text with placeholders
  function createDraggableWordsFromText(text: string): DraggableWord[] {
    const words = extractWordsFromText(text);
    
    return words.map((word, index) => {
      // Try to find an existing word with the same text to preserve ID and feedback
      const existingWord = localContent.words.find(w => w.text === word);
      
      if (existingWord) {
        return {
          ...existingWord,
          correctIndex: index
        };
      }
      
      return {
        id: generateId(),
        text: word,
        correctIndex: index,
        feedback: `Correct! "${word}" is in the right position.`
      };
    });
  }

  // Extract words from text with placeholders
  function extractWordsFromText(text: string): string[] {
    const words: string[] = [];
    let inPlaceholder = false;
    let currentWord = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '*') {
        if (inPlaceholder) {
          // End of placeholder
          if (currentWord.trim()) {
            words.push(currentWord.trim());
          }
          currentWord = '';
          inPlaceholder = false;
        } else {
          // Start of placeholder
          inPlaceholder = true;
        }
      } else if (inPlaceholder) {
        currentWord += char;
      }
    }
    
    return words;
  }

  // Parse text with placeholders for preview
  function parseTextWithPlaceholders(text: string): Array<{ type: 'text' | 'placeholder', content: string, index?: number }> {
    const parts: Array<{ type: 'text' | 'placeholder', content: string, index?: number }> = [];
    let currentText = '';
    let inPlaceholder = false;
    let placeholderIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '*') {
        if (inPlaceholder) {
          // End of placeholder
          parts.push({ type: 'placeholder', content: currentText, index: placeholderIndex });
          placeholderIndex++;
          currentText = '';
          inPlaceholder = false;
        } else {
          // Start of placeholder
          if (currentText) {
            parts.push({ type: 'text', content: currentText });
            currentText = '';
          }
          inPlaceholder = true;
        }
      } else {
        currentText += char;
      }
    }
    
    // Add any remaining text
    if (currentText) {
      parts.push({ type: 'text', content: currentText });
    }
    
    return parts;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="questionText" className="block">Text with Placeholders</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <Edit className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
            </div>
            
            <div className="mb-2 text-sm text-gray-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
              Use asterisks (*) to mark draggable words. Example: "The quick *brown* fox jumps over the *lazy* dog."
            </div>
            
            {showPreview ? (
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <div className="text-lg">
                  {parseTextWithPlaceholders(localContent.text).map((part, index) => (
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
            ) : (
              <RichTextEditor
                content={localContent.text}
                onChange={handleTextWithPlaceholdersChange}
                placeholder="Enter your text with *placeholders* for draggable words"
                minHeight="100px"
                className={textHighlighted ? 'border-primary-green dark:border-medium-teal' : ''}
              />
            )}
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Draggable Words</Label>
            <div className="space-y-3">
              {localContent.words.map((word, index) => (
                <div key={word.id} className="p-4 border rounded-md bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Word {index + 1}: "{word.text}"</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveWord(index)}
                      disabled={localContent.words.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-3">
                    <Label className="mb-2 block">Feedback (Optional)</Label>
                    <RichTextEditor
                      content={word.feedback || ''}
                      onChange={(feedback) => handleWordChange(index, { feedback })}
                      placeholder="Feedback for this word"
                      minHeight="60px"
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
              onClick={handleAddWord}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Word
            </Button>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: It's better to add words by editing the text with placeholders above.
            </p>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Explain the correct word placements"
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

export default DragTheWordsEditor;
