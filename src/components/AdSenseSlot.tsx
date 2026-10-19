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
  slotId = '5462390377',
  adClient = 'ca-pub-2212969526982215',
  format = 'auto',
  layoutKey,
  className = '',
  label = 'Iklan oleh Google',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushed = useRef(false);
  const [isFilled, setIsFilled] = useState(false);

  useEffect(() => {
    // Only execute if not already pushed for this instance
    if (!isPushed.current) {
      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        }
      } catch (e) {
        // Suppress benign AdSense warnings
      }
    }

    const checkFilled = () => {
      if (adRef.current) {
        if (
          adRef.current.getAttribute('data-ad-status') === 'filled' ||
          adRef.current.innerHTML.trim().length > 0 ||
          adRef.current.children.length > 0
        ) {
          setIsFilled(true);
        }
      }
    };

    const timer = setTimeout(checkFilled, 1000);
    const interval = setInterval(checkFilled, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`w-full overflow-visible text-center clear-both p-0 transition-all ${className}`}
    >
      {/* Subtle Header Label per Google AdSense Policies */}
      <div className="flex items-center justify-center gap-1.5 pb-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase select-none">
        <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.8 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-6h2v6zm0-8h-2V7h2v1z"/>
        </svg>
        <span>{label}</span>
      </div>

      {/* Main Google AdSense Tag Container - Zero padding, zero overflow-hidden, 100% responsive */}
      <div className="w-full overflow-visible flex items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={adClient}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />
      </div>

      {/* Subtle indicator shown only when ad is pending/not filled yet */}
      {!isFilled && (
        <div className="w-full py-4 px-2 my-1 rounded-xl border border-dashed border-slate-300/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-center select-none">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Slot Iklan Google AdSense #{slotId} (Responsive)
          </p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
            Ukuran responsif otomatis penuh &bull; clip.driacom.com
          </p>
        </div>
      )}
    </div>
  );
};
