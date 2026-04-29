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

# 1b. Ensure VAPID keys in .env.production (idempotent)
if ! grep -q "VAPID_PUBLIC_KEY" "$APP_DIR/.env.production" 2>/dev/null; then
    echo "    🔑 Adding VAPID keys for push notifications..."
    cat >> "$APP_DIR/.env.production" << 'EOF'

# Web Push (VAPID)
VAPID_PUBLIC_KEY=BKbopqiukolYv03-qNuLXacNsGewQKh16VTg2QTz8DYMbXpT817MaQnEoV6qDfhS_LiNDPKVJaLBzh_h2ajxC9M
VAPID_PRIVATE_KEY=z4LhRVCygh7bjiy-h4IQ8IdS9q59JggQIwyW9g0hjyw
VAPID_EMAIL=mailto:admin@raportk.my.id
EOF
    echo "    ✓ VAPID keys added"
fi

# 1c. Ensure multi Gemini API keys in .env.production (idempotent)
GEMINI_KEYS="AIzaSyAcfqP_Q9UhE_DRwm_domaqjLDay5Rzkkw,AIzaSyBQTrG5Lhb3B1teSF3cH87JTeFFH1BkDGI,AIzaSyCWrg5fHd95ULk89PVlnDXj9Is_-QSNiJo,AIzaSyDC1_lf2_OIG_1gMEkAJjL-_LGUxMfhI6w,AIzaSyDex5B99gSZG5NDyOxezFyso4vlcnvnbvg"
CURRENT_KEY=$(grep -oP 'GEMINI_API_KEY=\K.*' "$APP_DIR/.env.production" 2>/dev/null || echo "")
if [ "$CURRENT_KEY" != "$GEMINI_KEYS" ]; then
    echo "    🤖 Updating Gemini API keys (5 keys rotation)..."
    if grep -q "GEMINI_API_KEY" "$APP_DIR/.env.production" 2>/dev/null; then
        sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEYS|" "$APP_DIR/.env.production"
    else
        echo "GEMINI_API_KEY=$GEMINI_KEYS" >> "$APP_DIR/.env.production"
    fi
    echo "    ✓ Gemini keys updated"
fi

# 1d. Ensure OpenRouter API key in .env.production (idempotent)
if ! grep -q "OPENROUTER_API_KEY" "$APP_DIR/.env.production" 2>/dev/null; then
    echo "    🌐 Adding OpenRouter fallback key..."
    echo "OPENROUTER_API_KEY=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" >> "$APP_DIR/.env.production"
    echo "    ✓ OpenRouter key added"
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
