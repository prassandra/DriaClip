import React from 'react';

interface DriaClipLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DRIA_CLIP_ICON_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="driaclip-grad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="driaclip-accent" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#c7d2fe" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="56" height="56" rx="16" fill="#09090b" stroke="url(#driaclip-grad)" stroke-width="2.5" />
  <circle cx="14" cy="11" r="1.75" fill="#64748b" />
  <circle cx="23" cy="11" r="1.75" fill="#64748b" />
  <circle cx="32" cy="11" r="1.75" fill="#64748b" />
  <circle cx="41" cy="11" r="1.75" fill="#64748b" />
  <circle cx="50" cy="11" r="1.75" fill="#64748b" />
  <circle cx="14" cy="53" r="1.75" fill="#64748b" />
  <circle cx="23" cy="53" r="1.75" fill="#64748b" />
  <circle cx="32" cy="53" r="1.75" fill="#64748b" />
  <circle cx="41" cy="53" r="1.75" fill="#64748b" />
  <circle cx="50" cy="53" r="1.75" fill="#64748b" />
  <path d="M22 18L38 32L22 46V18Z" fill="url(#driaclip-grad)" />
  <path d="M34 20L46 32L34 44" stroke="url(#driaclip-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="16" y1="32" x2="48" y2="32" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.8" />
</svg>`;

export const DRIA_CLIP_FULL_LOGO_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 56" fill="none">
  <defs>
    <linearGradient id="driaclip-full-grad" x1="4" y1="4" x2="52" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <!-- Icon Mark -->
  <rect x="2" y="4" width="48" height="48" rx="14" fill="#09090b" stroke="url(#driaclip-full-grad)" stroke-width="2.5" />
  <path d="M18 16L32 28L18 40V16Z" fill="url(#driaclip-full-grad)" />
  <path d="M28 18L38 28L28 38" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="14" y1="28" x2="40" y2="28" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="2 2" />
  
  <!-- Typography -->
  <text x="60" y="32" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="24" font-weight="800" fill="#8b5cf6" letter-spacing="-0.5">Dria<tspan fill="#06b6d4">Clip</tspan></text>
  <text x="61" y="46" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" fill="#a78bfa" letter-spacing="1.5">BY DRIACOM</text>
</svg>`;

export const DriaClipLogo: React.FC<DriaClipLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'h-7 w-7', full: 'h-8' },
    md: { icon: 'h-9 w-9', full: 'h-9' },
    lg: { icon: 'h-11 w-11', full: 'h-11' },
    xl: { icon: 'h-14 w-14', full: 'h-14' },
  };

  if (variant === 'icon') {
    return (
      <div className={`relative shrink-0 flex items-center justify-center rounded-xl bg-neutral-900 border border-violet-500/30 shadow-md ${sizeMap[size].icon} ${className}`}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full p-1">
          <defs>
            <linearGradient id="driaclip-grad-inline" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="driaclip-accent-inline" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#09090b" stroke="url(#driaclip-grad-inline)" strokeWidth="2.5" />
          <circle cx="14" cy="11" r="1.75" fill="#64748b" />
          <circle cx="23" cy="11" r="1.75" fill="#64748b" />
          <circle cx="32" cy="11" r="1.75" fill="#64748b" />
          <circle cx="41" cy="11" r="1.75" fill="#64748b" />
          <circle cx="50" cy="11" r="1.75" fill="#64748b" />
          <circle cx="14" cy="53" r="1.75" fill="#64748b" />
          <circle cx="23" cy="53" r="1.75" fill="#64748b" />
          <circle cx="32" cy="53" r="1.75" fill="#64748b" />
          <circle cx="41" cy="53" r="1.75" fill="#64748b" />
          <circle cx="50" cy="53" r="1.75" fill="#64748b" />
          <path d="M22 18L38 32L22 46V18Z" fill="url(#driaclip-grad-inline)" />
          <path d="M34 20L46 32L34 44" stroke="url(#driaclip-accent-inline)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="32" x2="48" y2="32" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative shrink-0 flex items-center justify-center rounded-xl bg-neutral-900 border border-violet-500/40 shadow-sm ${sizeMap[size].icon}`}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full p-1">
          <defs>
            <linearGradient id="driaclip-grad-logo" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="driaclip-accent-logo" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#09090b" stroke="url(#driaclip-grad-logo)" strokeWidth="2.5" />
          <circle cx="14" cy="11" r="1.75" fill="#64748b" />
          <circle cx="23" cy="11" r="1.75" fill="#64748b" />
          <circle cx="32" cy="11" r="1.75" fill="#64748b" />
          <circle cx="41" cy="11" r="1.75" fill="#64748b" />
          <circle cx="50" cy="11" r="1.75" fill="#64748b" />
          <circle cx="14" cy="53" r="1.75" fill="#64748b" />
          <circle cx="23" cy="53" r="1.75" fill="#64748b" />
          <circle cx="32" cy="53" r="1.75" fill="#64748b" />
          <circle cx="41" cy="53" r="1.75" fill="#64748b" />
          <circle cx="50" cy="53" r="1.75" fill="#64748b" />
          <path d="M22 18L38 32L22 46V18Z" fill="url(#driaclip-grad-logo)" />
          <path d="M34 20L46 32L34 44" stroke="url(#driaclip-accent-logo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="32" x2="48" y2="32" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="text-xl font-extrabold tracking-tight leading-none flex items-center">
          <span className="text-black dark:text-white transition-colors">Dria</span>
          <span className="text-violet-600 dark:text-violet-400">Clip</span>
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mt-1 leading-none font-mono">
          by Driacom
        </span>
      </div>
    </div>
  );
};
