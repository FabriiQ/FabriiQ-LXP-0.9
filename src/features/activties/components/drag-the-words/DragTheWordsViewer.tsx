'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DragTheWordsActivity, DragTheWordsQuestion, DraggableWord, parseTextWithPlaceholders } from '../../models/drag-the-words';
import { ActivityButton } from '../ui/ActivityButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';

// Typing animation styles
const dragAnimationStyles = `
  @keyframes word-pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 rgba(31, 80, 75, 0.2); }
    50% { transform: scale(1.05); box-shadow: 0 0 10px rgba(31, 80, 75, 0.4); }
    100% { transform: scale(1); box-shadow: 0 0 0 rgba(31, 80, 75, 0.2); }
  }

  .word-pulse-animation {
    animation: word-pulse 0.5s ease-in-out;
  }

  @keyframes word-drop {
    0% { transform: translateY(-20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  .word-drop-animation {
    animation: word-drop 0.3s ease-out;
  }

  @keyframes correct-placement {
    0% { background-color: rgba(34, 197, 94, 0); }
    50% { background-color: rgba(34, 197, 94, 0.2); }
    100% { background-color: rgba(34, 197, 94, 0); }
  }

  .correct-placement-animation {
    animation: correct-placement 1s ease-in-out;
  }

  @keyframes incorrect-placement {
    0% { background-color: rgba(239, 68, 68, 0); }
    50% { background-color: rgba(239, 68, 68, 0.2); }
    100% { background-color: rgba(239, 68, 68, 0); }
  }

  .incorrect-placement-animation {
    animation: incorrect-placement 1s ease-in-out;
  }

  /* High contrast mode for color blind users */
  @media (prefers-contrast: more) {
    .placeholder {
      border: 2px dashed #666 !important;
    }

    .placeholder.filled {
      border: 2px solid #000 !important;
    }

    .placeholder.correct {
      border: 2px solid #000 !important;
      background-image: linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent) !important;
      background-size: 10px 10px !important;
    }

    .placeholder.incorrect {
      border: 2px solid #000 !important;
      background-image: linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent) !important;
      background-size: 10px 10px !important;
    }

    .draggable-word {
      border: 2px solid #000 !important;
      font-weight: bold !important;
    }
  }
`;

export interface DragTheWordsViewerProps {
  activity: DragTheWordsActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, number | null>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Drag the Words Activity Viewer
 *
 * This component displays a drag the words activity with:
 * - Draggable words
 * - Drop zones in text
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 * - Accessibility features for color-blind users
 */
export const DragTheWordsViewer: React.FC<DragTheWordsViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking answers and submission
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [draggingWord, setDraggingWord] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wordPositions, setWordPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [animatingWordIds, setAnimatingWordIds] = useState<Record<string, string>>({});
  const [placeholderAnimations, setPlaceholderAnimations] = useState<Record<string, string>>({});

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const placeholderRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<DragTheWordsQuestion[]>([]);

  // Shuffle words if enabled
  const [shuffledWords, setShuffledWords] = useState<Record<string, DraggableWord[]>>({});

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

    // Initialize shuffled words for each question
    const initialShuffledWords: Record<string, DraggableWord[]> = {};
    questionsCopy.forEach(question => {
      if (question.words && question.words.length > 0) {
        initialShuffledWords[question.id] = shuffleArray([...question.words]);
      }
    });

    setShuffledWords(initialShuffledWords);
  }, [activity]);

  // Create a default question if needed
  const defaultQuestion: DragTheWordsQuestion = {
    id: 'default-question',
    text: 'Drag the words to their correct positions in the text.',
    words: []
  };

  // Handle content from activity if it's passed in a different format
  useEffect(() => {
    if ((activity as any).content) {
      const content = (activity as any).content;
      console.log('Using alternative content format for drag words:', content);

      // Create a new question with the content
      const newQuestion: DragTheWordsQuestion = {
        id: 'content-question',
        text: content.text || defaultQuestion.text,
        words: content.words || []
      };

      // If we have words but they're not in the right format, convert them
      if (Array.isArray(content.words) && content.words.length > 0) {
        // Check if the words have the required properties
        const hasCorrectFormat = content.words.every((word: any) =>
          word && typeof word === 'object' && word.id && word.text && typeof word.correctIndex !== 'undefined'
        );

        if (!hasCorrectFormat) {
          console.log('Converting words to correct format');
          // Convert words to the correct format
          newQuestion.words = content.words.map((word: any, index: number) => ({
            id: word.id || `word-${Date.now()}-${index}`,
            text: word.text || word,
            correctIndex: word.correctIndex !== undefined ? word.correctIndex : index,
            feedback: word.feedback || ''
          }));
        }
      }

      // Set the shuffled questions with our new question
      setShuffledQuestions([newQuestion]);

      // Initialize shuffled words for this question
      if (newQuestion.words && newQuestion.words.length > 0) {
        setShuffledWords({
          [newQuestion.id]: shuffleArray([...newQuestion.words])
        });
      }
    }
  }, [activity]);

  // Current question with fallback
  const currentQuestion = shuffledQuestions[currentQuestionIndex] || shuffledQuestions[0] || defaultQuestion;

  // Current shuffled words with fallback
  const currentShuffledWords = currentQuestion && currentQuestion.id && shuffledWords[currentQuestion.id]
    ? shuffledWords[currentQuestion.id]
    : (currentQuestion?.words || []);

  // Track progress
  useEffect(() => {
    if (!currentQuestion || !currentQuestion.words) return;

    // Count words that have been placed
    const placedWords = Object.keys(answers).length;
    const totalWords = currentQuestion.words?.length || 0;
    const progress = totalWords > 0 ? (placedWords / totalWords) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [answers, currentQuestion, onProgress]);

  // Handle drag start
  const handleDragStart = (wordId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (isSubmitted) return;

    setDraggingWord(wordId);

    // Calculate drag offset
    const wordElement = wordRefs.current[wordId];
    if (wordElement) {
      const rect = wordElement.getBoundingClientRect();

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

    // Animate the word being dragged
    setAnimatingWordIds({
      ...animatingWordIds,
      [wordId]: 'word-pulse-animation'
    });

    // Track the interaction in analytics
    analytics?.trackInteraction('word_drag_start', {
      activityId: activity.id,
      questionId: currentQuestion.id,
      wordId
    });
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingWord || !containerRef.current) return;

    e.preventDefault();

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

    setWordPositions(prev => ({
      ...prev,
      [draggingWord]: { x, y }
    }));
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (!draggingWord || !containerRef.current) return;

    // Check if the word is over a placeholder
    const wordElement = wordRefs.current[draggingWord];
    if (wordElement) {
      const wordRect = wordElement.getBoundingClientRect();
      const wordCenter = {
        x: wordRect.left + wordRect.width / 2,
        y: wordRect.top + wordRect.height / 2
      };

      // Find the placeholder the word is over
      let droppedPlaceholderIndex: number | null = null;
      let closestPlaceholder: HTMLSpanElement | null = null;
      let closestDistance = Infinity;

      Object.entries(placeholderRefs.current).forEach(([index, placeholder]) => {
        if (placeholder) {
          const placeholderRect = placeholder.getBoundingClientRect();
          const placeholderCenter = {
            x: placeholderRect.left + placeholderRect.width / 2,
            y: placeholderRect.top + placeholderRect.height / 2
          };

          const distance = Math.sqrt(
            Math.pow(wordCenter.x - placeholderCenter.x, 2) +
            Math.pow(wordCenter.y - placeholderCenter.y, 2)
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPlaceholder = placeholder;
            droppedPlaceholderIndex = parseInt(index);
          }
        }
      });

      // If the word is close enough to a placeholder, place it there
      if (closestPlaceholder && closestDistance < 100 && droppedPlaceholderIndex !== null) {
        // Check if this placeholder already has a word
        const existingWordId = Object.keys(answers).find(
          wordId => answers[wordId] === droppedPlaceholderIndex
        );

        if (existingWordId) {
          // Swap the words
          setAnswers(prev => ({
            ...prev,
            [existingWordId]: answers[draggingWord] !== undefined ? answers[draggingWord] : -1,
            [draggingWord]: droppedPlaceholderIndex
          }));
        } else {
          // Place the word in the placeholder
          setAnswers(prev => ({
            ...prev,
            [draggingWord]: droppedPlaceholderIndex
          }));
        }

        // Animate the placeholder
        if (droppedPlaceholderIndex !== null) {
          setPlaceholderAnimations(prev => ({
            ...prev,
            [String(droppedPlaceholderIndex)]: 'word-drop-animation'
          }));
        }

        // Track the interaction in analytics
        analytics?.trackInteraction('word_dropped', {
          activityId: activity.id,
          questionId: currentQuestion.id,
          wordId: draggingWord,
          placeholderIndex: droppedPlaceholderIndex
        });
      } else {
        // Return the word to the word bank
        setAnswers(prev => {
          const newAnswers = { ...prev };
          delete newAnswers[draggingWord];
          return newAnswers;
        });
      }
    }

    // Clear dragging state
    setDraggingWord(null);
    setWordPositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[draggingWord];
      return newPositions;
    });

    // Clear animation
    setTimeout(() => {
      setAnimatingWordIds(prev => {
        const newAnimations = { ...prev };
        delete newAnimations[draggingWord];
        return newAnimations;
      });
    }, 500);
  };

  // Grade the current question
  const gradeCurrentQuestion = () => {
    if (!currentQuestion || !currentQuestion.words) return { score: 0, maxScore: 0, percentage: 0, correctCount: 0 };

    let correctCount = 0;
    const totalWords = currentQuestion.words?.length || 0;

    currentQuestion.words?.forEach(word => {
      const placedIndex = answers[word.id];
      if (placedIndex === word.correctIndex) {
        correctCount++;
      }
    });

    const maxScore = currentQuestion.points || totalWords;
    const earnedScore = totalWords > 0 ? (correctCount / totalWords * maxScore) : 0;
    const percentage = totalWords > 0 ? (correctCount / totalWords) * 100 : 0;

    return {
      score: earnedScore,
      maxScore,
      percentage,
      correctCount
    };
  };

  // Handle submission
  const handleSubmit = () => {
    // Grade the question
    const result = gradeCurrentQuestion();
    setScore(result.percentage);
    setIsSubmitted(true);

    // Animate correct and incorrect placements
    const newPlaceholderAnimations: Record<string, string> = {};

    currentQuestion.words?.forEach(word => {
      const placedIndex = answers[word.id];
      if (placedIndex !== undefined && placedIndex !== null) {
        newPlaceholderAnimations[placedIndex.toString()] =
          placedIndex === word.correctIndex
            ? 'correct-placement-animation'
            : 'incorrect-placement-animation';
      }
    });

    setPlaceholderAnimations(newPlaceholderAnimations);

    // Track submission in analytics
    analytics?.trackEvent('activity_submit', {
      activityId: activity.id,
      activityType: activity.activityType,
      score: result.percentage,
      passed: result.percentage >= (activity.settings?.passingPercentage || 60),
      timeSpent: 0 // You could track time spent if needed
    });

    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(answers, {
        score: result.percentage,
        passed: result.percentage >= (activity.settings?.passingPercentage || 60),
        details: currentQuestion.words?.map(word => ({
          wordId: word.id,
          correctIndex: word.correctIndex,
          placedIndex: answers[word.id],
          isCorrect: answers[word.id] === word.correctIndex
        })) || []
      });
    }

    // Clear animations after a delay
    setTimeout(() => {
      setPlaceholderAnimations({});
    }, 1000);
  };

  // Handle reset
  const handleReset = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setWordPositions({});
    setAnimatingWordIds({});
    setPlaceholderAnimations({});

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
      setWordPositions({});
      setAnimatingWordIds({});
      setPlaceholderAnimations({});
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswers({});
      setIsSubmitted(false);
      setScore(null);
      setWordPositions({});
      setAnimatingWordIds({});
      setPlaceholderAnimations({});
    }
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all words have been placed
  const allWordsPlaced = currentQuestion?.words?.every(word => answers[word.id] !== undefined) || false;

  // Parse the question text to separate text and placeholders
  const renderQuestionText = () => {
    if (!currentQuestion) return null;

    const parts = parseTextWithPlaceholders(currentQuestion.text);

    return (
      <div className="mt-3 text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
        {parts.map((part, partIndex) => {
          if (part.type === 'text') {
            return <span key={partIndex}>{part.content}</span>;
          } else {
            // This is a placeholder
            const placeholderIndex = part.index;

            // Find the word placed in this placeholder
            const placedWordId = Object.keys(answers).find(
              wordId => answers[wordId] === placeholderIndex
            );

            const placedWord = placedWordId
              ? currentQuestion.words?.find(w => w.id === placedWordId)
              : null;

            // Determine if the placement is correct (only show after submission)
            const isCorrect = isSubmitted && placedWord &&
              answers[placedWord.id] === placedWord.correctIndex;

            const isIncorrect = isSubmitted && placedWord &&
              answers[placedWord.id] !== placedWord.correctIndex;

            // Determine the correct word for this placeholder (for feedback)
            const correctWord = currentQuestion.words?.find(
              w => w.correctIndex === placeholderIndex
            );

            return (
              <span
                key={partIndex}
                ref={(el) => {
                  if (el && placeholderIndex !== undefined) {
                    placeholderRefs.current[placeholderIndex.toString()] = el;
                  }
                }}
                className={cn(
                  "inline-block mx-1 px-2 py-1 min-w-[80px] min-h-[36px] border-2 border-dashed rounded transition-all duration-200 align-middle",
                  {
                    "border-medium-teal/70 dark:border-medium-teal/50 bg-light-mint/30 dark:bg-primary-green/10": !placedWord && !isSubmitted,
                    "border-primary-green dark:border-medium-teal bg-light-mint/50 dark:bg-primary-green/20 border-solid": placedWord && !isSubmitted,
                    "border-green-500 dark:border-green-700 bg-green-100 dark:bg-green-900/30 border-solid": isCorrect,
                    "border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/30 border-solid": isIncorrect,
                    [placeholderAnimations[placeholderIndex?.toString() || ''] || '']: !!placeholderAnimations[placeholderIndex?.toString() || ''],
                    "placeholder": true,
                    "filled": !!placedWord,
                    "correct": isCorrect,
                    "incorrect": isIncorrect
                  }
                )}
                aria-label={`Placeholder ${placeholderIndex !== undefined ? placeholderIndex + 1 : ''}`}
                data-placeholder-index={placeholderIndex}
              >
                {placedWord ? (
                  <span className="font-medium">{placedWord.text}</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">______</span>
                )}

                {/* Show correct answer if submitted and incorrect */}
                {isSubmitted && isIncorrect && correctWord && (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1 font-medium">
                    <span className="sr-only">Correct word:</span> {correctWord.text}
                  </div>
                )}
              </span>
            );
          }
        })}
      </div>
    );
  };

  // Render the word bank
  const renderWordBank = () => {
    if (!currentQuestion) {
      console.error('No current question available for word bank');
      return null;
    }

    if (!currentShuffledWords || !currentShuffledWords.length) {
      console.error('No words available for word bank', {
        currentQuestion,
        shuffledWords,
        currentShuffledWords,
        questionId: currentQuestion.id
      });

      // Fallback to using the question's words directly if shuffled words are not available
      if (currentQuestion.words && currentQuestion.words.length > 0) {
        console.log('Falling back to question words', currentQuestion.words);
      } else {
        return (
          <div className="mt-6 p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
            <h4 className="text-md font-medium mb-2 text-red-600 dark:text-red-400">Word Bank Error</h4>
            <p>No words available for this activity. Please try refreshing the page.</p>
          </div>
        );
      }
    }

    // Use either shuffled words or fall back to question words
    const wordsToRender = currentShuffledWords.length > 0
      ? currentShuffledWords
      : (currentQuestion.words || []);

    if (wordsToRender.length === 0) {
      return (
        <div className="mt-6 p-4 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <h4 className="text-md font-medium mb-2 text-yellow-600 dark:text-yellow-400">Word Bank</h4>
          <p>No words available for this activity.</p>
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 border border-medium-teal/30 dark:border-medium-teal/20 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h4 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Word Bank ({wordsToRender.length} words)</h4>
        <div className="flex flex-wrap gap-2">
          {wordsToRender.map(word => {
            // Skip words that have been placed
            if (!word || !word.id) {
              console.error('Invalid word in word bank', word);
              return null;
            }

            if (answers[word.id] !== undefined) return null;

            return (
              <div
                key={word.id}
                ref={(el) => {
                  if (el) wordRefs.current[word.id] = el;
                }}
                className={cn(
                  "px-3 py-1 min-h-[44px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm cursor-move transition-all duration-200 draggable-word",
                  {
                    "z-10": draggingWord === word.id,
                    "hover:bg-light-mint/30 dark:hover:bg-primary-green/10": !isSubmitted,
                    "opacity-60 cursor-not-allowed": isSubmitted,
                    [animatingWordIds[word.id] || '']: !!animatingWordIds[word.id]
                  }
                )}
                style={{
                  position: draggingWord === word.id ? 'absolute' : 'relative',
                  left: draggingWord === word.id && wordPositions[word.id] ? `${wordPositions[word.id].x}px` : 'auto',
                  top: draggingWord === word.id && wordPositions[word.id] ? `${wordPositions[word.id].y}px` : 'auto',
                  touchAction: 'none'
                }}
                onMouseDown={e => !isSubmitted && handleDragStart(word.id, e)}
                onTouchStart={e => !isSubmitted && handleDragStart(word.id, e)}
                aria-label={`Drag word: ${word.text}`}
                role="button"
                tabIndex={0}
              >
                {word.text}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
          total={currentQuestion?.words?.length || 0}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
          {Object.keys(answers).length} of {currentQuestion?.words?.length || 0} words placed
        </p>
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
      <ThemeWrapper
        ref={containerRef}
        className="mb-6 p-4 border border-medium-teal/30 dark:border-medium-teal/20 rounded-lg bg-white dark:bg-gray-800 relative"
        onMouseMove={e => draggingWord && handleDragMove(e)}
        onTouchMove={e => draggingWord && handleDragMove(e)}
        onMouseUp={() => draggingWord && handleDragEnd()}
        onTouchEnd={() => draggingWord && handleDragEnd()}
        onMouseLeave={() => draggingWord && handleDragEnd()}
      >
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
        </h3>

        {/* Question hint */}
        {currentQuestion?.hint && (
          <QuestionHint hint={currentQuestion.hint} />
        )}

        {/* Question text with placeholders */}
        {renderQuestionText()}

        {/* Show explanation if submitted */}
        {isSubmitted && currentQuestion?.explanation && (
          <div className="mt-4 p-3 bg-light-mint dark:bg-primary-green/20 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Explanation:</strong>
            <span className="text-gray-800 dark:text-gray-200"> {currentQuestion.explanation}</span>
          </div>
        )}
      </ThemeWrapper>

      {/* Word bank */}
      {activity.settings?.showWordBank !== false && renderWordBank()}

      {/* Action buttons */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex justify-center sm:justify-start space-x-2">
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
        <div className="flex justify-center sm:justify-end space-x-2">
          {!isSubmitted ? (
            submitButton ? (
              // Use the universal submit button if provided
              React.cloneElement(submitButton as React.ReactElement, {
                onClick: handleSubmit,
                disabled: !allWordsPlaced,
                loading: false,
                submitted: false,
                className: "min-w-[120px] min-h-[44px]",
                children: 'Submit'
              })
            ) : (
              // Fallback to ActivityButton if no universal button provided
              <ActivityButton
                onClick={handleSubmit}
                disabled={!allWordsPlaced}
                variant="primary"
                icon="check-circle"
                className="min-w-[120px] min-h-[44px]"
              >
                Submit
              </ActivityButton>
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
              className="min-w-[120px] min-h-[44px]"
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

export default DragTheWordsViewer;
