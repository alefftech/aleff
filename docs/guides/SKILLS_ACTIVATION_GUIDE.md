# 🎯 Guia de Ativação de Skills - Aleff

> **Status atual das 54 skills disponíveis**
> **Atualizado:** 2026-01-29

---

## 📊 Resumo Geral

```
Total de skills no container: 54
├── ✅ Ativas sem configuração: 6
├── 🔧 Requerem configuração: 8
├── 🚫 Desabilitadas (segurança): 2
└── 💤 Disponíveis (não usadas): 38
```

---

## ✅ Skills ATIVAS (Prontas para Usar)

### 1. Canvas 🎨
**Status:** ✅ ATIVO
**O que faz:** Display HTML/visualizações em nodes conectados
**Como usar:** Aleff detecta automaticamente quando precisa mostrar conteúdo visual

```bash
# Logs confirmam:
[canvas] host mounted at http://0.0.0.0:18789/__moltbot__/canvas/
```

**Casos de uso:**
- Dashboards interativos
- Jogos HTML5
- Visualizações de dados
- Demos interativas

---

### 2. Remotion-dev 🎬 (NOVA - Custom)
**Status:** ✅ ATIVA (desenvolvida internamente)
**O que faz:** Criar vídeos programaticamente com React
**Binário:** `npx` (já disponível)

**Uso para MENTORINGBASE:**
```jsx
// Gerar intro de curso automaticamente
npx remotion render CourseIntro output.mp4 \
  --props='{"title":"Curso de AI","instructor":"Melissa"}'
```

**Recursos:**
- Templates para course intros
- Progress bars animados
- Social media clips
- Batch processing de vídeos

**Documentação:** `/app/skills/remotion-dev/SKILL.md`

---

### 3. GitHub 🐙
**Status:** ✅ ATIVA
**Binário:** `gh` (instalado)
**O que faz:** Automação GitHub (PRs, CI/CD, issues)

```bash
gh pr list --repo alefftech/aleff
gh pr checks 55
gh run view <run-id> --log-failed
```

---

### 4. Tmux 🧵
**Status:** ✅ ATIVA
**Binário:** `tmux` (instalado)
**O que faz:** Orquestração de processos paralelos

```bash
tmux -S /tmp/moltbot.sock new -d -s python-session
tmux -S /tmp/moltbot.sock send-keys "python3" Enter
```

---

### 5. Oracle 🧿
**Status:** ✅ ATIVA
**Binário:** `oracle` (instalado)
**O que faz:** Análise profunda de codebase com contexto completo

```bash
oracle --engine browser --model "5.2 Pro" \
  --include "src/**/*.ts" \
  "Como funciona o sistema de memória?"
```

---

### 6. Session-logs 📜
**Status:** ✅ ATIVA
**Binários:** `jq`, `rg` (instalados)
**O que faz:** Buscar em conversas anteriores

```bash
rg "keyword" ~/.clawdbot/agents/aleff/sessions/*.jsonl
```

---

## 🔧 Skills QUE REQUEREM CONFIGURAÇÃO

### 7. Summarize 🧾
**Status:** ⚠️ Requer binário `summarize`
**O que faz:** Sumarizar URLs, vídeos YouTube, PDFs

**Como ativar:**
```bash
# Instalar via brew (Mac) ou baixar release
brew install steipete/tap/summarize

# Usar
summarize "https://youtube.com/watch?v=..." --youtube auto
summarize "/path/to/article.pdf" --model google/gemini-3-flash-preview
```

**Casos de uso para holding:**
- Resumir artigos de pesquisa
- Transcrever vídeos do YouTube
- Extrair insights de documentos
- Análise de conteúdo para MENTORINGBASE

---

### 8. Trello 📋
**Status:** ⚠️ Requer API key
**O que faz:** Gestão de boards, listas, cards

**Como ativar:**
```bash
# 1. Obter credenciais
# https://trello.com/app-key

# 2. Configurar no .env
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token

# 3. Restart container
docker restart aleffai
```

**Casos de uso:**
- Sincronizar tarefas da holding
- Criar cards automaticamente
- Monitorar progresso de projetos

---

### 9. Video-frames 🎥
**Status:** ⚠️ Requer FFmpeg
**O que faz:** Extrair frames de vídeos

**Como ativar:**
```bash
# Adicionar FFmpeg no Dockerfile
RUN apt-get install -y ffmpeg
```

**Casos de uso:**
- Análise de vídeo aulas (MENTORINGBASE)
- Thumbnails automáticos
- Processamento de conteúdo visual

---

### 10. Gemini 💫
**Status:** ⚠️ Requer API key Google
**O que faz:** Usar modelos Gemini da Google

**Como ativar:**
```bash
# Adicionar ao .env
GOOGLE_AI_API_KEY=your-key

# Configurar provider no moltbot.json
```

---

### 11. OpenAI Image Gen 🖼️
**Status:** ⚠️ Requer OpenAI API key
**O que faz:** Gerar imagens com DALL-E

**Como ativar:**
```bash
# Já tem OPENAI_API_KEY configurado
# Skill detecta automaticamente
```

**Casos de uso:**
- Gerar thumbnails para cursos
- Criar material visual para marketing
- Ilustrações para conteúdo

---

### 12. Weather ☀️
**Status:** ⚠️ Requer configuração
**O que faz:** Informações meteorológicas

---

### 13. Obsidian 📝
**Status:** ⚠️ Requer configuração de vault
**O que faz:** Gestão de knowledge base

---

### 14. Notion 📄
**Status:** ⚠️ Requer API key
**O que faz:** Integração com Notion

---

## 🚫 Skills DESABILITADAS (Segurança)

### ClawdHub 📦
**Status:** 🔴 REMOVIDO (segurança)
**Motivo:** Supply chain attacks
**Ver:** `/data/SKILLS_SECURITY_POLICY.md`

### Discord 💬
**Status:** 🚫 Não usado pela holding

### Slack 💬
**Status:** 🚫 Não usado pela holding

---

## 💡 Skills RECOMENDADAS para Ativar

### Para MENTORINGBASE (Melissa):

**Alta prioridade:**
1. **Summarize** - Resumir conteúdo de vídeos/artigos
2. **Remotion-dev** - Gerar intros de cursos automaticamente
3. **Video-frames** - Processar vídeo aulas
4. **OpenAI Image Gen** - Criar material visual

**Média prioridade:**
5. **Trello** - Gestão de projetos (se usarem)
6. **Canvas** - Dashboards de progresso de alunos

---

### Para IAVANCADA (Cintia):

**Alta prioridade:**
1. **Summarize** - Pesquisa de mercado
2. **GitHub** - Já ativo ✅
3. **Oracle** - Análise de código

---

### Para AGILCONTRATOS (Carlos André):

**Alta prioridade:**
1. **Summarize** - Análise de documentos jurídicos
2. **Trello** - Pipeline de contratos

---

## 🎯 Como Ativar uma Skill

### Passo 1: Verificar Requisitos

```bash
# Ver requisitos da skill
cat /app/skills/<nome-skill>/SKILL.md | head -10
```

### Passo 2: Instalar Binários (se necessário)

**Editar Dockerfile:**
```dockerfile
# Adicionar instalação
RUN apt-get install -y <binario>
# ou
RUN npm install -g <package>
```

**Rebuild:**
```bash
pnpm build
docker build -t aleff:latest .
docker restart aleffai
```

### Passo 3: Configurar Credenciais (se necessário)

**Editar `.env`:**
```bash
TRELLO_API_KEY=...
NOTION_API_KEY=...
```

**Restart:**
```bash
docker restart aleffai
```

### Passo 4: Validar

```bash
# Ver logs
docker logs aleffai | grep <skill-name>

# Testar
# Pedir para o Aleff usar a skill via Telegram
```

---

## 📋 Lista Completa de 54 Skills

```
✅ = Ativa | ⚠️ = Requer config | 🚫 = Não usada | 💤 = Disponível

✅ canvas              - Display HTML/visualizações
✅ remotion-dev        - Criar vídeos com React (CUSTOM)
✅ github              - Automação GitHub
✅ tmux                - Processos paralelos
✅ oracle              - Análise de código
✅ session-logs        - Buscar conversas anteriores

⚠️ summarize           - Sumarizar URLs/vídeos
⚠️ trello              - Gestão de boards
⚠️ video-frames        - Extrair frames de vídeos
⚠️ gemini              - Google Gemini models
⚠️ openai-image-gen    - DALL-E image generation
⚠️ weather             - Informações meteorológicas
⚠️ obsidian            - Knowledge base
⚠️ notion              - Integração Notion

🚫 clawdhub            - REMOVIDO (segurança)
🚫 discord             - Não usado
🚫 slack               - Não usado

💤 1password           - Gerenciador senhas
💤 apple-notes         - Notas Apple
💤 apple-reminders     - Lembretes Apple
💤 bear-notes          - Bear notes app
💤 bird                - Twitter/X
💤 blogwatcher         - Monitor blogs
💤 blucli              - BluOS control
💤 bluebubbles         - iMessage bridge
💤 camsnap             - RTSP cameras
💤 coding-agent        - Codex/Claude Code
💤 eightctl            - 8x8 phone
💤 food-order          - Food delivery
💤 gifgrep             - Search GIFs
💤 gog                 - Google Workspace CLI
💤 goplaces            - Google Places
💤 himalaya            - Email CLI
💤 imsg                - iMessage
💤 local-places        - Local business search
💤 mcporter            - Minecraft server
💤 model-usage         - Track API usage
💤 nano-banana-pro     - IoT device
💤 nano-pdf            - PDF generation
💤 openai-whisper      - Audio transcription
💤 openai-whisper-api  - Whisper API
💤 openhue             - Philips Hue lights
💤 ordercli            - Order management
💤 peekaboo            - Screen capture
💤 sag                 - SAG integration
💤 sherpa-onnx-tts     - Text-to-speech
💤 skill-creator       - Create custom skills
💤 songsee             - Music recognition
💤 sonoscli            - Sonos control
💤 spotify-player      - Spotify integration
💤 things-mac          - Things todo app
💤 voice-call          - Voice calls
💤 wacli               - WhatsApp CLI (deprecated)
```

---

## 🎯 Próximos Passos Recomendados

### Imediato (P0):
1. **Testar skills ativas** (canvas, remotion-dev, github)
2. **Decidir quais ativar** (summarize, trello?)

### Curto Prazo (P1):
3. **Ativar Summarize** - Muito útil para a holding
4. **Ativar Trello** - Se usarem para gestão
5. **Testar Remotion-dev** - Gerar vídeo de teste

### Médio Prazo (P2):
6. Criar skills customizadas para processos internos
7. Integração com ferramentas específicas da holding

---

## 📞 Dúvidas?

**Quer ativar uma skill específica?**
- Mencionar no Telegram: @aleff_000_bot
- Ou pedir para o CTO

**Documentação completa:**
- [SKILLS_GUIDE.md](../data/SKILLS_GUIDE.md)
- [SKILLS_SECURITY_POLICY.md](../data/SKILLS_SECURITY_POLICY.md)

---

**Atualizado:** 2026-01-29
**Responsável:** CTO Ronald + Claude Code
