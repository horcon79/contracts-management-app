import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssignmentHistoryEntry {
    previousAssigneeId: mongoose.Types.ObjectId;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    reason?: string;
}

export interface IContractMetadata {
    contractDate?: Date;
    startDate?: Date;
    endDate?: Date;
    client?: string;
    company?: string;
    contractType?: string;
    status?: string;
    value?: number;
    responsiblePerson?: string;
    category?: string;
    assignmentHistory?: IAssignmentHistoryEntry[];
}

/**
 * Legacy compatibility model.
 * New domain code should use ContractCase + ContractDocument + DocumentVersion.
 */
export interface IContract extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId?: mongoose.Types.ObjectId;
    contractCaseId?: mongoose.Types.ObjectId;
    primaryDocumentId?: mongoose.Types.ObjectId;
    phase0MigratedAt?: Date;
    contractNumber?: string;
    title: string;
    pdfPath: string;
    originalFileName: string;
    ocrText?: string;
    description?: string;
    vectorEmbedding?: number[];
    metadata: IContractMetadata;
    aiSummary?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    teamId?: mongoose.Types.ObjectId;
    assigneeId?: mongoose.Types.ObjectId;
    signatureDeadline?: Date;
    signatureStatus?: string;
}

const AssignmentHistorySchema = new Schema<IAssignmentHistoryEntry>({
    previousAssigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    reason: String,
}, { _id: false });

const ContractSchema = new Schema<IContract>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    contractCaseId: { type: Schema.Types.ObjectId, ref: 'ContractCase' },
    primaryDocumentId: { type: Schema.Types.ObjectId, ref: 'ContractDocument' },
    phase0MigratedAt: Date,
    title: { type: String, required: true, trim: true },
    contractNumber: { type: String, trim: true },
    pdfPath: { type: String, required: true },
    originalFileName: { type: String, required: true },
    ocrText: String,
    description: String,
    vectorEmbedding: { type: [Number], index: false },
    metadata: {
        contractDate: Date,
        startDate: Date,
        endDate: Date,
        client: String,
        company: String,
        contractType: String,
        status: String,
        value: Number,
        responsiblePerson: String,
        category: String,
        assignmentHistory: { type: [AssignmentHistorySchema], default: [] },
    },
    aiSummary: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    signatureDeadline: Date,
    signatureStatus: String,
}, { timestamps: true, optimisticConcurrency: true });

ContractSchema.index({ tenantId: 1, contractNumber: 1 }, { unique: true, sparse: true });
ContractSchema.index({ tenantId: 1, contractCaseId: 1 }, { sparse: true });
ContractSchema.index({ tenantId: 1, primaryDocumentId: 1 }, { sparse: true });
ContractSchema.index({ tenantId: 1, 'metadata.client': 1 });
ContractSchema.index({ tenantId: 1, 'metadata.contractType': 1 });
ContractSchema.index({ tenantId: 1, 'metadata.status': 1, 'metadata.endDate': 1 });
ContractSchema.index({ tenantId: 1, teamId: 1, assigneeId: 1 });
ContractSchema.index({ title: 'text', ocrText: 'text', description: 'text', aiSummary: 'text' });

const Contract: Model<IContract> = mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);
export default Contract;
