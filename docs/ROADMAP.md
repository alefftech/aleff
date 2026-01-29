# Roadmap - AleffAI

## Visão

**AleffAI é um container IA canivete** - pronto para ser deployado, customizado e escalado para qualquer cliente.

```
AleffAI = Container IA Multi-Propósito
├── Sempre atualizado (sync upstream moltbot)
├── Sempre seguro (security patches prioritários)
├── Sempre estável (99.9% uptime)
├── Configurável (onboarding rápido)
└── Extensível (tools, skills, subagents por cliente)
```

**Modelo de negócio:**
- 1 cliente = 1 deploy AleffAI customizado
- Holding = primeiro cliente (dogfooding)
- Escalar para N clientes com mesmo core

---

## Pilares Estratégicos

### 🔒 SEGURANÇA
- Sync automático de patches upstream
- Secrets management (.env, não código)
- Audit logs completos
- Rate limiting por cliente

### 🏗️ ESTABILIDADE
- 99.9% uptime garantido
- Health checks automatizados
- Auto-recovery on failure
- Backup diário

### ⚡ VELOCIDADE DE DEPLOY
- Onboarding < 1 hora
- Clone → Config → Deploy → Funcionando
- Documentação clara
- Scripts automatizados

### 🔧 EXTENSIBILIDADE
- Marketplace de tools
- Skills customizáveis
- Subagents por caso de uso
- API para integrações

---

## Q1 2026 (Jan-Mar) - Foundation

### Core
- [x] Fork moltbot funcional
- [x] Estrutura app/ (infra/código separados)
- [x] Deploy automatizado (compose)
- [ ] **Sync upstream automatizado**
- [ ] CI/CD pipeline

### Segurança
- [x] Secrets em .env
- [x] Acesso via VPN
- [ ] Security scan automático
- [ ] Audit logging

### Documentação
- [x] CLAUDE.md (agentman guide)
- [x] CHANGELOG, ISSUES, ROADMAP
- [ ] Onboarding guide para clientes
- [ ] API documentation

---

## Q2 2026 (Abr-Jun) - Scale Ready

### Multi-Cliente
- [ ] Template de deploy por cliente
- [ ] Config por tenant (multi-tenant ready)
- [ ] Isolamento de dados
- [ ] Billing integration

### Tools & Skills Marketplace
- [ ] Catálogo de tools disponíveis
- [ ] Sistema de ativação por cliente
- [ ] Custom tools por cliente
- [ ] Skill builder (low-code)

### Channels
- [x] Telegram
- [ ] WhatsApp Business
- [ ] Discord
- [ ] Slack
- [ ] Web widget

### Integrações
- [ ] Google Workspace completo
- [ ] Microsoft 365
- [ ] CRMs (HubSpot, Pipedrive)
- [ ] ERPs (básico)

---

## Q3 2026 (Jul-Set) - Growth

### Self-Service
- [ ] Portal de onboarding
- [ ] Dashboard cliente
- [ ] Configurador visual
- [ ] Analytics por cliente

### AI Evolution
- [ ] Multi-model support (Claude, GPT, Gemini)
- [ ] Fine-tuning por cliente
- [ ] Knowledge base dedicada
- [ ] Voice support

### Community
- [ ] Fórum de usuários
- [ ] Marketplace de extensions
- [ ] Partner program
- [ ] Certificação

---

## Clientes Ativos

| Cliente | Deploy | Status | Customizações |
|---------|--------|--------|---------------|
| **Holding** | dev-04 | 🟢 Prod | aleff-memory, telegram |
| Cliente 2 | - | 🟡 Planned | TBD |
| Cliente 3 | - | 🟡 Planned | TBD |

---

## Métricas de Produto

| Métrica | Atual | Meta Q2 | Meta Q4 |
|---------|-------|---------|---------|
| Clientes ativos | 1 | 5 | 20 |
| Uptime | ~99% | 99.9% | 99.99% |
| Tempo onboarding | - | < 1h | < 30min |
| Tools disponíveis | 8 | 20 | 50 |
| Channels suportados | 1 | 3 | 5 |

---

## Competências do Agentman

O agentman AleffAI precisa dominar:

### Technical
- [ ] Git/merge/sync (upstream moltbot)
- [ ] Docker/compose (deploy)
- [ ] TypeScript (tools/skills)
- [ ] PostgreSQL (data layer)

### Product
- [ ] Onboarding de clientes
- [ ] Customização por caso de uso
- [ ] Troubleshooting
- [ ] Documentação

### Community
- [ ] Monitorar issues upstream
- [ ] Participar de fóruns/discussões
- [ ] Reportar bugs relevantes
- [ ] Contribuir fixes de volta

---

**Última atualização:** 2026-01-29
**Owner:** Agentman AleffAI
**Aprovação:** CEO Founder
