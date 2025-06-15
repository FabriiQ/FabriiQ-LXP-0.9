'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MultipleResponseActivity, MultipleResponseQuestion } from '../../models/multiple-response';
import { gradeMultipleResponseActivity } from '../../grading/multiple-response';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { ActivityButton } from '../ui/ActivityButton';
import { AnimatedSubmitButton } from '../ui/AnimatedSubmitButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { RichTextDisplay } from '../ui/RichTextDisplay';
import { MediaDisplay } from '../ui/MediaDisplay';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export interface MultipleResponseViewerProps {
  activity: MultipleResponseActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, string[]>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Multiple Response Activity Viewer
 *
 * This component displays a multiple response activity with:
 * - Interactive option selection (multiple selections allowed)
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 */
export const MultipleResponseViewer: React.FC<MultipleResponseViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking selected answers and submission
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Refs for animation effects
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, 'multiple-response');

  // Shuffle questions and options if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<MultipleResponseQuestion[]>([]);

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

  // Handle option selection (toggle selection)
  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    // Get the option element for animation
    const optionElement = optionRefs.current[`${questionId}-${optionId}`];

    // Add animation effect
    if (optionElement) {
      optionElement.classList.add('pulse-animation');
      setTimeout(() => {
        optionElement?.classList.remove('pulse-animation');
      }, 500);
    }

    setSelectedAnswers(prev => {
      const currentSelections = prev[questionId] || [];

      // If already selected, remove it; otherwise, add it
      const newSelections = currentSelections.includes(optionId)
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];

      // Track option selection in analytics
      const question = shuffledQuestions.find(q => q.id === questionId);
      const option = question?.options.find(o => o.id === optionId);

      if (question && option) {
        analytics.trackOptionSelect(
          activity.id,
          questionId,
          optionId,
          currentSelections.includes(optionId) ? -1 : newSelections.length - 1,
          option.isCorrect
        );
      }

      return {
        ...prev,
        [questionId]: newSelections
      };
    });
  };

  // Handle submission with optimistic UI and animations
  const handleSubmit = () => {
    // Show submitting state
    setIsSubmitting(true);

    // Record the start time for timing
    const startTime = performance.now();

    // Simulate network delay for better UX with animations
    setTimeout(() => {
      // Grade the activity
      const result = gradeMultipleResponseActivity(activity, selectedAnswers);
      setScore(result.percentage);

      // Calculate time spent grading
      const timeSpent = performance.now() - startTime;

      // Track activity completion in analytics
      analytics.trackActivityComplete(
        activity.id,
        'multiple-response',
        result.score,
        result.maxScore,
        timeSpent
      );

      // Track individual question results
      result.questionResults.forEach((questionResult, index) => {
        analytics.trackQuestionAnswer(
          activity.id,
          questionResult.questionId,
          index,
          questionResult.isCorrect,
          questionResult.points,
          questionResult.maxPoints,
          1 // First attempt
        );
      });

      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(selectedAnswers, result);
      }

      // Complete the submission after a short delay to show the animation
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);

        // Scroll to top to show score
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 500); // Short delay for animation
    }, 800); // Simulate network delay
  };

  // Handle reset
  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(null);
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all questions have at least one selection
  const allQuestionsAnswered = shuffledQuestions.every(q =>
    selectedAnswers[q.id] && selectedAnswers[q.id].length > 0
  );

  // Render a single question
  const renderQuestion = (question: MultipleResponseQuestion, index: number) => {
    const selectedOptionIds = selectedAnswers[question.id] || [];
    const showFeedback = isSubmitted && activity.settings?.showFeedbackImmediately !== false;
    const showCorrectness = isSubmitted && activity.settings?.showCorrectAnswers !== false;

    // Create a ref callback that doesn't return a value
    const setOptionRef = (optionId: string) => (el: HTMLDivElement | null) => {
      optionRefs.current[`${question.id}-${optionId}`] = el;
    };

    return (
      <ThemeWrapper
        key={question.id}
        className="mb-6 p-4 sm:p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-md animate-fadeIn"
      >
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center">
          <span className="bg-primary-green text-white rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
            {index + 1}
          </span>
          <span className="flex-1">Question {index + 1}</span>
        </h3>
        <div className="mb-4">
          <RichTextDisplay content={question.text} />

          {/* Display question media if available */}
          {question.media && (
            <div className="mt-4 mb-4">
              <MediaDisplay media={question.media} />
            </div>
          )}
        </div>

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

        {/* Options */}
        <div className="space-y-3 mt-4">
          {question.options.map(option => (
            <div
              key={option.id}
              ref={setOptionRef(option.id)}
              className={cn(
                "p-4 border rounded-lg mb-2 transition-all duration-200 cursor-pointer touch-ripple",
                {
                  "border-primary-green bg-light-mint dark:bg-primary-green/20": selectedOptionIds.includes(option.id) && !showCorrectness,
                  "border-green-500 bg-green-50 dark:bg-green-900/20": showCorrectness && option.isCorrect,
                  "border-red-500 bg-red-50 dark:bg-red-900/20": showCorrectness && selectedOptionIds.includes(option.id) && !option.isCorrect,
                  "border-gray-300 dark:border-gray-700 hover:border-medium-teal hover:shadow-md": !selectedOptionIds.includes(option.id) && !showCorrectness,
                  "opacity-60 cursor-not-allowed": isSubmitted && activity.settings?.attemptsAllowed === 1,
                  "transform scale-[1.02] shadow-md": selectedOptionIds.includes(option.id) && !showCorrectness
                }
              )}
              onClick={() => handleOptionSelect(question.id, option.id)}
              onTouchStart={() => {
                // Add touch feedback class
                const el = optionRefs.current[`${question.id}-${option.id}`];
                if (el && !selectedOptionIds.includes(option.id)) {
                  el.classList.add('touch-ripple');
                }
              }}
              role="checkbox"
              aria-checked={selectedOptionIds.includes(option.id)}
              tabIndex={isSubmitted && activity.settings?.attemptsAllowed === 1 ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionSelect(question.id, option.id);
                }
              }}
            >
              <div className="flex items-center">
                <div className={cn(
                  "min-w-[28px] min-h-[28px] rounded border flex items-center justify-center mr-3 transition-all duration-200",
                  {
                    "border-primary-green bg-primary-green text-white": selectedOptionIds.includes(option.id) && !showCorrectness,
                    "border-green-500 bg-green-500 text-white": showCorrectness && option.isCorrect,
                    "border-red-500 bg-red-500 text-white": showCorrectness && selectedOptionIds.includes(option.id) && !option.isCorrect,
                    "border-gray-300 dark:border-gray-600": !selectedOptionIds.includes(option.id) && !showCorrectness,
                    "animate-pulse": selectedOptionIds.includes(option.id) && !showCorrectness && !isSubmitted
                  }
                )}>
                  {selectedOptionIds.includes(option.id) && <Check className="w-4 h-4" />}
                  {showCorrectness && option.isCorrect && !selectedOptionIds.includes(option.id) && <Check className="w-4 h-4" />}
                  {showCorrectness && selectedOptionIds.includes(option.id) && !option.isCorrect && <X className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <RichTextDisplay content={option.text} />
                  {option.media && (
                    <div className="mt-3">
                      <MediaDisplay media={option.media} maxHeight="120px" />
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback when shown */}
              {showFeedback && selectedOptionIds.includes(option.id) && option.feedback && (
                <div className="mt-3 p-3 rounded bg-light-mint/30 dark:bg-primary-green/10 text-sm animate-fadeIn">
                  <RichTextDisplay content={option.feedback} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show explanation if submitted - with brand colors and animation */}
        {isSubmitted && question.explanation && (
          <div className="mt-4 p-4 bg-light-mint dark:bg-primary-green/20 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fadeIn">
            <strong className="text-primary-green dark:text-medium-teal text-lg">Explanation:</strong>
            <div className="text-gray-800 dark:text-gray-200 mt-1">
              <RichTextDisplay content={question.explanation} />
            </div>
          </div>
        )}

        {/* Show correct answers if submitted */}
        {isSubmitted && showCorrectness && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
            <strong className="text-green-700 dark:text-green-400 text-lg">Correct answers:</strong>
            <div className="text-gray-800 dark:text-gray-200 mt-1 space-y-2">
              {question.options.filter(o => o.isCorrect).map(o => (
                <div key={o.id} className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span>{o.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ThemeWrapper>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Activity header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{activity.title}</h1>
        {activity.description && (
          <div className="text-gray-600 dark:text-gray-300 mb-3">
            <RichTextDisplay content={activity.description} />
          </div>
        )}
        {activity.instructions && (
          <div className="bg-light-mint dark:bg-primary-green/20 p-4 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fadeIn">
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

        {/* Question navigation for desktop */}
        {shuffledQuestions.length > 3 && (
          <div className="hidden sm:flex flex-wrap gap-2 mt-4">
            {shuffledQuestions.map((question, index) => {
              const isAnswered = selectedAnswers[question.id] && selectedAnswers[question.id].length > 0;
              return (
                <button
                  key={index}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200",
                    isAnswered
                      ? "bg-primary-green text-white"
                      : "bg-light-mint text-primary-green border border-medium-teal/50"
                  )}
                  onClick={() => {
                    // Scroll to question
                    const questionElement = document.getElementById(`question-${question.id}`);
                    if (questionElement) {
                      questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Score display */}
      {isSubmitted && score !== null && (
        <div className={cn(
          "mb-6 p-5 rounded-lg border animate-fadeIn",
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
              ? "Congratulations! You passed the quiz."
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

      {/* Mobile hint */}
      <div className="mt-4 text-center text-sm text-gray-500 sm:hidden">
        <p>Tap options to select multiple answers</p>
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

export default MultipleResponseViewer;

// Add global styles for animations with brand colors
const styles = `
  @keyframes pulse-animation {
    0% {
      box-shadow: 0 0 0 0 rgba(31, 80, 75, 0.5); /* Primary Green */
    }
    70% {
      box-shadow: 0 0 0 10px rgba(31, 80, 75, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(31, 80, 75, 0);
    }
  }

  .pulse-animation {
    animation: pulse-animation 0.5s cubic-bezier(0.4, 0, 0.6, 1);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }

  /* Touch feedback animation */
  @keyframes touch-ripple {
    0% {
      transform: scale(1);
      opacity: 0.4;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .touch-ripple {
    position: relative;
  }

  .touch-ripple::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(90, 138, 132, 0.5); /* Medium Teal */
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }

  .touch-ripple:active::after {
    animation: touch-ripple 0.4s ease-out;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
