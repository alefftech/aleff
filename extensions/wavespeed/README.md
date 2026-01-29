# 🌊 Wavespeed AI Extension

> **Unified API for 700+ AI models** - Generate images and videos with FLUX, Kling, Stable Diffusion, Luma, and more.

---

## 🎯 O Que É

Wavespeed fornece acesso unificado a mais de 700 modelos de IA através de uma única API:

**Modelos de Imagem:**
- FLUX Pro/Dev (Black Forest Labs) - Altíssima qualidade
- Stable Diffusion XL/3 - Versatilidade
- Ideogram v2 - Excelente para texto em imagens
- Leonardo Vision XL - Estilo artístico

**Modelos de Vídeo:**
- Kling AI - Alta qualidade, 5-10s
- Luma Dream Machine - Cinemático
- Runway Gen-3 - Versatilidade
- Pika - Geração rápida

---

## 🚀 Setup Rápido

### 1. Obter API Key

1. Criar conta em: https://app.wavespeed.ai
2. Ir em Settings → API Keys
3. Criar nova API key
4. Copiar o token

### 2. Configurar no Aleff

Editar `/data/moltbot.json`:

```json
{
  "plugins": {
    "entries": {
      "wavespeed": {
        "enabled": true,
        "config": {
          "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxx"
        }
      }
    }
  }
}
```

### 3. Restart

```bash
docker restart aleffai
```

### 4. Validar

```bash
docker logs aleffai | grep wavespeed
# Deve mostrar: [wavespeed] ✅ Registered 2 tools
```

---

## 📖 Como Usar

### Gerar Imagens

**Prompt simples:**
```
@aleff gera uma imagem de um gato astronauta no espaço
```

**Especificar modelo:**
```
@aleff usa flux-pro para gerar: paisagem futurista com neon
```

**Múltiplas variações:**
```
@aleff gera 4 versões de: logo minimalista para startup de AI
```

### Gerar Vídeos

**Prompt simples:**
```
@aleff gera um vídeo de ondas quebrando na praia ao pôr do sol
```

**Vídeo com narração (combina com ElevenLabs):**
```
@aleff cria um vídeo de 5 segundos mostrando crescimento de uma planta,
depois adiciona narração explicando o processo
```

**Image-to-Video:**
```
@aleff pega essa imagem [attach] e gera um vídeo de 10 segundos
```

---

## 🔧 Tools Disponíveis

### 1. `wavespeed_generate_image`

Gera imagens usando modelos de IA.

**Parâmetros:**
```typescript
{
  prompt: string;           // Descrição da imagem (obrigatório)
  model?: string;           // Modelo (default: flux-dev)
  width?: number;           // Largura (default: 1024)
  height?: number;          // Altura (default: 1024)
  num_outputs?: number;     // Quantidade (1-4, default: 1)
  seed?: number;            // Seed para reprodução
}
```

**Retorno:**
```typescript
{
  success: boolean;
  images: string[];         // URLs das imagens geradas
  model: string;
  prediction_id: string;
}
```

### 2. `wavespeed_generate_video`

Gera vídeos usando modelos de IA.

**Parâmetros:**
```typescript
{
  prompt: string;           // Descrição do vídeo (obrigatório)
  model?: string;           // Modelo (default: kling)
  image_url?: string;       // Imagem inicial (opcional)
  duration?: number;        // Duração 3-10s (default: 5)
  aspect_ratio?: string;    // 16:9, 9:16, 1:1 (default: 16:9)
}
```

**Retorno:**
```typescript
{
  success: boolean;
  video_url: string;        // URL do vídeo gerado (mp4)
  model: string;
  prediction_id: string;
}
```

---

## 💰 Custos

**Free Tier:**
- 100 requests/dia
- Acesso a modelos básicos

**Pro Plan ($29/mês):**
- Unlimited requests
- Acesso a todos os modelos
- Sem fila de espera

**Enterprise:**
- Custom pricing
- SLA garantido
- Suporte dedicado

Ver: https://wavespeed.ai/pricing

---

## 🎬 Integração com ElevenLabs

Para criar **vídeos com narração**, combinar ambas ferramentas:

```
@aleff cria um vídeo explicativo sobre fotossíntese:
1. Gera vídeo de 10s mostrando planta crescendo
2. Adiciona narração científica com voz brasileira
3. Entrega vídeo final com áudio
```

O Aleff vai:
1. Usar Wavespeed para gerar o vídeo
2. Usar ElevenLabs para gerar a narração
3. Combinar ambos (ffmpeg)
4. Entregar vídeo final

---

## 🔍 Troubleshooting

**Tool não aparece:**
```bash
# Verificar se extensão foi carregada
docker logs aleffai | grep wavespeed

# Deve mostrar:
# [wavespeed] Registering Wavespeed AI integration...
# [wavespeed] ✅ Registered 2 tools
```

**Erro de autenticação:**
```bash
# Verificar API key no moltbot.json
cat /data/moltbot.json | jq '.plugins.entries.wavespeed'

# Testar API key manualmente
curl https://api.wavespeed.ai/v1/models \
  -H "Authorization: Bearer sk-xxxxx"
```

**Timeout na geração:**
- Vídeos demoram 30-120 segundos
- Aumentar timeout se necessário
- Verificar status na Wavespeed dashboard

---

## 📚 Documentação

- **Wavespeed Docs:** https://docs.wavespeed.ai
- **API Reference:** https://docs.wavespeed.ai/api-reference
- **Model Catalog:** https://app.wavespeed.ai/explore
- **Status Page:** https://status.wavespeed.ai

---

## 🔐 Segurança

✅ **Desenvolvida internamente** (não via ClawdHub)
✅ **API key em config** (não hard-coded)
✅ **Validação de inputs**
✅ **Error handling robusto**
✅ **Logs auditáveis**

Ver: [SKILLS_SECURITY_POLICY.md](../../data/SKILLS_SECURITY_POLICY.md)

---

**Criado:** 2026-01-29
**Autor:** Aleff Team
**Versão:** 1.0.0
