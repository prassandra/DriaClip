import React, { useEffect, useRef } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  adClient?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  minHeight?: number;
  label?: string;
  creativeIndex?: number;
}

/**
 * AdSenseSlot:
 * - Zero padding (p-0) so the slot has maximum available dimensions
 * - Zero dummy text or placeholder labels
 * - Standard high-CTR dimensions (defaults to minHeight 280px for in-content, or 100px for banners)
 *   so AdSense responsive algorithms can serve standard sizes (300x250, 336x280, 728x90, etc.)
 * - Reliable adsbygoogle push initialization
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '5462390377',
  adClient = 'ca-pub-2212969526982215',
  format = 'auto',
  className = '',
  minHeight = 280,
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const isPushed = useRef(false);

  useEffect(() => {
    if (isPushed.current) return;

    const pushAd = () => {
      if (!insRef.current) return;
      if (insRef.current.getAttribute('data-adsbygoogle-status')) return;

      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        }
      } catch (err) {
        console.warn('AdSense push notice:', err);
      }
    };

    // Small delay ensures container layout is computed before AdSense measures dimensions
    const timer = setTimeout(pushAd, 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`w-full p-0 m-0 overflow-hidden block ${className}`}
      style={{ minHeight: `${minHeight}px`, width: '100%' }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minHeight: `${minHeight}px`,
          margin: 0,
          padding: 0,
        }}
        data-ad-client={adClient}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
