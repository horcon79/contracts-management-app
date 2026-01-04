import mongoose, { Schema, Document, Model } from 'mongoose';

export type DictionaryType = 'clients' | 'types' | 'statuses' | 'persons' | 'categories' | 'fields' | 'companies';

export interface IDictionary extends Document {
    _id: mongoose.Types.ObjectId;
    type: DictionaryType;
    name: string;
    color?: string;
    metadata?: Record<string, string>;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const DictionarySchema = new Schema<IDictionary>(
    {
        type: {
            type: String,
            enum: ['clients', 'types', 'statuses', 'persons', 'categories', 'fields', 'companies'],
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        color: {
            type: String,
            default: '#6B7280',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        metadata: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

DictionarySchema.index({ type: 1, isActive: 1 });
DictionarySchema.index({ type: 1, name: 1 }, { unique: true });

const Dictionary: Model<IDictionary> = mongoose.models.Dictionary || mongoose.model<IDictionary>('Dictionary', DictionarySchema);

export default Dictionary;
