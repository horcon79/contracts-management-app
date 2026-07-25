import mongoose from 'mongoose';
import Tenant from '../src/models/Tenant';
import ContractCase from '../src/models/ContractCase';
import ContractDocument from '../src/models/ContractDocument';
import DocumentVersion from '../src/models/DocumentVersion';

const MONGODB_URI = process.env.MONGODB_URI;
const TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'default';
const TENANT_NAME = process.env.DEFAULT_TENANT_NAME || 'Default organization';
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is required');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');

    const tenant = await Tenant.findOne({ slug: TENANT_SLUG }) ||
        await Tenant.create({ name: TENANT_NAME, slug: TENANT_SLUG });

    const tenantScopedCollections = [
        'users', 'teams', 'contracts', 'notes', 'dictionaries',
        'notifications', 'settings',
    ];

    for (const name of tenantScopedCollections) {
        const count = await db.collection(name).countDocuments({ tenantId: { $exists: false } });
        console.log(`${name}: ${count} records without tenantId`);
        if (!DRY_RUN && count) {
            await db.collection(name).updateMany(
                { tenantId: { $exists: false } },
                { $set: { tenantId: tenant._id, updatedAt: new Date() } },
            );
        }
    }

    const contracts = db.collection('contracts');
    const cursor = contracts.find({ tenantId: tenant._id });
    let migrated = 0;

    for await (const legacy of cursor) {
        const existing = await ContractCase.findOne({
            tenantId: tenant._id,
            legacyContractId: legacy._id,
        });
        if (existing || DRY_RUN) continue;

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const caseNumber = legacy.contractNumber || `LEGACY-${legacy._id}`;
                const [contractCase] = await ContractCase.create([{
                    tenantId: tenant._id,
                    legacyContractId: legacy._id,
                    caseNumber,
                    title: legacy.title,
                    status: mapStatus(legacy.metadata?.status),
                    contractType: legacy.metadata?.contractType,
                    category: legacy.metadata?.category,
                    ownerId: legacy.assigneeId,
                    teamId: legacy.teamId,
                    startDate: legacy.metadata?.startDate,
                    endDate: legacy.metadata?.endDate,
                    totalContractValue: legacy.metadata?.value,
                    currency: 'PLN',
                    createdBy: legacy.createdBy,
                }], { session });

                const [document] = await ContractDocument.create([{
                    tenantId: tenant._id,
                    contractCaseId: contractCase._id,
                    legacyContractId: legacy._id,
                    type: 'contract',
                    title: legacy.title,
                    currentVersion: 1,
                    isPrimary: true,
                    processingStatus: legacy.ocrText ? 'completed' : 'pending',
                    createdBy: legacy.createdBy,
                }], { session });

                await DocumentVersion.create([{
                    tenantId: tenant._id,
                    documentId: document._id,
                    version: 1,
                    storageKey: legacy.pdfPath,
                    originalFileName: legacy.originalFileName,
                    mimeType: 'application/pdf',
                    extractedText: legacy.ocrText,
                    parsedContent: legacy.aiSummary ? { legacySummary: legacy.aiSummary } : undefined,
                    parser: legacy.ocrText ? { name: 'legacy-import', version: '1', processedAt: legacy.updatedAt } : {},
                    createdBy: legacy.createdBy,
                }], { session });

                await contracts.updateOne(
                    { _id: legacy._id },
                    { $set: { contractCaseId: contractCase._id, primaryDocumentId: document._id, phase0MigratedAt: new Date() } },
                    { session },
                );
            });
            migrated += 1;
        } finally {
            await session.endSession();
        }
    }

    console.log(JSON.stringify({
        dryRun: DRY_RUN,
        tenantId: tenant._id.toString(),
        tenantSlug: tenant.slug,
        migratedContracts: migrated,
    }, null, 2));
}

function mapStatus(status?: string) {
    const value = status?.toLowerCase();
    if (value?.includes('aktyw')) return 'active';
    if (value?.includes('wygas')) return 'expired';
    if (value?.includes('anul') || value?.includes('rozwią')) return 'terminated';
    return 'draft';
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
