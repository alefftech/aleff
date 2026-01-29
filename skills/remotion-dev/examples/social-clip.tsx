/**
 * MENTORINGBASE - Social Media Clip Template
 *
 * Short-form video clips optimized for Instagram, TikTok, YouTube Shorts.
 * Displays key quotes, tips, or announcements with engaging animations.
 *
 * Usage:
 *   npx remotion render src/index.ts SocialClip output.mp4 \
 *     --props='{"text":"5 dicas para dominar IA em 2026","hashtags":"#IA #Tech #MENTORINGBASE"}'
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import React from 'react';

interface SocialClipProps {
  text: string;
  hashtags?: string;
  authorName?: string;
  brandColor?: string;
}

export const SocialClip: React.FC<SocialClipProps> = ({
  text,
  hashtags = '#MENTORINGBASE',
  authorName = 'Melissa Oliveira',
  brandColor = '#16aaff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // [ANIMATION:BACKGROUND] Animated gradient background
  const gradientOffset = interpolate(
    frame,
    [0, 300],
    [0, 100],
    {
      extrapolateRight: 'wrap',
    }
  );

  // [ANIMATION:TEXT] Text entrance with bounce
  const textSpring = spring({
    frame: frame - 10, // Slight delay
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 80,
      stiffness: 150,
    },
  });

  // [ANIMATION:HASHTAGS] Hashtags slide up
  const hashtagsTranslateY = interpolate(
    frame,
    [60, 90],
    [50, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const hashtagsOpacity = interpolate(
    frame,
    [60, 90],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // [ANIMATION:LOGO] Logo pulse animation
  const logoPulse = 1 + 0.05 * Math.sin((frame / 30) * Math.PI);

  // [ANIMATION:AUTHOR] Author name fade in
  const authorOpacity = interpolate(
    frame,
    [40, 60],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg,
          #1a1a2e ${gradientOffset}%,
          ${brandColor} ${gradientOffset + 50}%,
          #1a1a2e ${gradientOffset + 100}%)`,
        backgroundSize: '200% 200%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 60,
      }}
    >
      {/* [ELEMENT:MAIN_TEXT] Main quote/tip text */}
      <div
        style={{
          color: 'white',
          fontSize: 56,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '90%',
          transform: `scale(${textSpring}) rotate(${(1 - textSpring) * -5}deg)`,
          opacity: textSpring,
          textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {text}
      </div>

      {/* [ELEMENT:AUTHOR] Author attribution */}
      <div
        style={{
          marginTop: 40,
          opacity: authorOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 15,
        }}
      >
        {/* [ELEMENT:AVATAR_PLACEHOLDER] Avatar placeholder */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: brandColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
          }}
        >
          {authorName.charAt(0)}
        </div>

        <div>
          <div
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {authorName}
          </div>
          <div
            style={{
              color: '#ccc',
              fontSize: 18,
            }}
          >
            MENTORINGBASE
          </div>
        </div>
      </div>

      {/* [ELEMENT:HASHTAGS] Social media hashtags */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: `translateX(-50%) translateY(${hashtagsTranslateY}px)`,
          opacity: hashtagsOpacity,
          color: brandColor,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 2,
          textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
        }}
      >
        {hashtags}
      </div>

      {/* [ELEMENT:LOGO_WATERMARK] Brand watermark with pulse */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          color: 'white',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 3,
          opacity: 0.8,
          transform: `scale(${logoPulse})`,
          textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        MENTORINGBASE
      </div>

      {/* [ELEMENT:CTA] Call-to-action at the end */}
      {frame > 120 && (
        <div
          style={{
            position: 'absolute',
            bottom: 150,
            color: 'white',
            fontSize: 22,
            fontWeight: 500,
            textAlign: 'center',
            opacity: interpolate(frame, [120, 140], [0, 1]),
          }}
        >
          👉 Aprenda mais em mentoringbase.com.br
        </div>
      )}
    </AbsoluteFill>
  );
};

// [CONFIG] Composition configuration for vertical format (9:16)
export const socialClipConfig = {
  id: 'SocialClip',
  component: SocialClip,
  durationInFrames: 180, // 6 seconds at 30fps
  fps: 30,
  width: 1080, // Vertical format for Instagram/TikTok
  height: 1920,
  defaultProps: {
    text: '5 dicas para dominar IA em 2026',
    hashtags: '#IA #Tech #MENTORINGBASE',
    authorName: 'Melissa Oliveira',
    brandColor: '#16aaff',
  },
};
