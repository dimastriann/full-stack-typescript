import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationType } from '../../prisma/generated/client';
import { getLinkPreview } from 'link-preview-js';
import { Logger } from '@nestjs/common';

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

  async saveMessage(conversationId: number, senderId: number, content: string) {
    let linkPreviewData: any = null;

    // Very basic URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(urlRegex);

    if (matches && matches.length > 0) {
      try {
        const preview: any = await getLinkPreview(matches[0], {
          followRedirects: 'follow',
        });

        if (preview && preview.title) {
          linkPreviewData = {
            url: preview.url,
            title: preview.title,
            description: preview.description || '',
            image: preview.images?.[0] || preview.favicons?.[0] || '',
            siteName: preview.siteName || '',
            favicons: preview.favicons?.[0] || '',
          };
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch link preview for ${matches[0]}: ${error.message}`,
        );
      }
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        conversationId,
        linkPreview: linkPreviewData as any,
      },
      include: {
        sender: true,
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
}
