import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageType } from '../../prisma/generated/client';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard'; // I'll need to create this

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Authentication logic will be handled by guards or here
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: number,
  ) {
    client.join(`conversation_${conversationId}`);
    return { event: 'joinedConversation', data: conversationId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: number;
      senderId: number;
      content: string;
      type: MessageType;
      fileData?: {
        url: string;
        name: string;
        size?: number;
        mimeType?: string;
      };
      metadata?: any;
      attachmentIds?: number[];
    },
  ) {
    const message = await this.chatService.saveMessage(
      data.conversationId,
      data.senderId,
      data.content,
      data.type,
      data.fileData,
      data.metadata,
      data.attachmentIds,
    );

    this.logger.log(`Message sent: ${message.id}`);
    this.logger.log(`Message data: ${JSON.stringify(data)}`);

    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: number; userId: number },
  ) {
    await this.chatService.markAsRead(data.conversationId, data.userId);

    // Notify other participants (optional, useful for read receipts)
    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('readStatusUpdated', {
        conversationId: data.conversationId,
        userId: data.userId,
      });
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      id: number;
      conversationId: number;
      senderId: number;
      content: string;
    },
  ) {
    const message = await this.chatService.updateMessage(
      data.id,
      data.senderId,
      data.content,
    );

    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('messageUpdated', message);

    return message;
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { id: number; conversationId: number; senderId: number },
  ) {
    await this.chatService.deleteMessage(data.id, data.senderId);

    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('messageDeleted', {
        id: data.id,
        conversationId: data.conversationId,
      });

    return { id: data.id };
  }
}
