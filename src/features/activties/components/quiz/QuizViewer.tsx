'use client';

import React, { useState, useEffect } from 'react';
import { QuizActivity, QuizQuestion } from '../../models/quiz';
import { ActivityButton } from '../ui/ActivityButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { useQuestionUsage } from '@/features/question-bank/hooks';
import { cn } from '@/lib/utils';

// Animation styles
const quizAnimationStyles = `
  /* Question transition animation */
  @keyframes question-fade-in {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .question-fade-in {
    animation: question-fade-in 0.5s ease-out;
  }

  /* Option selection animation */
  @keyframes option-select {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  .option-select-animation {
    animation: option-select 0.3s ease-in-out;
  }

  /* Submit animation */
  @keyframes submit-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(31, 80, 75, 0.3); }
    100% { transform: scale(1); }
  }

  .submit-pulse-animation {
    animation: submit-pulse 0.5s ease-in-out;
  }

  /* Mobile-friendly improvements */
  @media (max-width: 640px) {
    .quiz-option {
      padding: 12px !important;
      margin-bottom: 8px !important;
    }

    .quiz-radio {
      min-width: 24px !important;
      min-height: 24px !important;
    }
  }
`;

export interface QuizViewerProps {
  activity: QuizActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, any>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
  studentId?: string; // Student ID for tracking question usage
  classId?: string; // Class ID for tracking question usage
}

/**
 * Quiz Activity Viewer
 *
 * This component displays a quiz activity with:
 * - Multiple question types
 * - Navigation between questions
 * - Progress tracking
 * - Timer (optional)
 * - Scoring and results
 * - Accessibility features
 */
export const QuizViewer: React.FC<QuizViewerProps> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className,
  submitButton,
  studentId,
  classId
}) => {
  // State for tracking answers and submission
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    activity.settings?.showTimer && activity.settings.timeLimit
      ? activity.settings.timeLimit * 60
      : null
  );
  const [isTimerRunning, setIsTimerRunning] = useState(
    activity.settings?.showTimer && activity.settings.timeLimit ? true : false
  );

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);
  const { recordQuestionAnswer } = useQuestionUsage();

  // Track question start times to calculate time to answer
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({});

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = quizAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);

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

  // Record question start time when the current question changes
  useEffect(() => {
    if (currentQuestion && !isSubmitted) {
      setQuestionStartTimes(prev => ({
        ...prev,
        [currentQuestion.id]: Date.now()
      }));
    }
  }, [currentQuestionIndex, currentQuestion, isSubmitted]);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);

  // Handle time up
  const handleTimeUp = () => {
    setIsTimerRunning(false);
    handleSubmit();

    // Track the event in analytics
    analytics?.trackEvent('activity_complete', {
      activityId: activity.id,
      activityType: activity.activityType,
      reason: 'time_up'
    });
  };

  // Format time remaining
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return '';

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Track progress
  useEffect(() => {
    if (!shuffledQuestions.length) return;

    // Calculate progress based on answered questions
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = shuffledQuestions.length;
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [answers, shuffledQuestions, onProgress]);

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Track the interaction in analytics
    analytics?.trackInteraction('question_answered', {
      activityId: activity.id,
      questionId,
      questionType: shuffledQuestions.find(q => q.id === questionId)?.type
    });

    // Calculate time to answer
    const question = shuffledQuestions.find(q => q.id === questionId);
    const startTime = questionStartTimes[questionId] || Date.now();
    const timeToAnswer = (Date.now() - startTime) / 1000; // Convert to seconds

    // If the question is from the question bank, record the usage
    if (question?.questionBankRef && studentId && mode === 'student') {
      // For multiple choice and true/false, we can determine correctness immediately
      let isCorrect = false;

      if (question.type === 'multiple-choice') {
        const correctOption = question.options?.find(opt => opt.isCorrect);
        isCorrect = answer === correctOption?.id;
      } else if (question.type === 'true-false') {
        isCorrect = answer === question.isTrue;
      }

      // Record the answer in the question bank
      recordQuestionAnswer(
        question.questionBankRef,
        isCorrect,
        timeToAnswer,
        activity.id,
        studentId,
        classId
      );
    }
  };

  // Grade the quiz
  const gradeQuiz = () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults: any[] = [];

    shuffledQuestions.forEach(question => {
      const points = question.points || 1;
      totalPoints += points;

      const answer = answers[question.id];
      let isCorrect = false;
      let earnedQuestionPoints = 0;

      // Grade based on question type
      switch (question.type) {
        case 'multiple-choice':
          if (answer !== undefined) {
            const correctOption = question.options?.find(opt => opt.isCorrect);
            isCorrect = answer === correctOption?.id;
            earnedQuestionPoints = isCorrect ? points : 0;
          }
          break;

        case 'true-false':
          if (answer !== undefined) {
            isCorrect = answer === question.isTrue;
            earnedQuestionPoints = isCorrect ? points : 0;
          }
          break;

        case 'multiple-response':
          if (answer && Array.isArray(answer)) {
            const correctOptions = question.options?.filter(opt => opt.isCorrect) || [];
            const correctOptionIds = correctOptions.map(opt => opt.id);

            // Check if all selected options are correct and all correct options are selected
            const allSelectedAreCorrect = answer.every(id => correctOptionIds.includes(id));
            const allCorrectAreSelected = correctOptionIds.every(id => answer.includes(id));

            isCorrect = allSelectedAreCorrect && allCorrectAreSelected;

            if (activity.settings?.allowPartialCredit && allSelectedAreCorrect) {
              // Partial credit for selecting some correct options without any wrong ones
              earnedQuestionPoints = (answer.length / correctOptionIds.length) * points;
            } else {
              earnedQuestionPoints = isCorrect ? points : 0;
            }
          }
          break;

        // Add other question types as needed

        default:
          // For other question types, assume no points
          earnedQuestionPoints = 0;
      }

      earnedPoints += earnedQuestionPoints;

      questionResults.push({
        questionId: question.id,
        questionType: question.type,
        isCorrect,
        points: earnedQuestionPoints,
        maxPoints: points
      });
    });

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return {
      score: earnedPoints,
      maxScore: totalPoints,
      percentage,
      questionResults
    };
  };

  // Handle submission
  const handleSubmit = () => {
    // Check if all questions are answered
    if (activity.settings?.requireAllQuestions) {
      const allQuestionsAnswered = shuffledQuestions.every(q => answers[q.id] !== undefined);
      if (!allQuestionsAnswered) {
        // Show a message or handle incomplete submission
        return;
      }
    }

    // Grade the quiz
    const result = gradeQuiz();
    setScore(result.percentage);
    setIsSubmitted(true);
    setIsTimerRunning(false);

    // Track submission in analytics
    analytics?.trackEvent('activity_submit', {
      activityId: activity.id,
      activityType: activity.activityType,
      score: result.percentage,
      passed: result.percentage >= (activity.settings?.passingPercentage || 60),
      timeSpent: activity.settings?.timeLimit
        ? (activity.settings.timeLimit * 60) - (timeRemaining || 0)
        : 0
    });

    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(answers, {
        score: result.percentage,
        passed: result.percentage >= (activity.settings?.passingPercentage || 60),
        details: result.questionResults
      });
    }

    // Record usage for all questions from the question bank that have been answered
    if (studentId && mode === 'student') {
      result.questionResults.forEach(questionResult => {
        const question = shuffledQuestions.find(q => q.id === questionResult.questionId);

        // Only record if the question is from the question bank and hasn't been recorded yet
        if (question?.questionBankRef) {
          const startTime = questionStartTimes[question.id] || Date.now();
          const timeToAnswer = (Date.now() - startTime) / 1000; // Convert to seconds

          recordQuestionAnswer(
            question.questionBankRef,
            questionResult.isCorrect,
            timeToAnswer,
            activity.id,
            studentId,
            classId
          );
        }
      });
    }
  };

  // Handle reset
  const handleReset = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);

    // Reset timer if enabled
    if (activity.settings?.showTimer && activity.settings.timeLimit) {
      setTimeRemaining(activity.settings.timeLimit * 60);
      setIsTimerRunning(true);
    }

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
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all questions have been answered
  const allQuestionsAnswered = shuffledQuestions.every(question => answers[question.id] !== undefined);

  // Render question based on type
  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
              {question.text}
            </h4>
            {/* Render multiple choice options */}
            <div className="space-y-2">
              {question.options?.map(option => (
                <div
                  key={option.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all quiz-option option-select-animation",
                    {
                      "border-primary-green bg-light-mint/70 dark:bg-primary-green/20": answers[question.id] === option.id && !isSubmitted,
                      "border-green-500 bg-green-50 dark:bg-green-900/20": isSubmitted && option.isCorrect,
                      "border-red-500 bg-red-50 dark:bg-red-900/20": isSubmitted && answers[question.id] === option.id && !option.isCorrect,
                      "border-gray-300 dark:border-gray-700 hover:border-medium-teal dark:hover:border-medium-teal/70": answers[question.id] !== option.id && !isSubmitted
                    }
                  )}
                  onClick={() => !isSubmitted && handleAnswerChange(question.id, option.id)}
                >
                  <div className="flex items-start">
                    <div className={cn(
                      "w-5 h-5 mt-0.5 rounded-full border flex-shrink-0 flex items-center justify-center quiz-radio",
                      {
                        "border-primary-green bg-primary-green": answers[question.id] === option.id && !isSubmitted,
                        "border-green-500 bg-green-500": isSubmitted && option.isCorrect,
                        "border-red-500 bg-red-500": isSubmitted && answers[question.id] === option.id && !option.isCorrect,
                        "border-gray-300 dark:border-gray-600": answers[question.id] !== option.id && !isSubmitted
                      }
                    )}>
                      {(answers[question.id] === option.id || (isSubmitted && option.isCorrect)) && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-800 dark:text-gray-200">{option.text}</p>
                      {isSubmitted && answers[question.id] === option.id && option.feedback && (
                        <p className={cn(
                          "mt-1 text-sm",
                          option.isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {option.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
              {question.text}
            </h4>
            {/* Render true/false options */}
            <div className="space-y-2">
              {[true, false].map(value => (
                <div
                  key={value.toString()}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all quiz-option option-select-animation",
                    {
                      "border-primary-green bg-light-mint/70 dark:bg-primary-green/20": answers[question.id] === value && !isSubmitted,
                      "border-green-500 bg-green-50 dark:bg-green-900/20": isSubmitted && value === question.isTrue,
                      "border-red-500 bg-red-50 dark:bg-red-900/20": isSubmitted && answers[question.id] === value && value !== question.isTrue,
                      "border-gray-300 dark:border-gray-700 hover:border-medium-teal dark:hover:border-medium-teal/70": answers[question.id] !== value && !isSubmitted
                    }
                  )}
                  onClick={() => !isSubmitted && handleAnswerChange(question.id, value)}
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center quiz-radio",
                      {
                        "border-primary-green bg-primary-green": answers[question.id] === value && !isSubmitted,
                        "border-green-500 bg-green-500": isSubmitted && value === question.isTrue,
                        "border-red-500 bg-red-500": isSubmitted && answers[question.id] === value && value !== question.isTrue,
                        "border-gray-300 dark:border-gray-600": answers[question.id] !== value && !isSubmitted
                      }
                    )}>
                      {(answers[question.id] === value || (isSubmitted && value === question.isTrue)) && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="ml-3 text-gray-800 dark:text-gray-200">
                      {value ? 'True' : 'False'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // Add other question types as needed

      default:
        return (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-300">
              This question type ({question.type}) is not supported yet.
            </p>
          </div>
        );
    }
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Activity header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{activity.title}</h1>
            {activity.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-2">{activity.description}</p>
            )}
          </div>

          {/* Timer */}
          {activity.settings?.showTimer && timeRemaining !== null && (
            <div className={cn(
              "px-4 py-2 rounded-lg font-mono text-lg font-bold",
              timeRemaining > 60
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            )}>
              {formatTimeRemaining()}
            </div>
          )}
        </div>

        {activity.instructions && (
          <div className="bg-light-mint dark:bg-primary-green/20 p-3 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Instructions:</strong>
            <span className="text-gray-700 dark:text-gray-200"> {activity.instructions}</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {activity.settings?.showProgressBar !== false && (
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
      )}

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
              ? "Congratulations! You passed the quiz."
              : `You need ${activity.settings?.passingPercentage || 60}% to pass.`}
          </p>
        </div>
      )}

      {/* Question */}
      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 question-fade-in">
        {activity.settings?.showQuestionNumbers !== false && (
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
            Question {currentQuestionIndex + 1}
          </h3>
        )}

        {/* Question hint */}
        {currentQuestion?.hint && (
          <QuestionHint hint={currentQuestion.hint} />
        )}

        {/* Question content */}
        {renderQuestion(currentQuestion)}

        {/* Show explanation if submitted */}
        {isSubmitted && currentQuestion?.explanation && (
          <div className="mt-4 p-3 bg-light-mint dark:bg-primary-green/20 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Explanation:</strong>
            <span className="text-gray-800 dark:text-gray-200"> {currentQuestion.explanation}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
        {/* Navigation buttons */}
        {activity.settings?.allowNavigation !== false && (
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
        )}

        {/* Submit/Reset buttons */}
        <div className="flex justify-center sm:justify-end space-x-2">
          {!isSubmitted ? (
            submitButton ? (
              // Use the universal submit button if provided
              React.cloneElement(submitButton as React.ReactElement, {
                onClick: handleSubmit,
                disabled: activity.settings?.requireAllQuestions && !allQuestionsAnswered,
                loading: false,
                submitted: false,
                className: "min-w-[120px] min-h-[44px] submit-pulse-animation",
                children: 'Submit Quiz'
              })
            ) : (
              // Fallback to ActivityButton if no universal button provided
              <ActivityButton
                onClick={handleSubmit}
                disabled={activity.settings?.requireAllQuestions && !allQuestionsAnswered}
                variant="primary"
                icon="check-circle"
                className="min-w-[120px] min-h-[44px] submit-pulse-animation"
              >
                Submit Quiz
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

export default QuizViewer;
