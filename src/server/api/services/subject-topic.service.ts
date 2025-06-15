import { TRPCError } from "@trpc/server";
import { PrismaClient } from "@prisma/client";
import {
  CreateSubjectTopicInput,
  UpdateSubjectTopicInput,
  SubjectTopicFilters,
  SubjectTopicServiceConfig
} from "../types/subject-topic";

import { SYSTEM_CONFIG } from "../constants";

// Define SystemStatus enum if it's not available from Prisma
enum SystemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export class SubjectTopicService {
  private prisma: PrismaClient;
  private defaultStatus: SystemStatus;

  constructor(config: SubjectTopicServiceConfig) {
    this.prisma = config.prisma;
    this.defaultStatus = config.defaultStatus || SystemStatus.ACTIVE;
  }

  /**
   * Create a new subject topic
   */
  async createSubjectTopic(input: CreateSubjectTopicInput) {
    try {
      // Check if subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: input.subjectId },
      });

      if (!subject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject not found',
        });
      }

      // Check if topic code already exists in this subject
      const existingTopic = await this.prisma.subjectTopic.findFirst({
        where: {
          subjectId: input.subjectId,
          code: input.code,
        },
        select: {
          id: true,
        },
      });

      if (existingTopic) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Topic code already exists in this subject',
        });
      }

      // If parentTopicId is provided, check if it exists
      if (input.parentTopicId) {
        const parentTopic = await this.prisma.subjectTopic.findUnique({
          where: {
            id: input.parentTopicId,
          },
          select: {
            id: true,
            subjectId: true,
          },
        });

        if (!parentTopic) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent topic not found',
          });
        }

        // Ensure parent topic belongs to the same subject
        if (parentTopic.subjectId !== input.subjectId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Parent topic must belong to the same subject',
          });
        }
      }

      // Create topic
      const newTopic = await this.prisma.subjectTopic.create({
        data: {
          code: input.code,
          title: input.title,
          description: input.description,
          context: input.context,
          learningOutcomes: input.learningOutcomes,
          nodeType: input.nodeType as any, // Cast to any to handle enum
          orderIndex: input.orderIndex,
          estimatedMinutes: input.estimatedMinutes,
          competencyLevel: input.competencyLevel as any, // Cast to any to handle enum
          keywords: input.keywords || [],
          bloomsDistribution: input.bloomsDistribution ? input.bloomsDistribution as any : undefined,
          subjectId: input.subjectId,
          parentTopicId: input.parentTopicId && input.parentTopicId.trim() !== '' ? input.parentTopicId : null,
          status: (input.status || this.defaultStatus) as any, // Cast to any to handle enum
        },
      });

      return newTopic;
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error creating subject topic:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create subject topic',
        cause: error,
      });
    }
  }

  /**
   * Get a subject topic by ID
   */
  async getSubjectTopic(id: string) {
    try {
      const topic = await this.prisma.subjectTopic.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!topic) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject topic not found',
        });
      }

      // Get parent topic if exists
      const parentTopic = topic.parentTopicId ?
        await this.prisma.subjectTopic.findUnique({
          where: { id: topic.parentTopicId },
        }) : null;

      // Get child topics
      const childTopics = await this.prisma.subjectTopic.findMany({
        where: {
          parentTopicId: id,
          status: SystemStatus.ACTIVE as any,
        },
        orderBy: {
          orderIndex: 'asc',
        },
      });

      // Get activities for this topic
      const activities = await this.prisma.activity.findMany({
        where: {
          topicId: id,
          status: SystemStatus.ACTIVE as any,
        },
      });

      // Get assessments for this topic
      const assessments = await this.prisma.assessment.findMany({
        where: {
          topicId: id,
          status: SystemStatus.ACTIVE as any,
        },
      });

      return {
        ...topic,
        subjectName: topic.subject.name,
        subject: undefined, // Remove the subject object
        parentTopic,
        childTopics,
        activities,
        assessments
      };
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error getting subject topic:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get subject topic',
        cause: error,
      });
    }
  }

  /**
   * List subject topics with filtering and pagination
   */
  async listSubjectTopics(
    pagination: { skip?: number; take?: number },
    filters?: SubjectTopicFilters,
  ) {
    try {
      const { skip = 0, take = SYSTEM_CONFIG.DEFAULT_PAGE_SIZE } = pagination || {};
      const { subjectId, nodeType, parentTopicId, search, status = SystemStatus.ACTIVE } = filters || {};

      // Build the where condition for Prisma
      const where: any = {
        status: status as any,
      };

      if (subjectId) {
        where.subjectId = subjectId;
      }

      if (nodeType) {
        where.nodeType = nodeType as any;
      }

      // Handle special case for parentTopicId
      if (parentTopicId === null) {
        // Find root topics (no parent)
        where.parentTopicId = null;
      } else if (parentTopicId) {
        // Find topics with specific parent
        where.parentTopicId = parentTopicId;
      }

      // Handle search
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Count total records
      const total = await this.prisma.subjectTopic.count({ where });

      // Fetch data with pagination
      const topics = await this.prisma.subjectTopic.findMany({
        where,
        include: {
          subject: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              activities: true,
              assessments: true,
              childTopics: true,
            },
          },
        },
        orderBy: [
          { orderIndex: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      });

      // Format the results to match the expected structure
      const formattedTopics = topics.map(topic => ({
        ...topic,
        subjectName: topic.subject.name,
        activityCount: topic._count.activities,
        assessmentCount: topic._count.assessments,
        childTopicCount: topic._count.childTopics,
        subject: undefined, // Remove the subject object
        _count: undefined, // Remove the _count object
      }));

      // Get parent topics for the results if needed
      let parentTopicsMap: Record<string, any> = {};

      if (formattedTopics.length > 0) {
        const topicsWithParents = formattedTopics.filter(t => t.parentTopicId);
        const parentIds = [...new Set(topicsWithParents.map(t => t.parentTopicId))].filter(Boolean);

        if (parentIds.length > 0) {
          const parentTopics = await this.prisma.subjectTopic.findMany({
            where: {
              id: {
                in: parentIds as string[],
              },
            },
          });

          parentTopicsMap = parentTopics.reduce((acc, parent) => {
            acc[parent.id] = parent;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Add parent info to each topic
      const topicsWithParentInfo = formattedTopics.map(topic => {
        if (!topic.parentTopicId) {
          return { ...topic, parentTopic: null };
        }

        return {
          ...topic,
          parentTopic: parentTopicsMap[topic.parentTopicId] || null,
        };
      });

      return {
        data: topicsWithParentInfo,
        meta: {
          total,
          skip,
          take,
        },
      };
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error listing subject topics:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list subject topics',
        cause: error,
      });
    }
  }

  /**
   * Optimized list topics method for AI Content Studio
   * This method is optimized for performance with large datasets
   */
  async listTopics(options: {
    subjectId: string;
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    try {
      const startTime = Date.now();
      const { subjectId, page, pageSize, search } = options;
      const skip = (page - 1) * pageSize;

      // Build the where clause
      const where: any = {
        subjectId,
        status: SystemStatus.ACTIVE as any,
      };

      // Add search filter if provided
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { keywords: { has: search } },
        ];
      }

      // Count total records
      const countStartTime = Date.now();
      const total = await this.prisma.subjectTopic.count({ where });
      const countEndTime = Date.now();

      // Performance monitoring removed

      // Fetch data with pagination - only select fields we need
      const fetchStartTime = Date.now();
      const topics = await this.prisma.subjectTopic.findMany({
        where,
        select: {
          id: true,
          title: true,
          code: true,
          nodeType: true,
          keywords: true,
          orderIndex: true,
          parentTopicId: true,
          subject: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { orderIndex: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSize,
      });
      const fetchEndTime = Date.now();

      // Performance monitoring removed

      // Format the results - minimal processing for performance
      const formattedTopics = topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        code: topic.code,
        nodeType: topic.nodeType,
        keywords: topic.keywords,
        subjectName: topic.subject.name,
        parentTopicId: topic.parentTopicId,
      }));

      // Performance monitoring removed

      return {
        data: formattedTopics,
        total,
        page,
        pageSize,
        hasMore: skip + topics.length < total,
      };
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error listing topics:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list topics',
        cause: error,
      });
    }
  }

  /**
   * Update a subject topic
   */
  async updateSubjectTopic(id: string, input: UpdateSubjectTopicInput) {
    try {
      // Check if topic exists
      const existingTopic = await this.prisma.subjectTopic.findUnique({
        where: { id },
      });

      if (!existingTopic) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject topic not found',
        });
      }

      // If parentTopicId is provided, check if it exists and prevent circular references
      if (input.parentTopicId !== undefined) {
        if (input.parentTopicId !== null) {
          // Check if parent exists
          const parentTopic = await this.prisma.subjectTopic.findUnique({
            where: { id: input.parentTopicId },
          });

          if (!parentTopic) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Parent topic not found',
            });
          }

          // Ensure parent topic belongs to the same subject
          if (parentTopic.subjectId !== existingTopic.subjectId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Parent topic must belong to the same subject',
            });
          }

          // Prevent circular references
          if (input.parentTopicId === id) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Topic cannot be its own parent',
            });
          }

          // Check if the new parent is a descendant of this topic
          const isDescendant = await this.isDescendantOf(input.parentTopicId, id);
          if (isDescendant) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Cannot set a descendant as parent (circular reference)',
            });
          }
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.context !== undefined) updateData.context = input.context;
      if (input.learningOutcomes !== undefined) updateData.learningOutcomes = input.learningOutcomes;
      if (input.nodeType !== undefined) updateData.nodeType = input.nodeType;
      if (input.orderIndex !== undefined) updateData.orderIndex = input.orderIndex;
      if (input.estimatedMinutes !== undefined) updateData.estimatedMinutes = input.estimatedMinutes;
      if (input.competencyLevel !== undefined) updateData.competencyLevel = input.competencyLevel;
      if (input.keywords !== undefined) updateData.keywords = input.keywords;
      if (input.bloomsDistribution !== undefined) updateData.bloomsDistribution = input.bloomsDistribution;
      if (input.parentTopicId !== undefined) updateData.parentTopicId = input.parentTopicId === '' ? null : input.parentTopicId;
      if (input.status !== undefined) updateData.status = input.status;

      if (Object.keys(updateData).length === 0) {
        // No fields to update
        return existingTopic;
      }

      // Update the topic
      const updatedTopic = await this.prisma.subjectTopic.update({
        where: { id },
        data: updateData,
      });

      return updatedTopic;
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error updating subject topic:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update subject topic',
        cause: error,
      });
    }
  }

  /**
   * Delete a subject topic
   */
  async deleteSubjectTopic(id: string) {
    try {
      // Check if topic exists
      const topic = await this.prisma.subjectTopic.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              childTopics: true,
              activities: true,
              assessments: true,
            },
          },
        },
      });

      if (!topic) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject topic not found',
        });
      }

      // Check if the topic has children or related content
      if (topic._count.childTopics > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete topic with child topics. Please delete or reassign child topics first.',
        });
      }

      if (topic._count.activities > 0 || topic._count.assessments > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete topic with associated activities or assessments. Please delete or reassign them first.',
        });
      }

      // Delete the topic
      await this.prisma.subjectTopic.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error deleting subject topic:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete subject topic',
        cause: error,
      });
    }
  }

  /**
   * Get the topic hierarchy for a subject
   */
  async getTopicHierarchy(subjectId: string) {
    try {
      // Check if subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });

      if (!subject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject not found',
        });
      }

      // Fetch all topics for the subject
      const allTopics = await this.prisma.subjectTopic.findMany({
        where: {
          subjectId: subjectId,
          status: SystemStatus.ACTIVE as any, // Cast to any to handle enum
        },
        orderBy: {
          orderIndex: 'asc',
        },
        include: {
          _count: {
            select: {
              activities: true,
              assessments: true,
              childTopics: true,
            },
          },
        },
      });

      // Build the hierarchy tree (starting with root topics)
      const rootTopics = allTopics.filter(topic => !topic.parentTopicId);

      // Function to recursively build the tree
      const buildHierarchy = (parentTopics: any[]): any[] => {
        return parentTopics.map(topic => {
          const children = allTopics.filter(t => t.parentTopicId === topic.id);
          return {
            ...topic,
            children: children.length > 0 ? buildHierarchy(children) : [],
          };
        });
      };

      const hierarchy = buildHierarchy(rootTopics);

      return hierarchy;
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error fetching topic hierarchy:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch topic hierarchy',
        cause: error,
      });
    }
  }

  /**
   * Check if a topic is a descendant of another topic (for circular reference prevention)
   */
  private async isDescendantOf(potentialDescendantId: string, ancestorId: string): Promise<boolean> {
    // Get the potential descendant
    const topic = await this.prisma.subjectTopic.findUnique({
      where: { id: potentialDescendantId },
      select: { parentTopicId: true },
    });

    if (!topic || !topic.parentTopicId) {
      return false;
    }

    if (topic.parentTopicId === ancestorId) {
      return true;
    }

    return this.isDescendantOf(topic.parentTopicId, ancestorId);
  }
}