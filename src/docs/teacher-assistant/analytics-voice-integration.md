# Teacher Assistant Analytics and Voice Integration

This document describes the implementation of analytics tracking and voice integration features for the Teacher Assistant.

## Analytics Implementation

The analytics system tracks usage patterns and interactions to improve the Teacher Assistant over time. It provides insights into how teachers are using the assistant, which features are most popular, and what types of questions are being asked.

### Key Components

1. **TeacherAssistantAnalytics Class**: Core service for tracking events and metrics
2. **Analytics API Endpoints**: Backend API for storing and retrieving analytics data
3. **Analytics Dashboard**: UI for visualizing analytics data
4. **Database Models**: Schema for storing analytics events and metrics

### Event Types

The following event types are tracked:

- `assistant_opened`: When the assistant dialog is opened
- `assistant_closed`: When the assistant dialog is closed
- `message_sent`: When a message is sent to the assistant
- `search_performed`: When a search is performed
- `search_result_clicked`: When a search result is clicked
- `feedback_given`: When feedback is provided on an assistant response
- `voice_input_used`: When voice input is used
- `voice_output_used`: When text-to-speech is used
- `preference_saved`: When a teacher preference is saved
- `error_occurred`: When an error occurs during assistant usage

### Analytics Metrics

The following metrics are tracked:

- **Total Events**: Total number of interactions with the assistant
- **Message Count**: Number of messages sent to the assistant
- **Search Count**: Number of searches performed
- **Feedback Count**: Number of times feedback was provided
- **Voice Input Count**: Number of times voice input was used
- **Voice Output Count**: Number of times text-to-speech was used

### Implementation Details

1. **Event Tracking**:
   ```typescript
   // Track an event
   analytics.trackEvent(TeacherAssistantEventType.MESSAGE_SENT, {
     messageLength: message.length,
     responseLength: response.length,
     intent: 'lesson_planning'
   });
   ```

2. **Session Tracking**:
   ```typescript
   // Track session start
   analytics.trackSessionStart();
   
   // Track session end
   analytics.trackSessionEnd();
   ```

3. **Offline Support**:
   ```typescript
   // Store failed events for retry
   private storeFailedEvent(event: AnalyticsEvent): void {
     // Implementation details...
   }
   
   // Retry failed events
   async retryFailedEvents(): Promise<void> {
     // Implementation details...
   }
   ```

### Analytics Dashboard

The analytics dashboard provides visualizations of the collected data:

1. **Daily Usage**: Line chart showing interactions per day
2. **Feature Usage**: Pie chart showing usage breakdown by feature
3. **Top Intents**: Bar chart showing most common user intents
4. **Summary Cards**: Cards showing key metrics

## Voice Integration

The voice integration system provides speech-to-text and text-to-speech capabilities for the Teacher Assistant.

### Key Components

1. **VoiceService Class**: Core service for speech recognition and synthesis
2. **Voice UI Components**: UI for voice input and output
3. **Analytics Integration**: Tracking of voice feature usage

### Speech Recognition

The speech recognition feature allows teachers to speak to the assistant instead of typing:

```typescript
// Start speech recognition
const transcript = await voiceService.startListening(
  { language: 'en-US', interimResults: true },
  (text, isFinal) => {
    if (isFinal) {
      setMessage(prev => prev + ' ' + text);
    } else {
      setInterimTranscript(text);
    }
  }
);
```

### Text-to-Speech

The text-to-speech feature allows the assistant's responses to be read aloud:

```typescript
// Speak text
await voiceService.speak(text, {
  rate: 1.0,
  pitch: 1.0
});
```

### Implementation Details

1. **Browser Compatibility**:
   ```typescript
   // Check if browser supports speech recognition
   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
   
   if (!SpeechRecognition) {
     console.warn('Speech recognition not supported in this browser');
     return;
   }
   ```

2. **Voice Options**:
   ```typescript
   // Apply options
   if (options.voice) utterance.voice = options.voice;
   if (options.pitch) utterance.pitch = options.pitch;
   if (options.rate) utterance.rate = options.rate;
   if (options.volume) utterance.volume = options.volume;
   ```

3. **Markdown Handling**:
   ```typescript
   // Extract plain text from message content (remove markdown)
   const plainText = message.content
     .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
     .replace(/\*(.*?)\*/g, '$1')     // Remove italic
     .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Remove links
     .replace(/```([\s\S]*?)```/g, '') // Remove code blocks
     .replace(/`(.*?)`/g, '$1')       // Remove inline code
     .replace(/#{1,6}\s(.*?)(\n|$)/g, '$1$2'); // Remove headings
   ```

## Integration with Teacher Assistant

### Analytics Integration

The analytics system is integrated with the Teacher Assistant in the following ways:

1. **Provider Integration**:
   ```typescript
   // Initialize analytics manager
   const analytics = useMemo(() => 
     teacherId ? new TeacherAssistantAnalytics(teacherId) : null,
     [teacherId]
   );
   
   // Track session start/end
   useEffect(() => {
     if (isOpen && analytics) {
       analytics.trackSessionStart().catch(console.error);
     }
   }, [isOpen, analytics]);
   ```

2. **Message Tracking**:
   ```typescript
   // Track message analytics
   if (analytics) {
     const intent = orchestrator.classifyIntent(content);
     const agentType = orchestrator.mapIntentToAgentType(intent);
     
     analytics.trackMessage(content, response, {
       intent: intent,
       agentType: agentType?.toString(),
       responseTime: Date.now() - startTime,
       classId: teacherContext.currentClass?.id,
       courseId: teacherContext.currentClass?.subject?.id
     }).catch(console.error);
   }
   ```

### Voice Integration

The voice system is integrated with the Teacher Assistant in the following ways:

1. **MessageInput Component**:
   ```tsx
   {/* Voice input button */}
   {isVoiceSupported && (
     <Button
       variant={isListening ? "default" : "ghost"}
       size="icon"
       className={cn(
         "h-9 w-9 flex-shrink-0 transition-colors",
         isListening && "bg-red-500 hover:bg-red-600 text-white"
       )}
       onClick={toggleVoiceInput}
       disabled={isTyping}
       aria-label={isListening ? "Stop voice input" : "Start voice input"}
     >
       {isListening ? (
         <MicOff className="h-5 w-5 animate-pulse" />
       ) : (
         <Mic className="h-5 w-5" />
       )}
     </Button>
   )}
   ```

2. **ChatMessage Component**:
   ```tsx
   {/* Text-to-speech button */}
   {isSpeechSupported && (
     <Button
       variant="ghost"
       size="sm"
       className={cn(
         "h-6 w-6 p-0",
         isSpeaking && "text-primary"
       )}
       onClick={toggleSpeech}
       aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
     >
       {isSpeaking ? (
         <VolumeX className="h-3 w-3" />
       ) : (
         <Volume2 className="h-3 w-3" />
       )}
     </Button>
   )}
   ```

## Future Enhancements

### Analytics Enhancements

1. **Predictive Analytics**: Use machine learning to predict teacher needs
2. **Comparative Analytics**: Compare usage patterns across different teachers
3. **Content Effectiveness**: Track which assistant responses are most helpful
4. **Integration with Learning Analytics**: Connect assistant usage with student performance

### Voice Enhancements

1. **Voice Customization**: Allow teachers to customize voice settings
2. **Voice Commands**: Support for specific voice commands
3. **Multilingual Support**: Support for multiple languages
4. **Voice Authentication**: Identify teachers by their voice
5. **Emotion Detection**: Detect teacher emotions from voice input
