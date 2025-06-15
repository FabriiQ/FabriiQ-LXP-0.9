'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrueFalseActivity, TrueFalseQuestion } from '../../models/true-false';
import { gradeTrueFalseActivity } from '../../grading/true-false';
import { ActivityButton } from '../ui/ActivityButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { RichTextDisplay } from '../ui/RichTextDisplay';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export interface TrueFalseViewerProps {
  activity: TrueFalseActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, boolean>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * True/False Activity Viewer
 *
 * This component displays a true/false activity with:
 * - Interactive true/false selection
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 */
export const TrueFalseViewer: React.FC<TrueFalseViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking selected answers and submission
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<TrueFalseQuestion[]>([]);

  // Initialize shuffled questions
  useEffect(() => {
    let questions = [...activity.questions];

    // Shuffle questions if enabled
    if (activity.settings?.shuffleQuestions) {
      questions = shuffleArray(questions);
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

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answer: boolean) => {
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle submission
  const handleSubmit = () => {
    // Grade the activity
    const result = gradeTrueFalseActivity(activity, selectedAnswers);
    setScore(result.percentage);
    setIsSubmitted(true);

    // Log the submission for debugging
    console.log('TrueFalseViewer submitting answers:', {
      activityId: activity.id,
      selectedAnswers,
      result
    });

    // Call onSubmit callback if provided
    if (onSubmit) {
      // Pass the answers in the format expected by the API
      onSubmit(selectedAnswers, result);
    }
  };

  // Handle reset
  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(null);
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all questions are answered
  const allQuestionsAnswered = shuffledQuestions.every(q => selectedAnswers[q.id] !== undefined);

  // Refs for button elements
  const trueButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const falseButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Render a single question
  const renderQuestion = (question: TrueFalseQuestion, index: number) => {
    const selectedAnswer = selectedAnswers[question.id];
    const showFeedback = isSubmitted && activity.settings?.showFeedbackImmediately !== false;
    const showCorrectness = isSubmitted && activity.settings?.showCorrectAnswers !== false;
    const isCorrect = selectedAnswer === question.isTrue;

    // Create ref callbacks that don't return values
    const setTrueButtonRef = (el: HTMLButtonElement | null) => {
      trueButtonRefs.current[question.id] = el;
    };

    const setFalseButtonRef = (el: HTMLButtonElement | null) => {
      falseButtonRefs.current[question.id] = el;
    };

    return (
      <ThemeWrapper
        key={question.id}
        className="mb-6 p-4 sm:p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-md"
      >
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center">
          <span className="bg-primary-green text-white rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
            {index + 1}
          </span>
          <span className="flex-1">Statement {index + 1}</span>
        </h3>

        <div className="mb-4 text-gray-800 dark:text-gray-200">
          <RichTextDisplay content={question.text} />
        </div>

        {/* Question hint */}
        {question.hint && (
          <QuestionHint hint={question.hint} />
        )}

        {/* True/False buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            ref={setTrueButtonRef}
            className={cn(
              "flex-1 p-4 border rounded-lg transition-all duration-200 min-h-[60px]",
              {
                "border-primary-green bg-light-mint dark:bg-primary-green/20": selectedAnswer === true && !showCorrectness,
                "border-green-500 bg-green-50 dark:bg-green-900/20": showCorrectness && question.isTrue,
                "border-red-500 bg-red-50 dark:bg-red-900/20": showCorrectness && selectedAnswer === true && !question.isTrue,
                "border-gray-300 dark:border-gray-700 hover:border-medium-teal hover:shadow-sm": selectedAnswer !== true && !showCorrectness,
                "opacity-60 cursor-not-allowed": isSubmitted && activity.settings?.attemptsAllowed === 1,
                "transform scale-[1.02] shadow-md": selectedAnswer === true && !showCorrectness
              }
            )}
            onClick={() => {
              if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

              // Add animation class
              const button = trueButtonRefs.current[question.id];
              if (button) {
                button.classList.add('animate-pulse');
                setTimeout(() => {
                  button.classList.remove('animate-pulse');
                }, 300);
              }

              handleAnswerSelect(question.id, true);
            }}
            disabled={isSubmitted && activity.settings?.attemptsAllowed === 1}
            aria-pressed={selectedAnswer === true}
            role="radio"
            aria-checked={selectedAnswer === true}
          >
            <div className="flex items-center justify-center">
              <div className={cn(
                "min-w-[28px] min-h-[28px] rounded-full border flex items-center justify-center mr-3 transition-all duration-200",
                {
                  "border-primary-green bg-primary-green text-white": selectedAnswer === true && !showCorrectness,
                  "border-green-500 bg-green-500 text-white": showCorrectness && question.isTrue,
                  "border-red-500 bg-red-500 text-white": showCorrectness && selectedAnswer === true && !question.isTrue,
                  "border-gray-300 dark:border-gray-600": selectedAnswer !== true && !showCorrectness,
                  "animate-pulse": selectedAnswer === true && !showCorrectness && !isSubmitted
                }
              )}>
                <Check className="w-4 h-4" />
              </div>
              <span className="font-medium text-lg">True</span>
            </div>
          </button>

          <button
            ref={setFalseButtonRef}
            className={cn(
              "flex-1 p-4 border rounded-lg transition-all duration-200 min-h-[60px]",
              {
                "border-primary-green bg-light-mint dark:bg-primary-green/20": selectedAnswer === false && !showCorrectness,
                "border-green-500 bg-green-50 dark:bg-green-900/20": showCorrectness && !question.isTrue,
                "border-red-500 bg-red-50 dark:bg-red-900/20": showCorrectness && selectedAnswer === false && question.isTrue,
                "border-gray-300 dark:border-gray-700 hover:border-medium-teal hover:shadow-sm": selectedAnswer !== false && !showCorrectness,
                "opacity-60 cursor-not-allowed": isSubmitted && activity.settings?.attemptsAllowed === 1,
                "transform scale-[1.02] shadow-md": selectedAnswer === false && !showCorrectness
              }
            )}
            onClick={() => {
              if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

              // Add animation class
              const button = falseButtonRefs.current[question.id];
              if (button) {
                button.classList.add('animate-pulse');
                setTimeout(() => {
                  button.classList.remove('animate-pulse');
                }, 300);
              }

              handleAnswerSelect(question.id, false);
            }}
            disabled={isSubmitted && activity.settings?.attemptsAllowed === 1}
            aria-pressed={selectedAnswer === false}
            role="radio"
            aria-checked={selectedAnswer === false}
          >
            <div className="flex items-center justify-center">
              <div className={cn(
                "min-w-[28px] min-h-[28px] rounded-full border flex items-center justify-center mr-3 transition-all duration-200",
                {
                  "border-primary-green bg-primary-green text-white": selectedAnswer === false && !showCorrectness,
                  "border-green-500 bg-green-500 text-white": showCorrectness && !question.isTrue,
                  "border-red-500 bg-red-500 text-white": showCorrectness && selectedAnswer === false && question.isTrue,
                  "border-gray-300 dark:border-gray-600": selectedAnswer !== false && !showCorrectness,
                  "animate-pulse": selectedAnswer === false && !showCorrectness && !isSubmitted
                }
              )}>
                <X className="w-4 h-4" />
              </div>
              <span className="font-medium text-lg">False</span>
            </div>
          </button>
        </div>

        {/* Show explanation if submitted */}
        {isSubmitted && question.explanation && (
          <div className="mt-4 p-4 bg-light-mint dark:bg-primary-green/20 rounded-md border border-medium-teal/50 dark:border-medium-teal/70 animate-fade-in">
            <strong className="text-primary-green dark:text-medium-teal text-lg">Explanation:</strong>
            <div className="text-gray-800 dark:text-gray-200 mt-1">
              <RichTextDisplay content={question.explanation} />
            </div>
          </div>
        )}

        {/* Show feedback if submitted */}
        {showFeedback && selectedAnswer !== undefined && (
          <div className={cn(
            "mt-4 p-4 rounded-md border animate-fade-in",
            isCorrect
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          )}>
            <div className="flex items-start">
              <div className={cn(
                "min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center mr-3 mt-0.5",
                isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
              )}>
                {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </div>
              <div>
                <strong className={isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                  {isCorrect ? "Correct!" : "Incorrect!"}
                </strong>
                <p className="text-gray-800 dark:text-gray-200 mt-1">
                  {isCorrect
                    ? `You correctly identified that this statement is ${question.isTrue ? 'true' : 'false'}.`
                    : `This statement is actually ${question.isTrue ? 'true' : 'false'}.`}
                </p>
              </div>
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
          current={Object.keys(selectedAnswers).length}
          total={shuffledQuestions.length}
          color="green"
          showPercentage={true}
        />
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
              loading: false,
              submitted: false,
              children: 'Submit'
            })
          ) : (
            // Fallback to ActivityButton if no universal button provided
            <ActivityButton
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered}
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

      {/* Mobile hint */}
      <div className="mt-4 text-center text-sm text-gray-500 sm:hidden">
        <p>Tap the True or False buttons to select your answer</p>
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

export default TrueFalseViewer;
