import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContractMetadata {
    contractDate?: Date;
    startDate?: Date;
    endDate?: Date;
    client?: string;
    contractType?: string;
    status?: string;
    value?: number;
    responsiblePerson?: string;
    category?: string;
}

export interface IContract extends Document {
    _id: mongoose.Types.ObjectId;
    contractNumber?: string;
    title: string;
    pdfPath: string;
    originalFileName: string;
    ocrText?: string;
    description?: string;
    vectorEmbedding?: number[];
    metadata: IContractMetadata;
    aiSummary?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        contractNumber: {
            type: String,
            unique: true,
            required: false,
            sparse: true,
        },
        pdfPath: {
            type: String,
            required: true,
        },
        originalFileName: {
            type: String,
            required: true,
        },
        ocrText: {
            type: String,
        },
        description: {
            type: String,
        },
        vectorEmbedding: {
            type: [Number],
            index: false,
        },
        metadata: {
            contractDate: Date,
            startDate: Date,
            endDate: Date,
            client: String,
            contractType: String,
            status: String,
            value: Number,
            responsiblePerson: String,
            category: String,
        },
        aiSummary: {
            type: String,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

ContractSchema.index({ title: 'text', ocrText: 'text', description: 'text', aiSummary: 'text' });
ContractSchema.index({ 'metadata.client': 1 });
ContractSchema.index({ 'metadata.contractType': 1 });
ContractSchema.index({ 'metadata.status': 1 });
ContractSchema.index({ createdAt: -1 });

const Contract: Model<IContract> = mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;
