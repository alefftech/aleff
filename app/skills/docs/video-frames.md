# 🎞️ video-frames (ffmpeg)

> **Extrai frames e clips de vídeos**
> **Status:** ✅ Ativa
> **Tipo:** Skill (CLI binary)

---

## 🎯 O Que É

Skill que usa ffmpeg para extrair frames (imagens) de vídeos ou criar clips curtos para análise.

**Capacidades:**
- Extrair frame em timestamp específico
- Criar thumbnail de vídeo
- Extrair primeiro/último frame
- Gerar múltiplos frames (time-lapse)
- Converter vídeo para sequência de imagens
- Criar GIFs animados

**Analogia:** É como tirar "screenshots" de um vídeo em qualquer momento.

---

## 🎨 Por Que Foi Criada

**Problema original (MENTORINGBASE):**
- Melissa precisa de thumbnails para vídeo-aulas
- Criar thumbnail manualmente no editor demora 5+ minutos
- Difícil escolher o melhor frame
- Inconsistência visual entre vídeos

**Solução:**
- Extrair frame automaticamente de qualquer vídeo
- Escolher timestamp exato (ex: 00:00:30)
- Geração em segundos
- Qualidade consistente

**ROI:**
- Antes: 5 min/thumbnail manual
- Depois: 5 segundos automático
- Economia: ~98% do tempo

---

## 🚀 Como Usar

### Extrair Frame em Timestamp Específico

```bash
ffmpeg -i video.mp4 -ss 00:00:30 -vframes 1 thumbnail.jpg
```

**Onde:**
- `-i video.mp4` - Vídeo de entrada
- `-ss 00:00:30` - Timestamp (30 segundos)
- `-vframes 1` - Apenas 1 frame
- `thumbnail.jpg` - Saída

### Extrair Primeiro Frame

```bash
ffmpeg -i video.mp4 -vframes 1 first-frame.jpg
```

### Extrair Frame em Alta Qualidade

```bash
ffmpeg -i video.mp4 -ss 00:01:00 -vframes 1 -q:v 2 high-quality.jpg
```

**Nota:** `-q:v 2` = qualidade alta (2-5 é bom, 2 é melhor)

### Extrair Múltiplos Frames (Time-lapse)

```bash
# Extrai 1 frame por segundo
ffmpeg -i video.mp4 -vf fps=1 frames/frame-%04d.jpg
```

### Criar GIF de Vídeo

```bash
# 10 segundos de vídeo → GIF
ffmpeg -i video.mp4 -ss 00:00:10 -t 10 -vf "fps=10,scale=480:-1" output.gif
```

---

## ⚙️ Configuração

**Já instalado!** ffmpeg está disponível em `/usr/bin/ffmpeg`

Verificar instalação:
```bash
docker exec aleffai which ffmpeg
# /usr/bin/ffmpeg

docker exec aleffai ffmpeg -version
# ffmpeg version 5.1.8
```

---

## 🔍 Comandos Úteis

### Para MENTORINGBASE (Thumbnails)

```bash
# Thumbnail aos 30 segundos
ffmpeg -i aula.mp4 -ss 00:00:30 -vframes 1 thumb.jpg

# Thumbnail no meio do vídeo (calcular duração/2)
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.mp4)
MIDDLE=$(echo "$DURATION / 2" | bc)
ffmpeg -i video.mp4 -ss $MIDDLE -vframes 1 thumb.jpg

# Thumbnail em múltiplos pontos (preview)
ffmpeg -i video.mp4 -vf "select='eq(n,0)+eq(n,30)+eq(n,60)+eq(n,90)'" -vsync 0 preview-%02d.jpg
```

### Para QA de Vídeos

```bash
# Extrair frames a cada 10 segundos para revisão
ffmpeg -i video.mp4 -vf fps=1/10 qa-frames/frame-%03d.jpg

# Criar montagem de previews (grid 3x3)
ffmpeg -i video.mp4 -vf "select='not(mod(n\,300))',scale=320:180,tile=3x3" preview-grid.jpg
```

### Informações do Vídeo

```bash
# Ver duração, resolução, bitrate
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 video.mp4

# Ver resolução
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 video.mp4
```

---

## 🐛 Troubleshooting

### Erro: "ffmpeg: command not found"

**Causa:** Binário não instalado

**Solução:**
```bash
# Rebuild container (já está no Dockerfile)
docker build -t aleff:latest .
docker compose -f docker-compose.aleff.yml up -d aleffai
```

### Frame extraído está escuro/claro

**Causa:** Timestamp coincide com transição ou fade

**Solução:**
```bash
# Tentar timestamp diferente
ffmpeg -i video.mp4 -ss 00:00:32 -vframes 1 thumb.jpg  # +2 segundos

# Ou usar frame específico (não timestamp)
ffmpeg -i video.mp4 -vf "select=eq(n\,100)" -vframes 1 frame-100.jpg
```

### Qualidade baixa do frame

**Sintoma:** Imagem borrada ou com artefatos

**Solução:**
```bash
# Aumentar qualidade JPEG
ffmpeg -i video.mp4 -ss 00:00:30 -vframes 1 -q:v 1 high-quality.jpg

# Ou usar PNG (sem compressão)
ffmpeg -i video.mp4 -ss 00:00:30 -vframes 1 high-quality.png
```

### Processo muito lento

**Sintoma:** Demora minutos para extrair 1 frame

**Causa:** ffmpeg está decodificando todo o vídeo até o timestamp

**Solução:**
```bash
# Colocar -ss ANTES do -i (muito mais rápido)
❌ Lento: ffmpeg -i video.mp4 -ss 00:10:00 -vframes 1 frame.jpg
✅ Rápido: ffmpeg -ss 00:10:00 -i video.mp4 -vframes 1 frame.jpg

# Diferença: 30 segundos → 1 segundo
```

---

## 📂 Código-fonte

**Binary instalado via apt:**
```dockerfile
# Dockerfile linha ~XX
RUN apt-get install -y ffmpeg
```

**Localização:** `/usr/bin/ffmpeg`

**Skill detection:** `/skills/video-frames/SKILL.md`

---

## 💡 Use Cases para a Holding

### MENTORINGBASE (Melissa)
- **Thumbnails automáticos:** Extração aos 30s de cada vídeo
- **Preview de cursos:** Grid de frames para marketing
- **QA de gravações:** Verificar qualidade antes de publicar

### IAVANCADA (Marketing)
- **GIFs para redes sociais:** Clips curtos de palestras
- **Teasers:** Frames importantes para promoção
- **Documentação visual:** Screenshots de demos

### Geral (Holding)
- **Análise de reuniões gravadas:** Frames de slides apresentados
- **Arquivo visual:** Indexação de vídeos por frame
- **Transcrição assistida:** Frames + OCR para extrair texto de slides

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Extração de frames via ffmpeg
- ✅ Suporte a qualquer formato de vídeo
- ✅ Timestamps precisos

**V2 (planejado):**
- [ ] Integração com Aleff via Telegram/WhatsApp
  - Enviar vídeo → Aleff extrai thumbnail → Retorna imagem
- [ ] Detecção automática de "melhor frame" (ML)
- [ ] Batch processing (múltiplos vídeos)

**V3 (futuro):**
- [ ] OCR em frames (extrair texto de slides)
- [ ] Face detection (encontrar frames com pessoas)
- [ ] Scene detection (mudanças de cena)

---

## 🎨 Exemplos Práticos

### Workflow MENTORINGBASE

```bash
#!/bin/bash
# generate-thumbnails.sh

VIDEO_DIR="/data/videos"
THUMB_DIR="/data/thumbnails"

for video in $VIDEO_DIR/*.mp4; do
  filename=$(basename "$video" .mp4)

  # Extrair thumbnail aos 30 segundos
  ffmpeg -ss 00:00:30 -i "$video" -vframes 1 -q:v 2 \
    "$THUMB_DIR/${filename}-thumb.jpg" -y

  echo "✅ Thumbnail gerado: ${filename}-thumb.jpg"
done

echo "🎉 Todos os thumbnails gerados!"
```

### Criar Preview Grid (3x3)

```bash
# 9 frames distribuídos pelo vídeo em grid
ffmpeg -i video.mp4 \
  -vf "select='not(mod(n\,300))',scale=320:180,tile=3x3" \
  -frames:v 1 preview-grid.jpg
```

### Criar GIF Animado (Redes Sociais)

```bash
# 5 segundos de vídeo → GIF otimizado
ffmpeg -i video.mp4 -ss 00:01:00 -t 5 \
  -vf "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 output.gif
```

---

## 📚 Documentação Externa

**ffmpeg:**
- Website: https://ffmpeg.org
- Docs: https://ffmpeg.org/documentation.html
- Wiki: https://trac.ffmpeg.org/wiki

**Tutoriais úteis:**
- Extração de frames: https://trac.ffmpeg.org/wiki/Create%20a%20thumbnail%20image%20every%20X%20seconds
- GIF creation: https://ffmpeg.org/ffmpeg-filters.html#palettegen-1

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Instalada e funcionando
