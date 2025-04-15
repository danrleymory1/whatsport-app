"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, CheckCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/api-service";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Notification, NotificationType } from "@/types/notification";
import Link from "next/link";
import { toast } from "sonner";

// Extract to utils file
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.EVENT_INVITATION:
    case NotificationType.EVENT_REMINDER:
    case NotificationType.EVENT_CREATED:
    case NotificationType.EVENT_UPDATED:
    case NotificationType.EVENT_CANCELED:
    case NotificationType.EVENT_NEW_PARTICIPANT:
    case NotificationType.EVENT_PARTICIPANT_LEFT:
      return <Bell className="text-blue-500" />;
    case NotificationType.RESERVATION_REQUEST:
    case NotificationType.RESERVATION_APPROVED:
      return <CheckCircle className="text-green-500" />;
    case NotificationType.RESERVATION_REJECTED:
    case NotificationType.RESERVATION_CANCELED:
      return <X className="text-red-500" />;
    case NotificationType.FRIEND_REQUEST:
    case NotificationType.NEW_MESSAGE:
    default:
      return <Bell />;
  }
};

export function NotificationIndicator() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      
      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount and set poll interval
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return "";
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      await apiService.markNotificationsAsRead([notificationId]);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true } 
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notif => !notif.is_read)
      .map(notif => notif.id);
    
    if (unreadIds.length === 0) return;
    
    try {
      await apiService.markNotificationsAsRead(unreadIds);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, is_read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Close popover
    setOpen(false);
    
    // Navigate to related content if action URL is provided
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter(n => !n.is_read);
      case "events":
        return notifications.filter(n => 
          n.type.startsWith('event_')
        );
      case "reservations":
        return notifications.filter(n => 
          n.type.startsWith('reservation_')
        );
      case "social":
        return notifications.filter(n => 
          n.type === NotificationType.FRIEND_REQUEST || 
          n.type === NotificationType.NEW_MESSAGE
        );
      case "all":
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <div className="p-3 border-b flex justify-between items-center">
          <h4 className="font-medium">Notificações</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" /> Ler todas
              </Button>
            )}
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
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 p-1">
            <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">Não lidas</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Eventos</TabsTrigger>
            <TabsTrigger value="reservations" className="text-xs">Reservas</TabsTrigger>
          </TabsList>
          
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground mt-2">
                  Nenhuma notificação {activeTab === "unread" ? "não lida" : ""}
                </p>
              </div>
            ) : (
              <div>
                {filteredNotifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                      notification.is_read ? '' : 'bg-primary/5'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type as NotificationType)}
                        </div>
                        <div>
                          <h5 className={`font-medium text-sm ${!notification.is_read ? 'text-primary' : ''}`}>
                            {notification.title}
                          </h5>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <button
                          className="text-muted-foreground hover:text-foreground p-1"
                          onClick={(e) => markAsRead(notification.id, e)}
                        >
                          <span className="sr-only">Marcar como lida</span>
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
        
        <div className="p-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link href="/notifications">Ver todas as notificações</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}