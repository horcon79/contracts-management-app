import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Dictionary from '@/models/Dictionary';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const query = type ? { type, isActive: true } : { isActive: true };
        const dictionaries = await Dictionary.find(query).sort({ type: 1, order: 1, name: 1 });

        return NextResponse.json(dictionaries);
    } catch (error) {
        console.error('Error fetching dictionaries:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'admin' && session.user.role !== 'edit') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const body = await request.json();
        const { type, name, color, metadata } = body;

        if (!type || !name) {
            return NextResponse.json({ error: 'Type and name are required' }, { status: 400 });
        }

        const dictionary = await Dictionary.create({
            type,
            name,
            color: color || '#6B7280',
            metadata: metadata || {},
        });

        return NextResponse.json(dictionary, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating dictionary:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            return NextResponse.json({ error: 'This entry already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
