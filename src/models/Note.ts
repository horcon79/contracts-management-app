import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
    _id: mongoose.Types.ObjectId;
    contractId: mongoose.Types.ObjectId;
    content: string;
    authorId: mongoose.Types.ObjectId;
    authorName: string;
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
    {
        contractId: {
            type: Schema.Types.ObjectId,
            ref: 'Contract',
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        authorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        authorName: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

NoteSchema.index({ contractId: 1, createdAt: -1 });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;
