import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Typy powiadomień w systemie
 */
export type NotificationType =
    | 'comment_added'
    | 'comment_mention'
    | 'assignment_received'
    | 'assignment_changed'
    | 'status_changed'
    | 'contract_shared'
    | 'team_invitation'
    | 'due_date_reminder';

/**
 * Typy encji, do których odnosi się powiadomienie
 */
export type RelatedEntityType = 'contract' | 'comment' | 'team' | 'mention' | 'assignment';

/**
 * Interfejs powiadomienia
 */
export interface INotification extends Document {
    userId: mongoose.Types.ObjectId; // Odbiorca powiadomienia
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType: RelatedEntityType;
    relatedEntityId: mongoose.Types.ObjectId;
    contractId?: mongoose.Types.ObjectId; // Dla szybkiego dostępu
    isRead: boolean;
    readAt?: Date;
    isEmailSent: boolean;
    emailSentAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                'comment_added',
                'comment_mention',
                'assignment_received',
                'assignment_changed',
                'status_changed',
                'contract_shared',
                'team_invitation',
                'due_date_reminder',
            ] as NotificationType[],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        relatedEntityType: {
            type: String,
            enum: ['contract', 'comment', 'team', 'mention', 'assignment'] as RelatedEntityType[],
            required: true,
        },
        relatedEntityId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        contractId: {
            type: Schema.Types.ObjectId,
            ref: 'Contract',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        isEmailSent: {
            type: Boolean,
            default: false,
        },
        emailSentAt: {
            type: Date,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indeksy dla efektywnych zapytań
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // Główny filtr dla panelu powiadomień
NotificationSchema.index({ userId: 1, createdAt: -1 }); // Sortowanie powiadomień użytkownika
NotificationSchema.index({ contractId: 1 }); // Filtrowanie powiadomień po umowie
NotificationSchema.index({ relatedEntityId: 1 }); // Link do encji

const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
