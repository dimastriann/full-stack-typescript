import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConversationType,
  MessageType,
  Prisma,
} from '../../prisma/generated/client';
import { getLinkPreview } from 'link-preview-js';
import { Logger } from '@nestjs/common';
import { sanitizeString } from '../common/decorators/sanitized-string.decorator';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(private prisma: PrismaService) {}

  async createConversation(
    userIds: number[],
    type: ConversationType,
    name?: string,
    workspaceId?: number,
  ) {
    return this.prisma.conversation.create({
      data: {
        type,
        name,
        workspaceId,
        participants: {
          create: userIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findOrCreateDirectConversation(user1Id: number, user2Id: number) {
    // Check if direct conversation already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: user1Id } } },
          { participants: { some: { userId: user2Id } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (existing) return existing;

    return this.createConversation([user1Id, user2Id], 'DIRECT');
  }

  async saveMessage(
    conversationId: number,
    senderId: number,
    rawContent: string,
    type: MessageType = MessageType.TEXT,
    fileData?: {
      url: string;
      name: string;
      size?: number;
      mimeType?: string;
    },
    metadata?: Prisma.InputJsonValue,
    attachmentIds?: number[],
  ) {
    // Sanitize message content (WebSocket messages bypass DTO validation)
    const content = sanitizeString(rawContent);
    let linkPreviewData: Prisma.InputJsonValue | null = null;

    // Link preview only for TEXT messages
    if (type === MessageType.TEXT) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = content.match(urlRegex);

      if (matches && matches.length > 0) {
        try {
          const preview = (await getLinkPreview(matches[0], {
            followRedirects: 'follow',
          })) as {
            url?: string;
            title?: string;
            description?: string;
            images?: string[];
            favicons?: string[];
            siteName?: string;
          };

          if (preview && preview.title) {
            linkPreviewData = {
              url: preview.url || '',
              title: preview.title,
              description: preview.description || '',
              image: preview.images?.[0] || preview.favicons?.[0] || '',
              siteName: preview.siteName || '',
              favicons: preview.favicons?.[0] || '',
            };
          }
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to fetch link preview for ${matches[0]}: ${errMsg}`,
          );
        }
      }
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        conversationId,
        type,
        fileUrl: fileData?.url,
        fileName: fileData?.name,
        fileSize: fileData?.size,
        mimeType: fileData?.mimeType,
        metadata: metadata !== undefined ? metadata : undefined,
        linkPreview: linkPreviewData !== null ? linkPreviewData : undefined,
        attachments: attachmentIds
          ? {
              connect: attachmentIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        sender: true,
        attachments: true,
      },
    });

    // Auto-mark as read for the sender
    await this.markAsRead(conversationId, senderId);

    return message;
  }

  async getMessages(conversationId: number, limit = 50, cursor?: number) {
    return this.prisma.message.findMany({
      where: { conversationId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: true,
        attachments: true,
      },
    });
  }

  async getUserConversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate unread count for each conversation
    return Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const lastReadAt = participant?.lastReadAt || new Date(0);

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: userId },
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      }),
    );
  }

  async markAsRead(conversationId: number, userId: number) {
    return this.prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  async deleteConversation(id: number) {
    return this.prisma.conversation.delete({
      where: { id },
    });
  }

  async addParticipant(conversationId: number, userId: number) {
    return this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
      },
      include: {
        user: true,
      },
    });
  }

  async removeParticipant(conversationId: number, userId: number) {
    return this.prisma.conversationParticipant.delete({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });
  }

  async updateMessage(id: number, senderId: number, rawContent: string) {
    // Sanitize message content (WebSocket messages bypass DTO validation)
    const content = sanitizeString(rawContent);
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message || message.senderId !== senderId) {
      throw new Error('Unauthorized or message not found');
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        content,
        isEdited: true,
      },
      include: {
        sender: true,
      },
    });
  }

  async deleteMessage(id: number, senderId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message || message.senderId !== senderId) {
      throw new Error('Unauthorized or message not found');
    }

    return this.prisma.message.delete({
      where: { id },
    });
  }
}
