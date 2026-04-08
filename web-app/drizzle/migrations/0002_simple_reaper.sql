CREATE TABLE "brain_flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"easiness_factor" integer DEFAULT 250 NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_graph_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"repo_url" text NOT NULL,
	"repo_owner" varchar(255),
	"repo_name" varchar(255),
	"base_branch" varchar(255) DEFAULT 'main',
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"node_count" integer DEFAULT 0,
	"edge_count" integer DEFAULT 0,
	"file_count" integer DEFAULT 0,
	"languages_detected" jsonb DEFAULT '[]'::jsonb,
	"analysis_result" jsonb,
	"summary_text" text,
	"estimated_token_savings" integer,
	"error_message" text,
	"brain_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"synced_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"category" varchar(100),
	"is_published" boolean DEFAULT false NOT NULL,
	"install_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "note_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rss_feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feed_url" text NOT NULL,
	"title" varchar(255),
	"description" text,
	"site_url" text,
	"auto_import" boolean DEFAULT true NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_item_guid" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"custom_system_prompt" text,
	"meowdel_persona_name" varchar(100) DEFAULT 'Meowdel',
	"preferred_model" varchar(100) DEFAULT 'claude-sonnet-4-6',
	"default_swarm_mode" varchar(50) DEFAULT 'auto',
	"auto_embed_notes" boolean DEFAULT true NOT NULL,
	"auto_link_notes" boolean DEFAULT true NOT NULL,
	"auto_summarize_notes" boolean DEFAULT true NOT NULL,
	"editor_theme" varchar(50) DEFAULT 'default',
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"show_word_count" boolean DEFAULT true NOT NULL,
	"default_note_view" varchar(20) DEFAULT 'edit',
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "brain_flashcards" ADD CONSTRAINT "brain_flashcards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_flashcards" ADD CONSTRAINT "brain_flashcards_note_id_brain_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."brain_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_graph_scans" ADD CONSTRAINT "code_graph_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_graph_scans" ADD CONSTRAINT "code_graph_scans_brain_note_id_brain_notes_id_fk" FOREIGN KEY ("brain_note_id") REFERENCES "public"."brain_notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_templates" ADD CONSTRAINT "note_templates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_feeds" ADD CONSTRAINT "rss_feeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brain_flashcards_user_idx" ON "brain_flashcards" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE INDEX "brain_flashcards_note_idx" ON "brain_flashcards" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "code_graph_scans_user_idx" ON "code_graph_scans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "code_graph_scans_repo_idx" ON "code_graph_scans" USING btree ("repo_url");--> statement-breakpoint
CREATE INDEX "integrations_user_idx" ON "integrations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_user_provider_idx" ON "integrations" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "note_templates_published_idx" ON "note_templates" USING btree ("is_published","install_count");--> statement-breakpoint
CREATE INDEX "note_templates_author_idx" ON "note_templates" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "rss_feeds_user_idx" ON "rss_feeds" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rss_feeds_user_url_idx" ON "rss_feeds" USING btree ("user_id","feed_url");--> statement-breakpoint
CREATE INDEX "user_settings_user_idx" ON "user_settings" USING btree ("user_id");