import React, { useEffect, useRef, useState } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  adClient?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  fullWidthResponsive?: boolean;
}

/**
 * AdSenseSlot:
 * - Direct Google AdSense Official Integration (<ins class="adsbygoogle">)
 * - data-full-width-responsive="false" prevents mobile text cut-off caused by negative margins
 * - Transparent background prevents flashing white boxes in dark mode
 * - Automatic collapse (display: none; height: 0) on unfilled status so empty slots never leave blank space
 * - Fully responsive width, centered within container
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '5462390377',
  adClient = 'ca-pub-2212969526982215',
  format = 'auto',
  className = '',
  fullWidthResponsive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [isUnfilled, setIsUnfilled] = useState(false);
  const isPushed = useRef(false);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    // Check if Google has already flagged it as unfilled
    if (el.getAttribute('data-ad-status') === 'unfilled') {
      setIsUnfilled(true);
      return;
    }

    // MutationObserver to listen for Google AdSense status changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const adStatus = el.getAttribute('data-ad-status');
          if (adStatus === 'unfilled') {
            setIsUnfilled(true);
            if (containerRef.current) {
              containerRef.current.style.display = 'none';
            }
          }
        }
      }
    });

    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'style', 'data-adsbygoogle-status'],
    });

    // Safely request ad fill
    const pushTimer = setTimeout(() => {
      if (isPushed.current) return;
      if (!el || el.getAttribute('data-adsbygoogle-status')) return;

      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        }
      } catch (err) {
        // Tag already initialized or suppressed
      }
    }, 60);

    // Timeout check: if unfilled or empty after response, collapse cleanly
    const checkTimer = setTimeout(() => {
      if (el) {
        const adStatus = el.getAttribute('data-ad-status');
        const doneStatus = el.getAttribute('data-adsbygoogle-status');
        if (adStatus === 'unfilled' || (doneStatus === 'done' && el.clientHeight === 0)) {
          setIsUnfilled(true);
          if (containerRef.current) {
            containerRef.current.style.display = 'none';
          }
        }
      }
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(pushTimer);
      clearTimeout(checkTimer);
    };
  }, []);

  if (isUnfilled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`adsense-wrapper w-full p-0 m-0 overflow-hidden flex justify-center items-center bg-transparent transition-all duration-200 ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        backgroundColor: 'transparent',
      }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '100%',
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
  );
};
