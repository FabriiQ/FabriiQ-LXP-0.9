/**
 * API Documentation Router
 * Provides endpoints for accessing API documentation
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { generateOpenAPISpec } from "../utils/api-docs";
import { TRPCError } from "@trpc/server";

export const docsRouter = createTRPCRouter({
  /**
   * Get the OpenAPI specification for the API
   */
  getOpenAPISpec: publicProcedure
    .query(async () => {
      try {
        return generateOpenAPISpec();
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate API documentation",
          cause: error
        });
      }
    }),

  /**
   * Get documentation for a specific router
   */
  getRouterDocs: publicProcedure
    .input(z.object({
      routerName: z.string().min(1)
    }))
    .query(async ({ input }) => {
      try {
        const { routerName } = input;
        const allDocs = generateOpenAPISpec();
        
        // Filter paths to only include those for the specified router
        const paths = Object.entries(allDocs.paths as Record<string, unknown>)
          .filter(([path]) => path.startsWith(`/${routerName}/`))
          .reduce((acc, [path, value]) => {
            acc[path] = value;
            return acc;
          }, {} as Record<string, unknown>);
        
        // Filter schemas to only include those for the specified router
        const schemas = Object.entries(
          ((allDocs.components as Record<string, unknown>)?.schemas as Record<string, unknown>) || {}
        )
          .filter(([schemaName]) => schemaName.startsWith(`${routerName}_`))
          .reduce((acc, [schemaName, value]) => {
            acc[schemaName] = value;
            return acc;
          }, {} as Record<string, unknown>);
        
        return {
          openapi: "3.0.0",
          info: {
            title: `${routerName} API`,
            version: "1.0.0",
            description: `API documentation for the ${routerName} router`
          },
          paths,
          components: {
            schemas
          }
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate documentation for router: ${input.routerName}`,
          cause: error
        });
      }
    })
}); 