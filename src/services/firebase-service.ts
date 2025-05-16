// src/services/firebase-service.ts
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc,
    deleteDoc,
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    Timestamp,
    writeBatch,
    limit,
    DocumentData,
    Query
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { User, UserType } from '@/types/user';
import { Event } from '@/types/event';
import { Space } from '@/types/space';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { googleMapsService } from './google-maps-service';

// Type for notification creation
interface NotificationData {
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl?: string;
}

// Firebase service for handling data operations
class FirebaseService {
    // Users
    async getCurrentUser(userId: string): Promise<User | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data() as User;
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    async updateUserProfile(userId: string, profileData: Partial<User>): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                ...profileData,
                updated_at: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Upload profile image
    async uploadProfileImage(userId: string, file: File): Promise<string> {
        try {
            const storageRef = ref(storage, `profiles/${userId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update user profile with the new image URL
            await this.updateUserProfile(userId, { profile_image: downloadURL });

            return downloadURL;
        } catch (error) {
            console.error('Error uploading profile image:', error);
            throw error;
        }
    }

    // Events
    async getEvents(filters: Record<string, unknown> = {}): Promise<Event[]> {
        try {
            let eventsQuery: Query<DocumentData> = query(collection(db, 'events'));

            // Build query with filters
            const constraints = [];

            if (filters.upcoming) {
                constraints.push(where('start_time', '>=', new Date()));
            }

            if (filters.sport_type) {
                constraints.push(where('sport_type', '==', filters.sport_type));
            }

            if (filters.skill_level) {
                constraints.push(where('skill_level', '==', filters.skill_level));
            }

            // Apply constraints if any
            if (constraints.length > 0) {
                eventsQuery = query(eventsQuery, ...constraints, orderBy('start_time'));
            } else {
                eventsQuery = query(eventsQuery, orderBy('start_time'));
            }

            const querySnapshot = await getDocs(eventsQuery);

            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    start_time: (data.start_time as Timestamp).toDate().toISOString(),
                    end_time: (data.end_time as Timestamp).toDate().toISOString(),
                    created_at: (data.created_at as Timestamp).toDate().toISOString(),
                    updated_at: (data.updated_at as Timestamp).toDate().toISOString()
                } as Event;
            });
        } catch (error) {
            console.error('Error getting events:', error);
            throw error;
        }
    }

    async getNearbyEvents(location: { lat: number, lng: number }, radius: number = 10): Promise<Event[]> {
        try {
            // Get all upcoming events
            const eventsQuery: Query<DocumentData> = query(
                collection(db, 'events'),
                where('start_time', '>=', new Date()),
                orderBy('start_time')
            );

            const querySnapshot = await getDocs(eventsQuery);

            // Filter events by distance client-side
            const eventsWithDistance = await Promise.all(querySnapshot.docs
                .map(async doc => {
                    const data = doc.data();
                    const event = {
                        id: doc.id,
                        ...data,
                        start_time: (data.start_time as Timestamp).toDate().toISOString(),
                        end_time: (data.end_time as Timestamp).toDate().toISOString(),
                        created_at: (data.created_at as Timestamp).toDate().toISOString(),
                        updated_at: (data.updated_at as Timestamp).toDate().toISOString()
                    } as Event;

                    if (!event.location?.lat || !event.location?.lng) return null;

                    try {
                        // Calculate distance using Google Maps Service
                        const calculatedDistance = await googleMapsService.calculateDistance(
                            location,
                            { lat: event.location.lat, lng: event.location.lng }
                        );

                        return {
                            ...event,
                            distance: calculatedDistance
                        };
                    } catch (error) {
                        console.error('Error calculating distance:', error);
                        return null;
                    }
                })
            );

            // Filter out events with null (failed distance calculation) and events outside radius
            return eventsWithDistance
                .filter(event => event !== null && event.distance <= radius)
                .sort((a, b) => a!.distance - b!.distance) as Event[];
        } catch (error) {
            console.error('Error getting nearby events:', error);
            throw error;
        }
    }

    async createEvent(eventData: Partial<Event>, userId: string): Promise<string> {
        try {
            const eventRef = collection(db, 'events');

            // Add timestamps and user data
            const now = new Date();
            const event = {
                ...eventData,
                organizer_id: userId,
                participants: [{ user_id: userId, confirmed: true }],
                created_at: now,
                updated_at: now,
                // Convert ISO string dates to Firestore timestamps
                start_time: new Date(eventData.start_time as string),
                end_time: new Date(eventData.end_time as string),
            };

            const docRef = await addDoc(eventRef, event);
            return docRef.id;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    async joinEvent(eventId: string, userId: string): Promise<void> {
        try {
            const eventRef = doc(db, 'events', eventId);
            const eventDoc = await getDoc(eventRef);

            if (!eventDoc.exists()) {
                throw new Error('Event not found');
            }

            const eventData = eventDoc.data();
            const participants = eventData.participants || [];

            // Check if user is already a participant
            if (participants.some((p: { user_id: string }) => p.user_id === userId)) {
                throw new Error('User is already a participant');
            }

            // Check if event is full
            if (participants.length >= eventData.max_participants) {
                throw new Error('Event is at maximum capacity');
            }

            // Add user to participants
            await updateDoc(eventRef, {
                participants: [...participants, { user_id: userId, confirmed: true }],
                updated_at: new Date()
            });

            // Create notification for event organizer
            await this.createNotification({
                userId: eventData.organizer_id,
                title: 'Novo participante',
                message: `Um novo participante se juntou ao seu evento "${eventData.title}"`,
                type: 'event_new_participant',
                actionUrl: `/player/events/${eventId}`
            });
        } catch (error) {
            console.error('Error joining event:', error);
            throw error;
        }
    }

    // Spaces
    async getSpaces(userId?: string): Promise<Space[]> {
        try {
            let spacesQuery: Query<DocumentData>;

            if (userId) {
                // Get spaces managed by the user
                spacesQuery = query(
                    collection(db, 'spaces'),
                    where('manager_id', '==', userId)
                );
            } else {
                // Get all public spaces
                spacesQuery = query(collection(db, 'spaces'));
            }

            const querySnapshot = await getDocs(spacesQuery);

            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    created_at: (data.created_at as Timestamp).toDate().toISOString(),
                    updated_at: (data.updated_at as Timestamp).toDate().toISOString()
                } as Space;
            });
        } catch (error) {
            console.error('Error getting spaces:', error);
            throw error;
        }
    }

    async getSpace(spaceId: string): Promise<Space | null> {
        try {
            const spaceDoc = await getDoc(doc(db, 'spaces', spaceId));

            if (!spaceDoc.exists()) {
                return null;
            }

            const data = spaceDoc.data();
            return {
                id: spaceDoc.id,
                ...data,
                created_at: (data.created_at as Timestamp).toDate().toISOString(),
                updated_at: (data.updated_at as Timestamp).toDate().toISOString()
            } as Space;
        } catch (error) {
            console.error('Error getting space:', error);
            throw error;
        }
    }

    async createSpace(spaceData: Partial<Space>, userId: string): Promise<Space> {
        try {
            const spaceRef = collection(db, 'spaces');

            // Add timestamps and manager data
            const now = new Date();
            const space = {
                ...spaceData,
                manager_id: userId,
                created_at: now,
                updated_at: now
            };

            const docRef = await addDoc(spaceRef, space);
            // Return the created space with its ID and properly formatted dates
            return {
                id: docRef.id,
                ...spaceData,
                manager_id: userId,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            } as Space;
        } catch (error) {
            console.error('Error creating space:', error);
            throw error;
        }
    }


    // Reservations
    async getReservations(filters: Record<string, unknown> = {}): Promise<Reservation[]> {
        try {
            let reservationsQuery: Query<DocumentData> = query(collection(db, 'reservations'));

            // Build query with filters
            const constraints = [];

            if (filters.user_id) {
                constraints.push(where('organizer_id', '==', filters.user_id));
            }

            if (filters.space_id) {
                constraints.push(where('space_id', '==', filters.space_id));
            }

            if (filters.status) {
                constraints.push(where('status', '==', filters.status));
            }

            if (filters.upcoming) {
                constraints.push(where('start_time', '>=', new Date()));
            }

            // Apply constraints if any
            if (constraints.length > 0) {
                reservationsQuery = query(reservationsQuery, ...constraints, orderBy('start_time'));
            } else {
                reservationsQuery = query(reservationsQuery, orderBy('start_time'));
            }

            const querySnapshot = await getDocs(reservationsQuery);

            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    start_time: (data.start_time as Timestamp).toDate().toISOString(),
                    end_time: (data.end_time as Timestamp).toDate().toISOString(),
                    created_at: (data.created_at as Timestamp).toDate().toISOString(),
                    updated_at: (data.updated_at as Timestamp).toDate().toISOString()
                } as Reservation;
            });
        } catch (error) {
            console.error('Error getting reservations:', error);
            throw error;
        }
    }

    async createReservation(reservationData: Partial<Reservation>, userId: string): Promise<string> {
        try {
            const reservationRef = collection(db, 'reservations');

            // Get space details
            const spaceDoc = await getDoc(doc(db, 'spaces', reservationData.space_id as string));

            if (!spaceDoc.exists()) {
                throw new Error('Space not found');
            }

            const spaceData = spaceDoc.data();

            // Add timestamps and user data
            const now = new Date();
            const reservation = {
                ...reservationData,
                organizer_id: userId,
                space_name: spaceData.name,
                status: ReservationStatus.PENDING,
                created_at: now,
                updated_at: now,
                // Convert ISO string dates to Firestore timestamps
                start_time: new Date(reservationData.start_time as string),
                end_time: new Date(reservationData.end_time as string),
            };

            const docRef = await addDoc(reservationRef, reservation);

            // Create notification for space manager
            await this.createNotification({
                userId: spaceData.manager_id,
                title: 'Nova solicitação de reserva',
                message: `Novo pedido de reserva para ${spaceData.name}`,
                type: 'reservation_request',
                actionUrl: `/manager/reservations`
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating reservation:', error);
            throw error;
        }
    }

    async updateReservationStatus(
        reservationId: string,
        status: ReservationStatus,
        reason?: string
    ): Promise<void> {
        try {
            const reservationRef = doc(db, 'reservations', reservationId);
            const reservationDoc = await getDoc(reservationRef);

            if (!reservationDoc.exists()) {
                throw new Error('Reservation not found');
            }

            const reservationData = reservationDoc.data();

            // Update status
            await updateDoc(reservationRef, {
                status,
                rejection_reason: status === ReservationStatus.REJECTED ? reason : null,
                updated_at: new Date()
            });

            // Create notification for the organizer
            let notificationTitle = '';
            let notificationMessage = '';
            let notificationType = '';

            switch (status) {
                case ReservationStatus.APPROVED:
                    notificationTitle = 'Reserva aprovada';
                    notificationMessage = `Sua reserva em ${reservationData.space_name} foi aprovada`;
                    notificationType = 'reservation_approved';
                    break;
                case ReservationStatus.REJECTED:
                    notificationTitle = 'Reserva rejeitada';
                    notificationMessage = `Sua reserva em ${reservationData.space_name} foi rejeitada${reason ? ': ' + reason : ''}`;
                    notificationType = 'reservation_rejected';
                    break;
                case ReservationStatus.COMPLETED:
                    notificationTitle = 'Reserva concluída';
                    notificationMessage = `Sua reserva em ${reservationData.space_name} foi marcada como concluída`;
                    notificationType = 'reservation_completed';
                    break;
            }

            if (notificationTitle) {
                await this.createNotification({
                    userId: reservationData.organizer_id,
                    title: notificationTitle,
                    message: notificationMessage,
                    type: notificationType,
                    actionUrl: `/player/reservations`
                });
            }
        } catch (error) {
            console.error('Error updating reservation status:', error);
            throw error;
        }
    }

    async cancelReservation(reservationId: string, userId: string): Promise<void> {
        try {
            const reservationRef = doc(db, 'reservations', reservationId);
            const reservationDoc = await getDoc(reservationRef);

            if (!reservationDoc.exists()) {
                throw new Error('Reservation not found');
            }

            const reservationData = reservationDoc.data();

            // Check if user is the organizer
            if (reservationData.organizer_id !== userId) {
                throw new Error('Only the organizer can cancel the reservation');
            }

            // Update status
            await updateDoc(reservationRef, {
                status: ReservationStatus.CANCELED,
                updated_at: new Date()
            });

            // Get space details to create notification for space manager
            const spaceDoc = await getDoc(doc(db, 'spaces', reservationData.space_id));

            if (spaceDoc.exists()) {
                const spaceData = spaceDoc.data();

                await this.createNotification({
                    userId: spaceData.manager_id,
                    title: 'Reserva cancelada',
                    message: `A reserva em ${reservationData.space_name} foi cancelada pelo organizador`,
                    type: 'reservation_canceled',
                    actionUrl: `/manager/reservations`
                });
            }
        } catch (error) {
            console.error('Error canceling reservation:', error);
            throw error;
        }
    }

    // Notifications
    async createNotification(data: NotificationData): Promise<string> {
        try {
            const notificationRef = collection(db, 'notifications');

            const notification = {
                ...data,
                isRead: false,
                createdAt: new Date()
            };

            const docRef = await addDoc(notificationRef, notification);
            return docRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                isRead: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async markAllNotificationsAsRead(userId: string): Promise<void> {
        try {
            const notificationsQuery = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                where('isRead', '==', false)
            );

            const querySnapshot = await getDocs(notificationsQuery);

            const batch = [];
            for (const doc of querySnapshot.docs) {
                batch.push(updateDoc(doc.ref, { isRead: true }));
            }

            await Promise.all(batch);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Get all public spaces
     * @returns List of all public spaces
     */
    async getPublicSpaces(): Promise<Space[]> {
        try {
            // Get all spaces that are publicly available
            const spacesQuery: Query<DocumentData> = query(
                collection(db, 'spaces'),
                where('status', '==', 'active')
            );

            const querySnapshot = await getDocs(spacesQuery);
            
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    created_at: (data.created_at as Timestamp).toDate().toISOString(),
                    updated_at: (data.updated_at as Timestamp).toDate().toISOString()
                } as Space;
            });
        } catch (error) {
            console.error('Error getting public spaces:', error);
            throw error;
        }
    }

    /**
     * Get reservations for a specific space
     * @param spaceId ID of the space
     * @param filters Filters to apply to the query
     * @returns List of reservations for the space
     */
    async getSpaceReservations(spaceId: string, filters: Record<string, unknown> = {}): Promise<Reservation[]> {
        try {
            // Create a base query for the space
            let reservationsQuery: Query<DocumentData> = query(
                collection(db, 'reservations'),
                where('space_id', '==', spaceId)
            );

            // Apply additional filters
            if (filters.status) {
                reservationsQuery = query(
                    reservationsQuery,
                    where('status', '==', filters.status)
                );
            }

            if (filters.upcoming) {
                reservationsQuery = query(
                    reservationsQuery,
                    where('start_time', '>=', new Date())
                );
            }

            // Apply ordering
            reservationsQuery = query(reservationsQuery, orderBy('start_time', 'asc'));

            const querySnapshot = await getDocs(reservationsQuery);
            
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    start_time: (data.start_time as Timestamp).toDate().toISOString(),
                    end_time: (data.end_time as Timestamp).toDate().toISOString(),
                    created_at: (data.created_at as Timestamp).toDate().toISOString(),
                    updated_at: (data.updated_at as Timestamp).toDate().toISOString()
                } as Reservation;
            });
        } catch (error) {
            console.error('Error getting space reservations:', error);
            throw error;
        }
    }

    /**
     * Approve a reservation
     * @param reservationId ID of the reservation to approve
     * @returns Promise that resolves when the reservation is approved
     */
    async approveReservation(reservationId: string): Promise<void> {
        try {
            const reservationRef = doc(db, 'reservations', reservationId);
            const reservationDoc = await getDoc(reservationRef);

            if (!reservationDoc.exists()) {
                throw new Error('Reservation not found');
            }

            const reservationData = reservationDoc.data();

            // Update status
            await updateDoc(reservationRef, {
                status: ReservationStatus.APPROVED,
                updated_at: new Date()
            });

            // Create notification for the organizer
            await this.createNotification({
                userId: reservationData.organizer_id,
                title: 'Reserva aprovada',
                message: `Sua reserva em ${reservationData.space_name} foi aprovada`,
                type: 'reservation_approved',
                actionUrl: `/player/reservations`
            });
        } catch (error) {
            console.error('Error approving reservation:', error);
            throw error;
        }
    }

    /**
     * Reject a reservation
     * @param reservationId ID of the reservation to reject
     * @param options Options including rejection reason
     * @returns Promise that resolves when the reservation is rejected
     */
    async rejectReservation(reservationId: string, options?: { rejection_reason?: string }): Promise<void> {
        try {
            const reservationRef = doc(db, 'reservations', reservationId);
            const reservationDoc = await getDoc(reservationRef);

            if (!reservationDoc.exists()) {
                throw new Error('Reservation not found');
            }

            const reservationData = reservationDoc.data();

            // Update status
            await updateDoc(reservationRef, {
                status: ReservationStatus.REJECTED,
                rejection_reason: options?.rejection_reason || null,
                updated_at: new Date()
            });

            // Create notification for the organizer
            await this.createNotification({
                userId: reservationData.organizer_id,
                title: 'Reserva rejeitada',
                message: `Sua reserva em ${reservationData.space_name} foi rejeitada${options?.rejection_reason ? ': ' + options.rejection_reason : ''}`,
                type: 'reservation_rejected',
                actionUrl: `/player/reservations`
            });
        } catch (error) {
            console.error('Error rejecting reservation:', error);
            throw error;
        }
    }

    /**
     * Mark a reservation as completed
     * @param reservationId ID of the reservation to mark as completed
     * @returns Promise that resolves when the reservation is marked as completed
     */
    async completeReservation(reservationId: string): Promise<void> {
        try {
            const reservationRef = doc(db, 'reservations', reservationId);
            const reservationDoc = await getDoc(reservationRef);

            if (!reservationDoc.exists()) {
                throw new Error('Reservation not found');
            }

            const reservationData = reservationDoc.data();

            // Update status
            await updateDoc(reservationRef, {
                status: ReservationStatus.COMPLETED,
                updated_at: new Date()
            });

            // Create notification for the organizer
            await this.createNotification({
                userId: reservationData.organizer_id,
                title: 'Reserva concluída',
                message: `Sua reserva em ${reservationData.space_name} foi marcada como concluída`,
                type: 'reservation_completed',
                actionUrl: `/player/reservations`
            });
        } catch (error) {
            console.error('Error completing reservation:', error);
            throw error;
        }
    }

    /**
     * Get notifications for the current user
     * @returns Notifications data
     */
    async getNotifications(): Promise<any[]> {
        try {
            // Get current user ID from auth
            const userId = auth.currentUser?.uid;
            
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Query notifications for the user
            const notificationsQuery: Query<DocumentData> = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const querySnapshot = await getDocs(notificationsQuery);
            
            const notifications: any[] = [];
            let unreadCount = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const notification = {
                    id: doc.id,
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    isRead: !!data.isRead,
                    createdAt: data.createdAt.toDate(),
                    actionUrl: data.actionUrl,
                    relatedId: data.relatedId,
                };

                notifications.push(notification);
                
                if (!notification.isRead) {
                    unreadCount++;
                }
            });

            return notifications;
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    }

    /**
     * Mark multiple notifications as read
     * @param notificationIds Array of notification IDs to mark as read
     * @returns Promise that resolves when all notifications are marked as read
     */
    async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
        try {
            const batch = writeBatch(db);
            
            notificationIds.forEach(id => {
                const notificationRef = doc(db, 'notifications', id);
                batch.update(notificationRef, { isRead: true });
            });
            
            await batch.commit();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw error;
        }
    }

// ---------------------------------------------
// SOCIAL NETWORKING METHODS FOR FIREBASE SERVICE
// ---------------------------------------------

/**
 * Gets all friendships for the current user
 * @returns List of friend relationships
 */
async getFriendships(): Promise<any[]> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      // Query friendships where current user is user1 or user2
      const query1 = query(
        collection(db, 'friendships'),
        where('user1_id', '==', currentUserId)
      );
      
      const query2 = query(
        collection(db, 'friendships'),
        where('user2_id', '==', currentUserId)
      );
  
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(query1),
        getDocs(query2)
      ]);
  
      const friendships: any[] = [];
  
      // Process friendships and get user data
      const processSnapshots = async (snapshot: any, isUser1: boolean) => {
        for (const docSnapshot of snapshot.docs) {  // Renomeado de 'doc' para 'docSnapshot'
          const data = docSnapshot.data();
          const otherUserId = isUser1 ? data.user2_id : data.user1_id;
          
          // Get the other user's data
          const userDoc = await getDoc(doc(db, `users/${otherUserId}`));  // Agora 'doc' se refere à função importada
          if (userDoc.exists()) {
            const userData = userDoc.data() as DocumentData;
            
            friendships.push({
              id: docSnapshot.id,  // Referência atualizada
              user_id: otherUserId,
              name: userData.name || '',
              email: userData.email || '',
              profile_image: userData.profile_image,
              status: data.status,
              created_at: data.created_at.toDate().toISOString(),
              updated_at: data.updated_at.toDate().toISOString(),
              requested_by: data.requested_by,
              blocked_by: data.blocked_by
            });
          }
        }
      };
      
      // Execute the processing for both queries
      await processSnapshots(snapshot1, true);
      await processSnapshots(snapshot2, false);
      
      return friendships;
    } catch (error) {
      console.error('Error getting friendships:', error);
      throw error;
    }
}
  
  /**
   * Searches for users by name or email
   * @param query Search query
   * @returns List of matching users
   */
  async searchUsers(searchQuery: string): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const results: any[] = [];
      const lowerQuery = searchQuery.toLowerCase();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (
          (data.name && data.name.toLowerCase().includes(lowerQuery)) ||
          (data.email && data.email.toLowerCase().includes(lowerQuery))
        ) {
          results.push({
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            profile_image: data.profile_image
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
  
  /**
   * Gets the friendship status between two users
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Friendship status
   */
  async getFriendshipStatus(userId1: string, userId2: string): Promise<string> {
    try {
      // Check both directions
      const q1 = query(
        collection(db, 'friendships'),
        where('user1_id', '==', userId1),
        where('user2_id', '==', userId2)
      );
      
      const q2 = query(
        collection(db, 'friendships'),
        where('user1_id', '==', userId2),
        where('user2_id', '==', userId1)
      );
  
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
  
      if (!snapshot1.empty) {
        return snapshot1.docs[0].data().status;
      }
  
      if (!snapshot2.empty) {
        return snapshot2.docs[0].data().status;
      }
  
      return ''; // No friendship found
    } catch (error) {
      console.error('Error getting friendship status:', error);
      throw error;
    }
  }
  
  /**
   * Sends a friend request to another user
   * @param receiverId ID of the user to send the request to
   * @returns Promise that resolves when the request is sent
   */
  async sendFriendRequest(receiverId: string): Promise<void> {
    try {
      const senderId = auth.currentUser?.uid;
      if (!senderId) {
        throw new Error('User not authenticated');
      }
  
      // Check if a friendship already exists
      const status = await this.getFriendshipStatus(senderId, receiverId);
      if (status) {
        throw new Error('Friendship relationship already exists');
      }
  
      // Create the friendship
      const friendshipRef = collection(db, 'friendships');
      await addDoc(friendshipRef, {
        user1_id: senderId,
        user2_id: receiverId,
        status: 'pending',
        requested_by: senderId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
  
      // Create notification for the receiver
      await this.createNotification({
        userId: receiverId,
        title: 'Nova solicitação de amizade',
        message: 'Você recebeu uma nova solicitação de amizade',
        type: 'friend_request',
        actionUrl: '/player/social'
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }
  
  /**
   * Responds to a friend request
   * @param friendshipId ID of the friendship
   * @param accept Whether to accept or decline the request
   * @returns Promise that resolves when the response is processed
   */
  async respondToFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const friendshipDoc = await getDoc(friendshipRef);
  
      if (!friendshipDoc.exists()) {
        throw new Error('Friendship not found');
      }
  
      const friendshipData = friendshipDoc.data();
  
      // Verify user is the recipient of the request
      if (
        (friendshipData.user1_id === currentUserId && friendshipData.requested_by !== currentUserId) ||
        (friendshipData.user2_id === currentUserId && friendshipData.requested_by !== currentUserId)
      ) {
        // Update friendship status
        await updateDoc(friendshipRef, {
          status: accept ? 'accepted' : 'declined',
          updated_at: serverTimestamp()
        });
  
        // Send notification to requester
        const requesterId = friendshipData.requested_by;
        const notificationTitle = accept ? 'Solicitação de amizade aceita' : 'Solicitação de amizade recusada';
        const notificationMessage = accept 
          ? 'Sua solicitação de amizade foi aceita' 
          : 'Sua solicitação de amizade foi recusada';
  
        await this.createNotification({
          userId: requesterId,
          title: notificationTitle,
          message: notificationMessage,
          type: accept ? 'friend_request_accepted' : 'friend_request_declined',
          actionUrl: '/player/social'
        });
      } else {
        throw new Error('User not authorized to respond to this request');
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }
  
  /**
   * Cancels a sent friend request
   * @param friendshipId ID of the friendship
   * @returns Promise that resolves when the request is canceled
   */
  async cancelFriendRequest(friendshipId: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const friendshipDoc = await getDoc(friendshipRef);
  
      if (!friendshipDoc.exists()) {
        throw new Error('Friendship not found');
      }
  
      const friendshipData = friendshipDoc.data();
  
      // Verify user is the requester
      if (friendshipData.requested_by === currentUserId && friendshipData.status === 'pending') {
        // Delete the friendship
        await deleteDoc(friendshipRef);
      } else {
        throw new Error('User not authorized to cancel this request');
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      throw error;
    }
  }
  
  /**
   * Removes a friend
   * @param friendshipId ID of the friendship
   * @returns Promise that resolves when the friend is removed
   */
  async removeFriend(friendshipId: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const friendshipDoc = await getDoc(friendshipRef);
  
      if (!friendshipDoc.exists()) {
        throw new Error('Friendship not found');
      }
  
      const friendshipData = friendshipDoc.data();
  
      // Verify user is part of the friendship
      if (
        (friendshipData.user1_id === currentUserId || friendshipData.user2_id === currentUserId) &&
        friendshipData.status === 'accepted'
      ) {
        // Delete the friendship
        await deleteDoc(friendshipRef);
  
        // Determine the other user
        const otherUserId = friendshipData.user1_id === currentUserId 
          ? friendshipData.user2_id 
          : friendshipData.user1_id;
  
        // Send notification to the other user
        await this.createNotification({
          userId: otherUserId,
          title: 'Amizade removida',
          message: 'Você foi removido da lista de amigos',
          type: 'friendship_removed',
          actionUrl: '/player/social'
        });
      } else {
        throw new Error('User not authorized to remove this friendship');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }
  
  /**
   * Blocks a user
   * @param userId ID of the user to block
   * @param friendshipId Optional existing friendship ID
   * @returns Promise that resolves when the user is blocked
   */
  async blockUser(userId: string, friendshipId?: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      // Check if a friendship exists
      if (friendshipId) {
        // Update existing friendship
        const friendshipRef = doc(db, 'friendships', friendshipId);
        await updateDoc(friendshipRef, {
          status: 'blocked',
          blocked_by: currentUserId,
          updated_at: serverTimestamp()
        });
      } else {
        // Create new blocked relationship
        const friendshipRef = collection(db, 'friendships');
        await addDoc(friendshipRef, {
          user1_id: currentUserId,
          user2_id: userId,
          status: 'blocked',
          blocked_by: currentUserId,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }
  
  /**
   * Unblocks a user
   * @param friendshipId ID of the friendship
   * @returns Promise that resolves when the user is unblocked
   */
  async unblockUser(friendshipId: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const friendshipDoc = await getDoc(friendshipRef);
  
      if (!friendshipDoc.exists()) {
        throw new Error('Friendship not found');
      }
  
      const friendshipData = friendshipDoc.data();
  
      // Verify user is the blocker
      if (friendshipData.blocked_by === currentUserId && friendshipData.status === 'blocked') {
        // Delete the friendship to unblock
        await deleteDoc(friendshipRef);
      } else {
        throw new Error('User not authorized to unblock this relationship');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }
  
  /**
   * Gets user's groups
   * @returns List of groups the user is a member of
   */
  async getUserGroups(): Promise<any[]> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      // Get groups where user is a member
      const groupsRef = collection(db, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      
      const userGroups: any[] = [];
  
      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data();
        const members = groupData.members || [];
  
        // Check if user is a member
        const isMember = members.some((member: any) => member.user_id === currentUserId);
        if (isMember) {
          userGroups.push({
            id: groupDoc.id,
            name: groupData.name,
            description: groupData.description,
            creator_id: groupData.creator_id,
            members: groupData.members || [],
            is_private: groupData.is_private || false,
            created_at: groupData.created_at.toDate().toISOString(),
            updated_at: groupData.updated_at.toDate().toISOString()
          });
        }
      }
  
      return userGroups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }
  
  /**
   * Creates a new group
   * @param groupData Group data
   * @returns Promise that resolves with the created group ID
   */
  async createGroup(groupData: { name: string; description: string; is_private: boolean }): Promise<string> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      
      const userData = userDoc.data();
  
      // Create the group
      const groupRef = collection(db, 'groups');
      const newGroup = {
        name: groupData.name,
        description: groupData.description || '',
        creator_id: currentUserId,
        members: [
          {
            user_id: currentUserId,
            user_name: userData.name || userData.email,
            user_profile_image: userData.profile_image,
            role: 'admin',
            joined_at: new Date().toISOString()
          }
        ],
        is_private: groupData.is_private,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
  
      const docRef = await addDoc(groupRef, newGroup);
      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }
  
  /**
   * Updates a group
   * @param groupId ID of the group to update
   * @param groupData Group data to update
   * @returns Promise that resolves when the group is updated
   */
  async updateGroup(groupId: string, groupData: { name: string; description: string; is_private: boolean }): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      // Verify user is group admin
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
  
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
  
      const groupInfo = groupDoc.data();
      const currentMember = groupInfo.members.find((m: any) => m.user_id === currentUserId);
      
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('User not authorized to update this group');
      }
  
      // Update the group
      await updateDoc(groupRef, {
        name: groupData.name,
        description: groupData.description,
        is_private: groupData.is_private,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }
  
  /**
   * Leaves a group
   * @param groupId ID of the group to leave
   * @returns Promise that resolves when the user has left the group
   */
  async leaveGroup(groupId: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
  
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
  
      const groupData = groupDoc.data();
      const members = groupData.members || [];
      const userIndex = members.findIndex((m: any) => m.user_id === currentUserId);
  
      if (userIndex === -1) {
        throw new Error('User is not a member of this group');
      }
  
      // Check if user is the only admin
      const isAdmin = members[userIndex].role === 'admin';
      const adminCount = members.filter((m: any) => m.role === 'admin').length;
      
      if (isAdmin && adminCount === 1 && members.length > 1) {
        // Promote another member to admin
        const nextAdmin = members.find((m: any) => m.role !== 'admin');
        if (nextAdmin) {
          nextAdmin.role = 'admin';
        }
      }
  
      if (members.length === 1) {
        // Last member leaving, delete the group
        await deleteDoc(groupRef);
      } else {
        // Remove user from members
        members.splice(userIndex, 1);
        
        await updateDoc(groupRef, {
          members: members,
          updated_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }
  
  /**
   * Deletes a group
   * @param groupId ID of the group to delete
   * @returns Promise that resolves when the group is deleted
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
  
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
  
      const groupData = groupDoc.data();
      
      // Verify user is creator or admin
      const currentMember = groupData.members.find((m: any) => m.user_id === currentUserId);
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('User not authorized to delete this group');
      }
  
      // Delete the group
      await deleteDoc(groupRef);
  
      // Notify all members
      const notifyMembers = groupData.members
        .filter((member: any) => member.user_id !== currentUserId)
        .map((member: any) => {
          return this.createNotification({
            userId: member.user_id,
            title: 'Grupo excluído',
            message: `O grupo "${groupData.name}" foi excluído`,
            type: 'group_deleted',
            actionUrl: '/player/social'
          });
        });
  
      await Promise.all(notifyMembers);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }
  
  /**
   * Invites a user to a group
   * @param groupId ID of the group
   * @param userId ID of the user to invite
   * @returns Promise that resolves when the invitation is sent
   */
  async inviteToGroup(groupId: string, userId: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      // Get group data
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
  
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
  
      const groupData = groupDoc.data();
      
      // Verify user is admin
      const currentMember = groupData.members.find((m: any) => m.user_id === currentUserId);
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('User not authorized to invite to this group');
      }
  
      // Check if user is already a member
      if (groupData.members.some((m: any) => m.user_id === userId)) {
        throw new Error('User is already a member of this group');
      }
  
      // Get invited user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
  
      // Add user to group
      const newMember = {
        user_id: userId,
        user_name: userData.name || userData.email,
        user_profile_image: userData.profile_image,
        role: 'member',
        joined_at: new Date().toISOString()
      };
  
      await updateDoc(groupRef, {
        members: [...groupData.members, newMember],
        updated_at: serverTimestamp()
      });
  
      // Notify the invited user
      await this.createNotification({
        userId: userId,
        title: 'Convite para grupo',
        message: `Você foi adicionado ao grupo "${groupData.name}"`,
        type: 'group_invitation',
        actionUrl: `/player/social`
      });
    } catch (error) {
      console.error('Error inviting to group:', error);
      throw error;
    }
  }
  
  /**
   * Removes a user from a group
   * @param groupId ID of the group
   * @param userId ID of the user to remove
   * @returns Promise that resolves when the user is removed
   */
  async removeFromGroup(groupId: string, userId: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
  
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
  
      const groupData = groupDoc.data();
      
      // Verify user is admin
      const currentMember = groupData.members.find((m: any) => m.user_id === currentUserId);
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('User not authorized to remove members from this group');
      }
  
      // Find user in members
      const members = groupData.members || [];
      const userIndex = members.findIndex((m: any) => m.user_id === userId);
      
      if (userIndex === -1) {
        throw new Error('User is not a member of this group');
      }
  
      // Remove user from members
      members.splice(userIndex, 1);
      
      await updateDoc(groupRef, {
        members: members,
        updated_at: serverTimestamp()
      });
  
      // Notify the removed user
      await this.createNotification({
        userId: userId,
        title: 'Removido do grupo',
        message: `Você foi removido do grupo "${groupData.name}"`,
        type: 'group_removed',
        actionUrl: '/player/social'
      });
    } catch (error) {
      console.error('Error removing from group:', error);
      throw error;
    }
  }
  
  /**
   * Changes a user's role in a group
   * @param groupId ID of the group
   * @param userId ID of the user
   * @param newRole New role to assign ('admin' or 'member')
   * @returns Promise that resolves when the role is changed
   */
  async changeGroupRole(groupId: string, userId: string, newRole: string): Promise<void> {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
  
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
  
      const groupData = groupDoc.data();
      
      // Verify user is admin
      const currentMember = groupData.members.find((m: any) => m.user_id === currentUserId);
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('User not authorized to change roles in this group');
      }
  
      // Find user in members
      const members = groupData.members || [];
      const userIndex = members.findIndex((m: any) => m.user_id === userId);
      
      if (userIndex === -1) {
        throw new Error('User is not a member of this group');
      }
  
      // Update role
      members[userIndex].role = newRole;
      
      await updateDoc(groupRef, {
        members: members,
        updated_at: serverTimestamp()
      });
  
      // Notify the user about role change
      await this.createNotification({
        userId: userId,
        title: 'Função atualizada',
        message: `Sua função no grupo "${groupData.name}" foi alterada para ${newRole === 'admin' ? 'administrador' : 'membro'}`,
        type: 'group_role_changed',
        actionUrl: '/player/social'
      });
    } catch (error) {
      console.error('Error changing group role:', error);
      throw error;
    }
  }
}

// Export as singleton
export const firebaseService = new FirebaseService();