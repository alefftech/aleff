# 🦞 Aleff - Assistente AI da Holding

> **Fork customizado do [Moltbot](https://github.com/moltbot/moltbot) para a Inteligência Avançada**

---

## 🎯 Visão

**Aleff** é o assistente AI pessoal do Founder e C-levels da holding. Sua missão é **multiplicar capacidade humana via automação inteligente**.

```
ALEFF = MEMÓRIA INSTITUCIONAL + AUTOMAÇÃO + INTELIGÊNCIA
├── Guarda histórico de conversas e decisões (Founder Memory)
├── Gera scripts de automação sob demanda (Pokemon Generator)
├── Responde queries sobre a fonte de verdade (Supabase)
└── Executa tarefas operacionais com safety rails
```

## 📊 Status Atual

| Componente | Status | Descrição |
|------------|--------|-----------|
| **Gateway** | ✅ Running | ws://127.0.0.1:18789 no dev-04 |
| **Telegram** | ✅ Connected | @aleff_000_bot |
| **Claude Max** | ✅ Authenticated | via setup-token (OAuth) |
| **Supabase** | ✅ Schema ready | aleff.* + acesso a founder_* |
| **Auto-start** | ✅ Enabled | systemd on dev-04 |

## 🧠 Capacidades

### Já Funcionando
- [x] Responder via Telegram (@aleff_000_bot)
- [x] Usar Claude Opus 4.5 (Max subscription)
- [x] Rodar 24/7 no dev-04

### Em Desenvolvimento (Roadmap)
- [ ] **Founder Memory** - Histórico + vector search em conversas
- [ ] **Supabase Queries** - Consultas naturais na fonte de verdade
- [ ] **Pokemon Generator** - Gerar scripts de automação
- [ ] **Safety Rails** - Aprovação humana para ações destrutivas

## 🗄️ Fonte de Verdade (Supabase)

### Tabelas do Aleff (`aleff.*`)
```sql
aleff.conversations    -- Sessões de conversa
aleff.messages         -- Mensagens com embeddings vector(1536)
aleff.memory_index     -- Fatos e decisões indexadas
aleff.pokemons_generated -- Scripts automáticos gerados
aleff.audit_log        -- Trail de segurança
```

### Tabelas do Founder (acesso leitura)
```sql
founder_infos          -- Informações pessoais (category, topic, content)
founder_chat_log       -- Histórico conversas (mood, productivity)
founder_brilliant_ideas -- Ideias com filtro Filipenses 4:8
founder_todo           -- Tarefas com impact_score
founder_changelog      -- Decisões
founder_dailylog       -- Log diário
```

## 🚀 Deploy

**Server:** dev-04 (ccx13, 178.156.214.14)

```bash
# SSH
ssh dev-04

# Logs
docker logs aleffai -f

# Restart
docker restart aleffai

# Status
docker ps | grep aleffai
```

**Arquivos:**
```
/opt/aleff/
├── docker-compose.aleff.yml  # Config container
├── data/moltbot.json         # Config gateway + telegram
└── Dockerfile                # Image aleff:latest
```

## 🔧 Desenvolvimento

```bash
# Clone
git clone https://github.com/alefftech/aleff.git
cd aleff

# Install
pnpm install

# Build
pnpm build

# Run local
node dist/index.js gateway --bind loopback --port 18789
```

## 🛡️ Safety Rails

**Ações que REQUEREM aprovação humana:**
- Destruição de dados
- Deploy em produção
- Mudanças em infraestrutura
- Commits em repos principais

**O que Aleff pode fazer sozinho:**
- Responder perguntas
- Consultar Supabase (read-only)
- Gerar scripts (sem executar)
- Criar drafts de documentos

## 📚 Documentação

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia de deploy e troubleshooting
- [CLAUDE.md](./CLAUDE.md) - Instruções para o agente Aleff
- [AGENTS.md](./AGENTS.md) - Identidade e capabilities

## 🔗 Links

- **Upstream:** [moltbot/moltbot](https://github.com/moltbot/moltbot)
- **Docs Moltbot:** [docs.molt.bot](https://docs.molt.bot)
- **Holding:** [alefftech/holding](https://github.com/alefftech/holding)

---

**Owner:** CTO Ronald
**Created:** 2026-01-28
**Last Updated:** 2026-01-28
