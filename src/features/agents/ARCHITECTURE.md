# Multi-Agent Orchestration Architecture

## Overview

The Multi-Agent Orchestration system provides a flexible, extensible framework for creating, managing, and coordinating AI agents within the learning experience platform. This architecture enables specialized agents to collaborate on complex educational content generation tasks while maintaining a consistent user experience.

## Core Architecture

The system follows a provider-based architecture with React Context for state management, combined with specialized agent implementations and tool integrations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Orchestration Layer                     │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Agent       │ Agent       │ Token Limited   │ Agent            │
│ Registry    │ Factory     │ Orchestrator    │ Collaboration    │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    Specialized Agent Layer                       │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Worksheet   │ Assessment  │ Content         │ Lesson Plan      │
│ Agent       │ Agent       │ Refinement      │ Agent            │
├─────────────┼─────────────┼─────────────────┼──────────────────┤
│ Search      │ Resource    │ Feedback        │                  │
│ Agent       │ Agent       │ Agent           │                  │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        Tool Layer                                │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Jina Search │ Print       │ Question        │ Student Data     │
│ Tool        │ Layout Tool │ Generator Tool  │ Tool             │
├─────────────┼─────────────┼─────────────────┼──────────────────┤
│ Activity    │ Topic       │ Resource        │ Analytics        │
│ Data Tool   │ Data Tool   │ Discovery Tool  │ Data Tool        │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        Memory Layer                              │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ Memory      │ Teacher     │ Advanced        │ Reflection       │
│ Manager     │ Preference  │ Memory Manager  │ Manager          │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
```

## Key Components

### 1. Agent Orchestration Layer

#### AgentOrchestratorProvider
The central component that manages agent state, registration, and communication. It provides a React Context for components to access agent functionality.

**Key Features:**
- Agent registration and lifecycle management
- Message passing between agents
- Tool execution with retry logic
- Memory management for agent state persistence

#### AgentRegistry
Manages the registration and retrieval of agent types and factory functions.

**Key Features:**
- Dynamic agent type registration
- Lazy loading of agent implementations
- Factory function management for agent creation

#### TokenLimitedAgentOrchestrator
Extends the base orchestrator with token usage tracking and budget enforcement.

**Key Features:**
- Token usage monitoring
- Budget enforcement
- Error handling for exceeded limits

#### AgentCollaborationManager
Facilitates collaboration between agents for complex tasks.

**Key Features:**
- Capability-based agent discovery
- Collaboration request management
- Priority-based task allocation

### 2. Specialized Agent Layer

The system includes several specialized agents for different educational content types:

- **WorksheetAgent**: Generates educational worksheets with print layout optimization
- **AssessmentAgent**: Creates assessments with question generation capabilities
- **ContentRefinementAgent**: Refines content with style adaptation and clarity improvements
- **LessonPlanAgent**: Develops lesson plans aligned with curriculum standards
- **SearchAgent**: Performs content discovery and research
- **ResourceAgent**: Integrates educational resources
- **FeedbackAgent**: Provides content quality assessment

Each agent is implemented as a specialized extension of the base agent state with specific tools and capabilities.

### 3. Tool Layer

Agents leverage specialized tools to perform specific tasks:

- **jinaSearchTool**: Performs semantic search using Jina AI
- **printLayoutTool**: Optimizes content for printing
- **questionGeneratorTool**: Generates educational questions
- **studentDataTool**: Accesses and analyzes student data
- **activityDataTool**: Retrieves and processes activity data
- **topicCurriculumTool**: Accesses curriculum standards and topics
- **resourceDiscoveryTool**: Discovers educational resources
- **analyticsDataTool**: Analyzes educational data

### 4. Memory Layer

The system includes a sophisticated memory management system:

- **MemoryManager**: Basic memory operations for agents
- **TeacherPreferenceMemory**: Stores and retrieves teacher preferences
- **AdvancedMemoryManager**: Enhanced memory capabilities with TTL and metadata
- **ReflectionManager**: Enables agents to reflect on past interactions
- **FeedbackLearningManager**: Learns from feedback to improve future responses

## Integration with Activities and Content Studio

The Multi-Agent Orchestration system integrates with the Activities and Content Studio features to provide AI-powered content generation:

### Activities Integration

```
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  Content Studio     │────▶│  Agent Orchestrator │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  Activity Generator │◀────│  Specialized Agents │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  Activity Editors   │     │   Agent Tools       │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
```

1. Content Studio uses the Agent Orchestrator to create and manage specialized agents
2. Specialized agents (particularly ContentRefinementAgent) generate activity content
3. Activity content is converted to the appropriate activity model format
4. Activity editors display and allow editing of the generated content

### Content Studio Integration

The Content Studio leverages the Multi-Agent Orchestration system for:

1. **Worksheet Generation**: Using WorksheetAgent with print layout optimization
2. **Assessment Generation**: Using AssessmentAgent with question generation
3. **Lesson Plan Creation**: Using LessonPlanAgent with curriculum alignment
4. **Content Refinement**: Using ContentRefinementAgent for improving content quality

## Technical Implementation Details

### Agent State Management

Agent state is managed through a reducer pattern with the following actions:

- REGISTER_AGENT: Adds a new agent to the orchestrator
- UNREGISTER_AGENT: Removes an agent from the orchestrator
- SET_ACTIVE_AGENT: Sets the currently active agent
- ADD_MESSAGE: Adds a message to an agent's conversation history
- SET_MEMORY: Updates an agent's memory
- CLEAR_MEMORY: Clears an agent's memory
- SET_AGENT_STATUS: Updates an agent's status (idle, thinking, etc.)

### Agent Communication

Agents communicate through message passing with the following methods:

- sendMessage: Sends a message to a specific agent
- forwardMessage: Forwards a message from one agent to another
- broadcastMessage: Sends a message to all agents (with optional exclusions)

### Tool Execution

Tools are executed with retry logic and error handling:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Agent Request  │────▶│  Tool Executor  │────▶│  Tool Function  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │  ▲
                               │  │
                               ▼  │
                        ┌─────────────────┐
                        │                 │
                        │  Retry Logic    │
                        │                 │
                        └─────────────────┘
```

### Memory Management

Agent memory is structured with the following types:

- SHORT_TERM: Temporary memory that expires quickly
- LONG_TERM: Persistent memory for important information
- WORKING: Active memory for current tasks
- EPISODIC: Memory of specific interactions or events
- SEMANTIC: Conceptual knowledge and understanding

## Canvas Integration

The system integrates with the Canvas feature for enhanced content generation:

```
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  Agent Orchestrator │────▶│  Canvas System      │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │                     │
                            │  LangGraph Agents   │
                            │                     │
                            └─────────────────────┘
```

The Canvas system provides:
- LangGraph-based agents for complex content generation
- State management for multi-step generation processes
- Tool-based generation for structured outputs
- Reflection capabilities for improved content quality

## Conclusion

The Multi-Agent Orchestration system provides a powerful, flexible framework for AI-powered educational content generation. By leveraging specialized agents, tools, and memory systems, it enables the creation of high-quality, personalized educational content while maintaining a consistent user experience.
