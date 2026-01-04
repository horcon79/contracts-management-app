import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Dictionary from '@/models/Dictionary';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'admin' && session.user.role !== 'edit') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const { id } = await params;
        const body = await request.json();
        const { name, color, isActive, order } = body;

        const dictionary = await Dictionary.findByIdAndUpdate(
            id,
            { name, color, isActive, order },
            { new: true, runValidators: true }
        );

        if (!dictionary) {
            return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
        }

        return NextResponse.json(dictionary);
    } catch (error) {
        console.error('Error updating dictionary:', error);
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

        // Soft delete - just mark as inactive
        const dictionary = await Dictionary.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!dictionary) {
            return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Dictionary deleted successfully' });
    } catch (error) {
        console.error('Error deleting dictionary:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
