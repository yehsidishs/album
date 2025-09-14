import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage as ChatMessageType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  partnerAvatar?: string;
  partnerUsername?: string;
}

export function ChatMessage({ message, partnerAvatar, partnerUsername }: ChatMessageProps) {
  const { user } = useAuth();
  const isOwnMessage = message.authorId === user?.id;

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("ru-RU", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const renderMessageContent = () => {
    if (message.isEphemeral && message.expiresAt && new Date() > new Date(message.expiresAt)) {
      return (
        <div className="text-xs text-muted-foreground italic">
          {message.type === "ephemeral_video" ? "Видеосообщение" : "Фото"} (истекло)
        </div>
      );
    }

    switch (message.type) {
      case "text":
        return <p className="text-sm">{message.content}</p>;
      
      case "ephemeral_photo":
        const attachments = message.attachments as any;
        const timeLeft = message.expiresAt 
          ? Math.max(0, Math.floor((new Date(message.expiresAt).getTime() - Date.now()) / 1000))
          : 0;
        
        return (
          <div className="relative message-ephemeral">
            <img 
              src={attachments?.url} 
              alt="Ephemeral photo" 
              className="w-full rounded-lg max-w-48"
            />
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              🔥 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Фото исчезнет через {Math.floor(timeLeft / 60)} мин {timeLeft % 60} сек
            </p>
          </div>
        );
      
      case "ephemeral_video":
        const videoAttachments = message.attachments as any;
        const videoTimeLeft = message.expiresAt 
          ? Math.max(0, Math.floor((new Date(message.expiresAt).getTime() - Date.now()) / 1000))
          : 0;
        
        return (
          <div className="relative message-ephemeral">
            <video 
              src={videoAttachments?.url} 
              controls
              className="w-full rounded-lg max-w-48"
            />
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              🔥 {Math.floor(videoTimeLeft / 60)}:{(videoTimeLeft % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Видео исчезнет через {Math.floor(videoTimeLeft / 60)} мин {videoTimeLeft % 60} сек
            </p>
          </div>
        );
      
      case "photo":
        const photoAttachments = message.attachments as any;
        return (
          <img 
            src={photoAttachments?.url} 
            alt="Photo message" 
            className="w-full rounded-lg max-w-48"
          />
        );
      
      case "video":
        const videoAttachment = message.attachments as any;
        return (
          <video 
            src={videoAttachment?.url} 
            controls
            className="w-full rounded-lg max-w-48"
          />
        );
      
      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  // Check for animated words
  const checkForAnimatedWords = (content: string) => {
    const animatedWords = ["люблю", "love"];
    let processedContent = content;
    
    animatedWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processedContent = processedContent.replace(regex, `<span class="animate-pulse-soft">${word}</span>`);
    });
    
    return processedContent !== content;
  };

  const hasAnimatedWords = message.content && checkForAnimatedWords(message.content);

  return (
    <div className={cn(
      "flex items-end gap-2",
      isOwnMessage ? "justify-end" : ""
    )} data-testid={`chat-message-${message.id}`}>
      {!isOwnMessage && (
        <Avatar className="w-6 h-6">
          <AvatarImage src={partnerAvatar} alt={partnerUsername} />
          <AvatarFallback>
            {partnerUsername?.charAt(0).toUpperCase() || "P"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "p-3 rounded-2xl max-w-xs",
        isOwnMessage 
          ? "bg-primary text-white rounded-br-md" 
          : "glass-morphism rounded-bl-md",
        hasAnimatedWords && "animate-pulse-soft"
      )}>
        <div className="mb-1">
          {renderMessageContent()}
        </div>
        <p className={cn(
          "text-xs mt-1",
          isOwnMessage ? "text-white/70" : "text-muted-foreground"
        )} data-testid="text-message-time">
          {formatTime(message.createdAt!)}
        </p>
      </div>
      
      {isOwnMessage && (
        <Avatar className="w-6 h-6">
          <AvatarImage src={user?.avatar} alt={user?.username} />
          <AvatarFallback>
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
