'use client';

/**
 * Activity Analytics
 *
 * This module provides functions for tracking user interactions with activities.
 * It can be integrated with various analytics providers.
 */

// Define analytics event types
export type AnalyticsEventType =
  | 'activity_start'
  | 'activity_complete'
  | 'activity_submit'  // Added for submission events
  | 'activity_reset'   // Added for reset events
  | 'reading_complete' // Added for reading completion events
  | 'question_view'
  | 'question_answer'
  | 'option_select'
  | 'hint_view'
  | 'explanation_view'
  | 'sequence_reorder'
  | 'matching_pair'
  | 'item_matched'     // Added for matching events
  | 'item_unmatched'   // Added for unmatching events
  | 'blank_fill'
  | 'blank_typing'     // Added for typing in blanks
  | 'media_view'
  | 'media_play'
  | 'media_pause'
  | 'media_complete';

// Define analytics event data
export interface AnalyticsEventData {
  activityId?: string;
  activityType?: string;
  questionId?: string;
  questionIndex?: number;
  optionId?: string;
  optionIndex?: number;
  correct?: boolean;
  score?: number;
  maxScore?: number;
  timeSpent?: number;
  attemptNumber?: number;
  mediaType?: 'image' | 'video' | 'audio';
  mediaId?: string;
  [key: string]: any;
}

// Define analytics provider interface
export interface AnalyticsProvider {
  trackEvent: (eventType: AnalyticsEventType, eventData: AnalyticsEventData) => void;
  setUser: (userId: string, userProperties?: Record<string, any>) => void;
  pageView: (pageName: string, pageProperties?: Record<string, any>) => void;
}

// Default analytics provider (console logging)
class ConsoleAnalyticsProvider implements AnalyticsProvider {
  trackEvent(eventType: AnalyticsEventType, eventData: AnalyticsEventData): void {
    console.log(`[Analytics] Event: ${eventType}`, eventData);
  }

  setUser(userId: string, userProperties?: Record<string, any>): void {
    console.log(`[Analytics] Set User: ${userId}`, userProperties);
  }

  pageView(pageName: string, pageProperties?: Record<string, any>): void {
    console.log(`[Analytics] Page View: ${pageName}`, pageProperties);
  }
}

// Analytics manager
class AnalyticsManager {
  private provider: AnalyticsProvider;
  private sessionStartTime: number;
  private lastInteractionTime: number;
  private interactionCount: Record<string, number> = {};

  constructor(provider?: AnalyticsProvider) {
    this.provider = provider || new ConsoleAnalyticsProvider();
    this.sessionStartTime = Date.now();
    this.lastInteractionTime = this.sessionStartTime;
  }

  // Set the analytics provider
  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  // Track an event
  trackEvent(eventType: AnalyticsEventType, eventData: AnalyticsEventData = {}): void {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastInteractionTime;

    // Update interaction count
    this.interactionCount[eventType] = (this.interactionCount[eventType] || 0) + 1;

    // Add timing data
    const enhancedData = {
      ...eventData,
      timestamp: now,
      sessionDuration: now - this.sessionStartTime,
      timeSinceLastInteraction,
      interactionCount: this.interactionCount[eventType]
    };

    // Track the event
    this.provider.trackEvent(eventType, enhancedData);

    // Update last interaction time
    this.lastInteractionTime = now;
  }

  // Set the current user
  setUser(userId: string, userProperties?: Record<string, any>): void {
    this.provider.setUser(userId, userProperties);
  }

  // Track a page view
  pageView(pageName: string, pageProperties?: Record<string, any>): void {
    this.provider.pageView(pageName, pageProperties);
  }

  // Track activity start
  trackActivityStart(activityId: string, activityType: string): void {
    this.trackEvent('activity_start', { activityId, activityType });
  }

  // Track activity completion
  trackActivityComplete(
    activityId: string,
    activityType: string,
    score: number,
    maxScore: number,
    timeSpent: number
  ): void {
    this.trackEvent('activity_complete', {
      activityId,
      activityType,
      score,
      maxScore,
      timeSpent,
      percentageScore: maxScore > 0 ? (score / maxScore) * 100 : 0
    });
  }

  // Track question view
  trackQuestionView(
    activityId: string,
    questionId: string,
    questionIndex: number
  ): void {
    this.trackEvent('question_view', {
      activityId,
      questionId,
      questionIndex
    });
  }

  // Track question answer
  trackQuestionAnswer(
    activityId: string,
    questionId: string,
    questionIndex: number,
    correct: boolean,
    score: number,
    maxScore: number,
    attemptNumber: number
  ): void {
    this.trackEvent('question_answer', {
      activityId,
      questionId,
      questionIndex,
      correct,
      score,
      maxScore,
      attemptNumber
    });
  }

  // Track option selection
  trackOptionSelect(
    activityId: string,
    questionId: string,
    optionId: string,
    optionIndex: number,
    correct: boolean
  ): void {
    this.trackEvent('option_select', {
      activityId,
      questionId,
      optionId,
      optionIndex,
      correct
    });
  }

  // Track hint view
  trackHintView(
    activityId: string,
    questionId: string,
    questionIndex: number
  ): void {
    this.trackEvent('hint_view', {
      activityId,
      questionId,
      questionIndex
    });
  }

  // Track explanation view
  trackExplanationView(
    activityId: string,
    questionId: string,
    questionIndex: number
  ): void {
    this.trackEvent('explanation_view', {
      activityId,
      questionId,
      questionIndex
    });
  }

  // Track sequence reordering
  trackSequenceReorder(
    activityId: string,
    questionId: string,
    itemId: string,
    fromPosition: number,
    toPosition: number
  ): void {
    this.trackEvent('sequence_reorder', {
      activityId,
      questionId,
      itemId,
      fromPosition,
      toPosition,
      distance: Math.abs(toPosition - fromPosition)
    });
  }

  // Track matching pair
  trackMatchingPair(
    activityId: string,
    questionId: string,
    leftItemId: string,
    rightItemId: string,
    correct: boolean
  ): void {
    this.trackEvent('matching_pair', {
      activityId,
      questionId,
      leftItemId,
      rightItemId,
      correct
    });
  }

  // Track blank fill
  trackBlankFill(
    activityId: string,
    questionId: string,
    blankId: string,
    userAnswer: string,
    correct: boolean
  ): void {
    this.trackEvent('blank_fill', {
      activityId,
      questionId,
      blankId,
      userAnswer,
      correct
    });
  }

  // Track media view
  trackMediaView(
    activityId: string,
    mediaId: string,
    mediaType: 'image' | 'video' | 'audio'
  ): void {
    this.trackEvent('media_view', {
      activityId,
      mediaId,
      mediaType
    });
  }

  // Track media play
  trackMediaPlay(
    activityId: string,
    mediaId: string,
    mediaType: 'video' | 'audio'
  ): void {
    this.trackEvent('media_play', {
      activityId,
      mediaId,
      mediaType
    });
  }

  // Track media pause
  trackMediaPause(
    activityId: string,
    mediaId: string,
    mediaType: 'video' | 'audio',
    currentTime: number,
    duration: number
  ): void {
    this.trackEvent('media_pause', {
      activityId,
      mediaId,
      mediaType,
      currentTime,
      duration,
      percentageComplete: duration > 0 ? (currentTime / duration) * 100 : 0
    });
  }

  // Track media complete
  trackMediaComplete(
    activityId: string,
    mediaId: string,
    mediaType: 'video' | 'audio',
    duration: number
  ): void {
    this.trackEvent('media_complete', {
      activityId,
      mediaId,
      mediaType,
      duration
    });
  }

  // Track generic interaction
  trackInteraction(
    interactionType: string,
    data: Record<string, any>
  ): void {
    // Convert the interaction type to a valid analytics event type if possible
    const eventType = this.mapInteractionToEventType(interactionType);
    this.trackEvent(eventType as AnalyticsEventType, data);
  }

  // Map interaction types to valid event types
  private mapInteractionToEventType(interactionType: string): string {
    const mapping: Record<string, AnalyticsEventType> = {
      'blank_typing': 'blank_typing',
      'item_matched': 'item_matched',
      'item_unmatched': 'item_unmatched',
      'reading_complete': 'reading_complete'
    };

    return mapping[interactionType] || interactionType;
  }
}

// Create a singleton instance
export const analyticsManager = new AnalyticsManager();

// Export the analytics manager
export default analyticsManager;
