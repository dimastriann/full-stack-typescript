import { Resolver, Query, Mutation, Subscription, Args, Int, Context } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import {
  Conversation,
  Message,
  ConversationParticipant,
} from './entities/chat.entity';
import { UseGuards, Inject } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { ConversationType, MessageType } from '../../prisma/generated/client';
import { GqlContext } from '../auth/types/context.type';
import { PubSub } from 'graphql-subscriptions';

@Resolver()
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    @Inject('PUB_SUB') private readonly pubSub: any,
  ) {}

  @Query(() => [Conversation])
  @UseGuards(GqlAuthGuard)
  async myConversations(@Context() context: GqlContext) {
    return this.chatService.getUserConversations(context.req.user!.id);
  }

  @Query(() => [Message])
  @UseGuards(GqlAuthGuard)
  async conversationMessages(
    @Args('conversationId', { type: () => Int }) conversationId: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('cursor', { type: () => Int, nullable: true }) cursor?: number,
  ) {
    return this.chatService.getMessages(conversationId, limit, cursor);
  }

  @Mutation(() => Conversation)
  @UseGuards(GqlAuthGuard)
  async createDirectConversation(
    @Args('otherUserId', { type: () => Int }) otherUserId: number,
    @Context() context: GqlContext,
  ) {
    return this.chatService.findOrCreateDirectConversation(
      context.req.user!.id,
      otherUserId,
    );
  }

  @Mutation(() => Conversation)
  @UseGuards(GqlAuthGuard)
  async createChannel(
    @Args('name') name: string,
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('userIds', { type: () => [Int] }) userIds: number[],
    @Context() context: GqlContext,
  ) {
    // Ensure the creator is included
    const allUserIds = Array.from(new Set([...userIds, context.req.user!.id]));
    return this.chatService.createConversation(
      allUserIds,
      ConversationType.CHANNEL,
      name,
      workspaceId,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteConversation(@Args('id', { type: () => Int }) id: number) {
    await this.chatService.deleteConversation(id);
    return true;
  }

  @Mutation(() => ConversationParticipant)
  @UseGuards(GqlAuthGuard)
  async addParticipant(
    @Args('conversationId', { type: () => Int }) conversationId: number,
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    return this.chatService.addParticipant(conversationId, userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async removeParticipant(
    @Args('conversationId', { type: () => Int }) conversationId: number,
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    await this.chatService.removeParticipant(conversationId, userId);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async markAsRead(
    @Args('conversationId', { type: () => Int }) conversationId: number,
    @Context() context: GqlContext,
  ) {
    await this.chatService.markAsRead(conversationId, context.req.user!.id);
    return true;
  }

  @Mutation(() => Message)
  @UseGuards(GqlAuthGuard)
  async sendMessage(
    @Args('conversationId', { type: () => Int }) conversationId: number,
    @Args('content') content: string,
    @Args('type', { type: () => MessageType, nullable: true, defaultValue: MessageType.TEXT }) type?: MessageType,
    @Args('attachmentIds', { type: () => [Int], nullable: true }) attachmentIds?: number[],
    @Args('metadata', { type: () => String, nullable: true }) metadata?: string,
    @Context() context?: GqlContext,
  ) {
    const senderId = context!.req.user!.id;
    const message = await this.chatService.saveMessage(
      conversationId,
      senderId,
      content,
      type,
      undefined,
      metadata,
      attachmentIds,
    );

    // Publish to subscribers
    await this.pubSub.publish('messageSent', { messageSent: message });
    return message;
  }

  @Mutation(() => Message)
  @UseGuards(GqlAuthGuard)
  async updateMessage(
    @Args('id', { type: () => Int }) id: number,
    @Args('content') content: string,
    @Context() context: GqlContext,
  ) {
    const message = await this.chatService.updateMessage(id, context.req.user!.id, content);
    
    // Publish to subscribers
    await this.pubSub.publish('messageUpdated', { messageUpdated: message });
    return message;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteMessage(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: GqlContext,
  ) {
    const senderId = context.req.user!.id;
    const message = await this.chatService.deleteMessage(id, senderId);
    
    // Publish to subscribers
    await this.pubSub.publish('messageDeleted', { 
      messageDeleted: { id, conversationId: message.conversationId } 
    });
    return true;
  }

  // ==========================================
  // GraphQL Subscriptions
  // ==========================================

  @Subscription(() => Message, {
    filter: (payload, variables) => {
      console.log('Subscription Filter payload:', payload, 'variables:', variables);
      const isMatch = payload.messageSent.conversationId === variables.conversationId;
      console.log('Subscription Filter isMatch:', isMatch);
      return isMatch;
    },
  })
  messageSent(
    @Args('conversationId', { type: () => Int }) conversationId: number,
  ) {
    return this.pubSub.asyncIterableIterator('messageSent');
  }

  @Subscription(() => Message, {
    filter: (payload, variables) => {
      const isMatch = payload.messageUpdated.conversationId === variables.conversationId;
      return isMatch;
    },
  })
  messageUpdated(
    @Args('conversationId', { type: () => Int }) conversationId: number,
  ) {
    return this.pubSub.asyncIterableIterator('messageUpdated');
  }

  @Subscription(() => Int, {
    filter: (payload, variables) => {
      const isMatch = payload.messageDeleted.conversationId === variables.conversationId;
      return isMatch;
    },
    resolve: (payload) => payload.messageDeleted.id,
  })
  messageDeleted(
    @Args('conversationId', { type: () => Int }) conversationId: number,
  ) {
    return this.pubSub.asyncIterableIterator('messageDeleted');
  }
}
