# 📧 Google Workspace

> **Integração com Gmail, Calendar, Drive e Contacts**
> **Status:** ✅ Ativa
> **Tipo:** Extension + CLI (gogcli)

---

## 🎯 O Que É

Integração completa com Google Workspace permitindo ao Aleff:

**Gmail:**
- Ler emails (inbox, sent, labels)
- Enviar emails
- Buscar por remetente/assunto
- Marcar como lido/não lido
- Watch (webhook para novos emails)

**Calendar:**
- Listar eventos
- Criar compromissos
- Atualizar eventos
- Deletar agendamentos
- Buscar por data/título

**Drive:**
- Listar arquivos
- Upload de arquivos
- Download
- Compartilhar (permissões)

**Contacts:**
- Listar contatos
- Buscar por nome/email
- Adicionar contatos

**Analogia:** É como ter uma secretária virtual que gerencia email e agenda.

---

## 🎨 Por Que Foi Criada

**Problema original:**
- Founder precisa de ajuda para gerenciar emails
- Muitos emails não lidos (500+)
- Difícil achar emails importantes
- Compromissos marcados manualmente

**Solução:**
- Aleff lê emails automaticamente
- Filtra importantes vs spam
- Cria resumos diários
- Agenda compromissos via voz
- Envia confirmações automáticas

**Use cases:**
- "Aleff, resume os emails de hoje"
- "Aleff, agenda reunião com Melissa amanhã às 14h"
- "Aleff, busca o email do contrato da AGILCONTRATOS"
- "Aleff, envia email para a equipe confirmando a reunião"

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Google Workspace (aleff@iavancada.com)                 │
│  - Gmail API                                            │
│  - Calendar API                                         │
│  - Drive API                                            │
│  - People API (Contacts)                                │
└─────────────────┬───────────────────────────────────────┘
                  │ OAuth 2.0
                  ▼
┌─────────────────────────────────────────────────────────┐
│  gogcli (Google Workspace CLI)                          │
│  - Binary instalado em /usr/local/bin/gog              │
│  - Credenciais em ~/.config/gog/                        │
│  - Commands: gog gmail list, gog calendar create        │
└─────────────────┬───────────────────────────────────────┘
                  │ Shell exec
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Google Workspace Extension                             │
│  - Wrapper TypeScript para gogcli                       │
│  - Tools: gmail_list, gmail_send, calendar_create       │
│  - Hooks: gmail watch (webhook para novos emails)       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Aleff Agent                                            │
│  - Usa tools para ler/enviar emails                    │
│  - Cria eventos no calendar                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### Gmail - Ler Emails

```
@aleff lista os últimos 10 emails
```

Internamente:
```bash
gog gmail list --max-results=10
```

Retorna:
```
1. De: Melissa <melissa@mentoringbase.com>
   Assunto: Reunião de alinhamento
   Data: 2026-01-29 10:30

2. De: Carlos <carlos@agilcontratos.com>
   Assunto: Contrato XYZ pronto
   Data: 2026-01-29 09:15
```

### Gmail - Enviar Email

```
@aleff envia email para melissa@mentoringbase.com:
Assunto: Confirmação reunião
Corpo: Oi Melissa, confirmo nossa reunião amanhã às 14h.
```

Internamente:
```bash
gog gmail send \
  --to="melissa@mentoringbase.com" \
  --subject="Confirmação reunião" \
  --body="Oi Melissa, confirmo nossa reunião amanhã às 14h."
```

### Gmail - Buscar

```
@aleff busca emails de "AGILCONTRATOS" dos últimos 7 dias
```

```bash
gog gmail search \
  --query="from:agilcontratos.com newer_than:7d" \
  --max-results=20
```

### Calendar - Listar Eventos

```
@aleff quais são meus compromissos de amanhã?
```

```bash
gog calendar list \
  --time-min="2026-01-30T00:00:00Z" \
  --time-max="2026-01-30T23:59:59Z"
```

### Calendar - Criar Evento

```
@aleff agenda reunião:
- Título: "Alinhamento semanal"
- Data: 2026-02-03
- Hora: 14:00
- Duração: 1 hora
- Participantes: melissa@mentoringbase.com
```

```bash
gog calendar create \
  --summary="Alinhamento semanal" \
  --start="2026-02-03T14:00:00" \
  --end="2026-02-03T15:00:00" \
  --attendees="melissa@mentoringbase.com"
```

---

## ⚙️ Configuração

### 1. OAuth Credentials (já configurado)

Credenciais em `.env`:
```bash
GOOGLE_CLIENT_ID=552479160833-...
GOOGLE_CLIENT_SECRET=GOCSPX-EVHsd0MLV8...
GOOGLE_REFRESH_TOKEN=1//05i2tJNrSHWK0...
GOOGLE_ACCOUNT=aleff@iavancada.com
```

**Como foram obtidas:**
1. Google Cloud Console
2. Criar projeto "Aleff AI"
3. Habilitar APIs: Gmail, Calendar, Drive, People
4. OAuth consent screen
5. Criar credenciais OAuth 2.0
6. Autorizar scopes
7. Gerar refresh token

### 2. gogcli Installation (já instalado)

Instalado via Dockerfile:
```dockerfile
RUN curl -sL https://github.com/steipete/gogcli/releases/download/v0.9.0/gogcli_0.9.0_linux_amd64.tar.gz | tar xz -C /usr/local/bin/ && \
    chmod +x /usr/local/bin/gog
```

Verificar:
```bash
docker exec aleffai which gog
# /usr/local/bin/gog

docker exec aleffai gog --version
# gog version 0.9.0
```

### 3. Credentials Setup

```bash
# Dentro do container
docker exec -it aleffai bash

# Configurar gogcli
gog auth setup \
  --client-id="$GOOGLE_CLIENT_ID" \
  --client-secret="$GOOGLE_CLIENT_SECRET" \
  --refresh-token="$GOOGLE_REFRESH_TOKEN"

# Testar
gog gmail list --max-results=1
```

### 4. Gmail Watch (webhook para novos emails)

Já configurado em `moltbot.json`:
```json
{
  "hooks": {
    "gmail": {
      "account": "aleff@iavancada.com",
      "label": "INBOX",
      "topic": "projects/neural-sunup-485823-g4/topics/aleff-gmail-watch",
      "hookUrl": "https://aleffai.a25.com.br/hooks/gmail",
      "includeBody": true,
      "renewEveryMinutes": 720
    }
  }
}
```

Quando novo email chega:
1. Google Pub/Sub envia webhook
2. Extension processa
3. Aleff notifica no Telegram: "📧 Novo email de X"

---

## 🔍 Comandos gogcli

### Gmail

```bash
# Listar emails
gog gmail list --max-results=10

# Buscar
gog gmail search --query="from:melissa@mentoringbase.com"

# Ler email específico
gog gmail get <message-id>

# Enviar
gog gmail send --to="email@example.com" --subject="Assunto" --body="Corpo"

# Marcar como lido
gog gmail modify <message-id> --remove-labels=UNREAD

# Watch (ativar webhook)
gog gmail watch start --topic="projects/PROJECT/topics/TOPIC" --label=INBOX

# Watch status
gog gmail watch status

# Watch renew
gog gmail watch renew
```

### Calendar

```bash
# Listar eventos
gog calendar list --time-min="2026-01-29T00:00:00Z"

# Criar evento
gog calendar create \
  --summary="Reunião" \
  --start="2026-01-30T14:00:00" \
  --end="2026-01-30T15:00:00"

# Atualizar
gog calendar update <event-id> --summary="Novo título"

# Deletar
gog calendar delete <event-id>

# Buscar
gog calendar search --query="reunião"
```

### Drive

```bash
# Listar arquivos
gog drive list --max-results=20

# Upload
gog drive upload /path/to/file.pdf

# Download
gog drive download <file-id> /path/to/save

# Compartilhar
gog drive share <file-id> --email="user@example.com" --role=reader
```

### Contacts

```bash
# Listar contatos
gog contacts list --max-results=50

# Buscar
gog contacts search --query="Melissa"

# Adicionar
gog contacts create --name="João Silva" --email="joao@example.com"
```

---

## 🐛 Troubleshooting

### Erro "invalid_grant"

**Sintoma:** `Error: invalid_grant - Token has been expired or revoked`

**Solução:**
```bash
# Refresh token expirou, gerar novo
# 1. Google Cloud Console → OAuth consent screen
# 2. Revogar acesso atual
# 3. Gerar novo refresh token
# 4. Atualizar .env
# 5. Restart container
```

### Gmail watch não funciona

**Sintoma:** Novos emails não disparam webhook

**Checklist:**
```bash
# 1. Verificar status do watch
docker exec aleffai gog gmail watch status

# 2. Se expirado, renovar
docker exec aleffai gog gmail watch renew

# 3. Ver logs
docker logs aleffai | grep gmail-watcher

# 4. Testar manualmente
# Enviar email para aleff@iavancada.com
# Deve aparecer log: [gmail-watcher] New message received
```

### Permission denied

**Sintoma:** `Error: 403 Forbidden - Insufficient Permission`

**Causa:** Scope OAuth insuficiente

**Solução:**
```bash
# Verificar scopes autorizados
docker exec aleffai gog auth scopes

# Deve incluir:
# - https://www.googleapis.com/auth/gmail.readonly
# - https://www.googleapis.com/auth/gmail.modify
# - https://www.googleapis.com/auth/gmail.send
# - https://www.googleapis.com/auth/calendar
# - https://www.googleapis.com/auth/drive
# - https://www.googleapis.com/auth/contacts

# Se faltando, re-autorizar com scopes corretos
```

---

## 📂 Código-fonte

```
extensions/google-workspace/
├── index.ts              # Extension principal
├── gmail-tools.ts        # Tools Gmail
├── calendar-tools.ts     # Tools Calendar
├── drive-tools.ts        # Tools Drive
└── watch.ts              # Gmail watch handler

/usr/local/bin/gog        # Binário gogcli
~/.config/gog/            # Credenciais
```

**Tools registradas:**
- `gmail_list` - Listar emails
- `gmail_send` - Enviar email
- `gmail_search` - Buscar emails
- `calendar_list` - Listar eventos
- `calendar_create` - Criar evento
- `drive_list` - Listar arquivos
- `drive_upload` - Upload arquivo

---

## 🔐 Segurança

**OAuth Scopes (princípio do menor privilégio):**
- ✅ Gmail: readonly, modify, send (não delete)
- ✅ Calendar: Apenas calendário principal
- ✅ Drive: File-level access only
- ✅ Contacts: Readonly

**Credenciais:**
- ✅ Refresh token (não expira facilmente)
- ✅ HTTPS only
- ✅ Credentials em .env (não Git)

**Audit:**
- Google Admin Console → Security → OAuth tokens
- Ver todos os apps autorizados
- Revogar se necessário

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Gmail read/send/search
- ✅ Calendar CRUD
- ✅ Gmail watch webhook
- ✅ Drive list/upload

**V2 (planejado):**
- [ ] Email categorization (importante vs spam)
- [ ] Auto-responder (ausências, confirmações)
- [ ] Calendar smart suggestions
- [ ] Drive organization (folders, tags)
- [ ] Meeting notes automation

**V3 (futuro):**
- [ ] AI email composer
- [ ] Calendar conflict detection
- [ ] Email threading/summaries
- [ ] Integration com Notion/Obsidian

---

## 📚 Documentação Externa

**gogcli:**
- GitHub: https://github.com/steipete/gogcli
- Docs: https://github.com/steipete/gogcli#readme

**Google APIs:**
- Gmail API: https://developers.google.com/gmail/api
- Calendar API: https://developers.google.com/calendar/api
- Drive API: https://developers.google.com/drive/api
- People API: https://developers.google.com/people

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Funcionando
