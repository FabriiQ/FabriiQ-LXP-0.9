# Student Assistant Developer Guide

This technical documentation provides an overview of the Student Assistant architecture, components, and integration points for developers who need to maintain or extend the feature.

## Architecture Overview

The Student Assistant is built using a modular architecture with the following key components:

```
StudentAssistantProvider
├── UI Components
│   ├── AssistantButton
│   ├── AssistantDialog
│   │   ├── MessageList
│   │   │   └── ChatMessage
│   │   ├── TypingIndicator
│   │   ├── MessageInput
│   │   └── ProactiveSuggestionList
│   └── NotificationBadge
├── Agent System
│   ├── AgentOrchestrator
│   ├── MainAssistantAgent
│   ├── SubjectSpecificAgent
│   └── NavigationAssistantAgent
├── Context Management
│   └── ContextManager
├── Personalization
│   ├── Adaptive Response
│   └── Proactive Suggestions
└── API Integration
    └── studentAssistantRouter
```

## Core Components

### UI Components

#### `StudentAssistantProvider`

The context provider that manages state and provides access to the assistant functionality.

```tsx
// Usage
<StudentAssistantProvider>
  {children}
</StudentAssistantProvider>
```

#### `AssistantButton`

Floating button that toggles the assistant dialog.

```tsx
// Props
interface AssistantButtonProps {
  className?: string;
}
```

#### `AssistantDialog`

Dialog that contains the chat interface.

```tsx
// Props
interface AssistantDialogProps {
  className?: string;
}
```

### Agent System

#### `AgentOrchestrator`

Coordinates between different specialized agents to handle student questions.

```typescript
// Usage
const orchestrator = new AgentOrchestrator(context);
const response = await orchestrator.processMessage(content);
```

#### `MainAssistantAgent`

Handles general questions and provides educational guidance.

```typescript
// Usage
const agent = new MainAssistantAgent(context);
const response = await agent.processMessage(content);
```

#### `SubjectSpecificAgent`

Handles subject-specific questions with specialized knowledge.

```typescript
// Usage
const agent = new SubjectSpecificAgent(context, subjectId);
const response = await agent.processMessage(content);
```

#### `NavigationAssistantAgent`

Helps students navigate the platform and find features.

```typescript
// Usage
const agent = new NavigationAssistantAgent(context);
const response = await agent.processMessage(content);
```

### Context Management

#### `ContextManager`

Manages context for the student assistant, including tracking concepts, confusion areas, and learning preferences.

```typescript
// Usage
const contextManager = new ContextManager(initialContext);
contextManager.trackDiscussedConcept('Photosynthesis', 'science-101');
const context = contextManager.getContext();
```

### Personalization

#### `adaptive-response.ts`

Utilities for adapting responses based on student context.

```typescript
// Usage
const confusion = detectConfusion(messages);
const preference = detectLearningPreference(messages);
const hints = generateProgressiveHints(topic, confusionLevel, gradeLevel);
```

#### `proactive-suggestions.ts`

Generates proactive suggestions based on student context.

```typescript
// Usage
const suggestions = generateProactiveSuggestions(context);
```

## API Integration

### `studentAssistantRouter`

tRPC router for the Student Assistant API.

```typescript
// Key procedures
studentAssistant.getAssistantResponse
```

## Data Models

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### StudentAssistantContext

```typescript
interface StudentAssistantContext {
  student?: StudentContext;
  currentClass?: ClassContext;
  currentActivity?: ActivityContext;
  currentPage?: PageContext;
  discussedConcepts?: DiscussedConcept[];
  confusionAreas?: ConfusionArea[];
  learningGoals?: LearningGoal[];
  lastInteraction?: Date;
}
```

### ProactiveSuggestion

```typescript
interface ProactiveSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  created: Date;
  expires?: Date;
  relatedConcept?: string;
  relatedGoalId?: string;
  actionText?: string;
  actionData?: Record<string, any>;
}
```

## Integration Points

### Adding the Student Assistant to a Layout

```tsx
import { StudentAssistantProvider } from '@/features/student-assistant';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <StudentAssistantProvider>
      {children}
    </StudentAssistantProvider>
  );
}
```

### Accessing the Student Assistant Context

```tsx
import { useStudentAssistant } from '@/features/student-assistant';

export function MyComponent() {
  const { isOpen, setIsOpen, sendMessage } = useStudentAssistant();
  
  return (
    <button onClick={() => setIsOpen(true)}>
      Open Assistant
    </button>
  );
}
```

### Customizing Prompt Templates

Prompt templates are defined in `src/features/student-assistant/utils/prompt-templates.ts`. To add or modify templates:

1. Create a new template function
2. Update the appropriate agent to use the new template

```typescript
export function createCustomPrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  // Create and return prompt string
}
```

## AI Integration

The Student Assistant uses Google Generative AI (Gemini) for:

1. Generating educational responses
2. Classifying messages
3. Detecting learning preferences and confusion

### API Key Configuration

The API key is configured through environment variables:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

For server-side calls, you can also use:

```
GEMINI_API_KEY=your_api_key_here
```

## Analytics and Monitoring

### Usage Tracking

The Student Assistant includes analytics tracking for:

1. Conversation frequency and length
2. Common topics and questions
3. Confusion areas and learning preferences
4. Suggestion engagement

### Feedback Collection

Feedback is collected through:

1. Explicit feedback buttons in the interface
2. Implicit feedback based on conversation patterns
3. Teacher dashboard feedback forms

## Performance Considerations

1. **Caching**: Responses for common questions are cached to improve performance
2. **Lazy Loading**: Components are lazy-loaded to reduce initial load time
3. **Debouncing**: Input events are debounced to prevent excessive API calls
4. **Context Pruning**: Conversation history is limited to prevent memory issues

## Extending the Student Assistant

### Adding a New Agent Type

1. Create a new agent class that follows the agent interface
2. Update the `AgentOrchestrator` to include the new agent
3. Add appropriate message classification logic

### Adding New Suggestion Types

1. Add the new type to the `SuggestionType` enum
2. Update the `generateProactiveSuggestions` function to include the new type
3. Add appropriate handling in the UI components

### Customizing the UI

1. The UI components accept `className` props for styling customization
2. Use the `cn` utility for conditional class names
3. Follow the established design patterns for consistency

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure the Gemini API key is properly configured
2. **Context Errors**: Check that the context structure matches the expected format
3. **Classification Errors**: Verify that message classification is working correctly
4. **UI Rendering Issues**: Ensure the provider is properly wrapping the components

### Debugging

1. Enable debug logging by setting `DEBUG_STUDENT_ASSISTANT=true` in the environment
2. Use the browser console to view detailed logs
3. Check the network tab for API call details

## Future Development

Planned enhancements for the Student Assistant:

1. **Rich Media Support**: Add support for images, diagrams, and math equations
2. **Voice Interface**: Add speech recognition and synthesis
3. **Expanded Analytics**: More detailed usage analytics and insights
4. **Integration with LMS**: Connect with external learning management systems
