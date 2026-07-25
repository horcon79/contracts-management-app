import mongoose, { Schema, Document, Model } from 'mongoose';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export interface ITeamMember {
    userId: mongoose.Types.ObjectId;
    role: TeamRole;
    joinedAt: Date;
    invitedBy: mongoose.Types.ObjectId;
}
export interface ITeam extends Document {
    tenantId?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    ownerId: mongoose.Types.ObjectId;
    members: ITeamMember[];
    allowedContractTypes: string[];
    isActive: boolean;
    azureAdGroupId?: string;
    autoAssignEnabled: boolean;
    defaultRole: TeamRole;
}

const TeamMemberSchema = new Schema<ITeamMember>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: false });

const TeamSchema = new Schema<ITeam>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    name: { type: String, required: true, trim: true },
    description: String,
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [TeamMemberSchema], default: [] },
    allowedContractTypes: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    azureAdGroupId: { type: String, sparse: true },
    autoAssignEnabled: { type: Boolean, default: false },
    defaultRole: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
}, { timestamps: true, optimisticConcurrency: true });

TeamSchema.index({ tenantId: 1, name: 1 }, { unique: true });
TeamSchema.index({ tenantId: 1, ownerId: 1 });
TeamSchema.index({ tenantId: 1, 'members.userId': 1 });
TeamSchema.index({ tenantId: 1, azureAdGroupId: 1 }, { unique: true, sparse: true });

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
export default Team;
