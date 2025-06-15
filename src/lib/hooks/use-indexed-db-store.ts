'use client';

import { useState, useCallback, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface IndexedDBStoreOptions {
  version?: number;
}

/**
 * Hook for using IndexedDB to store and retrieve data
 * @param dbName Name of the IndexedDB database
 * @param storeName Name of the object store
 * @param options Additional options
 * @returns Object with methods to interact with IndexedDB
 */
export function useIndexedDBStore(
  dbName: string,
  storeName: string,
  options: IndexedDBStoreOptions = {}
) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [db, setDb] = useState<IDBPDatabase | null>(null);

  // Initialize the database
  useEffect(() => {
    const initDB = async () => {
      try {
        setIsLoading(true);
        const database = await openDB(dbName, options.version || 1, {
          upgrade(db) {
            // Create the store if it doesn't exist
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          },
        });
        
        setDb(database);
        setError(null);
      } catch (err) {
        console.error('Error initializing IndexedDB:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    initDB();

    // Clean up function
    return () => {
      if (db) {
        db.close();
      }
    };
  }, [dbName, storeName, options.version]);

  // Get an item from the store
  const getItem = useCallback(
    async (key: string) => {
      if (!db) return null;
      
      try {
        return await db.get(storeName, key);
      } catch (err) {
        console.error('Error getting item from IndexedDB:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [db, storeName]
  );

  // Set an item in the store
  const setItem = useCallback(
    async (key: string, value: any) => {
      if (!db) return false;
      
      try {
        await db.put(storeName, { id: key, ...value });
        return true;
      } catch (err) {
        console.error('Error setting item in IndexedDB:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [db, storeName]
  );

  // Remove an item from the store
  const removeItem = useCallback(
    async (key: string) => {
      if (!db) return false;
      
      try {
        await db.delete(storeName, key);
        return true;
      } catch (err) {
        console.error('Error removing item from IndexedDB:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [db, storeName]
  );

  // Clear all items from the store
  const clear = useCallback(async () => {
    if (!db) return false;
    
    try {
      await db.clear(storeName);
      return true;
    } catch (err) {
      console.error('Error clearing IndexedDB store:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [db, storeName]);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    isLoading,
    error,
  };
}
