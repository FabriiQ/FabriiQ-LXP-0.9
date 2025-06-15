import { AgentMemory, MemoryType } from '../core/types';
import { AdvancedMemoryManager } from './AdvancedMemoryManager';

/**
 * Feedback types
 */
export enum FeedbackType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

/**
 * Feedback data structure
 */
export interface Feedback {
  id: string;
  type: FeedbackType;
  content: string;
  score?: number; // 1-5 rating if provided
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Manager for agent learning from user feedback
 */
export class FeedbackLearningManager {
  private memoryManager: AdvancedMemoryManager;
  
  constructor(agentId: string) {
    this.memoryManager = new AdvancedMemoryManager(agentId);
  }
  
  /**
   * Records user feedback
   */
  recordFeedback(feedback: Omit<Feedback, 'id' | 'timestamp'>): string {
    const id = `feedback-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = Date.now();
    
    const fullFeedback: Feedback = {
      ...feedback,
      id,
      timestamp,
    };
    
    this.memoryManager.addToLongTermMemory(
      id,
      fullFeedback,
      { 
        category: 'feedback', 
        feedbackType: feedback.type,
        importance: this.calculateFeedbackImportance(feedback),
      }
    );
    
    // Process feedback to extract learnings
    this.processFeedback(fullFeedback);
    
    return id;
  }
  
  /**
   * Gets all feedback
   */
  getAllFeedback(): Feedback[] {
    return this.memoryManager.getLongTermMemory()
      .filter(memory => memory.metadata?.category === 'feedback')
      .map(memory => memory.value as Feedback);
  }
  
  /**
   * Gets feedback by type
   */
  getFeedbackByType(type: FeedbackType): Feedback[] {
    return this.memoryManager.getLongTermMemory()
      .filter(memory => 
        memory.metadata?.category === 'feedback' && 
        memory.metadata?.feedbackType === type
      )
      .map(memory => memory.value as Feedback);
  }
  
  /**
   * Gets learnings derived from feedback
   */
  getLearnings(): AgentMemory[] {
    return this.memoryManager.getLongTermMemory()
      .filter(memory => memory.metadata?.category === 'learning');
  }
  
  /**
   * Processes feedback to extract learnings
   */
  private processFeedback(feedback: Feedback): void {
    // In a real implementation, this would use an AI model to extract learnings
    // For now, we'll use a simple rule-based approach
    
    if (feedback.type === FeedbackType.NEGATIVE) {
      // Extract keywords from negative feedback
      const keywords = this.extractKeywords(feedback.content);
      
      // Create learning entries for common issues
      if (keywords.includes('unclear') || keywords.includes('confusing')) {
        this.addLearning('clarity', 'Improve clarity in explanations', 0.8);
      }
      
      if (keywords.includes('wrong') || keywords.includes('incorrect')) {
        this.addLearning('accuracy', 'Double-check factual information', 0.9);
      }
      
      if (keywords.includes('slow') || keywords.includes('time')) {
        this.addLearning('performance', 'Optimize response time', 0.7);
      }
    }
    
    if (feedback.type === FeedbackType.POSITIVE) {
      // Extract keywords from positive feedback
      const keywords = this.extractKeywords(feedback.content);
      
      // Create learning entries for positive reinforcement
      if (keywords.includes('helpful') || keywords.includes('useful')) {
        this.addLearning('helpfulness', 'Continue providing useful information', 0.6);
      }
      
      if (keywords.includes('clear') || keywords.includes('understandable')) {
        this.addLearning('clarity', 'Maintain clear explanations', 0.6);
      }
      
      if (keywords.includes('fast') || keywords.includes('quick')) {
        this.addLearning('performance', 'Maintain good response time', 0.6);
      }
    }
  }
  
  /**
   * Adds a learning entry
   */
  private addLearning(key: string, value: string, importance: number): void {
    const learningKey = `learning-${key}-${Date.now()}`;
    
    this.memoryManager.addToLongTermMemory(
      learningKey,
      { key, value },
      { category: 'learning', importance }
    );
  }
  
  /**
   * Extracts keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
  }
  
  /**
   * Calculates importance of feedback
   */
  private calculateFeedbackImportance(feedback: Omit<Feedback, 'id' | 'timestamp'>): number {
    // Negative feedback is generally more important for learning
    if (feedback.type === FeedbackType.NEGATIVE) {
      return feedback.score ? 0.5 + (1 - feedback.score / 5) * 0.5 : 0.8;
    }
    
    // Positive feedback with high scores is moderately important
    if (feedback.type === FeedbackType.POSITIVE) {
      return feedback.score ? 0.3 + (feedback.score / 5) * 0.3 : 0.5;
    }
    
    // Neutral feedback has moderate importance
    return 0.5;
  }
}
