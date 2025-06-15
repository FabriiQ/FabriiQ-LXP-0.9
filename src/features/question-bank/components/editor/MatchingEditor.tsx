'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { MatchingContent, MatchingPair } from '../../models/types';
import { generateId } from '@/features/activties/models/base';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface MatchingEditorProps {
  content: MatchingContent;
  onChange: (content: MatchingContent) => void;
}

/**
 * Matching Question Editor for Question Bank
 * 
 * This component provides an interface for creating and editing
 * matching questions with:
 * - Question text editing
 * - Matching pairs management
 * - Drag and drop reordering
 * - Explanation and hint fields
 * - Media attachment
 */
export const MatchingEditor: React.FC<MatchingEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<MatchingContent>(
    content.text ? content : {
      text: 'Match the following items:',
      pairs: [
        { id: generateId(), left: 'France', right: 'Paris', feedback: 'Paris is the capital of France.' },
        { id: generateId(), left: 'Germany', right: 'Berlin', feedback: 'Berlin is the capital of Germany.' },
        { id: generateId(), left: 'Italy', right: 'Rome', feedback: 'Rome is the capital of Italy.' },
        { id: generateId(), left: 'Spain', right: 'Madrid', feedback: 'Madrid is the capital of Spain.' }
      ],
      partialCredit: true
    }
  );

  // Update the local content and call onChange
  const updateContent = (updates: Partial<MatchingContent>) => {
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

  // Handle pair change
  const handlePairChange = (pairIndex: number, updates: Partial<MatchingPair>) => {
    const newPairs = [...localContent.pairs];
    newPairs[pairIndex] = {
      ...newPairs[pairIndex],
      ...updates
    };
    updateContent({ pairs: newPairs });
  };

  // Add a new pair
  const handleAddPair = () => {
    updateContent({
      pairs: [
        ...localContent.pairs,
        { id: generateId(), left: 'New item', right: 'Match', feedback: '' }
      ]
    });
  };

  // Remove a pair
  const handleRemovePair = (pairIndex: number) => {
    const newPairs = [...localContent.pairs];
    newPairs.splice(pairIndex, 1);
    updateContent({ pairs: newPairs });
  };

  // Handle partial credit toggle
  const handlePartialCreditChange = (checked: boolean) => {
    updateContent({ partialCredit: checked });
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const pairs = Array.from(localContent.pairs);
    const [reorderedItem] = pairs.splice(result.source.index, 1);
    pairs.splice(result.destination.index, 0, reorderedItem);
    
    updateContent({ pairs });
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
            <Label className="mb-2 block">Matching Pairs</Label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="matching-pairs">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {localContent.pairs.map((pair, index) => (
                      <Draggable key={pair.id} draggableId={pair.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="p-4 border rounded-md bg-white dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1"
                              >
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <span className="font-medium">Pair {index + 1}</span>
                              <div className="flex-grow"></div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePair(index)}
                                disabled={localContent.pairs.length <= 2}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="mb-2 block">Left Item</Label>
                                <RichTextEditor
                                  content={pair.left}
                                  onChange={(text) => handlePairChange(index, { left: text })}
                                  placeholder="Left item text"
                                  minHeight="60px"
                                  simple={true}
                                />
                              </div>
                              <div>
                                <Label className="mb-2 block">Right Item</Label>
                                <RichTextEditor
                                  content={pair.right}
                                  onChange={(text) => handlePairChange(index, { right: text })}
                                  placeholder="Right item text"
                                  minHeight="60px"
                                  simple={true}
                                />
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <Label className="mb-2 block">Feedback (Optional)</Label>
                              <RichTextEditor
                                content={pair.feedback || ''}
                                onChange={(feedback) => handlePairChange(index, { feedback })}
                                placeholder="Feedback for this pair"
                                minHeight="60px"
                                simple={true}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPair}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Pair
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
              placeholder="Explain the correct matches"
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

export default MatchingEditor;
