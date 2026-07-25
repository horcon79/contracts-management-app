import mongoose, { Document, Model, Schema } from 'mongoose';

export type ContractCaseStatus =
    | 'draft' | 'in-review' | 'awaiting-approval' | 'awaiting-signature'
    | 'active' | 'notice-period' | 'expired' | 'terminated' | 'archived';

export interface IContractCase extends Document {
    tenantId: mongoose.Types.ObjectId;
    legacyContractId?: mongoose.Types.ObjectId;
    caseNumber: string;
    title: string;
    status: ContractCaseStatus;
    contractType?: string;
    category?: string;
    counterpartyIds: mongoose.Types.ObjectId[];
    legalEntityId?: mongoose.Types.ObjectId;
    departmentId?: mongoose.Types.ObjectId;
    ownerId?: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    latestNoticeDate?: Date;
    autoRenewal: boolean;
    currency: string;
    totalContractValue?: number;
    annualValue?: number;
    tags: string[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ContractCaseSchema = new Schema<IContractCase>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    legacyContractId: { type: Schema.Types.ObjectId, ref: 'Contract' },
    caseNumber: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['draft', 'in-review', 'awaiting-approval', 'awaiting-signature', 'active',
            'notice-period', 'expired', 'terminated', 'archived'],
        default: 'draft',
    },
    contractType: String,
    category: String,
    counterpartyIds: [{ type: Schema.Types.ObjectId, ref: 'Counterparty' }],
    legalEntityId: { type: Schema.Types.ObjectId, ref: 'LegalEntity' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    startDate: Date,
    endDate: Date,
    latestNoticeDate: Date,
    autoRenewal: { type: Boolean, default: false },
    currency: { type: String, default: 'PLN', uppercase: true },
    totalContractValue: Number,
    annualValue: Number,
    tags: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, optimisticConcurrency: true });

ContractCaseSchema.index({ tenantId: 1, caseNumber: 1 }, { unique: true });
ContractCaseSchema.index({ tenantId: 1, legacyContractId: 1 }, { unique: true, sparse: true });
ContractCaseSchema.index({ tenantId: 1, status: 1, endDate: 1 });
ContractCaseSchema.index({ tenantId: 1, ownerId: 1, status: 1 });
ContractCaseSchema.index({ tenantId: 1, counterpartyIds: 1 });
ContractCaseSchema.index({ tenantId: 1, title: 'text', caseNumber: 'text' });

const ContractCase: Model<IContractCase> =
    mongoose.models.ContractCase || mongoose.model<IContractCase>('ContractCase', ContractCaseSchema);
export default ContractCase;
