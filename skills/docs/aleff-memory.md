# 🧠 Aleff Memory v2.0

> **Memória institucional persistente com Knowledge Graph, Auto-Capture e Auto-Recall**
> **Status:** ✅ Ativa desde 2026-01-28 | **Atualizada:** 2026-01-29
> **Tipo:** Extension (Plugin TypeScript)

---

## 🎯 O Que É

Sistema de memória persistente que armazena TODAS as conversas do Aleff em PostgreSQL com knowledge graph, permitindo:

- Guardar histórico completo de conversas
- Indexar entidades, relacionamentos e fatos
- Buscar contexto histórico de decisões
- Isolar memória por agente (aleff, garagem, etc.)

**Analogia:** É como o "segundo cérebro" do Aleff - tudo que ele conversa fica salvo para sempre.

---

## 🎨 Por Que Foi Criada

**Problema original:**
- Conversas do Telegram eram perdidas após o chat
- Decisões importantes não ficavam documentadas
- Impossível lembrar contexto de meses atrás
- Cada agente (aleff, garagem) compartilhava a mesma memória

**Solução:**
- PostgreSQL local (não cloud) com schema `aleff`
- Knowledge graph: entities, relationships, facts
- Memória isolada por `agent_id`
- Backup automático via PostgreSQL

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Telegram/WhatsApp → Aleff                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Aleff Memory Extension v2.0                            │
│  - message_received hook (salva inbound)                │
│  - message_sent hook (salva outbound + auto-capture)    │
│  - before_agent_start hook (auto-recall)                │
│  - 7 Tools: save/search/semantic/context/kg/conn/learn  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Database (aleff-postgres)                   │
│                                                          │
│  Schema: aleff                                           │
│  ├── conversations (id, agent_id, channel, user_id)     │
│  ├── messages (id, conversation_id, role, content)      │
│  ├── memory_index (id, conversation_id, keyword, type)  │
│  ├── entities (id, agent_id, name, type, properties)    │
│  ├── relationships (id, from_entity, to_entity, type)   │
│  └── facts (id, agent_id, subject, predicate, object)   │
└─────────────────────────────────────────────────────────┘
```

---

## 💾 Estrutura do Banco

### Tabela: `conversations`
```sql
CREATE TABLE aleff.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,  -- 'aleff', 'garagem', etc.
    channel TEXT,            -- 'telegram', 'whatsapp'
    user_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    metadata JSONB
);
```

### Tabela: `messages`
```sql
CREATE TABLE aleff.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES aleff.conversations(id),
    role TEXT NOT NULL,      -- 'user', 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);
```

### Tabela: `entities` (Knowledge Graph)
```sql
CREATE TABLE aleff.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT,               -- 'person', 'company', 'project'
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `relationships`
```sql
CREATE TABLE aleff.relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entity_id UUID REFERENCES aleff.entities(id),
    to_entity_id UUID REFERENCES aleff.entities(id),
    type TEXT NOT NULL,      -- 'works_at', 'manages', 'created'
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `facts`
```sql
CREATE TABLE aleff.facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object TEXT NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Como Usar

### Automático (Capture)

Todas as mensagens são salvas automaticamente:

```typescript
// Usuário envia no Telegram:
"Melissa vai lançar o curso de AI em fevereiro"

// Aleff responde:
"Entendido! Vou guardar essa informação."

// Automaticamente salvo em:
// - aleff.conversations (nova ou existente)
// - aleff.messages (2 registros: user + assistant)
// - aleff.entities (Melissa, Curso AI, fevereiro)
// - aleff.facts ("Melissa" "vai lançar" "curso de AI em fevereiro")
```

### Manual (Tools)

**Buscar na memória:**
```
@aleff busca na memória: quando foi o último contrato da AGILCONTRATOS?
```

Internamente usa a tool `search_memory`:
```typescript
{
  query: "último contrato AGILCONTRATOS",
  agent_id: "aleff",
  limit: 10
}
```

**Adicionar fato importante:**
```
@aleff adiciona fato: Melissa é CEO da MENTORINGBASE
```

Usa a tool `add_fact`:
```typescript
{
  subject: "Melissa",
  predicate: "é CEO de",
  object: "MENTORINGBASE",
  confidence: 1.0
}
```

---

## ⚙️ Configuração

### 1. Banco de Dados

Container PostgreSQL já configurado:
```yaml
# docker-compose.aleff.yml
postgres:
  image: pgvector/pgvector:pg16
  environment:
    POSTGRES_USER: aleff
    POSTGRES_PASSWORD: aleff_secure_2024
    POSTGRES_DB: aleff_memory
```

Schema criado automaticamente na primeira execução.

### 2. Extension

Já habilitada em `moltbot.json`:
```json
{
  "plugins": {
    "slots": {
      "memory": "aleff-memory"
    },
    "entries": {
      "aleff-memory": {
        "enabled": true,
        "config": {
          "autoCapture": true,
          "autoRecall": true,
          "schema": "aleff"
        }
      }
    }
  }
}
```

### 3. Verificar Status

```bash
# Conectar no banco
docker exec -it aleff-postgres psql -U aleff -d aleff_memory

# Ver tabelas
\dt aleff.*

# Contar conversas
SELECT agent_id, COUNT(*) FROM aleff.conversations GROUP BY agent_id;

# Ver últimas mensagens
SELECT * FROM aleff.messages ORDER BY created_at DESC LIMIT 10;

# Ver knowledge graph
SELECT * FROM aleff.entities ORDER BY created_at DESC LIMIT 10;
SELECT * FROM aleff.facts ORDER BY created_at DESC LIMIT 10;
```

---

## 🔍 Queries Úteis

### Buscar conversas sobre um tópico
```sql
SELECT
    c.id,
    c.agent_id,
    c.started_at,
    COUNT(m.id) as message_count
FROM aleff.conversations c
LEFT JOIN aleff.messages m ON m.conversation_id = c.id
WHERE
    EXISTS (
        SELECT 1 FROM aleff.messages m2
        WHERE m2.conversation_id = c.id
        AND m2.content ILIKE '%MENTORINGBASE%'
    )
GROUP BY c.id
ORDER BY c.started_at DESC;
```

### Ver knowledge graph de uma entidade
```sql
-- Entidade
SELECT * FROM aleff.entities WHERE name ILIKE '%Melissa%';

-- Relacionamentos
SELECT
    e1.name as from_entity,
    r.type as relationship,
    e2.name as to_entity
FROM aleff.relationships r
JOIN aleff.entities e1 ON r.from_entity_id = e1.id
JOIN aleff.entities e2 ON r.to_entity_id = e2.id
WHERE e1.name ILIKE '%Melissa%' OR e2.name ILIKE '%Melissa%';

-- Fatos
SELECT * FROM aleff.facts
WHERE subject ILIKE '%Melissa%'
OR object ILIKE '%Melissa%'
ORDER BY created_at DESC;
```

### Isolar por agente
```sql
-- Ver apenas conversas do Aleff
SELECT * FROM aleff.conversations WHERE agent_id = 'aleff';

-- Ver apenas do Garagem
SELECT * FROM aleff.conversations WHERE agent_id = 'garagem';
```

---

## 🐛 Troubleshooting

### Memória não está salvando

**Sintoma:** Mensagens do Telegram não aparecem no banco

**Soluções:**
```bash
# 1. Verificar se extension está carregada
docker logs aleffai 2>&1 | grep "aleff-memory"
# Deve mostrar: "Aleff Memory v2.0 registered..."

# 2. Verificar conexão com banco
docker exec aleffai psql postgresql://aleff:aleff_secure_2024@aleff-postgres:5432/aleff_memory -c "SELECT 1"

# 3. Ver logs de erro
docker logs aleffai | grep -i "error.*memory"

# 4. Restart
docker restart aleffai
```

### Banco está crescendo muito

**Sintoma:** PostgreSQL usando muita RAM/disco

**Soluções:**
```sql
-- Ver tamanho das tabelas
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'aleff'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Limpar conversas antigas (> 6 meses)
DELETE FROM aleff.conversations
WHERE started_at < NOW() - INTERVAL '6 months';

-- Vacuum
VACUUM ANALYZE aleff.conversations;
VACUUM ANALYZE aleff.messages;
```

### Memória misturada entre agentes

**Sintoma:** Aleff lembra conversas do Garagem

**Causa:** Bug no `agent_id` isolation

**Solução:**
```sql
-- Ver se há dados sem agent_id
SELECT COUNT(*) FROM aleff.conversations WHERE agent_id IS NULL;

-- Corrigir manualmente se necessário
UPDATE aleff.conversations SET agent_id = 'aleff' WHERE agent_id IS NULL;
```

---

## 📂 Código-fonte

```
extensions/aleff-memory/
├── clawdbot.plugin.json    # Manifest do plugin
├── index.ts                # [PLUGIN:MAIN] Registro + hooks
├── package.json            # @moltbot/aleff-memory v2.0.0
├── KNOWLEDGE_GRAPH.md      # Documentação detalhada
└── src/
    ├── auto-capture.ts     # [CAPTURE:MAIN] Detecção automática
    ├── auto-recall.ts      # [RECALL:MAIN] Injeção de contexto
    ├── embeddings.ts       # OpenAI text-embedding-3-small
    ├── knowledge-graph.ts  # [KG:MAIN] Entities + extractRelationships
    ├── logger.ts           # [LOG:MAIN] JSON estruturado (stderr)
    ├── persist.ts          # Conversas e mensagens
    ├── postgres.ts         # Connection pool
    └── tools.ts            # [TOOLS:MAIN] 7 agent tools
```

**Arquivos principais:**
- `index.ts` - Hooks: message_received, message_sent, before_agent_start
- `tools.ts:414-520` - learn_fact com extração automática de relationships
- `auto-capture.ts` - MEMORY_TRIGGERS patterns
- `auto-recall.ts` - Vector search em 3 fontes

---

## 🔐 Segurança

**Dados sensíveis:**
- ✅ Banco local (não cloud)
- ✅ Senha forte do PostgreSQL
- ✅ Isolamento por agent_id
- ✅ Schema separado (`aleff`)

**Backup:**
```bash
# Backup manual
docker exec aleff-postgres pg_dump -U aleff aleff_memory > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260129.sql | docker exec -i aleff-postgres psql -U aleff aleff_memory
```

**Ver policy completa:**
- [Skills Security Policy](../../data/SKILLS_SECURITY_POLICY.md)

---

## 🚀 Evolução

**V1.0 (2026-01-28):**
- ✅ Salvar conversas
- ✅ Knowledge graph básico
- ✅ Isolamento por agente

**V2.0 (2026-01-29) - ATUAL:**
- ✅ Vector search (pgvector)
- ✅ Auto-capture (detecta e salva automaticamente)
- ✅ Auto-recall (injeta contexto antes do agent)
- ✅ learn_fact cria relationships automaticamente
- ✅ Logs estruturados JSON (stderr)
- ✅ Anchor comments para navegação

**V3 (futuro):**
- [ ] RAG (Retrieval Augmented Generation)
- [ ] Summarização automática de conversas longas
- [ ] Timeline visualization
- [ ] Alertas proativos ("Faz 30 dias que não fala com X")

---

**Criado:** 2026-01-28
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Opus 4.5
**Versão:** 2.0.0
