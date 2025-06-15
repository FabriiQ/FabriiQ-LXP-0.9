# Student Assistant

The Student Assistant is an AI-powered chat interface that provides personalized guidance, helps students understand concepts, and promotes critical thinking and problem-solving skills rather than providing direct answers.

## Features

- **Floating Chat Button**: Accessible from any page in the student portal
- **Context-Aware Assistance**: Provides help based on the student's current context (class, activity, etc.)
- **Educational Psychology Principles**: Implements scaffolding, Socratic questioning, and other educational principles
- **Mobile-First Design**: Fully responsive interface that works well on all devices

## Usage

### Basic Integration

To add the Student Assistant to a page or layout:

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

### Using the Hook

To access the Student Assistant context in a component:

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

## Components

### AssistantButton

Floating button that toggles the assistant dialog.

```tsx
<AssistantButton />
```

### AssistantDialog

Dialog that contains the chat interface.

```tsx
<AssistantDialog />
```

### ChatMessage

Displays a single message in the chat interface.

```tsx
<ChatMessage message={message} />
```

### MessageInput

Input field for sending messages to the assistant.

```tsx
<MessageInput />
```

### MessageList

Displays a list of chat messages with automatic scrolling.

```tsx
<MessageList messages={messages} />
```

## Educational Psychology Principles

The Student Assistant implements several educational psychology principles:

1. **Scaffolding**: Provides just enough support to help students progress
2. **Zone of Proximal Development**: Targets assistance at the appropriate level of challenge
3. **Growth Mindset**: Emphasizes effort and strategy over innate ability
4. **Metacognition**: Encourages students to reflect on their thinking processes
5. **Socratic Method**: Uses guided questioning to lead students to insights
6. **Spaced Repetition**: Reminds students of previously learned concepts
7. **Constructivism**: Helps students connect new information to existing knowledge
8. **Differentiated Instruction**: Adapts explanations based on student's learning style

## Architecture

The Student Assistant follows a provider-based architecture with React Context for state management:

```
StudentAssistantProvider
├── AssistantButton
├── AssistantDialog
│   ├── MessageList
│   │   └── ChatMessage
│   ├── TypingIndicator
│   └── MessageInput
└── API Integration
    └── tRPC Procedures
```

## API Integration

The Student Assistant uses tRPC for API integration. The main procedure is:

- `studentAssistant.getAssistantResponse`: Gets a response from the AI assistant based on the student's message and context

## Future Enhancements

Planned enhancements for the Student Assistant:

1. **Rich Media Support**: Add support for images, diagrams, and math equations
2. **Proactive Suggestions**: Provide contextual suggestions based on student activity
3. **Learning Path Recommendations**: Suggest personalized learning paths
4. **Progress Tracking**: Track student progress and adapt assistance accordingly
