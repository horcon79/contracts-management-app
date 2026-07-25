import mongoose, { Document, Model, Schema } from 'mongoose';

export type CounterpartyType = 'company' | 'person' | 'public-entity' | 'other';

export interface ICounterparty extends Document {
    tenantId: mongoose.Types.ObjectId;
    type: CounterpartyType;
    name: string;
    normalizedName: string;
    taxId?: string;
    registryId?: string;
    address?: Record<string, string>;
    contacts: Array<Record<string, unknown>>;
    risk: { level: 'unknown' | 'low' | 'medium' | 'high'; notes?: string };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CounterpartySchema = new Schema<ICounterparty>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    type: { type: String, enum: ['company', 'person', 'public-entity', 'other'], default: 'company' },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true, lowercase: true },
    taxId: { type: String, trim: true },
    registryId: { type: String, trim: true },
    address: { type: Schema.Types.Mixed },
    contacts: { type: [Schema.Types.Mixed], default: [] },
    risk: {
        level: { type: String, enum: ['unknown', 'low', 'medium', 'high'], default: 'unknown' },
        notes: String,
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

CounterpartySchema.index({ tenantId: 1, normalizedName: 1 });
CounterpartySchema.index({ tenantId: 1, taxId: 1 }, { unique: true, sparse: true });
CounterpartySchema.index({ tenantId: 1, registryId: 1 }, { sparse: true });

const Counterparty: Model<ICounterparty> =
    mongoose.models.Counterparty || mongoose.model<ICounterparty>('Counterparty', CounterpartySchema);
export default Counterparty;
