#!/bin/bash
# =============================================================================
# [SCRIPT:RUN] AleffAI Container Run Script
# =============================================================================
#
# Usage:
#   ./run-aleffai.sh              # Run with docker-compose (recommended)
#   ./run-aleffai.sh --standalone # Run standalone container
#
# This script is portable - works from any directory.
#
# =============================================================================

set -e

# [CONFIG:PATHS] Get script directory (portable)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# [CONFIG:ENV] Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "WARNING: .env file not found. Copy .env.example to .env and configure."
fi

# [RUN:MODE] Check run mode
if [ "$1" == "--standalone" ]; then
  # ==========================================================================
  # [RUN:STANDALONE] Run without docker-compose
  # ==========================================================================
  echo "Running AleffAI in standalone mode..."

  # Stop existing container
  docker stop aleffai 2>/dev/null || true
  docker rm aleffai 2>/dev/null || true

  # Create network if not exists
  docker network create aleff_default 2>/dev/null || true

  # Run container
  docker run -d \
    --name aleffai \
    --restart unless-stopped \
    --network aleff_default \
    -p "${GATEWAY_PORT:-18789}:18789" \
    -v "${SCRIPT_DIR}/data:/home/node/.moltbot:rw" \
    -v "${SCRIPT_DIR}/app/workspace:/home/node/clawd:rw" \
    -v "${SCRIPT_DIR}/gogcli:/home/node/.config/gogcli:rw" \
    -v "${SCRIPT_DIR}/clawdbot:/home/node/.clawdbot:rw" \
    -e HOME=/home/node \
    -e NODE_ENV=production \
    -e MOLTBOT_BIND=lan \
    -e MOLTBOT_PORT=18789 \
    -e OPENAI_API_KEY="${OPENAI_API_KEY}" \
    -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" \
    -e TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" \
    -e DATABASE_URL="${DATABASE_URL:-postgresql://aleff:aleff_local_2026@postgres:5432/aleff_memory}" \
    -e POSTGRES_HOST="${POSTGRES_HOST:-postgres}" \
    -e POSTGRES_PORT="${POSTGRES_PORT:-5432}" \
    -e POSTGRES_USER="${POSTGRES_USER:-aleff}" \
    -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-aleff_local_2026}" \
    -e POSTGRES_DB="${POSTGRES_DB:-aleff_memory}" \
    -e GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD:-aleff2026secure}" \
    "${ALEFFAI_IMAGE:-aleffai:latest}" \
    sh -c "ln -sf /home/node/.moltbot /home/node/.clawdbot && node dist/index.js gateway --bind lan --port 18789"

  echo "AleffAI started (standalone). Check: docker logs -f aleffai"

else
  # ==========================================================================
  # [RUN:COMPOSE] Run with docker-compose (recommended)
  # ==========================================================================
  echo "Running AleffAI with docker-compose..."

  # Build and start
  docker compose -f docker-compose.aleffai.yml up -d --build

  echo "AleffAI started. Check: docker compose -f docker-compose.aleffai.yml logs -f aleffai"
fi
