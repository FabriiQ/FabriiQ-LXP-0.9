import { AgentState, AgentTool } from '../core/types';
import { createJinaTextSearchTool } from '../tools/jinaSearchTool';

/**
 * Creates a specialized content refinement agent with style adaptation
 */
export const createContentRefinementAgent = (baseAgent: AgentState): AgentState => {
  // Add content refinement-specific tools
  const refinementTools: AgentTool[] = [
    createJinaTextSearchTool(),
    // Add more refinement-specific tools here
  ];

  // Add content refinement-specific system prompt enhancement
  const refinementSystemPrompt = `
    You are a specialized content refinement agent designed to improve educational content.
    Focus on refining content to be:
    1. Clear and concise
    2. Engaging and interesting for the target audience
    3. Pedagogically sound
    4. Free of errors and inconsistencies
    5. Appropriately formatted and structured
    
    You have access to tools for searching reference materials and analyzing content quality.
    
    ${baseAgent.metadata.systemPrompt || ''}
  `;

  return {
    ...baseAgent,
    tools: [...baseAgent.tools, ...refinementTools],
    metadata: {
      ...baseAgent.metadata,
      systemPrompt: refinementSystemPrompt,
      specialization: 'content-refinement',
      capabilities: [
        'style adaptation',
        'clarity improvement',
        'engagement enhancement',
        'error correction',
        'formatting optimization',
      ],
    },
  };
};
