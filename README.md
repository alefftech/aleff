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
| **Gateway** | ✅ Running | https://aleffai.a25.com.br |
| **Telegram** | ✅ Connected | @aleff_000_bot |
| **Claude Max** | ✅ Authenticated | via setup-token (OAuth) |
| **Supabase** | ✅ Schema ready | aleff.* + acesso a founder_* |
| **Auto-start** | ✅ Enabled | systemd on dev-04 |
| **Google OAuth** | ✅ Configured | aleff@iavancada.com (Gmail, Calendar) |
| **Transcription** | ✅ Working | Groq (primary) + OpenAI (fallback) |

## 🌐 URLs & Acessos

| Serviço | URL | Auth |
|---------|-----|------|
| **GUI Pública** | https://aleffai.a25.com.br | Token + Device Pairing |
| **WebSocket** | wss://aleffai.a25.com.br | Token header |
| **Telegram** | @aleff_000_bot | Open DM |
| **OAuth Callback** | https://aleffai.a25.com.br/oauth/callback | - |

## 🧠 Capacidades

### Já Funcionando
- [x] Responder via Telegram (@aleff_000_bot)
- [x] Usar Claude Opus 4.5 (Max subscription)
- [x] Rodar 24/7 no dev-04
- [x] GUI pública em https://aleffai.a25.com.br
- [x] Transcrição de áudio (Groq + OpenAI fallback)
- [x] Google OAuth configurado (aleff@iavancada.com)
- [x] **Gmail + Calendar** - Via gog CLI (buscar emails, criar eventos com Meet)
- [x] **Web Search** - Busca inteligente via Brave, Tavily ou Perplexity
- [x] **Founder Memory** - Persistência de conversas no Supabase (PostgreSQL + pgvector)

### Em Desenvolvimento (Roadmap)
- [ ] **Vector Search** - Busca semântica em histórico de conversas
- [ ] **Supabase Queries** - Consultas naturais na fonte de verdade
- [ ] **Pokemon Generator** - Gerar scripts de automação
- [ ] **Safety Rails** - Aprovação humana para ações destrutivas

## 🛠️ Skills Disponíveis

O Aleff possui 18+ skills instaladas e funcionando:

### Documentação & Edição
- **📄 nano-pdf** - Edita PDFs com linguagem natural
- **📑 wkhtmltopdf** - Gera PDFs profissionais de HTML
- **🎞️ video-frames** - Extrai frames de vídeos (ffmpeg)
- **🧾 summarize** - Resumos de URLs, YouTube, PDFs (Gemini/GPT)

### Automação Web & Scraping
- **🎭 Playwright** - Automação de navegadores (testes, scraping)
- **🤖 Puppeteer** - Screenshots, PDFs, web automation
- **🕷️ apify** - Web scraping (LinkedIn, Google Maps, Instagram, YouTube, Twitter/X)

### Display & Visualização
- **🖼️ Canvas** - Exibe dashboards HTML em devices conectados
- **🎬 remotion-dev** - Criação programática de vídeos (React-based)

### Google Workspace
- **📧 gog-gmail** - Envio de emails, busca, anexos (Gmail API)
- **📅 gog-calendar** - Agendamento, eventos com Meet (Calendar API)
- **👤 gog-contacts** - Gerenciamento de contatos, CRM sync (Contacts API)
- **📁 gog-drive** - Upload, download, compartilhamento (Drive API)

### Skills Customizadas (Holding)
- **📜 contract-parser** - Extrai dados de contratos PDF (AGILCONTRATOS)
- **🎙️ meeting-notes** - Transcreve áudios + gera resumos estruturados (MENTORINGBASE)
- **🧾 invoice-generator** - Gera notas fiscais a partir de templates (CFO)

### Skills Nativas (Bundled)
- **🐙 github** - Automação CI/CD, PRs, issues
- **🧵 tmux** - Processos paralelos, sessões interativas
- **🧿 oracle** - Análise profunda de codebase
- **📜 session-logs** - Busca em conversas anteriores

**📚 Documentação completa:** [skills/docs/README.md](skills/docs/README.md)

**Ver todas:** `ls skills/` (56 skills bundled + 6 customizadas)

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
**URL Pública:** https://aleffai.a25.com.br

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

**Arquivos no Server:**
```
/opt/aleff/
├── docker-compose.aleff.yml  # Config container
├── data/moltbot.json         # Config gateway + telegram + plugins
└── Dockerfile                # Image aleff:latest
```

**Arquivos no Repo:**
```
/mnt/HC_Volume_104479762/abckx/aleff/
├── .env                      # Credenciais (NÃO commitar)
├── .env.example              # Template sem secrets
├── docker-compose.aleff.yml  # Config docker
├── init-db.sql               # Schema PostgreSQL local
└── data/moltbot.json         # Config gateway
```

## 🔐 Credenciais (.env)

Todas as credenciais estão centralizadas em `.env`:

| Variável | Serviço | Uso |
|----------|---------|-----|
| `OPENAI_API_KEY` | OpenAI | Embeddings + Transcription fallback |
| `GROQ_API_KEY` | Groq | Transcription primário (whisper) |
| `GOOGLE_CLIENT_ID` | Google OAuth | Gmail, Calendar |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Gmail, Calendar |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth | Token persistente |
| `GOOGLE_ACCOUNT` | Google | aleff@iavancada.com |
| `SUPABASE_URL` | Supabase | Founder Memory |
| `SUPABASE_SERVICE_KEY` | Supabase | Admin access (Passbolt) |

**IMPORTANTE:** `.env` está no `.gitignore`. Nunca commitar secrets.

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
