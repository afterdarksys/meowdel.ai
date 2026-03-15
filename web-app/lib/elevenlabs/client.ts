export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export async function fetchElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not defined in the environment variables.');
  }

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'xi-api-key': apiKey,
    },
    // We want fresh data when syncing
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch voices from ElevenLabs: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.voices as ElevenLabsVoice[];
}
