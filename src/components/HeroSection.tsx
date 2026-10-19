import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Scissors, 
  Film, 
  Cpu, 
  Layers, 
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { Language } from '../i18n/translations';

interface HeroSectionProps {
  lang: Language;
  onStartClipping: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  lang,
  onStartClipping,
}) => {
  const isId = lang === 'id';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:via-[#0f172a]/95 dark:to-[#0b0f19] p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50 dark:shadow-violet-500/5 backdrop-blur-xl transition-all">
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-violet-500/10 dark:bg-violet-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Top High-Tech Trust Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 dark:bg-violet-600 text-white px-4 py-1.5 text-xs font-black shadow-md shadow-violet-500/25 tracking-wide leading-none">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>{isId ? 'CLIP VIDEO SECARA GRATIS COCOK UNTUK PARA CLIPPER' : 'FREE VIDEO CLIPPER FOR SHORT-FORM CREATORS'}</span>
          </div>

          <div className="inline-flex items-center justify-center gap-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 px-3 py-1 text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 font-mono leading-none">
            <Zap className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
            <span>clip.driacom.com</span>
          </div>

          <div className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 font-mono leading-none">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>{isId ? '100% Gratis • Tanpa Watermark Paksa' : '100% Free • No Forced Watermark'}</span>
          </div>
        </div>

        {/* Huge Keyword-Rich Hero Title */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
            {isId ? (
              <>
                <span className="block text-slate-900 dark:text-white">
                  Clip Video Secara Gratis
                </span>
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Cocok untuk Para Clipper
                </span>
              </>
            ) : (
              <>
                <span className="block text-slate-900 dark:text-white">
                  Free Video Clipper Tool
                </span>
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Automated 9:16 Shorts & Reels Maker
                </span>
              </>
            )}
          </h1>

          {/* Keyword Rich Sub-Heading */}
          <p className="text-base sm:text-lg lg:text-xl font-medium text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
            {isId ? (
              <>
                Platform pemotong video online gratis di <strong className="text-violet-700 dark:text-violet-300 font-bold">clip.driacom.com</strong>. Ubah rekaman video panjang dari <strong className="text-violet-700 dark:text-violet-300 font-bold">berkas penyimpanan (MP4, WebM, MOV, MKV)</strong> menjadi puluhan video vertikal <strong className="text-cyan-700 dark:text-cyan-300 font-bold">9:16 otomatis</strong> untuk TikTok, Instagram Reels, dan YouTube Shorts dengan crop presisi dan siap unduh.
              </>
            ) : (
              <>
                Free online video clipping platform on <strong className="text-violet-700 dark:text-violet-300 font-bold">clip.driacom.com</strong>. Transform long-form footage from <strong className="text-violet-700 dark:text-violet-300 font-bold">your device storage files (MP4, WebM, MOV, MKV)</strong> into dozens of viral <strong className="text-cyan-700 dark:text-cyan-300 font-bold">9:16 vertical shorts</strong> for TikTok, Reels, and Shorts.
              </>
            )}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                {isId ? 'Reframing 9:16' : '9:16 Reframing'}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {isId ? 'Kanvas Buram Otomatis' : 'Smart Blur Canvas'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                {isId ? 'Otomatis Durasi' : 'Auto Duration'}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {isId ? 'Deteksi Otomatis Cepat' : 'Zero Confirm Prompt'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Film className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                {isId ? 'Berkas Storage s/d 2GB' : 'Storage Files up to 2GB'}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {isId ? 'Pratinjau Playback Aktif' : 'Live Player Preview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                {isId ? 'Resolusi 1080p - 360p' : '1080p - 360p Quality'}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {isId ? 'Ekspor Sesuai Pilihan' : 'Full Custom Output'}
              </span>
            </div>
          </div>
        </div>

        {/* Action CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onStartClipping}
            className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Scissors className="h-4 w-4" />
            <span>{isId ? 'Mulai Potong & Buat Klip Video' : 'Start Clipping Video Now'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Technology Telemetry Bar */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{isId ? 'Buffer Stream Siap' : 'Stream Buffer Ready'}</span>
            </span>
            <span>&middot;</span>
            <span>{isId ? 'Resolusi:' : 'Resolution:'} <strong>1080p, 720p, 480p, 360p</strong></span>
            <span className="hidden sm:inline">&middot;</span>
            <span className="hidden sm:inline">Engine: <strong>WASM + HLS/yt-dlp Pipeline</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span><span className="text-black dark:text-white">dria</span>Clip by Driacom</span>
          </div>
        </div>
      </div>
    </div>
  );
};
