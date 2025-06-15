'use client';

/**
 * Types and constants for offline support
 */

// Offline storage types
export enum OfflineStorageType {
  ACTIVITY = 'activity',
  STATE = 'state',
  RESULT = 'result'
}

// Offline configuration
export interface OfflineConfig {
  enabled: boolean;
  autoSync: boolean;
  persistenceEnabled: boolean;
  maxOfflineDays: number;
}

// Default offline configuration
export const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  enabled: true,
  autoSync: true,
  persistenceEnabled: true,
  maxOfflineDays: 30
};

// Activity state interface
export interface ActivityState<T = any, A = any> {
  // Activity data
  activity: T;

  // User answers/responses
  answers: A;

  // Submission state
  isSubmitted: boolean;
  isSubmitting: boolean;
  submitError: string | null;

  // Grading state
  gradingResult: any | null;

  // Progress state
  progress: number; // 0-100

  // Navigation state
  currentQuestionIndex: number;

  // Timer state
  timeRemaining: number | null;
  timeElapsed: number;

  // Persistence state
  isDirty: boolean;
  lastSaved: string | null;

  // Offline state
  isOffline: boolean;
  pendingSync: boolean;

  // UI state
  isLoading: boolean;
  loadingError: string | null;
}

// Activity action types
export enum ActivityActionType {
  // Answer actions
  SET_ANSWER = 'SET_ANSWER',
  SET_ANSWERS = 'SET_ANSWERS',
  CLEAR_ANSWERS = 'CLEAR_ANSWERS',

  // Submission actions
  SUBMIT = 'SUBMIT',
  SUBMIT_SUCCESS = 'SUBMIT_SUCCESS',
  SUBMIT_ERROR = 'SUBMIT_ERROR',

  // Navigation actions
  SET_CURRENT_QUESTION = 'SET_CURRENT_QUESTION',
  NEXT_QUESTION = 'NEXT_QUESTION',
  PREVIOUS_QUESTION = 'PREVIOUS_QUESTION',

  // Timer actions
  SET_TIME_REMAINING = 'SET_TIME_REMAINING',
  DECREMENT_TIME = 'DECREMENT_TIME',
  SET_TIME_ELAPSED = 'SET_TIME_ELAPSED',

  // Progress actions
  SET_PROGRESS = 'SET_PROGRESS',

  // Persistence actions
  MARK_DIRTY = 'MARK_DIRTY',
  MARK_SAVED = 'MARK_SAVED',

  // Offline actions
  SET_OFFLINE = 'SET_OFFLINE',
  SET_PENDING_SYNC = 'SET_PENDING_SYNC',

  // Loading actions
  SET_LOADING = 'SET_LOADING',
  SET_LOADING_ERROR = 'SET_LOADING_ERROR',

  // Reset actions
  RESET = 'RESET',

  // Custom actions (for activity-specific actions)
  CUSTOM = 'CUSTOM',
}

// Activity action interface
export interface ActivityAction<T = any> {
  type: ActivityActionType | string;
  payload?: T;
}

// Activity context interface
export interface ActivityContextType<T = any, A = any> {
  state: ActivityState<T, A>;
  dispatch: React.Dispatch<ActivityAction>;
  isInitializing: boolean;
}

// Activity provider props
export interface ActivityProviderProps<T = any> {
  activity: T;
  children: React.ReactNode;
  initialState?: Partial<ActivityState<T, any>>;
  onComplete?: (result: any) => void;
  onProgress?: (progress: number) => void;
  persistenceKey?: string;
  autoSave?: boolean;
  offlineSupport?: boolean;
  offlineConfig?: Partial<OfflineConfig>;
  onSyncStatusChange?: (status: string, progress?: number) => void;
}

// Activity hook result
export interface UseActivityResult<T = any, A = any> {
  // State
  state: ActivityState<T, A>;

  // Actions
  setAnswer: (questionIndex: number, answer: any) => void;
  setAnswers: (answers: A) => void;
  clearAnswers: () => void;
  submit: () => void;
  reset: () => void;

  // Navigation
  setCurrentQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;

  // Timer
  setTimeRemaining: (time: number | null) => void;

  // Progress
  setProgress: (progress: number) => void;

  // Persistence
  save: () => Promise<void>;

  // Offline
  isOffline: boolean;
  syncResults: () => Promise<void>;

  // Custom action
  dispatch: React.Dispatch<ActivityAction>;
}
