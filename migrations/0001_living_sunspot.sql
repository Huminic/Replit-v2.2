CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"path" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "auto_greeting" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "triggers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "source_conversation_id" uuid;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "source_document_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "video_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse_leads" ADD COLUMN "followup_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_favorites_user" ON "favorites" USING btree ("user_id");