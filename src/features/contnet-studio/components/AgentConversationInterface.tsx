"use client";

import React, { useState, useRef, useEffect } from "react";
import { AIConversationInterface } from "./AIConversationInterface";
import {
  AgentOrchestratorProvider,
  AgentType,
  createContentRefinementAgent,
  AgentRegistry,
  AgentState
} from '@/features/agents';
import { ActivityPurpose } from "@/server/api/constants";
import { toast } from "@/components/ui/feedback/toast";

interface AgentConversationInterfaceProps {
  initialContent: any;
  onSave: (content: any) => void;
  onBack: () => void;
  activityType: string;
  activityTitle: string;
  activityPurpose?: ActivityPurpose;
}

/**
 * A wrapper around AIConversationInterface that uses the agent orchestration system
 * for content refinement.
 */
export function AgentConversationInterface({
  initialContent,
  onSave,
  onBack,
  activityType,
  activityTitle,
  activityPurpose = ActivityPurpose.LEARNING
}: AgentConversationInterfaceProps) {
  // Initialize the agent registry
  const registry = useRef(AgentRegistry.getInstance());
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isAgentReady, setIsAgentReady] = useState(false);

  // Initialize the content refinement agent
  useEffect(() => {
    const initAgent = async () => {
      try {
        // The content refinement agent should already be registered in the registry
        // We just need to make sure it's available

        // Create a base agent state
        const baseAgentState: AgentState = {
          id: `content-refinement-${Date.now()}`,
          type: AgentType.CONTENT_REFINEMENT,
          status: 'idle',
          messages: [],
          memory: [],
          tools: [],
          metadata: {
            name: `Content Refinement for ${activityTitle}`,
            systemPrompt: `You are a specialized content refinement agent designed to improve educational content.
            Focus on refining the ${activityType} activity titled "${activityTitle}" to be:
            1. Clear and concise
            2. Engaging and interesting for the target audience
            3. Pedagogically sound
            4. Free of errors and inconsistencies
            5. Appropriately formatted and structured

            The activity is for ${activityPurpose === ActivityPurpose.LEARNING ? 'learning' : 'assessment'} purposes.
            `,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        };

        // Create the content refinement agent
        const agent = createContentRefinementAgent(baseAgentState);

        // Store the agent ID
        setAgentId(agent.id);
        setIsAgentReady(true);

        console.log('Content refinement agent initialized:', agent.id);
      } catch (error) {
        console.error('Error initializing content refinement agent:', error);
        toast({
          title: "Agent Initialization Error",
          description: "Failed to initialize the content refinement agent. Falling back to standard interface.",
          variant: "error",
        });
      }
    };

    initAgent();

    // Cleanup
    return () => {
      // No need to unregister the agent factory since we're using the singleton registry
      // Just log that we're cleaning up
      if (agentId) {
        console.log('Content refinement agent session ended');
      }
    };
  }, [activityTitle, activityType, activityPurpose]);

  // For now, we'll just use the standard AIConversationInterface
  // In a real implementation, we would integrate with the agent orchestration system
  return (
    <AIConversationInterface
      initialContent={initialContent}
      onSave={onSave}
      onBack={onBack}
      activityType={activityType}
      activityTitle={activityTitle}
      activityPurpose={activityPurpose}
    />
  );
}
