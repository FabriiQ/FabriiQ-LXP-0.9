'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

/**
 * Component to show a typing indicator when the assistant is generating a response
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex space-x-1 bg-muted rounded-full px-3 py-1.5">
        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"></div>
      </div>
    </div>
  );
}
