/**
 * Router Documentation Utility
 * Provides tools for documenting tRPC router procedures
 */

import { z } from "zod";
import { registerRouterMetadata } from "./api-docs";
import { TRPCError } from "@trpc/server";
import { logger } from "./logger";
import { AnyProcedure, AnyRouter } from "@trpc/server";

/**
 * Interface for procedure metadata
 */
export interface ProcedureMetadata {
  description: string;
  input?: z.ZodType<any>;
  output?: z.ZodType<any>;
  examples?: {
    input?: Record<string, unknown>[];
    output?: Record<string, unknown>[];
  };
  deprecated?: boolean;
  tags?: string[];
}

/**
 * Interface for router metadata
 */
export interface RouterMetadata {
  description: string;
  procedures: Record<string, ProcedureMetadata>;
}

/**
 * Creates a decorator for documenting tRPC procedures
 */
export function documentProcedure<T extends AnyProcedure>(metadata: ProcedureMetadata) {
  return (procedure: T): T => {
    // Store the metadata for later use
    (procedure as any).__apiDocs = metadata;
    return procedure;
  };
}

/**
 * Documents a router with metadata
 */
export function documentRouter(routerName: string, metadata: RouterMetadata) {
  try {
    // Convert procedure metadata to endpoint metadata
    const endpoints = Object.entries(metadata.procedures).reduce(
      (acc, [procedureName, procedureMetadata]) => {
        acc[procedureName] = {
          description: procedureMetadata.description,
          input: procedureMetadata.input,
          output: procedureMetadata.output,
          examples: procedureMetadata.examples,
          deprecated: procedureMetadata.deprecated,
          tags: procedureMetadata.tags,
        };
        return acc;
      },
      {} as Record<string, any>
    );

    // Register the router metadata
    registerRouterMetadata(routerName, {
      description: metadata.description,
      endpoints,
    });

    logger.info(`Documented router: ${routerName}`);
  } catch (error) {
    logger.error(`Failed to document router: ${routerName}`, { error });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to document router: ${routerName}`,
      cause: error,
    });
  }
}

/**
 * Creates a documented router
 */
export function createDocumentedRouter<T extends AnyRouter>(
  routerName: string,
  metadata: RouterMetadata,
  router: T
): T {
  documentRouter(routerName, metadata);
  return router;
} 