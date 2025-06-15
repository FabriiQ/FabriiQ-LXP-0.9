'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';

// Note: GripVertical is not available in the current version of lucide-react
// Using a custom component as a temporary replacement
const GripVertical = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);
import { DragAndDropContent, DragAndDropItem, DropZone } from '../../models/types';
import { generateId } from '@/features/activties/models/base';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface DragAndDropEditorProps {
  content: DragAndDropContent;
  onChange: (content: DragAndDropContent) => void;
}

/**
 * Drag and Drop Question Editor for Question Bank
 *
 * This component provides an interface for creating and editing
 * drag and drop questions with:
 * - Question text editing
 * - Draggable items management
 * - Drop zones configuration
 * - Background image upload
 * - Explanation and hint fields
 */
export const DragAndDropEditor: React.FC<DragAndDropEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<DragAndDropContent>(() => {
    if (content.text) return content;

    const zoneIds = [generateId(), generateId(), generateId()];

    return {
      text: 'Drag the items to their correct categories',
      items: [
        {
          id: generateId(),
          text: 'Item 1',
          correctZoneId: zoneIds[0],
          feedback: 'Correct! This item belongs to Zone 1.'
        },
        {
          id: generateId(),
          text: 'Item 2',
          correctZoneId: zoneIds[1],
          feedback: 'Correct! This item belongs to Zone 2.'
        },
        {
          id: generateId(),
          text: 'Item 3',
          correctZoneId: zoneIds[2],
          feedback: 'Correct! This item belongs to Zone 3.'
        }
      ],
      zones: [
        {
          id: zoneIds[0],
          text: 'Zone 1',
          x: 50,
          y: 50,
          width: 200,
          height: 150,
          backgroundColor: 'rgba(230, 230, 230, 0.5)',
          borderColor: '#cccccc'
        },
        {
          id: zoneIds[1],
          text: 'Zone 2',
          x: 300,
          y: 50,
          width: 200,
          height: 150,
          backgroundColor: 'rgba(230, 230, 230, 0.5)',
          borderColor: '#cccccc'
        },
        {
          id: zoneIds[2],
          text: 'Zone 3',
          x: 550,
          y: 50,
          width: 200,
          height: 150,
          backgroundColor: 'rgba(230, 230, 230, 0.5)',
          borderColor: '#cccccc'
        }
      ],
      backgroundImage: ''
    };
  });

  // Refs for scrolling to newly added items/zones
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const zonesContainerRef = useRef<HTMLDivElement>(null);

  // Update the local content and call onChange
  const updateContent = (updates: Partial<DragAndDropContent>) => {
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

  // Handle background image change
  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateContent({ backgroundImage: e.target.value });
  };

  // Handle item change
  const handleItemChange = (itemIndex: number, updates: Partial<DragAndDropItem>) => {
    const newItems = [...localContent.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      ...updates
    };
    updateContent({ items: newItems });
  };

  // Add a new item
  const handleAddItem = () => {
    const newItem: DragAndDropItem = {
      id: generateId(),
      text: `New Item ${localContent.items.length + 1}`,
      correctZoneId: localContent.zones[0]?.id || '',
      feedback: 'Feedback for this item'
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
    updateContent({ items: newItems });
  };

  // Handle zone change
  const handleZoneChange = (zoneIndex: number, updates: Partial<DropZone>) => {
    const newZones = [...localContent.zones];
    newZones[zoneIndex] = {
      ...newZones[zoneIndex],
      ...updates
    };
    updateContent({ zones: newZones });
  };

  // Add a new zone
  const handleAddZone = () => {
    const newZone: DropZone = {
      id: generateId(),
      text: `Zone ${localContent.zones.length + 1}`,
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      backgroundColor: 'rgba(230, 230, 230, 0.5)',
      borderColor: '#cccccc'
    };

    updateContent({
      zones: [...localContent.zones, newZone]
    });

    // Scroll to the new zone after it's added
    setTimeout(() => {
      if (zonesContainerRef.current) {
        zonesContainerRef.current.scrollTop = zonesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Remove a zone
  const handleRemoveZone = (zoneIndex: number) => {
    const zoneId = localContent.zones[zoneIndex].id;
    const newZones = [...localContent.zones];
    newZones.splice(zoneIndex, 1);

    // Update items that were assigned to this zone
    const newItems = localContent.items.map(item => {
      if (item.correctZoneId === zoneId) {
        return {
          ...item,
          correctZoneId: newZones[0]?.id || ''
        };
      }
      return item;
    });

    updateContent({
      zones: newZones,
      items: newItems
    });
  };

  // Handle drag and drop reordering for items
  const handleItemDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(localContent.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateContent({ items });
  };

  // Handle drag and drop reordering for zones
  const handleZoneDragEnd = (result: any) => {
    if (!result.destination) return;

    const zones = Array.from(localContent.zones);
    const [reorderedZone] = zones.splice(result.source.index, 1);
    zones.splice(result.destination.index, 0, reorderedZone);

    updateContent({ zones });
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
            <Label htmlFor="backgroundImage" className="mb-2 block">Background Image URL (Optional)</Label>
            <Input
              id="backgroundImage"
              type="text"
              value={localContent.backgroundImage || ''}
              onChange={handleBackgroundImageChange}
              placeholder="Enter URL for background image"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Provide a URL for an image to use as the background for the drag and drop area.
            </p>
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Draggable Items</Label>
            <div
              ref={itemsContainerRef}
              className="max-h-[400px] overflow-y-auto pr-1 rounded-md"
            >
              <DragDropContext onDragEnd={handleItemDragEnd}>
                <Droppable droppableId="draggable-items">
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
                                <span className="font-medium">Item {index + 1}</span>
                                <div className="flex-grow"></div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(index)}
                                  disabled={localContent.items.length <= 1}
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
                                <Label className="mb-2 block">Correct Zone</Label>
                                <select
                                  value={item.correctZoneId}
                                  onChange={(e) => handleItemChange(index, { correctZoneId: e.target.value })}
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  {localContent.zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                      {zone.text}
                                    </option>
                                  ))}
                                </select>
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
            <Label className="mb-2 block">Drop Zones</Label>
            <div
              ref={zonesContainerRef}
              className="max-h-[400px] overflow-y-auto pr-1 rounded-md"
            >
              <DragDropContext onDragEnd={handleZoneDragEnd}>
                <Droppable droppableId="drop-zones">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {localContent.zones.map((zone, index) => (
                        <Draggable key={zone.id} draggableId={zone.id} index={index}>
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
                                <span className="font-medium">Zone {index + 1}</span>
                                <div className="flex-grow"></div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveZone(index)}
                                  disabled={localContent.zones.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="mb-3">
                                <Label className="mb-2 block">Zone Text</Label>
                                <RichTextEditor
                                  content={zone.text}
                                  onChange={(text) => handleZoneChange(index, { text })}
                                  placeholder="Zone text"
                                  minHeight="60px"
                                  simple={true}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <Label className="mb-2 block">X Position</Label>
                                  <Input
                                    type="number"
                                    value={zone.x}
                                    onChange={(e) => handleZoneChange(index, { x: parseInt(e.target.value) || 0 })}
                                    min={0}
                                  />
                                </div>
                                <div>
                                  <Label className="mb-2 block">Y Position</Label>
                                  <Input
                                    type="number"
                                    value={zone.y}
                                    onChange={(e) => handleZoneChange(index, { y: parseInt(e.target.value) || 0 })}
                                    min={0}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <Label className="mb-2 block">Width</Label>
                                  <Input
                                    type="number"
                                    value={zone.width}
                                    onChange={(e) => handleZoneChange(index, { width: parseInt(e.target.value) || 100 })}
                                    min={50}
                                  />
                                </div>
                                <div>
                                  <Label className="mb-2 block">Height</Label>
                                  <Input
                                    type="number"
                                    value={zone.height}
                                    onChange={(e) => handleZoneChange(index, { height: parseInt(e.target.value) || 100 })}
                                    min={50}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <Label className="mb-2 block">Background Color</Label>
                                  <Input
                                    type="text"
                                    value={zone.backgroundColor || 'rgba(230, 230, 230, 0.5)'}
                                    onChange={(e) => handleZoneChange(index, { backgroundColor: e.target.value })}
                                    placeholder="rgba(230, 230, 230, 0.5)"
                                  />
                                </div>
                                <div>
                                  <Label className="mb-2 block">Border Color</Label>
                                  <Input
                                    type="text"
                                    value={zone.borderColor || '#cccccc'}
                                    onChange={(e) => handleZoneChange(index, { borderColor: e.target.value })}
                                    placeholder="#cccccc"
                                  />
                                </div>
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
              onClick={handleAddZone}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Zone
            </Button>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Explain the correct placements"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default DragAndDropEditor;
