# 🎙️ ElevenLabs TTS

> **Text-to-Speech com vozes naturais em 32 idiomas**
> **Status:** ✅ Ativa
> **Tipo:** Config (moltbot.json + src/tts/)

---

## 🎯 O Que É

Sistema de síntese de voz (Text-to-Speech) integrado no Aleff, permitindo:

- Gerar áudio a partir de texto
- Vozes ultra-realistas
- 32 idiomas (incluindo pt-BR)
- 3 providers: ElevenLabs, OpenAI, Edge
- Streaming (latência 75ms)
- Voice cloning

**Analogia:** É como ter um dublador profissional disponível 24/7 para narrar qualquer texto.

---

## 🎨 Por Que Foi Criada

**Problema original:**
- MENTORINGBASE precisa de narração para vídeos
- Contratar dublador: R$ 200-500/vídeo
- Processo demorado (enviar roteiro, receber áudio, revisar)
- Difícil manter consistência de voz

**Solução:**
- TTS automático integrado
- Voz natural em português
- Geração instantânea
- Custo: $0,0001/caractere (ElevenLabs) ou grátis (Edge TTS)

**ROI:**
- Antes: R$ 300/vídeo + 2 dias de espera
- Depois: ~R$ 0,50/vídeo + 2 segundos
- Economia: ~99.8%

**Use cases:**
- Narração de vídeo-aulas
- Áudios de WhatsApp/Telegram
- Podcasts automáticos
- Audiobooks
- IVR (atendimento telefônico)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  User Request                                           │
│  "[[tts]] Olá! Como vai?"                               │
│  ou: /tts on                                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Aleff Agent                                            │
│  - Detecta [[tts]] tag                                  │
│  - Ou modo global enabled                               │
│  - Extrai texto para narrar                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  TTS System (src/tts/tts.ts)                            │
│  - Provider priority: elevenlabs → openai → edge        │
│  - Gera áudio (MP3/Opus)                                │
│  - Salva em /tmp                                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Audio File (voice-123456.mp3)                          │
│  - Enviado via Telegram/WhatsApp                        │
│  - Ou retornado para processing (Remotion)              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### Modo Tagged (padrão)

Use `[[tts]]` para gerar áudio:

```
@aleff [[tts]] Olá! Esta é a voz do Aleff em português brasileiro.
```

O Aleff vai:
1. Detectar tag `[[tts]]`
2. Gerar áudio do texto após a tag
3. Enviar mensagem de texto + áudio

### Modo Global

Ativar TTS para todas as respostas:

```
/tts on
```

Agora TODAS as respostas vêm com áudio automaticamente.

Desativar:
```
/tts off
```

### Modo Inbound

TTS apenas quando usuário envia áudio:

```json
// moltbot.json
{
  "messages": {
    "tts": {
      "auto": "inbound"
    }
  }
}
```

Se você mandar áudio, Aleff responde com áudio.
Se você mandar texto, Aleff responde com texto.

### Custom Voice/Model

Override via tags:

```
[[tts:provider=elevenlabs voiceId=ABC123]] Texto com voz customizada
```

```
[[tts:provider=openai voice=alloy]] Texto com voz OpenAI
```

---

## ⚙️ Configuração

### 1. Providers

**3 providers disponíveis:**

| Provider | Qualidade | Custo | Latência | Idiomas |
|----------|-----------|-------|----------|---------|
| **ElevenLabs** | ⭐⭐⭐⭐⭐ | $0.0001/char | 75ms | 32 |
| **OpenAI** | ⭐⭐⭐⭐ | $0.000015/char | 200ms | 57 |
| **Edge** | ⭐⭐⭐ | Grátis | 300ms | 119 |

**Prioridade (fallback automático):**
1. ElevenLabs (se API key configurada)
2. OpenAI (se API key configurada)
3. Edge (sempre disponível, grátis)

### 2. API Keys

Configurar no `.env`:

```bash
# ElevenLabs (recomendado)
ELEVENLABS_API_KEY=sk_0c5f3a6c98e2511fcf54ca8973f039be06ed5670a72f8523

# Ou OpenAI
OPENAI_API_KEY=sk-proj-...

# Edge não precisa de API key
```

### 3. moltbot.json

Configuração completa:

```json
{
  "messages": {
    "tts": {
      "auto": "tagged",          // "off" | "always" | "tagged" | "inbound"
      "mode": "final",            // "final" | "streaming"
      "provider": "elevenlabs",   // "elevenlabs" | "openai" | "edge"
      "maxTextLength": 4096,
      "timeoutMs": 30000,

      "elevenlabs": {
        "voiceId": "pMsXgVXv3BLzUgSXRplE",  // Voice ID
        "modelId": "eleven_multilingual_v2",
        "voiceSettings": {
          "stability": 0.5,        // 0-1 (menor = mais variação)
          "similarityBoost": 0.75, // 0-1 (maior = mais fiel)
          "style": 0.0,            // 0-1 (estilo/emoção)
          "useSpeakerBoost": true,
          "speed": 1.0             // 0.5-2.0
        }
      },

      "openai": {
        "model": "gpt-4o-mini-tts",  // "tts-1" | "tts-1-hd"
        "voice": "alloy"              // "alloy" | "echo" | "fable" | etc
      },

      "edge": {
        "enabled": true,
        "voice": "pt-BR-FranciscaNeural",  // Voz brasileira
        "lang": "pt-BR",
        "outputFormat": "audio-24khz-48kbitrate-mono-mp3"
      }
    }
  }
}
```

### 4. Restart

```bash
docker restart aleffai
```

---

## 🎨 Vozes Disponíveis

### ElevenLabs (Premium)

**Vozes brasileiras populares:**
- `pMsXgVXv3BLzUgSXRplE` - Bella (feminina, clara)
- `ErXwobaYiN019PkySvjV` - Antoni (masculina, profunda)
- Custom voice cloning (seu próprio dublador!)

**Ver todas:**
https://elevenlabs.io/app/voice-library

**Modelos:**
- `eleven_multilingual_v2` - 32 idiomas (recomendado)
- `eleven_turbo_v2_5` - Mais rápido, 32 idiomas
- `eleven_monolingual_v1` - Apenas inglês, alta qualidade

### OpenAI

**Vozes disponíveis:**
- `alloy` - Neutro
- `echo` - Masculino
- `fable` - Britânico
- `onyx` - Profundo
- `nova` - Feminino
- `shimmer` - Suave

### Edge TTS (Microsoft Azure)

**Vozes brasileiras:**
- `pt-BR-FranciscaNeural` - Feminina (padrão)
- `pt-BR-AntonioNeural` - Masculina
- `pt-BR-BrendaNeural` - Feminina (mais jovem)
- `pt-BR-DonatoNeural` - Masculina (mais velho)

**Ver todas as vozes:**
```bash
docker exec aleffai npx edge-tts --list-voices | grep pt-BR
```

---

## 🔍 Comandos Úteis

### Testar TTS Manualmente

**ElevenLabs:**
```bash
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/pMsXgVXv3BLzUgSXRplE \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Olá, teste de voz","model_id":"eleven_multilingual_v2"}' \
  -o test.mp3
```

**OpenAI:**
```bash
curl -X POST https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"Olá teste","voice":"alloy"}' \
  -o test.mp3
```

**Edge:**
```bash
docker exec aleffai npx edge-tts \
  --voice "pt-BR-FranciscaNeural" \
  --text "Olá, teste de voz" \
  --write-media test.mp3
```

### Verificar Config

```bash
# Ver provider configurado
docker exec aleffai cat /home/node/.moltbot/moltbot.json | jq '.messages.tts.provider'

# Ver API key
docker exec aleffai printenv | grep ELEVENLABS

# Testar via Aleff
# Telegram: [[tts]] teste
```

### Mudar Velocidade

Editar `moltbot.json`:
```json
{
  "elevenlabs": {
    "voiceSettings": {
      "speed": 1.2  // 20% mais rápido
    }
  }
}
```

### Mudar Voz

```json
{
  "edge": {
    "voice": "pt-BR-AntonioNeural"  // Voz masculina
  }
}
```

Restart:
```bash
docker restart aleffai
```

---

## 🐛 Troubleshooting

### TTS não funciona

**Sintoma:** Tag `[[tts]]` ignorada, sem áudio

**Checklist:**
```bash
# 1. Verificar se auto está correto
cat /data/moltbot.json | jq '.messages.tts.auto'
# Deve ser: "tagged" ou "always"

# 2. Verificar API key
docker exec aleffai printenv | grep ELEVENLABS

# 3. Testar provider
docker exec aleffai curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: $ELEVENLABS_API_KEY"

# 4. Ver logs
docker logs aleffai | grep -i tts

# 5. Fallback para Edge (grátis)
# Editar moltbot.json: "provider": "edge"
```

### Áudio em inglês

**Sintoma:** Voz fala em inglês mesmo com texto em português

**Solução:**
```json
{
  "elevenlabs": {
    "modelId": "eleven_multilingual_v2",  // Multilíngue!
    "languageCode": "pt"                  // Força português
  }
}
```

ou use Edge:
```json
{
  "provider": "edge",
  "edge": {
    "voice": "pt-BR-FranciscaNeural",
    "lang": "pt-BR"
  }
}
```

### Áudio robotizado

**Sintoma:** Voz soa artificial

**Solução:**

1. Usar ElevenLabs (melhor qualidade)
2. Ajustar settings:
```json
{
  "elevenlabs": {
    "voiceSettings": {
      "stability": 0.3,         // Mais variação
      "similarityBoost": 0.9,   // Mais natural
      "useSpeakerBoost": true
    }
  }
}
```

### Custo muito alto

**Sintoma:** Gasto excessivo com ElevenLabs

**Soluções:**
```bash
# 1. Ver uso
# Dashboard ElevenLabs → Usage

# 2. Usar Edge (grátis) como padrão
{
  "provider": "edge",
  "elevenlabs": {...}  // Mantém como fallback
}

# 3. Limitar tamanho do texto
{
  "maxTextLength": 1000  // Máximo 1000 chars
}

# 4. Modo tagged apenas
{
  "auto": "tagged"  // Só gera se [[tts]]
}
```

---

## 📂 Código-fonte

```
src/tts/
├── tts.ts                  # Sistema principal
├── tts.test.ts             # Testes
└── types.tts.ts            # TypeScript types

src/gateway/server-methods/
└── tts.ts                  # Gateway methods (/tts on/off)

src/auto-reply/reply/
└── commands-tts.ts         # Comandos /tts
```

**Função principal:**
`src/tts/tts.ts:1071-1240` - textToSpeech()

**Providers:**
- `elevenLabsTTS()` - linha 916
- `openaiTTS()` - linha 993
- `edgeTTS()` - linha 1050

---

## 💰 Custos

### ElevenLabs

| Plano | Custo/mês | Characters | Exemplos |
|-------|-----------|------------|----------|
| Free | $0 | 10,000 | ~50 respostas |
| Starter | $5 | 30,000 | ~150 respostas |
| Creator | $22 | 100,000 | ~500 respostas |
| Pro | $99 | 500,000 | ~2,500 respostas |

**Estimativa holding:**
- Uso moderado: 200 respostas/mês
- Custo: $5/mês (Starter)

### OpenAI

- **tts-1:** $0.015 per 1K chars (~$0.000015/char)
- **tts-1-hd:** $0.030 per 1K chars

**10x mais barato que ElevenLabs**, mas qualidade inferior.

### Edge TTS

- **Grátis** ✅
- Ilimitado
- Qualidade boa (não excelente)

**Recomendação:** Usar Edge como padrão, ElevenLabs para vídeos importantes.

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ 3 providers
- ✅ Tagged mode
- ✅ Vozes customizáveis
- ✅ Fallback automático

**V2 (planejado):**
- [ ] Voice cloning (clonar voz do Founder)
- [ ] Detecção automática de idioma
- [ ] Emoção/tom customizável
- [ ] SSML support (pauses, emphasis)

**V3 (futuro):**
- [ ] Real-time streaming TTS
- [ ] Conversational AI (back-and-forth)
- [ ] Multi-speaker (diálogos)
- [ ] Integração com Remotion (vídeos narrados automáticos)

---

## 📚 Documentação Externa

**ElevenLabs:**
- Docs: https://elevenlabs.io/docs
- API Reference: https://elevenlabs.io/docs/api-reference
- Voice Library: https://elevenlabs.io/app/voice-library
- Pricing: https://elevenlabs.io/pricing

**OpenAI:**
- TTS Guide: https://platform.openai.com/docs/guides/text-to-speech
- API Reference: https://platform.openai.com/docs/api-reference/audio/createSpeech

**Edge TTS:**
- GitHub: https://github.com/rany2/edge-tts
- Voice List: https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list

**Guias Aleff:**
- [WAVESPEED_ELEVENLABS_SETUP_GUIDE.md](../../docs/guides/WAVESPEED_ELEVENLABS_SETUP_GUIDE.md)

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Ativo e funcionando
