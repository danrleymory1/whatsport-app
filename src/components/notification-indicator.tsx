// src/components/notification-indicator.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiService } from "@/services/api-service";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Notification } from "@/types/notification";

export function NotificationIndicator() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications({ 
        unread_only: true,
        per_page: 5
      });
      
      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return "";
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationsAsRead([notificationId]);
      
      // Update local state
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // View all notifications
  const viewAllNotifications = () => {
    router.push("/notifications");
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] h-5 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Notificações</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={fetchNotifications}
            >
              Atualizar
            </Button>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Não há notificações não lidas</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium text-sm">{notification.title}</h5>
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <span className="sr-only">Marcar como lida</span>
                      <span className="text-xs">×</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={viewAllNotifications}
          >
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}