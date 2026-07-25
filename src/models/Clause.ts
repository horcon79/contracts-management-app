import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IClause extends Document {
    tenantId: mongoose.Types.ObjectId;
    contractCaseId: mongoose.Types.ObjectId;
    documentVersionId: mongoose.Types.ObjectId;
    sourceFactId?: mongoose.Types.ObjectId;
    type: string;
    title?: string;
    text?: string;
    normalizedValue?: unknown;
    riskLevel: 'unknown' | 'low' | 'medium' | 'high' | 'critical';
    playbookStatus: 'not-checked' | 'compliant' | 'deviation' | 'prohibited';
    reviewStatus: 'unreviewed' | 'accepted' | 'corrected' | 'rejected';
    page?: number;
    createdAt: Date;
    updatedAt: Date;
}

const ClauseSchema = new Schema<IClause>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    contractCaseId: { type: Schema.Types.ObjectId, ref: 'ContractCase', required: true },
    documentVersionId: { type: Schema.Types.ObjectId, ref: 'DocumentVersion', required: true },
    sourceFactId: { type: Schema.Types.ObjectId, ref: 'ExtractedFact' },
    type: { type: String, required: true, trim: true },
    title: String,
    text: String,
    normalizedValue: { type: Schema.Types.Mixed },
    riskLevel: {
        type: String,
        enum: ['unknown', 'low', 'medium', 'high', 'critical'],
        default: 'unknown',
    },
    playbookStatus: {
        type: String,
        enum: ['not-checked', 'compliant', 'deviation', 'prohibited'],
        default: 'not-checked',
    },
    reviewStatus: {
        type: String,
        enum: ['unreviewed', 'accepted', 'corrected', 'rejected'],
        default: 'unreviewed',
    },
    page: { type: Number, min: 1 },
}, { timestamps: true, optimisticConcurrency: true });

ClauseSchema.index({ tenantId: 1, contractCaseId: 1, type: 1 });
ClauseSchema.index({ tenantId: 1, riskLevel: 1, playbookStatus: 1 });
ClauseSchema.index({ tenantId: 1, documentVersionId: 1, page: 1 });

const Clause: Model<IClause> = mongoose.models.Clause || mongoose.model<IClause>('Clause', ClauseSchema);
export default Clause;
