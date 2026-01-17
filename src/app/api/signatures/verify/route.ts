import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import QualifiedSignature from '@/models/QualifiedSignature';
import { SignatureVerificationService } from '@/lib/signature-verification';

// POST /api/signatures/verify - Weryfikuje podpis kwalifikowany
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await request.json();
        const { signatureId } = body;

        if (!signatureId) {
            return NextResponse.json({ error: 'signatureId is required' }, { status: 400 });
        }

        const signature = await QualifiedSignature.findById(signatureId);
        if (!signature) {
            return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
        }

        // Wykonaj weryfikację
        const result = await SignatureVerificationService.verifySignature(signatureId);

        return NextResponse.json({
            signatureId,
            verificationResult: result,
            signatureStatus: signature.signatureStatus,
        });
    } catch (error) {
        console.error('Error verifying signature:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/signatures/verify-contract - Weryfikuje wszystkie podpisy umowy
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await request.json();
        const { contractId } = body;

        if (!contractId) {
            return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
        }

        const result = await SignatureVerificationService.verifyAllContractSignatures(contractId);

        return NextResponse.json({
            contractId,
            verified: result.verified,
            failed: result.failed,
            results: result.results,
        });
    } catch (error) {
        console.error('Error verifying contract signatures:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
