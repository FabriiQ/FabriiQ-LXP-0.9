import { v4 as uuidv4 } from 'uuid';
import {
  AgentRegistry,
  AgentType,
  AdvancedMemoryManager,
  TeacherPreferenceMemory
} from '@/features/agents';
import {
  Message,
  TeacherContext,
  SearchFilters,
  SearchResult,
  IntentCategory
} from '../types';
import { INTENT_KEYWORDS } from '../constants';

interface ProcessMessageOptions {
  messages: Message[];
  context: TeacherContext;
}

/**
 * Teacher Assistant Orchestrator
 *
 * Responsible for:
 * - Classifying message intents
 * - Routing to appropriate specialized agents
 * - Managing context and memory
 * - Handling search functionality
 */
export class TeacherAssistantOrchestrator {
  private agentRegistry: AgentRegistry;

  constructor() {
    this.agentRegistry = AgentRegistry.getInstance();
  }

  /**
   * Process a message and generate a response
   */
  async processMessage(content: string, options: ProcessMessageOptions): Promise<string> {
    try {
      // Classify intent
      const intent = this.classifyIntent(content);

      // Get appropriate agent based on intent
      const agentType = this.mapIntentToAgentType(intent);

      // Prepare context data
      const contextData = JSON.stringify({
        intent,
        agentType,
        messages: options.messages.slice(-5), // Include last 5 messages for context
        teacherContext: options.context
      });

      // For now, use local processing until tRPC API is properly configured
      console.log('Processing message with local orchestrator:', { intent, agentType });

      if (agentType) {
        return this.processWithSpecializedAgent(content, agentType, options);
      } else {
        return this.processGeneralConversation(content, options);
      }
    } catch (error) {
      console.error('Error in TeacherAssistantOrchestrator:', error);
      throw new Error('Failed to process message');
    }
  }

  /**
   * Classify the intent of a message
   *
   * Public method to allow analytics tracking
   */
  classifyIntent(content: string): IntentCategory {
    const normalizedContent = content.toLowerCase();

    // Check each intent category
    for (const [category, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedContent.includes(keyword.toLowerCase())) {
          return category as IntentCategory;
        }
      }
    }

    // Default to general conversation
    return IntentCategory.GENERAL;
  }

  /**
   * Map intent category to agent type
   *
   * Public method to allow analytics tracking
   */
  mapIntentToAgentType(intent: IntentCategory): AgentType | null {
    switch (intent) {
      case IntentCategory.LESSON_PLANNING:
        return AgentType.LESSON_PLAN;
      case IntentCategory.ASSESSMENT:
        return AgentType.ASSESSMENT;
      case IntentCategory.WORKSHEET:
        return AgentType.WORKSHEET;
      case IntentCategory.CONTENT_REFINEMENT:
        return AgentType.CONTENT_REFINEMENT;
      case IntentCategory.SEARCH:
        return AgentType.SEARCH;
      case IntentCategory.STUDENT_MANAGEMENT:
        return AgentType.STUDENT_MANAGEMENT;
      case IntentCategory.TEACHING_STRATEGY:
        return AgentType.TEACHING_STRATEGY;
      case IntentCategory.ADMINISTRATIVE:
        return AgentType.ADMINISTRATIVE;
      case IntentCategory.GENERAL:
      default:
        return null;
    }
  }

  /**
   * Process message with a specialized agent
   */
  private async processWithSpecializedAgent(
    content: string,
    agentType: AgentType,
    options: ProcessMessageOptions
  ): Promise<string> {
    // Get agent factory
    const factory = await this.agentRegistry.getAgentFactory(agentType);

    if (!factory) {
      console.error(`No factory available for agent type ${agentType}`);
      return this.processGeneralConversation(content, options);
    }

    // Create base agent state
    const baseAgent = {
      id: uuidv4(),
      type: agentType,
      messages: options.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      tools: [],
      metadata: {
        systemPrompt: this.getSystemPromptForAgent(agentType, options.context),
        teacherContext: options.context
      }
    };

    // Create specialized agent
    const agent = await this.agentRegistry.createAgent({ type: agentType }, baseAgent);

    if (!agent) {
      console.error(`Failed to create agent of type ${agentType}`);
      return this.processGeneralConversation(content, options);
    }

    // Process with specialized agent
    // Note: In a real implementation, this would call the agent's processing logic
    // For now, we'll return a simulated response
    return `[Specialized ${agentType} Agent] I'll help you with that request about ${content}`;
  }

  /**
   * Process general conversation
   */
  private async processGeneralConversation(content: string, options: ProcessMessageOptions): Promise<string> {
    // In a real implementation, this would call a general conversation agent
    // For now, we'll return a simulated response
    return `I understand you're asking about "${content}". As your teaching assistant, I'm here to help with that.`;
  }

  /**
   * Get system prompt for a specific agent type
   */
  private getSystemPromptForAgent(agentType: AgentType, context: TeacherContext): string {
    const basePrompt = `You are a specialized ${agentType} agent for teachers. `;
    const teacherContext = context.teacher
      ? `You are assisting ${context.teacher.name}, who teaches ${this.formatSubjects(context.teacher.subjects)}.`
      : '';
    const preferences = context.teacher?.preferences
      ? `Their teaching style preferences include: ${context.teacher.preferences.teachingStyle?.join(', ')}.`
      : '';

    return `${basePrompt}${teacherContext} ${preferences}`;
  }

  /**
   * Format subjects for prompt
   */
  private formatSubjects(subjects?: { id: string; name: string }[]): string {
    if (!subjects || subjects.length === 0) return 'various subjects';

    return subjects.map(s => s.name).join(', ');
  }

  /**
   * Search for resources
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    try {
      // For now, return simulated results until tRPC API is properly configured
      console.log('Performing search with local orchestrator:', { query, filters });

      return [
        {
          id: uuidv4(),
          title: 'Effective Teaching Strategies for Mathematics',
          snippet: 'This resource provides research-based teaching strategies for mathematics education...',
          url: 'https://example.com/math-strategies',
          source: 'Educational Research Journal',
          relevanceScore: 0.95
        },
        {
          id: uuidv4(),
          title: 'Student Engagement Techniques',
          snippet: 'A comprehensive guide to increasing student engagement in the classroom...',
          url: 'https://example.com/engagement',
          source: 'Teaching Resources',
          relevanceScore: 0.87
        },
        {
          id: uuidv4(),
          title: 'Differentiated Instruction Framework',
          snippet: 'Learn how to implement differentiated instruction to meet the needs of diverse learners...',
          url: 'https://example.com/differentiation',
          source: 'Education Best Practices',
          relevanceScore: 0.82
        }
      ];
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }
}
