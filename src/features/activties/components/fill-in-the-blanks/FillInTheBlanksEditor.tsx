'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FillInTheBlanksActivity,
  FillInTheBlanksQuestion,
  FillInTheBlanksBlank,
  createDefaultFillInTheBlanksQuestion,
  createDefaultBlank,
  parseTextWithBlanks
} from '../../models/fill-in-the-blanks';
import { ActivityButton } from '../ui/ActivityButton';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { generateId } from '../../models/base';
import { useResponsive } from '@/lib/hooks/use-responsive';

export interface FillInTheBlanksEditorProps {
  activity: FillInTheBlanksActivity;
  onChange: (activity: FillInTheBlanksActivity) => void;
  onSave?: (activity: FillInTheBlanksActivity) => void;
  className?: string;
}

/**
 * Fill in the Blanks Activity Editor
 *
 * This component provides an interface for creating and editing
 * fill in the blanks activities with:
 * - Direct manipulation of text and blanks
 * - Real-time preview
 * - Settings configuration
 * - AI assistance options
 */
export const FillInTheBlanksEditor: React.FC<FillInTheBlanksEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Get responsive state
  const { isMobile } = useResponsive();

  // Local state for the activity and UI state
  const [localActivity, setLocalActivity] = useState<FillInTheBlanksActivity>(activity);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAddedQuestionId, setLastAddedQuestionId] = useState<string | null>(null);
  const [lastAddedBlankId, setLastAddedBlankId] = useState<string | null>(null);

  // Update the local activity and call onChange with debounce
  const updateActivity = useCallback((updates: Partial<FillInTheBlanksActivity>) => {
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
    const newQuestion = createDefaultFillInTheBlanksQuestion();
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
  const handleQuestionChange = (index: number, updatedQuestion: FillInTheBlanksQuestion) => {
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
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Edit Fill in the Blanks Activity</h1>

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

          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shuffleQuestions"
                checked={localActivity.settings?.shuffleQuestions || false}
                onChange={(e) => handleSettingChange('shuffleQuestions', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
              />
              <label htmlFor="shuffleQuestions" className="text-gray-700 dark:text-gray-300">Shuffle Questions</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showFeedbackImmediately"
                checked={localActivity.settings?.showFeedbackImmediately || false}
                onChange={(e) => handleSettingChange('showFeedbackImmediately', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
              />
              <label htmlFor="showFeedbackImmediately" className="text-gray-700 dark:text-gray-300">Show Feedback Immediately</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                checked={localActivity.settings?.showCorrectAnswers || false}
                onChange={(e) => handleSettingChange('showCorrectAnswers', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
              />
              <label htmlFor="showCorrectAnswers" className="text-gray-700 dark:text-gray-300">Show Correct Answers</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowPartialCredit"
                checked={localActivity.settings?.allowPartialCredit || false}
                onChange={(e) => handleSettingChange('allowPartialCredit', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
              />
              <label htmlFor="allowPartialCredit" className="text-gray-700 dark:text-gray-300">Allow Partial Credit</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="caseSensitiveByDefault"
                checked={localActivity.settings?.caseSensitiveByDefault || false}
                onChange={(e) => handleSettingChange('caseSensitiveByDefault', e.target.checked)}
                className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
              />
              <label htmlFor="caseSensitiveByDefault" className="text-gray-700 dark:text-gray-300">Case Sensitive by Default</label>
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
                caseSensitiveByDefault={localActivity.settings?.caseSensitiveByDefault}
                isMobile={isMobile}
                setLastAddedBlankId={setLastAddedBlankId}
                lastAddedBlankId={lastAddedBlankId}
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
  question: FillInTheBlanksQuestion;
  index: number;
  onChange: (question: FillInTheBlanksQuestion) => void;
  onRemove: () => void;
  caseSensitiveByDefault?: boolean;
  isMobile: boolean;
  setLastAddedBlankId: React.Dispatch<React.SetStateAction<string | null>>;
  lastAddedBlankId: string | null;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onChange,
  onRemove,
  caseSensitiveByDefault,
  isMobile,
  setLastAddedBlankId,
  lastAddedBlankId
}) => {
  // State for the text editor
  const [textWithBlanks, setTextWithBlanks] = useState(question.text);
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);

  // Update the text when the question changes
  useEffect(() => {
    setTextWithBlanks(question.text);
  }, [question.text]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextWithBlanks(e.target.value);

    // Update the question with the new text
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

  // Handle partial credit toggle
  const handlePartialCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...question,
      partialCredit: e.target.checked
    });
  };

  // Add a new blank with animation
  const handleAddBlank = () => {
    // Create a new blank
    const newBlank = createDefaultBlank();

    // Set animation flag
    setLastAddedBlankId(newBlank.id);

    // Clear animation flag after animation completes
    setTimeout(() => setLastAddedBlankId(null), 500);

    // Add the blank to the question
    const updatedQuestion = {
      ...question,
      blanks: [...question.blanks, newBlank],
      text: textWithBlanks + ` {{${newBlank.id}}}`
    };

    // Update the text with blanks
    setTextWithBlanks(updatedQuestion.text);

    // Select the new blank
    setSelectedBlankId(newBlank.id);

    // Update the question
    onChange(updatedQuestion);
  };

  // Remove a blank
  const handleRemoveBlank = (blankId: string) => {
    // Remove the blank from the question
    const updatedQuestion = {
      ...question,
      blanks: question.blanks.filter(b => b.id !== blankId),
      text: textWithBlanks.replace(`{{${blankId}}}`, '')
    };

    // Update the text with blanks
    setTextWithBlanks(updatedQuestion.text);

    // Clear the selected blank if it was removed
    if (selectedBlankId === blankId) {
      setSelectedBlankId(null);
    }

    // Update the question
    onChange(updatedQuestion);
  };

  // Update a blank
  const handleBlankChange = (blankId: string, updates: Partial<FillInTheBlanksBlank>) => {
    // Update the blank in the question
    const updatedQuestion = {
      ...question,
      blanks: question.blanks.map(b =>
        b.id === blankId ? { ...b, ...updates } : b
      )
    };

    // Update the question
    onChange(updatedQuestion);
  };

  // Parse the text to separate text and blanks
  const parts = parseTextWithBlanks(textWithBlanks);

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
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Text with Blanks</label>
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          Use <code>{'{{blankId}}'}</code> to mark blanks. You can also add blanks using the "Add Blank" button below.
        </div>
        <textarea
          value={textWithBlanks}
          onChange={handleTextChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
          rows={isMobile ? 4 : 3}
        />
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium text-gray-700 dark:text-gray-300">Preview</label>
          <ActivityButton
            onClick={handleAddBlank}
            variant="secondary"
            icon="plus"
            className="text-sm py-1"
          >
            Add Blank
          </ActivityButton>
        </div>

        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          {parts.map((part, partIndex) => {
            if (part.type === 'text') {
              return <span key={partIndex}>{part.content}</span>;
            } else {
              // This is a blank
              const blankId = part.content;
              const blank = question.blanks.find(b => b.id === blankId);

              if (!blank) return null;

              const blankIndex = question.blanks.findIndex(b => b.id === blankId);
              const isSelected = selectedBlankId === blankId;

              return (
                <button
                  key={partIndex}
                  className={cn(
                    "inline-block mx-1 px-2 py-1 border rounded text-center transition-colors",
                    isSelected
                      ? "border-primary-green bg-light-mint/20 dark:bg-primary-green/20"
                      : "border-gray-400 bg-gray-100 dark:bg-gray-800",
                    lastAddedBlankId === blankId && "animate-pulse"
                  )}
                  onClick={() => setSelectedBlankId(isSelected ? null : blankId)}
                >
                  ___({blankIndex + 1})___
                </button>
              );
            }
          })}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id={`partial-credit-${question.id}`}
            checked={question.partialCredit || false}
            onChange={handlePartialCreditChange}
            className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
          />
          <label htmlFor={`partial-credit-${question.id}`} className="text-gray-700 dark:text-gray-300">Allow Partial Credit for this Question</label>
        </div>
      </div>

      {/* Blank Editor */}
      {selectedBlankId && (
        <div className="mb-3 p-3 border border-primary-green/50 dark:border-primary-green/30 rounded bg-light-mint/10 dark:bg-primary-green/10">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-primary-green dark:text-medium-teal">Edit Blank</h4>
            <ActivityButton
              onClick={() => handleRemoveBlank(selectedBlankId)}
              variant="danger"
              icon="trash"
              className="text-sm py-1"
            >
              Remove Blank
            </ActivityButton>
          </div>

          {question.blanks.find(b => b.id === selectedBlankId) && (
            <BlankEditor
              blank={question.blanks.find(b => b.id === selectedBlankId)!}
              onChange={(updates) => handleBlankChange(selectedBlankId, updates)}
              caseSensitiveByDefault={caseSensitiveByDefault}
            />
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Explanation</label>
        <textarea
          value={question.explanation || ''}
          onChange={handleExplanationChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
          rows={isMobile ? 3 : 2}
          placeholder="Explain the correct answers"
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

// Blank Editor Component
interface BlankEditorProps {
  blank: FillInTheBlanksBlank;
  onChange: (updates: Partial<FillInTheBlanksBlank>) => void;
  caseSensitiveByDefault?: boolean;
}

const BlankEditor: React.FC<BlankEditorProps> = ({
  blank,
  onChange,
  caseSensitiveByDefault
}) => {
  // Handle correct answers change
  const handleCorrectAnswersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Split by commas or newlines
    const answers = e.target.value
      .split(/[,\n]/)
      .map(answer => answer.trim())
      .filter(answer => answer !== '');

    onChange({ correctAnswers: answers });
  };

  // Handle case sensitivity change
  const handleCaseSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ caseSensitive: e.target.checked });
  };

  // Handle feedback change
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ feedback: e.target.value });
  };

  // Handle size change
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ size: parseInt(e.target.value) || undefined });
  };

  return (
    <div>
      <div className="mb-2">
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Correct Answers (one per line or comma-separated)</label>
        <textarea
          value={blank.correctAnswers.join('\n')}
          onChange={handleCorrectAnswersChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
          rows={2}
          placeholder="Enter correct answers"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Feedback</label>
        <textarea
          value={blank.feedback || ''}
          onChange={handleFeedbackChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
          rows={2}
          placeholder="Feedback for this blank"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="mb-2">
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Size (characters)</label>
          <input
            type="number"
            value={blank.size || ''}
            onChange={handleSizeChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-target transition-all duration-200 focus:border-primary-green focus:ring-1 focus:ring-primary-green"
            placeholder="Auto"
            min={1}
          />
        </div>

        <div className="mb-2 flex items-center">
          <input
            type="checkbox"
            id={`case-sensitive-${blank.id}`}
            checked={blank.caseSensitive !== undefined ? blank.caseSensitive : caseSensitiveByDefault}
            onChange={handleCaseSensitivityChange}
            className="mr-2 accent-primary-green dark:accent-medium-teal w-5 h-5 touch-target transition-transform duration-200 hover:scale-110"
          />
          <label htmlFor={`case-sensitive-${blank.id}`} className="text-gray-700 dark:text-gray-300">Case Sensitive</label>
        </div>
      </div>
    </div>
  );
};

export default FillInTheBlanksEditor;
