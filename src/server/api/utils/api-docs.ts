/**
 * API Documentation Utility
 * Provides tools for generating API documentation from tRPC routers
 */

import { z } from "zod";

interface EndpointMetadata {
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

interface RouterMetadata {
  description: string;
  endpoints: Record<string, EndpointMetadata>;
}

// Store for router metadata
const routerMetadataStore: Record<string, RouterMetadata> = {};

/**
 * Registers metadata for a router
 */
export function registerRouterMetadata(
  routerName: string,
  metadata: RouterMetadata
): void {
  routerMetadataStore[routerName] = metadata;
}

/**
 * Gets metadata for a router
 */
export function getRouterMetadata(routerName: string): RouterMetadata | undefined {
  return routerMetadataStore[routerName];
}

/**
 * Gets metadata for all routers
 */
export function getAllRouterMetadata(): Record<string, RouterMetadata> {
  return { ...routerMetadataStore };
}

/**
 * Generates OpenAPI specification from router metadata
 */
export function generateOpenAPISpec(): Record<string, unknown> {
  const paths: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};
  
  // Process each router
  Object.entries(routerMetadataStore).forEach(([routerName, routerMetadata]) => {
    // Process each endpoint
    Object.entries(routerMetadata.endpoints).forEach(([endpointName, endpointMetadata]) => {
      const path = `/${routerName}/${endpointName}`;
      const method = endpointName.startsWith("get") ? "get" : "post";
      
      // Generate schema references for input and output
      let requestSchema: Record<string, unknown> | undefined;
      let responseSchema: Record<string, unknown> | undefined;
      
      if (endpointMetadata.input) {
        const schemaName = `${routerName}_${endpointName}_input`;
        schemas[schemaName] = zodToJsonSchema(endpointMetadata.input);
        requestSchema = {
          $ref: `#/components/schemas/${schemaName}`
        };
      }
      
      if (endpointMetadata.output) {
        const schemaName = `${routerName}_${endpointName}_output`;
        schemas[schemaName] = zodToJsonSchema(endpointMetadata.output);
        responseSchema = {
          $ref: `#/components/schemas/${schemaName}`
        };
      }
      
      // Create path entry
      paths[path] = {
        [method]: {
          summary: endpointName,
          description: endpointMetadata.description,
          tags: endpointMetadata.tags || [routerName],
          deprecated: endpointMetadata.deprecated,
          requestBody: requestSchema ? {
            content: {
              "application/json": {
                schema: requestSchema
              }
            }
          } : undefined,
          responses: {
            "200": {
              description: "Successful response",
              content: responseSchema ? {
                "application/json": {
                  schema: responseSchema
                }
              } : undefined
            },
            "400": {
              description: "Bad request"
            },
            "401": {
              description: "Unauthorized"
            },
            "403": {
              description: "Forbidden"
            },
            "500": {
              description: "Internal server error"
            }
          }
        }
      };
    });
  });
  
  // Generate the OpenAPI specification
  return {
    openapi: "3.0.0",
    info: {
      title: "Aivy LXP API",
      version: "1.0.0",
      description: "API for the Aivy Learning Experience Platform"
    },
    paths,
    components: {
      schemas
    }
  };
}

/**
 * Converts a Zod schema to a JSON schema
 * This is a simplified version and doesn't handle all Zod types
 */
function zodToJsonSchema(schema: z.ZodType<any>): Record<string, unknown> {
  // This is a simplified implementation
  // For a complete solution, use a library like zod-to-json-schema
  
  // Get the description of the schema
  const description = (schema as any)._def?.description;
  
  // Handle primitive types
  if (schema instanceof z.ZodString) {
    return {
      type: "string",
      ...(description && { description })
    };
  }
  
  if (schema instanceof z.ZodNumber) {
    return {
      type: "number",
      ...(description && { description })
    };
  }
  
  if (schema instanceof z.ZodBoolean) {
    return {
      type: "boolean",
      ...(description && { description })
    };
  }
  
  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      ...(description && { description }),
      items: zodToJsonSchema((schema as any)._def.type)
    };
  }
  
  if (schema instanceof z.ZodObject) {
    const shape = (schema as any)._def.shape();
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    
    Object.entries(shape).forEach(([key, value]) => {
      // Type assertion to ensure value is treated as a ZodType
      const zodValue = value as z.ZodType<any>;
      properties[key] = zodToJsonSchema(zodValue);
      
      // Check if the property is required
      if (!(zodValue instanceof z.ZodOptional)) {
        required.push(key);
      }
    });
    
    return {
      type: "object",
      ...(description && { description }),
      properties,
      ...(required.length > 0 && { required })
    };
  }
  
  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      ...(description && { description }),
      enum: (schema as any)._def.values
    };
  }
  
  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema((schema as any)._def.innerType);
  }
  
  if (schema instanceof z.ZodNullable) {
    return {
      ...zodToJsonSchema((schema as any)._def.innerType),
      nullable: true
    };
  }
  
  // Default to any type if not recognized
  return {
    type: "object",
    ...(description && { description })
  };
}

/**
 * Creates a decorator for documenting tRPC procedures
 */
export function documentProcedure(metadata: EndpointMetadata) {
  return <T extends Record<string, unknown>>(target: T): T => {
    // Store the metadata for later use
    (target as any).__apiDocs = metadata;
    return target;
  };
} 