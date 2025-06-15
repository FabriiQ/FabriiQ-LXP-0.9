/**
 * Constants for the Teacher Assistant feature
 */

export const MAX_CONVERSATION_HISTORY = 50;
export const DEFAULT_GREETING = 'Hi! I\'m your teaching assistant. How can I help you today?';

// Intent classification keywords
export const INTENT_KEYWORDS = {
  LESSON_PLANNING: ['lesson plan', 'curriculum', 'unit plan', 'teaching plan', 'learning objectives'],
  ASSESSMENT: ['assessment', 'test', 'quiz', 'exam', 'grade', 'rubric', 'evaluation'],
  WORKSHEET: ['worksheet', 'handout', 'activity sheet', 'practice sheet', 'exercise'],
  CONTENT_REFINEMENT: ['improve', 'refine', 'edit', 'revise', 'enhance', 'feedback'],
  SEARCH: ['find', 'search', 'look for', 'discover', 'locate', 'resource'],
  STUDENT_MANAGEMENT: ['student', 'progress', 'intervention', 'behavior', 'performance', 'differentiation'],
  TEACHING_STRATEGY: ['strategy', 'method', 'approach', 'technique', 'pedagogy', 'instruction'],
  ADMINISTRATIVE: ['schedule', 'deadline', 'paperwork', 'documentation', 'report', 'form']
};

// Memory keys
export const MEMORY_KEYS = {
  TEACHER_PREFERENCES: 'teacher_preferences',
  RECENT_TOPICS: 'recent_topics',
  TEACHING_CHALLENGES: 'teaching_challenges',
  SUCCESSFUL_STRATEGIES: 'successful_strategies'
};

// UI constants
export const UI = {
  MOBILE_BREAKPOINT: 768,
  ASSISTANT_BUTTON_SIZE: 48,
  ASSISTANT_DIALOG_MAX_WIDTH: 420,
  ASSISTANT_DIALOG_MAX_HEIGHT: '80vh',
  ASSISTANT_DIALOG_MOBILE_HEIGHT: '90vh'
};
