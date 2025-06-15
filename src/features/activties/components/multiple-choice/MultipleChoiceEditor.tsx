'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MultipleChoiceActivity,
  MultipleChoiceQuestion,
  MultipleChoiceOption,
  createDefaultMultipleChoiceQuestion,
  createDefaultMultipleChoiceOption
} from '../../models/multiple-choice';
import { ActivityButton } from '../ui/ActivityButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { MediaSelector } from '../ui/MediaSelector';
import { MediaItem } from '../ui/MediaUploader';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { generateId } from '../../models/base';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';

export interface MultipleChoiceEditorProps {
  activity: MultipleChoiceActivity;
  onChange: (activity: MultipleChoiceActivity) => void;
  onSave?: (activity: MultipleChoiceActivity) => void;
  className?: string;
}

/**
 * Multiple Choice Activity Editor
 *
 * This component provides an interface for creating and editing
 * multiple choice activities with:
 * - Direct manipulation of questions and options
 * - Real-time preview
 * - Settings configuration
 * - AI assistance options
 */
export const MultipleChoiceEditor: React.FC<MultipleChoiceEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Get responsive state
  const { isMobile } = useResponsive();

  // Local state for the activity and UI state
  const [localActivity, setLocalActivity] = useState<MultipleChoiceActivity>(activity);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAddedQuestionId, setLastAddedQuestionId] = useState<string | null>(null);
  const [lastAddedOptionId, setLastAddedOptionId] = useState<{questionId: string, optionId: string} | null>(null);

  // Update the local activity and call onChange with debounce
  const updateActivity = useCallback((updates: Partial<MultipleChoiceActivity>) => {
    const updatedActivity = { ...localActivity, ...updates };
    setLocalActivity(updatedActivity);
    onChange(updatedActivity);
  }, [localActivity, onChange]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivity({ title: e.target.value });
  };

  // Handle description change
  const handleDescriptionChange = (content: string) => {
    updateActivity({ description: content });
  };

  // Handle instructions change
  const handleInstructionsChange = (content: string) => {
    updateActivity({ instructions: content });
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
    const newQuestion = createDefaultMultipleChoiceQuestion();
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
  const handleQuestionChange = (index: number, updatedQuestion: MultipleChoiceQuestion) => {
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
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Edit Multiple Choice Activity</h1>

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
          <RichTextEditor
            content={localActivity.description || ''}
            onChange={handleDescriptionChange}
            label="Description"
            placeholder="Enter a description for this activity"
            minHeight="100px"
            simple={true}
          />
        </div>

        <div className="mb-4">
          <RichTextEditor
            content={localActivity.instructions || ''}
            onChange={handleInstructionsChange}
            label="Instructions"
            placeholder="Enter instructions for students"
            minHeight="100px"
            simple={true}
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
                className="mr-2 accent-primary-green dark:accent-medium-teal touch-target"
              />
              <label htmlFor="shuffleQuestions" className="text-gray-700 dark:text-gray-300">Shuffle Questions</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="shuffleOptions"
                checked={localActivity.settings?.shuffleOptions || false}
                onChange={(e) => handleSettingChange('shuffleOptions', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal touch-target"
              />
              <label htmlFor="shuffleOptions" className="text-gray-700 dark:text-gray-300">Shuffle Options</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showFeedbackImmediately"
                checked={localActivity.settings?.showFeedbackImmediately || false}
                onChange={(e) => handleSettingChange('showFeedbackImmediately', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal touch-target"
              />
              <label htmlFor="showFeedbackImmediately" className="text-gray-700 dark:text-gray-300">Show Feedback Immediately</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                checked={localActivity.settings?.showCorrectAnswers || false}
                onChange={(e) => handleSettingChange('showCorrectAnswers', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal touch-target"
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Questions</h2>
          <ActivityButton
            onClick={handleAddQuestion}
            variant="success"
            icon="plus"
          >
            Add Question
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
                lastAddedOptionId={lastAddedOptionId}
                setLastAddedOptionId={setLastAddedOptionId}
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
  question: MultipleChoiceQuestion;
  index: number;
  onChange: (question: MultipleChoiceQuestion) => void;
  onRemove: () => void;
  lastAddedOptionId: {questionId: string, optionId: string} | null;
  setLastAddedOptionId: React.Dispatch<React.SetStateAction<{questionId: string, optionId: string} | null>>;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onChange,
  onRemove,
  lastAddedOptionId,
  setLastAddedOptionId
}) => {
  // Get responsive state
  const { isMobile } = useResponsive();
  // Handle question text change
  const handleQuestionTextChange = (content: string) => {
    onChange({
      ...question,
      text: content
    });
  };

  // Handle explanation change
  const handleExplanationChange = (content: string) => {
    onChange({
      ...question,
      explanation: content
    });
  };

  // Handle hint change
  const handleHintChange = (content: string) => {
    onChange({
      ...question,
      hint: content
    });
  };

  // Handle media change
  const handleMediaChange = (media?: MediaItem) => {
    onChange({
      ...question,
      media: media
    });
  };

  // Handle option change
  const handleOptionChange = (optionIndex: number, updates: Partial<MultipleChoiceOption>) => {
    const newOptions = [...question.options];

    // If we're setting this option as correct, make sure others are not correct
    if (updates.isCorrect) {
      newOptions.forEach((option, i) => {
        if (i !== optionIndex) {
          option.isCorrect = false;
        }
      });
    }

    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      ...updates
    };

    onChange({
      ...question,
      options: newOptions
    });
  };

  // Add a new option with animation
  const handleAddOption = () => {
    const newOption = createDefaultMultipleChoiceOption();

    // Set the animation flag
    setLastAddedOptionId({
      questionId: question.id,
      optionId: newOption.id
    });

    // Clear the animation flag after animation completes
    setTimeout(() => setLastAddedOptionId(null), 500);

    onChange({
      ...question,
      options: [...question.options, newOption]
    });
  };

  // Remove an option
  const handleRemoveOption = (optionIndex: number) => {
    const newOptions = [...question.options];
    newOptions.splice(optionIndex, 1);

    // Ensure at least one option is marked as correct
    if (!newOptions.some(o => o.isCorrect) && newOptions.length > 0) {
      newOptions[0].isCorrect = true;
    }

    onChange({
      ...question,
      options: newOptions
    });
  };

  return (
    <ThemeWrapper className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Question {index + 1}</h3>
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
        <RichTextEditor
          content={question.text}
          onChange={handleQuestionTextChange}
          label="Question Text"
          placeholder="Enter your question"
          minHeight="100px"
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Options</label>
        <AnimatePresence>
          {question.options.map((option, optionIndex) => (
            <motion.div
              key={option.id}
              className={cn(
                "flex flex-wrap md:flex-nowrap items-center mb-3 p-2 rounded-md",
                lastAddedOptionId?.questionId === question.id &&
                lastAddedOptionId?.optionId === option.id &&
                "bg-light-mint/20 dark:bg-primary-green/20"
              )}
              initial={lastAddedOptionId?.questionId === question.id &&
                      lastAddedOptionId?.optionId === option.id ?
                      { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center w-full md:w-auto mb-2 md:mb-0">
                <input
                  type="radio"
                  checked={option.isCorrect}
                  onChange={() => handleOptionChange(optionIndex, { isCorrect: true })}
                  className="mr-3 w-5 h-5 accent-primary-green dark:accent-medium-teal touch-target"
                  aria-label={`Mark option ${optionIndex + 1} as correct`}
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(optionIndex, { text: e.target.value })}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
                  placeholder="Option text"
                />
              </div>

              <div className="flex flex-1 items-center w-full md:w-auto">
                <input
                  type="text"
                  value={option.feedback || ''}
                  onChange={(e) => handleOptionChange(optionIndex, { feedback: e.target.value })}
                  className="flex-1 md:ml-2 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
                  placeholder="Feedback for this option"
                />
                <ActivityButton
                  onClick={() => handleRemoveOption(optionIndex)}
                  variant="secondary"
                  disabled={question.options.length <= 2}
                  className="ml-2 px-2 py-1"
                  icon="x"
                  ariaLabel="Remove option"
                  size="sm"
                >
                  {!isMobile && "Remove"}
                </ActivityButton>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <ActivityButton
          onClick={handleAddOption}
          variant="secondary"
          icon="plus"
          className="mt-3 w-full md:w-auto"
        >
          Add Option
        </ActivityButton>
      </div>

      <div className="mb-3">
        <RichTextEditor
          content={question.explanation || ''}
          onChange={handleExplanationChange}
          label="Explanation"
          placeholder="Explain the correct answer"
          minHeight="100px"
          simple={true}
        />
      </div>

      <div className="mb-3">
        <RichTextEditor
          content={question.hint || ''}
          onChange={handleHintChange}
          label="Hint"
          placeholder="Provide a hint for students"
          minHeight="100px"
          simple={true}
        />
      </div>

      <div className="mb-3">
        <MediaSelector
          media={question.media}
          onChange={handleMediaChange}
          label="Question Media (Optional)"
          allowedTypes={['image', 'video', 'audio']}
          enableJinaAI={true}
        />
      </div>
    </ThemeWrapper>
  );
};

export default MultipleChoiceEditor;
