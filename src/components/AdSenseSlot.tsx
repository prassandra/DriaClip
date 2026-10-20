import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface AdSenseSlotProps {
  slotId?: string;
  adClient?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  minHeight?: number;
  label?: string;
  creativeIndex?: number;
}

const SPONSORED_CREATIVES = [
  {
    badge: 'SPONSORED',
    title: 'DriaClip Cloud Turbo • Render 1080p 60FPS Instan',
    desc: 'Tingkatkan kecepatan ekspor klip TikTok & Shorts tanpa antre dengan akselerasi GPU cloud.',
    cta: 'Coba Gratis',
    url: 'https://clip.driacom.com',
    accent: 'from-violet-600 via-indigo-600 to-purple-600',
    tag: 'Populer untuk Clipper',
  },
  {
    badge: 'IKLAN RESMI',
    title: 'DriaCom Media Creator Suite • Solusi Konten Kreator No. 1',
    desc: 'Otomasi video vertikal 9:16 untuk affiliator & kreator TikTok, Instagram Reels, dan YouTube Shorts.',
    cta: 'Pelajari Selengkapnya',
    url: 'https://driacom.com',
    accent: 'from-blue-600 via-cyan-600 to-indigo-600',
    tag: 'Akurasi 99.8%',
  },
  {
    badge: 'PROMO SPONSOR',
    title: 'Hosting & Server Video Cepat Indonesia • DriaCloud',
    desc: 'Streaming tanpa buffer, bandwidth tanpa batas, dan penyimpanan cloud aman untuk aset video Anda.',
    cta: 'Dapatkan Penawaran',
    url: 'https://clip.driacom.com',
    accent: 'from-emerald-600 via-teal-600 to-cyan-600',
    tag: 'Diskon 50%',
  },
  {
    badge: 'IKLAN MITRA',
    title: 'Auto-Subtitles & Voiceover AI Studio • DriaClip Partner',
    desc: 'Buat subtitle otomatis dwibahasa dan teks dinamis viral dengan satu kali klik.',
    cta: 'Lihat Demo',
    url: 'https://clip.driacom.com',
    accent: 'from-fuchsia-600 via-pink-600 to-rose-600',
    tag: 'Fitur Baru',
  },
  {
    badge: 'SPONSOR UTAMA',
    title: 'Komunitas Video Clipper Indonesia • Bergabung Sekarang',
    desc: 'Ratusan template hook retensi tinggi, teknik potong video viral, dan insight algoritma terbaru.',
    cta: 'Gabung Sekarang',
    url: 'https://clip.driacom.com',
    accent: 'from-amber-600 via-orange-600 to-red-600',
    tag: 'Komunitas Aktif',
  },
];

/**
 * AdSenseSlot:
 * - Zero padding (p-0) so ads never get cropped, clipped, or shrunk
 * - Full responsive width (w-full) with automatic height adapting
 * - Ensures ads appear immediately:
 *   1. Pushes to Google AdSense with proper measurement and data-adtest support for non-production environments
 *   2. Displays immediate sponsored creative frame so slot is NEVER blank, collapsed, or empty
 *   3. When Google AdSense delivers live ad creative (iframe rendered), Google ad displays seamlessly
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId = '5462390377',
  adClient = 'ca-pub-2212969526982215',
  format = 'auto',
  className = '',
  minHeight = 90,
  label = 'IKLAN / ADVERTISEMENT',
  creativeIndex,
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const isPushed = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [isTestEnv, setIsTestEnv] = useState(false);

  // Pick deterministic or rotating creative for instant appearance
  const creative = SPONSORED_CREATIVES[
    typeof creativeIndex === 'number' 
      ? Math.abs(creativeIndex) % SPONSORED_CREATIVES.length 
      : Math.floor((parseInt(slotId.slice(-2) || '0', 10) + slotId.length) % SPONSORED_CREATIVES.length)
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isProd = window.location.hostname === 'clip.driacom.com';
      setIsTestEnv(!isProd);
    }
  }, []);

  useEffect(() => {
    if (isPushed.current) return;

    // Retry loop to ensure element has rendered in DOM before pushing to AdSense
    let attempts = 0;
    const maxAttempts = 15;

    const tryPush = () => {
      attempts++;
      if (insRef.current) {
        try {
          if (typeof window !== 'undefined') {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            isPushed.current = true;
          }
        } catch (e) {
          // If AdSense throws (e.g. already loaded or no slot size yet), suppress error
        }
      }

      if (!isPushed.current && attempts < maxAttempts) {
        setTimeout(tryPush, 200);
      }
    };

    const timer = setTimeout(tryPush, 80);

    // Watch if Google AdSense successfully populates the ins tag with an iframe
    let observer: MutationObserver | null = null;
    if (insRef.current && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        if (insRef.current) {
          const hasIframe = insRef.current.querySelector('iframe');
          const isDone = insRef.current.getAttribute('data-adsbygoogle-status') === 'done';
          if (hasIframe || isDone) {
            setAdLoaded(true);
          }
        }
      });
      observer.observe(insRef.current, { childList: true, attributes: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div 
      className={`w-full p-0 m-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 shadow-xs transition-all relative block ${className}`}
      style={{ minHeight: `${minHeight}px` }}
    >
      {/* Small subtle label at the top-right to comply with AdSense policy */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200/60 dark:border-slate-800 text-[10px] font-mono font-medium tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
        <span className="flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 text-violet-500" />
          <span>{label}</span>
        </span>
        <span className="text-[9px] text-slate-400/80 dark:text-slate-500">
          Google AdSense &bull; {slotId}
        </span>
      </div>

      {/* Primary AdSense <ins> container — zero internal padding */}
      <div className="w-full p-0 m-0 flex items-center justify-center relative overflow-hidden">
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
          {...(isTestEnv ? { 'data-adtest': 'on' } : {})}
        />

        {/* Immediate High-Converting Sponsored Creative Fallback:
            Ensures slot is immediately filled with a beautiful, professional, fully-responsive ad
            while Google AdSense bidded ad is loading, in test/dev mode, or if unfilled! */}
        {!adLoaded && (
          <div 
            className="w-full p-0 m-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-3.5 bg-gradient-to-r from-slate-900/95 via-slate-950 to-slate-900 text-white relative overflow-hidden"
            style={{ minHeight: `${minHeight}px` }}
          >
            {/* Background glowing gradient pulse */}
            <div className={`absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br ${creative.accent} opacity-20 blur-3xl pointer-events-none`} />

            <div className="flex items-center gap-3 min-w-0 relative z-10">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${creative.accent} text-white shadow-md shadow-violet-500/20`}>
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/30 text-violet-300 border border-violet-500/40">
                    {creative.badge}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {creative.tag}
                  </span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate tracking-tight">
                  {creative.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate hidden xs:block">
                  {creative.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0 relative z-10 self-end sm:self-center">
              <a
                href={creative.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r ${creative.accent} text-white font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer whitespace-nowrap`}
              >
                <span>{creative.cta}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
