import { NextResponse } from 'next/server';

// Temporary in-memory store for the demo.
// In production, this would use Redis pub/sub or WebSockets.
let latestThreat: any = null;

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        
        // Expected payload: { severity: 'high', message: 'Malicious payload from 10.0.0.5 blocked', source: 'DarkScan' }
        if (!payload.message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        latestThreat = {
            id: Date.now().toString(),
            severity: payload.severity || 'high',
            message: payload.message,
            source: payload.source || 'Unknown Engine',
            timestamp: new Date().toISOString()
        };

        // Auto-clear the threat after 15 seconds so it doesn't loop forever on the client
        setTimeout(() => {
            latestThreat = null;
        }, 15000);

        return NextResponse.json({ success: true, threat: latestThreat });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process threat' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ threat: latestThreat });
}
