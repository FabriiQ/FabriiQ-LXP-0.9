# Multi-Agent Orchestration System Diagrams

This document provides detailed diagrams of the Multi-Agent Orchestration system architecture and workflows.

## System Architecture

```mermaid
graph TD
    subgraph "Agent Orchestration Layer"
        AOP[AgentOrchestratorProvider]
        AR[AgentRegistry]
        AF[Agent Factory]
        TLAO[TokenLimitedAgentOrchestrator]
        ACM[AgentCollaborationManager]
    end
    
    subgraph "Specialized Agent Layer"
        WA[WorksheetAgent]
        AA[AssessmentAgent]
        CRA[ContentRefinementAgent]
        LPA[LessonPlanAgent]
        SA[SearchAgent]
        RA[ResourceAgent]
        FA[FeedbackAgent]
    end
    
    subgraph "Tool Layer"
        JST[Jina Search Tool]
        PLT[Print Layout Tool]
        QGT[Question Generator Tool]
        SDT[Student Data Tool]
        ADT[Activity Data Tool]
        TCT[Topic Curriculum Tool]
        RDT[Resource Discovery Tool]
        ANDT[Analytics Data Tool]
    end
    
    subgraph "Memory Layer"
        MM[Memory Manager]
        TPM[Teacher Preference Memory]
        AMM[Advanced Memory Manager]
        RM[Reflection Manager]
        FLM[Feedback Learning Manager]
    end
    
    AOP --> AR
    AOP --> AF
    AOP --> ACM
    TLAO --> AOP
    
    AF --> WA
    AF --> AA
    AF --> CRA
    AF --> LPA
    AF --> SA
    AF --> RA
    AF --> FA
    
    WA --> PLT
    WA --> QGT
    AA --> QGT
    AA --> SDT
    CRA --> JST
    LPA --> TCT
    SA --> JST
    SA --> RDT
    RA --> RDT
    FA --> ANDT
    
    WA --> MM
    AA --> MM
    CRA --> MM
    LPA --> MM
    SA --> MM
    RA --> MM
    FA --> MM
    
    MM --> TPM
    MM --> AMM
    MM --> RM
    MM --> FLM
```

## Agent Registration and Communication Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant AOP as AgentOrchestratorProvider
    participant AR as AgentRegistry
    participant AF as AgentFactory
    participant SA as SpecializedAgent
    
    App->>AOP: registerAgent(config)
    AOP->>AR: getAgentFactory(type)
    AR-->>AOP: factory function
    AOP->>AF: createAgent(config)
    AF->>SA: createSpecializedAgent(baseAgent)
    SA-->>AF: specializedAgent
    AF-->>AOP: agent
    AOP-->>App: agentId
    
    App->>AOP: sendMessage(agentId, message)
    AOP->>SA: process message
    SA->>AOP: executeToolCall(tool, params)
    AOP-->>SA: tool result
    SA-->>AOP: response
    AOP-->>App: agentResponse
```

## Content Generation Workflow

```mermaid
sequenceDiagram
    participant CS as ContentStudio
    participant AOP as AgentOrchestratorProvider
    participant CRA as ContentRefinementAgent
    participant AA as AssessmentAgent
    participant ACM as AgentCollaborationManager
    participant AT as ActivityTools
    
    CS->>AOP: registerAgent(ContentRefinementAgent)
    AOP-->>CS: contentAgentId
    CS->>AOP: registerAgent(AssessmentAgent)
    AOP-->>CS: assessmentAgentId
    
    CS->>AOP: sendMessage(contentAgentId, "Generate activity")
    AOP->>CRA: process message
    CRA->>AT: executeToolCall("activityDataTool")
    AT-->>CRA: activityData
    
    CRA->>ACM: createCollaborationRequest(assessmentAgentId)
    ACM->>AA: forwardMessage(request)
    AA->>AT: executeToolCall("questionGeneratorTool")
    AT-->>AA: questions
    AA-->>ACM: collaborationResponse
    ACM-->>CRA: response
    
    CRA-->>AOP: finalResponse
    AOP-->>CS: activityContent
```

## Memory Management Flow

```mermaid
sequenceDiagram
    participant Agent as Agent
    participant MM as MemoryManager
    participant TPM as TeacherPreferenceMemory
    participant AMM as AdvancedMemoryManager
    participant RM as ReflectionManager
    
    Agent->>MM: setMemory(key, value, type)
    MM->>AMM: storeWithMetadata(key, value, type, metadata)
    AMM-->>MM: success
    
    Agent->>MM: getMemory(key, type)
    MM->>AMM: retrieveWithMetadata(key, type)
    AMM-->>MM: memory
    MM-->>Agent: memory
    
    Agent->>TPM: storePreference(preference)
    TPM->>AMM: storeWithMetadata(key, preference, LONG_TERM)
    AMM-->>TPM: success
    
    Agent->>RM: addReflection(interaction)
    RM->>AMM: storeWithMetadata(key, reflection, EPISODIC)
    AMM-->>RM: success
```

## Token Management Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant TLAO as TokenLimitedAgentOrchestrator
    participant AOP as AgentOrchestratorProvider
    participant TMS as TokenManagementService
    
    App->>TLAO: sendMessageWithTokenLimits(agentId, message)
    TLAO->>TMS: hasExceededMonthlyBudget(userId)
    
    alt Budget not exceeded
        TMS-->>TLAO: false
        TLAO->>TMS: estimateTokenCount(message)
        TMS-->>TLAO: inputTokens
        TLAO->>AOP: sendMessage(agentId, message)
        AOP-->>TLAO: response
        TLAO->>TMS: estimateTokenCount(response)
        TMS-->>TLAO: outputTokens
        TLAO->>TMS: logTokenUsage(userId, inputTokens, outputTokens)
        TMS-->>TLAO: success
        TLAO-->>App: response
    else Budget exceeded
        TMS-->>TLAO: true
        TLAO-->>App: TokenBudgetExceededError
    end
```

## Integration with Activities and Content Studio

```mermaid
graph TD
    subgraph "Content Studio"
        CS[Content Studio]
        AG[Activity Generator]
        ACI[AI Conversation Interface]
    end
    
    subgraph "Agent System"
        AOP[Agent Orchestrator Provider]
        SA[Specialized Agents]
        AT[Agent Tools]
    end
    
    subgraph "Activities"
        AIC[AI Content Converters]
        AE[Activity Editors]
        AP[Activity Previews]
    end
    
    CS --> AOP
    AOP --> SA
    SA --> AT
    
    AG --> AOP
    AOP --> AG
    
    AG --> AIC
    AIC --> AE
    AE --> AP
    
    ACI --> AOP
    AOP --> ACI
```

## Canvas Integration

```mermaid
graph TD
    subgraph "Agent System"
        AOP[Agent Orchestrator Provider]
        SA[Specialized Agents]
    end
    
    subgraph "Canvas System"
        CS[Canvas System]
        LGA[LangGraph Agents]
        CC[Content Composer]
        AR[Artifact Renderer]
    end
    
    AOP --> CS
    CS --> LGA
    LGA --> CC
    CC --> AR
    
    SA -.-> LGA
```

## Tool Execution Flow

```mermaid
sequenceDiagram
    participant Agent as Agent
    participant AOP as AgentOrchestratorProvider
    participant TE as ToolExecutor
    participant Tool as Tool
    
    Agent->>AOP: executeToolCall(toolName, parameters)
    AOP->>TE: executeToolWithRetry(tool, parameters, options)
    
    loop Retry Logic
        TE->>Tool: execute(parameters)
        
        alt Success
            Tool-->>TE: result
            TE-->>AOP: result
            AOP-->>Agent: result
        else Failure
            Tool-->>TE: error
            TE->>TE: wait for retry delay
        end
    end
    
    alt Max Retries Exceeded
        TE-->>AOP: error
        AOP-->>Agent: error
    end
```

## Agent Collaboration Flow

```mermaid
sequenceDiagram
    participant Agent1 as Agent 1
    participant ACM as AgentCollaborationManager
    participant Agent2 as Agent 2
    participant Agent3 as Agent 3
    
    Agent1->>ACM: createCollaborationRequest(toAgentId, type, content)
    ACM-->>Agent1: request
    
    alt Direct Collaboration
        ACM->>Agent2: forwardMessage(request)
        Agent2->>ACM: collaborationResponse
        ACM-->>Agent1: response
    else Find Best Agent
        Agent1->>ACM: findBestAgentForTask(capabilities)
        ACM->>ACM: evaluateAgentCapabilities()
        ACM-->>Agent1: bestAgentId
        Agent1->>ACM: createCollaborationRequest(bestAgentId, type, content)
        ACM->>Agent3: forwardMessage(request)
        Agent3->>ACM: collaborationResponse
        ACM-->>Agent1: response
    end
```
