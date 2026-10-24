import React, { useEffect, useRef, useState } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';

interface AdSenseSlotProps {
  slotId?: string;
  adClient?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  fullWidthResponsive?: boolean;
  minHeight?: number;
  label?: string;
}

/**
 * AdSenseSlot:
 * - Direct Google AdSense Official Integration (<ins class="adsbygoogle">)
 * - Persistent DOM mounting: Never returns null or display:none so ad slots remain visible & crawlers can fill them
 * - Responsive: data-full-width-responsive="false" prevents mobile text cut-off caused by negative margin bleeding
 * - Dark mode theme integration: Transparent container with subtle dashed frame prevents jarring white flashes
 * - Live detection: Gracefully presents live Google creative when filled, and styled reserved space when waiting
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '5462390377',
  adClient = 'ca-pub-2212969526982215',
  format = 'auto',
  className = '',
  fullWidthResponsive = false,
  minHeight,
  label = 'Iklan Sponsor',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [isFilled, setIsFilled] = useState(false);
  const isPushed = useRef(false);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    // Check if Google already filled it
    const checkFilledState = () => {
      const status = el.getAttribute('data-ad-status');
      const hasIframe = !!el.querySelector('iframe');
      if (status === 'filled' || (hasIframe && el.clientHeight > 30)) {
        setIsFilled(true);
      }
    };

    checkFilledState();

    // Listen for Google AdSense rendering mutations
    const observer = new MutationObserver(() => {
      checkFilledState();
    });

    observer.observe(el, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status', 'style'],
    });

    // Safely request ad fill from Google AdSense queue
    const pushTimer = setTimeout(() => {
      if (isPushed.current) return;
      if (!el || el.getAttribute('data-adsbygoogle-status')) return;

      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        }
      } catch (err) {
        // Tag already initialized or handled by AdSense script
      }
    }, 80);

    return () => {
      observer.disconnect();
      clearTimeout(pushTimer);
    };
  }, []);

  const defaultMinHeight = format === 'rectangle' ? 250 : 90;
  const resolvedMinHeight = minHeight ?? defaultMinHeight;

  return (
    <div
      ref={containerRef}
      className={`adsense-wrapper w-full max-w-full my-4 mx-auto overflow-hidden transition-all duration-300 ${className}`}
    >
      <div
        className={`relative w-full rounded-2xl transition-all duration-200 ${
          isFilled
            ? 'p-0 bg-transparent border-0'
            : 'border border-dashed border-slate-300/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 p-3 sm:p-4 text-center'
        }`}
      >
        {/* Ad Header Label - Shows when creative is pending or fallback */}
        {!isFilled && (
          <div className="flex items-center justify-between gap-2 px-1 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
            <span className="flex items-center gap-1.5">
              <Megaphone className="h-3 w-3 text-violet-500 dark:text-violet-400" />
              <span>{label}</span>
            </span>
            <span className="font-mono text-[9px] text-slate-400/80 dark:text-slate-600">
              clip.driacom.com
            </span>
          </div>
        )}

        {/* AdSense Live Element Container: strictly centered and responsive */}
        <div className="w-full flex justify-center items-center overflow-hidden">
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '100%',
              minHeight: `${resolvedMinHeight}px`,
              backgroundColor: 'transparent',
              margin: '0 auto',
              textAlign: 'center',
            }}
            data-ad-client={adClient}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
          />
        </div>

        {/* Informational Subtitle when waiting for live creative fill */}
        {!isFilled && (
          <div className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500/70" />
              <span>Slot Iklan Resmi Google AdSense #{slotId}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

