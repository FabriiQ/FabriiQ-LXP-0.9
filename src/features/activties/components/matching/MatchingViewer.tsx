'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MatchingActivity,
  MatchingQuestion,
  MatchingPair,
  shuffleArray
} from '../../models/matching';
import { gradeMatchingActivity } from '../../grading/matching';
import { ActivityButton } from '../ui/ActivityButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { RichTextDisplay } from '../ui/RichTextDisplay';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';

// Drag and drop animation styles with brand colors
const dragDropAnimationStyles = `
  @keyframes drag-start {
    0% { transform: scale(1); }
    100% { transform: scale(1.02); }
  }

  .drag-start {
    animation: drag-start 0.2s forwards;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  @keyframes drag-over {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1.02); }
  }

  .drag-over {
    animation: drag-over 0.3s forwards;
    border-style: dashed !important;
    background-color: rgba(34, 139, 34, 0.1); /* primary-green */
  }

  @keyframes match-success {
    0% { transform: scale(1); background-color: rgba(240, 255, 240, 0.5); } /* light-mint */
    50% { transform: scale(1.05); background-color: rgba(240, 255, 240, 0.8); } /* light-mint */
    100% { transform: scale(1); background-color: rgba(240, 255, 240, 0.5); } /* light-mint */
  }

  .match-success {
    animation: match-success 0.5s ease-in-out;
  }

  @keyframes match-line-draw {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
  }

  .match-line {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: match-line-draw 0.5s forwards;
    stroke: #228B22; /* primary-green */
  }

  @keyframes pulse-match {
    0% { box-shadow: 0 0 0 0 rgba(34, 139, 34, 0.4); } /* primary-green */
    70% { box-shadow: 0 0 0 10px rgba(34, 139, 34, 0); } /* primary-green */
    100% { box-shadow: 0 0 0 0 rgba(34, 139, 34, 0); } /* primary-green */
  }

  .pulse-match {
    animation: pulse-match 1.5s infinite;
  }

  .touch-drag-helper {
    position: fixed;
    pointer-events: none;
    z-index: 1000;
    transform: translate(-50%, -50%);
    background-color: rgba(255, 255, 255, 0.95);
    border: 2px solid #228B22; /* primary-green */
    border-radius: 0.5rem;
    padding: 0.75rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  /* Matched item indicator */
  .matched-indicator {
    position: absolute;
    right: -8px;
    top: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #228B22; /* primary-green */
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 5;
  }

  /* Mobile touch hint */
  @keyframes touch-hint {
    0% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0.7; transform: scale(1); }
  }

  .touch-hint {
    animation: touch-hint 2s infinite;
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(34, 139, 34, 0.2); /* primary-green */
    pointer-events: none;
  }
`;

export interface MatchingViewerProps {
  activity: MatchingActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, string>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Matching Activity Viewer
 *
 * This component displays a matching activity with:
 * - Drag and drop functionality
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 */
export const MatchingViewer: React.FC<MatchingViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking matches and submission
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // State for drag and drop
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [matchAnimations, setMatchAnimations] = useState<Record<string, boolean>>({});

  // Touch support
  const [touchDragItem, setTouchDragItem] = useState<{ id: string, text: string, x: number, y: number } | null>(null);

  // Refs for item positions
  const leftItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<MatchingQuestion[]>([]);

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = dragDropAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Initialize shuffled questions
  useEffect(() => {
    // Ensure activity.questions exists with a default if not provided
    const questions = activity.questions || [];

    // Create a copy of the questions array
    let questionsCopy = [...questions];

    // Shuffle questions if enabled and there are questions to shuffle
    if (activity.settings?.shuffleQuestions && questionsCopy.length > 0) {
      questionsCopy = shuffleArray(questionsCopy);
    }

    setShuffledQuestions(questionsCopy);
  }, [activity]);

  // Create a default question if needed
  const defaultQuestion: MatchingQuestion = {
    id: 'default-question',
    text: 'Match the items on the left with their corresponding items on the right.',
    pairs: [],
    hint: ''
  };

  // Handle content from activity if it's passed in a different format
  if ((activity as any).content) {
    const content = (activity as any).content;
    if (content.text) defaultQuestion.text = content.text;
    if (content.pairs) defaultQuestion.pairs = content.pairs;
    if (content.hint) defaultQuestion.hint = content.hint;
  }

  // Track progress
  useEffect(() => {
    // Count matched pairs
    let matchedPairsCount = 0;
    let totalPairsCount = 0;

    // Use shuffledQuestions if available, otherwise use default question
    const questions = shuffledQuestions.length > 0 ? shuffledQuestions : [defaultQuestion];

    questions.forEach(question => {
      if (question && question.pairs) {
        question.pairs.forEach(pair => {
          if (pair && pair.leftItem && pair.leftItem.id) {
            totalPairsCount++;
            if (matches[pair.leftItem.id]) {
              matchedPairsCount++;
            }
          }
        });
      }
    });

    const progress = totalPairsCount > 0 ? (matchedPairsCount / totalPairsCount) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [matches, shuffledQuestions, onProgress, defaultQuestion]);

  // Handle match with animations
  const handleMatch = (leftItemId: string, rightItemId: string) => {
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    // Add match animation
    setMatchAnimations(prev => ({
      ...prev,
      [leftItemId]: true
    }));

    // Track the match in analytics
    analytics?.trackInteraction('item_matched', {
      activityId: activity.id,
      leftItemId,
      rightItemId
    });

    // Update matches
    setMatches(prev => ({
      ...prev,
      [leftItemId]: rightItemId
    }));

    // Clear animation after a delay
    setTimeout(() => {
      setMatchAnimations(prev => {
        const newAnimations = { ...prev };
        delete newAnimations[leftItemId];
        return newAnimations;
      });
    }, 500);
  };

  // Handle unmatch with animations
  const handleUnmatch = (leftItemId: string) => {
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    // Track the unmatch in analytics
    analytics?.trackEvent('item_unmatched', {
      activityId: activity.id,
      leftItemId,
      rightItemId: matches[leftItemId]
    });

    // Update matches
    setMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[leftItemId];
      return newMatches;
    });
  };

  // Handle submission with analytics
  const handleSubmit = () => {
    // Grade the activity
    const result = gradeMatchingActivity(activity, matches);
    setScore(result.percentage);
    setIsSubmitted(true);

    // Track submission in analytics
    analytics?.trackEvent('activity_submit', {
      activityId: activity.id,
      activityType: activity.activityType,
      score: result.percentage,
      passed: result.passed,
      timeSpent: 0 // You could track time spent if needed
    });

    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(matches, result);
    }
  };

  // Handle reset with analytics
  const handleReset = () => {
    // Clear all animations
    setMatchAnimations({});

    // Reset state
    setMatches({});
    setIsSubmitted(false);
    setScore(null);

    // Track reset in analytics
    analytics?.trackEvent('activity_reset', {
      activityId: activity.id,
      activityType: activity.activityType
    });
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all pairs have been matched
  const allPairsMatched = shuffledQuestions.length > 0 && shuffledQuestions.every(question =>
    question.pairs && question.pairs.length > 0 && question.pairs.every(pair =>
      pair && pair.leftItem && pair.leftItem.id && matches[pair.leftItem.id] !== undefined
    )
  );

  // Render a single question
  const renderQuestion = (question: MatchingQuestion, index: number) => {
    // Get the results for this question if submitted
    let questionResult: any = null;
    if (isSubmitted && score !== null) {
      try {
        const result = gradeMatchingActivity(
          { ...activity, questions: [question] },
          matches
        );
        if (result.questionResults && result.questionResults.length > 0) {
          questionResult = result.questionResults[0];
        }
      } catch (e) {
        console.error('Error grading question:', e);
      }
    }

    // Ensure question.pairs exists and is an array
    if (!question.pairs || !Array.isArray(question.pairs)) {
      console.error('Question pairs is missing or not an array:', question);
      return (
        <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">Error: Invalid question format</p>
        </div>
      );
    }

    // Prepare right items for display (shuffle if enabled)
    const rightItems = question.pairs.filter(pair => pair && pair.rightItem).map(pair => pair.rightItem);
    const displayRightItems = activity.settings?.shuffleItems && !isSubmitted
      ? shuffleArray(rightItems)
      : rightItems;

    // Track matched pairs for this question
    const matchedPairsCount = question.pairs.filter(pair => pair && pair.leftItem && pair.leftItem.id && matches[pair.leftItem.id]).length;
    const totalPairsCount = question.pairs.length;

    return (
      <ThemeWrapper key={question.id} className="mb-6 p-4 sm:p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-md">
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center">
          <span className="bg-primary-green text-white rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
            {index + 1}
          </span>
          <span className="flex-1">Question {index + 1}</span>
        </h3>

        <div className="mb-4 text-gray-800 dark:text-gray-200">
          <RichTextDisplay content={question.text} />
        </div>

        {/* Question hint */}
        {question.hint && (
          <QuestionHint hint={question.hint} />
        )}

        {/* Matching progress */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {matchedPairsCount} of {totalPairsCount} items matched
          </div>
          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-green transition-all duration-500 rounded-full"
              style={{ width: `${(matchedPairsCount / totalPairsCount) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Matching interface */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left items column */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <span className="bg-primary-green/20 text-primary-green dark:text-medium-teal px-2 py-1 rounded mr-2 text-sm">Items</span>
              <span className="text-sm text-gray-500">Drag these to match</span>
            </h4>
            {question.pairs.filter(pair => pair && pair.leftItem && pair.leftItem.id).map(pair => {
              const leftItem = pair.leftItem;
              const matchedRightItemId = matches[leftItem.id];
              const matchedRightItem = matchedRightItemId
                ? question.pairs.find(p => p && p.rightItem && p.rightItem.id === matchedRightItemId)?.rightItem
                : null;

              // Determine if the match is correct (only if submitted)
              const isCorrect = isSubmitted && matchedRightItemId === pair.rightItem.id;
              const isIncorrect = isSubmitted && matchedRightItemId && matchedRightItemId !== pair.rightItem.id;

              return (
                <div
                  key={leftItem.id}
                  ref={(el) => {
                    leftItemRefs.current[leftItem.id] = el;
                  }}
                  className={cn(
                    "p-4 border rounded-lg flex items-center justify-between transition-all duration-200 relative",
                    "hover:shadow-sm cursor-grab active:cursor-grabbing touch-action-none",
                    {
                      "border-primary-green bg-light-mint/30 dark:bg-primary-green/10": matchedRightItemId && !isSubmitted,
                      "border-green-500 bg-green-50 dark:bg-green-900/20": isCorrect,
                      "border-red-500 bg-red-50 dark:bg-red-900/20": isIncorrect,
                      "border-gray-300 dark:border-gray-700": !matchedRightItemId && !isSubmitted,
                      "drag-start": draggedItemId === leftItem.id,
                      "match-success": matchAnimations[leftItem.id],
                      "pulse-match": !matchedRightItemId && !isSubmitted && !draggedItemId,
                      "min-h-[60px]": true
                    }
                  )}
                  draggable={!isSubmitted || activity.settings?.attemptsAllowed !== 1}
                  onDragStart={(e) => {
                    setDraggedItemId(leftItem.id);
                    // Set drag image if available
                    if (e.dataTransfer && leftItemRefs.current[leftItem.id]) {
                      const element = leftItemRefs.current[leftItem.id];
                      if (element) {
                        e.dataTransfer.setDragImage(element, 20, 20);
                      }
                    }
                  }}
                  onDragEnd={() => setDraggedItemId(null)}
                  // Touch support
                  onTouchStart={(e) => {
                    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;
                    const touch = e.touches[0];
                    setTouchDragItem({
                      id: leftItem.id,
                      text: leftItem.text,
                      x: touch.clientX,
                      y: touch.clientY
                    });
                  }}
                  onTouchMove={(e) => {
                    if (touchDragItem && touchDragItem.id === leftItem.id) {
                      const touch = e.touches[0];
                      setTouchDragItem({
                        ...touchDragItem,
                        x: touch.clientX,
                        y: touch.clientY
                      });
                    }
                  }}
                  onTouchEnd={() => {
                    setTouchDragItem(null);
                  }}
                  aria-label={`Drag item: ${leftItem.text}`}
                >
                  {/* Matched indicator */}
                  {matchedRightItem && (
                    <div className="matched-indicator">
                      ✓
                    </div>
                  )}

                  <div className="flex-1">
                    <RichTextDisplay content={leftItem.text} />
                    {leftItem.media && (
                      <div className="mt-2">
                        {leftItem.media.type === 'image' && (
                          <img
                            src={leftItem.media.url}
                            alt={leftItem.media.alt || leftItem.text}
                            className="max-h-24 object-contain rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {matchedRightItem && (
                    <div className="ml-2 flex items-center">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm",
                        {
                          "bg-light-mint text-primary-green dark:bg-primary-green/20 dark:text-medium-teal": !isSubmitted,
                          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300": isCorrect,
                          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300": isIncorrect
                        }
                      )}>
                        {matchedRightItem.text}
                      </div>

                      {(!isSubmitted || activity.settings?.attemptsAllowed !== 1) && (
                        <button
                          className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 p-1"
                          onClick={() => handleUnmatch(leftItem.id)}
                          aria-label="Remove match"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right items column */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <span className="bg-medium-teal/20 text-medium-teal dark:text-light-mint px-2 py-1 rounded mr-2 text-sm">Matches</span>
              <span className="text-sm text-gray-500">Drop items here</span>
            </h4>
            {displayRightItems.filter(rightItem => rightItem && rightItem.id).map(rightItem => {
              // Check if this right item is already matched
              const isMatched = Object.values(matches).includes(rightItem.id);

              // If submitted, determine if this is a correct match
              const matchedLeftItemId = Object.entries(matches).find(([_, rId]) => rId === rightItem.id)?.[0];
              const correctLeftItemId = question.pairs.find(p => p && p.rightItem && p.rightItem.id === rightItem.id && p.leftItem)?.leftItem.id;
              const isCorrectMatch = isSubmitted && matchedLeftItemId === correctLeftItemId;

              return (
                <div
                  key={rightItem.id}
                  ref={(el) => {
                    rightItemRefs.current[rightItem.id] = el;
                  }}
                  className={cn(
                    "p-4 border rounded-lg transition-all duration-200 relative min-h-[60px]",
                    {
                      "border-primary-green bg-light-mint/30 dark:bg-primary-green/10": isMatched && !isSubmitted,
                      "border-green-500 bg-green-50 dark:bg-green-900/20": isSubmitted && isCorrectMatch,
                      "border-red-500 bg-red-50 dark:bg-red-900/20": isSubmitted && isMatched && !isCorrectMatch,
                      "border-gray-300 dark:border-gray-700": !isMatched && !isSubmitted,
                      "opacity-60": isMatched && (!isSubmitted || activity.settings?.attemptsAllowed !== 1),
                      "drag-over": dragOverItemId === rightItem.id && !isMatched,
                      "border-dashed border-2": !isMatched && !isSubmitted
                    }
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isMatched) {
                      setDragOverItemId(rightItem.id);
                    }
                  }}
                  onDragLeave={() => setDragOverItemId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverItemId(null);
                    if (draggedItemId && !isMatched) {
                      handleMatch(draggedItemId, rightItem.id);
                    }
                  }}
                  onClick={() => {
                    if (draggedItemId && !isMatched && (!isSubmitted || activity.settings?.attemptsAllowed !== 1)) {
                      handleMatch(draggedItemId, rightItem.id);
                    }
                  }}
                  // Touch support
                  onTouchMove={(e) => {
                    if (touchDragItem && !isMatched) {
                      const touch = e.touches[0];
                      const rect = rightItemRefs.current[rightItem.id]?.getBoundingClientRect();

                      if (rect) {
                        const isOver =
                          touch.clientX >= rect.left &&
                          touch.clientX <= rect.right &&
                          touch.clientY >= rect.top &&
                          touch.clientY <= rect.bottom;

                        if (isOver) {
                          setDragOverItemId(rightItem.id);
                        } else if (dragOverItemId === rightItem.id) {
                          setDragOverItemId(null);
                        }
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    if (touchDragItem && dragOverItemId === rightItem.id && !isMatched) {
                      handleMatch(touchDragItem.id, rightItem.id);
                    }
                    setDragOverItemId(null);
                  }}
                  aria-label={`Drop target: ${rightItem.text}`}
                >
                  {!isMatched && !isSubmitted && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                      <span className="text-primary-green dark:text-medium-teal">Drop here</span>
                    </div>
                  )}

                  <div>
                    <RichTextDisplay content={rightItem.text} />
                    {rightItem.media && (
                      <div className="mt-2">
                        {rightItem.media.type === 'image' && (
                          <img
                            src={rightItem.media.url}
                            alt={rightItem.media.alt || rightItem.text}
                            className="max-h-24 object-contain rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile touch hint */}
        <div className="mt-4 text-center text-sm text-gray-500 md:hidden">
          <p>Tap and hold an item, then drag to its matching pair</p>
        </div>

        {/* Show feedback if submitted */}
        {isSubmitted && questionResult && questionResult.feedback && (
          <div className="mt-4 p-4 bg-light-mint dark:bg-primary-green/20 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fade-in">
            <strong className="text-primary-green dark:text-medium-teal text-lg">Feedback:</strong>
            <div className="text-gray-800 dark:text-gray-200 mt-1">
              <RichTextDisplay content={questionResult.feedback} />
            </div>
          </div>
        )}

        {/* Show explanation if submitted */}
        {isSubmitted && question.explanation && (
          <div className="mt-4 p-4 bg-light-mint dark:bg-primary-green/20 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fade-in">
            <strong className="text-primary-green dark:text-medium-teal text-lg">Explanation:</strong>
            <div className="text-gray-800 dark:text-gray-200 mt-1">
              <RichTextDisplay content={question.explanation} />
            </div>
          </div>
        )}

        {/* Show correct answers if submitted */}
        {isSubmitted && activity.settings?.showCorrectAnswers !== false && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 animate-fade-in">
            <strong className="text-green-700 dark:text-green-400 text-lg">Correct Matches:</strong>
            <ul className="mt-2 space-y-2 text-gray-800 dark:text-gray-200">
              {question.pairs.map(pair => (
                <li key={pair.id} className="flex items-center">
                  <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded mr-2">
                    {pair.leftItem.text}
                  </span>
                  <span className="text-green-700 dark:text-green-400 mx-2">→</span>
                  <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                    {pair.rightItem.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ThemeWrapper>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Touch drag helper */}
      {touchDragItem && (
        <div
          className="touch-drag-helper"
          style={{
            left: `${touchDragItem.x}px`,
            top: `${touchDragItem.y}px`
          }}
        >
          {touchDragItem.text}
        </div>
      )}

      {/* Activity header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{activity.title}</h1>
        {activity.description && (
          <div className="text-gray-600 dark:text-gray-300 mb-3">
            <RichTextDisplay content={activity.description} />
          </div>
        )}
        {activity.instructions && (
          <div className="bg-light-mint dark:bg-primary-green/20 p-4 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fade-in">
            <strong className="text-primary-green dark:text-medium-teal text-lg">Instructions:</strong>
            <div className="text-gray-700 dark:text-gray-200 mt-1">
              <RichTextDisplay content={activity.instructions} />
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <ProgressIndicator
          current={Object.keys(matches).length}
          total={shuffledQuestions.reduce((total, q) => total + q.pairs.length, 0)}
          color="green"
          showPercentage={true}
        />

        {/* Mobile instructions */}
        <div className="mt-3 p-3 bg-primary-green/10 rounded-md border border-primary-green/20 md:hidden">
          <div className="flex items-center text-sm text-primary-green">
            <span className="font-medium mr-2">Tip:</span>
            <span>Tap and hold an item, then drag it to its matching pair</span>
          </div>
        </div>
      </div>

      {/* Score display */}
      {isSubmitted && score !== null && (
        <div className={cn(
          "mb-6 p-5 rounded-lg border animate-fade-in",
          isPassed
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        )}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <span className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white",
              isPassed ? "bg-green-600" : "bg-red-600"
            )}>
              {isPassed ? "✓" : "✗"}
            </span>
            Your Score: {Math.round(score)}%
          </h2>
          <p className={cn(
            "mt-2",
            isPassed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
          )}>
            {isPassed
              ? "Congratulations! You passed the activity."
              : `You need ${activity.settings?.passingPercentage || 60}% to pass.`}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {shuffledQuestions.map((question, index) => (
          <div id={`question-${question.id}`} key={question.id}>
            {renderQuestion(question, index)}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex justify-between">
        {!isSubmitted ? (
          submitButton ? (
            // Use the universal submit button if provided
            React.cloneElement(submitButton as React.ReactElement, {
              onClick: handleSubmit,
              disabled: !allPairsMatched,
              loading: false,
              submitted: false,
              children: 'Submit'
            })
          ) : (
            // Fallback to ActivityButton if no universal button provided
            <ActivityButton
              onClick={handleSubmit}
              disabled={!allPairsMatched}
              variant="primary"
              icon="check-circle"
              size="lg"
            >
              Submit
            </ActivityButton>
          )
        ) : (
          <ActivityButton
            onClick={handleReset}
            variant="secondary"
            icon="refresh"
            size="lg"
          >
            Try Again
          </ActivityButton>
        )}

        {mode === 'teacher' && (
          <ActivityButton
            onClick={() => {/* Handle edit action */}}
            variant="secondary"
            icon="pencil"
            size="md"
          >
            Edit Activity
          </ActivityButton>
        )}
      </div>

      {/* Desktop instructions */}
      <div className="mt-4 text-center text-sm text-gray-500 hidden md:block">
        <p>Drag items from the left column to their matching pairs in the right column</p>
      </div>
    </ThemeWrapper>
  );
};

export default MatchingViewer;
