import { useAgentOrchestrator } from '../core/AgentOrchestratorProvider';
import { AgentRegistry } from '../core/AgentRegistry';

/**
 * Hook for accessing the agent registry
 * 
 * This hook provides access to the agent registry for registering, retrieving,
 * and listing agent types.
 */
export function useAgentRegistry(): AgentRegistry {
  const { getAgentRegistry } = useAgentOrchestrator();
  return getAgentRegistry();
}
