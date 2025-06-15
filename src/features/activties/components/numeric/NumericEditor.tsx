'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NumericActivity, NumericQuestion, createDefaultNumericActivity, createDefaultNumericQuestion } from '../../models/numeric';
import { ActivityButton } from '../ui/ActivityButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { MediaUploader } from '../ui/MediaUploader';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

// Custom Calculator icon
const Calculator = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="8" x2="8" y1="12" y2="12" />
    <line x1="12" x2="12" y1="12" y2="12" />
    <line x1="16" x2="16" y1="12" y2="12" />
    <line x1="8" x2="8" y1="16" y2="16" />
    <line x1="12" x2="12" y1="16" y2="16" />
    <line x1="16" x2="16" y1="16" y2="16" />
  </svg>
);

// Custom Info icon
const Info = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export interface NumericEditorProps {
  activity?: NumericActivity;
  onChange?: (activity: NumericActivity) => void;
  onSave?: (activity: NumericActivity) => void;
  className?: string;
}

/**
 * Numeric Activity Editor
 *
 * This component provides an interface for creating and editing numeric activities.
 * It includes:
 * - Activity metadata editing
 * - Question editing
 * - Answer range configuration
 * - Settings configuration
 * - Accessibility features
 */
export const NumericEditor: React.FC<NumericEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Initialize with default activity if none provided
  const [localActivity, setLocalActivity] = useState<NumericActivity>(
    activity || createDefaultNumericActivity()
  );

  // Current question being edited
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Preview mode for testing
  const [previewMode, setPreviewMode] = useState(false);

  // Animation and feedback states
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showCalculatorPreview, setShowCalculatorPreview] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{
    correctAnswer?: string;
    acceptableRange?: string;
    unit?: string;
  }>({});

  // Refs for scrolling to newly added questions
  const questionEditorRef = useRef<HTMLDivElement>(null);

  // Update local activity when prop changes
  useEffect(() => {
    if (activity) {
      setLocalActivity(activity);
    }
  }, [activity]);

  // Get current question
  const currentQuestion = localActivity.questions[currentQuestionIndex] || localActivity.questions[0];

  // Update activity with changes
  const updateActivity = (updates: Partial<NumericActivity>) => {
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
  const updateQuestion = (updates: Partial<NumericQuestion>) => {
    const updatedQuestions = [...localActivity.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      ...updates
    };

    updateActivity({ questions: updatedQuestions });
  };

  // Validate numeric inputs
  const validateNumericInputs = () => {
    const errors: {
      correctAnswer?: string;
      acceptableRange?: string;
      unit?: string;
    } = {};

    // Validate correct answer
    if (isNaN(currentQuestion.correctAnswer)) {
      errors.correctAnswer = "Please enter a valid number";
    }

    // Validate acceptable range if provided
    if (currentQuestion.acceptableRange) {
      if (currentQuestion.acceptableRange.min > currentQuestion.acceptableRange.max) {
        errors.acceptableRange = "Minimum value must be less than or equal to maximum value";
      }

      if (currentQuestion.correctAnswer < currentQuestion.acceptableRange.min ||
          currentQuestion.correctAnswer > currentQuestion.acceptableRange.max) {
        errors.acceptableRange = "Correct answer must be within the acceptable range";
      }
    }

    // Validate unit if required
    if (localActivity.settings?.requireUnit && !currentQuestion.unit) {
      errors.unit = "Unit is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add a new question with animation and feedback
  const handleAddQuestion = () => {
    setIsAddingQuestion(true);

    const newQuestion = createDefaultNumericQuestion();
    updateActivity({
      questions: [...localActivity.questions, newQuestion]
    });

    setCurrentQuestionIndex(localActivity.questions.length);

    // Show feedback and reset animation state
    setFeedbackMessage({
      type: 'success',
      message: 'New question added successfully!'
    });

    // Scroll to the question editor after a short delay
    setTimeout(() => {
      questionEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsAddingQuestion(false);
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedbackMessage(null), 3000);
    }, 500);
  };

  // Remove current question with feedback
  const handleRemoveQuestion = () => {
    if (localActivity.questions.length <= 1) {
      setFeedbackMessage({
        type: 'error',
        message: 'Cannot remove the last question'
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    const updatedQuestions = [...localActivity.questions];
    updatedQuestions.splice(currentQuestionIndex, 1);

    updateActivity({ questions: updatedQuestions });
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));

    // Show feedback
    setFeedbackMessage({
      type: 'info',
      message: 'Question removed'
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Update question media
  const updateQuestionMedia = (updates: Partial<NonNullable<NumericQuestion['media']>>) => {
    const currentMedia = currentQuestion.media || { type: 'image' };
    const updatedMedia = {
      ...currentMedia,
      ...updates
    };

    updateQuestion({ media: updatedMedia });
  };

  // Handle save with validation and feedback
  const handleSave = () => {
    // Validate current question
    const isValid = validateNumericInputs();

    if (!isValid) {
      setFeedbackMessage({
        type: 'error',
        message: 'Please fix validation errors before saving'
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    if (onSave) {
      try {
        onSave(localActivity);
        setFeedbackMessage({
          type: 'success',
          message: 'Activity saved successfully!'
        });
      } catch (error) {
        setFeedbackMessage({
          type: 'error',
          message: 'Failed to save activity. Please try again.'
        });
      }
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Toggle calculator preview
  const toggleCalculatorPreview = () => {
    setShowCalculatorPreview(!showCalculatorPreview);
  };

  // Feedback message component
  const renderFeedback = () => {
    if (!feedbackMessage) return null;

    const bgColor =
      feedbackMessage.type === 'success' ? 'bg-primary-green' :
      feedbackMessage.type === 'error' ? 'bg-red-600' :
      'bg-medium-teal';

    const Icon =
      feedbackMessage.type === 'success' ? Check :
      feedbackMessage.type === 'error' ? AlertCircle :
      Info;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${bgColor} shadow-md flex items-center`}
      >
        <Icon className="w-5 h-5 mr-2" />
        {feedbackMessage.message}
      </motion.div>
    );
  };

  // Simple calculator preview component
  const renderCalculatorPreview = () => {
    if (!showCalculatorPreview) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md mb-4"
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Calculator Preview</h4>
          <button
            onClick={toggleCalculatorPreview}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 text-right text-lg font-mono">
            0
          </div>
          <div className="grid grid-cols-4 gap-1 p-2">
            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((key) => (
              <button
                key={key}
                className={`p-2 rounded ${
                  ['÷', '×', '-', '+', '='].includes(key)
                    ? 'bg-primary-green text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          This is how the calculator will appear to students when "Show Calculator" is enabled.
          {localActivity.settings?.decimalPlaces !== undefined && (
            <> Results will be rounded to {localActivity.settings.decimalPlaces} decimal places.</>
          )}
        </p>
      </motion.div>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && renderFeedback()}
      </AnimatePresence>

      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
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
                className="mr-2 accent-primary-green dark:accent-medium-teal"
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
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="showFeedback" className="text-gray-700 dark:text-gray-300">
                Show Feedback Immediately
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCalculator"
                checked={localActivity.settings?.showCalculator || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    showCalculator: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="showCalculator" className="text-gray-700 dark:text-gray-300">
                Show Calculator
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireUnit"
                checked={localActivity.settings?.requireUnit || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    requireUnit: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="requireUnit" className="text-gray-700 dark:text-gray-300">
                Require Unit
              </label>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Decimal Places
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={localActivity.settings?.decimalPlaces || 2}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    decimalPlaces: parseInt(e.target.value)
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

      {/* Calculator preview */}
      <AnimatePresence>
        {showCalculatorPreview && renderCalculatorPreview()}
      </AnimatePresence>

      {/* Question navigation */}
      <div className="mb-4 p-3 bg-light-mint/30 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              value={currentQuestionIndex}
              onChange={(e) => setCurrentQuestionIndex(parseInt(e.target.value))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[200px]"
              aria-label="Select question"
            >
              {localActivity.questions.map((q, index) => (
                <option key={q.id} value={index}>
                  Question {index + 1}
                </option>
              ))}
            </select>

            <ActivityButton
              onClick={handleRemoveQuestion}
              disabled={localActivity.questions.length <= 1}
              variant="danger"
              icon="trash"
              className="min-w-[140px]"
              ariaLabel="Remove current question"
            >
              Remove
            </ActivityButton>
          </div>

          <div className="flex flex-row items-center gap-2 flex-wrap justify-end">
            {localActivity.settings?.showCalculator && (
              <ActivityButton
                onClick={toggleCalculatorPreview}
                variant="secondary"
                icon="calculator"
                ariaLabel="Preview calculator"
              >
                Calculator
              </ActivityButton>
            )}

            <ActivityButton
              onClick={togglePreview}
              variant="secondary"
              icon={previewMode ? "edit" : "eye"}
              ariaLabel={previewMode ? "Switch to edit mode" : "Switch to preview mode"}
            >
              {previewMode ? "Edit" : "Preview"}
            </ActivityButton>

            <ActivityButton
              onClick={handleAddQuestion}
              variant="secondary"
              icon="plus"
              ariaLabel="Add new question"
            >
              Add Question
            </ActivityButton>
          </div>
        </div>
      </div>

      {/* Question editor */}
      <motion.div
        ref={questionEditorRef}
        className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
        initial={{ opacity: 0.8, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isAddingQuestion ? [1, 1.02, 1] : 1,
          transition: {
            duration: 0.3,
            scale: { duration: 0.5 }
          }
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Question {currentQuestionIndex + 1}
          </h3>
          <span className="text-xs px-2 py-1 bg-light-mint text-primary-green rounded-full">
            {currentQuestionIndex + 1} of {localActivity.questions.length}
          </span>
        </div>

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

        {/* Correct answer */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Correct Answer
            {localActivity.settings?.requireUnit && <span className="text-primary-green ml-1">*</span>}
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-grow">
              <input
                type="number"
                value={currentQuestion.correctAnswer}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    updateQuestion({ correctAnswer: value });
                    // Clear validation error when user starts typing
                    if (validationErrors.correctAnswer) {
                      setValidationErrors({...validationErrors, correctAnswer: undefined});
                    }
                  }
                }}
                onBlur={() => validateNumericInputs()}
                step="any"
                className={`w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  validationErrors.correctAnswer
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                aria-invalid={!!validationErrors.correctAnswer}
                aria-describedby={validationErrors.correctAnswer ? "correctAnswer-error" : undefined}
              />
              {validationErrors.correctAnswer && (
                <motion.p
                  id="correctAnswer-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {validationErrors.correctAnswer}
                </motion.p>
              )}
            </div>

            <div className="relative w-full sm:w-1/3">
              <input
                type="text"
                value={currentQuestion.unit || ''}
                onChange={(e) => {
                  updateQuestion({ unit: e.target.value });
                  // Clear validation error when user starts typing
                  if (validationErrors.unit) {
                    setValidationErrors({...validationErrors, unit: undefined});
                  }
                }}
                onBlur={() => validateNumericInputs()}
                placeholder={localActivity.settings?.requireUnit ? "Unit (required)" : "Unit (optional)"}
                className={`w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  validationErrors.unit
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                aria-invalid={!!validationErrors.unit}
                aria-describedby={validationErrors.unit ? "unit-error" : undefined}
              />
              {validationErrors.unit && (
                <motion.p
                  id="unit-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {validationErrors.unit}
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* Acceptable range */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Acceptable Range (Optional)
          </label>
          <div className="p-3 bg-light-mint/20 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:w-1/2">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Minimum</label>
                <div className="relative">
                  <input
                    type="number"
                    value={currentQuestion.acceptableRange?.min ?? ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        updateQuestion({
                          acceptableRange: {
                            min: value,
                            max: currentQuestion.acceptableRange?.max ?? currentQuestion.correctAnswer
                          }
                        });
                        // Clear validation error when user starts typing
                        if (validationErrors.acceptableRange) {
                          setValidationErrors({...validationErrors, acceptableRange: undefined});
                        }
                      }
                    }}
                    onBlur={() => validateNumericInputs()}
                    step="any"
                    className={`w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      validationErrors.acceptableRange
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Min value"
                    aria-invalid={!!validationErrors.acceptableRange}
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Maximum</label>
                <div className="relative">
                  <input
                    type="number"
                    value={currentQuestion.acceptableRange?.max ?? ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        updateQuestion({
                          acceptableRange: {
                            min: currentQuestion.acceptableRange?.min ?? currentQuestion.correctAnswer,
                            max: value
                          }
                        });
                        // Clear validation error when user starts typing
                        if (validationErrors.acceptableRange) {
                          setValidationErrors({...validationErrors, acceptableRange: undefined});
                        }
                      }
                    }}
                    onBlur={() => validateNumericInputs()}
                    step="any"
                    className={`w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      validationErrors.acceptableRange
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Max value"
                    aria-invalid={!!validationErrors.acceptableRange}
                  />
                </div>
              </div>
            </div>
            {validationErrors.acceptableRange && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs mt-2"
              >
                {validationErrors.acceptableRange}
              </motion.p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              If left empty, only the exact answer will be accepted.
            </p>
          </div>
        </div>

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
      </motion.div>

      {/* Save button */}
      <motion.div
        className="mt-6 flex justify-end"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ActivityButton
          onClick={handleSave}
          variant="primary"
          icon="save"
          size="lg"
          ariaLabel="Save numeric activity"
          className="px-6 py-3"
        >
          Save Activity
        </ActivityButton>
      </motion.div>
    </ThemeWrapper>
  );
};

export default NumericEditor;
