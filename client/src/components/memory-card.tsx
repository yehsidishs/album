import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Play } from "lucide-react";
import { Memory } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface MemoryCardProps {
  memory: Memory;
  onComment?: (memoryId: string) => void;
  onLike?: (memoryId: string) => void;
}

export function MemoryCard({ memory, onComment, onLike }: MemoryCardProps) {
  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { locale: ru, addSuffix: true });
  };

  const renderContent = () => {
    const content = memory.content as any;
    
    switch (memory.type) {
      case "photo":
        return (
          <img 
            src={content.url} 
            alt="Memory photo" 
            className="w-full h-48 object-cover rounded-t-2xl"
          />
        );
      
      case "video":
        return (
          <div className="relative">
            <img 
              src={content.thumbnail || content.url} 
              alt="Video thumbnail" 
              className="w-full h-48 object-cover rounded-t-2xl"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Button 
                size="lg"
                className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                data-testid="button-play-video"
              >
                <Play className="w-6 h-6 text-gray-800 ml-0.5 fill-current" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {content.duration || "0:00"}
            </div>
          </div>
        );
      
      case "quote":
        return (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">{content.emoji || "💕"}</div>
            <blockquote className="text-lg font-medium mb-4">
              "{content.text}"
            </blockquote>
          </div>
        );
      
      case "multi":
        const images = content.images || [];
        if (images.length === 1) {
          return <img src={images[0].url} alt="Memory" className="w-full h-48 object-cover rounded-t-2xl" />;
        }
        
        return (
          <div className="grid grid-cols-2 gap-0.5 rounded-t-2xl overflow-hidden">
            {images.slice(0, 3).map((img: any, idx: number) => (
              <img key={idx} src={img.url} alt={`Memory ${idx + 1}`} className="w-full h-24 object-cover" />
            ))}
            {images.length > 3 && (
              <div className="w-full h-24 bg-black/60 flex items-center justify-center text-white text-lg font-bold">
                +{images.length - 3}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <article className="story-card glass-morphism rounded-2xl overflow-hidden" data-testid={`memory-card-${memory.id}`}>
      {renderContent()}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback>
                {/* TODO: Get author data */}
                U
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium" data-testid="text-author">
              {/* TODO: Get author username */}
              Автор
            </span>
          </div>
          <span className="text-xs text-muted-foreground" data-testid="text-date">
            {formatDate(memory.createdAt!)}
          </span>
        </div>
        
        {memory.description && (
          <p className="text-sm mb-3" data-testid="text-description">
            {memory.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {memory.hashtags?.map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full"
                data-testid={`badge-hashtag-${idx}`}
              >
                #{tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-accent/20 rounded transition-colors"
              onClick={() => onLike?.(memory.id)}
              data-testid="button-like"
            >
              <Heart className="w-4 h-4 text-red-400 fill-current" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-accent/20 rounded transition-colors"
              onClick={() => onComment?.(memory.id)}
              data-testid="button-comment"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
