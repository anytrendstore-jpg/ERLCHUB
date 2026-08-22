export interface ChatConversation {
  id: string;
  isGroup: boolean;
  participants: string[];
  deletedFor: string[];
  pinnedBy: string[];
  archivedBy: string[];
  mutedBy: string[];
  name?: string;
  avatar?: string;
  createdBy?: string;
  lastMessage?: { text: string; senderId: string; createdAt: Date };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar?: string;
  text: string;
  readBy: string[];
  deletedFor: string[];
  deletedForEveryone: boolean;
  editedAt?: Date;
  reactions: Record<string, string[]>;
  replyTo?: { messageId: string; senderDisplayName: string; text: string };
  createdAt: Date;
}

export interface ChatPresence {
  discordId: string;
  lastSeen: Date;
  typingIn?: string;
  typingUntil?: Date;
}

export interface ChatPhoneNumber {
  discordId: string;
  phoneNumber: string;
  createdAt: Date;
}
