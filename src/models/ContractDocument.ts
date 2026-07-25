import mongoose, { Document, Model, Schema } from 'mongoose';

export type DocumentType =
    | 'contract' | 'annex' | 'terms' | 'price-list' | 'order'
    | 'power-of-attorney' | 'termination' | 'protocol' | 'correspondence' | 'other';
export type ProcessingStatus = 'pending' | 'processing' | 'needs-review' | 'completed' | 'failed';

export interface IContractDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    contractCaseId: mongoose.Types.ObjectId;
    legacyContractId?: mongoose.Types.ObjectId;
    type: DocumentType;
    title: string;
    currentVersion: number;
    isPrimary: boolean;
    effectiveDate?: Date;
    supersedesDocumentId?: mongoose.Types.ObjectId;
    processingStatus: ProcessingStatus;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ContractDocumentSchema = new Schema<IContractDocument>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    contractCaseId: { type: Schema.Types.ObjectId, ref: 'ContractCase', required: true },
    legacyContractId: { type: Schema.Types.ObjectId, ref: 'Contract' },
    type: {
        type: String,
        enum: ['contract', 'annex', 'terms', 'price-list', 'order', 'power-of-attorney',
            'termination', 'protocol', 'correspondence', 'other'],
        default: 'contract',
    },
    title: { type: String, required: true, trim: true },
    currentVersion: { type: Number, min: 1, default: 1 },
    isPrimary: { type: Boolean, default: false },
    effectiveDate: Date,
    supersedesDocumentId: { type: Schema.Types.ObjectId, ref: 'ContractDocument' },
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'needs-review', 'completed', 'failed'],
        default: 'pending',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, optimisticConcurrency: true });

ContractDocumentSchema.index({ tenantId: 1, contractCaseId: 1, createdAt: -1 });
ContractDocumentSchema.index({ tenantId: 1, legacyContractId: 1 }, { unique: true, sparse: true });
ContractDocumentSchema.index({ tenantId: 1, processingStatus: 1 });

const ContractDocument: Model<IContractDocument> =
    mongoose.models.ContractDocument || mongoose.model<IContractDocument>('ContractDocument', ContractDocumentSchema);
export default ContractDocument;
