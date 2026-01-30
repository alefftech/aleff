# WhatsApp Provider Abstraction

Provider-agnostic WhatsApp integration layer for AleffAI.

## Architecture

```
whatsapp-core/      # Abstraction layer
├── types/          # Provider-agnostic types
├── client/         # Singleton + Presence manager
└── index.ts        # Plugin entry

whatsapp-megaapi/   # MegaAPI adapter
├── adapter.ts      # Implements WhatsAppProvider
├── api.ts          # HTTP client
└── webhook-normalizer.ts

whatsapp-tools/     # MCP tools
└── tools/          # All WhatsApp tools
```

## Usage

### For Tools (whatsapp-tools)

```typescript
import { getWhatsAppClient } from "whatsapp-core";

const client = getWhatsAppClient();
await client.messages.sendText("5511999999999", "Hello!");
```

### For Adapters (whatsapp-megaapi)

```typescript
import { getWhatsAppClient } from "whatsapp-core";
import { createMegaAPIProvider } from "./adapter.js";

const client = getWhatsAppClient();
client.registerProvider("megaapi", createMegaAPIProvider);
client.useProvider("megaapi", config);
```

## Switching Providers

To switch from MegaAPI to another provider (e.g., Evolution API):

1. Create new adapter plugin (e.g., `whatsapp-evolution`)
2. Update moltbot.json:
```json
"whatsapp-megaapi": { "enabled": false },
"whatsapp-evolution": { "enabled": true }
```
3. Zero code changes in tools

## Available Tools

| Tool | Description |
|------|-------------|
| `send_whatsapp_message` | Send text message |
| `reply_whatsapp_message` | Reply to a message |
| `send_whatsapp_image` | Send image |
| `send_whatsapp_audio` | Send audio |
| `send_whatsapp_video` | Send video |
| `send_whatsapp_file` | Send document |
| `send_whatsapp_location` | Send location |
| `send_whatsapp_contact` | Send contact card |
| `whatsapp_status` | Check connection |
| `whatsapp_qr_code` | Get QR code |
| `is_on_whatsapp` | Check if number exists |
| `whatsapp_restart` | Restart instance |
| `whatsapp_logout` | Logout instance |
| `whatsapp_list_groups` | List groups |
| `whatsapp_group_info` | Get group info |
| `whatsapp_create_group` | Create group |
| `whatsapp_add_participants` | Add to group |
| `whatsapp_remove_participants` | Remove from group |
| `whatsapp_leave_group` | Leave group |

## Environment Variables

```bash
# MegaAPI Configuration
MEGAAPI_API_HOST=apistart01.megaapi.com.br
MEGAAPI_INSTANCE_KEY=your-instance-key
MEGAAPI_TOKEN=your-api-token
MEGAAPI_WEBHOOK_TOKEN=optional-webhook-token
MEGAAPI_ALLOW_FROM=5511999999999,5511888888888  # Empty = public
```

## Plugin Load Order

1. `whatsapp-core` - Creates client singleton
2. `whatsapp-megaapi` - Registers and activates provider
3. `whatsapp-tools` - Registers MCP tools

## Version

1.0.0
