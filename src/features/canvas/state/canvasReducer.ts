import { CanvasState, CanvasAction } from './types';

export const initialState: CanvasState = {
  canvasId: 'default-canvas',
  messages: [],
  artifacts: [],
  highlightedContent: null,
  selectedArtifactId: null,
  preferences: {},
};

export const canvasReducer = (state: CanvasState, action: CanvasAction): CanvasState => {
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
      return {
        ...state,
        messages: state.messages.filter(message => message.id !== id),
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
        preferences: state.preferences, // Preserve preferences
      };

    default:
      return state;
  }
};
