# 🌊🎙️ Guia: Wavespeed AI + ElevenLabs TTS

> **Criar imagens, vídeos e áudios com IA**
> **Tempo:** 15 minutos
> **Atualizado:** 2026-01-29

---

## 🎯 O Que Você Vai Conseguir

Após este setup, o Aleff poderá:

✅ **Gerar imagens** com FLUX, SDXL, Ideogram (via Wavespeed)
✅ **Gerar vídeos** com Kling, Luma, Runway (via Wavespeed)
✅ **Narrar em português** com voz natural (via ElevenLabs)
✅ **Criar vídeos narrados** combinando ambas tecnologias

**Exemplos de uso:**
- "Gera uma imagem de logo minimalista para startup"
- "Cria um vídeo de 5s mostrando crescimento de planta"
- "Explica fotossíntese com vídeo + narração em português"

---

## 📋 Pré-requisitos

- [x] Aleff instalado e rodando
- [x] Acesso ao servidor dev-04
- [x] Cartão de crédito (para Wavespeed pago - ou usar free tier)
- [ ] Conta Wavespeed
- [ ] Conta ElevenLabs

---

## 🚀 Parte 1: ElevenLabs (Text-to-Speech)

### 1.1. Criar Conta ElevenLabs

1. Acessar: https://elevenlabs.io
2. **Sign Up** (pode usar Google)
3. Escolher plano:
   - **Free**: 10,000 chars/mês (suficiente para testes)
   - **Starter ($5/mês)**: 30,000 chars/mês
   - **Creator ($22/mês)**: 100,000 chars/mês

### 1.2. Obter API Key

1. Ir em: https://elevenlabs.io/app/settings/api-keys
2. Clicar **Create API Key**
3. Dar nome: "Aleff AI"
4. **Copiar a key** (começa com `sk_...`)

⚠️ **IMPORTANTE:** Guardar em local seguro (ex: Passbolt)

### 1.3. Escolher Voz (Opcional)

**Vozes brasileiras recomendadas:**
- **pt-BR-FranciscaNeural** (feminina, padrão) ✅
- **pt-BR-AntonioNeural** (masculina)

Para usar vozes custom do ElevenLabs:
1. Ir em: https://elevenlabs.io/app/voice-lab
2. Clonar ou criar voz
3. Copiar **Voice ID** (ex: `pMsXgVXv3BLzUgSXRplE`)

### 1.4. Configurar no Aleff

**Opção A: Via variável de ambiente (.env)**

Editar `/opt/aleff/.env`:
```bash
# ElevenLabs TTS
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxx
# ou
XI_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxx
```

**Opção B: Via moltbot.json (já configurado)**

Editar `/opt/aleff/data/moltbot.json`:
```json
{
  "messages": {
    "tts": {
      "enabled": true,
      "provider": "elevenlabs",
      "elevenlabs": {
        "apiKey": "sk_xxxxxxxxxxxxxxxxxxxxxxxxx",
        "voiceId": "pMsXgVXv3BLzUgSXRplE",
        "modelId": "eleven_multilingual_v2"
      }
    }
  }
}
```

### 1.5. Restart

```bash
docker restart aleffai
```

### 1.6. Testar

Enviar no Telegram:
```
@aleff [[tts]] Olá! Esta é a voz do Aleff em português.
```

Ou usar comando:
```
/tts on
@aleff Agora tudo que eu responder virá com áudio!
```

---

## 🌊 Parte 2: Wavespeed AI (Imagens/Vídeos)

### 2.1. Criar Conta Wavespeed

1. Acessar: https://app.wavespeed.ai
2. **Sign Up** (pode usar Google/GitHub)
3. Escolher plano:
   - **Free**: 100 requests/dia
   - **Pro ($29/mês)**: Unlimited, sem fila
   - **Enterprise**: Custom pricing

### 2.2. Obter API Key

1. Ir em: https://app.wavespeed.ai/settings/api-keys
2. Clicar **Create New API Key**
3. Dar nome: "Aleff AI"
4. **Copiar a key** (começa com `sk-wave_...`)

⚠️ **IMPORTANTE:** Guardar em Passbolt

### 2.3. Configurar no Aleff

Editar `/opt/aleff/data/moltbot.json`:

```json
{
  "plugins": {
    "entries": {
      "wavespeed": {
        "enabled": true,
        "config": {
          "apiKey": "sk-wave_xxxxxxxxxxxxxxxxxxxxxxxxx"
        }
      }
    }
  }
}
```

### 2.4. Restart

```bash
docker restart aleffai
```

### 2.5. Testar

**Gerar imagem:**
```
@aleff gera uma imagem: logo minimalista para startup de AI
```

**Gerar vídeo:**
```
@aleff cria um vídeo de 5 segundos: ondas quebrando na praia
```

---

## 🎬 Parte 3: Combinar Ambos (Vídeo + Narração)

### Uso Básico

```
@aleff cria um vídeo explicativo sobre fotossíntese:
1. Gera vídeo de 10s mostrando planta crescendo
2. Adiciona narração: "A fotossíntese é o processo onde plantas convertem luz em energia"
```

### Workflow Avançado

**Passo 1:** Gerar vídeo
```
@aleff usa kling para criar: time-lapse de cidade à noite
```

**Passo 2:** Baixar vídeo (Aleff faz automaticamente)

**Passo 3:** Gerar narração
```
@aleff [[tts]] Nesta cena vemos a transformação da cidade ao longo de 24 horas
```

**Passo 4:** Combinar (usando ffmpeg)
```bash
# Aleff pode fazer isso automaticamente ou você pode:
ffmpeg -i video.mp4 -i narration.mp3 \
  -c:v copy -c:a aac -shortest \
  final.mp4
```

---

## 📊 Status de Configuração

### Verificar ElevenLabs

```bash
# Ver logs
docker logs aleffai | grep -i tts

# Testar API key
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: sk_xxxxx"
```

**Esperado:**
```json
{
  "voices": [
    {
      "voice_id": "pMsXgVXv3BLzUgSXRplE",
      "name": "Bella",
      "category": "premade"
    }
  ]
}
```

### Verificar Wavespeed

```bash
# Ver logs
docker logs aleffai | grep wavespeed

# Testar API key
curl https://api.wavespeed.ai/v1/models \
  -H "Authorization: Bearer sk-wave_xxxxx"
```

**Esperado:**
```
[wavespeed] Registering Wavespeed AI integration...
[wavespeed] ✅ Registered 2 tools
```

---

## 🎯 Casos de Uso para a Holding

### MENTORINGBASE (Melissa)

**Course Intros automatizados:**
```
@aleff cria intro do curso "AI para Negócios":
- Vídeo: animação de logo + gráficos
- Narração: "Bem-vindo ao curso de IA para Negócios com Melissa Garcia"
- Duração: 10 segundos
```

**Video-aulas com narração:**
```
@aleff transforma este texto em vídeo aula:
[colar conteúdo da aula]
```

### IAVANCADA (Cintia)

**Demos de produtos:**
```
@aleff cria demo do nosso produto:
- Vídeo: interface em uso
- Narração: explicação em pt-BR
```

### AGILCONTRATOS (Carlos André)

**Vídeos explicativos:**
```
@aleff explica termo jurídico com vídeo + narração
```

---

## 💰 Custos Estimados

### ElevenLabs

| Plano | Custo/mês | Characters | Uso estimado |
|-------|-----------|------------|--------------|
| Free | $0 | 10,000 | 50 mensagens/mês |
| Starter | $5 | 30,000 | 150 mensagens/mês |
| Creator | $22 | 100,000 | 500 mensagens/mês |

**Para holding:** Starter ($5) suficiente inicialmente

### Wavespeed

| Plano | Custo/mês | Requests | Uso estimado |
|-------|-----------|----------|--------------|
| Free | $0 | 100/dia | Testes |
| Pro | $29 | Unlimited | Produção |
| Enterprise | Custom | Unlimited + SLA | Scale |

**Para holding:** Free tier para MVP, Pro depois

**Total estimado:** $34/mês (Starter + Pro)

---

## 🔧 Troubleshooting

### TTS não funciona

**Problema:** Sem áudio nas respostas

**Soluções:**
```bash
# 1. Verificar se TTS está habilitado
cat /opt/aleff/data/moltbot.json | jq '.messages.tts.enabled'

# 2. Testar API key
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: $ELEVENLABS_API_KEY"

# 3. Ver logs de erro
docker logs aleffai | grep -A5 "TTS"

# 4. Forçar provider
# Editar moltbot.json: "provider": "edge" (grátis, sem API key)
```

### Wavespeed timeout

**Problema:** "Prediction timeout"

**Soluções:**
- Vídeos demoram 30-120s (normal)
- Verificar status em: https://app.wavespeed.ai/predictions
- Usar modelo mais rápido: `pika` (3s) ao invés de `kling` (10s)

### Áudio em inglês

**Problema:** Voz em inglês ao invés de português

**Solução:**
```json
{
  "messages": {
    "tts": {
      "provider": "edge",
      "edge": {
        "voice": "pt-BR-FranciscaNeural",
        "lang": "pt-BR"
      }
    }
  }
}
```

---

## 📚 Documentação Completa

**ElevenLabs:**
- Docs: https://elevenlabs.io/docs
- Voices: https://elevenlabs.io/app/voice-lab
- API Reference: https://elevenlabs.io/docs/api-reference

**Wavespeed:**
- Docs: https://docs.wavespeed.ai
- Models: https://app.wavespeed.ai/explore
- API Reference: https://docs.wavespeed.ai/api-reference

**Aleff:**
- TTS Docs: `/docs/tts.md`
- Skills Guide: `/data/SKILLS_GUIDE.md`
- Wavespeed Extension: `/extensions/wavespeed/README.md`

---

## ✅ Checklist Final

- [ ] ElevenLabs API key configurada
- [ ] Wavespeed API key configurada
- [ ] Container reiniciado
- [ ] Teste de TTS funcionou
- [ ] Teste de imagem funcionou
- [ ] Teste de vídeo funcionou
- [ ] Vídeo + narração testado

---

## 📞 Suporte

**Dúvidas?**
- CTO Ronald (supervisor do Aleff)
- Telegram: @aleff_000_bot

**Issues conhecidas:**
- Ver: `/docs/troubleshooting.md`
- GitHub Issues: https://github.com/alefftech/aleff/issues

---

**Criado:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Última atualização:** 2026-01-29
