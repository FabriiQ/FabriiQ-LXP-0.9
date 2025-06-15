/**
 * Types for the Teacher Assistant feature
 */

import { AgentType } from '@/features/agents';

/**
 * Intent categories for message classification
 */
export enum IntentCategory {
  LESSON_PLANNING = 'LESSON_PLANNING',
  ASSESSMENT = 'ASSESSMENT',
  WORKSHEET = 'WORKSHEET',
  CONTENT_REFINEMENT = 'CONTENT_REFINEMENT',
  SEARCH = 'SEARCH',
  STUDENT_MANAGEMENT = 'STUDENT_MANAGEMENT',
  TEACHING_STRATEGY = 'TEACHING_STRATEGY',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  GENERAL = 'GENERAL'
}

/**
 * Message in the Teacher Assistant chat
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Search result from Jina Search
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

/**
 * Search filters for Jina Search
 */
export interface SearchFilters {
  contentType?: string;
  subject?: string;
  gradeLevel?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
}

/**
 * Teacher context for the Teacher Assistant
 */
export interface TeacherContext {
  teacher?: {
    id: string;
    name: string;
    subjects?: { id: string; name: string }[];
    gradeLevels?: { id: string; name: string }[];
    preferences?: TeacherPreferences;
  };
  currentClass?: {
    id: string;
    name: string;
    subject?: { id: string; name: string };
    students?: number;
    gradeLevel?: string;
  };
  currentPage?: {
    path: string;
    title: string;
  };
  recentActivities?: {
    id: string;
    title: string;
    type: string;
    date: Date;
  }[];
}

/**
 * Teacher preferences for personalization
 */
export interface TeacherPreferences {
  teachingStyle?: string[];
  preferredResources?: string[];
  communicationPreferences?: string[];
  feedbackStyle?: string[];
}

/**
 * Intent classification result
 */
export interface IntentClassification {
  type: string;
  confidence: number;
  agentType?: AgentType;
  metadata?: Record<string, any>;
}

/**
 * Teacher Assistant context value provided by the context provider
 */
export interface TeacherAssistantContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: Message[];
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  isSearchMode: boolean;
  setIsSearchMode: (isSearchMode: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  executeSearch: (query: string, filters?: SearchFilters) => Promise<void>;
  context: TeacherContext;
  trackTeacherPreference: (preference: string, category: keyof TeacherPreferences) => void;
  hasNotification: boolean;
}
