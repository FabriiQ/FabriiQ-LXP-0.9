'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DragAndDropActivity, DragAndDropQuestion, DragAndDropItem, DropZone, createDefaultDragAndDropActivity, createDefaultDragAndDropQuestion } from '../../models/drag-and-drop';
import { ActivityButton } from '../ui/ActivityButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { MediaUploader } from '../ui/MediaUploader';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

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

// Custom Move icon
const Move = (props: React.SVGProps<SVGSVGElement>) => (
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
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
);

export interface DragAndDropEditorProps {
  activity?: DragAndDropActivity;
  onChange?: (activity: DragAndDropActivity) => void;
  onSave?: (activity: DragAndDropActivity) => void;
  className?: string;
}

/**
 * Drag and Drop Activity Editor
 *
 * This component provides an interface for creating and editing drag and drop activities.
 * It includes:
 * - Activity metadata editing
 * - Question editing
 * - Item management
 * - Zone management
 * - Settings configuration
 */
// Add CSS keyframes for animations
const addAnimationStyles = () => {
  if (typeof document !== 'undefined') {
    // Check if styles already exist
    if (!document.getElementById('drag-and-drop-editor-animations')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'drag-and-drop-editor-animations';
      styleEl.textContent = `
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }
};

export const DragAndDropEditor: React.FC<DragAndDropEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Add animation styles on component mount
  useEffect(() => {
    addAnimationStyles();
  }, []);
  // Initialize with default activity if none provided
  const [localActivity, setLocalActivity] = useState<DragAndDropActivity>(
    activity || createDefaultDragAndDropActivity()
  );

  // Current question being edited
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Refs for animation
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const zonesContainerRef = useRef<HTMLDivElement>(null);

  // Track newly added items and zones for animations
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [lastAddedZoneId, setLastAddedZoneId] = useState<string | null>(null);
  const [lastUpdatedItemId, setLastUpdatedItemId] = useState<string | null>(null);
  const [lastUpdatedZoneId, setLastUpdatedZoneId] = useState<string | null>(null);

  // Update local activity when prop changes
  useEffect(() => {
    if (activity) {
      setLocalActivity(activity);
    }
  }, [activity]);

  // Get current question
  const currentQuestion = localActivity.questions[currentQuestionIndex] || localActivity.questions[0];

  // Update activity with changes
  const updateActivity = (updates: Partial<DragAndDropActivity>) => {
    const updatedActivity = {
      ...localActivity,
      ...updates,
      updatedAt: new Date()
    };
    setLocalActivity(updatedActivity);

    if (onChange) {
      onChange(updatedActivity);
    }
  };

  // Update current question
  const updateQuestion = (updates: Partial<DragAndDropQuestion>) => {
    const updatedQuestions = [...localActivity.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      ...updates
    };

    updateActivity({ questions: updatedQuestions });
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion = createDefaultDragAndDropQuestion();
    updateActivity({
      questions: [...localActivity.questions, newQuestion]
    });
    setCurrentQuestionIndex(localActivity.questions.length);
  };

  // Remove current question
  const handleRemoveQuestion = () => {
    if (localActivity.questions.length <= 1) {
      return; // Don't remove the last question
    }

    const updatedQuestions = [...localActivity.questions];
    updatedQuestions.splice(currentQuestionIndex, 1);

    updateActivity({ questions: updatedQuestions });
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };

  // Add a new item to the current question with animation
  const handleAddItem = () => {
    const newItem: DragAndDropItem = {
      id: `item-${Date.now()}`,
      text: `New Item ${currentQuestion.items.length + 1}`,
      correctZoneId: currentQuestion.zones[0]?.id || '',
      feedback: 'Feedback for this item'
    };

    // Set the last added item ID for animation
    setLastAddedItemId(newItem.id);

    updateQuestion({
      items: [...currentQuestion.items, newItem]
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

  // Remove an item from the current question with animation
  const handleRemoveItem = (itemIndex: number) => {
    const itemId = currentQuestion.items[itemIndex].id;

    // Find the item element
    const itemElement = document.getElementById(`item-${itemId}`);

    if (itemElement) {
      // Add exit animation class
      itemElement.classList.add('animate-fade-out');

      // Remove the item after animation completes
      setTimeout(() => {
        const updatedItems = [...currentQuestion.items];
        updatedItems.splice(itemIndex, 1);
        updateQuestion({ items: updatedItems });
      }, 300);
    } else {
      // If element not found, remove immediately
      const updatedItems = [...currentQuestion.items];
      updatedItems.splice(itemIndex, 1);
      updateQuestion({ items: updatedItems });
    }
  };

  // Update an item in the current question with animation
  const handleUpdateItem = (itemIndex: number, updates: Partial<DragAndDropItem>) => {
    const updatedItems = [...currentQuestion.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      ...updates
    };

    updateQuestion({ items: updatedItems });

    // Add a subtle pulse animation to the updated item
    const itemId = updatedItems[itemIndex].id;
    setLastUpdatedItemId(itemId);

    // Reset the animation after it completes
    setTimeout(() => {
      setLastUpdatedItemId(null);
    }, 1000);
  };

  // Add a new zone to the current question with animation
  const handleAddZone = () => {
    const newZone: DropZone = {
      id: `zone-${Date.now()}`,
      text: `Zone ${currentQuestion.zones.length + 1}`,
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      backgroundColor: 'rgba(230, 230, 230, 0.5)',
      borderColor: '#cccccc'
    };

    // Set the last added zone ID for animation
    setLastAddedZoneId(newZone.id);

    updateQuestion({
      zones: [...currentQuestion.zones, newZone]
    });

    // Scroll to the new zone after it's added
    setTimeout(() => {
      if (zonesContainerRef.current) {
        zonesContainerRef.current.scrollTop = zonesContainerRef.current.scrollHeight;
      }

      // Reset the last added zone ID after animation completes
      setTimeout(() => {
        setLastAddedZoneId(null);
      }, 1000);
    }, 100);
  };

  // Remove a zone from the current question with animation
  const handleRemoveZone = (zoneIndex: number) => {
    const zoneId = currentQuestion.zones[zoneIndex].id;
    const removedZoneId = zoneId;

    // Find the zone element
    const zoneElement = document.getElementById(`zone-${zoneId}`);

    if (zoneElement) {
      // Add exit animation class
      zoneElement.classList.add('animate-fade-out');

      // Remove the zone after animation completes
      setTimeout(() => {
        const updatedZones = [...currentQuestion.zones];
        updatedZones.splice(zoneIndex, 1);

        // Update items that were assigned to this zone
        const updatedItems = currentQuestion.items.map(item => {
          if (item.correctZoneId === removedZoneId) {
            return {
              ...item,
              correctZoneId: updatedZones[0]?.id || ''
            };
          }
          return item;
        });

        updateQuestion({
          zones: updatedZones,
          items: updatedItems
        });
      }, 300);
    } else {
      // If element not found, remove immediately
      const updatedZones = [...currentQuestion.zones];
      updatedZones.splice(zoneIndex, 1);

      // Update items that were assigned to this zone
      const updatedItems = currentQuestion.items.map(item => {
        if (item.correctZoneId === removedZoneId) {
          return {
            ...item,
            correctZoneId: updatedZones[0]?.id || ''
          };
        }
        return item;
      });

      updateQuestion({
        zones: updatedZones,
        items: updatedItems
      });
    }
  };

  // Update a zone in the current question with animation
  const handleUpdateZone = (zoneIndex: number, updates: Partial<DropZone>) => {
    const updatedZones = [...currentQuestion.zones];
    updatedZones[zoneIndex] = {
      ...updatedZones[zoneIndex],
      ...updates
    };

    updateQuestion({ zones: updatedZones });

    // Add a subtle pulse animation to the updated zone
    const zoneId = updatedZones[zoneIndex].id;
    setLastUpdatedZoneId(zoneId);

    // Reset the animation after it completes
    setTimeout(() => {
      setLastUpdatedZoneId(null);
    }, 1000);
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(localActivity);
    }
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 rounded-full bg-primary-green flex items-center justify-center mr-3">
            <span className="text-white font-bold">D</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Drag and Drop Activity</h2>
        </div>

        {/* Activity title */}
        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={localActivity.title}
            onChange={(e) => updateActivity({ title: e.target.value })}
            className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            placeholder="Enter a descriptive title for this activity"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A clear title helps students understand the activity's purpose.
          </p>
        </div>

        {/* Activity description */}
        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={localActivity.description || ''}
            onChange={(e) => updateActivity({ description: e.target.value })}
            className="w-full p-2 min-h-[60px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={2}
            placeholder="Provide a brief description of this drag and drop activity"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This description appears in activity listings and summaries.
          </p>
        </div>

        {/* Activity instructions */}
        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Instructions</label>
          <textarea
            value={localActivity.instructions || ''}
            onChange={(e) => updateActivity({ instructions: e.target.value })}
            className="w-full p-2 min-h-[80px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={3}
            placeholder="Provide clear instructions for students on how to complete this activity"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Detailed instructions help students understand how to drag and drop items to their correct zones.
          </p>
        </div>

        {/* Activity settings */}
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
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    shuffleQuestions: e.target.checked
                  }
                })}
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
                id="showFeedback"
                checked={localActivity.settings?.showFeedbackImmediately || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    showFeedbackImmediately: e.target.checked
                  }
                })}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="showFeedback" className="block font-medium text-gray-700 dark:text-gray-300">Show Feedback Immediately</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Display feedback as soon as student submits</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="snapToGrid"
                checked={localActivity.settings?.snapToGrid || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    snapToGrid: e.target.checked
                  }
                })}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="snapToGrid" className="block font-medium text-gray-700 dark:text-gray-300">Snap to Grid</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Make items snap to grid positions when dragged</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="showItemsInColumn"
                checked={localActivity.settings?.showItemsInColumn || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    showItemsInColumn: e.target.checked
                  }
                })}
                className="mt-1 mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
              />
              <div>
                <label htmlFor="showItemsInColumn" className="block font-medium text-gray-700 dark:text-gray-300">Show Items in Column</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Display draggable items in a vertical column</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
              <label htmlFor="passingPercentage" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Passing Percentage</label>
              <input
                type="number"
                id="passingPercentage"
                min="0"
                max="100"
                value={localActivity.settings?.passingPercentage || 60}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    passingPercentage: parseInt(e.target.value)
                  }
                })}
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
                min="1"
                value={localActivity.settings?.attemptsAllowed || 1}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    attemptsAllowed: parseInt(e.target.value)
                  }
                })}
                className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of times students can attempt this activity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question navigation */}
      <div className="mb-5 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-medium-teal flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <select
              value={currentQuestionIndex}
              onChange={(e) => setCurrentQuestionIndex(parseInt(e.target.value))}
              className="p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
              aria-label="Select question"
            >
              {localActivity.questions.map((q, index) => (
                <option key={q.id} value={index}>
                  Question {index + 1}
                </option>
              ))}
            </select>

            <ActivityButton
              onClick={handleRemoveQuestion}
              disabled={localActivity.questions.length <= 1}
              variant="danger"
              icon="trash"
              className="ml-2 transition-transform hover:scale-105 active:scale-95"
              ariaLabel="Remove current question"
            >
              Remove
            </ActivityButton>
          </div>

          <ActivityButton
            onClick={handleAddQuestion}
            variant="success"
            icon="plus"
            className="transition-transform hover:scale-105 active:scale-95"
            ariaLabel="Add new question"
          >
            Add Question
          </ActivityButton>
        </div>

        {localActivity.questions.length === 0 && (
          <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No questions added yet</p>
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

      {/* Question editor */}
      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="w-6 h-6 rounded-full bg-medium-teal flex items-center justify-center mr-2 text-white font-bold text-sm">
            {currentQuestionIndex + 1}
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Question {currentQuestionIndex + 1}
          </h3>
        </div>

        {/* Question text */}
        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Question Text</label>
          <textarea
            value={currentQuestion.text}
            onChange={(e) => updateQuestion({ text: e.target.value })}
            className="w-full p-2 min-h-[60px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={2}
            placeholder="Enter instructions for this drag and drop question"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Clear instructions help students understand what they need to match.
          </p>
        </div>

        {/* Question hint */}
        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Hint (Optional)</label>
          <textarea
            value={currentQuestion.hint || ''}
            onChange={(e) => updateQuestion({ hint: e.target.value })}
            className="w-full p-2 min-h-[60px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={2}
            placeholder="Provide a hint that students can access if they're struggling"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional hint that students can reveal if they need help.
          </p>
        </div>

        {/* Question explanation */}
        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Explanation (Optional)</label>
          <textarea
            value={currentQuestion.explanation || ''}
            onChange={(e) => updateQuestion({ explanation: e.target.value })}
            className="w-full p-2 min-h-[60px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            rows={2}
            placeholder="Explain the correct answers to help students understand"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Shown to students after submission to help them understand the correct answers.
          </p>
        </div>

        {/* Background image */}
        <div className="mb-5 transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Background Image URL (Optional)</label>
          <input
            type="text"
            value={currentQuestion.backgroundImage || ''}
            onChange={(e) => updateQuestion({ backgroundImage: e.target.value })}
            className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
            placeholder="https://example.com/image.jpg"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add a background image for the drag and drop area. Items will be placed on top of this image.
          </p>

          {currentQuestion.backgroundImage && (
            <div className="mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview:</p>
              <img
                src={currentQuestion.backgroundImage}
                alt="Background preview"
                className="max-w-full h-auto max-h-[200px] object-contain rounded-md"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22318%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20318%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_158bd1d28ef%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3A-apple-system%2CBlinkMacSystemFont%2C%26quot%3BSegoe%20UI%26quot%3B%2CRoboto%2C%26quot%3BHelvetica%20Neue%26quot%3B%2CArial%2C%26quot%3BNoto%20Sans%26quot%3B%2Csans-serif%2C%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Symbol%26quot%3B%2C%26quot%3BNoto%20Color%20Emoji%26quot%3B%2C%20monospace%3Bfont-size%3A16pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_158bd1d28ef%22%3E%3Crect%20width%3D%22318%22%20height%3D%22180%22%20fill%3D%22%23363636%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22129.359375%22%20y%3D%2297.35%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                  e.currentTarget.alt = 'Error loading image';
                }}
              />
            </div>
          )}
        </div>

        {/* Zones section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-medium-teal flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Drop Zones</h4>
            </div>
            <ActivityButton
              onClick={handleAddZone}
              variant="secondary"
              icon="plus"
              className="text-sm transition-transform hover:scale-105 active:scale-95"
              ariaLabel="Add new drop zone"
            >
              Add Zone
            </ActivityButton>
          </div>

          <div
            ref={zonesContainerRef}
            className="max-h-[500px] overflow-y-auto pr-1 rounded-md"
          >
            {currentQuestion.zones.map((zone, zoneIndex) => (
              <div
                id={`zone-${zone.id}`}
                key={zone.id}
                className={cn(
                  "mb-4 p-4 border rounded-lg transition-all duration-200",
                  "hover:border-medium-teal dark:hover:border-medium-teal",
                  "focus-within:border-primary-green dark:focus-within:border-medium-teal",
                  "focus-within:ring-1 focus-within:ring-primary-green dark:focus-within:ring-medium-teal",
                  "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800",
                  {
                    "animate-fade-in": lastAddedZoneId === zone.id,
                    "highlight-pulse": lastUpdatedZoneId === zone.id
                  }
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-medium-teal flex items-center justify-center mr-2 text-white font-bold text-sm">
                      {zoneIndex + 1}
                    </div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Zone {zoneIndex + 1}</h5>
                  </div>
                  <ActivityButton
                    onClick={() => handleRemoveZone(zoneIndex)}
                    variant="danger"
                    icon="trash"
                    className="text-sm transition-transform hover:scale-105 active:scale-95"
                    ariaLabel={`Remove zone ${zoneIndex + 1}`}
                  >
                    Remove
                  </ActivityButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Zone Text</label>
                    <input
                      type="text"
                      value={zone.text}
                      onChange={(e) => handleUpdateZone(zoneIndex, { text: e.target.value })}
                      className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                      placeholder="Enter text for this zone"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Text displayed in the drop zone
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">X Position</label>
                      <input
                        type="number"
                        value={zone.x}
                        onChange={(e) => handleUpdateZone(zoneIndex, { x: parseInt(e.target.value) })}
                        className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                      />
                    </div>

                    <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Y Position</label>
                      <input
                        type="number"
                        value={zone.y}
                        onChange={(e) => handleUpdateZone(zoneIndex, { y: parseInt(e.target.value) })}
                        className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Width</label>
                      <input
                        type="number"
                        value={zone.width}
                        onChange={(e) => handleUpdateZone(zoneIndex, { width: parseInt(e.target.value) })}
                        className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                      />
                    </div>

                    <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Height</label>
                      <input
                        type="number"
                        value={zone.height}
                        onChange={(e) => handleUpdateZone(zoneIndex, { height: parseInt(e.target.value) })}
                        className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Background Color</label>
                      <input
                        type="text"
                        value={zone.backgroundColor || 'rgba(230, 230, 230, 0.5)'}
                        onChange={(e) => handleUpdateZone(zoneIndex, { backgroundColor: e.target.value })}
                        className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                        placeholder="rgba(230, 230, 230, 0.5)"
                      />
                    </div>

                    <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Border Color</label>
                      <input
                        type="text"
                        value={zone.borderColor || '#cccccc'}
                        onChange={(e) => handleUpdateZone(zoneIndex, { borderColor: e.target.value })}
                        className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                        placeholder="#cccccc"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-light-mint/10 dark:bg-primary-green/5 rounded-md">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Preview: </span>
                    <span className="inline-block mt-1 p-2 rounded" style={{
                      backgroundColor: zone.backgroundColor || 'rgba(230, 230, 230, 0.5)',
                      border: `1px solid ${zone.borderColor || '#cccccc'}`,
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>
                      {zone.text}
                    </span>
                  </p>
                </div>
              </div>
            ))}

            {currentQuestion.zones.length === 0 && (
              <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No drop zones added yet</p>
                <ActivityButton
                  onClick={handleAddZone}
                  variant="secondary"
                  icon="plus"
                  className="mx-auto"
                >
                  Add Your First Zone
                </ActivityButton>
              </div>
            )}
          </div>
        </div>

        {/* Items section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-primary-green flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Draggable Items</h4>
            </div>
            <ActivityButton
              onClick={handleAddItem}
              variant="secondary"
              icon="plus"
              className="text-sm transition-transform hover:scale-105 active:scale-95"
              ariaLabel="Add new draggable item"
            >
              Add Item
            </ActivityButton>
          </div>

          <div
            ref={itemsContainerRef}
            className="max-h-[500px] overflow-y-auto pr-1 rounded-md"
          >
            {currentQuestion.items.map((item, itemIndex) => (
              <div
                id={`item-${item.id}`}
                key={item.id}
                className={cn(
                  "mb-4 p-4 border rounded-lg transition-all duration-200",
                  "hover:border-primary-green dark:hover:border-primary-green",
                  "focus-within:border-primary-green dark:focus-within:border-medium-teal",
                  "focus-within:ring-1 focus-within:ring-primary-green dark:focus-within:ring-medium-teal",
                  "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800",
                  {
                    "animate-fade-in": lastAddedItemId === item.id,
                    "highlight-pulse": lastUpdatedItemId === item.id
                  }
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-primary-green flex items-center justify-center mr-2 text-white font-bold text-sm">
                      {itemIndex + 1}
                    </div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Item {itemIndex + 1}</h5>
                  </div>
                  <ActivityButton
                    onClick={() => handleRemoveItem(itemIndex)}
                    variant="danger"
                    icon="trash"
                    className="text-sm transition-transform hover:scale-105 active:scale-95"
                    ariaLabel={`Remove item ${itemIndex + 1}`}
                  >
                    Remove
                  </ActivityButton>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Item Text</label>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateItem(itemIndex, { text: e.target.value })}
                      className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                      placeholder="Enter text for this draggable item"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Text displayed on the draggable item
                    </p>
                  </div>

                  <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Correct Zone</label>
                    <select
                      value={item.correctZoneId}
                      onChange={(e) => handleUpdateItem(itemIndex, { correctZoneId: e.target.value })}
                      className="w-full p-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                    >
                      {currentQuestion.zones.length > 0 ? (
                        currentQuestion.zones.map((zone, zoneIndex) => (
                          <option key={zone.id} value={zone.id}>
                            Zone {zoneIndex + 1}: {zone.text}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No zones available - add zones first</option>
                      )}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      The zone where this item should be placed
                    </p>
                  </div>

                  <div className="transition-all duration-200 hover:shadow-sm focus-within:shadow-sm rounded-md p-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Feedback</label>
                    <textarea
                      value={item.feedback || ''}
                      onChange={(e) => handleUpdateItem(itemIndex, { feedback: e.target.value })}
                      className="w-full p-2 min-h-[60px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-green focus:ring-1 focus:ring-primary-green dark:focus:border-medium-teal dark:focus:ring-medium-teal"
                      rows={2}
                      placeholder="Feedback shown to students when this item is placed correctly"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Feedback shown to students when this item is placed in the correct zone
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-light-mint/10 dark:bg-primary-green/5 rounded-md">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Preview: </span>
                    <span className="inline-block mt-1 p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-sm">
                      {item.text}
                    </span>
                    <span className="mx-2">→</span>
                    <span className="inline-block mt-1 p-2 rounded" style={{
                      backgroundColor: currentQuestion.zones.find(z => z.id === item.correctZoneId)?.backgroundColor || 'rgba(230, 230, 230, 0.5)',
                      border: `1px solid ${currentQuestion.zones.find(z => z.id === item.correctZoneId)?.borderColor || '#cccccc'}`,
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>
                      {currentQuestion.zones.find(z => z.id === item.correctZoneId)?.text || 'No zone selected'}
                    </span>
                  </p>
                </div>
              </div>
            ))}

            {currentQuestion.items.length === 0 && (
              <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No draggable items added yet</p>
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
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-800 -mx-4 -mb-4">
        <ActivityButton
          onClick={handleSave}
          variant="primary"
          icon="save"
          size="lg"
          className="transition-all duration-300 hover:shadow-md active:shadow-sm"
          ariaLabel="Save drag and drop activity"
        >
          Save Activity
        </ActivityButton>
      </div>
    </ThemeWrapper>
  );
};

export default DragAndDropEditor;
