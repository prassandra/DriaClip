import React, { useState } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Square, 
  Clock, 
  Video, 
  ArrowRight,
  Sliders,
  MoveHorizontal,
  ShieldCheck,
  Check,
  Type,
  Palette,
  Eye,
  Info
} from 'lucide-react';
import { ClipConfig, AspectRatio, VerticalStyle, ExportQuality, VideoSourceMetadata, WatermarkStyle, WatermarkPosition } from '../types/driaclip';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { formatTimeCode } from '../services/videoClipper';
import { WatermarkBadge } from './WatermarkBadge';
import { AdSenseSlot } from './AdSenseSlot';

interface ClippingControlsProps {
  config: ClipConfig;
  onChangeConfig: (newConfig: ClipConfig) => void;
  onRunEngine: () => void;
  isProcessing: boolean;
  canProcess: boolean;
  lang: Language;
  videoDuration?: number;
  source?: VideoSourceMetadata | null;
}

export const ClippingControls: React.FC<ClippingControlsProps> = ({
  config,
  onChangeConfig,
  onRunEngine,
  isProcessing,
  canProcess,
  lang,
  videoDuration,
  source,
}) => {
  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';

  // Automatically detect if original video is 16:9 landscape vs 9:16 portrait
  const isSourceLandscape = source 
    ? (source.width && source.height ? source.width > source.height : !source.url?.includes('shorts'))
    : true;

  const [customInputVal, setCustomInputVal] = useState<string>(
    config.customDuration ? String(config.customDuration) : '60'
  );

  const updateConfig = <K extends keyof ClipConfig>(key: K, value: ClipConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const currentDurationSec = config.durationMode === 'custom'
    ? Math.max(5, config.customDuration || 60)
    : (config.presetDuration || 60);

  // Calculate live expected clips count if video duration is known
  const safeTotalDuration = videoDuration && videoDuration > 0 ? videoDuration : 0;
  const fullClipsCount = safeTotalDuration > 0 ? Math.floor(safeTotalDuration / currentDurationSec) : 0;
  const remainderSec = safeTotalDuration > 0 ? safeTotalDuration % currentDurationSec : 0;
  const calculatedClipsCount = remainderSec > 0 ? fullClipsCount + 1 : fullClipsCount;

  // Clean, minimalist resolution options (1080p, 720p, 480p, 360p) without clutter
  const resolutionOptions: ExportQuality[] = ['1080p', '720p', '480p', '360p'];

  const handleSelectPreset = (dur: number) => {
    onChangeConfig({
      ...config,
      durationMode: 'preset',
      presetDuration: dur,
    });
  };

  const handleSelectCustomMode = () => {
    const val = parseInt(customInputVal) || 60;
    onChangeConfig({
      ...config,
      durationMode: 'custom',
      customDuration: val,
    });
  };

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCustomInputVal(raw);
    const parsed = parseInt(raw);
    if (!isNaN(parsed) && parsed > 0) {
      onChangeConfig({
        ...config,
        durationMode: 'custom',
        customDuration: parsed,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f172a]/95 p-4 sm:p-7 shadow-lg backdrop-blur-md space-y-6 transition-colors w-full">
      {/* Header without step badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t.controls.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.controls.subtitle}
          </p>
        </div>

        {/* Live Active Quality Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isId ? 'Resolusi Aktif:' : 'Active Quality:'} <strong className="text-violet-700 dark:text-violet-300 font-bold">{config.exportQuality}</strong></span>
        </div>
      </div>

      {/* Module 1: Durasi per Klip & Custom Durasi (Full Width Row) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{isId ? 'Durasi per Potongan Klip' : 'Duration per Clip'}</span>
          </label>

          <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-100/70 dark:bg-violet-950/60 px-2.5 py-0.5 rounded-md border border-violet-200 dark:border-violet-800">
            {currentDurationSec} {isId ? 'Detik / Klip' : 'Seconds / Clip'}
          </span>
        </div>

        {/* Preset Buttons + Custom Toggle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[15, 30, 60, 90].map((dur) => {
            const isSelected = config.durationMode === 'preset' && config.presetDuration === dur;
            return (
              <button
                key={dur}
                type="button"
                onClick={() => handleSelectPreset(dur)}
                className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-sm sm:text-base font-extrabold font-mono block">{dur}s</span>
                <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}>
                  {dur === 60 ? (isId ? '1 Menit' : '1 Min') : dur === 90 ? (isId ? '1.5 Menit' : '1.5 Min') : `${dur} ${isId ? 'dtk' : 's'}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Duration Option */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSelectCustomMode}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
              config.durationMode === 'custom'
                ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 ring-2 ring-violet-500/25'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-bold">
                {isId ? 'Pilihan Custom Durasi' : 'Custom Duration'}
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
              config.durationMode === 'custom'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {config.durationMode === 'custom' ? `${currentDurationSec} detik` : (isId ? 'Tentukan sendiri' : 'Set custom')}
            </span>
          </button>

          {config.durationMode === 'custom' && (
            <div className="mt-2.5 p-3.5 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-slate-900 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isId ? 'Berapa detik per klip?' : 'Seconds per clip:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="5"
                    max="3600"
                    value={customInputVal}
                    onChange={handleCustomDurationChange}
                    className="w-24 text-center font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="60"
                  />
                  <span className="text-xs font-mono text-slate-500">detik</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-slate-400 py-0.5">{isId ? 'Cepat:' : 'Quick:'}</span>
                {[20, 45, 60, 120, 180].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setCustomInputVal(String(s));
                      onChangeConfig({
                        ...config,
                        durationMode: 'custom',
                        customDuration: s,
                      });
                    }}
                    className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {s >= 60 ? `${s / 60}m (${s}s)` : `${s}s`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Automatic Clips Count Calculation Banner */}
        {safeTotalDuration > 0 ? (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
              ✓
            </span>
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-900 dark:text-emerald-200">
                {isId 
                  ? `Otomatis Dipotong Menjadi ${calculatedClipsCount} Klip` 
                  : `Automatically Splits Into ${calculatedClipsCount} Clips`}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                {isId 
                  ? remainderSec > 0
                    ? `Durasi video asli ${formatTimeCode(safeTotalDuration)} dibagi dinamis: ${fullClipsCount} klip (${currentDurationSec}s) + 1 klip sisa (${remainderSec}s).`
                    : `Durasi video asli ${formatTimeCode(safeTotalDuration)} dibagi rata menjadi ${fullClipsCount} klip masing-masing ${currentDurationSec}s.`
                  : `Duration ${formatTimeCode(safeTotalDuration)} split into ${calculatedClipsCount} clips.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100/70 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <span>{isId ? 'Pilih atau unggah video di atas untuk melihat pembagian durasi klip otomatis.' : 'Select or upload a video above to preview clip breakdown.'}</span>
          </div>
        )}
      </div>

      {/* Google AdSense Slot — Sela-sela Padding Menu Durasi & Rasio */}
      <AdSenseSlot slotId="5462390377" creativeIndex={0} />

      {/* Module 2: Pilihan Rasio Aspek (9:16, 16:9, 1:1) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{isId ? 'Pilihan Rasio Aspek' : 'Aspect Ratio'}</span>
          </label>
          <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/60 px-2.5 py-0.5 rounded-full border border-violet-300/60 dark:border-violet-800">
            {config.aspectRatio} {isId ? 'Aktif' : 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 9:16 */}
          <button
            type="button"
            onClick={() => updateConfig('aspectRatio', '9:16')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
              config.aspectRatio === '9:16'
                ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-extrabold font-mono">9:16</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  config.aspectRatio === '9:16'
                    ? 'bg-white/20 text-white'
                    : 'bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300'
                }`}>
                  {isId ? 'Vertikal' : 'Vertical'}
                </span>
              </div>
              <p className={`text-xs leading-snug ${config.aspectRatio === '9:16' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                TikTok • Reels • Shorts
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 dark:border-slate-800/80 flex items-center justify-center">
              <div className="w-7 h-12 rounded border-2 border-current flex items-center justify-center bg-current/10">
                <span className="text-[9px] font-mono font-bold">9:16</span>
              </div>
            </div>
          </button>

          {/* 16:9 */}
          <button
            type="button"
            onClick={() => updateConfig('aspectRatio', '16:9')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
              config.aspectRatio === '16:9'
                ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm font-extrabold font-mono">16:9</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  config.aspectRatio === '16:9'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {isId ? 'Lanskap' : 'Landscape'}
                </span>
              </div>
              <p className={`text-xs leading-snug ${config.aspectRatio === '16:9' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {isId ? 'Lanskap • Layar Lebar • PC / TV' : 'Landscape • Widescreen • PC / TV'}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 dark:border-slate-800/80 flex items-center justify-center">
              <div className="w-12 h-7 rounded border-2 border-current flex items-center justify-center bg-current/10">
                <span className="text-[9px] font-mono font-bold">16:9</span>
              </div>
            </div>
          </button>

          {/* 1:1 */}
          <button
            type="button"
            onClick={() => updateConfig('aspectRatio', '1:1')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
              config.aspectRatio === '1:1'
                ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  <span className="text-sm font-extrabold font-mono">1:1</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  config.aspectRatio === '1:1'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {isId ? 'Persegi' : 'Square'}
                </span>
              </div>
              <p className={`text-xs leading-snug ${config.aspectRatio === '1:1' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Instagram Feed • Carousel • Post
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 dark:border-slate-800/80 flex items-center justify-center">
              <div className="w-9 h-9 rounded border-2 border-current flex items-center justify-center bg-current/10">
                <span className="text-[9px] font-mono font-bold">1:1</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Google AdSense Slot — Sela-sela Padding Menu Rasio Aspek */}
      <AdSenseSlot slotId="5462390377" creativeIndex={3} />

      {/* Module 3: Perlakuan Tampilan Frame (Full / Penuh, Bilah Hitam, Blur) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{isId ? 'Pilihan Tampilan (Full, Bilah Hitam, Blur)' : 'Framing Style (Full, Letterbox, Blur)'}</span>
          </label>
          <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/60 px-2.5 py-0.5 rounded-full border border-violet-300/60 dark:border-violet-800">
            {config.verticalStyle === 'center-crop'
              ? (isId ? 'Penuh (Full)' : 'Full (Center Crop)')
              : config.verticalStyle === 'letterbox'
              ? (isId ? 'Bilah Hitam' : 'Black Bars')
              : (isId ? 'Latar Blur' : 'Blur Background')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pilihan 1: Full / Penuh (center-crop) */}
          <button
            type="button"
            onClick={() => updateConfig('verticalStyle', 'center-crop')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
              config.verticalStyle === 'center-crop'
                ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-extrabold block">
                  {isId ? 'Penuh (Full)' : 'Full (Center Crop)'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  config.verticalStyle === 'center-crop'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {isId ? 'Populer' : 'Popular'}
                </span>
              </div>
              <p className={`text-xs leading-snug ${config.verticalStyle === 'center-crop' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {isId 
                  ? 'Video dipotong pas di tengah memenuhi seluruh frame tanpa ada area kosong.' 
                  : 'Crops video focus to center, filling the entire frame screen completely.'}
              </p>
            </div>

            {/* Visual Icon Illustration */}
            <div className="mt-3 pt-2.5 border-t border-white/10 dark:border-slate-800 flex items-center justify-center">
              <div className="w-12 h-14 rounded border-2 border-dashed border-current flex items-center justify-center bg-current/10">
                <span className="text-[10px] font-mono font-bold">FULL</span>
              </div>
            </div>
          </button>

          {/* Pilihan 2: Bilah Hitam (letterbox) */}
          <button
            type="button"
            onClick={() => updateConfig('verticalStyle', 'letterbox')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
              config.verticalStyle === 'letterbox'
                ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-extrabold block">
                  {isId ? 'Bilah Hitam' : 'Black Bars (Letterbox)'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  config.verticalStyle === 'letterbox'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  Sinematik
                </span>
              </div>
              <p className={`text-xs leading-snug ${config.verticalStyle === 'letterbox' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {isId 
                  ? 'Video utuh proporsional di tengah dengan bilah hitam sinematik di tepi atas dan bawah.' 
                  : 'Full original video centered with clean cinematic black bars top and bottom.'}
              </p>
            </div>

            {/* Visual Icon Illustration */}
            <div className="mt-3 pt-2.5 border-t border-white/10 dark:border-slate-800 flex items-center justify-center">
              <div className="w-12 h-14 rounded border border-current bg-black flex flex-col justify-between p-0.5">
                <div className="w-full h-2 bg-black" />
                <div className="w-full h-5 rounded-xs bg-current/30 flex items-center justify-center text-[8px] font-mono font-bold">16:9</div>
                <div className="w-full h-2 bg-black" />
              </div>
            </div>
          </button>

          {/* Pilihan 3: Blur (blur-background) */}
          <button
            type="button"
            onClick={() => updateConfig('verticalStyle', 'blur-background')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
              config.verticalStyle === 'blur-background'
                ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-extrabold block">
                  {isId ? 'Latar Blur' : 'Blur Background'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  config.verticalStyle === 'blur-background'
                    ? 'bg-white/20 text-white'
                    : 'bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300'
                }`}>
                  Estetik
                </span>
              </div>
              <p className={`text-xs leading-snug ${config.verticalStyle === 'blur-background' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {isId 
                  ? 'Video tajam di tengah dengan latar belakang video buram (blur) bergerak yang estetik.' 
                  : 'Sharp centered footage overlaid onto an aesthetically blurred moving video backdrop.'}
              </p>
            </div>

            {/* Visual Icon Illustration */}
            <div className="mt-3 pt-2.5 border-t border-white/10 dark:border-slate-800 flex items-center justify-center">
              <div className="w-12 h-14 rounded border border-current bg-current/15 backdrop-blur-sm flex items-center justify-center p-0.5">
                <div className="w-full h-5 rounded-xs bg-current/40 border border-current/30 flex items-center justify-center text-[8px] font-mono font-bold">BLUR</div>
              </div>
            </div>
          </button>
        </div>

        {/* If 'center-crop' is selected and aspect ratio is 9:16 or 1:1, show quick center/left/right horizontal crop guidance */}
        {config.verticalStyle === 'center-crop' && (config.aspectRatio === '9:16' || config.aspectRatio === '1:1') && (
          <div className="rounded-xl border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-slate-900/70 p-3.5 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <MoveHorizontal className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>{isId ? 'Posisi Potongan Frame (Horizontal Pan)' : 'Horizontal Frame Position'}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                {config.cropPositionX ?? 50}% {config.cropPositionX === 50 ? (isId ? '(Tengah Presisi)' : '(Exact Center)') : config.cropPositionX! < 50 ? (isId ? '(Cenderung Kiri)' : '(Towards Left)') : (isId ? '(Cenderung Kanan)' : '(Towards Right)')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateConfig('cropPositionX', 15)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  config.cropPositionX === 15
                    ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-violet-300'
                }`}
              >
                &larr; {isId ? 'Kiri (15%)' : 'Left (15%)'}
              </button>
              <button
                type="button"
                onClick={() => updateConfig('cropPositionX', 50)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  (config.cropPositionX ?? 50) === 50
                    ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-violet-300'
                }`}
              >
                {isId ? 'Tengah (50%)' : 'Center (50%)'}
              </button>
              <button
                type="button"
                onClick={() => updateConfig('cropPositionX', 85)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  config.cropPositionX === 85
                    ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-violet-300'
                }`}
              >
                {isId ? 'Kanan (85%)' : 'Right (85%)'} &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Google AdSense Slot — Sela-sela Padding Menu Rasio & Resolusi */}
      <AdSenseSlot slotId="5462390377" creativeIndex={1} />

      {/* Module 3: Pilihan Resolusi Ekspor — Clean, Direct, and Minimalist (1080p, 720p, 480p, 360p) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Video className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{isId ? 'Pilihan Resolusi Ekspor' : 'Export Resolution'}</span>
          </label>
          <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-300/60 dark:border-violet-800">
            {config.exportQuality}
          </span>
        </div>

        {/* Clean, direct 4 buttons — to the point as requested */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {resolutionOptions.map((res) => {
            const isSelected = config.exportQuality === res;
            return (
              <button
                key={res}
                type="button"
                onClick={() => updateConfig('exportQuality', res)}
                className={`py-3.5 px-4 rounded-xl border text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'border-violet-600 bg-violet-600 text-white font-extrabold shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-sm sm:text-base font-extrabold font-mono block">
                  {res}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Google AdSense Slot — Sela-sela Padding Menu Resolusi & Watermark */}
      <AdSenseSlot slotId="5462390377" creativeIndex={4} />

      {/* Module 4: Watermark Kustom & Perlindungan Konten — Manual Input, Aesthetic Themes & Strategic Anti-Crop */}
      <div className="rounded-2xl border border-violet-200/80 dark:border-violet-900/40 bg-violet-50/40 dark:bg-[#13112c]/40 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-200/60 dark:border-violet-900/40 pb-3.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{isId ? 'Watermark Kustom & Perlindungan Konten' : 'Custom Watermark & Brand Protection'}</span>
          </label>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{config.watermark !== false ? (isId ? 'Aktif (Terlindungi)' : 'Active (Protected)') : (isId ? 'Nonaktif' : 'Disabled')}</span>
          </span>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="space-y-0.5 pr-3">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              {isId ? 'Sematkan Watermark Kustom pada Klip Video' : 'Embed Custom Watermark on Output Clips'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {isId 
                ? 'Klaim hak cipta dan bangun branding Anda. Watermark tidak akan terpotong algoritma TikTok/Reels.' 
                : 'Claim content ownership and build creator branding with anti-crop safe zone positioning.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => updateConfig('watermark', config.watermark === false ? true : false)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.watermark !== false ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                config.watermark !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {config.watermark !== false && (
          <div className="space-y-5 pt-1 animate-in fade-in duration-200">
            {/* 1. Manual Text Input (Bisa di-input / di-edit manual oleh pengunjung) */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  <span>{isId ? 'Teks Watermark (Input / Edit Manual):' : 'Watermark Text (Manual Input & Edit):'}</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {((config.watermarkText ?? 'DriaClip').length)}/35 {isId ? 'karakter' : 'chars'}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={35}
                  value={config.watermarkText ?? 'DriaClip'}
                  onChange={(e) => updateConfig('watermarkText', e.target.value)}
                  placeholder={isId ? 'Ketik watermark Anda (contoh: @namachannel, DriaClip, dll.)' : 'Type watermark text (e.g. @username, Brand, DriaClip)'}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all font-mono font-medium"
                />
                {config.watermarkText && config.watermarkText !== 'DriaClip' && (
                  <button
                    type="button"
                    onClick={() => updateConfig('watermarkText', 'DriaClip')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-violet-500 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mr-1">
                  {isId ? 'Pilihan Cepat:' : 'Quick Presets:'}
                </span>
                {[
                  'DriaClip',
                  '@Kreator',
                  'Follow For More',
                  'Official Video'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateConfig('watermarkText', preset)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      (config.watermarkText ?? 'DriaClip') === preset
                        ? 'border-violet-500 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>


            {/* 3. Strategic Anti-Crop Positions & Live Mockup Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
              {/* Positions List (2 cols on large screen) */}
              <div className="lg:col-span-2 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{isId ? 'Posisi Penempatan Aman (Anti-Crop):' : 'Anti-Crop Safe Placement:'}</span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-mono">
                    Safe-Zone Protected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'safe-top-left',
                      title: isId ? 'Kiri Atas' : 'Upper-Left',
                      badge: isId ? 'Direkomendasikan' : 'Recommended',
                      desc: isId 
                        ? 'Bebas tombol Like/Share TikTok & subtitle bawah.' 
                        : 'Free from TikTok/Reels buttons and lower captions.'
                    },
                    {
                      id: 'safe-top-right',
                      title: isId ? 'Kanan Atas' : 'Upper-Right',
                      badge: isId ? 'Area Aman' : 'Safe Area',
                      desc: isId 
                        ? 'Di atas tombol interaksi vertikal, terlihat jelas.' 
                        : 'Above vertical interaction stack, stays visible.'
                    },
                    {
                      id: 'center-top',
                      title: isId ? 'Tengah Atas' : 'Center-Top',
                      badge: isId ? 'Fokus Simetris' : 'Top Center',
                      desc: isId 
                        ? 'Tepat di tengah bagian atas frame video.' 
                        : 'Directly centered at the top of the video frame.'
                    },
                    {
                      id: 'safe-bottom-left',
                      title: isId ? 'Kiri Bawah (Aman)' : 'Lower-Left (Safe)',
                      badge: isId ? 'Area Sudut' : 'Corner',
                      desc: isId 
                        ? 'Di atas bilah pencarian & teks deskripsi bawah.' 
                        : 'Above bottom player scrubber and title captions.'
                    },
                    {
                      id: 'safe-bottom-right',
                      title: isId ? 'Kanan Bawah (Aman)' : 'Lower-Right (Safe)',
                      badge: isId ? 'Area Sudut' : 'Corner',
                      desc: isId 
                        ? 'Di sudut kanan bawah frame aman video.' 
                        : 'Positioned safely in the bottom right corner.'
                    }
                  ].map((pos) => {
                    const isSelected = (config.watermarkPosition || 'safe-top-left') === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => updateConfig('watermarkPosition', pos.id as WatermarkPosition)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-violet-600 bg-violet-600/10 dark:bg-violet-950/40 text-violet-900 dark:text-violet-100 ring-1 ring-violet-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{pos.title}</span>
                            {pos.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                                {pos.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                            {pos.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Interactive Phone Mockup Preview */}
              <div className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white space-y-2">
                <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-violet-400" />
                    <span>{isId ? 'Pratinjau Langsung (Live)' : 'Live Preview'}</span>
                  </span>
                  <span className="text-violet-400 font-bold">9:16 Frame</span>
                </div>

                {/* Simulated Phone Screen */}
                <div className="relative w-full max-w-[190px] aspect-[9/16] rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-xl flex items-center justify-center select-none">
                  {/* Subtle video background simulation */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 opacity-90" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)]" />

                  {/* Simulated right-side interaction icons (like, comment, share) */}
                  <div className="absolute right-1.5 bottom-12 flex flex-col items-center gap-2 opacity-50 pointer-events-none">
                    <div className="w-3.5 h-3.5 rounded-full bg-white/60" />
                    <div className="w-3.5 h-3.5 rounded-full bg-white/60" />
                    <div className="w-3.5 h-3.5 rounded-full bg-white/60" />
                  </div>

                  {/* Simulated bottom caption */}
                  <div className="absolute bottom-2 left-2 right-8 space-y-1 opacity-50 pointer-events-none">
                    <div className="h-1.5 w-16 bg-white/70 rounded-full" />
                    <div className="h-1.5 w-24 bg-white/40 rounded-full" />
                  </div>

                  {/* Dynamic Watermark Badge positioned according to state */}
                  <div
                    className={`absolute z-20 transition-all duration-300 drop-shadow-md ${
                      config.watermarkPosition === 'safe-top-right'
                        ? 'top-3 right-2'
                        : config.watermarkPosition === 'center-top'
                        ? 'top-3 left-1/2 -translate-x-1/2'
                        : config.watermarkPosition === 'safe-bottom-left'
                        ? 'bottom-10 left-2'
                        : config.watermarkPosition === 'safe-bottom-right'
                        ? 'bottom-10 right-2'
                        : 'top-3 left-2'
                    }`}
                  >
                    <WatermarkBadge
                      text={config.watermarkText || 'DriaClip'}
                      style={config.watermarkStyle || 'neon-glow'}
                      size="xs"
                    />
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 text-center leading-tight">
                  {isId ? 'Tampilan badge pada video vertikal TikTok & Reels' : 'Simulated live appearance on TikTok & Reels'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google AdSense Slot — Sela-sela Padding Menu Watermark & Tombol Aksi */}
      <AdSenseSlot slotId="5462390377" creativeIndex={2} />

      {/* Action Trigger Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>DriaClip Engine &middot; {config.aspectRatio} &middot; {config.verticalStyle === 'center-crop' ? (isId ? 'Penuh (Full)' : 'Full') : config.verticalStyle === 'letterbox' ? (isId ? 'Bilah Hitam' : 'Letterbox') : (isId ? 'Latar Blur' : 'Blur')} &middot; {config.exportQuality} &middot; {currentDurationSec}s {isId ? 'per Klip' : 'per Clip'}</span>
        </div>

        <button
          type="button"
          onClick={onRunEngine}
          disabled={!canProcess || isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{t.controls.processingBtn}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>{calculatedClipsCount > 0 ? (isId ? `Potong & Buat ${calculatedClipsCount} Klip` : `Split & Generate ${calculatedClipsCount} Clips`) : t.controls.triggerBtn}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
