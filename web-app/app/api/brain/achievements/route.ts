import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles, userAchievements, chatMessages } from '@/lib/db/schema';
import { eq, and, notInArray, count } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Define the available digital catnip badges
export const AVAILABLE_BADGES = [
  { id: 'first_login', name: 'Fresh Kitten', description: 'Logged into the Brain for the first time.', icon: '🐾' },
  { id: 'first_10_notes', name: 'Curious Cat', description: 'Created 10 separate notes.', icon: '🐈' },
  { id: 'linked_50_notes', name: 'Yarn Spinner', description: 'Created 50 internal links between notes.', icon: '🧶' },
  { id: '7_day_streak', name: 'Prowler', description: 'Used the app for 7 consecutive days.', icon: '🏃' },
  { id: 'chat_100_msgs', name: 'Chatty Cathy', description: 'Sent 100 messages to Meowdel.', icon: '🗣️' },
  { id: 'zoomies_activated', name: 'ZOOMIES!', description: 'Activated Zoomies focus mode for the first time.', icon: '⚡' },
];

async function getUserId() {
  // In a real app this uses the auth session
  const cookieStore = await cookies();
  const token = cookieStore.get('oauth_token')?.value;
  // For MVP demo, grab the first user if no solid session
  const user = await db.select({ id: users.id }).from(users).limit(1);
  return user.length > 0 ? user[0].id : null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const achievements = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
    return NextResponse.json({ achievements, available: AVAILABLE_BADGES });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Optional: action data to trigger specific checks
    const { action } = await req.json().catch(() => ({ action: null }));

    // Get current unlocked badges so we don't award them again
    const existing = await db.select({ badgeId: userAchievements.badgeId })
                             .from(userAchievements)
                             .where(eq(userAchievements.userId, userId));
    const unlockedIds = existing.map(e => e.badgeId);

    const newlyUnlocked: typeof AVAILABLE_BADGES = [];

    // Helper to award a badge safely
    const award = async (badgeId: string) => {
        if (!unlockedIds.includes(badgeId)) {
            await db.insert(userAchievements).values({ userId, badgeId });
            unlockedIds.push(badgeId);
            const badgeMeta = AVAILABLE_BADGES.find(b => b.id === badgeId);
            if (badgeMeta) newlyUnlocked.push(badgeMeta);
        }
    };

    // --- RULE CHECKS --- //

    // 1. Fresh Kitten (First login / action)
    await award('first_login');

    // 2. Chatty Cathy (100 messages)
    if (!unlockedIds.includes('chat_100_msgs')) {
       // We'd typically count chatSessions or chatMessages joined to user.
       // Placeholder logic based on profile messageCount if available
       const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
       if (profile.length > 0 && profile[0].messageCount >= 100) {
           await award('chat_100_msgs');
       }
    }

    // 3. Zoomies (Triggered directly via API action payload)
    if (action === 'zoomies') {
        await award('zoomies_activated');
    }

    // 4. Note milestones (In a full app, we query the external 'notes' table here)
    // For demo purposes, we will trigger this if action === 'create_note' and count reaches threshold in a real app.
    if (action === 'test_10_notes') await award('first_10_notes');

    return NextResponse.json({ 
       success: true, 
       newlyUnlocked,
       totalUnlocked: unlockedIds.length
    });

  } catch (error: any) {
    console.error("Error checking achievements:", error);
    return NextResponse.json({ error: 'Failed to evaluate achievements' }, { status: 500 });
  }
}
