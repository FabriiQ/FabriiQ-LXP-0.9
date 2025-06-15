'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrueFalseActivity,
  TrueFalseQuestion,
  createDefaultTrueFalseQuestion
} from '../../models/true-false';
import { ActivityButton } from '../ui/ActivityButton';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';

export interface TrueFalseEditorProps {
  activity: TrueFalseActivity;
  onChange: (activity: TrueFalseActivity) => void;
  onSave?: (activity: TrueFalseActivity) => void;
  className?: string;
}

/**
 * True/False Activity Editor
 *
 * This component provides an interface for creating and editing
 * true/false activities with:
 * - Direct manipulation of questions
 * - Real-time preview
 * - Settings configuration
 * - AI assistance options
 */
export const TrueFalseEditor: React.FC<TrueFalseEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Get responsive state
  const { isMobile } = useResponsive();

  // Local state for the activity and UI state
  const [localActivity, setLocalActivity] = useState<TrueFalseActivity>(activity);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAddedQuestionId, setLastAddedQuestionId] = useState<string | null>(null);

  // Update the local activity and call onChange with debounce
  const updateActivity = useCallback((updates: Partial<TrueFalseActivity>) => {
    const updatedActivity = { ...localActivity, ...updates };
    setLocalActivity(updatedActivity);
    onChange(updatedActivity);
  }, [localActivity, onChange]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivity({ title: e.target.value });
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateActivity({ description: e.target.value });
  };

  // Handle instructions change
  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateActivity({ instructions: e.target.value });
  };

  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    updateActivity({
      settings: {
        ...localActivity.settings,
        [key]: value
      }
    });
  };

  // Add a new question with animation
  const handleAddQuestion = () => {
    const newQuestion = createDefaultTrueFalseQuestion();
    setLastAddedQuestionId(newQuestion.id);

    // Clear the animation flag after animation completes
    setTimeout(() => setLastAddedQuestionId(null), 500);

    updateActivity({
      questions: [...localActivity.questions, newQuestion]
    });
  };

  // Remove a question with animation
  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...localActivity.questions];
    newQuestions.splice(index, 1);
    updateActivity({ questions: newQuestions });
  };

  // Update a question
  const handleQuestionChange = (index: number, updatedQuestion: TrueFalseQuestion) => {
    const newQuestions = [...localActivity.questions];
    newQuestions[index] = updatedQuestion;
    updateActivity({ questions: newQuestions });
  };

  // Handle save with animation and feedback
  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);

      try {
        await onSave(localActivity);
        // Show success animation/feedback here if needed
      } catch (error) {
        // Handle error if needed
        console.error('Error saving activity:', error);
      } finally {
        // Delay to show the saving state for a moment
        setTimeout(() => {
          setIsSaving(false);
        }, 500);
      }
    }
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Edit True/False Activity</h1>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={localActivity.title}
            onChange={handleTitleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={localActivity.description || ''}
            onChange={handleDescriptionChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Instructions</label>
          <textarea
            value={localActivity.instructions || ''}
            onChange={handleInstructionsChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        <div className="mb-4 p-4 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shuffleQuestions"
                checked={localActivity.settings?.shuffleQuestions || false}
                onChange={(e) => handleSettingChange('shuffleQuestions', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal touch-target w-5 h-5"
              />
              <label htmlFor="shuffleQuestions" className="text-gray-700 dark:text-gray-300">Shuffle Questions</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showFeedbackImmediately"
                checked={localActivity.settings?.showFeedbackImmediately || false}
                onChange={(e) => handleSettingChange('showFeedbackImmediately', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal touch-target w-5 h-5"
              />
              <label htmlFor="showFeedbackImmediately" className="text-gray-700 dark:text-gray-300">Show Feedback Immediately</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                checked={localActivity.settings?.showCorrectAnswers || false}
                onChange={(e) => handleSettingChange('showCorrectAnswers', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal touch-target w-5 h-5"
              />
              <label htmlFor="showCorrectAnswers" className="text-gray-700 dark:text-gray-300">Show Correct Answers</label>
            </div>
          </div>

          <div className={cn("grid gap-4 mt-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <div>
              <label htmlFor="passingPercentage" className="block mb-1 text-gray-700 dark:text-gray-300">Passing Percentage</label>
              <input
                type="number"
                id="passingPercentage"
                value={localActivity.settings?.passingPercentage || 60}
                onChange={(e) => handleSettingChange('passingPercentage', parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
              />
            </div>

            <div>
              <label htmlFor="attemptsAllowed" className="block mb-1 text-gray-700 dark:text-gray-300">Attempts Allowed</label>
              <input
                type="number"
                id="attemptsAllowed"
                value={localActivity.settings?.attemptsAllowed || 1}
                onChange={(e) => handleSettingChange('attemptsAllowed', parseInt(e.target.value))}
                min="1"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Statements</h2>
          <ActivityButton
            onClick={handleAddQuestion}
            variant="success"
            icon="plus"
          >
            Add Statement
          </ActivityButton>
        </div>

        <AnimatePresence>
          {localActivity.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={lastAddedQuestionId === question.id ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                lastAddedQuestionId === question.id && "animate-pulse"
              )}
            >
              <QuestionEditor
                question={question}
                index={index}
                onChange={(updatedQuestion) => handleQuestionChange(index, updatedQuestion)}
                onRemove={() => handleRemoveQuestion(index)}
                isMobile={isMobile}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-end">
        <ActivityButton
          onClick={handleSave}
          variant="primary"
          icon="save"
          loading={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Activity'}
        </ActivityButton>
      </div>
    </ThemeWrapper>
  );
};

// Question Editor Component
interface QuestionEditorProps {
  question: TrueFalseQuestion;
  index: number;
  onChange: (question: TrueFalseQuestion) => void;
  onRemove: () => void;
  isMobile: boolean;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onChange,
  onRemove,
  isMobile
}) => {
  // Handle question text change
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      text: e.target.value
    });
  };

  // Handle explanation change
  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      explanation: e.target.value
    });
  };

  // Handle hint change
  const handleHintChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      hint: e.target.value
    });
  };

  // Handle true/false toggle
  const handleTrueFalseChange = (isTrue: boolean) => {
    onChange({
      ...question,
      isTrue
    });
  };

  return (
    <ThemeWrapper className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Statement {index + 1}</h3>
        <ActivityButton
          onClick={onRemove}
          variant="danger"
          disabled={false}
          icon="trash"
        >
          Remove
        </ActivityButton>
      </div>

      <div className="mb-3">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Statement Text</label>
        <textarea
          value={question.text}
          onChange={handleQuestionTextChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
          rows={isMobile ? 3 : 2}
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">This statement is:</label>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id={`true-${question.id}`}
              checked={question.isTrue === true}
              onChange={() => handleTrueFalseChange(true)}
              className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
            />
            <label htmlFor={`true-${question.id}`} className="text-gray-700 dark:text-gray-300">True</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id={`false-${question.id}`}
              checked={question.isTrue === false}
              onChange={() => handleTrueFalseChange(false)}
              className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
            />
            <label htmlFor={`false-${question.id}`} className="text-gray-700 dark:text-gray-300">False</label>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Explanation</label>
        <textarea
          value={question.explanation || ''}
          onChange={handleExplanationChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
          rows={isMobile ? 3 : 2}
          placeholder="Explain why this statement is true or false"
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Hint</label>
        <textarea
          value={question.hint || ''}
          onChange={handleHintChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
          rows={isMobile ? 3 : 2}
          placeholder="Provide a hint for students"
        />
      </div>
    </ThemeWrapper>
  );
};

export default TrueFalseEditor;
