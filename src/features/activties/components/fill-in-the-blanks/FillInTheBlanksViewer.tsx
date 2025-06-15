'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FillInTheBlanksActivity,
  FillInTheBlanksQuestion,
  parseTextWithBlanks
} from '../../models/fill-in-the-blanks';
import { gradeFillInTheBlanksActivity } from '../../grading/fill-in-the-blanks';
import { ActivityButton } from '../ui/ActivityButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { RichTextDisplay } from '../ui/RichTextDisplay';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';

// Typing animation styles with brand colors
const typingAnimationStyles = `
  @keyframes typing-cursor {
    0% { border-right-color: rgba(34, 139, 34, 0.8); } /* primary-green */
    50% { border-right-color: transparent; }
    100% { border-right-color: rgba(34, 139, 34, 0.8); } /* primary-green */
  }

  .typing-animation {
    border-right: 2px solid rgba(34, 139, 34, 0.8); /* primary-green */
    animation: typing-cursor 0.8s infinite;
  }

  @keyframes correct-answer {
    0% { transform: scale(1); background-color: rgba(240, 255, 240, 0.5); } /* light-mint */
    50% { transform: scale(1.05); background-color: rgba(240, 255, 240, 0.8); } /* light-mint */
    100% { transform: scale(1); background-color: rgba(240, 255, 240, 0.5); } /* light-mint */
  }

  .correct-answer-animation {
    animation: correct-answer 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  .incorrect-answer-animation {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes focus-pulse {
    0% { box-shadow: 0 0 0 0 rgba(34, 139, 34, 0.4); } /* primary-green */
    70% { box-shadow: 0 0 0 4px rgba(34, 139, 34, 0); } /* primary-green */
    100% { box-shadow: 0 0 0 0 rgba(34, 139, 34, 0); } /* primary-green */
  }

  .focus-pulse-animation {
    animation: focus-pulse 1.5s infinite;
  }

  .required-field::after {
    content: '*';
    color: #e11d48; /* red-600 */
    margin-left: 2px;
  }
`;

export interface FillInTheBlanksViewerProps {
  activity: FillInTheBlanksActivity;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: Record<string, string>, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Fill in the Blanks Activity Viewer
 *
 * This component displays a fill in the blanks activity with:
 * - Interactive text input fields
 * - Progress tracking
 * - Hints and explanations
 * - Detailed feedback
 * - Scoring and results
 */
export const FillInTheBlanksViewer: React.FC<FillInTheBlanksViewerProps> = ({
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

  // Animation states
  const [typingBlankId, setTypingBlankId] = useState<string | null>(null);
  const [animatingBlankIds, setAnimatingBlankIds] = useState<Record<string, string>>({});

  // Refs for input elements
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Shuffle questions if enabled
  const [shuffledQuestions, setShuffledQuestions] = useState<FillInTheBlanksQuestion[]>([]);

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = typingAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Initialize shuffled questions and ensure proper format
  useEffect(() => {
    // Create a mutable copy of the activity to work with
    const activityCopy = { ...activity };
    let questions: FillInTheBlanksQuestion[] = [];

    // Check if we have activity.content instead of activity.questions (alternative format)
    if (!activityCopy.questions && (activityCopy as any).content) {
      const content = (activityCopy as any).content;
      console.log('Using alternative content format:', content);

      // Try to extract questions from content
      if (content.questions) {
        // Use the questions from content
        questions = [...content.questions];
      } else {
        // Create a default question from the content
        const defaultBlankId = `blank-${Date.now()}`;
        const defaultQuestion: FillInTheBlanksQuestion = {
          id: `question-${Date.now()}`,
          text: content.text || 'Complete the following sentence about Plants:',
          blanks: [{
            id: defaultBlankId,
            correctAnswers: ['answer'],
            caseSensitive: false,
            feedback: ''
          }]
        };

        // Add the blank placeholder to the text if not present
        if (!defaultQuestion.text.includes(`{{${defaultBlankId}}}`)) {
          defaultQuestion.text += ` {{${defaultBlankId}}}}`;
        }

        questions = [defaultQuestion];
      }
    } else if (activityCopy.questions) {
      // Use the existing questions
      questions = [...activityCopy.questions];
    }

    // If still no questions, create a default one
    if (questions.length === 0) {
      const defaultBlankId = `blank-${Date.now()}`;
      questions = [{
        id: `question-${Date.now()}`,
        text: `Complete the following sentence about Plants: The process of photosynthesis requires sunlight, water, and {{${defaultBlankId}}}.`,
        blanks: [{
          id: defaultBlankId,
          correctAnswers: ['carbon dioxide', 'CO2'],
          caseSensitive: false,
          feedback: 'Plants need carbon dioxide for photosynthesis.'
        }]
      }];
    }

    // Process questions to ensure they have properly formatted blanks
    questions = questions.map(question => {
      // Normalize blanks to ensure they have correctAnswers property
      if (question.blanks) {
        question.blanks = question.blanks.map(blank => {
          // If blank has acceptableAnswers but not correctAnswers, convert it
          if (!(blank as any).correctAnswers && (blank as any).acceptableAnswers) {
            return {
              ...blank,
              correctAnswers: (blank as any).acceptableAnswers
            };
          }
          return blank;
        });
      }
      // If the question doesn't have blanks or has empty blanks array, check for alternative properties
      if (!question.blanks || question.blanks.length === 0) {
        // Check for alternative property names for blanks
        const alternativeBlanks = (question as any).acceptableAnswers ||
                                 (question as any).answers ||
                                 [];

        if (alternativeBlanks.length > 0) {
          // Convert alternative format to our expected format
          const convertedBlanks = alternativeBlanks.map((answer: any, index: number) => {
            const blankId = `blank-${Date.now()}-${index}`;
            return {
              id: blankId,
              correctAnswers: Array.isArray(answer) ? answer : [answer],
              caseSensitive: false,
              feedback: ''
            };
          });

          // Update the text to include the blanks
          let updatedText = question.text || 'Complete the sentence:';
          convertedBlanks.forEach(blank => {
            if (!updatedText.includes(`{{${blank.id}}}`)) {
              updatedText += ` {{${blank.id}}}}`;
            }
          });

          return {
            ...question,
            blanks: convertedBlanks,
            text: updatedText
          };
        }

        // If no alternative blanks found, create a default
        const defaultBlankId = `blank-${Date.now()}`;
        return {
          ...question,
          blanks: [{
            id: defaultBlankId,
            correctAnswers: ['answer'],
            caseSensitive: false,
            feedback: ''
          }],
          text: question.text + ` {{${defaultBlankId}}}`
        };
      }

      // Check if the text contains the expected {{blankId}} format
      const hasFormattedBlanks = question.blanks.some(blank =>
        question.text && question.text.includes(`{{${blank.id}}}`));

      // If the text doesn't have formatted blanks, try to use textWithBlanks if available
      if (!hasFormattedBlanks) {
        // Check if there's a textWithBlanks property (common in some formats)
        const textWithBlanks = (question as any).textWithBlanks;

        if (textWithBlanks) {
          // Convert [blank1] format to {{blankId}} format
          let formattedText = textWithBlanks;
          question.blanks.forEach(blank => {
            // Replace [blankX] with {{blankId}}
            const blankName = blank.id.replace(/^blank/, '');
            const regex = new RegExp(`\\[blank${blankName}\\]`, 'g');
            formattedText = formattedText.replace(regex, `{{${blank.id}}}`);

            // Also try with just [blank]
            formattedText = formattedText.replace(/\[blank\]/i, `{{${blank.id}}}`);
          });

          return {
            ...question,
            text: formattedText
          };
        }

        // If no blanks are found in the text and no textWithBlanks is available,
        // append blanks to the end of the text
        let updatedText = question.text || 'Complete the sentence:';
        question.blanks.forEach(blank => {
          if (!updatedText.includes(`{{${blank.id}}}`)) {
            updatedText += ` {{${blank.id}}}}`;
          }
        });

        return {
          ...question,
          text: updatedText
        };
      }

      return question;
    });

    // Shuffle questions if enabled
    if (activity.settings?.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    setShuffledQuestions(questions);

    // Log for debugging
    console.log('Processed questions:', questions);
  }, [activity]);

  // Track progress
  useEffect(() => {
    // Count blanks that have been filled
    let filledBlanks = 0;
    let totalBlanks = 0;

    shuffledQuestions.forEach(question => {
      question.blanks.forEach(blank => {
        totalBlanks++;
        if (answers[blank.id] && answers[blank.id].trim() !== '') {
          filledBlanks++;
        }
      });
    });

    const progress = totalBlanks > 0 ? (filledBlanks / totalBlanks) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [answers, shuffledQuestions, onProgress]);

  // Handle answer change with typing animation
  const handleAnswerChange = (blankId: string, value: string) => {
    if (isSubmitted && activity.settings?.attemptsAllowed === 1) return;

    // Start typing animation
    setTypingBlankId(blankId);

    // Track the interaction in analytics
    analytics?.trackInteraction('blank_typing', {
      activityId: activity.id,
      blankId,
      value
    });

    // Update the answer
    setAnswers(prev => ({
      ...prev,
      [blankId]: value
    }));

    // Stop typing animation after a short delay
    setTimeout(() => {
      if (typingBlankId === blankId) {
        setTypingBlankId(null);
      }
    }, 1000);
  };

  // Handle submission with animations
  const handleSubmit = () => {
    // Grade the activity
    const result = gradeFillInTheBlanksActivity(activity, answers);
    setScore(result.percentage);
    setIsSubmitted(true);

    // Animate correct and incorrect answers
    const newAnimatingBlankIds: Record<string, string> = {};

    result.questionResults.forEach(questionResult => {
      if (questionResult.blankResults) {
        questionResult.blankResults.forEach(blankResult => {
          newAnimatingBlankIds[blankResult.blankId] = blankResult.isCorrect
            ? 'correct-answer-animation'
            : 'incorrect-answer-animation';
        });
      }
    });

    setAnimatingBlankIds(newAnimatingBlankIds);

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
      onSubmit(answers, result);
    }

    // Clear animations after a delay
    setTimeout(() => {
      setAnimatingBlankIds({});
    }, 1000);
  };

  // Handle reset with animations
  const handleReset = () => {
    // Clear all animations
    setTypingBlankId(null);
    setAnimatingBlankIds({});

    // Reset state
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);

    // Track reset in analytics
    analytics?.trackEvent('activity_reset', {
      activityId: activity.id,
      activityType: activity.activityType
    });

    // Focus the first input after a short delay
    setTimeout(() => {
      const firstBlankId = shuffledQuestions[0]?.blanks[0]?.id;
      if (firstBlankId && inputRefs.current[firstBlankId]) {
        inputRefs.current[firstBlankId]?.focus();
      }
    }, 100);
  };

  // Check if the activity is passed
  const isPassed = score !== null && score >= (activity.settings?.passingPercentage || 60);

  // Determine if all blanks have been filled
  const allBlanksFilled = shuffledQuestions.every(question =>
    question.blanks.every(blank =>
      answers[blank.id] && answers[blank.id].trim() !== ''
    )
  );

  // Render a single question
  const renderQuestion = (question: FillInTheBlanksQuestion, index: number) => {
    // Parse the text to separate text and blanks
    const parts = parseTextWithBlanks(question.text);

    // Get the results for this question if submitted
    let questionResult: any = null;
    if (isSubmitted && score !== null) {
      try {
        const result = gradeFillInTheBlanksActivity(
          { ...activity, questions: [question] },
          answers
        );
        if (result.questionResults && result.questionResults.length > 0) {
          questionResult = result.questionResults[0];
        }
      } catch (e) {
        console.error('Error grading question:', e);
      }
    }

    return (
      <ThemeWrapper key={question.id} className="mb-6 p-4 sm:p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-md">
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center">
          <span className="bg-primary-green text-white rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
            {index + 1}
          </span>
          <span className="flex-1">Question {index + 1}</span>
        </h3>

        {/* Question hint */}
        {question.hint && (
          <QuestionHint hint={question.hint} />
        )}

        {/* Text with blanks */}
        <div className="mt-4 text-gray-800 dark:text-gray-200 leading-relaxed text-base sm:text-lg">
          {parts.map((part, partIndex) => {
            if (part.type === 'text') {
              return <span key={partIndex}>{part.content}</span>;
            } else {
              // This is a blank
              const blankId = part.content;
              const blank = question.blanks.find(b => b.id === blankId);

              if (!blank) return null;

              const blankIndex = question.blanks.findIndex(b => b.id === blankId);
              const studentAnswer = answers[blankId] || '';
              const isCorrect = isSubmitted && blank.correctAnswers.some(
                answer => blank.caseSensitive
                  ? studentAnswer === answer
                  : studentAnswer.toLowerCase() === answer.toLowerCase()
              );
              const showCorrectness = isSubmitted && activity.settings?.showCorrectAnswers !== false;

              // Calculate minimum width for mobile
              const minWidth = Math.max(
                blank.size || Math.max(10, blank.correctAnswers[0].length),
                6 // Minimum size for mobile
              );

              return (
                <span
                  key={partIndex}
                  className={cn(
                    "inline-block mx-1 align-middle my-1",
                    { "required-field": !studentAnswer && !isSubmitted }
                  )}
                >
                  <input
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => handleAnswerChange(blankId, e.target.value)}
                    onFocus={() => {
                      setTypingBlankId(blankId);
                      // Track focus in analytics
                      analytics?.trackInteraction('blank_focus', {
                        activityId: activity.id,
                        blankId
                      });
                    }}
                    onBlur={() => setTypingBlankId(null)}
                    disabled={isSubmitted && activity.settings?.attemptsAllowed === 1}
                    placeholder={`(${blankIndex + 1})`}
                    size={minWidth}
                    ref={(el) => {
                      if (el) inputRefs.current[blankId] = el;
                    }}
                    className={cn(
                      "px-3 py-2 border rounded text-center transition-all duration-200 min-h-[44px]",
                      "focus:outline-none focus:ring-2 focus:ring-offset-1",
                      {
                        "border-primary-green bg-light-mint/30 dark:bg-primary-green/10 focus:ring-primary-green/50": !isSubmitted,
                        "border-green-500 bg-green-50 dark:bg-green-900/20 focus:ring-green-500/50": showCorrectness && isCorrect,
                        "border-red-500 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/50": showCorrectness && !isCorrect,
                        "opacity-60 cursor-not-allowed": isSubmitted && activity.settings?.attemptsAllowed === 1,
                        "typing-animation": typingBlankId === blankId,
                        "focus-pulse-animation": !studentAnswer && !isSubmitted,
                        [animatingBlankIds[blankId] || ""]: !!animatingBlankIds[blankId]
                      }
                    )}
                    aria-label={`Blank ${blankIndex + 1}`}
                    aria-required="true"
                    autoComplete="off"
                    spellCheck={false}
                  />

                  {/* Show correct answer if submitted and incorrect */}
                  {showCorrectness && !isCorrect && (
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1 animate-fade-in">
                      <span className="font-medium">Correct:</span> {blank.correctAnswers[0]}
                    </div>
                  )}
                </span>
              );
            }
          })}
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
          current={Object.keys(answers).filter(key => answers[key].trim() !== '').length}
          total={shuffledQuestions.reduce((total, q) => total + q.blanks.length, 0)}
          color="green"
          showPercentage={true}
        />

        {/* Required fields note */}
        <div className="text-sm text-gray-500 mt-2 flex items-center">
          <span className="text-red-600 mr-1">*</span>
          <span>Required fields</span>
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
              disabled: !allBlanksFilled,
              loading: false,
              submitted: false,
              children: 'Submit'
            })
          ) : (
            // Fallback to ActivityButton if no universal button provided
            <ActivityButton
              onClick={handleSubmit}
              disabled={!allBlanksFilled}
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

      {/* Mobile keyboard hint */}
      <div className="mt-4 text-center text-sm text-gray-500 sm:hidden">
        <p>Tap on the blanks to enter your answers</p>
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

export default FillInTheBlanksViewer;
