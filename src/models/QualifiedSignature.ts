import mongoose, { Schema, Document, Model } from 'mongoose';

export type SignatureStatus =
    | 'pending'
    | 'signature_in_progress'
    | 'signed'
    | 'verification_pending'
    | 'verified'
    | 'verification_failed'
    | 'expired'
    | 'revoked';

export interface ISignatureCertificate {
    issuer: string;
    serialNumber: string;
    subject: string;
    validFrom: Date;
    validTo: Date;
    algorithm: string;
    keyUsage: string[];
}

export interface IQualifiedSignature extends Document {
    _id: mongoose.Types.ObjectId;
    contractId: mongoose.Types.ObjectId;
    signerId?: mongoose.Types.ObjectId;
    signerEmail: string;
    signerName: string;
    signatureStatus: SignatureStatus;
    signatureAlgorithm: string;
    certificate: ISignatureCertificate;
    signatureValue: string;
    signedAt?: Date;
    signatureDeadline?: Date;
    ocspResponse?: string;
    timestampToken?: string;
    signatureFieldPosition?: {
        page: number;
        x: number;
        y: number;
        width: number;
        height: number;
    };
    metadata?: Record<string, unknown>;
    verificationResult?: {
        isValid: boolean;
        verifiedAt: Date;
        ocspStatus: string;
        certificateStatus: string;
        chainStatus: string;
        errors?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const SignatureCertificateSchema = new Schema<ISignatureCertificate>({
    issuer: { type: String, required: true },
    serialNumber: { type: String, required: true },
    subject: { type: String, required: true },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    algorithm: { type: String, required: true },
    keyUsage: [{ type: String }],
});

const QualifiedSignatureSchema = new Schema<IQualifiedSignature>(
    {
        contractId: {
            type: Schema.Types.ObjectId,
            ref: 'Contract',
            required: true,
            index: true,
        },
        signerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        signerEmail: {
            type: String,
            required: true,
            index: true,
        },
        signerName: {
            type: String,
            required: true,
        },
        signatureStatus: {
            type: String,
            enum: [
                'pending',
                'signature_in_progress',
                'signed',
                'verification_pending',
                'verified',
                'verification_failed',
                'expired',
                'revoked',
            ],
            default: 'pending',
            index: true,
        },
        signatureAlgorithm: {
            type: String,
            required: true,
        },
        certificate: {
            type: SignatureCertificateSchema,
            required: true,
        },
        signatureValue: {
            type: String,
            required: true,
        },
        signedAt: {
            type: Date,
            index: true,
        },
        signatureDeadline: {
            type: Date,
        },
        ocspResponse: {
            type: String,
        },
        timestampToken: {
            type: String,
        },
        signatureFieldPosition: {
            page: Number,
            x: Number,
            y: Number,
            width: Number,
            height: Number,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        verificationResult: {
            isValid: Boolean,
            verifiedAt: Date,
            ocspStatus: String,
            certificateStatus: String,
            chainStatus: String,
            errors: [String],
        },
    },
    {
        timestamps: true,
    }
);

// Indeksy
QualifiedSignatureSchema.index({ contractId: 1, signedAt: -1 });
QualifiedSignatureSchema.index({ signerEmail: 1 });
QualifiedSignatureSchema.index({ signatureStatus: 1 });

const QualifiedSignature: Model<IQualifiedSignature> =
    mongoose.models.QualifiedSignature ||
    mongoose.model<IQualifiedSignature>('QualifiedSignature', QualifiedSignatureSchema);

export default QualifiedSignature;
