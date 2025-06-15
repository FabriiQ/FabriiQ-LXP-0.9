/**
 * Constants for the Student Assistant feature
 */

/**
 * Default greeting message shown when the assistant is first opened
 */
export const DEFAULT_GREETING = "Hi there! I'm your learning assistant. How can I help you with your studies today?";

/**
 * Maximum number of messages to keep in the conversation history
 */
export const MAX_CONVERSATION_HISTORY = 50;

/**
 * Default AI model settings
 */
export const DEFAULT_AI_MODEL_SETTINGS = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
};

/**
 * Navigation-related keywords for message classification
 */
export const NAVIGATION_KEYWORDS = [
  'where',
  'find',
  'how do i',
  'navigate',
  'go to',
  'open',
  'show me',
  'access',
  'menu',
  'page',
  'dashboard',
  'settings',
];

/**
 * Subject mapping for message classification
 */
export const SUBJECT_KEYWORDS: Record<string, string[]> = {
  mathematics: ['math', 'algebra', 'geometry', 'calculus', 'equation', 'number', 'formula'],
  science: ['science', 'biology', 'chemistry', 'physics', 'experiment', 'lab'],
  english: ['english', 'literature', 'grammar', 'writing', 'essay', 'book', 'reading'],
  history: ['history', 'social studies', 'geography', 'civilization', 'war', 'culture'],
  computerScience: ['programming', 'coding', 'computer', 'algorithm', 'software'],
  art: ['art', 'drawing', 'painting', 'design', 'creative'],
  music: ['music', 'instrument', 'song', 'melody', 'rhythm'],
  physicalEducation: ['physical education', 'pe', 'sport', 'exercise', 'fitness'],
};

/**
 * Educational psychology principles for response generation
 */
export const EDUCATIONAL_PRINCIPLES = [
  'scaffolding',
  'zone of proximal development',
  'growth mindset',
  'metacognition',
  'socratic method',
  'spaced repetition',
  'constructivism',
  'differentiated instruction',
];

/**
 * Grade level appropriate vocabulary and complexity
 */
export const GRADE_LEVEL_COMPLEXITY: Record<string, { vocabulary: string, sentenceLength: number, concepts: string }> = {
  'elementary': {
    vocabulary: 'simple',
    sentenceLength: 10,
    concepts: 'concrete',
  },
  'middle': {
    vocabulary: 'moderate',
    sentenceLength: 15,
    concepts: 'transitional',
  },
  'high': {
    vocabulary: 'advanced',
    sentenceLength: 20,
    concepts: 'abstract',
  },
  'college': {
    vocabulary: 'sophisticated',
    sentenceLength: 25,
    concepts: 'theoretical',
  },
};

/**
 * Local storage keys for persisting assistant state
 */
export const STORAGE_KEYS = {
  CONVERSATION_HISTORY: 'student-assistant-conversation-history',
  ASSISTANT_SETTINGS: 'student-assistant-settings',
  NOTIFICATION_STATE: 'student-assistant-notification-state',
  ASSISTANT_CONTEXT: 'student-assistant-context',
};

/**
 * Feature flag for the Student Assistant
 */
export const FEATURE_FLAG_STUDENT_ASSISTANT = 'ENABLE_STUDENT_ASSISTANT';
