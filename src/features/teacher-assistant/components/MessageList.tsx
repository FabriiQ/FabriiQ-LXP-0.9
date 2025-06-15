'use client';

import { useEffect, useRef } from 'react';
import { useTeacherAssistant } from '../hooks/use-teacher-assistant';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/lib/utils';

interface MessageListProps {
  className?: string;
}

/**
 * Component to display a list of chat messages
 * 
 * Features:
 * - Automatic scrolling to the latest message
 * - Optimized rendering for large message lists
 */
export function MessageList({ className }: MessageListProps) {
  const { messages } = useTeacherAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-center">
            Ask me anything about teaching, lesson planning, or student management.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
