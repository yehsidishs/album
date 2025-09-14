import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CounterCard } from "@/components/counter-card";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  Heart,
  Clock,
  User,
  Settings,
  Plus,
  MessageCircle,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: counters = [] } = useQuery({
    queryKey: ["/api/counters"],
    enabled: !!user,
  });

  const navItems = [
    {
      href: "/dashboard",
      label: "Главная",
      icon: Home,
    },
    {
      href: "/profile",
      label: "Список желаний",
      icon: Gift,
    },
    {
      href: "/settings",
      label: "Счетчики и таймеры",
      icon: Clock,
    },
    {
      href: "/profile",
      label: "Личный кабинет",
      icon: User,
    },
    {
      href: "/settings",
      label: "Настройки",
      icon: Settings,
    },
  ];

  const handleCreateMemory = () => {
    // TODO: Implement create memory modal
    console.log("Create memory");
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 glass-morphism border-r border-border z-30 overflow-y-auto">
      <div className="p-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Быстрые действия
          </h3>
          <div className="space-y-2">
            <Button 
              onClick={handleCreateMemory}
              className="w-full btn-primary py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              data-testid="button-create-memory"
            >
              <Plus className="w-4 h-4" />
              Создать воспоминание
            </Button>
            <Link href="/chat" className="block">
              <Button 
                variant="outline"
                className="w-full glass-morphism py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] border-border"
                data-testid="button-open-chat"
              >
                <MessageCircle className="w-4 h-4" />
                Личные сообщения
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Навигация
          </h3>
          
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2 rounded-lg transition-all",
                    isActive 
                      ? "text-foreground bg-accent/20 border border-border" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  )}
                  data-testid={`nav-${item.href.slice(1)}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Counters Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Важные даты
          </h3>
          <div className="space-y-3">
            {counters.length === 0 ? (
              <div className="glass-morphism p-4 rounded-lg text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Счетчики не настроены
                </p>
                <Link href="/settings">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-primary p-0 h-auto mt-1"
                    data-testid="link-setup-counters"
                  >
                    Настроить
                  </Button>
                </Link>
              </div>
            ) : (
              counters.slice(0, 3).map((counter: any) => (
                <CounterCard key={counter.id} counter={counter} />
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
