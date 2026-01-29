#\!/bin/bash
# Aleff AI Container Run Script
# Creates symlink .clawdbot -> .moltbot for compatibility

set -e

# Load env vars
cd /home/devuser/Desktop/abckx/aleff
source .env 2>/dev/null || true

# Stop and remove existing container
docker stop aleffai 2>/dev/null || true
docker rm aleffai 2>/dev/null || true

# Run container
docker run -d \
  --name aleffai \
  --restart unless-stopped \
  --network aleff_default \
  -p 18789:18789 \
  -v /home/devuser/Desktop/abckx/aleff/data:/home/node/.moltbot:rw \
  -v /home/devuser/Desktop/abckx/aleff/gogcli:/home/node/.config/gogcli:rw \
  -e HOME=/home/node \
  -e NODE_ENV=production \
  -e MOLTBOT_BIND=lan \
  -e MOLTBOT_PORT=18789 \
  -e OPENAI_API_KEY="${OPENAI_API_KEY}" \
  -e GROQ_API_KEY="${GROQ_API_KEY}" \
  -e GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  -e GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}" \
  -e GOOGLE_REFRESH_TOKEN="${GOOGLE_REFRESH_TOKEN}" \
  -e GOOGLE_ACCOUNT="${GOOGLE_ACCOUNT}" \
  -e GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD}" \
  -e SUPABASE_URL="${SUPABASE_URL}" \
  -e ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}" \
  -e WAVESPEED_API_KEY="${WAVESPEED_API_KEY:-8b8865be7450da26600de7fcd0003e3df40da4fc68630111c314804a425b995d}" \
  -e DATABASE_URL="${DATABASE_URL:-postgresql://aleff:aleff_local_2026@postgres:5432/aleff_memory}" \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER="${POSTGRES_USER:-aleff}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-aleff_local_2026}" \
  -e POSTGRES_DB="${POSTGRES_DB:-aleff_memory}" \
  aleff:latest \
  sh -c "ln -sf /home/node/.moltbot /home/node/.clawdbot && node dist/index.js gateway --bind lan --port 18789"

# Connect to traefik network
sleep 2
docker network connect traefik-public aleffai 2>/dev/null || true

echo "Aleff AI started. Check: docker logs -f aleffai"
