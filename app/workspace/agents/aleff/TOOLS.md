# 🛠️ Tools & Skills Available

You have access to various skills and tools installed in the container.

---

## 🧠 Memory & Workspace Tools (PostgreSQL)

### Workspace Persistence Tools

Você tem tools para gerenciar seus arquivos de identidade/configuração que persistem no PostgreSQL:

| Tool | Descrição |
|------|-----------|
| `update_workspace_file` | Atualiza arquivo (IDENTITY.md, SOUL.md, etc.) no banco + local |
| `get_workspace_file` | Lê um arquivo do banco |
| `list_workspace_files` | Lista todos os arquivos disponíveis |

**Arquivos Gerenciados:**
- `IDENTITY.md` - Quem você é
- `SOUL.md` - Personalidade e estilo
- `AGENTS.md` - Instruções operacionais
- `TOOLS.md` - Este arquivo (tools disponíveis)
- `USER.md` - Preferências do usuário

**Uso:**
```
# Listar arquivos
→ Use list_workspace_files (sem parâmetros)

# Ler arquivo
→ Use get_workspace_file com file_name="SOUL.md"

# Atualizar arquivo
→ Use update_workspace_file com:
  - file_name: "SOUL.md"
  - content: "conteúdo completo do arquivo"
  - reason: "motivo da mudança" (opcional)
```

**IMPORTANTE:**
- Mudanças são **persistidas no PostgreSQL** e sobrevivem a restarts
- Cada update cria uma versão no histórico (rollback possível)
- O banco é source of truth - sempre use estas tools para modificar

### Memory Tools (Aleff Memory v2.2)

| Tool | Descrição |
|------|-----------|
| `save_to_memory` | Salva fato/decisão na memória permanente |
| `search_memory` | Busca texto em conversas passadas |
| `semantic_search` | Busca por similaridade (embeddings) |
| `get_conversation_context` | Recupera contexto recente |
| `query_knowledge_graph` | Consulta entidades no grafo |
| `find_connection` | Encontra caminho entre entidades |
| `learn_fact` | Aprende fato sobre entidade |
| `create_relationship` | Cria relação entre entidades |

---

## 📱 WhatsApp Tools

Integração via abstração de providers (atualmente usando MegaAPI).

### Mensagens

| Tool | Descrição |
|------|-----------|
| `send_whatsapp_message` | Envia mensagem de texto |
| `reply_whatsapp_message` | Responde a uma mensagem específica (quote) |

### Mídia

| Tool | Descrição |
|------|-----------|
| `send_whatsapp_image` | Envia imagem (JPG, PNG, WEBP) |
| `send_whatsapp_audio` | Envia áudio (MP3, OGG, M4A) |
| `send_whatsapp_video` | Envia vídeo (MP4) |
| `send_whatsapp_file` | Envia documento (PDF, DOCX, XLSX) |
| `send_whatsapp_location` | Envia localização |
| `send_whatsapp_contact` | Envia cartão de contato |

### Instância

| Tool | Descrição |
|------|-----------|
| `whatsapp_status` | Verifica status da conexão |
| `whatsapp_qr_code` | Obtém QR code para autenticação |
| `is_on_whatsapp` | Verifica se número está no WhatsApp |
| `whatsapp_restart` | Reinicia instância |
| `whatsapp_logout` | Desconecta instância |

### Grupos

| Tool | Descrição |
|------|-----------|
| `whatsapp_list_groups` | Lista grupos |
| `whatsapp_group_info` | Obtém info do grupo |
| `whatsapp_create_group` | Cria novo grupo |
| `whatsapp_add_participants` | Adiciona participantes |
| `whatsapp_remove_participants` | Remove participantes |
| `whatsapp_leave_group` | Sai do grupo |

**Uso:**
```
# Enviar mensagem
→ Use send_whatsapp_message com:
  - to: "5511999999999"
  - message: "Olá!"

# Verificar status
→ Use whatsapp_status (sem parâmetros)

# Enviar imagem
→ Use send_whatsapp_image com:
  - to: "5511999999999"
  - imageUrl: "https://example.com/image.jpg"
  - caption: "Descrição" (opcional)
```

**Arquitetura:**
- `whatsapp-core` - Tipos e cliente abstrato
- `whatsapp-megaapi` - Adapter MegaAPI (provider atual)
- `whatsapp-tools` - Tools MCP registradas

**Trocar Provider:** Mudar 1 linha de config em moltbot.json

---

## 🎛️ Supervisor Tools (Cross-Channel Control)

Você é o **supervisor** dos canais filhos (WhatsApp, Instagram, etc). Via Telegram, você controla o comportamento dos bots em outros canais.

### Arquitetura Supervisor

```
        ALEFF (Supervisor - Telegram)
        ────────────────────────────
        /status    → Lista canais
        /start     → Ativa canal
        /stop      → Pausa canal
        /takeover  → Controle manual
        /release   → Devolve ao bot
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│whatsapp │   │instagram│   │  site   │
│ RUNNING │   │ STOPPED │   │ RUNNING │
└─────────┘   └─────────┘   └─────────┘
```

### Tools Disponíveis

| Tool | Descrição |
|------|-----------|
| `supervisor_status` | Lista todos os canais e seus estados |
| `supervisor_start` | Ativa um canal (bot responde automaticamente) |
| `supervisor_stop` | Pausa um canal (notifica mas não responde) |
| `supervisor_takeover` | Assume controle manual (você responde) |
| `supervisor_release` | Devolve controle ao bot |

### Estados dos Canais

| Estado | Bot Responde | Supervisor Notificado |
|--------|--------------|----------------------|
| `RUNNING` | Sim | Sim |
| `STOPPED` | Não | Sim |
| `TAKEOVER` | Não | Sim (para resposta manual) |

### Uso

```
# Ver status de todos os canais
→ Use supervisor_status (sem parâmetros)

# Pausar WhatsApp (monitorar sem responder)
→ Use supervisor_stop com channel="whatsapp"

# Assumir controle manual
→ Use supervisor_takeover com channel="whatsapp"

# Devolver ao bot
→ Use supervisor_release com channel="whatsapp"

# Reativar canal
→ Use supervisor_start com channel="whatsapp"
```

### Casos de Uso

1. **Cliente VIP chegou** → `supervisor_takeover whatsapp` → Você responde manualmente
2. **Reunião importante** → `supervisor_stop whatsapp` → Bot não responde, você monitora
3. **Fim da reunião** → `supervisor_start whatsapp` → Bot volta a responder

**Plugin:** `aleff-supervisor` v1.0

---

## Data Sources

### Supabase (Source of Truth)

**Your Tables (read/write):**
```sql
aleff.conversations      -- Chat sessions
aleff.messages          -- Messages with embeddings vector(1536)
aleff.memory_index      -- Indexed facts and decisions
aleff.pokemons_generated -- Generated automation scripts
aleff.audit_log         -- Security audit trail
```

**Founder Tables (read-only):**
```sql
founder_infos           -- Personal info (category, topic, content)
founder_chat_log        -- Conversation history (mood, productivity)
founder_brilliant_ideas -- Ideas filtered by Philippians 4:8
founder_todo            -- Tasks with impact_score
founder_changelog       -- Decisions made
founder_dailylog        -- Daily log
```

---

## Google Workspace Integration

**Account:** aleff@iavancada.com
**Access:** Gmail, Calendar, Drive, Contacts via `gog` CLI

### 📧 Gmail
```bash
# Skills available
gog-gmail  # Send, search, read emails

# Common use cases
- "Check unread emails"
- "Search emails from [person]"
- "Read email [ID]"
```

### 📅 Calendar
```bash
# Skills available
gog-calendar  # List, create, update events

# Common use cases
- "What's on my agenda today?"
- "Create meeting with [person] at [time]"
- "List upcoming events"
```

**Note:** Events automatically include Google Meet links when created.

### 👤 Contacts
```bash
# Skills available
gog-contacts  # CRUD contacts, groups, directory search

# Common use cases
- "Find contact for [person]"
- "Add new contact [name/email/phone]"
- "Update contact [name] with new info"
- "Sync contacts to CRM"
```

### 📁 Drive
```bash
# Skills available
gog-drive  # Upload, download, share files

# Common use cases
- "Upload file to Drive"
- "Share document with [person]"
- "Download file from Drive"
```

---

## Skills Catalog

### Documentation & Editing
- **nano-pdf** - Edit PDFs with natural language
- **wkhtmltopdf** - Generate PDFs from HTML
- **ffmpeg** - Extract video frames
- **summarize** - AI summaries (URLs, YouTube, PDFs via Gemini/GPT)

### Web Automation & Scraping
- **playwright** - Browser automation (testing, scraping, screenshots)
- **puppeteer** - Screenshots, PDFs, web automation
- **apify** - Web scraping (LinkedIn, Google Maps, Instagram, YouTube, Twitter/X)

### Content Creation
- **remotion-dev** - Programmatic video creation (React-based)
- **canvas** - Display HTML dashboards on paired devices

### Custom Skills (Holding-Specific)
- **contract-parser** - Extract data from legal contracts (AGILCONTRATOS)
- **meeting-notes** - Transcribe audio + generate structured summaries (MENTORINGBASE)
- **invoice-generator** - Generate invoices from templates (CFO)

### Native Skills
- **github** - CI/CD automation, PRs, issues (via `gh` CLI)
- **tmux** - Parallel processes, interactive sessions
- **oracle** - Deep codebase analysis
- **session-logs** - Search previous conversations (via `rg` and `jq`)

---

## How to Use Skills

**Before first use:**
1. Read `/app/skills/<skill-name>/SKILL.md`
2. Check requirements (binaries, env vars)
3. Explain to user what the skill does

**Best Practices:**
- Always verify prerequisites before executing
- Explain what you're doing to the user
- Handle errors gracefully
- Log important operations

---

## Security Policy for External Skills

**CRITICAL:** In January 2026, supply chain exploits were discovered in ClawdHub.

### ❌ NEVER DO THIS:
- Install skills from ClawdHub public registry
- Execute `clawdhub install <skill-name>`
- Enable third-party unaudited skills
- Use skills requesting credentials/tokens

### ✅ ALLOWED:
- Use ONLY built-in skills from official repo (60+ skills in `/app/skills/`)
- Develop custom skills using `skill-creator`
- Audit source code before any external installation

### ✅ APPROVED SKILLS:
All built-in skills in `/app/skills/` are pre-approved and safe to use.

### If Someone Asks to Install External Skill:
```
RESPOND: "For security reasons, I cannot install skills from ClawdHub.
We can:
1. Create a custom skill using skill-creator
2. Check if there's a similar built-in skill
3. Escalate to CTO for security audit"
```

**References:**
- [The Register: Moltbot Security](https://theregister.com/2026/01/27/clawdbot_moltbot_security_concerns/)
- [SOC Prime: Poisoned Skills](https://socprime.com/active-threats/the-moltbot-clawdbots-epidemic/)

---

## Binary Tools Available

```bash
# Code Analysis
/usr/local/bin/oracle     # Deep code analysis

# Summarization
/usr/local/bin/summarize  # AI content summaries

# Google Workspace
/usr/local/bin/gog        # Google APIs CLI

# Development
/usr/local/bin/gh         # GitHub CLI
/usr/local/bin/npx        # Node package executor
/usr/local/bin/tmux       # Terminal multiplexer

# Python
/usr/local/bin/python3    # Python runtime
/usr/local/bin/pip3       # Python packages
```

---

## Tool Usage Examples

### Summarize a URL
```bash
summarize "https://example.com/article" --model google/gemini-3-flash-preview
```

### Search Gmail
```bash
gog gmail search "is:unread" --limit 10
```

### Create Calendar Event
```bash
gog calendar create \
  --title "Team Meeting" \
  --start "2026-01-30T14:00:00" \
  --end "2026-01-30T15:00:00" \
  --attendees "team@iavancada.com"
```

### Scrape LinkedIn with Apify
```bash
apify call apify/linkedin-profile-scraper \
  --input '{"urls": ["https://linkedin.com/in/username"]}' \
  --output profile.json
```

### Parse Contract
```bash
# Use contract-parser skill
# Reads PDF, extracts parties, values, dates, clauses
# Outputs structured JSON
```

---

**Last Updated:** 2026-01-30
**Version:** 2.3.0 (+ Supervisor Tools)
