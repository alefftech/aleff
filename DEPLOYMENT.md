# Aleff AI - Deployment Summary
**Date:** 2026-01-28  
**Server:** dev-04 (ccx13, 178.156.214.14)  
**Status:** ✅ DEPLOYED & RUNNING

---

## 🎯 Container Status

```
Container: aleffai
Status: running (healthy)
Gateway: ws://127.0.0.1:18789 (localhost only)
Telegram Bot: @aleff_000_bot
Auto-start: systemd enabled
```

## 🔑 Authentication

**Claude Max OAuth configurado:**
- Path host: `~/.claude/.credentials.json`
- Path container: `/home/node/.moltbot/agents/main/agent/auth-profiles.json`
- Profile: `claude-max` (OAuth tokens)

## 📁 Estrutura de Arquivos

```
/opt/aleff/
├── docker-compose.aleff.yml  # Container config
├── .env.local                 # Environment variables
├── data/
│   └── moltbot.json          # Moltbot config (gateway + auth + telegram)
└── logs/
```

## 🔧 Como acessar o container

```bash
# SSH no servidor
ssh dev-04

# Ver logs
docker logs aleffai -f

# Entrar no container (troubleshooting)
docker exec -it aleffai sh

# Verificar auth profiles
docker exec aleffai cat /home/node/.moltbot/agents/main/agent/auth-profiles.json | jq .

# Restart
sudo systemctl restart aleff
# ou
docker restart aleffai
```

## 🧪 Como testar

1. **Telegram Bot:**
   ```
   - Abrir Telegram
   - Buscar: @aleff_000_bot
   - Enviar: /start
   - Testar: "olá, você está funcionando?"
   ```

2. **Health Check:**
   ```bash
   ssh dev-04 "curl -s http://127.0.0.1:18789/health"
   ```

## 🐛 Troubleshooting

### Erro: "No API key found for provider anthropic"

**Solução implementada:**
1. Copiar credenciais do host para container:
   ```bash
   # Converter Claude credentials
   cat ~/.claude/.credentials.json | jq '{
     version: 1,
     profiles: {
       "claude-max": (
         .claudeAiOauth | {
           type: "oauth",
           provider: "anthropic",
           accessToken: .accessToken,
           refreshToken: .refreshToken,
           expires: .expires
         }
       )
     }
   }' > /tmp/auth-profiles.json
   
   # Copiar para container
   docker cp /tmp/auth-profiles.json aleffai:/home/node/.moltbot/agents/main/agent/auth-profiles.json
   docker exec aleffai chown node:node /home/node/.moltbot/agents/main/agent/auth-profiles.json
   docker restart aleffai
   ```

2. Adicionar auth order no config:
   ```json
   {
     "auth": {
       "profiles": {
         "claude-max": {
           "provider": "anthropic",
           "mode": "oauth"
         }
       },
       "order": {
         "anthropic": ["claude-max"]
       }
     }
   }
   ```

### Telegram webhook conflict

**Solução:**
```bash
curl -s "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
docker restart aleffai
```

## 📊 Supabase Schema

```sql
-- Database: holding (vxllqynrmwduobzcxake.supabase.co)
-- Schema: aleff

Tables:
- aleff.conversations       # Session tracking
- aleff.messages            # Messages with vector(1536) embeddings
- aleff.memory_index        # Indexed facts/decisions
- aleff.pokemons_generated  # Generated automation scripts
- aleff.audit_log           # Security trail

Functions:
- aleff.search_memory(query_embedding, threshold, limit)
- aleff.get_conversation_context(conversation_id, limit)
```

## 🚀 Próximos Passos

### P0: Founder Memory Extension
```bash
cd /mnt/HC_Volume_104479762/abckx/aleff
mkdir -p src/extensions
# Implementar founder-memory.ts
```

### P1: Pokemon Generator
- Analisar tarefas repetitivas do cto_todo
- Gerar scripts bash seguindo template
- Auto-commit no repo pokemon/

### P2: Traefik Exposure (opcional)
Se quiser expor via `aleff.a25.com.br`:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.aleff.rule=Host(`aleff.a25.com.br`)"
```

---

**Last Updated:** 2026-01-28 14:12 UTC  
**Owner:** CTO Ronald
