'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import {
  Message,
  StudentAssistantContext as StudentAssistantContextType,
  StudentAssistantContextValue,
  LearningGoal,
  StudentContext
} from '../types';
import { LeaderboardEntityType, TimeGranularity } from '@/features/leaderboard/types/standard-leaderboard';

// Constants
const STORAGE_KEYS = {
  CONVERSATION_HISTORY: 'student-assistant-conversation-history',
};

const MAX_CONVERSATION_HISTORY = 50;
const DEFAULT_GREETING = 'Hi! I\'m your learning assistant. How can I help you?';

// Import components
import { AssistantButton, AssistantDialog } from '../components';

// Create context
export const StudentAssistantContext = createContext<StudentAssistantContextValue>({
  isOpen: false,
  setIsOpen: () => {},
  messages: [],
  isTyping: false,
  hasNotification: false,
  sendMessage: async () => {},
  context: {},
  trackDiscussedConcept: () => {},
  trackLearningPreference: () => {},
  trackConfusion: () => {},
  addLearningGoal: () => {},
  updateLearningGoal: () => {},
  getSuggestedTopics: () => [],
  currentStreamingMessageId: undefined,
});

// Provider props
interface StudentAssistantProviderProps {
  children: React.ReactNode;
}

/**
 * Student Assistant Provider
 *
 * Provides context for the student assistant feature
 */
export function StudentAssistantProvider({ children }: StudentAssistantProviderProps) {
  // Session
  const { data: session } = useSession();

  // Navigation
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Basic state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | undefined>();

  // Context state
  const [assistantContext, setAssistantContext] = useState<StudentAssistantContextType>({});

  // API mutations and queries
  const getAssistantResponse = api.studentAssistant.getAssistantResponse.useMutation();

  // Get class and activity data
  const classIdMatch = pathname?.match(/\/student\/class(?:es)?\/([^\/]+)/);
  const classId = classIdMatch ? classIdMatch[1] : undefined;

  // Get student profile data
  const { data: studentProfile } = api.user.getProfile.useQuery(
    {
      userId: session?.user?.id || '',
      userType: 'CAMPUS_STUDENT'
    },
    { enabled: !!session?.user?.id, staleTime: 5 * 60 * 1000 }
  );

  // Get student leaderboard position
  const { data: leaderboardPosition } = api.unifiedLeaderboard.getStudentPosition.useQuery(
    {
      type: LeaderboardEntityType.CLASS,
      referenceId: classId || '',
      studentId: session?.user?.id || '',
      timeGranularity: TimeGranularity.ALL_TIME
    },
    { enabled: !!classId && !!session?.user?.id, staleTime: 5 * 60 * 1000 }
  );

  const activityIdMatch = pathname?.match(/\/student\/activit(?:y|ies)\/([^\/]+)/);
  const activityId = activityIdMatch ? activityIdMatch[1] : undefined;

  const { data: classData } = api.student.getClassDetails.useQuery(
    { classId: classId! },
    { enabled: !!classId, staleTime: 5 * 60 * 1000 }
  );

  // Get activity data from class router since student router doesn't have a specific method
  const { data: activityData } = api.class.getActivity.useQuery(
    { id: activityId! },
    { enabled: !!activityId, staleTime: 5 * 60 * 1000 }
  );

  // Load conversation history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMessages = localStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          setMessages(parsedMessages);
        } else {
          // Add initial greeting message if no history exists
          const initialMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: DEFAULT_GREETING,
            timestamp: new Date()
          };
          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving conversation history:', error);
      }
    }
  }, [messages]);

  // Update context when relevant data changes
  useEffect(() => {
    if (!session) return;

    // Create context object
    const newContext: StudentAssistantContextType = {
      student: session.user ? {
        id: session.user.id,
        name: session.user.name || 'Student',
        gradeLevel: 'K-12', // Default grade level
        learningPreferences: [],
      } : undefined,

      // Store additional student data in separate context properties
      studentProfile: studentProfile ? {
        // Check if properties exist before accessing them
        enrollmentNumber: 'enrollmentNumber' in studentProfile ? studentProfile.enrollmentNumber as string : '',
        interests: 'interests' in studentProfile && Array.isArray(studentProfile.interests) ? studentProfile.interests : [],
        achievements: 'achievements' in studentProfile && Array.isArray(studentProfile.achievements) ? studentProfile.achievements : [],
        specialNeeds: 'specialNeeds' in studentProfile && Array.isArray(studentProfile.specialNeeds) ? studentProfile.specialNeeds : [],
      } : undefined,

      // Add leaderboard data
      leaderboardData: leaderboardPosition ? {
        rank: leaderboardPosition.rank,
        previousRank: leaderboardPosition.previousRank,
        rankChange: leaderboardPosition.rankChange,
        rewardPoints: leaderboardPosition.rewardPoints,
        academicScore: leaderboardPosition.academicScore,
        isInTopRanks: leaderboardPosition.isInTopRanks,
      } : undefined,

      currentClass: classData ? {
        id: classData.classId,
        name: classData.className,
        subject: classData.courseId ? {
          id: classData.courseId,
          name: classData.courseName || 'Subject',
        } : undefined,
      } : undefined,

      currentActivity: activityData ? {
        id: activityData.id,
        title: activityData.title,
        // Use purpose or activityType from content as the type
        type: activityData.purpose ||
              (activityData.content && typeof activityData.content === 'object' &&
               'activityType' in activityData.content ?
               (activityData.content as any).activityType : 'activity'),
        // Get subject from subjectId
        subject: activityData.subjectId ? {
          id: activityData.subjectId,
          name: 'Subject', // Default name if not available
        } : undefined,
      } : undefined,

      currentPage: {
        path: pathname || '',
        title: document.title,
      },
    };

    // Only update if context has changed
    setAssistantContext(prev => {
      if (JSON.stringify(prev) === JSON.stringify(newContext)) {
        return prev;
      }
      return newContext;
    });
  }, [session, classData, activityData, pathname]);

  // Send message function
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Add user message
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      // Create assistant message placeholder
      const assistantMessageId = uuidv4();
      setCurrentStreamingMessageId(assistantMessageId);

      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => {
        const updatedMessages = [...prev, initialAssistantMessage];
        if (updatedMessages.length > MAX_CONVERSATION_HISTORY) {
          return updatedMessages.slice(-MAX_CONVERSATION_HISTORY);
        }
        return updatedMessages;
      });

      // Add formatting instructions and token limit to the context
      const enhancedContext = {
        ...assistantContext,
        responseSettings: {
          maxLength: 500, // Increased limit to 500 tokens
          format: "markdown", // Use proper markdown formatting
          language: "simple" // Use simple English
        },
        systemInstructions: "Keep your response under 500 tokens. Use simple English. Format your response with proper markdown for better readability."
      };

      // Call API to get assistant response
      const result = await getAssistantResponse.mutateAsync({
        message: content + "\n\n[Please keep your answer concise (max 500 tokens) and use proper markdown formatting for better readability]",
        classId: assistantContext.currentClass?.id,
        activityId: assistantContext.currentActivity?.id,
        context: JSON.stringify(enhancedContext)
      });

      // Update the assistant message with the full response
      setMessages(prev => {
        return prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: result.response }
            : msg
        );
      });

    } catch (error) {
      console.error('Error getting assistant response:', error);

      // If we have a streaming message in progress, update it with the error
      if (currentStreamingMessageId) {
        setMessages(prev => {
          return prev.map(msg =>
            msg.id === currentStreamingMessageId
              ? {
                  ...msg,
                  content: 'Sorry, I had a problem. Please try again.'
                }
              : msg
          );
        });
      } else {
        // Add error message
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Sorry, I had a problem. Please try again.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
      setCurrentStreamingMessageId(undefined);
    }
  };

  // Simple helper functions
  const trackDiscussedConcept = useCallback((concept: string, subjectId?: string) => {
    const now = new Date();
    setAssistantContext(prev => ({
      ...prev,
      discussedConcepts: [...(prev.discussedConcepts || []), {
        name: concept,
        firstDiscussed: now,
        lastDiscussed: now,
        discussionCount: 1,
        subjectId,
        mastery: 'low'
      }]
    }));
  }, []);

  const trackLearningPreference = useCallback((preference: string) => {
    setAssistantContext(prev => {
      // Update student context with learning preference
      const updatedStudent = prev.student ? {
        ...prev.student,
        learningPreferences: [...(prev.student.learningPreferences || []), preference]
      } : undefined;

      return {
        ...prev,
        student: updatedStudent
      };
    });
  }, []);

  const trackConfusion = useCallback((topic: string, level: 'low' | 'medium' | 'high') => {
    const now = new Date();
    setAssistantContext(prev => ({
      ...prev,
      confusionAreas: [...(prev.confusionAreas || []), {
        topic,
        level,
        firstDetected: now,
        lastDetected: now,
        resolved: false
      }]
    }));
  }, []);

  const addLearningGoal = useCallback((goal: Omit<LearningGoal, 'id' | 'created'>) => {
    setAssistantContext(prev => ({
      ...prev,
      learningGoals: [...(prev.learningGoals || []), {
        ...goal,
        id: uuidv4(),
        created: new Date(),
        completed: false
      }]
    }));
  }, []);

  const updateLearningGoal = useCallback((goalId: string, updates: Partial<Omit<LearningGoal, 'id'>>) => {
    setAssistantContext(prev => ({
      ...prev,
      learningGoals: (prev.learningGoals || []).map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      )
    }));
  }, []);

  const getSuggestedTopics = useCallback(() => {
    // Simple implementation - in a real app, this would be more sophisticated
    return ['Math: Algebra', 'Science: Newton\'s Laws', 'English: Essay Writing'];
  }, []);

  // Create context value
  const contextValue = useMemo<StudentAssistantContextValue>(() => ({
    isOpen,
    setIsOpen,
    messages,
    isTyping,
    hasNotification,
    sendMessage,
    context: assistantContext,
    trackDiscussedConcept,
    trackLearningPreference,
    trackConfusion,
    addLearningGoal,
    updateLearningGoal,
    getSuggestedTopics,
    currentStreamingMessageId,
  }), [
    isOpen,
    messages,
    isTyping,
    hasNotification,
    assistantContext,
    currentStreamingMessageId,
    trackDiscussedConcept,
    trackLearningPreference,
    trackConfusion,
    addLearningGoal,
    updateLearningGoal,
    getSuggestedTopics,
  ]);

  // Render the provider with the assistant components
  return (
    <StudentAssistantContext.Provider value={contextValue}>
      {children}
      {/* Only render these components if we have a valid user session */}
      {session?.user && (
        <>
          <AssistantButton />
          <AssistantDialog />
        </>
      )}
    </StudentAssistantContext.Provider>
  );
}