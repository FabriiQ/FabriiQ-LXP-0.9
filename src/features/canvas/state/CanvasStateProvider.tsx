import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { CanvasMessage, CanvasArtifact, CanvasState, CanvasAction, ThreadState } from './types';
import { ArtifactStorage } from './artifactStorage';
import { CanvasApiService } from '../api/canvasApi';
import { useSession } from 'next-auth/react';
import { debounce } from 'lodash';
import * as selectors from './selectors';

// Define reducer inline to avoid import issues
const initialState: CanvasState = {
  canvasId: 'default-canvas',
  messages: [],
  artifacts: [],
  highlightedContent: null,
  selectedArtifactId: null,
  preferences: {},
  threads: {}, // Initialize empty threads map
};

const canvasReducer = (state: CanvasState, action: CanvasAction): CanvasState => {
  switch (action.type) {
    case 'HYDRATE_STATE':
      return action.payload;

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'UPDATE_MESSAGE': {
      const { id, content } = action.payload;
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === id ? { ...message, content } : message
        ),
      };
    }

    case 'DELETE_MESSAGE': {
      const { id } = action.payload;
      // Get the message to be deleted
      const messageToDelete = state.messages.find(msg => msg.id === id);

      if (!messageToDelete) {
        return state;
      }

      // If the message is part of a thread, we need to update the thread
      if (messageToDelete.threadId) {
        const threadId = messageToDelete.threadId;

        // If this is the root message of a thread, delete the entire thread
        if (messageToDelete.isThreadRoot) {
          // Get all messages in this thread
          const threadMessageIds = state.messages
            .filter(msg => msg.threadId === threadId)
            .map(msg => msg.id);

          // Remove all messages in the thread
          const updatedMessages = state.messages.filter(msg => !threadMessageIds.includes(msg.id));

          // Remove the thread from threads
          const { [threadId]: _, ...remainingThreads } = state.threads;

          return {
            ...state,
            messages: updatedMessages,
            threads: remainingThreads,
          };
        }

        // If it's a child message, update the parent's childrenIds
        if (messageToDelete.parentId) {
          const parentMessage = state.messages.find(msg => msg.id === messageToDelete.parentId);
          if (parentMessage && parentMessage.childrenIds) {
            const updatedParent = {
              ...parentMessage,
              childrenIds: parentMessage.childrenIds.filter(childId => childId !== id),
            };

            return {
              ...state,
              messages: state.messages
                .filter(msg => msg.id !== id)
                .map(msg => msg.id === parentMessage.id ? updatedParent : msg),
            };
          }
        }
      }

      // Simple case: just remove the message
      return {
        ...state,
        messages: state.messages.filter(message => message.id !== id),
      };
    }

    case 'CREATE_THREAD': {
      const { rootMessage } = action.payload;
      const threadId = `thread-${Date.now()}`;
      const messageId = `msg-${Date.now()}`;

      // Create the root message
      const newRootMessage: CanvasMessage = {
        ...rootMessage,
        id: messageId,
        timestamp: Date.now(),
        threadId,
        isThreadRoot: true,
        childrenIds: [],
      };

      // Create the thread state
      const newThread: ThreadState = {
        id: threadId,
        rootMessageId: messageId,
        collapsed: false,
        lastUpdated: Date.now(),
      };

      return {
        ...state,
        messages: [...state.messages, newRootMessage],
        threads: {
          ...state.threads,
          [threadId]: newThread,
        },
      };
    }

    case 'ADD_THREADED_MESSAGE': {
      const { parentId, message } = action.payload;
      const parentMessage = state.messages.find(msg => msg.id === parentId);

      if (!parentMessage) {
        return state;
      }

      const threadId = parentMessage.threadId || parentMessage.id;
      const messageId = `msg-${Date.now()}`;

      // Create the new message
      const newMessage: CanvasMessage = {
        ...message,
        id: messageId,
        timestamp: Date.now(),
        parentId,
        threadId,
      };

      // Update the parent's childrenIds
      const updatedParent = {
        ...parentMessage,
        childrenIds: [...(parentMessage.childrenIds || []), messageId],
      };

      // Update the thread's lastUpdated timestamp
      const updatedThreads = { ...state.threads };
      if (threadId in updatedThreads) {
        updatedThreads[threadId] = {
          ...updatedThreads[threadId],
          lastUpdated: Date.now(),
        };
      } else if (parentMessage.isThreadRoot) {
        // If the parent is a thread root but no thread exists yet, create one
        updatedThreads[threadId] = {
          id: threadId,
          rootMessageId: parentId,
          collapsed: false,
          lastUpdated: Date.now(),
        };
      }

      return {
        ...state,
        messages: [
          ...state.messages.map(msg => msg.id === parentId ? updatedParent : msg),
          newMessage,
        ],
        threads: updatedThreads,
      };
    }

    case 'COLLAPSE_THREAD': {
      const { threadId, collapsed } = action.payload;

      if (!(threadId in state.threads)) {
        return state;
      }

      return {
        ...state,
        threads: {
          ...state.threads,
          [threadId]: {
            ...state.threads[threadId],
            collapsed,
          },
        },
      };
    }

    case 'ADD_ARTIFACT':
      return {
        ...state,
        artifacts: [...state.artifacts, action.payload],
      };

    case 'UPDATE_ARTIFACT': {
      const { id, content } = action.payload;
      return {
        ...state,
        artifacts: state.artifacts.map(artifact =>
          artifact.id === id ? { ...artifact, content } : artifact
        ),
      };
    }

    case 'DELETE_ARTIFACT': {
      const { id } = action.payload;
      return {
        ...state,
        artifacts: state.artifacts.filter(artifact => artifact.id !== id),
        selectedArtifactId: state.selectedArtifactId === id ? null : state.selectedArtifactId,
      };
    }

    case 'SET_HIGHLIGHTED_CONTENT':
      return {
        ...state,
        highlightedContent: action.payload.content,
      };

    case 'SET_SELECTED_ARTIFACT':
      return {
        ...state,
        selectedArtifactId: action.payload.id,
      };

    case 'SET_PREFERENCE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'CLEAR_CANVAS':
      return {
        ...initialState,
        canvasId: state.canvasId,
        preferences: state.preferences,
      };

    default:
      return state;
  }
};

interface CanvasContextType {
  state: CanvasState;
  addMessage: (message: Omit<CanvasMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  addArtifact: (artifact: Omit<CanvasArtifact, 'id' | 'timestamp'>) => void;
  updateArtifact: (id: string, content: any) => void;
  deleteArtifact: (id: string) => void;
  setHighlightedContent: (content: string | null) => void;
  setSelectedArtifact: (id: string | null) => void;
  clearCanvas: () => void;
  // Thread-related methods
  createThread: (rootMessage: Omit<CanvasMessage, 'id' | 'timestamp' | 'threadId' | 'isThreadRoot'>) => void;
  addThreadedMessage: (parentId: string, message: Omit<CanvasMessage, 'id' | 'timestamp' | 'parentId' | 'threadId'>) => void;
  collapseThread: (threadId: string, collapsed: boolean) => void;
  selectors: typeof selectors;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};

interface CanvasProviderProps {
  children: React.ReactNode;
  canvasId?: string;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({
  children,
  canvasId = 'default-canvas'
}) => {
  const [state, dispatch] = useReducer(canvasReducer, {
    ...initialState,
    canvasId,
  });

  // Get the current user session
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // Use the real ArtifactStorage implementation
  const artifactStorage = useMemo(() => {
    // Get the singleton instance of ArtifactStorage
    return ArtifactStorage.getInstance();
  }, []);

  // Create a debounced function for syncing state with the server
  const debouncedSyncState = useCallback(
    debounce(async (state: CanvasState) => {
      if (isAuthenticated) {
        try {
          await CanvasApiService.saveCanvasState(state);
          console.log('Canvas state synced with server');
        } catch (error) {
          console.error('Failed to sync canvas state with server:', error);
        }
      }
    }, 2000), // 2 second debounce
    [isAuthenticated]
  );

  // Load persisted state from localStorage and server on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        // First try to load state from server if authenticated
        let serverState: CanvasState | null = null;
        if (isAuthenticated) {
          try {
            serverState = await CanvasApiService.getCanvasState(canvasId);
            console.log('Loaded state from server:', serverState);
          } catch (error) {
            console.error('Failed to load state from server:', error);
          }
        }

        // If server state exists, use it
        if (serverState) {
          // Load artifacts from IndexedDB if needed
          if (artifactStorage) {
            try {
              const artifacts = await artifactStorage.loadAllArtifacts(canvasId);
              // Ensure type compatibility by mapping artifacts if needed
              serverState.artifacts = artifacts.map(artifact => ({
                id: artifact.id,
                type: artifact.type as CanvasArtifact['type'], // Cast to ensure type compatibility
                content: artifact.content,
                timestamp: artifact.timestamp,
                metadata: artifact.metadata,
                parentId: artifact.parentId,
              }));
            } catch (error) {
              console.error('Failed to load artifacts from storage:', error);
            }
          }

          // Hydrate the state with the server state
          dispatch({ type: 'HYDRATE_STATE', payload: serverState });
          return;
        }

        // If no server state, try to load from localStorage
        const persistedState = localStorage.getItem(`canvas-state-${canvasId}`);
        if (persistedState) {
          const parsedState = JSON.parse(persistedState) as CanvasState;

          // Load artifacts from IndexedDB if needed
          if (artifactStorage) {
            try {
              const artifacts = await artifactStorage.loadAllArtifacts(canvasId);
              // Ensure type compatibility by mapping artifacts if needed
              parsedState.artifacts = artifacts.map(artifact => ({
                id: artifact.id,
                type: artifact.type as CanvasArtifact['type'], // Cast to ensure type compatibility
                content: artifact.content,
                timestamp: artifact.timestamp,
                metadata: artifact.metadata,
                parentId: artifact.parentId,
              }));
            } catch (error) {
              console.error('Failed to load artifacts from storage:', error);
            }
          }

          // Hydrate the state with the persisted state
          dispatch({ type: 'HYDRATE_STATE', payload: parsedState });

          // If authenticated, sync the local state to the server
          if (isAuthenticated) {
            try {
              await CanvasApiService.saveCanvasState(parsedState);
              console.log('Synced local state to server');
            } catch (error) {
              console.error('Failed to sync local state to server:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load persisted canvas state:', error);
      }
    };

    loadState();
  }, [canvasId, artifactStorage, isAuthenticated]);

  // Persist state to localStorage and server when it changes
  useEffect(() => {
    try {
      // Create a copy of state without artifacts for localStorage
      const stateForLocalStorage = {
        ...state,
        artifacts: [], // Don't store artifacts in localStorage directly
      };

      // Save basic state to localStorage
      localStorage.setItem(`canvas-state-${canvasId}`, JSON.stringify(stateForLocalStorage));

      // Save artifacts to storage if available
      if (artifactStorage && state.artifacts.length > 0) {
        state.artifacts.forEach((artifact: CanvasArtifact) => {
          artifactStorage.saveArtifact(canvasId, artifact).catch((error: Error) => {
            console.error('Failed to save artifact to storage:', error);
          });
        });
      }

      // Sync with server using debounced function
      if (isAuthenticated) {
        debouncedSyncState(state);
      }
    } catch (error) {
      console.error('Failed to persist canvas state:', error);
    }
  }, [state, canvasId, artifactStorage, isAuthenticated, debouncedSyncState]);

  const addMessage = (message: Omit<CanvasMessage, 'id' | 'timestamp'>) => {
    const payload: CanvasMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload });
  };

  const updateMessage = (id: string, content: string) => {
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { id, content },
    });
  };

  const deleteMessage = (id: string) => {
    dispatch({
      type: 'DELETE_MESSAGE',
      payload: { id },
    });
  };

  const addArtifact = (artifact: Omit<CanvasArtifact, 'id' | 'timestamp'>) => {
    // Ensure type compatibility
    const payload: CanvasArtifact = {
      ...artifact,
      id: `artifact-${Date.now()}`,
      timestamp: Date.now(),
      type: artifact.type as CanvasArtifact['type'], // Cast to ensure type compatibility
    };
    dispatch({ type: 'ADD_ARTIFACT', payload });
  };

  const updateArtifact = (id: string, content: any) => {
    dispatch({
      type: 'UPDATE_ARTIFACT',
      payload: { id, content },
    });
  };

  const deleteArtifact = (id: string) => {
    dispatch({
      type: 'DELETE_ARTIFACT',
      payload: { id },
    });
  };

  const setHighlightedContent = (content: string | null) => {
    dispatch({
      type: 'SET_HIGHLIGHTED_CONTENT',
      payload: { content },
    });
  };

  const setSelectedArtifact = (id: string | null) => {
    dispatch({
      type: 'SET_SELECTED_ARTIFACT',
      payload: { id },
    });
  };

  const clearCanvas = () => {
    dispatch({ type: 'CLEAR_CANVAS' });
  };

  // Thread-related methods
  const createThread = (rootMessage: Omit<CanvasMessage, 'id' | 'timestamp' | 'threadId' | 'isThreadRoot'>) => {
    dispatch({
      type: 'CREATE_THREAD',
      payload: { rootMessage },
    });
  };

  const addThreadedMessage = (
    parentId: string,
    message: Omit<CanvasMessage, 'id' | 'timestamp' | 'parentId' | 'threadId'>
  ) => {
    dispatch({
      type: 'ADD_THREADED_MESSAGE',
      payload: { parentId, message },
    });
  };

  const collapseThread = (threadId: string, collapsed: boolean) => {
    dispatch({
      type: 'COLLAPSE_THREAD',
      payload: { threadId, collapsed },
    });
  };

  const value = useMemo(
    () => ({
      state,
      addMessage,
      updateMessage,
      deleteMessage,
      addArtifact,
      updateArtifact,
      deleteArtifact,
      setHighlightedContent,
      setSelectedArtifact,
      clearCanvas,
      // Thread-related methods
      createThread,
      addThreadedMessage,
      collapseThread,
      selectors, // Add selectors to the context value
    }),
    [state]
  );

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};
