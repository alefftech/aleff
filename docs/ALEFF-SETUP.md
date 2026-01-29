# Aleff AI - Setup Completo

**Data:** 2026-01-29
**Owner:** CTO Ronald
**Status:** Produção

---

## Resumo

Aleff AI é o assistente pessoal do Founder, baseado no Moltbot com integração completa ao Google Workspace e acesso via VPN privada.

---

## Infraestrutura

### Server dev-04

| Item | Valor |
|------|-------|
| IP Público | 178.156.214.14 |
| Tipo | Hetzner CCX13 |
| URL Pública | https://aleffai.a25.com.br |
| Telegram | @aleff_000_bot |
| VPN | 178.156.214.14:51820 |

### Containers

| Container | Imagem | Rede | Função |
|-----------|--------|------|--------|
| aleffai | aleff:latest | 172.20.0.3 | Moltbot Gateway |
| aleff-postgres | pgvector/pgvector:pg16 | 172.20.0.x | Founder Memory |
| wireguard-dev04 | linuxserver/wireguard | 10.10.10.1 | VPN + DNS |

---

## VPN (WireGuard)

### Servidor

```
Endpoint: 178.156.214.14:51820
Network: 10.10.10.0/24
DNS: 10.10.10.1 (dnsmasq integrado)
```

### Domínios Internos

| Domínio | IP | Descrição |
|---------|-----|-----------|
| aleffai.abckx.corp | 172.20.0.3 | Container Aleff |
| dev04.abckx.corp | 10.10.10.1 | VPN Gateway |
| vpn.abckx.corp | 10.10.10.1 | Alias VPN |

### Config Cliente

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

### Arquivos VPN

```
/opt/wireguard/
├── docker-compose.yml
├── wg0.conf
├── dnsmasq.conf
├── hosts.corp
├── server_private.key
├── server_public.key
├── client_private.key
├── client_public.key
└── custom-cont-init.d/
    └── 10-dnsmasq
```

---

## Google Workspace Integration

### OAuth

| Item | Valor |
|------|-------|
| Conta | aleff@iavancada.com |
| Project ID | neural-sunup-485823-g4 |
| Redirect URI | https://aleffai.a25.com.br/oauth/callback |

### Escopos Autorizados

```
- gmail.modify, gmail.send
- calendar, calendar.events
- drive (FULL ACCESS)
- pubsub
```

### CLI: gog v0.9.0

Instalado no container via Dockerfile.

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
| `gog calendar create --summary --from --to` | Criar evento |
| `gog calendar create --with-meet` | Criar com Meet |

### Drive (Full Access)

| Comando | Descrição |
|---------|-----------|
| `gog drive ls` | Listar arquivos |
| `gog drive search "query"` | Buscar |
| `gog drive get <id>` | Baixar |
| `gog drive mkdir "Nome"` | Criar pasta |
| `gog drive mv <id> <folder>` | Mover |
| `gog drive cp <id>` | Copiar |
| `gog drive rename <id> "Nome"` | Renomear |
| `gog drive rm <id>` | Deletar |
| `gog drive share --anyone` | Tornar público |
| `gog drive upload /path` | Upload |

### Arquivos Recebidos

Arquivos enviados via Telegram são salvos em:
```
/home/node/.moltbot/media/inbound/
```

---

## Workflows

### Arquivo → Drive → Link Público

```bash
# 1. Ver arquivo recebido
ls /home/node/.moltbot/media/inbound/

# 2. Upload para o Drive
gog drive upload --account aleff@iavancada.com /home/node/.moltbot/media/inbound/<arquivo>

# 3. Tornar público
gog drive share --account aleff@iavancada.com <file_id> --anyone --role reader
```

### Drive → Email com Anexo

```bash
# 1. Baixar arquivo do Drive
gog drive get --account aleff@iavancada.com <file_id>

# 2. Enviar por email
gog gmail send --account aleff@iavancada.com \
  --to "destinatario@email.com" \
  --subject "Arquivo" \
  --body "Segue arquivo." \
  --attach "./<nome_arquivo>"
```

---

## Variáveis de Ambiente (.env)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=552479160833-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REFRESH_TOKEN=1//05XD5JFSoZ_sf...
GOOGLE_ACCOUNT=aleff@iavancada.com

# Transcription
GROQ_API_KEY=gsk_...        # Primary (whisper-large-v3-turbo)
OPENAI_API_KEY=sk-proj-...  # Fallback (whisper-1)

# gog CLI
GOG_KEYRING_PASSWORD=aleff2026secure

# Supabase (Founder Memory)
SUPABASE_URL=https://vxllqynrmwduobzcxake.supabase.co
SUPABASE_SERVICE_KEY=<via Passbolt>
```

---

## Founder Memory (P0 - Pendente)

### Schema Supabase

Tabelas em `aleff.*`:
- `conversations` - Sessões de chat
- `messages` - Mensagens com embedding vector(1536)
- `memory_index` - Fatos indexados
- `audit_log` - Trail de auditoria

### Funções

- `aleff.search_memory(query_embedding, threshold, limit)`
- `aleff.get_conversation_context(conversation_id, limit)`

### Status

- [x] Schema criado
- [x] RLS configurado
- [ ] Plugin Moltbot para persistência
- [ ] Hook no message flow
- [ ] Vector search ativo

---

## Comandos Úteis

### Deploy

```bash
cd /opt/aleff
docker compose -f docker-compose.aleff.yml up -d --build
```

### Logs

```bash
docker logs -f aleffai
docker logs -f wireguard-dev04
```

### VPN Status

```bash
docker exec wireguard-dev04 wg show
```

### DNS Test

```bash
docker exec wireguard-dev04 nslookup aleffai.abckx.corp 10.10.10.1
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

---

**Autor:** CTO Ronald + Claude Opus 4.5
