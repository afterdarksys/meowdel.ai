import { NextResponse } from 'next/server';
import { processImport } from '@/lib/extimport';

// This is a long-running local operation, we'll keep it simple as a standard POST
// since we don't have Vercel timeout limits locally.
export async function POST(req: Request) {
    try {
        const { platform, credentials } = await req.json();

        if (!platform) {
            return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
        }

        // We can capture basic progress logs if we want, but for now just wait for it to finish.
        const result = await processImport(platform, credentials);
        
        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Import Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to import notes' }, { status: 500 });
    }
}
