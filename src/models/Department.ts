import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDepartment extends Document {
    tenantId: mongoose.Types.ObjectId;
    legalEntityId?: mongoose.Types.ObjectId;
    parentId?: mongoose.Types.ObjectId;
    name: string;
    code?: string;
    costCenter?: string;
    managerId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    legalEntityId: { type: Schema.Types.ObjectId, ref: 'LegalEntity' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    costCenter: { type: String, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

DepartmentSchema.index({ tenantId: 1, name: 1 });
DepartmentSchema.index({ tenantId: 1, code: 1 }, { unique: true, sparse: true });
DepartmentSchema.index({ tenantId: 1, legalEntityId: 1, isActive: 1 });

const Department: Model<IDepartment> =
    mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
export default Department;
