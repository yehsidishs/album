import { Card, CardContent } from "@/components/ui/card";
import { Clock, Heart, Calendar, Zap } from "lucide-react";
import { Counter } from "@shared/schema";
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

interface CounterCardProps {
  counter: Counter;
}

export function CounterCard({ counter }: CounterCardProps) {
  const getTimeUntil = () => {
    if (!counter.targetDate) return null;
    
    const now = new Date();
    const target = new Date(counter.targetDate);
    
    if (counter.type === "countdown") {
      const days = differenceInDays(target, now);
      if (days > 0) {
        return `${days} дней`;
      }
      
      const hours = differenceInHours(target, now);
      if (hours > 0) {
        return `${hours} часов`;
      }
      
      const minutes = differenceInMinutes(target, now);
      return `${Math.max(0, minutes)} минут`;
    }
    
    if (counter.type === "count_up" && counter.startDate) {
      const start = new Date(counter.startDate);
      const days = differenceInDays(now, start);
      return `${days} дней`;
    }
    
    return null;
  };

  const getIcon = () => {
    switch (counter.icon) {
      case "heart":
        return <Heart className="w-4 h-4 text-red-400" />;
      case "calendar":
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case "zap":
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  const timeValue = getTimeUntil();

  return (
    <Card className="glass-morphism border-border" data-testid={`counter-${counter.id}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" data-testid="text-counter-name">
            {counter.name}
          </span>
          {getIcon()}
        </div>
        {timeValue && (
          <p className="text-lg font-bold" data-testid="text-counter-value">
            {timeValue}
          </p>
        )}
        {counter.description && (
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-counter-description">
            {counter.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
