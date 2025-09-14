import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Palette, 
  MessageCircle, 
  Bell, 
  Clock, 
  Gamepad2,
  Key,
  Copy,
  RefreshCw,
  UserPlus,
  Crown
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newInvitationCode, setNewInvitationCode] = useState("");

  const { data: invitationCode, isLoading: codeLoading } = useQuery({
    queryKey: ["/api/account/invitation-code"],
    enabled: !!user && user.role === "main_admin",
  });

  const { data: accountUsers = [] } = useQuery({
    queryKey: ["/api/account/users"],
    enabled: !!user,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/account/generate-invitation", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account/invitation-code"] });
      setNewInvitationCode(data.code);
      toast({
        title: "Новый код создан",
        description: "Код приглашения успешно обновлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать новый код приглашения",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Код приглашения скопирован в буфер обмена",
    });
  };

  const currentCode = newInvitationCode || invitationCode?.code || "";

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Настройки</h1>
            <p className="text-muted-foreground">
              Управление аккаунтом, приглашениями и персонализацией
            </p>
          </div>

          <Tabs defaultValue="access" className="w-full">
            <TabsList className="glass-strong p-1 rounded-xl mb-6 grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger 
                value="access" 
                className="data-[state=active]:tab-active"
                data-testid="tab-access"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Доступ</span>
              </TabsTrigger>
              <TabsTrigger 
                value="appearance"
                className="data-[state=active]:tab-active"
                data-testid="tab-appearance"
              >
                <Palette className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Оформление</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messages"
                className="data-[state=active]:tab-active"
                data-testid="tab-messages"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Сообщения</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="data-[state=active]:tab-active"
                data-testid="tab-notifications"
              >
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Уведомления</span>
              </TabsTrigger>
              <TabsTrigger 
                value="events"
                className="data-[state=active]:tab-active"
                data-testid="tab-events"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">События</span>
              </TabsTrigger>
              <TabsTrigger 
                value="games"
                className="data-[state=active]:tab-active"
                data-testid="tab-games"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Игры</span>
              </TabsTrigger>
            </TabsList>

            {/* Access Management */}
            <TabsContent value="access">
              <div className="space-y-6">
                {user.role === "main_admin" && (
                  <Card className="glass-morphism border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Код приглашения
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Текущий код приглашения</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            value={currentCode}
                            readOnly
                            className="glass-morphism border-0 font-mono text-center"
                            data-testid="input-invitation-code"
                          />
                          <Button
                            onClick={() => copyToClipboard(currentCode)}
                            variant="outline"
                            className="glass-morphism border-border"
                            data-testid="button-copy-code"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => generateCodeMutation.mutate()}
                            disabled={generateCodeMutation.isPending}
                            variant="outline"
                            className="glass-morphism border-border"
                            data-testid="button-generate-code"
                          >
                            <RefreshCw className={`w-4 h-4 ${generateCodeMutation.isPending ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Поделитесь этим кодом с партнером для присоединения к аккаунту
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="glass-morphism border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Участники аккаунта
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {accountUsers.map((accountUser: any) => (
                        <div
                          key={accountUser.id}
                          className="flex items-center justify-between p-4 glass-strong rounded-xl"
                          data-testid={`user-${accountUser.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              {accountUser.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium" data-testid="text-user-username">
                                {accountUser.username}
                              </p>
                              <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                                {accountUser.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={accountUser.role === "main_admin" ? "default" : "secondary"}
                              className={accountUser.role === "main_admin" ? "tab-active" : ""}
                              data-testid="badge-user-role"
                            >
                              {accountUser.role === "main_admin" && <Crown className="w-3 h-3 mr-1" />}
                              {accountUser.role === "main_admin" ? "Главный админ" : 
                               accountUser.role === "co_admin" ? "Администратор" : "Гость"}
                            </Badge>
                            {accountUser.isOnline && (
                              <div className="w-2 h-2 online-indicator rounded-full" data-testid="indicator-online"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance">
              <Card className="glass-morphism border-border">
                <CardHeader>
                  <CardTitle>Настройки оформления</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Тема интерфейса</Label>
                      <p className="text-sm text-muted-foreground">
                        Переключение между светлой и темной темой
                      </p>
                    </div>
                    <Switch
                      checked={theme === "light"}
                      onCheckedChange={toggleTheme}
                      data-testid="switch-theme"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Шрифт интерфейса</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Выберите предпочитаемый шрифт для интерфейса
                    </p>
                    <select 
                      className="glass-morphism px-3 py-2 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary bg-transparent w-full"
                      defaultValue="Inter"
                      data-testid="select-font"
                    >
                      <option value="Inter" className="bg-background">Inter (по умолчанию)</option>
                      <option value="Roboto" className="bg-background">Roboto</option>
                      <option value="Open Sans" className="bg-background">Open Sans</option>
                      <option value="Montserrat" className="bg-background">Montserrat</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Анимации переходов</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Включить плавные анимации при переходах между страницами
                    </p>
                    <Switch defaultChecked data-testid="switch-animations" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages">
              <Card className="glass-morphism border-border">
                <CardHeader>
                  <CardTitle>Настройки сообщений</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Анимации совпадающих слов</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Специальные эффекты для определенных слов в сообщениях
                    </p>
                    <Switch defaultChecked data-testid="switch-word-animations" />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Стоп-слово</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Слово для временной блокировки чата (используйте с префиксом &)
                    </p>
                    <Input
                      placeholder="Введите стоп-слово"
                      className="glass-morphism border-0 focus:ring-2 focus:ring-primary"
                      data-testid="input-stop-word"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Фон чата</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Настройка внешнего вида личного чата
                    </p>
                    <Button 
                      variant="outline"
                      className="glass-morphism border-border"
                      data-testid="button-change-chat-background"
                    >
                      Изменить фон
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card className="glass-morphism border-border">
                <CardHeader>
                  <CardTitle>Уведомления</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email уведомления</Label>
                      <p className="text-sm text-muted-foreground">
                        Получать уведомления на электронную почту
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-email-notifications" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Push уведомления</Label>
                      <p className="text-sm text-muted-foreground">
                        Мгновенные уведомления в браузере
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-push-notifications" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Напоминания о событиях</Label>
                      <p className="text-sm text-muted-foreground">
                        Уведомления о важных датах и счетчиках
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-event-reminders" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events */}
            <TabsContent value="events">
              <Card className="glass-morphism border-border">
                <CardHeader>
                  <CardTitle>События и счетчики</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Отображение счетчиков</Label>
                      <p className="text-sm text-muted-foreground">
                        Показывать счетчики важных дат на главной странице
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-show-counters" />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Интеграция с календарем</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Подключение к календарю устройства для синхронизации событий
                    </p>
                    <Button 
                      variant="outline"
                      className="glass-morphism border-border"
                      data-testid="button-connect-calendar"
                    >
                      Подключить календарь
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Games */}
            <TabsContent value="games">
              <Card className="glass-morphism border-border">
                <CardHeader>
                  <CardTitle>Настройки игр</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Вопросы для "Правда или действие"</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Добавьте свои вопросы и задания для игры
                    </p>
                    <Button 
                      variant="outline"
                      className="glass-morphism border-border"
                      data-testid="button-edit-truth-dare"
                    >
                      Редактировать список
                    </Button>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Настройки турниров</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ведение счета и статистики по играм
                    </p>
                    <Switch defaultChecked data-testid="switch-game-statistics" />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Уведомления об играх</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Получать приглашения к играм от партнера
                    </p>
                    <Switch defaultChecked data-testid="switch-game-notifications" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
