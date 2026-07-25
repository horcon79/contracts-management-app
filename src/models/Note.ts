import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
    tenantId?: mongoose.Types.ObjectId;
    contractId: mongoose.Types.ObjectId;
    contractCaseId?: mongoose.Types.ObjectId;
    content: string;
    authorId: mongoose.Types.ObjectId;
    authorName: string;
}

const NoteSchema = new Schema<INote>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    contractCaseId: { type: Schema.Types.ObjectId, ref: 'ContractCase' },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
}, { timestamps: true, optimisticConcurrency: true });

NoteSchema.index({ tenantId: 1, contractId: 1, createdAt: -1 });
NoteSchema.index({ tenantId: 1, contractCaseId: 1, createdAt: -1 }, { sparse: true });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
export default Note;
