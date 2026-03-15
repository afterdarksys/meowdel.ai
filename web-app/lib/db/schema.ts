import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ============================================
// USERS & AUTHENTICATION
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),

  // OAuth from After Dark SSO
  oauthSub: varchar('oauth_sub', { length: 255 }).unique(),
  oauthProvider: varchar('oauth_provider', { length: 50 }).default('afterdark').notNull(),

  // Profile basics
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 50 }).default('user').notNull(), // user, premium, admin, afterdark_employee

  // After Dark Systems Employee Detection
  isAfterDarkEmployee: boolean('is_after_dark_employee').default(false).notNull(),
  employeeDomain: varchar('employee_domain', { length: 255 }), // afterdarktech.com, afterdarksystems.com, etc.

  // Subscription
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free').notNull(),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active').notNull(),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_oauth_sub_idx').on(table.oauthSub),
])

// ============================================
// USER PROFILES (Public & Private Data)
// ============================================

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Public profile
  username: varchar('username', { length: 100 }).unique(), // meowdel.ai/@username
  displayName: varchar('display_name', { length: 255 }),
  bio: text('bio'),
  location: varchar('location', { length: 255 }),
  website: varchar('website', { length: 500 }),

  // Images
  gravatarEmail: varchar('gravatar_email', { length: 255 }), // For Gravatar
  profileImageUrl: text('profile_image_url'), // Custom upload
  bannerImageUrl: text('banner_image_url'),

  // Privacy settings
  isPublic: boolean('is_public').default(true).notNull(),
  showSocialLinks: boolean('show_social_links').default(true).notNull(),
  showStats: boolean('show_stats').default(true).notNull(),

  // Stats (public if enabled)
  messageCount: integer('message_count').default(0).notNull(),
  sessionsCount: integer('sessions_count').default(0).notNull(),
  meowcoinsEarned: integer('meowcoins_earned').default(0).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_profiles_username_idx').on(table.username),
  index('user_profiles_user_id_idx').on(table.userId),
])

// ============================================
// GAMIFICATION (DIGITAL CATNIP)
// ============================================

export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Achievement info
  badgeId: varchar('badge_id', { length: 100 }).notNull(), // e.g., 'first_10_notes', '7_day_streak'
  
  // Metadata & Timestamps
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').default({}),
}, (table) => [
  uniqueIndex('user_achievements_user_badge_idx').on(table.userId, table.badgeId),
  index('user_achievements_user_id_idx').on(table.userId, table.earnedAt),
])

// ============================================
// SOCIAL MEDIA ACCOUNTS
// ============================================

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Platform info
  platform: varchar('platform', { length: 50 }).notNull(), // twitter, github, linkedin, etc.
  platformUserId: varchar('platform_user_id', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  profileUrl: text('profile_url').notNull(),

  // OAuth tokens (encrypted)
  accessToken: text('access_token'), // Encrypted
  refreshToken: text('refresh_token'), // Encrypted
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),

  // Display
  isPublic: boolean('is_public').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),

  // Verification
  isVerified: boolean('is_verified').default(false).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),

  // Metadata
  metadata: jsonb('metadata').default({}), // Platform-specific data

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('social_accounts_user_id_idx').on(table.userId),
  uniqueIndex('social_accounts_platform_user_idx').on(table.platform, table.platformUserId),
])

// ============================================
// CHAT SESSIONS & MESSAGES
// ============================================

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Session info
  title: varchar('title', { length: 255 }),
  model: varchar('model', { length: 100 }).default('meowdel-default').notNull(),

  // Stats
  messageCount: integer('message_count').default(0).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => [
  index('chat_sessions_user_id_idx').on(table.userId, table.createdAt),
])

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }).notNull(),

  // Message content
  role: varchar('role', { length: 20 }).notNull(), // user, assistant, system
  content: text('content').notNull(),

  // AI metadata
  model: varchar('model', { length: 100 }),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),

  // Cat personality metadata
  catMood: varchar('cat_mood', { length: 50 }), // playful, sleepy, curious, etc.
  catAction: text('cat_action'), // *purr*, *tail swish*, etc.

  // Metadata
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('chat_messages_session_id_idx').on(table.sessionId, table.createdAt),
])

// ============================================
// MEOWCONNECT - DESKTOP CLIENTS
// ============================================

export const desktopClients = pgTable('desktop_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Device info
  clientId: varchar('client_id', { length: 255 }).unique().notNull(), // UUID from desktop app
  deviceName: varchar('device_name', { length: 255 }).notNull(),
  deviceType: varchar('device_type', { length: 50 }).notNull(), // macos, windows, linux

  // Authentication
  authTokenHash: varchar('auth_token_hash', { length: 255 }).notNull(),

  // Permissions (what user allowed)
  permissions: jsonb('permissions').default({
    photos: false,
    files: false,
    clipboard: false,
    systemInfo: false,
    screenshots: false,
  }).notNull(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  lastSeen: timestamp('last_seen', { withTimezone: true }),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),

  // Metadata
  appVersion: varchar('app_version', { length: 50 }),
  osVersion: varchar('os_version', { length: 100 }),
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('desktop_clients_user_id_idx').on(table.userId),
  uniqueIndex('desktop_clients_client_id_idx').on(table.clientId),
])

export const clientSyncData = pgTable('client_sync_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => desktopClients.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Data classification
  dataType: varchar('data_type', { length: 100 }).notNull(), // photo, file, clipboard, system_info, etc.
  category: varchar('category', { length: 100 }), // work, personal, screenshot, etc.

  // Content
  title: varchar('title', { length: 500 }),
  description: text('description'),
  fileUrl: text('file_url'), // R2/S3 URL if applicable
  fileSizeBytes: integer('file_size_bytes'),
  mimeType: varchar('mime_type', { length: 100 }),

  // AI context
  aiContext: text('ai_context'), // What the AI should know about this
  tags: text('tags').array(),

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Timestamps
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }), // When it was created on device
  expiresAt: timestamp('expires_at', { withTimezone: true }), // Optional expiration
}, (table) => [
  index('client_sync_data_client_id_idx').on(table.clientId, table.syncedAt),
  index('client_sync_data_user_id_idx').on(table.userId, table.dataType),
])

// ============================================
// VOICE LIBRARY & BINDINGS (ELEVENLABS)
// ============================================

export const voiceModels = pgTable('voice_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // ElevenLabs mapping
  elevenLabsVoiceId: varchar('elevenlabs_voice_id', { length: 255 }).unique().notNull(),
  
  // Voice Metadata
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  previewUrl: text('preview_url'), // Link to an audio preview
  
  // Pricing & Monetization
  baseCostPerMinuteCents: integer('base_cost_per_minute_cents').default(0).notNull(), // Underlying ElevenLabs cost
  markupPerMinuteCents: integer('markup_per_minute_cents').default(20).notNull(), // Our profit margin (e.g. 20 cents)
  
  // Tags/Categories
  category: varchar('category', { length: 100 }), // e.g., 'professional', 'funny', 'cartoony'
  isPremium: boolean('is_premium').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('voice_models_active_idx').on(table.isActive),
])

export const userVoiceBindings = pgTable('user_voice_bindings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // The Meowdel personality ID (e.g. 'professor', 'ninja', 'mittens')
  personalityId: varchar('personality_id', { length: 100 }).notNull(),
  
  // The bound voice
  voiceModelId: uuid('voice_model_id').references(() => voiceModels.id, { onDelete: 'cascade' }).notNull(),
  
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_voice_bindings_user_personality_idx').on(table.userId, table.personalityId),
  index('user_voice_bindings_user_id_idx').on(table.userId),
])

// ============================================
// USAGE & BILLING
// ============================================

export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Usage type
  usageType: varchar('usage_type', { length: 100 }).notNull(), // chat_message, ai_tokens, storage, etc.

  // Quantities
  quantity: integer('quantity').default(1).notNull(),
  units: varchar('units', { length: 50 }), // messages, tokens, MB, etc.

  // Cost (if applicable)
  costCents: integer('cost_cents'),

  // References
  sessionId: uuid('session_id').references(() => chatSessions.id, { onDelete: 'set null' }),
  messageId: uuid('message_id').references(() => chatMessages.id, { onDelete: 'set null' }),

  // Metadata
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('usage_records_user_id_idx').on(table.userId, table.createdAt),
  index('usage_records_type_idx').on(table.usageType, table.createdAt),
])

export const billingTransactions = pgTable('billing_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Transaction info
  amountCents: integer('amount_cents').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // subscription, credits, refund
  status: varchar('status', { length: 50 }).default('completed').notNull(),

  // Stripe
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }),

  // Description
  description: text('description'),

  // Metadata
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('billing_transactions_user_id_idx').on(table.userId, table.createdAt),
])

// ============================================
// SYSTEM TABLES
// ============================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Action
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: uuid('resource_id'),

  // Details
  details: jsonb('details').default({}),

  // Request info
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('audit_logs_user_id_idx').on(table.userId, table.createdAt),
  index('audit_logs_action_idx').on(table.action, table.createdAt),
])

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Key info
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 10 }).notNull(), // First 8 chars for display

  // Permissions
  permissions: jsonb('permissions').default([]).notNull(),

  // Usage
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: integer('usage_count').default(0).notNull(),

  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('api_keys_user_id_idx').on(table.userId),
  index('api_keys_key_hash_idx').on(table.keyHash),
])

// ============================================
// BROWSERID - Auto-Login & Identification
// ============================================

export const browseridUsers = pgTable('browserid_users', {
  browserID: varchar('browser_id', { length: 64 }).primaryKey(),

  // Link to main user account (if OAuth linked)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),

  // OAuth data
  oauthProvider: varchar('oauth_provider', { length: 50 }),
  oauthLinkedAt: timestamp('oauth_linked_at', { withTimezone: true }),

  // Session tracking
  firstSeen: timestamp('first_seen', { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
  sessionCount: integer('session_count').notNull().default(1),

  // Cat personality (stored as JSONB)
  catPersonality: jsonb('cat_personality').notNull(),

  // Cross-device sync
  linkedBrowserIDs: jsonb('linked_browser_ids').notNull().default('[]'),

  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('browserid_users_user_id_idx').on(table.userId),
  index('browserid_users_last_seen_idx').on(table.lastSeen),
])

export const browseridOauthMappings = pgTable('browserid_oauth_mappings', {
  id: uuid('id').defaultRandom().primaryKey(),
  oauthProvider: varchar('oauth_provider', { length: 50 }).notNull(),
  oauthUserId: varchar('oauth_user_id', { length: 255 }).notNull(),
  browserID: varchar('browser_id', { length: 64 }).notNull(),
  linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('browserid_oauth_provider_idx').on(table.oauthProvider, table.oauthUserId),
  index('browserid_oauth_browser_idx').on(table.browserID),
])

export const browseridConversations = pgTable('browserid_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  browserID: varchar('browser_id', { length: 64 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),

  // Context
  codeContext: text('code_context'),
  tags: jsonb('tags').default('[]'),

  // Sentiment & Feedback
  userSentiment: varchar('user_sentiment', { length: 20 }),
  helpfulness: integer('helpfulness'),
}, (table) => [
  index('browserid_conversations_browser_idx').on(table.browserID, table.timestamp),
])

export const browseridSolvedProblems = pgTable('browserid_solved_problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  browserID: varchar('browser_id', { length: 64 }).notNull(),
  problemType: varchar('problem_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  solution: text('solution').notNull(),
  solvedAt: timestamp('solved_at', { withTimezone: true }).notNull().defaultNow(),
  helpfulness: integer('helpfulness'),
  tags: jsonb('tags').default('[]'),
}, (table) => [
  index('browserid_solved_problems_browser_idx').on(table.browserID, table.solvedAt),
])
