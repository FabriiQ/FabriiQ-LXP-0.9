/**
 * Type definitions for the Student Assistant feature
 */

/**
 * Message object representing a chat message
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Student context information
 */
export interface StudentContext {
  id?: string;
  name?: string;
  gradeLevel?: string;
  learningPreferences?: string[];
}

/**
 * Class context information
 */
export interface ClassContext {
  id?: string;
  name?: string;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
}

/**
 * Activity context information
 */
export interface ActivityContext {
  id?: string;
  title?: string;
  type?: string;
  subject?: {
    id: string;
    name: string;
  };
  topic?: {
    id: string;
    title: string;
  };
}

/**
 * Page context information
 */
export interface PageContext {
  path: string;
  title: string;
  params?: Record<string, string>;
}

/**
 * Discussed concept information
 */
export interface DiscussedConcept {
  name: string;
  firstDiscussed: Date;
  lastDiscussed: Date;
  discussionCount: number;
  subjectId?: string;
  mastery?: 'low' | 'medium' | 'high';
}

/**
 * Confusion area information
 */
export interface ConfusionArea {
  topic: string;
  level: 'low' | 'medium' | 'high';
  firstDetected: Date;
  lastDetected: Date;
  resolved?: boolean;
}

/**
 * Learning goal information
 */
export interface LearningGoal {
  id: string;
  description: string;
  created: Date;
  targetDate?: Date;
  completed?: boolean;
  completedDate?: Date;
  progress?: number;
  relatedConcepts?: string[];
}

/**
 * Student profile information
 */
export interface StudentProfileInfo {
  enrollmentNumber: string;
  interests: string[];
  achievements: any[];
  specialNeeds: string[];
}

/**
 * Student leaderboard information
 */
export interface StudentLeaderboardInfo {
  rank: number;
  previousRank?: number;
  rankChange?: number;
  rewardPoints: number;
  academicScore: number;
  isInTopRanks: boolean;
}

/**
 * Complete context for the Student Assistant
 */
export interface StudentAssistantContext {
  student?: StudentContext;
  studentProfile?: StudentProfileInfo;
  leaderboardData?: StudentLeaderboardInfo;
  currentClass?: ClassContext;
  currentActivity?: ActivityContext;
  currentPage?: PageContext;
  discussedConcepts?: DiscussedConcept[];
  confusionAreas?: ConfusionArea[];
  learningGoals?: LearningGoal[];
  lastInteraction?: Date;
}

/**
 * Message classification types
 */
export type MessageClassificationType = 'navigation' | 'subject' | 'general';

/**
 * Message classification result
 */
export type MessageClassification =
  | { type: 'navigation' }
  | { type: 'subject', subjectId: string }
  | { type: 'general' };

/**
 * Student Assistant context value provided by the context provider
 */
export interface StudentAssistantContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: Message[];
  isTyping: boolean;
  hasNotification: boolean;
  sendMessage: (content: string) => Promise<void>;
  context: StudentAssistantContext;
  trackDiscussedConcept: (concept: string, subjectId?: string) => void;
  trackLearningPreference: (preference: string) => void;
  trackConfusion: (topic: string, level: 'low' | 'medium' | 'high') => void;
  addLearningGoal: (goal: Omit<LearningGoal, 'id' | 'created'>) => void;
  updateLearningGoal: (goalId: string, updates: Partial<Omit<LearningGoal, 'id'>>) => void;
  getSuggestedTopics: () => string[];
  currentStreamingMessageId?: string; // ID of the message currently being streamed
}

/**
 * AI service options
 */
export interface AIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Search filters for external knowledge retrieval
 */
export interface SearchFilters {
  contentType?: string;
  subject?: string;
  gradeLevel?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Search result from external knowledge source
 */
export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}
