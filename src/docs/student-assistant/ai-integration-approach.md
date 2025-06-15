# Student Assistant: AI Integration Approach

This document outlines the approach for integrating AI capabilities into the Student Assistant, including prompt engineering, context management, and response generation.

## 1. AI Service Integration

### Service Selection

For the initial implementation, we will use the following AI services:

1. **Primary LLM**: OpenAI's GPT-4 or equivalent model
   - Used for generating educational responses
   - Handles complex reasoning and Socratic questioning
   - Provides age-appropriate explanations

2. **Lightweight Classification Model**: OpenAI's GPT-3.5-Turbo or equivalent
   - Used for message classification and routing
   - Determines whether a question is navigation-related, subject-specific, or general
   - Runs with minimal tokens for cost efficiency

### API Integration

```typescript
// src/lib/ai-service.ts
import OpenAI from 'openai';
import { env } from '@/env.mjs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

interface AIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateAIResponse(
  prompt: string,
  options: AIServiceOptions = {}
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error(`Failed to generate AI response: ${(error as Error).message}`);
  }
}

export async function classifyMessage(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Classify the following student message into one of these categories:
          - navigation: Questions about finding features or using the platform
          - subject_math: Questions related to mathematics
          - subject_science: Questions related to science
          - subject_english: Questions related to English or language arts
          - subject_history: Questions related to history or social studies
          - general: General questions or other topics
          
          Respond with ONLY the category name, nothing else.`
        },
        { role: 'user', content }
      ],
      temperature: 0.3,
      max_tokens: 20,
    });

    return response.choices[0]?.message?.content?.trim().toLowerCase() || 'general';
  } catch (error) {
    console.error('Error classifying message:', error);
    return 'general'; // Default to general on error
  }
}
```

## 2. Prompt Engineering

### Base Prompt Template

```typescript
// src/features/student-assistant/prompt-templates.ts
export function createBasePrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const studentName = studentContext.name || 'the student';
  const gradeLevel = studentContext.gradeLevel || 'appropriate';
  const subject = studentContext.currentClass?.subject?.name || 'general topics';
  
  // Format message history
  const formattedHistory = messageHistory
    .map(msg => `${msg.role === 'user' ? studentName : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
  
  return `
    You are an educational assistant helping ${studentName}, who is at grade level ${gradeLevel}.
    
    Current subject: ${subject}
    
    Your goal is to help the student learn and develop critical thinking skills, not to provide direct answers.
    Use Socratic questioning and guided discovery to help the student reach their own conclusions.
    
    Previous conversation:
    ${formattedHistory}
    
    Student question: ${currentQuestion}
    
    Remember:
    1. Ask guiding questions rather than giving direct answers
    2. Encourage the student to reflect on what they already know
    3. Break complex problems into smaller steps
    4. Provide age-appropriate explanations for grade ${gradeLevel}
    5. Use encouraging and supportive language
    6. Foster a growth mindset by emphasizing effort and strategy over innate ability
    7. Use metacognitive prompts to help the student think about their own thinking
    
    Your response:
  `;
}
```

### Subject-Specific Prompt Templates

```typescript
// src/features/student-assistant/prompt-templates.ts
export function createMathPrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const basePrompt = createBasePrompt(studentContext, messageHistory, currentQuestion);
  
  return `
    ${basePrompt}
    
    Additional mathematics guidance:
    1. Guide the student through mathematical reasoning step by step
    2. Ask the student to identify relevant formulas or concepts first
    3. Encourage the student to check their work and verify solutions
    4. Use visual representations when helpful (describe them in words)
    5. Connect mathematical concepts to real-world applications
    6. If the student is stuck, provide progressively more specific hints rather than the solution
    
    Your response:
  `;
}

export function createSciencePrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const basePrompt = createBasePrompt(studentContext, messageHistory, currentQuestion);
  
  return `
    ${basePrompt}
    
    Additional science guidance:
    1. Encourage the scientific method: observation, question, hypothesis, experiment, conclusion
    2. Help the student connect scientific concepts to observable phenomena
    3. Ask the student to predict outcomes before explaining processes
    4. Relate scientific concepts to everyday experiences
    5. Use analogies appropriate for the student's grade level
    6. Emphasize the iterative and evidence-based nature of scientific discovery
    
    Your response:
  `;
}

// Additional subject-specific templates would follow the same pattern
```

### Navigation Assistance Prompt

```typescript
// src/features/student-assistant/prompt-templates.ts
export function createNavigationPrompt(
  studentContext: StudentContext,
  currentPage: PageContext,
  currentQuestion: string
): string {
  return `
    You are a helpful navigation assistant for a student learning platform.
    
    The student is currently on the page: ${currentPage.title} (${currentPage.path})
    
    The student is asking: "${currentQuestion}"
    
    Provide clear, concise guidance to help the student navigate the platform or find the feature they're looking for.
    If you're unsure about a specific feature location, suggest general areas where it might be found and how to search for it.
    
    Common platform sections include:
    - Dashboard: Overview of courses, upcoming assignments, and progress
    - Courses: List of enrolled courses
    - Classes: Specific class sections with activities and resources
    - Activities: Assignments, quizzes, and learning materials
    - Grades: View assessment results and feedback
    - Calendar: Schedule of classes and assignment due dates
    - Profile: Personal information and settings
    
    Your response:
  `;
}
```

## 3. Context Management

### Student Context Collection

The system will collect and maintain the following context information:

1. **Student Profile**
   - Name, grade level, and learning preferences
   - Enrolled courses and classes
   - Academic history and performance metrics

2. **Current Context**
   - Current page and available actions
   - Active class or course
   - Current activity or assignment
   - Time context (time of day, proximity to deadlines)

3. **Conversation History**
   - Recent messages for continuity
   - Previously discussed concepts
   - Identified areas of struggle or interest

### Context Integration

```typescript
// src/features/student-assistant/context-manager.ts
export class ContextManager {
  private studentProfile: StudentProfile | null = null;
  private currentClass: ClassData | null = null;
  private currentActivity: ActivityData | null = null;
  private currentPage: PageContext | null = null;
  private conversationHistory: Message[] = [];
  
  constructor() {
    // Initialize with empty context
  }
  
  updateStudentProfile(profile: StudentProfile) {
    this.studentProfile = profile;
  }
  
  updateCurrentClass(classData: ClassData) {
    this.currentClass = classData;
  }
  
  updateCurrentActivity(activity: ActivityData) {
    this.currentActivity = activity;
  }
  
  updateCurrentPage(page: PageContext) {
    this.currentPage = page;
  }
  
  addToConversationHistory(message: Message) {
    // Keep a limited history (e.g., last 10 messages)
    this.conversationHistory.push(message);
    if (this.conversationHistory.length > 10) {
      this.conversationHistory.shift();
    }
  }
  
  getFullContext(): StudentAssistantContext {
    return {
      student: this.studentProfile ? {
        id: this.studentProfile.id,
        name: this.studentProfile.name,
        gradeLevel: this.studentProfile.gradeLevel,
        learningPreferences: this.studentProfile.learningPreferences,
      } : undefined,
      currentClass: this.currentClass ? {
        id: this.currentClass.id,
        name: this.currentClass.name,
        subject: this.currentClass.subject,
      } : undefined,
      currentActivity: this.currentActivity ? {
        id: this.currentActivity.id,
        title: this.currentActivity.title,
        type: this.currentActivity.type,
      } : undefined,
      currentPage: this.currentPage || undefined,
    };
  }
  
  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }
}
```

## 4. Response Generation

### MainAssistantAgent Implementation

```typescript
// src/features/student-assistant/agents/main-assistant-agent.ts
import { StudentAssistantContext, Message } from '../types';
import { generateAIResponse } from '@/lib/ai-service';
import { createBasePrompt } from '../prompt-templates';

export class MainAssistantAgent {
  private context: StudentAssistantContext;
  private conversationHistory: Message[] = [];
  
  constructor(context: StudentAssistantContext) {
    this.context = context;
  }
  
  setConversationHistory(history: Message[]) {
    this.conversationHistory = [...history];
  }
  
  async processMessage(content: string): Promise<string> {
    try {
      // Create prompt with context and history
      const prompt = createBasePrompt(
        this.context.student || { name: 'the student', gradeLevel: 'appropriate' },
        this.conversationHistory,
        content
      );
      
      // Call AI service
      const response = await generateAIResponse(prompt, {
        temperature: 0.7, // Balanced between creativity and consistency
        maxTokens: 1000,  // Reasonable length for educational responses
      });
      
      return response;
    } catch (error) {
      console.error('Error in MainAssistantAgent:', error);
      return "I'm sorry, but I encountered an error while processing your question. Could you try asking in a different way?";
    }
  }
}
```

### SubjectSpecificAgent Implementation

```typescript
// src/features/student-assistant/agents/subject-specific-agent.ts
import { StudentAssistantContext, Message } from '../types';
import { generateAIResponse } from '@/lib/ai-service';
import { 
  createMathPrompt, 
  createSciencePrompt,
  createEnglishPrompt,
  createHistoryPrompt,
  createBasePrompt
} from '../prompt-templates';

export class SubjectSpecificAgent {
  private context: StudentAssistantContext;
  private subjectId: string;
  private conversationHistory: Message[] = [];
  
  constructor(context: StudentAssistantContext, subjectId: string) {
    this.context = context;
    this.subjectId = subjectId;
  }
  
  setConversationHistory(history: Message[]) {
    this.conversationHistory = [...history];
  }
  
  async processMessage(content: string): Promise<string> {
    try {
      // Determine subject type and select appropriate prompt
      const subjectName = this.getSubjectName();
      const prompt = this.createSubjectPrompt(subjectName, content);
      
      // Call AI service with subject-specific prompt
      const response = await generateAIResponse(prompt, {
        temperature: 0.6, // Slightly more consistent for educational content
        maxTokens: 1200,  // Allow for more detailed explanations
      });
      
      return response;
    } catch (error) {
      console.error('Error in SubjectSpecificAgent:', error);
      return "I'm sorry, but I encountered an error while processing your question. Could you try asking in a different way?";
    }
  }
  
  private getSubjectName(): string {
    // Get subject name from context or fallback to a default
    if (this.context.currentClass?.subject?.name) {
      return this.context.currentClass.subject.name.toLowerCase();
    }
    
    // Try to determine from subjectId if not in context
    // This would require a mapping of subject IDs to names
    // For now, return a default
    return 'general';
  }
  
  private createSubjectPrompt(subjectName: string, content: string): string {
    // Select appropriate prompt template based on subject
    switch (subjectName) {
      case 'mathematics':
      case 'math':
      case 'algebra':
      case 'geometry':
      case 'calculus':
        return createMathPrompt(this.context.student!, this.conversationHistory, content);
        
      case 'science':
      case 'biology':
      case 'chemistry':
      case 'physics':
        return createSciencePrompt(this.context.student!, this.conversationHistory, content);
        
      case 'english':
      case 'language arts':
      case 'literature':
        return createEnglishPrompt(this.context.student!, this.conversationHistory, content);
        
      case 'history':
      case 'social studies':
      case 'geography':
        return createHistoryPrompt(this.context.student!, this.conversationHistory, content);
        
      default:
        // Fallback to base prompt if subject not recognized
        return createBasePrompt(this.context.student!, this.conversationHistory, content);
    }
  }
}
```

## 5. Response Quality Assurance

To ensure high-quality, educational responses, we will implement the following measures:

1. **Response Filtering**
   - Check for direct answers and replace with guiding questions
   - Ensure age-appropriate language and concepts
   - Verify educational value of responses

2. **Educational Principles Enforcement**
   - Validate that responses follow Socratic method
   - Ensure scaffolding is properly implemented
   - Verify growth mindset language is used

3. **Feedback Loop**
   - Collect student ratings of response helpfulness
   - Allow teachers to review and provide feedback
   - Use feedback to improve prompt templates

## 6. Next Steps

1. Implement the AI service integration
2. Create and test prompt templates for different subjects
3. Develop the context management system
4. Implement the agent classes with proper error handling
5. Create a feedback collection mechanism
6. Test with sample student questions across different subjects
