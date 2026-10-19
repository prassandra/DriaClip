import React, { useEffect, useRef, useState } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  adClient?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  layoutKey?: string;
  className?: string;
  label?: string;
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '1029384756',
  adClient = 'ca-pub-9923812837192837',
  format = 'auto',
  layoutKey,
  className = '',
  label = 'Iklan oleh Google',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushed = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Only execute if not already pushed for this instance
    if (!isPushed.current) {
      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
          setAdLoaded(true);
        }
      } catch (e) {
        // Suppress benign AdSense re-push warnings in development/testing
        // console.debug('[AdSense] Slot ready:', e);
      }
    }
  }, []);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-slate-50/90 via-slate-100/60 to-slate-50/90 dark:from-slate-900/90 dark:via-[#0c1222]/90 dark:to-slate-900/90 p-3 sm:p-4 shadow-sm backdrop-blur-md transition-all flex flex-col justify-between ${className}`}
    >
      {/* Top Header Badge — Required by Google AdSense Policies */}
      <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-2 mb-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase select-none">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.8 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-6h2v6zm0-8h-2V7h2v1z"/>
          </svg>
          <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        </span>
        <span className="text-[9px] text-violet-500 dark:text-violet-400 font-semibold lowercase">
          clip.driacom.com
        </span>
      </div>

      {/* Main Google AdSense Tag Container */}
      <div className="relative min-h-[140px] sm:min-h-[180px] w-full flex items-center justify-center overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%', textAlign: 'center' }}
          data-ad-client={adClient}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />

        {/* Fallback & Preview Badge when live ads are loading or pending domain activation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none select-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 mb-2 border border-blue-500/20">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Slot Iklan Google AdSense
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[240px] leading-snug">
            Siap tayang di subdomain <strong className="text-violet-600 dark:text-violet-400 font-semibold">clip.driacom.com</strong>
          </p>
          <span className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-700/60">
            Responsive In-Feed Ad Unit
          </span>
        </div>
      </div>

      {/* Subtle Bottom Note */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono">
        <span>Unit #{slotId.slice(-4)}</span>
        <span>AdSense Certified</span>
      </div>
    </div>
  );
};
