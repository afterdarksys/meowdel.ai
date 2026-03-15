import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userVoiceBindings, voiceModels, users } from '@/lib/db/schema';
import { getPersonalityById } from '@/lib/personality/engine';
import { createUltravoxCall } from '@/lib/ultravox/client';
import { eq, and } from 'drizzle-orm';

const Telnyx = require('telnyx');

export async function POST(req: Request) {
  try {
    const { meetingNumber, meetingPin, personalityId, userId } = await req.json();

    if (!meetingNumber || !personalityId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch the selected personality
    const personality = getPersonalityById(personalityId);
    if (!personality) {
      return NextResponse.json({ success: false, error: 'Invalid personality ID' }, { status: 400 });
    }

    // 2. Lookup the user's voice binding for this personality
    let elevenLabsVoiceId = undefined;
    
    const bindings = await db
      .select({
         voiceId: voiceModels.elevenLabsVoiceId
      })
      .from(userVoiceBindings)
      .innerJoin(voiceModels, eq(userVoiceBindings.voiceModelId, voiceModels.id))
      .where(
        and(
          eq(userVoiceBindings.userId, userId),
          eq(userVoiceBindings.personalityId, personalityId),
          eq(userVoiceBindings.isActive, true)
        )
      );

    if (bindings.length > 0) {
      elevenLabsVoiceId = bindings[0].voiceId;
    }

    // 3. Construct the Ultravox System Prompt
    // Emulate the personality's system prompt + specific meeting instructions
    const meetingPrompt = `
      You are joining a Zoom/Teams audio meeting. 
      Your personality traits: ${personality.systemPrompt}.
      
      Act extremely cat-like, use meows, purrs, and typical cat expressions in your speech.
      If asked to take notes, listen quietly. You can also participate if called upon.
      
      You must keep your answers short, concise, and heavily conversational because you are speaking out loud.
      Do not output markdown, formatting, or emojis.
    `;

    // 4. Create the Ultravox WebRTC/SIP Call
    const ultravoxCall = await createUltravoxCall({
      systemPrompt: meetingPrompt,
      voice: elevenLabsVoiceId, // This bridges the ElevenLabs custom voice with Ultravox
      temperature: 0.5
    });

    // 5. Initiate Telnyx Outbound Call to the Meeting
    if (process.env.TELNYX_API_KEY && process.env.TELNYX_CONNECTION_ID) {
      const telnyx = Telnyx(process.env.TELNYX_API_KEY);

      // Validate caller phone number is configured
      const callerPhoneNumber = process.env.TELNYX_PHONE_NUMBER;
      if (!callerPhoneNumber) {
        return NextResponse.json({
          success: false,
          error: 'TELNYX_PHONE_NUMBER environment variable is not configured'
        }, { status: 500 });
      }

      const outboundCall = await telnyx.calls.create({
        connection_id: process.env.TELNYX_CONNECTION_ID,
        to: meetingNumber,
        from: callerPhoneNumber,
        // We will pass the Ultravox Join URL (SIP URI) as client_state or custom_headers
        // to tell the Webhook to bridge the calls once answered.
        client_state: Buffer.from(JSON.stringify({
           ultravoxJoinUrl: ultravoxCall.joinUrl,
           meetingPin: meetingPin
        })).toString('base64'),
      });

      return NextResponse.json({
        success: true,
        ultravoxCallId: ultravoxCall.callId,
        telnyxCallControlId: outboundCall.data.call_control_id,
        message: 'Successfully bridged Meowdel to the meeting.'
      });
    } else {
        // Return without Telnyx if we are just testing the session creation internally
        return NextResponse.json({
            success: true,
            ultravoxCallId: ultravoxCall.callId,
            ultravoxJoinUrl: ultravoxCall.joinUrl, // Usually sip:xxx
            message: 'Ultravox Session Created (Telnyx skipped because no API key in ENV)'
        });
    }

  } catch (error: any) {
    console.error('Error starting meeting AI bot:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
