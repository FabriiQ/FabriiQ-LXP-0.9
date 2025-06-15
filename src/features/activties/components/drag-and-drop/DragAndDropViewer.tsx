'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DragAndDropActivity, DragAndDropQuestion, DragAndDropItem, DropZone } from '../../models/drag-and-drop';
import { ActivityButton } from '../ui/ActivityButton';
import AnimatedSubmitButton from '../ui/AnimatedSubmitButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';

// Animation styles
const dragAnimationStyles = `
  @keyframes drag-pulse {
    0% { box-shadow: 0 0 0 0 rgba(90, 138, 132, 0.4); }
    70% { box-shadow: 0 0 0 8px rgba(90, 138, 132, 0); }
    100% { box-shadow: 0 0 0 0 rgba(90, 138, 132, 0); }
  }

  .drag-pulse {
    animation: drag-pulse 1.5s infinite;
  }

  @keyframes drop-highlight {
    0% { transform: scale(1); background-color: rgba(216, 227, 224, 0.3); }
    50% { transform: scale(1.03); background-color: rgba(216, 227, 224, 0.5); }
    100% { transform: scale(1); background-color: rgba(216, 227, 224, 0.3); }
  }

  .drop-highlight {
    animation: drop-highlight 1s ease-in-out;
  }

  @keyframes item-placed {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); box-shadow: 0 0 15px rgba(31, 80, 75, 0.3); }
    100% { transform: scale(1); }
  }

  .item-placed {
    animation: item-placed 0.5s ease-in-out;
  }

  @keyframes placeholder-pulse {
    0% { border-color: rgba(90, 138, 132, 0.3); background-color: rgba(216, 227, 224, 0.1); }
    50% { border-color: rgba(90, 138, 132, 0.7); background-color: rgba(216, 227, 224, 0.2); }
    100% { border-color: rgba(90, 138, 132, 0.3); background-color: rgba(216, 227, 224, 0.1); }
  }

  .placeholder-pulse {
    animation: placeholder-pulse 2s ease-in-out infinite;
  }

  @keyframes arrow-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(5px); }
  }

  .arrow-bounce {
    animation: arrow-bounce 1.5s ease-in-out infinite;
  }

  /* Hardware acceleration for smoother dragging */
  .drag-item {
    will-change: transform;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }

  /* Touch-friendly improvements */
  @media (pointer: coarse) {
    .drag-item {
      min-width: 100px !important;
      min-height: 50px !important;
      padding: 12px !important;
    }

    .drop-zone {
      min-width: 120px !important;
      min-height: 60px !important;
    }
  }
`;

export interface DragAndDropViewerProps {
  activity: DragAndDropActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, string>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Drag and Drop Activity Viewer
 *
 * This component displays a drag and drop activity with:
 * - Draggable items
 * - Drop zones
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 */
export const DragAndDropViewer: React.FC<DragAndDropViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking answers and submission
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [itemPositions, setItemPositions] = useState<Record<string, { x: number, y: number }>>({});

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = dragAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<DragAndDropQuestion[]>([]);

  // Initialize shuffled questions
  useEffect(() => {
    let questions = [...activity.questions];

    // Shuffle questions if enabled
    if (activity.settings?.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    setShuffledQuestions(questions);
  }, [activity]);

  // Current question
  const currentQuestion = shuffledQuestions[currentQuestionIndex] || activity.questions[0];

  // Track progress
  useEffect(() => {
    if (!currentQuestion) return;

    // Count items that have been placed in zones
    const placedItems = Object.keys(answers).length;
    const totalItems = currentQuestion.items.length;
    const progress = totalItems > 0 ? (placedItems / totalItems) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [answers, currentQuestion, onProgress]);

  // Last drag move timestamp for debouncing
  const lastDragMoveRef = useRef<number>(0);
  // Debounce interval in ms
  const DRAG_DEBOUNCE_INTERVAL = 16; // ~60fps

  // Handle drag start - optimized with useCallback
  const handleDragStart = useCallback((itemId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (isSubmitted) return;

    setDraggingItem(itemId);

    // Calculate drag offset
    const itemElement = itemRefs.current[itemId];
    if (itemElement) {
      const rect = itemElement.getBoundingClientRect();

      let clientX: number, clientY: number;
      if ('touches' in e) {
        // Touch event
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }

      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('item_drag_start', {
      activityId: activity.id,
      questionId: currentQuestion?.id,
      itemId
    });
  }, [isSubmitted, analytics, activity.id, currentQuestion]);

  // Handle drag move - optimized with useCallback and debouncing
  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingItem || !containerRef.current) return;

    e.preventDefault();

    // Debounce drag move events for better performance
    const now = Date.now();
    if (now - lastDragMoveRef.current < DRAG_DEBOUNCE_INTERVAL) {
      return;
    }
    lastDragMoveRef.current = now;

    const containerRect = containerRef.current.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - containerRect.left - dragOffset.x;
    const y = clientY - containerRect.top - dragOffset.y;

    // Use functional update to avoid stale closures
    setItemPositions(prev => ({
      ...prev,
      [draggingItem]: { x, y }
    }));
  }, [draggingItem, dragOffset]);

  // Handle drag end - optimized with useCallback
  const handleDragEnd = useCallback(() => {
    if (!draggingItem || !containerRef.current) return;

    // Check if the item is over a drop zone
    const itemPosition = itemPositions[draggingItem];
    if (itemPosition) {
      const itemElement = itemRefs.current[draggingItem];
      if (itemElement) {
        const itemRect = itemElement.getBoundingClientRect();
        const itemCenter = {
          x: itemRect.left + itemRect.width / 2,
          y: itemRect.top + itemRect.height / 2
        };

        // Find the zone the item is over
        const droppedZone = currentQuestion?.zones.find(zone => {
          const zoneElement = document.getElementById(`zone-${zone.id}`);
          if (zoneElement) {
            const zoneRect = zoneElement.getBoundingClientRect();
            return (
              itemCenter.x >= zoneRect.left &&
              itemCenter.x <= zoneRect.right &&
              itemCenter.y >= zoneRect.top &&
              itemCenter.y <= zoneRect.bottom
            );
          }
          return false;
        });

        if (droppedZone) {
          // Play drop sound effect for better feedback
          try {
            const audio = new Audio('/sounds/drop.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
              // Ignore errors - audio is optional enhancement
            });
          } catch (e) {
            // Ignore errors if audio can't be played
          }

          // Update answers
          setAnswers(prev => ({
            ...prev,
            [draggingItem]: droppedZone.id
          }));

          // Track the interaction in analytics
          analytics?.trackInteraction('item_dropped', {
            activityId: activity.id,
            questionId: currentQuestion?.id,
            itemId: draggingItem,
            zoneId: droppedZone.id
          });
        }
      }
    }

    setDraggingItem(null);
  }, [draggingItem, itemPositions, currentQuestion, analytics, activity.id]);

  // Handle submission
  const handleSubmit = () => {
    // Calculate score
    let correctCount = 0;
    let totalItems = currentQuestion.items.length;

    currentQuestion.items.forEach(item => {
      const selectedZoneId = answers[item.id];
      if (selectedZoneId === item.correctZoneId) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / totalItems) * 100);
    setScore(calculatedScore);
    setIsSubmitted(true);

    // Track submission in analytics
    analytics?.trackEvent('activity_submit', {
      activityId: activity.id,
      activityType: activity.activityType,
      score: calculatedScore,
      passed: calculatedScore >= (activity.settings?.passingPercentage || 60),
      timeSpent: 0 // You could track time spent if needed
    });

    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(answers, {
        score: calculatedScore,
        passed: calculatedScore >= (activity.settings?.passingPercentage || 60),
        details: currentQuestion.items.map(item => ({
          itemId: item.id,
          correctZoneId: item.correctZoneId,
          selectedZoneId: answers[item.id],
          isCorrect: answers[item.id] === item.correctZoneId
        }))
      });
    }
  };

  // Handle reset
  const handleReset = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setItemPositions({});

    // Track reset in analytics
    analytics?.trackEvent('activity_reset', {
      activityId: activity.id,
      activityType: activity.activityType
    });
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswers({});
      setIsSubmitted(false);
      setScore(null);
      setItemPositions({});
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswers({});
      setIsSubmitted(false);
      setScore(null);
      setItemPositions({});
    }
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all items have been placed
  const allItemsPlaced = currentQuestion?.items.every(item => answers[item.id]) || false;

  // Render a single item - optimized with useCallback
  const renderItem = useCallback((item: DragAndDropItem) => {
    const position = itemPositions[item.id];
    const isPlaced = !!answers[item.id];
    const isDragging = draggingItem === item.id;

    // Determine if the item is correctly placed (only show after submission)
    const isCorrect = isSubmitted && answers[item.id] === item.correctZoneId;
    const isIncorrect = isSubmitted && answers[item.id] !== item.correctZoneId;

    // Calculate initial position with staggered animation delay
    const itemIndex = currentQuestion?.items.findIndex(i => i.id === item.id) || 0;
    const initialDelay = itemIndex * 0.1; // Stagger items by 100ms

    return (
      <div
        key={item.id}
        ref={el => {
          if (el) itemRefs.current[item.id] = el;
        }}
        className={cn(
          "absolute p-3 border rounded-md cursor-move transition-all duration-200 bg-white dark:bg-gray-800 shadow-md touch-manipulation drag-item",
          {
            "z-10": isDragging,
            "border-primary-green bg-light-mint/70 dark:bg-primary-green/20 scale-105 drag-pulse": isDragging && !isSubmitted,
            "border-green-500 bg-green-50 dark:bg-green-900/20": isCorrect,
            "border-red-500 bg-red-50 dark:bg-red-900/20": isIncorrect,
            "opacity-60 cursor-not-allowed": isSubmitted,
            "item-placed": isPlaced && !isDragging && !isSubmitted,
            "before:content-['⋮⋮'] before:absolute before:top-1 before:right-1 before:text-medium-teal/70 before:text-xs": !isSubmitted && !isDragging
          }
        )}
        style={{
          left: position ? `${position.x}px` : isPlaced ? 'auto' : '10px',
          top: position ? `${position.y}px` : isPlaced ? 'auto' : `${50 + itemIndex * 60}px`,
          width: '150px',
          touchAction: 'none',
          transform: 'translate3d(0,0,0)', // Force hardware acceleration
          animationDelay: `${initialDelay}s`,
          transition: 'transform 0.1s linear, box-shadow 0.2s ease' // Smoother transitions
        }}
        onMouseDown={e => !isSubmitted && handleDragStart(item.id, e)}
        onTouchStart={e => !isSubmitted && handleDragStart(item.id, e)}
        aria-label={`Drag item: ${item.text}`}
      >
        {item.text}

        {/* Show feedback if submitted */}
        {isSubmitted && item.feedback && (
          <div className={cn(
            "mt-1 text-xs",
            isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {item.feedback}
          </div>
        )}
      </div>
    );
  }, [itemPositions, answers, draggingItem, isSubmitted, currentQuestion, handleDragStart]);

  // Render a single zone - optimized with useMemo
  const renderZone = useCallback((zone: DropZone) => {
    // Find items placed in this zone
    const placedItems = currentQuestion?.items.filter(item => answers[item.id] === zone.id) || [];
    const isEmpty = placedItems.length === 0;

    return (
      <div
        id={`zone-${zone.id}`}
        key={zone.id}
        className={cn(
          "absolute border-2 rounded-md flex flex-col items-center justify-center transition-all drop-zone",
          {
            "border-medium-teal/70 bg-light-mint/30 dark:border-medium-teal/50 dark:bg-primary-green/10": !isSubmitted,
            "border-dashed": isEmpty && !isSubmitted,
            "drop-highlight": !isEmpty && !isSubmitted,
            "placeholder-pulse": isEmpty && !isSubmitted && !draggingItem
          }
        )}
        style={{
          left: `${zone.x}px`,
          top: `${zone.y}px`,
          width: `${zone.width}px`,
          height: `${zone.height}px`,
          backgroundColor: isSubmitted ? (zone.backgroundColor || 'rgba(230, 230, 230, 0.5)') : undefined,
          borderColor: isSubmitted ? (zone.borderColor || '#cccccc') : undefined
        }}
        aria-label={`Drop zone: ${zone.text}`}
      >
        <div className="text-center font-medium text-gray-700 dark:text-gray-300">
          {zone.text}

          {/* Show count of items in zone */}
          {!isEmpty && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {placedItems.length} item{placedItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Placeholder indicator when empty */}
        {isEmpty && !isSubmitted && (
          <div className="flex flex-col items-center justify-center mt-2 opacity-70">
            <div className="text-xs text-medium-teal dark:text-medium-teal/80 mb-1">Drop here</div>
            <ArrowDown className="h-4 w-4 text-medium-teal dark:text-medium-teal/80 arrow-bounce" />
          </div>
        )}
      </div>
    );
  }, [answers, currentQuestion, isSubmitted, draggingItem]);

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Activity header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{activity.title}</h1>
        {activity.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-2">{activity.description}</p>
        )}
        {activity.instructions && (
          <div className="bg-light-mint dark:bg-primary-green/20 p-3 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Instructions:</strong>
            <span className="text-gray-700 dark:text-gray-200"> {activity.instructions}</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-4">
        <ProgressIndicator
          current={Object.keys(answers).length}
          total={currentQuestion?.items.length || 0}
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

      {/* Question */}
      <ThemeWrapper className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
        </h3>

        {/* Question hint */}
        {currentQuestion?.hint && (
          <QuestionHint hint={currentQuestion.hint} />
        )}

        {/* Question text */}
        <p className="mt-3 text-gray-800 dark:text-gray-200 leading-relaxed">
          {currentQuestion?.text}
        </p>

        {/* Drag and drop container - optimized for performance */}
        <div
          ref={containerRef}
          className="relative mt-4 border border-medium-teal/30 dark:border-medium-teal/20 rounded-lg bg-light-mint/20 dark:bg-primary-green/10"
          style={{
            height: '450px',
            overflow: 'hidden',
            minHeight: '300px',
            willChange: draggingItem ? 'contents' : 'auto', // Optimize rendering during drag
            perspective: '1000px', // 3D acceleration
            backfaceVisibility: 'hidden' // Prevent flickering
          }}
          onMouseMove={e => draggingItem && handleDragMove(e)}
          onTouchMove={e => draggingItem && handleDragMove(e)}
          onMouseUp={() => draggingItem && handleDragEnd()}
          onTouchEnd={() => draggingItem && handleDragEnd()}
          onMouseLeave={() => draggingItem && handleDragEnd()}
        >
          {/* Background image if provided */}
          {currentQuestion?.backgroundImage && (
            <img
              src={currentQuestion.backgroundImage}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              loading="eager" // Prioritize loading
            />
          )}

          {/* Empty state message when no zones are defined */}
          {(!currentQuestion?.zones || currentQuestion.zones.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <p className="text-gray-500 dark:text-gray-400">No drop zones defined for this question.</p>
              </div>
            </div>
          )}

          {/* Render zones with memoization */}
          {currentQuestion?.zones.map(zone => renderZone(zone))}

          {/* Render items with memoization */}
          {currentQuestion?.items.map(item => renderItem(item))}
        </div>

        {/* Show explanation if submitted */}
        {isSubmitted && currentQuestion?.explanation && (
          <div className="mt-3 p-3 bg-light-mint dark:bg-primary-green/20 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Explanation:</strong>
            <span className="text-gray-800 dark:text-gray-200"> {currentQuestion.explanation}</span>
          </div>
        )}
      </ThemeWrapper>

      {/* Action buttons - improved layout for mobile */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex justify-center sm:justify-start space-x-2 order-2 sm:order-1">
          <ActivityButton
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="secondary"
            icon="arrow-left"
            className="min-w-[100px] min-h-[44px]"
          >
            Previous
          </ActivityButton>
          <ActivityButton
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === shuffledQuestions.length - 1}
            variant="secondary"
            icon="arrow-right"
            className="min-w-[100px] min-h-[44px]"
          >
            Next
          </ActivityButton>
        </div>

        {/* Submit/Reset buttons */}
        <div className="flex justify-center sm:justify-end space-x-2 order-1 sm:order-2">
          {!isSubmitted ? (
            submitButton ? (
              // Use the universal submit button if provided
              React.cloneElement(submitButton as React.ReactElement, {
                onClick: handleSubmit,
                disabled: !allItemsPlaced,
                loading: false,
                submitted: false,
                className: "min-w-[120px] min-h-[44px]",
                children: 'Submit'
              })
            ) : (
              // Use AnimatedSubmitButton for better UX
              <AnimatedSubmitButton
                onClick={handleSubmit}
                disabled={!allItemsPlaced}
                loading={false}
                submitted={false}
                className="min-w-[120px] min-h-[44px]"
              >
                Submit
              </AnimatedSubmitButton>
            )
          ) : (
            <ActivityButton
              onClick={handleReset}
              variant="secondary"
              icon="refresh"
              className="min-w-[120px] min-h-[44px]"
            >
              Try Again
            </ActivityButton>
          )}

          {mode === 'teacher' && (
            <ActivityButton
              onClick={() => {/* Handle edit action */}}
              variant="secondary"
              icon="pencil"
              className="ml-2 min-w-[120px] min-h-[44px]"
            >
              Edit Activity
            </ActivityButton>
          )}
        </div>
      </div>
    </ThemeWrapper>
  );
};

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default DragAndDropViewer;
