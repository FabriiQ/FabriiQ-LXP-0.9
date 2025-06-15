import { CanvasArtifact as CanvasArtifactBase } from './types';

// Extend the base CanvasArtifact interface to add storage-specific properties
export interface CanvasArtifact extends CanvasArtifactBase {
  contentStoredInIndexedDB?: boolean; // Flag for storage location
}

/**
 * Storage service for Canvas artifacts using IndexedDB for large content
 * and localStorage for metadata and smaller artifacts
 */
export class ArtifactStorage {
  private static instance: ArtifactStorage;
  private dbName = 'canvas-artifacts-db';
  private dbVersion = 1;
  private storeName = 'artifacts';
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private constructor() {
    // Initialize the database
    this.initDatabase();
  }

  public static getInstance(): ArtifactStorage {
    if (!ArtifactStorage.instance) {
      ArtifactStorage.instance = new ArtifactStorage();
    }
    return ArtifactStorage.instance;
  }

  /**
   * Initialize the IndexedDB database
   */
  private initDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for artifacts
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('canvasId', 'canvasId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Save an artifact to storage
   * Uses IndexedDB for large content and localStorage for metadata
   */
  public async saveArtifact(canvasId: string, artifact: CanvasArtifact): Promise<void> {
    try {
      // Determine if the artifact content is large
      const isLarge = this.isLargeContent(artifact.content);

      if (isLarge) {
        // For large content, store in IndexedDB
        await this.saveToIndexedDB(canvasId, artifact);

        // Store metadata and reference in localStorage
        this.saveMetadataToLocalStorage(canvasId, artifact);
      } else {
        // For small content, store everything in localStorage
        this.saveToLocalStorage(canvasId, artifact);
      }
    } catch (error) {
      console.error('Error saving artifact:', error);
      throw error;
    }
  }

  /**
   * Load an artifact from storage
   */
  public async loadArtifact(canvasId: string, artifactId: string): Promise<CanvasArtifact | null> {
    try {
      // First check localStorage for the artifact or its metadata
      const localData = this.loadFromLocalStorage(canvasId, artifactId);

      if (localData) {
        // If the content is stored in IndexedDB, load it from there
        if (localData.contentStoredInIndexedDB) {
          const content = await this.loadContentFromIndexedDB(artifactId);
          if (content !== null) {
            return {
              ...localData,
              content,
              contentStoredInIndexedDB: undefined,
            };
          }
        } else {
          // Content is in localStorage
          return localData;
        }
      }

      // If not found in localStorage, try IndexedDB directly
      return await this.loadFromIndexedDB(artifactId);
    } catch (error) {
      console.error('Error loading artifact:', error);
      return null;
    }
  }

  /**
   * Load all artifacts for a canvas
   */
  public async loadAllArtifacts(canvasId: string): Promise<CanvasArtifact[]> {
    try {
      // First load metadata from localStorage
      const metadataList = this.loadAllFromLocalStorage(canvasId);

      // For artifacts with content in IndexedDB, load the content
      const artifacts = await Promise.all(
        metadataList.map(async (artifact) => {
          if (artifact.contentStoredInIndexedDB) {
            const content = await this.loadContentFromIndexedDB(artifact.id);
            if (content !== null) {
              return {
                ...artifact,
                content,
                contentStoredInIndexedDB: undefined,
              };
            }
          }
          return artifact;
        })
      );

      // Also load any artifacts that might only be in IndexedDB
      const indexedDBOnlyArtifacts = await this.loadAllFromIndexedDB(canvasId);

      // Merge the two lists, avoiding duplicates
      const artifactMap = new Map<string, CanvasArtifact>();

      // Add artifacts from localStorage first
      artifacts.forEach(artifact => {
        artifactMap.set(artifact.id, artifact);
      });

      // Add artifacts from IndexedDB, overwriting if they exist in both
      indexedDBOnlyArtifacts.forEach(artifact => {
        if (!artifactMap.has(artifact.id)) {
          artifactMap.set(artifact.id, artifact);
        }
      });

      return Array.from(artifactMap.values());
    } catch (error) {
      console.error('Error loading all artifacts:', error);
      return [];
    }
  }

  /**
   * Delete an artifact from storage
   */
  public async deleteArtifact(canvasId: string, artifactId: string): Promise<void> {
    try {
      // Delete from localStorage
      this.deleteFromLocalStorage(canvasId, artifactId);

      // Delete from IndexedDB
      await this.deleteFromIndexedDB(artifactId);
    } catch (error) {
      console.error('Error deleting artifact:', error);
      throw error;
    }
  }

  /**
   * Clear all artifacts for a canvas
   */
  public async clearAllArtifacts(canvasId: string): Promise<void> {
    try {
      // Clear from localStorage
      this.clearAllFromLocalStorage(canvasId);

      // Clear from IndexedDB
      await this.clearAllFromIndexedDB(canvasId);
    } catch (error) {
      console.error('Error clearing all artifacts:', error);
      throw error;
    }
  }

  /**
   * Determine if content is large and should be stored in IndexedDB
   */
  private isLargeContent(content: any): boolean {
    if (typeof content === 'string') {
      return content.length > 50000; // ~50KB
    }

    if (typeof content === 'object' && content !== null) {
      try {
        const json = JSON.stringify(content);
        return json.length > 50000; // ~50KB
      } catch (error) {
        // If we can't stringify, assume it's large
        return true;
      }
    }

    return false;
  }

  /**
   * Save an artifact to IndexedDB
   */
  private async saveToIndexedDB(canvasId: string, artifact: CanvasArtifact): Promise<void> {
    const db = await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put({
        ...artifact,
        canvasId,
      });

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error saving to IndexedDB:', event);
        reject(new Error('Failed to save artifact to IndexedDB'));
      };
    });
  }

  /**
   * Load an artifact from IndexedDB
   */
  private async loadFromIndexedDB(artifactId: string): Promise<CanvasArtifact | null> {
    const db = await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.get(artifactId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = (event) => {
        console.error('Error loading from IndexedDB:', event);
        reject(new Error('Failed to load artifact from IndexedDB'));
      };
    });
  }

  /**
   * Load just the content of an artifact from IndexedDB
   */
  private async loadContentFromIndexedDB(artifactId: string): Promise<any | null> {
    const artifact = await this.loadFromIndexedDB(artifactId);
    return artifact ? artifact.content : null;
  }

  /**
   * Load all artifacts for a canvas from IndexedDB
   */
  private async loadAllFromIndexedDB(canvasId: string): Promise<CanvasArtifact[]> {
    const db = await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('canvasId');

      const request = index.getAll(canvasId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error('Error loading all from IndexedDB:', event);
        reject(new Error('Failed to load artifacts from IndexedDB'));
      };
    });
  }

  /**
   * Delete an artifact from IndexedDB
   */
  private async deleteFromIndexedDB(artifactId: string): Promise<void> {
    const db = await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(artifactId);

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error deleting from IndexedDB:', event);
        reject(new Error('Failed to delete artifact from IndexedDB'));
      };
    });
  }

  /**
   * Clear all artifacts for a canvas from IndexedDB
   */
  private async clearAllFromIndexedDB(canvasId: string): Promise<void> {
    const db = await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('canvasId');

      const request = index.openCursor(IDBKeyRange.only(canvasId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = (event) => {
        console.error('Error clearing all from IndexedDB:', event);
        reject(new Error('Failed to clear artifacts from IndexedDB'));
      };
    });
  }

  /**
   * Save metadata to localStorage
   */
  private saveMetadataToLocalStorage(canvasId: string, artifact: CanvasArtifact): void {
    try {
      // Create a metadata version of the artifact without the content
      const metadata = {
        ...artifact,
        content: null,
        contentStoredInIndexedDB: true,
      };

      // Get existing artifacts
      const key = `canvas-artifacts-${canvasId}`;
      const existingData = localStorage.getItem(key);
      const artifacts = existingData ? JSON.parse(existingData) : [];

      // Update or add the artifact
      const index = artifacts.findIndex((a: any) => a.id === artifact.id);
      if (index >= 0) {
        artifacts[index] = metadata;
      } else {
        artifacts.push(metadata);
      }

      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(artifacts));
    } catch (error) {
      console.error('Error saving metadata to localStorage:', error);
      // Continue even if localStorage fails
    }
  }

  /**
   * Save an artifact to localStorage
   */
  private saveToLocalStorage(canvasId: string, artifact: CanvasArtifact): void {
    try {
      // Get existing artifacts
      const key = `canvas-artifacts-${canvasId}`;
      const existingData = localStorage.getItem(key);
      const artifacts = existingData ? JSON.parse(existingData) : [];

      // Update or add the artifact
      const index = artifacts.findIndex((a: any) => a.id === artifact.id);
      if (index >= 0) {
        artifacts[index] = artifact;
      } else {
        artifacts.push(artifact);
      }

      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(artifacts));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      // Continue even if localStorage fails
    }
  }

  /**
   * Load an artifact from localStorage
   */
  private loadFromLocalStorage(canvasId: string, artifactId: string): CanvasArtifact | null {
    try {
      const key = `canvas-artifacts-${canvasId}`;
      const data = localStorage.getItem(key);
      if (!data) return null;

      const artifacts = JSON.parse(data);
      return artifacts.find((a: any) => a.id === artifactId) || null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  /**
   * Load all artifacts from localStorage
   */
  private loadAllFromLocalStorage(canvasId: string): CanvasArtifact[] {
    try {
      const key = `canvas-artifacts-${canvasId}`;
      const data = localStorage.getItem(key);
      if (!data) return [];

      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading all from localStorage:', error);
      return [];
    }
  }

  /**
   * Delete an artifact from localStorage
   */
  private deleteFromLocalStorage(canvasId: string, artifactId: string): void {
    try {
      const key = `canvas-artifacts-${canvasId}`;
      const data = localStorage.getItem(key);
      if (!data) return;

      const artifacts = JSON.parse(data);
      const filteredArtifacts = artifacts.filter((a: any) => a.id !== artifactId);

      localStorage.setItem(key, JSON.stringify(filteredArtifacts));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }

  /**
   * Clear all artifacts for a canvas from localStorage
   */
  private clearAllFromLocalStorage(canvasId: string): void {
    try {
      const key = `canvas-artifacts-${canvasId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing all from localStorage:', error);
    }
  }
}
