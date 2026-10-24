import React from 'react';
import { Sparkles, Film, Video, Scissors } from 'lucide-react';

interface ClipCardSkeletonProps {
  aspectRatio?: '9:16' | '1:1' | '16:9';
  index?: number;
}

export const ClipCardSkeleton: React.FC<ClipCardSkeletonProps> = ({
  aspectRatio = '9:16',
  index = 0,
}) => {
  const isVertical = aspectRatio === '9:16';
  const isSquare = aspectRatio === '1:1';

  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0b0f19] overflow-hidden shadow-sm transition-all">
      {/* Video Viewport Skeleton */}
      <div
        className={`relative overflow-hidden bg-slate-100 dark:bg-slate-900/90 flex items-center justify-center shimmer-skeleton ${
          isVertical ? 'aspect-[9/16]' : isSquare ? 'aspect-square' : 'aspect-video'
        }`}
      >
        {/* Top Floating Badges Placeholder */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="h-5 w-16 rounded-full bg-slate-300/80 dark:bg-slate-800/90 border border-white/20" />
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-14 rounded-full bg-slate-300/80 dark:bg-slate-800/90" />
            <div className="h-4 w-10 rounded-full bg-slate-300/80 dark:bg-slate-800/90" />
          </div>
        </div>

        {/* Center Play Button Placeholder */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-300/80 dark:bg-slate-800/90 flex items-center justify-center border border-white/20 shadow-md">
            <Video className="h-5 w-5 text-slate-400 dark:text-slate-500 animate-pulse" />
          </div>
          <div className="h-4 w-24 rounded-full bg-slate-300/70 dark:bg-slate-800/80" />
        </div>

        {/* Bottom Progress Bar Placeholder */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2.5">
          <div className="w-full h-1.5 rounded-full bg-slate-300/50 dark:bg-slate-800/60" />
        </div>
      </div>

      {/* Card Info Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#0b0f19]">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            {/* Title Skeleton */}
            <div className="h-4 rounded-md bg-slate-200 dark:bg-slate-800 shimmer-skeleton flex-1 max-w-[65%]" />
            {/* Timestamp Badge Skeleton */}
            <div className="h-4 w-20 rounded bg-violet-100/70 dark:bg-violet-950/50 shimmer-skeleton" />
          </div>
          <div className="h-3 w-1/2 rounded bg-slate-200/80 dark:bg-slate-800/60 shimmer-skeleton" />
        </div>

        {/* Frame Positioning Slider Skeleton */}
        {isVertical && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800 shimmer-skeleton" />
            <div className="flex items-center gap-1">
              <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 shimmer-skeleton" />
              <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-800 shimmer-skeleton" />
              <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 shimmer-skeleton" />
            </div>
          </div>
        )}

        {/* Bottom Actions Skeleton */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 shimmer-skeleton" />
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 shimmer-skeleton" />
            <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 shimmer-skeleton" />
            <div className="h-7 w-20 rounded-lg bg-violet-200 dark:bg-violet-900/60 shimmer-skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface TimelineWaveformSkeletonProps {
  barCount?: number;
  label?: string;
}

export const TimelineWaveformSkeleton: React.FC<TimelineWaveformSkeletonProps> = ({
  barCount = 56,
  label,
}) => {
  // Pre-calculated heights for waveform visual realism
  const heights = [
    30, 45, 60, 35, 75, 90, 65, 40, 85, 100, 70, 50, 80, 60, 40, 65,
    90, 45, 30, 55, 75, 85, 60, 40, 70, 95, 50, 35, 80, 65, 45, 90,
    100, 60, 40, 70, 85, 55, 35, 65, 80, 95, 70, 50, 40, 60, 75, 85,
    65, 45, 30, 50, 70, 85, 60, 40,
  ];

  return (
    <div className="space-y-2 pt-1 w-full">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 font-semibold text-violet-600 dark:text-violet-400">
          <Scissors className="h-3.5 w-3.5 animate-spin" />
          <span>{label || 'Menganalisis Titik Potong & Gelombang Audio...'}</span>
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
          AI Scene & Speech Waveform Detection
        </span>
      </div>

      {/* Waveform Scrubber Skeleton Box */}
      <div className="relative h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 overflow-hidden flex items-center justify-between px-3 gap-1 shimmer-skeleton">
        {Array.from({ length: barCount }).map((_, i) => {
          const height = heights[i % heights.length];
          const delay = (i % 8) * 0.12;
          return (
            <div
              key={i}
              className="flex-1 max-w-[6px] rounded-full bg-violet-400/50 dark:bg-violet-600/60 animate-waveform"
              style={{
                height: `${height}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${1.2 + (i % 4) * 0.2}s`,
              }}
            />
          );
        })}

        {/* Shimmer Overlay Playhead */}
        <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-violet-500 shadow-md">
          <div className="absolute -top-1 -left-1.5 h-3.5 w-3.5 rounded-full bg-violet-600 shadow-md border border-white" />
        </div>
      </div>
    </div>
  );
};

interface VideoPlayerSkeletonProps {
  isPortrait?: boolean;
  statusText?: string;
}

export const VideoPlayerSkeleton: React.FC<VideoPlayerSkeletonProps> = ({
  isPortrait = false,
  statusText,
}) => {
  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center shimmer-skeleton transition-all ${
        isPortrait ? 'max-w-[320px] sm:max-w-[360px] mx-auto aspect-[9/16]' : 'w-full aspect-video'
      }`}
    >
      <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-violet-600/30 border border-violet-500/40 text-violet-400 shadow-lg">
          <Film className="h-7 w-7 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white tracking-wide">
            {statusText || 'Memuat & Menyiapkan Aliran Video...'}
          </h4>
          <p className="text-[11px] text-slate-400 font-mono">
            Decoding metadata, audio waveform, and canvas frames...
          </p>
        </div>
      </div>

      {/* Bottom Floating Bar Skeleton */}
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-white/20 shimmer-skeleton" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-white/20 shimmer-skeleton" />
          <div className="h-5 w-12 rounded bg-white/20 shimmer-skeleton" />
        </div>
      </div>
    </div>
  );
};
