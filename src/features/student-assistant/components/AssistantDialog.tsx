'use client';

import { useState, useEffect, useRef } from 'react';
import { useStudentAssistant } from '../hooks/use-student-assistant';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ProactiveSuggestionList } from './ProactiveSuggestionList';
import { Button } from '@/components/ui/core/button';
import { X } from 'lucide-react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { AnalyticsService, AnalyticsEventType } from '../utils/analytics';
import { ProactiveSuggestion, SuggestionType } from '../utils/proactive-suggestions';

interface AssistantDialogProps {
  className?: string;
}

/**
 * AssistantDialog component
 *
 * Dialog that contains the chat interface
 *
 * @param props Component props
 * @returns JSX element
 */
export function AssistantDialog({ className }: AssistantDialogProps) {
  const { isOpen, setIsOpen, messages, isTyping } = useStudentAssistant();
  const { isMobile } = useResponsive();
  // Only using chat tab for now
  const [activeTab] = useState<'chat'>('chat');
  const analyticsServiceRef = useRef<AnalyticsService | null>(null);

  // Initialize analytics service
  useEffect(() => {
    if (!analyticsServiceRef.current) {
      analyticsServiceRef.current = new AnalyticsService();
    }
  }, []);

  // Track dialog open/close
  useEffect(() => {
    if (analyticsServiceRef.current) {
      if (isOpen) {
        analyticsServiceRef.current.trackAssistantOpened();
      } else {
        // Track close with duration if we have an open timestamp
        const events = analyticsServiceRef.current.getSessionAnalytics();
        if (events.startTime) {
          const durationMs = new Date().getTime() - new Date(events.startTime).getTime();
          analyticsServiceRef.current.trackAssistantClosed(durationMs);
        }
      }
    }
  }, [isOpen]);

  // Track tab changes
  useEffect(() => {
    if (analyticsServiceRef.current) {
      analyticsServiceRef.current.trackTabChanged(activeTab);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Generate suggestions based on context
  const suggestions: ProactiveSuggestion[] = [
    {
      id: '1',
      type: SuggestionType.LEARNING_GOAL_REMINDER,
      title: 'Review Recent Concepts',
      description: 'Strengthen your understanding by reviewing recently discussed topics.',
      priority: 'medium',
      created: new Date(),
      actionText: 'Start Review'
    },
    {
      id: '2',
      type: SuggestionType.DEADLINE_REMINDER,
      title: 'Upcoming Assignment',
      description: 'Don\'t forget to complete your current activity before the deadline.',
      priority: 'high',
      created: new Date(),
      actionText: 'View Activity'
    }
  ];

  const handleSuggestionClick = (suggestion: ProactiveSuggestion) => {
    // Handle suggestion click based on type
    if (suggestion.type === SuggestionType.LEARNING_GOAL_REMINDER) {
      // Start a conversation about reviewing concepts
      setActiveTab('chat');
    } else if (suggestion.type === SuggestionType.DEADLINE_REMINDER) {
      // Navigate to the activity
      setActiveTab('chat');
    }
  };

  return (
    <div
      className={cn(
        "fixed bg-background border shadow-lg flex flex-col z-60 transition-all duration-300",
        isMobile
          ? "inset-0 h-[calc(100%-56px)] top-0 rounded-none" // Full screen on mobile but avoid bottom nav
          : "inset-y-0 right-0 w-96 md:w-[450px] lg:w-[500px] border-l", // Wider chat on desktop
        className
      )}
    >
      <div className={cn(
        "border-b flex justify-between items-center sticky top-0 bg-background z-10",
        isMobile ? "p-5" : "p-4"
      )}>
        <h2 className={cn(
          "font-semibold",
          isMobile ? "text-xl" : "text-lg"
        )}>Learning Assistant</h2>
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          className={isMobile ? "h-10 w-10 p-0" : "h-8 w-8 p-0"}
          onClick={() => setIsOpen(false)}
        >
          <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Tab navigation removed - only using chat tab */}

      <MessageList
        messages={messages}
        analyticsService={analyticsServiceRef.current || undefined}
      />

      {isTyping && <TypingIndicator />}

      <div className={cn(
        "border-t mt-auto",
        isMobile ? "p-5" : "p-4"
      )}>
        <MessageInput />
      </div>
    </div>
  );
}
