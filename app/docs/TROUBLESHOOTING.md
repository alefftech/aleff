# Troubleshooting Guide

Guia para diagnóstico e resolução de problemas comuns no Aleff.

---

## Índice

- [Erros Comuns](#erros-comuns)
  - [Cannot read properties of undefined (reading 'properties')](#cannot-read-properties-of-undefined-reading-properties)
- [Diagnóstico Geral](#diagnóstico-geral)
- [Anchor Comments](#anchor-comments)

---

## Erros Comuns

### Cannot read properties of undefined (reading 'properties')

**Sintoma:** Bot responde apenas com esta mensagem de erro no Telegram, sem processar a mensagem do usuário.

**Causa raiz:** A biblioteca `@mariozechner/pi-ai` espera que tools tenham `parameters` (não `inputSchema`) com a estrutura:
```javascript
tool.parameters.properties  // pi-ai espera isso
tool.inputSchema.properties // NÃO funciona!
```

**Arquivo afetado:** `extensions/founder-memory/src/tools.ts`

**Fix aplicado em:** 2026-01-29

**Como verificar:**
```bash
# 1. Verificar se tools usam parameters (não inputSchema)
grep -n "inputSchema\|parameters:" extensions/founder-memory/src/tools.ts

# 2. Verificar logs do container
docker logs aleffai 2>&1 | grep -i "error\|properties"

# 3. Testar localmente
docker exec aleffai node -e "
const tools = require('/app/dist/agents/pi-tools.schema.js');
console.log('Test passed');
"
```

**Prevenção:** Sempre usar `parameters` em vez de `inputSchema` ao criar tools:
```typescript
// ✅ CORRETO
export function createMyTool(): AnyAgentTool {
  return {
    name: "my_tool",
    description: "...",
    parameters: {  // <-- usar parameters
      type: "object",
      properties: { ... },
      required: ["..."],
    },
    async execute(params) { ... },
  };
}

// ❌ ERRADO (causa crash)
export function createMyTool(): AnyAgentTool {
  return {
    name: "my_tool",
    description: "...",
    inputSchema: {  // <-- NÃO usar inputSchema
      ...
    },
  };
}
```

---

## Diagnóstico Geral

### Comandos úteis para debug

```bash
# Ver status do container
docker ps -a | grep aleff

# Logs em tempo real
docker logs -f aleffai

# Logs das últimas 5 minutos
docker logs aleffai --since "5m"

# Buscar erros nos logs
docker logs aleffai 2>&1 | grep -i "error\|fail\|exception"

# Verificar arquivo de log interno
docker exec aleffai cat /tmp/moltbot/moltbot-$(date +%Y-%m-%d).log | tail -100

# Verificar config do moltbot
docker exec -u root aleffai cat /app/data/moltbot.json | head -50

# Testar se postgres está conectado
docker exec aleffai node -e "
const { isPostgresConfigured } = require('/app/dist/extensions/founder-memory/src/postgres.js');
console.log('Postgres configured:', isPostgresConfigured());
"
```

### Verificar se tools estão registrados corretamente

```bash
docker exec aleffai node -e "
const tools = require('/app/dist/extensions/founder-memory/src/tools.js');
const creators = [
  'createSaveToMemoryTool',
  'createSearchMemoryTool',
  'createVectorSearchTool',
  'createGetContextTool',
  'createKnowledgeGraphTool',
  'createFindConnectionTool',
  'createLearnFactTool'
];
creators.forEach(name => {
  if (tools[name]) {
    const tool = tools[name]();
    const schema = tool.parameters;
    console.log(name + ':', Boolean(schema), Boolean(schema?.properties));
  }
});
"
```

---

## Anchor Comments

O código usa anchor comments para facilitar navegação. Buscar por:

```bash
# Encontrar todos os anchors
grep -rn "ANCHOR:" src/ extensions/

# Anchors específicos
grep -rn "ANCHOR: FOUNDER-MEMORY" extensions/
grep -rn "ANCHOR: TOOL-SCHEMA" src/agents/
grep -rn "ANCHOR: CONFIG-SCHEMA" src/config/
```

### Anchors importantes

| Anchor | Arquivo | Descrição |
|--------|---------|-----------|
| `FOUNDER-MEMORY-TOOLS` | `extensions/founder-memory/src/tools.ts` | Definição dos tools de memória |
| `SCHEMA-MERGE` | `src/config/schema.ts` | Merge de schemas (bug fix 2026-01-29) |

---

**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Opus 4.5
