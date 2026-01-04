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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
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

        const total = await Contract.countDocuments(query);
        const contracts = await Contract.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('createdBy', 'name email');

        return NextResponse.json({
            contracts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role === 'read') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const body = await request.json();
        const { title, pdfPath, originalFileName, metadata } = body;

        if (!title || !pdfPath || !originalFileName) {
            return NextResponse.json(
                { error: 'Title, pdfPath and originalFileName are required' },
                { status: 400 }
            );
        }

        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        // Count contracts created this month to generate sequence number
        const startOfMonth = new Date(year, date.getMonth(), 1);
        const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59, 999);

        const count = await Contract.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const sequence = String(count + 1).padStart(3, '0');
        const contractNumber = `UM/${year}/${month}/${sequence}`;

        const contract = await Contract.create({
            title,
            contractNumber,
            pdfPath,
            originalFileName,
            metadata: metadata || {},
            createdBy: session.user.id,
        });

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        console.error('Error creating contract:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
