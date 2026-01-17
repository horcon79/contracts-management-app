import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import Contract from '@/models/Contract';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AzureSyncService } from '@/lib/azure-sync';

// GET /api/admin/users - Pobiera listę użytkowników z filtrowaniem i paginacją
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const role = searchParams.get('role');
        const isActive = searchParams.get('isActive');
        const azureLinked = searchParams.get('azureLinked');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        if (role) {
            query.role = role;
        }

        if (isActive !== null && isActive !== '') {
            query.isActive = isActive === 'true';
        }

        if (azureLinked !== null && azureLinked !== '') {
            if (azureLinked === 'true') {
                query.azureAdId = { $exists: true, $ne: null };
            } else {
                query.azureAdId = { $exists: false };
            }
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -azureAdToken -azureAdRefreshToken')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(query),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/users - Tworzy nowego użytkownika
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await request.json();
        const { email, name, password, role, isActive } = body;

        if (!email || !name || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            name,
            password: hashedPassword,
            role,
            isActive: isActive !== false,
        });

        const { password: _, ...userWithoutPassword } = user.toObject();
        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/users/sync-azure - Synchronizuje użytkowników z grupą Azure AD
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await request.json();
        const { groupId } = body;

        if (!groupId) {
            return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
        }

        const accessToken = (session as any).accessToken;
        if (!accessToken) {
            return NextResponse.json(
                { error: 'Azure AD access token not available' },
                { status: 400 }
            );
        }

        const result = await AzureSyncService.syncGroupMembers(accessToken, groupId);

        return NextResponse.json({
            message: 'Sync completed',
            synced: result.synced,
            errors: result.errors,
            members: result.members,
        });
    } catch (error) {
        console.error('Error syncing Azure AD group:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
