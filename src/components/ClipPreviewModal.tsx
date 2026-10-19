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
  VolumeX,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Type,
  Palette,
  Sliders,
  Check
} from 'lucide-react';
import { GeneratedClip, VideoSourceMetadata, AspectRatio, WatermarkPosition, WatermarkStyle } from '../types/driaclip';
import { formatTimeCode } from '../services/videoClipper';
import { Language } from '../i18n/translations';
import { WatermarkBadge } from './WatermarkBadge';

interface ClipPreviewModalProps {
  clip: GeneratedClip | null;
  source: VideoSourceMetadata | null;
  onClose: () => void;
  onDownload: (clip: GeneratedClip) => void;
  onUpdateClip?: (updated: GeneratedClip) => void;
  onUpdateCrop?: (cropX: number) => void;
  lang?: Language;
}

export const ClipPreviewModal: React.FC<ClipPreviewModalProps> = ({
  clip,
  source,
  onClose,
  onDownload,
  onUpdateClip,
  onUpdateCrop,
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

  // Dynamic user frame position (0% Left, 50% Center, 100% Right)
  const [cropX, setCropX] = useState<number>(clip.cropPositionX ?? 50);

  // Dynamic editable watermark settings
  const [hasWatermark, setHasWatermark] = useState<boolean>(clip.watermark !== false);
  const [wmText, setWmText] = useState<string>(clip.watermarkText || 'DriaClip');
  const [wmStyle, setWmStyle] = useState<WatermarkStyle>(clip.watermarkStyle || 'neon-glow');
  const [wmPosition, setWmPosition] = useState<WatermarkPosition>(clip.watermarkPosition || 'safe-top-left');

  // Active tab in sidebar for high usability: 'frame' | 'watermark' | 'details'
  const [activeSidebarTab, setActiveSidebarTab] = useState<'frame' | 'watermark' | 'details'>('frame');

  const videoSrc = clip.videoBlobUrl || source.url;
  const effectiveYoutubeId = source.youtubeId || (source.url ? (() => {
    const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = source.url.match(reg);
    return match ? match[1] : '';
  })() : '');
  const isYouTubeClip = !!effectiveYoutubeId && !clip.videoBlobUrl;
  const isSourceLandscape = source.width && source.height ? source.width > source.height : !source.url?.includes('shorts');

  const [ytElapsed, setYtElapsed] = useState(0);
  const [ytOffset, setYtOffset] = useState(0);
  const [ytIframeKey, setYtIframeKey] = useState(0);

  // Sync state if clip prop changes
  useEffect(() => {
    if (clip) {
      setCropX(clip.cropPositionX ?? 50);
      setHasWatermark(clip.watermark !== false);
      setWmText(clip.watermarkText || 'DriaClip');
      setWmStyle(clip.watermarkStyle || 'neon-glow');
      setWmPosition(clip.watermarkPosition || 'safe-top-left');
    }
  }, [clip?.id, clip?.cropPositionX, clip?.watermark, clip?.watermarkText, clip?.watermarkStyle, clip?.watermarkPosition]);

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
    if (!videoSrc || videoRef.current.error || videoRef.current.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) return;
    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch (err: any) {
      if (err?.name === 'NotSupportedError' || err?.message?.includes('no supported sources')) {
        setIsPlaying(false);
        return;
      }
      if (videoRef.current && !videoRef.current.error) {
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
    if (!videoSrc || videoRef.current.error || videoRef.current.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      setIsPlaying(false);
      return;
    }

    if (videoRef.current.paused) {
      const cur = videoRef.current.currentTime;
      if (cur < boundaryStart - 0.2 || cur >= boundaryEnd - 0.2) {
        videoRef.current.currentTime = boundaryStart;
        setCurrentTime(boundaryStart);
      }
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        if (err?.name === 'NotSupportedError' || err?.message?.includes('no supported sources')) {
          setIsPlaying(false);
          return;
        }
        if (videoRef.current && !videoRef.current.error) {
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

  // Helper to get active updated clip with latest crop & watermark values
  const getUpdatedClip = (): GeneratedClip => ({
    ...clip,
    cropPositionX: cropX,
    watermark: hasWatermark,
    watermarkText: wmText,
    watermarkStyle: wmStyle,
    watermarkPosition: wmPosition,
  });

  // Handler to adjust crop and notify parent
  const handleSetCropX = (newX: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newX)));
    setCropX(clamped);
    onUpdateCrop?.(clamped);
    if (onUpdateClip) {
      onUpdateClip({
        ...clip,
        cropPositionX: clamped,
        watermark: hasWatermark,
        watermarkText: wmText,
        watermarkStyle: wmStyle,
        watermarkPosition: wmPosition,
      });
    }
  };

  const handleWatermarkToggle = (checked: boolean) => {
    setHasWatermark(checked);
    onUpdateClip?.({
      ...clip,
      cropPositionX: cropX,
      watermark: checked,
      watermarkText: wmText,
      watermarkStyle: wmStyle,
      watermarkPosition: wmPosition,
    });
  };

  const handleWatermarkTextChange = (text: string) => {
    setWmText(text);
    onUpdateClip?.({
      ...clip,
      cropPositionX: cropX,
      watermark: hasWatermark,
      watermarkText: text,
      watermarkStyle: wmStyle,
      watermarkPosition: wmPosition,
    });
  };

  const handleWatermarkStyleChange = (style: WatermarkStyle) => {
    setWmStyle(style);
    onUpdateClip?.({
      ...clip,
      cropPositionX: cropX,
      watermark: hasWatermark,
      watermarkText: wmText,
      watermarkStyle: style,
      watermarkPosition: wmPosition,
    });
  };

  const handleWatermarkPositionChange = (pos: WatermarkPosition) => {
    setWmPosition(pos);
    onUpdateClip?.({
      ...clip,
      cropPositionX: cropX,
      watermark: hasWatermark,
      watermarkText: wmText,
      watermarkStyle: wmStyle,
      watermarkPosition: pos,
    });
  };

  const handleFinalDownload = () => {
    const finalClip = getUpdatedClip();
    onUpdateClip?.(finalClip);
    onDownload(finalClip);
  };

  const activeElapsed = isYouTubeClip 
    ? ytElapsed 
    : Math.max(0, Math.min(clip.duration, currentTime - boundaryStart));

  const isVertical = activeRatio === '9:16';

  // Compute YouTube landscape offset based on cropX (0% = left, 50% = center, 100% = right)
  const ytLeftOffset = `${-216.05 * (cropX / 100)}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col lg:flex-row max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900/90 text-neutral-400 hover:text-white transition-colors cursor-pointer border border-neutral-700 shadow-md"
          title={isId ? 'Tutup Pratinjau' : 'Close Preview'}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Video Viewport Column */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/95 p-4 sm:p-6 overflow-hidden">
          {isVertical ? (
            /* Smartphone Mockup Frame for 9:16 Shorts/Reels */
            <div className="relative h-[440px] w-[248px] sm:h-[500px] sm:w-[282px] rounded-[36px] border-4 border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden flex items-center justify-center">
              {/* Phone Camera Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-3.5 w-20 rounded-full bg-black/90 z-20" />

              {/* Dynamic Framing Mode Tag */}
              <div className="absolute top-7 left-1/2 -translate-x-1/2 z-25 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-950/85 border border-violet-500/50 text-violet-300 text-[10px] font-mono backdrop-blur-md shadow-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span>
                    {cropX === 50
                      ? (isId ? 'Tengah (50%)' : 'Center (50%)')
                      : cropX < 50
                      ? (isId ? `Fokus Kiri (${cropX}%)` : `Left Focus (${cropX}%)`)
                      : (isId ? `Fokus Kanan (${cropX}%)` : `Right Focus (${cropX}%)`)}
                  </span>
                </div>
              </div>

              {/* Video Element */}
              {isYouTubeClip ? (
                clip.verticalStyle === 'blur-background' ? (
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    <img
                      src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-70 pointer-events-none"
                    />
                    <div className="relative z-10 w-full aspect-video shadow-2xl border-y border-white/10">
                      <iframe
                        key={ytIframeKey}
                        src={`https://www.youtube.com/embed/${effectiveYoutubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
                        title={clip.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : clip.verticalStyle === 'letterbox' ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <div className="relative z-10 w-full aspect-video shadow-2xl">
                      <iframe
                        key={ytIframeKey}
                        src={`https://www.youtube.com/embed/${effectiveYoutubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
                        title={clip.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  /* Center-Crop with Dynamic Pan Positioning */
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    <img
                      src={clip.thumbnailBlobUrl || source?.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-65 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                    <div 
                      className="relative overflow-hidden flex items-center justify-center w-full h-full transition-all duration-150"
                      style={
                        isSourceLandscape
                          ? {
                              width: '316.05%',
                              height: '100%',
                              position: 'absolute',
                              top: 0,
                              left: ytLeftOffset,
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
                        src={`https://www.youtube.com/embed/${effectiveYoutubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&start=${Math.floor(clip.startTime + ytOffset)}&end=${Math.floor(clip.endTime)}`}
                        title={clip.title}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )
              ) : (
                /* Native Video File with Live Horizontal Object Position */
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
                    onError={(e) => {
                      console.warn('[DriaClip] Preview video element load state:', e);
                      setIsPlaying(false);
                    }}
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
                      objectPosition: `${cropX}% center`,
                    }}
                    className={`cursor-pointer relative z-10 w-full h-full transition-all duration-150 ${
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

              {/* Elegant User-Customized Watermark Badge (Anti-Crop Protected) */}
              {hasWatermark && (
                <WatermarkBadge
                  text={wmText}
                  style={wmStyle}
                  position={wmPosition}
                  size="sm"
                  isAbsolute={true}
                />
              )}

              {/* Clean Social Media Preview Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 text-white">
                <div />

                {/* Bottom Hook & Title Overlay */}
                <div className="space-y-1 drop-shadow-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">
                      @{wmText.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'creator'}
                    </span>
                    <span className="rounded-full bg-violet-600/90 px-1.5 py-0.2 text-[9px] font-semibold">
                      Klip
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-snug line-clamp-2">
                    {clip.title}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-300">
                    <Music className="h-2.5 w-2.5 animate-spin" />
                    <span className="truncate">Audio Asli &middot; Video Creator</span>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="absolute right-3 bottom-14 flex flex-col items-center gap-3 text-white drop-shadow-md">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs">
                      <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                    </div>
                    <span className="text-[9px] font-mono">14.8K</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs">
                      <MessageCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[9px] font-mono">342</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs">
                      <Share2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[9px] font-mono">Share</span>
                  </div>
                </div>
              </div>

              {/* Pause overlay button */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm cursor-pointer"
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
                  src={`https://www.youtube.com/embed/${effectiveYoutubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0&playsinline=1&start=${Math.round(clip.startTime + ytOffset)}&end=${Math.round(clip.endTime)}`}
                  title={clip.title}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
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

              {/* Watermark in Landscape */}
              {hasWatermark && (
                <WatermarkBadge
                  text={wmText}
                  style={wmStyle}
                  position={wmPosition}
                  size="sm"
                  isAbsolute={true}
                />
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

          {/* Quick Playback & Scrubbing Strip */}
          <div className="mt-3 w-full max-w-[320px] space-y-2">
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

        {/* Sidebar Column: Frame Shifting + Watermark Editor + Clip Info */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 p-5 flex flex-col justify-between space-y-4 max-h-[92vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isId ? 'Pratinjau Hasil Klip' : 'Clip Output Preview'}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug">
                {clip.title}
              </h3>
            </div>

            {/* Segment Tab Controls */}
            <div className="grid grid-cols-3 gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveSidebarTab('frame')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSidebarTab === 'frame'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <MoveHorizontal className="h-3.5 w-3.5" />
                <span>{isId ? 'Geser Frame' : 'Crop Frame'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab('watermark')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSidebarTab === 'watermark'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isId ? 'Watermark' : 'Watermark'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab('details')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSidebarTab === 'details'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{isId ? 'Detail' : 'Details'}</span>
              </button>
            </div>

            {/* Tab 1: ATUR & GESER FRAME VIDEO */}
            {activeSidebarTab === 'frame' && (
              <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MoveHorizontal className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-bold text-white">
                      {isId ? 'Atur & Geser Posisi Frame' : 'Shift & Position Crop Frame'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-200 border border-violet-700/50">
                    {cropX}%
                  </span>
                </div>

                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  {isId 
                    ? 'Geser kamera crop ke kiri atau kanan agar subjek / pembicara pas di tengah sebelum klip final diunduh.'
                    : 'Shift camera frame left or right to perfectly align the speaker in center before final download.'}
                </p>

                {/* 3 Quick Nudge Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetCropX(cropX - 15)}
                    className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg border border-neutral-700 hover:border-violet-500 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95"
                    title={isId ? 'Geser 15% ke Kiri' : 'Nudge 15% Left'}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>{isId ? 'Kiri' : 'Left'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetCropX(50)}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                      cropX === 50
                        ? 'border-violet-500 bg-violet-600/30 text-violet-200 font-bold'
                        : 'border-neutral-700 hover:border-violet-500 bg-neutral-900 hover:bg-neutral-800 text-white'
                    }`}
                    title={isId ? 'Kembalikan ke Posisi Tengah (50%)' : 'Reset to Center (50%)'}
                  >
                    <span>{isId ? 'Tengah' : 'Center'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetCropX(cropX + 15)}
                    className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg border border-neutral-700 hover:border-violet-500 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95"
                    title={isId ? 'Geser 15% ke Kanan' : 'Nudge 15% Right'}
                  >
                    <span>{isId ? 'Kanan' : 'Right'}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Interactive Smooth Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0% ({isId ? 'Kiri' : 'Left'})</span>
                    <span className="text-violet-300 font-bold">
                      {cropX === 50 ? (isId ? 'Tengah (Ideal)' : 'Center') : `${cropX}%`}
                    </span>
                    <span>100% ({isId ? 'Kanan' : 'Right'})</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={cropX}
                    onChange={(e) => handleSetCropX(Number(e.target.value))}
                    className="w-full h-2 accent-violet-500 hover:accent-violet-400 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-neutral-400">{isId ? 'Preset:' : 'Presets:'}</span>
                  {[
                    { label: isId ? 'Fokus Kiri (20%)' : 'Left (20%)', val: 20 },
                    { label: isId ? 'Pusat (50%)' : 'Center (50%)', val: 50 },
                    { label: isId ? 'Fokus Kanan (80%)' : 'Right (80%)', val: 80 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleSetCropX(preset.val)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        cropX === preset.val
                          ? 'border-violet-500 bg-violet-600/30 text-violet-200 font-semibold'
                          : 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: WATERMARK EDITOR PER-KLIP */}
            {activeSidebarTab === 'watermark' && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-bold text-white">
                      {isId ? 'Watermark & Branding' : 'Watermark & Branding'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasWatermark}
                      onChange={(e) => handleWatermarkToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-neutral-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {hasWatermark ? (
                  <div className="space-y-3">
                    {/* Manual Text Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                          <Type className="h-3 w-3 text-violet-400" />
                          <span>{isId ? 'Teks Watermark Manual:' : 'Watermark Custom Text:'}</span>
                        </label>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {wmText.length}/35
                        </span>
                      </div>
                      <input
                        type="text"
                        value={wmText}
                        onChange={(e) => handleWatermarkTextChange(e.target.value)}
                        placeholder="Contoh: @namaanda, Channel, dll."
                        maxLength={35}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-950 text-white text-xs placeholder-neutral-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium"
                      />
                      {/* Suggestion Chips */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {['DriaClip', '@mychannel', 'Viral Clip', 'Kreator ID'].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleWatermarkTextChange(sug)}
                            className="text-[10px] px-2 py-0.5 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-violet-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>


                    {/* Position Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-300">
                        {isId ? 'Posisi Safe-Zone:' : 'Safe-Zone Placement:'}
                      </label>
                      <select
                        value={wmPosition}
                        onChange={(e) => handleWatermarkPositionChange(e.target.value as WatermarkPosition)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-950 text-white text-xs focus:outline-hidden focus:border-violet-500"
                      >
                        <option value="safe-top-left">{isId ? 'Kiri Atas (Rekomendasi)' : 'Top-Left (Recommended)'}</option>
                        <option value="safe-top-right">{isId ? 'Kanan Atas' : 'Top-Right'}</option>
                        <option value="center-top">{isId ? 'Tengah Atas' : 'Center-Top'}</option>
                        <option value="safe-bottom-left">{isId ? 'Kiri Bawah' : 'Bottom-Left'}</option>
                        <option value="safe-bottom-right">{isId ? 'Kanan Bawah' : 'Bottom-Right'}</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">
                    {isId ? 'Watermark dinonaktifkan untuk klip ini.' : 'Watermark is disabled for this clip.'}
                  </p>
                )}
              </div>
            )}

            {/* Tab 3: METADATA & RATIO */}
            {activeSidebarTab === 'details' && (
              <div className="space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-800/80">
                    <span className="text-neutral-400">{isId ? 'Rentang Waktu:' : 'Time Range:'}</span>
                    <span className="font-mono text-neutral-200">
                      {formatTimeCode(clip.startTime)} - {formatTimeCode(clip.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/80">
                    <span className="text-neutral-400">{isId ? 'Durasi Klip:' : 'Duration:'}</span>
                    <span className="font-mono text-neutral-200">{clip.duration} {isId ? 'detik' : 'seconds'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/80">
                    <span className="text-neutral-400">{isId ? 'Resolusi Ekspor:' : 'Resolution:'}</span>
                    <span className="font-mono text-emerald-400 font-bold">{clip.exportQuality || '1080p'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/80">
                    <span className="text-neutral-400">{isId ? 'Skor Potensi Viral:' : 'Viral Potential Score:'}</span>
                    <span className="font-mono font-semibold text-amber-400">
                      {clip.score || 94} / 100
                    </span>
                  </div>
                </div>

                {/* Automatic 9:16 Vertical Format Badge */}
                <div className="pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-violet-900/60 bg-violet-950/30 text-xs text-neutral-300">
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-violet-400" />
                      <span className="font-semibold">{isId ? 'Format Otomatis 9:16 Vertikal' : 'Automatic 9:16 Vertical'}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      TikTok • Shorts
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Download Action Footer */}
          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <button
              onClick={handleFinalDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-violet-950/40 transition-all cursor-pointer active:scale-98"
            >
              <Download className="h-4 w-4" />
              <span>
                {isId 
                  ? `Unduh Klip Video MP4 (${clip.exportQuality || '1080p'})` 
                  : `Download Video Clip MP4 (${clip.exportQuality || '1080p'})`}
              </span>
            </button>
            <p className="text-[10px] text-center text-neutral-500">
              {isId 
                ? 'Posisi frame & watermark yang Anda sesuaikan akan langsung diterapkan pada unduhan final.' 
                : 'Frame position and watermark adjustments will be applied to the final download.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
