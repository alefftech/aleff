# Aleff Memory v2.0 - Knowledge Graph + Auto-Memory

> **Sistema completo de memória institucional com grafo de conhecimento, auto-capture e auto-recall**

---

## 🎯 **O Que Mudou (v2.0)**

| Feature | v1.0 (founder-memory) | v2.0 (aleff-memory) |
|---------|----------------------|---------------------|
| learn_fact | Cria entity + fact | **Cria entity + fact + relationships automaticamente** |
| Auto-capture | ❌ Manual apenas | ✅ Detecta padrões e salva automaticamente |
| Auto-recall | ❌ Agent decide | ✅ Injeta memórias relevantes antes do agent |
| Logs | console.log misturado | ✅ JSON estruturado (stderr) |
| Anchor comments | ❌ | ✅ `[PLUGIN:MAIN]`, `[KG:EXTRACT]`, etc. |

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
├── relationship_type (works_at, manages, owns, part_of, responsible_for)
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

## 🛠️ **Agent Tools (7 tools)**

O Aleff tem acesso a 7 tools para memória:

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

**Padrões detectados:**
- `é diretor/CTO/CEO de X` → works_at
- `trabalha na/no X` → works_at
- `cuida da/do X` → responsible_for
- `lidera X` → manages
- `é dono da/do X` → owns

---

### **4. save_to_memory**
Salva decisões/fatos na `memory_index`

---

### **5. search_memory**
Full-text search (português) em mensagens

---

### **6. semantic_search**
Busca semântica via pgvector embeddings

---

### **7. get_conversation_context**
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
│  Agent Tools                          │  ← O que o Aleff usa
│  - query_knowledge_graph              │
│  - find_connection                    │
│  - learn_fact                         │
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

## 📦 **Upgrade Path**

### **Adicionar mem0 (futuro):**
Criar adapter que usa mem0 como camada de abstração:
```typescript
class Mem0Adapter {
  async upsertEntity(data) {
    return await this.mem0.add({ type: 'entity', ...data });
  }
}
```

### **Adicionar Neo4j (futuro):**
Migrar relacionamentos para Neo4j se queries ficarem lentas:
```typescript
class Neo4jAdapter {
  async createRelationship(data) {
    await session.run(
      `MATCH (a:Entity {id: $from}), (b:Entity {id: $to})
       CREATE (a)-[:${data.type}]->(b)`,
      { from: data.from, to: data.to }
    );
  }
}
```

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
├── index.ts              [PLUGIN:MAIN] Registro + hooks
├── clawdbot.plugin.json  Config schema
├── package.json          @moltbot/aleff-memory v2.0.0
├── KNOWLEDGE_GRAPH.md    Este arquivo
└── src/
    ├── auto-capture.ts   [CAPTURE:MAIN] Detecção automática
    ├── auto-recall.ts    [RECALL:MAIN] Injeção de contexto
    ├── embeddings.ts     OpenAI text-embedding-3-small
    ├── knowledge-graph.ts [KG:MAIN] Entities, relationships, facts
    ├── logger.ts         [LOG:MAIN] JSON estruturado (stderr)
    ├── persist.ts        Conversas e mensagens
    ├── postgres.ts       Connection pool
    └── tools.ts          [TOOLS:MAIN] 7 agent tools
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
**Versão:** 2.0
**Autor:** CTO Ronald + Claude Opus 4.5
