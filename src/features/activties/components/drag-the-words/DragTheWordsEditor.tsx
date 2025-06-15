'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DragTheWordsActivity, DragTheWordsQuestion, DraggableWord, createDefaultDragTheWordsActivity, createDefaultDragTheWordsQuestion, parseTextWithPlaceholders, createDraggableWordsFromText } from '../../models/drag-the-words';
import { ActivityButton } from '../ui/ActivityButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { MediaUploader } from '../ui/MediaUploader';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Edit, Eye } from 'lucide-react';

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

export interface DragTheWordsEditorProps {
  activity?: DragTheWordsActivity;
  onChange?: (activity: DragTheWordsActivity) => void;
  onSave?: (activity: DragTheWordsActivity) => void;
  className?: string;
}

/**
 * Drag the Words Activity Editor
 *
 * This component provides an interface for creating and editing drag the words activities.
 * It includes:
 * - Activity metadata editing
 * - Question editing with text and placeholders
 * - Word management
 * - Settings configuration
 * - Accessibility features
 */
// Add CSS keyframes for animations
const addAnimationStyles = () => {
  if (typeof document !== 'undefined') {
    // Check if styles already exist
    if (!document.getElementById('drag-the-words-editor-animations')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'drag-the-words-editor-animations';
      styleEl.textContent = `
        @keyframes word-fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .word-fade-in {
          animation: word-fade-in 0.5s ease-out forwards;
        }

        @keyframes word-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); background-color: rgba(216, 227, 224, 0.5); }
          100% { transform: scale(1); }
        }

        .word-pulse {
          animation: word-pulse 0.6s ease-in-out;
        }

        @keyframes highlight-text {
          0% { background-color: transparent; }
          30% { background-color: rgba(90, 138, 132, 0.2); }
          100% { background-color: transparent; }
        }

        .highlight-text {
          animation: highlight-text 1.5s ease-in-out;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }
};

export const DragTheWordsEditor: React.FC<DragTheWordsEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Add animation styles on component mount
  useEffect(() => {
    addAnimationStyles();
  }, []);

  // Initialize with default activity if none provided
  const [localActivity, setLocalActivity] = useState<DragTheWordsActivity>(
    activity || createDefaultDragTheWordsActivity()
  );

  // Current question being edited
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Preview mode for testing
  const [previewMode, setPreviewMode] = useState(false);

  // Animation states
  const [newWordAdded, setNewWordAdded] = useState(false);
  const [textHighlighted, setTextHighlighted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update local activity when prop changes
  useEffect(() => {
    if (activity) {
      setLocalActivity(activity);
    }
  }, [activity]);

  // Get current question
  const currentQuestion = localActivity.questions[currentQuestionIndex] || localActivity.questions[0];

  // Update activity with changes
  const updateActivity = (updates: Partial<DragTheWordsActivity>) => {
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
  const updateQuestion = (updates: Partial<DragTheWordsQuestion>) => {
    const updatedQuestions = [...localActivity.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      ...updates
    };

    updateActivity({ questions: updatedQuestions });
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion = createDefaultDragTheWordsQuestion();
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

  // Handle text with placeholders change
  const handleTextWithPlaceholdersChange = (text: string) => {
    // Extract words from the text
    const words = createDraggableWordsFromText(text);

    // Check if new words were added
    const previousWordCount = currentQuestion.words?.length || 0;
    const newWordCount = words.length;

    // Update the question
    updateQuestion({
      text,
      words
    });

    // Trigger animations if new words were added
    if (newWordCount > previousWordCount) {
      setNewWordAdded(true);
      setTextHighlighted(true);

      // Reset animation states after animation completes
      setTimeout(() => {
        setNewWordAdded(false);
      }, 600);

      setTimeout(() => {
        setTextHighlighted(false);
      }, 1500);
    }
  };

  // Handle word update
  const handleWordUpdate = (wordIndex: number, updates: Partial<DraggableWord>) => {
    const updatedWords = [...currentQuestion.words];
    updatedWords[wordIndex] = {
      ...updatedWords[wordIndex],
      ...updates
    };

    updateQuestion({ words: updatedWords });
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(localActivity);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setIsLoading(true);

    // Short delay to show loading state
    setTimeout(() => {
      setPreviewMode(!previewMode);
      setIsLoading(false);
    }, 300);
  };

  // Render the text with placeholders preview
  const renderTextWithPlaceholdersPreview = () => {
    const parts = parseTextWithPlaceholders(currentQuestion.text);

    if (isLoading) {
      return (
        <div className="mt-3 p-6 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-primary-green dark:text-medium-teal">Loading preview...</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(
        "mt-3 p-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
        { "highlight-text": textHighlighted }
      )}>
        {parts.map((part, partIndex) => {
          if (part.type === 'text') {
            return <span key={partIndex}>{part.content}</span>;
          } else {
            // This is a placeholder
            return (
              <span
                key={partIndex}
                className={cn(
                  "inline-block mx-1 px-2 py-1 bg-light-mint dark:bg-primary-green/20 text-primary-green dark:text-medium-teal border border-primary-green/30 dark:border-medium-teal/30 rounded",
                  { "word-pulse": newWordAdded && partIndex === parts.findIndex(p => p.type === 'placeholder') }
                )}
              >
                {part.content}
              </span>
            );
          }
        })}
      </div>
    );
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
                id="showWordBank"
                checked={localActivity.settings?.showWordBank !== false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    showWordBank: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="showWordBank" className="text-gray-700 dark:text-gray-300">
                Show Word Bank
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="highlightCorrectPositions"
                checked={localActivity.settings?.highlightCorrectPositions !== false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    highlightCorrectPositions: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="highlightCorrectPositions" className="text-gray-700 dark:text-gray-300">
                Highlight Correct Positions
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="caseSensitive"
                checked={localActivity.settings?.caseSensitive || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    caseSensitive: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="caseSensitive" className="text-gray-700 dark:text-gray-300">
                Case Sensitive
              </label>
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

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Attempts Allowed
              </label>
              <input
                type="number"
                min="1"
                value={localActivity.settings?.attemptsAllowed || 1}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    attemptsAllowed: parseInt(e.target.value)
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
                Question {index + 1}
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

        <div className="flex items-center">
          <ActivityButton
            onClick={togglePreview}
            variant="secondary"
            className="mr-2 flex items-center"
          >
            {previewMode ? (
              <>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </>
            )}
          </ActivityButton>

          <ActivityButton
            onClick={handleAddQuestion}
            variant="secondary"
            icon="plus"
          >
            Add Question
          </ActivityButton>
        </div>
      </div>

      {/* Question editor */}
      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
          Question {currentQuestionIndex + 1}
        </h3>

        {/* Text with placeholders */}
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <label className="font-medium text-gray-700 dark:text-gray-300">
              Text with Placeholders
            </label>
            <div className="ml-2 relative group">
              <div className="cursor-help text-primary-green dark:text-medium-teal">
                <Info className="h-4 w-4" />
              </div>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-64 z-10">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Use asterisks (*) to mark words that will be draggable.
                </p>
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <span className="text-gray-700 dark:text-gray-300">Example:</span>
                  <p className="mt-1 text-primary-green dark:text-medium-teal">
                    The *quick* *brown* fox jumps over the *lazy* dog.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={currentQuestion.text}
              onChange={(e) => handleTextWithPlaceholdersChange(e.target.value)}
              className={cn(
                "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                { "border-primary-green dark:border-medium-teal": textHighlighted }
              )}
              rows={4}
              placeholder="Enter your text here and use * to mark draggable words. Example: The *quick* *brown* fox jumps over the *lazy* dog."
            />

            {currentQuestion.words.length > 0 && (
              <div className="absolute right-3 top-3 bg-light-mint dark:bg-primary-green/20 text-primary-green dark:text-medium-teal px-2 py-1 rounded-full text-xs font-medium">
                {currentQuestion.words.length} {currentQuestion.words.length === 1 ? 'word' : 'words'} marked
              </div>
            )}
          </div>

          {/* Word creation guide */}
          <div className="mt-2 p-3 bg-light-mint/30 dark:bg-primary-green/10 rounded-md border border-light-mint dark:border-primary-green/20">
            <h4 className="text-sm font-medium text-primary-green dark:text-medium-teal mb-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Quick Tips
            </h4>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 ml-5 list-disc">
              <li>Use asterisks (*) to mark words that will be draggable</li>
              <li>Words will appear in a randomized order for students</li>
              <li>Keep phrases short for better mobile experience</li>
              <li>Add feedback for each word in the section below</li>
            </ul>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview:</label>
              {currentQuestion.words.length > 0 && (
                <div className="flex items-center text-xs text-primary-green dark:text-medium-teal">
                  <Check className="h-4 w-4 mr-1" />
                  Words will appear in the word bank
                </div>
              )}
            </div>
            {renderTextWithPlaceholdersPreview()}
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
            rows={2}
          />
        </div>

        {/* Points */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Points</label>
          <input
            type="number"
            min="1"
            value={currentQuestion.points || currentQuestion.words.length}
            onChange={(e) => updateQuestion({ points: parseInt(e.target.value) })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Words section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Draggable Words</h4>
            {currentQuestion.words.length > 0 && (
              <div className="text-sm text-primary-green dark:text-medium-teal">
                {currentQuestion.words.length} {currentQuestion.words.length === 1 ? 'word' : 'words'} available
              </div>
            )}
          </div>

          {/* Word bank preview */}
          {currentQuestion.words.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Word Bank Preview:</div>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.words.map((word, wordIndex) => (
                  <div
                    key={word.id}
                    className={cn(
                      "px-3 py-2 bg-light-mint dark:bg-primary-green/20 text-primary-green dark:text-medium-teal rounded-md border border-primary-green/30 dark:border-medium-teal/30 shadow-sm",
                      { "word-fade-in": newWordAdded && wordIndex === currentQuestion.words.length - 1 }
                    )}
                  >
                    {word.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentQuestion.words.map((word, wordIndex) => (
            <div
              key={word.id}
              className={cn(
                "mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-shadow",
                { "word-fade-in": newWordAdded && wordIndex === currentQuestion.words.length - 1 }
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-light-mint dark:bg-primary-green/20 flex items-center justify-center mr-3 text-primary-green dark:text-medium-teal font-medium">
                    {wordIndex + 1}
                  </div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">{word.text}</h5>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Feedback for Students
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      (Shown when this word is placed correctly)
                    </span>
                  </label>
                  <textarea
                    value={word.feedback || ''}
                    onChange={(e) => handleWordUpdate(wordIndex, { feedback: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder={`Great job! "${word.text}" is correctly placed.`}
                  />
                </div>
              </div>
            </div>
          ))}

          {currentQuestion.words.length === 0 && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-light-mint/50 dark:bg-primary-green/20 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-green dark:text-medium-teal">
                  <path d="M17 5H7V7"></path>
                  <path d="M7 19H17V17"></path>
                  <path d="M20 9H4V15H20V9Z"></path>
                  <path d="M12 9V15"></path>
                  <path d="M8 9V15"></path>
                  <path d="M16 9V15"></path>
                </svg>
              </div>
              <h5 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No Draggable Words Yet</h5>
              <p className="text-gray-600 dark:text-gray-300 mb-3 max-w-md mx-auto">
                Use asterisks (*) to mark words in your text that students will drag into place.
              </p>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 text-left max-w-md mx-auto">
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Example:</div>
                <div className="text-primary-green dark:text-medium-teal">
                  The <span className="bg-light-mint/30 dark:bg-primary-green/20 px-1 rounded">*quick*</span> <span className="bg-light-mint/30 dark:bg-primary-green/20 px-1 rounded">*brown*</span> fox jumps over the <span className="bg-light-mint/30 dark:bg-primary-green/20 px-1 rounded">*lazy*</span> dog.
                </div>
              </div>
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

export default DragTheWordsEditor;
