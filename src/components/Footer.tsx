import React from 'react';
import { ExternalLink, ShieldCheck, Film, Scissors, Layers, Download } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { PageView } from './LegalAndInfoPages';
import { DriaClipLogo } from './DriaClipLogo';

interface FooterProps {
  lang: Language;
  onOpenLegalPage: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onOpenLegalPage,
}) => {
  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';

  const keyFeatures = [
    {
      title: isId ? 'Pemotong Video Otomatis' : 'Automated Video Clipper',
      icon: Scissors,
    },
    {
      title: isId ? 'Reframing 9:16 Vertikal' : 'Vertical 9:16 Reframing',
      icon: Film,
    },
    {
      title: isId ? 'Pilihan Resolusi 1080p - 360p' : '1080p - 360p Resolution',
      icon: Layers,
    },
    {
      title: isId ? 'Output MP4 Siap Posting' : 'Universal MP4 Export',
      icon: Download,
    },
  ];

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19] pt-12 pb-10 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <DriaClipLogo variant="full" size="md" />
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              {isId 
                ? 'DriaClip by Driacom adalah platform otomasi pemotong dan penyunting video untuk mengubah konten durasi panjang menjadi video pendek vertikal berkualitas tinggi (9:16) untuk TikTok, YouTube Shorts, dan Instagram Reels.'
                : 'DriaClip by Driacom is an automated video trimming platform engineered to turn long-form video content into viral short clips (9:16) with custom durations and AI highlights.'}
            </p>
          </div>

          {/* Col 2: Tools Driacom */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono">
              Tools Driacom
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://save.driacom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 group-hover:scale-125 transition-transform" />
                  <span className="font-semibold">DriaSave</span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://seo.driacom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 group-hover:scale-125 transition-transform" />
                  <span className="font-semibold">DriaSeo</span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://convert.driacom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                  <span className="font-semibold">DriaConvert</span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Support */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono">
              {isId ? 'Legal & Dukungan' : 'Legal & Support'}
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalPage('about')}
                  className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footer.aboutLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalPage('contact')}
                  className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footer.contactLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalPage('privacy')}
                  className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footer.privacyLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalPage('disclaimer')}
                  className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footer.disclaimerLink}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Sub-branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200/80 dark:border-slate-800/90 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            {t.footer.copyright}
          </p>

          <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span>{isId ? 'Dibuat oleh' : 'Created by'}</span>
            <a
              href="https://driacom.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 hover:underline transition-colors"
            >
              <span>Driacom</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
