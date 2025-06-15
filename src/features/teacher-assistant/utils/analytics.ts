/**
 * Analytics service for the Teacher Assistant
 *
 * Tracks usage patterns and interactions to improve the assistant over time
 */

// Event types for teacher assistant analytics
export enum TeacherAssistantEventType {
  ASSISTANT_OPENED = 'assistant_opened',
  ASSISTANT_CLOSED = 'assistant_closed',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_COPIED = 'message_copied',
  SEARCH_PERFORMED = 'search_performed',
  SEARCH_RESULT_CLICKED = 'search_result_clicked',
  FEEDBACK_GIVEN = 'feedback_given',
  VOICE_INPUT_USED = 'voice_input_used',
  VOICE_OUTPUT_USED = 'voice_output_used',
  PREFERENCE_SAVED = 'preference_saved',
  ERROR_OCCURRED = 'error_occurred'
}

// Interface for analytics events
export interface AnalyticsEvent {
  eventType: TeacherAssistantEventType;
  teacherId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Interface for message analytics
export interface MessageAnalytics {
  messageLength: number;
  responseLength: number;
  responseTime: number;
  intent?: string;
  agentType?: string;
  classId?: string;
  courseId?: string;
}

// Interface for search analytics
export interface SearchAnalytics {
  query: string;
  filters?: Record<string, any>;
  resultsCount: number;
  executionTime: number;
}

/**
 * Analytics service for tracking Teacher Assistant usage
 */
export class TeacherAssistantAnalytics {
  private teacherId: string;
  private sessionStartTime: number;
  private messageCount: number = 0;
  private searchCount: number = 0;
  private sessionEvents: AnalyticsEvent[] = [];

  constructor(teacherId: string) {
    this.teacherId = teacherId;
    this.sessionStartTime = Date.now();
  }

  /**
   * Track an assistant event
   */
  async trackEvent(eventType: TeacherAssistantEventType, metadata?: Record<string, any>): Promise<void> {
    const event: AnalyticsEvent = {
      eventType,
      teacherId: this.teacherId,
      timestamp: Date.now(),
      metadata
    };

    // Add to session events
    this.sessionEvents.push(event);

    // Update counters
    if (eventType === TeacherAssistantEventType.MESSAGE_SENT) {
      this.messageCount++;
    } else if (eventType === TeacherAssistantEventType.SEARCH_PERFORMED) {
      this.searchCount++;
    }

    try {
      // For now, just store events locally until tRPC client is properly configured
      console.log('Teacher Assistant Analytics Event:', {
        eventType: event.eventType,
        category: 'teacher_assistant',
        userId: this.teacherId,
        metadata: event.metadata
      });

      // Store event for future API implementation
      this.storeFailedEvent(event);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Store failed events for retry later
      this.storeFailedEvent(event);
    }
  }

  /**
   * Track a message interaction
   */
  async trackMessage(message: string, response: string, analytics: Partial<MessageAnalytics> = {}): Promise<void> {
    const startTime = Date.now();

    const metadata: MessageAnalytics = {
      messageLength: message.length,
      responseLength: response.length,
      responseTime: Date.now() - startTime,
      ...analytics
    };

    await this.trackEvent(TeacherAssistantEventType.MESSAGE_SENT, metadata);
  }

  /**
   * Track a search interaction
   */
  async trackSearch(query: string, analytics: Partial<SearchAnalytics> = {}): Promise<void> {
    const metadata: SearchAnalytics = {
      query,
      resultsCount: analytics.resultsCount || 0,
      executionTime: analytics.executionTime || 0,
      filters: analytics.filters
    };

    await this.trackEvent(TeacherAssistantEventType.SEARCH_PERFORMED, metadata);
  }

  /**
   * Track feedback on an assistant response
   */
  async trackFeedback(messageId: string, isPositive: boolean, comment?: string): Promise<void> {
    await this.trackEvent(TeacherAssistantEventType.FEEDBACK_GIVEN, {
      messageId,
      isPositive,
      comment,
      timestamp: Date.now()
    });
  }

  /**
   * Track voice input usage
   */
  async trackVoiceInput(durationMs: number, successful: boolean): Promise<void> {
    await this.trackEvent(TeacherAssistantEventType.VOICE_INPUT_USED, {
      durationMs,
      successful,
      timestamp: Date.now()
    });
  }

  /**
   * Track voice output usage
   */
  async trackVoiceOutput(textLength: number, durationMs: number): Promise<void> {
    await this.trackEvent(TeacherAssistantEventType.VOICE_OUTPUT_USED, {
      textLength,
      durationMs,
      timestamp: Date.now()
    });
  }

  /**
   * Track session start
   */
  async trackSessionStart(): Promise<void> {
    await this.trackEvent(TeacherAssistantEventType.ASSISTANT_OPENED);
  }

  /**
   * Track session end
   */
  async trackSessionEnd(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionStartTime;

    await this.trackEvent(TeacherAssistantEventType.ASSISTANT_CLOSED, {
      sessionDuration,
      messageCount: this.messageCount,
      searchCount: this.searchCount
    });
  }

  /**
   * Store failed event for retry later
   */
  private storeFailedEvent(event: AnalyticsEvent): void {
    try {
      // Get existing failed events
      const storedEvents = localStorage.getItem('ta-failed-analytics');
      const failedEvents = storedEvents ? JSON.parse(storedEvents) : [];

      // Add new failed event
      failedEvents.push(event);

      // Store updated list
      localStorage.setItem('ta-failed-analytics', JSON.stringify(failedEvents));
    } catch (error) {
      console.error('Failed to store failed analytics event:', error);
    }
  }

  /**
   * Retry sending failed events
   */
  async retryFailedEvents(): Promise<void> {
    try {
      // Get failed events
      const storedEvents = localStorage.getItem('ta-failed-analytics');
      if (!storedEvents) return;

      const failedEvents: AnalyticsEvent[] = JSON.parse(storedEvents);
      if (failedEvents.length === 0) return;

      // Clear stored events
      localStorage.removeItem('ta-failed-analytics');

      // For now, just log the retry attempt
      console.log('Retrying failed analytics events:', failedEvents.length);

      // TODO: Implement proper tRPC API calls when client is ready
      // For now, keep events stored for future implementation
    } catch (error) {
      console.error('Failed to retry analytics events:', error);
    }
  }
}
