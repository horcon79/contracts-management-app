import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILegalEntity extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    shortName?: string;
    taxId?: string;
    registryId?: string;
    address?: Record<string, string>;
    defaultCurrency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const LegalEntitySchema = new Schema<ILegalEntity>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    taxId: { type: String, trim: true },
    registryId: { type: String, trim: true },
    address: { type: Schema.Types.Mixed },
    defaultCurrency: { type: String, default: 'PLN', uppercase: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

LegalEntitySchema.index({ tenantId: 1, name: 1 }, { unique: true });
LegalEntitySchema.index({ tenantId: 1, taxId: 1 }, { unique: true, sparse: true });

const LegalEntity: Model<ILegalEntity> =
    mongoose.models.LegalEntity || mongoose.model<ILegalEntity>('LegalEntity', LegalEntitySchema);
export default LegalEntity;
