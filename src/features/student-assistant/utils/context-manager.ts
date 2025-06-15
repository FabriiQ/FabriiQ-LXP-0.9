'use client';

import { StudentAssistantContext, StudentContext, ClassContext, ActivityContext, PageContext } from '../types';
import { STORAGE_KEYS } from '../constants';

/**
 * Manages context for the student assistant
 */
export class ContextManager {
  private context: StudentAssistantContext;
  
  constructor(initialContext: StudentAssistantContext = {}) {
    this.context = initialContext;
    this.loadSavedContext();
  }
  
  /**
   * Get the current context
   */
  getContext(): StudentAssistantContext {
    return this.context;
  }
  
  /**
   * Update the student context
   */
  updateStudentContext(studentContext: StudentContext): void {
    this.context.student = {
      ...this.context.student,
      ...studentContext
    };
    this.saveContext();
  }
  
  /**
   * Update the class context
   */
  updateClassContext(classContext: ClassContext): void {
    this.context.currentClass = {
      ...this.context.currentClass,
      ...classContext
    };
    this.saveContext();
  }
  
  /**
   * Update the activity context
   */
  updateActivityContext(activityContext: ActivityContext): void {
    this.context.currentActivity = {
      ...this.context.currentActivity,
      ...activityContext
    };
    this.saveContext();
  }
  
  /**
   * Update the page context
   */
  updatePageContext(pageContext: PageContext): void {
    this.context.currentPage = {
      ...this.context.currentPage,
      ...pageContext
    };
    this.saveContext();
  }
  
  /**
   * Track a concept that has been discussed
   */
  trackDiscussedConcept(concept: string, subjectId?: string): void {
    if (!this.context.discussedConcepts) {
      this.context.discussedConcepts = [];
    }
    
    // Add the concept with timestamp and subject if not already tracked
    const existingIndex = this.context.discussedConcepts.findIndex(c => c.name === concept);
    
    if (existingIndex >= 0) {
      // Update existing concept
      this.context.discussedConcepts[existingIndex] = {
        ...this.context.discussedConcepts[existingIndex],
        lastDiscussed: new Date(),
        discussionCount: (this.context.discussedConcepts[existingIndex].discussionCount || 1) + 1
      };
    } else {
      // Add new concept
      this.context.discussedConcepts.push({
        name: concept,
        firstDiscussed: new Date(),
        lastDiscussed: new Date(),
        discussionCount: 1,
        subjectId
      });
    }
    
    this.saveContext();
  }
  
  /**
   * Track a detected learning preference
   */
  trackLearningPreference(preference: string): void {
    if (!this.context.student) {
      this.context.student = {};
    }
    
    if (!this.context.student.learningPreferences) {
      this.context.student.learningPreferences = [];
    }
    
    // Add the preference if not already tracked
    if (!this.context.student.learningPreferences.includes(preference)) {
      this.context.student.learningPreferences.push(preference);
      this.saveContext();
    }
  }
  
  /**
   * Track student confusion on a topic
   */
  trackConfusion(topic: string, level: 'low' | 'medium' | 'high'): void {
    if (!this.context.confusionAreas) {
      this.context.confusionAreas = [];
    }
    
    // Check if topic already exists
    const existingIndex = this.context.confusionAreas.findIndex(c => c.topic === topic);
    
    if (existingIndex >= 0) {
      // Update existing confusion area
      this.context.confusionAreas[existingIndex] = {
        ...this.context.confusionAreas[existingIndex],
        level,
        lastDetected: new Date()
      };
    } else {
      // Add new confusion area
      this.context.confusionAreas.push({
        topic,
        level,
        firstDetected: new Date(),
        lastDetected: new Date()
      });
    }
    
    this.saveContext();
  }
  
  /**
   * Save context to localStorage
   */
  private saveContext(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.ASSISTANT_CONTEXT, JSON.stringify(this.context));
      } catch (error) {
        console.error('Error saving context to localStorage:', error);
      }
    }
  }
  
  /**
   * Load saved context from localStorage
   */
  private loadSavedContext(): void {
    if (typeof window !== 'undefined') {
      try {
        const savedContext = localStorage.getItem(STORAGE_KEYS.ASSISTANT_CONTEXT);
        if (savedContext) {
          const parsedContext = JSON.parse(savedContext) as StudentAssistantContext;
          
          // Convert string dates back to Date objects
          if (parsedContext.discussedConcepts) {
            parsedContext.discussedConcepts = parsedContext.discussedConcepts.map(concept => ({
              ...concept,
              firstDiscussed: new Date(concept.firstDiscussed),
              lastDiscussed: new Date(concept.lastDiscussed)
            }));
          }
          
          if (parsedContext.confusionAreas) {
            parsedContext.confusionAreas = parsedContext.confusionAreas.map(area => ({
              ...area,
              firstDetected: new Date(area.firstDetected),
              lastDetected: new Date(area.lastDetected)
            }));
          }
          
          this.context = {
            ...this.context,
            ...parsedContext
          };
        }
      } catch (error) {
        console.error('Error loading context from localStorage:', error);
      }
    }
  }
}
