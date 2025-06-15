# Student Assistant: Phase 1 Technical Specification

This document provides detailed technical specifications for the first phase of the Student Assistant implementation, focusing on core components and basic functionality.

## 1. Component Structure

### Directory Structure

```
src/
├── components/
│   └── student-assistant/
│       ├── AssistantButton.tsx
│       ├── AssistantDialog.tsx
│       ├── ChatMessage.tsx
│       ├── MessageInput.tsx
│       ├── MessageList.tsx
│       ├── NotificationBadge.tsx
│       └── TypingIndicator.tsx
├── features/
│   └── student-assistant/
│       ├── agents/
│       │   ├── main-assistant-agent.ts
│       │   ├── navigation-assistant-agent.ts
│       │   └── subject-specific-agent.ts
│       ├── agent-orchestrator.ts
│       ├── message-classifier.ts
│       └── types.ts
├── providers/
│   └── student-assistant-provider.tsx
├── hooks/
│   └── use-student-assistant.ts
└── server/
    └── api/
        └── routers/
            └── student-assistant.ts
```

### Type Definitions

```typescript
// src/features/student-assistant/types.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StudentAssistantContext {
  student?: {
    id: string;
    name: string;
    gradeLevel: string;
    learningPreferences?: string[];
  };
  currentClass?: {
    id: string;
    name: string;
    subject?: {
      id: string;
      name: string;
    };
  };
  currentActivity?: {
    id: string;
    title: string;
    type: string;
  };
  currentPage?: {
    path: string;
    title: string;
  };
}

export type MessageClassification = 
  | { type: 'navigation' }
  | { type: 'subject', subjectId: string }
  | { type: 'general' };
```

## 2. UI Components

### AssistantButton

```typescript
// src/components/student-assistant/AssistantButton.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { useStudentAssistant } from '@/hooks/use-student-assistant';
import { NotificationBadge } from './NotificationBadge';

export function AssistantButton() {
  const { isOpen, setIsOpen, hasNotification } = useStudentAssistant();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Subtle animation to draw attention when there's a notification
  useEffect(() => {
    if (hasNotification && !isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasNotification, isOpen]);
  
  return (
    <Button
      className={`fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg z-50 transition-all duration-300 ${
        isAnimating ? 'animate-pulse' : ''
      }`}
      onClick={() => setIsOpen(!isOpen)}
      aria-label={isOpen ? "Close assistant" : "Open assistant"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      {hasNotification && <NotificationBadge />}
    </Button>
  );
}
```

### NotificationBadge

```typescript
// src/components/student-assistant/NotificationBadge.tsx
export function NotificationBadge() {
  return (
    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
      <span className="sr-only">Notification</span>
    </div>
  );
}
```

### AssistantDialog

```typescript
// src/components/student-assistant/AssistantDialog.tsx
import { useEffect, useRef } from 'react';
import { useStudentAssistant } from '@/hooks/use-student-assistant';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

export function AssistantDialog() {
  const { isOpen, messages, isTyping } = useStudentAssistant();
  
  // Handle responsive layout
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (!isOpen) return null;
  
  return (
    <div 
      className={`fixed bg-background border-l shadow-lg flex flex-col z-40 transition-all duration-300 ${
        isMobile 
          ? 'inset-x-0 bottom-0 rounded-t-lg max-h-[80vh]' 
          : 'inset-y-0 right-0 w-80 md:w-96'
      }`}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Learning Assistant</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      <MessageList messages={messages} />
      
      {isTyping && <TypingIndicator />}
      
      <div className="p-4 border-t mt-auto">
        <MessageInput />
      </div>
    </div>
  );
}

// Custom hook for responsive design
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
}
```

### MessageList

```typescript
// src/components/student-assistant/MessageList.tsx
import { useRef, useEffect } from 'react';
import { Message } from '@/features/student-assistant/types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>How can I help you with your learning today?</p>
            <p className="text-sm mt-2">Ask me a question about your coursework, or for help navigating the platform.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
```

### ChatMessage

```typescript
// src/components/student-assistant/ChatMessage.tsx
import { Message } from '@/features/student-assistant/types';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8">
        {isUser ? (
          <AvatarImage src="/avatars/student.png" alt="You" />
        ) : (
          <AvatarImage src="/avatars/assistant.png" alt="Assistant" />
        )}
        <AvatarFallback>{isUser ? 'You' : 'AI'}</AvatarFallback>
      </Avatar>
      
      <div className={`rounded-lg p-3 max-w-[80%] ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      }`}>
        <div className="text-sm">{message.content}</div>
        <div className="text-xs mt-1 opacity-70">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
```

### MessageInput

```typescript
// src/components/student-assistant/MessageInput.tsx
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useStudentAssistant } from '@/hooks/use-student-assistant';

export function MessageInput() {
  const { sendMessage, isTyping } = useStudentAssistant();
  const [inputValue, setInputValue] = useState('');
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Ask a question..."
        className="resize-none min-h-[60px]"
        disabled={isTyping}
      />
      <Button 
        onClick={handleSendMessage} 
        disabled={!inputValue.trim() || isTyping}
        size="icon"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  );
}
```

### TypingIndicator

```typescript
// src/components/student-assistant/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 p-4">
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-muted-foreground">Assistant is typing...</span>
    </div>
  );
}
```

## 3. Context and State Management

### StudentAssistantProvider

```typescript
// src/providers/student-assistant-provider.tsx
import { createContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, StudentAssistantContext } from '@/features/student-assistant/types';
import { AgentOrchestrator } from '@/features/student-assistant/agent-orchestrator';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import { AssistantButton } from '@/components/student-assistant/AssistantButton';
import { AssistantDialog } from '@/components/student-assistant/AssistantDialog';

interface StudentAssistantProviderProps {
  children: React.ReactNode;
}

interface StudentAssistantContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: Message[];
  isTyping: boolean;
  hasNotification: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export const StudentAssistantContext = createContext<StudentAssistantContextValue | undefined>(undefined);

export function StudentAssistantProvider({ children }: StudentAssistantProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  
  const router = useRouter();
  const { data: session } = useSession();
  
  // Get student profile data
  const { data: studentProfile } = api.student.getStudentProfile.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  );
  
  // Get current class data if on a class page
  const classId = router.query.classId as string | undefined;
  const { data: classData } = api.student.getClassById.useQuery(
    { classId: classId! },
    { enabled: !!classId }
  );
  
  // Get current activity data if on an activity page
  const activityId = router.query.activityId as string | undefined;
  const { data: activityData } = api.student.getActivityById.useQuery(
    { activityId: activityId! },
    { enabled: !!activityId }
  );
  
  // Build context object for the agent
  const context: StudentAssistantContext = {
    student: studentProfile ? {
      id: studentProfile.id,
      name: studentProfile.user.name || 'Student',
      gradeLevel: studentProfile.gradeLevel || 'unknown',
    } : undefined,
    currentClass: classData ? {
      id: classData.id,
      name: classData.name,
      subject: classData.courseCampus?.course?.subjects[0] ? {
        id: classData.courseCampus.course.subjects[0].id,
        name: classData.courseCampus.course.subjects[0].name,
      } : undefined,
    } : undefined,
    currentActivity: activityData ? {
      id: activityData.id,
      title: activityData.title,
      type: activityData.type,
    } : undefined,
    currentPage: {
      path: router.asPath,
      title: document.title,
    },
  };
  
  // Initialize agent orchestrator
  const agentOrchestrator = new AgentOrchestrator(context);
  
  // Send message function
  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = { 
      id: uuidv4(),
      role: 'user', 
      content, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Process with agent orchestrator
      const response = await agentOrchestrator.processMessage(content);
      
      // Add assistant message
      const assistantMessage: Message = { 
        id: uuidv4(),
        role: 'assistant', 
        content: response, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      // Add error message
      const errorMessage: Message = { 
        id: uuidv4(),
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Context value
  const value: StudentAssistantContextValue = {
    isOpen,
    setIsOpen,
    messages,
    isTyping,
    hasNotification,
    sendMessage,
  };
  
  return (
    <StudentAssistantContext.Provider value={value}>
      {children}
      <AssistantButton />
      <AssistantDialog />
    </StudentAssistantContext.Provider>
  );
}
```

### useStudentAssistant Hook

```typescript
// src/hooks/use-student-assistant.ts
import { useContext } from 'react';
import { StudentAssistantContext } from '@/providers/student-assistant-provider';

export function useStudentAssistant() {
  const context = useContext(StudentAssistantContext);
  
  if (context === undefined) {
    throw new Error('useStudentAssistant must be used within a StudentAssistantProvider');
  }
  
  return context;
}
```

## 4. Next Steps

After implementing the core UI components and context providers, the next steps will be:

1. Implement the agent system classes:
   - MainAssistantAgent
   - NavigationAssistantAgent
   - AgentOrchestrator
   - MessageClassifier

2. Create the API router for backend integration

3. Integrate with the student layout to make the assistant available on all student pages

4. Test the basic functionality with simple navigation and general questions

5. Begin implementing educational psychology principles in the agent responses
