import { TRPCClientError } from "@trpc/client";

/**
 * Utility functions for handling tRPC errors consistently across the application
 */

/**
 * Parses a tRPC error and returns a user-friendly error message
 * @param error The error to parse
 * @param defaultMessage The default message to return if the error can't be parsed
 * @returns A user-friendly error message
 */
export function parseTRPCError(
  error: unknown,
  defaultMessage = "An unexpected error occurred. Please try again."
): string {
  // Only log the full error for debugging in development mode
  if (process.env.NODE_ENV === 'development') {
    // Use a single consolidated error log instead of multiple logs
    if (error instanceof TRPCClientError) {
      console.error("TRPC Client Error:", error.message);
    } else {
      console.error("Error details:", error);
    }
  }
  
  // Handle tRPC client errors
  if (error instanceof TRPCClientError) {
    // Handle network errors
    if (error.message.includes("Failed to fetch") || 
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed")) {
      return "Network error: Could not connect to the server. Please check your internet connection.";
    }
    
    // Handle JSON parsing errors (usually from server response issues)
    if (error.message.includes("JSON.parse") || 
        error.message.includes("unexpected character") ||
        error.message.includes("Unexpected token") ||
        error.message.includes("SyntaxError")) {
      return "Server communication error. The server returned an invalid response. Please try again later.";
    }
    
    // Handle timeout errors
    if (error.message.includes("timeout") || error.message.includes("timed out")) {
      return "Request timed out. The server took too long to respond. Please try again later.";
    }
    
    // Handle authentication errors
    if (
      error.message.includes("UNAUTHORIZED") || 
      error.message.includes("Invalid credentials") ||
      error.message.includes("not authenticated") ||
      error.message.includes("Invalid username or password")
    ) {
      // Return a user-friendly message for login failures
      return "Invalid username or password. Please try again.";
    }
    
    // Handle validation errors
    if (error.message.includes("validation")) {
      return "Please check your input and try again.";
    }
    
    // Handle user existence errors
    if (error.message.includes("already exists")) {
      return "Username or email already exists. Please try a different one.";
    }
    
    // Handle not found errors
    if (error.message.includes("NOT_FOUND")) {
      return "The requested resource was not found.";
    }
    
    // If we have a message from the server, use it
    if (error.message) {
      return error.message;
    }
  }
  
  // Handle regular errors
  if (error instanceof Error) {
    // Check for common network-related errors
    if (error.message.includes("Failed to fetch") || 
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed")) {
      return "Network error: Could not connect to the server. Please check your internet connection.";
    }
    
    // Check for timeout errors
    if (error.message.includes("timeout") || error.message.includes("timed out")) {
      return "Request timed out. The server took too long to respond. Please try again later.";
    }
    
    return error.message;
  }
  
  // Default case
  return defaultMessage;
}

/**
 * Wraps a tRPC mutation or query with error handling
 * @param fn The async function to wrap
 * @param errorHandler Optional custom error handler
 * @returns The result of the function or throws a user-friendly error
 */
export async function withTRPCErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = errorHandler 
      ? errorHandler(error) 
      : parseTRPCError(error);
    
    throw new Error(errorMessage);
  }
} 