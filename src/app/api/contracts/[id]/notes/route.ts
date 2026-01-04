import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Note from '@/models/Note';

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
        const notes = await Note.find({ contractId: id }).sort({ createdAt: -1 });

        return NextResponse.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
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
        const { content } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const note = await Note.create({
            contractId: id,
            content,
            authorId: session.user.id,
            authorName: session.user.name || 'Unknown',
        });

        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
