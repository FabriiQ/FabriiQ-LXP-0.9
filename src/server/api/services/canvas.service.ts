import { z } from "zod";
import { prisma } from "@/server/db";
import { TRPCError } from "@trpc/server";

// Define Canvas type for TypeScript until Prisma client is updated
type Canvas = {
  id: string;
  userId: string;
  messages: any;
  artifacts: any;
  highlightedContent: string | null;
  selectedArtifactId: string | null;
  preferences: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

// Type assertion for Prisma client until it's updated with the Canvas model
type PrismaWithCanvas = typeof prisma & {
  canvas: {
    findFirst: (args: any) => Promise<Canvas | null>;
    findMany: (args: any) => Promise<Canvas[]>;
    upsert: (args: any) => Promise<Canvas>;
    delete: (args: any) => Promise<Canvas>;
  };
};

// Define schemas for canvas operations
export const canvasStateSchema = z.object({
  canvasId: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["system", "user", "assistant", "error"]),
      content: z.string(),
      timestamp: z.number(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  artifacts: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "markdown",
        "code",
        "table",
        "image",
        "question",
        "worksheet",
        "assessment",
        "video",
        "math",
      ]),
      content: z.any(),
      timestamp: z.number(),
      metadata: z.record(z.any()).optional(),
      parentId: z.string().optional(),
    })
  ),
  highlightedContent: z.string().nullable(),
  selectedArtifactId: z.string().nullable(),
  preferences: z.record(z.any()),
});

export const canvasUpdateSchema = z.object({
  canvasId: z.string(),
  state: canvasStateSchema,
});

export const canvasIdSchema = z.object({
  canvasId: z.string(),
});

/**
 * Service for managing canvas state
 */
export class CanvasService {
  constructor(private readonly deps: { prisma: typeof prisma }) {}

  /**
   * Get canvas state by ID
   */
  async getCanvasState(canvasId: string, userId: string) {
    try {
      // Check if the canvas exists and belongs to the user
      const canvas = await this.deps.prisma.canvas.findFirst({
        where: {
          id: canvasId,
          userId,
        },
      });

      if (!canvas) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Canvas not found",
        });
      }

      // Return the canvas state
      return {
        canvasId: canvas.id,
        messages: canvas.messages as any[],
        artifacts: canvas.artifacts as any[],
        highlightedContent: canvas.highlightedContent,
        selectedArtifactId: canvas.selectedArtifactId,
        preferences: canvas.preferences as Record<string, any>,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("Error getting canvas state:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get canvas state",
      });
    }
  }

  /**
   * Create or update canvas state
   */
  async saveCanvasState(state: z.infer<typeof canvasStateSchema>, userId: string) {
    try {
      // Check if the canvas exists
      const existingCanvas = await this.deps.prisma.canvas.findFirst({
        where: {
          id: state.canvasId,
        },
      });

      if (existingCanvas && existingCanvas.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this canvas",
        });
      }

      // Create or update the canvas
      const canvas = await this.deps.prisma.canvas.upsert({
        where: {
          id: state.canvasId,
        },
        create: {
          id: state.canvasId,
          userId,
          messages: state.messages as any,
          artifacts: state.artifacts as any,
          highlightedContent: state.highlightedContent,
          selectedArtifactId: state.selectedArtifactId,
          preferences: state.preferences as any,
          updatedAt: new Date(),
        },
        update: {
          messages: state.messages as any,
          artifacts: state.artifacts as any,
          highlightedContent: state.highlightedContent,
          selectedArtifactId: state.selectedArtifactId,
          preferences: state.preferences as any,
          updatedAt: new Date(),
        },
      });

      return {
        canvasId: canvas.id,
        messages: canvas.messages as any[],
        artifacts: canvas.artifacts as any[],
        highlightedContent: canvas.highlightedContent,
        selectedArtifactId: canvas.selectedArtifactId,
        preferences: canvas.preferences as Record<string, any>,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("Error saving canvas state:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to save canvas state",
      });
    }
  }

  /**
   * Delete canvas by ID
   */
  async deleteCanvas(canvasId: string, userId: string) {
    try {
      // Check if the canvas exists and belongs to the user
      const canvas = await this.deps.prisma.canvas.findFirst({
        where: {
          id: canvasId,
          userId,
        },
      });

      if (!canvas) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Canvas not found",
        });
      }

      // Delete the canvas
      await this.deps.prisma.canvas.delete({
        where: {
          id: canvasId,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("Error deleting canvas:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete canvas",
      });
    }
  }

  /**
   * List all canvases for a user
   */
  async listCanvases(userId: string) {
    try {
      const canvases = await this.deps.prisma.canvas.findMany({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return canvases.map((canvas) => ({
        canvasId: canvas.id,
        updatedAt: canvas.updatedAt,
        createdAt: canvas.createdAt,
      }));
    } catch (error) {
      console.error("Error listing canvases:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list canvases",
      });
    }
  }
}
