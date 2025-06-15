import { AgentMemory, MemoryType } from '../core/types';
import { MemoryManager } from './MemoryManager';

/**
 * Advanced memory manager with long-term and working memory capabilities
 */
export class AdvancedMemoryManager {
  private memoryManager: MemoryManager;
  private workingMemoryCapacity: number;
  private workingMemoryTTL: number;
  private semanticIndex: Map<string, Set<string>> = new Map();

  constructor(
    agentId: string,
    workingMemoryCapacity: number = 10,
    workingMemoryTTL: number = 1000 * 60 * 30 // 30 minutes
  ) {
    this.memoryManager = new MemoryManager(agentId);
    this.workingMemoryCapacity = workingMemoryCapacity;
    this.workingMemoryTTL = workingMemoryTTL;
    this.buildSemanticIndex();
  }

  /**
   * Adds or updates a memory in working memory
   */
  addToWorkingMemory(key: string, value: any, metadata?: Record<string, any>): void {
    // Create memory object
    const memory: AgentMemory = {
      type: MemoryType.WORKING,
      key,
      value,
      metadata: {
        ...metadata,
        importance: metadata?.importance || 0.5,
      },
      timestamp: Date.now(),
      ttl: this.workingMemoryTTL,
    };

    // Add to memory manager
    this.memoryManager.setMemory(memory);

    // Ensure working memory doesn't exceed capacity
    this.enforceWorkingMemoryCapacity();

    // Update semantic index
    this.updateSemanticIndex(memory);
  }

  /**
   * Adds or updates a memory in long-term memory
   */
  addToLongTermMemory(key: string, value: any, metadata?: Record<string, any>): void {
    // Create memory object
    const memory: AgentMemory = {
      type: MemoryType.LONG_TERM,
      key,
      value,
      metadata: {
        ...metadata,
        importance: metadata?.importance || 0.5,
      },
      timestamp: Date.now(),
    };

    // Add to memory manager
    this.memoryManager.setMemory(memory);

    // Update semantic index
    this.updateSemanticIndex(memory);
  }

  /**
   * Retrieves a memory by key and type
   */
  getMemory(key: string, type?: MemoryType): AgentMemory | undefined {
    return this.memoryManager.getMemory(key, type);
  }

  /**
   * Retrieves all working memory items
   */
  getWorkingMemory(): AgentMemory[] {
    return this.memoryManager.getMemoriesByType(MemoryType.WORKING);
  }

  /**
   * Retrieves all long-term memory items
   */
  getLongTermMemory(): AgentMemory[] {
    return this.memoryManager.getMemoriesByType(MemoryType.LONG_TERM);
  }

  /**
   * Searches for memories using keywords
   */
  searchMemories(query: string, type?: MemoryType): AgentMemory[] {
    const keywords = this.extractKeywords(query);
    const memoryKeys = new Set<string>();

    // Find memory keys that match the keywords
    keywords.forEach(keyword => {
      const keys = this.semanticIndex.get(keyword.toLowerCase());
      if (keys) {
        keys.forEach(key => memoryKeys.add(key));
      }
    });

    // Retrieve the memories
    const memories = Array.from(memoryKeys)
      .map(key => this.memoryManager.getMemory(key))
      .filter(memory => memory !== undefined && (!type || memory.type === type)) as AgentMemory[];

    // Sort by relevance (number of matching keywords)
    return memories.sort((a, b) => {
      const aMatches = this.countMatchingKeywords(a, keywords);
      const bMatches = this.countMatchingKeywords(b, keywords);
      return bMatches - aMatches;
    });
  }

  /**
   * Promotes a working memory to long-term memory
   */
  promoteToLongTerm(key: string): void {
    const memory = this.memoryManager.getMemory(key, MemoryType.WORKING);
    if (memory) {
      this.addToLongTermMemory(key, memory.value, memory.metadata);
      this.memoryManager.clearMemories(MemoryType.WORKING);
    }
  }

  /**
   * Clears all memories of a specific type
   */
  clearMemories(type?: MemoryType): void {
    this.memoryManager.clearMemories(type);
    if (!type || type === MemoryType.WORKING || type === MemoryType.LONG_TERM) {
      this.buildSemanticIndex();
    }
  }

  /**
   * Ensures working memory doesn't exceed capacity
   */
  private enforceWorkingMemoryCapacity(): void {
    const workingMemories = this.getWorkingMemory();
    
    if (workingMemories.length <= this.workingMemoryCapacity) {
      return;
    }

    // Sort by importance and recency
    const sortedMemories = workingMemories.sort((a, b) => {
      const importanceA = a.metadata?.importance || 0.5;
      const importanceB = b.metadata?.importance || 0.5;
      const recencyA = a.timestamp;
      const recencyB = b.timestamp;
      
      // Weighted score (70% importance, 30% recency)
      const scoreA = importanceA * 0.7 + (recencyA / Date.now()) * 0.3;
      const scoreB = importanceB * 0.7 + (recencyB / Date.now()) * 0.3;
      
      return scoreB - scoreA;
    });

    // Remove least important/oldest memories
    const memoriesToRemove = sortedMemories.slice(this.workingMemoryCapacity);
    memoriesToRemove.forEach(memory => {
      this.memoryManager.clearMemories(memory.type);
    });
  }

  /**
   * Builds the semantic index from existing memories
   */
  private buildSemanticIndex(): void {
    this.semanticIndex.clear();
    
    const memories = [
      ...this.memoryManager.getMemoriesByType(MemoryType.WORKING),
      ...this.memoryManager.getMemoriesByType(MemoryType.LONG_TERM),
    ];

    memories.forEach(memory => {
      this.updateSemanticIndex(memory);
    });
  }

  /**
   * Updates the semantic index with a memory
   */
  private updateSemanticIndex(memory: AgentMemory): void {
    // Extract keywords from memory
    const keywords = this.extractKeywords(
      typeof memory.value === 'string' 
        ? memory.value 
        : JSON.stringify(memory.value)
    );

    // Add memory key to each keyword's set
    keywords.forEach(keyword => {
      const key = keyword.toLowerCase();
      if (!this.semanticIndex.has(key)) {
        this.semanticIndex.set(key, new Set());
      }
      this.semanticIndex.get(key)?.add(memory.key);
    });
  }

  /**
   * Extracts keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (in a real implementation, this would be more sophisticated)
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));
  }

  /**
   * Checks if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
      'his', 'from', 'they', 'she', 'will', 'would', 'there', 'their', 'what',
      'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take',
      'into', 'year', 'your', 'good', 'some', 'could', 'them', 'than', 'then',
      'look', 'only', 'come', 'over', 'think', 'also', 'back', 'after', 'work',
    ]);
    
    return stopWords.has(word);
  }

  /**
   * Counts how many keywords match a memory
   */
  private countMatchingKeywords(memory: AgentMemory, keywords: string[]): number {
    const memoryText = typeof memory.value === 'string' 
      ? memory.value 
      : JSON.stringify(memory.value);
    
    const memoryKeywords = this.extractKeywords(memoryText);
    const memoryKeywordSet = new Set(memoryKeywords.map(k => k.toLowerCase()));
    
    return keywords.filter(k => memoryKeywordSet.has(k.toLowerCase())).length;
  }
}
