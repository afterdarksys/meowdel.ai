CREATE TABLE "alarms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" varchar(255) NOT NULL DEFAULT 'Alarm',
  "hour" integer NOT NULL,
  "minute" integer NOT NULL,
  "timezone" varchar(100) NOT NULL DEFAULT 'UTC',
  "is_enabled" boolean NOT NULL DEFAULT true,
  "repeat_enabled" boolean NOT NULL DEFAULT false,
  "repeat_frequency" varchar(20) NOT NULL DEFAULT 'none',
  "repeat_days" integer[] DEFAULT '{}',
  "pet_id" varchar(100),
  "next_fire_at" timestamptz,
  "last_fired_at" timestamptz,
  "snooze_until" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "alarms_user_id_idx" ON "alarms" ("user_id");
CREATE INDEX "alarms_next_fire_idx" ON "alarms" ("next_fire_at");
