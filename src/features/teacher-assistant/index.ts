/**
 * Teacher Assistant Feature
 *
 * An AI-powered assistant for teachers that provides comprehensive support
 * across all aspects of their professional responsibilities.
 */

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export components
export { TeacherAssistantButton } from './components/TeacherAssistantButton';
export { TeacherAssistantDialog } from './components/TeacherAssistantDialog';
export { TeacherAssistantComponents } from './components/TeacherAssistantComponents';
export { ChatMessage } from './components/ChatMessage';
export { MessageInput } from './components/MessageInput';
export { MessageList } from './components/MessageList';
export { NotificationBadge } from './components/NotificationBadge';
export { TypingIndicator } from './components/TypingIndicator';
export { SearchInterface } from './components/SearchInterface';

// Export providers
export { TeacherAssistantProvider } from './providers/teacher-assistant-provider';

// Export hooks
export { useTeacherAssistant } from './hooks/use-teacher-assistant';

// Export orchestrator
export { TeacherAssistantOrchestrator } from './orchestrator/teacher-assistant-orchestrator';
