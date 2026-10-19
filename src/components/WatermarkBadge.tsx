import React from 'react';
import { WatermarkPosition, WatermarkStyle } from '../types/driaclip';

interface WatermarkBadgeProps {
  text?: string;
  style?: WatermarkStyle | 'prestige-gold';
  position?: WatermarkPosition;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  isAbsolute?: boolean;
}

export const WatermarkBadge: React.FC<WatermarkBadgeProps> = ({
  text = 'DriaClip',
  style = 'neon-glow',
  position = 'safe-top-left',
  size = 'md',
  className = '',
  isAbsolute = false,
}) => {
  const displayText = (text || 'DriaClip').trim().slice(0, 35) || 'DriaClip';

  // Size variations with comfortable padding away from corner accent lines
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[9px] gap-1',
    sm: 'px-3 py-1.5 text-[10px] gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-1.5',
    lg: 'px-4.5 py-2 text-sm gap-2',
  }[size];

  const cornerSize = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  }[size];

  // Static Corner Accent Themes (Zero Animation, Lightweight, Distinctive HUD / Framing Corner Marks)
  let cornerBorderColor = 'border-violet-400';
  let glyphColor = 'text-violet-400';
  let badgeBg = 'bg-black/65 backdrop-blur-md text-white';

  switch (style) {
    case 'glass-blur':
      cornerBorderColor = 'border-cyan-300';
      glyphColor = 'text-cyan-300';
      badgeBg = 'bg-slate-900/50 backdrop-blur-md text-cyan-50';
      break;

    case 'gradient-accent':
      cornerBorderColor = 'border-amber-400';
      glyphColor = 'text-amber-300';
      badgeBg = 'bg-purple-950/70 backdrop-blur-md text-amber-100';
      break;

    case 'minimal-dark':
      cornerBorderColor = 'border-slate-300';
      glyphColor = 'text-slate-200';
      badgeBg = 'bg-neutral-950/80 backdrop-blur-md text-neutral-100';
      break;

    case 'neon-glow':
    default:
      cornerBorderColor = 'border-violet-400';
      glyphColor = 'text-violet-400';
      badgeBg = 'bg-black/70 backdrop-blur-md text-white';
      break;
  }

  // Safe-Zone Positioning if absolute overlay
  let positionClasses = '';
  if (isAbsolute) {
    switch (position) {
      case 'safe-top-right':
        positionClasses = 'absolute top-12 sm:top-14 right-3 sm:right-4 z-25 pointer-events-none';
        break;
      case 'center-top':
        positionClasses = 'absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-25 pointer-events-none';
        break;
      case 'safe-bottom-left':
        positionClasses = 'absolute bottom-20 left-3 sm:left-4 z-25 pointer-events-none';
        break;
      case 'safe-bottom-right':
        positionClasses = 'absolute bottom-20 right-3 sm:right-4 z-25 pointer-events-none';
        break;
      case 'safe-top-left':
      default:
        positionClasses = 'absolute top-12 sm:top-14 left-3 sm:left-4 z-25 pointer-events-none';
        break;
    }
  }

  return (
    <div className={`${positionClasses} ${className}`}>
      {/* Container with 4 Corner Accent Lines ("garis sudut" framing, no boring solid box) */}
      <div
        className={`relative inline-flex items-center font-medium tracking-wide select-none ${sizeClasses} ${badgeBg} shadow-md`}
      >
        {/* 4 Corner Lines (Garis Sudut HUD / Framing - Tanpa Animasi & Sangat Ringan) */}
        {/* Top-Left */}
        <span className={`absolute top-0 left-0 ${cornerSize} border-t-2 border-l-2 ${cornerBorderColor}`} />
        {/* Top-Right */}
        <span className={`absolute top-0 right-0 ${cornerSize} border-t-2 border-r-2 ${cornerBorderColor}`} />
        {/* Bottom-Left */}
        <span className={`absolute bottom-0 left-0 ${cornerSize} border-b-2 border-l-2 ${cornerBorderColor}`} />
        {/* Bottom-Right */}
        <span className={`absolute bottom-0 right-0 ${cornerSize} border-b-2 border-r-2 ${cornerBorderColor}`} />

        {/* Static Refined Glyph (No ping, no animation, zero overhead) */}
        <span className={`font-mono text-[10px] leading-none shrink-0 ${glyphColor} select-none mr-0.5`}>
          ✦
        </span>

        {/* Clean, Refined Typography */}
        <span className="font-mono font-semibold tracking-wider truncate max-w-[220px] leading-none drop-shadow-xs uppercase text-[10px] sm:text-[11px]">
          {displayText}
        </span>
      </div>
    </div>
  );
};
