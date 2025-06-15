'use client';

import { Message, StudentAssistantContext } from '../types';
import { ProactiveSuggestion } from './proactive-suggestions';

/**
 * Analytics event types
 */
export enum AnalyticsEventType {
  ASSISTANT_OPENED = 'assistant_opened',
  ASSISTANT_CLOSED = 'assistant_closed',
  MESSAGE_SENT = 'message_sent',
  RESPONSE_RECEIVED = 'response_received',
  SUGGESTION_VIEWED = 'suggestion_viewed',
  SUGGESTION_CLICKED = 'suggestion_clicked',
  FEEDBACK_PROVIDED = 'feedback_provided',
  CONCEPT_DISCUSSED = 'concept_discussed',
  CONFUSION_DETECTED = 'confusion_detected',
  LEARNING_PREFERENCE_DETECTED = 'learning_preference_detected',
  TAB_CHANGED = 'tab_changed'
}

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  data?: Record<string, any>;
}

/**
 * Analytics service for tracking Student Assistant usage
 */
export class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.userId = userId;

    // Check if analytics is disabled by user preference
    if (typeof window !== 'undefined') {
      const analyticsDisabled = localStorage.getItem('student_assistant_analytics_disabled');
      if (analyticsDisabled === 'true') {
        this.isEnabled = false;
      }
    }
  }

  /**
   * Track an analytics event
   */
  trackEvent(type: AnalyticsEventType, data?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      type,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      data
    };

    this.events.push(event);
    this.saveEvents();
    this.sendEventToServer(event);
  }

  /**
   * Track when the assistant is opened
   */
  trackAssistantOpened(): void {
    this.trackEvent(AnalyticsEventType.ASSISTANT_OPENED);
  }

  /**
   * Track when the assistant is closed
   */
  trackAssistantClosed(durationMs: number): void {
    this.trackEvent(AnalyticsEventType.ASSISTANT_CLOSED, { durationMs });
  }

  /**
   * Track when a message is sent
   */
  trackMessageSent(message: Message): void {
    this.trackEvent(AnalyticsEventType.MESSAGE_SENT, {
      messageId: message.id,
      contentLength: message.content.length,
      timestamp: message.timestamp
    });
  }

  /**
   * Track when a response is received
   */
  trackResponseReceived(message: Message, latencyMs: number): void {
    this.trackEvent(AnalyticsEventType.RESPONSE_RECEIVED, {
      messageId: message.id,
      contentLength: message.content.length,
      timestamp: message.timestamp,
      latencyMs
    });
  }

  /**
   * Track when a suggestion is viewed
   */
  trackSuggestionViewed(suggestion: ProactiveSuggestion): void {
    this.trackEvent(AnalyticsEventType.SUGGESTION_VIEWED, {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type,
      priority: suggestion.priority
    });
  }

  /**
   * Track when a suggestion is clicked
   */
  trackSuggestionClicked(suggestion: ProactiveSuggestion): void {
    this.trackEvent(AnalyticsEventType.SUGGESTION_CLICKED, {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type,
      priority: suggestion.priority,
      actionText: suggestion.actionText
    });
  }

  /**
   * Track when feedback is provided
   */
  trackFeedbackProvided(rating: number, comment?: string): void {
    this.trackEvent(AnalyticsEventType.FEEDBACK_PROVIDED, {
      rating,
      comment,
      timestamp: new Date()
    });
  }

  /**
   * Track when a concept is discussed
   */
  trackConceptDiscussed(concept: string, subjectId?: string): void {
    this.trackEvent(AnalyticsEventType.CONCEPT_DISCUSSED, {
      concept,
      subjectId,
      timestamp: new Date()
    });
  }

  /**
   * Track when confusion is detected
   */
  trackConfusionDetected(topic: string, level: 'low' | 'medium' | 'high'): void {
    this.trackEvent(AnalyticsEventType.CONFUSION_DETECTED, {
      topic,
      level,
      timestamp: new Date()
    });
  }

  /**
   * Track when a learning preference is detected
   */
  trackLearningPreferenceDetected(preference: string): void {
    this.trackEvent(AnalyticsEventType.LEARNING_PREFERENCE_DETECTED, {
      preference,
      timestamp: new Date()
    });
  }

  /**
   * Track when the tab is changed
   */
  trackTabChanged(tab: 'chat' | 'suggestions'): void {
    this.trackEvent(AnalyticsEventType.TAB_CHANGED, {
      tab,
      timestamp: new Date()
    });
  }

  /**
   * Get analytics data for the current session
   */
  getSessionAnalytics(): Record<string, any> {
    const messageEvents = this.events.filter(e =>
      e.type === AnalyticsEventType.MESSAGE_SENT ||
      e.type === AnalyticsEventType.RESPONSE_RECEIVED
    );

    const suggestionEvents = this.events.filter(e =>
      e.type === AnalyticsEventType.SUGGESTION_VIEWED ||
      e.type === AnalyticsEventType.SUGGESTION_CLICKED
    );

    const conceptEvents = this.events.filter(e =>
      e.type === AnalyticsEventType.CONCEPT_DISCUSSED
    );

    const confusionEvents = this.events.filter(e =>
      e.type === AnalyticsEventType.CONFUSION_DETECTED
    );

    return {
      sessionId: this.sessionId,
      startTime: this.events[0]?.timestamp,
      messageCount: messageEvents.filter(e => e.type === AnalyticsEventType.MESSAGE_SENT).length,
      responseCount: messageEvents.filter(e => e.type === AnalyticsEventType.RESPONSE_RECEIVED).length,
      averageMessageLength: this.calculateAverageMessageLength(messageEvents),
      averageResponseTime: this.calculateAverageResponseTime(messageEvents),
      suggestionViewCount: suggestionEvents.filter(e => e.type === AnalyticsEventType.SUGGESTION_VIEWED).length,
      suggestionClickCount: suggestionEvents.filter(e => e.type === AnalyticsEventType.SUGGESTION_CLICKED).length,
      conceptsDiscussed: this.extractUniqueValues(conceptEvents, 'concept'),
      confusionTopics: this.extractUniqueValues(confusionEvents, 'topic')
    };
  }

  /**
   * Enable analytics tracking
   */
  enableAnalytics(): void {
    this.isEnabled = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_assistant_analytics_disabled');
    }
  }

  /**
   * Disable analytics tracking
   */
  disableAnalytics(): void {
    this.isEnabled = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_assistant_analytics_disabled', 'true');
    }
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Save events to localStorage
   */
  private saveEvents(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('student_assistant_analytics', JSON.stringify(this.events));
      } catch (error) {
        console.error('Error saving analytics events:', error);
      }
    }
  }

  /**
   * Send event to server
   */
  private sendEventToServer(event: AnalyticsEvent): void {
    // In a real implementation, this would send the event to a server
    // For now, we'll just log it to the console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics event:', event);
    }

    // TODO: Implement actual server-side tracking
    // This would typically use a fetch call to an API endpoint
  }

  /**
   * Calculate average message length
   */
  private calculateAverageMessageLength(events: AnalyticsEvent[]): number {
    const messageLengths = events
      .filter(e => e.type === AnalyticsEventType.MESSAGE_SENT && e.data?.contentLength)
      .map(e => e.data!.contentLength);

    if (messageLengths.length === 0) return 0;

    return messageLengths.reduce((sum, length) => sum + length, 0) / messageLengths.length;
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(events: AnalyticsEvent[]): number {
    const responseTimes = events
      .filter(e => e.type === AnalyticsEventType.RESPONSE_RECEIVED && e.data?.latencyMs)
      .map(e => e.data!.latencyMs);

    if (responseTimes.length === 0) return 0;

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  /**
   * Extract unique values from events
   */
  private extractUniqueValues(events: AnalyticsEvent[], key: string): string[] {
    const values = events
      .filter(e => e.data && e.data[key])
      .map(e => e.data![key]);

    return [...new Set(values)];
  }
}
