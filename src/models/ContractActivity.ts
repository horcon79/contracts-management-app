import mongoose, { Schema, Document, Model } from 'mongoose';

export type ContractAction =
    | 'created'
    | 'updated'
    | 'viewed'
    | 'downloaded'
    | 'signed'
    | 'note_added'
    | 'status_changed'
    | 'assigned'
    | 'ocr_completed'
    | 'comment_added'
    | 'member_added'
    | 'member_removed'
    | 'role_changed';

export interface IContractActivityDetails {
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    reason?: string;
}

export interface IContractActivity extends Document {
    _id: mongoose.Types.ObjectId;
    contractId: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    action: ContractAction;
    details?: IContractActivityDetails;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const ContractActivitySchema = new Schema<IContractActivity>(
    {
        contractId: {
            type: Schema.Types.ObjectId,
            ref: 'Contract',
            required: true,
        },
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            enum: [
                'created',
                'updated',
                'viewed',
                'downloaded',
                'signed',
                'note_added',
                'status_changed',
                'assigned',
                'ocr_completed',
                'comment_added',
                'member_added',
                'member_removed',
                'role_changed',
            ],
            required: true,
        },
        details: {
            field: String,
            oldValue: Schema.Types.Mixed,
            newValue: Schema.Types.Mixed,
            reason: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indeksy dla efektywnych zapytań
ContractActivitySchema.index({ contractId: 1, createdAt: -1 });
ContractActivitySchema.index({ teamId: 1, createdAt: -1 });
ContractActivitySchema.index({ userId: 1, createdAt: -1 });
ContractActivitySchema.index({ action: 1 });

const ContractActivity: Model<IContractActivity> =
    mongoose.models.ContractActivity ||
    mongoose.model<IContractActivity>('ContractActivity', ContractActivitySchema);

export default ContractActivity;
