import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditEvent extends Document {
    tenantId: mongoose.Types.ObjectId;
    actorId?: mongoose.Types.ObjectId;
    actorType: 'user' | 'system' | 'api' | 'ai';
    action: string;
    entityType: string;
    entityId?: mongoose.Types.ObjectId;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
    occurredAt: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorType: { type: String, enum: ['user', 'system', 'api', 'ai'], required: true },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: Schema.Types.ObjectId,
    correlationId: String,
    ipAddress: String,
    userAgent: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed,
    occurredAt: { type: Date, default: Date.now, immutable: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
});

AuditEventSchema.index({ tenantId: 1, occurredAt: -1 });
AuditEventSchema.index({ tenantId: 1, entityType: 1, entityId: 1, occurredAt: -1 });
AuditEventSchema.index({ tenantId: 1, actorId: 1, occurredAt: -1 });
AuditEventSchema.index({ tenantId: 1, correlationId: 1 }, { sparse: true });

const AuditEvent: Model<IAuditEvent> =
    mongoose.models.AuditEvent || mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
export default AuditEvent;
