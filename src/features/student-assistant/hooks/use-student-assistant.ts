'use client';

import { useContext } from 'react';
import { StudentAssistantContext } from '../providers/student-assistant-provider';
import { StudentAssistantContextValue } from '../types';

/**
 * Hook to access the Student Assistant context
 * 
 * @returns The Student Assistant context value
 * @throws Error if used outside of a StudentAssistantProvider
 * 
 * @example
 * ```tsx
 * const { isOpen, setIsOpen, messages, sendMessage } = useStudentAssistant();
 * ```
 */
export function useStudentAssistant(): StudentAssistantContextValue {
  const context = useContext(StudentAssistantContext);
  
  if (context === undefined) {
    throw new Error('useStudentAssistant must be used within a StudentAssistantProvider');
  }
  
  return context;
}
