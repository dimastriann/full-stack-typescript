export enum ConversationType {
  CHANNEL = 'CHANNEL',
  DIRECT = 'DIRECT',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
  STICKER = 'STICKER',
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Message {
  id: number;
  content: string;
  senderId: number;
  sender: User;
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image: string;
    siteName: string;
    favicons: string;
  };
  conversationId: number;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  metadata?: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: number;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface ConversationParticipant {
  id: number;
  userId: number;
  user: User;
  conversationId: number;
  joinedAt: string;
  lastReadAt: string;
}

export interface Conversation {
  id: number;
  name?: string;
  type: ConversationType;
  workspaceId?: number;
  participants: ConversationParticipant[];
  messages: Message[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}
