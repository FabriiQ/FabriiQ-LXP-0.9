/**
 * Cache configuration
 * 
 * This file contains configuration for caching in the application.
 */

export const CACHE_CONFIG = {
  // Cache durations in seconds
  DURATIONS: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
  
  // Cache tags for revalidation
  TAGS: {
    // User-related
    USER: 'user',
    TEACHER: 'teacher',
    STUDENT: 'student',
    
    // Class-related
    CLASS: 'class',
    ENROLLMENT: 'enrollment',
    
    // Curriculum-related
    SUBJECT: 'subject',
    TOPIC: 'topic',
    LEARNING_OUTCOME: 'learning_outcome',
    
    // Assessment-related
    ASSESSMENT: 'assessment',
    SUBMISSION: 'submission',
    GRADE: 'grade',
    
    // Bloom's Taxonomy related
    BLOOMS_TAXONOMY: 'blooms_taxonomy',
    BLOOMS_ANALYTICS: 'blooms_analytics',
    MASTERY: 'mastery',
    RUBRIC: 'rubric',
    REPORT: 'report',
    
    // Activity-related
    ACTIVITY: 'activity',
    ACTIVITY_TEMPLATE: 'activity_template',
    
    // System-related
    SYSTEM: 'system',
    SETTINGS: 'settings',
  }
};
