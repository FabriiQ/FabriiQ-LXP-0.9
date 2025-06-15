/**
 * Communication Service
 * Handles operations related to internal messaging and communication
 */

import { PrismaClient, SystemStatus, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Define the enums that were missing from Prisma client
enum ConversationType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  CLASS = "CLASS",
  DEPARTMENT = "DEPARTMENT"
}

enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  DELETED = "DELETED"
}

// Conversation creation schema
export const createConversationSchema = z.object({
  title: z.string().optional(),
  type: z.nativeEnum(ConversationType),
  participantIds: z.array(z.string()).min(1, "At least one participant is required"),
  creatorId: z.string(),
  initialMessage: z.string().optional(),
});

// Conversation update schema
export const updateConversationSchema = z.object({
  title: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Message creation schema
export const createMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, "Message content is required"),
  attachments: z.array(z.string()).optional(),
});

// Message update schema
export const updateMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

// Participant schema
export const addParticipantSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  isAdmin: z.boolean().default(false),
});

export class CommunicationService extends ServiceBase {
  /**
   * Creates a new conversation
   * @param data Conversation data
   * @returns Created conversation
   */
  async createConversation(data: z.infer<typeof createConversationSchema>) {
    try {
      // Check if all participants exist
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: [...data.participantIds, data.creatorId],
          },
        },
      });

      const foundUserIds = users.map((user) => user.id);
      const missingUserIds = [...data.participantIds, data.creatorId].filter(
        (id) => !foundUserIds.includes(id)
      );

      if (missingUserIds.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Users with IDs ${missingUserIds.join(", ")} not found`,
        });
      }

      // For direct conversations, check if a conversation already exists between the two users
      if (
        data.type === ConversationType.DIRECT &&
        data.participantIds.length === 1
      ) {
        const existingConversation = await this.findDirectConversation(
          data.creatorId,
          data.participantIds[0]
        );

        if (existingConversation) {
          // If there's an initial message, add it to the existing conversation
          if (data.initialMessage) {
            await (this.prisma as any).message.create({
              data: {
                conversationId: existingConversation.id,
                senderId: data.creatorId,
                content: data.initialMessage,
              },
            });
          }

          return {
            success: true,
            conversation: existingConversation,
            isExisting: true,
          };
        }
      }

      // Create conversation
      const conversation = await (this.prisma as any).conversation.create({
        data: {
          title: data.title,
          type: data.type as unknown as Prisma.JsonValue,
          status: SystemStatus.ACTIVE,
          participants: {
            create: [
              {
                userId: data.creatorId,
                isAdmin: true,
              },
              ...data.participantIds.map((id: string) => ({
                userId: id,
                isAdmin: false,
              })),
            ],
          },
          ...(data.initialMessage
            ? {
                messages: {
                  create: {
                    senderId: data.creatorId,
                    content: data.initialMessage,
                  },
                },
              }
            : {}),
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              sentAt: "desc",
            },
            take: 1,
          },
        },
      });

      return {
        success: true,
        conversation,
        isExisting: false,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create conversation",
        cause: error,
      });
    }
  }

  /**
   * Finds a direct conversation between two users
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Conversation if found, null otherwise
   */
  private async findDirectConversation(userId1: string, userId2: string) {
    const conversations = await (this.prisma as any).conversation.findMany({
      where: {
        type: ConversationType.DIRECT as unknown as Prisma.JsonValue,
        status: SystemStatus.ACTIVE,
        participants: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
            status: SystemStatus.ACTIVE,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Find the conversation with exactly 2 participants
    return conversations.find(
      (conversation: any) => conversation.participants.length === 2
    );
  }

  /**
   * Gets a conversation by ID
   * @param id Conversation ID
   * @param userId User ID requesting the conversation
   * @returns Conversation
   */
  async getConversation(id: string, userId: string) {
    try {
      const conversation = await (this.prisma as any).conversation.findUnique({
        where: { id },
        include: {
          participants: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              sentAt: "desc",
            },
            take: 20,
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if the user is a participant
      const isParticipant = conversation.participants.some(
        (participant: any) => participant.userId === userId
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this conversation",
        });
      }

      return {
        success: true,
        conversation,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get conversation",
        cause: error,
      });
    }
  }

  /**
   * Updates a conversation
   * @param id Conversation ID
   * @param data Update data
   * @param userId User ID making the update
   * @returns Updated conversation
   */
  async updateConversation(
    id: string,
    data: z.infer<typeof updateConversationSchema>,
    userId: string
  ) {
    try {
      // Check if conversation exists
      const conversation = await (this.prisma as any).conversation.findUnique({
        where: { id },
        include: {
          participants: true,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if the user is an admin
      const isAdmin = conversation.participants.some(
        (participant: any) => participant.userId === userId && participant.isAdmin
      );

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only conversation admins can update the conversation",
        });
      }

      // Update conversation
      const updatedConversation = await (this.prisma as any).conversation.update({
        where: { id },
        data,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        conversation: updatedConversation,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update conversation",
        cause: error,
      });
    }
  }

  /**
   * Adds a participant to a conversation
   * @param data Participant data
   * @param adminId Admin user ID adding the participant
   * @returns Success status
   */
  async addParticipant(
    data: z.infer<typeof addParticipantSchema>,
    adminId: string
  ) {
    try {
      // Check if conversation exists
      const conversation = await (this.prisma as any).conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          participants: true,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if the admin is an admin of the conversation
      const isAdmin = conversation.participants.some(
        (participant: any) => participant.userId === adminId && participant.isAdmin
      );

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only conversation admins can add participants",
        });
      }

      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found",
        });
      }

      // Check if the user is already a participant
      const isParticipant = conversation.participants.some(
        (participant: any) => participant.userId === data.userId && participant.status === SystemStatus.ACTIVE
      );

      if (isParticipant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a participant",
        });
      }

      // Check if the user was previously a participant but left
      const formerParticipant = conversation.participants.find(
        (participant: any) => participant.userId === data.userId && participant.status !== SystemStatus.ACTIVE
      );

      if (formerParticipant) {
        // Reactivate the participant
        await (this.prisma as any).conversationParticipant.update({
          where: { id: formerParticipant.id },
          data: {
            status: SystemStatus.ACTIVE,
            leftAt: null,
            isAdmin: data.isAdmin,
          },
        });
      } else {
        // Add the participant
        await (this.prisma as any).conversationParticipant.create({
          data: {
            conversationId: data.conversationId,
            userId: data.userId,
            isAdmin: data.isAdmin,
          },
        });
      }

      return {
        success: true,
        message: "Participant added successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add participant",
        cause: error,
      });
    }
  }

  /**
   * Removes a participant from a conversation
   * @param conversationId Conversation ID
   * @param userId User ID to remove
   * @param adminId Admin user ID removing the participant
   * @returns Success status
   */
  async removeParticipant(
    conversationId: string,
    userId: string,
    adminId: string
  ) {
    try {
      // Check if conversation exists
      const conversation = await (this.prisma as any).conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: true,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if the admin is an admin of the conversation or if the user is removing themselves
      const isAdmin = conversation.participants.some(
        (participant: any) => participant.userId === adminId && participant.isAdmin
      );
      const isSelfRemoval = userId === adminId;

      if (!isAdmin && !isSelfRemoval) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only conversation admins can remove participants",
        });
      }

      // Check if the user is a participant
      const participant = conversation.participants.find(
        (p: any) => p.userId === userId && p.status === SystemStatus.ACTIVE
      );

      if (!participant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not a participant",
        });
      }

      // Remove the participant (soft delete)
      await (this.prisma as any).conversationParticipant.update({
        where: { id: participant.id },
        data: {
          status: SystemStatus.DELETED,
          leftAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Participant removed successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove participant",
        cause: error,
      });
    }
  }

  /**
   * Creates a new message
   * @param data Message data
   * @param senderId Sender user ID
   * @returns Created message
   */
  async createMessage(
    data: z.infer<typeof createMessageSchema>,
    senderId: string
  ) {
    try {
      // Check if conversation exists
      const conversation = await (this.prisma as any).conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          participants: {
            where: {
              status: SystemStatus.ACTIVE,
            },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if the sender is a participant
      const isParticipant = conversation.participants.some(
        (participant: any) => participant.userId === senderId
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this conversation",
        });
      }

      // Create message
      const message = await (this.prisma as any).message.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          content: data.content,
          attachments: data.attachments || [],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return {
        success: true,
        message,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create message",
        cause: error,
      });
    }
  }

  /**
   * Updates a message
   * @param id Message ID
   * @param data Update data
   * @param userId User ID making the update
   * @returns Updated message
   */
  async updateMessage(
    id: string,
    data: z.infer<typeof updateMessageSchema>,
    userId: string
  ) {
    try {
      // Check if message exists
      const message = await (this.prisma as any).message.findUnique({
        where: { id },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Check if the user is the sender
      if (message.senderId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the sender can update the message",
        });
      }

      // Update message
      const updatedMessage = await (this.prisma as any).message.update({
        where: { id },
        data: {
          content: data.content,
          editedAt: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return {
        success: true,
        message: updatedMessage,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update message",
        cause: error,
      });
    }
  }

  /**
   * Deletes a message (soft delete)
   * @param id Message ID
   * @param userId User ID making the deletion
   * @returns Success status
   */
  async deleteMessage(id: string, userId: string) {
    try {
      // Check if message exists
      const message = await (this.prisma as any).message.findUnique({
        where: { id },
        include: {
          conversation: {
            include: {
              participants: {
                where: {
                  userId,
                  isAdmin: true,
                  status: SystemStatus.ACTIVE,
                },
              },
            },
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Check if the user is the sender or an admin
      const isSender = message.senderId === userId;
      const isAdmin = message.conversation.participants.length > 0;

      if (!isSender && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the sender or conversation admins can delete the message",
        });
      }

      // Delete message (soft delete)
      await (this.prisma as any).message.update({
        where: { id },
        data: {
          status: MessageStatus.DELETED as unknown as Prisma.JsonValue,
        },
      });

      return {
        success: true,
        message: "Message deleted successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete message",
        cause: error,
      });
    }
  }

  /**
   * Gets messages for a conversation
   * @param conversationId Conversation ID
   * @param userId User ID requesting the messages
   * @param limit Number of messages to retrieve
   * @param before Message ID to retrieve messages before
   * @returns Messages
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit = 20,
    before?: string
  ) {
    try {
      // Check if conversation exists
      const conversation = await (this.prisma as any).conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            where: {
              userId,
              status: SystemStatus.ACTIVE,
            },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if the user is a participant
      if (conversation.participants.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this conversation",
        });
      }

      // Get messages
      const whereClause: any = {
        conversationId,
        status: {
          not: MessageStatus.DELETED as unknown as Prisma.JsonValue,
        },
      };

      if (before) {
        const beforeMessage = await (this.prisma as any).message.findUnique({
          where: { id: before },
        });

        if (beforeMessage) {
          whereClause.sentAt = {
            lt: beforeMessage.sentAt,
          };
        }
      }

      const messages = await (this.prisma as any).message.findMany({
        where: whereClause,
        orderBy: {
          sentAt: "desc",
        },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return {
        success: true,
        messages,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get messages",
        cause: error,
      });
    }
  }

  /**
   * Gets conversations for a user
   * @param userId User ID
   * @returns Conversations
   */
  async getUserConversations(userId: string) {
    try {
      const conversations = await (this.prisma as any).conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
              status: SystemStatus.ACTIVE,
            },
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          participants: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              sentAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return {
        success: true,
        conversations,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user conversations",
        cause: error,
      });
    }
  }

  /**
   * Marks messages as read
   * @param conversationId Conversation ID
   * @param userId User ID
   * @param messageId Last read message ID
   * @returns Success status
   */
  async markAsRead(conversationId: string, userId: string, messageId: string) {
    try {
      // Check if conversation exists
      const conversation = await (this.prisma as any).conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            where: {
              userId,
              status: SystemStatus.ACTIVE,
            },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if the user is a participant
      if (conversation.participants.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this conversation",
        });
      }

      // Check if message exists
      const message = await (this.prisma as any).message.findUnique({
        where: { id: messageId },
      });

      if (!message || message.conversationId !== conversationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid message ID",
        });
      }

      // Update participant's last read message
      await (this.prisma as any).conversationParticipant.update({
        where: {
          id: conversation.participants[0].id,
        },
        data: {
          lastReadMessageId: messageId,
        },
      });

      return {
        success: true,
        message: "Messages marked as read",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark messages as read",
        cause: error,
      });
    }
  }
} 