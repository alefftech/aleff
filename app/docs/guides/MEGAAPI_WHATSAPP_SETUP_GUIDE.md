# 📱 Guia Rápido: Conectar WhatsApp no Aleff

**Tempo estimado:** 10 minutos
**Custo:** Grátis (trial 5 dias)

---

## 🚀 Passo a Passo

### 1️⃣ Criar Conta na MegaAPI (2 min)

1. Acesse: **https://mega-api.app.br**
2. Clique em "Criar Conta" ou "Trial Grátis"
3. Preencha dados básicos
4. Confirme email

### 2️⃣ Criar Instância WhatsApp (3 min)

No painel da MegaAPI:

1. **Criar Nova Instância**
   - Clique em "Nova Instância"
   - Escolha um nome (ex: "aleff-whatsapp")
   - Aguarde criação

2. **Conectar WhatsApp**
   - Aparecerá um QR Code
   - Abra WhatsApp Business no celular
   - Menu → Dispositivos Conectados → Conectar dispositivo
   - Escaneie o QR Code
   - ✅ Aguarde aparecer "Conectado"

3. **Copiar Credenciais**
   - `API Key` (Bearer Token) - copiar
   - `Instance Key` - copiar

### 3️⃣ Configurar Webhook (2 min - Opcional)

No painel MegaAPI:

1. Ir em "Webhook" ou "Configurações"
2. Adicionar:
   - **URL:** `https://aleffai.a25.com.br/hooks/megaapi`
   - **Token:** `megaapi_webhook_2026_secure_token`
3. Salvar

### 4️⃣ Habilitar no Aleff (3 min)

**Editar arquivo de configuração:**

```bash
nano /mnt/HC_Volume_104508618/abckx/aleff/data/moltbot.json
```

**Adicionar na seção `plugins.entries`:**

```json
{
  "plugins": {
    "entries": {
      "telegram": { "enabled": true },
      "founder-memory": { "enabled": true },
      "lobster": { "enabled": true },
      "open-prose": { "enabled": true },
      "megaapi-whatsapp": {
        "enabled": true,
        "config": {
          "apiKey": "COLAR_SEU_API_KEY_AQUI",
          "instanceKey": "COLAR_SUA_INSTANCE_KEY_AQUI",
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

**Substituir:**
- `COLAR_SEU_API_KEY_AQUI` → Bearer Token da MegaAPI
- `COLAR_SUA_INSTANCE_KEY_AQUI` → Instance Key da MegaAPI
- `5511999999999` → Seu número WhatsApp (formato: 55 + DDD + número)

**Salvar:** Ctrl+O, Enter, Ctrl+X

### 5️⃣ Restart do Aleff

```bash
docker restart aleffai
```

Aguardar 10 segundos.

### 6️⃣ Testar (1 min)

**Verificar logs:**
```bash
docker logs aleffai | grep megaapi
```

Deve aparecer:
```
[megaapi-whatsapp] Plugin registered
```

**Enviar mensagem de teste:**

No Telegram, enviar para @aleff_000_bot:
```
"Envia um WhatsApp de teste pro meu número: Olá do Aleff!"
```

✅ Se a mensagem chegar no WhatsApp, está funcionando!

---

## 📋 Checklist de Configuração

- [ ] Conta criada na MegaAPI
- [ ] Instância criada e conectada (QR Code escaneado)
- [ ] API Key e Instance Key copiados
- [ ] Webhook configurado (opcional)
- [ ] moltbot.json editado com credenciais
- [ ] Número adicionado no allowFrom
- [ ] Container reiniciado
- [ ] Logs verificados (plugin registered)
- [ ] Teste de envio realizado

---

## 🔒 Segurança - Allowlist

Similar ao Telegram, apenas números autorizados podem conversar:

```json
{
  "allowFrom": [
    "5511999999999@s.whatsapp.net",  // Founder
    "5511888888888@s.whatsapp.net",  // CTO
    "5511777777777@s.whatsapp.net"   // CFO
  ]
}
```

**Formato:**
- `55` = Código do Brasil
- `11` = DDD
- `999999999` = Número
- `@s.whatsapp.net` = Sufixo obrigatório

---

## 🆘 Problemas Comuns

### WhatsApp desconectou

**Causa:** App fechou no celular ou QR expirou

**Solução:**
1. Abrir painel MegaAPI
2. Ver status da instância
3. Re-escanear QR Code

### Mensagem não envia

**Erro:** `Unauthorized (401)`

**Solução:**
- Verificar se API Key está correto
- Verificar se Instance Key está correto
- Recriar instância se necessário

### Plugin não carrega

**Solução:**
```bash
# 1. Verificar syntax do JSON
cat /mnt/HC_Volume_104508618/abckx/aleff/data/moltbot.json | jq '.'

# 2. Ver logs de erro
docker logs aleffai | grep -i error

# 3. Restart
docker restart aleffai
```

---

## 💰 Custos

**Trial:** 5 dias grátis

**Após trial:**
- Consultar tabela de preços em https://mega-api.app.br
- Geralmente: R$ 49-99/mês dependendo do volume

**Alternativa oficial (Meta):**
- WhatsApp Cloud API (gratuita)
- Mas requer: verificação de empresa (7-14 dias)

---

## 📚 Próximos Passos

Após conectar WhatsApp:

1. **Testar fluxos básicos:**
   - Envio de mensagens
   - Recebimento via webhook
   - Respostas automáticas

2. **Integrar com workflows:**
   - Notificações importantes via WhatsApp
   - Alertas de sistema
   - Confirmações de tarefas

3. **Monitorar uso:**
   - Logs em `aleff.audit_log`
   - Rate limiting
   - Compliance com políticas WhatsApp

---

**Criado por:** Claude Code
**Data:** 2026-01-29
**Para:** Holding Inteligência Avançada
