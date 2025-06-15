'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Menu, FileText } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { EssayContent, EssayRubric, EssayRubricCriterion, EssayRubricLevel } from '../../models/types';
import { generateId } from '@/features/activties/models/base';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface EssayEditorProps {
  content: EssayContent;
  onChange: (content: EssayContent) => void;
}

/**
 * Essay Question Editor for Question Bank
 *
 * This component provides an interface for creating and editing
 * essay questions with:
 * - Question text editing
 * - Word count limits
 * - Rubric creation
 * - Explanation and hint fields
 * - Media attachment
 */
export const EssayEditor: React.FC<EssayEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<EssayContent>(() => {
    if (content.text) return content;

    // Create default rubric
    const defaultRubric: EssayRubric = {
      criteria: [
        {
          id: generateId(),
          name: 'Content',
          description: 'The quality and relevance of the content',
          points: 10,
          levels: [
            {
              id: generateId(),
              name: 'Excellent',
              description: 'Comprehensive, relevant, and well-developed content',
              points: 10
            },
            {
              id: generateId(),
              name: 'Good',
              description: 'Relevant and mostly well-developed content',
              points: 8
            },
            {
              id: generateId(),
              name: 'Satisfactory',
              description: 'Mostly relevant content with some development',
              points: 6
            },
            {
              id: generateId(),
              name: 'Needs Improvement',
              description: 'Limited relevance or development of content',
              points: 4
            }
          ]
        },
        {
          id: generateId(),
          name: 'Organization',
          description: 'The structure and flow of the essay',
          points: 5,
          levels: [
            {
              id: generateId(),
              name: 'Excellent',
              description: 'Well-organized with clear structure and smooth transitions',
              points: 5
            },
            {
              id: generateId(),
              name: 'Good',
              description: 'Organized with mostly clear structure and transitions',
              points: 4
            },
            {
              id: generateId(),
              name: 'Satisfactory',
              description: 'Some organization but structure or transitions may be unclear',
              points: 3
            },
            {
              id: generateId(),
              name: 'Needs Improvement',
              description: 'Poorly organized with unclear structure',
              points: 2
            }
          ]
        }
      ],
      totalPoints: 15
    };

    return {
      text: 'Write an essay discussing the causes and effects of climate change.',
      wordCountMin: 250,
      wordCountMax: 500,
      rubric: defaultRubric,
      explanation: 'This essay should demonstrate your understanding of climate change, its causes, and its effects on the environment and society.',
      hint: 'Consider both natural and human-caused factors, and discuss both environmental and social impacts.'
    };
  });

  // State for UI
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0);

  // Refs for scrolling
  const criteriaContainerRef = useRef<HTMLDivElement>(null);
  const levelsContainerRef = useRef<HTMLDivElement>(null);

  // Get current criterion
  const currentCriterion = localContent.rubric?.criteria[currentCriterionIndex];

  // Update the local content and call onChange
  const updateContent = (updates: Partial<EssayContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle question text change
  const handleQuestionTextChange = (text: string) => {
    updateContent({ text });
  };

  // Handle word count min change
  const handleWordCountMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      updateContent({ wordCountMin: value });
    }
  };

  // Handle word count max change
  const handleWordCountMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      updateContent({ wordCountMax: value });
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

  // Handle criterion change
  const handleCriterionChange = (criterionIndex: number, updates: Partial<EssayRubricCriterion>) => {
    if (!localContent.rubric) return;

    const newCriteria = [...localContent.rubric.criteria];
    newCriteria[criterionIndex] = {
      ...newCriteria[criterionIndex],
      ...updates
    };

    // Recalculate total points
    const totalPoints = newCriteria.reduce((sum, criterion) => sum + criterion.points, 0);

    updateContent({
      rubric: {
        ...localContent.rubric,
        criteria: newCriteria,
        totalPoints
      }
    });
  };

  // Handle level change
  const handleLevelChange = (criterionIndex: number, levelIndex: number, updates: Partial<EssayRubricLevel>) => {
    if (!localContent.rubric) return;

    const newCriteria = [...localContent.rubric.criteria];
    const newLevels = [...newCriteria[criterionIndex].levels];

    newLevels[levelIndex] = {
      ...newLevels[levelIndex],
      ...updates
    };

    newCriteria[criterionIndex] = {
      ...newCriteria[criterionIndex],
      levels: newLevels
    };

    updateContent({
      rubric: {
        ...localContent.rubric,
        criteria: newCriteria
      }
    });
  };

  // Add a new criterion
  const handleAddCriterion = () => {
    if (!localContent.rubric) {
      // Create a new rubric if none exists
      const newRubric: EssayRubric = {
        criteria: [
          {
            id: generateId(),
            name: 'New Criterion',
            description: 'Description of the criterion',
            points: 5,
            levels: [
              {
                id: generateId(),
                name: 'Excellent',
                description: 'Excellent performance',
                points: 5
              },
              {
                id: generateId(),
                name: 'Good',
                description: 'Good performance',
                points: 4
              }
            ]
          }
        ],
        totalPoints: 5
      };

      updateContent({ rubric: newRubric });
      setCurrentCriterionIndex(0);
      return;
    }

    const newCriterion: EssayRubricCriterion = {
      id: generateId(),
      name: `Criterion ${localContent.rubric.criteria.length + 1}`,
      description: 'Description of the criterion',
      points: 5,
      levels: [
        {
          id: generateId(),
          name: 'Excellent',
          description: 'Excellent performance',
          points: 5
        },
        {
          id: generateId(),
          name: 'Good',
          description: 'Good performance',
          points: 4
        }
      ]
    };

    const newCriteria = [...localContent.rubric.criteria, newCriterion];
    const totalPoints = newCriteria.reduce((sum, criterion) => sum + criterion.points, 0);

    updateContent({
      rubric: {
        ...localContent.rubric,
        criteria: newCriteria,
        totalPoints
      }
    });

    setCurrentCriterionIndex(newCriteria.length - 1);

    // Scroll to the new criterion after it's added
    setTimeout(() => {
      if (criteriaContainerRef.current) {
        criteriaContainerRef.current.scrollTop = criteriaContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Remove a criterion
  const handleRemoveCriterion = (criterionIndex: number) => {
    if (!localContent.rubric || localContent.rubric.criteria.length <= 1) return;

    const newCriteria = [...localContent.rubric.criteria];
    newCriteria.splice(criterionIndex, 1);

    const totalPoints = newCriteria.reduce((sum, criterion) => sum + criterion.points, 0);

    updateContent({
      rubric: {
        ...localContent.rubric,
        criteria: newCriteria,
        totalPoints
      }
    });

    setCurrentCriterionIndex(Math.min(criterionIndex, newCriteria.length - 1));
  };

  // Add a new level to the current criterion
  const handleAddLevel = () => {
    if (!localContent.rubric || !currentCriterion) return;

    const newLevel: EssayRubricLevel = {
      id: generateId(),
      name: `Level ${currentCriterion.levels.length + 1}`,
      description: 'Description of the level',
      points: Math.max(1, currentCriterion.points - currentCriterion.levels.length)
    };

    const newLevels = [...currentCriterion.levels, newLevel];

    handleCriterionChange(currentCriterionIndex, { levels: newLevels });

    // Scroll to the new level after it's added
    setTimeout(() => {
      if (levelsContainerRef.current) {
        levelsContainerRef.current.scrollTop = levelsContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Remove a level from the current criterion
  const handleRemoveLevel = (levelIndex: number) => {
    if (!localContent.rubric || !currentCriterion || currentCriterion.levels.length <= 1) return;

    const newLevels = [...currentCriterion.levels];
    newLevels.splice(levelIndex, 1);

    handleCriterionChange(currentCriterionIndex, { levels: newLevels });
  };

  // Handle drag and drop reordering for criteria
  const handleCriteriaDragEnd = (result: any) => {
    if (!result.destination || !localContent.rubric) return;

    const criteria = Array.from(localContent.rubric.criteria);
    const [reorderedCriterion] = criteria.splice(result.source.index, 1);
    criteria.splice(result.destination.index, 0, reorderedCriterion);

    // Update current criterion index if it was moved
    if (currentCriterionIndex === result.source.index) {
      setCurrentCriterionIndex(result.destination.index);
    }
    // Or if the current criterion's position was affected by the move
    else if (
      (currentCriterionIndex > result.source.index && currentCriterionIndex <= result.destination.index) ||
      (currentCriterionIndex < result.source.index && currentCriterionIndex >= result.destination.index)
    ) {
      setCurrentCriterionIndex(
        currentCriterionIndex + (result.source.index < result.destination.index ? -1 : 1)
      );
    }

    updateContent({
      rubric: {
        ...localContent.rubric,
        criteria
      }
    });
  };

  // Handle drag and drop reordering for levels
  const handleLevelsDragEnd = (result: any) => {
    if (!result.destination || !localContent.rubric || !currentCriterion) return;

    const levels = Array.from(currentCriterion.levels);
    const [reorderedLevel] = levels.splice(result.source.index, 1);
    levels.splice(result.destination.index, 0, reorderedLevel);

    handleCriterionChange(currentCriterionIndex, { levels });
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
              placeholder="Enter your essay question"
              minHeight="100px"
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Word Count Limits</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm">Minimum Words</Label>
                <Input
                  type="number"
                  value={localContent.wordCountMin || ''}
                  onChange={handleWordCountMinChange}
                  min={0}
                  placeholder="Minimum word count"
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm">Maximum Words</Label>
                <Input
                  type="number"
                  value={localContent.wordCountMax || ''}
                  onChange={handleWordCountMaxChange}
                  min={0}
                  placeholder="Maximum word count"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Set word count limits to guide students on the expected length of their essays.
            </p>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-lg font-medium flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary-green" />
                Rubric
              </Label>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Points: {localContent.rubric?.totalPoints || 0}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Criteria List */}
              <div className="md:col-span-1 border rounded-md p-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Criteria</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCriterion}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                <div
                  ref={criteriaContainerRef}
                  className="max-h-[300px] overflow-y-auto pr-1"
                >
                  <DragDropContext onDragEnd={handleCriteriaDragEnd}>
                    <Droppable droppableId="criteria-list">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {localContent.rubric?.criteria.map((criterion, index) => (
                            <Draggable key={criterion.id} draggableId={criterion.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-2 border rounded-md cursor-pointer ${
                                    index === currentCriterionIndex
                                      ? 'bg-primary-green/10 border-primary-green'
                                      : 'bg-white dark:bg-gray-800'
                                  }`}
                                  onClick={() => setCurrentCriterionIndex(index)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing p-1 mr-1"
                                      >
                                        <Menu className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <span className="font-medium truncate">{criterion.name}</span>
                                    </div>
                                    <span className="text-sm">{criterion.points} pts</span>
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
              </div>

              {/* Criterion Details */}
              <div className="md:col-span-2 border rounded-md p-3">
                {currentCriterion ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Criterion Details</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCriterion(currentCriterionIndex)}
                        disabled={!localContent.rubric || localContent.rubric.criteria.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <Label className="mb-1 block text-sm">Name</Label>
                        <Input
                          value={currentCriterion.name}
                          onChange={(e) => handleCriterionChange(currentCriterionIndex, { name: e.target.value })}
                          placeholder="Criterion name"
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block text-sm">Description</Label>
                        <Input
                          value={currentCriterion.description}
                          onChange={(e) => handleCriterionChange(currentCriterionIndex, { description: e.target.value })}
                          placeholder="Criterion description"
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block text-sm">Points</Label>
                        <Input
                          type="number"
                          value={currentCriterion.points}
                          onChange={(e) => handleCriterionChange(currentCriterionIndex, { points: parseInt(e.target.value) || 0 })}
                          min={0}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Performance Levels</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddLevel}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Level
                        </Button>
                      </div>

                      <div
                        ref={levelsContainerRef}
                        className="max-h-[200px] overflow-y-auto pr-1"
                      >
                        <DragDropContext onDragEnd={handleLevelsDragEnd}>
                          <Droppable droppableId="levels-list">
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-2"
                              >
                                {currentCriterion.levels.map((level, levelIndex) => (
                                  <Draggable key={level.id} draggableId={level.id} index={levelIndex}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="p-3 border rounded-md bg-white dark:bg-gray-800"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center">
                                            <div
                                              {...provided.dragHandleProps}
                                              className="cursor-grab active:cursor-grabbing p-1 mr-1"
                                            >
                                              <Menu className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <Label className="text-sm font-medium">Level {levelIndex + 1}</Label>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveLevel(levelIndex)}
                                            disabled={currentCriterion.levels.length <= 1}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>

                                        <div className="space-y-2">
                                          <div>
                                            <Label className="mb-1 block text-xs">Name</Label>
                                            <Input
                                              value={level.name}
                                              onChange={(e) => handleLevelChange(currentCriterionIndex, levelIndex, { name: e.target.value })}
                                              placeholder="Level name"
                                              className="h-8 text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="mb-1 block text-xs">Description</Label>
                                            <Input
                                              value={level.description}
                                              onChange={(e) => handleLevelChange(currentCriterionIndex, levelIndex, { description: e.target.value })}
                                              placeholder="Level description"
                                              className="h-8 text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="mb-1 block text-xs">Points</Label>
                                            <Input
                                              type="number"
                                              value={level.points}
                                              onChange={(e) => handleLevelChange(currentCriterionIndex, levelIndex, { points: parseInt(e.target.value) || 0 })}
                                              min={0}
                                              max={currentCriterion.points}
                                              className="h-8 text-sm"
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
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No criteria defined yet</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCriterion}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Criterion
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Provide an explanation of what you're looking for in the essay"
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

export default EssayEditor;
