'use client';

/**
 * StockFootageScene — renders a Pexels video clip full-bleed with optional
 * text overlay. Uses Remotion's <Video> component for native playback.
 *
 * Note: This scene imports from 'remotion' directly (unlike other scenes
 * which are pure React). It only works inside a Remotion Player context.
 */

import { OffthreadVideo, useCurrentFrame } from 'remotion';
import { spring, easeOutCubic, easeOutExpo } from '../useVideoPlayback';
import { KineticText } from '../primitives/KineticText';
import type { BaseSceneProps } from '../configs/types';

interface StockFootageSceneProps extends BaseSceneProps {
  videoUrl: string;
  overlayText?: string;
  overlayPosition?: 'center' | 'bottom';
  accentColor: string;
  dimAmount?: number;
}

export function StockFootageScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  videoUrl,
  overlayText,
  overlayPosition = 'bottom',
  accentColor,
  dimAmount = 0.4,
}: StockFootageSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const fadeIn = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 12, easing: easeOutExpo });
  const textProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 20, easing: easeOutCubic });

  // Slow zoom effect on the video (Ken Burns style)
  const zoomScale = 1 + sceneFrame / fps * 0.008; // ~0.8% per second

  const hasVideo = videoUrl && videoUrl.length > 0;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ opacity: fadeIn }}>
      {/* Video layer */}
      {hasVideo ? (
        <div
          className="absolute inset-0"
          style={{ transform: `scale(${zoomScale})` }}
        >
          <OffthreadVideo
            src={videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            muted
            startFrom={0}
          />
        </div>
      ) : (
        /* Fallback: dark atmospheric background when no video available */
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${accentColor}15 0%, rgba(2,6,23,1) 70%)`,
          }}
        />
      )}

      {/* Dim overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: overlayPosition === 'center'
            ? `rgba(0,0,0,${dimAmount})`
            : `linear-gradient(to top, rgba(0,0,0,${dimAmount + 0.3}) 0%, rgba(0,0,0,${dimAmount * 0.5}) 40%, rgba(0,0,0,${dimAmount * 0.3}) 100%)`,
        }}
      />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Overlay text */}
      {overlayText && (
        <div
          className={`absolute left-0 right-0 z-10 flex items-center justify-center px-8 ${
            overlayPosition === 'center'
              ? 'inset-0'
              : isMobile
                ? 'bottom-20'
                : 'bottom-16'
          }`}
          style={{
            opacity: textProgress,
            transform: `translateY(${(1 - textProgress) * 15}px)`,
          }}
        >
          <div className="text-center max-w-2xl">
            <KineticText
              text={overlayText}
              mode="word-cascade"
              frame={sceneFrame}
              fps={fps}
              startFrame={10}
              accentColor={accentColor}
              className={`
                font-bold leading-tight text-white drop-shadow-lg
                ${isMobile ? 'text-2xl' : 'text-[2.5rem]'}
              `}
            />

            {/* Accent line under text */}
            <div
              className="mx-auto mt-4 overflow-hidden"
              style={{ width: isMobile ? 110 : 170, height: 2 }}
            >
              <div
                style={{
                  width: `${textProgress * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                  boxShadow: `0 0 15px ${accentColor}80`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subtle scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.01) 2px,
            rgba(255,255,255,0.01) 4px
          )`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}
