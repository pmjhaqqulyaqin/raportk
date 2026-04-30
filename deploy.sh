#!/bin/bash
set -e

# ============================================
#  RaportK Deployment Script
#  Usage: ./deploy.sh
#  Repo : https://github.com/pmjhaqqulyaqin/raportk
# ============================================

APP_DIR="/opt/raportk"
COMPOSE_FILE="docker-compose.prod.yml"

echo ""
echo "=========================================="
echo "  🚀 Deploying RaportK..."
echo "=========================================="
echo ""

cd "$APP_DIR"

# 1. Pull latest code
echo "📥 [1/5] Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main
echo "    ✓ Code updated"

# 1b. Verify required secrets in .env.production
echo "    🔐 Checking required environment variables..."
MISSING=""
for VAR in VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_EMAIL GEMINI_API_KEY; do
    if ! grep -q "^${VAR}=" "$APP_DIR/.env.production" 2>/dev/null; then
        MISSING="$MISSING $VAR"
    fi
done
if [ -n "$MISSING" ]; then
    echo "    ⚠ MISSING in .env.production:$MISSING"
    echo "    → Add them manually: nano $APP_DIR/.env.production"
else
    echo "    ✓ All required secrets present"
fi

# 2. Build & restart containers
echo ""
echo "🐳 [2/5] Building and starting Docker containers..."
docker compose -f "$COMPOSE_FILE" build --no-cache
docker compose -f "$COMPOSE_FILE" up -d
echo "    ✓ Containers started"

# 3. Wait for database to be healthy
echo ""
echo "⏳ [3/5] Waiting for services to be ready..."
sleep 10

# 4. Run database migrations
echo ""
echo "📊 [4/5] Running database migrations..."

# Get DB credentials from the .env.production file
DB_USER=$(grep -E '^POSTGRES_USER=' "$APP_DIR/.env.production" | cut -d'=' -f2)
DB_NAME=$(grep -E '^POSTGRES_DB=' "$APP_DIR/.env.production" | cut -d'=' -f2)
DB_USER=${DB_USER:-raportk_user}
DB_NAME=${DB_NAME:-raportk}

# 4a. Schema migrations (drizzle-kit or raw SQL fallback)
if docker exec raportk-app npx drizzle-kit push --config=drizzle.config.ts 2>&1; then
    echo "    ✓ Drizzle schema migrations applied"
else
    echo "    ⚠ Drizzle-kit failed, applying schema SQL directly..."
    docker exec raportk-db psql -U "$DB_USER" -d "$DB_NAME" -c "
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
            user_id TEXT NOT NULL REFERENCES \"user\"(id) ON DELETE CASCADE,
            role TEXT DEFAULT 'guru' NOT NULL,
            class_group TEXT,
            joined_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS shared_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            shared_by TEXT NOT NULL REFERENCES \"user\"(id) ON DELETE CASCADE,
            is_official BOOLEAN DEFAULT FALSE,
            shared_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            actor_id TEXT NOT NULL REFERENCES \"user\"(id) ON DELETE CASCADE,
            action TEXT NOT NULL,
            payload TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            sender_id TEXT NOT NULL REFERENCES \"user\"(id) ON DELETE CASCADE,
            recipient_id TEXT,
            message TEXT NOT NULL,
            reply_to UUID,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_chat_school_time ON chat_messages(school_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_students_user_class ON students(user_id, class_id);
        CREATE INDEX IF NOT EXISTS idx_reports_user_student ON reports(user_id, student_id);
        
        -- Add recipient_id to existing table if missing
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS recipient_id TEXT;
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES \"user\"(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- v1.5: Parent Portal share token
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS reports_share_token_idx ON reports(share_token);

        -- v1.6: Marketplace
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;
        CREATE TABLE IF NOT EXISTS marketplace_votes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES \"user\"(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- v1.7: Performance indexes
        CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);
        CREATE INDEX IF NOT EXISTS templates_is_public_idx ON templates(is_public);
        CREATE INDEX IF NOT EXISTS mv_template_id_idx ON marketplace_votes(template_id);
        CREATE INDEX IF NOT EXISTS mv_user_id_idx ON marketplace_votes(user_id);
    " 2>&1 && echo "    ✓ Schema SQL applied" || echo "    ⚠ Schema SQL warning"
fi

# 4b. Data fixes — ALWAYS run (safe & idempotent)
echo "    🔧 Running data fixes..."
docker exec raportk-db psql -U "$DB_USER" -d "$DB_NAME" -c "
    -- Fix corrupted base64/blob image data in user table (causes session hang)
    UPDATE \"user\" SET image = NULL WHERE image LIKE 'data:%' OR image LIKE 'blob:%' OR length(image) > 500;
" 2>&1 && echo "    ✓ Data fixes applied" || echo "    ⚠ Data fix warning"

echo "    ✓ Migrations complete"

# 5. Health check
echo ""
echo "🏥 [5/5] Checking application health..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/api/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ RaportK deployed successfully!"
    echo "  🌐 https://raportk.mandualotim.sch.id"
    echo "=========================================="
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ❌ Health check failed (HTTP $HTTP_CODE)"
    echo "=========================================="
    echo ""
    echo "📋 Last 30 lines of app logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=30 app
    exit 1
fi
