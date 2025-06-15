'use client';

import React, { createContext, useReducer, useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { produce } from 'immer';
import {
  ActivityState,
  ActivityAction,
  ActivityActionType,
  ActivityContextType,
  ActivityProviderProps,
} from '../persistence/types';
import { persistState, loadPersistedState } from '../persistence/storage';
import { saveActivityState, getActivityState, saveActivityResult } from '../persistence/indexedDB';
import { isOnline, syncActivityResults, SyncStatus, addSyncListener, removeSyncListener } from '../persistence/syncManager';
import { DEFAULT_OFFLINE_CONFIG } from '../persistence/types';

// Create context with a default value
const ActivityContext = createContext<ActivityContextType | null>(null);

// Default state factory function
const createDefaultState = <T,>(activity: T): ActivityState<T> => ({
  activity,
  answers: Array.isArray(activity['questions']) ? new Array(activity['questions'].length).fill(null) : {},
  isSubmitted: false,
  isSubmitting: false,
  submitError: null,
  gradingResult: null,
  progress: 0,
  currentQuestionIndex: 0,
  timeRemaining: activity['timeLimit'] ? activity['timeLimit'] * 60 : null,
  timeElapsed: 0,
  isDirty: false,
  lastSaved: null,
  isOffline: false,
  pendingSync: false,
  isLoading: false,
  loadingError: null,
});

// Reducer function using Immer for immutable updates
const activityReducer = <T,>(state: ActivityState<T>, action: ActivityAction): ActivityState<T> => {
  return produce(state, draft => {
    switch (action.type) {
      case ActivityActionType.SET_ANSWER:
        if (draft.isSubmitted) return;

        const { questionIndex, answer } = action.payload;
        if (Array.isArray(draft.answers)) {
          draft.answers[questionIndex] = answer;
        } else if (typeof draft.answers === 'object') {
          draft.answers[questionIndex] = answer;
        }

        draft.isDirty = true;

        // Calculate progress if answers is an array
        if (Array.isArray(draft.answers)) {
          const answeredCount = draft.answers.filter(a => a !== null && a !== undefined).length;
          draft.progress = (answeredCount / draft.answers.length) * 100;
        }
        break;

      case ActivityActionType.SET_ANSWERS:
        if (draft.isSubmitted) return;
        
        draft.answers = action.payload;
        draft.isDirty = true;
        
        // Calculate progress if answers is an array
        if (Array.isArray(draft.answers)) {
          const answeredCount = draft.answers.filter(a => a !== null && a !== undefined).length;
          draft.progress = (answeredCount / draft.answers.length) * 100;
        }
        break;

      case ActivityActionType.CLEAR_ANSWERS:
        if (draft.isSubmitted) return;
        
        if (Array.isArray(draft.answers)) {
          draft.answers = new Array(draft.answers.length).fill(null);
        } else if (typeof draft.answers === 'object') {
          draft.answers = {};
        }
        
        draft.isDirty = true;
        draft.progress = 0;
        break;

      case ActivityActionType.SUBMIT:
        draft.isSubmitting = true;
        draft.submitError = null;
        break;

      case ActivityActionType.SUBMIT_SUCCESS:
        draft.isSubmitting = false;
        draft.isSubmitted = true;
        draft.gradingResult = action.payload;
        draft.isDirty = false;
        draft.progress = 100;
        break;

      case ActivityActionType.SUBMIT_ERROR:
        draft.isSubmitting = false;
        draft.submitError = action.payload;
        break;

      case ActivityActionType.SET_CURRENT_QUESTION:
        draft.currentQuestionIndex = action.payload;
        break;

      case ActivityActionType.NEXT_QUESTION:
        if (Array.isArray(draft.activity['questions']) && 
            draft.currentQuestionIndex < draft.activity['questions'].length - 1) {
          draft.currentQuestionIndex++;
        }
        break;

      case ActivityActionType.PREVIOUS_QUESTION:
        if (draft.currentQuestionIndex > 0) {
          draft.currentQuestionIndex--;
        }
        break;

      case ActivityActionType.SET_TIME_REMAINING:
        draft.timeRemaining = action.payload;
        break;

      case ActivityActionType.DECREMENT_TIME:
        if (draft.timeRemaining !== null && draft.timeRemaining > 0) {
          draft.timeRemaining--;
        }
        break;

      case ActivityActionType.SET_TIME_ELAPSED:
        draft.timeElapsed = action.payload;
        break;

      case ActivityActionType.SET_PROGRESS:
        draft.progress = action.payload;
        break;

      case ActivityActionType.MARK_DIRTY:
        draft.isDirty = true;
        break;

      case ActivityActionType.MARK_SAVED:
        draft.isDirty = false;
        draft.lastSaved = new Date().toISOString();
        break;

      case ActivityActionType.SET_OFFLINE:
        draft.isOffline = action.payload;
        break;

      case ActivityActionType.SET_PENDING_SYNC:
        draft.pendingSync = action.payload;
        break;

      case ActivityActionType.SET_LOADING:
        draft.isLoading = action.payload;
        break;

      case ActivityActionType.SET_LOADING_ERROR:
        draft.loadingError = action.payload;
        draft.isLoading = false;
        break;

      case ActivityActionType.RESET:
        // Reset to initial state but keep the activity
        const activity = draft.activity;
        Object.assign(draft, createDefaultState(activity));
        break;

      case ActivityActionType.CUSTOM:
        // Custom action for complex state updates
        if (action.payload && typeof action.payload.updateFn === 'function') {
          action.payload.updateFn(draft);
        }
        break;

      default:
        // For unknown actions, do nothing
        break;
    }
  });
};

/**
 * Provider component for activity state management
 */
export function ActivityStateProvider<T>({
  activity,
  children,
  initialState = {},
  onComplete,
  onProgress,
  persistenceKey,
  autoSave = false,
  offlineSupport = false,
  offlineConfig = {},
  onSyncStatusChange,
}: ActivityProviderProps<T>) {
  // Merge default offline config with provided config
  const mergedOfflineConfig = useMemo(() => ({
    ...DEFAULT_OFFLINE_CONFIG,
    ...offlineConfig,
    enabled: offlineSupport,
  }), [offlineConfig, offlineSupport]);

  // Create initial state by merging default state with provided initial state
  const getInitialState = useCallback(async () => {
    const defaultState = createDefaultState(activity);

    // States to merge
    let persistedState = {};
    let offlineState = {};

    // Load persisted state if persistence key is provided
    if (persistenceKey) {
      const loadedState = loadPersistedState(persistenceKey);
      if (loadedState) {
        persistedState = loadedState;
      }
    }

    // Load offline state if offline support is enabled
    if (mergedOfflineConfig.enabled && persistenceKey) {
      try {
        const loadedState = await getActivityState(persistenceKey);
        if (loadedState) {
          offlineState = loadedState;
        }
      } catch (error) {
        console.error('Failed to load activity state from IndexedDB:', error);
      }
    }

    // Merge states: default <- persisted <- offline <- initial
    return {
      ...defaultState,
      ...persistedState,
      ...offlineState,
      ...initialState,
      activity,
      // Set initial offline state based on navigator.onLine
      isOffline: mergedOfflineConfig.enabled ? !isOnline() : false,
      pendingSync: false
    };
  }, [activity, initialState, persistenceKey, mergedOfflineConfig]);

  // State for initial loading
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize reducer with a default state first
  const [state, dispatch] = useReducer(
    activityReducer,
    createDefaultState(activity)
  );

  // Load the actual initial state asynchronously
  useEffect(() => {
    let isMounted = true;

    const initializeState = async () => {
      try {
        const initialState = await getInitialState();

        if (isMounted) {
          // Dispatch action to set the initial state
          dispatch({
            type: ActivityActionType.CUSTOM,
            payload: {
              updateFn: (draft: any) => {
                // Copy all properties from initialState to draft
                Object.assign(draft, initialState);
              }
            }
          });

          setIsInitializing(false);
        }
      } catch (error) {
        console.error('Failed to initialize activity state:', error);
        setIsInitializing(false);
      }
    };

    initializeState();

    return () => {
      isMounted = false;
    };
  }, [getInitialState]);

  // Handle online/offline status
  useEffect(() => {
    if (!mergedOfflineConfig.enabled) return;

    const handleOnline = () => {
      dispatch({ type: ActivityActionType.SET_OFFLINE, payload: false });
      
      // Auto-sync if enabled
      if (mergedOfflineConfig.autoSync) {
        syncActivityResults();
      }
    };

    const handleOffline = () => {
      dispatch({ type: ActivityActionType.SET_OFFLINE, payload: true });
    };

    // Set initial offline state
    dispatch({ type: ActivityActionType.SET_OFFLINE, payload: !isOnline() });

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mergedOfflineConfig]);

  // Handle sync status changes
  useEffect(() => {
    if (!mergedOfflineConfig.enabled) return;

    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      dispatch({ 
        type: ActivityActionType.SET_PENDING_SYNC, 
        payload: status === SyncStatus.SYNCING 
      });

      if (onSyncStatusChange) {
        onSyncStatusChange(status, progress);
      }
    };

    // Add sync listener
    addSyncListener(handleSyncStatusChange);

    return () => {
      removeSyncListener(handleSyncStatusChange);
    };
  }, [mergedOfflineConfig, onSyncStatusChange]);

  // Auto-save state
  useEffect(() => {
    if (!autoSave || !persistenceKey || !state.isDirty || isInitializing) return;

    const saveStateToStorage = () => {
      // Save to localStorage
      persistState(persistenceKey, state);

      // Save to IndexedDB if offline support is enabled
      if (mergedOfflineConfig.enabled) {
        saveActivityState(persistenceKey, state).catch(error => {
          console.error('Failed to save activity state to IndexedDB:', error);
        });
      }

      // Mark as saved
      dispatch({ type: ActivityActionType.MARK_SAVED });
    };

    // Debounce save to avoid excessive writes
    const timeoutId = setTimeout(saveStateToStorage, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [state, autoSave, persistenceKey, mergedOfflineConfig, isInitializing]);

  // Report progress
  useEffect(() => {
    if (onProgress && !isInitializing) {
      onProgress(state.progress);
    }
  }, [state.progress, onProgress, isInitializing]);

  // Handle completion
  useEffect(() => {
    if (!state.gradingResult || !onComplete || isInitializing) return;

    // Call onComplete callback
    onComplete(state.gradingResult);

    // Save result to IndexedDB if offline
    if (state.isOffline && mergedOfflineConfig.enabled && persistenceKey) {
      const saveResult = async () => {
        try {
          const resultId = `${persistenceKey}_result`;
          const activityId = typeof state.activity === 'object' && state.activity !== null ? 
            (state.activity as any).id || persistenceKey : 
            persistenceKey;
          
          const userId = (state as any).userId || 'anonymous';
          const attemptId = (state as any).attemptId || `attempt_${Date.now()}`;

          await saveActivityResult(
            resultId,
            activityId,
            userId,
            attemptId,
            state.gradingResult,
            false // not synced
          );

          // Set pending sync
          dispatch({ type: ActivityActionType.SET_PENDING_SYNC, payload: true });

          // Try to sync if online
          if (isOnline() && mergedOfflineConfig.autoSync) {
            syncActivityResults();
          }
        } catch (error) {
          console.error('Failed to save result to IndexedDB:', error);
        }
      };

      saveResult();
    }
  }, [state.gradingResult, onComplete, mergedOfflineConfig, persistenceKey, state.isOffline, state.activity, isInitializing]);

  // Create context value
  const contextValue = useMemo<ActivityContextType>(() => ({
    state,
    dispatch,
    isInitializing,
  }), [state, isInitializing]);

  return (
    <ActivityContext.Provider value={contextValue}>
      {isInitializing ? (
        // Show loading state while initializing
        <div className="activity-loading">
          <div className="activity-loading-spinner"></div>
          <div className="activity-loading-text">Loading activity...</div>
        </div>
      ) : (
        // Show children once initialized
        children
      )}
    </ActivityContext.Provider>
  );
}

/**
 * Hook to use activity state in components
 */
export function useActivityState<T = any, A = any>() {
  const context = useContext(ActivityContext);

  if (!context) {
    throw new Error('useActivityState must be used within an ActivityStateProvider');
  }

  return context as ActivityContextType<T, A>;
}
