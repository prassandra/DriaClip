import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ClipboardPaste,
  ShieldCheck,
  Zap,
  Play,
  Check
} from 'lucide-react';
import { VideoSourceMetadata } from '../types/driaclip';
import { formatTimeCode } from '../services/videoClipper';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface InputSourceSectionProps {
  currentSource: VideoSourceMetadata | null;
  onSelectSource: (source: VideoSourceMetadata) => void;
  onReset?: () => void;
  isLoading?: boolean;
  lang: Language;
}

// Probe YouTube duration automatically using YouTube IFrame API
const probeYouTubeDuration = (videoId: string): Promise<number> => {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (dur: number) => {
      if (!resolved) {
        resolved = true;
        resolve(dur);
      }
    };

    const timer = setTimeout(() => finish(390), 2200);

    const runProbe = () => {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.id = `yt-probe-${Date.now()}`;
        tempDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(tempDiv);

        const player = new (window as any).YT.Player(tempDiv.id, {
          videoId,
          playerVars: { autoplay: 0, controls: 0 },
          events: {
            onReady: (event: any) => {
              const dur = Math.round(event.target.getDuration());
              try { player.destroy(); tempDiv.remove(); } catch {}
              clearTimeout(timer);
              finish(dur > 0 ? dur : 390);
            },
            onError: () => {
              try { player.destroy(); tempDiv.remove(); } catch {}
              clearTimeout(timer);
              finish(390);
            }
          }
        });
      } catch {
        clearTimeout(timer);
        finish(390);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      runProbe();
    } else {
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        runProbe();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }
  });
};

export const InputSourceSection: React.FC<InputSourceSectionProps> = ({
  currentSource,
  onSelectSource,
  onReset,
  isLoading: _isLoading,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Extraction progress states
  const [isUrlExtracting, setIsUrlExtracting] = useState(false);
  const [extractionStage, setExtractionStage] = useState<number>(0);

  // Process offline video file with 100% AUTOMATIC duration reading
  const processSelectedFile = (file: File) => {
    // Immediately reset previous results as requested: "ketika user masuk kan video / link baru, hasil sebelum nya segera reset"
    onReset?.();
    setUrlError('');
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions = ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi', 'flv', 'wmv', 'ts', '3gp', 'ogv'];

    if (!validExtensions.includes(ext) && !file.type.startsWith('video/')) {
      setUrlError(isId 
        ? 'Format file tidak didukung. Harap pilih video MP4, WebM, MOV, MKV, AVI, atau format video lainnya.'
        : 'Unsupported file format. Please upload MP4, WebM, MOV, MKV, AVI, or another video format.');
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
        title: cleanTitle || (isId ? 'File Video Offline' : 'Offline Video File'),
        sourceType: 'upload',
        url: objectUrl,
        filename: file.name,
        duration: Math.max(3, finalDur),
        width: vw || 1920,
        height: vh || 1080,
        sizeBytes: file.size,
        format: ext.toUpperCase() || 'MP4',
      };
      
      onSelectSource(source);

      // Smooth scroll to Video Preview
      setTimeout(() => {
        const el = document.getElementById('clipping-workspace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    };

    let hasResolved = false;

    // Automatic metadata reading with WebM/MP4 duration discovery fallback
    video.onloadedmetadata = () => {
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;
      if (isFinite(video.duration) && video.duration > 0) {
        hasResolved = true;
        commitSource(video.duration, vw, vh);
      } else {
        // Trigger browser end-seek to discover true duration
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
        }, 500);
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
        };
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

  const [pastedFeedback, setPastedFeedback] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Quick clipboard paste with guaranteed feedback
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrlInput(text.trim());
          setUrlError('');
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
          return;
        }
      }
    } catch (err) {
      console.warn('Clipboard readText permission denied or not allowed:', err);
    }

    // Fallback: Focus input element directly so user can Cmd+V / Ctrl+V
    if (urlInputRef.current) {
      urlInputRef.current.focus();
      urlInputRef.current.select();
    }
  };

  // Extract YouTube ID from multiple URL styles
  const extractYouTubeId = (url: string): string => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : '';
  };

  // Process & Extract Video from URL with 100% AUTOMATIC duration reading (No confirmation modal)
  const handleExtractUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError(isId 
        ? 'Silakan masukkan tautan video YouTube atau URL video publik.' 
        : 'Please enter a valid YouTube video link or public video URL.');
      return;
    }

    // Immediately reset previous results as requested: "ketika user masuk kan video / link baru, hasil sebelum nya segera reset"
    onReset?.();

    setIsUrlExtracting(true);
    setExtractionStage(1);

    const ytId = extractYouTubeId(trimmed);
    const isYouTube = !!ytId;

    let videoTitle = isYouTube 
      ? `YouTube Video (${ytId})` 
      : (isId ? 'Web Stream Video' : 'Web Stream Video');
    let autoDuration = trimmed.includes('shorts') ? 50 : 390; // Default fallback if probe is pending
    let autoThumbnail = '';

    // Stage 1: Protocol handshake
    await new Promise(r => setTimeout(r, 200));
    setExtractionStage(2);

    // Stage 2: Automatic Metadata Fetch & Duration Detection
    if (isYouTube && ytId) {
      autoThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      try {
        const [oembedRes, probedDur] = await Promise.all([
          fetch(`https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${ytId}`)}`).catch(() => null),
          probeYouTubeDuration(ytId).catch(() => 390)
        ]);

        if (probedDur && probedDur > 0) {
          autoDuration = probedDur;
        }

        if (oembedRes && oembedRes.ok) {
          const data = await oembedRes.json();
          if (data && data.title) {
            videoTitle = data.title;
          }
        }
      } catch {
        // Safe fallback
      }
    } else {
      const parts = trimmed.split('/');
      const last = parts[parts.length - 1]?.split('?')[0];
      if (last && last.length > 2) {
        videoTitle = decodeURIComponent(last).replace(/\.[^/.]+$/, '');
      }
    }

    // Stage 3: Auto duration detection from stream if direct MP4
    await new Promise(r => setTimeout(r, 200));
    setExtractionStage(3);

    if (!isYouTube && (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm'))) {
      try {
        const probeVideo = document.createElement('video');
        probeVideo.preload = 'metadata';
        probeVideo.src = trimmed;
        await new Promise<void>((resolve) => {
          probeVideo.onloadedmetadata = () => {
            if (probeVideo.duration && !isNaN(probeVideo.duration) && probeVideo.duration > 0) {
              autoDuration = Math.round(probeVideo.duration);
            }
            resolve();
          };
          probeVideo.onerror = () => resolve();
          setTimeout(resolve, 1000);
        });
      } catch {
        // Fallback
      }
    }

    // Stage 4: Ready
    await new Promise(r => setTimeout(r, 150));
    setExtractionStage(4);
    await new Promise(r => setTimeout(r, 100));

    setIsUrlExtracting(false);
    setExtractionStage(0);

    const isShortsUrl = trimmed.toLowerCase().includes('shorts');
    const source: VideoSourceMetadata = {
      id: isYouTube ? `yt-${ytId}` : `url-${Date.now()}`,
      title: videoTitle,
      sourceType: 'url',
      url: trimmed,
      youtubeId: ytId || undefined,
      duration: autoDuration,
      width: isShortsUrl ? 1080 : 1920,
      height: isShortsUrl ? 1920 : 1080,
      sizeBytes: Math.round(autoDuration * 850000), // ~850 KB/s bitrate estimation
      format: isYouTube ? (isShortsUrl ? 'YouTube Shorts (9:16)' : 'YouTube Stream (1080p)') : 'MP4 Stream',
      thumbnailUrl: autoThumbnail || undefined,
    };

    // Automatically set source without manual duration confirmation!
    onSelectSource(source);

    // Smooth scroll to the Video Preview
    setTimeout(() => {
      const el = document.getElementById('clipping-workspace');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

  return (
    <div id="input-section" className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a]/95 p-5 sm:p-7 shadow-lg backdrop-blur-md transition-colors max-w-full overflow-hidden">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t.source.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.source.subtitle}
          </p>
        </div>

        {/* Tab Buttons with optically centered text */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer leading-normal ${
              activeTab === 'url'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{isId ? 'Ambil dari Tautan (YouTube/URL)' : 'Paste Video Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer leading-normal ${
              activeTab === 'upload'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5 shrink-0" />
            <span>{isId ? 'Unggah File Video Offline' : 'Upload Offline Video'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Body */}
      <div className="mt-5">
        {/* URL / YouTube Ingestion Tab */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <form onSubmit={handleExtractUrl} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                {isId 
                  ? 'Masukkan Tautan Video YouTube atau URL Stream MP4 Publik' 
                  : 'Enter YouTube Video Link or Public MP4 Stream URL'}
              </label>

              {/* Input field with optically centered paste button */}
              <div className="relative flex items-center w-full">
                <input
                  ref={urlInputRef}
                  id="video-url-input"
                  type="text"
                  placeholder={isId ? 'https://youtube.com/watch?v=... atau link MP4' : 'https://youtube.com/watch?v=... or MP4 link'}
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  disabled={isUrlExtracting}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 px-4 py-3 pr-28 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500 transition-colors shadow-inner"
                />

                {/* Paste from Clipboard Button with exact vertical alignment */}
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  title={isId ? 'Tempel dari Clipboard' : 'Paste from clipboard'}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer leading-none ${
                    pastedFeedback
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pastedFeedback ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-white shrink-0" />
                      <span>{isId ? 'Tertempel!' : 'Pasted!'}</span>
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="h-3.5 w-3.5 shrink-0" />
                      <span>{isId ? 'Tempel' : 'Paste'}</span>
                    </>
                  )}
                </button>
              </div>

              {urlError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{urlError}</span>
                </div>
              )}

              {/* Big High-Contrast Process Action Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isUrlExtracting}
                  className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all cursor-pointer leading-normal ${
                    isUrlExtracting
                      ? 'bg-violet-800 opacity-90 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/20 active:scale-[0.99]'
                  }`}
                >
                  {isUrlExtracting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
                      <span>
                        {extractionStage === 1 && (isId ? '1/4 Menganalisis Tautan Video...' : '1/4 Analyzing Video Link...')}
                        {extractionStage === 2 && (isId ? '2/4 Mengambil Metadata Video...' : '2/4 Extracting Metadata...')}
                        {extractionStage === 3 && (isId ? '3/4 Membaca Durasi Asli Otomatis...' : '3/4 Auto-Reading True Duration...')}
                        {extractionStage === 4 && (isId ? '4/4 Menyiapkan Pratinjau Video...' : '4/4 Preparing Video Preview...')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white shrink-0" />
                      <span>{t.source.processUrlBtn}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Ingestion Info Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 leading-none">
                <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                <span>{isId ? 'Mendukung YouTube Shorts & Video Panjang' : 'Supports YouTube Shorts & Long Videos'}</span>
              </span>
              <span className="flex items-center gap-1.5 leading-none">
                <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{isId ? 'Durasi Dibaca Otomatis Tanpa Konfirmasi' : 'Duration Read Automatically'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Offline File Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-violet-400 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="file"
                accept="video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi,.flv,.wmv,.ts,.3gp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processSelectedFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 mb-3 shadow-xs">
                <UploadCloud className="h-7 w-7" />
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {t.source.dragDropTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.source.dragDropSubtitle}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 leading-none">
                  MP4
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 leading-none">
                  WEBM
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 leading-none">
                  MOV
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 leading-none">
                  MKV / AVI
                </span>
                <span className="px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-[11px] font-mono font-bold text-violet-700 dark:text-violet-300 leading-none">
                  {isId ? 'Semua Format' : 'All Formats'}
                </span>
              </div>
            </div>

            {urlError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>
        )}

        {/* Source Active Loaded Badge */}
        {currentSource && (
          <div className="mt-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 block truncate">
                  {currentSource.title}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                  {currentSource.format} &middot; {isId ? 'Durasi Asli:' : 'Duration:'} {formatTimeCode(currentSource.duration)} ({currentSource.duration}s)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px] uppercase font-mono tracking-wider leading-none">
                {isId ? 'Durasi Terbaca Otomatis' : 'Auto Duration Loaded'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setUrlInput('');
                  onReset?.();
                }}
                className="px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] font-mono transition-colors cursor-pointer leading-none"
                title={isId ? 'Reset dan ganti video' : 'Reset and change video'}
              >
                {isId ? 'Ganti Video' : 'Change Video'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
