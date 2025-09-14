import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Paperclip, Camera, Smile, Send, ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChatMessage as ChatMessageType } from "@shared/schema";
import { Link } from "wouter";

export default function Chat() {
  const { user } = useAuth();
  const { socket, isConnected, sendMessage } = useWebSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatRoom } = useQuery({
    queryKey: ["/api/chat/room"],
    enabled: !!user,
  });

  const { data: initialMessages = [] } = useQuery({
    queryKey: ["/api/chat/messages"],
    enabled: !!user && !!chatRoom,
  });

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages.reverse()); // API returns newest first, we want oldest first
    }
  }, [initialMessages]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "new_message") {
          setMessages(prev => [...prev, data.message]);
        }
        
        if (data.type === "partner_status") {
          setPartnerOnline(data.isOnline);
        }
      };

      socket.addEventListener("message", handleMessage);
      
      return () => {
        socket.removeEventListener("message", handleMessage);
      };
    }
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !isConnected) return;

    // Check for animated words
    const animatedWords = ["люблю", "love"];
    const hasAnimatedWord = animatedWords.some(word => 
      message.toLowerCase().includes(word.toLowerCase())
    );

    sendMessage({
      type: "chat_message",
      content: message,
      messageType: "text",
      isEphemeral: false,
    });

    setMessage("");
  };

  const handleFileUpload = () => {
    // TODO: Implement file upload
    console.log("File upload");
  };

  const handleEphemeralPhoto = () => {
    // TODO: Implement ephemeral photo capture
    console.log("Ephemeral photo");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)]">
          <Card className="glass-strong h-full rounded-none border-0 flex flex-col">
            {/* Chat Header */}
            <CardHeader className="p-4 border-b border-border flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="p-2" data-testid="button-back-dashboard">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>
                  {partnerOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 online-indicator rounded-full border-2 border-background animate-pulse-soft"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold" data-testid="text-partner-name">Партнер</h3>
                  <p className="text-xs text-muted-foreground" data-testid="text-partner-status">
                    {partnerOnline ? "в сети" : "не в сети"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>Зашифровано</span>
              </div>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-lg font-semibold mb-2">Начните разговор</h3>
                    <p className="text-muted-foreground text-sm">
                      Отправьте первое сообщение, чтобы начать общение
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    partnerAvatar=""
                    partnerUsername="Партнер"
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Chat Input */}
            <div className="p-4 border-t border-border">
              {!isConnected && (
                <div className="mb-3 p-2 bg-destructive/20 text-destructive text-sm rounded-lg text-center">
                  Соединение потеряно. Попытка переподключения...
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-2 glass-morphism rounded-lg hover:bg-accent/20 transition-colors"
                  onClick={handleFileUpload}
                  data-testid="button-attach-file"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-2 glass-morphism rounded-lg hover:bg-accent/20 transition-colors"
                  onClick={handleEphemeralPhoto}
                  data-testid="button-ephemeral-photo"
                >
                  <Camera className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="pr-10 glass-morphism border-0 focus:ring-2 focus:ring-primary outline-none transition-all"
                    disabled={!isConnected}
                    data-testid="input-message"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent/20 rounded transition-colors"
                    data-testid="button-emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  disabled={!message.trim() || !isConnected}
                  className="btn-primary p-3 rounded-xl transition-all duration-300 hover:scale-105"
                  data-testid="button-send-message"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              
              <div className="mt-2 text-xs text-muted-foreground text-center">
                Нажмите Enter для отправки • Сообщения защищены сквозным шифрованием
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
