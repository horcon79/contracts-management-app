import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import mongoose from 'mongoose';

type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

// Helper function to check if user has permission to manage members
function canManageMembers(role: TeamRole | undefined): boolean {
    return role === 'owner' || role === 'admin';
}

// Helper function to find member in team
function findMember(members: Array<{ userId: { toString: () => string }; role: TeamRole }>, userId: string) {
    return members.find(m => m.userId.toString() === userId);
}

// GET /api/teams/[id]/members - Pobiera listę członków zespołu
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
        const team = await Team.findById(id);

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Sprawdź czy użytkownik jest członkiem zespołu
        const member = findMember(team.members, session.user.id);
        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Pobierz dane użytkowników
        const userIds = team.members.map(m => m.userId);
        const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();

        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const membersWithUserData = team.members.map(member => {
            const userData = userMap.get(member.userId.toString());
            return {
                userId: member.userId,
                name: userData?.name || 'Unknown',
                email: userData?.email || 'Unknown',
                role: member.role,
                joinedAt: member.joinedAt,
                invitedBy: member.invitedBy,
            };
        });

        return NextResponse.json({ members: membersWithUserData });
    } catch (error) {
        console.error('Error fetching team members:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/teams/[id]/members - Dodaje członka do zespołu
export async function POST(
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
        const body = await request.json();
        const { userId, email, role } = body;

        if (!role) {
            return NextResponse.json({ error: 'Role is required' }, { status: 400 });
        }

        if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const team = await Team.findById(id);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Sprawdź uprawnienia
        const currentMember = findMember(team.members, session.user.id);
        if (!currentMember || !canManageMembers(currentMember.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Znajdź użytkownika po userId lub email
        let targetUserId = userId;
        if (!targetUserId && email) {
            const user = await User.findOne({ email }).select('_id');
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            targetUserId = user._id.toString();
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
        }

        // Sprawdź czy użytkownik już jest członkiem
        const existingMember = findMember(team.members, targetUserId);
        if (existingMember) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }

        // Dodaj członka
        team.members.push({
            userId: new mongoose.Types.ObjectId(targetUserId),
            role: role as TeamRole,
            joinedAt: new Date(),
            invitedBy: new mongoose.Types.ObjectId(session.user.id),
        });

        await team.save();

        // Pobierz dane dodanego użytkownika
        const user = await User.findById(targetUserId).select('name email').lean();

        return NextResponse.json({
            message: 'Member added successfully',
            member: {
                userId: targetUserId,
                name: user?.name || 'Unknown',
                email: user?.email || 'Unknown',
                role,
                joinedAt: new Date(),
                invitedBy: session.user.id,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding team member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/teams/[id]/members/[userId] - Aktualizuje rolę członka
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { id, userId: targetUserId } = await params;
        const body = await request.json();
        const { role } = body;

        if (!role) {
            return NextResponse.json({ error: 'Role is required' }, { status: 400 });
        }

        if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const team = await Team.findById(id);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Sprawdź uprawnienia
        const currentMember = findMember(team.members, session.user.id);
        if (!currentMember || !canManageMembers(currentMember.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Znajdź członka do aktualizacji
        const targetMember = findMember(team.members, targetUserId);
        if (!targetMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Nie można zmienić roli owner (chyba że zmienia owner)
        if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
            return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 });
        }

        // Owner może zmienić rolę innego ownera na admina
        if (targetMember.role === 'owner' && role !== 'owner' && currentMember.role === 'owner') {
            targetMember.role = role as TeamRole;
            await team.save();
            return NextResponse.json({ message: 'Member role updated successfully', member: targetMember });
        }

        // Zwykły owner/admin nie może degradować innego owner
        if (targetMember.role === 'owner' && role !== 'owner') {
            return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 });
        }

        targetMember.role = role as TeamRole;
        await team.save();

        return NextResponse.json({ message: 'Member role updated successfully', member: targetMember });
    } catch (error) {
        console.error('Error updating team member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/teams/[id]/members/[userId] - Usuwa członka z zespołu
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { id, userId: targetUserId } = await params;
        const team = await Team.findById(id);

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const currentMember = findMember(team.members, session.user.id);
        if (!currentMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const targetMember = findMember(team.members, targetUserId);
        if (!targetMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        const isSelfRemoval = targetUserId === session.user.id;
        const isOwner = targetMember.role === 'owner';
        const canManage = canManageMembers(currentMember.role);

        // Sprawdź czy można usunąć
        if (isOwner) {
            // Policz ilu ownerów jest w zespole
            const ownerCount = team.members.filter(m => m.role === 'owner').length;
            if (ownerCount <= 1) {
                return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 403 });
            }
            // Tylko inny owner może usunąć owner
            if (!isSelfRemoval && currentMember.role !== 'owner') {
                return NextResponse.json({ error: 'Cannot remove owner' }, { status: 403 });
            }
        }

        // Członek może usunąć samego siebie (ale nie jeśli jest jedynym ownerem)
        if (isSelfRemoval && !canManage) {
            // Self removal is allowed (already checked owner case above)
        } else if (!isSelfRemoval && !canManage) {
            // Nie-owner/admin nie może usunąć innego członka
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Usuń członka
        team.members = team.members.filter(m => m.userId.toString() !== targetUserId);
        await team.save();

        return NextResponse.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing team member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
