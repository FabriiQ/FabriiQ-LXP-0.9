/**
 * Student Assistant
 * 
 * This module exports the components and utilities for the Student Assistant feature,
 * which provides an AI-powered chat interface to help students with their learning.
 */

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export components
export { AssistantButton } from './components/AssistantButton';
export { AssistantDialog } from './components/AssistantDialog';
export { ChatMessage } from './components/ChatMessage';
export { MessageInput } from './components/MessageInput';
export { MessageList } from './components/MessageList';
export { NotificationBadge } from './components/NotificationBadge';
export { TypingIndicator } from './components/TypingIndicator';

// Export providers
export { StudentAssistantProvider } from './providers/student-assistant-provider';

// Export hooks
export { useStudentAssistant } from './hooks/use-student-assistant';
