# Agent Memory System Architecture

## Overview

This document outlines the architecture for a comprehensive memory system that supports agent memories, teacher preferences, and student memories. The system integrates with Prisma for database persistence and tRPC for API endpoints, while maintaining compatibility with the existing client-side memory implementation.

## Current Implementation

The current memory system uses localStorage for persistence:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Management Layer                       │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Memory      │ Teacher     │ Advanced        │ Reflection       │
│ Manager     │ Preference  │ Memory Manager  │ Manager          │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
                                ▼
                      ┌─────────────────────┐
                      │                     │
                      │    localStorage     │
                      │                     │
                      └─────────────────────┘
```

This approach has several limitations:
- Memories are not persisted across devices
- Storage is limited by browser quotas (typically 5-10MB)
- No synchronization between users or sessions
- Risk of data loss if localStorage is cleared

## Enhanced Architecture

The enhanced memory system will use a hybrid approach with both client-side and server-side storage:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Management Layer                       │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Memory      │ Teacher     │ Advanced        │ Reflection       │
│ Manager     │ Preference  │ Memory Manager  │ Manager          │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Persistence Layer                      │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Local       │ Sync        │ Database        │ Cache            │
│ Storage     │ Manager     │ Repository      │ Manager          │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Storage Layer                                 │
├─────────────────────────────┬───────────────────────────────────┤
│                             │                                    │
│       localStorage          │           Prisma DB                │
│       IndexedDB             │                                    │
└─────────────────────────────┴───────────────────────────────────┘
```

## Database Schema

### Agent Memory Model

```prisma
model AgentMemory {
  id            String       @id @default(cuid())
  agentId       String
  userId        String
  type          String       // Memory type (LONG_TERM, EPISODIC, etc.)
  key           String
  value         Json
  metadata      Json?
  timestamp     DateTime     @default(now())
  expiresAt     DateTime?
  status        SystemStatus @default(ACTIVE)
  user          User         @relation(fields: [userId], references: [id])
  
  @@unique([userId, agentId, type, key])
  @@index([agentId])
  @@index([userId])
  @@index([type])
  @@map("agent_memories")
}
```

### Teacher Preference Model

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

### Student Memory Model

```prisma
model StudentMemory {
  id            String       @id @default(cuid())
  studentId     String
  subjectId     String?
  topicId       String?
  type          String       // Memory type (KNOWLEDGE, MISCONCEPTION, STRENGTH, WEAKNESS, etc.)
  key           String
  value         Json
  confidence    Float?       // Confidence score (0-1)
  lastTested    DateTime?
  metadata      Json?
  timestamp     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  status        SystemStatus @default(ACTIVE)
  student       User         @relation(fields: [studentId], references: [id])
  subject       Subject?     @relation(fields: [subjectId], references: [id])
  topic         Topic?       @relation(fields: [topicId], references: [id])
  
  @@index([studentId])
  @@index([subjectId])
  @@index([topicId])
  @@index([type])
  @@map("student_memories")
}
```

## tRPC API Endpoints

### Router Structure

```typescript
// src/server/api/routers/memory.ts
export const memoryRouter = createTRPCRouter({
  // Agent Memory Endpoints
  getAgentMemories: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
  
  setAgentMemory: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      type: z.string(),
      key: z.string(),
      value: z.any(),
      metadata: z.record(z.any()).optional(),
      ttl: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
  
  // Teacher Preference Endpoints
  getTeacherPreferences: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
  
  setTeacherPreference: protectedProcedure
    .input(z.object({
      category: z.string(),
      key: z.string(),
      value: z.any(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
  
  // Student Memory Endpoints
  getStudentMemories: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      subjectId: z.string().optional(),
      topicId: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
  
  setStudentMemory: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      subjectId: z.string().optional(),
      topicId: z.string().optional(),
      type: z.string(),
      key: z.string(),
      value: z.any(),
      confidence: z.number().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

## Client-Side Implementation

### Enhanced Memory Manager

```typescript
// src/features/agents/memory/EnhancedMemoryManager.ts
import { trpc } from '@/utils/trpc';
import { AgentMemory, MemoryType } from '../core/types';

export class EnhancedMemoryManager {
  private agentId: string;
  private userId: string;
  private localMemoryManager: MemoryManager;
  private syncInterval: number = 30000; // 30 seconds
  private syncTimer: NodeJS.Timeout | null = null;
  
  constructor(agentId: string, userId: string) {
    this.agentId = agentId;
    this.userId = userId;
    this.localMemoryManager = new MemoryManager(agentId);
    
    // Start sync process
    this.startSync();
    
    // Load memories from server on initialization
    this.loadFromServer();
  }
  
  /**
   * Sets a memory item with server sync for persistent types
   */
  async setMemory(memory: AgentMemory): Promise<void> {
    // Save to local storage first for immediate access
    this.localMemoryManager.setMemory(memory);
    
    // If it's a persistent memory type, save to server
    if (this.isPersistentMemoryType(memory.type)) {
      try {
        await trpc.memory.setAgentMemory.mutate({
          agentId: this.agentId,
          type: memory.type,
          key: memory.key,
          value: memory.value,
          metadata: memory.metadata,
          ttl: memory.ttl,
        });
      } catch (error) {
        console.error('Failed to sync memory to server:', error);
        // Mark for retry later
        this.markForSync(memory);
      }
    }
  }
  
  /**
   * Gets a memory item, prioritizing local cache but falling back to server
   */
  async getMemory(key: string, type?: MemoryType): Promise<AgentMemory | undefined> {
    // Try local cache first
    const localMemory = this.localMemoryManager.getMemory(key, type);
    if (localMemory) {
      return localMemory;
    }
    
    // If not in local cache and it's a persistent type, try server
    if (type && this.isPersistentMemoryType(type)) {
      try {
        const memories = await trpc.memory.getAgentMemories.query({
          agentId: this.agentId,
          type,
        });
        
        // Find the specific memory
        const serverMemory = memories.find(m => m.key === key);
        if (serverMemory) {
          // Cache it locally
          this.localMemoryManager.setMemory(serverMemory);
          return serverMemory;
        }
      } catch (error) {
        console.error('Failed to fetch memory from server:', error);
      }
    }
    
    return undefined;
  }
  
  // Additional methods and implementation details...
}
```

### Teacher Preference Manager

```typescript
// src/features/agents/memory/EnhancedTeacherPreferenceManager.ts
import { trpc } from '@/utils/trpc';

export class EnhancedTeacherPreferenceManager {
  private userId: string;
  private localPreferenceManager: TeacherPreferenceMemory;
  
  constructor(userId: string) {
    this.userId = userId;
    this.localPreferenceManager = new TeacherPreferenceMemory(`teacher-${userId}`);
    
    // Load preferences from server on initialization
    this.loadFromServer();
  }
  
  /**
   * Sets a teacher preference with server sync
   */
  async setPreference(category: string, key: string, value: any): Promise<void> {
    // Save locally first
    this.localPreferenceManager.setPreference(category, key, value);
    
    // Sync to server
    try {
      await trpc.memory.setTeacherPreference.mutate({
        category,
        key,
        value,
      });
    } catch (error) {
      console.error('Failed to sync preference to server:', error);
      // Mark for retry later
    }
  }
  
  // Additional methods and implementation details...
}
```

### Student Memory Manager

```typescript
// src/features/student-assistant/memory/StudentMemoryManager.ts
import { trpc } from '@/utils/trpc';

export enum StudentMemoryType {
  KNOWLEDGE = 'knowledge',
  MISCONCEPTION = 'misconception',
  STRENGTH = 'strength',
  WEAKNESS = 'weakness',
  LEARNING_STYLE = 'learning-style',
  INTEREST = 'interest',
}

export class StudentMemoryManager {
  private studentId: string;
  private cache: Map<string, any> = new Map();
  
  constructor(studentId: string) {
    this.studentId = studentId;
    
    // Load initial memories
    this.loadMemories();
  }
  
  /**
   * Loads student memories from the server
   */
  async loadMemories(subjectId?: string, topicId?: string): Promise<void> {
    try {
      const memories = await trpc.memory.getStudentMemories.query({
        studentId: this.studentId,
        subjectId,
        topicId,
      });
      
      // Update cache
      memories.forEach(memory => {
        const cacheKey = this.getCacheKey(memory.type, memory.key, memory.subjectId, memory.topicId);
        this.cache.set(cacheKey, memory);
      });
    } catch (error) {
      console.error('Failed to load student memories:', error);
    }
  }
  
  /**
   * Sets a student memory
   */
  async setMemory(
    type: StudentMemoryType,
    key: string,
    value: any,
    options?: {
      subjectId?: string;
      topicId?: string;
      confidence?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      // Update server
      await trpc.memory.setStudentMemory.mutate({
        studentId: this.studentId,
        type,
        key,
        value,
        subjectId: options?.subjectId,
        topicId: options?.topicId,
        confidence: options?.confidence,
        metadata: options?.metadata,
      });
      
      // Update local cache
      const cacheKey = this.getCacheKey(type, key, options?.subjectId, options?.topicId);
      this.cache.set(cacheKey, {
        type,
        key,
        value,
        subjectId: options?.subjectId,
        topicId: options?.topicId,
        confidence: options?.confidence,
        metadata: options?.metadata,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to set student memory:', error);
    }
  }
  
  // Additional methods and implementation details...
}
```

## Student Assistant Integration

The Student Assistant will leverage the memory system to provide personalized tutoring:

```typescript
// src/features/student-assistant/StudentAssistant.ts
import { StudentMemoryManager, StudentMemoryType } from './memory/StudentMemoryManager';

export class StudentAssistant {
  private studentId: string;
  private memoryManager: StudentMemoryManager;
  
  constructor(studentId: string) {
    this.studentId = studentId;
    this.memoryManager = new StudentMemoryManager(studentId);
  }
  
  /**
   * Provides personalized assistance based on student memories
   */
  async provideAssistance(subjectId: string, topicId: string, query: string): Promise<string> {
    // Load relevant memories
    await this.memoryManager.loadMemories(subjectId, topicId);
    
    // Get student knowledge and misconceptions
    const knowledge = await this.memoryManager.getMemoriesByType(StudentMemoryType.KNOWLEDGE, subjectId, topicId);
    const misconceptions = await this.memoryManager.getMemoriesByType(StudentMemoryType.MISCONCEPTION, subjectId, topicId);
    const weaknesses = await this.memoryManager.getMemoriesByType(StudentMemoryType.WEAKNESS, subjectId, topicId);
    const learningStyle = await this.memoryManager.getMemory(StudentMemoryType.LEARNING_STYLE, 'preferred-style');
    
    // Use these memories to personalize the response
    // This would integrate with an AI model to generate the response
    
    // After providing assistance, update memories based on interaction
    await this.updateMemoriesFromInteraction(subjectId, topicId, query);
    
    return "Personalized assistance response";
  }
  
  // Additional methods and implementation details...
}
```

## Implementation Plan

### Phase 1: Database Schema Setup

1. Add the new models to the Prisma schema
2. Run migrations to create the database tables
3. Update existing seed data to include sample memories and preferences

### Phase 2: tRPC API Implementation

1. Create the memory router with all required endpoints
2. Implement the query and mutation handlers
3. Add proper authentication and authorization checks
4. Test the API endpoints with Postman or similar tools

### Phase 3: Enhanced Client-Side Implementation

1. Create the enhanced memory managers that support both local and server storage
2. Update the existing memory managers to use the new enhanced versions
3. Implement proper synchronization and conflict resolution
4. Add offline support with background sync

### Phase 4: Student Assistant Integration

1. Implement the StudentMemoryManager
2. Create the StudentAssistant class with memory integration
3. Develop algorithms for memory updates based on student interactions
4. Integrate with AI models for personalized responses

### Phase 5: Testing and Optimization

1. Write comprehensive tests for all components
2. Optimize database queries for performance
3. Implement caching strategies for frequently accessed memories
4. Add monitoring and logging for memory usage

## Memory Augmentation Strategies

### Teacher Preference Augmentation

1. **Implicit Preference Learning**
   - Track teacher actions and content creation patterns
   - Identify recurring patterns and store as preferences
   - Periodically update confidence scores based on consistency

2. **Explicit Preference Collection**
   - Provide UI for teachers to set preferences directly
   - Offer preference suggestions based on system observations
   - Allow rating and feedback on generated content

### Student Memory Augmentation

1. **Assessment-Based Augmentation**
   - Analyze assessment results to identify knowledge gaps
   - Track question performance by topic and concept
   - Update confidence scores based on assessment outcomes

2. **Interaction-Based Augmentation**
   - Monitor student interactions with content
   - Track time spent, engagement patterns, and help requests
   - Identify topics that require additional explanation

3. **Spaced Repetition Integration**
   - Use memory confidence scores to schedule review sessions
   - Decrease confidence over time for unused knowledge
   - Increase confidence with successful recall

### Agent Memory Augmentation

1. **Conversation Analysis**
   - Extract insights from agent-user conversations
   - Identify recurring questions and topics
   - Store successful responses for future reference

2. **Cross-User Pattern Recognition**
   - Identify common patterns across multiple users
   - Generalize effective strategies while maintaining privacy
   - Create shared knowledge base for agents

## Conclusion

This enhanced memory system provides a robust foundation for personalized education through:

1. **Persistence**: Memories are stored in the database for long-term retention
2. **Synchronization**: Changes are synchronized between client and server
3. **Personalization**: Student and teacher preferences drive content generation
4. **Adaptability**: Memories evolve based on interactions and outcomes

By implementing this architecture, we can create truly adaptive educational experiences that learn from each interaction and continuously improve over time.
