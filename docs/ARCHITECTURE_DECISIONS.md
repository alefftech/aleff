# 🏗️ Decisões de Arquitetura - Aleff

> **Por que fizemos as escolhas que fizemos**
> **Atualizado:** 2026-01-29

---

## 🎯 Propósito

Este documento registra as principais decisões de arquitetura tomadas no desenvolvimento do Aleff, incluindo o **raciocínio** por trás de cada escolha.

**Para que serve:**
- Entender por que algo foi feito de determinada forma
- Evitar refazer discussões já decididas
- Onboarding de novos desenvolvedores
- Audit trail de decisões críticas

---

## 📚 Índice de Decisões

| # | Decisão | Data | Status |
|---|---------|------|--------|
| 1 | [PostgreSQL Local vs Cloud](#1-postgresql-local-vs-cloud) | 2026-01-28 | ✅ Implementado |
| 2 | [MegaAPI vs Meta Cloud API](#2-megaapi-vs-meta-cloud-api) | 2026-01-29 | ✅ Implementado |
| 3 | [Skills Internas vs ClawdHub](#3-skills-internas-vs-clawdhub) | 2026-01-29 | ✅ Implementado |
| 4 | [Schema `aleff` Separado](#4-schema-aleff-separado) | 2026-01-28 | ✅ Implementado |
| 5 | [Extension vs Skill vs Config](#5-extension-vs-skill-vs-config) | 2026-01-29 | ✅ Documentado |
| 6 | [ElevenLabs Provider Priority](#6-elevenlabs-provider-priority) | 2026-01-29 | ✅ Implementado |
| 7 | [Port 18789 Bloqueado](#7-port-18789-bloqueado) | 2026-01-29 | ✅ Implementado |
| 8 | [Cloudflare Tunnel vs VPN](#8-cloudflare-tunnel-vs-vpn) | 2026-01-28 | ✅ Implementado |
| 9 | [Docker Compose Custom](#9-docker-compose-custom) | 2026-01-28 | ✅ Implementado |
| 10 | [Wavespeed Removido](#10-wavespeed-removido) | 2026-01-29 | ✅ Decidido |

---

## 1. PostgreSQL Local vs Cloud

### Decisão
Usar PostgreSQL local (container) ao invés de cloud (Supabase/AWS RDS).

### Contexto
Founder Memory precisa de banco de dados para guardar conversas. Opções:
1. Supabase (cloud, já tem projeto)
2. PostgreSQL local (container Docker)
3. SQLite (arquivo local)

### Escolha: PostgreSQL Local

**Prós:**
- ✅ Dados na mesma máquina (latência <1ms)
- ✅ Sem custo adicional (já paga servidor)
- ✅ Total controle sobre backup
- ✅ Não depende de internet/API externa
- ✅ GDPR-friendly (dados não saem do servidor)

**Contras:**
- ❌ Precisa gerenciar backup manualmente
- ❌ Não escala horizontalmente
- ❌ Single point of failure

**Decisão Final:**
PostgreSQL local via `docker-compose.aleff.yml` com volume persistente.

**Alternativa considerada:**
Supabase foi descartado porque:
- Latência de 50-100ms vs <1ms local
- Custo de $25/mês para Pro (vs grátis local)
- Complexidade de autenticação
- Dados sensíveis da holding não devem sair do servidor

**Se mudar:**
Migração para cloud é possível com `pg_dump` + restore em Supabase.

---

## 2. MegaAPI vs Meta Cloud API

### Decisão
Usar MegaAPI (serviço brasileiro) ao invés de Meta Cloud API (oficial).

### Contexto
Precisamos integrar WhatsApp Business API. Opções:
1. Meta Cloud API (oficial Facebook)
2. MegaAPI (agregador brasileiro)
3. Twilio WhatsApp

### Escolha: MegaAPI

**Prós:**
- ✅ Setup em 10 minutos (vs 7-14 dias Meta)
- ✅ Sem aprovação Facebook Business
- ✅ Documentação em português
- ✅ Suporte via WhatsApp
- ✅ Preço competitivo (R$ 49/mês)

**Contras:**
- ❌ Intermediário (risco de descontinuação)
- ❌ Menos features que API oficial
- ❌ Dependência de serviço terceiro

**Decisão Final:**
MegaAPI para MVP, migrar para Meta Cloud API se necessário.

**Alternativa considerada:**
Meta Cloud API foi descartado porque:
- Processo demorado (7-14 dias de aprovação)
- Requer Facebook Business Manager configurado
- Documentação complexa (só em inglês)
- Holding não tem urgência para features avançadas

**Se mudar:**
Código está preparado para trocar provider (apenas mudar webhook URL).

---

## 3. Skills Internas vs ClawdHub

### Decisão
Desenvolver skills customizadas internamente ao invés de usar ClawdHub.

### Contexto
ClawdHub é marketplace de skills de terceiros. Opções:
1. Usar ClawdHub (npm install clawdhub)
2. Desenvolver internamente
3. Fork de skills específicas

### Escolha: Desenvolvimento Interno

**Prós:**
- ✅ Total controle do código
- ✅ Sem supply chain attacks
- ✅ Customizadas para holding
- ✅ Auditoria completa
- ✅ Sem dependências externas

**Contras:**
- ❌ Mais tempo de desenvolvimento
- ❌ Precisa manter código
- ❌ Não se beneficia de community updates

**Decisão Final:**
Criar skills customizadas. ClawdHub removido por segurança.

**Evidência do problema:**
- ClawdHub tinha skills maliciosas reportadas
- Sem vetting process robusto
- Supply chain attack é vetor comum

**Policy criada:**
[SKILLS_SECURITY_POLICY.md](../data/SKILLS_SECURITY_POLICY.md)

**Se mudar:**
Skills estão em `extensions/` e podem ser publicadas no futuro.

---

## 4. Schema `aleff` Separado

### Decisão
Criar schema PostgreSQL separado (`aleff`) ao invés de usar `public`.

### Contexto
PostgreSQL tem schema `public` por padrão. Opções:
1. Usar `public` schema
2. Criar schema `aleff` dedicado
3. Um banco por agente

### Escolha: Schema `aleff` Separado

**Prós:**
- ✅ Isolamento lógico
- ✅ Prefixo `aleff_` em todas as tabelas
- ✅ Fácil de fazer backup seletivo
- ✅ Permite múltiplos schemas futuros
- ✅ Evita conflito com outras apps

**Contras:**
- ❌ Precisa qualificar: `aleff.conversations`
- ❌ Um pouco mais complexo

**Decisão Final:**
Schema `aleff` para todas as tabelas do Aleff.

**Estrutura:**
```sql
aleff.conversations
aleff.messages
aleff.memory_index
aleff.entities
aleff.relationships
aleff.facts
```

**Se mudar:**
Migração simples com:
```sql
ALTER TABLE aleff.conversations SET SCHEMA public;
```

---

## 5. Extension vs Skill vs Config

### Decisão
3 tipos de integrações com propósitos diferentes.

### Contexto
Moltbot permite estender funcionalidade de 3 formas. Precisávamos definir quando usar cada uma.

### Escolha: 3 Tipos Distintos

| Tipo | Quando Usar | Exemplo |
|------|-------------|---------|
| **Extension** | Código TypeScript complexo, precisa hooks/tools | founder-memory, megaapi-whatsapp |
| **Skill** | Usa binário externo, instruções no prompt | remotion-dev, github, oracle |
| **Config** | Feature já existe, só precisa configurar | elevenlabs-tts, google-workspace |

**Extension:**
- Localização: `extensions/<name>/index.ts`
- Build: Compilado com TypeScript
- Manifest: `clawdbot.plugin.json`
- Usa: Hooks, Tools, Memory slots

**Skill:**
- Localização: `skills/<name>/SKILL.md`
- Build: Não precisa (markdown)
- Manifest: YAML frontmatter
- Usa: Binário na PATH

**Config:**
- Localização: `moltbot.json` ou `.env`
- Build: Não precisa
- Manifest: N/A
- Usa: Features nativas

**Decisão Final:**
Documentado em [skills/docs/README.md](../skills/docs/README.md)

---

## 6. ElevenLabs Provider Priority

### Decisão
Ordem de fallback: ElevenLabs → OpenAI → Edge TTS

### Contexto
TTS tem 3 providers. Precisava definir prioridade. Opções:
1. Edge (grátis) como padrão
2. ElevenLabs (melhor) como padrão
3. OpenAI (meio-termo) como padrão

### Escolha: ElevenLabs First

**Raciocínio:**
1. **Qualidade importa** - Vídeos da MENTORINGBASE precisam de voz profissional
2. **Custo é baixo** - $0.0001/char = ~$0.50/vídeo
3. **Fallback automático** - Se API key não configurada, usa Edge (grátis)

**Prioridade:**
```
1. ElevenLabs (if API key exists)
   ↓ (se falhar)
2. OpenAI (if API key exists)
   ↓ (se falhar)
3. Edge TTS (sempre disponível, grátis)
```

**Configurável:**
Usuário pode mudar em `moltbot.json`:
```json
{
  "messages": {
    "tts": {
      "provider": "edge"  // Força Edge como padrão
    }
  }
}
```

**Se mudar:**
Basta trocar variável `provider` no config.

---

## 7. Port 18789 Bloqueado

### Decisão
Bloquear porta 18789 publicamente, acessar via Cloudflare Tunnel.

### Contexto
Moltbot expõe Control UI na porta 18789. Descobrimos 1,673 instâncias expostas via Shodan.

### Escolha: UFW Firewall + Disable UI

**Medidas de segurança:**
1. ✅ Control UI desabilitado (`controlUi.enabled: false`)
2. ✅ UFW bloqueando porta 18789 externa
3. ✅ Cloudflare Tunnel para acesso legítimo
4. ✅ Allowlist de IPs confiáveis

**Comando UFW:**
```bash
ufw deny 18789/tcp comment "Block Moltbot Control UI"
ufw allow from 172.21.0.0/16 to any port 18789 comment "Allow Docker network"
```

**Vulnerability descoberta:**
CVE-2026-MOLTBOT-001 (não oficial, reportado à comunidade)

**Documentado em:**
[docs/security/SECURITY_HARDENING.md](security/SECURITY_HARDENING.md)

**Se mudar:**
Se precisar de Control UI, habilitar apenas via:
1. SSH tunnel: `ssh -L 8080:localhost:18789 dev-04`
2. Ou allowlist IP específico no UFW

---

## 8. Cloudflare Tunnel vs VPN

### Decisão
Usar Cloudflare Tunnel ao invés de VPN para acesso externo.

### Contexto
Precisamos acessar Aleff de fora do servidor. Opções:
1. Cloudflare Tunnel (cloudflared)
2. Tailscale VPN
3. WireGuard VPN
4. Expor porta diretamente (inseguro)

### Escolha: Cloudflare Tunnel

**Prós:**
- ✅ Grátis
- ✅ HTTPS automático (TLS)
- ✅ DDoS protection
- ✅ Zero trust (não expõe IP)
- ✅ DNS gerenciado (a25.com.br)

**Contras:**
- ❌ Depende de Cloudflare (vendor lock-in)
- ❌ Latência extra (~20ms)

**Decisão Final:**
Cloudflare Tunnel via domínio `aleffai.a25.com.br`.

**Alternativa considerada:**
Tailscale seria melhor para:
- Latência menor
- Sem intermediário
- Mas requer app em todos os dispositivos

**Configuração:**
```bash
cloudflared tunnel create aleff
cloudflared tunnel route dns aleff aleffai.a25.com.br
```

**Se mudar:**
Pode combinar Cloudflare Tunnel (público) + Tailscale (interno).

---

## 9. Docker Compose Custom

### Decisão
Criar `docker-compose.aleff.yml` customizado ao invés de usar upstream.

### Contexto
Moltbot tem `docker-compose.yml` padrão. Opções:
1. Modificar docker-compose.yml original
2. Criar docker-compose.aleff.yml customizado
3. Usar docker run manualmente

### Escolha: docker-compose.aleff.yml Custom

**Prós:**
- ✅ Não modifica upstream (fácil atualizar Moltbot)
- ✅ Configurações da holding separadas
- ✅ PostgreSQL incluído
- ✅ Networks customizadas
- ✅ Volumes específicos

**Contras:**
- ❌ Precisa manter 2 arquivos
- ❌ Usuário pode confundir qual usar

**Decisão Final:**
`docker-compose.aleff.yml` para produção da holding.

**Conteúdo custom:**
```yaml
services:
  aleffai:  # Nome custom
    build: .
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy

  postgres:  # PostgreSQL custom
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: aleff
      POSTGRES_PASSWORD: aleff_secure_2024
      POSTGRES_DB: aleff_memory
```

**Se mudar:**
Pode voltar para `docker-compose.yml` padrão, mas perde PostgreSQL.

---

## 10. Wavespeed Removido

### Decisão
Remover Wavespeed extension após 4 tentativas falhadas de integração.

### Contexto
Wavespeed é API para gerar imagens/vídeos. Tentamos integrar como extension.

### Escolha: Remover e Adiar

**Tentativas:**
1. ❌ Manifest sem `id` - "plugin manifest requires id"
2. ❌ Manifest sem `configSchema` - "plugin manifest requires configSchema"
3. ❌ Build issue - TypeScript não compila extensions/
4. ❌ Runtime error - Plugin não carrega

**Decisão Final:**
Remover código, manter documentação, reimplementar futuramente como:
- Tool direta (não extension)
- Ou usar API via Bash tool
- Ou skill markdown com npx

**Evidência:**
- 4 rebuilds de Docker (10 min cada)
- Container em crash loop 3x
- Complexidade não justifica benefício agora

**Código preservado:**
- Guia completo: `docs/guides/WAVESPEED_ELEVENLABS_SETUP_GUIDE.md`
- 643 linhas de código TypeScript (referência futura)

**Quando reimplementar:**
- Quando tiver caso de uso urgente
- Ou quando entender melhor plugin system do Moltbot
- Ou usar approach mais simples (Bash + curl)

---

## 📝 Template de Decisão

Para adicionar nova decisão, copiar este template:

```markdown
## N. Título da Decisão

### Decisão
Uma frase resumindo a escolha.

### Contexto
Por que precisávamos decidir? Quais opções existiam?

### Escolha: Nome da Escolha

**Prós:**
- ✅ Benefício 1
- ✅ Benefício 2

**Contras:**
- ❌ Desvantagem 1
- ❌ Desvantagem 2

**Decisão Final:**
O que foi feito exatamente.

**Alternativa considerada:**
O que NÃO foi escolhido e por quê.

**Se mudar:**
Como reverter essa decisão no futuro.
```

---

## 🔄 Revisão de Decisões

**Quando revisar:**
- A cada 6 meses
- Quando surgir problema relacionado
- Quando surgir nova tecnologia
- Quando custo/benefício mudar

**Como revisar:**
1. Ler decisão original
2. Avaliar se contexto mudou
3. Propor nova decisão se necessário
4. Documentar mudança

---

**Criado:** 2026-01-29
**Mantido por:** CTO Ronald + Claude Code
**Última revisão:** 2026-01-29
