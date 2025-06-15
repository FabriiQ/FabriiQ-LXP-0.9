'use client';

import { useCallback, useState } from 'react';
import { useAgentOrchestrator } from '../core/AgentOrchestratorProvider';
import {
  estimateTokenCount,
  hasExceededMonthlyBudget,
  logTokenUsage,
  truncateToTokenLimit,
  wouldExceedTokenLimits,
  TokenLimitConfig
} from '../services/token-management.service';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

// Import error classes from token management service
import {
  TokenLimitExceededError,
  TokenBudgetExceededError
} from '../services/token-management.service';

/**
 * Options for useTokenLimitedAgent hook
 */
export interface UseTokenLimitedAgentOptions {
  tokenLimits?: Partial<TokenLimitConfig>;
  onTokenLimitExceeded?: (error: TokenLimitExceededError) => void;
  onBudgetExceeded?: (error: TokenBudgetExceededError) => void;
}

/**
 * Hook for using agents with token limits
 *
 * This hook wraps the useAgentOrchestrator hook and adds token limit checks
 * and logging to prevent excessive token usage.
 */
export function useTokenLimitedAgent(options: UseTokenLimitedAgentOptions = {}) {
  const orchestrator = useAgentOrchestrator();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0, total: 0 });

  // Execute agent with token limits
  const sendMessageWithTokenLimits = useCallback(async (
    agentId: string,
    input: string,
    metadata?: Record<string, any>
  ) => {
    setError(null);

    try {
      // Check if monthly budget is exceeded
      if (hasExceededMonthlyBudget(userId, options.tokenLimits)) {
        const error = new TokenBudgetExceededError(
          'Monthly token budget exceeded. Please try again next month or contact your administrator.'
        );

        setError(error);

        if (options.onBudgetExceeded) {
          options.onBudgetExceeded(error);
        }

        throw error;
      }

      // Check if input would exceed token limits
      if (wouldExceedTokenLimits(input, options.tokenLimits)) {
        // If token limit would be exceeded, truncate the input
        const truncatedInput = truncateToTokenLimit(input, options.tokenLimits);

        // If input was truncated, show a warning
        if (truncatedInput !== input) {
          console.warn('Input was truncated to fit within token limits');

          const error = new TokenLimitExceededError(
            'Input exceeds token limit and has been truncated.'
          );

          if (options.onTokenLimitExceeded) {
            options.onTokenLimitExceeded(error);
          }
        }

        input = truncatedInput;
      }

      // Generate a unique request ID for tracking
      const requestId = uuidv4();

      // Start processing
      setIsProcessing(true);

      // Execute the agent with the (potentially truncated) input
      const result = await orchestrator.sendMessage(agentId, input, metadata);

      // Get the response content
      const responseContent = result.message.content;

      // Estimate token usage
      const inputTokens = estimateTokenCount(input);
      const outputTokens = estimateTokenCount(responseContent);
      const totalTokens = inputTokens + outputTokens;

      // Update token usage state
      setTokenUsage({
        input: inputTokens,
        output: outputTokens,
        total: totalTokens
      });

      // Log token usage
      logTokenUsage({
        inputTokens,
        outputTokens,
        totalTokens,
        timestamp: new Date(),
        model: metadata?.model || 'unknown',
        userId,
        requestId,
        endpoint: agentId,
      });

      return result;
    } catch (err) {
      if (err instanceof TokenLimitExceededError || err instanceof TokenBudgetExceededError) {
        // These errors are already handled above
        throw err;
      }

      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unknown error occurred'));
      }

      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [orchestrator, userId, options]);

  return {
    sendMessage: sendMessageWithTokenLimits,
    isProcessing,
    error,
    tokenUsage,
    clearError: () => setError(null)
  };
}
