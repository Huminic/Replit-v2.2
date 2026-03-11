ALTER TABLE "campaign_recipients" ADD COLUMN "sequence_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD COLUMN "last_attempt_channel" text;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD COLUMN "last_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD COLUMN "responded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "follow_up_sequence" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "lead_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "lead_score_factors" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
CREATE INDEX "idx_conversations_lead_score" ON "conversations" USING btree ("lead_score");