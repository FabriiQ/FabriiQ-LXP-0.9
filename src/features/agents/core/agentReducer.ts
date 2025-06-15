import { AgentState, AgentMessage, AgentMemory } from './types';

interface AgentOrchestratorState {
  agents: Record<string, AgentState>;
  activeAgentId: string | null;
}

export const initialState: AgentOrchestratorState = {
  agents: {},
  activeAgentId: null,
};

type AgentOrchestratorAction =
  | { type: 'HYDRATE_STATE'; payload: AgentOrchestratorState }
  | { type: 'REGISTER_AGENT'; payload: AgentState }
  | { type: 'UNREGISTER_AGENT'; payload: { agentId: string } }
  | { type: 'SET_ACTIVE_AGENT'; payload: { agentId: string } }
  | { type: 'ADD_MESSAGE'; payload: { agentId: string; message: AgentMessage } }
  | { type: 'SET_MEMORY'; payload: { agentId: string; memory: AgentMemory } }
  | { type: 'CLEAR_MEMORY'; payload: { agentId: string; memoryType?: string } }
  | { type: 'SET_AGENT_STATUS'; payload: { agentId: string; status: AgentState['status']; error?: string } };

export const agentReducer = (
  state: AgentOrchestratorState,
  action: AgentOrchestratorAction
): AgentOrchestratorState => {
  switch (action.type) {
    case 'HYDRATE_STATE':
      return action.payload;

    case 'REGISTER_AGENT':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.id]: action.payload,
        },
        activeAgentId: state.activeAgentId || action.payload.id,
      };

    case 'UNREGISTER_AGENT': {
      const { [action.payload.agentId]: _, ...remainingAgents } = state.agents;
      const newActiveAgentId =
        state.activeAgentId === action.payload.agentId
          ? Object.keys(remainingAgents)[0] || null
          : state.activeAgentId;

      return {
        ...state,
        agents: remainingAgents,
        activeAgentId: newActiveAgentId,
      };
    }

    case 'SET_ACTIVE_AGENT':
      return {
        ...state,
        activeAgentId: action.payload.agentId,
      };

    case 'ADD_MESSAGE': {
      const agent = state.agents[action.payload.agentId];
      if (!agent) return state;

      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.agentId]: {
            ...agent,
            messages: [...agent.messages, action.payload.message],
          },
        },
      };
    }

    case 'SET_MEMORY': {
      const agent = state.agents[action.payload.agentId];
      if (!agent) return state;

      // Replace existing memory with the same key and type, or add new one
      const existingMemoryIndex = agent.memory.findIndex(
        m => m.key === action.payload.memory.key && m.type === action.payload.memory.type
      );

      const updatedMemory =
        existingMemoryIndex >= 0
          ? [
              ...agent.memory.slice(0, existingMemoryIndex),
              action.payload.memory,
              ...agent.memory.slice(existingMemoryIndex + 1),
            ]
          : [...agent.memory, action.payload.memory];

      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.agentId]: {
            ...agent,
            memory: updatedMemory,
          },
        },
      };
    }

    case 'CLEAR_MEMORY': {
      const agent = state.agents[action.payload.agentId];
      if (!agent) return state;

      const updatedMemory = action.payload.memoryType
        ? agent.memory.filter(m => m.type !== action.payload.memoryType)
        : [];

      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.agentId]: {
            ...agent,
            memory: updatedMemory,
          },
        },
      };
    }

    case 'SET_AGENT_STATUS': {
      const agent = state.agents[action.payload.agentId];
      if (!agent) return state;

      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.agentId]: {
            ...agent,
            status: action.payload.status,
            error: action.payload.error,
          },
        },
      };
    }

    default:
      return state;
  }
};
