/**
 * BrowserID Types
 */

export interface BrowserIDUser {
  browserID: string;
  userId?: string;           // Linked via OAuth2
  email?: string;
  name?: string;

  // Cat personality data
  catPersonality: CatPersonalityProfile;

  // Session data
  firstSeen: string;
  lastSeen: string;
  sessionCount: number;

  // OAuth data
  oauthProvider?: 'google' | 'github' | 'discord';
  oauthLinkedAt?: string;

  // Cross-device sync
  linkedBrowserIDs: string[];
}

export interface CatPersonalityProfile {
  // User preferences
  preferredMeows: string[];
  meowFrequency: 'rare' | 'moderate' | 'chatty';

  // Interaction style
  helpfulnessLevel: 'hints' | 'balanced' | 'detailed';
  personalityMode: 'playful' | 'professional' | 'balanced';

  // Conversation history
  conversationTopics: string[];
  commonBugTypes: string[];
  preferredLanguages: string[];

  // Activity patterns
  activityPattern: 'night_owl' | 'morning_person' | 'always_on';
  codingHours: number[];  // 24-hour heat map

  // Relationship with cat
  affinity: number;  // 0-100
  trustLevel: number;  // 0-100

  // Learning data
  bugsSolvedTogether: number;
  questionsAsked: number;
  codeReviewsCompleted: number;

  // Custom traits
  favoriteEmoji: string;
  customGreeting?: string;
}

export interface ConversationMessage {
  id: string;
  browserID: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;

  // Context
  codeContext?: string;
  tags?: string[];

  // Sentiment
  userSentiment?: 'positive' | 'neutral' | 'frustrated';
  helpfulness?: number;  // 1-5 rating
}

export interface CatMemory {
  browserID: string;

  // Short-term (current session)
  currentConversation: ConversationMessage[];

  // Long-term (persistent)
  memorableConversations: ConversationMessage[];
  solvedProblems: SolvedProblem[];
  userPreferences: Record<string, any>;
  relationships: Record<string, number>;  // Other entity IDs -> affinity
}

export interface SolvedProblem {
  id: string;
  problemType: string;
  description: string;
  solution: string;
  solvedAt: string;
  helpfulness: number;
  tags: string[];
}

export interface BrowserIDSession {
  browserID: string;
  sessionId: string;
  startedAt: string;
  lastActivity: string;
  active: boolean;
}
