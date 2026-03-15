export interface UltravoxCallConfig {
  systemPrompt: string;
  voice?: string;
  temperature?: number;
  model?: string;
}

export interface UltravoxCallResponse {
  callId: string;
  joinUrl: string; // The URL/SIP URI to connect the media stream
}

export async function createUltravoxCall(config: UltravoxCallConfig): Promise<UltravoxCallResponse> {
  const apiKey = process.env.ULTRAVOX_API_KEY;
  if (!apiKey) {
    throw new Error('ULTRAVOX_API_KEY is not configured');
  }

  // Define the base payload for an Ultravox Call
  const payload = {
    systemPrompt: config.systemPrompt,
    model: config.model || 'fixie-ai/ultravox-70B', // Default Ultravox Voice Model
    temperature: config.temperature || 0.4,
    voice: config.voice, // This is where we plug in the ElevenLabs Voice ID (or Ultravox Voice string)
  };

  const response = await fetch('https://api.ultravox.ai/api/calls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Ultravox call: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    callId: data.callId,
    joinUrl: data.joinUrl 
  };
}
