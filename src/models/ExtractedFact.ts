import mongoose, { Document, Model, Schema } from 'mongoose';

export type FactReviewStatus = 'unreviewed' | 'accepted' | 'corrected' | 'rejected';

export interface IExtractedFact extends Document {
    tenantId: mongoose.Types.ObjectId;
    contractCaseId: mongoose.Types.ObjectId;
    documentVersionId: mongoose.Types.ObjectId;
    schemaVersion: string;
    path: string;
    value: unknown;
    normalizedValue?: unknown;
    confidence?: number;
    evidence: Array<{
        page: number;
        quote?: string;
        bbox?: number[];
        confidence?: number;
    }>;
    extraction: { model: string; modelVersion?: string; promptVersion?: string; extractedAt: Date };
    reviewStatus: FactReviewStatus;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    correctionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const EvidenceSchema = new Schema({
    page: { type: Number, required: true, min: 1 },
    quote: String,
    bbox: { type: [Number], validate: [(v: number[]) => !v || v.length === 4 || v.length === 8, 'bbox must have 4 or 8 values'] },
    confidence: { type: Number, min: 0, max: 1 },
}, { _id: false });

const ExtractedFactSchema = new Schema<IExtractedFact>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    contractCaseId: { type: Schema.Types.ObjectId, ref: 'ContractCase', required: true },
    documentVersionId: { type: Schema.Types.ObjectId, ref: 'DocumentVersion', required: true },
    schemaVersion: { type: String, required: true },
    path: { type: String, required: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    normalizedValue: { type: Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1 },
    evidence: { type: [EvidenceSchema], default: [] },
    extraction: {
        model: { type: String, required: true },
        modelVersion: String,
        promptVersion: String,
        extractedAt: { type: Date, default: Date.now },
    },
    reviewStatus: {
        type: String,
        enum: ['unreviewed', 'accepted', 'corrected', 'rejected'],
        default: 'unreviewed',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    correctionReason: String,
}, { timestamps: true, optimisticConcurrency: true });

ExtractedFactSchema.index(
    { tenantId: 1, documentVersionId: 1, schemaVersion: 1, path: 1 },
    { unique: true },
);
ExtractedFactSchema.index({ tenantId: 1, contractCaseId: 1, reviewStatus: 1 });
ExtractedFactSchema.index({ tenantId: 1, confidence: 1, reviewStatus: 1 });

const ExtractedFact: Model<IExtractedFact> =
    mongoose.models.ExtractedFact || mongoose.model<IExtractedFact>('ExtractedFact', ExtractedFactSchema);
export default ExtractedFact;
