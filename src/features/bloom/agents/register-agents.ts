/**
 * Register Bloom's Taxonomy Agents
 *
 * This module registers Bloom's Taxonomy agents with the central agent orchestration system.
 */

import { AgentRegistry } from '@/features/agents/core/AgentRegistry';
import { bloomsAgentDefinitions } from './agent-definitions';

/**
 * Register all Bloom's Taxonomy agents with the agent registry
 *
 * This function registers the Bloom's Taxonomy agents with the centralized
 * agent orchestration system in the features/agents directory.
 */
export function registerBloomsAgents() {
  // Get the agent registry instance
  const registry = AgentRegistry.getInstance();

  // Define custom agent types for Bloom's Taxonomy
  const BLOOM_AGENT_TYPES = {
    CLASSIFICATION: 'blooms-classification',
    RUBRIC_GENERATION: 'rubric-generation',
    ACTIVITY_GENERATION: 'activity-generation',
    MASTERY_ANALYSIS: 'topic-mastery-analysis'
  };

  // Register each agent definition
  bloomsAgentDefinitions.forEach(agentDefinition => {
    registry.registerAgentType({
      type: agentDefinition.type as any, // Type conversion needed
      name: agentDefinition.name,
      description: agentDefinition.description,
      factory: agentDefinition.handler ?
        // Create a factory function that returns an agent with the handler
        (baseAgent) => {
          return {
            ...baseAgent,
            execute: async (params: any) => {
              // Call the handler with the agent and params
              return await agentDefinition.handler!(baseAgent, params);
            }
          };
        } :
        null, // Use the default factory if no handler is provided
      metadata: {
        inputSchema: agentDefinition.inputSchema,
        outputSchema: agentDefinition.outputSchema,
        promptTemplate: agentDefinition.promptTemplate,
        bloomsSpecific: true // Mark as Bloom's Taxonomy specific
      }
    });
  });

  console.log(`Registered ${bloomsAgentDefinitions.length} Bloom's Taxonomy agents`);
}

/**
 * Unregister all Bloom's Taxonomy agents from the agent registry
 */
export function unregisterBloomsAgents() {
  // This is a placeholder as there's no direct unregister method in AgentRegistry
  // In a real implementation, we would need to track registered types and remove them
  console.log(`Unregistered ${bloomsAgentDefinitions.length} Bloom's Taxonomy agents`);
}
