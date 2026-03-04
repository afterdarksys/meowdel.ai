-- BrowserID Tables Migration
-- Run this SQL on your PostgreSQL database

-- BrowserID Users Table
CREATE TABLE IF NOT EXISTS "browserid_users" (
  "browser_id" VARCHAR(64) PRIMARY KEY,
  "user_id" UUID,
  "email" VARCHAR(255),
  "name" VARCHAR(255),
  "oauth_provider" VARCHAR(50),
  "oauth_linked_at" TIMESTAMPTZ,
  "first_seen" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "last_seen" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "session_count" INTEGER NOT NULL DEFAULT 1,
  "cat_personality" JSONB NOT NULL,
  "linked_browser_ids" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "browserid_users_user_id_idx" ON "browserid_users"("user_id");
CREATE INDEX IF NOT EXISTS "browserid_users_last_seen_idx" ON "browserid_users"("last_seen");

-- OAuth Mappings Table
CREATE TABLE IF NOT EXISTS "browserid_oauth_mappings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "oauth_provider" VARCHAR(50) NOT NULL,
  "oauth_user_id" VARCHAR(255) NOT NULL,
  "browser_id" VARCHAR(64) NOT NULL,
  "linked_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "browserid_oauth_provider_idx" ON "browserid_oauth_mappings"("oauth_provider", "oauth_user_id");
CREATE INDEX IF NOT EXISTS "browserid_oauth_browser_idx" ON "browserid_oauth_mappings"("browser_id");

-- Conversations Table
CREATE TABLE IF NOT EXISTS "browserid_conversations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "browser_id" VARCHAR(64) NOT NULL,
  "role" VARCHAR(20) NOT NULL,
  "content" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "code_context" TEXT,
  "tags" JSONB DEFAULT '[]'::jsonb,
  "user_sentiment" VARCHAR(20),
  "helpfulness" INTEGER
);

CREATE INDEX IF NOT EXISTS "browserid_conversations_browser_idx" ON "browserid_conversations"("browser_id", "timestamp");

-- Solved Problems Table
CREATE TABLE IF NOT EXISTS "browserid_solved_problems" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "browser_id" VARCHAR(64) NOT NULL,
  "problem_type" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "solution" TEXT NOT NULL,
  "solved_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "helpfulness" INTEGER,
  "tags" JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS "browserid_solved_problems_browser_idx" ON "browserid_solved_problems"("browser_id", "solved_at");

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_browserid_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_browserid_users_updated_at
  BEFORE UPDATE ON "browserid_users"
  FOR EACH ROW
  EXECUTE FUNCTION update_browserid_users_updated_at();
