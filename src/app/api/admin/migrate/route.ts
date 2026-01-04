import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Find contracts without number
        const contracts = await Contract.find({
            $or: [
                { contractNumber: { $exists: false } },
                { contractNumber: null }
            ]
        }).sort({ createdAt: 1 });

        let updated = 0;

        for (const contract of contracts) {
            const date = new Date(contract.createdAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');

            // Count for that month (excluding current one to avoid counting itself potentially)
            const startOfMonth = new Date(year, date.getMonth(), 1);
            const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59, 999);

            // We need to count how many contracts existed BEFORE this one in that month
            // to re-construct the sequence correctly.
            const count = await Contract.countDocuments({
                createdAt: { $gte: startOfMonth, $lt: contract.createdAt },
                _id: { $ne: contract._id } // explicitly exclude self
            });

            const sequence = String(count + 1).padStart(3, '0');
            const contractNumber = `UM/${year}/${month}/${sequence}`;

            contract.contractNumber = contractNumber;

            // Use updateOne to avoid validation errors on other fields if any
            await Contract.updateOne(
                { _id: contract._id },
                { $set: { contractNumber: contractNumber } }
            );
            updated++;
        }

        return NextResponse.json({
            message: `Migrated ${updated} contracts`,
            updated
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
