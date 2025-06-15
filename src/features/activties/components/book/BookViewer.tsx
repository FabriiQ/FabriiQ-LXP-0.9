'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookActivity, BookSection, BookCheckpoint } from '../../models/book';
import { ReadingViewer } from '../reading/ReadingViewer';
import AnimatedSubmitButton from '../ui/AnimatedSubmitButton';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';

// Dynamic import for activity components
import dynamic from 'next/dynamic';

// Bookmark storage key prefix
const BOOKMARK_KEY_PREFIX = 'book_bookmark_';

// Define activity component mapping
const activityComponents: Record<string, any> = {
  'multiple_choice': dynamic(() => import('../multiple-choice/MultipleChoiceViewer')),
  'true_false': dynamic(() => import('../true-false/TrueFalseViewer')),
  'multiple_response': dynamic(() => import('../multiple-response/MultipleResponseViewer')),
  'fill_in_the_blanks': dynamic(() => import('../fill-in-the-blanks/FillInTheBlanksViewer')),
  'matching': dynamic(() => import('../matching/MatchingViewer')),
  'sequence': dynamic(() => import('../sequence/SequenceViewer')),
  'drag_and_drop': dynamic(() => import('../drag-and-drop/DragAndDropViewer')),
  'drag_the_words': dynamic(() => import('../drag-the-words/DragTheWordsViewer')),
  'numeric': dynamic(() => import('../numeric/NumericViewer')),
  'quiz': dynamic(() => import('../quiz/QuizViewer')),
};

export interface BookViewerProps {
  activity: BookActivity;
  mode?: 'student' | 'teacher';
  onComplete?: (result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

/**
 * Book Activity Viewer
 *
 * This component displays a book activity with:
 * - Rich text content in sections
 * - Interactive checkpoints that must be completed to progress
 * - Table of contents
 * - Text-to-speech functionality
 * - Highlighting
 * - Notes
 * - Progress tracking
 * - Accessibility features for color-blind users
 */
export const BookViewer: React.FC<BookViewerProps> = ({
  activity,
  mode = 'student',
  onComplete,
  onProgress,
  className
}) => {
  // State for tracking current section and completion
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<Record<string, boolean>>({});
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<BookCheckpoint | null>(null);
  const [embeddedActivity, setEmbeddedActivity] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkpointResult, setCheckpointResult] = useState<any>(null);
  const [checkpointError, setCheckpointError] = useState<string | null>(null);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [hasBookmark, setHasBookmark] = useState(false);

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.learningActivityType);

  // Bookmark key for this activity
  const bookmarkKey = `${BOOKMARK_KEY_PREFIX}${activity.id}`;

  // Load bookmark on initial render
  useEffect(() => {
    const loadBookmark = () => {
      try {
        const bookmarkData = localStorage.getItem(bookmarkKey);
        if (bookmarkData) {
          const bookmark = JSON.parse(bookmarkData);
          setHasBookmark(true);
          setShowBookmarkDialog(true);
          return bookmark;
        }
      } catch (error) {
        console.error('Error loading bookmark:', error);
      }
      return null;
    };

    loadBookmark();
  }, [bookmarkKey]);

  // Current section
  const currentSection = activity.sections[currentSectionIndex];

  // Check if all required checkpoints in the current section are completed
  const canProceedToNextSection = () => {
    if (!currentSection.checkpoints || currentSection.checkpoints.length === 0) {
      return true;
    }

    return currentSection.checkpoints
      .filter(checkpoint => checkpoint.isRequired)
      .every(checkpoint => completedCheckpoints[checkpoint.id]);
  };

  // Load an activity for a checkpoint
  const loadCheckpointActivity = async (checkpoint: BookCheckpoint) => {
    setIsLoadingActivity(true);
    setCurrentCheckpoint(checkpoint);
    setCheckpointError(null);

    try {
      // In a real implementation, this would fetch the activity from an API
      // For now, we'll simulate loading with a timeout
      await new Promise(resolve => setTimeout(resolve, 500));

      // Set a placeholder activity for demonstration
      setEmbeddedActivity({
        id: checkpoint.activityId || 'placeholder-id',
        title: checkpoint.title,
        description: checkpoint.description || 'Complete this activity to continue',
        activityType: checkpoint.activityType.toLowerCase().replace(/_/g, '-'),
        learningActivityType: checkpoint.activityType,
        // Add other required properties based on the activity type
        questions: [
          {
            id: 'q1',
            text: 'Sample question for demonstration',
            options: [
              { id: 'o1', text: 'Option 1', isCorrect: true },
              { id: 'o2', text: 'Option 2', isCorrect: false },
              { id: 'o3', text: 'Option 3', isCorrect: false }
            ]
          }
        ]
      });

      // Track analytics
      analytics?.trackInteraction('checkpoint_start', {
        activityId: activity.id,
        checkpointId: checkpoint.id,
        embeddedActivityId: checkpoint.activityId,
        embeddedActivityType: checkpoint.activityType
      });
    } catch (error) {
      console.error('Failed to load checkpoint activity:', error);
      setCheckpointError('Failed to load activity. Please try again.');
      setEmbeddedActivity(null);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Handle checkpoint completion
  const handleCheckpointComplete = (checkpointId: string, result: any) => {
    // Mark checkpoint as completed
    setCompletedCheckpoints(prev => ({
      ...prev,
      [checkpointId]: true
    }));

    // Save the result
    setCheckpointResult(result);

    // Track analytics
    analytics?.trackInteraction('checkpoint_complete', {
      activityId: activity.id,
      checkpointId,
      result
    });

    // Show feedback briefly before closing
    setTimeout(() => {
      setCurrentCheckpoint(null);
      setEmbeddedActivity(null);
      setCheckpointResult(null);
    }, 2000);
  };

  // Calculate overall progress
  useEffect(() => {
    if (!onProgress) return;

    // Count total sections and checkpoints
    const totalSections = activity.sections.length;
    const totalRequiredCheckpoints = activity.sections.reduce(
      (count, section) => count + (section.checkpoints?.filter(c => c.isRequired).length || 0),
      0
    );
    const total = totalSections + totalRequiredCheckpoints;

    // Count completed sections (assuming we've completed all previous sections)
    const completedSections = currentSectionIndex;

    // Count completed checkpoints
    const completedRequiredCheckpoints = Object.keys(completedCheckpoints).length;

    // Calculate progress percentage
    const progress = total > 0 ? ((completedSections + completedRequiredCheckpoints) / total) * 100 : 0;

    onProgress(progress);
  }, [activity.sections, currentSectionIndex, completedCheckpoints, onProgress]);

  // Handle book completion
  const handleBookComplete = () => {
    setIsCompleted(true);

    // Track completion in analytics
    analytics?.trackEvent('activity_complete', {
      activityId: activity.id,
      activityType: activity.activityType,
      learningActivityType: activity.learningActivityType,
      sectionsCompleted: activity.sections.length,
      checkpointsCompleted: Object.keys(completedCheckpoints).length
    });

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete({
        completed: true,
        sectionsCompleted: activity.sections.length,
        checkpointsCompleted: Object.keys(completedCheckpoints).length
      });
    }
  };



  // Handle next section
  const handleNextSection = () => {
    if (currentSectionIndex < activity.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);

      // Track the interaction in analytics
      analytics?.trackInteraction('next_section', {
        activityId: activity.id,
        fromSection: currentSection.id,
        toSection: activity.sections[currentSectionIndex + 1]?.id || 'unknown'
      });
    }
  };

  // Handle previous section
  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);

      // Track the interaction in analytics
      analytics?.trackInteraction('previous_section', {
        activityId: activity.id,
        fromSection: currentSection.id,
        toSection: activity.sections[currentSectionIndex - 1]?.id || 'unknown'
      });
    }
  };

  // Render the embedded activity when a checkpoint is active
  const renderEmbeddedActivity = () => {
    if (!currentCheckpoint || !embeddedActivity) {
      return null;
    }

    // Get the appropriate component for the activity type
    const ActivityComponent = activityComponents[currentCheckpoint.activityType.toLowerCase()];

    // Check if this checkpoint is required to proceed
    const isRequired = currentCheckpoint.isRequired && activity.settings?.requireCheckpointCompletion;

    // Determine if the user can proceed to the next section
    const canProceedAfterCheckpoint = !isRequired || completedCheckpoints[currentCheckpoint.id];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentCheckpoint.title}</h3>
            <button
              onClick={() => {
                setCurrentCheckpoint(null);
                setEmbeddedActivity(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoadingActivity ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading activity...</p>
            </div>
          ) : checkpointError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Activity</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{checkpointError}</p>
              <button
                onClick={() => loadCheckpointActivity(currentCheckpoint)}
                className="px-4 py-2 bg-primary-green hover:bg-primary-green/90 text-white rounded-md"
              >
                Try Again
              </button>
            </div>
          ) : checkpointResult ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Activity Completed!</h4>
              <p className="text-gray-600 dark:text-gray-300">
                {checkpointResult.correct ? 'Great job! You answered correctly.' : 'Activity completed.'}
              </p>

              {/* Navigation buttons */}
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {currentSectionIndex > 0 && (
                  <button
                    onClick={() => {
                      handlePreviousSection();
                      setCurrentCheckpoint(null);
                      setEmbeddedActivity(null);
                      setCheckpointResult(null);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous Section
                  </button>
                )}

                {currentSectionIndex < activity.sections.length - 1 && (
                  <button
                    onClick={() => {
                      handleNextSection();
                      setCurrentCheckpoint(null);
                      setEmbeddedActivity(null);
                      setCheckpointResult(null);
                    }}
                    disabled={!canProceedAfterCheckpoint}
                    className={cn(
                      "px-4 py-2 rounded-md flex items-center",
                      canProceedAfterCheckpoint
                        ? "bg-primary-green hover:bg-primary-green/90 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Next Section
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCurrentCheckpoint(null);
                    setEmbeddedActivity(null);
                    setCheckpointResult(null);
                  }}
                  className="px-4 py-2 bg-light-mint hover:bg-light-mint/90 text-primary-green rounded-md"
                >
                  Continue Reading
                </button>
              </div>
            </div>
          ) : ActivityComponent ? (
            <div className="mb-4">
              <ActivityComponent
                activity={embeddedActivity}
                mode={mode}
                onComplete={(result: any) => handleCheckpointComplete(currentCheckpoint.id, result)}
              />
            </div>
          ) : (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-gray-800 dark:text-gray-200">
                Activity type {currentCheckpoint.activityType} is not supported yet.
              </p>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => {
                    setCurrentCheckpoint(null);
                    setEmbeddedActivity(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCheckpointComplete(currentCheckpoint.id, { completed: true })}
                  className="px-4 py-2 bg-primary-green hover:bg-primary-green/90 text-white rounded-md"
                >
                  Mark as Complete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Convert the Book activity to a Reading activity for the ReadingViewer
  const readingActivity = {
    ...activity,
    activityType: 'reading' as const,
    learningActivityType: 'READING',
  };

  // Save bookmark
  const saveBookmark = useCallback(() => {
    try {
      const bookmarkData = {
        sectionIndex: currentSectionIndex,
        completedCheckpoints,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(bookmarkKey, JSON.stringify(bookmarkData));
      setHasBookmark(true);

      // Track the interaction in analytics
      analytics?.trackInteraction('bookmark_saved', {
        activityId: activity.id,
        sectionIndex: currentSectionIndex,
        sectionId: currentSection.id
      });

      return true;
    } catch (error) {
      console.error('Error saving bookmark:', error);
      return false;
    }
  }, [activity.id, bookmarkKey, completedCheckpoints, currentSection?.id, currentSectionIndex, analytics]);

  // Load bookmark
  const loadBookmark = useCallback(() => {
    try {
      const bookmarkData = localStorage.getItem(bookmarkKey);
      if (bookmarkData) {
        const bookmark = JSON.parse(bookmarkData);
        setCurrentSectionIndex(bookmark.sectionIndex);
        setCompletedCheckpoints(bookmark.completedCheckpoints || {});
        setShowBookmarkDialog(false);

        // Track the interaction in analytics
        analytics?.trackInteraction('bookmark_loaded', {
          activityId: activity.id,
          sectionIndex: bookmark.sectionIndex,
          sectionId: activity.sections[bookmark.sectionIndex]?.id
        });

        return true;
      }
    } catch (error) {
      console.error('Error loading bookmark:', error);
    }
    return false;
  }, [activity.id, activity.sections, bookmarkKey, analytics]);

  // Clear bookmark
  const clearBookmark = useCallback(() => {
    try {
      localStorage.removeItem(bookmarkKey);
      setHasBookmark(false);
      setShowBookmarkDialog(false);

      // Track the interaction in analytics
      analytics?.trackInteraction('bookmark_cleared', {
        activityId: activity.id
      });

      return true;
    } catch (error) {
      console.error('Error clearing bookmark:', error);
      return false;
    }
  }, [activity.id, bookmarkKey, analytics]);

  // Auto-save bookmark when navigating between sections
  useEffect(() => {
    if (currentSection) {
      saveBookmark();
    }
  }, [currentSectionIndex, completedCheckpoints, saveBookmark, currentSection]);

  // Function to handle section navigation with checkpoint checks
  const handleSectionNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      // Check if all required checkpoints are completed before proceeding
      if (canProceedToNextSection()) {
        // Before proceeding to next section, check if there are any checkpoints that should be shown
        const nextSectionIndex = currentSectionIndex + 1;

        if (nextSectionIndex < activity.sections.length) {
          // First check if there are any checkpoints in the current section that haven't been completed
          // (even if they're not required)
          const anyIncompleteCheckpoint = currentSection.checkpoints?.find(
            checkpoint => !completedCheckpoints[checkpoint.id]
          );

          if (anyIncompleteCheckpoint) {
            // Show the checkpoint before moving to next section
            loadCheckpointActivity(anyIncompleteCheckpoint);
            return;
          }

          // If no incomplete checkpoints in current section, proceed to next section
          handleNextSection();

          // After moving to next section, check if there are any checkpoints in the new section
          // that should be shown immediately
          setTimeout(() => {
            const newSection = activity.sections[nextSectionIndex];
            if (newSection?.checkpoints && newSection.checkpoints.length > 0) {
              // Show the first checkpoint of the new section
              loadCheckpointActivity(newSection.checkpoints[0]);
            }
          }, 500); // Small delay to allow the section transition to complete
        } else {
          // If we're at the last section, just proceed normally
          handleNextSection();
        }
      } else {
        // If there are required checkpoints, show the first incomplete one
        const firstIncompleteCheckpoint = currentSection.checkpoints?.find(
          checkpoint => checkpoint.isRequired && !completedCheckpoints[checkpoint.id]
        );

        if (firstIncompleteCheckpoint) {
          loadCheckpointActivity(firstIncompleteCheckpoint);
        }
      }
    } else {
      handlePreviousSection();
    }
  };

  // Render bookmark dialog
  const renderBookmarkDialog = () => {
    if (!showBookmarkDialog) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Resume Reading?</h3>
            <button
              onClick={() => setShowBookmarkDialog(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You have a saved bookmark for this book. Would you like to continue where you left off?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => {
                setCurrentSectionIndex(0);
                setCompletedCheckpoints({});
                setShowBookmarkDialog(false);
                clearBookmark();
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-md order-2 sm:order-1"
            >
              Start from Beginning
            </button>
            <button
              onClick={loadBookmark}
              className="px-4 py-2 bg-primary-green hover:bg-primary-green/90 text-white rounded-md order-1 sm:order-2"
            >
              Continue Reading
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Bookmark dialog */}
      {renderBookmarkDialog()}

      {/* Bookmark button for top controls */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={saveBookmark}
          className="p-2 min-h-[44px] min-w-[44px] rounded flex items-center justify-center bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          aria-label="Bookmark this page"
          title="Bookmark this page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Use the ReadingViewer for the reading part */}
      <ReadingViewer
        activity={readingActivity}
        mode={mode}
        onProgress={onProgress}
        className="mb-8"
        submitButton={
          <AnimatedSubmitButton
            onClick={handleBookComplete}
            disabled={!canProceedToNextSection()}
            loading={false}
            submitted={isCompleted}
            className={cn(
              "px-4 py-2 rounded-md min-h-[44px] transition-all",
              canProceedToNextSection()
                ? "bg-primary-green hover:bg-primary-green/90 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            )}
          >
            {canProceedToNextSection()
              ? (isCompleted ? 'Book Completed' : 'Complete Book')
              : 'Complete All Checkpoints First'}
          </AnimatedSubmitButton>
        }
      />

      {/* Checkpoint indicators and navigation */}
      <div className="mb-8 p-4 border border-medium-teal/30 dark:border-medium-teal/20 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-primary-green dark:text-medium-teal mb-2 sm:mb-0">
            Section Checkpoints
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => handleSectionNavigation('prev')}
              disabled={currentSectionIndex === 0}
              className={cn(
                "p-2 min-h-[44px] min-w-[44px] rounded flex items-center justify-center",
                currentSectionIndex > 0
                  ? "bg-light-mint/70 dark:bg-primary-green/20 hover:bg-light-mint dark:hover:bg-primary-green/30 text-primary-green dark:text-medium-teal"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              )}
              aria-label="Previous section"
              title="Previous section"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => handleSectionNavigation('next')}
              disabled={currentSectionIndex === activity.sections.length - 1}
              className={cn(
                "p-2 min-h-[44px] min-w-[44px] rounded flex items-center justify-center",
                currentSectionIndex < activity.sections.length - 1
                  ? canProceedToNextSection()
                    ? "bg-primary-green hover:bg-primary-green/90 text-white"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              )}
              aria-label={canProceedToNextSection() ? "Next section" : "Complete checkpoints first"}
              title={canProceedToNextSection() ? "Next section" : "Complete checkpoints first"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {currentSection.checkpoints && currentSection.checkpoints.length > 0 ? (
          <div className="space-y-4">
            {currentSection.checkpoints.map(checkpoint => (
              <div
                key={checkpoint.id}
                className={cn(
                  "p-4 border rounded-lg transition-all",
                  completedCheckpoints[checkpoint.id]
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                    : "border-medium-teal/30 dark:border-medium-teal/20 bg-white dark:bg-gray-800 hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center flex-wrap">
                      {completedCheckpoints[checkpoint.id] && (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      )}
                      <span className="mr-2">{checkpoint.title}</span>
                      {checkpoint.isRequired && (
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </h4>
                    {checkpoint.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {checkpoint.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center mt-3 sm:mt-0">
                    {completedCheckpoints[checkpoint.id] ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center text-sm">
                        Completed
                      </span>
                    ) : (
                      <AnimatedSubmitButton
                        onClick={() => loadCheckpointActivity(checkpoint)}
                        loading={isLoadingActivity && currentCheckpoint?.id === checkpoint.id}
                        submitted={false}
                        className="w-full sm:w-auto px-4 py-2 bg-primary-green hover:bg-primary-green/90 text-white rounded-md"
                      >
                        {checkpoint.isRequired ? 'Complete Required' : 'Try Activity'}
                      </AnimatedSubmitButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            No checkpoints in this section. You can proceed to the next section.
          </p>
        )}
      </div>

      {/* Render embedded activity when a checkpoint is active */}
      {renderEmbeddedActivity()}
    </ThemeWrapper>
  );
};

export default BookViewer;
