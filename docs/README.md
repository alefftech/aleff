# 📚 Documentação do Aleff

> **Centro de documentação oficial do Aleff AI**
> **Holding:** Inteligência Avançada
> **Atualizado:** 2026-01-29

---

## 🗂️ Estrutura de Documentação

```
docs/
├── README.md                    # Este arquivo (índice geral)
├── guides/                      # Guias práticos (setup, configuração)
│   └── MEGAAPI_WHATSAPP_SETUP_GUIDE.md
├── security/                    # Documentação de segurança
│   ├── SECURITY_HARDENING.md
│   └── SKILLS_SECURITY_POLICY.md (link)
└── reports/                     # Relatórios de implementação
    ├── P0_IMPLEMENTATION_REPORT.md
    └── SKILLS_IMPLEMENTATION_REPORT.md
```

---

## 📖 Documentação por Categoria

### 🎯 Instruções do Agente

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **CLAUDE.md** | Identidade e instruções principais do Aleff | `/CLAUDE.md` |
| **AGENTS.md** | Configuração de agentes (upstream) | `/AGENTS.md` |

### 🚀 Guias de Setup

| Guia | Tempo | Dificuldade | Link |
|------|-------|-------------|------|
| **WhatsApp (MegaAPI)** | 10 min | Fácil | [guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md](guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md) |
| **Deployment** | - | Média | `/DEPLOYMENT.md` |

### 🔒 Segurança

| Documento | Prioridade | Status | Link |
|-----------|------------|--------|------|
| **Security Hardening** | P0 | ✅ Implementado | [security/SECURITY_HARDENING.md](security/SECURITY_HARDENING.md) |
| **Skills Security Policy** | P0 | ✅ Ativo | [/data/SKILLS_SECURITY_POLICY.md](../data/SKILLS_SECURITY_POLICY.md) |
| **Skills Guide** | P1 | ✅ Documentado | [/data/SKILLS_GUIDE.md](../data/SKILLS_GUIDE.md) |

### 📊 Relatórios de Implementação

| Relatório | Data | Autor | Link |
|-----------|------|-------|------|
| **Skills Implementation** | 2026-01-29 | Claude Code | [reports/SKILLS_IMPLEMENTATION_REPORT.md](reports/SKILLS_IMPLEMENTATION_REPORT.md) |
| **P0 Security Implementation** | 2026-01-29 | Claude Code | [reports/P0_IMPLEMENTATION_REPORT.md](reports/P0_IMPLEMENTATION_REPORT.md) |

### 🔧 Desenvolvimento

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **README.md** | Visão geral do projeto | `/README.md` |
| **BOOTSTRAP.md** | Inicialização | `/BOOTSTRAP.md` |
| **DEPLOYMENT.md** | Deploy e CI/CD | `/DEPLOYMENT.md` |

---

## 🎯 Índice por Função

### Para Operação (Founder/C-levels)

**Começar aqui:**
1. [CLAUDE.md](../CLAUDE.md) - Entender o que é o Aleff
2. [guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md](guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md) - Conectar WhatsApp

**Consultar quando necessário:**
- [data/SKILLS_GUIDE.md](../data/SKILLS_GUIDE.md) - Lista de capabilities
- [security/SECURITY_HARDENING.md](security/SECURITY_HARDENING.md) - Status de segurança

### Para Desenvolvimento (CTO)

**Implementações recentes:**
- [reports/SKILLS_IMPLEMENTATION_REPORT.md](reports/SKILLS_IMPLEMENTATION_REPORT.md)
- [reports/P0_IMPLEMENTATION_REPORT.md](reports/P0_IMPLEMENTATION_REPORT.md)

**Segurança:**
- [security/SECURITY_HARDENING.md](security/SECURITY_HARDENING.md)
- [data/SKILLS_SECURITY_POLICY.md](../data/SKILLS_SECURITY_POLICY.md)

**Deploy:**
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [BOOTSTRAP.md](../BOOTSTRAP.md)

### Para Auditoria

**Segurança:**
1. [security/SECURITY_HARDENING.md](security/SECURITY_HARDENING.md) - Vulnerabilidades corrigidas
2. [data/SKILLS_SECURITY_POLICY.md](../data/SKILLS_SECURITY_POLICY.md) - Política de skills
3. [CLAUDE.md](../CLAUDE.md) - Safety rails

**Implementações:**
1. [reports/P0_IMPLEMENTATION_REPORT.md](reports/P0_IMPLEMENTATION_REPORT.md) - P0 completo
2. [reports/SKILLS_IMPLEMENTATION_REPORT.md](reports/SKILLS_IMPLEMENTATION_REPORT.md) - Skills

---

## 🔍 Índice por Tópico

### WhatsApp
- [Guia de Setup MegaAPI](guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md)
- [Extensão MegaAPI](../extensions/megaapi-whatsapp/README.md)

### Skills
- [Skills Guide](../data/SKILLS_GUIDE.md) - Uso das skills
- [Skills Security Policy](../data/SKILLS_SECURITY_POLICY.md) - Política de segurança
- [Skills Implementation Report](reports/SKILLS_IMPLEMENTATION_REPORT.md) - Como foram implementadas

### Segurança
- [Security Hardening](security/SECURITY_HARDENING.md) - Correções aplicadas
- [Skills Security Policy](../data/SKILLS_SECURITY_POLICY.md) - Regras de skills
- [CLAUDE.md](../CLAUDE.md) - Safety rails do agente

### Telegram
- [CLAUDE.md](../CLAUDE.md) - Configuração allowlist

### Memória (Founder Memory)
- [Extensão Founder Memory](../extensions/founder-memory/README.md)
- Knowledge Graph: entities, relationships, facts

### Google Workspace
- [CLAUDE.md](../CLAUDE.md) - Scripts Gmail/Calendar

---

## 📝 Convenções de Documentação

### Nomenclatura de Arquivos

**Guias práticos:**
- `{SERVIÇO}_SETUP_GUIDE.md` (ex: MEGAAPI_WHATSAPP_SETUP_GUIDE.md)

**Políticas:**
- `{ÁREA}_POLICY.md` (ex: SKILLS_SECURITY_POLICY.md)

**Relatórios:**
- `{PROJETO}_IMPLEMENTATION_REPORT.md` (ex: P0_IMPLEMENTATION_REPORT.md)

**Documentação técnica:**
- `{MÓDULO}.md` (ex: DEPLOYMENT.md)

### Estrutura de Documentos

Todos os documentos devem ter:
```markdown
# Título

> Descrição breve
> Data: YYYY-MM-DD
> Responsável: Nome

---

## Conteúdo principal...

---

**Última atualização:** YYYY-MM-DD
**Responsável:** Nome
```

### Status de Documentos

- ✅ **Ativo** - Em uso, atualizado
- 📝 **Draft** - Em construção
- 🔄 **Em revisão** - Aguardando aprovação
- ⚠️ **Deprecated** - Obsoleto (manter para histórico)
- 🗄️ **Arquivado** - Movido para `/docs/archive/`

---

## 🔄 Atualizações Recentes

| Data | Documento | Mudança |
|------|-----------|---------|
| 2026-01-29 | MEGAAPI_WHATSAPP_SETUP_GUIDE.md | Criado guia de setup WhatsApp |
| 2026-01-29 | SECURITY_HARDENING.md | Documentadas correções P0 |
| 2026-01-29 | SKILLS_SECURITY_POLICY.md | Política de skills criada |
| 2026-01-29 | P0_IMPLEMENTATION_REPORT.md | Relatório de segurança P0 |
| 2026-01-29 | SKILLS_IMPLEMENTATION_REPORT.md | Relatório de skills |

---

## 📞 Contato

**Dúvidas sobre documentação:**
- CTO Ronald (supervisor do Aleff)
- Via Telegram: @aleff_000_bot

**Sugestões de melhoria:**
- Criar issue no repo GitHub
- Ou mencionar no chat com o Aleff

---

**Mantido por:** CTO Ronald + Claude Code
**Última revisão:** 2026-01-29
