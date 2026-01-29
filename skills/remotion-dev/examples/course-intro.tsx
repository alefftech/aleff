/**
 * MENTORINGBASE - Course Intro Template
 *
 * Generates a professional course introduction video with:
 * - Animated title slide
 * - Instructor name
 * - Course branding
 *
 * Usage:
 *   npx remotion render src/index.ts CourseIntro output.mp4 \
 *     --props='{"title":"Curso de IA","instructor":"Melissa Oliveira"}'
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import React from 'react';

interface CourseIntroProps {
  title: string;
  instructor: string;
  logo?: string;
  brandColor?: string;
}

export const CourseIntro: React.FC<CourseIntroProps> = ({
  title,
  instructor,
  brandColor = '#16aaff', // MENTORINGBASE blue
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // [ANIMATION:TITLE] Spring animation for title entrance
  const titleSpring = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  // [ANIMATION:INSTRUCTOR] Delayed fade-in for instructor name
  const instructorOpacity = interpolate(
    frame,
    [30, 45], // Start at frame 30, fully visible at frame 45
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // [ANIMATION:LOGO] Logo fade in at the end
  const logoOpacity = interpolate(
    frame,
    [60, 75],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e', // Dark background
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* [ELEMENT:TITLE] Main course title */}
      <div
        style={{
          color: 'white',
          fontSize: 72,
          fontWeight: 'bold',
          textAlign: 'center',
          maxWidth: '80%',
          transform: `scale(${titleSpring}) translateY(${(1 - titleSpring) * 50}px)`,
          opacity: titleSpring,
        }}
      >
        {title}
      </div>

      {/* [ELEMENT:DIVIDER] Animated divider line */}
      <div
        style={{
          width: `${titleSpring * 200}px`,
          height: 4,
          backgroundColor: brandColor,
          marginTop: 30,
          marginBottom: 30,
          borderRadius: 2,
        }}
      />

      {/* [ELEMENT:INSTRUCTOR] Instructor name with badge */}
      <div
        style={{
          opacity: instructorOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 15,
        }}
      >
        <div
          style={{
            color: brandColor,
            fontSize: 36,
            fontWeight: 500,
          }}
        >
          Com {instructor}
        </div>
      </div>

      {/* [ELEMENT:LOGO] MENTORINGBASE watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 40,
          opacity: logoOpacity,
          color: '#666',
          fontSize: 18,
          fontWeight: 300,
          letterSpacing: 2,
        }}
      >
        MENTORINGBASE
      </div>
    </AbsoluteFill>
  );
};

// [CONFIG] Composition configuration
export const courseIntroConfig = {
  id: 'CourseIntro',
  component: CourseIntro,
  durationInFrames: 150, // 5 seconds at 30fps
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: {
    title: 'Introdução à Inteligência Artificial',
    instructor: 'Melissa Oliveira',
    brandColor: '#16aaff',
  },
};
