'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/core/button';
import { MessageCircle, X } from 'lucide-react';
import { useStudentAssistant } from '../hooks/use-student-assistant';
import { NotificationBadge } from './NotificationBadge';
import { cn } from '@/lib/utils';

interface AssistantButtonProps {
  className?: string;
}

/**
 * AssistantButton component
 *
 * Floating button that toggles the assistant dialog
 *
 * @param props Component props
 * @returns JSX element
 */
export function AssistantButton({ className }: AssistantButtonProps) {
  const { isOpen, setIsOpen, hasNotification } = useStudentAssistant();
  const [isAnimating, setIsAnimating] = useState(false);

  // Subtle animation to draw attention when there's a notification
  useEffect(() => {
    if (hasNotification && !isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasNotification, isOpen]);

  return (
    <Button
      className={cn(
        "fixed bottom-20 right-4 rounded-full h-12 w-12 shadow-lg z-60 transition-all duration-300",
        isAnimating && "animate-pulse",
        className
      )}
      onClick={() => setIsOpen(!isOpen)}
      aria-label={isOpen ? "Close assistant" : "Open assistant"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      {hasNotification && <NotificationBadge />}
    </Button>
  );
}
