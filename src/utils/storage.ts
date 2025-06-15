/**
 * Storage Utility
 * 
 * This utility provides a simple interface for storing and retrieving data
 * from localStorage with fallback to memory storage when localStorage is not available.
 */

// In-memory fallback storage
const memoryStorage = new Map<string, any>();

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get an item from storage
 * 
 * @param key The key to retrieve
 * @returns The stored value, or null if not found
 */
export const getItem = async (key: string): Promise<any> => {
  try {
    if (isLocalStorageAvailable()) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } else {
      return memoryStorage.get(key) || null;
    }
  } catch (error) {
    console.error('Error getting item from storage:', error);
    return null;
  }
};

/**
 * Set an item in storage
 * 
 * @param key The key to store
 * @param value The value to store
 */
export const setItem = async (key: string, value: any): Promise<void> => {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      memoryStorage.set(key, value);
    }
  } catch (error) {
    console.error('Error setting item in storage:', error);
  }
};

/**
 * Remove an item from storage
 * 
 * @param key The key to remove
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    } else {
      memoryStorage.delete(key);
    }
  } catch (error) {
    console.error('Error removing item from storage:', error);
  }
};

/**
 * Clear all items from storage
 */
export const clearStorage = async (): Promise<void> => {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.clear();
    } else {
      memoryStorage.clear();
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

/**
 * Get all keys in storage
 * 
 * @returns Array of keys
 */
export const getAllKeys = async (): Promise<string[]> => {
  try {
    if (isLocalStorageAvailable()) {
      return Object.keys(localStorage);
    } else {
      return Array.from(memoryStorage.keys());
    }
  } catch (error) {
    console.error('Error getting all keys from storage:', error);
    return [];
  }
};

/**
 * Check if a key exists in storage
 * 
 * @param key The key to check
 * @returns True if the key exists, false otherwise
 */
export const hasKey = async (key: string): Promise<boolean> => {
  try {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key) !== null;
    } else {
      return memoryStorage.has(key);
    }
  } catch (error) {
    console.error('Error checking if key exists in storage:', error);
    return false;
  }
};
