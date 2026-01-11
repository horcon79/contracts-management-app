import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { EmailService } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        await EmailService.testConnection(body);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error testing SMTP:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
