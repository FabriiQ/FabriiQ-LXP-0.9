'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
  inline?: boolean;
}

/**
 * TypingIndicator component
 *
 * Displays an animated typing indicator when the assistant is generating a response
 *
 * @param props Component props
 * @returns JSX element
 */
export function TypingIndicator({ className, inline = false }: TypingIndicatorProps) {
  return (
    <div className={cn(
      "flex items-center space-x-2",
      inline ? "p-0" : "p-4",
      className
    )}>
      <div className="flex space-x-1">
        <div className={cn(
          "bg-primary rounded-full animate-bounce",
          inline ? "h-1.5 w-1.5" : "h-2 w-2"
        )} style={{ animationDelay: '0ms' }} />
        <div className={cn(
          "bg-primary rounded-full animate-bounce",
          inline ? "h-1.5 w-1.5" : "h-2 w-2"
        )} style={{ animationDelay: '150ms' }} />
        <div className={cn(
          "bg-primary rounded-full animate-bounce",
          inline ? "h-1.5 w-1.5" : "h-2 w-2"
        )} style={{ animationDelay: '300ms' }} />
      </div>
      {!inline && (
        <span className="text-sm text-muted-foreground">Assistant is typing...</span>
      )}
    </div>
  );
}
