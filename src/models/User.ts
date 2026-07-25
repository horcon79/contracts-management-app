import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'read' | 'edit' | 'admin';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId?: mongoose.Types.ObjectId;
    email: string;
    name: string;
    password?: string;
    role: UserRole;
    departmentId?: mongoose.Types.ObjectId;
    adUsername?: string;
    isActive: boolean;
    azureAdId?: string;
    azureAdToken?: string;
    azureAdRefreshToken?: string;
    lastAzureSync?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['read', 'edit', 'admin'], default: 'read' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    adUsername: { type: String, sparse: true },
    isActive: { type: Boolean, default: true },
    azureAdId: { type: String, sparse: true },
    azureAdToken: { type: String, select: false },
    azureAdRefreshToken: { type: String, select: false },
    lastAzureSync: Date,
}, { timestamps: true, optimisticConcurrency: true });

// During the compatibility window an unscoped legacy user remains unique by email.
// After migration, identity is tenant-scoped and the old global unique index must be removed.
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, azureAdId: 1 }, { unique: true, sparse: true });
UserSchema.index({ tenantId: 1, adUsername: 1 }, { sparse: true });
UserSchema.index({ tenantId: 1, departmentId: 1, isActive: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
