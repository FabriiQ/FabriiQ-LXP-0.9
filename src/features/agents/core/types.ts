/**
 * Core types for the multi-agent orchestration system
 */

export enum AgentType {
  WORKSHEET = 'worksheet',
  ASSESSMENT = 'assessment',
  CONTENT_REFINEMENT = 'content-refinement',
  LESSON_PLAN = 'lesson-plan',
  SEARCH = 'search',
  RESOURCE = 'resource',
  FEEDBACK = 'feedback',
  ESSAY_GRADING = 'essay-grading',
}

export enum MemoryType {
  SHORT_TERM = 'short-term',
  LONG_TERM = 'long-term',
  WORKING = 'working',
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
}

export interface AgentMemory {
  type: MemoryType;
  key: string;
  value: any;
  metadata?: Record<string, any>;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface AgentMessage {
  id: string;
  role: 'system' | 'user' | 'agent' | 'error';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
  parentId?: string; // For threaded conversations
}

export interface AgentState {
  id: string;
  type: AgentType;
  messages: AgentMessage[];
  memory: AgentMemory[];
  tools: AgentTool[];
  metadata: Record<string, any>;
  status: 'idle' | 'thinking' | 'responding' | 'error';
  error?: string;
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  tools: AgentTool[];
  initialMemory?: AgentMemory[];
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  message: AgentMessage;
  artifacts?: ArtifactData[];
  toolCalls?: ToolCallData[];
  updatedMemory?: AgentMemory[];
}

export interface ToolCallData {
  toolName: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
}

export interface ArtifactData {
  id: string;
  type: string;
  content: any;
  metadata: Record<string, any>;
}
