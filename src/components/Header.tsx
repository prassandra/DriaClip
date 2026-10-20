import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Video, 
  Layers, 
  Menu, 
  X, 
  HelpCircle, 
  Sun, 
  Moon, 
  Globe, 
  Type, 
  ChevronDown, 
  ExternalLink, 
  Wrench,
  Check
} from 'lucide-react';
import { DriaClipLogo } from './DriaClipLogo';
import { Language, FontSize, ThemeMode, TRANSLATIONS } from '../i18n/translations';
import { PageView } from './LegalAndInfoPages';

interface HeaderProps {
  activeTab: 'studio' | 'clips' | 'guide' | 'faq';
  setActiveTab: (tab: 'studio' | 'clips' | 'guide' | 'faq') => void;
  clipsCount: number;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  fontSize: FontSize;
  onChangeFontSize: (size: FontSize) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenLegalPage: (page: PageView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  clipsCount,
  lang,
  onToggleLang,
  fontSize,
  onChangeFontSize,
  theme,
  onToggleTheme,
  onOpenLegalPage: _onOpenLegalPage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';

  // Font labels based on language
  const fontLabels: Record<FontSize, { id: string; en: string }> = {
    small: { id: 'Kecil', en: 'Small' },
    normal: { id: 'Normal', en: 'Normal' },
    large: { id: 'Besar', en: 'Large' },
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target as Node)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b0f19]/95 text-slate-900 dark:text-slate-100 backdrop-blur-md shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-2 min-w-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('studio');
            }}
            className="flex items-center group transition-transform hover:scale-[1.01] shrink-0"
            title="DriaClip by Driacom"
          >
            <DriaClipLogo variant="full" size="md" />
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer leading-none ${
              activeTab === 'studio'
                ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
            <span>{t.nav.workspace}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clips')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer leading-none ${
              activeTab === 'clips'
                ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{t.nav.clips}</span>
            {clipsCount > 0 && (
              <span className="ml-1 rounded-full bg-violet-600 text-white px-1.5 py-0.5 text-[10px] font-mono font-bold leading-none">
                {clipsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer leading-none ${
              activeTab === 'guide'
                ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>{t.nav.guide}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer leading-none ${
              activeTab === 'faq'
                ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>{t.nav.faq}</span>
          </button>

          {/* Tools Driacom Dropdown */}
          <div className="relative" ref={toolsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setToolsDropdownOpen(!toolsDropdownOpen);
                setMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer leading-none text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <Wrench className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <span>Tools Driacom</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xl p-1.5 z-50 animate-in fade-in duration-100 space-y-1">
                <a
                  href="https://save.driacom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    <span>DriaSave</span>
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>

                <a
                  href="https://seo.driacom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    <span>DriaSeo</span>
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>

                <a
                  href="https://convert.driacom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>DriaConvert</span>
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Right Controls: Theme Toggle & Hamburger Menu for Desktop AND Mobile */}
        <div className="flex items-center gap-2" ref={menuRef}>
          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-600/40 transition-colors cursor-pointer shadow-xs active:scale-95"
            aria-label="Toggle Theme Dark/Light"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 animate-in fade-in" />
            ) : (
              <Moon className="h-4 w-4 text-violet-600 animate-in fade-in" />
            )}
          </button>

          {/* Unified Hamburger Menu Button for Desktop & Mobile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(!menuOpen);
                setToolsDropdownOpen(false);
              }}
              title={isId ? 'Menu & Pengaturan (Font & Bahasa)' : 'Menu & Settings (Font & Language)'}
              aria-label="Toggle Settings and Navigation Menu"
              aria-expanded={menuOpen}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all cursor-pointer shadow-xs active:scale-95 ${
                menuOpen
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 ring-2 ring-violet-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-600/40'
              }`}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop Popover Menu (Visible on sm and up) */}
            {menuOpen && (
              <div className="hidden sm:block absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isId ? 'Pengaturan Tampilan' : 'Display Settings'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 1. Desktop: Font Size Controls */}
                <div className="py-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Type className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    <span>{isId ? 'Ukuran Font' : 'Font Size'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['small', 'normal', 'large'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onChangeFontSize(s)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all border leading-normal ${
                          fontSize === s
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {fontLabels[s][lang]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Desktop: Language Controls (Strictly Text ID & GB - No Broken Flag Icons) */}
                <div className="pt-3 pb-1 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Globe className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{isId ? 'Bahasa' : 'Language'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleLang('id')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all border leading-normal ${
                        lang === 'id'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/15">
                        ID
                      </span>
                      <span>Indonesia</span>
                      {lang === 'id' && <Check className="h-3 w-3 ml-auto shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleLang('en')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all border leading-normal ${
                        lang === 'en'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/15">
                        GB
                      </span>
                      <span>English</span>
                      {lang === 'en' && <Check className="h-3 w-3 ml-auto shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (When Hamburger Clicked on Mobile Screens < sm) */}
      {menuOpen && (
        <div className="sm:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] px-4 py-5 space-y-4 animate-in slide-in-from-top duration-200 shadow-2xl max-w-full overflow-hidden">
          
          {/* 1. Item Pertama: Ukuran Font (Kecil, Normal, Besar) */}
          <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Type className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>{isId ? 'Ukuran Font' : 'Font Size'}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'normal', 'large'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChangeFontSize(s)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all border leading-normal ${
                    fontSize === s 
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xs' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {fontLabels[s][lang]}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Item Kedua: Ganti Bahasa (Strictly Text ID & GB - No Broken Flag Icons) */}
          <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>{isId ? 'Ganti Bahasa' : 'Language'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleLang('id')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all border leading-normal ${
                  lang === 'id'
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-mono font-extrabold text-xs px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/15">
                  ID
                </span>
                <span>Indonesia</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleLang('en')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all border leading-normal ${
                  lang === 'en'
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-mono font-extrabold text-xs px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/15">
                  GB
                </span>
                <span>English</span>
              </button>
            </div>
          </div>

          {/* 3. Navigasi Halaman DriaClip */}
          <div className="space-y-1.5 pt-1 text-xs">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-mono">
              {isId ? 'Navigasi DriaClip' : 'DriaClip Pages'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('studio');
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all leading-normal ${
                  activeTab === 'studio'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-700 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Video className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                <span>{t.nav.workspace}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('clips');
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all leading-normal ${
                  activeTab === 'clips'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-700 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{t.nav.clips}</span>
                {clipsCount > 0 && (
                  <span className="ml-auto rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] text-white leading-none font-mono">
                    {clipsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('guide');
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all leading-normal ${
                  activeTab === 'guide'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-700 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{t.nav.guide}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('faq');
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all leading-normal ${
                  activeTab === 'faq'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-700 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <HelpCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>{t.nav.faq}</span>
              </button>
            </div>
          </div>

          {/* 4. Tools Driacom Section */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-mono">
              Tools Driacom
            </span>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://save.driacom.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-violet-600 font-semibold"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span>DriaSave</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
              <a
                href="https://seo.driacom.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-violet-600 font-semibold"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                <span>DriaSeo</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
              <a
                href="https://convert.driacom.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-violet-600 font-semibold"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>DriaConvert</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
