# WhatsApp MegaAPI Plugin

Plugin para integração WhatsApp via [MegaAPI](https://megaapi.com.br) HTTP API.

## Status

| Feature | Status | Notas |
|---------|--------|-------|
| Receber mensagens (webhook) | ✅ Funcional | Via hook transform |
| Enviar texto | ✅ Funcional | Via outbound adapter |
| Enviar mídia | ✅ Funcional | Imagem, áudio, vídeo, documento |
| Typing indicator | ❌ Pendente | Requer gateway adapter |
| Read receipts | ❌ Pendente | Requer gateway adapter |
| Reactions | ❌ Não suportado | MegaAPI Starter não suporta |

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  MegaAPI Cloud  │────▶│  Webhook (hook)  │────▶│  Moltbot Agent  │
│                 │     │  transform.ts    │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
        ▲                                                 │
        │                                                 ▼
        │               ┌──────────────────┐     ┌─────────────────┐
        └───────────────│  MegaAPI HTTP    │◀────│  Outbound       │
                        │  API             │     │  channel.ts     │
                        └──────────────────┘     └─────────────────┘
```

### Componentes

- **transform.ts**: Hook transform que normaliza webhooks MegaAPI → formato moltbot
- **channel.ts**: ChannelPlugin que registra canal "whatsapp" com `deliveryMode: "direct"`
- **outbound.ts**: ChannelOutboundAdapter com `sendText` e `sendMedia`
- **adapter.ts**: WhatsAppProvider para abstração (usado por whatsapp-tools)
- **api.ts**: Cliente HTTP low-level para MegaAPI

### Delivery Mode

Este plugin usa `deliveryMode: "direct"`, diferente do WhatsApp bundled que usa `"gateway"` (WhatsApp Web).

**Implicações:**
- Não requer WhatsApp Web local (sem QR code)
- Não tem acesso a typing indicators nativos
- Não tem acesso a read receipts nativos

## Configuração

### Environment Variables

```bash
# Obrigatórias
MEGAAPI_TOKEN=seu_token_bearer
MEGAAPI_INSTANCE_KEY=megastart-xxx

# Opcionais
MEGAAPI_API_HOST=apistart01.megaapi.com.br  # default
MEGAAPI_WEBHOOK_TOKEN=token_validacao       # segurança webhook
MEGAAPI_ALLOW_FROM=5511999999999,5511888888888  # allowlist (vazio = público)
```

### moltbot.json

```json
{
  "plugins": {
    "entries": {
      "whatsapp-core": { "enabled": true },
      "whatsapp-megaapi": { "enabled": true },
      "whatsapp-tools": { "enabled": true }
    }
  },
  "hooks": {
    "enabled": true,
    "transformsDir": "/app/extensions/whatsapp-megaapi/src",
    "mappings": [
      {
        "id": "megaapi",
        "match": { "path": "megaapi" },
        "action": "agent",
        "wakeMode": "now",
        "transform": { "module": "transform.js" }
      }
    ]
  }
}
```

### MegaAPI Dashboard

Configure o webhook no painel MegaAPI:
```
URL: https://seu-dominio.com/hooks/megaapi
```

## Logs

### Verificar registro do canal
```bash
docker logs aleffai 2>&1 | grep "channel_registered"
# {"channelId":"whatsapp","deliveryMode":"direct","msg":"channel_registered"}
```

### Verificar mensagens recebidas
```bash
docker logs aleffai 2>&1 | grep "transform_complete"
# {"from":"5511...@s.whatsapp.net","hasMedia":false,"msg":"transform_complete"}
```

### Verificar envio de respostas
```bash
docker logs aleffai 2>&1 | grep "outbound_send"
# {"to":"5511...@s.whatsapp.net","msg":"outbound_send_text"}
# {"to":"5511...@s.whatsapp.net","msg":"outbound_send_text_success"}
```

## Roadmap

- [ ] Typing indicator via MegaAPI sendPresence
- [ ] Read receipts via MegaAPI markAsRead
- [ ] Suporte a polls (enquetes)
- [ ] Suporte a botões/listas interativas

## Versão

- **1.1.0** - Outbound channel adapter (sendText, sendMedia)
- **1.0.0** - Provider adapter + webhook transform
