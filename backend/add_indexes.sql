-- Performance indexes for marketplace and templates
-- Run on production database after deployment

CREATE INDEX IF NOT EXISTS "templates_user_id_idx" ON "templates" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "templates_is_public_idx" ON "templates" USING btree ("is_public");
CREATE INDEX IF NOT EXISTS "mv_template_id_idx" ON "marketplace_votes" USING btree ("template_id");
CREATE INDEX IF NOT EXISTS "mv_user_id_idx" ON "marketplace_votes" USING btree ("user_id");
