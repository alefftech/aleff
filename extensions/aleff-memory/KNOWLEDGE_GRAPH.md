# Aleff Memory v2.2 - Knowledge Graph + Auto-Memory

> **Sistema completo de memória institucional com grafo de conhecimento, auto-capture e auto-recall**

---

## 🎯 **O Que Mudou**

| Feature | v1.0 | v2.0 | v2.2 (atual) |
|---------|------|------|--------------|
| learn_fact | Entity + fact | + relationships auto | + embeddings |
| create_relationship | ❌ | ❌ | ✅ **NOVA TOOL** |
| Auto-capture | ❌ | ✅ Padrões | ✅ + embeddings |
| Auto-recall | ❌ | ✅ | ✅ |
| Regex patterns | - | 13 | **35+** |
| Logs | console.log | JSON | JSON |
| Tools | 7 | 7 | **8** |

---

## 📊 **Estrutura do Banco**

### **Tabelas:**

```sql
entities          -- Pessoas, empresas, projetos, conceitos
├── id, type, name
├── embedding vector(1536)
└── metadata

relationships     -- Grafo de conexões
├── from_entity_id → to_entity_id
├── relationship_type (works_at, manages, owns, part_of, responsible_for, reports_to, knows, related_to)
└── strength (0.0 - 1.0)

facts             -- Informações estruturadas sobre entidades
├── entity_id
├── fact_type (preference, decision, observation, skill, status)
├── content + embedding
└── confidence (0.0 - 1.0)

memory_index      -- Auto-captured memories
├── key_type, key_name
├── summary, importance
├── embedding vector(1536)
└── tags[]
```

### **Funções SQL:**

```sql
get_entity_by_name(name)                    -- Busca entidade
get_entity_relationships(entity_id)         -- Lista relacionamentos
search_entities_by_vector(embedding, ...)   -- Busca semântica em entidades
search_facts_by_vector(embedding, ...)      -- Busca semântica em fatos
find_connection_path(from, to, max_depth)   -- Acha caminho entre entidades
```

---

## 🛠️ **Agent Tools (8 tools)**

O Aleff tem acesso a 8 tools para memória:

### **1. query_knowledge_graph**
```json
{
  "entity": "Ronald",
  "include_facts": true
}
```
**Retorna:** Entidade + relacionamentos + fatos

**Uso:** "Quem é o CTO da IAVANCADA?"

---

### **2. find_connection**
```json
{
  "from": "Melissa",
  "to": "MENTORINGBASE"
}
```
**Retorna:** Caminho de conexão

**Uso:** "Como a Melissa está conectada ao MENTORINGBASE?"

---

### **3. learn_fact** ⭐ **MELHORADO v2.0**
```json
{
  "about": "Fabio",
  "type": "status",
  "fact": "é CFO da Holding",
  "confidence": 0.95
}
```

**v2.0 FIX:** Agora cria relationships automaticamente!
```
Input:  "Fabio é CFO da Holding"
Output:
  ✅ Entity: Fabio (person)
  ✅ Entity: Holding (company) - se não existir
  ✅ Fact: "é CFO da Holding"
  ✅ Relationship: Fabio → works_at → Holding  ← NOVO!
```

**Padrões detectados (35+):**

| Padrão | Tipo | Exemplo |
|--------|------|---------|
| `é diretor/CTO/CEO de X` | works_at | "Fabio é CFO da Holding" |
| `trabalha na/no/para X` | works_at | "trabalha na IAVANCADA" |
| `é funcionário/membro de X` | works_at | "é membro do time" |
| `cuida da/do X` | responsible_for | "cuida da parte financeira" |
| `é responsável por X` | responsible_for | "é responsável pelo produto" |
| `lidera/gerencia/coordena X` | manages | "lidera o time de vendas" |
| `é dono/sócio/fundou X` | owns | "fundou a empresa" |
| `faz parte de X` | part_of | "faz parte da holding" |
| `pertence à/ao X` | part_of | "pertence à estrutura" |
| `reporta para X` | reports_to | "reporta para o CEO" |
| `é subordinado de X` | reports_to | "é subordinado do Ronald" |
| `conhece X` | knows | "conhece o Fabio" |
| `é cliente/parceiro de X` | related_to | "é parceiro da empresa" |

---

### **4. create_relationship** ⭐ **NOVA v2.2**
```json
{
  "from": "Mentoring Base",
  "to": "Holding Aleff",
  "type": "part_of",
  "bidirectional": false
}
```

**Uso:** Quando o agent precisa criar conexões que não são detectadas automaticamente.

**Tipos disponíveis:**
- `works_at` - trabalha em
- `manages` - gerencia
- `owns` - é dono/sócio
- `part_of` - faz parte de
- `knows` - conhece
- `related_to` - relacionado a
- `responsible_for` - responsável por
- `reports_to` - reporta para

**Exemplo de uso:**
```
Você: "Aleff, cria uma relação: Mentoring Base faz parte da Holding Aleff"
Aleff: [usa create_relationship]
  → Mentoring Base → [part_of] → Holding Aleff ✅
```

---

### **5. save_to_memory**
Salva decisões/fatos na `memory_index` **com embeddings** (fix v2.2)

---

### **6. search_memory**
Full-text search (português) em mensagens

---

### **7. semantic_search**
Busca semântica via pgvector embeddings (busca em memory_index, facts, messages)

---

### **8. get_conversation_context**
Últimas N mensagens da conversa atual

---

## 📈 **Use Cases**

### **1. Conversas Longas**
```
Você: "Quem trabalha na IAVANCADA?"
Aleff: [usa query_knowledge_graph]
  → Ronald (CEO/CTO)
  → Cintia (líder)
```

### **2. Ver Conexões**
```
Você: "Qual a relação da Melissa com a holding?"
Aleff: [usa find_connection]
  → Melissa --[manages]--> MENTORINGBASE --[part_of]--> Inteligência Avançada
```

### **3. Não Esquecer**
```
Você: "O que discutimos sobre o Championship?"
Aleff: [usa search_memory com pgvector]
  → "4 times faturando R$100k/mês cada"
  → "IAVANCADA, AGILCONTRATOS, MENTORINGBASE, KXSALES"
```

### **4. Aprender Fatos**
```
Você: "A Melissa prefere comunicação direta"
Aleff: [usa learn_fact]
  → Salvo: Melissa → [preference] comunicação direta (confidence: 0.9)
```

---

## 🏗️ **Arquitetura**

```
┌───────────────────────────────────────┐
│  Agent Tools (8 total)                │  ← O que o Aleff usa
│  - query_knowledge_graph              │
│  - find_connection                    │
│  - learn_fact                         │
│  - create_relationship  ← NOVA v2.2   │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│  Knowledge Graph API                  │  ← src/knowledge-graph.ts
│  - upsertEntity()                     │
│  - createRelationship()               │
│  - addFact()                          │
│  - searchEntities()                   │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│  PostgreSQL + pgvector                │  ← Banco de dados
│  - entities (7 cols)                  │
│  - relationships (7 cols)             │
│  - facts (11 cols)                    │
└───────────────────────────────────────┘
```

---

## 🚀 **Como Usar**

### **Aleff usa automaticamente:**
O agente decide quando usar cada tool baseado no contexto da conversa.

### **Popular o grafo manualmente:**
```typescript
import { upsertEntity, createRelationship, addFact } from './knowledge-graph.js';

// Criar entidades
await upsertEntity({ type: 'person', name: 'Ronald' });
await upsertEntity({ type: 'company', name: 'IAVANCADA' });

// Criar relacionamento
await createRelationship({
  from: 'Ronald',
  to: 'IAVANCADA',
  type: 'works_at',
  strength: 1.0
});

// Adicionar fato
await addFact({
  entity: 'Ronald',
  type: 'skill',
  content: 'Expert em AI e automação',
  confidence: 0.95
});
```

---

## 🔧 **Manutenção**

### **Ver estatísticas:**
```sql
SELECT entity_type, COUNT(*) FROM entities GROUP BY entity_type;
SELECT relationship_type, COUNT(*) FROM relationships GROUP BY relationship_type;
SELECT fact_type, COUNT(*) FROM facts WHERE valid_to IS NULL GROUP BY fact_type;
```

### **Limpar dados antigos:**
```sql
-- Invalidar fatos antigos
UPDATE facts SET valid_to = NOW() WHERE entity_id = ...;

-- Deletar relacionamentos fracos
DELETE FROM relationships WHERE strength < 0.3;
```

---

## 📦 **Upgrade Path → aleff-memory-pro**

### **Roadmap de Evolução**

```
aleff-memory v1.0 (2026-01-28)
    │   └── PostgreSQL + pgvector básico
    │
    ▼
aleff-memory v2.0 (2026-01-29) ← ATUAL
    │   └── Auto-capture, auto-recall, relationship extraction
    │
    ▼
aleff-memory-pro v3.0 (futuro)
    │   └── mem0 + Qdrant/Neo4j + RAG avançado
    │
    ▼
aleff-memory-pro v4.0 (futuro)
        └── Multi-agent memory sharing + temporal reasoning
```

---

### **aleff-memory-pro: O Que É**

Evolução para **mem0** (https://mem0.ai) como backend de memória, trazendo:

| Feature | aleff-memory v2 | aleff-memory-pro |
|---------|-----------------|------------------|
| Vector DB | pgvector | **Qdrant** (mais rápido) |
| Graph DB | PostgreSQL tables | **Neo4j** (queries complexas) |
| Memory API | Custom tools | **mem0 SDK** (padronizado) |
| Extraction | Regex patterns | **LLM-based** (mais preciso) |
| Deduplication | Manual | **Automático** |
| Temporal | valid_from/to | **Temporal reasoning** |
| Multi-agent | Isolado por agent_id | **Memory sharing** seletivo |

---

### **Por Que mem0?**

1. **Extração inteligente**: Usa LLM para extrair entidades/fatos (não regex)
2. **Deduplicação**: "Ronald é CTO" + "Ronald é o CTO da holding" = 1 fato
3. **Conflito de fatos**: Detecta e resolve contradições
4. **API padronizada**: `mem0.add()`, `mem0.search()`, `mem0.get_all()`
5. **Multi-modal**: Suporta imagens, áudio (futuro)

---

### **Arquitetura aleff-memory-pro**

```
┌─────────────────────────────────────────────────────────────┐
│  Aleff Agent                                                 │
│  └── Mesmas 7 tools (compatível)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  aleff-memory-pro Adapter                                    │
│  ├── mem0 SDK (extraction, dedup, search)                   │
│  ├── Qdrant (vector similarity)                             │
│  └── Neo4j (graph traversal)                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ Qdrant  │  │  Neo4j   │  │ Postgres │
   │ vectors │  │  graph   │  │ messages │
   └─────────┘  └──────────┘  └──────────┘
```

---

### **Migração v2 → Pro**

```typescript
// aleff-memory-pro/src/adapter.ts

import { Memory } from 'mem0ai';

class AleffMemoryProAdapter {
  private mem0: Memory;

  constructor() {
    this.mem0 = new Memory({
      vector_store: {
        provider: "qdrant",
        config: { url: process.env.QDRANT_URL }
      },
      graph_store: {
        provider: "neo4j",
        config: { url: process.env.NEO4J_URL }
      },
      llm: {
        provider: "anthropic",
        config: { model: "claude-sonnet-4-5" }
      }
    });
  }

  // Compatível com tools existentes
  async learnFact(about: string, fact: string) {
    // mem0 extrai entidades e relationships automaticamente
    return await this.mem0.add(
      `${about}: ${fact}`,
      user_id: "founder",
      metadata: { source: "conversation" }
    );
  }

  async search(query: string) {
    return await this.mem0.search(query, user_id: "founder");
  }

  async getEntityGraph(entity: string) {
    // Neo4j para queries de grafo complexas
    return await this.neo4j.run(`
      MATCH (e:Entity {name: $name})-[r*1..3]-(related)
      RETURN e, r, related
    `, { name: entity });
  }
}
```

---

### **Timeline Estimado**

| Fase | Entrega | Descrição |
|------|---------|-----------|
| **v2.0** | ✅ 2026-01-29 | Auto-capture, auto-recall, relationships |
| **v2.2** | ✅ 2026-01-29 | create_relationship tool, 35+ patterns |
| **v3.0-alpha** | Q2 2026 | mem0 SDK integrado (Qdrant local) |
| **v3.0** | Q3 2026 | Neo4j para graph, production-ready |
| **v4.0** | 2027 | Multi-agent memory, temporal reasoning |

---

### **Critérios para Migrar**

Migrar para aleff-memory-pro quando:

```
□ > 10k entities no grafo (pgvector fica lento)
□ > 100k messages (precisa de sharding)
□ Queries de grafo complexas (3+ hops frequentes)
□ Múltiplos agentes precisam compartilhar memória
□ Extração por regex não é precisa o suficiente
```

**Enquanto isso:** aleff-memory v2.0 é suficiente para:
- < 10k entities
- < 100k messages
- Queries simples de grafo
- Extração de padrões conhecidos (cargos, empresas)

---

## 📊 **Performance**

- **Vector search:** IVFFlat index (100 lists)
- **Full-text search:** GIN index (português)
- **Relationship queries:** B-tree index
- **Connection path:** BFS recursivo (max depth 3)

**Tuning:**
- Aumentar `lists` em IVFFlat quando >10k entidades
- Ajustar `max_depth` em find_connection_path se muito lento

---

## 🤖 **Auto-Capture (Novo v2.0)**

Detecta e salva automaticamente conteúdo importante:

### **Triggers:**
```typescript
const MEMORY_TRIGGERS = [
  /lembra|remember|guarda|anota/i,     // Pedidos explícitos
  /decid[io]|decidimos|resolv[io]/i,   // Decisões
  /prefiro|prefer[eo]|gosto/i,         // Preferências
  /\+\d{10,}/,                          // Telefones
  /[\w.-]+@[\w.-]+\.\w+/,              // Emails
  /trabalha\s+(na|no|em)/i,            // Fatos organizacionais
  /é\s+(diretor|gerente|ceo|cto)/i,    // Cargos
];
```

### **Como funciona:**
1. Hook `message_sent` detecta padrões
2. Se match, salva em `memory_index` com embedding
3. Categoriza: decision, preference, contact, fact, task

### **Config:**
```json
{
  "aleff-memory": {
    "autoCapture": true  // default
  }
}
```

---

## 🔮 **Auto-Recall (Novo v2.0)**

Injeta memórias relevantes ANTES do agent processar:

### **Como funciona:**
1. Hook `before_agent_start` recebe o prompt
2. Gera embedding do prompt
3. Busca em 3 fontes: `memory_index`, `facts`, `messages`
4. Injeta contexto XML:

```xml
<relevant-memories>
  1. [decision] Usar K3s para produção
  2. [fact:status] Fabio: é CFO da Holding
  3. [message:user] Discutimos sobre Championship ontem
</relevant-memories>
```

### **Config:**
```json
{
  "aleff-memory": {
    "autoRecall": true  // default
  }
}
```

---

## 📁 **Estrutura do Plugin**

```
extensions/aleff-memory/
├── index.ts              [PLUGIN:MAIN] Registro + hooks (8 tools)
├── clawdbot.plugin.json  Config schema
├── package.json          @moltbot/aleff-memory v2.2.0
├── KNOWLEDGE_GRAPH.md    Este arquivo
└── src/
    ├── auto-capture.ts   [CAPTURE:MAIN] Detecção automática
    ├── auto-recall.ts    [RECALL:MAIN] Injeção de contexto
    ├── backfill-embeddings.ts     Backfill embeddings existentes
    ├── backfill-memory-index.ts   Backfill memory_index
    ├── backfill-relationships.ts  Backfill relationships de facts
    ├── embeddings.ts     OpenAI text-embedding-3-small
    ├── knowledge-graph.ts [KG:MAIN] Entities, relationships, facts (35+ patterns)
    ├── logger.ts         [LOG:MAIN] JSON estruturado (stderr)
    ├── persist.ts        Conversas e mensagens (com embeddings v2.2)
    ├── postgres.ts       Connection pool
    └── tools.ts          [TOOLS:MAIN] 8 agent tools
```

---

## 🔧 **Logs Estruturados**

Todos os logs são JSON em stderr:

```json
{"timestamp":"2026-01-29T15:30:00Z","level":"info","plugin":"aleff-memory","event":"relationship_created","from":"Fabio","to":"Holding","type":"works_at"}
```

**Filtrar logs:**
```bash
docker logs aleffai 2>&1 | grep aleff-memory | jq .
```

---

**Criado:** 2026-01-28
**Atualizado:** 2026-01-29
**Versão:** 2.2
**Autor:** CTO Ronald + Claude Opus 4.5
