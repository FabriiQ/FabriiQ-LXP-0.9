import { AgentMemory, AgentMessage, MemoryType } from '../core/types';
import { AdvancedMemoryManager } from './AdvancedMemoryManager';

/**
 * Manager for agent reflection capabilities
 */
export class ReflectionManager {
  private memoryManager: AdvancedMemoryManager;
  
  constructor(agentId: string) {
    this.memoryManager = new AdvancedMemoryManager(agentId);
  }
  
  /**
   * Reflects on a conversation and extracts insights
   */
  async reflectOnConversation(messages: AgentMessage[]): Promise<void> {
    if (messages.length === 0) return;
    
    // In a real implementation, this would use an AI model to extract insights
    // For now, we'll use a simple rule-based approach
    
    // Extract user preferences
    const userPreferences = this.extractUserPreferences(messages);
    if (Object.keys(userPreferences).length > 0) {
      this.memoryManager.addToLongTermMemory(
        `preferences-${Date.now()}`,
        userPreferences,
        { category: 'preferences', importance: 0.8 }
      );
    }
    
    // Extract topics of interest
    const topics = this.extractTopicsOfInterest(messages);
    if (topics.length > 0) {
      this.memoryManager.addToLongTermMemory(
        `topics-${Date.now()}`,
        { topics },
        { category: 'topics', importance: 0.7 }
      );
    }
    
    // Extract interaction patterns
    const interactionPatterns = this.extractInteractionPatterns(messages);
    if (Object.keys(interactionPatterns).length > 0) {
      this.memoryManager.addToLongTermMemory(
        `interaction-patterns-${Date.now()}`,
        interactionPatterns,
        { category: 'interaction-patterns', importance: 0.6 }
      );
    }
    
    // Add recent conversation summary to working memory
    this.memoryManager.addToWorkingMemory(
      `conversation-summary-${Date.now()}`,
      {
        messageCount: messages.length,
        lastMessageTimestamp: messages[messages.length - 1].timestamp,
        topics,
      },
      { category: 'conversation-summary', importance: 0.5 }
    );
  }
  
  /**
   * Extracts user preferences from messages
   */
  private extractUserPreferences(messages: AgentMessage[]): Record<string, any> {
    const preferences: Record<string, any> = {};
    
    // Simple keyword-based extraction
    messages.forEach(message => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        
        // Extract difficulty preferences
        if (content.includes('too difficult') || content.includes('too hard')) {
          preferences.difficultyLevel = 'easier';
        } else if (content.includes('too easy') || content.includes('too simple')) {
          preferences.difficultyLevel = 'harder';
        }
        
        // Extract format preferences
        if (content.includes('more visual') || content.includes('more images')) {
          preferences.visualContent = 'high';
        } else if (content.includes('less visual') || content.includes('fewer images')) {
          preferences.visualContent = 'low';
        }
        
        // Extract length preferences
        if (content.includes('too long') || content.includes('shorter')) {
          preferences.contentLength = 'shorter';
        } else if (content.includes('too short') || content.includes('longer')) {
          preferences.contentLength = 'longer';
        }
      }
    });
    
    return preferences;
  }
  
  /**
   * Extracts topics of interest from messages
   */
  private extractTopicsOfInterest(messages: AgentMessage[]): string[] {
    const topics = new Set<string>();
    
    // Simple keyword-based extraction
    const topicKeywords = [
      'math', 'science', 'history', 'language', 'art', 'music',
      'physics', 'chemistry', 'biology', 'geography', 'literature',
      'algebra', 'geometry', 'calculus', 'statistics', 'programming',
    ];
    
    messages.forEach(message => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        
        topicKeywords.forEach(topic => {
          if (content.includes(topic)) {
            topics.add(topic);
          }
        });
      }
    });
    
    return Array.from(topics);
  }
  
  /**
   * Extracts interaction patterns from messages
   */
  private extractInteractionPatterns(messages: AgentMessage[]): Record<string, any> {
    const patterns: Record<string, any> = {};
    
    // Count message types
    const messageCounts = {
      user: 0,
      agent: 0,
      system: 0,
      error: 0,
    };
    
    messages.forEach(message => {
      if (message.role in messageCounts) {
        messageCounts[message.role as keyof typeof messageCounts]++;
      }
    });
    
    patterns.messageCounts = messageCounts;
    
    // Calculate average message length
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
      patterns.averageUserMessageLength = totalLength / userMessages.length;
    }
    
    // Detect question frequency
    const questionCount = userMessages.filter(m => 
      m.content.includes('?') || 
      m.content.toLowerCase().startsWith('what') ||
      m.content.toLowerCase().startsWith('how') ||
      m.content.toLowerCase().startsWith('why') ||
      m.content.toLowerCase().startsWith('when') ||
      m.content.toLowerCase().startsWith('where')
    ).length;
    
    patterns.questionFrequency = userMessages.length > 0 
      ? questionCount / userMessages.length 
      : 0;
    
    return patterns;
  }
  
  /**
   * Gets all reflections
   */
  getAllReflections(): Record<string, AgentMemory[]> {
    const longTermMemories = this.memoryManager.getLongTermMemory();
    
    // Group by category
    return longTermMemories.reduce((grouped, memory) => {
      const category = memory.metadata?.category || 'uncategorized';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(memory);
      
      return grouped;
    }, {} as Record<string, AgentMemory[]>);
  }
  
  /**
   * Gets reflections by category
   */
  getReflectionsByCategory(category: string): AgentMemory[] {
    return this.memoryManager.getLongTermMemory()
      .filter(memory => memory.metadata?.category === category);
  }
  
  /**
   * Searches reflections using keywords
   */
  searchReflections(query: string): AgentMemory[] {
    return this.memoryManager.searchMemories(query, MemoryType.LONG_TERM);
  }
  
  /**
   * Clears all reflections
   */
  clearReflections(): void {
    this.memoryManager.clearMemories(MemoryType.LONG_TERM);
  }
}
