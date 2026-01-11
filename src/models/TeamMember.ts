import mongoose, { Schema, Document, Model } from 'mongoose';

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ITeamMember extends Document {
    _id: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: TeamMemberRole;
    joinedAt: Date;
    invitedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
    {
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
        },
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
    {
        timestamps: true,
    }
);

TeamMemberSchema.index({ teamId: 1 });
TeamMemberSchema.index({ userId: 1 });
TeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });
TeamMemberSchema.index({ role: 1 });

const TeamMember: Model<ITeamMember> = mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);

export default TeamMember;
