'use client';

import { useCallback } from 'react';
import { useActivityState } from '../state/ActivityStateProvider';
import { ActivityActionType, UseActivityResult } from '../persistence/types';
import { saveActivityState } from '../persistence/indexedDB';
import { syncActivityResults } from '../persistence/syncManager';

/**
 * Hook to use activity state with convenient action creators
 */
export function useActivity<T = any, A = any>(): UseActivityResult<T, A> {
  const { state, dispatch } = useActivityState<T, A>();

  // Answer actions
  const setAnswer = useCallback((questionIndex: number, answer: any) => {
    dispatch({
      type: ActivityActionType.SET_ANSWER,
      payload: { questionIndex, answer }
    });
  }, [dispatch]);

  const setAnswers = useCallback((answers: A) => {
    dispatch({
      type: ActivityActionType.SET_ANSWERS,
      payload: answers
    });
  }, [dispatch]);

  const clearAnswers = useCallback(() => {
    dispatch({ type: ActivityActionType.CLEAR_ANSWERS });
  }, [dispatch]);

  // Submission actions
  const submit = useCallback(() => {
    // Start submission
    dispatch({ type: ActivityActionType.SUBMIT });

    // In a real implementation, this would call an API to grade the activity
    // For now, we'll simulate a successful submission after a delay
    setTimeout(() => {
      // Create a simple grading result
      const result = {
        score: 100,
        maxScore: 100,
        percentage: 100,
        passed: true,
        feedback: 'Great job!',
        answers: state.answers,
        details: []
      };

      // Dispatch success action
      dispatch({
        type: ActivityActionType.SUBMIT_SUCCESS,
        payload: result
      });
    }, 1000);
  }, [dispatch, state.answers]);

  // Reset action
  const reset = useCallback(() => {
    dispatch({ type: ActivityActionType.RESET });
  }, [dispatch]);

  // Navigation actions
  const setCurrentQuestion = useCallback((index: number) => {
    dispatch({
      type: ActivityActionType.SET_CURRENT_QUESTION,
      payload: index
    });
  }, [dispatch]);

  const nextQuestion = useCallback(() => {
    dispatch({ type: ActivityActionType.NEXT_QUESTION });
  }, [dispatch]);

  const previousQuestion = useCallback(() => {
    dispatch({ type: ActivityActionType.PREVIOUS_QUESTION });
  }, [dispatch]);

  // Timer actions
  const setTimeRemaining = useCallback((time: number | null) => {
    dispatch({
      type: ActivityActionType.SET_TIME_REMAINING,
      payload: time
    });
  }, [dispatch]);

  // Progress actions
  const setProgress = useCallback((progress: number) => {
    dispatch({
      type: ActivityActionType.SET_PROGRESS,
      payload: progress
    });
  }, [dispatch]);

  // Persistence actions
  const save = useCallback(async () => {
    try {
      // Mark as saved in state
      dispatch({ type: ActivityActionType.MARK_SAVED });

      // If we have a persistence key in the state, save to IndexedDB
      const persistenceKey = (state as any).persistenceKey;
      if (persistenceKey) {
        await saveActivityState(persistenceKey, state);
      }

      // Return void to match the expected type
    } catch (error) {
      console.error('Failed to save activity state:', error);
      // Don't return false, just log the error to match Promise<void> return type
    }
  }, [dispatch, state]);

  // Sync results
  const syncResults = useCallback(async () => {
    if (state.isOffline || state.pendingSync) {
      await syncActivityResults(true);
    }
  }, [state.isOffline, state.pendingSync]);

  return {
    // State
    state,

    // Actions
    setAnswer,
    setAnswers,
    clearAnswers,
    submit,
    reset,

    // Navigation
    setCurrentQuestion,
    nextQuestion,
    previousQuestion,

    // Timer
    setTimeRemaining,

    // Progress
    setProgress,

    // Persistence
    save,

    // Offline
    isOffline: state.isOffline,
    syncResults,

    // Custom action
    dispatch,
  };
}
