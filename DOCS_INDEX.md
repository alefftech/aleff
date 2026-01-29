# 📚 Índice de Documentação - Aleff

> **Guia rápido para encontrar documentação**
> **Atualizado:** 2026-01-29

---

## 🎯 Começar Aqui

| Você é... | Comece por... |
|-----------|---------------|
| **Founder/C-level** | [CLAUDE.md](CLAUDE.md) → Entender o Aleff |
| **Novo usuário** | [docs/guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md](docs/guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md) |
| **Desenvolvedor** | [README.md](README.md) → [DEPLOYMENT.md](DEPLOYMENT.md) |
| **Auditoria/Segurança** | [docs/security/SECURITY_HARDENING.md](docs/security/SECURITY_HARDENING.md) |

---

## 📂 Estrutura Simplificada

```
aleff/
├── 📄 CLAUDE.md                          ← Identidade e instruções do Aleff (PRINCIPAL)
├── 📄 README.md                          ← Visão geral do projeto
├── 📄 DEPLOYMENT.md                      ← Como fazer deploy
├── 📄 DOCS_INDEX.md                      ← Este arquivo (índice)
│
├── 📁 docs/                              ← Documentação organizada
│   ├── 📄 README.md                      ← Índice detalhado da /docs/
│   │
│   ├── 📁 guides/                        ← Guias práticos (setup, config)
│   │   └── MEGAAPI_WHATSAPP_SETUP_GUIDE.md
│   │
│   ├── 📁 security/                      ← Segurança e hardening
│   │   └── SECURITY_HARDENING.md
│   │
│   └── 📁 reports/                       ← Relatórios de implementação
│       ├── P0_IMPLEMENTATION_REPORT.md
│       └── SKILLS_IMPLEMENTATION_REPORT.md
│
├── 📁 data/                              ← Dados e configs (não versionado)
│   ├── moltbot.json                      ← Configuração principal
│   ├── SKILLS_GUIDE.md                   ← Guia de uso das skills
│   └── SKILLS_SECURITY_POLICY.md         ← Política de segurança de skills
│
└── 📁 extensions/                        ← Extensões customizadas
    ├── founder-memory/                   ← Memória com knowledge graph
    ├── megaapi-whatsapp/                 ← Integração WhatsApp (NOVA)
    ├── lobster/                          ← Workflows com aprovação
    └── open-prose/                       ← Multi-agente
```

---

## 📖 Documentação por Categoria

### 🎯 Identidade e Configuração

| Documento | O Que É | Quando Usar |
|-----------|---------|-------------|
| **[CLAUDE.md](CLAUDE.md)** | Instruções principais do Aleff | Entender como ele opera |
| **[AGENTS.md](AGENTS.md)** | Configuração de agentes | Criar novos agentes |
| **[data/moltbot.json](data/moltbot.json)** | Config runtime | Mudar comportamento |

### 🚀 Guias de Setup (10-15 min cada)

| Guia | Tempo | Status |
|------|-------|--------|
| **[WhatsApp via MegaAPI](docs/guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md)** | 10 min | ✅ Pronto |
| **[Wavespeed + ElevenLabs](docs/guides/WAVESPEED_ELEVENLABS_SETUP_GUIDE.md)** | 15 min | ✅ Pronto |
| **[Skills Activation](docs/guides/SKILLS_ACTIVATION_GUIDE.md)** | 5-30 min | ✅ Pronto |
| Telegram | - | ✅ Já configurado |
| Gmail/Calendar | - | ✅ Já configurado |

### 🔒 Segurança (CRÍTICO)

| Documento | Prioridade | Status |
|-----------|------------|--------|
| **[Security Hardening](docs/security/SECURITY_HARDENING.md)** | 🔴 P0 | ✅ Implementado |
| **[Skills Security Policy](data/SKILLS_SECURITY_POLICY.md)** | 🔴 P0 | ✅ Ativo |
| **[CLAUDE.md - Safety Rails](CLAUDE.md#safety-rails)** | 🔴 P0 | ✅ Ativo |

### 📊 Relatórios de Implementação

| Relatório | Data | O Que Foi Feito |
|-----------|------|-----------------|
| **[Skills Implementation](docs/reports/SKILLS_IMPLEMENTATION_REPORT.md)** | 2026-01-29 | 9 skills de autonomia |
| **[P0 Security](docs/reports/P0_IMPLEMENTATION_REPORT.md)** | 2026-01-29 | Correções críticas de segurança |

### 🛠️ Skills e Extensões

| Documento | Tipo | Onde Está |
|-----------|------|-----------|
| **[Skills Guide](data/SKILLS_GUIDE.md)** | Lista de capabilities | `/data/` |
| **[Skills Security Policy](data/SKILLS_SECURITY_POLICY.md)** | Regras de uso | `/data/` |
| **[MegaAPI WhatsApp](extensions/megaapi-whatsapp/README.md)** | Extensão custom | `/extensions/` |
| **[Founder Memory](extensions/founder-memory/README.md)** | Knowledge graph | `/extensions/` |

### 🔧 Desenvolvimento

| Documento | Para Quê |
|-----------|----------|
| **[README.md](README.md)** | Overview do projeto |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deploy e CI/CD |
| **[BOOTSTRAP.md](BOOTSTRAP.md)** | Setup inicial |

---

## 🔍 Busca Rápida por Tópico

### WhatsApp
- [Setup MegaAPI (10 min)](docs/guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md)
- [Extensão MegaAPI](extensions/megaapi-whatsapp/README.md)
- Configuração: `data/moltbot.json` → `megaapi-whatsapp`

### Telegram
- Configuração: [CLAUDE.md](CLAUDE.md) → seção Telegram
- Já configurado: ✅ @aleff_000_bot
- Allowlist: Apenas Founder (telegram:7899995102)

### Segurança
- [Vulnerabilidades corrigidas](docs/security/SECURITY_HARDENING.md)
- [Política de skills](data/SKILLS_SECURITY_POLICY.md)
- [Safety rails](CLAUDE.md#safety-rails)

### Skills
- [Guia de uso](data/SKILLS_GUIDE.md)
- [Política de segurança](data/SKILLS_SECURITY_POLICY.md)
- [Implementação](docs/reports/SKILLS_IMPLEMENTATION_REPORT.md)

### Memória (Founder Memory)
- [Knowledge Graph](extensions/founder-memory/README.md)
- Entities, Relationships, Facts
- PostgreSQL: `aleff_memory`

### Google Workspace
- [Scripts Gmail/Calendar](CLAUDE.md) → seção Google Workspace
- Conta: aleff@iavancada.com
- Scripts em: `~/.moltbot/scripts/`

---

## 📝 Convenções

### Nomenclatura

**Guias:**
- `{SERVIÇO}_SETUP_GUIDE.md`

**Políticas:**
- `{ÁREA}_POLICY.md`

**Relatórios:**
- `{PROJETO}_IMPLEMENTATION_REPORT.md`

### Status

- ✅ **Ativo** - Em uso
- 📝 **Draft** - Em construção
- ⚠️ **Deprecated** - Obsoleto
- 🗄️ **Arquivado** - Histórico

---

## 🔄 Última Atualização

| Data | Mudança |
|------|---------|
| 2026-01-29 | Reorganização da estrutura de docs |
| 2026-01-29 | Criado MEGAAPI_WHATSAPP_SETUP_GUIDE.md |
| 2026-01-29 | Movidos docs para /docs/{guides,security,reports}/ |
| 2026-01-29 | Criado DOCS_INDEX.md (este arquivo) |

---

## 📞 Ajuda

**Dúvidas?**
- CTO Ronald (supervisor do Aleff)
- Telegram: @aleff_000_bot

**Documentação completa:**
- Ver [docs/README.md](docs/README.md)

---

**Mantido por:** CTO Ronald + Claude Code
**Última revisão:** 2026-01-29
