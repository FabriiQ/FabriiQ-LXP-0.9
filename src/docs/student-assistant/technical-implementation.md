# Student Assistant Technical Implementation

## Component Architecture

### 1. Core Components

#### `StudentAssistantProvider`
```tsx
// src/providers/student-assistant-provider.tsx
export function StudentAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Context from other providers
  const { student } = useStudentContext();
  const { currentClass } = useClassContext();
  const { currentActivity } = useActivityContext();
  
  // Agent orchestration
  const agentOrchestrator = useAgentOrchestrator({
    student,
    currentClass,
    currentActivity
  });
  
  // Value to be provided by context
  const value = {
    isOpen,
    setIsOpen,
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    sendMessage: async (content: string) => {
      // Add user message
      const userMessage = { role: 'user', content, timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);
      
      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Process with agent orchestrator
        const response = await agentOrchestrator.processMessage(content);
        
        // Add assistant message
        const assistantMessage = { role: 'assistant', content: response, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error processing message:', error);
        // Add error message
        const errorMessage = { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an error. Please try again.', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
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

#### `AssistantButton`
```tsx
// src/components/student-assistant/AssistantButton.tsx
export function AssistantButton() {
  const { isOpen, setIsOpen, hasNotification } = useStudentAssistant();
  
  return (
    <Button
      className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg"
      onClick={() => setIsOpen(!isOpen)}
      aria-label={isOpen ? "Close assistant" : "Open assistant"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      {hasNotification && <NotificationBadge />}
    </Button>
  );
}
```

#### `AssistantDialog`
```tsx
// src/components/student-assistant/AssistantDialog.tsx
export function AssistantDialog() {
  const { isOpen, messages, isTyping, sendMessage } = useStudentAssistant();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle send message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-background border-l shadow-lg flex flex-col z-50 md:w-96">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Learning Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question..."
            className="resize-none"
            rows={2}
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Agent System

#### `AgentOrchestrator`
```tsx
// src/features/student-assistant/agent-orchestrator.ts
export class AgentOrchestrator {
  private mainAgent: MainAssistantAgent;
  private subjectAgents: Map<string, SubjectSpecificAgent>;
  private navigationAgent: NavigationAssistantAgent;
  private context: StudentAssistantContext;
  
  constructor(context: StudentAssistantContext) {
    this.context = context;
    this.mainAgent = new MainAssistantAgent(context);
    this.subjectAgents = new Map();
    this.navigationAgent = new NavigationAssistantAgent(context);
    
    // Initialize subject-specific agents based on student's classes
    if (context.currentClass) {
      const subjectId = context.currentClass.subject?.id;
      if (subjectId && !this.subjectAgents.has(subjectId)) {
        this.subjectAgents.set(
          subjectId, 
          new SubjectSpecificAgent(context, subjectId)
        );
      }
    }
  }
  
  async processMessage(content: string): Promise<string> {
    // Classify the message to determine which agent should handle it
    const classification = await this.classifyMessage(content);
    
    switch (classification.type) {
      case 'navigation':
        return this.navigationAgent.processMessage(content);
        
      case 'subject':
        const subjectId = classification.subjectId;
        if (!this.subjectAgents.has(subjectId)) {
          this.subjectAgents.set(
            subjectId, 
            new SubjectSpecificAgent(this.context, subjectId)
          );
        }
        return this.subjectAgents.get(subjectId)!.processMessage(content);
        
      case 'general':
      default:
        return this.mainAgent.processMessage(content);
    }
  }
  
  private async classifyMessage(content: string): Promise<MessageClassification> {
    // Use a small model to classify the message
    // This could be a simple heuristic or a more sophisticated model
    if (content.toLowerCase().includes('where') || 
        content.toLowerCase().includes('find') || 
        content.toLowerCase().includes('how do i')) {
      return { type: 'navigation' };
    }
    
    // Check if it's related to the current class subject
    if (this.context.currentClass?.subject) {
      const subjectName = this.context.currentClass.subject.name.toLowerCase();
      if (content.toLowerCase().includes(subjectName)) {
        return { 
          type: 'subject', 
          subjectId: this.context.currentClass.subject.id 
        };
      }
    }
    
    // Default to general
    return { type: 'general' };
  }
}
```

#### `MainAssistantAgent`
```tsx
// src/features/student-assistant/agents/main-assistant-agent.ts
export class MainAssistantAgent {
  private context: StudentAssistantContext;
  
  constructor(context: StudentAssistantContext) {
    this.context = context;
  }
  
  async processMessage(content: string): Promise<string> {
    // Create a prompt that encourages Socratic questioning and guided discovery
    const prompt = this.createPrompt(content);
    
    // Call the AI model
    const response = await this.callAIModel(prompt);
    
    return response;
  }
  
  private createPrompt(content: string): string {
    const studentName = this.context.student?.name || 'the student';
    const gradeLevel = this.context.student?.gradeLevel || 'appropriate';
    
    return `
      You are an educational assistant helping ${studentName}, who is at grade level ${gradeLevel}.
      
      Your goal is to help the student learn and develop critical thinking skills, not to provide direct answers.
      Use Socratic questioning and guided discovery to help the student reach their own conclusions.
      
      Student question: ${content}
      
      Remember:
      1. Ask guiding questions rather than giving direct answers
      2. Encourage the student to reflect on what they already know
      3. Break complex problems into smaller steps
      4. Provide age-appropriate explanations
      5. Use encouraging and supportive language
      
      Your response:
    `;
  }
  
  private async callAIModel(prompt: string): Promise<string> {
    // Implementation would depend on the AI service being used
    // This is a placeholder
    return "Let's think about this together. What do you already know about this topic?";
  }
}
```

## Integration with Existing System

### 1. Student Layout Integration

```tsx
// src/app/student/layout.tsx
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

### 2. Context Providers Integration

```tsx
// src/providers/student-context-provider.tsx
export function StudentContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  
  // Fetch student data
  useEffect(() => {
    if (session?.user?.id) {
      // Fetch student data from API
      api.student.getStudentProfile.useQuery(
        undefined,
        {
          onSuccess: (data) => {
            setStudentData(data);
          }
        }
      );
    }
  }, [session?.user?.id]);
  
  return (
    <StudentContext.Provider value={{ student: studentData }}>
      {children}
    </StudentContext.Provider>
  );
}
```

## API Integration

### 1. Student Assistant API Router

```tsx
// src/server/api/routers/student-assistant.ts
export const studentAssistantRouter = createTRPCRouter({
  getAssistantResponse: protectedProcedure
    .input(z.object({
      message: z.string(),
      classId: z.string().optional(),
      activityId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get student context
        const student = await ctx.prisma.studentProfile.findUnique({
          where: { userId: ctx.session.user.id },
          include: {
            user: true,
            enrollments: {
              include: {
                class: {
                  include: {
                    courseCampus: {
                      include: {
                        course: {
                          include: {
                            subjects: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        
        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }
        
        // Get class context if classId is provided
        let classContext = null;
        if (input.classId) {
          classContext = await ctx.prisma.class.findUnique({
            where: { id: input.classId },
            include: {
              courseCampus: {
                include: {
                  course: {
                    include: {
                      subjects: true
                    }
                  }
                }
              }
            }
          });
        }
        
        // Get activity context if activityId is provided
        let activityContext = null;
        if (input.activityId) {
          activityContext = await ctx.prisma.activity.findUnique({
            where: { id: input.activityId },
            include: {
              subject: true,
              topic: true
            }
          });
        }
        
        // Call AI service with context
        const response = await callAIService({
          message: input.message,
          student,
          class: classContext,
          activity: activityContext
        });
        
        return { response };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get assistant response: ${(error as Error).message}`,
        });
      }
    }),
});
```

## Next Steps

1. Implement the core components outlined above
2. Integrate with the existing student portal layout
3. Develop the agent system with educational psychology principles
4. Test with students and teachers for feedback
5. Iterate based on usage patterns and feedback
