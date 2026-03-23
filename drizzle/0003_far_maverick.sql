ALTER TABLE "referral_codes" ADD COLUMN "reserved_username" text;--> statement-breakpoint
CREATE INDEX "clicks_user_id_created_at_idx" ON "clicks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_link_id_created_at_idx" ON "clicks" USING btree ("link_id","created_at");