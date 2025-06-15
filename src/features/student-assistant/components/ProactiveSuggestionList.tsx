'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/core/button';
import { Card } from '@/components/ui/core/card';
import { ChevronRight, AlertCircle, Clock, BookOpen, Target as TargetIcon } from 'lucide-react';
import { ProactiveSuggestion, SuggestionType } from '../utils/proactive-suggestions';
import { AnalyticsService } from '../utils/analytics';
import { cn } from '@/lib/utils';

interface ProactiveSuggestionListProps {
  suggestions: ProactiveSuggestion[];
  onSuggestionClick: (suggestion: ProactiveSuggestion) => void;
  className?: string;
  analyticsService?: AnalyticsService;
}

/**
 * ProactiveSuggestionList component
 *
 * Displays a list of proactive suggestions for the student
 *
 * @param props Component props
 * @returns JSX element
 */
export function ProactiveSuggestionList({
  suggestions,
  onSuggestionClick,
  className,
  analyticsService
}: ProactiveSuggestionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Track suggestion views
  useEffect(() => {
    if (analyticsService && suggestions.length > 0) {
      // Track the first few suggestions as viewed
      suggestions.slice(0, 3).forEach(suggestion => {
        analyticsService.trackSuggestionViewed(suggestion);
      });
    }
  }, [suggestions, analyticsService]);

  // If no suggestions, don't render anything
  if (!suggestions.length) {
    return null;
  }

  // Sort suggestions by priority (high to low)
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">Suggestions</h3>
      <div className="space-y-2">
        {sortedSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            isExpanded={expandedId === suggestion.id}
            onToggleExpand={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
            onAction={() => {
              // Track suggestion click
              if (analyticsService) {
                analyticsService.trackSuggestionClicked(suggestion);
              }
              onSuggestionClick(suggestion);
            }}
            analyticsService={analyticsService}
          />
        ))}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: ProactiveSuggestion;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAction: () => void;
  analyticsService?: AnalyticsService;
}

/**
 * SuggestionCard component
 *
 * Displays a single proactive suggestion
 *
 * @param props Component props
 * @returns JSX element
 */
function SuggestionCard({
  suggestion,
  isExpanded,
  onToggleExpand,
  onAction,
  analyticsService
}: SuggestionCardProps) {
  return (
    <Card
      className={cn(
        "p-3 transition-all duration-200 cursor-pointer hover:bg-accent/50",
        suggestion.priority === 'high' && "border-red-400",
        suggestion.priority === 'medium' && "border-amber-400",
        suggestion.priority === 'low' && "border-blue-400"
      )}
      onClick={onToggleExpand}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <SuggestionIcon type={suggestion.type} priority={suggestion.priority} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{suggestion.title}</h4>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {suggestion.description}
          </p>

          {isExpanded && (
            <div className="mt-3">
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
              >
                {suggestion.actionText || 'Learn More'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface SuggestionIconProps {
  type: SuggestionType;
  priority: 'low' | 'medium' | 'high';
}

/**
 * SuggestionIcon component
 *
 * Displays an icon based on the suggestion type
 *
 * @param props Component props
 * @returns JSX element
 */
function SuggestionIcon({ type, priority }: SuggestionIconProps) {
  const priorityColors = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-blue-500"
  };

  const color = priorityColors[priority];

  switch (type) {
    case SuggestionType.LEARNING_GOAL_REMINDER:
      return <TargetIcon className={cn("h-5 w-5", color)} />;

    case SuggestionType.CONCEPT_REVIEW:
    case SuggestionType.SPACED_REPETITION:
      return <BookOpen className={cn("h-5 w-5", color)} />;

    case SuggestionType.CONFUSION_FOLLOWUP:
      return <AlertCircle className={cn("h-5 w-5", color)} />;

    case SuggestionType.DEADLINE_REMINDER:
      return <Clock className={cn("h-5 w-5", color)} />;

    default:
      return <ChevronRight className={cn("h-5 w-5", color)} />;
  }
}
