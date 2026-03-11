CREATE TABLE "sms_blacklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"reason" text DEFAULT 'STOP' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sms_blacklist" ADD CONSTRAINT "sms_blacklist_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sms_blacklist_phone_org" ON "sms_blacklist" USING btree ("phone_number","organization_id");