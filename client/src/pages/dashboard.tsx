import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Sidebar } from "@/components/sidebar";
import { MemoryCard } from "@/components/memory-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Grid, List, Plus, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Memory, Counter } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: memories = [], isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories"],
    enabled: !!user,
  });

  const { data: counters = [] } = useQuery<Counter[]>({
    queryKey: ["/api/counters"],
    enabled: !!user,
  });

  const { data: chatRoom } = useQuery({
    queryKey: ["/api/chat/room"],
    enabled: !!user,
  });

  const createMemoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/memories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({
        title: "Воспоминание создано",
        description: "Ваше воспоминание успешно добавлено",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать воспоминание",
        variant: "destructive",
      });
    },
  });

  const filteredMemories = memories.filter((memory: Memory) => {
    if (activeFilter === "all") return true;
    return memory.type === activeFilter;
  });

  const sortedMemories = [...filteredMemories].sort((a: Memory, b: Memory) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    }
    return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
  });

  const handleCreateMemory = () => {
    // TODO: Open create memory modal
    toast({
      title: "Функция в разработке",
      description: "Создание воспоминаний будет доступно в следующем обновлении",
    });
  };

  const handleComment = (memoryId: string) => {
    // TODO: Open comment modal or expand comments
    console.log("Comment on memory:", memoryId);
  };

  const handleLike = (memoryId: string) => {
    // TODO: Implement like functionality
    console.log("Like memory:", memoryId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          {/* Welcome Header */}
          <div className="glass-morphism p-6 rounded-3xl mb-8 animate-glass-morph">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Добро пожаловать обратно, <span className="text-primary">{user?.username}</span>! 👋
                </h1>
                <p className="text-muted-foreground">Сегодня прекрасный день для создания новых воспоминаний</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'online-indicator' : 'bg-red-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Подключено' : 'Отключено'}
                </span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary" data-testid="stat-total-memories">{memories.length}</p>
                <p className="text-sm text-muted-foreground">Воспоминаний</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent" data-testid="stat-month-memories">
                  {memories.filter((m: Memory) => {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(m.createdAt!) > monthAgo;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">В этом месяце</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary" data-testid="stat-counters">{counters.length}</p>
                <p className="text-sm text-muted-foreground">Счетчиков</p>
              </div>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={activeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className={activeFilter === "all" ? "tab-active" : "glass-morphism border-border"}
                  onClick={() => setActiveFilter("all")}
                  data-testid="filter-all"
                >
                  Все
                </Button>
                <Button
                  variant={activeFilter === "photo" ? "default" : "outline"}
                  size="sm"
                  className={activeFilter === "photo" ? "tab-active" : "glass-morphism border-border"}
                  onClick={() => setActiveFilter("photo")}
                  data-testid="filter-photo"
                >
                  Фото
                </Button>
                <Button
                  variant={activeFilter === "video" ? "default" : "outline"}
                  size="sm"
                  className={activeFilter === "video" ? "tab-active" : "glass-morphism border-border"}
                  onClick={() => setActiveFilter("video")}
                  data-testid="filter-video"
                >
                  Видео
                </Button>
                <Button
                  variant={activeFilter === "quote" ? "default" : "outline"}
                  size="sm"
                  className={activeFilter === "quote" ? "tab-active" : "glass-morphism border-border"}
                  onClick={() => setActiveFilter("quote")}
                  data-testid="filter-quote"
                >
                  Цитаты
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                className="glass-morphism px-3 py-2 rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary bg-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                data-testid="select-sort"
              >
                <option value="newest" className="bg-background">Сначала новые</option>
                <option value="oldest" className="bg-background">Сначала старые</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                className="p-2 glass-morphism border-border"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                data-testid="button-view-toggle"
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Action - Recent Chat Message */}
          {chatRoom && (
            <Card className="glass-morphism border-border mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 online-indicator rounded-full border border-background"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Последнее сообщение</p>
                    <p className="text-xs text-muted-foreground">Недавно</p>
                  </div>
                </div>
                <div className="glass-strong p-3 rounded-lg mb-3">
                  <p className="text-sm">Ждем новых сообщений...</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/chat" className="flex-1">
                    <Button className="w-full btn-primary py-2 rounded-lg text-sm font-medium transition-all duration-300" data-testid="button-open-chat">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Открыть чат
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Memories Grid/List */}
          {memoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedMemories.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-morphism p-8 rounded-3xl">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-xl font-semibold mb-2">Пока нет воспоминаний</h3>
                <p className="text-muted-foreground mb-4">
                  Создайте первое воспоминание и начните собирать моменты вашей истории
                </p>
                <Button 
                  onClick={handleCreateMemory}
                  className="btn-primary"
                  data-testid="button-create-first-memory"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать воспоминание
                </Button>
              </div>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "memory-grid" : "space-y-6"}>
              {sortedMemories.map((memory: Memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onComment={handleComment}
                  onLike={handleLike}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {sortedMemories.length > 0 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline"
                className="glass-morphism px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 border-border"
                data-testid="button-load-more"
              >
                Загрузить еще воспоминания
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
