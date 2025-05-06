// src/hooks/useFirebaseMessaging.ts
import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

// Type for notification payload
export interface NotificationPayload {
    notification: {
        title: string;
        body: string;
        icon?: string;
        click_action?: string;
    };
    data?: Record<string, string>;
}

export function useFirebaseMessaging() {
    const { user, isAuthenticated } = useAuth();
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationPayload | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isSupporting, setIsSupporting] = useState<boolean | null>(null);

    // Check if the browser supports messaging
    useEffect(() => {
        const checkSupport = async () => {
            const isMessagingSupported = await isSupported();
            setIsSupporting(isMessagingSupported);
        };

        checkSupport();
    }, []);

    // Initialize FCM when authenticated
    useEffect(() => {
        const initializeFCM = async () => {
            if (!isAuthenticated || !user?.id || !isSupporting) return;

            try {
                const messaging = getMessaging();

                // Request permission
                const permission = await Notification.requestPermission();
                setNotificationsEnabled(permission === 'granted');

                if (permission === 'granted') {
                    // Get FCM token
                    const token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY
                    });

                    setFcmToken(token);

                    // Update user's FCM tokens in Firestore
                    await updateUserFcmToken(token);

                    // Listen for foreground messages
                    const unsubscribe = onMessage(messaging, (payload) => {
                        console.log('Message received in foreground:', payload);
                        setNotification(payload as NotificationPayload);

                        // Display notification manually since foreground messages don't automatically display
                        if (payload.notification) {
                            new Notification(payload.notification.title || 'Notification', {
                                body: payload.notification.body,
                                icon: payload.notification.icon || '/icons/logo.png'
                            });
                        }
                    });

                    return () => unsubscribe();
                }
            } catch (error) {
                console.error('Error initializing Firebase Messaging:', error);
                setNotificationsEnabled(false);
            }
        };

        initializeFCM();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id, isSupporting]);

    // Update user's FCM token in Firestore
    const updateUserFcmToken = async (token: string) => {
        if (!user?.id) return;

        try {
            const userRef = doc(db, 'users', user.id);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const currentTokens = userData.fcm_tokens || [];

                // Check if token already exists
                if (!currentTokens.includes(token)) {
                    await updateDoc(userRef, {
                        fcm_tokens: arrayUnion(token)
                    });
                }
            }
        } catch (error) {
            console.error('Error updating FCM token:', error);
        }
    };

    // Remove FCM token on unmount or when user logs out
    const removeFcmToken = async () => {
        if (!user?.id || !fcmToken) return;

        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                fcm_tokens: arrayRemove(fcmToken)
            });
            setFcmToken(null);
        } catch (error) {
            console.error('Error removing FCM token:', error);
        }
    };

    // Clear current notification
    const clearNotification = () => {
        setNotification(null);
    };

    return {
        fcmToken,
        notification,
        clearNotification,
        notificationsEnabled,
        isSupporting,
        removeFcmToken
    };
}