import React, { useEffect, useRef } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  adClient?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
}

/**
 * AdSenseSlot:
 * - Extremely lightweight responsive slot
 * - Zero padding, zero margin constraint, zero overflow-hidden to avoid ad clipping
 * - JavaScript SDK is loaded once globally in index.html
 * - Only pushes to (window.adsbygoogle) on mount
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '5462390377',
  adClient = 'ca-pub-2212969526982215',
  format = 'auto',
  className = '',
}) => {
  const isPushed = useRef(false);

  useEffect(() => {
    if (!isPushed.current) {
      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        }
      } catch (e) {
        // Suppress benign AdSense notices
      }
    }
  }, []);

  return (
    <div className={`w-full p-0 m-0 overflow-visible text-center clear-both block ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={adClient}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
