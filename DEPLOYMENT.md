# Aleff AI - Deployment Summary
**Date:** 2026-01-28  
**Server:** dev-04 (ccx13, 178.156.214.14)  
**Status:** ✅ DEPLOYED & WORKING

---

## 🎯 Container Status

```
Container: aleffai
Runtime: Docker
Status: running
Gateway: ws://127.0.0.1:18789 (localhost only)
Telegram Bot: @aleff_000_bot
Auto-start: systemd enabled
```

## 🔑 Authentication

**Claude Max via Setup-Token (OAuth Access Token):**
- Set as `ANTHROPIC_API_KEY` environment variable
- Token format: `sk-ant-oat01-...`
- Generated via: `claude setup-token` on authenticated host

## 📁 Files on Server

```
/opt/aleff/
├── docker-compose.aleff.yml  # Container config with ANTHROPIC_API_KEY
├── data/
│   └── moltbot.json          # Gateway + Telegram config
└── Dockerfile                # Built as aleff:latest
```

## 🔧 Commands

```bash
# SSH to server
ssh dev-04

# View logs
docker logs aleffai -f

# Restart
docker restart aleffai

# Stop/Start
docker compose -f /opt/aleff/docker-compose.aleff.yml down
docker compose -f /opt/aleff/docker-compose.aleff.yml up -d

# Systemd
sudo systemctl status aleffai
sudo systemctl restart aleffai
```

## 🔐 Config Files

### docker-compose.aleff.yml
```yaml
services:
  aleffai:
    container_name: aleffai
    image: aleff:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:18789:18789"
    environment:
      - ANTHROPIC_API_KEY=sk-ant-oat01-...  # Claude Max setup-token
      - TELEGRAM_BOT_TOKEN=...
      - NODE_ENV=production
    volumes:
      - ./data:/home/node/.moltbot:rw
    command:
      - node
      - dist/index.js
      - gateway
      - --bind
      - loopback
      - --port
      - "18789"
```

### data/moltbot.json
```json
{
  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "..."
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "...",
      "allowFrom": ["*"]
    }
  }
}
```

## 🐛 Troubleshooting

### "No API key found for provider anthropic"
1. Generate setup-token: `claude setup-token` (requires interactive TTY)
2. Use token as `ANTHROPIC_API_KEY` in docker-compose
3. Restart container

### "HTTP 401: invalid x-api-key"
- The API key is invalid or expired
- Generate new setup-token: `claude setup-token`
- Update `ANTHROPIC_API_KEY` in docker-compose.aleff.yml

### Telegram webhook conflict
```bash
curl -s "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
docker restart aleffai
```

## 🚀 Next Steps

### P0: Founder Memory
- [ ] Implement src/extensions/founder-memory.ts
- [ ] Connect to Supabase aleff.messages table
- [ ] Vector search via aleff.search_memory()

### P1: Pokemon Generator
- [ ] Analyze cto_todo for repetitive tasks
- [ ] Generate bash scripts following template
- [ ] Auto-commit to pokemon/ repo

### P2: Identity Configuration
- [ ] Configure Aleff's personality via Telegram
- [ ] Set up system prompts
- [ ] Define safety rails

---

**Last Updated:** 2026-01-28 14:36 UTC  
**Owner:** CTO Ronald
