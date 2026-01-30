# Changelog

Todas as mudanças notáveis do AleffAI serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **whatsapp-megaapi: Dispatch Pipeline Integration** (WIP)
  - `src/runtime.ts` - Singleton para acesso ao PluginRuntime entre módulos
  - `src/monitor.ts` - Processa mensagens inbound via `dispatchReplyWithBufferedBlockDispatcher`
  - `src/webhook-handler.ts` - HTTP handler para webhooks com suporte a múltiplos paths
  - Suporte a `/megaapi-webhook` (novo) e `/hooks/megaapi` (legacy)

### Fixed
- **aleff-supervisor: Notificações Telegram reais** (commit f5ac4b1d5)
  - Corrigido `notify.ts` para enviar notificações via Telegram API
  - Hooks `message_received` e `before_agent_dispatch` funcionando

### Changed
- **whatsapp-megaapi/index.ts** - Substituído `api.emit("whatsapp:message")` por `api.registerHttpHandler()`
- **gateway/server-http.ts** - Sistema de `/hooks` agora passa adiante para outros handlers quando não encontra mapeamento (em vez de retornar 404)

### In Progress
- WhatsApp INPUT notifications ainda não funcionam porque:
  - Webhook do MegaAPI configurado para `/hooks/megaapi` com token do sistema de hooks
  - Handler precisa aceitar esse token (não apenas MEGAAPI_WEBHOOK_TOKEN)
  - Necessário: validar token do hooks.token OU atualizar URL no MegaAPI dashboard

---

## [2026.01.29] - 2026-01-29

### Added
- **Aleff Memory v2.2** com auto-capture e auto-recall
- Estrutura `app/` para separação infra/código
- `CLAUDE.md` como Product Owner do container
- Labels Traefik para `aleffai.abckx.corp`
- DNS interno via dnsmasq na VPN
- Documentação: CHANGELOG, ISSUES, ROADMAP

### Fixed
- Conflito Telegram resolvido (múltiplas instâncias)
- Porta 18789 fechada externamente (só via VPN)

### Changed
- Repo renomeado: `alefftech/aleff` → `alefftech/aleffai`
- Imagem Docker: `aleff:latest` → `aleffai:latest`
- Compose: `docker-compose.aleff.yml` → `docker-compose.aleffai.yml`

### Security
- Tokens movidos para `.env` (não commitado)
- Acesso apenas via VPN interna

---

## [2026.01.28] - 2026-01-28

### Added
- Fork inicial do `moltbot/moltbot`
- Plugin `aleff-memory` v2.0
- Schema PostgreSQL com pgvector
- Integração Telegram básica
