import { AgentMemory, MemoryType } from '../core/types';

/**
 * Manages agent memory with different memory types and persistence
 */
export class MemoryManager {
  private memories: AgentMemory[] = [];
  private persistenceKey: string;

  constructor(agentId: string) {
    this.persistenceKey = `agent-memory-${agentId}`;
    this.loadFromStorage();
  }

  /**
   * Adds or updates a memory item
   */
  setMemory(memory: AgentMemory): void {
    // Remove existing memory with same key and type if exists
    this.memories = this.memories.filter(
      m => !(m.key === memory.key && m.type === memory.type)
    );
    
    // Add new memory
    this.memories.push(memory);
    
    // Clean up expired memories
    this.cleanExpiredMemories();
    
    // Save to storage
    this.saveToStorage();
  }

  /**
   * Retrieves a memory item by key and optional type
   */
  getMemory(key: string, type?: MemoryType): AgentMemory | undefined {
    return this.memories.find(m => m.key === key && (!type || m.type === type));
  }

  /**
   * Retrieves all memories of a specific type
   */
  getMemoriesByType(type: MemoryType): AgentMemory[] {
    return this.memories.filter(m => m.type === type);
  }

  /**
   * Clears all memories or memories of a specific type
   */
  clearMemories(type?: MemoryType): void {
    if (type) {
      this.memories = this.memories.filter(m => m.type !== type);
    } else {
      this.memories = [];
    }
    
    this.saveToStorage();
  }

  /**
   * Returns all memories
   */
  getAllMemories(): AgentMemory[] {
    return [...this.memories];
  }

  /**
   * Removes expired memories based on TTL
   */
  private cleanExpiredMemories(): void {
    const now = Date.now();
    this.memories = this.memories.filter(memory => {
      if (!memory.ttl) return true;
      return now - memory.timestamp < memory.ttl;
    });
  }

  /**
   * Saves memories to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.persistenceKey, JSON.stringify(this.memories));
    } catch (error) {
      console.error('Failed to save agent memories to storage:', error);
    }
  }

  /**
   * Loads memories from localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedMemories = localStorage.getItem(this.persistenceKey);
      if (storedMemories) {
        this.memories = JSON.parse(storedMemories);
        this.cleanExpiredMemories();
      }
    } catch (error) {
      console.error('Failed to load agent memories from storage:', error);
    }
  }
}
