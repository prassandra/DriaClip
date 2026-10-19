import React, { useState } from 'react';
import { X, Check, Clock, Edit3, Sparkles, MoveHorizontal, ShieldCheck, Palette, Type, Smartphone, Monitor, Square, Sliders } from 'lucide-react';
import { GeneratedClip, VideoSourceMetadata, WatermarkStyle, WatermarkPosition, AspectRatio, VerticalStyle } from '../types/driaclip';
import { formatTimeCode } from '../services/videoClipper';
import { Language } from '../i18n/translations';
import { WatermarkBadge } from './WatermarkBadge';

interface ClipFineTuneModalProps {
  clip: GeneratedClip | null;
  source?: VideoSourceMetadata | null;
  maxSourceDuration: number;
  onClose: () => void;
  onSave: (updatedClip: GeneratedClip) => void;
  lang?: Language;
}

export const ClipFineTuneModal: React.FC<ClipFineTuneModalProps> = ({
  clip,
  source,
  maxSourceDuration,
  onClose,
  onSave,
  lang = 'id',
}) => {
  if (!clip) return null;
  const isId = lang === 'id';

  const [title, setTitle] = useState(clip.title);
  const [hookText, setHookText] = useState(clip.hookText);
  const [startTime, setStartTime] = useState(clip.startTime);
  const [endTime, setEndTime] = useState(clip.endTime);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(clip.aspectRatio || '9:16');
  const [verticalStyle, setVerticalStyle] = useState<VerticalStyle>(clip.verticalStyle || 'center-crop');
  const [watermark, setWatermark] = useState(clip.watermark !== false);
  const [watermarkText, setWatermarkText] = useState(clip.watermarkText || 'DriaClip');
  const [watermarkStyle, setWatermarkStyle] = useState<WatermarkStyle>(clip.watermarkStyle || 'neon-glow');
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>(
    clip.watermarkPosition || 'safe-top-left'
  );
  const [cropPositionX, setCropPositionX] = useState<number>(clip.cropPositionX ?? 50);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const duration = Math.max(1, endTime - startTime);

  const handleNudgeStart = (delta: number) => {
    setErrorMsg(null);
    const next = Math.max(0, Math.min(endTime - 3, startTime + delta));
    setStartTime(next);
  };

  const handleNudgeEnd = (delta: number) => {
    setErrorMsg(null);
    const next = Math.min(maxSourceDuration, Math.max(startTime + 3, endTime + delta));
    setEndTime(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) {
      setErrorMsg(isId ? 'Waktu selesai harus lebih besar dari waktu mulai.' : 'End time must be after start time.');
      return;
    }

    onSave({
      ...clip,
      title: title.trim() || clip.title,
      hookText: hookText.trim() || clip.hookText,
      startTime: Math.round(startTime),
      endTime: Math.round(endTime),
      duration: Math.round(endTime - startTime),
      aspectRatio,
      verticalStyle,
      cropPositionX,
      watermark,
      watermarkText: watermarkText.trim() || 'DriaClip',
      watermarkStyle,
      watermarkPosition,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-violet-400" />
            <h3 className="text-base font-semibold text-neutral-100">
              {isId ? 'Atur Halus Titik Waktu & Hook Klip' : 'Fine-tune Clip Timestamps & Hook'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              {isId ? 'Judul Klip' : 'Clip Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Hook */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              {isId ? 'Hook Retensi (3 Detik Pembuka)' : 'Retention Hook (Opening 3 Seconds)'}
            </label>
            <textarea
              rows={2}
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>

          {/* Start and End Trimming Controls */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            {/* Start Time */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>{isId ? 'Titik Mulai' : 'Start Point'}</span>
                <span className="font-mono text-violet-400">{formatTimeCode(startTime)}</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNudgeStart(-1)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300"
                >
                  -1s
                </button>
                <input
                  type="number"
                  min={0}
                  max={endTime - 2}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                  className="w-full rounded bg-neutral-950 border border-neutral-750 px-2 py-1 text-center font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleNudgeStart(1)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300"
                >
                  +1s
                </button>
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>{isId ? 'Titik Selesai' : 'End Point'}</span>
                <span className="font-mono text-violet-400">{formatTimeCode(endTime)}</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNudgeEnd(-1)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300"
                >
                  -1s
                </button>
                <input
                  type="number"
                  min={startTime + 2}
                  max={maxSourceDuration}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                  className="w-full rounded bg-neutral-950 border border-neutral-750 px-2 py-1 text-center font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleNudgeEnd(1)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300"
                >
                  +1s
                </button>
              </div>
            </div>
          </div>

          {/* Duration Summary */}
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-mono">
            <span>{isId ? 'Hasil Durasi Klip:' : 'Resulting Clip Length:'}</span>
            <span className="font-semibold text-neutral-200">{duration} {isId ? 'detik' : 'seconds'}</span>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-violet-400" />
                <span>{isId ? 'Rasio Aspek Klip' : 'Clip Aspect Ratio'}</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800">
                {aspectRatio}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '9:16', label: '9:16', desc: 'Vertikal' },
                { id: '16:9', label: '16:9', desc: 'Lanskap' },
                { id: '1:1', label: '1:1', desc: 'Persegi' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAspectRatio(r.id as AspectRatio)}
                  className={`py-2 px-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    aspectRatio === r.id
                      ? 'border-violet-500 bg-violet-600/30 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-mono font-bold block">{r.label}</span>
                  <span className="text-[9px] text-neutral-400 block">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Framing Treatment (Full / Bilah Hitam / Blur) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-violet-400" />
                <span>{isId ? 'Pilihan Tampilan (Full, Bilah Hitam, Blur)' : 'Framing Style (Full, Letterbox, Blur)'}</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'center-crop', label: isId ? 'Penuh' : 'Full', desc: 'Center Crop' },
                { id: 'letterbox', label: isId ? 'Bilah Hitam' : 'Letterbox', desc: 'Black Bars' },
                { id: 'blur-background', label: isId ? 'Latar Blur' : 'Blur', desc: 'Aesthetic' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setVerticalStyle(style.id as VerticalStyle)}
                  className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    verticalStyle === style.id
                      ? 'border-violet-500 bg-violet-600/30 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{style.label}</span>
                  <span className="text-[9px] text-neutral-400 block">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Frame Positioning & Shift Controls (for center-crop) */}
          {verticalStyle === 'center-crop' && (aspectRatio === '9:16' || aspectRatio === '1:1') && (
            <div className="rounded-xl border border-violet-500/40 bg-violet-950/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-300 font-bold text-xs">
                  <MoveHorizontal className="h-4 w-4 text-violet-400" />
                  <span>{isId ? 'Atur & Geser Posisi Frame Kamera' : 'Adjust & Shift Camera Frame'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-200 border border-violet-600/50 font-bold">
                  {cropPositionX}%
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {isId
                  ? 'Geser kamera crop ke kiri atau kanan agar subjek / orang pas di tengah layar sebelum klip disimpan.'
                  : 'Shift camera frame left or right so the subject is centered before saving.'}
              </p>

              {/* Quick Nudge Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCropPositionX((prev) => Math.max(0, prev - 15))}
                  className="py-1.5 px-2 rounded-lg border border-neutral-700 hover:border-violet-500 bg-neutral-900 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  &larr; {isId ? 'Kiri' : 'Left'}
                </button>
                <button
                  type="button"
                  onClick={() => setCropPositionX(50)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    cropPositionX === 50
                      ? 'border-violet-500 bg-violet-600/30 text-violet-200 font-bold'
                      : 'border-neutral-700 hover:border-violet-500 bg-neutral-900 text-white'
                  }`}
                >
                  {isId ? 'Tengah' : 'Center'}
                </button>
                <button
                  type="button"
                  onClick={() => setCropPositionX((prev) => Math.min(100, prev + 15))}
                  className="py-1.5 px-2 rounded-lg border border-neutral-700 hover:border-violet-500 bg-neutral-900 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  {isId ? 'Kanan' : 'Right'} &rarr;
                </button>
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>0% ({isId ? 'Kiri' : 'Left'})</span>
                  <span className="text-violet-300 font-bold">{cropPositionX}%</span>
                  <span>100% ({isId ? 'Kanan' : 'Right'})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={cropPositionX}
                  onChange={(e) => setCropPositionX(Number(e.target.value))}
                  className="w-full h-1.5 accent-violet-500 hover:accent-violet-400 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}



          {/* Watermark Protection Option (Bisa Diedit Manual per Klip) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-400" />
                <span>{isId ? 'Watermark Kustom Klip (Anti-Crop)' : 'Custom Clip Watermark (Anti-Crop)'}</span>
              </span>
              <button
                type="button"
                onClick={() => setWatermark(!watermark)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  watermark
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {watermark ? (isId ? 'Aktif' : 'Active') : (isId ? 'Nonaktif' : 'Off')}
              </button>
            </div>

            {watermark && (
              <div className="space-y-3 pt-1 border-t border-neutral-800/80 animate-in fade-in duration-200">
                {/* Manual Watermark Text Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                      <Type className="h-3 w-3 text-violet-400" />
                      <span>{isId ? 'Edit Teks Watermark Manual:' : 'Edit Watermark Text:'}</span>
                    </label>
                    <span className="text-[9px] font-mono text-neutral-500">{watermarkText.length}/35</span>
                  </div>
                  <input
                    type="text"
                    maxLength={35}
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="DriaClip, @username, dll."
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 font-mono focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Theme & Position Selectors */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      {isId ? 'Gaya Desain:' : 'Design Style:'}
                    </label>
                    <select
                      value={watermarkStyle}
                      onChange={(e) => setWatermarkStyle(e.target.value as WatermarkStyle)}
                      className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none cursor-pointer"
                    >
                      <option value="neon-glow">Cyber Glow (Neon Violet)</option>
                      <option value="glass-blur">Frosted Glass</option>
                      <option value="gradient-accent">Sunset Aurora</option>
                      <option value="minimal-dark">Obsidian Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      {isId ? 'Posisi Safe-Zone:' : 'Position:'}
                    </label>
                    <select
                      value={watermarkPosition}
                      onChange={(e) => setWatermarkPosition(e.target.value as WatermarkPosition)}
                      className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none cursor-pointer"
                    >
                      <option value="safe-top-left">{isId ? 'Kiri Atas (Rekomendasi)' : 'Upper-Left (Recommended)'}</option>
                      <option value="safe-top-right">{isId ? 'Kanan Atas' : 'Upper-Right'}</option>
                      <option value="center-top">{isId ? 'Tengah Atas' : 'Center-Top'}</option>
                      <option value="safe-bottom-left">{isId ? 'Kiri Bawah' : 'Lower-Left'}</option>
                      <option value="safe-bottom-right">{isId ? 'Kanan Bawah' : 'Lower-Right'}</option>
                    </select>
                  </div>
                </div>

                {/* Live Badge Mini Preview */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">{isId ? 'Hasil Tampilan Badge:' : 'Badge Preview:'}</span>
                  <WatermarkBadge
                    text={watermarkText || 'DriaClip'}
                    style={watermarkStyle}
                    size="xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isId ? 'Simpan Perubahan' : 'Save Adjustments'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
