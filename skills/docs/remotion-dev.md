# 🎬 Remotion Dev

> **Geração de vídeos programáticos com React**
> **Status:** ✅ Ativa
> **Tipo:** Skill (Markdown SKILL.md)

---

## 🎯 O Que É

Skill que permite ao Aleff gerar vídeos programaticamente usando Remotion (framework React para vídeos).

**Capacidades:**
- Criar vídeos a partir de código React
- Templates para intros de cursos
- Progress bars animados
- Social media clips
- Batch processing

**Analogia:** É como ter um Adobe After Effects programável - você descreve o vídeo em código e ele renderiza automaticamente.

---

## 🎨 Por Que Foi Criada

**Problema original (MENTORINGBASE):**
- Melissa precisa de intros padronizadas para cursos
- Criar no Adobe Premiere demora 30+ min por vídeo
- Difícil manter consistência visual
- Custos de designer/editor

**Solução:**
- Template React reutilizável
- Renderização automática com Remotion
- Mudança apenas de props (título, instrutor, etc.)
- Geração em ~2 minutos

**ROI:**
- Antes: 30 min/vídeo manual
- Depois: 2 min/vídeo automático
- Economia: ~93% do tempo

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  User Request (Telegram/WhatsApp)                       │
│  "Cria intro do curso AI para Negócios"                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Aleff Agent                                            │
│  - Parseia pedido                                       │
│  - Identifica: título, instrutor, duração               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Remotion Dev Skill (SKILL.md injected)                 │
│  - Usa `npx remotion render`                            │
│  - Template: CourseIntro                                │
│  - Props: {title, instructor, duration}                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Remotion CLI (npx)                                     │
│  - Carrega template React                               │
│  - Renderiza frames (1080p60)                           │
│  - Exporta MP4                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Video File (output.mp4)                                │
│  - Upload para Telegram/WhatsApp                        │
│  - Ou salva em /tmp para download                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### Gerar Intro de Curso

```
@aleff gera intro do curso:
- Título: "AI para Negócios"
- Instrutor: "Melissa Garcia"
- Duração: 10 segundos
```

O Aleff vai:
1. Usar template `CourseIntro`
2. Renderizar com as props fornecidas
3. Gerar `course-intro.mp4`
4. Enviar o vídeo

### Gerar Progress Bar Animado

```
@aleff cria vídeo de progresso:
- Label: "Processando dados"
- Progresso: 0 a 100%
- Duração: 5 segundos
```

### Batch Processing

```
@aleff gera intros para os 5 cursos:
1. AI para Negócios
2. Python Básico
3. Data Science
4. Machine Learning
5. Deep Learning

Instrutor: Melissa Garcia
```

Gera 5 vídeos automaticamente.

---

## 📦 Templates Disponíveis

### 1. CourseIntro
**Uso:** Introdução de cursos online

**Props:**
```typescript
{
  title: string;          // "AI para Negócios"
  instructor: string;     // "Melissa Garcia"
  platform: string;       // "MENTORINGBASE"
  duration: number;       // 10 (segundos)
  bgColor: string;        // "#1a1a2e" (opcional)
  accentColor: string;    // "#16213e" (opcional)
}
```

**Output:** MP4 1080p60, 10 segundos

### 2. ProgressBar
**Uso:** Animações de loading/progresso

**Props:**
```typescript
{
  label: string;          // "Processando..."
  from: number;           // 0
  to: number;             // 100
  duration: number;       // 5 (segundos)
  color: string;          // "#00ff00" (opcional)
}
```

**Output:** MP4 1080p60, duração configurável

### 3. SocialClip
**Uso:** Clipes para Instagram/TikTok (9:16)

**Props:**
```typescript
{
  text: string;           // Texto principal
  author: string;         // "@mentoringbase"
  duration: number;       // 15 (segundos)
  orientation: "9:16" | "16:9" | "1:1";
}
```

**Output:** MP4 1080x1920 (vertical)

---

## ⚙️ Configuração

### 1. Binário (já instalado)

Remotion usa `npx` (Node.js) - já disponível no container.

Não precisa instalar nada adicional.

### 2. Skill (já ativa)

Localização: `/skills/remotion-dev/SKILL.md`

```markdown
# Remotion Dev Skill

You can generate videos programmatically using Remotion CLI.

Available templates:
- CourseIntro
- ProgressBar
- SocialClip

Usage:
npx remotion render <template> output.mp4 --props='{"title":"..."}'
```

Injetado automaticamente no prompt do Aleff.

### 3. Verificar

```bash
# Testar Remotion CLI
docker exec aleffai npx remotion --version

# Deve retornar: 4.x.x
```

---

## 🎨 Criar Template Customizado

### Passo 1: Criar Componente React

```tsx
// templates/MyTemplate.tsx
import {AbsoluteFill, useCurrentFrame} from 'remotion';

export const MyTemplate: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{
      backgroundColor: '#1a1a2e',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{
        color: 'white',
        fontSize: 100,
        opacity: frame / 30  // Fade in
      }}>
        {text}
      </h1>
    </AbsoluteFill>
  );
};
```

### Passo 2: Registrar Composição

```tsx
// remotion.config.ts
import {MyTemplate} from './templates/MyTemplate';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyTemplate"
        component={MyTemplate}
        durationInFrames={150}  // 5 segundos @ 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

### Passo 3: Usar

```
@aleff usa template MyTemplate com texto "Olá Mundo"
```

---

## 🔍 Comandos Úteis

### Renderizar localmente

```bash
docker exec aleffai npx remotion render CourseIntro output.mp4 \
  --props='{"title":"Teste","instructor":"Melissa"}'
```

### Preview no browser

```bash
docker exec aleffai npx remotion preview
# Acessa http://localhost:3000
```

### Listar templates

```bash
docker exec aleffai npx remotion compositions
```

### Render em diferentes qualidades

```bash
# 4K
npx remotion render CourseIntro output.mp4 --width=3840 --height=2160

# 720p
npx remotion render CourseIntro output.mp4 --width=1280 --height=720

# Baixa qualidade (rápido)
npx remotion render CourseIntro output.mp4 --quality=50
```

---

## 🐛 Troubleshooting

### Render muito lento

**Sintoma:** Leva 5+ minutos para renderizar 10 segundos

**Soluções:**
```bash
# 1. Usar concurrency (paralelo)
npx remotion render CourseIntro output.mp4 --concurrency=4

# 2. Reduzir qualidade
npx remotion render CourseIntro output.mp4 --quality=70

# 3. Usar codec mais rápido
npx remotion render CourseIntro output.mp4 --codec=h264-mkv
```

### Erro "Cannot find module"

**Sintoma:** `Error: Cannot find module 'remotion'`

**Solução:**
```bash
# Instalar dependências
docker exec aleffai npm install remotion

# Ou rebuild container
docker build -t aleff:latest .
```

### Vídeo sem áudio

**Sintoma:** MP4 gerado não tem som

**Solução:**
```tsx
// Adicionar AudioTrack no template
import {Audio} from 'remotion';

<AbsoluteFill>
  <Audio src="/path/to/audio.mp3" />
  {/* Resto do template */}
</AbsoluteFill>
```

---

## 📂 Código-fonte

```
skills/remotion-dev/
├── SKILL.md               # Instruções para o Aleff
├── templates/             # Templates React
│   ├── CourseIntro.tsx
│   ├── ProgressBar.tsx
│   └── SocialClip.tsx
└── remotion.config.ts     # Configuração
```

**Skill injetada no prompt:**
`skills/remotion-dev/SKILL.md:1-50`

---

## 💰 Custos

**Remotion:**
- ✅ Open Source (MIT License)
- ✅ Grátis para uso comercial
- ✅ Sem limites de renderização

**Custos de infraestrutura:**
- CPU: Rendering usa 100% CPU por ~30-120s
- RAM: ~2GB durante render
- Disco: Vídeos temporários (~50MB cada)

**Otimizar:**
- Deletar vídeos após enviar
- Usar cloud rendering (Remotion Lambda) para scale

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Templates básicos
- ✅ Renderização local
- ✅ Props customizáveis

**V2 (planejado):**
- [ ] Templates específicos da holding
  - Logo MENTORINGBASE
  - Branding IAVANCADA
  - Intros AGILCONTRATOS
- [ ] Audio automático (TTS integration)
- [ ] Transições avançadas
- [ ] Batch rendering otimizado

**V3 (futuro):**
- [ ] Cloud rendering (Remotion Lambda)
- [ ] Editor visual (sem código)
- [ ] Library de assets (logos, músicas)
- [ ] Analytics (views, engagement)

---

## 📚 Documentação Externa

**Remotion:**
- Docs: https://www.remotion.dev/docs
- Templates: https://www.remotion.dev/templates
- Examples: https://github.com/remotion-dev/remotion/tree/main/packages/example
- Discord: https://remotion.dev/discord

**React:**
- React Docs: https://react.dev

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Pronta para uso
