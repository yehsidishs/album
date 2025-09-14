export interface ChatMessagePayload {
  type: "chat_message";
  content: string;
  messageType?: "text" | "photo" | "video" | "ephemeral_photo" | "ephemeral_video";
  isEphemeral?: boolean;
  attachments?: any;
}

export interface AuthPayload {
  type: "auth";
  userId: string;
}

export type WebSocketMessage = ChatMessagePayload | AuthPayload;
