import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { id } = await params;
        const contract = await Contract.findById(id).populate('createdBy', 'name email');

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role === 'read') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const { id } = await params;
        const body = await request.json();
        const { title, metadata, ocrText, aiSummary, description } = body;

        const contract = await Contract.findByIdAndUpdate(
            id,
            { title, metadata, ocrText, aiSummary, description },
            { new: true, runValidators: true }
        );

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error('Error updating contract:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const { id } = await params;
        const contract = await Contract.findByIdAndDelete(id);

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Contract deleted successfully' });
    } catch (error) {
        console.error('Error deleting contract:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
