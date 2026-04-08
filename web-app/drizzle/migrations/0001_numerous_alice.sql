CREATE TABLE "agent_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"agent_name" varchar(100),
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"error_message" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brain_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"embedding_json" jsonb NOT NULL,
	"model" varchar(100) DEFAULT 'claude-embed' NOT NULL,
	"dimensions" integer DEFAULT 1536 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brain_embeddings_note_id_unique" UNIQUE("note_id")
);
--> statement-breakpoint
CREATE TABLE "brain_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_note_id" uuid NOT NULL,
	"target_note_id" uuid NOT NULL,
	"link_text" varchar(500),
	"is_auto_linked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brain_note_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"tags" text[] DEFAULT '{}',
	"version_number" integer NOT NULL,
	"author_type" varchar(20) DEFAULT 'user' NOT NULL,
	"agent_name" varchar(100),
	"change_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brain_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid,
	"slug" varchar(500) NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"frontmatter" jsonb DEFAULT '{}'::jsonb,
	"tags" text[] DEFAULT '{}',
	"summary" text,
	"key_concepts" jsonb DEFAULT '[]'::jsonb,
	"word_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "brain_workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brain_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"is_personal" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_key" varchar(100) NOT NULL,
	"minimum_tier" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_gates_feature_key_unique" UNIQUE("feature_key")
);
--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD CONSTRAINT "agent_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_embeddings" ADD CONSTRAINT "brain_embeddings_note_id_brain_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."brain_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_links" ADD CONSTRAINT "brain_links_source_note_id_brain_notes_id_fk" FOREIGN KEY ("source_note_id") REFERENCES "public"."brain_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_links" ADD CONSTRAINT "brain_links_target_note_id_brain_notes_id_fk" FOREIGN KEY ("target_note_id") REFERENCES "public"."brain_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_note_versions" ADD CONSTRAINT "brain_note_versions_note_id_brain_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."brain_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_note_versions" ADD CONSTRAINT "brain_note_versions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_notes" ADD CONSTRAINT "brain_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_notes" ADD CONSTRAINT "brain_notes_workspace_id_brain_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_workspace_members" ADD CONSTRAINT "brain_workspace_members_workspace_id_brain_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_workspace_members" ADD CONSTRAINT "brain_workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_workspaces" ADD CONSTRAINT "brain_workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_jobs_status_idx" ON "agent_jobs" USING btree ("status","priority","scheduled_for");--> statement-breakpoint
CREATE INDEX "agent_jobs_user_idx" ON "agent_jobs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "brain_embeddings_note_idx" ON "brain_embeddings" USING btree ("note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brain_links_source_target_idx" ON "brain_links" USING btree ("source_note_id","target_note_id");--> statement-breakpoint
CREATE INDEX "brain_links_target_idx" ON "brain_links" USING btree ("target_note_id");--> statement-breakpoint
CREATE INDEX "brain_note_versions_note_idx" ON "brain_note_versions" USING btree ("note_id","version_number");--> statement-breakpoint
CREATE INDEX "brain_notes_user_updated_idx" ON "brain_notes" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "brain_notes_user_slug_idx" ON "brain_notes" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "brain_notes_workspace_idx" ON "brain_notes" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "brain_notes_tags_idx" ON "brain_notes" USING btree ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "brain_workspace_members_idx" ON "brain_workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "brain_workspace_members_user_idx" ON "brain_workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brain_workspaces_slug_idx" ON "brain_workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "brain_workspaces_owner_idx" ON "brain_workspaces" USING btree ("owner_id");