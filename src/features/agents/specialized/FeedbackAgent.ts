import { AgentState, AgentTool } from '../core/types';

/**
 * Creates a specialized feedback agent for content quality assessment
 */
export const createFeedbackAgent = (baseAgent: AgentState): AgentState => {
  // Add feedback-specific tools
  const feedbackTools: AgentTool[] = [
    // Add feedback-specific tools here when available
  ];

  // Add feedback-specific system prompt enhancement
  const feedbackSystemPrompt = `
    You are a specialized feedback agent designed to assess and improve educational content.
    Focus on providing feedback that is:
    1. Constructive and actionable
    2. Specific and detailed
    3. Balanced between strengths and areas for improvement
    4. Aligned with educational best practices
    5. Supportive of the content creator's goals
    
    You should evaluate content based on:
    - Alignment with learning objectives
    - Clarity and organization
    - Engagement and interest
    - Accuracy and completeness
    - Accessibility and inclusivity
    
    ${baseAgent.metadata.systemPrompt || ''}
  `;

  return {
    ...baseAgent,
    tools: [...baseAgent.tools, ...feedbackTools],
    metadata: {
      ...baseAgent.metadata,
      systemPrompt: feedbackSystemPrompt,
      specialization: 'feedback',
      capabilities: [
        'content quality assessment',
        'constructive feedback generation',
        'improvement suggestion',
        'educational alignment evaluation',
        'engagement analysis',
      ],
    },
  };
};
