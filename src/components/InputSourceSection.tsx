import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Film,
  HardDrive,
  FolderOpen,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { VideoSourceMetadata } from '../types/driaclip';
import { formatTimeCode } from '../services/videoClipper';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { AdSenseSlot } from './AdSenseSlot';

interface InputSourceSectionProps {
  currentSource: VideoSourceMetadata | null;
  onSelectSource: (source: VideoSourceMetadata) => void;
  onReset?: () => void;
  isLoading?: boolean;
  lang: Language;
}

export const InputSourceSection: React.FC<InputSourceSectionProps> = ({
  currentSource,
  onSelectSource,
  onReset,
  isLoading: _isLoading,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Process video file from device storage with automatic duration & dimension reading
  const processSelectedFile = (file: File) => {
    // Reset previous generated state
    onReset?.();
    setErrorMessage('');
    setIsReadingFile(true);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions = ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi', 'flv', 'wmv', 'ts', '3gp', 'ogv'];

    if (!validExtensions.includes(ext) && !file.type.startsWith('video/')) {
      setIsReadingFile(false);
      setErrorMessage(
        isId 
          ? 'Format berkas tidak didukung. Harap pilih berkas video seperti MP4, WebM, MOV, MKV, AVI, dsb.'
          : 'Unsupported file format. Please select a video file like MP4, WebM, MOV, MKV, AVI, etc.'
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = objectUrl;

    const commitSource = (rawDuration: number, vw: number = 1920, vh: number = 1080) => {
      let finalDur = 60;
      if (isFinite(rawDuration) && !isNaN(rawDuration) && rawDuration > 0) {
        finalDur = Math.round(rawDuration);
      }
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

      const source: VideoSourceMetadata = {
        id: `upload-${Date.now()}`,
        title: cleanTitle || (isId ? 'Berkas Video Storage' : 'Storage Video File'),
        sourceType: 'upload',
        url: objectUrl,
        filename: file.name,
        duration: Math.max(3, finalDur),
        width: vw || 1920,
        height: vh || 1080,
        sizeBytes: file.size,
        format: ext.toUpperCase() || 'MP4',
        file: file,
      };
      
      setIsReadingFile(false);
      onSelectSource(source);

      // Smooth scroll to Video Preview
      setTimeout(() => {
        const el = document.getElementById('clipping-workspace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    };

    let hasResolved = false;

    video.onloadedmetadata = () => {
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;
      if (isFinite(video.duration) && video.duration > 0) {
        hasResolved = true;
        commitSource(video.duration, vw, vh);
      } else {
        // Trigger seek to discover true duration
        video.currentTime = 1e10;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          video.currentTime = 0;
          if (!hasResolved) {
            hasResolved = true;
            commitSource(video.duration, video.videoWidth || vw, video.videoHeight || vh);
          }
        };
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            commitSource(video.duration || 120, video.videoWidth || vw, video.videoHeight || vh);
          }
        }, 600);
      }
    };

    video.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        const source: VideoSourceMetadata = {
          id: `upload-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          sourceType: 'upload',
          url: objectUrl,
          filename: file.name,
          duration: 180,
          width: 1920,
          height: 1080,
          sizeBytes: file.size,
          format: ext.toUpperCase() || 'MP4',
          file: file,
        };
        setIsReadingFile(false);
        onSelectSource(source);
      }
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleOpenStoragePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div id="input-source" className="w-full scroll-mt-20">
      <div id="input-section" className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a]/95 p-5 sm:p-7 shadow-lg backdrop-blur-md transition-colors max-w-full overflow-hidden">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span>{isId ? 'Pilih Berkas Video dari Penyimpanan' : 'Select Video File from Storage'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isId 
                ? 'Hanya menerima berkas video dari galeri / penyimpanan perangkat Anda (MP4, WebM, MOV, MKV hingga 2GB).' 
                : 'Only accepts video files from your device storage or gallery (MP4, WebM, MOV, MKV up to 2GB).'}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/80 text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>{isId ? 'Penyimpanan Lokal • Privasi Terjamin' : 'Local Storage • Privacy Assured'}</span>
          </div>
        </div>

        {/* File Dropzone Area */}
        <div className="mt-5 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleOpenStoragePicker}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer group ${
              dragActive
                ? 'border-violet-500 bg-violet-50/60 dark:bg-violet-950/30 scale-[1.005]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-violet-400 dark:hover:border-violet-600/70 hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi,.flv,.wmv,.ts,.3gp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processSelectedFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 mb-4 shadow-sm group-hover:scale-105 group-hover:border-violet-400 transition-transform">
              {isReadingFile ? (
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-violet-600 border-t-transparent" />
              ) : (
                <UploadCloud className="h-8 w-8" />
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {isReadingFile 
                ? (isId ? 'Sedang Membaca Berkas Video...' : 'Reading Video File...') 
                : (isId ? 'Klik untuk Memilih Berkas Video dari Storage' : 'Click to Select Video File from Storage')}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
              {isId 
                ? 'atau seret & lepas berkas video ke area ini. Berkas langsung diproses di perangkat tanpa diunggah ke pihak ketiga.'
                : 'or drag and drop a video file here. Videos are processed directly on your device with complete privacy.'}
            </p>

            {/* Storage browse action button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenStoragePicker();
                }}
                disabled={isReadingFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-violet-500/20 cursor-pointer active:scale-95 transition-all"
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span>{isId ? 'Buka Berkas Penyimpanan / Galeri' : 'Browse Storage / Gallery'}</span>
              </button>
            </div>

            {/* Supported Format Tags */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {['MP4', 'WEBM', 'MOV', 'MKV', 'AVI', 'TS', '3GP'].map((fmt) => (
                <span 
                  key={fmt}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 leading-none shadow-2xs"
                >
                  {fmt}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 text-[11px] font-mono font-bold text-violet-700 dark:text-violet-300 leading-none">
                {isId ? 'Hingga 2 GB' : 'Up to 2 GB'}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 font-medium animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Source Metadata Card */}
          {currentSource && (
            <div className="mt-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <Film className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block truncate text-sm">
                    {currentSource.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-400 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/50 font-bold uppercase">
                      {currentSource.format}
                    </span>
                    <span>&middot;</span>
                    <span>{isId ? 'Durasi:' : 'Duration:'} <strong>{formatTimeCode(currentSource.duration)}</strong> ({currentSource.duration}s)</span>
                    {currentSource.sizeBytes ? (
                      <>
                        <span>&middot;</span>
                        <span>{formatFileSize(currentSource.sizeBytes)}</span>
                      </>
                    ) : null}
                    {currentSource.width && currentSource.height ? (
                      <>
                        <span>&middot;</span>
                        <span>{currentSource.width}x{currentSource.height}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px] uppercase font-mono tracking-wider leading-none shadow-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{isId ? 'Berkas Siap Dipotong' : 'Ready to Clip'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenStoragePicker();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer leading-none shadow-2xs"
                  title={isId ? 'Pilih berkas video lain dari storage' : 'Pick another video file from storage'}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{isId ? 'Ganti Berkas' : 'Change File'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Google AdSense Slot — Terpasang Langsung pada Menu Input Sumber Video */}
          <div className="pt-2">
            <AdSenseSlot slotId="5462390377" creativeIndex={1} />
          </div>
        </div>
      </div>
    </div>
  );
};
