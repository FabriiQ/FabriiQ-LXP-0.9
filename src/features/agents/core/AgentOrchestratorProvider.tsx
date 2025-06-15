'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { AgentType, AgentState, AgentConfig, AgentMessage, AgentMemory, AgentTool, AgentResponse, MemoryType } from './types';
import { v4 as uuidv4 } from 'uuid';
import { AgentRegistry } from './AgentRegistry';
import { createAgentSync } from './agentFactory';
import { executeToolWithRetry } from './toolExecutor';

// Define reducer inline to avoid import issues
interface AgentOrchestratorState {
  agents: Record<string, AgentState>;
  activeAgentId: string | null;
}

const initialState: AgentOrchestratorState = {
  agents: {},
  activeAgentId: null,
};

type AgentOrchestratorAction =
  | { type: 'HYDRATE_STATE'; payload: AgentOrchestratorState }
  | { type: 'REGISTER_AGENT'; payload: AgentState }
  | { type: 'UNREGISTER_AGENT'; payload: { agentId: string } }
  | { type: 'SET_ACTIVE_AGENT'; payload: { agentId: string } }
  | { type: 'ADD_MESSAGE'; payload: { agentId: string; message: AgentMessage } }
  | { type: 'FORWARD_MESSAGE'; payload: { fromAgentId: string; toAgentId: string; message: AgentMessage } }
  | { type: 'BROADCAST_MESSAGE'; payload: { fromAgentId: string; message: AgentMessage; excludeAgentIds?: string[] } }
  | { type: 'SET_MEMORY'; payload: { agentId: string; memory: AgentMemory } }
  | { type: 'CLEAR_MEMORY'; payload: { agentId: string; memoryType?: string } }
  | { type: 'SET_AGENT_STATUS'; payload: { agentId: string; status: AgentState['status']; error?: string } };

const agentReducer = (
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

    case 'FORWARD_MESSAGE': {
      const { fromAgentId, toAgentId, message } = action.payload;
      const sourceAgent = state.agents[fromAgentId];
      const targetAgent = state.agents[toAgentId];

      if (!sourceAgent || !targetAgent) return state;

      // Create a forwarded message with reference to the source
      const forwardedMessage: AgentMessage = {
        ...message,
        id: Date.now().toString(), // New ID for the forwarded message
        metadata: {
          ...message.metadata,
          forwardedFrom: fromAgentId,
          originalMessageId: message.id,
        },
      };

      return {
        ...state,
        agents: {
          ...state.agents,
          [toAgentId]: {
            ...targetAgent,
            messages: [...targetAgent.messages, forwardedMessage],
          },
        },
      };
    }

    case 'BROADCAST_MESSAGE': {
      const { fromAgentId, message, excludeAgentIds = [] } = action.payload;
      const sourceAgent = state.agents[fromAgentId];

      if (!sourceAgent) return state;

      // Create a broadcast message with reference to the source
      const broadcastMessage: AgentMessage = {
        ...message,
        id: Date.now().toString(), // New ID for the broadcast message
        metadata: {
          ...message.metadata,
          broadcastFrom: fromAgentId,
          originalMessageId: message.id,
          isBroadcast: true,
        },
      };

      // Prepare updated agents with the broadcast message
      const updatedAgents = { ...state.agents };

      // Add the broadcast message to all agents except the source and excluded agents
      Object.keys(updatedAgents).forEach(agentId => {
        if (agentId !== fromAgentId && !excludeAgentIds.includes(agentId)) {
          updatedAgents[agentId] = {
            ...updatedAgents[agentId],
            messages: [...updatedAgents[agentId].messages, broadcastMessage],
          };
        }
      });

      return {
        ...state,
        agents: updatedAgents,
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

// We're now using the imported createAgentSync function instead of defining it inline

interface AgentOrchestratorContextType {
  agents: Record<string, AgentState>;
  activeAgentId: string | null;
  registerAgent: (config: AgentConfig) => string;
  unregisterAgent: (agentId: string) => void;
  setActiveAgent: (agentId: string) => void;
  sendMessage: (agentId: string, message: string, metadata?: Record<string, any>) => Promise<AgentResponse>;
  forwardMessage: (fromAgentId: string, toAgentId: string, message: AgentMessage) => void;
  broadcastMessage: (fromAgentId: string, message: AgentMessage, excludeAgentIds?: string[]) => void;
  executeToolCall: (agentId: string, toolName: string, parameters: Record<string, any>, options?: { maxRetries?: number; timeout?: number }) => Promise<any>;
  getAgentMemory: (agentId: string, key: string, type?: string) => AgentMemory | undefined;
  setAgentMemory: (agentId: string, memory: AgentMemory) => void;
  clearAgentMemory: (agentId: string, type?: string) => void;
  getAgentState: (agentId: string) => AgentState | undefined;
  getAgentRegistry: () => AgentRegistry;
}

const AgentOrchestratorContext = createContext<AgentOrchestratorContextType | undefined>(undefined);

export const useAgentOrchestrator = () => {
  const context = useContext(AgentOrchestratorContext);
  if (!context) {
    throw new Error('useAgentOrchestrator must be used within an AgentOrchestratorProvider');
  }
  return context;
};

interface AgentOrchestratorProviderProps {
  children: React.ReactNode;
}

export const AgentOrchestratorProvider: React.FC<AgentOrchestratorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const persistedState = localStorage.getItem('agentOrchestratorState');
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        dispatch({ type: 'HYDRATE_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error('Failed to load persisted agent state:', error);
    }
  }, []);

  // Persist state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('agentOrchestratorState', JSON.stringify({
        agents: state.agents,
        activeAgentId: state.activeAgentId,
      }));
    } catch (error) {
      console.error('Failed to persist agent state:', error);
    }
  }, [state.agents, state.activeAgentId]);

  const registerAgent = (config: AgentConfig): string => {
    const agent = createAgentSync(config);
    dispatch({ type: 'REGISTER_AGENT', payload: agent });
    return agent.id;
  };

  const unregisterAgent = (agentId: string) => {
    dispatch({ type: 'UNREGISTER_AGENT', payload: { agentId } });
  };

  const setActiveAgent = (agentId: string) => {
    dispatch({ type: 'SET_ACTIVE_AGENT', payload: { agentId } });
  };

  const sendMessage = async (agentId: string, message: string, metadata?: Record<string, any>): Promise<AgentResponse> => {
    const agent = state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        agentId,
        message: {
          id: Date.now().toString(),
          role: 'user',
          content: message,
          timestamp: Date.now(),
          metadata,
        }
      }
    });

    dispatch({ type: 'SET_AGENT_STATUS', payload: { agentId, status: 'thinking' } });

    try {
      // This would be replaced with actual agent processing logic
      const response = await simulateAgentResponse(agent, message);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          agentId,
          message: response.message
        }
      });

      if (response.updatedMemory) {
        response.updatedMemory.forEach(memory => {
          dispatch({
            type: 'SET_MEMORY',
            payload: {
              agentId,
              memory
            }
          });
        });
      }

      dispatch({ type: 'SET_AGENT_STATUS', payload: { agentId, status: 'idle' } });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          agentId,
          message: {
            id: Date.now().toString(),
            role: 'error',
            content: `Error: ${errorMessage}`,
            timestamp: Date.now(),
          }
        }
      });

      dispatch({
        type: 'SET_AGENT_STATUS',
        payload: {
          agentId,
          status: 'error',
          error: errorMessage
        }
      });

      throw error;
    }
  };

  const executeToolCall = async (agentId: string, toolName: string, parameters: Record<string, any>, options?: { maxRetries?: number; timeout?: number }): Promise<any> => {
    const agent = state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    const tool = agent.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found for agent ${agentId}`);
    }

    try {
      // Use the tool executor with retry logic
      return await executeToolWithRetry(tool, parameters, {
        maxRetries: options?.maxRetries || 3,
        timeout: options?.timeout || 15000,
        retryDelay: 1000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Tool execution failed: ${errorMessage}`);
    }
  };

  const getAgentMemory = (agentId: string, key: string, type?: string): AgentMemory | undefined => {
    const agent = state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    return agent.memory.find(m => m.key === key && (!type || m.type === type));
  };

  const setAgentMemory = (agentId: string, memory: AgentMemory) => {
    dispatch({ type: 'SET_MEMORY', payload: { agentId, memory } });
  };

  const clearAgentMemory = (agentId: string, type?: string) => {
    dispatch({ type: 'CLEAR_MEMORY', payload: { agentId, memoryType: type } });
  };

  const getAgentState = (agentId: string): AgentState | undefined => {
    return state.agents[agentId];
  };

  /**
   * Forward a message from one agent to another
   */
  const forwardMessage = (fromAgentId: string, toAgentId: string, message: AgentMessage): void => {
    dispatch({
      type: 'FORWARD_MESSAGE',
      payload: { fromAgentId, toAgentId, message }
    });
  };

  /**
   * Broadcast a message from one agent to all other agents
   */
  const broadcastMessage = (fromAgentId: string, message: AgentMessage, excludeAgentIds: string[] = []): void => {
    dispatch({
      type: 'BROADCAST_MESSAGE',
      payload: { fromAgentId, message, excludeAgentIds }
    });
  };

  /**
   * Get the agent registry instance
   */
  const getAgentRegistry = (): AgentRegistry => {
    return AgentRegistry.getInstance();
  };

  // Temporary function to simulate agent responses
  const simulateAgentResponse = async (agent: AgentState, message: string): Promise<AgentResponse> => {
    // In a real implementation, this would call the AI model and process the response
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time

    return {
      message: {
        id: Date.now().toString(),
        role: 'agent',
        content: `Agent ${agent.type} responding to: "${message}"`,
        timestamp: Date.now(),
      },
      updatedMemory: [
        {
          type: MemoryType.SHORT_TERM,
          key: `interaction-${Date.now()}`,
          value: { userMessage: message },
          timestamp: Date.now(),
        }
      ]
    };
  };

  const value = useMemo(() => ({
    agents: state.agents,
    activeAgentId: state.activeAgentId,
    registerAgent,
    unregisterAgent,
    setActiveAgent,
    sendMessage,
    forwardMessage,
    broadcastMessage,
    executeToolCall,
    getAgentMemory,
    setAgentMemory,
    clearAgentMemory,
    getAgentState,
    getAgentRegistry,
  }), [state.agents, state.activeAgentId]);

  return (
    <AgentOrchestratorContext.Provider value={value}>
      {children}
    </AgentOrchestratorContext.Provider>
  );
};
