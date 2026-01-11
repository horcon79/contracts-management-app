import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import Comment from '@/models/Comment';
import ContractActivity from '@/models/ContractActivity';
import User from '@/models/User';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

interface CreateCommentBody {
    content: string;
    parentId?: string;
    mentions?: string[];
}

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
        const parentId = searchParams.get('parentId');

        // Find the contract
        const contract = await Contract.findById(id);
        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Check if user has permission to view comments
        const hasPermission = await checkViewCommentsPermission(
            session.user.id,
            contract
        );
        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Build query - always filter out deleted comments
        const query: Record<string, unknown> = {
            contractId: id,
            isDeleted: false,
        };

        // Filter by parentId (null for root comments, specific ID for replies)
        if (parentId === 'null' || parentId === '' || parentId === null) {
            query.parentId = null;
        } else if (parentId) {
            query.parentId = new mongoose.Types.ObjectId(parentId);
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await Comment.countDocuments(query);

        // Fetch comments with pagination
        const comments = await Comment.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('authorId', 'name email image')
            .populate('mentions', 'name email')
            .lean();

        // Transform comments to response format
        const transformedComments = comments.map((comment) => ({
            _id: comment._id.toString(),
            contractId: comment.contractId.toString(),
            parentId: comment.parentId?.toString() || null,
            authorId: comment.authorId
                ? {
                    id: (comment.authorId as { _id: { toString(): string } })._id.toString(),
                    name: (comment.authorId as { name?: string }).name || '',
                    email: (comment.authorId as { email?: string }).email || '',
                    image: (comment.authorId as { image?: string }).image || null,
                }
                : null,
            authorName: comment.authorName,
            content: comment.content,
            mentions: (comment.mentions || []).map((m: { _id: { toString(): string }; name?: string; email?: string }) => ({
                id: m._id.toString(),
                name: m.name || '',
                email: m.email || '',
            })),
            isEdited: comment.isEdited,
            editedAt: comment.editedAt?.toISOString() || null,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
            replyCount: 0, // Can be populated if needed
        }));

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            comments: transformedComments,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
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

        await connectToDatabase();

        const { id } = await params;
        const body: CreateCommentBody = await request.json();

        const { content, parentId, mentions: explicitMentions } = body;

        // Validate content
        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: 'Comment content is required' },
                { status: 400 }
            );
        }

        // Find the contract
        const contract = await Contract.findById(id);
        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Check if user has permission to add comments
        const hasPermission = await checkAddCommentPermission(
            session.user.id,
            contract
        );
        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Verify parent comment exists if parentId is provided
        let parentComment = null;
        if (parentId) {
            parentComment = await Comment.findById(parentId);
            if (!parentComment) {
                return NextResponse.json(
                    { error: 'Parent comment not found' },
                    { status: 404 }
                );
            }
        }

        // Parse @mentions from content
        const mentionRegex = /@\[([^\]]+)\]/g;
        const extractedMentions = [...content.matchAll(mentionRegex)].map(
            (m) => m[1]
        );

        // Combine explicit mentions with extracted ones
        const allMentions = [
            ...new Set([...(explicitMentions || []), ...extractedMentions]),
        ];

        // Resolve mention IDs to ObjectIds
        const mentionUserIds: mongoose.Types.ObjectId[] = [];
        for (const mention of allMentions) {
            // Check if it's a valid ObjectId or try to find by email
            if (mongoose.Types.ObjectId.isValid(mention)) {
                const user = await User.findById(mention);
                if (user) {
                    mentionUserIds.push(user._id);
                }
            } else {
                // Try to find by email
                const user = await User.findOne({ email: mention });
                if (user) {
                    mentionUserIds.push(user._id);
                }
            }
        }

        // Remove self-mention
        const selfId = new mongoose.Types.ObjectId(session.user.id);
        const filteredMentions = mentionUserIds.filter(
            (mid) => mid.toString() !== selfId.toString()
        );

        // Create the comment
        const comment = new Comment({
            contractId: id,
            teamId: contract.teamId || undefined,
            parentId: parentId || null,
            authorId: session.user.id,
            authorName: session.user.name || session.user.email || 'Anonymous',
            content: content.trim(),
            mentions: filteredMentions,
            isEdited: false,
            isDeleted: false,
        });

        await comment.save();

        // Create activity log
        await ContractActivity.create({
            contractId: id,
            teamId: contract.teamId || undefined,
            userId: session.user.id,
            userName: session.user.name || session.user.email || 'Anonymous',
            action: 'comment_added',
            details: {
                field: 'comment',
                newValue: comment._id.toString(),
            },
            metadata: {
                commentId: comment._id.toString(),
                parentId: parentId || null,
                mentionsCount: filteredMentions.length,
            },
        });

        // Populate author and mentions for response
        await comment.populate('authorId', 'name email image');
        await comment.populate('mentions', 'name email');

        return NextResponse.json({
            comment: {
                _id: comment._id.toString(),
                contractId: comment.contractId.toString(),
                parentId: comment.parentId?.toString() || null,
                authorId: {
                    id: (comment.authorId as { _id: { toString(): string } })._id.toString(),
                    name: (comment.authorId as { name?: string }).name || '',
                    email: (comment.authorId as { email?: string }).email || '',
                    image: (comment.authorId as { image?: string }).image || null,
                },
                authorName: comment.authorName,
                content: comment.content,
                mentions: (comment.mentions || []).map(
                    (m: { _id: { toString(): string }; name?: string; email?: string }) => ({
                        id: m._id.toString(),
                        name: m.name || '',
                        email: m.email || '',
                    })
                ),
                isEdited: comment.isEdited,
                editedAt: null,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function checkViewCommentsPermission(
    userId: string,
    contract: typeof Contract.prototype
): Promise<boolean> {
    // If contract has no team, only creator can view
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

    // Owner or admin can always view
    if (membership.role === 'owner' || membership.role === 'admin') {
        return true;
    }

    // Regular members can view if they are the current assignee or just view
    return true; // All team members can view comments
}

async function checkAddCommentPermission(
    userId: string,
    contract: typeof Contract.prototype
): Promise<boolean> {
    // If contract has no team, only creator can add comments
    if (!contract.teamId) {
        return contract.createdBy.toString() === userId;
    }

    // Check if user is a team member (any role)
    const membership = await TeamMember.findOne({
        teamId: contract.teamId,
        userId: userId,
    });

    if (!membership) {
        // User is not a team member - check if they are the current assignee
        return contract.assigneeId?.toString() === userId;
    }

    // Any team member can add comments (owner, admin, member, viewer)
    return true;
}
