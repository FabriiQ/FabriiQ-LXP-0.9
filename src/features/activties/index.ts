'use client';

/**
 * Activities Module
 *
 * This is the main entry point for the activities module.
 * It exports all the components and utilities needed to work with activities.
 *
 * This module has been completely refactored to use a simpler, more maintainable
 * architecture with improved accessibility, analytics, and AI integration.
 */

// New simplified models
export * from './models/base';
export * from './models/multiple-choice';
export * from './models/true-false';
export * from './models/multiple-response';
export * from './models/fill-in-the-blanks';
export * from './models/matching';
export * from './models/drag-and-drop';
export * from './models/drag-the-words';
export * from './models/flash-cards';
export * from './models/numeric';
export * from './models/reading';
export * from './models/video';
export * from './models/book';
export * from './models/manual-grading';
// Export quiz model with explicit exports to avoid ambiguity
export type {
  QuizActivity,
  QuizQuestion,
  QuizQuestionType,
  QuizQuestionOption,
  QuizMatchingPair,
  QuizSequenceItem,
  QuizFillInTheBlankBlank
} from './models/quiz';
export { createDefaultQuizActivity } from './models/quiz';
// Explicitly re-export from sequence to avoid ambiguity with shuffleArray
export type {
  SequenceActivity,
  SequenceQuestion,
  SequenceItem
} from './models/sequence';

export {
  createDefaultSequenceActivity,
  createDefaultSequenceQuestion,
  createSequenceItem,
  countInversions,
  kendallTauDistance,
  // Use shuffleArray from sequence.ts as the canonical implementation
  shuffleArray
} from './models/sequence';

// New simplified components
export { SimpleActivityPreview } from './components/SimpleActivityPreview';
export { MultipleChoiceViewer } from './components/multiple-choice/MultipleChoiceViewer';
export { MultipleChoiceEditor } from './components/multiple-choice/MultipleChoiceEditor';
export { TrueFalseViewer } from './components/true-false/TrueFalseViewer';
export { TrueFalseEditor } from './components/true-false/TrueFalseEditor';
export { MultipleResponseViewer } from './components/multiple-response/MultipleResponseViewer';
export { MultipleResponseEditor } from './components/multiple-response/MultipleResponseEditor';
export { FillInTheBlanksViewer } from './components/fill-in-the-blanks/FillInTheBlanksViewer';
export { FillInTheBlanksEditor } from './components/fill-in-the-blanks/FillInTheBlanksEditor';
export { MatchingViewer } from './components/matching/MatchingViewer';
export { MatchingEditor } from './components/matching/MatchingEditor';
export { SequenceViewer } from './components/sequence/SequenceViewer';
export { SequenceEditor } from './components/sequence/SequenceEditor';
export { DragAndDropViewer } from './components/drag-and-drop/DragAndDropViewer';
export { DragAndDropEditor } from './components/drag-and-drop/DragAndDropEditor';
export { DragTheWordsViewer } from './components/drag-the-words/DragTheWordsViewer';
export { DragTheWordsEditor } from './components/drag-the-words/DragTheWordsEditor';
export { FlashCardsViewer } from './components/flash-cards/FlashCardsViewer';
export { FlashCardsEditor } from './components/flash-cards/FlashCardsEditor';
export { NumericViewer } from './components/numeric/NumericViewer';
export { NumericEditor } from './components/numeric/NumericEditor';
export { QuizViewer } from './components/quiz/QuizViewer';
export { QuizEditor } from './components/quiz/QuizEditor';
export { ReadingViewer } from './components/reading/ReadingViewer';
export { ReadingEditor } from './components/reading/ReadingEditor';
export { VideoViewer } from './components/video/VideoViewer';
export { VideoEditor } from './components/video/VideoEditor';
export { BookViewer } from './components/book/BookViewer';
export { BookEditor } from './components/book/BookEditor';
export { ManualGradingViewer } from './components/activity-viewers/ManualGradingViewer';
export { ManualGradingCreator } from './components/activity-creators/ManualGradingCreator';
export { ManualGradingGrader } from './components/grading/ManualGradingGrader';

// UI Components
export { ActivityButton, AnimatedSubmitButton } from './components/ui';
export { SelectableOption } from './components/ui/SelectableOption';
export { ProgressIndicator } from './components/ui/ProgressIndicator';
export { QuestionHint } from './components/ui/QuestionHint';
export { RichTextEditor } from './components/ui/RichTextEditor';
export { RichTextDisplay } from './components/ui/RichTextDisplay';
export { MediaUploader, type MediaItem } from './components/ui/MediaUploader';
export { MediaDisplay } from './components/ui/MediaDisplay';
export { JinaImageSearch } from './components/ui/JinaImageSearch';
export { MediaSelector } from './components/ui/MediaSelector';
export { AccessibilityTester } from './components/ui/AccessibilityTester';

// Reward Integration
export { ActivityCompletionHandler } from './components/reward-integration/ActivityCompletionHandler';

// Accessibility Testing
export {
  runAccessibilityTests,
  testImagesForAltText,
  testHeadingStructure,
  testColorContrast,
  testKeyboardAccessibility,
  type AccessibilityIssue
} from './utils/accessibility-tester';

// Activity Type Mapping
export {
  mapActivityTypeToId,
  getActivityTypeDisplayName
} from './utils/activity-type-mapper';

// AI Integration
export { convertAIContentToActivity } from './ai-integration/converter';
export { convertAIContentToTrueFalseActivity as convertAIContentToTrueFalse } from './ai-integration/true-false-converter';
export { convertAIContentToMultipleResponseActivity as convertAIContentToMultipleResponse } from './ai-integration/multiple-response-converter';
export { convertAIContentToFillInTheBlanksActivity as convertAIContentToFillInTheBlanks } from './ai-integration/fill-in-the-blanks-converter';
export { convertAIContentToMatchingActivity as convertAIContentToMatching } from './ai-integration/matching-converter';
export { convertAIContentToSequenceActivity as convertAIContentToSequence } from './ai-integration/sequence-converter';
export { convertAIContentToDragAndDropActivity as convertAIContentToDragAndDrop } from './ai-integration/drag-and-drop-converter';
export { convertAIContentToDragTheWordsActivity as convertAIContentToDragTheWords } from './ai-integration/drag-the-words-converter';
export { convertAIContentToFlashCardsActivity as convertAIContentToFlashCards } from './ai-integration/flash-cards-converter';
export { convertAIContentToNumericActivity as convertAIContentToNumeric } from './ai-integration/numeric-converter';
export { convertAIContentToQuizActivity as convertAIContentToQuiz } from './ai-integration/quiz-converter';
export { convertAIContentToReadingActivity as convertAIContentToReading } from './ai-integration/reading-converter';
export { convertAIContentToVideoActivity as convertAIContentToVideo } from './ai-integration/video-converter';
export { convertAIContentToBookActivity as convertAIContentToBook } from './ai-integration/book-converter';

// Grading
export { gradeMultipleChoiceActivity } from './grading/multiple-choice';
export { gradeTrueFalseActivity } from './grading/true-false';
export { gradeMultipleResponseActivity } from './grading/multiple-response';
export { gradeFillInTheBlanksActivity } from './grading/fill-in-the-blanks';
export { gradeMatchingActivity } from './grading/matching';
export { gradeSequenceActivity } from './grading/sequence';
export { gradeDragAndDropActivity } from './grading/drag-and-drop';
export { gradeDragTheWordsActivity } from './grading/drag-the-words';
export { gradeFlashCardsActivity } from './grading/flash-cards';
export { gradeNumericActivity } from './grading/numeric';
export { gradeQuizActivity } from './grading/quiz';
export { gradeBookActivity, isBookActivityGradable } from './grading/book';
export { gradeManualGradingActivity } from './grading/manual-grading';

// Analytics
export {
  default as analyticsManager,
  type AnalyticsEventType,
  type AnalyticsEventData,
  type AnalyticsProvider
} from './analytics/activity-analytics';
export { useActivityAnalytics } from './hooks/useActivityAnalytics';

// State Management
export { ActivityStateProvider, useActivityState } from './state';
export { useActivity } from './hooks';

// Offline Support
export { OfflineIndicator } from './components';
export {
  initOfflineSupport,
  isOnline,
  syncActivityResults,
  registerConnectivityListeners,
  SyncStatus
} from './persistence/syncManager';
export { useOfflineSupport, useOfflineAnalytics } from './hooks';
export {
  saveActivityState,
  getActivityState,
  saveActivityResult,
  getUnsyncedResults,
  markResultAsSynced,
  clearOldData
} from './persistence/indexedDB';
export {
  persistState,
  loadPersistedState,
  clearPersistedState
} from './persistence/storage';
export {
  DEFAULT_OFFLINE_CONFIG,
  OfflineStorageType
} from './persistence/types';
export type {
  OfflineConfig,
  ActivityState,
  ActivityAction,
  ActivityContextType,
  ActivityProviderProps,
  UseActivityResult
} from './persistence/types';

// Offline Analytics
export {
  trackOfflineModeEnter,
  trackOfflineModeExit,
  trackOfflineActivitySaved,
  trackOfflineActivityLoaded,
  trackOfflineSyncStart,
  trackOfflineSyncComplete,
  trackOfflineSyncError,
  trackOfflineStorageQuotaExceeded,
  trackOfflineStorageError
} from './analytics/offline-analytics';

// Export simplified activity content types
export interface ActivityContent {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  activityType: string;
  questions: any[];
  settings?: {
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    attemptsAllowed?: number;
    showFeedback?: boolean;
    passingScore?: number;
  };
  metadata?: {
    aiGenerated?: boolean;
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedTime?: number;
    keywords?: string[];
    learningObjectives?: string[];
  };
}

// Export activity registry
export { activityRegistry } from './registry';

// Initialize activity registry
import './registry/initialize';