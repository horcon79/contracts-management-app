import mongoose, { Schema, Document, Model } from 'mongoose';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ITeamMember {
    userId: mongoose.Types.ObjectId;
    role: TeamRole;
    joinedAt: Date;
    invitedBy: mongoose.Types.ObjectId;
}

export interface ITeam extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    ownerId: mongoose.Types.ObjectId;
    members: ITeamMember[];
    allowedContractTypes: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'viewer'],
            default: 'member',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { _id: false }
);

const TeamSchema = new Schema<ITeam>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [TeamMemberSchema],
        allowedContractTypes: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

TeamSchema.index({ ownerId: 1 });
TeamSchema.index({ 'members.userId': 1 });
TeamSchema.index({ isActive: 1 });
TeamSchema.index({ name: 'text' });

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
