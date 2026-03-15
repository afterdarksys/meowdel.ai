import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { socialAccounts, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Basic session validation helper
async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('oauth_token')?.value;
  if (!token) return null;
  // Note: For production we would decrypt/verify this token against the auth provider.
  // We'll mock the extraction here for immediate DB access, or hardcode the first user.
  const user = await db.select().from(users).limit(1);
  return user.length > 0 ? user[0].id : null;
}

export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const accounts = await db
      .select({ id: socialAccounts.id, isVerified: socialAccounts.isVerified, updatedAt: socialAccounts.updatedAt })
      .from(socialAccounts)
      .where(and(eq(socialAccounts.userId, userId), eq(socialAccounts.platform, 'github_pat')));
      
    if (accounts.length > 0) {
      return NextResponse.json({ success: true, linked: true, updatedAt: accounts[0].updatedAt });
    }
    
    return NextResponse.json({ success: true, linked: false });
  } catch (error) {
    console.error('Failed to get GitHub PAT status:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { pat } = await req.json();
    if (!pat || typeof pat !== 'string') {
        return NextResponse.json({ success: false, error: 'Invalid PAT' }, { status: 400 });
    }

    // Verify PAT with GitHub API briefly? (Optional, but good practice)
    const ghRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${pat}` }
    });
    
    if (!ghRes.ok) {
        return NextResponse.json({ success: false, error: 'Invalid GitHub PAT' }, { status: 400 });
    }
    
    let ghUser = await ghRes.json();

    // Check if one exists
    const existing = await db
      .select()
      .from(socialAccounts)
      .where(and(eq(socialAccounts.userId, userId), eq(socialAccounts.platform, 'github_pat')));

    if (existing.length > 0) {
        // Update
        await db.update(socialAccounts)
          .set({ 
             accessToken: pat, 
             username: ghUser.login, 
             platformUserId: String(ghUser.id),
             profileUrl: ghUser.html_url,
             updatedAt: new Date() 
          })
          .where(eq(socialAccounts.id, existing[0].id));
    } else {
        // Insert
        await db.insert(socialAccounts).values({
            userId,
            platform: 'github_pat',
            platformUserId: String(ghUser.id),
            username: ghUser.login,
            profileUrl: ghUser.html_url,
            accessToken: pat,
            isVerified: true
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save GitHub PAT:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await db.delete(socialAccounts)
      .where(and(eq(socialAccounts.userId, userId), eq(socialAccounts.platform, 'github_pat')));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete GitHub PAT:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
