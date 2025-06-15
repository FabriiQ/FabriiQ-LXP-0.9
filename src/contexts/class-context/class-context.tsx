'use client';

/**
 * Class Context
 *
 * This context provides information about a student's class, including performance metrics,
 * achievements, and attendance. It follows mental models by organizing information in a
 * way that aligns with how students think about their classes.
 *
 * Features:
 * - Loading states with educational micro-content
 * - Error states with empathetic messaging
 * - Organized data structure that matches student mental models
 * - Retry functionality for error recovery
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import {
  ClassContextState,
  ClassData,
  LEARNING_FACTS,
  ERROR_MESSAGES
} from './types';

// Create the context with a default value of null
const ClassContext = createContext<ClassContextState | null>(null);

// Create a hook to access the context
export function useClass() {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
}

// Props for the ClassProvider component
interface ClassProviderProps {
  children: ReactNode;
  classId?: string; // Optional: can be provided directly or from URL params
}

// ClassProvider component that wraps children with the context
export function ClassProvider({ children, classId: propClassId }: ClassProviderProps) {
  // Get classId from URL params if not provided as prop
  const params = useParams();
  const classId = propClassId || (params?.id as string);

  // Select a random learning fact for loading state
  const [learningFact, setLearningFact] = useState(() => {
    const randomIndex = Math.floor(Math.random() * LEARNING_FACTS.length);
    return LEARNING_FACTS[randomIndex];
  });

  // Try to get initial data from cache
  const getInitialData = () => {
    if (typeof window === 'undefined' || !classId) return null;

    try {
      // First try sessionStorage (for view transitions)
      const sessionData = sessionStorage.getItem(`class-data-${classId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        console.log('[ClassContext] Initializing with session data:', parsed.className);
        return parsed;
      }

      // Then try localStorage (for offline use)
      const localData = localStorage.getItem(`class-data-${classId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('[ClassContext] Initializing with local storage data:', parsed.className);
        return parsed;
      }
    } catch (e) {
      console.error('[ClassContext] Error reading initial data from cache:', e);
    }

    return null;
  };

  // Get initial cached data
  const initialData = getInitialData();

  // Initialize state with cached data if available
  const [state, setState] = useState<Omit<ClassContextState, 'retry'>>({
    classId: classId || '',
    className: initialData?.className || '',
    loading: !initialData, // Only show loading if we don't have cached data
    error: false,
    errorMessage: '',
    data: initialData,
    learningFact
  });

  // Log initial state
  useEffect(() => {
    console.log('[ClassContext] Initial state:', {
      classId,
      hasData: !!state.data,
      className: state.className,
      loading: state.loading
    });
  }, []);

  // Rotate learning facts during extended loading
  useEffect(() => {
    if (!classId) return;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * LEARNING_FACTS.length);
      setLearningFact(LEARNING_FACTS[randomIndex]);
      setState(prev => ({ ...prev, learningFact: LEARNING_FACTS[randomIndex] }));
    }, 8000); // Change fact every 8 seconds

    return () => clearInterval(interval);
  }, [classId]);

  // Fetch class details using tRPC with a more robust approach
  const {
    data: classDetails,
    isLoading,
    error,
    refetch,
    isFetching
  } = api.student.getClassDetails.useQuery(
    { classId: classId || '' },
    {
      enabled: !!classId,
      retry: 3, // Increase retries for more reliability
      retryDelay: 1000, // Wait 1 second between retries
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
      keepPreviousData: true, // Keep previous data while fetching new data
      cacheTime: 10 * 60 * 1000, // Cache data for 10 minutes
      refetchInterval: false, // Don't automatically refetch at intervals
      suspense: false, // Don't use React Suspense for loading states
      useErrorBoundary: false, // Don't use error boundaries
      onSuccess: (data) => {
        console.log('[ClassContext] Data fetched successfully:', data?.className);

        // Explicitly update state when data is fetched successfully
        // This ensures the UI is updated even during view transitions
        if (data) {
          setState(prev => ({
            ...prev,
            classId,
            className: data.className,
            loading: false,
            error: false,
            errorMessage: '',
            data: data as ClassData,
            learningFact
          }));

          // Cache the data for future use
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(`class-data-${classId}`, JSON.stringify(data));
            }
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(`class-data-${classId}`, JSON.stringify(data));
            }
          } catch (e) {
            console.error('[ClassContext] Error caching class data:', e);
          }
        }
      },
      onError: (err) => {
        console.error('[ClassContext] Error fetching data:', err);
      }
    }
  );

  // Error recovery function
  const retry = () => {
    setState(prev => ({ ...prev, loading: true, error: false }));
    void refetch();
  };

  // Update loading state when isLoading changes
  useEffect(() => {
    console.log('[ClassContext] Loading state effect:', {
      isLoading,
      hasData: !!state.data,
      classId
    });

    // Only update loading state if we're not already showing data
    // This prevents flickering during transitions
    if (isLoading && !state.data) {
      console.log('[ClassContext] Setting loading state to true');
      setState(prev => ({
        ...prev,
        loading: true
      }));
    }
  }, [isLoading, state.data, classId]);

  // Handle errors separately
  useEffect(() => {
    if (!error) return;

    console.error('[ClassContext] Handling error:', error);

    // Map error to appropriate message
    let errorMessage = ERROR_MESSAGES.DEFAULT;
    if (error.message.includes('network')) {
      errorMessage = ERROR_MESSAGES.NETWORK;
    } else if (error.message.includes('not found')) {
      errorMessage = ERROR_MESSAGES.NOT_FOUND;
    } else if (error.message.includes('unauthorized')) {
      errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (error.message.includes('server')) {
      errorMessage = ERROR_MESSAGES.SERVER;
    }

    // Try to load from session storage first (for view transitions)
    let cachedData = null;
    if (typeof sessionStorage !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(`class-data-${classId}`);
        if (cached) {
          cachedData = JSON.parse(cached);
          console.log('[ClassContext] Found data in sessionStorage:', cachedData.className);
        }
      } catch (e) {
        console.error('[ClassContext] Error reading from sessionStorage:', e);
      }
    }

    // If not in session storage, try localStorage (for offline use)
    if (!cachedData && typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(`class-data-${classId}`);
        if (cached) {
          cachedData = JSON.parse(cached);
          console.log('[ClassContext] Found data in localStorage:', cachedData.className);
        }
      } catch (e) {
        console.error('[ClassContext] Error reading from localStorage:', e);
      }
    }

    if (cachedData && typeof cachedData === 'object' && 'className' in cachedData) {
      // Use cached data but show error state
      setState(prev => ({
        ...prev,
        data: cachedData as ClassData,
        className: (cachedData as ClassData).className || '',
        loading: false,
        error: true,
        errorMessage: errorMessage + ' Using cached data.'
      }));
    } else {
      // No cached data available
      setState(prev => ({
        ...prev,
        loading: false,
        error: true,
        errorMessage
      }));
    }
  }, [error, classId]);

  // Combine state with retry function
  const contextValue: ClassContextState & { retry: () => void } = {
    ...state,
    retry
  };

  return (
    <ClassContext.Provider value={contextValue}>
      {children}
    </ClassContext.Provider>
  );
}
