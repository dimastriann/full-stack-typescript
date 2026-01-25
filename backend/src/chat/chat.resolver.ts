import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import {
  Conversation,
  Message,
  ConversationParticipant,
} from './entities/chat.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { ConversationType } from '../../prisma/generated/client';

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Query(() => [Conversation])
  @UseGuards(GqlAuthGuard)
  async myConversations(@Context() context: any) {
    return this.chatService.getUserConversations(context.req.user.id);
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
    @Context() context: any,
  ) {
    return this.chatService.findOrCreateDirectConversation(
      context.req.user.id,
      otherUserId,
    );
  }

  @Mutation(() => Conversation)
  @UseGuards(GqlAuthGuard)
  async createChannel(
    @Args('name') name: string,
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('userIds', { type: () => [Int] }) userIds: number[],
    @Context() context: any,
  ) {
    // Ensure the creator is included
    const allUserIds = Array.from(new Set([...userIds, context.req.user.id]));
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
}
