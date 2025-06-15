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
  IntentCategory,
  // Message type might need to be augmented here if tool_call_id etc. are specific to this layer
} from '../types';
import { INTENT_KEYWORDS, MAX_CONVERSATION_HISTORY } from '../constants'; // Added MAX_CONVERSATION_HISTORY

/*
// Conceptual tRPC procedures (to be implemented on the backend)
async function trpcInvokeAgent(input: {
  agentType: AgentType | null; // Null for general conversation
  message: string;
  history: Message[];
  context: TeacherContext;
  availableTools?: any[]; // Descriptions of tools the agent can use
}): Promise<{
  answer?: string;
  toolCall?: { name: string; input: any; id: string };
  error?: string;
}> { throw new Error("trpcInvokeAgent not implemented"); }

async function trpcExecuteTool(input: {
  toolName: string;
  toolInput: any;
  context: TeacherContext;
}): Promise<{ result: any; error?: string; toolCallId: string }> { throw new Error("trpcExecuteTool not implemented"); }

async function trpcSearchResources(input: {
  query: string;
  filters?: SearchFilters;
  context: TeacherContext;
}): Promise<{ results: SearchResult[]; error?: string; }> { throw new Error("trpcSearchResources not implemented"); }
*/

interface ProcessMessageOptions {
  messages: Message[]; // These are the full history from the provider
  context: TeacherContext;
}

/**
 * Teacher Assistant Orchestrator
 *
 * Responsible for:
 * - Classifying message intents
 * - Simulating routing to appropriate specialized agents via tRPC
 * - Simulating context and memory management for tRPC calls
 * - Simulating search functionality via tRPC
 */
export class TeacherAssistantOrchestrator {
  // private agentRegistry: AgentRegistry; // No longer directly used if tRPC handles agent logic

  constructor() {
    // this.agentRegistry = AgentRegistry.getInstance(); // No longer directly used
    console.log('[TA Orchestrator] Initialized.');
  }

  // SIMULATED tRPC CLIENT (replace with actual tRPC calls when backend is ready)
  private async simulateTrpcInvokeAgent(input: {
     agentType: AgentType | null;
     message: string;
     history: Message[];
     context: TeacherContext;
     // availableTools?: any[]; // Future: pass tool descriptions
  }): Promise<{ answer?: string; toolCall?: { name: string; input: any; id: string }; error?: string }> {
     console.log('[TA Orchestrator] Simulating tRPC call to ai.invokeAgent with input:', {
        ...input,
        history: input.history.map(h => ({ ...h, content: h.content.substring(0,50) + '...' })) // Log snippet
     });
     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

     const intent = this.classifyIntent(input.message);
     if ((intent === IntentCategory.ANALYTICS || input.message.toLowerCase().includes("analytics")) && input.context.currentClass?.id) {
         console.log('[TA Orchestrator] Simulating AI wants to call getClassAnalytics tool.');
         return {
             toolCall: {
                 name: 'getClassAnalytics',
                 input: { classId: input.context.currentClass.id, metrics: ['topicMastery', 'overallPerformance'] },
                 id: uuidv4()
             }
         };
     }
     const agentName = input.agentType || 'General Assistant';
     return { answer: `[Simulated AI Response from ${agentName}] Regarding '${input.message.substring(0,50)}...', the backend AI service would provide a detailed answer here.` };
  }

  private async simulateTrpcExecuteTool(input: {
     toolName: string;
     toolInput: any;
     context: TeacherContext;
     toolCallId: string;
  }): Promise<{ result: any; error?: string; toolCallId: string }> {
     console.log('[TA Orchestrator] Simulating tRPC call to tools.executeTool with input:', input);
     await new Promise(resolve => setTimeout(resolve, 300));

     if (input.toolName === 'getClassAnalytics') {
         const classId = input.toolInput.classId;
         return {
             result: {
                 classId: classId,
                 overallPerformance: Math.random() * 100,
                 topicMastery: [
                     { topic: 'Algebra', mastery: Math.random() * 100 },
                     { topic: 'Geometry', mastery: Math.random() * 100 },
                 ],
                 message: `Analytics data for class ${classId} including topic mastery and overall performance.`
             },
             toolCallId: input.toolCallId
         };
     }
     return { error: 'Unknown tool simulated', result: null, toolCallId: input.toolCallId };
  }

  async processMessage(content: string, options: ProcessMessageOptions): Promise<string> {
    try {
        const intent = this.classifyIntent(content);
        const agentType = this.mapIntentToAgentType(intent);

        console.log(`[TA Orchestrator] Processing message. Intent: ${intent}, AgentType: ${agentType}`);

        // Initial call to the "AI agent" (simulated tRPC)
        // The provider already slices history, but good practice to ensure it here too if passing to an external service.
        let agentResponse = await this.simulateTrpcInvokeAgent({
            agentType,
            message: content,
            history: options.messages.slice(-MAX_CONVERSATION_HISTORY),
            context: options.context,
        });

        if (agentResponse.toolCall) {
            console.log(`[TA Orchestrator] AI requested tool call: ${agentResponse.toolCall.name}`, agentResponse.toolCall.input);

            const toolResult = await this.simulateTrpcExecuteTool({
                toolName: agentResponse.toolCall.name,
                toolInput: agentResponse.toolCall.input,
                context: options.context,
                toolCallId: agentResponse.toolCall.id
            });

            console.log('[TA Orchestrator] Tool execution result:', toolResult);

            const updatedHistory: Message[] = [
                ...options.messages.slice(-MAX_CONVERSATION_HISTORY),
                // Cast to Message type, assuming Message type allows for these optional fields
                { id: uuidv4(), role: 'assistant', content: `Called tool ${agentResponse.toolCall.name}.`, tool_call_id: agentResponse.toolCall.id, name: agentResponse.toolCall.name, timestamp: Date.now() } as Message,
                { id: uuidv4(), role: 'tool', content: JSON.stringify(toolResult.result || toolResult.error), tool_call_id: agentResponse.toolCall.id, name: agentResponse.toolCall.name, timestamp: Date.now() } as Message,
            ];

            agentResponse = await this.simulateTrpcInvokeAgent({
                agentType,
                message: "Here's the tool result, please formulate the final answer for the user.",
                history: updatedHistory,
                context: options.context,
            });
            console.log('[TA Orchestrator] Final AI response after tool use:', agentResponse);
        }

        if (agentResponse.error) {
            console.error('[TA Orchestrator] Error from simulated AI agent:', agentResponse.error);
            throw new Error(agentResponse.error);
        }

        return agentResponse.answer || "I'm sorry, I couldn't generate a response at this time.";

    } catch (error) {
        console.error('Error in TeacherAssistantOrchestrator.processMessage:', error);
        return "An unexpected error occurred while processing your request. Please try again later.";
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
        return AgentType.SEARCH; // Or could be a specific tool call if search is a tool
      case IntentCategory.STUDENT_MANAGEMENT:
        return AgentType.STUDENT_MANAGEMENT;
      case IntentCategory.TEACHING_STRATEGY:
        return AgentType.TEACHING_STRATEGY;
      case IntentCategory.ADMINISTRATIVE:
        return AgentType.ADMINISTRATIVE;
      case IntentCategory.ANALYTICS: // Added for explicit mapping
        return AgentType.ANALYTICS; // Assuming an Analytics Agent or handled by tools
      case IntentCategory.GENERAL:
      default:
        return null; // General conversation, no specific agent type
    }
  }

  /*
  // Removed as logic is now merged into processMessage with simulateTrpcInvokeAgent.
  private async processWithSpecializedAgent(
    content: string,
    agentType: AgentType,
    options: ProcessMessageOptions
  ): Promise<string> {
    // ... old logic ...
    return `[Specialized ${agentType} Agent] I'll help you with that request about ${content}`;
  }

  private async processGeneralConversation(content: string, options: ProcessMessageOptions): Promise<string> {
    return `I understand you're asking about "${content}". As your teaching assistant, I'm here to help with that.`;
  }
  */


  /**
   * Get system prompt for a specific agent type
   */
  // This function might be deprecated if system prompts are handled by the backend agent.
  // For now, it can remain if frontend context still needs to be summarized for any reason.
  private getSystemPromptForAgent(agentType: AgentType, context: TeacherContext): string {
    const basePrompt = `You are a specialized ${agentType} agent for teachers. `;
    const teacherContextInfo = context.teacher
      ? `You are assisting ${context.teacher.name}.` // Simplified, more details can be added if needed by frontend
      : '';
    // Preferences formatting can be complex, consider if this is needed or if backend handles it.
    // const preferences = context.teacher?.preferences
    //   ? `Their teaching style preferences include: ${JSON.stringify(context.teacher.preferences)}.`
    //   : '';
    return `${basePrompt}${teacherContextInfo}`;
  }

  /**
   * Format subjects for prompt - May not be needed if context is passed directly to tRPC
   */
  // private formatSubjects(subjects?: { id: string; name: string }[]): string {
  //   if (!subjects || subjects.length === 0) return 'various subjects';
  //   return subjects.map(s => s.name).join(', ');
  // }

  /**
   * Search for resources - Now simulates a tRPC call
   */
  async search(query: string, filters?: SearchFilters, context?: TeacherContext): Promise<SearchResult[]> {
    console.log('[TA Orchestrator] Simulating tRPC call to search.findResources with query:', query, 'Filters:', filters);

    // Conceptual:
    // const response = await trpcSearchResources({ query, filters, context });
    // if (response.error) throw new Error(response.error);
    // return response.results;

    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    // Simulate based on query content for varied results
    if (query.toLowerCase().includes("math")) {
        return [
            { id: uuidv4(), title: `Simulated: Math Resource 1 for '${query}'`, snippet: 'Advanced algebra concepts.', url: '#', source: 'MathSim DB', relevanceScore: 0.9 },
        ];
    }
    return [
        { id: uuidv4(), title: `Simulated: General Result for '${query}' 1`, snippet: 'Details about result 1...', url: '#', source: 'Simulated DB', relevanceScore: 0.9 },
        { id: uuidv4(), title: `Simulated: General Result for '${query}' 2`, snippet: 'Details about result 2...', url: '#', source: 'Simulated DB', relevanceScore: 0.8 },
    ];
  }
}
