/**
 * BrowserID Database Service
 * PostgreSQL operations for BrowserID users
 */

import { db } from '../db';
import { browseridUsers, browseridOauthMappings } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import type { CatPersonalityProfile } from '@/types/browserid';

/**
 * Default cat personality for new users
 */
const DEFAULT_CAT_PERSONALITY: CatPersonalityProfile = {
  preferredMeows: ['*meow*', '*purr*'],
  meowFrequency: 'moderate',
  helpfulnessLevel: 'balanced',
  personalityMode: 'playful',
  conversationTopics: [],
  commonBugTypes: [],
  preferredLanguages: [],
  activityPattern: 'always_on',
  codingHours: Array(24).fill(0),
  affinity: 50,
  trustLevel: 50,
  bugsSolvedTogether: 0,
  questionsAsked: 0,
  codeReviewsCompleted: 0,
  favoriteEmoji: '',
};

/**
 * Get or create BrowserID user
 */
export async function getOrCreateBrowserIDUser(browserID: string) {
  // Try to find existing user
  const existing = await db.select().from(browseridUsers).where(eq(browseridUsers.browserID, browserID)).limit(1);

  if (existing.length > 0) {
    const user = existing[0];

    // Update session count and last seen
    await db
      .update(browseridUsers)
      .set({
        sessionCount: sql`${browseridUsers.sessionCount} + 1`,
        lastSeen: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(browseridUsers.browserID, browserID));

    return {
      ...user,
      sessionCount: user.sessionCount + 1,
      lastSeen: new Date(),
      known: true,
    };
  }

  // Create new user
  const newUser = {
    browserID,
    catPersonality: DEFAULT_CAT_PERSONALITY,
    firstSeen: new Date(),
    lastSeen: new Date(),
    sessionCount: 1,
    linkedBrowserIDs: [browserID],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(browseridUsers).values(newUser);

  return {
    ...newUser,
    known: false,
  };
}

/**
 * Update cat personality
 */
export async function updateCatPersonality(browserID: string, personalityUpdates: Partial<CatPersonalityProfile>) {
  const user = await db.select().from(browseridUsers).where(eq(browseridUsers.browserID, browserID)).limit(1);

  if (user.length === 0) {
    throw new Error('User not found');
  }

  const currentPersonality = user[0].catPersonality as CatPersonalityProfile;
  const updatedPersonality = {
    ...currentPersonality,
    ...personalityUpdates,
  };

  await db
    .update(browseridUsers)
    .set({
      catPersonality: updatedPersonality,
      updatedAt: new Date(),
    })
    .where(eq(browseridUsers.browserID, browserID));

  return updatedPersonality;
}

/**
 * Link BrowserID to OAuth account
 */
export async function linkBrowserIDToOAuth(
  browserID: string,
  oauthProvider: string,
  oauthUserId: string,
  email?: string,
  name?: string
) {
  // Get current user
  const user = await db.select().from(browseridUsers).where(eq(browseridUsers.browserID, browserID)).limit(1);

  if (user.length === 0) {
    throw new Error('User not found');
  }

  // Get all BrowserIDs linked to this OAuth account
  const mappings = await db
    .select()
    .from(browseridOauthMappings)
    .where(
      and(eq(browseridOauthMappings.oauthProvider, oauthProvider), eq(browseridOauthMappings.oauthUserId, oauthUserId))
    );

  const existingBrowserIDs = mappings.map((m) => m.browserID);

  // Add current BrowserID to mappings if not already there
  if (!existingBrowserIDs.includes(browserID)) {
    await db.insert(browseridOauthMappings).values({
      oauthProvider,
      oauthUserId,
      browserID,
      linkedAt: new Date(),
    });
    existingBrowserIDs.push(browserID);
  }

  // Get all users for these BrowserIDs
  const allUsers = await db
    .select()
    .from(browseridUsers)
    .where(sql`${browseridUsers.browserID} = ANY(${existingBrowserIDs})`);

  // Merge personalities
  let mergedPersonality = user[0].catPersonality as CatPersonalityProfile;

  if (allUsers.length > 1) {
    const personalities = allUsers.map((u) => u.catPersonality as CatPersonalityProfile);

    mergedPersonality = personalities.reduce(
      (merged, p) => ({
        ...merged,
        affinity: Math.max(merged.affinity || 0, p.affinity),
        trustLevel: Math.max(merged.trustLevel || 0, p.trustLevel),
        bugsSolvedTogether: (merged.bugsSolvedTogether || 0) + (p.bugsSolvedTogether || 0),
        questionsAsked: (merged.questionsAsked || 0) + (p.questionsAsked || 0),
        codeReviewsCompleted: (merged.codeReviewsCompleted || 0) + (p.codeReviewsCompleted || 0),
        conversationTopics: [
          ...new Set([...(merged.conversationTopics || []), ...(p.conversationTopics || [])]),
        ] as string[],
        preferredLanguages: [
          ...new Set([...(merged.preferredLanguages || []), ...(p.preferredLanguages || [])]),
        ] as string[],
      }),
      personalities[0]
    );
  }

  // Update all linked BrowserIDs with merged personality
  for (const linkedBrowserID of existingBrowserIDs) {
    await db
      .update(browseridUsers)
      .set({
        oauthProvider,
        oauthLinkedAt: new Date(),
        email,
        name,
        catPersonality: mergedPersonality,
        linkedBrowserIDs: existingBrowserIDs,
        updatedAt: new Date(),
      })
      .where(eq(browseridUsers.browserID, linkedBrowserID));
  }

  return {
    linkedBrowserIDs: existingBrowserIDs,
    mergedPersonality,
  };
}

/**
 * Get BrowserID user by ID
 */
export async function getBrowserIDUser(browserID: string) {
  const user = await db.select().from(browseridUsers).where(eq(browseridUsers.browserID, browserID)).limit(1);

  return user.length > 0 ? user[0] : null;
}

/**
 * Get all BrowserIDs linked to an OAuth account
 */
export async function getLinkedBrowserIDs(oauthProvider: string, oauthUserId: string) {
  const mappings = await db
    .select()
    .from(browseridOauthMappings)
    .where(
      and(eq(browseridOauthMappings.oauthProvider, oauthProvider), eq(browseridOauthMappings.oauthUserId, oauthUserId))
    );

  return mappings.map((m) => m.browserID);
}
