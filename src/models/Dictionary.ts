import mongoose, { Schema, Document, Model } from 'mongoose';

export type DictionaryType = 'clients' | 'types' | 'statuses' | 'persons' | 'categories' | 'fields' | 'companies';
export interface IDictionary extends Document {
    tenantId?: mongoose.Types.ObjectId;
    type: DictionaryType;
    name: string;
    color?: string;
    metadata?: Record<string, string>;
    isActive: boolean;
    order: number;
}

const DictionarySchema = new Schema<IDictionary>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    type: {
        type: String,
        enum: ['clients', 'types', 'statuses', 'persons', 'categories', 'fields', 'companies'],
        required: true,
    },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6B7280' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
}, { timestamps: true, optimisticConcurrency: true });

DictionarySchema.index({ tenantId: 1, type: 1, isActive: 1, order: 1 });
DictionarySchema.index({ tenantId: 1, type: 1, name: 1 }, { unique: true });

const Dictionary: Model<IDictionary> =
    mongoose.models.Dictionary || mongoose.model<IDictionary>('Dictionary', DictionarySchema);
export default Dictionary;
