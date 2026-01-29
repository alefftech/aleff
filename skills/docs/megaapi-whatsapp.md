# 📱 MegaAPI WhatsApp

> **Integração WhatsApp via API brasileira**
> **Status:** 🔧 Em Setup (código pronto, aguardando webhook)
> **Tipo:** Extension (Plugin TypeScript)

---

## 🎯 O Que É

Integração com WhatsApp usando a API brasileira MegaAPI, permitindo:

- Receber mensagens do WhatsApp
- Enviar respostas automáticas
- Processar mídias (imagens, áudios, vídeos)
- Allowlist de contatos autorizados

**Analogia:** É como conectar o número de WhatsApp da holding ao Aleff, igual o Telegram.

---

## 🎨 Por Que Foi Criada

**Problema original:**
- Meta Cloud API é complexa (7-14 dias de aprovação)
- Facebook Business requer documentação
- Processo burocrático para empresas BR

**Solução:**
- MegaAPI é serviço brasileiro
- Setup em 10 minutos
- Sem burocracia
- Suporte em português

**Comparação:**

| Feature | Meta Cloud API | MegaAPI |
|---------|----------------|---------|
| Tempo de setup | 7-14 dias | 10 minutos |
| Aprovação | Facebook Business | Instantâneo |
| Documentação | Inglês | Português |
| Suporte | Tickets | WhatsApp/Email |
| Custo | $Free + usage | R$/mês por instância |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  WhatsApp (Número da Holding)                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  MegaAPI Cloud Service                                  │
│  - Recebe mensagens do WhatsApp                         │
│  - Envia mensagens via HTTP API                         │
│  - Gerencia sessão/QR code                              │
└─────────────────┬───────────────────────────────────────┘
                  │ Webhook POST
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Tunnel → dev-04:18789                       │
│  https://aleffai.a25.com.br/webhooks/megaapi            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  MegaAPI WhatsApp Extension                             │
│  - Valida token do webhook                              │
│  - Processa mensagem (texto/mídia)                      │
│  - Envia para Aleff processar                           │
│  - Tool: megaapi_send_whatsapp                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Aleff Agent → Responde                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### Configuração Inicial (10 min)

**Ver guia completo:**
```bash
cat /docs/guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md
```

**Resumo:**
1. Criar conta em https://app.megaapi.com.br
2. Criar instância WhatsApp
3. Escanear QR Code com celular
4. Configurar webhook: `https://aleffai.a25.com.br/webhooks/megaapi`
5. Adicionar keys no `.env`
6. Restart container

### Enviar Mensagem (Tool)

O Aleff pode enviar mensagens via tool:

```typescript
// Internamente, o Aleff chama:
{
  tool: "megaapi_send_whatsapp",
  parameters: {
    number: "5511999999999",  // ou @s.whatsapp.net
    message: "Olá! Aqui é o Aleff."
  }
}
```

**Exemplo via prompt:**
```
@aleff envia no WhatsApp para +55 11 99999-9999:
"Reunião confirmada para amanhã às 14h"
```

### Receber Mensagem (Webhook)

Automático. Quando alguém manda mensagem no WhatsApp:

```
[WhatsApp] Ronald: Aleff, como está o progresso?
          ↓
[MegaAPI] POST /webhooks/megaapi
          ↓
[Extension] Valida token, processa
          ↓
[Aleff] Gera resposta
          ↓
[Extension] megaapi_send_whatsapp
          ↓
[WhatsApp] Aleff: O progresso está...
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicionar no `.env`:
```bash
# MegaAPI WhatsApp
MEGAAPI_API_KEY=seu_api_key_aqui
MEGAAPI_INSTANCE_KEY=sua_instance_key_aqui
MEGAAPI_WEBHOOK_TOKEN=token_seguro_aleatorio
```

**Obter credenciais:**
1. Login: https://app.megaapi.com.br
2. Dashboard → API Keys
3. Copiar `API Key` e `Instance Key`

### 2. Plugin Config

Editar `/data/moltbot.json`:
```json
{
  "plugins": {
    "entries": {
      "megaapi-whatsapp": {
        "enabled": true,
        "config": {
          "apiKey": "${MEGAAPI_API_KEY}",
          "instanceKey": "${MEGAAPI_INSTANCE_KEY}",
          "webhookToken": "${MEGAAPI_WEBHOOK_TOKEN}",
          "allowFrom": [
            "5511999999999@s.whatsapp.net"
          ]
        }
      }
    }
  }
}
```

**AllowList:**
- Apenas números listados podem conversar
- Formato: `{DDI}{DDD}{numero}@s.whatsapp.net`
- Exemplo: `5511999999999@s.whatsapp.net`

### 3. Webhook no MegaAPI

Dashboard MegaAPI:
```
URL: https://aleffai.a25.com.br/webhooks/megaapi
Method: POST
Headers:
  Authorization: Bearer {MEGAAPI_WEBHOOK_TOKEN}
Events:
  ✅ message
  ✅ message.new
  ✅ connection.update
```

### 4. Restart

```bash
docker restart aleffai
```

---

## 🔍 Validação

### Testar Webhook

```bash
# 1. Ver logs do container
docker logs -f aleffai | grep megaapi

# 2. Enviar mensagem de teste no WhatsApp
# Deve aparecer:
# [megaapi] Received message from 5511999999999@s.whatsapp.net
# [megaapi] Processing message: "Olá Aleff"
# [megaapi] Sending response...

# 3. Verificar resposta no WhatsApp
```

### Testar Tool Diretamente

```bash
# Via Telegram
@aleff usa a tool megaapi_send_whatsapp para enviar "teste" para 5511999999999
```

### Debug

```bash
# Ver últimas chamadas da API
docker logs aleffai | grep -A5 "megaapi.*POST"

# Ver erros
docker logs aleffai | grep "megaapi.*error" -i

# Status da conexão
curl https://api2.megaapi.com.br/rest/connectionStatus/${MEGAAPI_INSTANCE_KEY} \
  -H "Authorization: Bearer ${MEGAAPI_API_KEY}"
```

---

## 🐛 Troubleshooting

### Não recebe mensagens

**Sintoma:** Manda no WhatsApp mas nada acontece

**Checklist:**
```bash
# 1. Webhook está configurado?
# Dashboard MegaAPI → Webhooks → Verificar URL

# 2. Token correto?
docker exec aleffai printenv | grep MEGAAPI

# 3. Porta acessível?
curl -I https://aleffai.a25.com.br/webhooks/megaapi
# Deve retornar 200 ou 405 (método não permitido = ok)

# 4. Logs mostram algo?
docker logs aleffai --since 5m | grep megaapi

# 5. Número está na allowlist?
cat /data/moltbot.json | jq '.plugins.entries["megaapi-whatsapp"].config.allowFrom'
```

### Não consegue enviar mensagens

**Sintoma:** Tool retorna erro ao enviar

**Soluções:**
```bash
# 1. Testar API manualmente
curl -X POST https://api2.megaapi.com.br/rest/sendMessage/${INSTANCE_KEY}/contactMessage \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999@s.whatsapp.net",
    "text": "teste"
  }'

# 2. Ver resposta da API
docker logs aleffai | grep "megaapi.*response"

# 3. Verificar status da instância
# Dashboard MegaAPI → Status deve estar "Connected"
```

### QR Code expirou

**Sintoma:** Dashboard mostra "Disconnected"

**Solução:**
```bash
# 1. Dashboard MegaAPI → Reconectar
# 2. Escanear novo QR Code
# 3. Aguardar status "Connected"
# 4. Testar envio
```

---

## 📂 Código-fonte

```
extensions/megaapi-whatsapp/
├── clawdbot.plugin.json    # Manifest
├── index.ts                # Código principal
├── package.json            # Dependências
└── README.md               # Doc técnica
```

**Funções principais:**

`index.ts:25-80` - Webhook handler
```typescript
api.registerWebhook({
  path: '/webhooks/megaapi',
  method: 'POST',
  handler: async (req) => {
    // Validar token
    // Processar mensagem
    // Enviar para Aleff
    // Responder
  }
});
```

`index.ts:85-120` - Send message tool
```typescript
api.registerTool({
  name: 'megaapi_send_whatsapp',
  handler: async ({ number, message }) => {
    const url = `https://api2.megaapi.com.br/rest/sendMessage/${instanceKey}/contactMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ number, text: message })
    });
  }
});
```

---

## 💰 Custos

**MegaAPI Pricing:**
- **Plano Free:** 100 mensagens/mês
- **Plano Basic:** R$ 49/mês - 1.000 mensagens
- **Plano Pro:** R$ 149/mês - 10.000 mensagens
- **Enterprise:** Custom pricing

**Ver preços atualizados:**
https://megaapi.com.br/pricing

---

## 🔐 Segurança

**Proteções implementadas:**
- ✅ Webhook token validation
- ✅ AllowList de números
- ✅ HTTPS only (Cloudflare tunnel)
- ✅ API keys em .env (não hard-coded)
- ✅ Audit log de mensagens

**Dados sensíveis:**
- API Key: Nunca commitar no Git
- Webhook Token: Gerar aleatório forte
- AllowList: Apenas números autorizados

**Ver policy:**
- [Skills Security Policy](../../data/SKILLS_SECURITY_POLICY.md)

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Receber mensagens texto
- ✅ Enviar mensagens texto
- ✅ AllowList
- 🔧 Webhook configurado

**V2 (planejado):**
- [ ] Processar imagens
- [ ] Processar áudios (transcrição)
- [ ] Enviar mídias
- [ ] Status (online/typing)
- [ ] Botões interativos

**V3 (futuro):**
- [ ] Multi-instância (vários números)
- [ ] Templates de mensagens
- [ ] Analytics (taxa de resposta, etc.)
- [ ] Integration com CRM

---

## 📚 Documentação Externa

**MegaAPI:**
- Docs: https://docs.megaapi.com.br
- API Reference: https://docs.megaapi.com.br/api
- Dashboard: https://app.megaapi.com.br
- Suporte: suporte@megaapi.com.br

**Guias Aleff:**
- [MEGAAPI_WHATSAPP_SETUP_GUIDE.md](../../docs/guides/MEGAAPI_WHATSAPP_SETUP_GUIDE.md)

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** 🔧 Aguardando configuração de webhook
