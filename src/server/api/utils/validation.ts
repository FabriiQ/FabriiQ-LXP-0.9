/**
 * Validation Utility
 * Provides enhanced validation functions and error handling for input validation
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createValidationError } from "./error-handler";
import { logger } from "./logger";

/**
 * Validates input against a Zod schema and returns the validated data
 * @throws AppError with validation details if validation fails
 */
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = error.format();
      logger.debug("Validation error", { error: formattedError });
      
      throw createValidationError("Validation failed", {
        errors: formattedError
      });
    }
    
    throw error;
  }
}

/**
 * Validates input against a Zod schema and returns the validated data or null if validation fails
 */
export function validateInputSafe<T>(schema: z.ZodType<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.debug("Validation error (safe)", { error });
    return null;
  }
}

/**
 * Common validation schemas
 */
export const CommonValidators = {
  id: z.string().min(1).max(100),
  uuid: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  password: z.string().min(8).max(100),
  url: z.string().url(),
  date: z.string().datetime(),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().nonnegative(),
  integer: z.number().int(),
  positiveInteger: z.number().int().positive(),
  nonNegativeInteger: z.number().int().nonnegative(),
  boolean: z.boolean(),
  array: z.array(z.unknown()),
  nonEmptyArray: z.array(z.unknown()).min(1),
  object: z.object({}).passthrough(),
  stringArray: z.array(z.string()),
  nonEmptyString: z.string().min(1),
  trimmedString: z.string().trim(),
  limitedString: (maxLength: number) => z.string().max(maxLength),
  enumValue: <T extends readonly [string, ...string[]]>(values: T) => z.enum(values),
  nullable: <T>(schema: z.ZodType<T>) => schema.nullable(),
  optional: <T>(schema: z.ZodType<T>) => schema.optional(),
  withDefault: <T>(schema: z.ZodType<T>, defaultValue: any) => schema.default(defaultValue)
};

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20)
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Sorting schema
 */
export const SortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc")
});

export type SortingParams = z.infer<typeof SortingSchema>;

/**
 * Search schema
 */
export const SearchSchema = z.object({
  search: z.string().optional(),
  searchFields: z.array(z.string()).optional()
});

export type SearchParams = z.infer<typeof SearchSchema>;

/**
 * Combined query params schema
 */
export const QueryParamsSchema = PaginationSchema.merge(SortingSchema).merge(SearchSchema);

export type QueryParams = z.infer<typeof QueryParamsSchema>;

/**
 * Creates a validation middleware for tRPC procedures
 */
export function createValidationMiddleware<T>(schema: z.ZodType<T>) {
  return async ({ next, rawInput }: { next: any; rawInput: unknown }) => {
    try {
      const validatedInput = schema.parse(rawInput);
      return next({ input: validatedInput });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: error
        });
      }
      throw error;
    }
  };
} 