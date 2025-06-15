'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MultipleChoiceActivity, MultipleChoiceQuestion } from '../../models/multiple-choice';
import { gradeMultipleChoiceActivity } from '../../grading/multiple-choice';
import { ActivityButton } from '../ui/ActivityButton';
import { AnimatedSubmitButton } from '../ui/AnimatedSubmitButton';
import { SelectableOption } from '../ui/SelectableOption';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { RichTextDisplay } from '../ui/RichTextDisplay';
import { MediaDisplay } from '../ui/MediaDisplay';
import { SwipeHandler } from '../ui/SwipeHandler';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';

export interface MultipleChoiceViewerProps {
  activity: MultipleChoiceActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, string>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Multiple Choice Activity Viewer
 *
 * This component displays a multiple choice activity with:
 * - Interactive option selection
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 * - Mobile-friendly touch interactions
 * - Swipe gestures for navigation
 * - Improved animations and transitions
 */
export const MultipleChoiceViewer: React.FC<MultipleChoiceViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking selected answers and submission
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSingleQuestion, setShowSingleQuestion] = useState(false);
  const [questionTransition, setQuestionTransition] = useState<'slide-left' | 'slide-right' | 'fade-in' | null>(null);

  // Refs for scroll position management
  const containerRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Shuffle questions and options if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<MultipleChoiceQuestion[]>([]);

  // Initialize shuffled questions
  useEffect(() => {
    let questions = [...activity.questions];

    // Shuffle questions if enabled
    if (activity.settings?.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    // Shuffle options if enabled
    if (activity.settings?.shuffleOptions) {
      questions = questions.map(question => ({
        ...question,
        options: shuffleArray([...question.options])
      }));
    }

    setShuffledQuestions(questions);

    // Enable single question view on mobile devices
    const checkMobile = () => {
      setShowSingleQuestion(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [activity]);

  // Track progress
  useEffect(() => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalQuestions = activity.questions.length;
    const progress = (answeredCount / totalQuestions) * 100;

    if (onProgress) {
      onProgress(progress);
    }
  }, [selectedAnswers, activity.questions.length, onProgress]);

  // Handle option selection
  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Handle hint toggle is now managed by the QuestionHint component

  // Handle submission with optimistic UI and animations
  const handleSubmit = () => {
    // Show submitting state
    setIsSubmitting(true);

    // Simulate network delay for better UX with animations
    setTimeout(() => {
      // Grade the activity
      const result = gradeMultipleChoiceActivity(activity, selectedAnswers);
      setScore(result.percentage);

      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(selectedAnswers, result);
      }

      // Complete the submission after a short delay to show the animation
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);

        // Scroll to top to show score
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }, 500); // Short delay for animation
    }, 800); // Simulate network delay
  };

  // Handle reset
  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(null);
  };

  // Navigate to next question with animation
  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setQuestionTransition('slide-left');
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTransition(null);
      }, 300);
    }
  };

  // Navigate to previous question with animation
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setQuestionTransition('slide-right');
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setQuestionTransition(null);
      }, 300);
    }
  };

  // Swipe gestures are handled directly in the SwipeHandler component

  // Scroll to a specific question
  const scrollToQuestion = (index: number) => {
    const question = shuffledQuestions[index];
    if (question && questionRefs.current[question.id]) {
      questionRefs.current[question.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all questions are answered
  const allQuestionsAnswered = shuffledQuestions.every(q => selectedAnswers[q.id]);

  // Render a single question
  const renderQuestion = (question: MultipleChoiceQuestion, index: number) => {
    const selectedOptionId = selectedAnswers[question.id];
    const showCorrectness = isSubmitted && activity.settings?.showCorrectAnswers !== false;
    const isCurrentQuestion = index === currentQuestionIndex;


    // Create a ref callback that doesn't return a value
    const setQuestionRef = (el: HTMLDivElement | null) => {
      questionRefs.current[question.id] = el;
    };

    return (
      <div
        key={question.id}
        ref={setQuestionRef}

        className={cn(
          "mb-6 p-4 sm:p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300",
          "hover:shadow-md",
          {
            "hidden": showSingleQuestion && !isCurrentQuestion,
            "animate-fade-in": !questionTransition,
            "animate-slide-left-out": questionTransition === 'slide-left' && isCurrentQuestion,
            "animate-slide-right-out": questionTransition === 'slide-right' && isCurrentQuestion,
          }
        )}
      >
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center">
          <span className="bg-primary-green text-white rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
            {index + 1}
          </span>
          <span className="flex-1">Question {index + 1} of {shuffledQuestions.length}</span>
        </h3>
        <RichTextDisplay content={question.text} className="mb-3" />

        {/* Display question media if available */}
        {question.media && (
          <div className="mb-4">
            <MediaDisplay media={question.media} />
          </div>
        )}

        {/* Question hint */}
        {question.hint && (
          <QuestionHint hint={question.hint} />
        )}

        {/* Options */}
        <div className="space-y-3 mt-4">
          {question.options.map(option => (
            <SelectableOption
              key={option.id}
              option={option}
              isSelected={selectedOptionId === option.id}
              isCorrect={option.isCorrect}
              showCorrectness={showCorrectness}
              onClick={() => handleOptionSelect(question.id, option.id)}
              disabled={isSubmitted && activity.settings?.attemptsAllowed === 1}
            />
          ))}
        </div>

        {/* Show explanation if submitted - with brand colors and animation */}
        {isSubmitted && question.explanation && (
          <div
            className="mt-4 p-4 bg-light-mint dark:bg-primary-green/20 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fade-in"

          >
            <strong className="text-primary-green dark:text-medium-teal text-lg">Explanation:</strong>
            <div className="text-gray-800 dark:text-gray-200 mt-1">
              <RichTextDisplay content={question.explanation} />
            </div>
          </div>
        )}

        {/* Navigation buttons for single question view */}
        {showSingleQuestion && (
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ActivityButton
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              variant="secondary"
              icon="chevron-left"
              size="sm"
              ariaLabel="Previous question"
            >
              Previous
            </ActivityButton>

            <span className="text-sm text-gray-500 self-center">
              {currentQuestionIndex + 1} / {shuffledQuestions.length}
            </span>

            <ActivityButton
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === shuffledQuestions.length - 1}
              variant="secondary"
              icon="chevron-right"
              size="sm"
              ariaLabel="Next question"
            >
              Next
            </ActivityButton>
          </div>
        )}
      </div>
    );
  };

  // Add CSS animations for question transitions
  useEffect(() => {
    // Add these animations to the global stylesheet
    if (typeof document !== 'undefined') {
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes slide-left-out {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-30px); opacity: 0; }
        }

        @keyframes slide-right-out {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(30px); opacity: 0; }
        }

        @keyframes slide-left-in {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes slide-right-in {
          0% { transform: translateX(-30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        .animate-slide-left-out {
          animation: slide-left-out 0.3s ease-in-out forwards;
        }

        .animate-slide-right-out {
          animation: slide-right-out 0.3s ease-in-out forwards;
        }

        .animate-slide-left-in {
          animation: slide-left-in 0.3s ease-in-out forwards;
        }

        .animate-slide-right-in {
          animation: slide-right-in 0.3s ease-in-out forwards;
        }
      `;
      document.head.appendChild(styleEl);

      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, []);



  return (
    <ThemeWrapper className={cn("w-full", className)}>
      <SwipeHandler
        onSwipeLeft={() => showSingleQuestion && handleNextQuestion()}
        onSwipeRight={() => showSingleQuestion && handlePrevQuestion()}
        disabled={isSubmitted && activity.settings?.attemptsAllowed === 1}
      >
        <div ref={containerRef} className="w-full">
        {/* Activity header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{activity.title}</h1>
          {activity.description && (
            <RichTextDisplay content={activity.description} className="text-gray-600 dark:text-gray-300 mb-3" />
          )}
          {activity.instructions && (
            <div
              className="bg-light-mint dark:bg-primary-green/20 p-4 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fade-in"

            >
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
            current={Object.keys(selectedAnswers).length}
            total={shuffledQuestions.length}
            color="green"
            showPercentage={true}
            className="mb-2"
          />

          {/* Question navigation dots for mobile */}
          {showSingleQuestion && shuffledQuestions.length > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              {shuffledQuestions.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-200",
                    index === currentQuestionIndex
                      ? "bg-primary-green scale-110"
                      : selectedAnswers[shuffledQuestions[index].id]
                        ? "bg-medium-teal/70"
                        : "bg-gray-300 dark:bg-gray-600"
                  )}
                  onClick={() => {
                    if (index > currentQuestionIndex) {
                      setQuestionTransition('slide-left');
                    } else if (index < currentQuestionIndex) {
                      setQuestionTransition('slide-right');
                    }
                    setTimeout(() => {
                      setCurrentQuestionIndex(index);
                      setQuestionTransition(null);
                    }, 300);
                  }}
                  aria-label={`Go to question ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Question quick navigation for desktop */}
          {!showSingleQuestion && shuffledQuestions.length > 3 && (
            <div className="hidden sm:flex flex-wrap gap-2 mt-4">
              {shuffledQuestions.map((question, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200",
                    selectedAnswers[question.id]
                      ? "bg-primary-green text-white"
                      : "bg-light-mint text-primary-green border border-medium-teal/50"
                  )}
                  onClick={() => scrollToQuestion(index)}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Score display */}
        {isSubmitted && score !== null && (
          <div
            className={cn(
              "mb-6 p-5 rounded-lg border animate-fade-in",
              isPassed
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            )}

          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <span className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white",
                isPassed ? "bg-green-600" : "bg-red-600"
              )}>
                {isPassed ? "✓" : "✗"}
              </span>
              Your Score: {score}%
            </h2>
            <p className={cn(
              "mt-2",
              isPassed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
            )}>
              {isPassed
                ? "Congratulations! You passed the quiz."
                : `You need ${activity.settings?.passingPercentage || 60}% to pass.`}
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {shuffledQuestions.map((question, index) => renderQuestion(question, index))}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex justify-between">
          {!isSubmitted ? (
            submitButton ? (
              // Use the universal submit button if provided
              React.cloneElement(submitButton as React.ReactElement, {
                onClick: handleSubmit,
                disabled: !allQuestionsAnswered,
                loading: isSubmitting,
                submitted: false,
                children: 'Submit'
              })
            ) : (
              // Fallback to AnimatedSubmitButton if no universal button provided
              <AnimatedSubmitButton
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
                loading={isSubmitting}
                submitted={false}
                className="min-w-[140px]"
              >
                Submit
              </AnimatedSubmitButton>
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

        {/* Mobile navigation hint */}
        {showSingleQuestion && shuffledQuestions.length > 1 && (
          <div className="text-center text-sm text-gray-500 mt-4 animate-pulse">
            Swipe left or right to navigate between questions
          </div>
        )}
      </div>
      </SwipeHandler>
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

export default MultipleChoiceViewer;
