import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  UploadCloud, 
  Scissors, 
  Download, 
  HelpCircle
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { AdSenseSlot } from './AdSenseSlot';

interface SeoSectionsProps {
  lang: Language;
}

export const SeoSections: React.FC<SeoSectionsProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    { q: t.faqSection.q1, a: t.faqSection.a1 },
    { q: t.faqSection.q2, a: t.faqSection.a2 },
    { q: t.faqSection.q3, a: t.faqSection.a3 },
    { q: t.faqSection.q4, a: t.faqSection.a4 },
    { q: t.faqSection.q5, a: t.faqSection.a5 },
  ];

  return (
    <div className="space-y-10 py-6 max-w-full overflow-hidden">
      {/* 1. Step-by-Step How It Works Guide Section */}
      <section id="guide" className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f172a]/95 p-6 sm:p-8 space-y-6 shadow-lg backdrop-blur-md transition-colors">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 font-mono">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span>{t.guideSection.badge}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.guideSection.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {lang === 'id'
              ? 'Tiga langkah mudah mengubah konten rekaman berdurasi panjang menjadi aset video pendek yang siap viral di berbagai platform media sosial.'
              : 'Three effortless steps to transform multi-hour long-form footage into viral-ready short video assets across major social platforms.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Step 1 */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0b0f19]/70 p-6 space-y-3 hover:border-violet-400 dark:hover:border-violet-500/50 transition-colors shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
              <UploadCloud className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.guideSection.step1Title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.guideSection.step1Desc}
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0b0f19]/70 p-6 space-y-3 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Scissors className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.guideSection.step2Title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.guideSection.step2Desc}
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0b0f19]/70 p-6 space-y-3 hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-colors shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.guideSection.step3Title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.guideSection.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* Google AdSense Slot — Sela-sela Padding Menu Panduan & FAQ */}
      <AdSenseSlot slotId="5462390377" creativeIndex={4} />

      {/* 2. Real SEO FAQ Accordion Section */}
      <section id="faq" className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f172a]/95 p-6 sm:p-8 space-y-6 shadow-lg backdrop-blur-md transition-colors">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 px-3 py-1 text-xs font-semibold text-cyan-800 dark:text-cyan-300 font-mono">
            <HelpCircle className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t.faqSection.badge}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.faqSection.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {lang === 'id' 
              ? 'Jawaban resmi seputar format video, teknologi FFmpeg, kebijakan privasi pemrosesan, dan hak cipta konten.'
              : 'Direct answers regarding supported media formats, FFmpeg processing heuristics, privacy safeguards, and fair use.'}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3 pt-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0b0f19]/80 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200 hover:text-violet-600 dark:hover:text-white cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-violet-600 dark:text-violet-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-150">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Google AdSense Slot — Terpasang Langsung pada Card FAQ */}
        <div className="pt-2">
          <AdSenseSlot slotId="5462390377" creativeIndex={0} />
        </div>
      </section>
    </div>
  );
};
