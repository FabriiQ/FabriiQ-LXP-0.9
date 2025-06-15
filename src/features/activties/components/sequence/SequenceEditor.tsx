'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  SequenceActivity,
  SequenceQuestion,
  SequenceItem,
  createDefaultSequenceQuestion,
  createSequenceItem
} from '../../models/sequence';
import { ActivityButton } from '../ui/ActivityButton';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { generateId } from '../../models/base';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Custom GripVertical icon
const GripVertical = (props: React.SVGProps<SVGSVGElement>) => (
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
    {...props}
  >
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </svg>
);

export interface SequenceEditorProps {
  activity: SequenceActivity;
  onChange: (activity: SequenceActivity) => void;
  onSave?: (activity: SequenceActivity) => void;
  className?: string;
}

/**
 * Sequence Activity Editor
 *
 * This component provides an interface for creating and editing
 * sequence activities with:
 * - Direct manipulation of sequence items
 * - Drag and drop reordering
 * - Real-time preview
 * - Settings configuration
 * - AI assistance options
 */
// Add CSS keyframes for animations
const addAnimationStyles = () => {
  if (typeof document !== 'undefined') {
    // Check if styles already exist
    if (!document.getElementById('sequence-editor-animations')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'sequence-editor-animations';
      styleEl.textContent = `
        @keyframes fade-out {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }

        .animate-fade-out {
          animation: fade-out 0.3s ease-out forwards;
        }

        @keyframes highlight-pulse {
          0% { background-color: rgba(216, 227, 224, 0); }
          50% { background-color: rgba(216, 227, 224, 0.3); }
          100% { background-color: rgba(216, 227, 224, 0); }
        }

        .highlight-pulse {
          animation: highlight-pulse 1s ease-in-out;
        }

        @keyframes slide-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }

        @keyframes reorder-highlight {
          0% { background-color: rgba(90, 138, 132, 0); }
          50% { background-color: rgba(90, 138, 132, 0.2); }
          100% { background-color: rgba(90, 138, 132, 0); }
        }

        .reorder-highlight {
          animation: reorder-highlight 1s ease-in-out;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }
};

export const SequenceEditor: React.FC<SequenceEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Add animation styles on component mount
  useEffect(() => {
    addAnimationStyles();
  }, []);
  // Local state for the activity
  const [localActivity, setLocalActivity] = useState<SequenceActivity>(activity);

  // Update the local activity and call onChange
  const updateActivity = (updates: Partial<SequenceActivity>) => {
    const updatedActivity = { ...localActivity, ...updates };
    setLocalActivity(updatedActivity);
    onChange(updatedActivity);
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivity({ title: e.target.value });
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateActivity({ description: e.target.value });
  };

  // Handle instructions change
  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateActivity({ instructions: e.target.value });
  };

  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    updateActivity({
      settings: {
        ...localActivity.settings,
        [key]: value
      }
    });
  };

  // Add a new question
  const handleAddQuestion = () => {
    updateActivity({
      questions: [...localActivity.questions, createDefaultSequenceQuestion()]
    });
  };

  // Remove a question
  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...localActivity.questions];
    newQuestions.splice(index, 1);
    updateActivity({ questions: newQuestions });
  };

  // Update a question
  const handleQuestionChange = (index: number, updatedQuestion: SequenceQuestion) => {
    const newQuestions = [...localActivity.questions];
    newQuestions[index] = updatedQuestion;
    updateActivity({ questions: newQuestions });
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(localActivity);
    }
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 rounded-full bg-primary-green flex items-center justify-center mr-3">
            <span className="text-white font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Sequence Activity</h1>
        </div>

        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={localActivity.title}
            onChange={handleTitleChange}
            className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            placeholder="Enter a descriptive title for this activity"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A clear title helps students understand the activity's purpose.
          </p>
        </div>

        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={localActivity.description || ''}
            onChange={handleDescriptionChange}
            className="w-full p-2 min-h-[60px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={2}
            placeholder="Provide a brief description of this sequence activity"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This description appears in activity listings and summaries.
          </p>
        </div>

        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Instructions</label>
          <textarea
            value={localActivity.instructions || ''}
            onChange={handleInstructionsChange}
            className="w-full p-2 min-h-[80px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={3}
            placeholder="Provide clear instructions for students on how to complete this activity"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Detailed instructions help students understand how to arrange items in the correct sequence.
          </p>
        </div>

        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-sm">
          <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="inline-block w-4 h-4 mr-2 rounded-full bg-primary-green"></span>
            Activity Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="shuffleQuestions"
                checked={localActivity.settings?.shuffleQuestions || false}
                onChange={(e) => handleSettingChange('shuffleQuestions', e.target.checked)}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="shuffleQuestions" className="block font-medium text-gray-700 dark:text-gray-300">Shuffle Questions</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Randomize the order of questions for each student</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="shuffleItems"
                checked={localActivity.settings?.shuffleItems || false}
                onChange={(e) => handleSettingChange('shuffleItems', e.target.checked)}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="shuffleItems" className="block font-medium text-gray-700 dark:text-gray-300">Shuffle Items</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Randomize the initial order of sequence items</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="showFeedbackImmediately"
                checked={localActivity.settings?.showFeedbackImmediately || false}
                onChange={(e) => handleSettingChange('showFeedbackImmediately', e.target.checked)}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="showFeedbackImmediately" className="block font-medium text-gray-700 dark:text-gray-300">Show Feedback Immediately</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Display feedback as soon as student submits</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                checked={localActivity.settings?.showCorrectAnswers || false}
                onChange={(e) => handleSettingChange('showCorrectAnswers', e.target.checked)}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="showCorrectAnswers" className="block font-medium text-gray-700 dark:text-gray-300">Show Correct Answers</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reveal correct sequence after submission</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="allowPartialCredit"
                checked={localActivity.settings?.allowPartialCredit || false}
                onChange={(e) => handleSettingChange('allowPartialCredit', e.target.checked)}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="allowPartialCredit" className="block font-medium text-gray-700 dark:text-gray-300">Allow Partial Credit</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Award points for each item in correct position</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
              <label htmlFor="passingPercentage" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Passing Percentage</label>
              <input
                type="number"
                id="passingPercentage"
                value={localActivity.settings?.passingPercentage || 60}
                onChange={(e) => handleSettingChange('passingPercentage', parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimum percentage needed to pass this activity
              </p>
            </div>

            <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
              <label htmlFor="attemptsAllowed" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Attempts Allowed</label>
              <input
                type="number"
                id="attemptsAllowed"
                value={localActivity.settings?.attemptsAllowed || 1}
                onChange={(e) => handleSettingChange('attemptsAllowed', parseInt(e.target.value))}
                min="1"
                className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of times students can attempt this activity
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-medium-teal flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Questions</h2>
          </div>
          <ActivityButton
            onClick={handleAddQuestion}
            variant="success"
            icon="plus"
            ariaLabel="Add new question"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            Add Question
          </ActivityButton>
        </div>

        <div className="space-y-6">
          {localActivity.questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onChange={(updatedQuestion) => handleQuestionChange(index, updatedQuestion)}
              onRemove={() => handleRemoveQuestion(index)}
            />
          ))}
        </div>

        {localActivity.questions.length === 0 && (
          <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No questions added yet</p>
            <ActivityButton
              onClick={handleAddQuestion}
              variant="secondary"
              icon="plus"
              className="mx-auto"
            >
              Add Your First Question
            </ActivityButton>
          </div>
        )}
      </div>

      <div className="flex justify-end sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-800 mt-6 -mx-4 -mb-4">
        <ActivityButton
          onClick={handleSave}
          variant="primary"
          icon="save"
          size="lg"
          className="transition-all duration-300 hover:shadow-md active:shadow-sm"
          ariaLabel="Save sequence activity"
        >
          Save Activity
        </ActivityButton>
      </div>
    </ThemeWrapper>
  );
};

// Question Editor Component
interface QuestionEditorProps {
  question: SequenceQuestion;
  index: number;
  onChange: (question: SequenceQuestion) => void;
  onRemove: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onChange,
  onRemove
}) => {
  // Refs for animation
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [lastReorderedItemId, setLastReorderedItemId] = useState<string | null>(null);

  // Handle question text change
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      text: e.target.value
    });
  };

  // Handle explanation change
  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      explanation: e.target.value
    });
  };

  // Handle hint change
  const handleHintChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      hint: e.target.value
    });
  };

  // Handle partial credit toggle
  const handlePartialCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...question,
      partialCredit: e.target.checked
    });
  };

  // Add a new item with animation
  const handleAddItem = () => {
    // Get the next position
    const nextPosition = question.items.length;

    // Create a new item
    const newItem = createSequenceItem(`Item ${nextPosition + 1}`, nextPosition);

    // Set the last added item ID for animation
    setLastAddedItemId(newItem.id);

    onChange({
      ...question,
      items: [...question.items, newItem]
    });

    // Scroll to the new item after it's added
    setTimeout(() => {
      if (itemsContainerRef.current) {
        itemsContainerRef.current.scrollTop = itemsContainerRef.current.scrollHeight;
      }

      // Reset the last added item ID after animation completes
      setTimeout(() => {
        setLastAddedItemId(null);
      }, 1000);
    }, 100);
  };

  // Remove an item with animation
  const handleRemoveItem = (itemId: string) => {
    // Find the item element
    const itemElement = document.getElementById(`item-${itemId}`);

    if (itemElement) {
      // Add exit animation class
      itemElement.classList.add('animate-fade-out');

      // Remove the item after animation completes
      setTimeout(() => {
        // Get the current items
        const currentItems = [...question.items];

        // Find the item to remove
        const itemIndex = currentItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;

        // Remove the item
        currentItems.splice(itemIndex, 1);

        // Update the positions of the remaining items
        const updatedItems = currentItems.map((item, index) => ({
          ...item,
          correctPosition: index
        }));

        onChange({
          ...question,
          items: updatedItems
        });
      }, 300);
    } else {
      // If element not found, remove immediately
      // Get the current items
      const currentItems = [...question.items];

      // Find the item to remove
      const itemIndex = currentItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return;

      // Remove the item
      currentItems.splice(itemIndex, 1);

      // Update the positions of the remaining items
      const updatedItems = currentItems.map((item, index) => ({
        ...item,
        correctPosition: index
      }));

      onChange({
        ...question,
        items: updatedItems
      });
    }
  };

  // Update an item with animation
  const handleItemChange = (itemId: string, updates: Partial<SequenceItem>) => {
    onChange({
      ...question,
      items: question.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    });

    // Add a subtle pulse animation to the updated item
    const itemElement = document.getElementById(`item-${itemId}`);
    if (itemElement) {
      itemElement.classList.add('highlight-pulse');
      setTimeout(() => {
        itemElement.classList.remove('highlight-pulse');
      }, 1000);
    }
  };

  // Move an item up in the sequence
  const handleMoveItemUp = (itemId: string) => {
    // Get the current items sorted by position
    const sortedItems = [...question.items].sort((a, b) => a.correctPosition - b.correctPosition);

    // Find the item to move
    const itemIndex = sortedItems.findIndex(item => item.id === itemId);
    if (itemIndex <= 0) return; // Already at the top

    // Swap with the item above
    const updatedItems = [...sortedItems];
    [updatedItems[itemIndex], updatedItems[itemIndex - 1]] = [updatedItems[itemIndex - 1], updatedItems[itemIndex]];

    // Update the positions of all items
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      correctPosition: index
    }));

    // Set the last reordered item ID for animation
    setLastReorderedItemId(itemId);
    setTimeout(() => setLastReorderedItemId(null), 1000);

    onChange({
      ...question,
      items: reorderedItems
    });
  };

  // Move an item down in the sequence
  const handleMoveItemDown = (itemId: string) => {
    // Get the current items sorted by position
    const sortedItems = [...question.items].sort((a, b) => a.correctPosition - b.correctPosition);

    // Find the item to move
    const itemIndex = sortedItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1 || itemIndex >= sortedItems.length - 1) return; // Already at the bottom

    // Swap with the item below
    const updatedItems = [...sortedItems];
    [updatedItems[itemIndex], updatedItems[itemIndex + 1]] = [updatedItems[itemIndex + 1], updatedItems[itemIndex]];

    // Update the positions of all items
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      correctPosition: index
    }));

    // Set the last reordered item ID for animation
    setLastReorderedItemId(itemId);
    setTimeout(() => setLastReorderedItemId(null), 1000);

    onChange({
      ...question,
      items: reorderedItems
    });
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    // Get the current items sorted by position
    const sortedItems = [...question.items].sort((a, b) => a.correctPosition - b.correctPosition);

    // Get the item being moved
    const [movedItem] = sortedItems.splice(result.source.index, 1);

    // Insert the item at the new position
    sortedItems.splice(result.destination.index, 0, movedItem);

    // Update the positions of all items
    const updatedItems = sortedItems.map((item, index) => ({
      ...item,
      correctPosition: index
    }));

    // Set the last reordered item ID for animation
    setLastReorderedItemId(movedItem.id);
    setTimeout(() => setLastReorderedItemId(null), 1000);

    onChange({
      ...question,
      items: updatedItems
    });
  };

  // Sort items by correct position
  const sortedItems = [...question.items].sort((a, b) => a.correctPosition - b.correctPosition);

  return (
    <ThemeWrapper className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-medium-teal flex items-center justify-center mr-2 text-white font-bold text-sm">
            {index + 1}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Question {index + 1}</h3>
        </div>
        <ActivityButton
          onClick={onRemove}
          variant="danger"
          disabled={false}
          icon="trash"
          ariaLabel={`Remove question ${index + 1}`}
          className="transition-transform hover:scale-105 active:scale-95"
        >
          Remove
        </ActivityButton>
      </div>

      <div className="mb-4 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Question Text</label>
        <textarea
          value={question.text}
          onChange={handleQuestionTextChange}
          className="w-full p-2 min-h-[60px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
          rows={2}
          placeholder="Enter instructions for this sequence question"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Clear instructions help students understand what they need to sequence.
        </p>
      </div>

      <div className="mb-4 p-2 bg-light-mint/20 dark:bg-primary-green/10 rounded-md">
        <div className="flex items-center mb-1">
          <input
            type="checkbox"
            id={`partial-credit-${question.id}`}
            checked={question.partialCredit || false}
            onChange={handlePartialCreditChange}
            className="mr-2 accent-primary-green dark:accent-medium-teal h-4 w-4"
          />
          <label htmlFor={`partial-credit-${question.id}`} className="font-medium text-gray-700 dark:text-gray-300">Allow Partial Credit for this Question</label>
        </div>
        <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
          When enabled, students receive points for each item in the correct position rather than requiring the entire sequence to be correct.
        </p>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium text-gray-700 dark:text-gray-300">Sequence Items (Drag to reorder)</label>
          <ActivityButton
            onClick={handleAddItem}
            variant="secondary"
            icon="plus"
            className="text-sm py-1"
            ariaLabel="Add new sequence item"
          >
            Add Item
          </ActivityButton>
        </div>

        <div
          ref={itemsContainerRef}
          className="max-h-[400px] overflow-y-auto pr-1 rounded-md"
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`items-${question.id}`}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {sortedItems.map((item, itemIndex) => (
                    <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                      {(provided, snapshot) => (
                        <div
                          id={`item-${item.id}`}
                          ref={provided.innerRef}
                          className={cn(
                            "p-4 border rounded-lg transition-all duration-200",
                            "hover:border-medium-teal dark:hover:border-medium-teal",
                            "focus-within:border-primary-green dark:focus-within:border-medium-teal",
                            "focus-within:ring-1 focus-within:ring-primary-green dark:focus-within:ring-medium-teal",
                            {
                              "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800": !snapshot.isDragging,
                              "border-medium-teal dark:border-medium-teal bg-light-mint/30 dark:bg-primary-green/20 shadow-md": snapshot.isDragging,
                              "slide-in": lastAddedItemId === item.id,
                              "reorder-highlight": lastReorderedItemId === item.id,
                              "animate-shake": snapshot.isDropAnimating && snapshot.draggingOver !== `items-${question.id}`,
                            }
                          )}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="p-1 rounded-md cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700 active:cursor-grabbing"
                                title="Drag to reorder"
                              >
                                <GripVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div className="flex items-center">
                                <span className="w-6 h-6 rounded-full bg-medium-teal flex items-center justify-center mr-2 text-white font-bold text-sm">
                                  {itemIndex + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Position {itemIndex + 1}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleMoveItemUp(item.id)}
                                disabled={itemIndex === 0}
                                className={cn(
                                  "p-1 rounded-md transition-colors",
                                  itemIndex === 0
                                    ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                    : "text-primary-green dark:text-medium-teal hover:bg-light-mint/30 dark:hover:bg-primary-green/20"
                                )}
                                title="Move up"
                                aria-label="Move item up"
                              >
                                <ArrowUp className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItemDown(item.id)}
                                disabled={itemIndex === sortedItems.length - 1}
                                className={cn(
                                  "p-1 rounded-md transition-colors",
                                  itemIndex === sortedItems.length - 1
                                    ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                    : "text-primary-green dark:text-medium-teal hover:bg-light-mint/30 dark:hover:bg-primary-green/20"
                                )}
                                title="Move down"
                                aria-label="Move item down"
                              >
                                <ArrowDown className="h-5 w-5" />
                              </button>
                              <ActivityButton
                                onClick={() => handleRemoveItem(item.id)}
                                variant="danger"
                                icon="trash"
                                className="text-sm py-1"
                                disabled={question.items.length <= 2}
                                ariaLabel={`Remove item ${itemIndex + 1}`}
                              >
                                Remove
                              </ActivityButton>
                            </div>
                          </div>

                          <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Item Text</label>
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => handleItemChange(item.id, { text: e.target.value })}
                              className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                              placeholder="Enter text for this sequence item"
                            />
                          </div>

                          <div className="mt-3 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Feedback (Optional)</label>
                            <input
                              type="text"
                              value={item.feedback || ''}
                              onChange={(e) => handleItemChange(item.id, { feedback: e.target.value })}
                              className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                              placeholder="Feedback for this item (shown to students)"
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

          {sortedItems.length === 0 && (
            <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No sequence items added yet</p>
              <ActivityButton
                onClick={handleAddItem}
                variant="secondary"
                icon="plus"
                className="mx-auto"
              >
                Add Your First Item
              </ActivityButton>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Explanation</label>
          <textarea
            value={question.explanation || ''}
            onChange={handleExplanationChange}
            className="w-full p-2 min-h-[80px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={3}
            placeholder="Explain the correct sequence to help students understand the order"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Shown to students after submission to help them understand the correct sequence.
          </p>
        </div>

        <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Hint</label>
          <textarea
            value={question.hint || ''}
            onChange={handleHintChange}
            className="w-full p-2 min-h-[80px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={3}
            placeholder="Provide a hint that students can access if they're struggling"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional hint that students can reveal if they need help.
          </p>
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default SequenceEditor;
