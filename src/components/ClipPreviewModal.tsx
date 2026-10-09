import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Smartphone, 
  Monitor, 
  Heart, 
  MessageCircle, 
  Share2, 
  Music, 
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { GeneratedClip, VideoSourceMetadata, AspectRatio } from '../types/driaclip';
import { formatTimeCode } from '../services/videoClipper';
import { Language } from '../i18n/translations';

interface ClipPreviewModalProps {
  clip: GeneratedClip | null;
  source: VideoSourceMetadata | null;
  onClose: () => void;
  onDownload: (clip: GeneratedClip) => void;
  lang?: Language;
}

export const ClipPreviewModal: React.FC<ClipPreviewModalProps> = ({
  clip,
  source,
  onClose,
  onDownload,
  lang = 'id',
}) => {
  if (!clip || !source) return null;
  const isId = lang === 'id';
  const isBlob = !!clip.videoBlobUrl;
  const boundaryStart = isBlob ? 0 : clip.startTime;
  const boundaryEnd = isBlob ? clip.duration : clip.endTime;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(boundaryStart);
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(clip.aspectRatio);

  // Fixed center-crop (tengah-tengah frame)
  const activeCropX = 50;

  const videoSrc = clip.videoBlobUrl || source.url;
  const isYouTubeClip = !!source.youtubeId && !clip.videoBlobUrl;
  const isSourceLandscape = source.width && source.height ? source.width > source.height : !source.url?.includes('shorts');

  const [ytElapsed, setYtElapsed] = useState(0);
  const [ytOffset, setYtOffset] = useState(0);
  const [ytIframeKey, setYtIframeKey] = useState(0);

  // Sync DOM property muted with React state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    let interval: any = null;
    if (isYouTubeClip && isPlaying) {
      interval = setInterval(() => {
        setYtElapsed((prev) => {
          if (prev + 1 >= clip.duration) {
            setIsPlaying(false);
            setYtOffset(0);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isYouTubeClip, isPlaying, clip.duration]);

  const playVideoSafely = async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch {
      // Autoplay with sound often blocked; retry muted so video at least plays
      if (videoRef.current) {
        videoRef.current.muted = true;
        setIsMuted(true);
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = boundaryStart;
      setCurrentTime(boundaryStart);
      playVideoSafely();
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = boundaryStart;
      setCurrentTime(boundaryStart);
      playVideoSafely();
    }
  }, [clip, videoSrc, boundaryStart]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Loop strictly within clip boundaries
    if (cur >= boundaryEnd) {
      videoRef.current.currentTime = boundaryStart;
      setCurrentTime(boundaryStart);
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlay = async () => {
    if (isYouTubeClip) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      const cur = videoRef.current.currentTime;
      if (cur < boundaryStart - 0.2 || cur >= boundaryEnd - 0.2) {
        videoRef.current.currentTime = boundaryStart;
        setCurrentTime(boundaryStart);
      }
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          try {
            await videoRef.current.play();
            setIsPlaying(true);
          } catch {
            setIsPlaying(false);
          }
        }
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleScrubClip = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (clip.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (isYouTubeClip) {
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
    setCurrentTime(target);
  };

  const handleResetToStart = () => {
    if (isYouTubeClip) {
      setYtElapsed(0);
      setYtOffset(0);
      setYtIframeKey((k) => k + 1);
      setIsPlaying(true);
      return;
    }

    if (!videoRef.current) return;
    videoRef.current.currentTime = boundaryStart;
    setCurrentTime(boundaryStart);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isYouTubeClip) {
      setYtElapsed(val);
      setYtOffset(val);
      setYtIframeKey((k) => k + 1);
      setIsPlaying(true);
      return;
    }
    if (!videoRef.current) return;
    const target = boundaryStart + val;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const activeElapsed = isYouTubeClip 
    ? ytElapsed 
    : Math.max(0, Math.min(clip.duration, currentTime - boundaryStart));
  const progressPercent = clip.duration > 0 ? (activeElapsed / clip.duration) * 100 : 0;

  const isVertical = activeRatio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900/80 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Video Viewport Column */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-6 overflow-hidden">
          {isVertical ? (
            /* Smartphone Frame for 9:16 Shorts/Reels */
            <div className="relative h-[480px] w-[270px] sm:h-[530px] sm:w-[300px] rounded-[36px] border-4 border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden flex items-center justify-center">
              {/* Phone Camera Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-4 w-24 rounded-full bg-black/90 z-20" />

              {/* Floating Dynamic Framing Mode Pill */}
              {(clip.verticalStyle === 'center-crop' || !clip.verticalStyle) && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/85 border border-violet-500/50 text-violet-300 text-[10px] font-mono backdrop-blur-md shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                    <span>{isId ? `Crop Tengah (${clip.zoomOutPercent ?? 20}% Zoom-Out)` : `Center Crop (${clip.zoomOutPercent ?? 20}% Zoom-Out)`}</span>
                  </div>
                </div>
              )}
              {clip.verticalStyle === 'blur-background' && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/85 border border-sky-500/50 text-sky-300 text-[10px] font-mono backdrop-blur-md shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                    <span>{isId ? 'Latar Blur Penuh' : 'Full Blur Background'}</span>
                  </div>
                </div>
              )}
              {clip.verticalStyle === 'letterbox' && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-300 text-[10px] font-mono backdrop-blur-md shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
                    <span>{isId ? 'Bilah Hitam Sinematik' : 'Cinematic Letterbox'}</span>
                  </div>
                </div>
              )}

              {/* Video Element */}
              {isYouTubeClip ? (
                clip.verticalStyle === 'blur-background' ? (
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    {/* Blurred Background Layer */}
                    <img
                      src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-70 pointer-events-none"
                    />
                    {/* Centered Sharp 16:9 Video */}
                    <div className="relative z-10 w-full aspect-video shadow-2xl border-y border-white/10">
                      <iframe
                        key={ytIframeKey}
                        src={`https://www.youtube.com/embed/${source.youtubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
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
                  </div>
                ) : clip.verticalStyle === 'letterbox' ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {/* Centered 16:9 Video with Top/Bottom Black Letterbox Bars */}
                    <div className="relative z-10 w-full aspect-video shadow-2xl">
                      <iframe
                        key={ytIframeKey}
                        src={`https://www.youtube.com/embed/${source.youtubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
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
                  </div>
                ) : (
                  /* Center-Crop with Comfortable Zoom-Out (No Tight Fit, Zero Stretch) */
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    {/* Soft blurred background */}
                    <img
                      src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-65 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                    <div 
                      className="relative overflow-hidden flex items-center justify-center w-full h-full"
                      style={
                        isSourceLandscape
                          ? {
                              width: '316.05%',
                              height: '100%',
                              position: 'absolute',
                              top: 0,
                              left: '-108.025%',
                              transform: `scale(${1.0 - ((clip.zoomOutPercent ?? 20) / 100) * 0.40})`,
                              transformOrigin: 'center center',
                            }
                          : {
                              width: '100%',
                              height: '100%'
                            }
                      }
                    >
                      <iframe
                        key={ytIframeKey}
                        src={`https://www.youtube.com/embed/${source.youtubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
                        title={clip.title}
                        className="h-full w-full border-0"
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
                  </div>
                )
              ) : (
                /* Native Video File */
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                  {(clip.verticalStyle === 'blur-background' || clip.verticalStyle === 'center-crop' || !clip.verticalStyle) && (
                    <>
                      <img
                        src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-65 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                    </>
                  )}
                  {clip.verticalStyle === 'letterbox' && (
                    <div className="absolute inset-0 bg-black pointer-events-none" />
                  )}
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      if (videoRef.current) {
                        videoRef.current.currentTime = boundaryStart;
                        setCurrentTime(boundaryStart);
                      }
                    }}
                    playsInline
                    preload="metadata"
                    muted={isMuted}
                    style={{
                      objectPosition: 'center center',
                      transform: (clip.verticalStyle === 'center-crop' || !clip.verticalStyle)
                        ? `scale(${1.0 - ((clip.zoomOutPercent ?? 20) / 100) * 0.40})`
                        : undefined,
                    }}
                    className={`cursor-pointer relative z-10 w-full h-full transition-transform ${
                      clip.verticalStyle === 'blur-background'
                        ? 'object-contain'
                        : clip.verticalStyle === 'letterbox'
                        ? 'object-contain bg-black'
                        : 'object-cover'
                    }`}
                    onClick={togglePlay}
                  />
                </div>
              )}

              {/* Strategic DriaClip Watermark Badge (Anti-Crop Protected) */}
              {clip.watermark !== false && (
                <div 
                  className={`absolute z-25 pointer-events-none drop-shadow-md transition-all ${
                    clip.watermarkPosition === 'safe-top-right'
                      ? 'top-14 right-3'
                      : clip.watermarkPosition === 'center-top'
                      ? 'top-14 left-1/2 -translate-x-1/2'
                      : 'top-14 left-3'
                  }`}
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-violet-500/70 text-white text-[11px] font-bold shadow-lg backdrop-blur-xs ring-1 ring-violet-500/20">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400"></span>
                    </span>
                    <span className="tracking-wide">DriaClip</span>
                  </div>
                </div>
              )}

              {/* Simulated Shorts / TikTok UI Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 text-white">
                <div />

                {/* Bottom Hook & Title Overlay */}
                <div className="space-y-1.5 drop-shadow-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">@driaclip.ai</span>
                    <span className="rounded-full bg-violet-500/80 px-1.5 py-0.2 text-[9px] font-semibold">
                      DriaClip
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-snug line-clamp-2">
                    {clip.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-300">
                    <Music className="h-3 w-3 animate-spin" />
                    <span className="truncate">Original Audio &middot; DriaClip by Driacom</span>
                  </div>
                </div>

                {/* Right Action Icons (Like, Comment, Share) */}
                <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4 text-white drop-shadow-md">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs">
                      <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                    </div>
                    <span className="text-[10px] font-mono">14.8K</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] font-mono">342</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs">
                      <Share2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] font-mono">Share</span>
                  </div>
                </div>
              </div>

              {/* Pause overlay button */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                >
                  <Play className="h-6 w-6 fill-current translate-x-0.5" />
                </button>
              )}
            </div>
          ) : (
            /* 16:9 Standard Player */
            <div className="relative aspect-video w-full max-w-lg rounded-xl overflow-hidden bg-black flex items-center justify-center border border-neutral-800">
              {isYouTubeClip ? (
                <iframe
                  key={ytIframeKey}
                  src={`https://www.youtube.com/embed/${source.youtubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3&start=${Math.round(clip.startTime + ytOffset)}&end=${Math.round(clip.endTime)}`}
                  title={clip.title}
                  className="h-full w-full border-0"
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
                <video
                  ref={videoRef}
                  src={videoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    if (videoRef.current) {
                      videoRef.current.currentTime = boundaryStart;
                      setCurrentTime(boundaryStart);
                    }
                  }}
                  playsInline
                  preload="auto"
                  muted={isMuted}
                  className="h-full w-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />
              )}
              {/* Strategic DriaClip Watermark Badge for Landscape/Square */}
              {clip.watermark !== false && (
                <div 
                  className={`absolute z-25 pointer-events-none drop-shadow-md transition-all ${
                    clip.watermarkPosition === 'safe-top-right'
                      ? 'top-4 right-4'
                      : clip.watermarkPosition === 'center-top'
                      ? 'top-4 left-1/2 -translate-x-1/2'
                      : 'top-4 left-4'
                  }`}
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-violet-500/70 text-white text-[11px] font-bold shadow-lg backdrop-blur-xs ring-1 ring-violet-500/20">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400"></span>
                    </span>
                    <span className="tracking-wide">DriaClip</span>
                  </div>
                </div>
              )}

              {!isPlaying && !isYouTubeClip && (
                <button
                  onClick={togglePlay}
                  className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm cursor-pointer"
                >
                  <Play className="h-6 w-6 fill-current translate-x-0.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick playback strip */}
          <div className="mt-3 w-full max-w-[320px] space-y-2">
            {/* Interactive Seek Slider */}
            <div className="w-full flex items-center">
              <input
                type="range"
                min="0"
                max={clip.duration || 60}
                step="0.5"
                value={activeElapsed}
                onChange={handleSliderChange}
                className="w-full h-1.5 accent-violet-500 hover:accent-violet-400 bg-white/20 rounded-lg cursor-pointer"
                title={isId ? 'Geser posisi durasi dalam klip ini' : 'Scrub clip position'}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="hover:text-white cursor-pointer" title={isPlaying ? (isId ? 'Jeda' : 'Pause') : (isId ? 'Putar' : 'Play')}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                </button>
                <button
                  onClick={handleResetToStart}
                  className="hover:text-white cursor-pointer"
                  title={isId ? 'Ulangi dari awal klip' : 'Restart clip'}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <span>
                  {formatTimeCode(activeElapsed)} / {formatTimeCode(clip.duration)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="hover:text-white cursor-pointer"
                title={isMuted ? (isId ? 'Nyalakan Audio' : 'Unmute') : (isId ? 'Matikan Audio' : 'Mute')}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-amber-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info & Format Switching Column */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-800 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Clip Details</span>
              </div>
              <h3 className="text-base font-bold text-white">
                {clip.title}
              </h3>
            </div>

            {/* Metadata Stats */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">{isId ? 'Rentang Waktu:' : 'Time Range:'}</span>
                <span className="font-mono text-neutral-200">
                  {formatTimeCode(clip.startTime)} - {formatTimeCode(clip.endTime)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">{isId ? 'Durasi:' : 'Duration:'}</span>
                <span className="font-mono text-neutral-200">{clip.duration} {isId ? 'detik' : 'seconds'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">{isId ? 'Skor Potensi Viral:' : 'Viral Potential Score:'}</span>
                <span className="font-mono font-semibold text-amber-400">
                  {clip.score || 92} / 100
                </span>
              </div>
            </div>

            {/* Format Preview Switcher */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-300">
                {isId ? 'Pratinjau Rasio Aspek:' : 'Preview Aspect Ratio:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveRatio('9:16')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-colors ${
                    activeRatio === '9:16'
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300'
                      : 'border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>9:16 {isId ? 'Ponsel' : 'Phone'}</span>
                </button>

                <button
                  onClick={() => setActiveRatio('16:9')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-colors ${
                    activeRatio === '16:9'
                      ? 'border-violet-500 bg-violet-950/30 text-violet-300'
                      : 'border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>16:9 Desktop</span>
                </button>
              </div>
            </div>
          </div>

          {/* Download Action */}
          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={() => onDownload(clip)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold text-xs text-white shadow-md transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isId ? `Unduh Klip Video MP4 (${clip.exportQuality || '1080p'})` : `Download Video Clip MP4 (${clip.exportQuality || '1080p'})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
