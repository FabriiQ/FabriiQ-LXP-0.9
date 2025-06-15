/**
 * Types for the Canvas state management system
 */

export interface CanvasMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
  parentId?: string; // Reference to parent message for threading
  threadId?: string; // Thread identifier for grouping related messages
  isThreadRoot?: boolean; // Flag to identify the root message of a thread
  childrenIds?: string[]; // References to child messages for quick access
}

export interface CanvasArtifact {
  id: string;
  type: 'markdown' | 'code' | 'table' | 'image' | 'question' | 'worksheet' | 'assessment' | 'video' | 'math';
  content: any;
  timestamp: number;
  metadata?: Record<string, any>;
  parentId?: string; // For versioning/forking
  contentStoredInIndexedDB?: boolean; // Flag for storage location
}

export interface ThreadState {
  id: string;
  rootMessageId: string;
  collapsed: boolean;
  lastUpdated: number;
}

export interface CanvasState {
  canvasId: string;
  messages: CanvasMessage[];
  artifacts: CanvasArtifact[];
  highlightedContent: string | null;
  selectedArtifactId: string | null;
  preferences: Record<string, any>;
  threads: Record<string, ThreadState>; // Map of thread IDs to thread states
}

export type CanvasAction =
  | { type: 'HYDRATE_STATE'; payload: CanvasState }
  | { type: 'ADD_MESSAGE'; payload: CanvasMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'DELETE_MESSAGE'; payload: { id: string } }
  | { type: 'ADD_THREADED_MESSAGE'; payload: { parentId: string; message: Omit<CanvasMessage, 'id' | 'timestamp' | 'parentId' | 'threadId'> } }
  | { type: 'CREATE_THREAD'; payload: { rootMessage: Omit<CanvasMessage, 'id' | 'timestamp' | 'threadId' | 'isThreadRoot'> } }
  | { type: 'COLLAPSE_THREAD'; payload: { threadId: string; collapsed: boolean } }
  | { type: 'ADD_ARTIFACT'; payload: CanvasArtifact }
  | { type: 'UPDATE_ARTIFACT'; payload: { id: string; content: any } }
  | { type: 'DELETE_ARTIFACT'; payload: { id: string } }
  | { type: 'SET_HIGHLIGHTED_CONTENT'; payload: { content: string | null } }
  | { type: 'SET_SELECTED_ARTIFACT'; payload: { id: string | null } }
  | { type: 'SET_PREFERENCE'; payload: { key: string; value: any } }
  | { type: 'CLEAR_CANVAS' };
