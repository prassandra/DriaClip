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
  Info
} from 'lucide-react';
import { ClipConfig, AspectRatio, VerticalStyle, ExportQuality, VideoSourceMetadata } from '../types/driaclip';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { formatTimeCode } from '../services/videoClipper';

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

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: Durasi per Klip & Custom Durasi */}
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
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 60, 90].map((dur) => {
              const isSelected = config.durationMode === 'preset' && config.presetDuration === dur;
              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() => handleSelectPreset(dur)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
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
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                config.durationMode === 'custom'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {config.durationMode === 'custom' ? `${currentDurationSec} detik` : (isId ? 'Tentukan sendiri' : 'Set custom')}
              </span>
            </button>

            {config.durationMode === 'custom' && (
              <div className="mt-2.5 p-3.5 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-slate-900 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-3">
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
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                ✓
              </span>
              <div className="space-y-0.5">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  {isId 
                    ? `Otomatis Dipotong Menjadi ${calculatedClipsCount} Klip` 
                    : `Automatically Splits Into ${calculatedClipsCount} Clips`}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
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

        {/* Module 2: Format Rasio & Tampilan Vertikal */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-5 sm:p-6 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{t.controls.aspectRatio}</span>
          </label>

          {/* Aspect Ratio Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: '9:16' as AspectRatio, label: '9:16', sub: 'TikTok / Reels / Shorts', icon: Smartphone },
              { id: '16:9' as AspectRatio, label: '16:9', sub: 'YouTube / Monitor', icon: Monitor },
              { id: '1:1' as AspectRatio, label: '1:1', sub: 'Instagram Feed / Square', icon: Square },
            ].map((ratio) => {
              const Icon = ratio.icon;
              const isSelected = config.aspectRatio === ratio.id;
              return (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => updateConfig('aspectRatio', ratio.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200 ring-2 ring-violet-500/25 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1.5 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-bold font-mono">{ratio.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight text-center line-clamp-1">{ratio.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Framing treatment if 9:16 is selected */}
          {config.aspectRatio === '9:16' && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {t.controls.verticalTreatment}
                </span>
                <span className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/70 px-2 py-0.5 rounded">
                  {config.verticalStyle === 'auto-track'
                    ? (isId ? 'Auto-Follow Kamera (AI)' : 'Auto-Follow Camera')
                    : config.verticalStyle === 'blur-background'
                    ? (isId ? 'Latar Blur' : 'Blur Background')
                    : (isId ? 'Bilah Hitam' : 'Letterbox')}
                </span>
              </div>

              {/* 3 Clear Vertical Modes: Auto-Track AI, Latar Blur, Bilah Hitam */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { 
                    id: 'auto-track' as VerticalStyle, 
                    label: isId ? 'Auto Tracking Kamera' : 'Auto-Follow Camera', 
                    badge: isId ? 'AI Otomatis' : 'AI Auto',
                    desc: isId ? 'Otomatis melacak orang berbicara tanpa geser manual' : 'Auto tracks active speaker',
                    highlight: true 
                  },
                  { 
                    id: 'blur-background' as VerticalStyle, 
                    label: isId ? 'Latar Blur' : 'Blur Background',
                    badge: isId ? 'Populer' : 'Popular',
                    desc: isId ? 'Video di tengah dengan background blur atas & bawah' : 'Blurred video backdrop',
                    highlight: false
                  },
                  { 
                    id: 'letterbox' as VerticalStyle, 
                    label: isId ? 'Bilah Hitam' : 'Letterbox Bars',
                    badge: isId ? 'Sinematik' : 'Classic',
                    desc: isId ? 'Video di tengah dengan bilah hitam atas & bawah' : 'Clean black bars framing',
                    highlight: false
                  },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => updateConfig('verticalStyle', style.id)}
                    className={`p-3 rounded-xl transition-all text-left cursor-pointer font-medium leading-tight border relative flex flex-col justify-between gap-1.5 ${
                      config.verticalStyle === style.id
                        ? 'bg-violet-600 text-white font-bold border-violet-600 shadow-md ring-2 ring-violet-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="block font-bold text-xs sm:text-[13px]">{style.label}</span>
                      {style.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          config.verticalStyle === style.id
                            ? 'bg-violet-800 text-violet-100'
                            : style.highlight
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {style.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] leading-tight ${config.verticalStyle === style.id ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {style.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Informative Banner based on Selected Mode */}
              {config.verticalStyle === 'auto-track' && (
                <div className="rounded-xl bg-violet-500/10 dark:bg-violet-950/40 border border-violet-500/30 p-3 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-bold text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span>{isId ? 'Auto-Tracking Kamera AI Aktif' : 'Smart AI Camera Auto-Tracking Active'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isId 
                      ? 'Kamera otomatis mendeteksi wajah & gerakan orang yang sedang berbicara, lalu menggeser bingkai 9:16 secara dinamis dan halus (Steadicam Panning). Anda tidak perlu lagi menggeser posisi frame secara manual!' 
                      : 'The 9:16 vertical camera automatically identifies speaker faces and speech motion, smoothly panning in real-time to follow active subjects without any manual adjustments!'}
                  </p>
                </div>
              )}

              {config.verticalStyle === 'blur-background' && (
                <div className="rounded-xl bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/30 p-3 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs">
                    <Video className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>{isId ? 'Mode Latar Blur Aktif' : 'Blur Background Mode Active'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isId 
                      ? 'Seluruh video asli 16:9 tetap utuh di tengah tanpa terpotong sampingnya, dengan latar belakang video yang dibesarkan dan diburamkan secara artistik di bagian atas dan bawah.' 
                      : 'The full 16:9 video is centered without cropping edges, backed by an enlarged, artistically blurred video layer on the top and bottom.'}
                  </p>
                </div>
              )}

              {config.verticalStyle === 'letterbox' && (
                <div className="rounded-xl bg-slate-500/10 dark:bg-slate-800/40 border border-slate-500/30 p-3 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-bold text-xs">
                    <Monitor className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                    <span>{isId ? 'Mode Bilah Hitam (Letterbox) Aktif' : 'Letterbox Black Bars Mode Active'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isId 
                      ? 'Video 16:9 ditampilkan utuh di tengah layar dengan bilah hitam sinematik di bagian atas dan bawah frame 9:16.' 
                      : 'The 16:9 video is presented fully centered with classic black letterbox bars at the top and bottom of the vertical 9:16 frame.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* Action Trigger Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>DriaClip Engine &middot; {config.aspectRatio} &middot; {config.exportQuality} &middot; {currentDurationSec}s {isId ? 'per Klip' : 'per Clip'}</span>
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
