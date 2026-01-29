/**
 * MENTORINGBASE - Progress Tracker Template
 *
 * Animated progress bar for course completion visualization.
 * Shows student progress with smooth animations and percentage display.
 *
 * Usage:
 *   npx remotion render src/index.ts ProgressTracker output.mp4 \
 *     --props='{"studentName":"João Silva","courseName":"IA Avançada","completion":75}'
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import React from 'react';

interface ProgressTrackerProps {
  studentName: string;
  courseName: string;
  completion: number; // 0-100
  brandColor?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  studentName,
  courseName,
  completion,
  brandColor = '#4caf50', // Success green
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // [ANIMATION:PROGRESS] Smooth progress bar animation
  const animatedProgress = interpolate(
    frame,
    [0, durationInFrames - 30], // Animate to 30 frames before end
    [0, completion],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // [ANIMATION:PERCENTAGE] Count up animation for percentage text
  const displayedPercentage = Math.floor(animatedProgress);

  // [ANIMATION:BADGE] Badge scale animation when reaching milestones
  const isMilestone = displayedPercentage >= 25 && displayedPercentage % 25 === 0;
  const badgeScale = isMilestone && frame % 20 < 10 ? 1.1 : 1.0;

  // [ANIMATION:GLOW] Glow effect for progress bar
  const glowIntensity = interpolate(
    frame % 60, // Cycle every 60 frames (2 seconds)
    [0, 30, 60],
    [0.5, 1, 0.5]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 80,
      }}
    >
      {/* [ELEMENT:HEADER] Student and course info */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#1a1a2e',
            marginBottom: 10,
          }}
        >
          {studentName}
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#666',
          }}
        >
          {courseName}
        </div>
      </div>

      {/* [ELEMENT:PROGRESS_CONTAINER] Progress bar container */}
      <div
        style={{
          width: '80%',
          maxWidth: 1000,
          backgroundColor: '#ddd',
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          height: 60,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* [ELEMENT:PROGRESS_BAR] Animated progress bar */}
        <div
          style={{
            width: `${animatedProgress}%`,
            height: '100%',
            backgroundColor: brandColor,
            transition: 'width 0.3s ease-out',
            boxShadow: `0 0 ${20 * glowIntensity}px ${brandColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 20,
          }}
        >
          {/* [ELEMENT:PERCENTAGE_TEXT] Percentage display inside bar */}
          {animatedProgress > 15 && (
            <div
              style={{
                color: 'white',
                fontSize: 32,
                fontWeight: 'bold',
              }}
            >
              {displayedPercentage}%
            </div>
          )}
        </div>

        {/* [ELEMENT:PERCENTAGE_OUTSIDE] Percentage display outside bar when too small */}
        {animatedProgress <= 15 && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(animatedProgress + 5, 10)}%`,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#333',
              fontSize: 32,
              fontWeight: 'bold',
            }}
          >
            {displayedPercentage}%
          </div>
        )}
      </div>

      {/* [ELEMENT:MILESTONE_BADGES] Achievement badges for milestones */}
      <div
        style={{
          display: 'flex',
          gap: 30,
          marginTop: 60,
          justifyContent: 'center',
        }}
      >
        {[25, 50, 75, 100].map((milestone) => {
          const isUnlocked = displayedPercentage >= milestone;
          return (
            <div
              key={milestone}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: isUnlocked ? brandColor : '#ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 'bold',
                color: 'white',
                transform: `scale(${isUnlocked && milestone === displayedPercentage ? badgeScale : 1})`,
                transition: 'all 0.3s ease',
                boxShadow: isUnlocked ? `0 4px 12px ${brandColor}` : 'none',
              }}
            >
              {milestone}%
            </div>
          );
        })}
      </div>

      {/* [ELEMENT:STATUS_TEXT] Completion status message */}
      <div
        style={{
          marginTop: 40,
          fontSize: 24,
          color: '#666',
          textAlign: 'center',
        }}
      >
        {displayedPercentage < 25 && '🚀 Começando a jornada...'}
        {displayedPercentage >= 25 && displayedPercentage < 50 && '💪 Progredindo bem!'}
        {displayedPercentage >= 50 && displayedPercentage < 75 && '⭐ Metade do caminho!'}
        {displayedPercentage >= 75 && displayedPercentage < 100 && '🔥 Quase lá!'}
        {displayedPercentage === 100 && '🎉 Curso completo! Parabéns!'}
      </div>
    </AbsoluteFill>
  );
};

// [CONFIG] Composition configuration
export const progressTrackerConfig = {
  id: 'ProgressTracker',
  component: ProgressTracker,
  durationInFrames: 180, // 6 seconds at 30fps
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: {
    studentName: 'João Silva',
    courseName: 'Introdução à IA',
    completion: 75,
    brandColor: '#4caf50',
  },
};
