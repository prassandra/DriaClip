import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Trash2, 
  BookmarkPlus, 
  Video, 
  Layers,
  Sparkles,
  Film,
  ExternalLink,
  Clock,
  Scissors
} from 'lucide-react';
import { VideoSourceMetadata, SplitMarker, GeneratedClip } from '../types/driaclip';
import { formatTimeCode } from '../services/videoClipper';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface VideoTimelineScrubberProps {
  source: VideoSourceMetadata | null;
  markers: SplitMarker[];
  onAddMarker: (time: number) => void;
  onRemoveMarker: (id: string) => void;
  generatedClips: GeneratedClip[];
  onSelectClipPreview?: (clip: GeneratedClip) => void;
  isCustomMarkerMode: boolean;
  lang: Language;
  onUpdateDuration?: (newDuration: number) => void;
  onUpdateDimensions?: (width: number, height: number) => void;
}

export const VideoTimelineScrubber: React.FC<VideoTimelineScrubberProps> = ({
  source,
  markers,
  onAddMarker,
  onRemoveMarker,
  generatedClips: _generatedClips,
  onSelectClipPreview: _onSelectClipPreview,
  isCustomMarkerMode,
  lang,
  onUpdateDuration,
  onUpdateDimensions,
}) => {
  const t = TRANSLATIONS[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(source?.duration || 300);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editDurationVal, setEditDurationVal] = useState(String(source?.duration || 600));
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Dynamic detected dimensions state that updates on video metadata load
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({
    width: source?.width || 1920,
    height: source?.height || 1080,
  });

  useEffect(() => {
    if (source?.width && source?.height) {
      setVideoDims({ width: source.width, height: source.height });
    }
  }, [source?.width, source?.height, source?.id]);

  // Dynamic portrait vs landscape canvas adaptation according to imported video
  const isPortrait = videoDims.height > videoDims.width || (source?.url?.toLowerCase().includes('shorts') ?? false);

  // Detect YouTube ID from source metadata or URL
  const youtubeId = source?.youtubeId || (() => {
    if (!source?.url) return '';
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = source.url.match(regExp);
    return match ? match[1] : '';
  })();

  const isYouTube = !!youtubeId;

  // Automatically detect exact YouTube duration when loaded in timeline
  useEffect(() => {
    if (youtubeId) {
      const initYT = () => {
        if ((window as any).YT && (window as any).YT.Player) {
          try {
            new (window as any).YT.Player('main-timeline-yt', {
              events: {
                onReady: (e: any) => {
                  const d = Math.round(e.target.getDuration());
                  if (d > 0) {
                    setDuration(d);
                    onUpdateDuration?.(d);
                  }
                },
                onStateChange: (e: any) => {
                  const d = Math.round(e.target.getDuration());
                  if (d > 0) {
                    setDuration(d);
                    onUpdateDuration?.(d);
                  }
                }
              }
            });
          } catch {}
        }
      };

      if ((window as any).YT && (window as any).YT.Player) {
        initYT();
      } else {
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (typeof prev === 'function') prev();
          initYT();
        };
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(tag);
        }
      }
    }
  }, [youtubeId]);

  // Sync duration when source changes
  useEffect(() => {
    if (source && source.duration && source.duration > 0) {
      setDuration(source.duration);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [source?.id, source?.duration, source?.url]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (isFinite(videoRef.current.duration) && videoRef.current.duration > 0 && Math.abs(duration - videoRef.current.duration) > 1) {
        setDuration(Math.round(videoRef.current.duration));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      if (vw > 0 && vh > 0) {
        setVideoDims({ width: vw, height: vh });
        onUpdateDimensions?.(vw, vh);
      }
      if (isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
        const d = Math.round(videoRef.current.duration);
        setDuration(d);
        onUpdateDuration?.(d);
      }
    } else if (source?.duration && source.duration > 0) {
      setDuration(source.duration);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
      setDuration(Math.round(videoRef.current.duration));
    }
  };

  // Sync DOM property muted with React state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = async () => {
    if (!videoRef.current) return;

    // Guard: Prevent play() if no valid video source exists or video has errored
    if (!source?.url || videoRef.current.error || videoRef.current.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      console.warn('[DriaClip] No playable video source available on timeline');
      setIsPlaying(false);
      return;
    }

    if (videoRef.current.paused) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        if (err?.name === 'NotSupportedError' || err?.message?.includes('no supported sources')) {
          console.warn('[DriaClip] Video playback format not supported by browser engine:', err?.message);
          setIsPlaying(false);
          return;
        }
        console.warn('Playback with audio blocked by browser policy, retrying muted:', err);
        if (videoRef.current && !videoRef.current.error) {
          videoRef.current.muted = true;
          setIsMuted(true);
          try {
            await videoRef.current.play();
            setIsPlaying(true);
          } catch (e2: any) {
            console.warn('[DriaClip] Playback could not be started:', e2?.message || e2);
            setIsPlaying(false);
          }
        }
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (newTime: number) => {
    const safeTime = Math.max(0, Math.min(duration, newTime));
    setCurrentTime(safeTime);
    if (videoRef.current) {
      const maxVideoTime = (videoRef.current.duration && isFinite(videoRef.current.duration) && videoRef.current.duration > 0)
        ? videoRef.current.duration
        : duration;
      videoRef.current.currentTime = Math.max(0, Math.min(maxVideoTime, safeTime));
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(fraction * duration);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleAddMarkerCurrent = () => {
    onAddMarker(Math.round(currentTime));
  };

  const percentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Empty state when no source is loaded
  if (!source) {
    return (
      <div id="clipping-workspace" className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f172a]/95 p-5 sm:p-7 shadow-lg backdrop-blur-md space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span>{t.timeline.title}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.timeline.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0b0f19]/60 p-8 sm:p-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 mb-3 shadow-xs">
            <Film className="h-7 w-7" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-200">
            {t.timeline.emptyTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            {t.timeline.emptyDesc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="clipping-workspace" className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f172a]/95 p-4 sm:p-6 shadow-lg backdrop-blur-md space-y-5 transition-colors max-w-full overflow-hidden">
      {/* Video Header & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{t.timeline.title}</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
            <span className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-xs">
              {source.title}
            </span>
            <span>&middot;</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {source.format}
            </span>
            <span>&middot;</span>
            {isEditingDuration ? (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-lg border border-violet-400">
                <span className="text-[11px] text-slate-500">{lang === 'id' ? 'Durasi:' : 'Duration:'}</span>
                <input
                  type="number"
                  min="5"
                  value={editDurationVal}
                  onChange={(e) => setEditDurationVal(e.target.value)}
                  className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600"
                />
                <span className="text-[11px] text-slate-500">{lang === 'id' ? 'detik' : 'seconds'}</span>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(editDurationVal);
                    if (!isNaN(parsed) && parsed > 0) {
                      setDuration(parsed);
                      onUpdateDuration?.(parsed);
                    }
                    setIsEditingDuration(false);
                  }}
                  className="px-2 py-0.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-[11px] font-bold cursor-pointer"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDuration(false)}
                  className="px-1.5 py-0.5 text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                >
                  {lang === 'id' ? 'Batal' : 'Cancel'}
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>{lang === 'id' ? 'Durasi:' : 'Duration:'} <strong className="text-slate-900 dark:text-slate-100">{formatTimeCode(duration)}</strong> ({duration}s)</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditDurationVal(String(duration));
                    setIsEditingDuration(true);
                  }}
                  className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline cursor-pointer font-sans"
                  title={lang === 'id' ? 'Ubah durasi video jika berbeda' : 'Edit video duration'}
                >
                  {lang === 'id' ? '(Ubah)' : '(Edit)'}
                </button>
              </span>
            )}
          </div>
        </div>

        {isCustomMarkerMode && (
          <button
            type="button"
            onClick={handleAddMarkerCurrent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-xs font-semibold text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700 transition-colors cursor-pointer shadow-xs"
          >
            <BookmarkPlus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{lang === 'id' ? 'Tambah Titik Potong @' : 'Add Cut Marker @'} {formatTimeCode(currentTime)}</span>
          </button>
        )}
      </div>

      {/* Main Video Viewport: YouTube Iframe vs HTML5 Video (Dynamically adapts to portrait or landscape) */}
      <div className={`relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-2xl group transition-all duration-300 ${
        isPortrait ? 'max-w-[320px] sm:max-w-[360px] mx-auto aspect-[9/16]' : 'w-full aspect-video'
      }`}>
        {isYouTube ? (
          /* Official YouTube Embedded Player with Full Playback, Audio, and Video Stream */
          <iframe
            id="main-timeline-yt"
            key={youtubeId}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3`}
            title={source.title}
            className="w-full h-full border-0 rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={(e) => {
              try {
                const cw = e.currentTarget.contentWindow;
                cw?.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: ['captions'] }), '*');
                cw?.postMessage(JSON.stringify({ event: 'command', func: 'setOption', args: ['captions', 'track', {}] }), '*');
                cw?.postMessage(JSON.stringify({ event: 'command', func: 'setOption', args: ['cc', 'track', {}] }), '*');
              } catch {}
            }}
          />
        ) : (
          /* HTML5 Video Player for Offline Uploads or Direct MP4/WebM URLs */
          <>
            <video
              ref={videoRef}
              src={source.url}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.warn('[DriaClip] Timeline video error caught gracefully:', e);
                setIsPlaying(false);
              }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onDurationChange={handleDurationChange}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              preload="auto"
              onClick={togglePlay}
            />

            {/* Big Center Play Overlay Button */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-violet-600/90 text-white backdrop-blur-xs transition-all hover:scale-110 hover:bg-violet-500 shadow-xl cursor-pointer"
                aria-label="Play Video"
              >
                <Play className="h-7 w-7 fill-white translate-x-0.5" />
              </button>
            )}

            {/* Bottom Floating Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 flex flex-col gap-2 text-white text-xs opacity-95 group-hover:opacity-100 transition-opacity">
              {/* Range Slider for Live Duration Scrubbing */}
              <div className="w-full flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-violet-500 hover:accent-violet-400 bg-white/25 rounded-lg cursor-pointer"
                  title={lang === 'id' ? 'Geser durasi saat memutar video' : 'Scrub video duration'}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeek(0)}
                    className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                    title="Reset ke awal"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-[11px]">
                    {formatTimeCode(currentTime)} / {formatTimeCode(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <div className="flex items-center gap-1 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded">
                    {[1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSpeedChange(s)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${playbackSpeed === s ? 'bg-violet-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Timeline Navigation Scrubber Bar (Only scrubber track, no playhead text or quick seek) */}
      {isCustomMarkerMode && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {lang === 'id' ? 'Titik Potong Timeline:' : 'Timeline Cut Markers:'}
            </span>
            <span className="text-[11px]">
              {lang === 'id' ? 'Klik timeline untuk navigasi titik potong' : 'Click timeline to navigate markers'}
            </span>
          </div>

          {/* Scrubber Track */}
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            className="relative h-6 w-full rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 cursor-pointer overflow-hidden shadow-inner group/timeline"
          >
            {/* Progress fill */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-80"
              style={{ width: `${percentProgress}%` }}
            />

            {/* Marker pins */}
            {markers.map((m) => {
              const markerPos = duration > 0 ? (m.time / duration) * 100 : 0;
              return (
                <div
                  key={m.id}
                  style={{ left: `${markerPos}%` }}
                  className="absolute top-0 bottom-0 w-1.5 bg-amber-400 z-10 hover:w-2 transition-all shadow-xs"
                  title={`Marker: ${formatTimeCode(m.time)}`}
                />
              );
            })}

            {/* Draggable Playhead Pin */}
            <div
              style={{ left: `${percentProgress}%` }}
              className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full -translate-x-1/2 shadow-md z-20 pointer-events-none group-hover/timeline:scale-110 transition-transform"
            />
          </div>
        </div>
      )}

      {/* Custom Marker List (When in Custom Cut Points mode) */}
      {isCustomMarkerMode && markers.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>{lang === 'id' ? `Titik Potong Kustom Terpasang (${markers.length})` : `Custom Cut Markers (${markers.length})`}</span>
            <span className="text-[11px] text-slate-500 font-normal">
              {lang === 'id' ? 'Klik waktu untuk melompat' : 'Click time to seek'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {markers.map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => handleSeek(m.time)}
                  className="font-mono font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  #{idx + 1} {formatTimeCode(m.time)}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveMarker(m.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                  title={lang === 'id' ? 'Hapus titik potong' : 'Remove marker'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
