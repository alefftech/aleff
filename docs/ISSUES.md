# Issues - AleffAI

## Prioridades
- **P0:** Critical (resolver AGORA - impacta produção)
- **P1:** High (resolver hoje)
- **P2:** Medium (resolver esta semana)
- **P3:** Low (backlog)

---

## 🐛 Bugs

### Abertos
- [ ] #001 [P2] State dir migration warning no startup - [2026-01-29]
  - Mensagem: "State dir migration skipped: target already exists"
  - Impacto: Baixo, apenas warning
  - Solução: Limpar `/home/node/.moltbot` antigo

### Resolvidos
- [x] #000 [P1] Conflito Telegram getUpdates - [2026-01-29] ✅
  - Causa: Múltiplas instâncias usando mesmo token
  - Solução: Parar container duplicado no dev-03

---

## 🚀 Features

### Backlog
- [ ] #F001 [P1] Sync upstream moltbot - [2026-01-29]
  - 30+ commits com fixes de segurança e Telegram
  - Ver `docs/UPSTREAM-NOTES.md`

- [ ] #F002 [P2] Health check Pokemon automático - [2026-01-29]
  - Script que monitora e alerta no Telegram

- [ ] #F003 [P3] Backup automático para S3 - [2026-01-29]
  - Daily backup do PostgreSQL

---

## 🔧 Melhorias

### Backlog
- [ ] #M001 [P2] Remover warning de model prefix - [2026-01-29]
  - Atualizar moltbot.json com `anthropic/` prefix

- [ ] #M002 [P3] Dashboard de métricas - [2026-01-29]
  - Grafana com uptime, response time, errors

---

## 📊 Estatísticas

| Tipo | Abertos | Resolvidos |
|------|---------|------------|
| Bugs | 1 | 1 |
| Features | 3 | 0 |
| Melhorias | 2 | 0 |

**Última atualização:** 2026-01-29
