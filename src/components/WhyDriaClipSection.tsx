import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  SlidersHorizontal, 
  Layers, 
  FileVideo, 
  Lock,
  Scissors
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { AdSenseSlot } from './AdSenseSlot';

interface WhyDriaClipSectionProps {
  lang: Language;
}

export const WhyDriaClipSection: React.FC<WhyDriaClipSectionProps> = ({ lang }) => {
  const isId = lang === 'id';

  const reasons = [
    {
      icon: Lock,
      color: 'violet',
      title: isId ? 'Privasi Terjamin & Aman' : 'Guaranteed Data Privacy',
      desc: isId 
        ? 'Data video Anda diproses dengan standar keamanan tinggi dan privasi penuh tanpa dibagikan ke pihak ketiga.'
        : 'Your video content is handled with the highest data protection and privacy standards without third-party exposure.'
    },
    {
      icon: Sparkles,
      color: 'amber',
      title: isId ? 'Tanpa Watermark & Jernih' : 'Zero Watermark & Clean',
      desc: isId 
        ? 'Setiap klip yang dihasilkan 100% bersih tanpa logo, cap air, atau stempel yang mengganggu. Siap dipublikasikan langsung ke TikTok, Instagram Reels, dan Shorts.'
        : 'Every clip exported is completely clean without annoying logos or stamps. Ready to publish immediately across all your social channels.'
    },
    {
      icon: Scissors,
      color: 'cyan',
      title: isId ? 'Presisi Frame-by-Frame' : 'Frame-Accurate Precision',
      desc: isId 
        ? 'Dukungan timeline scrubber interaktif dengan akurasi milidetik. Tentukan titik potong adegan terbaik secara presisi tanpa takut momen terlewat.'
        : 'Interactive timeline scrubber with millisecond precision. Pinpoint exact moments and highlight cuts without missing any punchline or hook.'
    },
    {
      icon: FileVideo,
      color: 'emerald',
      title: isId ? 'Multi-Format & Output MP4' : 'Multi-Format Input & MP4 Output',
      desc: isId 
        ? 'Menerima berbagai macam format input (MP4, WebM, MOV, MKV, AVI, TS, 3GP) dari penyimpanan perangkat Anda, dengan output standar MP4 yang kompatibel di semua platform.'
        : 'Accepts diverse input formats (MP4, WebM, MOV, MKV, AVI, TS, 3GP) directly from your device storage, generating universal MP4 files ready for any media player.'
    },
    {
      icon: Layers,
      color: 'indigo',
      title: isId ? 'Pilihan Resolusi Lengkap' : 'Complete Resolution Choices',
      desc: isId 
        ? 'Pilih resolusi sesuai kebutuhan: 1080p Full HD untuk kualitas tajam maksimal, 720p HD seimbang, atau 480p & 360p untuk hemat kuota dan proses cepat.'
        : 'Choose your desired output quality: 1080p Full HD for maximum crispness, 720p HD balanced, or 480p & 360p for data saver and rapid export.'
    },
    {
      icon: Zap,
      color: 'rose',
      title: isId ? 'Cepat & Tanpa Antrean' : 'Ultra-Fast, Zero Queue',
      desc: isId 
        ? 'Mengoptimalkan kemampuan akselerasi perangkat keras lokal Anda. Tidak perlu menunggu antrean pemrosesan server cloud yang lambat.'
        : 'Harnesses your local device hardware acceleration. No waiting in sluggish cloud server queues or subscription paywalls.'
    }
  ];

  return (
    <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f172a]/95 p-6 sm:p-8 space-y-6 shadow-lg backdrop-blur-md transition-colors">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          <span>{isId ? 'KEUNGGULAN UTAMA' : 'KEY ADVANTAGES'}</span>
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {isId ? 'Kenapa Harus DriaClip?' : 'Why Choose DriaClip?'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {isId 
            ? 'Solusi pemotong video cerdas yang dirancang khusus untuk kreator konten yang mengutamakan kecepatan, presisi, kebebasan format, dan perlindungan privasi penuh.'
            : 'An intelligent video clipper engineered for creators who demand speed, precision, format freedom, and uncompromising privacy.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
        {reasons.map((r, i) => {
          const IconComp = r.icon;
          return (
            <div 
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0b0f19]/70 p-5 space-y-3 hover:border-violet-400 dark:hover:border-violet-500/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 group-hover:scale-105 transition-transform">
                  <IconComp className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {r.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {r.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Google AdSense Slot — Terpasang Langsung pada Card Keunggulan Utama */}
      <div className="pt-2">
        <AdSenseSlot slotId="5462390377" creativeIndex={3} />
      </div>
    </section>
  );
};
