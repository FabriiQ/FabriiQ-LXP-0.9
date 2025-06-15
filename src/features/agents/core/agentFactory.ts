import { v4 as uuidv4 } from 'uuid';
import { AgentConfig, AgentState, AgentType } from './types';
import { AgentRegistry } from './AgentRegistry';

/**
 * Creates a new agent instance based on the provided configuration
 */
export const createAgent = async (config: AgentConfig): Promise<AgentState> => {
  // Create base agent state
  const baseAgent: AgentState = {
    id: uuidv4(),
    type: config.type,
    messages: [],
    memory: config.initialMemory || [],
    tools: config.tools || [],
    metadata: {
      name: config.name,
      description: config.description,
      systemPrompt: config.systemPrompt,
      ...config.metadata,
    },
    status: 'idle',
  };

  // Get the agent registry
  const registry = AgentRegistry.getInstance();

  // Try to create the agent using the registry
  const specializedAgent = await registry.createAgent(config, baseAgent);

  // If successful, return the specialized agent
  if (specializedAgent) {
    return specializedAgent;
  }

  // Fallback to basic agent creation if registry fails
  console.warn(`Using fallback agent creation for type ${config.type}`);

  // Add basic metadata based on the agent type
  switch (config.type) {
    case AgentType.WORKSHEET:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'worksheet',
          capabilities: ['print layout optimization', 'question generation'],
        },
      };
    case AgentType.ASSESSMENT:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'assessment',
          capabilities: ['question generation', 'rubric generation'],
        },
      };
    case AgentType.CONTENT_REFINEMENT:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'content-refinement',
          capabilities: ['style adaptation', 'clarity improvement'],
        },
      };
    case AgentType.LESSON_PLAN:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'lesson-plan',
          capabilities: ['curriculum alignment', 'activity integration'],
        },
      };
    case AgentType.SEARCH:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'search',
          capabilities: ['text search', 'image search', 'video search'],
        },
      };
    case AgentType.RESOURCE:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'resource',
          capabilities: ['resource discovery', 'resource evaluation'],
        },
      };
    case AgentType.FEEDBACK:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'feedback',
          capabilities: ['content quality assessment', 'improvement suggestion'],
        },
      };
    default:
      return baseAgent;
  }
};

/**
 * Synchronous version of createAgent for backward compatibility
 * This should be used only when async operations are not possible
 */
export const createAgentSync = (config: AgentConfig): AgentState => {
  const baseAgent: AgentState = {
    id: uuidv4(),
    type: config.type,
    messages: [],
    memory: config.initialMemory || [],
    tools: config.tools || [],
    metadata: {
      name: config.name,
      description: config.description,
      systemPrompt: config.systemPrompt,
      ...config.metadata,
    },
    status: 'idle',
  };

  // Add basic metadata based on the agent type
  switch (config.type) {
    case AgentType.WORKSHEET:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'worksheet',
          capabilities: ['print layout optimization', 'question generation'],
        },
      };
    case AgentType.ASSESSMENT:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'assessment',
          capabilities: ['question generation', 'rubric generation'],
        },
      };
    case AgentType.CONTENT_REFINEMENT:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'content-refinement',
          capabilities: ['style adaptation', 'clarity improvement'],
        },
      };
    case AgentType.LESSON_PLAN:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'lesson-plan',
          capabilities: ['curriculum alignment', 'activity integration'],
        },
      };
    case AgentType.SEARCH:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'search',
          capabilities: ['text search', 'image search', 'video search'],
        },
      };
    case AgentType.RESOURCE:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'resource',
          capabilities: ['resource discovery', 'resource evaluation'],
        },
      };
    case AgentType.FEEDBACK:
      return {
        ...baseAgent,
        metadata: {
          ...baseAgent.metadata,
          specialization: 'feedback',
          capabilities: ['content quality assessment', 'improvement suggestion'],
        },
      };
    default:
      return baseAgent;
  }
};
