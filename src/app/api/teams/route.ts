import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Team from '@/models/Team';
import mongoose from 'mongoose';
import { AzureSyncService } from '@/lib/azure-sync';

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
        const isActive = searchParams.get('isActive');
        const search = searchParams.get('search');

        const query: Record<string, unknown> = {};

        // Admin widzi wszystkie zespoły, zwykli użytkownicy tylko te, których są członkami
        if (session.user.role !== 'admin') {
            query.$or = [
                { ownerId: session.user.id },
                { 'members.userId': session.user.id },
            ];
        }

        if (isActive !== null && isActive !== '') {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const total = await Team.countDocuments(query);
        const teams = await Team.find(query)
            .populate('ownerId', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return NextResponse.json({
            teams,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
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
        const { name, description, allowedContractTypes, autoAssignEnabled, defaultRole } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const team = await Team.create({
            name,
            description,
            ownerId: new mongoose.Types.ObjectId(session.user.id),
            members: [{
                userId: new mongoose.Types.ObjectId(session.user.id),
                role: 'owner',
                joinedAt: new Date(),
                invitedBy: new mongoose.Types.ObjectId(session.user.id),
            }],
            allowedContractTypes: allowedContractTypes || [],
            autoAssignEnabled: autoAssignEnabled || false,
            defaultRole: defaultRole || 'member',
        });

        return NextResponse.json(team, { status: 201 });
    } catch (error) {
        console.error('Error creating team:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/teams/sync-azure - Synchronizuje członków z Azure AD (admin only)
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await request.json();
        const { teamId, azureAdGroupId } = body;

        if (!teamId || !azureAdGroupId) {
            return NextResponse.json(
                { error: 'teamId and azureAdGroupId are required' },
                { status: 400 }
            );
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Pobierz access token z sesji
        const accessToken = (session as any).accessToken;
        if (!accessToken) {
            return NextResponse.json(
                { error: 'Azure AD access token not available' },
                { status: 400 }
            );
        }

        // Synchronizuj członków z Azure AD
        const result = await AzureSyncService.syncGroupMembers(accessToken, azureAdGroupId);

        // Zapisz ID grupy Azure AD
        team.azureAdGroupId = azureAdGroupId;
        await team.save();

        return NextResponse.json({
            message: 'Azure AD sync completed',
            synced: result.synced,
            errors: result.errors,
            members: result.members,
        });
    } catch (error) {
        console.error('Error syncing Azure AD group:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
