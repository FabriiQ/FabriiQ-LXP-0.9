# Teacher Assistant Implementation Guide

## Overview

The Teacher Assistant is an AI-powered chat interface that provides comprehensive support for teachers across all aspects of their professional responsibilities. It integrates with the platform's existing systems to offer personalized guidance, content creation assistance, classroom management support, and access to external knowledge.

## Key Features

1. **Mobile-First Design**: Fully responsive interface that works seamlessly on all devices
2. **Agentic Memory System**: Persistent memory that remembers teacher preferences and conversation history
3. **Teacher Preferences**: Personalization based on teaching style, preferred resources, and feedback style
4. **Real-Time API Integration**: Backend integration with Google Generative AI for real-time responses
5. **Specialized Agent Routing**: Intelligent routing to specialized agents based on intent classification
6. **External Knowledge Search**: Integration with search capabilities for educational resources

## Architecture

### Component Structure

```
TeacherAssistantProvider
├── AssistantButton
│   ├── AssistantIcon
│   └── NotificationBadge
├── AssistantDialog
│   ├── DialogHeader
│   │   ├── Title
│   │   ├── SearchToggle
│   │   └── SettingsButton
│   ├── ChatInterface
│   │   ├── MessageList
│   │   ├── MessageInput
│   │   └── TypingIndicator
│   ├── SearchInterface
│   │   ├── SearchInput
│   │   ├── FilterOptions
│   │   └── SearchResults
│   └── DialogFooter
└── TeacherAssistantOrchestrator
    ├── ContextProvider
    │   ├── TeacherContextProvider
    │   ├── ClassContextProvider
    │   └── SchoolContextProvider
    ├── AgentIntegration
    │   ├── IntentClassifier
    │   ├── AgentSelector
    │   └── AgentRegistry (from existing system)
    ├── TeacherSpecificExtensions
    │   ├── StudentManagementHandler
    │   ├── TeachingStrategyRecommender
    │   └── AdministrativeSupport
    └── FeedbackSystem
```

### Integration with Existing Agent System

```
TeacherAssistantOrchestrator
├── AgentIntegration
│   ├── Uses AgentRegistry from src/features/agents
│   ├── Leverages existing specialized agents:
│   │   ├── LessonPlanAgent
│   │   ├── AssessmentAgent
│   │   ├── WorksheetAgent
│   │   ├── ContentRefinementAgent
│   │   ├── SearchAgent
│   │   ├── ResourceAgent
│   │   └── FeedbackAgent
│   └── Extends with teacher-specific capabilities
└── ContextSynchronizer
    └── Ensures teacher context is passed to specialized agents
```

## Database Schema

The Teacher Assistant uses the following database models:

### TeacherPreference

```prisma
model TeacherPreference {
  id            String       @id @default(cuid())
  userId        String
  category      String
  key           String
  value         Json
  metadata      Json?
  timestamp     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  status        SystemStatus @default(ACTIVE)
  user          User         @relation(fields: [userId], references: [id])
  
  @@unique([userId, category, key])
  @@index([userId])
  @@index([category])
  @@map("teacher_preferences")
}
```

### TeacherAssistantInteraction

```prisma
model TeacherAssistantInteraction {
  id          String       @id @default(cuid())
  teacherId   String
  message     String       @db.Text
  response    String       @db.Text
  classId     String?
  courseId    String?
  metadata    Json?
  timestamp   DateTime     @default(now())
  status      SystemStatus @default(ACTIVE)
  
  @@index([teacherId])
  @@index([classId])
  @@index([timestamp])
  @@map("teacher_assistant_interactions")
}
```

### TeacherAssistantSearch

```prisma
model TeacherAssistantSearch {
  id           String       @id @default(cuid())
  teacherId    String
  query        String
  filters      Json?
  resultsCount Int
  timestamp    DateTime     @default(now())
  status       SystemStatus @default(ACTIVE)
  
  @@index([teacherId])
  @@index([timestamp])
  @@map("teacher_assistant_searches")
}
```

## API Endpoints

The Teacher Assistant API provides the following endpoints:

### getAssistantResponse

```typescript
getAssistantResponse: protectedProcedure
  .input(z.object({
    message: z.string(),
    classId: z.string().optional(),
    courseId: z.string().optional(),
    context: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Implementation
  })
```

### saveTeacherPreference

```typescript
saveTeacherPreference: protectedProcedure
  .input(z.object({
    category: z.string(),
    key: z.string(),
    value: z.any(),
    metadata: z.record(z.any()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Implementation
  })
```

### getTeacherPreferences

```typescript
getTeacherPreferences: protectedProcedure
  .input(z.object({
    category: z.string().optional()
  }))
  .query(async ({ ctx, input }) => {
    // Implementation
  })
```

### search

```typescript
search: protectedProcedure
  .input(z.object({
    query: z.string(),
    filters: z.object({
      contentType: z.string().optional(),
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
      limit: z.number().optional(),
    }).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Implementation
  })
```

## Memory System

The Teacher Assistant uses a multi-layered memory system:

1. **Local Storage Memory**: For immediate access and offline functionality
2. **Database Persistence**: For long-term storage and cross-device access
3. **Working Memory**: For short-term context during conversations
4. **Long-Term Memory**: For persistent teacher preferences and patterns

### Memory Classes

- **AdvancedMemoryManager**: Manages different types of memory with TTL and semantic indexing
- **TeacherPreferenceMemory**: Specialized memory for teacher preferences

## Usage

### Basic Setup

```tsx
// In your app layout or page
import { TeacherAssistantProvider } from '@/features/teacher-assistant';

export default function Layout({ children }) {
  return (
    <TeacherAssistantProvider>
      {children}
    </TeacherAssistantProvider>
  );
}
```

### Accessing the Teacher Assistant

The Teacher Assistant button will automatically appear in the bottom right corner of the screen when wrapped in the `TeacherAssistantProvider`.

### Programmatic Access

```tsx
import { useTeacherAssistant } from '@/features/teacher-assistant';

function MyComponent() {
  const { sendMessage, messages, isOpen, setIsOpen } = useTeacherAssistant();
  
  return (
    <button onClick={() => {
      setIsOpen(true);
      sendMessage('Help me create a lesson plan');
    }}>
      Get Lesson Plan Help
    </button>
  );
}
```

## Best Practices

1. **Context Awareness**: Always provide as much context as possible when sending messages
2. **Error Handling**: Implement fallbacks for when the API is unavailable
3. **Performance**: Use the memory system efficiently to avoid unnecessary API calls
4. **Accessibility**: Ensure all components are accessible and work with screen readers
5. **Mobile Optimization**: Test thoroughly on mobile devices

## Future Enhancements

1. **Voice Input/Output**: Add speech-to-text and text-to-speech capabilities
2. **Proactive Suggestions**: Implement proactive assistance based on teacher context
3. **Collaborative Planning**: Enable collaborative planning features with other teachers
4. **Advanced Analytics**: Integrate with analytics for data-informed teaching insights
