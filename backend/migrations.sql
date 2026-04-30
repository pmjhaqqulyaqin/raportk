-- ============================================
-- RaportK Database Migrations (Idempotent)
-- Safe to run multiple times
-- ============================================

-- v1.1: Additional student fields
ALTER TABLE school_info ADD COLUMN IF NOT EXISTS npsn TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date TEXT;

-- v1.3: School collaboration tables
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npsn TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS school_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'guru' NOT NULL,
    class_group TEXT,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS shared_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    shared_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    is_official BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    payload TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    recipient_id TEXT,
    message TEXT NOT NULL,
    reply_to UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS recipient_id TEXT;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- v1.5: Parent Portal share token
ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token TEXT;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_share_token_unique') THEN
        ALTER TABLE reports ADD CONSTRAINT reports_share_token_unique UNIQUE (share_token);
    END IF;
END $$;

-- v1.6: Marketplace columns & table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS marketplace_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- v1.7: Performance indexes
CREATE INDEX IF NOT EXISTS students_user_id_idx ON students(user_id);
CREATE INDEX IF NOT EXISTS students_class_id_idx ON students(class_id);
CREATE INDEX IF NOT EXISTS reports_student_id_idx ON reports(student_id);
CREATE INDEX IF NOT EXISTS reports_share_token_idx ON reports(share_token);
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);
CREATE INDEX IF NOT EXISTS templates_is_public_idx ON templates(is_public);
CREATE INDEX IF NOT EXISTS mv_template_id_idx ON marketplace_votes(template_id);
CREATE INDEX IF NOT EXISTS mv_user_id_idx ON marketplace_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_school_time ON chat_messages(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_school_id_idx ON activity_logs(school_id);

-- Data fixes (safe & idempotent)
UPDATE "user" SET image = NULL WHERE image LIKE 'data:%' OR image LIKE 'blob:%' OR length(image) > 500;
