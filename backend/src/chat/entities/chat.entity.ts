import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import {
  ConversationType,
  MessageType,
} from '../../../prisma/generated/client';
import { Attachment } from 'src/attachment/entities/attachment.entity';

registerEnumType(ConversationType, {
  name: 'ConversationType',
});

registerEnumType(MessageType, {
  name: 'MessageType',
});

@ObjectType()
export class LinkPreview {
  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  siteName?: string;

  @Field({ nullable: true })
  favicons?: string;
}

@ObjectType()
export class Message {
  @Field(() => Int)
  id: number;

  @Field()
  content: string;

  @Field(() => LinkPreview, { nullable: true })
  linkPreview?: any;

  @Field(() => Int)
  senderId: number;

  @Field(() => User)
  sender: User;

  @Field(() => Int)
  conversationId: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Boolean)
  isEdited: boolean;

  @Field(() => MessageType)
  type: MessageType;

  @Field({ nullable: true })
  fileUrl?: string;

  @Field({ nullable: true })
  fileName?: string;

  @Field(() => Int, { nullable: true })
  fileSize?: number;

  @Field({ nullable: true })
  mimeType?: string;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field(() => [Attachment], { nullable: true })
  attachments?: Attachment[];
}

@ObjectType()
export class ConversationParticipant {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => User)
  user: User;

  @Field(() => Int)
  conversationId: number;

  @Field()
  joinedAt: Date;

  @Field()
  lastReadAt: Date;
}

@ObjectType()
export class Conversation {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  name?: string;

  @Field(() => ConversationType)
  type: ConversationType;

  @Field(() => Int, { nullable: true })
  workspaceId?: number;

  @Field(() => [ConversationParticipant])
  participants: ConversationParticipant[];

  @Field(() => [Message])
  messages: Message[];

  @Field(() => Int, { defaultValue: 0 })
  unreadCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
