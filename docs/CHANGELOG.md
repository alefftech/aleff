# Changelog

Todas as mudanças notáveis do AleffAI serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Nada ainda

### Fixed
- Nada ainda

### Changed
- Nada ainda

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
