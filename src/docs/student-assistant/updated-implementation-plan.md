# Student Assistant: Updated Implementation Plan

This document outlines the updated implementation plan for the Student Assistant feature, aligned with the existing codebase structure, UI components, and styling approach.

## Folder Structure

The Student Assistant feature will be implemented as a feature module in the `features` directory, following the existing pattern for feature organization:

```
src/
├── features/
│   ├── student-assistant/
│   │   ├── api/                  # API layer (tRPC routers and procedures)
│   │   │   └── student-assistant-router.ts
│   │   ├── components/           # UI components
│   │   │   ├── AssistantButton.tsx
│   │   │   ├── AssistantDialog.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── NotificationBadge.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── agents/               # Agent implementations
│   │   │   ├── main-assistant-agent.ts
│   │   │   ├── navigation-assistant-agent.ts
│   │   │   └── subject-specific-agent.ts
│   │   ├── hooks/                # React hooks
│   │   │   └── use-student-assistant.ts
│   │   ├── providers/            # Context providers
│   │   │   └── student-assistant-provider.tsx
│   │   ├── utils/                # Utility functions
│   │   │   ├── prompt-templates.ts
│   │   │   ├── message-classifier.ts
│   │   │   └── context-manager.ts
│   │   ├── types.ts              # Type definitions
│   │   ├── constants.ts          # Constants
│   │   ├── index.ts              # Main exports
│   │   └── README.md             # Feature documentation
│   └── ...
└── ...
```

## UI Component Integration

The Student Assistant UI components will be integrated with the existing UI component system, using the established styling patterns and component architecture:

1. **Core Components**: Leverage existing core UI components from `@/components/ui/core`
2. **Styling**: Use Tailwind CSS with the established design tokens and theme variables
3. **Responsive Design**: Implement mobile-first design following the existing patterns

## Component Implementation

### AssistantButton

```tsx
// src/features/student-assistant/components/AssistantButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/core/button';
import { MessageCircle, X } from 'lucide-react';
import { useStudentAssistant } from '../hooks/use-student-assistant';
import { NotificationBadge } from './NotificationBadge';
import { cn } from '@/lib/utils';

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
      className={cn(
        "fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg z-50 transition-all duration-300",
        isAnimating && "animate-pulse"
      )}
      onClick={() => setIsOpen(!isOpen)}
      aria-label={isOpen ? "Close assistant" : "Open assistant"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      {hasNotification && <NotificationBadge />}
    </Button>
  );
}
```

### AssistantDialog

```tsx
// src/features/student-assistant/components/AssistantDialog.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useStudentAssistant } from '../hooks/use-student-assistant';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '@/components/ui/core/button';
import { X } from 'lucide-react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';

export function AssistantDialog() {
  const { isOpen, setIsOpen, messages, isTyping } = useStudentAssistant();
  const { isMobile } = useResponsive();
  
  if (!isOpen) return null;
  
  return (
    <div 
      className={cn(
        "fixed bg-background border shadow-lg flex flex-col z-40 transition-all duration-300",
        isMobile 
          ? "inset-x-0 bottom-0 rounded-t-lg max-h-[80vh]" 
          : "inset-y-0 right-0 w-80 md:w-96 border-l"
      )}
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
```

## Integration with Student Layout

The Student Assistant will be integrated into the student layout by adding the `StudentAssistantProvider` to the layout component:

```tsx
// src/app/student/layout.tsx
'use client';

import { StudentShell } from '@/components/ui/specialized/role-based/student-shell';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GlobalLoadingIndicator } from '@/components/ui/loading-indicator';
import { ContextChangeToast } from '@/components/ui/context-toast';
import { StudentAssistantProvider } from '@/features/student-assistant/providers/student-assistant-provider';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  // Existing code...
  
  return (
    <StudentShell
      user={{
        name: session?.user?.name || 'Student',
        email: session?.user?.email || '',
        avatar: '', // Use a default avatar or leave empty
      }}
      title="Student Portal"
      onNavigate={handleNavigate}
      currentPath={pathname || ''}
      notifications={notificationsCount}
    >
      {/* Add StudentAssistantProvider */}
      <StudentAssistantProvider>
        {/* Global components for navigation experience */}
        <GlobalLoadingIndicator />
        <ContextChangeToast />

        {/* Main content */}
        {children}
      </StudentAssistantProvider>
    </StudentShell>
  );
}
```

## API Integration

The Student Assistant will use tRPC for API integration, following the existing pattern:

```tsx
// src/server/api/routers/student-assistant.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const studentAssistantRouter = createTRPCRouter({
  getAssistantResponse: protectedProcedure
    .input(z.object({
      message: z.string(),
      classId: z.string().optional(),
      activityId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Implementation details...
        
        return { response: "Response text" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get assistant response: ${(error as Error).message}`,
        });
      }
    }),
});
```

## Implementation Phases

### Phase 1: Core UI Components and Provider

1. Create the feature directory structure
2. Implement the core UI components:
   - AssistantButton
   - AssistantDialog
   - ChatMessage
   - MessageInput
   - MessageList
   - NotificationBadge
   - TypingIndicator
3. Implement the StudentAssistantProvider and context
4. Integrate with the student layout

### Phase 2: Basic Agent System

1. Implement the agent system:
   - MainAssistantAgent
   - AgentOrchestrator
   - MessageClassifier
2. Create prompt templates
3. Implement the API router
4. Connect the UI to the API

### Phase 3: Educational Enhancement

1. Implement subject-specific agents
2. Add educational psychology principles to prompts
3. Implement age-appropriate response calibration
4. Add context awareness

### Phase 4: Advanced Features

1. Add rich media support
2. Implement proactive suggestions
3. Add learning path recommendations
4. Implement progress tracking

## Styling Approach

The Student Assistant will follow the existing styling approach:

1. Use Tailwind CSS for styling
2. Leverage the `cn` utility for conditional class names
3. Use the established design tokens and theme variables
4. Follow the mobile-first responsive design pattern
5. Use the existing animation classes for transitions and effects

## Next Steps

1. Create the feature directory structure
2. Implement the core UI components
3. Create the StudentAssistantProvider
4. Integrate with the student layout
5. Test the basic UI functionality
