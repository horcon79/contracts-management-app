import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import TeamMember from '@/models/TeamMember';

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
        const { assigneeId, reason } = body;
        const userId = session.user.id;

        // Find the contract
        const contract = await Contract.findById(id);
        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Check if user has permission to assign
        const hasPermission = await checkAssignmentPermission(userId, contract);
        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If assigneeId is provided, verify the user is a team member
        if (assigneeId) {
            const isTeamMember = await TeamMember.exists({
                teamId: contract.teamId,
                userId: assigneeId,
            });
            if (!isTeamMember) {
                return NextResponse.json(
                    { error: 'Assignee must be a team member' },
                    { status: 400 }
                );
            }
        }

        // Store previous assignee for history
        const previousAssigneeId = contract.assigneeId?.toString();

        // Create assignment history entry
        const assignmentHistoryEntry = {
            previousAssigneeId: previousAssigneeId
                ? new (await import('mongoose')).Types.ObjectId(previousAssigneeId)
                : undefined,
            changedBy: new (await import('mongoose')).Types.ObjectId(userId),
            changedAt: new Date(),
            reason: reason || (assigneeId ? 'Przydzielenie do użytkownika' : 'Usunięcie przypisania'),
        };

        // Update contract
        contract.assigneeId = assigneeId
            ? new (await import('mongoose')).Types.ObjectId(assigneeId)
            : undefined;

        // Initialize assignmentHistory if it doesn't exist
        if (!contract.metadata) {
            contract.metadata = {};
        }
        if (!contract.metadata.assignmentHistory) {
            contract.metadata.assignmentHistory = [];
        }

        contract.metadata.assignmentHistory.push(
            assignmentHistoryEntry as import('@/models/Contract').IAssignmentHistoryEntry
        );
        await contract.save();

        // Populate the updated contract for response
        await contract.populate('assigneeId', 'name email');
        await contract.populate('createdBy', 'name email');
        if (contract.teamId) {
            await contract.populate('teamId', 'name');
        }

        return NextResponse.json({
            contract,
            previousAssigneeId,
            newAssigneeId: assigneeId,
            message: assigneeId
                ? 'Contract assigned successfully'
                : 'Assignment removed successfully',
        });
    } catch (error) {
        console.error('Error assigning contract:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function checkAssignmentPermission(
    userId: string,
    contract: import('@/models/Contract').IContract
): Promise<boolean> {
    // If contract has no team, only creator can assign
    if (!contract.teamId) {
        return contract.createdBy.toString() === userId;
    }

    // Check user's role in the team
    const membership = await TeamMember.findOne({
        teamId: contract.teamId,
        userId: userId,
    });

    if (!membership) {
        // User is not a team member - check if they are the current assignee
        return contract.assigneeId?.toString() === userId;
    }

    // Owner or admin can always assign
    if (membership.role === 'owner' || membership.role === 'admin') {
        return true;
    }

    // Regular members can assign if they are the current assignee
    return contract.assigneeId?.toString() === userId;
}
