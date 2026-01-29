# Memory Architecture - Aleff AI

> **Guia de arquitetura de memória para diferentes escalas de uso**

---

## TL;DR - Qual usar?

| Volume de Mensagens | Solução | Complexidade |
|---------------------|---------|--------------|
| **< 400 msgs/dia** | `founder-memory` (atual) | Baixa |
| **400-2000 msgs/dia** | `founder-memory` + batch diário | Baixa |
| **> 2000 msgs/dia** | `mem0` + Qdrant | Alta |

---

## Arquitetura Atual: founder-memory

### O que é

Plugin de memória institucional usando PostgreSQL + pgvector. Desenvolvido internamente para o Aleff.

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│  founder-memory (Plugin)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Messages   │    │  Knowledge  │    │   Vector    │     │
│  │ Persistence │    │    Graph    │    │   Search    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│        │                   │                   │            │
│        └───────────────────┼───────────────────┘            │
│                            ▼                                │
│                   ┌─────────────┐                           │
│                   │ PostgreSQL  │                           │
│                   │ + pgvector  │                           │
│                   └─────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tabelas

| Tabela | Função | Status |
|--------|--------|--------|
| `messages` | Histórico de conversas | ✅ Ativo |
| `conversations` | Sessões | ✅ Ativo |
| `entities` | Knowledge Graph - nós | ✅ Pronto |
| `relationships` | Knowledge Graph - arestas | ✅ Pronto |
| `facts` | Fatos sobre entidades | ✅ Pronto |
| `memory_index` | Fatos indexados | ✅ Pronto |

### Tools Disponíveis

| Tool | Função |
|------|--------|
| `save_to_memory` | Salvar decisões/fatos |
| `search_memory` | Busca full-text |
| `semantic_search` | Busca por similaridade (pgvector) |
| `get_conversation_context` | Contexto recente |
| `query_knowledge_graph` | Consultar entidades |
| `find_connection` | Caminho entre entidades |
| `learn_fact` | Aprender fatos (manual) |

### Limitações

- **Extração de entidades:** Manual (agent usa `learn_fact`)
- **Escala:** Ideal para < 400 msgs/dia
- **Graph queries:** PostgreSQL recursivo (não otimizado para grafos grandes)

### Quando usar

- ✅ Founder pessoal (10-50 msgs/dia)
- ✅ Time pequeno (50-200 msgs/dia)
- ✅ MVP/POC de produto
- ⚠️ Produto com 1-5 clientes ativos

---

## Upgrade Path: mem0 + Qdrant

### Quando migrar

Migrar quando:
- Volume > 400 msgs/dia consistente
- Extração automática de entidades é crítica
- Precisa de graph queries complexas (Neo4j)

### Arquitetura mem0

```
┌─────────────────────────────────────────────────────────────┐
│  mem0 Stack                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Moltbot   │───▶│    mem0     │───▶│   Qdrant    │     │
│  │   (Agent)   │    │  (TypeScript)│   │  (Vectors)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                                │
│                            ▼                                │
│                     ┌─────────────┐                         │
│                     │   Neo4j     │                         │
│                     │  (Graph DB) │                         │
│                     └─────────────┘                         │
│                                                             │
│  Containers: moltbot, mem0, qdrant, neo4j                   │
│  Extração: Automática via LLM                               │
│  Custo LLM: ~$0.001-0.01/mensagem                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### mem0 SDK Support

| Feature | Python SDK | TypeScript SDK |
|---------|-----------|----------------|
| pgvector | ✅ | ❌ |
| Supabase | ✅ | ❌ |
| Qdrant | ✅ | ✅ |
| Redis/Valkey | ✅ | ✅ |
| Neo4j (Graph) | ✅ | ✅ |

**Nota:** Como Moltbot é TypeScript, usar mem0 com pgvector requer sidecar Python.
Para TypeScript nativo, usar Qdrant.

### Migração

```bash
# 1. Adicionar containers
docker-compose up -d qdrant neo4j

# 2. Instalar mem0
npm install mem0ai

# 3. Configurar mem0 no moltbot.json
{
  "plugins": {
    "memory": {
      "provider": "mem0",
      "config": {
        "vectorStore": "qdrant",
        "graphStore": "neo4j"
      }
    }
  }
}

# 4. Migrar dados (script a criar)
npx tsx scripts/migrate-to-mem0.ts
```

### Custos Adicionais

| Componente | Recurso | Custo/mês |
|------------|---------|-----------|
| Qdrant | 1GB RAM | ~$5 (self-hosted) |
| Neo4j | 2GB RAM | ~$10 (self-hosted) |
| LLM extraction | OpenAI | ~$5-30 (por volume) |
| **Total** | | **~$20-45/mês** |

---

## Solução Intermediária: Batch Diário

### Conceito

Manter `founder-memory` e adicionar extração automática via CRON:

```
┌─────────────────────────────────────────────────────────────┐
│  Batch Diário (23:00)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SELECT mensagens do dia                                 │
│  2. Agrupa em batches de 10-20 msgs                         │
│  3. Envia para LLM: "Extraia entidades e relacionamentos"   │
│  4. Resposta JSON estruturada                               │
│  5. upsertEntity() + createRelationship() + addFact()       │
│  6. Log no cto_changelog                                    │
│                                                             │
│  Custo: ~$0.01-0.05/dia = $1-2/mês                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quando usar

- ✅ 100-400 msgs/dia
- ✅ Não precisa de extração real-time
- ✅ Budget limitado
- ✅ Quer manter infra simples

---

## Plug-and-Play: Como funciona

O Moltbot usa sistema de plugins modular:

```
extensions/
├── founder-memory/     ← Plugin atual (PostgreSQL)
├── memory-core/        ← Plugin base do Moltbot
├── memory-lancedb/     ← Alternativa (LanceDB)
└── [mem0-memory/]      ← Futuro plugin mem0
```

### Trocar provider de memória

```json
// moltbot.json
{
  "plugins": {
    "memory": {
      "provider": "founder-memory"  // ou "mem0" ou "lancedb"
    }
  }
}
```

**É como trocar uma roda:** Não precisa clonar o repo nem recriar o carro.
Apenas:
1. Criar novo plugin em `extensions/`
2. Configurar no `moltbot.json`
3. Reiniciar container

---

## Comparativo Final

| Aspecto | founder-memory | + Batch Diário | mem0 + Qdrant |
|---------|----------------|----------------|---------------|
| **Msgs/dia** | < 100 | 100-400 | > 400 |
| **Containers** | 2 | 2 | 4 |
| **Extração** | Manual | Batch (23h) | Real-time |
| **Custo infra** | $0 | $0 | ~$15/mês |
| **Custo LLM** | $0 | ~$2/mês | ~$5-30/mês |
| **Complexidade** | Baixa | Baixa | Alta |
| **Migração** | N/A | Nenhuma | Média |

---

## Decisão Tree

```
                    ┌─────────────────┐
                    │ Quantas msgs/dia │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         < 100 msgs    100-400 msgs    > 400 msgs
              │              │              │
              ▼              ▼              ▼
      ┌───────────┐  ┌───────────┐  ┌───────────┐
      │ founder-  │  │ founder-  │  │   mem0    │
      │  memory   │  │  memory   │  │ + Qdrant  │
      │  (atual)  │  │ + batch   │  │ + Neo4j   │
      └───────────┘  └───────────┘  └───────────┘
```

---

## Kit de Deploy Padrão

### Por Agent (Kit Básico)

```yaml
# docker-compose.agent.yml
services:
  moltbot:
    image: aleff:latest
    depends_on: [postgres]

  postgres:
    image: pgvector/pgvector:pg16
    volumes:
      - pgdata:/var/lib/postgresql/data
```

### Por Agent (Kit Escalável - quando > 400 msgs/dia)

```yaml
# docker-compose.agent-scale.yml
services:
  moltbot:
    image: aleff:latest
    depends_on: [qdrant, neo4j]

  qdrant:
    image: qdrant/qdrant:latest
    volumes:
      - qdrant_data:/qdrant/storage

  neo4j:
    image: neo4j:5-community
    volumes:
      - neo4j_data:/data
```

### Por Server (Infra Base)

```yaml
# docker-compose.infra.yml
services:
  traefik:
    image: traefik:v3.0
    ports:
      - "80:80"
      - "443:443"

  wireguard:
    image: lscr.io/linuxserver/wireguard
    cap_add:
      - NET_ADMIN

  # dnsmasq integrado no wireguard
```

---

## Referências

- [mem0 GitHub](https://github.com/mem0ai/mem0) - v1.0.2 (Jan 2026)
- [mem0 Docs - Vector DBs](https://docs.mem0.ai/components/vectordbs/overview)
- [mem0 Docs - Graph Memory](https://docs.mem0.ai/open-source/features/graph-memory)
- [mem0 Research - 26% accuracy boost](https://mem0.ai/research)
- [pgvector](https://github.com/pgvector/pgvector)

---

**Criado:** 2026-01-29
**Versão:** 1.0
**Autor:** CTO Ronald + Claude Opus 4.5
