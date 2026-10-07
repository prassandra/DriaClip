import React, { useState } from 'react';
import { X, Check, Clock, Edit3, Sparkles, MoveHorizontal } from 'lucide-react';
import { GeneratedClip, VideoSourceMetadata } from '../types/driaclip';
import { formatTimeCode } from '../services/videoClipper';
import { Language } from '../i18n/translations';

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

  const duration = Math.max(1, endTime - startTime);

  const handleNudgeStart = (delta: number) => {
    const next = Math.max(0, Math.min(endTime - 3, startTime + delta));
    setStartTime(next);
  };

  const handleNudgeEnd = (delta: number) => {
    const next = Math.min(maxSourceDuration, Math.max(startTime + 3, endTime + delta));
    setEndTime(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) {
      alert('End time must be after start time.');
      return;
    }

    onSave({
      ...clip,
      title: title.trim() || clip.title,
      hookText: hookText.trim() || clip.hookText,
      startTime: Math.round(startTime),
      endTime: Math.round(endTime),
      duration: Math.round(endTime - startTime),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
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

          {/* AI Auto-Follow & Face Detector Status */}
          {clip.verticalStyle === 'auto-track' && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{isId ? 'AI Auto-Follow & Face Detector Aktif' : 'AI Auto-Follow & Face Detector Active'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600/50">
                  {isId ? 'Otomatis' : 'Automatic'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {isId
                  ? 'Kamera 9:16 otomatis mendeteksi wajah dan mengarahkan fokus ke orang yang sedang aktif berbicara sepanjang durasi klip tanpa perlu menggeser frame secara manual.'
                  : 'The 9:16 camera automatically tracks faces and locks onto the active speaker throughout the clip without manual adjustments.'}
              </p>
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
