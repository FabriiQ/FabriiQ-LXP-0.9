import { AgentState, AgentTool } from '../core/types';
import { createJinaTextSearchTool, createJinaImageSearchTool } from '../tools/jinaSearchTool';

/**
 * Creates a specialized resource agent for educational resource integration
 */
export const createResourceAgent = (baseAgent: AgentState): AgentState => {
  // Add resource-specific tools
  const resourceTools: AgentTool[] = [
    createJinaTextSearchTool(),
    createJinaImageSearchTool(),
    // Add more resource-specific tools here
  ];

  // Add resource-specific system prompt enhancement
  const resourceSystemPrompt = `
    You are a specialized resource agent designed to find and integrate educational resources.
    Focus on finding resources that are:
    1. Relevant to the educational topic
    2. Appropriate for the target grade level
    3. Engaging and informative
    4. Diverse in format and perspective
    5. Accessible and usable in educational settings
    
    You have access to tools for searching and evaluating educational resources.
    
    ${baseAgent.metadata.systemPrompt || ''}
  `;

  return {
    ...baseAgent,
    tools: [...baseAgent.tools, ...resourceTools],
    metadata: {
      ...baseAgent.metadata,
      systemPrompt: resourceSystemPrompt,
      specialization: 'resource',
      capabilities: [
        'resource discovery',
        'resource evaluation',
        'resource integration',
        'resource adaptation',
        'resource organization',
      ],
    },
  };
};
