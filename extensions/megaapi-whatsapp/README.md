# 📱 MegaAPI WhatsApp Integration

> **Status:** ✅ Desenvolvida internamente (segura)
> **Data:** 2026-01-29
> **Autor:** Claude Code + CTO Ronald

---

## 🎯 O Que É

Integração do Aleff com WhatsApp usando **MegaAPI** (API brasileira).

**Por que MegaAPI e não Meta Cloud API?**
- ✅ Mais simples de configurar (5 minutos vs 7 dias)
- ✅ Trial gratuito de 5 dias
- ✅ Suporte em português
- ✅ Sem burocracia de verificação de negócio

---

## 🔧 Como Configurar

### 1. Criar Conta na MegaAPI

1. Acesse: https://mega-api.app.br
2. Crie uma conta (trial 5 dias grátis)
3. Obtenha:
   - **API Key** (Bearer Token)
   - **Instance Key**

### 2. Conectar WhatsApp

No painel da MegaAPI:
1. Crie uma nova instância
2. Escaneie o QR Code com o WhatsApp Business
3. Aguarde conectar

### 3. Configurar Webhook (Opcional)

Para receber mensagens em tempo real:

**URL do Webhook:**
```
https://aleffai.a25.com.br/hooks/megaapi
```

**Token de Segurança:** (qualquer string aleatória)
```
megaapi_webhook_2026_secure_token
```

### 4. Adicionar no moltbot.json

Editar `/data/moltbot.json`:

```json
{
  "plugins": {
    "entries": {
      "megaapi-whatsapp": {
        "enabled": true,
        "config": {
          "apiKey": "seu_bearer_token_aqui",
          "instanceKey": "sua_instance_key_aqui",
          "webhookUrl": "https://aleffai.a25.com.br/hooks/megaapi",
          "webhookToken": "megaapi_webhook_2026_secure_token",
          "allowFrom": [
            "5511999999999@s.whatsapp.net"
          ]
        }
      }
    }
  }
}
```

**Campos:**
- `apiKey`: Token de autenticação da MegaAPI
- `instanceKey`: ID da instância criada
- `webhookUrl`: URL para receber mensagens (opcional)
- `webhookToken`: Token para validar webhook (opcional)
- `allowFrom`: Lista de números autorizados (segurança)

### 5. Restart do Container

```bash
docker restart aleffai
```

---

## 📨 Como Usar

### Enviar Mensagem via Tool

O Aleff pode enviar mensagens usando o tool `megaapi_send_whatsapp`:

```typescript
// Aleff detecta automaticamente quando precisa enviar WhatsApp
User: "Manda mensagem no WhatsApp pro Founder: Reunião confirmada às 14h"

Aleff: [usa megaapi_send_whatsapp]
{
  "to": "5511999999999",
  "message": "Reunião confirmada às 14h"
}
```

### Enviar com Mídia

```typescript
{
  "to": "5511999999999",
  "message": "Segue o relatório de vendas",
  "mediaUrl": "https://exemplo.com/relatorio.pdf"
}
```

### Receber Mensagens

Com webhook configurado, o Aleff recebe mensagens em tempo real:

1. Usuário manda WhatsApp → MegaAPI webhook → Aleff
2. Aleff verifica allowlist
3. Se autorizado, processa e responde

---

## 🔒 Segurança

### Allowlist Obrigatória

Similar ao Telegram, apenas números autorizados podem conversar:

```json
{
  "allowFrom": [
    "5511999999999@s.whatsapp.net",  // Founder
    "5511888888888@s.whatsapp.net"   // CTO
  ]
}
```

**Formato do número:**
- Código do país: 55 (Brasil)
- DDD: 11
- Número: 999999999
- Sufixo: @s.whatsapp.net

**Grupos (futuro):**
- Sufixo: @g.us

### Webhook Token

Valida que requisições vêm da MegaAPI:

```http
POST /hooks/megaapi
X-Webhook-Token: megaapi_webhook_2026_secure_token
```

---

## 🧪 Testar Integração

### 1. Verificar Plugin Carregado

```bash
docker logs aleffai | grep megaapi
# Deve mostrar: [megaapi-whatsapp] Plugin registered
```

### 2. Teste de Envio (Manual)

```bash
curl -X POST "https://api2.megaapi.com.br/rest/sendMessage/SUA_INSTANCE_KEY/contactMessage" \
  -H "Authorization: Bearer SEU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999@s.whatsapp.net",
    "text": "Teste do Aleff via MegaAPI"
  }'
```

### 3. Teste via Aleff

No Telegram, pedir para o Aleff:

```
"Envia um WhatsApp de teste pro número 5511999999999"
```

Aleff deve usar o tool `megaapi_send_whatsapp` automaticamente.

---

## 📊 API Reference

### Send Message

**Endpoint:**
```
POST https://api2.megaapi.com.br/rest/sendMessage/{instance_key}/contactMessage
```

**Headers:**
```
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Body:**
```json
{
  "number": "5511999999999@s.whatsapp.net",
  "text": "Sua mensagem aqui",
  "mediaUrl": "https://exemplo.com/imagem.jpg" // opcional
}
```

### Webhook Payload

**Incoming Message:**
```json
{
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "message_id"
    },
    "message": {
      "conversation": "Texto da mensagem",
      "type": "text"
    }
  }
}
```

---

## 🚨 Limitações e Boas Práticas

### Limitações da MegaAPI

- **Spam Protection:** Não envie mensagens em massa (risco de ban)
- **Rate Limits:** Respeite limites da API
- **WhatsApp Policy:** Siga termos de uso do WhatsApp Business

### Boas Práticas

1. **Mensagens 1:1 apenas**
   - Não envie broadcast
   - Responda apenas quem iniciou conversa

2. **Respeite horários**
   - Evite mensagens fora do horário comercial
   - Configure rate limiting

3. **Conteúdo apropriado**
   - Não envie spam
   - Respeite LGPD

---

## 🆘 Troubleshooting

### Plugin não carrega

```bash
# Verificar logs
docker logs aleffai | grep megaapi

# Verificar config
docker exec aleffai cat /home/node/.moltbot/moltbot.json | jq '.plugins.entries["megaapi-whatsapp"]'
```

### Erro de autenticação

```
Error: MegaAPI error (401): Unauthorized
```

**Solução:** Verificar se `apiKey` e `instanceKey` estão corretos.

### Mensagens não chegam

1. Verificar se número está no `allowFrom`
2. Verificar se webhook está configurado na MegaAPI
3. Verificar se `webhookToken` está correto

### WhatsApp desconectou

No painel da MegaAPI:
1. Ver status da instância
2. Re-escanear QR Code se necessário
3. Verificar se WhatsApp Business está ativo no celular

---

## 📚 Recursos

**MegaAPI:**
- Website: https://mega-api.app.br
- Documentação: https://mega-api.app.br/documentacao/business/
- API Docs: https://api2.megaapi.com.br/docs/
- GitHub: https://github.com/Megaapi

**WhatsApp Business:**
- Termos de Uso: https://www.whatsapp.com/legal/business-terms
- Políticas: https://www.whatsapp.com/legal/business-policy

---

## 📝 Changelog

| Data | Mudança | Autor |
|------|---------|-------|
| 2026-01-29 | Criação inicial da extensão | Claude Code |
| 2026-01-29 | Adicionada allowlist de segurança | Claude Code |
| 2026-01-29 | Implementado webhook handler | Claude Code |

---

**Desenvolvido internamente seguindo SKILLS_SECURITY_POLICY.md**
**Versão:** 1.0.0
**Responsável:** CTO Ronald
