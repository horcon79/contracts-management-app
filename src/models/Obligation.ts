import mongoose, { Document, Model, Schema } from 'mongoose';

export type ObligationStatus = 'planned' | 'due' | 'completed' | 'waived' | 'overdue' | 'cancelled';

export interface IObligation extends Document {
    tenantId: mongoose.Types.ObjectId;
    contractCaseId: mongoose.Types.ObjectId;
    sourceFactId?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    responsibleParty: 'our-organization' | 'counterparty' | 'both' | 'unknown';
    ownerId?: mongoose.Types.ObjectId;
    dueDate?: Date;
    recurrence?: Record<string, unknown>;
    status: ObligationStatus;
    evidenceDocumentVersionId?: mongoose.Types.ObjectId;
    evidencePage?: number;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ObligationSchema = new Schema<IObligation>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    contractCaseId: { type: Schema.Types.ObjectId, ref: 'ContractCase', required: true },
    sourceFactId: { type: Schema.Types.ObjectId, ref: 'ExtractedFact' },
    title: { type: String, required: true, trim: true },
    description: String,
    responsibleParty: {
        type: String,
        enum: ['our-organization', 'counterparty', 'both', 'unknown'],
        default: 'unknown',
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate: Date,
    recurrence: { type: Schema.Types.Mixed },
    status: {
        type: String,
        enum: ['planned', 'due', 'completed', 'waived', 'overdue', 'cancelled'],
        default: 'planned',
    },
    evidenceDocumentVersionId: { type: Schema.Types.ObjectId, ref: 'DocumentVersion' },
    evidencePage: { type: Number, min: 1 },
    completedAt: Date,
}, { timestamps: true, optimisticConcurrency: true });

ObligationSchema.index({ tenantId: 1, contractCaseId: 1, status: 1 });
ObligationSchema.index({ tenantId: 1, ownerId: 1, dueDate: 1, status: 1 });
ObligationSchema.index({ tenantId: 1, dueDate: 1, status: 1 });

const Obligation: Model<IObligation> =
    mongoose.models.Obligation || mongoose.model<IObligation>('Obligation', ObligationSchema);
export default Obligation;
