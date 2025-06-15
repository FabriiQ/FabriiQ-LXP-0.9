import { AgentMemory, MemoryType } from '../core/types';
import { MemoryManager } from './MemoryManager';

/**
 * Specialized memory manager for teacher preferences
 */
export class TeacherPreferenceMemory {
  private memoryManager: MemoryManager;
  
  constructor(agentId: string) {
    this.memoryManager = new MemoryManager(agentId);
  }
  
  /**
   * Sets a teacher preference
   */
  setPreference(category: string, key: string, value: any): void {
    const memory: AgentMemory = {
      type: MemoryType.LONG_TERM,
      key: `preference:${category}:${key}`,
      value,
      timestamp: Date.now(),
      metadata: {
        category,
        preferenceKey: key,
        isPreference: true,
      },
    };
    
    this.memoryManager.setMemory(memory);
  }
  
  /**
   * Gets a teacher preference
   */
  getPreference(category: string, key: string): any {
    const memory = this.memoryManager.getMemory(`preference:${category}:${key}`);
    return memory?.value;
  }
  
  /**
   * Gets all preferences in a category
   */
  getCategoryPreferences(category: string): Record<string, any> {
    const allMemories = this.memoryManager.getAllMemories();
    const categoryMemories = allMemories.filter(
      m => m.type === MemoryType.LONG_TERM && 
           m.metadata?.isPreference && 
           m.metadata?.category === category
    );
    
    return categoryMemories.reduce((prefs, memory) => {
      const key = memory.metadata?.preferenceKey;
      if (key) {
        prefs[key] = memory.value;
      }
      return prefs;
    }, {} as Record<string, any>);
  }
  
  /**
   * Gets all teacher preferences
   */
  getAllPreferences(): Record<string, Record<string, any>> {
    const allMemories = this.memoryManager.getAllMemories();
    const preferenceMemories = allMemories.filter(
      m => m.type === MemoryType.LONG_TERM && m.metadata?.isPreference
    );
    
    return preferenceMemories.reduce((categories, memory) => {
      const category = memory.metadata?.category;
      const key = memory.metadata?.preferenceKey;
      
      if (category && key) {
        if (!categories[category]) {
          categories[category] = {};
        }
        categories[category][key] = memory.value;
      }
      
      return categories;
    }, {} as Record<string, Record<string, any>>);
  }
  
  /**
   * Clears all preferences or preferences in a specific category
   */
  clearPreferences(category?: string): void {
    if (category) {
      const allMemories = this.memoryManager.getAllMemories();
      const memoriesToKeep = allMemories.filter(m => {
        if (m.type !== MemoryType.LONG_TERM || !m.metadata?.isPreference) {
          return true;
        }
        return m.metadata?.category !== category;
      });
      
      this.memoryManager.clearMemories();
      memoriesToKeep.forEach(m => this.memoryManager.setMemory(m));
    } else {
      const allMemories = this.memoryManager.getAllMemories();
      const memoriesToKeep = allMemories.filter(
        m => m.type !== MemoryType.LONG_TERM || !m.metadata?.isPreference
      );
      
      this.memoryManager.clearMemories();
      memoriesToKeep.forEach(m => this.memoryManager.setMemory(m));
    }
  }
  
  /**
   * Extracts preferences from conversation history
   */
  extractPreferencesFromConversation(messages: Array<{ role: string; content: string }>): Record<string, any> {
    // In a real implementation, this would use NLP or an AI model to extract preferences
    // For now, we'll return a simple mock implementation
    
    const extractedPreferences: Record<string, any> = {};
    
    // Simple keyword-based extraction (would be much more sophisticated in reality)
    messages.forEach(message => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        
        // Extract difficulty preferences
        if (content.includes('too difficult') || content.includes('too hard')) {
          extractedPreferences.difficultyLevel = 'easier';
        } else if (content.includes('too easy') || content.includes('too simple')) {
          extractedPreferences.difficultyLevel = 'harder';
        }
        
        // Extract format preferences
        if (content.includes('more visual') || content.includes('more images')) {
          extractedPreferences.visualContent = 'high';
        } else if (content.includes('less visual') || content.includes('fewer images')) {
          extractedPreferences.visualContent = 'low';
        }
        
        // Extract length preferences
        if (content.includes('too long') || content.includes('shorter')) {
          extractedPreferences.contentLength = 'shorter';
        } else if (content.includes('too short') || content.includes('longer')) {
          extractedPreferences.contentLength = 'longer';
        }
      }
    });
    
    return extractedPreferences;
  }
}
