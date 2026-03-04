import { meowdelPersonality } from './meowdel';
import { banditPersonality } from './bandit';
import { lunaPersonality } from './luna';
import { catdogPersonality } from './catdog';
import { spottyPersonality } from './spotty';
import { bellaPersonality } from './bella';
import { blubiePersonality } from './blubie';
import { blinkerPersonality } from './blinker';
import { nursicatPersonality } from './nursicat';
import { lobstercatPersonality } from './lobstercat';

export interface PetPersonality {
    id: string;
    name: string;
    type: 'cat';
    breed: string;
    platform: 'meowdel.ai';
    personality: string;
    speakingStyle: string;
    systemPrompt: string;
    photos: {
        playing: string[];
        sleeping: string[];
        activities: string[];
    };
    videos?: string[];
    voiceProfile: {
        provider: string;
        voiceId: string;
        stability: number;
        similarity: number;
        style: string;
    };
    visionResponses: {
        seesHuman: (mood: string, activity?: string) => string;
        seesObject: (object: string, context?: string) => string;
        seesCode: (language: string, hasError: boolean, errorMessage?: string) => string;
        readsText: (text: string) => string;
    };
    selectPhoto: (context: { mood?: string, activity?: string, hasCode?: boolean }) => string;
    greetings: {
        first: string;
        returning: string;
        coding: string;
    };
}

// Map of all available personalities
export const petRegistry: Record<string, PetPersonality> = {
    meowdel: meowdelPersonality as PetPersonality,
    bandit: banditPersonality as PetPersonality,
    luna: lunaPersonality as PetPersonality,
    catdog: catdogPersonality as PetPersonality,
    spotty: spottyPersonality as PetPersonality,
    bella: bellaPersonality as PetPersonality,
    blubie: blubiePersonality as PetPersonality,
    blinker: blinkerPersonality as PetPersonality,
    nursicat: nursicatPersonality as PetPersonality,
    lobstercat: lobstercatPersonality as PetPersonality,
};

/**
 * Get a pet personality by its ID.
 * @param id The ID of the pet (e.g., 'meowdel', 'bandit')
 * @returns The PetPersonality object, or undefined if not found.
 */
export function getPersonalityById(id: string): PetPersonality | undefined {
    return petRegistry[id.toLowerCase()];
}

/**
 * Get a list of all available pets.
 * Useful for building the UI gallery or pet selection screen.
 */
export function getAllPersonalities(): PetPersonality[] {
    return Object.values(petRegistry);
}
