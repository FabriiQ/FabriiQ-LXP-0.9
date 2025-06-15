'use client';

/**
 * Client-side storage utilities for the AI Content Studio
 * Provides localStorage and IndexedDB storage for generated content
 */

// Define storage keys
const STORAGE_KEYS = {
  GENERATED_CONTENT: 'ai-content-studio:generated-content',
  CONTENT_HISTORY: 'ai-content-studio:content-history',
  DRAFT_CONTENT: 'ai-content-studio:draft-content',
};

// Define storage expiration times
const EXPIRATION = {
  GENERATED_CONTENT: 24 * 60 * 60 * 1000, // 24 hours
  CONTENT_HISTORY: 7 * 24 * 60 * 60 * 1000, // 7 days
  DRAFT_CONTENT: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Save generated content to localStorage
 * @param id Unique identifier for the content
 * @param content The content to save
 */
export const saveGeneratedContent = (id: string, content: any): void => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.GENERATED_CONTENT}:${id}`, JSON.stringify({
      content,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    // Handle storage quota exceeded or other errors
  }
};

/**
 * Get content from localStorage with expiration check
 * @param id Unique identifier for the content
 * @param maxAge Maximum age of the content in milliseconds
 * @returns The stored content or null if not found or expired
 */
export const getStoredContent = (id: string, maxAge = EXPIRATION.GENERATED_CONTENT): any => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEYS.GENERATED_CONTENT}:${id}`);
    if (!stored) return null;
    
    const { content, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem(`${STORAGE_KEYS.GENERATED_CONTENT}:${id}`);
      return null;
    }
    
    return content;
  } catch (error) {
    console.error('Failed to retrieve from localStorage:', error);
    return null;
  }
};

/**
 * Save a draft of content being edited
 * @param id Unique identifier for the content
 * @param content The content to save
 */
export const saveDraftContent = (id: string, content: any): void => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.DRAFT_CONTENT}:${id}`, JSON.stringify({
      content,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
  }
};

/**
 * Get a draft of content being edited
 * @param id Unique identifier for the content
 * @returns The stored draft content or null if not found
 */
export const getDraftContent = (id: string): any => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEYS.DRAFT_CONTENT}:${id}`);
    if (!stored) return null;
    
    const { content, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp > EXPIRATION.DRAFT_CONTENT) {
      localStorage.removeItem(`${STORAGE_KEYS.DRAFT_CONTENT}:${id}`);
      return null;
    }
    
    return content;
  } catch (error) {
    console.error('Failed to retrieve draft from localStorage:', error);
    return null;
  }
};

/**
 * Add content to history
 * @param content The content to add to history
 */
export const addToContentHistory = (content: any): void => {
  try {
    // Get existing history
    const historyStr = localStorage.getItem(STORAGE_KEYS.CONTENT_HISTORY);
    const history = historyStr ? JSON.parse(historyStr) : [];
    
    // Add new content to history (limit to 10 items)
    const newHistory = [
      {
        content,
        timestamp: Date.now()
      },
      ...history
    ].slice(0, 10);
    
    // Save updated history
    localStorage.setItem(STORAGE_KEYS.CONTENT_HISTORY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to add to content history:', error);
  }
};

/**
 * Get content history
 * @returns Array of content history items
 */
export const getContentHistory = (): any[] => {
  try {
    const historyStr = localStorage.getItem(STORAGE_KEYS.CONTENT_HISTORY);
    if (!historyStr) return [];
    
    const history = JSON.parse(historyStr);
    
    // Filter out expired items
    const validHistory = history.filter((item: any) => 
      Date.now() - item.timestamp <= EXPIRATION.CONTENT_HISTORY
    );
    
    // Update storage if items were filtered out
    if (validHistory.length !== history.length) {
      localStorage.setItem(STORAGE_KEYS.CONTENT_HISTORY, JSON.stringify(validHistory));
    }
    
    return validHistory.map((item: any) => item.content);
  } catch (error) {
    console.error('Failed to retrieve content history:', error);
    return [];
  }
};

/**
 * Clear all stored content
 */
export const clearAllStoredContent = (): void => {
  try {
    // Get all keys in localStorage
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith(STORAGE_KEYS.GENERATED_CONTENT) ||
        key.startsWith(STORAGE_KEYS.DRAFT_CONTENT) ||
        key === STORAGE_KEYS.CONTENT_HISTORY
      )) {
        keys.push(key);
      }
    }
    
    // Remove all keys
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear stored content:', error);
  }
};
