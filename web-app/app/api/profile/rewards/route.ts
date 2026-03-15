import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('oauth_token')?.value;

        // In a real app we'd verify the token. For this local demo, just grab the first user profile.
        const profiles = await db.select().from(userProfiles).limit(1);

        if (profiles.length === 0) {
            // Create a mock profile if none exists for the demo
            const u = await db.select().from(users).limit(1);
            if (u.length > 0) {
                 const inserted = await db.insert(userProfiles).values({
                    userId: u[0].id,
                    username: 'demo_user',
                    meowcoinsEarned: 150
                 }).returning();
                 return NextResponse.json({ meowcoins: inserted[0].meowcoinsEarned });
            }
            return NextResponse.json({ meowcoins: 0 });
        }

        return NextResponse.json({ meowcoins: profiles[0].meowcoinsEarned });
    } catch (error: any) {
        console.error('Rewards checking error:', error);
        return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }
}

// Optional POST to "simulate" spending/earning during chat actions
export async function POST(req: Request) {
    try {
        const { amount, action } = await req.json(); // action = 'spend' | 'earn'
        const profiles = await db.select().from(userProfiles).limit(1);
        if (profiles.length === 0) return NextResponse.json({ error: 'No profile' }, { status: 404 });
        
        const newBalance = action === 'spend' 
           ? Math.max(0, profiles[0].meowcoinsEarned - amount)
           : profiles[0].meowcoinsEarned + amount;

        await db.update(userProfiles)
            .set({ meowcoinsEarned: newBalance })
            .where(eq(userProfiles.id, profiles[0].id));

        return NextResponse.json({ success: true, newBalance });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }
}
