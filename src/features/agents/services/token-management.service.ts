/**
 * Token Management Service
 *
 * This service provides utilities for managing token usage in LLM calls,
 * including token counting, rate limiting, and budget management.
 */

import { env } from "@/env.mjs";

/**
 * Token limit exceeded error
 */
export class TokenLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenLimitExceededError';
  }
}

/**
 * Token budget exceeded error
 */
export class TokenBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenBudgetExceededError';
  }
}

// Default token limits if not specified in environment variables
const DEFAULT_INPUT_TOKEN_LIMIT = 1000;
const DEFAULT_OUTPUT_TOKEN_LIMIT = 1000;
const DEFAULT_MONTHLY_TOKEN_BUDGET = 1000000; // 1 million tokens per month

/**
 * Token usage tracking interface
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: Date;
  model: string;
  userId?: string;
  requestId: string;
  endpoint: string;
}

/**
 * Token limit configuration
 */
export interface TokenLimitConfig {
  inputTokenLimit: number;
  outputTokenLimit: number;
  monthlyTokenBudget: number;
}

/**
 * Simple token counter based on character count
 * This is a rough approximation - for production, use a proper tokenizer like tiktoken
 *
 * @param text Text to count tokens for
 * @returns Approximate token count
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Get token limit configuration from environment variables
 *
 * @returns Token limit configuration
 */
export function getTokenLimitConfig(): TokenLimitConfig {
  return {
    inputTokenLimit: Number(process.env.LLM_INPUT_TOKEN_LIMIT) || DEFAULT_INPUT_TOKEN_LIMIT,
    outputTokenLimit: Number(process.env.LLM_OUTPUT_TOKEN_LIMIT) || DEFAULT_OUTPUT_TOKEN_LIMIT,
    monthlyTokenBudget: Number(process.env.LLM_MONTHLY_TOKEN_BUDGET) || DEFAULT_MONTHLY_TOKEN_BUDGET,
  };
}

/**
 * Check if a request would exceed token limits
 *
 * @param inputText Input text to check
 * @param config Optional token limit configuration
 * @returns Whether the request would exceed limits
 */
export function wouldExceedTokenLimits(inputText: string, config?: Partial<TokenLimitConfig>): boolean {
  const tokenConfig = { ...getTokenLimitConfig(), ...config };
  const estimatedInputTokens = estimateTokenCount(inputText);

  return estimatedInputTokens > tokenConfig.inputTokenLimit;
}

/**
 * Truncate input text to fit within token limits
 *
 * @param inputText Input text to truncate
 * @param config Optional token limit configuration
 * @returns Truncated text
 */
export function truncateToTokenLimit(inputText: string, config?: Partial<TokenLimitConfig>): string {
  const tokenConfig = { ...getTokenLimitConfig(), ...config };
  const estimatedInputTokens = estimateTokenCount(inputText);

  if (estimatedInputTokens <= tokenConfig.inputTokenLimit) {
    return inputText;
  }

  // Approximate character count based on token limit
  const maxChars = tokenConfig.inputTokenLimit * 4;

  // Truncate text to fit within limit
  return inputText.substring(0, maxChars) + "\n[Content truncated due to token limit]";
}

// In-memory storage for token usage (in a production app, use a database)
const tokenUsageLog: TokenUsage[] = [];

/**
 * Log token usage for a request
 *
 * @param usage Token usage information
 */
export function logTokenUsage(usage: TokenUsage): void {
  tokenUsageLog.push(usage);

  // In a real implementation, this would be persisted to a database
  console.log(`Token usage logged: ${usage.totalTokens} tokens for ${usage.endpoint}`);
}

/**
 * Get total token usage for the current month
 *
 * @param userId Optional user ID to filter by
 * @returns Total token usage
 */
export function getCurrentMonthTokenUsage(userId?: string): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return tokenUsageLog
    .filter(usage => {
      const isCurrentMonth = usage.timestamp >= startOfMonth;
      const isUserMatch = !userId || usage.userId === userId;
      return isCurrentMonth && isUserMatch;
    })
    .reduce((total, usage) => total + usage.totalTokens, 0);
}

/**
 * Check if the monthly token budget has been exceeded
 *
 * @param userId Optional user ID to check for
 * @param config Optional token limit configuration
 * @returns Whether the budget has been exceeded
 */
export function hasExceededMonthlyBudget(userId?: string, config?: Partial<TokenLimitConfig>): boolean {
  const tokenConfig = { ...getTokenLimitConfig(), ...config };
  const currentUsage = getCurrentMonthTokenUsage(userId);

  return currentUsage >= tokenConfig.monthlyTokenBudget;
}

/**
 * Get remaining token budget for the current month
 *
 * @param userId Optional user ID to check for
 * @param config Optional token limit configuration
 * @returns Remaining token budget
 */
export function getRemainingTokenBudget(userId?: string, config?: Partial<TokenLimitConfig>): number {
  const tokenConfig = { ...getTokenLimitConfig(), ...config };
  const currentUsage = getCurrentMonthTokenUsage(userId);

  return Math.max(0, tokenConfig.monthlyTokenBudget - currentUsage);
}
