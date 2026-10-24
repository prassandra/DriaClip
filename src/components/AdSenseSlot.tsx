import React, { useEffect, useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';

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
 * WhatsApp SVG icon matching official brand guidelines
 */
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * AdSenseSlot:
 * - Direct Google AdSense Official Integration (<ins class="adsbygoogle">)
 * - Minimum height set to standard 280px to prevent Google AdSense auction rejection or clipping
 * - Fallback Banner: Displays DriaCom advertising placeholder ("RUANG IKLAN TERSEDIA") with WhatsApp direct contact (085163518070) whenever ads are pending or unfilled
 * - Instant Live Creative Reveal: Seamlessly transitions to the live creative when Google AdSense fills the slot
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '5462390377',
  adClient = 'ca-pub-2212969526982215',
  format = 'auto',
  className = '',
  fullWidthResponsive = true,
  minHeight = 280,
  label = 'Iklan Sponsor',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [isFilled, setIsFilled] = useState(false);
  const isPushed = useRef(false);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    // Check if Google already filled the slot
    const checkFilledState = () => {
      const status = el.getAttribute('data-ad-status');
      const iframe = el.querySelector('iframe');
      if (status === 'filled' || (iframe && (iframe.clientHeight > 30 || el.clientHeight > 30))) {
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

  const resolvedMinHeight = Math.max(minHeight, 260);

  return (
    <div
      ref={containerRef}
      className={`adsense-wrapper w-full max-w-full sm:max-w-2xl lg:max-w-3xl mx-auto my-4 sm:my-6 px-2 sm:px-4 transition-all duration-300 ${className}`}
    >
      <div
        className={`relative w-full rounded-2xl transition-all duration-300 overflow-hidden flex flex-col justify-center items-center ${
          isFilled
            ? 'p-2 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-md'
            : 'px-4 py-5 sm:py-7 sm:px-8 text-center border border-indigo-100/90 dark:border-indigo-950/70 bg-gradient-to-b from-[#f8faff] via-white to-[#f5f8ff] dark:from-[#0f172a] dark:via-[#0b0f19] dark:to-[#0f172a] shadow-xs'
        }`}
        style={{
          minHeight: isFilled ? 'auto' : `${resolvedMinHeight}px`,
        }}
      >
        {/* State 1: Fallback Branded Card from DriaCom video (Active when AdSense is pending / unfilled) */}
        {!isFilled && (
          <div className="w-full flex flex-col items-center justify-center text-center py-1 sm:py-2 relative z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50/90 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/60 text-[10px] sm:text-xs font-bold tracking-wide text-indigo-600 dark:text-indigo-400 mb-2.5 sm:mb-3 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <span>RUANG IKLAN TERSEDIA</span>
            </div>

            {/* Heading */}
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1 sm:mb-1.5 tracking-tight px-2">
              Mau pasang iklan di sini?
            </h3>

            {/* Subtext */}
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4 sm:mb-5 leading-relaxed font-normal px-2">
              Hubungi kontak DriaCom untuk mempromosikan bisnis, produk, atau jasa Anda.
            </p>

            {/* WhatsApp Contact Button Only (Direct to 085163518070) */}
            <div className="flex justify-center items-center w-full">
              <a
                href="https://wa.me/6285163518070?text=Halo%20Admin%20DriaCom,%20saya%20tertarik%20untuk%20pasang%20iklan%20di%20DriaClip%20(clip.driacom.com)"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da84a] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto select-none"
                title="Hubungi Admin DriaCom via WhatsApp (085163518070)"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* State 2: Google AdSense ins container
            - If !isFilled: Positioned absolutely with full width and minHeight so Google's engine calculates non-zero dimensions and delivers creatives without error
            - If isFilled: Positioned in normal layout flow displaying the ad without any clipping or distortion */}
        <div
          className={`w-full flex flex-col justify-center items-center ${
            isFilled
              ? 'relative z-10 w-full'
              : 'absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-0'
          }`}
        >
          {isFilled && (
            <div className="w-full flex items-center justify-between px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
              <span className="flex items-center gap-1.5">
                <Megaphone className="h-3 w-3 text-violet-500" />
                <span>{label}</span>
              </span>
              <span className="font-mono text-[9px] text-slate-400 dark:text-slate-600">
                clip.driacom.com
              </span>
            </div>
          )}

          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '100%',
              minHeight: isFilled ? 'auto' : `${resolvedMinHeight}px`,
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
      </div>
    </div>
  );
};
