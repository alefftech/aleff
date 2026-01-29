---
name: remotion-dev
description: Create videos programmatically using Remotion (React-based video framework). Best practices for composition, rendering, and deployment.
metadata: {"moltbot":{"emoji":"🎬","requires":{"bins":["npx"]}}}
---

# Remotion Video Creation

Remotion lets you create videos programmatically using React. Use this skill when building video content, animations, or dynamic video generation for MENTORINGBASE or marketing.

## Quick Start

### Install Remotion (project-local)
```bash
npm install remotion @remotion/cli
```

### Create Basic Composition
```jsx
// src/Video.jsx
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = Math.min(1, frame / 30);

  return (
    <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ opacity }}>
        Frame {frame} - {(frame / fps).toFixed(2)}s
      </h1>
    </div>
  );
};
```

### Register Composition
```jsx
// src/Root.jsx
import { Composition } from 'remotion';
import { MyVideo } from './Video';

export const RemotionRoot = () => {
  return (
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

## Common Patterns

### Text Animation
```jsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const scale = spring({
  frame,
  fps,
  from: 0,
  to: 1,
  config: { damping: 100, stiffness: 200 }
});
```

### Image Sequences
```jsx
import { Img, staticFile } from 'remotion';

<Img src={staticFile(`frame-${frame}.png`)} />
```

### Audio Sync
```jsx
import { Audio, useCurrentFrame } from 'remotion';

<Audio src={staticFile('audio.mp3')} />
```

## Rendering

### Preview (Development)
```bash
npx remotion preview src/index.ts
```

### Render Video
```bash
# Single video
npx remotion render src/index.ts MyVideo output.mp4

# Custom quality
npx remotion render src/index.ts MyVideo output.mp4 --quality 90

# Specific frame range
npx remotion render src/index.ts MyVideo output.mp4 --frames=0-100
```

### Lambda Rendering (Production)
```bash
# Deploy function
npx remotion lambda sites create src/index.ts --site-name=my-site

# Render on Lambda
npx remotion lambda render my-site MyVideo --codec=h264
```

## MENTORINGBASE Use Cases

### Course Intro Video
```jsx
export const CourseIntro = ({ title, instructor }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      <div style={{
        color: 'white',
        fontSize: 60,
        textAlign: 'center',
        marginTop: frame > 30 ? 200 : 1000,
        transition: 'all 0.5s'
      }}>
        {title}
      </div>
      <div style={{ color: '#16aaff', fontSize: 30, marginTop: 20 }}>
        Com {instructor}
      </div>
    </AbsoluteFill>
  );
};
```

### Progress Tracker
```jsx
export const ProgressBar = ({ completion }) => {
  const frame = useCurrentFrame();
  const progress = Math.min(completion, (frame / 120) * 100);

  return (
    <div style={{ width: '80%', height: 40, backgroundColor: '#ddd' }}>
      <div style={{
        width: `${progress}%`,
        height: '100%',
        backgroundColor: '#4caf50'
      }} />
    </div>
  );
};
```

### Social Media Clip
```jsx
export const SocialClip = ({ text, logo }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#fff' }}>
      <Img src={staticFile(logo)} style={{ width: 200 }} />
      <h2 style={{ fontSize: 40, maxWidth: 800 }}>{text}</h2>
    </AbsoluteFill>
  );
};
```

## Best Practices

### Performance
- Use `continueRender()` / `delayRender()` for async operations
- Minimize re-renders with `useMemo()`
- Preload assets during build

### Code Organization
```
src/
├── compositions/
│   ├── Intro.jsx
│   ├── MainContent.jsx
│   └── Outro.jsx
├── components/
│   ├── AnimatedText.jsx
│   └── ProgressBar.jsx
├── assets/
│   ├── images/
│   ├── audio/
│   └── fonts/
└── Root.jsx
```

### TypeScript Support
```tsx
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';

export const myCompSchema = z.object({
  titleText: z.string(),
  titleColor: zColor(),
  logoSrc: z.string(),
});
```

## Common Issues

### Audio Sync Drift
```jsx
// Use offsetInFrames to sync
<Audio src={audio} offsetInFrames={-5} />
```

### Memory Issues (Large Renders)
```bash
# Increase memory
NODE_OPTIONS='--max-old-space-size=8192' npx remotion render
```

### Font Loading
```jsx
import { continueRender, delayRender } from 'remotion';
import { useEffect } from 'react';

const handle = delayRender();
useEffect(() => {
  document.fonts.ready.then(() => continueRender(handle));
}, []);
```

## Integration with Aleff

### Auto-generate Course Videos
```bash
# Template: course intro based on Supabase data
npx remotion render src/index.ts CourseIntro output.mp4 \
  --props='{"title":"Curso de AI","instructor":"Melissa"}'
```

### Batch Processing
```bash
# Generate multiple videos from JSON
cat courses.json | jq -r '.[] | @json' | while read course; do
  npx remotion render src/index.ts CourseIntro \
    "output-$(echo $course | jq -r .id).mp4" \
    --props="$course"
done
```

## Resources

- Docs: https://remotion.dev/docs
- Examples: https://remotion.dev/showcase
- Templates: https://github.com/remotion-dev/template-*

## When NOT to Use Remotion

- Simple screen recordings → Use OBS/Loom
- Live streaming → Use RTMP tools
- Video editing of existing footage → Use FFmpeg/DaVinci

Use Remotion when you need:
- Programmatic video generation
- Data-driven animations
- Consistent branding across videos
- Dynamic content from APIs/databases
