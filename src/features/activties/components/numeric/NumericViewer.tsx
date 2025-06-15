'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NumericActivity, NumericQuestion, isNumericAnswerCorrect } from '../../models/numeric';
import { ActivityButton } from '../ui/ActivityButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';

// Animation styles
const numericAnimationStyles = `
  /* Input focus animation */
  @keyframes input-focus-pulse {
    0% { box-shadow: 0 0 0 0 rgba(31, 80, 75, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(31, 80, 75, 0); }
    100% { box-shadow: 0 0 0 0 rgba(31, 80, 75, 0); }
  }

  .input-focus-animation {
    animation: input-focus-pulse 1.5s ease-in-out infinite;
  }

  /* Correct answer animation */
  @keyframes correct-answer {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .correct-answer-animation {
    animation: correct-answer 0.5s ease-in-out;
  }

  /* Incorrect answer animation */
  @keyframes incorrect-answer {
    0% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(5px); }
    75% { transform: translateX(-5px); }
    100% { transform: translateX(0); }
  }

  .incorrect-answer-animation {
    animation: incorrect-answer 0.5s ease-in-out;
  }

  /* Calculator button press animation */
  @keyframes calculator-button-press {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  .calculator-button-press {
    animation: calculator-button-press 0.2s ease-in-out;
  }

  /* High contrast mode for color blind users */
  @media (prefers-contrast: more) {
    .numeric-input {
      border: 2px solid #000 !important;
    }

    .numeric-input.correct {
      border: 2px solid #000 !important;
      background-image: linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent) !important;
      background-size: 10px 10px !important;
    }

    .numeric-input.incorrect {
      border: 2px solid #000 !important;
      background-image: linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent) !important;
      background-size: 10px 10px !important;
    }

    .calculator-button {
      border: 2px solid #000 !important;
      font-weight: bold !important;
    }
  }
`;

export interface NumericViewerProps {
  activity: NumericActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, number>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Numeric Activity Viewer
 *
 * This component displays a numeric activity with:
 * - Numeric input fields
 * - Optional calculator
 * - Unit display
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 * - Accessibility features for color-blind users
 */
export const NumericViewer: React.FC<NumericViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking answers and submission
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputAnimation, setInputAnimation] = useState<Record<string, string>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('');
  const [calculatorButtonAnimation, setCalculatorButtonAnimation] = useState<string | null>(null);

  // Refs
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<NumericQuestion[]>([]);

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = numericAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

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

    // Calculate progress based on answered questions
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = shuffledQuestions.length;
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [answers, shuffledQuestions, onProgress, currentQuestion]);

  // Handle input change
  const handleInputChange = (questionId: string, value: string) => {
    // Store the raw input
    setUserInputs(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Try to parse the numeric value
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: numericValue
      }));
    } else {
      // Remove the answer if the input is not a valid number
      setAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('numeric_input', {
      activityId: activity.id,
      questionId: currentQuestion.id,
      value
    });
  };

  // Handle calculator button click
  const handleCalculatorButtonClick = (value: string) => {
    // Animate the button
    setCalculatorButtonAnimation(value);
    setTimeout(() => setCalculatorButtonAnimation(null), 200);

    if (value === 'C') {
      // Clear
      setCalculatorValue('');
    } else if (value === '←') {
      // Backspace
      setCalculatorValue(prev => prev.slice(0, -1));
    } else if (value === '=') {
      // Calculate
      try {
        const result = eval(calculatorValue);
        setCalculatorValue(result.toString());
      } catch (error) {
        setCalculatorValue('Error');
      }
    } else {
      // Add to expression
      setCalculatorValue(prev => prev + value);
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('calculator_button', {
      activityId: activity.id,
      button: value
    });
  };

  // Handle calculator value transfer to input
  const handleUseCalculatorValue = () => {
    if (!currentQuestion) return;

    // Set the calculator value as the input value
    handleInputChange(currentQuestion.id, calculatorValue);

    // Focus the input
    if (inputRefs.current[currentQuestion.id]) {
      inputRefs.current[currentQuestion.id]?.focus();
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('use_calculator_value', {
      activityId: activity.id,
      questionId: currentQuestion.id,
      value: calculatorValue
    });
  };

  // Grade the current question
  const gradeCurrentQuestion = (questionId: string): boolean => {
    const question = shuffledQuestions.find(q => q.id === questionId);
    if (!question) return false;

    const answer = answers[questionId];
    if (answer === undefined) return false;

    return isNumericAnswerCorrect(question, answer);
  };

  // Handle submission
  const handleSubmit = () => {
    // Calculate score
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    shuffledQuestions.forEach(question => {
      const isCorrect = gradeCurrentQuestion(question.id);
      const points = question.points || 1;

      totalPoints += points;
      if (isCorrect) {
        correctCount++;
        earnedPoints += points;
      }
    });

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    setScore(percentage);
    setIsSubmitted(true);

    // Animate correct and incorrect answers
    const newInputAnimations: Record<string, string> = {};

    shuffledQuestions.forEach(question => {
      const isCorrect = gradeCurrentQuestion(question.id);
      newInputAnimations[question.id] = isCorrect ? 'correct-answer-animation' : 'incorrect-answer-animation';
    });

    setInputAnimation(newInputAnimations);

    // Track submission in analytics
    analytics?.trackEvent('activity_submit', {
      activityId: activity.id,
      activityType: activity.activityType,
      score: percentage,
      passed: percentage >= (activity.settings?.passingPercentage || 60),
      timeSpent: 0 // You could track time spent if needed
    });

    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(answers, {
        score: percentage,
        passed: percentage >= (activity.settings?.passingPercentage || 60),
        details: shuffledQuestions.map(question => ({
          questionId: question.id,
          correctAnswer: question.correctAnswer,
          userAnswer: answers[question.id],
          isCorrect: gradeCurrentQuestion(question.id)
        }))
      });
    }

    // Clear animations after a delay
    setTimeout(() => {
      setInputAnimation({});
    }, 1000);
  };

  // Handle reset
  const handleReset = () => {
    setAnswers({});
    setUserInputs({});
    setIsSubmitted(false);
    setScore(null);
    setInputAnimation({});

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

      // Focus the input of the next question
      setTimeout(() => {
        const nextQuestion = shuffledQuestions[currentQuestionIndex + 1];
        if (nextQuestion && inputRefs.current[nextQuestion.id]) {
          inputRefs.current[nextQuestion.id]?.focus();
        }
      }, 100);
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);

      // Focus the input of the previous question
      setTimeout(() => {
        const prevQuestion = shuffledQuestions[currentQuestionIndex - 1];
        if (prevQuestion && inputRefs.current[prevQuestion.id]) {
          inputRefs.current[prevQuestion.id]?.focus();
        }
      }, 100);
    }
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all questions have been answered
  const allQuestionsAnswered = shuffledQuestions.every(question => answers[question.id] !== undefined);

  // Render media content
  const renderMedia = (media: NumericQuestion['media']) => {
    if (!media) return null;

    if (media.type === 'image' && media.url) {
      return (
        <div className="mb-4 max-w-full">
          <img
            src={media.url}
            alt={media.alt || 'Question image'}
            className="max-h-48 max-w-full object-contain rounded"
          />
          {media.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
              {media.caption}
            </p>
          )}
        </div>
      );
    } else if (media.type === 'text' && media.content) {
      return (
        <div className="mb-4 max-w-full">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            <p className="text-gray-800 dark:text-gray-200">
              {media.content}
            </p>
          </div>
          {media.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
              {media.caption}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render calculator
  const renderCalculator = () => {
    const calculatorButtons = [
      ['7', '8', '9', '/'],
      ['4', '5', '6', '*'],
      ['1', '2', '3', '-'],
      ['0', '.', '=', '+'],
      ['C', '←']
    ];

    return (
      <div className="mt-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="mb-3">
          <input
            type="text"
            value={calculatorValue}
            onChange={(e) => setCalculatorValue(e.target.value)}
            className="w-full p-3 text-right border border-medium-teal/50 dark:border-medium-teal/30 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-mono min-h-[44px]"
            aria-label="Calculator display"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {calculatorButtons.map((row, rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              {row.map(button => (
                <button
                  key={button}
                  onClick={() => handleCalculatorButtonClick(button)}
                  className={cn(
                    "calculator-button p-3 text-lg font-medium rounded focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px] min-w-[44px]",
                    {
                      "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200": !['C', '=', '←'].includes(button),
                      "bg-red-500 text-white": button === 'C',
                      "bg-primary-green text-white": button === '=',
                      "bg-yellow-500 text-white": button === '←',
                      "col-span-2": ['C', '←'].includes(button),
                      "calculator-button-press": calculatorButtonAnimation === button
                    }
                  )}
                  aria-label={`Calculator button ${button}`}
                >
                  {button}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-3">
          <button
            onClick={handleUseCalculatorValue}
            className="w-full p-2 min-h-[44px] bg-primary-green hover:bg-primary-green/90 text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Use calculator value"
          >
            Use Result
          </button>
        </div>
      </div>
    );
  };

  // Format number according to decimal places setting
  const formatNumber = (num: number): string => {
    const decimalPlaces = activity.settings?.decimalPlaces ?? 2;
    return num.toFixed(decimalPlaces);
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
          current={currentQuestionIndex + 1}
          total={shuffledQuestions.length}
        />
        <div className="flex justify-center mt-3 space-x-1">
          {shuffledQuestions.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                {
                  "bg-primary-green": index < currentQuestionIndex,
                  "bg-medium-teal/70 animate-pulse": index === currentQuestionIndex,
                  "bg-gray-300 dark:bg-gray-600": index > currentQuestionIndex
                }
              )}
              title={`Question ${index + 1} of ${shuffledQuestions.length}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
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
      <div className="mb-6 p-4 border border-medium-teal/30 dark:border-medium-teal/20 rounded-lg bg-white dark:bg-gray-800 correct-answer-animation">
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
        </h3>

        {/* Question hint */}
        {currentQuestion?.hint && (
          <QuestionHint hint={currentQuestion.hint} />
        )}

        {/* Question media */}
        {currentQuestion?.media && renderMedia(currentQuestion.media)}

        {/* Question text */}
        <p className="mt-3 text-gray-800 dark:text-gray-200 leading-relaxed">
          {currentQuestion?.text}
        </p>

        {/* Numeric input */}
        <div className="mt-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Your Answer
            {currentQuestion?.unit && (
              <span className="ml-1 text-gray-500 dark:text-gray-400">
                (in {currentQuestion.unit})
              </span>
            )}
          </label>
          <div className="flex items-center">
            <input
              ref={el => {
                if (currentQuestion) {
                  inputRefs.current[currentQuestion.id] = el;
                }
              }}
              type="text"
              value={userInputs[currentQuestion?.id] || ''}
              onChange={(e) => currentQuestion && handleInputChange(currentQuestion.id, e.target.value)}
              className={cn(
                "numeric-input w-full p-3 text-lg border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px]",
                {
                  "border-primary-green dark:border-medium-teal focus:ring-2 focus:ring-primary-green input-focus-animation": !isSubmitted,
                  "border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-900/20 correct": isSubmitted && gradeCurrentQuestion(currentQuestion?.id),
                  "border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-900/20 incorrect": isSubmitted && !gradeCurrentQuestion(currentQuestion?.id),
                  [inputAnimation[currentQuestion?.id] || '']: !!inputAnimation[currentQuestion?.id]
                }
              )}
              placeholder={`Enter a number${activity.settings?.decimalPlaces ? ` (up to ${activity.settings.decimalPlaces} decimal places)` : ''}`}
              disabled={isSubmitted}
              aria-label="Numeric answer input"
            />
            {currentQuestion?.unit && (
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {currentQuestion.unit}
              </span>
            )}
          </div>

          {/* Feedback for submitted answer */}
          {isSubmitted && (
            <div className="mt-2">
              {gradeCurrentQuestion(currentQuestion?.id) ? (
                <p className="text-green-600 dark:text-green-400">
                  Correct! {currentQuestion?.explanation && `${currentQuestion.explanation}`}
                </p>
              ) : (
                <p className="text-red-600 dark:text-red-400">
                  Incorrect. The correct answer is {formatNumber(currentQuestion?.correctAnswer || 0)}
                  {currentQuestion?.unit && ` ${currentQuestion.unit}`}.
                  {currentQuestion?.explanation && ` ${currentQuestion.explanation}`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Calculator toggle button */}
        {activity.settings?.showCalculator && (
          <div className="mt-4">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="px-4 py-2 min-h-[44px] bg-light-mint/70 dark:bg-primary-green/20 hover:bg-light-mint dark:hover:bg-primary-green/30 text-primary-green dark:text-medium-teal rounded focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label={showCalculator ? "Hide calculator" : "Show calculator"}
            >
              {showCalculator ? "Hide Calculator" : "Show Calculator"}
            </button>
          </div>
        )}

        {/* Calculator */}
        {activity.settings?.showCalculator && showCalculator && renderCalculator()}
      </div>

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
                disabled: !allQuestionsAnswered,
                loading: false,
                submitted: false,
                className: "min-w-[120px] min-h-[44px]",
                children: 'Submit'
              })
            ) : (
              // Fallback to ActivityButton if no universal button provided
              <ActivityButton
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
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

export default NumericViewer;
