import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'read' | 'edit' | 'admin';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    name: string;
    password?: string;
    role: UserRole;
    adUsername?: string;
    isActive: boolean;
    // Azure AD fields
    azureAdId?: string;
    azureAdToken?: string;
    azureAdRefreshToken?: string;
    lastAzureSync?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            select: false,
        },
        role: {
            type: String,
            enum: ['read', 'edit', 'admin'],
            default: 'read',
        },
        adUsername: {
            type: String,
            sparse: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Azure AD fields
        azureAdId: {
            type: String,
            sparse: true,
            index: true,
        },
        azureAdToken: {
            type: String,
            select: false,
        },
        azureAdRefreshToken: {
            type: String,
            select: false,
        },
        lastAzureSync: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

UserSchema.index({ azureAdId: 1 });
UserSchema.index({ lastAzureSync: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
