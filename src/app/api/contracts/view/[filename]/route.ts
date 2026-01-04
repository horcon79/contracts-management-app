import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filename } = await params;
        const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
        const filepath = join(uploadDir, filename);

        console.log(`[PDF View] Request for: ${filename}`);
        console.log(`[PDF View] Full path: ${filepath}`);

        // Security check: ensure the file is inside the upload directory
        if (!filepath.startsWith(uploadDir)) {
            console.warn(`[PDF View] Security violation: ${filepath} is outside ${uploadDir}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!existsSync(filepath)) {
            console.warn(`[PDF View] File not found: ${filepath}`);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const fileBuffer = await readFile(filepath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error serving PDF:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
