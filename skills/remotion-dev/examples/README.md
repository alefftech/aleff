# MENTORINGBASE Video Templates

Three production-ready Remotion templates for creating professional course videos.

## 📦 Templates Included

### 1. Course Intro (`course-intro.tsx`)
Professional course introduction with animated title and instructor name.

**Use Case**: Opening video for every course
**Duration**: 5 seconds
**Format**: 1920x1080 (16:9)

**Props**:
- `title` (string): Course title
- `instructor` (string): Instructor name
- `brandColor` (string, optional): Hex color (default: `#16aaff`)

**Example**:
```bash
npx remotion render src/index.ts CourseIntro output.mp4 \
  --props='{"title":"Introdução à IA","instructor":"Melissa Oliveira"}'
```

**Anchor Comments**:
- `[ANIMATION:TITLE]` - Spring entrance animation
- `[ANIMATION:INSTRUCTOR]` - Delayed fade-in
- `[ELEMENT:TITLE]` - Main course title
- `[ELEMENT:DIVIDER]` - Animated divider line
- `[CONFIG]` - Composition settings

---

### 2. Progress Tracker (`progress-tracker.tsx`)
Animated progress bar with milestone badges for student achievements.

**Use Case**: Course completion certificates, progress emails
**Duration**: 6 seconds
**Format**: 1920x1080 (16:9)

**Props**:
- `studentName` (string): Student full name
- `courseName` (string): Course name
- `completion` (number): Progress 0-100
- `brandColor` (string, optional): Success color (default: `#4caf50`)

**Example**:
```bash
npx remotion render src/index.ts ProgressTracker output.mp4 \
  --props='{"studentName":"João Silva","courseName":"IA Avançada","completion":75}'
```

**Anchor Comments**:
- `[ANIMATION:PROGRESS]` - Smooth progress bar fill
- `[ANIMATION:PERCENTAGE]` - Count-up effect
- `[ANIMATION:BADGE]` - Milestone celebration
- `[ELEMENT:PROGRESS_BAR]` - Main progress visualization
- `[ELEMENT:MILESTONE_BADGES]` - 25%, 50%, 75%, 100% badges

---

### 3. Social Clip (`social-clip.tsx`)
Vertical format (9:16) for Instagram Reels, TikTok, YouTube Shorts.

**Use Case**: Marketing clips, tips, quotes, announcements
**Duration**: 6 seconds
**Format**: 1080x1920 (9:16 vertical)

**Props**:
- `text` (string): Main quote or tip
- `hashtags` (string, optional): Hashtags for social
- `authorName` (string, optional): Creator name
- `brandColor` (string, optional): Brand accent color

**Example**:
```bash
npx remotion render src/index.ts SocialClip output.mp4 \
  --props='{"text":"5 dicas para dominar IA em 2026","hashtags":"#IA #MENTORINGBASE"}'
```

**Anchor Comments**:
- `[ANIMATION:BACKGROUND]` - Gradient movement
- `[ANIMATION:TEXT]` - Bounce entrance
- `[ANIMATION:HASHTAGS]` - Slide up reveal
- `[ELEMENT:MAIN_TEXT]` - Quote/tip display
- `[ELEMENT:CTA]` - Call-to-action at end

---

## 🚀 Quick Start

### 1. Setup Project
```bash
# Create new Remotion project
npx create-video@latest

# Or add to existing project
npm install remotion @remotion/cli
```

### 2. Copy Templates
```bash
# Copy templates to your project
cp course-intro.tsx src/compositions/
cp progress-tracker.tsx src/compositions/
cp social-clip.tsx src/compositions/
```

### 3. Register Compositions

Edit `src/Root.tsx`:

```tsx
import { Composition } from 'remotion';
import { CourseIntro, courseIntroConfig } from './compositions/course-intro';
import { ProgressTracker, progressTrackerConfig } from './compositions/progress-tracker';
import { SocialClip, socialClipConfig } from './compositions/social-clip';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition {...courseIntroConfig} />
      <Composition {...progressTrackerConfig} />
      <Composition {...socialClipConfig} />
    </>
  );
};
```

### 4. Preview
```bash
npx remotion preview src/index.ts
```

### 5. Render
```bash
# Render single video
npx remotion render src/index.ts CourseIntro course-intro.mp4

# Render with custom props
npx remotion render src/index.ts CourseIntro output.mp4 \
  --props='{"title":"Meu Curso","instructor":"Nome Instrutor"}'

# Render high quality
npx remotion render src/index.ts CourseIntro output.mp4 \
  --quality 100 \
  --codec h264
```

---

## 🔧 Customization Guide

### Changing Brand Colors

**MENTORINGBASE Colors**:
- Primary Blue: `#16aaff`
- Success Green: `#4caf50`
- Dark Background: `#1a1a2e`
- Light Gray: `#f5f5f5`

Update in props:
```json
{
  "brandColor": "#YOUR_COLOR"
}
```

### Adjusting Animation Speed

In template files, modify:
```tsx
// Slower animation
const titleSpring = spring({
  frame,
  fps,
  config: {
    damping: 150,  // Higher = slower
    stiffness: 100, // Lower = slower
  },
});
```

### Changing Duration

Update in config:
```tsx
export const courseIntroConfig = {
  // ...
  durationInFrames: 180, // 6 seconds (30fps)
  fps: 30,
};
```

### Adding Custom Fonts

1. Download font files (.woff2, .ttf)
2. Place in `public/fonts/`
3. Import in template:

```tsx
import { fontFamily } from '@remotion/google-fonts/Inter';

// In component:
style={{
  fontFamily: fontFamily,
}}
```

---

## 📊 Batch Rendering

### Render Multiple Courses

Create `courses.json`:
```json
[
  {"title": "IA para Iniciantes", "instructor": "Melissa"},
  {"title": "Python Avançado", "instructor": "João"},
  {"title": "Data Science", "instructor": "Maria"}
]
```

Batch render script:
```bash
#!/bin/bash
# [LOG:BATCH_RENDER] Batch render course intros from JSON

cat courses.json | jq -c '.[]' | while read course; do
  TITLE=$(echo $course | jq -r '.title')
  INSTRUCTOR=$(echo $course | jq -r '.instructor')

  echo "[INFO] Rendering: $TITLE by $INSTRUCTOR"

  npx remotion render src/index.ts CourseIntro \
    "output-${TITLE// /-}.mp4" \
    --props="$course"

  echo "[SUCCESS] Rendered: output-${TITLE// /-}.mp4"
done
```

---

## 🎨 Design System

### Typography Scale
- `72px` - Main titles (course-intro)
- `56px` - Social clip text
- `48px` - Student names
- `36px` - Instructor names
- `28px` - Hashtags, secondary text
- `24px` - Status messages
- `18-20px` - Watermarks

### Spacing
- Large gaps: `60px`
- Medium gaps: `40px`
- Small gaps: `30px`
- Tight spacing: `15px`

### Animation Timings
- Quick: `0-30 frames` (1 second)
- Medium: `30-60 frames` (2 seconds)
- Slow: `60-90 frames` (3 seconds)

---

## 🔍 Anchor Comments Guide

All templates use anchor comments for code navigation:

**Animation Markers**:
- `[ANIMATION:*]` - Animation logic and interpolations
- `[CONFIG]` - Composition configuration

**Element Markers**:
- `[ELEMENT:*]` - Visual components and JSX elements

**Log Markers** (in scripts):
- `[LOG:*]` - Logging and debug statements
- `[INFO]` - Informational logs
- `[SUCCESS]` - Success messages
- `[ERROR]` - Error handling

**Usage**:
Search in your editor: `/\[ANIMATION:/` to find all animations.

---

## 🧪 Testing

### Test Template Rendering

```bash
# [TEST:RENDER] Quick render test (low quality)
npx remotion render src/index.ts CourseIntro test.mp4 \
  --quality 50 \
  --frames=0-30

# [TEST:PREVIEW] Open in browser
npx remotion preview src/index.ts

# [TEST:PROPS] Test with different props
npx remotion render src/index.ts ProgressTracker test.mp4 \
  --props='{"completion":0}' && \
npx remotion render src/index.ts ProgressTracker test.mp4 \
  --props='{"completion":100}'
```

---

## 📈 Production Deployment

### Lambda Rendering (Scalable)

```bash
# [DEPLOY:LAMBDA] Deploy to AWS Lambda
npx remotion lambda sites create src/index.ts \
  --site-name=mentoringbase-videos

# [RENDER:LAMBDA] Render on Lambda
npx remotion lambda render mentoringbase-videos CourseIntro \
  --props='{"title":"My Course","instructor":"Name"}' \
  --codec=h264
```

### Cloudflare Workers (Fast)

```bash
# [DEPLOY:CLOUDFLARE] Deploy to Cloudflare
npx remotion cloudflare deploy src/index.ts
```

---

## 🐛 Troubleshooting

### Issue: Fonts not loading
**Solution**: Use system fonts or preload with `waitForFont()`

### Issue: Animation stuttering
**Solution**: Reduce `fps` to 24 or lower `quality`

### Issue: Render too slow
**Solution**: Use `--concurrency=4` to parallelize

### Issue: Memory errors
**Solution**: Increase Node memory:
```bash
NODE_OPTIONS='--max-old-space-size=8192' npx remotion render ...
```

---

## 📚 Resources

- **Remotion Docs**: https://remotion.dev/docs
- **Templates Gallery**: https://remotion.dev/showcase
- **Community Discord**: https://remotion.dev/discord

---

## 📝 License

Templates created for MENTORINGBASE internal use.
Based on Remotion (MIT License).

**Created**: 2026-01-29
**Author**: CTO Ronald + Claude Code
**Version**: 1.0.0
