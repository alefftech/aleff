# Aleff AI - Setup Completo

**Data:** 2026-01-29
**Owner:** CTO Ronald
**Status:** Produção (VPN Only)

---

## Resumo

Aleff AI é o assistente pessoal do Founder, baseado no Moltbot com integração completa ao Google Workspace. Acesso exclusivo via VPN privada com SSL.

---

## Acesso

| Tipo | URL | Status |
|------|-----|--------|
| **VPN (Produção)** | https://aleffai.abckx.corp | ✅ Ativo |
| **Dashboard** | https://dev04.abckx.corp | ✅ VPN Only |
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

| Container | Função | Rede |
|-----------|--------|------|
| aleffai | Moltbot Gateway | 172.20.0.3 |
| aleff-postgres | Founder Memory (pgvector) | 172.20.0.x |
| wireguard-dev04 | VPN + DNS | 10.10.10.1 |
| traefik | Reverse Proxy + SSL | 172.21.0.2 |

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
├── wg0.conf              # Inclui port forward 80/443 → Traefik
├── dnsmasq.conf
├── hosts.corp
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
- [x] Mensagens de usuário sendo persistidas (56+)
- [ ] Mensagens de assistant (hook pendente)
- [ ] Vector search com embeddings

### Conexão

```
DATABASE_URL=postgresql://aleff:***@postgres:5432/aleff_memory
```

---

## Autenticação

### Anthropic API (Claude Max)

A chave da Anthropic é armazenada no auth-profiles.json do agent:

```
/home/node/.moltbot/agents/aleff/agent/auth-profiles.json
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

> **IMPORTANTE:** Este arquivo contém credenciais sensíveis e NÃO deve ser commitado.

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
ssh dev-04 "docker exec aleff-postgres psql -U aleff -d aleff_memory -c 'SELECT COUNT(*) FROM messages;'"
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

---

**Autor:** CTO Ronald + Claude Opus 4.5
