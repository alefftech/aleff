# Aleff AI - Setup Completo

**Data:** 2026-01-29
**Owner:** CTO Ronald
**Status:** Produção (VPN Only)

---

## Resumo

Aleff AI é o assistente pessoal do Founder, baseado no Moltbot com integração completa ao Google Workspace. Acesso exclusivo via VPN privada com SSL.

**Este documento serve como template para deploy de novos agentes na empresa.**

---

## Acesso

| Tipo | URL | Status |
|------|-----|--------|
| **VPN (Produção)** | https://aleffai.abckx.corp/__moltbot__/canvas/ | ✅ Ativo |
| **Traefik Dashboard** | https://dev04.abckx.corp | ✅ VPN Only |
| Público | ~~https://aleffai.a25.com.br~~ | ❌ Desativado |
| Telegram | @aleff_000_bot | ✅ Ativo |

---

## Infraestrutura

### Server dev-04

| Item | Valor |
|------|-------|
| IP Público | 178.156.214.14 |
| Tipo | Hetzner CCX13 |
| VPN Endpoint | 178.156.214.14:51820 |

### Containers

| Container | Função | Redes |
|-----------|--------|-------|
| aleffai | Moltbot Gateway | aleff_default, **traefik-public** |
| aleff-postgres | Founder Memory (pgvector) | aleff_default |
| wireguard-dev04 | VPN + DNS | aleff_default, traefik-public |
| traefik | Reverse Proxy + SSL | traefik-public |

> ⚠️ **IMPORTANTE:** O `aleffai` DEVE estar na rede `traefik-public` para que o Traefik consiga rotear o tráfego. Conecte com: `docker network connect traefik-public aleffai`

---

## Deploy do Container

### Script de Deploy

Arquivo: `/home/devuser/Desktop/abckx/aleff/run-aleffai.sh`

```bash
#!/bin/bash
source .env

docker run -d \
  --name aleffai \
  --restart unless-stopped \
  --network aleff_default \
  -p 18789:18789 \
  -v /path/to/data:/home/node/.moltbot:rw \
  -v /path/to/gogcli:/home/node/.config/gogcli:rw \
  -e HOME=/home/node \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@postgres:5432/dbname \
  # ... outras env vars ...
  aleff:latest \
  sh -c "ln -sf /home/node/.moltbot /home/node/.clawdbot && node dist/index.js gateway --bind lan --port 18789"

# Conectar à rede do Traefik
docker network connect traefik-public aleffai
```

> ⚠️ **IMPORTANTE:** O comando usa `sh -c` para criar symlink `.clawdbot → .moltbot` antes de iniciar. Isso é necessário porque o Moltbot usa paths diferentes dependendo do contexto.

### Volume Mounts

| Mount | Path Container | Descrição |
|-------|----------------|-----------|
| data → .moltbot | `/home/node/.moltbot` | Config principal, sessions, auth |
| gogcli | `/home/node/.config/gogcli` | Google OAuth tokens |

> ⚠️ **IMPORTANTE:** O container cria um symlink `.clawdbot → .moltbot` no startup porque o Moltbot usa paths diferentes dependendo do contexto. Isso é feito automaticamente pelo script de run.

### Estrutura de Dados

```
data/
├── agents/
│   └── aleff/
│       └── agent/
│           └── auth-profiles.json  # ⚠️ Anthropic API key
├── moltbot.json                    # Config do gateway
├── sessions/                       # Sessões ativas
├── telegram/                       # Estado do Telegram
└── media/
    └── inbound/                    # Arquivos recebidos
```

---

## Autenticação

### Anthropic API (Claude Max)

A chave da Anthropic é armazenada no auth-profiles.json do agent:

```
/home/node/.moltbot/agents/<agent_id>/agent/auth-profiles.json
```

**Formato:**
```json
{
  "version": 1,
  "profiles": {
    "claude-max": {
      "type": "token",
      "provider": "anthropic",
      "token": "sk-ant-oat01-..."
    }
  }
}
```

> ⚠️ **NUNCA commitar este arquivo.** Contém credenciais sensíveis.

### Criar auth-profiles.json

```bash
# Dentro do container ou no diretório montado
mkdir -p data/agents/<agent_id>/agent
cat > data/agents/<agent_id>/agent/auth-profiles.json << 'EOF'
{
  "version": 1,
  "profiles": {
    "claude-max": {
      "type": "token",
      "provider": "anthropic",
      "token": "SUA_API_KEY_AQUI"
    }
  }
}
EOF
```

---

## VPN (WireGuard)

### Servidor

```
Endpoint: 178.156.214.14:51820
Network: 10.10.10.0/24
DNS: 10.10.10.1 (dnsmasq integrado)
SSL: Traefik com cert self-signed *.abckx.corp
```

### Domínios Internos

| Domínio | Acesso | Descrição |
|---------|--------|-----------|
| https://aleffai.abckx.corp | VPN Only | Aleff AI Gateway |
| https://dev04.abckx.corp | VPN Only | Traefik Dashboard |
| aleff-direct.abckx.corp:18789 | VPN Only | Acesso direto (sem SSL) |

### Segurança

- **IPAllowList**: Apenas IPs da VPN (10.10.10.0/24) podem acessar
- **SSL**: Certificado self-signed para *.abckx.corp
- **Acesso público**: Completamente desativado

### Config Cliente WireGuard

```ini
[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY>
Address = 10.10.10.2/32
DNS = 10.10.10.1

[Peer]
PublicKey = tFDyhGZdNS2caqCESRmziTt/WmUVK1NBBTJSrpyhvkY=
Endpoint = 178.156.214.14:51820
AllowedIPs = 10.10.10.0/24, 172.20.0.0/24
PersistentKeepalive = 25
```

### Arquivos VPN (Server)

```
/opt/wireguard/
├── docker-compose.yml
├── wg0.conf              # PostUp inclui port forward 80/443 → Traefik
├── dnsmasq.conf
├── hosts.corp            # DNS interno *.abckx.corp
└── custom-cont-init.d/
    └── 10-dnsmasq

/opt/traefik/
├── traefik.yml
├── docker-compose.yml
├── certs/
│   ├── abckx.corp.crt    # Cert self-signed
│   └── abckx.corp.key
└── dynamic/
    ├── aleffai.yml       # Serviço Aleff
    └── abckx-corp.yml    # Rotas VPN + IPAllowList
```

---

## Google Workspace Integration

### OAuth

| Item | Valor |
|------|-------|
| Conta | aleff@iavancada.com |
| Project ID | neural-sunup-485823-g4 |

### Escopos Autorizados

```
- gmail.modify, gmail.send
- calendar, calendar.events
- drive (FULL ACCESS)
- pubsub
```

### CLI: gog v0.9.0

Instalado no container via Dockerfile. Tokens armazenados em `/home/node/.config/gogcli/`.

---

## Skills do Aleff

### Gmail

| Comando | Descrição |
|---------|-----------|
| `gog gmail search "query"` | Buscar emails |
| `gog gmail read <thread_id>` | Ler email |
| `gog gmail send --to --subject --body` | Enviar email |
| `gog gmail send --attach` | Enviar com anexo |

### Calendar

| Comando | Descrição |
|---------|-----------|
| `gog calendar events --today` | Agenda do dia |
| `gog calendar events --days 7` | Próximos 7 dias |
| `gog calendar create --with-meet` | Criar evento com Meet |

### Drive (Full Access)

| Comando | Descrição |
|---------|-----------|
| `gog drive ls` | Listar arquivos |
| `gog drive mkdir "Nome"` | Criar pasta |
| `gog drive mv <id> <folder>` | Mover |
| `gog drive share --anyone` | Tornar público |
| `gog drive upload /path` | Upload |

### Arquivos Recebidos

Arquivos enviados via Telegram são salvos em:
```
/home/node/.moltbot/media/inbound/
```

---

## Founder Memory

### Banco de Dados

**PostgreSQL Local** (aleff-postgres) com pgvector para embeddings.

| Tabela | Descrição |
|--------|-----------|
| conversations | Sessões de chat |
| messages | Mensagens com embedding vector(1536) |
| memory_index | Fatos indexados |
| entities | Entidades do knowledge graph |
| facts | Fatos do knowledge graph |
| relationships | Relacionamentos do knowledge graph |
| audit_log | Trail de auditoria |

### Status

- [x] Schema PostgreSQL criado
- [x] Plugin founder-memory carregado
- [x] Mensagens de usuário sendo persistidas (66+)
- [x] Mensagens de assistant sendo persistidas (2+)
- [ ] Vector search com embeddings
- [ ] Knowledge graph queries

### Conexão

```
DATABASE_URL=postgresql://aleff:***@postgres:5432/aleff_memory
```

---

## Control UI

### Acesso

```
https://aleffai.abckx.corp/?token=<GATEWAY_TOKEN>
```

O token está em `moltbot.json`:
```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "lZBJ3tVD6IgsjlbCOamot0HGDVfpw8cj"
    }
  }
}
```

### Configuração

Para habilitar a Control UI sem requisito de pareamento de dispositivo:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "dangerouslyDisableDeviceAuth": true
    }
  }
}
```

> ⚠️ `dangerouslyDisableDeviceAuth` só é seguro porque o acesso está restrito via VPN (IPAllowList).

---

## Troubleshooting

### Erro: "No API key found for provider anthropic"

**Causa:** auth-profiles.json não existe ou path .clawdbot não está linkado.

**Solução:**
O container usa um symlink `.clawdbot → .moltbot` criado no startup:
```bash
# Verificar symlink
docker exec aleffai ls -la /home/node/ | grep clawdbot
# Deve mostrar: .clawdbot -> /home/node/.moltbot

# Verificar auth-profiles
docker exec aleffai cat /home/node/.moltbot/agents/aleff/agent/auth-profiles.json

# Se não existir, criar no diretório de dados (fora do container)
mkdir -p data/agents/aleff/agent
cat > data/agents/aleff/agent/auth-profiles.json << 'EOF'
{
  "version": 1,
  "profiles": {
    "claude-max": {
      "type": "token",
      "provider": "anthropic",
      "token": "SUA_API_KEY_AQUI"
    }
  }
}
EOF
```

### Erro: "password authentication failed for user aleff"

**Causa:** PostgreSQL usando scram-sha-256 e senha não foi setada corretamente.

**Solução:**
```bash
docker exec aleff-postgres psql -U aleff -d aleff_memory -c "ALTER USER aleff WITH PASSWORD 'sua_senha';"
```

### Container reiniciando em loop

**Verificar:**
```bash
docker logs aleffai --tail 50
```

**Causas comuns:**
- Falta de API key
- Erro de conexão com PostgreSQL
- moltbot.json inválido

---

## Comandos Úteis

### Acesso via VPN

```bash
# Testar conexão
curl -k https://aleffai.abckx.corp/

# Ver dashboard Traefik
open https://dev04.abckx.corp
```

### Logs

```bash
ssh dev-04 "docker logs -f aleffai"
ssh dev-04 "docker logs -f wireguard-dev04"
```

### VPN Status

```bash
ssh dev-04 "docker exec wireguard-dev04 wg show"
```

### Founder Memory

```bash
# Contar mensagens
ssh dev-04 "docker exec aleff-postgres psql -U aleff -d aleff_memory -c 'SELECT COUNT(*) FROM messages;'"

# Ver últimas mensagens
ssh dev-04 "docker exec aleff-postgres psql -U aleff -d aleff_memory -c 'SELECT role, LEFT(content, 50), created_at FROM messages ORDER BY created_at DESC LIMIT 5;'"
```

### Restart Container

```bash
ssh dev-04 "docker restart aleffai"
# ou
ssh dev-04 "cd /home/devuser/Desktop/abckx/aleff && source .env && ./run-aleffai.sh"
```

---

## Replicando para Novo Projeto

### Checklist

1. [ ] Criar server (Hetzner CCX13 recomendado)
2. [ ] Instalar Docker + Docker Compose
3. [ ] Clonar repo do Moltbot/Aleff
4. [ ] Criar `.env` com todas as variáveis
5. [ ] Criar `data/agents/<id>/agent/auth-profiles.json`
6. [ ] Configurar PostgreSQL (se usar Founder Memory)
7. [ ] Configurar WireGuard (se VPN only)
8. [ ] Configurar Traefik (se SSL)
9. [ ] Rodar `./run-aleffai.sh`
10. [ ] Testar via Telegram

### Variáveis Obrigatórias

```bash
# API Keys
OPENAI_API_KEY=          # Embeddings, fallback
GROQ_API_KEY=            # Transcription

# Google OAuth (se usar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_ACCOUNT=

# Founder Memory (se usar)
DATABASE_URL=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
```

---

## Changelog

| Data | Tipo | Descrição |
|------|------|-----------|
| 2026-01-28 | feat | Deploy inicial Aleff AI |
| 2026-01-28 | feat | Google Workspace OAuth |
| 2026-01-29 | feat | gog CLI (Gmail, Calendar, Drive) |
| 2026-01-29 | feat | Full Drive access |
| 2026-01-29 | feat | WireGuard VPN + DNS interno |
| 2026-01-29 | security | Desativado acesso público |
| 2026-01-29 | feat | HTTPS via Traefik + cert self-signed |
| 2026-01-29 | security | IPAllowList para VPN only |
| 2026-01-29 | fix | Restaurado auth-profiles.json (Anthropic API) |
| 2026-01-29 | fix | Corrigido PostgreSQL password (scram-sha-256) |
| 2026-01-29 | fix | Symlink .clawdbot → .moltbot no startup |
| 2026-01-29 | fix | Conectar aleffai à rede traefik-public (Bad Gateway) |
| 2026-01-29 | feat | Control UI habilitada (dangerouslyDisableDeviceAuth) |
| 2026-01-29 | feat | Founder Memory salvando mensagens do assistant |
| 2026-01-29 | docs | Documentação completa para replicação |

---

**Autor:** CTO Ronald + Claude Opus 4.5
