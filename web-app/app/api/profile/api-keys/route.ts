import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeys, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

// Mocking auth context for testing locally
async function getOrCreateMockUser() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) return existingUsers[0];
  
  const [newUser] = await db.insert(users).values({
    email: 'ryan@afterdarktech.com',
    name: 'Ryan (Dev)'
  }).returning();
  return newUser;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateMockUser();
    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id));
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error('API Key Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    const user = await getOrCreateMockUser();
    
    // Secure generation of a Meowdel API Key
    const rawKey = `mdl_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10); // mdl_xxxxxx
    
    const [newKey] = await db.insert(apiKeys).values({
      userId: user.id,
      name: name || 'My Secret Key',
      keyHash,
      keyPrefix
    }).returning();
    
    // We strictly only return the rawKey ONCE here
    return NextResponse.json({ success: true, key: newKey, rawKey }); 
  } catch (error) {
    console.error('API Key Gen Error:', error);
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });
    
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Key Delete Error:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
