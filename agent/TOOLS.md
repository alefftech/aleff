# TOOLS.md - Ferramentas do Aleff

## 📧 Gmail + 📅 Calendar + 📁 Drive (gog CLI)

O comando `gog` está instalado e configurado para **aleff@iavancada.com**.

---

### 📧 Gmail

**Buscar emails:**
```bash
gog gmail search --account aleff@iavancada.com "is:unread" --limit 5
gog gmail search --account aleff@iavancada.com "from:pessoa@email.com" --limit 10
```

**Ler email:**
```bash
gog gmail read --account aleff@iavancada.com <thread_id>
```

**Enviar email:**
```bash
gog gmail send --account aleff@iavancada.com \
  --to "destinatario@email.com" \
  --subject "Assunto do email" \
  --body "Corpo do email aqui"
```

**Enviar email com anexo:**
```bash
gog gmail send --account aleff@iavancada.com \
  --to "destinatario@email.com" \
  --subject "Arquivo anexo" \
  --body "Segue arquivo em anexo." \
  --attach "/caminho/para/arquivo.pdf"
```

**Responder email:**
```bash
gog gmail send --account aleff@iavancada.com \
  --thread-id <thread_id> \
  --reply-all \
  --body "Resposta aqui"
```

---

### 📅 Calendar

**Ver eventos:**
```bash
gog calendar events --account aleff@iavancada.com --today
gog calendar events --account aleff@iavancada.com --upcoming
gog calendar events --account aleff@iavancada.com --days 7
```

**Criar evento com Meet:**
```bash
gog calendar create primary --account aleff@iavancada.com \
  --summary "Título" \
  --from "2026-01-30T14:00:00-03:00" \
  --to "2026-01-30T15:00:00-03:00" \
  --attendees "pessoa@email.com" \
  --with-meet
```

---

### 📁 Google Drive (FULL ACCESS)

**Listar arquivos:**
```bash
# Listar raiz
gog drive ls --account aleff@iavancada.com

# Listar pasta específica
gog drive ls --account aleff@iavancada.com <folder_id>

# Listar Meet Recordings
gog drive ls --account aleff@iavancada.com 1JMCunAXHud_8bAu0a49RN8JZFhAQ0Jny
```

**Buscar arquivos:**
```bash
gog drive search --account aleff@iavancada.com "nome do arquivo"
gog drive search --account aleff@iavancada.com "mimeType='application/pdf'"
```

**Baixar arquivo:**
```bash
gog drive get --account aleff@iavancada.com <file_id>
```

**Criar pasta:**
```bash
gog drive mkdir --account aleff@iavancada.com "Nome da Pasta"
gog drive mkdir --account aleff@iavancada.com "Subpasta" --parent <folder_id>
```

**Mover arquivo:**
```bash
gog drive mv --account aleff@iavancada.com <file_id> <destination_folder_id>
```

**Copiar arquivo:**
```bash
gog drive cp --account aleff@iavancada.com <file_id> --name "Cópia do arquivo"
```

**Renomear arquivo:**
```bash
gog drive rename --account aleff@iavancada.com <file_id> "Novo Nome"
```

**Deletar arquivo:**
```bash
gog drive rm --account aleff@iavancada.com <file_id>
```

**Compartilhar (tornar público):**
```bash
# Público com link
gog drive share --account aleff@iavancada.com <file_id> --anyone --role reader

# Compartilhar com pessoa específica
gog drive share --account aleff@iavancada.com <file_id> --email pessoa@email.com --role writer
```

**Upload arquivo:**
```bash
gog drive upload --account aleff@iavancada.com /caminho/arquivo.pdf
gog drive upload --account aleff@iavancada.com /caminho/arquivo.pdf --parent <folder_id>
```

---

## 📎 Arquivos Recebidos (Telegram)

Arquivos enviados pelo usuário via Telegram são salvos em:
```
/home/node/.moltbot/media/inbound/
```

**Listar arquivos recebidos:**
```bash
ls -la /home/node/.moltbot/media/inbound/
```

**Workflow: Usuário envia arquivo → Upload no Drive → Link público**
```bash
# 1. Ver arquivo recebido
ls /home/node/.moltbot/media/inbound/

# 2. Upload para o Drive
gog drive upload --account aleff@iavancada.com /home/node/.moltbot/media/inbound/<arquivo>

# 3. Tornar público e pegar link
gog drive share --account aleff@iavancada.com <file_id> --anyone --role reader
```

**Workflow: Baixar do Drive → Enviar por email**
```bash
# 1. Baixar arquivo do Drive
gog drive get --account aleff@iavancada.com <file_id>

# 2. Enviar por email com anexo
gog gmail send --account aleff@iavancada.com \
  --to "destinatario@email.com" \
  --subject "Arquivo" \
  --body "Segue arquivo." \
  --attach "./<nome_arquivo>"
```

---

## Dicas

- Sempre use `--account aleff@iavancada.com`
- Use `--json` para output estruturado
- Horários: formato `YYYY-MM-DDTHH:MM:SS-03:00`
- Pasta Meet Recordings: `1JMCunAXHud_8bAu0a49RN8JZFhAQ0Jny`
- Arquivos recebidos: `/home/node/.moltbot/media/inbound/`
