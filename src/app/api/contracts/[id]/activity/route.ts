import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import ContractActivity from '@/models/ContractActivity';
import TeamMember from '@/models/TeamMember';

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
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const action = searchParams.get('action');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        // Find the contract
        const contract = await Contract.findById(id);
        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Check if user has permission to view activity
        const hasPermission = await checkViewActivityPermission(
            session.user.id,
            contract
        );
        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Build query filters
        const query: Record<string, unknown> = { contractId: id };

        if (action) {
            query.action = action;
        }

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                (query.createdAt as Record<string, Date>).$gte = new Date(fromDate);
            }
            if (toDate) {
                (query.createdAt as Record<string, Date>).$lte = new Date(toDate);
            }
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await ContractActivity.countDocuments(query);

        // Fetch activities with pagination
        const activities = await ContractActivity.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .lean();

        // Transform activities to match response format
        const transformedActivities = activities.map((activity) => ({
            _id: activity._id.toString(),
            contractId: activity.contractId.toString(),
            userId: activity.userId
                ? {
                    name:
                        (activity.userId as { name?: string }).name || '',
                    email:
                        (activity.userId as { email?: string }).email || '',
                }
                : null,
            userName: activity.userName,
            action: activity.action,
            details: activity.details,
            createdAt: activity.createdAt.toISOString(),
        }));

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            activities: transformedActivities,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Error fetching contract activity:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function checkViewActivityPermission(
    userId: string,
    contract: typeof Contract.prototype
): Promise<boolean> {
    // If contract has no team, only creator can view activity
    if (!contract.teamId) {
        return contract.createdBy.toString() === userId;
    }

    // Check if user is a team member
    const membership = await TeamMember.findOne({
        teamId: contract.teamId,
        userId: userId,
    });

    if (!membership) {
        // User is not a team member - check if they are the current assignee
        return contract.assigneeId?.toString() === userId;
    }

    // Owner or admin can always view activity
    if (membership.role === 'owner' || membership.role === 'admin') {
        return true;
    }

    // Regular members can view activity if they are the current assignee
    return contract.assigneeId?.toString() === userId;
}
