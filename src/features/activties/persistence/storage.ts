'use client';

import { ActivityState } from './types';

// Prefix for all activity state keys in storage
const STORAGE_PREFIX = 'activity_state_';

/**
 * Persist activity state to storage
 * @param key Unique identifier for the activity state
 * @param state Activity state to persist
 * @param storage Storage to use (defaults to localStorage if available)
 */
export function persistState<T>(
  key: string,
  state: ActivityState<T>,
  storage?: Storage | null
): boolean {
  // Use provided storage or try to use localStorage if available
  const storageToUse = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!storageToUse) return false;

  try {
    // Create a sanitized copy of the state for storage
    // Remove large or unnecessary properties
    const stateForStorage = {
      ...state,
      // Keep activity data but remove large media or unnecessary fields
      activity: sanitizeActivityForStorage(state.activity),
    };

    // Serialize and store
    const serialized = JSON.stringify(stateForStorage);
    storageToUse.setItem(`${STORAGE_PREFIX}${key}`, serialized);
    return true;
  } catch (error) {
    console.error('Failed to persist activity state:', error);
    return false;
  }
}

/**
 * Load persisted activity state from storage
 * @param key Unique identifier for the activity state
 * @param storage Storage to use (defaults to localStorage)
 */
export function loadPersistedState<T>(
  key: string,
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null
): ActivityState<T> | null {
  if (!storage) return null;

  try {
    const serialized = storage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!serialized) return null;

    return JSON.parse(serialized) as ActivityState<T>;
  } catch (error) {
    console.error('Failed to load persisted activity state:', error);
    return null;
  }
}

/**
 * Clear persisted activity state from storage
 * @param key Unique identifier for the activity state
 * @param storage Storage to use (defaults to localStorage)
 */
export function clearPersistedState(
  key: string,
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null
): boolean {
  if (!storage) return false;

  try {
    storage.removeItem(`${STORAGE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error('Failed to clear persisted activity state:', error);
    return false;
  }
}

/**
 * List all persisted activity state keys
 * @param storage Storage to use (defaults to localStorage)
 */
export function listPersistedStates(
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null
): string[] {
  if (!storage) return [];

  try {
    const keys: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key.substring(STORAGE_PREFIX.length));
      }
    }

    return keys;
  } catch (error) {
    console.error('Failed to list persisted activity states:', error);
    return [];
  }
}

/**
 * Sanitize activity data for storage
 * Removes large media or unnecessary fields
 * @param activity Activity data to sanitize
 */
function sanitizeActivityForStorage<T>(activity: T): T {
  if (!activity) return activity;

  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(activity));

  // Remove large media fields if present
  if (typeof sanitized === 'object') {
    // Remove large media fields from questions if present
    if (Array.isArray(sanitized.questions)) {
      sanitized.questions = sanitized.questions.map((question: any) => {
        // Keep essential data but remove large media
        if (question.media && question.media.url) {
          // Keep media metadata but remove actual content
          question.media = {
            type: question.media.type,
            url: question.media.url,
            // Remove base64 content if present
            content: undefined
          };
        }
        return question;
      });
    }
  }

  return sanitized;
}
