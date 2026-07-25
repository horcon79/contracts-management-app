import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDocumentVersion extends Document {
    tenantId: mongoose.Types.ObjectId;
    documentId: mongoose.Types.ObjectId;
    version: number;
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes?: number;
    sha256?: string;
    pageCount?: number;
    language?: string;
    extractedText?: string;
    parsedContent?: Record<string, unknown>;
    parser: { name?: string; version?: string; processedAt?: Date };
    encryption?: { keyId?: string; algorithm?: string };
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersion>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'ContractDocument', required: true },
    version: { type: Number, required: true, min: 1 },
    storageKey: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    sizeBytes: Number,
    sha256: String,
    pageCount: Number,
    language: String,
    extractedText: String,
    parsedContent: { type: Schema.Types.Mixed },
    parser: { name: String, version: String, processedAt: Date },
    encryption: { keyId: String, algorithm: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, optimisticConcurrency: true });

DocumentVersionSchema.index({ tenantId: 1, documentId: 1, version: 1 }, { unique: true });
DocumentVersionSchema.index({ tenantId: 1, sha256: 1 }, { sparse: true });
DocumentVersionSchema.index({ tenantId: 1, createdAt: -1 });

const DocumentVersion: Model<IDocumentVersion> =
    mongoose.models.DocumentVersion || mongoose.model<IDocumentVersion>('DocumentVersion', DocumentVersionSchema);
export default DocumentVersion;
