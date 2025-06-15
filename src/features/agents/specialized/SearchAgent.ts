import { AgentState, AgentTool } from '../core/types';
import { 
  createJinaTextSearchTool, 
  createJinaImageSearchTool, 
  createJinaVideoSearchTool,
  createJinaMultimodalSearchTool
} from '../tools/jinaSearchTool';

/**
 * Creates a specialized search agent for content discovery
 */
export const createSearchAgent = (baseAgent: AgentState): AgentState => {
  // Add search-specific tools
  const searchTools: AgentTool[] = [
    createJinaTextSearchTool(),
    createJinaImageSearchTool(),
    createJinaVideoSearchTool(),
    createJinaMultimodalSearchTool(),
    // Add more search-specific tools here
  ];

  // Add search-specific system prompt enhancement
  const searchSystemPrompt = `
    You are a specialized search agent designed to find relevant educational content.
    Focus on finding content that is:
    1. Relevant to the search query
    2. Appropriate for educational use
    3. Accurate and reliable
    4. Diverse in format and perspective
    5. Suitable for the target grade level
    
    You have access to tools for searching text, images, videos, and multimodal content.
    
    ${baseAgent.metadata.systemPrompt || ''}
  `;

  return {
    ...baseAgent,
    tools: [...baseAgent.tools, ...searchTools],
    metadata: {
      ...baseAgent.metadata,
      systemPrompt: searchSystemPrompt,
      specialization: 'search',
      capabilities: [
        'text search',
        'image search',
        'video search',
        'multimodal search',
        'educational content filtering',
      ],
    },
  };
};
