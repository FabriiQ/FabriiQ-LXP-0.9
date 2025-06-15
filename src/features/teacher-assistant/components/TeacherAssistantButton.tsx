'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/core/button';
import { MessageSquare } from 'lucide-react';
import { useTeacherAssistant } from '../hooks/use-teacher-assistant';
import { NotificationBadge } from './NotificationBadge';
import { cn } from '@/lib/utils';
import { UI } from '../constants';

interface TeacherAssistantButtonProps {
  className?: string;
}

/**
 * Floating button that toggles the teacher assistant dialog
 * 
 * Mobile-first design with responsive positioning and animations
 */
export function TeacherAssistantButton({ className }: TeacherAssistantButtonProps) {
  const { isOpen, setIsOpen, hasNotification } = useTeacherAssistant();
  const [isAnimating, setIsAnimating] = useState(false);

  // Subtle attention animation when there's a notification
  useEffect(() => {
    if (hasNotification && !isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasNotification, isOpen]);

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6",
        className
      )}
    >
      <Button
        size="icon"
        variant="default"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          isOpen && "bg-primary-dark",
          isAnimating && "animate-pulse",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close teacher assistant" : "Open teacher assistant"}
      >
        <MessageSquare className="h-6 w-6" />
        {hasNotification && !isOpen && (
          <NotificationBadge className="absolute -top-1 -right-1" />
        )}
      </Button>
    </div>
  );
}
