// src/components/player/notifications.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Calendar, Users, MessageSquare, AlertCircle } from "lucide-react";
import { apiService } from "@/services/api-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NotificationType, Notification } from "@/types/notification";

// Helper function to format datetime
const formatDateTime = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.EVENT_INVITATION:
    case NotificationType.EVENT_REMINDER:
    case NotificationType.EVENT_CREATED:
    case NotificationType.EVENT_UPDATED:
    case NotificationType.EVENT_CANCELED:
      return <Calendar className="h-5 w-5" />;
    case NotificationType.EVENT_NEW_PARTICIPANT:
    case NotificationType.EVENT_PARTICIPANT_LEFT:
    case NotificationType.FRIEND_REQUEST:
      return <Users className="h-5 w-5" />;
    case NotificationType.RESERVATION_REQUEST:
    case NotificationType.RESERVATION_APPROVED:
    case NotificationType.RESERVATION_REJECTED:
    case NotificationType.RESERVATION_CANCELED:
      return <AlertCircle className="h-5 w-5" />;
    case NotificationType.NEW_MESSAGE:
      return <MessageSquare className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

export function PlayerNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      
      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
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
    try {
      const unreadIds = notifications
        .filter(notif => !notif.is_read)
        .map(notif => notif.id);
      
      if (unreadIds.length === 0) return;
      
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
      toast.error("Erro ao marcar notificações como lidas");
    }
  };

  // Navigate to related content
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to related content if action URL is provided
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  // Filter notifications based on selected tab
  const filteredNotifications = notifications.filter(notif => {
    if (selectedTab === "all") return true;
    if (selectedTab === "unread") return !notif.is_read;
    if (selectedTab === "events") return notif.type.startsWith("event_");
    if (selectedTab === "reservations") return notif.type.startsWith("reservation_");
    if (selectedTab === "social") return notif.type === NotificationType.FRIEND_REQUEST || notif.type === NotificationType.NEW_MESSAGE;
    return true;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Notificações</CardTitle>
            <CardDescription>
              Acompanhe suas notificações e atualizações
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-1" /> Marcar todas como lidas
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNotifications}
            >
              Atualizar
            </Button>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="all" onValueChange={setSelectedTab}>
          <div className="px-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread">Não lidas {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="reservations">Reservas</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="pt-6">
            <TabsContent value={selectedTab} forceMount={true}>
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-4 text-muted-foreground">Você não tem notificações {selectedTab !== "all" ? "nesta categoria" : ""}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors cursor-pointer relative ${
                        notification.is_read ? 'bg-background' : 'bg-muted/30'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${notification.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
                          {getNotificationIcon(notification.type as NotificationType)}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <h4 className={`font-medium ${!notification.is_read && 'text-primary'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(notification.created_at)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          {notification.action_url && (
                            <div className="text-xs text-primary mt-2">
                              Clique para visualizar detalhes
                            </div>
                          )}
                        </div>
                        
                        {!notification.is_read && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}