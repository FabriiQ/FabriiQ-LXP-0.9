import { AgentTool } from './types';

/**
 * Options for tool execution
 */
export interface ToolExecutionOptions {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  timeout: number; // in milliseconds
}

/**
 * Default options for tool execution
 */
const DEFAULT_OPTIONS: ToolExecutionOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000,
};

/**
 * Executes a tool with retry logic and timeout
 */
export async function executeToolWithRetry(
  tool: AgentTool,
  parameters: Record<string, any>,
  options: Partial<ToolExecutionOptions> = {}
): Promise<any> {
  const mergedOptions: ToolExecutionOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= mergedOptions.maxRetries) {
    try {
      // Execute the tool with timeout
      return await Promise.race([
        tool.execute(parameters),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Tool execution timeout')), mergedOptions.timeout);
        }),
      ]);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;

      if (retries <= mergedOptions.maxRetries) {
        // Exponential backoff
        const delay = Math.min(
          mergedOptions.retryDelay * Math.pow(2, retries - 1),
          10000
        );
        
        console.log(`Tool execution failed, retrying (${retries}/${mergedOptions.maxRetries}) after ${delay}ms: ${lastError.message}`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Max retries reached, throw the last error
        console.error(`Tool execution failed after ${mergedOptions.maxRetries} retries:`, lastError);
        throw lastError;
      }
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error during tool execution');
}
