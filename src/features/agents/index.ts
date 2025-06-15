// Core exports
export * from './core/types';
export * from './core/AgentOrchestratorProvider';
export * from './core/agentFactory';
// Export AgentRegistry with explicit imports to avoid ambiguity
import { AgentRegistry } from './core/AgentRegistry';
// Don't re-export useAgentRegistry to avoid ambiguity
export { AgentRegistry };
export * from './core/TokenLimitedAgentOrchestrator';
export * from './core/toolExecutor';
export * from './core/AgentCollaborationManager';

// Memory exports
export * from './memory/MemoryManager';
export * from './memory/TeacherPreferenceMemory';
export * from './memory/AdvancedMemoryManager';
export * from './memory/ReflectionManager';
export * from './memory/FeedbackLearningManager';

// Tool exports
export * from './tools/jinaSearchTool';
export * from './tools/printLayoutTool';
export * from './tools/questionGeneratorTool';
export * from './tools/studentDataTool';
export * from './tools/activityDataTool';
export * from './tools/topicCurriculumTool';
export * from './tools/resourceDiscoveryTool';
export * from './tools/analyticsDataTool';

// Service exports
export * from './services/token-management.service';

// Hook exports
export * from './hooks/useTokenLimitedAgent';
// Import and re-export with a different name to avoid ambiguity
import { useAgentRegistry as useAgentRegistryHook } from './hooks/useAgentRegistry';
export { useAgentRegistryHook };

// Specialized agent exports
export { createWorksheetAgent } from './specialized/WorksheetAgent';
export { createAssessmentAgent } from './specialized/AssessmentAgent';
export { createContentRefinementAgent } from './specialized/ContentRefinementAgent';
export { createLessonPlanAgent } from './specialized/LessonPlanAgent';
export { createSearchAgent } from './specialized/SearchAgent';
export { createResourceAgent } from './specialized/ResourceAgent';
export { createFeedbackAgent } from './specialized/FeedbackAgent';
