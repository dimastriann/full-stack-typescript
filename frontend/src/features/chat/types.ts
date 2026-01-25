export enum ConversationType {
  CHANNEL = 'CHANNEL',
  DIRECT = 'DIRECT',
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
}

export interface ConversationParticipant {
  id: number;
  userId: number;
  user: User;
  conversationId: number;
  joinedAt: string;
}

export interface Conversation {
  id: number;
  name?: string;
  type: ConversationType;
  workspaceId?: number;
  participants: ConversationParticipant[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
