'use client';

import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  Message,
  TeacherAssistantContextValue,
  TeacherContext,
  TeacherPreferences,
  SearchResult,
  SearchFilters
} from '../types';
import { MAX_CONVERSATION_HISTORY, DEFAULT_GREETING } from '../constants';
import { TeacherAssistantOrchestrator } from '../orchestrator/teacher-assistant-orchestrator';
// Components are now rendered separately to avoid circular dependency
import { AdvancedMemoryManager, TeacherPreferenceMemory } from '@/features/agents';
import { TeacherAssistantAnalytics, TeacherAssistantEventType } from '../utils/analytics';

// Create context
export const TeacherAssistantContext = createContext<TeacherAssistantContextValue | undefined>(undefined);

// Provider props
interface TeacherAssistantProviderProps {
  children: React.ReactNode;
}

/**
 * Teacher Assistant Provider
 *
 * Provides context for the teacher assistant feature with:
 * - Chat functionality
 * - Search functionality
 * - Memory integration
 * - Teacher context awareness
 */
export function TeacherAssistantProvider({ children }: TeacherAssistantProviderProps) {
  // Session
  const { data: session } = useSession();
  const teacherId = session?.user?.id;

  // Navigation
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Basic state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNotification] = useState(false);

  // Search state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Context state
  const [teacherContext, setTeacherContext] = useState<TeacherContext>({});

  // Memory managers
  const memoryManager = useMemo(() =>
    teacherId ? new AdvancedMemoryManager(`teacher-assistant-${teacherId}`) : null,
    [teacherId]
  );

  const preferenceMemory = useMemo(() =>
    teacherId ? new TeacherPreferenceMemory(`teacher-assistant-${teacherId}`) : null,
    [teacherId]
  );

  // Analytics manager
  const analytics = useMemo(() =>
    teacherId ? new TeacherAssistantAnalytics(teacherId) : null,
    [teacherId]
  );

  // Orchestrator
  const orchestrator = useMemo(() =>
    new TeacherAssistantOrchestrator(),
    []
  );

  // Initialize with greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          role: 'assistant',
          content: DEFAULT_GREETING,
          timestamp: Date.now()
        }
      ]);
    }
  }, [messages.length]);

  // Track session start
  useEffect(() => {
    if (isOpen && analytics && session?.user) {
      // Add a small delay to ensure tRPC client is ready
      const timer = setTimeout(() => {
        analytics.trackSessionStart().catch(console.error);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, analytics, session?.user]);

  // Track session end
  useEffect(() => {
    if (!isOpen && analytics && session?.user) {
      // Add a small delay to ensure tRPC client is ready
      const timer = setTimeout(() => {
        analytics.trackSessionEnd().catch(console.error);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, analytics, session?.user]);

  // Retry failed analytics events
  useEffect(() => {
    if (analytics && session?.user) {
      // Add a delay to ensure tRPC client is ready
      const timer = setTimeout(() => {
        analytics.retryFailedEvents().catch(console.error);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [analytics, session?.user]);

  // Update context based on navigation
  useEffect(() => {
    if (pathname) {
      setTeacherContext(prev => ({
        ...prev,
        currentPage: {
          path: pathname,
          title: getPageTitle(pathname)
        }
      }));
    }
  }, [pathname, searchParams]);

  // Load teacher preferences from local memory (API integration disabled for now)
  useEffect(() => {
    if (!teacherId || !session?.user || !preferenceMemory) return;

    const loadPreferences = async () => {
      try {
        console.log('Loading teacher preferences from local memory...');

        // Load from local memory
        const loadedPreferences = preferenceMemory.getAllPreferences();

        if (loadedPreferences) {
          setTeacherContext(prev => ({
            ...prev,
            teacher: {
              id: teacherId,
              name: session.user?.name || 'Teacher',
              preferences: loadedPreferences
            }
          }));
        } else {
          // Initialize with empty preferences
          setTeacherContext(prev => ({
            ...prev,
            teacher: {
              id: teacherId,
              name: session.user?.name || 'Teacher',
              preferences: {}
            }
          }));
        }
      } catch (error) {
        console.error('Error loading teacher preferences:', error);

        // Initialize with empty preferences on error
        setTeacherContext(prev => ({
          ...prev,
          teacher: {
            id: teacherId,
            name: session.user?.name || 'Teacher',
            preferences: {}
          }
        }));
      }
    };

    loadPreferences();
  }, [preferenceMemory, teacherId, session?.user]);

  // Send message to assistant
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Create user message
    const userMessageId = uuidv4();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content,
      timestamp: Date.now()
    };

    // Add user message to chat
    setMessages(prev => {
      // Limit conversation history
      const limitedMessages = [...prev, userMessage].slice(-MAX_CONVERSATION_HISTORY);
      return limitedMessages;
    });

    // Create assistant message placeholder
    const assistantMessageId = uuidv4();
    setIsTyping(true);

    // Track message start time for analytics
    const startTime = Date.now();

    try {
      // Process message with orchestrator
      const response = await orchestrator.processMessage(content, {
        messages: messages,
        context: teacherContext
      });

      // Add assistant response
      setMessages(prev => {
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };
        return [...prev, assistantMessage].slice(-MAX_CONVERSATION_HISTORY);
      });

      // Store conversation in memory
      if (memoryManager) {
        memoryManager.addToLongTermMemory(
          `conversation-${Date.now()}`,
          { userMessage: content, assistantResponse: response },
          { type: 'conversation' }
        );
      }

      // Track message analytics
      if (analytics) {
        const intent = orchestrator.classifyIntent(content);
        const agentType = orchestrator.mapIntentToAgentType(intent);

        analytics.trackMessage(content, response, {
          intent: intent,
          agentType: agentType?.toString(),
          responseTime: Date.now() - startTime,
          classId: teacherContext.currentClass?.id,
          courseId: teacherContext.currentClass?.subject?.id
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Error processing message:', error);

      // Add error message
      setMessages(prev => {
        const errorMessage: Message = {
          id: assistantMessageId,
          role: 'error',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: Date.now()
        };
        return [...prev, errorMessage].slice(-MAX_CONVERSATION_HISTORY);
      });

      // Track error
      if (analytics) {
        analytics.trackEvent(TeacherAssistantEventType.ERROR_OCCURRED, {
          error: (error as Error).message,
          content
        }).catch(console.error);
      }
    } finally {
      setIsTyping(false);
    }
  }, [messages, teacherContext, orchestrator, memoryManager, analytics]);

  // Execute search
  const executeSearch = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) return;

    setIsSearching(true);

    // Track search start time for analytics
    const startTime = Date.now();

    try {
      // Use orchestrator to perform search
      const results = await orchestrator.search(query, filters);
      setSearchResults(results);

      // Track search analytics
      if (analytics) {
        analytics.trackSearch(query, {
          filters,
          resultsCount: results.length,
          executionTime: Date.now() - startTime
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Error executing search:', error);
      setSearchResults([]);

      // Track error
      if (analytics) {
        analytics.trackEvent(TeacherAssistantEventType.ERROR_OCCURRED, {
          error: (error as Error).message,
          query
        }).catch(console.error);
      }
    } finally {
      setIsSearching(false);
    }
  }, [orchestrator, analytics]);

  // Track teacher preference (API integration disabled for now)
  const trackTeacherPreference = useCallback(async (preference: string, category: keyof TeacherPreferences) => {
    if (!teacherId || !session?.user || !preferenceMemory) return;

    try {
      console.log('Saving teacher preference to local memory:', { category, preference });

      // Store in local memory
      preferenceMemory.setPreference(category.toString(), preference, true);

      // Update context
      setTeacherContext(prev => {
        const currentPreferences = prev.teacher?.preferences || {};
        const currentCategoryPreferences = currentPreferences[category] || [];

        return {
          ...prev,
          teacher: {
            id: prev.teacher?.id || teacherId,
            name: prev.teacher?.name || session.user?.name || 'Teacher',
            preferences: {
              ...currentPreferences,
              [category]: [...currentCategoryPreferences, preference]
            }
          }
        };
      });
    } catch (error) {
      console.error('Error saving teacher preference:', error);
    }
  }, [teacherId, preferenceMemory, session?.user]);

  // Helper function to get page title from path
  const getPageTitle = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';

    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Create context value
  const contextValue = useMemo<TeacherAssistantContextValue>(() => ({
    isOpen,
    setIsOpen,
    messages,
    isTyping,
    sendMessage,
    isSearchMode,
    setIsSearchMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    executeSearch,
    context: teacherContext,
    trackTeacherPreference,
    hasNotification
  }), [
    isOpen,
    messages,
    isTyping,
    sendMessage,
    isSearchMode,
    searchQuery,
    searchResults,
    isSearching,
    executeSearch,
    teacherContext,
    trackTeacherPreference,
    hasNotification
  ]);

  // Render the provider without the assistant components
  return (
    <TeacherAssistantContext.Provider value={contextValue}>
      {children}
    </TeacherAssistantContext.Provider>
  );
}
