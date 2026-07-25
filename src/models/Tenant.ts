import mongoose, { Document, Model, Schema } from 'mongoose';

export type TenantPlan = 'starter' | 'business' | 'professional' | 'private' | 'on-premise';
export type TenantStatus = 'active' | 'suspended' | 'archived';

export interface ITenant extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    status: TenantStatus;
    plan: TenantPlan;
    defaultCurrency: string;
    locale: string;
    timeZone: string;
    dataRegion: string;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'suspended', 'archived'], default: 'active' },
    plan: { type: String, enum: ['starter', 'business', 'professional', 'private', 'on-premise'], default: 'business' },
    defaultCurrency: { type: String, default: 'PLN', uppercase: true },
    locale: { type: String, default: 'pl-PL' },
    timeZone: { type: String, default: 'Europe/Warsaw' },
    dataRegion: { type: String, default: 'eu' },
    settings: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ status: 1 });

const Tenant: Model<ITenant> = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
export default Tenant;
