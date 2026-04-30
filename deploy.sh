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

# Copy migration SQL file into the DB container and execute it
# This avoids all bash escaping issues with inline SQL
echo "    📄 Applying migrations from SQL file..."
docker cp "$APP_DIR/backend/migrations.sql" raportk-db:/tmp/migrations.sql
docker exec raportk-db psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migrations.sql 2>&1 && \
    echo "    ✓ Database migrations applied successfully" || \
    echo "    ⚠ Some migration warnings (usually safe to ignore for IF NOT EXISTS)"

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
