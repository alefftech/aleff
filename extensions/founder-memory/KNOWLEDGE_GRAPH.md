# Knowledge Graph - Founder Memory

> **Sistema de grafo de conhecimento para conversas longas e busca semântica**

---

## 🎯 **Objetivo**

Complementar o sistema de memória local do Moltbot com:
1. **Grafo de relacionamentos** - Para conversas longas, entender conexões
2. **Busca semântica (pgvector)** - Para não esquecer informações importantes

**NÃO substitui** a memória local (`MEMORY.md`, `memory/*.md`) - trabalha em conjunto.

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
├── relationship_type (works_at, manages, owns, part_of)
└── strength (0.0 - 1.0)

facts             -- Informações estruturadas sobre entidades
├── entity_id
├── fact_type (preference, decision, observation, skill, status)
├── content + embedding
└── confidence (0.0 - 1.0)
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

## 🛠️ **Agent Tools**

O Aleff tem acesso a 6 tools para memória:

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

### **3. learn_fact**
```json
{
  "about": "Ronald",
  "type": "skill",
  "fact": "Expert em AI e automação",
  "confidence": 0.95
}
```
**Uso:** "Lembrar que Ronald é expert em AI"

---

### **4. save_to_memory** (existente)
Salva decisões/fatos na `memory_index`

---

### **5. search_memory** (existente)
Busca semântica em mensagens passadas (pgvector)

---

### **6. get_conversation_context** (existente)
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

**Criado:** 2026-01-28
**Versão:** 1.0
**Autor:** CTO Ronald + Claude Sonnet 4.5
