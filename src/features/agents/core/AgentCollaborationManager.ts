import { AgentMessage, AgentState, AgentType } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Collaboration request status
 */
export enum CollaborationRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Collaboration request type
 */
export enum CollaborationRequestType {
  INFORMATION = 'information',
  TASK = 'task',
  REVIEW = 'review',
  ASSISTANCE = 'assistance',
}

/**
 * Collaboration request
 */
export interface CollaborationRequest {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: CollaborationRequestType;
  content: string;
  status: CollaborationRequestStatus;
  priority: number; // 1-5, with 5 being highest
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  result?: any;
  metadata?: Record<string, any>;
}

/**
 * Agent collaboration manager
 */
export class AgentCollaborationManager {
  private collaborationRequests: Map<string, CollaborationRequest> = new Map();
  private agentCapabilities: Map<string, Set<string>> = new Map();
  private agentSpecializations: Map<string, AgentType> = new Map();
  
  /**
   * Registers an agent's capabilities
   */
  registerAgentCapabilities(agentId: string, agentState: AgentState): void {
    // Extract capabilities from agent metadata
    const capabilities = agentState.metadata?.capabilities || [];
    this.agentCapabilities.set(agentId, new Set(capabilities));
    
    // Store agent specialization
    this.agentSpecializations.set(agentId, agentState.type);
  }
  
  /**
   * Creates a collaboration request
   */
  createCollaborationRequest(
    fromAgentId: string,
    toAgentId: string,
    type: CollaborationRequestType,
    content: string,
    priority: number = 3,
    metadata?: Record<string, any>
  ): CollaborationRequest {
    const now = Date.now();
    
    const request: CollaborationRequest = {
      id: uuidv4(),
      fromAgentId,
      toAgentId,
      type,
      content,
      status: CollaborationRequestStatus.PENDING,
      priority,
      createdAt: now,
      updatedAt: now,
      metadata,
    };
    
    this.collaborationRequests.set(request.id, request);
    
    return request;
  }
  
  /**
   * Updates a collaboration request status
   */
  updateCollaborationRequestStatus(
    requestId: string,
    status: CollaborationRequestStatus,
    result?: any
  ): CollaborationRequest | null {
    const request = this.collaborationRequests.get(requestId);
    
    if (!request) {
      return null;
    }
    
    const updatedRequest: CollaborationRequest = {
      ...request,
      status,
      updatedAt: Date.now(),
      ...(status === CollaborationRequestStatus.COMPLETED || status === CollaborationRequestStatus.FAILED
        ? { completedAt: Date.now() }
        : {}),
      ...(result ? { result } : {}),
    };
    
    this.collaborationRequests.set(requestId, updatedRequest);
    
    return updatedRequest;
  }
  
  /**
   * Gets a collaboration request by ID
   */
  getCollaborationRequest(requestId: string): CollaborationRequest | null {
    return this.collaborationRequests.get(requestId) || null;
  }
  
  /**
   * Gets all collaboration requests for an agent
   */
  getCollaborationRequestsForAgent(agentId: string): CollaborationRequest[] {
    return Array.from(this.collaborationRequests.values())
      .filter(request => request.toAgentId === agentId)
      .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  }
  
  /**
   * Gets all pending collaboration requests for an agent
   */
  getPendingCollaborationRequestsForAgent(agentId: string): CollaborationRequest[] {
    return this.getCollaborationRequestsForAgent(agentId)
      .filter(request => request.status === CollaborationRequestStatus.PENDING);
  }
  
  /**
   * Finds the best agent for a specific task
   */
  findBestAgentForTask(
    requiredCapabilities: string[],
    preferredAgentType?: AgentType,
    excludeAgentIds: string[] = []
  ): string | null {
    // Calculate capability scores for each agent
    const agentScores: Record<string, number> = {};
    
    this.agentCapabilities.forEach((capabilities, agentId) => {
      // Skip excluded agents
      if (excludeAgentIds.includes(agentId)) {
        return;
      }
      
      // Calculate base score based on matching capabilities
      const matchingCapabilities = requiredCapabilities.filter(cap => capabilities.has(cap));
      const baseScore = matchingCapabilities.length / requiredCapabilities.length;
      
      // Apply bonus for preferred agent type
      const typeBonus = preferredAgentType && this.agentSpecializations.get(agentId) === preferredAgentType
        ? 0.3
        : 0;
      
      // Calculate final score
      agentScores[agentId] = baseScore + typeBonus;
    });
    
    // Find agent with highest score
    const entries = Object.entries(agentScores);
    if (entries.length === 0) {
      return null;
    }
    
    const [bestAgentId] = entries.reduce((best, current) => 
      current[1] > best[1] ? current : best
    );
    
    return bestAgentId;
  }
  
  /**
   * Creates a collaboration message from a request
   */
  createCollaborationMessage(request: CollaborationRequest): AgentMessage {
    return {
      id: `collab-${request.id}`,
      role: 'system',
      content: request.content,
      timestamp: Date.now(),
      metadata: {
        collaborationRequestId: request.id,
        collaborationType: request.type,
        fromAgentId: request.fromAgentId,
        priority: request.priority,
        ...request.metadata,
      },
    };
  }
  
  /**
   * Creates a collaboration response message
   */
  createCollaborationResponseMessage(
    request: CollaborationRequest,
    content: string
  ): AgentMessage {
    return {
      id: `collab-response-${request.id}`,
      role: 'system',
      content,
      timestamp: Date.now(),
      metadata: {
        collaborationRequestId: request.id,
        collaborationType: request.type,
        responseToAgentId: request.fromAgentId,
        ...request.metadata,
      },
    };
  }
}
