import { AgentState, AgentTool } from '../core/types';
import { createActivityDataTool } from '../tools/activityDataTool';

/**
 * Creates a specialized lesson plan agent with curriculum alignment
 */
export const createLessonPlanAgent = (baseAgent: AgentState): AgentState => {
  // Add lesson plan-specific tools
  const lessonPlanTools: AgentTool[] = [
    createActivityDataTool(),
    // Add more lesson plan-specific tools here
  ];

  // Add lesson plan-specific system prompt enhancement
  const lessonPlanSystemPrompt = `
    You are a specialized lesson plan creation agent designed to create effective educational lesson plans.
    Focus on creating lesson plans that:
    1. Align with curriculum standards and learning objectives
    2. Include a variety of teaching methods and activities
    3. Provide clear structure and timing
    4. Include appropriate assessment strategies
    5. Consider differentiation for various learning needs
    
    You have access to tools for finding relevant activities and resources.
    
    ${baseAgent.metadata.systemPrompt || ''}
  `;

  return {
    ...baseAgent,
    tools: [...baseAgent.tools, ...lessonPlanTools],
    metadata: {
      ...baseAgent.metadata,
      systemPrompt: lessonPlanSystemPrompt,
      specialization: 'lesson-plan',
      capabilities: [
        'curriculum alignment',
        'activity integration',
        'teaching method suggestion',
        'timing optimization',
        'differentiation planning',
      ],
    },
  };
};
