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
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  doc
} from "firebase/firestore";
import Link from "next/link";

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  type: string;
  actionUrl?: string;
};

export function NotificationIndicator() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Subscribe to notifications when user is authenticated
  useEffect(() => {
    if (!user?.id) return;

    // Create a query for the current user's unread notifications
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(
        notificationsRef,
        where("userId", "==", user.id),
        orderBy("createdAt", "desc"),
        limit(5)
    );

    // Subscribe to notification updates
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData: Notification[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Notification, "id" | "createdAt"> & {
          createdAt: { toDate: () => Date }
        };

        const notification: Notification = {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          isRead: data.isRead,
          createdAt: data.createdAt.toDate(),
          type: data.type,
          actionUrl: data.actionUrl
        };

        notificationsData.push(notification);

        if (!notification.isRead) {
          unread++;
        }
      });

      setNotifications(notificationsData);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) {
      return "agora";
    } else if (diffMin < 60) {
      return `${diffMin} min`;
    } else if (diffHr < 24) {
      return `${diffHr} h`;
    } else if (diffDay < 7) {
      return `${diffDay} d`;
    } else {
      return date.toLocaleDateString();
    }
  };

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
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Nenhuma notificação
                  </p>
                </div>
            ) : (
                notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                            notification.isRead ? '' : 'bg-primary/5'
                        }`}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                          if (notification.actionUrl) {
                            setOpen(false);
                          }
                        }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className={`font-medium text-sm ${!notification.isRead ? 'text-primary' : ''}`}>
                            {notification.title}
                          </h5>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                ))
            )}
          </div>

          <div className="p-2 border-t">
            <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                asChild
                onClick={() => setOpen(false)}
            >
              <Link href="/notifications">Ver todas</Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
  );
}