import { CanvasState, CanvasMessage, CanvasArtifact } from './types';

/**
 * Selectors for Canvas state
 * These functions help optimize performance by memoizing derived state
 */

/**
 * Get all messages from the canvas state
 */
export const selectMessages = (state: CanvasState): CanvasMessage[] => {
  return state.messages;
};

/**
 * Get the most recent message from the canvas state
 */
export const selectLatestMessage = (state: CanvasState): CanvasMessage | undefined => {
  return state.messages.length > 0 ? state.messages[state.messages.length - 1] : undefined;
};

/**
 * Get all messages from a specific role
 */
export const selectMessagesByRole = (state: CanvasState, role: CanvasMessage['role']): CanvasMessage[] => {
  return state.messages.filter(message => message.role === role);
};

/**
 * Get all artifacts from the canvas state
 */
export const selectArtifacts = (state: CanvasState): CanvasArtifact[] => {
  return state.artifacts;
};

/**
 * Get an artifact by ID
 */
export const selectArtifactById = (state: CanvasState, id: string): CanvasArtifact | undefined => {
  return state.artifacts.find(artifact => artifact.id === id);
};

/**
 * Get the selected artifact
 */
export const selectSelectedArtifact = (state: CanvasState): CanvasArtifact | undefined => {
  if (!state.selectedArtifactId) return undefined;
  return state.artifacts.find(artifact => artifact.id === state.selectedArtifactId);
};

/**
 * Get artifacts by type
 */
export const selectArtifactsByType = (state: CanvasState, type: CanvasArtifact['type']): CanvasArtifact[] => {
  return state.artifacts.filter(artifact => artifact.type === type);
};

/**
 * Get artifacts sorted by timestamp (newest first)
 */
export const selectArtifactsSortedByTimestamp = (state: CanvasState): CanvasArtifact[] => {
  return [...state.artifacts].sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Get artifacts with a specific parent ID
 */
export const selectArtifactsByParentId = (state: CanvasState, parentId: string): CanvasArtifact[] => {
  return state.artifacts.filter(artifact => artifact.parentId === parentId);
};

/**
 * Get a preference value from the canvas state
 */
export const selectPreference = <T>(state: CanvasState, key: string, defaultValue: T): T => {
  return (state.preferences[key] as T) ?? defaultValue;
};

/**
 * Get the highlighted content
 */
export const selectHighlightedContent = (state: CanvasState): string | null => {
  return state.highlightedContent;
};

/**
 * Get the canvas ID
 */
export const selectCanvasId = (state: CanvasState): string => {
  return state.canvasId;
};

/**
 * Get all threads
 */
export const selectThreads = (state: CanvasState) => {
  return state.threads;
};

/**
 * Get a thread by ID
 */
export const selectThreadById = (state: CanvasState, threadId: string) => {
  return state.threads[threadId];
};

/**
 * Get all root messages (messages that are not part of a thread or are thread roots)
 */
export const selectRootMessages = (state: CanvasState): CanvasMessage[] => {
  return state.messages.filter(message => !message.parentId);
};

/**
 * Get all messages in a thread
 */
export const selectThreadMessages = (state: CanvasState, threadId: string): CanvasMessage[] => {
  return state.messages.filter(message => message.threadId === threadId);
};

/**
 * Get the root message of a thread
 */
export const selectThreadRootMessage = (state: CanvasState, threadId: string): CanvasMessage | undefined => {
  const thread = state.threads[threadId];
  if (!thread) return undefined;
  return state.messages.find(message => message.id === thread.rootMessageId);
};

/**
 * Get all child messages of a parent message
 */
export const selectChildMessages = (state: CanvasState, parentId: string): CanvasMessage[] => {
  return state.messages.filter(message => message.parentId === parentId);
};

/**
 * Get all messages sorted in a hierarchical structure
 * This returns an array of root messages, each with a nested children array
 */
export const selectHierarchicalMessages = (state: CanvasState) => {
  // First, create a map of all messages by ID for quick lookup
  const messagesById = new Map(state.messages.map(message => [message.id, { ...message, children: [] }]));

  // Then, build the hierarchy
  const rootMessages: (CanvasMessage & { children: any[] })[] = [];

  // Process each message
  state.messages.forEach(message => {
    const messageWithChildren = messagesById.get(message.id)!;

    if (message.parentId) {
      // This is a child message, add it to its parent's children array
      const parent = messagesById.get(message.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(messageWithChildren);
      }
    } else {
      // This is a root message
      rootMessages.push(messageWithChildren);
    }
  });

  return rootMessages;
};
