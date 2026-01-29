#\!/bin/bash
# Aleff AI Container Run Script
# Both .moltbot and .clawdbot mount to same data dir for compatibility

docker run -d \
  --name aleffai \
  --restart unless-stopped \
  --network aleff_default \
  -p 18789:18789 \
  -v /home/devuser/Desktop/abckx/aleff/data:/home/node/.moltbot:rw \
  -v /home/devuser/Desktop/abckx/aleff/data:/home/node/.clawdbot:rw \
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
  -e WAVESPEED_API_KEY="${WAVESPEED_API_KEY}" \
  -e DATABASE_URL="${DATABASE_URL}" \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER="${POSTGRES_USER}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_DB="${POSTGRES_DB}" \
  aleff:latest \
  node dist/index.js gateway --bind lan --port 18789

echo "Aleff AI started. Check: docker logs -f aleffai"
