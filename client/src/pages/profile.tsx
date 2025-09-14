import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Gift, User, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wishlist } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    status: user?.status || "",
  });

  const { data: wishlist = [], isLoading: wishlistLoading } = useQuery<Wishlist[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      toast({
        title: "Профиль обновлен",
        description: "Изменения успешно сохранены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    },
  });

  const addWishlistItemMutation = useMutation({
    mutationFn: async (data: Partial<Wishlist>) => {
      const response = await apiRequest("POST", "/api/wishlist", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Подарок добавлен",
        description: "Новый элемент добавлен в список желаний",
      });
    },
  });

  const deleteWishlistItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/wishlist/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Подарок удален",
        description: "Элемент удален из списка желаний",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleAddWishlistItem = () => {
    const name = prompt("Название подарка:");
    if (!name) return;

    const description = prompt("Описание (необязательно):") || "";
    const link = prompt("Ссылка (необязательно):") || "";

    addWishlistItemMutation.mutate({
      name,
      description,
      link: link || undefined,
      priority: 0,
    });
  };

  const handleDeleteWishlistItem = (id: string) => {
    if (confirm("Удалить этот элемент из списка желаний?")) {
      deleteWishlistItemMutation.mutate(id);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <Card className="glass-morphism border-border mb-8">
            <CardHeader>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.avatar || undefined} alt={user.username} />
                  <AvatarFallback className="text-2xl">
                    {user.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold" data-testid="text-profile-username">
                      {user.username}
                    </h1>
                    <Badge 
                      variant={user.role === "main_admin" ? "default" : "secondary"}
                      className={user.role === "main_admin" ? "tab-active" : ""}
                      data-testid="badge-user-role"
                    >
                      {user.role === "main_admin" ? "Главный администратор" : 
                       user.role === "co_admin" ? "Администратор" : "Гость"}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-4" data-testid="text-user-email">
                    {user.email}
                  </p>
                  
                  {user.status && (
                    <p className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full inline-block" data-testid="text-user-status">
                      {user.status}
                    </p>
                  )}
                </div>
                
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="glass-morphism border-border"
                  data-testid="button-edit-profile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? "Отмена" : "Редактировать"}
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="glass-strong p-1 rounded-xl mb-6 w-full">
              <TabsTrigger 
                value="settings" 
                className="flex-1 data-[state=active]:tab-active"
                data-testid="tab-settings"
              >
                <User className="w-4 h-4 mr-2" />
                Настройки профиля
              </TabsTrigger>
              <TabsTrigger 
                value="wishlist"
                className="flex-1 data-[state=active]:tab-active"
                data-testid="tab-wishlist"
              >
                <Gift className="w-4 h-4 mr-2" />
                Список желаний
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="settings">
              <Card className="glass-morphism border-border">
                <CardHeader>
                  <CardTitle>Настройки профиля</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="username" className="text-sm font-medium">
                          Никнейм
                        </Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary mt-2"
                          data-testid="input-edit-username"
                        />
                      </div>

                      <div>
                        <Label htmlFor="status" className="text-sm font-medium">
                          Статус
                        </Label>
                        <Input
                          id="status"
                          value={profileData.status}
                          onChange={(e) => setProfileData({ ...profileData, status: e.target.value })}
                          placeholder="Ваш статус..."
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary mt-2"
                          data-testid="input-edit-status"
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                          className="btn-primary"
                          data-testid="button-save-profile"
                        >
                          {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить"}
                        </Button>
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          className="glass-morphism border-border"
                          data-testid="button-cancel-edit"
                        >
                          Отмена
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Роль в аккаунте</h3>
                        <p className="text-lg">
                          {user.role === "main_admin" ? "Главный администратор" : 
                           user.role === "co_admin" ? "Администратор" : "Гость"}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Дата регистрации</h3>
                        <p className="text-lg">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ru-RU") : "Неизвестно"}
                        </p>
                      </div>

                      {user.lastSeen && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Последняя активность</h3>
                          <p className="text-lg">
                            {new Date(user.lastSeen).toLocaleString("ru-RU")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist */}
            <TabsContent value="wishlist">
              <Card className="glass-morphism border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    Список желаний
                  </CardTitle>
                  <Button
                    onClick={handleAddWishlistItem}
                    className="btn-primary"
                    data-testid="button-add-wishlist-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить подарок
                  </Button>
                </CardHeader>
                <CardContent>
                  {wishlistLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Список желаний пуст</h3>
                      <p className="text-muted-foreground mb-4">
                        Добавьте подарки, которые вы хотели бы получить
                      </p>
                      <Button
                        onClick={handleAddWishlistItem}
                        className="btn-primary"
                        data-testid="button-add-first-wishlist-item"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить первый подарок
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {wishlist.map((item: Wishlist) => (
                        <div
                          key={item.id}
                          className="glass-strong p-4 rounded-xl flex items-start justify-between"
                          data-testid={`wishlist-item-${item.id}`}
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1" data-testid="text-wishlist-name">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-2" data-testid="text-wishlist-description">
                                {item.description}
                              </p>
                            )}
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                                data-testid="link-wishlist-item"
                              >
                                Посмотреть →
                              </a>
                            )}
                          </div>
                          <Button
                            onClick={() => handleDeleteWishlistItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/20"
                            data-testid="button-delete-wishlist-item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
