import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
    contractId: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    parentId?: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    authorName: string;
    content: string;
    mentions: mongoose.Types.ObjectId[];
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
    {
        contractId: {
            type: Schema.Types.ObjectId,
            ref: 'Contract',
            required: true,
            index: true,
        },
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
        },
        authorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        authorName: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        mentions: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        isEdited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indeksy dla efektywnych zapytań
CommentSchema.index({ contractId: 1, createdAt: -1 }); // Główny filtr komentarzy dla umowy
CommentSchema.index({ parentId: 1, createdAt: 1 }); // Odpowiedzi w wątku
CommentSchema.index({ mentions: 1 }); // Powiadomienia o @wzmiankach
CommentSchema.index({ authorId: 1, createdAt: -1 }); // Historia komentarzy użytkownika
CommentSchema.index({ teamId: 1, createdAt: -1 }); // Filtrowanie po zespole

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
