# 📚 Skills Customizadas do Aleff

> **Documentação das skills desenvolvidas internamente para a holding**
> **Atualizado:** 2026-01-29

---

## 🎯 O Que São Skills Customizadas?

Skills criadas especificamente para o Aleff, diferentes das 54 skills padrão do Moltbot. Desenvolvidas para atender necessidades específicas da holding Inteligência Avançada.

---

## 📋 Lista de Skills Customizadas

| # | Skill | Status | Tipo | Descrição |
|---|-------|--------|------|-----------|
| 1 | **[Aleff Memory v2.0](aleff-memory.md)** | ✅ Ativa | Extension | Memória institucional com auto-capture/recall e knowledge graph |
| 2 | **[MegaAPI WhatsApp](megaapi-whatsapp.md)** | 🔧 Setup | Extension | Integração WhatsApp via MegaAPI brasileira |
| 3 | **[Remotion Dev](remotion-dev.md)** | ✅ Ativa | Skill | Geração de vídeos programáticos com React |
| 4 | **[Google Workspace](google-workspace.md)** | ✅ Ativa | Extension | Gmail, Calendar, Drive via gogcli |
| 5 | **[ElevenLabs TTS](elevenlabs-tts.md)** | ✅ Ativa | Config | Text-to-Speech com vozes naturais |

---

## 🏗️ Estrutura de Documentação

Cada skill tem sua própria página detalhada com:

```markdown
# Skill Name

## O Que É
Descrição clara e objetiva

## Por Que Foi Criada
Problema que resolve

## Como Funciona
Arquitetura e fluxo

## Como Usar
Exemplos práticos

## Configuração
Setup passo a passo

## Troubleshooting
Problemas comuns e soluções

## Código
Localização dos arquivos principais
```

---

## 🎨 Diferença: Extension vs Skill vs Config

### Extension (Plugin)
- Código TypeScript compilado
- Localização: `/extensions/<name>/`
- Carregado na inicialização
- Pode registrar tools, hooks, memory slots
- Exemplos: aleff-memory, megaapi-whatsapp

### Skill (Markdown)
- Arquivo SKILL.md com instruções
- Localização: `/skills/<name>/SKILL.md`
- Injetado no prompt do agente
- Requer binário externo na PATH
- Exemplos: remotion-dev, github, oracle

### Config (Configuração)
- Apenas configuração em moltbot.json
- Usa features existentes do Moltbot
- Sem código custom
- Exemplos: ElevenLabs TTS, Google Workspace OAuth

---

## 🚀 Quick Start

### Quero usar uma skill existente
```bash
# 1. Ver lista de skills disponíveis
cat /docs/guides/SKILLS_ACTIVATION_GUIDE.md

# 2. Ler documentação específica
cat /skills/docs/<skill-name>.md

# 3. Seguir instruções de setup
```

### Quero criar uma nova skill customizada
```bash
# Ver template e processo
cat /skills/docs/CREATING_CUSTOM_SKILLS.md
```

---

## 📊 Status das Skills Customizadas

### ✅ Produção (Ativas)
1. **Founder Memory** - Salvando todas as conversas desde 2026-01-28
2. **Remotion Dev** - Pronto para gerar vídeos
3. **Google Workspace** - Gmail/Calendar integrados
4. **ElevenLabs TTS** - Voice synthesis configurado

### 🔧 Em Setup
5. **MegaAPI WhatsApp** - Código pronto, aguardando webhook

### ⏸️ Pausadas
- **Wavespeed AI** - Removido temporariamente (problemas de integração)

---

## 🔍 Por Categoria

### Memória & Dados
- [Founder Memory](aleff-memory.md) - PostgreSQL + Knowledge Graph

### Comunicação
- [MegaAPI WhatsApp](megaapi-whatsapp.md) - WhatsApp brasileiro
- [Google Workspace](google-workspace.md) - Email + Calendar

### Criação de Conteúdo
- [Remotion Dev](remotion-dev.md) - Vídeos programáticos
- [ElevenLabs TTS](elevenlabs-tts.md) - Narração com IA

---

## 📖 Outras Documentações

**Guias gerais:**
- [Skills Activation Guide](../../docs/guides/SKILLS_ACTIVATION_GUIDE.md) - Todas as 56 skills
- [Wavespeed + ElevenLabs Setup](../../docs/guides/WAVESPEED_ELEVENLABS_SETUP_GUIDE.md)
- [MegaAPI WhatsApp Setup](../../docs/guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md)

**Relatórios:**
- [Skills Implementation Report](../../docs/reports/SKILLS_IMPLEMENTATION_REPORT.md)
- [P0 Security Implementation](../../docs/reports/P0_IMPLEMENTATION_REPORT.md)

**Segurança:**
- [Skills Security Policy](../../data/SKILLS_SECURITY_POLICY.md)
- [Security Hardening](../../docs/security/SECURITY_HARDENING.md)

---

## 💡 Filosofia de Desenvolvimento

**Por que desenvolvemos internamente:**

1. **Segurança** - Sem dependências de terceiros não verificados
2. **Customização** - Adaptado às necessidades da holding
3. **Controle** - Sabemos exatamente o que cada código faz
4. **Manutenção** - Podemos evoluir conforme necessário

**Princípios:**
- Production Mind - Não reinventar a roda
- Evidence-Based - Usar código existente quando possível
- Security First - Auditoria de todo código externo
- Documentation Driven - Documentar antes de implementar

---

## 🔄 Histórico de Criação

| Data | Skill | Autor | Motivo |
|------|-------|-------|--------|
| 2026-01-28 | Founder Memory | Claude Code | Memória institucional persistente |
| 2026-01-29 | MegaAPI WhatsApp | Claude Code | WhatsApp simples (vs Meta Cloud API) |
| 2026-01-29 | Remotion Dev | Claude Code | Vídeos para MENTORINGBASE |
| 2026-01-29 | Google Workspace | Claude Code | Gmail/Calendar automation |
| 2026-01-29 | ElevenLabs TTS | Claude Code | Narração em português |

---

## 📞 Contato

**Dúvidas sobre skills customizadas:**
- CTO Ronald (supervisor do Aleff)
- Telegram: @aleff_000_bot

**Propor nova skill:**
- Criar issue no GitHub: https://github.com/alefftech/aleff/issues
- Template: "Nova Skill: [Nome] - [Problema que resolve]"

---

**Criado:** 2026-01-29
**Mantido por:** CTO Ronald + Claude Code
**Última atualização:** 2026-01-29
