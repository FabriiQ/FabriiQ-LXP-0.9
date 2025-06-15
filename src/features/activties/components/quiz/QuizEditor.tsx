'use client';

import React, { useState, useEffect } from 'react';
import {
  QuizActivity,
  QuizQuestion,
  QuizQuestionType,
  createDefaultQuizActivity,
  createDefaultMultipleChoiceQuestion,
  createDefaultTrueFalseQuestion,
  createDefaultMultipleResponseQuestion,
  createDefaultFillInTheBlanksQuestion,
  createDefaultMatchingQuestion,
  createDefaultSequenceQuestion,
  createDefaultNumericQuestion
} from '../../models/quiz';
import { ActivityButton } from '../ui/ActivityButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { MediaUploader } from '../ui/MediaUploader';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { QuestionBankSelector } from '../question-bank/QuestionBankSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

export interface QuizEditorProps {
  activity?: QuizActivity;
  onChange?: (activity: QuizActivity) => void;
  onSave?: (activity: QuizActivity) => void;
  className?: string;
  classId?: string;
  subjectId?: string;
  courseId?: string;
}

/**
 * Quiz Activity Editor
 *
 * This component provides an interface for creating and editing quiz activities.
 * It includes:
 * - Activity metadata editing
 * - Question type selection
 * - Question editing
 * - Settings configuration
 * - Accessibility features
 */
export const QuizEditor: React.FC<QuizEditorProps> = ({
  activity,
  onChange,
  onSave,
  className,
  classId,
  subjectId,
  courseId
}) => {
  // Initialize with default activity if none provided
  const [localActivity, setLocalActivity] = useState<QuizActivity>(
    activity || createDefaultQuizActivity()
  );

  // Current question being edited
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Preview mode for testing
  const [previewMode, setPreviewMode] = useState(false);

  // Question bank dialog state
  const [questionBankDialogOpen, setQuestionBankDialogOpen] = useState(false);

  // Update local activity when prop changes
  useEffect(() => {
    if (activity) {
      setLocalActivity(activity);
    }
  }, [activity]);

  // Get current question
  const currentQuestion = localActivity.questions[currentQuestionIndex] || localActivity.questions[0];

  // Update activity with changes
  const updateActivity = (updates: Partial<QuizActivity>) => {
    const updatedActivity = {
      ...localActivity,
      ...updates,
      updatedAt: new Date()
    };
    setLocalActivity(updatedActivity);

    if (onChange) {
      onChange(updatedActivity);
    }
  };

  // Update current question
  const updateQuestion = (updates: Partial<QuizQuestion>) => {
    const updatedQuestions = [...localActivity.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      ...updates
    };

    updateActivity({ questions: updatedQuestions });
  };

  // Add a new question
  const handleAddQuestion = (type: QuizQuestionType) => {
    let newQuestion: QuizQuestion;

    switch (type) {
      case 'multiple-choice':
        newQuestion = createDefaultMultipleChoiceQuestion();
        break;
      case 'true-false':
        newQuestion = createDefaultTrueFalseQuestion();
        break;
      case 'multiple-response':
        newQuestion = createDefaultMultipleResponseQuestion();
        break;
      case 'fill-in-the-blanks':
        newQuestion = createDefaultFillInTheBlanksQuestion();
        break;
      case 'matching':
        newQuestion = createDefaultMatchingQuestion();
        break;
      case 'sequence':
        newQuestion = createDefaultSequenceQuestion();
        break;
      case 'numeric':
        newQuestion = createDefaultNumericQuestion();
        break;
      default:
        newQuestion = createDefaultMultipleChoiceQuestion();
    }

    updateActivity({
      questions: [...localActivity.questions, newQuestion]
    });
    setCurrentQuestionIndex(localActivity.questions.length);
  };

  // Remove current question
  const handleRemoveQuestion = () => {
    if (localActivity.questions.length <= 1) {
      return; // Don't remove the last question
    }

    const updatedQuestions = [...localActivity.questions];
    updatedQuestions.splice(currentQuestionIndex, 1);

    updateActivity({ questions: updatedQuestions });
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };

  // Update question media
  const updateQuestionMedia = (updates: Partial<NonNullable<QuizQuestion['media']>>) => {
    const currentMedia = currentQuestion.media || { type: 'image' };
    const updatedMedia = {
      ...currentMedia,
      ...updates
    };

    updateQuestion({ media: updatedMedia });
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(localActivity);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Handle adding questions from question bank
  const handleAddQuestionsFromBank = (bankQuestions: any[]) => {
    // Convert question bank questions to quiz questions
    const quizQuestions: QuizQuestion[] = bankQuestions.map(bankQuestion => {
      // Track usage in the question bank
      const questionBankRef = bankQuestion.id;

      // Convert based on question type
      switch (bankQuestion.questionType) {
        case 'MULTIPLE_CHOICE':
          return {
            id: `quiz-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'multiple-choice',
            text: bankQuestion.content.text,
            options: bankQuestion.content.options.map((opt: any) => ({
              id: opt.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
              feedback: opt.feedback
            })),
            explanation: bankQuestion.content.explanation,
            hint: bankQuestion.content.hint,
            questionBankRef, // Reference to the original question for tracking usage
          };
        case 'TRUE_FALSE':
          return {
            id: `quiz-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'true-false',
            text: bankQuestion.content.text,
            isTrue: bankQuestion.content.isTrue,
            explanation: bankQuestion.content.explanation,
            hint: bankQuestion.content.hint,
            questionBankRef,
          };
        // Add more conversions for other question types as needed
        default:
          // Default to multiple choice with placeholder
          return {
            id: `quiz-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'multiple-choice',
            text: bankQuestion.title,
            options: [
              { id: 'opt1', text: 'Option 1', isCorrect: true },
              { id: 'opt2', text: 'Option 2', isCorrect: false },
            ],
            questionBankRef,
          };
      }
    });

    // Add the new questions to the activity
    updateActivity({
      questions: [...localActivity.questions, ...quizQuestions]
    });

    // Close the dialog
    setQuestionBankDialogOpen(false);
  };

  // Render multiple choice question editor
  const renderMultipleChoiceEditor = () => {
    const options = currentQuestion.options || [];

    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Options</h4>

        {options.map((option, index) => (
          <div key={option.id} className="mb-3 p-3 border border-gray-300 dark:border-gray-600 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={option.isCorrect}
                  onChange={() => {
                    const updatedOptions = options.map(opt => ({
                      ...opt,
                      isCorrect: opt.id === option.id
                    }));
                    updateQuestion({ options: updatedOptions });
                  }}
                  className="mr-2 accent-blue-600 dark:accent-blue-500"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Option {index + 1}
                </span>
              </div>

              <button
                onClick={() => {
                  const updatedOptions = [...options];
                  updatedOptions.splice(index, 1);
                  updateQuestion({ options: updatedOptions });
                }}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                disabled={options.length <= 2}
              >
                Remove
              </button>
            </div>

            <div className="mb-2">
              <input
                type="text"
                value={option.text}
                onChange={(e) => {
                  const updatedOptions = [...options];
                  updatedOptions[index] = {
                    ...updatedOptions[index],
                    text: e.target.value
                  };
                  updateQuestion({ options: updatedOptions });
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Option text"
              />
            </div>

            <div>
              <input
                type="text"
                value={option.feedback || ''}
                onChange={(e) => {
                  const updatedOptions = [...options];
                  updatedOptions[index] = {
                    ...updatedOptions[index],
                    feedback: e.target.value
                  };
                  updateQuestion({ options: updatedOptions });
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Feedback for this option (optional)"
              />
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            const newOption = {
              id: `option-${Date.now()}`,
              text: `Option ${options.length + 1}`,
              isCorrect: false
            };
            updateQuestion({ options: [...options, newOption] });
          }}
          className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Add Option
        </button>
      </div>
    );
  };

  // Render true-false question editor
  const renderTrueFalseEditor = () => {
    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Correct Answer</h4>

        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="true-option"
              checked={currentQuestion.isTrue === true}
              onChange={() => updateQuestion({ isTrue: true })}
              className="mr-2 accent-blue-600 dark:accent-blue-500"
            />
            <label htmlFor="true-option" className="text-gray-700 dark:text-gray-300">
              True
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="false-option"
              checked={currentQuestion.isTrue === false}
              onChange={() => updateQuestion({ isTrue: false })}
              className="mr-2 accent-blue-600 dark:accent-blue-500"
            />
            <label htmlFor="false-option" className="text-gray-700 dark:text-gray-300">
              False
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Render question editor based on type
  const renderQuestionEditor = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return renderMultipleChoiceEditor();
      case 'true-false':
        return renderTrueFalseEditor();
      // Add other question type editors as needed
      default:
        return (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-300">
              Editor for this question type ({currentQuestion.type}) is not implemented yet.
            </p>
          </div>
        );
    }
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Activity Details</h2>

        {/* Activity title */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={localActivity.title}
            onChange={(e) => updateActivity({ title: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Activity description */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={localActivity.description || ''}
            onChange={(e) => updateActivity({ description: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        {/* Activity instructions */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Instructions</label>
          <textarea
            value={localActivity.instructions || ''}
            onChange={(e) => updateActivity({ instructions: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        {/* Activity settings */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shuffleQuestions"
                checked={localActivity.settings?.shuffleQuestions || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    shuffleQuestions: e.target.checked
                  }
                })}
                className="mr-2 accent-blue-600 dark:accent-blue-500"
              />
              <label htmlFor="shuffleQuestions" className="text-gray-700 dark:text-gray-300">
                Shuffle Questions
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showFeedback"
                checked={localActivity.settings?.showFeedbackImmediately || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    showFeedbackImmediately: e.target.checked
                  }
                })}
                className="mr-2 accent-blue-600 dark:accent-blue-500"
              />
              <label htmlFor="showFeedback" className="text-gray-700 dark:text-gray-300">
                Show Feedback Immediately
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showTimer"
                checked={localActivity.settings?.showTimer || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    showTimer: e.target.checked
                  }
                })}
                className="mr-2 accent-blue-600 dark:accent-blue-500"
              />
              <label htmlFor="showTimer" className="text-gray-700 dark:text-gray-300">
                Show Timer
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowPartialCredit"
                checked={localActivity.settings?.allowPartialCredit || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    allowPartialCredit: e.target.checked
                  }
                })}
                className="mr-2 accent-blue-600 dark:accent-blue-500"
              />
              <label htmlFor="allowPartialCredit" className="text-gray-700 dark:text-gray-300">
                Allow Partial Credit
              </label>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={localActivity.settings?.timeLimit || 30}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    timeLimit: parseInt(e.target.value)
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Passing Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={localActivity.settings?.passingPercentage || 60}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    passingPercentage: parseInt(e.target.value)
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <select
            value={currentQuestionIndex}
            onChange={(e) => setCurrentQuestionIndex(parseInt(e.target.value))}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {localActivity.questions.map((q, index) => (
              <option key={q.id} value={index}>
                Question {index + 1} ({q.type}) {q.questionBankRef ? '(from bank)' : ''}
              </option>
            ))}
          </select>

          <ActivityButton
            onClick={handleRemoveQuestion}
            disabled={localActivity.questions.length <= 1}
            variant="danger"
            icon="trash"
            className="ml-2"
          >
            Remove
          </ActivityButton>
        </div>

        <div className="flex items-center gap-2">
          {/* Question Bank Dialog */}
          <Dialog open={questionBankDialogOpen} onOpenChange={setQuestionBankDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Question Bank
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Select Questions from Question Bank</DialogTitle>
              </DialogHeader>
              <QuestionBankSelector
                onSelectQuestions={handleAddQuestionsFromBank}
                subjectId={subjectId}
                courseId={courseId}
                classId={classId}
              />
            </DialogContent>
          </Dialog>

          <ActivityButton
            onClick={togglePreview}
            variant="secondary"
            icon={previewMode ? "edit" : "eye"}
            className="mr-2"
          >
            {previewMode ? "Edit" : "Preview"}
          </ActivityButton>

          <div className="relative">
            <ActivityButton
              onClick={() => {}}
              variant="secondary"
              icon="plus"
            >
              Add Question
            </ActivityButton>

            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-10 hidden group-hover:block">
              <ul className="py-1">
                <li>
                  <button
                    onClick={() => handleAddQuestion('multiple-choice')}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Multiple Choice
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleAddQuestion('true-false')}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    True/False
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleAddQuestion('multiple-response')}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Multiple Response
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleAddQuestion('fill-in-the-blanks')}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Fill in the Blanks
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleAddQuestion('matching')}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Matching
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleAddQuestion('sequence')}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sequence
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleAddQuestion('numeric')}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Numeric
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Question editor */}
      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
          Question {currentQuestionIndex + 1} ({currentQuestion.type})
        </h3>

        {/* Question text */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Question Text</label>
          <textarea
            value={currentQuestion.text}
            onChange={(e) => updateQuestion({ text: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
        </div>

        {/* Question type specific editor */}
        {renderQuestionEditor()}

        {/* Question hint */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Hint (Optional)</label>
          <textarea
            value={currentQuestion.hint || ''}
            onChange={(e) => updateQuestion({ hint: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        {/* Question explanation */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Explanation (Optional)</label>
          <textarea
            value={currentQuestion.explanation || ''}
            onChange={(e) => updateQuestion({ explanation: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
        </div>

        {/* Question points */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Points</label>
          <input
            type="number"
            min="1"
            value={currentQuestion.points || 1}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                updateQuestion({ points: value });
              }
            }}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Media */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Media (Optional)</label>

          <div className="mb-3">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Media Type</label>
            <select
              value={currentQuestion.media?.type || 'none'}
              onChange={(e) => {
                const type = e.target.value;
                if (type === 'none') {
                  // Remove media
                  updateQuestion({ media: undefined });
                } else {
                  // Add or update media
                  updateQuestionMedia({
                    type: type as 'image' | 'text',
                    url: type === 'image' ? '' : undefined,
                    content: type === 'text' ? '' : undefined
                  });
                }
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="none">None</option>
              <option value="image">Image</option>
              <option value="text">Text</option>
            </select>
          </div>

          {currentQuestion.media?.type === 'image' && (
            <div className="mb-3">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Image URL</label>
              <input
                type="text"
                value={currentQuestion.media.url || ''}
                onChange={(e) => updateQuestionMedia({ url: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/image.jpg"
              />

              <label className="block mb-1 mt-2 text-sm text-gray-700 dark:text-gray-300">Alt Text</label>
              <input
                type="text"
                value={currentQuestion.media.alt || ''}
                onChange={(e) => updateQuestionMedia({ alt: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Description of the image"
              />
            </div>
          )}

          {currentQuestion.media?.type === 'text' && (
            <div className="mb-3">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Additional Text</label>
              <textarea
                value={currentQuestion.media.content || ''}
                onChange={(e) => updateQuestionMedia({ content: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Additional text content"
              />
            </div>
          )}

          {currentQuestion.media && (
            <div className="mb-3">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Caption (Optional)</label>
              <input
                type="text"
                value={currentQuestion.media.caption || ''}
                onChange={(e) => updateQuestionMedia({ caption: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Caption for the media"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <ActivityButton
          onClick={handleSave}
          variant="primary"
          icon="save"
        >
          Save Activity
        </ActivityButton>
      </div>
    </ThemeWrapper>
  );
};

export default QuizEditor;
