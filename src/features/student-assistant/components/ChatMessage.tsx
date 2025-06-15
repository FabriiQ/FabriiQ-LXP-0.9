'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '../types';
import { FeedbackButton } from './FeedbackButton';
import { AnalyticsService } from '../utils/analytics';
import { cn } from '@/lib/utils';
import { TypingIndicator } from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/core/button';
import { Volume2 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  className?: string;
  analyticsService?: AnalyticsService;
  isStreaming?: boolean;
}

/**
 * ChatMessage component
 *
 * Displays a single message in the chat interface
 *
 * @param props Component props
 * @returns JSX element
 */
export function ChatMessage({ message, className, analyticsService, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Text-to-speech function for assistant messages
  const speakMessage = () => {
    if (isUser || isStreaming || isSpeaking || !message.content.trim()) return;

    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "",
        className
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarImage src="/avatars/student.png" alt="You" />
        ) : (
          <AvatarImage src="/avatars/assistant.png" alt="Assistant" />
        )}
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
          {isUser ? 'You' : 'AI'}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "rounded-lg p-3 max-w-[80%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <div className={cn(
          "text-sm break-words prose prose-sm max-w-none",
          isUser ? "prose-invert" : ""
        )}>
          {isStreaming ? (
            <TypingIndicator inline />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="opacity-70">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>

          {!isUser && (
            <div className="flex items-center space-x-1">
              {/* Text-to-speech button for assistant messages */}
              <Button
                onClick={speakMessage}
                disabled={isStreaming || isSpeaking || !message.content.trim()}
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Listen to this message"
              >
                <Volume2 className={cn("h-3.5 w-3.5", isSpeaking && "text-primary animate-pulse")} />
                <span className="sr-only">Listen to this message</span>
              </Button>

              <FeedbackButton
                messageId={message.id}
                analyticsService={analyticsService}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
