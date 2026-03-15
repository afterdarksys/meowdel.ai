import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { voiceModels } from '@/lib/db/schema';
import { fetchElevenLabsVoices } from '@/lib/elevenlabs/client';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // 1. Fetch live voices from ElevenLabs API
    const liveVoices = await fetchElevenLabsVoices();

    // 2. Fetch all existing configured voices from our DB
    const existingVoices = await db
      .select({ elevenLabsVoiceId: voiceModels.elevenLabsVoiceId, id: voiceModels.id })
      .from(voiceModels);
      
    const existingVoiceIds = new Set(existingVoices.map(v => v.elevenLabsVoiceId));

    // 3. Upsert into database
    // We categorize based on labels or generic assignment for the mockup
    for (const lv of liveVoices) {
      if (!existingVoiceIds.has(lv.voice_id)) {
        await db.insert(voiceModels).values({
          elevenLabsVoiceId: lv.voice_id,
          name: lv.name,
          category: lv.category || 'standard',
          description: lv.description || null,
          previewUrl: lv.preview_url || null,
          baseCostPerMinuteCents: 10, // Default cost
          markupPerMinuteCents: 20,   // Default markup
          isPremium: lv.category === 'premium' || lv.labels?.tier === 'premium' ? true : false,
          isActive: true
        });
      } else {
        // Optionally update any changed metadata
        await db.update(voiceModels)
          .set({
            name: lv.name,
            category: lv.category || 'standard',
            description: lv.description || null,
            previewUrl: lv.preview_url || null,
            updatedAt: new Date()
          })
          .where(eq(voiceModels.elevenLabsVoiceId, lv.voice_id));
      }
    }

    // 4. Return the updated list from the DB so clients consume our own annotated format
    const allVoices = await db.select().from(voiceModels).orderBy(voiceModels.name);

    return NextResponse.json({
      success: true,
      syncedCount: liveVoices.length,
      data: allVoices
    });
  } catch (error: any) {
    console.error('Error syncing ElevenLabs voices:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
