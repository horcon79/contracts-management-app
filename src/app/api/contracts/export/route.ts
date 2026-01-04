import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const client = searchParams.get('client');

        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { originalFileName: { $regex: search, $options: 'i' } },
                { ocrText: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { aiSummary: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query['metadata.status'] = status;
        }
        if (client) {
            query['metadata.client'] = client;
        }

        const contracts = await Contract.find(query).sort({ createdAt: -1 });

        // Generate CSV
        const headers = ['Numer Umowy', 'Tytul', 'Nazwa Pliku', 'Klient', 'Typ', 'Status', 'Wartosc', 'Data Zawarcia', 'Data Utworzenia'];
        const csvRows = [headers.join(',')];

        for (const contract of contracts) {
            const row = [
                `"${(contract.contractNumber || '').replace(/"/g, '""')}"`,
                `"${(contract.title || '').replace(/"/g, '""')}"`,
                `"${(contract.originalFileName || '').replace(/"/g, '""')}"`,
                `"${(contract.metadata?.client || '').replace(/"/g, '""')}"`,
                `"${(contract.metadata?.contractType || '').replace(/"/g, '""')}"`,
                `"${(contract.metadata?.status || '').replace(/"/g, '""')}"`,
                `"${(contract.metadata?.value || '').toString().replace(/"/g, '""')}"`,
                `"${(contract.metadata?.contractDate ? new Date(contract.metadata.contractDate).toISOString().split('T')[0] : '')}"`,
                `"${new Date(contract.createdAt).toISOString().split('T')[0]}"`
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel utf-8 support

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="umowy_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Error exporting contracts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
