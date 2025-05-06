// src/context/notification-context.tsx
"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode
} from "react";
import { onMessage, getToken } from "firebase/messaging";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, messaging } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { Notification, NotificationType } from "@/types/notification";
import { toast } from "sonner";

interface NotificationContextProps {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen for notifications from Firestore
    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Query notifications for the user
        const notificationsRef = collection(db, "notifications");
        const q = query(
            notificationsRef,
            where("userId", "==", user.id),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        // Subscribe to notifications updates
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const newNotifications: Notification[] = [];
                let newUnreadCount = 0;

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const notification: Notification = {
                        id: doc.id,
                        userId: data.userId,
                        type: data.type as NotificationType,
                        title: data.title,
                        message: data.message,
                        isRead: !!data.isRead,
                        createdAt: data.createdAt.toDate(),
                        actionUrl: data.actionUrl,
                        relatedId: data.relatedId,
                    };

                    newNotifications.push(notification);

                    // Count unread notifications
                    if (!notification.isRead) {
                        newUnreadCount++;
                    }
                });

                setNotifications(newNotifications);
                setUnreadCount(newUnreadCount);
                setLoading(false);
            },
            (err) => {
                console.error("Error listening to notifications:", err);
                setError("Erro ao carregar notificações");
                setLoading(false);
            }
        );

        // Cleanup subscription
        return () => unsubscribe();
    }, [isAuthenticated, user?.id]);

    // Initialize Firebase Cloud Messaging for push notifications
    useEffect(() => {
        const initializeFirebaseMessaging = async () => {
            if (!messaging || !isAuthenticated || !user?.id) return;

            try {
                // Request permission for notifications
                const permission = await Notification.requestPermission();
                if (permission !== "granted") return;

                // Get FCM token
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (token) {
                    // Save token to user's document
                    const userRef = doc(db, "users", user.id);
                    await updateDoc(userRef, {
                        fcmTokens: {
                            [token]: true
                        }
                    });
                }

                // Listen for messages when the app is in the foreground
                const unsubscribe = onMessage(messaging, (payload) => {
                    console.log("Foreground message received:", payload);

                    // Show notification using Sonner
                    if (payload.notification) {
                        toast(payload.notification.title, {
                            description: payload.notification.body,
                        });
                    }
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error initializing FCM:", error);
            }
        };

        initializeFirebaseMessaging();
    }, [isAuthenticated, user?.id]);

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            const notificationRef = doc(db, "notifications", notificationId);
            await updateDoc(notificationRef, { isRead: true });

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif.id === notificationId
                        ? { ...notif, isRead: true }
                        : notif
                )
            );

            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
            setError("Erro ao marcar notificação como lida");
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        if (!user?.id || notifications.length === 0) return;

        try {
            // Get all unread notification IDs
            const unreadIds = notifications
                .filter(notif => !notif.isRead)
                .map(notif => notif.id);

            if (unreadIds.length === 0) return;

            // Update each notification
            const promises = unreadIds.map(id =>
                updateDoc(doc(db, "notifications", id), { isRead: true })
            );

            await Promise.all(promises);

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notif => ({ ...notif, isRead: true }))
            );

            // Reset unread count
            setUnreadCount(0);

            toast.success("Todas as notificações marcadas como lidas");
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            setError("Erro ao marcar todas notificações como lidas");
            toast.error("Erro ao marcar todas notificações como lidas");
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId: string) => {
        try {
            await deleteDoc(doc(db, "notifications", notificationId));

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.filter(notif => notif.id !== notificationId)
            );

            // Update unread count if needed
            const deletedNotification = notifications.find(n => n.id === notificationId);
            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            toast.success("Notificação excluída");
        } catch (error) {
            console.error("Error deleting notification:", error);
            setError("Erro ao excluir notificação");
            toast.error("Erro ao excluir notificação");
        }
    };

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loading,
        error
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}