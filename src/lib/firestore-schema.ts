// src/lib/firestore-schema.ts
// Definição dos modelos de dados para o Firestore

import { Timestamp } from "firebase/firestore";

/**
 * Modelo de usuário no Firestore
 */
export interface FirestoreUser {
    id: string;
    email: string;
    name?: string;
    profile_image?: string;
    phone?: string;
    address?: string;
    birth_date?: string;
    bio?: string;
    user_type: 'jogador' | 'gerente';
    fcmTokens?: Record<string, boolean>; // Tokens para notificações push
    sports?: UserSport[];               // Apenas para jogadores
    managed_spaces?: string[];          // Apenas para gerentes
    company_info?: CompanyInfo;         // Apenas para gerentes
    banking_info?: BankingInfo;         // Apenas para gerentes
    settings?: UserSettings;
    created_at: string;
    updated_at: string;
}

/**
 * Informações esportivas do usuário
 */
export interface UserSport {
    sport_type: string;
    skill_level: 'beginner' | 'intermediate' | 'advanced';
    years_experience?: number;
    preferred_position?: string;
    description?: string;
}

/**
 * Informações da empresa (para gerentes)
 */
export interface CompanyInfo {
    name: string;
    legal_name?: string;
    tax_id?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    phone?: string;
    website?: string;
}

/**
 * Informações bancárias (para gerentes)
 */
export interface BankingInfo {
    bank_name: string;
    bank_code?: string;
    account_type: 'checking' | 'savings';
    account_number: string;
    branch_number?: string;
    pix_key?: string;
}

/**
 * Configurações do usuário
 */
export interface UserSettings {
    email_notifications: boolean;
    push_notifications: boolean;
    event_reminders: boolean;
    marketing_emails: boolean;
    profile_visibility: 'public' | 'friends' | 'private';
    location_sharing: boolean;
    theme_preference?: 'light' | 'dark' | 'system';
    language_preference?: string;
}

/**
 * Modelo de espaço esportivo no Firestore
 */
export interface FirestoreSpace {
    id: string;
    name: string;
    description: string;
    location: GeoLocation;
    photos: SpacePhoto[];
    available_sports: SpaceSport[];
    amenities: string[];
    opening_hours: Record<string, { opens_at: string; closes_at: string }>;
    manager_id: string;
    manager_name?: string;
    rating?: number;
    rating_count?: number;
    status: 'active' | 'inactive' | 'pending_approval';
    created_at: string;
    updated_at: string;
}

/**
 * Foto do espaço
 */
export interface SpacePhoto {
    id: string;
    url: string;
    is_primary: boolean;
    created_at: string;
}

/**
 * Esporte disponível no espaço
 */
export interface SpaceSport {
    sport_type: string;
    price_per_hour: number;
    max_participants?: number;
    description?: string;
    facilities?: string[];
}

/**
 * Localização geográfica
 */
export interface GeoLocation {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    state?: string;
    postal_code?: string;
    geohash?: string; // Para consultas geoespaciais eficientes
}

/**
 * Modelo de evento no Firestore
 */
export interface FirestoreEvent {
    id: string;
    title: string;
    description: string;
    sport_type: string;
    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'all';
    start_time: string;
    end_time: string;
    location: GeoLocation;
    max_participants: number;
    participants: EventParticipant[];
    positions?: EventPosition[];
    organizer_id: string;
    organizer_name: string;
    space_id?: string;
    space_name?: string;
    price_per_person?: number;
    is_private: boolean;
    is_recurring?: boolean;
    recurrence_pattern?: RecurrencePattern;
    status: 'scheduled' | 'canceled' | 'completed';
    photos?: string[];
    created_at: string;
    updated_at: string;
}

/**
 * Participante de evento
 */
export interface EventParticipant {
    user_id: string;
    user_name?: string;
    user_profile_image?: string;
    position_id?: string;
    position_name?: string;
    confirmed: boolean;
    joined_at: string;
}

/**
 * Posição em um evento
 */
export interface EventPosition {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    filled: number;
}

/**
 * Padrão de recorrência para eventos
 */
export interface RecurrencePattern {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    day_of_week?: number[]; // 0-6 (domingo-sábado)
    day_of_month?: number;
    end_date?: string;
    end_occurrences?: number;
}

/**
 * Modelo de reserva no Firestore
 */
export interface FirestoreReservation {
    id: string;
    space_id: string;
    space_name: string;
    event_id?: string;
    organizer_id: string;
    organizer_name: string;
    organizer_email?: string;
    organizer_phone?: string;
    sport_type: string;
    start_time: string;
    end_time: string;
    participants_count: number;
    total_price: number;
    notes?: string;
    rejection_reason?: string;
    status: 'pending' | 'approved' | 'rejected' | 'canceled' | 'completed';
    payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded';
    payment_method?: string;
    payment_id?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Modelo de notificação no Firestore
 */
export interface FirestoreNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Timestamp;
    actionUrl?: string;
    relatedId?: string;
    iconType?: string;
}

/**
 * Modelo de avaliação no Firestore
 */
export interface FirestoreReview {
    id: string;
    user_id: string;
    user_name: string;
    user_image?: string;
    target_id: string;  // ID do espaço, evento ou usuário sendo avaliado
    target_type: 'space' | 'event' | 'user';
    rating: number;     // 1-5
    comment?: string;
    photos?: string[];
    created_at: string;
    updated_at: string;
}

/**
 * Modelo de amizade no Firestore
 */
export interface FirestoreFriendship {
    id: string;
    user1_id: string;
    user2_id: string;
    status: 'pending' | 'accepted' | 'declined';
    requested_at: string;
    updated_at: string;
    requested_by: string; // ID do usuário que enviou o convite
}

/**
 * Modelo de grupo no Firestore
 */
export interface FirestoreGroup {
    id: string;
    name: string;
    description?: string;
    creator_id: string;
    members: GroupMember[];
    sport_types?: string[];
    is_private: boolean;
    group_image?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Membro de um grupo
 */
export interface GroupMember {
    user_id: string;
    user_name?: string;
    user_profile_image?: string;
    role: 'admin' | 'member';
    joined_at: string;
}

/**
 * Modelo de mensagem no Firestore
 */
export interface FirestoreMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name?: string;
    content: string;
    sent_at: string;
    read_by: Record<string, string>; // user_id -> timestamp
    attachments?: MessageAttachment[];
}

/**
 * Anexo de mensagem
 */
export interface MessageAttachment {
    type: 'image' | 'file' | 'location';
    url?: string;
    name?: string;
    size?: number;
    location?: GeoLocation;
}

/**
 * Modelo de conversa no Firestore
 */
export interface FirestoreConversation {
    id: string;
    participants: string[]; // IDs dos usuários
    participant_info: Record<string, { name: string; profile_image?: string }>;
    is_group: boolean;
    group_id?: string;
    group_name?: string;
    group_image?: string;
    last_message?: {
        content: string;
        sender_id: string;
        sent_at: string;
    };
    created_at: string;
    updated_at: string;
}

/**
 * Modelo para pagamentos no Firestore
 */
export interface FirestorePayment {
    id: string;
    user_id: string;
    reservation_id?: string;
    event_id?: string;
    amount: number;
    currency: string;
    payment_method: string;
    payment_provider: string;
    payment_provider_id: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    created_at: string;
    updated_at: string;
}

/**
 * Conversores para interagir com Firestore
 */
export const firestoreConverters = {
    userConverter: {
        toFirestore: (user: FirestoreUser) => {
            return {
                ...user,
                created_at: user.created_at,
                updated_at: new Date().toISOString()
            };
        },
        fromFirestore: (snapshot: any, options: any): FirestoreUser => {
            const data = snapshot.data(options);
            return {
                id: snapshot.id,
                ...data,
                created_at: data.created_at,
                updated_at: data.updated_at
            };
        }
    },

    eventConverter: {
        toFirestore: (event: FirestoreEvent) => {
            return {
                ...event,
                created_at: event.created_at,
                updated_at: new Date().toISOString()
            };
        },
        fromFirestore: (snapshot: any, options: any): FirestoreEvent => {
            const data = snapshot.data(options);
            return {
                id: snapshot.id,
                ...data,
                created_at: data.created_at,
                updated_at: data.updated_at,
                start_time: data.start_time,
                end_time: data.end_time
            };
        }
    },

    // Adicione outros conversores conforme necessário
};