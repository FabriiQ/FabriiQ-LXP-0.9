'use client';

import { useRef, useEffect } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { AnalyticsService } from '../utils/analytics';
import { cn } from '@/lib/utils';
import { useStudentAssistant } from '../hooks/use-student-assistant';

interface MessageListProps {
  messages: Message[];
  className?: string;
  analyticsService?: AnalyticsService;
}

/**
 * MessageList component
 *
 * Displays a list of chat messages with automatic scrolling
 *
 * @param props Component props
 * @returns JSX element
 */
export function MessageList({ messages, className, analyticsService }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentStreamingMessageId } = useStudentAssistant();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>How can I help you with your learning today?</p>
            <p className="text-sm mt-2">Ask me a question about your coursework, or for help navigating the platform.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              analyticsService={analyticsService}
              isStreaming={message.id === currentStreamingMessageId && message.content === ''}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
