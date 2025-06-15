'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SequenceActivity,
  SequenceQuestion,
  SequenceItem,
  shuffleArray
} from '../../models/sequence';
import { gradeSequenceActivity } from '../../grading/sequence';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { ActivityButton } from '../ui/ActivityButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { RichTextDisplay } from '../ui/RichTextDisplay';
import { MediaDisplay } from '../ui/MediaDisplay';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Sorting animation styles
const sortingAnimationStyles = `
  @keyframes sort-item-up {
    0% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0); }
  }

  @keyframes sort-item-down {
    0% { transform: translateY(0); }
    50% { transform: translateY(10px); }
    100% { transform: translateY(0); }
  }

  .sort-item-up {
    animation: sort-item-up 0.3s ease-in-out;
  }

  .sort-item-down {
    animation: sort-item-down 0.3s ease-in-out;
  }

  @keyframes drag-start {
    0% { transform: scale(1); }
    100% { transform: scale(1.02); }
  }

  .drag-start {
    animation: drag-start 0.2s forwards;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  @keyframes correct-position {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(34, 197, 94, 0.5); }
    100% { transform: scale(1); }
  }

  .correct-position {
    animation: correct-position 0.5s ease-in-out;
  }

  @keyframes wrong-position {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
    75% { transform: translateX(5px); box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
  }

  .wrong-position {
    animation: wrong-position 0.5s ease-in-out;
  }

  @keyframes current-position-pulse {
    0% { box-shadow: 0 0 0 0 rgba(90, 138, 132, 0.4); }
    70% { box-shadow: 0 0 0 8px rgba(90, 138, 132, 0); }
    100% { box-shadow: 0 0 0 0 rgba(90, 138, 132, 0); }
  }

  .current-position {
    animation: current-position-pulse 1.5s infinite;
    border-left: 4px solid hsl(var(--medium-teal)) !important;
  }

  /* Touch-friendly improvements */
  @media (pointer: coarse) {
    .sequence-item {
      min-height: 60px;
      padding: 12px !important;
    }

    .sequence-item-number {
      width: 36px !important;
      height: 36px !important;
    }
  }
`;

export interface SequenceViewerProps {
  activity: SequenceActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, string[]>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Sequence Activity Viewer
 *
 * This component displays a sequence activity with:
 * - Drag and drop functionality for reordering
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 */
export const SequenceViewer: React.FC<SequenceViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking sequences and submission
  const [sequences, setSequences] = useState<Record<string, string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Animation states
  const [animatingItems, setAnimatingItems] = useState<Record<string, string>>({});
  const [correctPositions, setCorrectPositions] = useState<Record<string, boolean>>({});

  // Refs for item elements
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<SequenceQuestion[]>([]);

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = sortingAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Initialize shuffled questions and sequences
  useEffect(() => {
    let questions = [...activity.questions];

    // Shuffle questions if enabled
    if (activity.settings?.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    // Initialize sequences with shuffled items
    const initialSequences: Record<string, string[]> = {};

    questions.forEach(question => {
      let items = [...question.items];

      // Shuffle items if enabled
      if (activity.settings?.shuffleItems && !isSubmitted) {
        items = shuffleArray(items);
      } else {
        // Sort by correct position for teacher mode or if submitted
        items = items.sort((a, b) => a.correctPosition - b.correctPosition);
      }

      initialSequences[question.id] = items.map(item => item.id);
    });

    setShuffledQuestions(questions);
    setSequences(initialSequences);
  }, [activity, isSubmitted]);

  // Track progress
  useEffect(() => {
    // Count questions that have been attempted
    const attemptedCount = Object.keys(sequences).length;
    const totalCount = shuffledQuestions.length;

    const progress = totalCount > 0 ? (attemptedCount / totalCount) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [sequences, shuffledQuestions.length, onProgress]);

  // Handle drag end with animations
  const handleDragEnd = (result: DropResult, questionId: string) => {
    if (!result.destination) return;
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    const items = Array.from(sequences[questionId] || []);
    const reorderedItemId = items[result.source.index];
    const fromPosition = result.source.index;
    const toPosition = result.destination.index;

    // Reorder the items
    const [reorderedItem] = items.splice(fromPosition, 1);
    items.splice(toPosition, 0, reorderedItem);

    // Add animation effect based on direction
    const animationClass = fromPosition < toPosition ? 'sort-item-down' : 'sort-item-up';

    // Set animating item
    setAnimatingItems(prev => ({
      ...prev,
      [reorderedItemId]: animationClass
    }));

    // Clear animation after a delay
    setTimeout(() => {
      setAnimatingItems(prev => {
        const newAnimations = { ...prev };
        delete newAnimations[reorderedItemId];
        return newAnimations;
      });
    }, 500);

    // Track the reordering in analytics
    analytics.trackEvent('sequence_reorder', {
      activityId: activity.id,
      questionId,
      itemId: reorderedItemId,
      fromPosition,
      toPosition
    });

    setSequences(prev => ({
      ...prev,
      [questionId]: items
    }));
  };

  // Handle keyboard reordering with animations
  const handleKeyboardReorder = (questionId: string, itemIndex: number, direction: 'up' | 'down') => {
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    const items = Array.from(sequences[questionId] || []);
    const itemId = items[itemIndex];
    let fromPosition = itemIndex;
    let toPosition = itemIndex;

    if (direction === 'up' && itemIndex > 0) {
      // Move item up
      toPosition = itemIndex - 1;
      [items[itemIndex], items[itemIndex - 1]] = [items[itemIndex - 1], items[itemIndex]];

      // Add animation
      setAnimatingItems(prev => ({
        ...prev,
        [itemId]: 'sort-item-up'
      }));
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      // Move item down
      toPosition = itemIndex + 1;
      [items[itemIndex], items[itemIndex + 1]] = [items[itemIndex + 1], items[itemIndex]];

      // Add animation
      setAnimatingItems(prev => ({
        ...prev,
        [itemId]: 'sort-item-down'
      }));
    } else {
      return; // No change needed
    }

    // Clear animation after a delay
    setTimeout(() => {
      setAnimatingItems(prev => {
        const newAnimations = { ...prev };
        delete newAnimations[itemId];
        return newAnimations;
      });
    }, 500);

    // Track the reordering in analytics
    analytics.trackEvent('sequence_reorder', {
      activityId: activity.id,
      questionId,
      itemId,
      fromPosition,
      toPosition
    });

    setSequences(prev => ({
      ...prev,
      [questionId]: items
    }));
  };

  // Handle submission with animations
  const handleSubmit = () => {
    // Record the start time for timing
    const startTime = performance.now();

    // Grade the activity
    const result = gradeSequenceActivity(activity, sequences);
    setScore(result.percentage);
    setIsSubmitted(true);

    // Calculate time spent grading
    const timeSpent = performance.now() - startTime;

    // Animate correct/incorrect positions
    const newCorrectPositions: Record<string, boolean> = {};

    result.questionResults.forEach(questionResult => {
      const sequence = sequences[questionResult.questionId] || [];

      // Find the question
      const question = activity.questions.find(q => q.id === questionResult.questionId);

      if (question) {
        // Check each item position
        sequence.forEach((itemId, index) => {
          const item = question.items.find(i => i.id === itemId);
          if (item) {
            const isCorrect = item.correctPosition === index;
            newCorrectPositions[itemId] = isCorrect;

            // Add animation
            setAnimatingItems(prev => ({
              ...prev,
              [itemId]: isCorrect ? 'correct-position' : 'wrong-position'
            }));
          }
        });
      }
    });

    // Set correct positions for styling
    setCorrectPositions(newCorrectPositions);

    // Clear animations after a delay
    setTimeout(() => {
      setAnimatingItems({});
    }, 1000);

    // Track activity completion in analytics
    analytics.trackEvent('activity_submit', {
      activityId: activity.id,
      activityType: activity.activityType,
      score: result.percentage,
      passed: result.passed,
      timeSpent
    });

    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(sequences, result);
    }
  };

  // Handle reset with animations
  const handleReset = () => {
    // Clear animations
    setAnimatingItems({});
    setCorrectPositions({});

    // Reset state
    setIsSubmitted(false);
    setScore(null);

    // Re-initialize sequences with shuffled items
    const initialSequences: Record<string, string[]> = {};

    shuffledQuestions.forEach(question => {
      let items = [...question.items];

      // Shuffle items
      if (activity.settings?.shuffleItems) {
        items = shuffleArray(items);
      }

      initialSequences[question.id] = items.map(item => item.id);
    });

    // Track reset in analytics
    analytics.trackEvent('activity_reset', {
      activityId: activity.id,
      activityType: activity.activityType
    });

    setSequences(initialSequences);
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Render a single question
  const renderQuestion = (question: SequenceQuestion, index: number) => {
    // Get the sequence for this question
    const sequence = sequences[question.id] || [];

    // Get the results for this question if submitted
    let questionResult: any = null;
    if (isSubmitted && score !== null) {
      try {
        const result = gradeSequenceActivity(
          { ...activity, questions: [question] },
          { [question.id]: sequence }
        );
        questionResult = result.questionResults[0];
      } catch (e) {
        console.error('Error grading question:', e);
      }
    }

    // Map sequence to items
    const sequenceItems = sequence.map(itemId =>
      question.items.find(item => item.id === itemId)
    ).filter((item): item is SequenceItem => item !== undefined);

    // Note: Correct sequence is displayed in the feedback section when submitted

    return (
      <ThemeWrapper key={question.id} className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
          Question {index + 1}: {question.text}
        </h3>

        {/* Question hint */}
        {question.hint && (
          <QuestionHint
            hint={question.hint}
            onHintShow={() => {
              // Track hint view in analytics
              analytics.trackHintView(
                activity.id,
                question.id,
                index
              );
            }}
          />
        )}

        {/* Sequence items */}
        <div className="mt-4">
          {!isSubmitted && (
            <div className="mb-3 p-3 bg-light-mint/50 dark:bg-primary-green/10 rounded text-sm text-gray-700 dark:text-gray-300 border border-medium-teal/30 dark:border-medium-teal/20">
              <p className="font-medium text-primary-green dark:text-medium-teal">Instructions:</p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-medium-teal/20 text-primary-green dark:bg-medium-teal/30 dark:text-medium-teal mr-2">1</span>
                  <span>Drag and drop items to reorder them</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-medium-teal/20 text-primary-green dark:bg-medium-teal/30 dark:text-medium-teal mr-2">2</span>
                  <span>Tap and hold to drag on touch devices</span>
                </div>
                <div className="hidden md:flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-medium-teal/20 text-primary-green dark:bg-medium-teal/30 dark:text-medium-teal mr-2">3</span>
                  <span>Use <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>/<kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd> keys to move items</span>
                </div>
              </div>
            </div>
          )}

          <DragDropContext onDragEnd={(result) => handleDragEnd(result, question.id)}>
            <Droppable droppableId={`sequence-${question.id}`}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                  role="list"
                  aria-label="Sortable sequence items"
                >
                  {sequenceItems.map((item, itemIndex) => {
                    // Determine if this item is in the correct position
                    const isCorrectPosition = isSubmitted &&
                      item.correctPosition === itemIndex;

                    // Determine if this item is in the wrong position
                    const isWrongPosition = isSubmitted &&
                      item.correctPosition !== itemIndex;

                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={itemIndex}
                        isDragDisabled={isSubmitted && activity.settings?.attemptsAllowed === 1}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={(el) => {
                              provided.innerRef(el);
                              if (el) itemRefs.current[item.id] = el;
                            }}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            id={`sequence-item-${item.id}`}
                            className={cn(
                              "p-4 border rounded-lg flex items-center transition-all touch-manipulation sequence-item",
                              {
                                "border-primary-green bg-light-mint dark:bg-primary-green/20 shadow-lg transform scale-105": snapshot.isDragging && !isSubmitted,
                                "border-green-500 bg-green-50 dark:bg-green-900/20": isCorrectPosition,
                                "border-red-500 bg-red-50 dark:bg-red-900/20": isWrongPosition,
                                "border-gray-300 dark:border-gray-700 hover:border-medium-teal dark:hover:border-medium-teal/70": !snapshot.isDragging && !isSubmitted && !isCorrectPosition && !isWrongPosition,
                                "drag-start": snapshot.isDragging,
                                "current-position": !isSubmitted && !snapshot.isDragging,
                                [animatingItems[item.id] || ""]: !!animatingItems[item.id],
                                "correct-position": correctPositions[item.id] === true,
                                "wrong-position": correctPositions[item.id] === false
                              }
                            )}
                            tabIndex={0}
                            aria-roledescription="Draggable item"
                            aria-label={`${item.text}, position ${itemIndex + 1} of ${sequenceItems.length}`}
                            onKeyDown={(e) => {
                              if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

                              // Handle keyboard navigation
                              if (e.key === 'ArrowUp' || e.key === 'k') {
                                handleKeyboardReorder(question.id, itemIndex, 'up');
                                e.preventDefault();
                              } else if (e.key === 'ArrowDown' || e.key === 'j') {
                                handleKeyboardReorder(question.id, itemIndex, 'down');
                                e.preventDefault();
                              }
                            }}
                          >
                            <div className="mr-3 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium sequence-item-number">
                              {itemIndex + 1}
                            </div>

                            <div className="flex-1">
                              <div className="text-gray-800 dark:text-gray-200">
                                <RichTextDisplay content={item.text} />
                              </div>
                              {item.media && (
                                <div className="mt-2">
                                  <MediaDisplay
                                    media={item.media}
                                    maxHeight="100px"
                                    showCaption={true}
                                  />
                                </div>
                              )}
                            </div>

                            {isSubmitted && (
                              <div className="ml-2 flex-shrink-0">
                                {isCorrectPosition ? (
                                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                    ✓
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                    ✕
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Show feedback if submitted */}
        {isSubmitted && questionResult && questionResult.feedback && (
          <div className="mt-3 p-3 bg-light-mint dark:bg-primary-green/20 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Feedback:</strong>
            <div className="text-gray-800 dark:text-gray-200">
              <RichTextDisplay content={questionResult.feedback} />
            </div>
          </div>
        )}

        {/* Show explanation if submitted */}
        {isSubmitted && question.explanation && (
          <div className="mt-3 p-3 bg-light-mint dark:bg-primary-green/20 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Explanation:</strong>
            <div className="text-gray-800 dark:text-gray-200">
              <RichTextDisplay content={question.explanation} />
            </div>
          </div>
        )}

        {/* Show correct sequence if submitted */}
        {isSubmitted && activity.settings?.showCorrectAnswers !== false && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <strong className="text-green-800 dark:text-green-300">Correct Sequence:</strong>
            <ol className="mt-2 space-y-1 text-gray-800 dark:text-gray-200 list-decimal list-inside">
              {[...question.items]
                .sort((a, b) => a.correctPosition - b.correctPosition)
                .map(item => (
                  <li key={item.id} className="pl-2">
                    {item.text}
                  </li>
                ))
              }
            </ol>
          </div>
        )}
      </ThemeWrapper>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Activity header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{activity.title}</h1>
        {activity.description && (
          <div className="text-gray-600 dark:text-gray-300 mb-2">
            <RichTextDisplay content={activity.description} />
          </div>
        )}
        {activity.instructions && (
          <div className="bg-light-mint dark:bg-primary-green/20 p-3 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Instructions:</strong>
            <div className="text-gray-700 dark:text-gray-200">
              <RichTextDisplay content={activity.instructions} />
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-4">
        <ProgressIndicator
          current={Object.keys(sequences).length}
          total={shuffledQuestions.length}
        />
      </div>

      {/* Score display */}
      {isSubmitted && score !== null && (
        <div className={cn(
          "mb-6 p-4 rounded-lg border",
          isPassed
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        )}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Your Score: {Math.round(score)}%
          </h2>
          <p className={isPassed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
            {isPassed
              ? "Congratulations! You passed the activity."
              : `You need ${activity.settings?.passingPercentage || 60}% to pass.`}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {shuffledQuestions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex justify-between">
        {!isSubmitted ? (
          submitButton ? (
            // Use the universal submit button if provided
            React.cloneElement(submitButton as React.ReactElement, {
              onClick: handleSubmit,
              disabled: Object.keys(sequences).length === 0,
              loading: false,
              submitted: false,
              children: 'Submit'
            })
          ) : (
            // Fallback to ActivityButton if no universal button provided
            <ActivityButton
              onClick={handleSubmit}
              disabled={Object.keys(sequences).length === 0}
              variant="primary"
              icon="check-circle"
            >
              Submit
            </ActivityButton>
          )
        ) : (
          <ActivityButton
            onClick={handleReset}
            variant="secondary"
            icon="refresh"
          >
            Try Again
          </ActivityButton>
        )}

        {mode === 'teacher' && (
          <ActivityButton
            onClick={() => {/* Handle edit action */}}
            variant="secondary"
            icon="pencil"
          >
            Edit Activity
          </ActivityButton>
        )}
      </div>
    </ThemeWrapper>
  );
};

export default SequenceViewer;
