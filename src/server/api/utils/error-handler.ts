/**
 * Error Handler Utility
 * Provides standardized error handling for the API
 */

import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { logger } from "./logger";

export enum ErrorType {
  // Client errors
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  BAD_REQUEST = "BAD_REQUEST",
  
  // Server errors
  INTERNAL = "INTERNAL",
  DATABASE = "DATABASE",
  TIMEOUT = "TIMEOUT",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
}

export interface ErrorDetails {
  code: string;
  message: string;
  path?: string[];
  details?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * Maps error types to TRPC error codes
 */
const errorTypeToTRPCCode: Record<ErrorType, TRPCError["code"]> = {
  [ErrorType.VALIDATION]: "BAD_REQUEST",
  [ErrorType.NOT_FOUND]: "NOT_FOUND",
  [ErrorType.UNAUTHORIZED]: "UNAUTHORIZED",
  [ErrorType.FORBIDDEN]: "FORBIDDEN",
  [ErrorType.CONFLICT]: "CONFLICT",
  [ErrorType.BAD_REQUEST]: "BAD_REQUEST",
  [ErrorType.INTERNAL]: "INTERNAL_SERVER_ERROR",
  [ErrorType.DATABASE]: "INTERNAL_SERVER_ERROR",
  [ErrorType.TIMEOUT]: "TIMEOUT",
  [ErrorType.EXTERNAL_SERVICE]: "INTERNAL_SERVER_ERROR",
};

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  type: ErrorType,
  message: string,
  details?: Record<string, unknown>,
  cause?: unknown
): ErrorDetails {
  return {
    code: type,
    message,
    details,
    cause,
  };
}

/**
 * Creates a validation error
 */
export function createValidationError(
  message: string,
  details?: Record<string, unknown>
): TRPCError {
  logger.warn("Validation error", { message, details });
  
  return new TRPCError({
    code: "BAD_REQUEST",
    message,
    cause: details,
  });
}

/**
 * Handles errors by logging them and converting to TRPC errors
 */
export function handleError(
  error: unknown,
  defaultMessage = "An unexpected error occurred"
): never {
  // Handle ZodError (validation errors)
  if (error instanceof ZodError) {
    const formattedError = createErrorResponse(
      ErrorType.VALIDATION,
      "Validation error",
      { zodErrors: error.format() }
    );
    
    logger.warn("Validation error", { error: formattedError });
    
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Validation error",
      cause: error,
    });
  }

  // Handle TRPC errors (pass through)
  if (error instanceof TRPCError) {
    logger.warn(`TRPC error: ${error.code}`, { 
      message: error.message,
      cause: error.cause 
    });
    throw error;
  }

  // Handle Prisma errors
  if (
    error instanceof Error && 
    error.name === "PrismaClientKnownRequestError"
  ) {
    const prismaError = error as Error & { code: string };
    let errorType = ErrorType.DATABASE;
    let message = "Database error";

    // Handle specific Prisma error codes
    switch (prismaError.code) {
      case "P2002": // Unique constraint failed
        errorType = ErrorType.CONFLICT;
        message = "A record with this data already exists";
        break;
      case "P2025": // Record not found
        errorType = ErrorType.NOT_FOUND;
        message = "Record not found";
        break;
      // Add more specific error codes as needed
    }

    const formattedError = createErrorResponse(
      errorType,
      message,
      { prismaError: prismaError.message },
      error
    );
    
    logger.error("Database error", { error: formattedError });
    
    throw new TRPCError({
      code: errorTypeToTRPCCode[errorType],
      message,
      cause: error,
    });
  }

  // Handle generic errors
  const isError = error instanceof Error;
  const errorMessage = isError ? error.message : String(error);
  const formattedError = createErrorResponse(
    ErrorType.INTERNAL,
    errorMessage || defaultMessage,
    {},
    error
  );
  
  logger.error("Unhandled error", { error: formattedError });
  
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: errorMessage || defaultMessage,
    cause: error,
  });
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  defaultMessage = "An unexpected error occurred"
): Promise<T> {
  return fn().catch((error) => {
    throw handleError(error, defaultMessage);
  });
} 