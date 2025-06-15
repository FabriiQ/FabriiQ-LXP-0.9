'use client';

import { useContext } from 'react';
import { TeacherAssistantContext } from '../providers/teacher-assistant-provider';
import { TeacherAssistantContextValue } from '../types';

/**
 * Hook to access the Teacher Assistant context
 * 
 * @returns The Teacher Assistant context value
 * @throws Error if used outside of a TeacherAssistantProvider
 * 
 * @example
 * ```tsx
 * const { isOpen, setIsOpen, messages, sendMessage } = useTeacherAssistant();
 * ```
 */
export function useTeacherAssistant(): TeacherAssistantContextValue {
  const context = useContext(TeacherAssistantContext);
  
  if (context === undefined) {
    throw new Error('useTeacherAssistant must be used within a TeacherAssistantProvider');
  }
  
  return context;
}
