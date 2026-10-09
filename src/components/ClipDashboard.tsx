import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Archive, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Smartphone, 
  Monitor, 
  Square, 
  Sliders, 
  Check, 
  Sparkles, 
  Flame, 
  Copy,
  Video,
  ExternalLink,
  Scissors,
  X,
  AlertCircle,
  FileVideo,
  MoveHorizontal,
  Cookie
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  formatTimeCode, 
  downloadClipAsMp4, 
  renderClipBlob, 
  createDownloadableClipBlob, 
  calculateClipThumbnailTime,
  downloadServerRenderedClip,
  downloadServerRenderedLocalClip 
} from '../services/videoClipper';
import { GeneratedClip, VideoSourceMetadata } from '../types/driaclip';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';

interface ClipDashboardProps {
  clips: GeneratedClip[];
  source: VideoSourceMetadata | null;
  onPreviewClip: (clip: GeneratedClip) => void;
  onFineTuneClip: (clip: GeneratedClip) => void;
  onUpdateClipCrop?: (clipId: string, cropX: number) => void;
  onSelectSampleVideo?: (sample: any) => void;
  lang: Language;
  onOpenYouTubeCookiesModal?: () => void;
  onAttachVideoFile?: (file: File) => void;
}

interface ClipCardItemProps {
  clip: GeneratedClip;
  index: number;
  source: VideoSourceMetadata | null;
  onPreviewClip: (clip: GeneratedClip) => void;
  onFineTuneClip: (clip: GeneratedClip) => void;
  onDownloadSingle: (clip: GeneratedClip) => void;
  onCopyHook: (clip: GeneratedClip) => void;
  onUpdateClipCrop?: (clipId: string, cropX: number) => void;
  isCopied: boolean;
  isRendering: boolean;
  renderingPercent: number;
  isId: boolean;
  t: any;
  activePlayingId: string | null;
  onSetActivePlayingId: (id: string | null) => void;
}

const ClipCardItem: React.FC<ClipCardItemProps> = ({
  clip,
  index,
  source,
  onPreviewClip,
  onFineTuneClip,
  onDownloadSingle,
  onCopyHook,
  onUpdateClipCrop,
  isCopied,
  isRendering,
  renderingPercent,
  isId,
  t,
  activePlayingId,
  onSetActivePlayingId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isBlob = !!clip.videoBlobUrl;
  const boundaryStart = isBlob ? 0 : clip.startTime;
  const boundaryEnd = isBlob ? clip.duration : clip.endTime;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [clipCurrentTime, setClipCurrentTime] = useState(boundaryStart);
  const [showControls, setShowControls] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isVertical = clip.aspectRatio === '9:16';
  const isSquare = clip.aspectRatio === '1:1';
  const startThumbSecond = calculateClipThumbnailTime(clip.startTime, clip.endTime);

  const videoSrc = clip.videoBlobUrl || source?.url || '';
  const isYouTube = !!source?.youtubeId && !clip.videoBlobUrl;

  // Auto detect if source video is 16:9 landscape vs 9:16 portrait
  const isSourceLandscape = source
    ? (source.width && source.height ? source.width > source.height : !source.url?.includes('shorts'))
    : true;

  const [ytElapsed, setYtElapsed] = useState(0);
  const [ytOffset, setYtOffset] = useState(0);
  const [ytIframeKey, setYtIframeKey] = useState(0);

  // Fixed center-crop (tengah-tengah frame)
  const activeCropX = 50;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    if (isYouTube) {
      setYtElapsed(val);
      setYtOffset(val);
      setYtIframeKey((k) => k + 1);
      setIsPlaying(true);
      onSetActivePlayingId(clip.id);
      return;
    }
    if (!videoRef.current) return;
    const target = boundaryStart + val;
    videoRef.current.currentTime = target;
    setClipCurrentTime(target);
  };

  // Sync DOM property muted with React state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Pause when another clip starts playing
  useEffect(() => {
    if (activePlayingId && activePlayingId !== clip.id) {
      if (isPlaying) {
        setIsPlaying(false);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    }
  }, [activePlayingId, clip.id, isPlaying]);

  // For YouTube playback: track elapsed within clip boundaries smoothly without reloading iframe
  useEffect(() => {
    let interval: any = null;
    if (isYouTube && isPlaying) {
      interval = setInterval(() => {
        setYtElapsed((prev) => {
          const next = Math.round((prev + 0.1) * 10) / 10;
          if (next >= clip.duration) {
            setTimeout(() => {
              setIsPlaying(false);
              onSetActivePlayingId(null);
              setYtOffset(0);
            }, 0);
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isYouTube, isPlaying, clip.duration, onSetActivePlayingId]);

  // Initialize playback time to boundaryStart
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      if (Math.abs(videoRef.current.currentTime - boundaryStart) > 0.3) {
        videoRef.current.currentTime = boundaryStart;
      }
      setClipCurrentTime(boundaryStart);
    }
  }, [boundaryStart, videoSrc, isPlaying]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && !isPlaying) {
      if (Math.abs(videoRef.current.currentTime - boundaryStart) > 0.5) {
        videoRef.current.currentTime = boundaryStart;
      }
      setClipCurrentTime(boundaryStart);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setClipCurrentTime(cur);

    // Strict boundary enforcement: pause and reset when reaching boundaryEnd
    if (cur >= boundaryEnd) {
      videoRef.current.pause();
      setIsPlaying(false);
      setTimeout(() => onSetActivePlayingId(null), 0);
      videoRef.current.currentTime = boundaryStart;
      setClipCurrentTime(boundaryStart);
    }
  };

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube) {
      const next = !isPlaying;
      setIsPlaying(next);
      if (next) onSetActivePlayingId(clip.id);
      else onSetActivePlayingId(null);
      return;
    }

    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      onSetActivePlayingId(clip.id);
      const cur = videoRef.current.currentTime;
      if (cur < boundaryStart || cur >= boundaryEnd - 0.15) {
        videoRef.current.currentTime = boundaryStart;
        setClipCurrentTime(boundaryStart);
      }
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback audio blocked, attempting muted playback:', err);
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          try {
            await videoRef.current.play();
            setIsPlaying(true);
          } catch (e2) {
            console.error('Playback failed completely:', e2);
            setIsPlaying(false);
            onSetActivePlayingId(null);
          }
        }
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      onSetActivePlayingId(null);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const resetToStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube) {
      setYtElapsed(0);
      setYtOffset(0);
      setYtIframeKey((k) => k + 1);
      setIsPlaying(true);
      onSetActivePlayingId(clip.id);
      return;
    }

    if (!videoRef.current) return;
    onSetActivePlayingId(clip.id);
    videoRef.current.currentTime = boundaryStart;
    setClipCurrentTime(boundaryStart);
    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch {
      videoRef.current.muted = true;
      setIsMuted(true);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleScrubClip = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (clip.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (isYouTube) {
      const newElapsed = Math.round(ratio * clip.duration);
      setYtElapsed(newElapsed);
      setYtOffset(newElapsed);
      setYtIframeKey((k) => k + 1);
      setIsPlaying(true);
      return;
    }

    if (!videoRef.current) return;
    const target = boundaryStart + ratio * (boundaryEnd - boundaryStart);
    videoRef.current.currentTime = target;
    setClipCurrentTime(target);
  };

  const activeElapsed = isYouTube 
    ? ytElapsed 
    : Math.max(0, Math.min(clip.duration, clipCurrentTime - boundaryStart));
  const activeProgressPercent = clip.duration > 0 ? (activeElapsed / clip.duration) * 100 : 0;

  return (
    <div
      onMouseEnter={() => { setIsHovered(true); setShowControls(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowControls(false); }}
      className="group relative flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0b0f19] overflow-hidden shadow-sm hover:border-violet-500/70 hover:shadow-xl transition-all"
    >
      {/* Video Player Container */}
      <div 
        className={`relative overflow-hidden bg-black flex items-center justify-center ${
          isVertical ? 'aspect-[9/16]' : isSquare ? 'aspect-square' : 'aspect-video'
        }`}
      >
        {isYouTube ? (
          /* YouTube Embed Player */
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
            {isPlaying ? (
              isVertical && clip.verticalStyle === 'blur-background' ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                  <img
                    src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-70 pointer-events-none"
                  />
                  <div className="relative z-10 w-full aspect-video shadow-2xl">
                    <iframe
                      key={ytIframeKey}
                      src={`https://www.youtube.com/embed/${source?.youtubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
                      title={clip.title}
                      className="w-full h-full border-0"
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
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(false);
                      onSetActivePlayingId(null);
                    }}
                    className="absolute top-2 right-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black border border-white/20 transition-all cursor-pointer shadow-lg"
                    title={isId ? 'Tutup Pemutar' : 'Close Player'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : isVertical && clip.verticalStyle === 'letterbox' ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <div className="relative z-10 w-full aspect-video shadow-2xl">
                    <iframe
                      key={ytIframeKey}
                      src={`https://www.youtube.com/embed/${source?.youtubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
                      title={clip.title}
                      className="w-full h-full border-0"
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
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(false);
                      onSetActivePlayingId(null);
                    }}
                    className="absolute top-2 right-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black border border-white/20 transition-all cursor-pointer shadow-lg"
                    title={isId ? 'Tutup Pemutar' : 'Close Player'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                  {/* Soft blurred background for vertical center crop */}
                  {isVertical && (
                    <>
                      <img
                        src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-65 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                    </>
                  )}
                  <div 
                    className="relative overflow-hidden flex items-center justify-center w-full h-full"
                    style={
                      isSourceLandscape
                        ? isVertical
                          ? { 
                              width: '316.05%', 
                              height: '100%', 
                              position: 'absolute', 
                              top: 0, 
                              left: '-108.025%',
                              transform: `scale(${1.0 - ((clip.zoomOutPercent ?? 20) / 100) * 0.40})`,
                              transformOrigin: 'center center'
                            }
                          : isSquare
                          ? { 
                              width: '177.78%', 
                              height: '100%', 
                              position: 'absolute', 
                              top: 0, 
                              left: '-38.89%',
                            }
                          : { width: '100%', height: '100%' }
                        : { width: '100%', height: '100%' }
                    }
                  >
                    <iframe
                      key={ytIframeKey}
                      src={`https://www.youtube.com/embed/${source?.youtubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
                      title={clip.title}
                      className="w-full h-full border-0"
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
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(false);
                      onSetActivePlayingId(null);
                    }}
                    className="absolute top-2 right-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black border border-white/20 transition-all cursor-pointer shadow-lg"
                    title={isId ? 'Tutup Pemutar' : 'Close Player'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            ) : (
              <div 
                onClick={() => { setIsPlaying(true); setYtElapsed(0); onSetActivePlayingId(clip.id); }}
                className="relative w-full h-full cursor-pointer flex items-center justify-center"
              >
                {/* Thumbnail Start Time Badge */}
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-xs border border-violet-500/50 text-[11px] font-mono font-bold text-violet-300 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span>{isId ? 'Mulai' : 'Start'}: {formatTimeCode(clip.startTime)}</span>
                </div>

                {clip.thumbnailBlobUrl ? (
                  <img
                    src={clip.thumbnailBlobUrl}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Video className="h-8 w-8 text-violet-400" />
                    <span className="text-xs font-mono">DriaClip</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/95 text-white shadow-lg transform transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 fill-white translate-x-0.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    {isId ? 'Putar Klip' : 'Play Clip'} {index + 1} ({clip.duration}s)
                  </span>
                </div>
              </div>
            )}

            {/* Video Controls Overlay for YouTube when playing */}
            {isPlaying && (
              <div 
                className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2.5 flex flex-col gap-1.5 transition-opacity z-20 ${
                  isPlaying || isHovered || showControls ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Seek Range Slider for scrubbing during play */}
                <div className="w-full flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0"
                    max={clip.duration || 60}
                    step="0.5"
                    value={activeElapsed}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 accent-violet-500 hover:accent-violet-400 bg-white/30 rounded-lg cursor-pointer"
                    title={isId ? 'Geser untuk pindah durasi saat memutar' : 'Scrub clip position'}
                  />
                </div>

                {/* Controls bar */}
                <div className="flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                      title={isPlaying ? (isId ? 'Jeda' : 'Pause') : (isId ? 'Putar' : 'Play')}
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    </button>

                    <button
                      type="button"
                      onClick={resetToStart}
                      className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                      title={isId ? 'Ulangi dari awal klip' : 'Restart clip'}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>

                    <span className="font-mono text-[11px] font-bold text-violet-300">
                      {formatTimeCode(activeElapsed)} / {formatTimeCode(clip.duration)}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-300">
                    {formatTimeCode(clip.startTime + activeElapsed)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* HTML5 Native Video Player */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Start timestamp badge when paused */}
            {!isPlaying && (
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-xs border border-violet-500/50 text-[11px] font-mono font-bold text-violet-300 shadow-md pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span>{isId ? 'Mulai' : 'Start'}: {formatTimeCode(clip.startTime)}</span>
              </div>
            )}

            {/* Strategic DriaClip Watermark Indicator */}
            {clip.watermark !== false && !isPlaying && (
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-xs border border-violet-500/50 text-[10px] font-bold text-white shadow-md pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>DriaClip</span>
              </div>
            )}

            {isVertical && (clip.verticalStyle === 'blur-background' || clip.verticalStyle === 'center-crop' || !clip.verticalStyle) && (
              <>
                <img
                  src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-65 pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
              </>
            )}

            {isVertical && clip.verticalStyle === 'letterbox' && (
              <div className="absolute inset-0 bg-black pointer-events-none" />
            )}

            <video
              ref={videoRef}
              src={videoSrc}
              poster={clip.thumbnailBlobUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                if (videoRef.current) {
                  videoRef.current.currentTime = boundaryStart;
                  setClipCurrentTime(boundaryStart);
                }
              }}
              playsInline
              preload="metadata"
              muted={isMuted}
              style={{
                objectPosition: 'center center',
                transform: isVertical && (clip.verticalStyle === 'center-crop' || !clip.verticalStyle)
                  ? `scale(${1.0 - ((clip.zoomOutPercent ?? 20) / 100) * 0.40})`
                  : undefined,
              }}
              className={`w-full h-full cursor-pointer relative z-10 transition-transform ${
                isVertical
                  ? clip.verticalStyle === 'blur-background'
                    ? 'object-contain'
                    : clip.verticalStyle === 'letterbox'
                    ? 'object-contain bg-black'
                    : 'object-cover'
                  : isSquare
                  ? 'object-cover'
                  : 'object-contain'
              }`}
              onClick={togglePlay}
            />

            {/* Big Center Play Icon (When paused) */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-violet-600/90 text-white backdrop-blur-xs shadow-xl transform transition-transform hover:scale-110 cursor-pointer z-10"
                aria-label={isId ? 'Putar Klip' : 'Play Clip'}
              >
                <Play className="h-6 w-6 fill-white translate-x-0.5" />
              </button>
            )}

            {/* Video Controls Overlay */}
            <div 
              className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2.5 flex flex-col gap-1.5 transition-opacity z-20 ${
                isPlaying || isHovered || showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Interactive Duration Slider to seek during play */}
              <div className="w-full flex items-center gap-1.5">
                <input
                  type="range"
                  min="0"
                  max={clip.duration || 60}
                  step="0.5"
                  value={activeElapsed}
                  onChange={handleSliderChange}
                  className="w-full h-1.5 accent-violet-500 hover:accent-violet-400 bg-white/30 rounded-lg cursor-pointer"
                  title={isId ? 'Geser untuk pindah durasi saat memutar video' : 'Scrub clip position'}
                />
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                    title={isPlaying ? (isId ? 'Jeda' : 'Pause') : (isId ? 'Putar' : 'Play')}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </button>

                  <button
                    type="button"
                    onClick={resetToStart}
                    className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                    title={isId ? 'Ulangi dari awal klip' : 'Restart clip'}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>

                  <span className="font-mono text-[11px] font-bold text-violet-300">
                    {formatTimeCode(activeElapsed)} / {formatTimeCode(clip.duration)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 hover:text-violet-400 transition-colors cursor-pointer"
                  title={isMuted ? (isId ? 'Bunyikan' : 'Unmute') : (isId ? 'Bisukan' : 'Mute')}
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Floating Badges: Klip 1, Klip 2, etc. at top left as requested */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-20">
          <span className="rounded-full bg-violet-600/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold text-white border border-violet-400/30 shadow-xs flex items-center gap-1">
            <span>{isId ? 'Klip' : 'Clip'} {index + 1}</span>
          </span>

          <div className="flex items-center gap-1">
            {clip.aspectRatio === '9:16' && (clip.verticalStyle === 'center-crop' || !clip.verticalStyle) && (
              <span className="rounded-full bg-violet-600/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-mono font-bold text-white border border-violet-400/30 shadow-xs flex items-center gap-1">
                <span>Zoom-Out {clip.zoomOutPercent ?? 20}%</span>
              </span>
            )}
            <span className="rounded-full bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              {clip.aspectRatio}
            </span>
            <span className="rounded-full bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-slate-200 border border-white/10 shadow-xs">
              {clip.duration}s
            </span>
          </div>
        </div>

        {/* Slice status indicator */}
        {clip.videoBlobUrl && (
          <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 backdrop-blur-xs shadow-xs">
              <Check className="h-2.5 w-2.5" />
              <span>{isId ? 'Terpotong Presisi' : 'Precision Cut'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Info & Actions */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
              {clip.title}
            </h3>
            <span className="shrink-0 text-[10px] font-mono text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded font-bold">
              {formatTimeCode(clip.startTime)} - {formatTimeCode(clip.endTime)} ({clip.duration}s)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase px-1">
              {clip.exportQuality}
            </span>
            {clip.aspectRatio === '9:16' && (clip.verticalStyle === 'center-crop' || !clip.verticalStyle) && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800/60 px-1.5 py-0.5 rounded">
                <Sparkles className="h-2.5 w-2.5 text-violet-500" />
                <span>{isId ? 'Crop Tengah (Zoom-Out)' : 'Center Crop (Zoom-Out)'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* If YouTube, provide direct link to timestamp */}
            {isYouTube && source?.youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${source.youtubeId}&t=${Math.round(clip.startTime)}s`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title={isId ? 'Buka segmen ini langsung di YouTube' : 'Open this segment directly on YouTube'}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => onFineTuneClip(clip)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title={t.dashboard.fineTune}
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onPreviewClip(clip)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title={t.dashboard.previewFull}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            {/* Smart Cut & Download Button - Changed label to 'Unduh' as requested */}
            <button
              type="button"
              disabled={isRendering}
              onClick={() => onDownloadSingle(clip)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-xs transition-colors cursor-pointer leading-none disabled:opacity-50"
              title={isId ? `Unduh Klip ${index + 1} (${clip.duration} Detik)` : `Download Clip ${index + 1} (${clip.duration}s)`}
            >
              {isRendering ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{renderingPercent}%</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>{isId ? 'Unduh' : 'Download'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClipDashboard: React.FC<ClipDashboardProps> = ({
  clips,
  source,
  onPreviewClip,
  onFineTuneClip,
  onUpdateClipCrop,
  onSelectSampleVideo,
  lang,
  onOpenYouTubeCookiesModal,
  onAttachVideoFile,
}) => {
  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [activePlayingClipId, setActivePlayingClipId] = useState<string | null>(null);

  // Active rendering state for offline video slicing
  const [renderingClip, setRenderingClip] = useState<{
    id: string;
    progress: number;
    title: string;
    duration: number;
  } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleCopyHook = (clip: GeneratedClip) => {
    navigator.clipboard.writeText(`${clip.hookText}\n\n${clip.tags.map((tg: string) => `#${tg.replace(/\s+/g, '')}`).join(' ')}`);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download single clip directly into user storage!
  const handleDownloadSingle = async (clip: GeneratedClip) => {
    setDownloadError(null);
    // 1. If video blob already generated, download immediately!
    if (clip.videoBlobUrl) {
      downloadClipAsMp4(clip, undefined, clip.videoExtension);
      return;
    }

    // 2. If YouTube source or online video: render genuine real MP4 video via server (yt-dlp + ffmpeg)!
    if (source?.youtubeId || (source?.url && !source.url.startsWith('blob:') && !source.url.startsWith('data:'))) {
      try {
        setRenderingClip({
          id: clip.id,
          progress: 25,
          title: clip.title,
          duration: clip.duration,
        });

        const result = await downloadServerRenderedClip(clip, source.url, source.youtubeId);
        clip.videoBlobUrl = result.url;
        clip.videoExtension = 'mp4';
        downloadClipAsMp4(clip, undefined, 'mp4');
        return;
      } catch (err: any) {
        if (err?.code === 'YOUTUBE_BOT_PROTECTION' || err?.message?.includes('YOUTUBE_BOT_PROTECTION')) {
          console.warn('[DriaClip] Notice: YouTube bot challenge encountered on server request.');
          setDownloadError(err.message || 'YouTube memerlukan verifikasi bot pada server cloud.');
        } else {
          console.error('Server render error:', err);
          setDownloadError(
            err?.message || (isId ? 'Gagal memproses klip video dari server. Periksa koneksi atau coba durasi klip yang lebih pendek.' : 'Failed to process clip from server.')
          );
        }
      } finally {
        setRenderingClip(null);
      }
      return;
    }

    // 3. If offline file or direct stream, slice the exact clip into genuine MP4/WebM!
    if (source?.url) {
      try {
        setRenderingClip({
          id: clip.id,
          progress: 20,
          title: clip.title,
          duration: clip.duration,
        });

        // Try high-speed server FFmpeg rendering first (supports chunked upload for any file size)
        if (source.file) {
          try {
            const serverLocalResult = await downloadServerRenderedLocalClip(clip, source.file);
            clip.videoBlobUrl = serverLocalResult.url;
            clip.videoExtension = 'mp4';
            downloadClipAsMp4(clip, undefined, 'mp4');
            return;
          } catch (serverLocalErr) {
            console.warn('Server local render notice, falling back to browser slice:', serverLocalErr);
          }
        }

        const result = await renderClipBlob(
          source.url,
          clip.startTime,
          clip.endTime,
          clip.aspectRatio,
          clip.verticalStyle,
          clip.exportQuality || '720p',
          (percent) => {
            setRenderingClip((prev) => (prev ? { ...prev, progress: Math.max(5, percent) } : null));
          },
          clip.cropPositionX ?? 50,
          clip.trackingKeyframes,
          clip.zoomOutPercent ?? 20,
          clip.watermark !== false,
          clip.watermarkPosition || 'safe-top-left'
        );

        clip.videoBlobUrl = result.url;
        clip.estimatedSizeBytes = result.size;
        clip.videoExtension = result.extension;

        // Trigger download with correct format
        downloadClipAsMp4(clip, undefined, result.extension);
      } catch (err: any) {
        console.error('Failed to render clip slice:', err);
        setDownloadError(err?.message || (isId ? 'Gagal memotong video.' : 'Failed to slice video.'));
      } finally {
        setRenderingClip(null);
      }
      return;
    }
  };

  // Batch download as ZIP with clean manifests
  const handleBatchDownloadZip = async () => {
    if (clips.length === 0) return;
    setIsZipping(true);
    setZipProgress(10);

    try {
      const zip = new JSZip();
      const folder = zip.folder('DriaClip_Export');

      // Create manifest TXT
      let manifestTxt = `DriaClip Batch Export Manifest\n`;
      manifestTxt += `Master Video: ${source?.title || 'Video Ingestion'}\n`;
      manifestTxt += `Total Clips: ${clips.length}\n`;
      manifestTxt += `Generated At: ${new Date().toISOString()}\n\n`;

      clips.forEach((clip, i) => {
        manifestTxt += `----------------------------------------\n`;
        manifestTxt += `CLIP #${i + 1}: ${clip.title}\n`;
        manifestTxt += `Time Range: ${formatTimeCode(clip.startTime)} - ${formatTimeCode(clip.endTime)} (${clip.duration}s)\n`;
        manifestTxt += `Aspect Ratio: ${clip.aspectRatio} (${clip.verticalStyle})\n`;
        manifestTxt += `Export Quality: ${clip.exportQuality}\n`;
        manifestTxt += `Viral Score: ${clip.score}/100\n`;
        manifestTxt += `Hook: ${clip.hookText}\n`;
        manifestTxt += `Tags: ${clip.tags.join(', ')}\n\n`;
      });

      folder?.file('manifest.txt', manifestTxt);

      // Create metadata JSON
      folder?.file('metadata.json', JSON.stringify({
        project: 'DriaClip',
        exportedAt: new Date().toISOString(),
        sourceTitle: source?.title,
        totalClips: clips.length,
        clips: clips.map(c => ({
          id: c.id,
          title: c.title,
          hook: c.hookText,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          aspectRatio: c.aspectRatio,
          exportQuality: c.exportQuality,
          viralScore: c.score,
          tags: c.tags,
        }))
      }, null, 2));

      setZipProgress(50);

      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        if (c.videoBlobUrl) {
          const res = await fetch(c.videoBlobUrl);
          const blob = await res.blob();
          folder?.file(`clip_${i + 1}_${c.duration}s_${c.exportQuality}_${c.aspectRatio.replace(':', 'x')}.mp4`, blob);
        } else {
          folder?.file(`clip_${i + 1}_info.txt`, `Clip: ${c.title}\nDuration: ${c.duration}s\nResolution: ${c.exportQuality}\nCut Range: ${formatTimeCode(c.startTime)} - ${formatTimeCode(c.endTime)}\nRatio: ${c.aspectRatio}\nHook: ${c.hookText}`);
        }
        setZipProgress(50 + Math.round(((i + 1) / clips.length) * 40));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `DriaClip_Batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) {
          a.parentNode.removeChild(a);
        }
        URL.revokeObjectURL(downloadUrl);
      }, 60000);
    } catch (err) {
      console.error('Batch zip creation failed:', err);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div id="clips-dashboard" className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0f172a]/95 p-4 sm:p-7 shadow-lg backdrop-blur-md space-y-6 transition-colors w-full">
      {/* Header - clean without step badge or dummy counts */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t.dashboard.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Batch Actions (Clean prominent Batch Download ZIP button) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchDownloadZip}
            disabled={isZipping || clips.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isZipping ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
                <span>{t.dashboard.zipping} ({zipProgress}%)...</span>
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 shrink-0" />
                <span>{t.dashboard.batchDownload}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-500/10 via-amber-500/5 to-slate-900/40 p-4 sm:p-5 text-xs text-red-600 dark:text-red-400 space-y-3.5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <span className="font-bold text-sm block text-red-700 dark:text-red-300">
                  {isId ? 'Gagal Mengunduh Klip Video' : 'Failed to Download Video Clip'}
                </span>
                <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px] bg-red-50/80 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
                  {downloadError}
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setDownloadError(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-base font-bold p-1 rounded-md"
              title={isId ? 'Tutup pesan' : 'Dismiss'}
            >
              ✕
            </button>
          </div>

          {/* 3 Real Problem-Solving Action Options */}
          <div className="pt-2 border-t border-red-200/50 dark:border-red-900/40 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
              {isId ? 'Pilih Solusi Terbaik (1-Klik Tanpa Gangguan):' : 'Recommended 1-Click Solutions:'}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Option 1: YouTube Cookies Setup (Direct Fix) */}
              <button
                type="button"
                onClick={() => {
                  setDownloadError(null);
                  if (onOpenYouTubeCookiesModal) {
                    onOpenYouTubeCookiesModal();
                  }
                }}
                className="p-3 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-white dark:bg-amber-950/20 hover:border-amber-500 text-left cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Cookie className="h-4 w-4" />
                    <span>{isId ? 'Solusi 1: Pasang Cookie YouTube' : 'Solution 1: Setup YouTube Cookie'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                    {isId 
                      ? 'Tempelkan cookie akun YouTube (format Netscape). Server cloud langsung bebas blokir bot & unduh klip lancar.' 
                      : 'Provide YouTube cookies (Netscape format) to permanently bypass server bot checks.'}
                  </p>
                </div>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 group-hover:underline">
                  {isId ? 'Buka Pengaturan Cookie →' : 'Open Cookie Settings →'}
                </span>
              </button>

              {/* Option 2: Upload Own MP4/WebM Video File */}
              <a
                href="#input-source"
                onClick={() => {
                  setDownloadError(null);
                  const el = document.getElementById('input-source');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-3 rounded-xl border border-violet-300 dark:border-violet-800/80 bg-white dark:bg-violet-950/20 hover:border-violet-500 text-left cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-bold text-xs">
                    <FileVideo className="h-4 w-4" />
                    <span>{isId ? 'Solusi 2: Unggah File MP4' : 'Solution 2: Upload Video File'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                    {isId 
                      ? 'Unduh video sumber di perangkat Anda lalu unggah file MP4 ke DriaClip. 100% cepat tanpa blokir.' 
                      : 'Upload the video file directly from your device. 100% bypasses all bot protections.'}
                  </p>
                </div>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 dark:text-violet-300 group-hover:underline">
                  {isId ? 'Buka Menu Unggah Video →' : 'Open Upload Video →'}
                </span>
              </a>

              {/* Option 3: Built-in Sample Video (100% Guaranteed instant download) */}
              <button
                type="button"
                onClick={() => {
                  setDownloadError(null);
                  if (onSelectSampleVideo) {
                    onSelectSampleVideo(SAMPLE_VIDEOS[1]); // Podcast sample
                  }
                }}
                className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-emerald-950/20 hover:border-emerald-500 text-left cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Sparkles className="h-4 w-4" />
                    <span>{isId ? 'Solusi 3: Pakai Sampel HD' : 'Solution 3: Try HD Sample'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                    {isId 
                      ? 'Coba hasil potongan video dengan sampel lokal podcast. 100% langsung siap diunduh MP4.' 
                      : 'Test the clipping engine using built-in podcast sample video. Instant MP4 download.'}
                  </p>
                </div>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 group-hover:underline">
                  {isId ? 'Pilih Sampel Podcast →' : 'Select Sample Video →'}
                </span>
              </button>
            </div>

            {/* Quick Video Attachment to preserve clips without starting over */}
            {onAttachVideoFile && (
              <div className="p-3.5 rounded-xl border border-dashed border-violet-400/80 dark:border-violet-700 bg-white/90 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shrink-0">
                    <FileVideo className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      {isId ? 'Sudah mengunduh video di browser? Pasang di sini:' : 'Already downloaded the video? Attach here:'}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isId 
                        ? 'Sematkan file video MP4 — semua klip yang sudah dibuat langsung siap diunduh tanpa ulang!' 
                        : 'Attach the MP4 file — all generated clips will be ready to download immediately!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <a
                    href="https://save.driacom.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-violet-600 text-xs font-semibold"
                  >
                    <span>DriaSave</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>

                  <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <span>{isId ? 'Pilih File MP4' : 'Select MP4'}</span>
                    <input
                      type="file"
                      accept="video/*,.mp4,.webm,.mov"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onAttachVideoFile(e.target.files[0]);
                          setDownloadError(null);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {clips.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0b0f19]/60 p-10 sm:p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-slate-900 text-violet-600 dark:text-violet-400 mb-3 border border-violet-200 dark:border-slate-800 shadow-xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t.dashboard.noClipsTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            {t.dashboard.noClipsDesc}
          </p>
        </div>
      )}

      {/* Grid of Generated Clips (with active video players!) */}
      {clips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clips.map((clip, idx) => (
            <ClipCardItem
              key={clip.id}
              clip={clip}
              index={idx}
              source={source}
              onPreviewClip={onPreviewClip}
              onFineTuneClip={onFineTuneClip}
              onDownloadSingle={handleDownloadSingle}
              onCopyHook={handleCopyHook}
              onUpdateClipCrop={onUpdateClipCrop}
              isCopied={copiedId === clip.id}
              isRendering={renderingClip?.id === clip.id}
              renderingPercent={renderingClip?.id === clip.id ? (renderingClip?.progress ?? 0) : 0}
              isId={isId}
              t={t}
              activePlayingId={activePlayingClipId}
              onSetActivePlayingId={setActivePlayingClipId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
