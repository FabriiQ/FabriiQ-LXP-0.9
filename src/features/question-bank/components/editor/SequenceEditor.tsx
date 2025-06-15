'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { SequenceContent, SequenceItem } from '../../models/types';
import { generateId } from '@/features/activties/models/base';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface SequenceEditorProps {
  content: SequenceContent;
  onChange: (content: SequenceContent) => void;
}

/**
 * Sequence Question Editor for Question Bank
 * 
 * This component provides an interface for creating and editing
 * sequence questions with:
 * - Question text editing
 * - Sequence items management
 * - Drag and drop reordering
 * - Explanation and hint fields
 * - Media attachment
 */
export const SequenceEditor: React.FC<SequenceEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<SequenceContent>(
    content.text ? content : {
      text: 'Arrange the following events in chronological order:',
      items: [
        { id: generateId(), text: 'First event in the sequence', correctPosition: 0, feedback: 'This event comes first.' },
        { id: generateId(), text: 'Second event in the sequence', correctPosition: 1, feedback: 'This event comes second.' },
        { id: generateId(), text: 'Third event in the sequence', correctPosition: 2, feedback: 'This event comes third.' },
        { id: generateId(), text: 'Fourth event in the sequence', correctPosition: 3, feedback: 'This event comes fourth.' }
      ]
    }
  );

  // Ref for scrolling to newly added items
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Update the local content and call onChange
  const updateContent = (updates: Partial<SequenceContent>) => {
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

  // Handle item change
  const handleItemChange = (itemIndex: number, updates: Partial<SequenceItem>) => {
    const newItems = [...localContent.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      ...updates
    };
    updateContent({ items: newItems });
  };

  // Add a new item
  const handleAddItem = () => {
    const newItem: SequenceItem = {
      id: generateId(),
      text: `New item ${localContent.items.length + 1}`,
      correctPosition: localContent.items.length,
      feedback: `This item belongs in position ${localContent.items.length + 1}.`
    };
    
    updateContent({
      items: [...localContent.items, newItem]
    });

    // Scroll to the new item after it's added
    setTimeout(() => {
      if (itemsContainerRef.current) {
        itemsContainerRef.current.scrollTop = itemsContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Remove an item
  const handleRemoveItem = (itemIndex: number) => {
    const newItems = [...localContent.items];
    newItems.splice(itemIndex, 1);
    
    // Update correctPosition for remaining items
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      correctPosition: index
    }));
    
    updateContent({ items: updatedItems });
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(localContent.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update correctPosition for all items after reordering
    const updatedItems = items.map((item, index) => ({
      ...item,
      correctPosition: index
    }));
    
    updateContent({ items: updatedItems });
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
            <Label className="mb-2 block">Sequence Items</Label>
            <div 
              ref={itemsContainerRef}
              className="max-h-[400px] overflow-y-auto pr-1 rounded-md"
            >
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sequence-items">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {localContent.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
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
                                <span className="font-medium">Position {index + 1}</span>
                                <div className="flex-grow"></div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(index)}
                                  disabled={localContent.items.length <= 2}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="mb-3">
                                <Label className="mb-2 block">Item Text</Label>
                                <RichTextEditor
                                  content={item.text}
                                  onChange={(text) => handleItemChange(index, { text })}
                                  placeholder="Item text"
                                  minHeight="60px"
                                  simple={true}
                                />
                              </div>
                              
                              <div className="mb-3">
                                <Label className="mb-2 block">Feedback (Optional)</Label>
                                <RichTextEditor
                                  content={item.feedback || ''}
                                  onChange={(feedback) => handleItemChange(index, { feedback })}
                                  placeholder="Feedback for this item"
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
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Explain the correct sequence"
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

export default SequenceEditor;
