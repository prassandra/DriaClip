import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InputSourceSection } from './components/InputSourceSection';
import { ClippingControls } from './components/ClippingControls';
import { VideoTimelineScrubber } from './components/VideoTimelineScrubber';
import { ClipDashboard } from './components/ClipDashboard';
import { ClipPreviewModal } from './components/ClipPreviewModal';
import { ClipFineTuneModal } from './components/ClipFineTuneModal';
import { LegalAndInfoPages, PageView } from './components/LegalAndInfoPages';
import { SeoSections } from './components/SeoSections';
import { WhyDriaClipSection } from './components/WhyDriaClipSection';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { Footer } from './components/Footer';
import { AdSenseSlot } from './components/AdSenseSlot';

import { 
  VideoSourceMetadata, 
  ClipConfig, 
  GeneratedClip, 
  SplitMarker, 
  ProcessingJob 
} from './types/driaclip';
import { generateHighlights } from './services/aiHighlights';
import { 
  captureVideoThumbnail, 
  calculateClipThumbnailTime, 
  downloadClipAsMp4, 
  createDownloadableClipBlob, 
  renderClipBlob,
  downloadServerRenderedClip,
  downloadServerRenderedLocalClip
} from './services/videoClipper';
import { Language, FontSize, ThemeMode, TRANSLATIONS } from './i18n/translations';

export default function App() {
  const [activeNavTab, setActiveNavTab] = useState<'studio' | 'clips' | 'guide' | 'faq'>('studio');
  const [lang, setLang] = useState<Language>('id'); // Default to Indonesian per user preference
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('driaclip_font_size') as FontSize;
      if (stored === 'small' || stored === 'normal' || stored === 'large') return stored;
    }
    return 'normal';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('driaclip_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark'; // Modern Dark Mode default
  });

  const t = TRANSLATIONS[lang];
  const isId = lang === 'id';

  // Video Source (Starts null; user uploads or pastes a link - no sample library!)
  const [currentSource, setCurrentSource] = useState<VideoSourceMetadata | null>(null);

  // Clipping Engine Configuration: Default to Clean Zoomed-Out Center Crop (Without AI Camera Follow)
  const [config, setConfig] = useState<ClipConfig>({
    durationMode: 'preset',
    presetDuration: 60,
    customDuration: 60,
    minDuration: 15,
    maxDuration: 60,
    aspectRatio: '9:16',
    verticalStyle: 'center-crop', // Default: Crop Tengah (Zoom-Out)
    cropPositionX: 50, // Fixed in exact center (50%)
    zoomOutPercent: 20, // 20% comfortable zoom-out (no tight fit, no stretch)
    autoTrackSpeaker: false,
    exportQuality: '1080p',
    addCaptions: true,
    detectSceneChanges: true,
    minSpeechEnergy: 75,
    watermark: true, // Watermark DriaClip in anti-crop safe zone
    watermarkText: 'DriaClip',
    watermarkPosition: 'safe-top-left',
    watermarkStyle: 'neon-glow',
  });

  // Custom Markers for Manual Split
  const [markers, setMarkers] = useState<SplitMarker[]>([]);

  // Output Clips State
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);

  // Processing Job Status
  const [job, setJob] = useState<ProcessingJob>({
    id: '',
    status: 'idle',
    progress: 0,
    stageMessage: '',
    totalClipsToGenerate: 0,
    completedClipsCount: 0,
  });

  // Modals State
  const [previewClip, setPreviewClip] = useState<GeneratedClip | null>(null);
  const [fineTuneClip, setFineTuneClip] = useState<GeneratedClip | null>(null);
  const [legalPageView, setLegalPageView] = useState<PageView>('none');

  // Sync font size with document root and body: 14px, 16px, 18px
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const targetPx = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    root.style.fontSize = targetPx;
    if (body) {
      body.style.fontSize = targetPx;
    }
    localStorage.setItem('driaclip_font_size', fontSize);
  }, [fontSize]);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('driaclip_theme', theme);
  }, [theme]);

  // Marker Handlers
  const handleAddMarker = (time: number) => {
    const newMarker: SplitMarker = {
      id: `marker-${Date.now()}`,
      time,
      label: `Cut point @ ${time}s`,
    };
    setMarkers((prev) => [...prev, newMarker].sort((a, b) => a.time - b.time));
  };

  const handleRemoveMarker = (id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  };

  // Execution: Trigger the DriaClip Engine safely with selected resolution
  const handleRunEngine = async () => {
    if (!currentSource) return;

    setJob({
      id: `job-${Date.now()}`,
      status: 'analyzing',
      progress: 15,
      stageMessage: isId 
        ? 'Menganalisis lonjakan energi vokal, pemotongan visual adegan, dan hook retensi...'
        : 'Analyzing speech energy, scene cuts, and thematic retention hooks...',
      totalClipsToGenerate: 0,
      completedClipsCount: 0,
    });

    try {
      // Step 1: Detect highlight boundaries based on the EXACT source duration
      const markerTimes = markers.map((m) => m.time);
      const proposedSegments = await generateHighlights(
        currentSource.title,
        currentSource.duration,
        config,
        markerTimes
      );

      if (!proposedSegments || proposedSegments.length === 0) {
        setJob({
          id: '',
          status: 'error',
          progress: 0,
          stageMessage: '',
          totalClipsToGenerate: 0,
          completedClipsCount: 0,
          error: isId 
            ? 'Tidak dapat menghasilkan klip. Periksa konfigurasi durasi.' 
            : 'Could not generate segments. Check duration settings.',
        });
        return;
      }

      setJob((prev) => ({
        ...prev,
        status: 'transcoding',
        progress: 35,
        stageMessage: isId
          ? `Terdeteksi ${proposedSegments.length} segmen klip. Mengadaptasi ke resolusi ${config.exportQuality} (${config.aspectRatio})...`
          : `Identified ${proposedSegments.length} clips. Adapting to ${config.exportQuality} (${config.aspectRatio})...`,
        totalClipsToGenerate: proposedSegments.length,
      }));

      const newClips: GeneratedClip[] = [];

      // Step 2: Render thumbnails and calculate bitrates for each clip matching selected resolution
      for (let i = 0; i < proposedSegments.length; i++) {
        const seg = proposedSegments[i];
        const clipProgressBase = 35 + Math.round(((i + 1) / proposedSegments.length) * 55);

        setJob((prev) => ({
          ...prev,
          progress: clipProgressBase,
          stageMessage: isId
            ? `Memproses Klip #${i + 1} dari ${proposedSegments.length} (${config.exportQuality})...`
            : `Processing Clip #${i + 1} of ${proposedSegments.length} (${config.exportQuality})...`,
          completedClipsCount: i + 1,
        }));

        // Logika alur thumbnail: ambil gambar start awal durasi
        // Clean center-crop locked at 50% (middle frame) with comfortable zoom-out
        const effectiveStartCropX = 50;

        const thumbnailSecond = calculateClipThumbnailTime(seg.startTime, seg.endTime);

        const thumbnail = await captureVideoThumbnail(
          currentSource.url,
          thumbnailSecond,
          config.aspectRatio,
          config.verticalStyle,
          currentSource.youtubeId,
          i,
          seg.startTime,
          seg.endTime,
          seg.title,
          effectiveStartCropX,
          config.zoomOutPercent ?? 20
        );

        const durationSec = Math.max(1, seg.endTime - seg.startTime);

        const clipItem: GeneratedClip = {
          id: `clip-${Date.now()}-${i}`,
          sourceId: currentSource.id,
          title: seg.title,
          hookText: seg.hookText,
          startTime: seg.startTime,
          endTime: seg.endTime,
          duration: durationSec,
          aspectRatio: config.aspectRatio,
          verticalStyle: config.verticalStyle,
          cropPositionX: 50,
          zoomOutPercent: config.zoomOutPercent ?? 20,
          trackingKeyframes: undefined,
          autoTrackEnabled: false,
          exportQuality: config.exportQuality,
          watermark: config.watermark !== false,
          watermarkText: config.watermarkText || 'DriaClip',
          watermarkPosition: config.watermarkPosition || 'safe-top-left',
          watermarkStyle: config.watermarkStyle || 'neon-glow',
          status: 'ready',
          thumbnailBlobUrl: thumbnail,
          score: seg.score,
          tags: seg.tags,
        };

        newClips.push(clipItem);
      }

      // Step 3: Complete job
      setGeneratedClips(newClips);
      setJob({
        id: '',
        status: 'completed',
        progress: 100,
        stageMessage: isId
          ? `Sukses! ${newClips.length} klip video siap diunduh dalam resolusi ${config.exportQuality}!`
          : `Successfully generated ${newClips.length} clips in ${config.exportQuality}!`,
        totalClipsToGenerate: newClips.length,
        completedClipsCount: newClips.length,
      });

      // Scroll to dashboard
      setTimeout(() => {
        const el = document.getElementById('clips-dashboard');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);

      setTimeout(() => {
        setJob((prev) => ({ ...prev, status: 'idle' }));
      }, 4000);

    } catch (err: any) {
      console.error('Engine error:', err);
      // Failsafe: generate clean sequential clips from duration instead of failing
      const targetLen = config.durationMode === 'custom' && config.customDuration && config.customDuration > 0
        ? config.customDuration
        : (config.presetDuration || 60);

      const totalDur = currentSource.duration || 600;
      const fallbackClips: GeneratedClip[] = [];
      let curStart = 0;
      let partIdx = 1;

      while (curStart < totalDur) {
        const curEnd = Math.min(totalDur, curStart + targetLen);
        const dur = curEnd - curStart;
        if (dur <= 0) break;
        const isRemainder = curEnd === totalDur && dur < targetLen;

        const thumbSec = calculateClipThumbnailTime(curStart, curEnd);
        const fallbackThumb = await captureVideoThumbnail(
          currentSource.url,
          thumbSec,
          config.aspectRatio,
          config.verticalStyle,
          currentSource.youtubeId,
          partIdx - 1,
          curStart,
          curEnd,
          isRemainder ? `Klip ${partIdx} (Sisa ${dur}s)` : `Klip ${partIdx}`,
          config.cropPositionX ?? 50
        );

        fallbackClips.push({
          id: `clip-fallback-${partIdx}`,
          sourceId: currentSource.id,
          title: isRemainder ? `Klip ${partIdx} (Sisa ${dur}s)` : `Klip ${partIdx}`,
          hookText: `"Momen penting yang wajib Anda tonton pada bagian ${partIdx}"`,
          startTime: Math.round(curStart),
          endTime: Math.round(curEnd),
          duration: Math.round(dur),
          aspectRatio: config.aspectRatio,
          verticalStyle: config.verticalStyle,
          cropPositionX: config.cropPositionX ?? 50,
          exportQuality: config.exportQuality,
          watermark: config.watermark !== false,
          watermarkText: config.watermarkText || 'DriaClip',
          watermarkPosition: config.watermarkPosition || 'safe-top-left',
          watermarkStyle: config.watermarkStyle || 'neon-glow',
          status: 'ready',
          thumbnailBlobUrl: fallbackThumb,
          score: 92 + (partIdx % 6),
          tags: [`Klip${partIdx}`, 'DriaClip', 'Shorts'],
        });

        curStart = curEnd;
        partIdx++;
      }

      setGeneratedClips(fallbackClips);
      setJob({
        id: '',
        status: 'completed',
        progress: 100,
        stageMessage: isId 
          ? `Berhasil memotong ${fallbackClips.length} klip video (${config.exportQuality})!`
          : `Generated ${fallbackClips.length} clips (${config.exportQuality})!`,
        totalClipsToGenerate: fallbackClips.length,
        completedClipsCount: fallbackClips.length,
      });

      setTimeout(() => {
        setJob((prev) => ({ ...prev, status: 'idle' }));
      }, 3000);
    }
  };

  const handleFineTuneSave = (updated: GeneratedClip) => {
    setGeneratedClips((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    if (previewClip && previewClip.id === updated.id) {
      setPreviewClip((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  // Live config adjustments that reactively update existing clips in real-time
  const handleConfigChange = (newConfig: ClipConfig) => {
    setConfig(newConfig);
    setGeneratedClips((prevClips) =>
      prevClips.map((c) => ({
        ...c,
        watermark: newConfig.watermark !== false,
        watermarkText: newConfig.watermarkText || 'DriaClip',
        watermarkStyle: newConfig.watermarkStyle || 'neon-glow',
        watermarkPosition: newConfig.watermarkPosition || 'safe-top-left',
        exportQuality: newConfig.exportQuality || c.exportQuality,
      }))
    );
    if (previewClip) {
      setPreviewClip((prev) =>
        prev
          ? {
              ...prev,
              watermark: newConfig.watermark !== false,
              watermarkText: newConfig.watermarkText || 'DriaClip',
              watermarkStyle: newConfig.watermarkStyle || 'neon-glow',
              watermarkPosition: newConfig.watermarkPosition || 'safe-top-left',
            }
          : null
      );
    }
  };

  // Independent per-clip framing update (changing clip 1 does NOT affect clip 2 or others)
  const handleUpdateClipCrop = async (clipId: string, cropX: number) => {
    setGeneratedClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, cropPositionX: cropX } : c))
    );

    if (previewClip && previewClip.id === clipId) {
      setPreviewClip((prev) => (prev ? { ...prev, cropPositionX: cropX } : null));
    }

    // Refresh thumbnail frame in background for this specific clip
    if (currentSource?.url) {
      const targetClip = generatedClips.find((c) => c.id === clipId);
      if (targetClip) {
        try {
          const thumbSec = calculateClipThumbnailTime(targetClip.startTime, targetClip.endTime);
          const newThumb = await captureVideoThumbnail(
            currentSource.url,
            thumbSec,
            targetClip.aspectRatio,
            targetClip.verticalStyle,
            currentSource.youtubeId,
            0,
            targetClip.startTime,
            targetClip.endTime,
            targetClip.title,
            cropX
          );
          if (newThumb) {
            setGeneratedClips((prev) =>
              prev.map((c) => (c.id === clipId ? { ...c, thumbnailBlobUrl: newThumb, cropPositionX: cropX } : c))
            );
          }
        } catch {}
      }
    }
  };

  const handleDownloadClip = async (clip: GeneratedClip) => {
    if (clip.videoBlobUrl) {
      downloadClipAsMp4(clip, undefined, clip.videoExtension);
      return;
    }
    if (currentSource?.youtubeId || (currentSource?.url && !currentSource.url.startsWith('blob:') && !currentSource.url.startsWith('data:'))) {
      try {
        const res = await downloadServerRenderedClip(clip, currentSource.url, currentSource.youtubeId);
        clip.videoBlobUrl = res.url;
        clip.videoExtension = 'mp4';
        downloadClipAsMp4(clip, undefined, 'mp4');
        return;
      } catch (err: any) {
        console.error('Server render error:', err);
        return;
      }
    }
    if (currentSource?.url) {
      // Try high-speed server rendering if file is under 25MB (Cloud Run limit)
      if (currentSource.file && currentSource.file.size <= 25 * 1024 * 1024) {
        try {
          const serverLocalResult = await downloadServerRenderedLocalClip(clip, currentSource.file);
          clip.videoBlobUrl = serverLocalResult.url;
          clip.videoExtension = 'mp4';
          downloadClipAsMp4(clip, undefined, 'mp4');
          return;
        } catch (serverLocalErr) {
          console.warn('Server local render notice, falling back to browser canvas slice:', serverLocalErr);
        }
      }

      try {
        const res = await renderClipBlob(
          currentSource.url,
          clip.startTime,
          clip.endTime,
          clip.aspectRatio,
          clip.verticalStyle,
          clip.exportQuality || '720p',
          undefined,
          clip.cropPositionX ?? 50,
          clip.trackingKeyframes,
          clip.zoomOutPercent ?? 20,
          clip.watermark !== false,
          clip.watermarkPosition || 'safe-top-left',
          clip.watermarkText || 'DriaClip',
          clip.watermarkStyle || 'neon-glow'
        );
        clip.videoBlobUrl = res.url;
        clip.videoExtension = res.extension;
        downloadClipAsMp4(clip, undefined, res.extension);
      } catch (err: any) {
        console.error('Direct slice error:', err);
      }
    }
  };

  const handleSelectSampleVideo = (sample: any) => {
    setCurrentSource(sample);
    if (sample.presetHighlights && sample.presetHighlights.length > 0) {
      const mappedClips: GeneratedClip[] = sample.presetHighlights.map((h: any, idx: number) => ({
        id: `clip-${sample.id}-${idx + 1}`,
        title: h.title,
        hookText: h.hookText,
        startTime: h.startTime,
        endTime: h.endTime,
        duration: Math.max(1, h.endTime - h.startTime),
        score: h.score,
        aspectRatio: config.aspectRatio,
        verticalStyle: config.verticalStyle,
        zoomOutPercent: config.zoomOutPercent ?? 20,
        cropPositionX: 50,
        tags: h.tags,
        watermark: config.watermark,
        watermarkText: config.watermarkText || 'DriaClip',
        watermarkStyle: config.watermarkStyle || 'neon-glow',
        watermarkPosition: config.watermarkPosition,
        exportQuality: config.exportQuality,
      }));
      setGeneratedClips(mappedClips);
    }
  };

  // Seamlessly attach a local video file (e.g. MP4 downloaded from browser) without wiping existing clips
  const handleAttachVideoFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setCurrentSource((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        file: file,
        url: objectUrl,
        sourceType: 'upload',
      };
    });
  };

  // Dynamic root font size style mapping
  const fontSizeStyle = fontSize === 'small' ? 'text-[14px]' : fontSize === 'large' ? 'text-[18px]' : 'text-[16px]';

  return (
    <div 
      className={`min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors w-full max-w-full ${fontSizeStyle}`}
      style={{ fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px' }}
    >
      {/* Top Sticky Navigation */}
      <Header
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        clipsCount={generatedClips.length}
        lang={lang}
        onToggleLang={setLang}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenLegalPage={(page) => setLegalPageView(page)}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Active Job Progress Banner */}
        {job.status !== 'idle' && (
          <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg transition-all ${
            job.status === 'error'
              ? 'border-red-300 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200'
              : job.status === 'completed'
              ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
              : 'border-violet-300 dark:border-violet-800/80 bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-2">
                {job.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : job.status === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-600 dark:border-violet-400 border-t-transparent" />
                )}
                <span>{job.stageMessage || 'Processing Video with DriaClip Engine...'}</span>
              </span>
              <span className="font-mono">{job.progress}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  job.status === 'error'
                    ? 'bg-red-500'
                    : job.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500'
                }`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tab 1: Studio Workspace */}
        {activeNavTab === 'studio' && (
          <div id="workspace" className="space-y-8">
            {/* Eye-catching Hero with Big Keyword-Rich Title */}
            <HeroSection
              lang={lang}
              onStartClipping={() => {
                const el = document.getElementById('input-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />

            {/* Google AdSense Slot — Sela-sela Padding Menu 1 */}
            <AdSenseSlot slotId="5462390377" />

            {/* Step 1: Input Ingestion (File Upload from Storage) */}
            <InputSourceSection
              currentSource={currentSource}
              onReset={() => {
                setCurrentSource(null);
                setGeneratedClips([]);
                setPreviewClip(null);
                setFineTuneClip(null);
                setMarkers([]);
                setJob({
                  id: '',
                  status: 'idle',
                  progress: 0,
                  stageMessage: '',
                  totalClipsToGenerate: 0,
                  completedClipsCount: 0,
                });
              }}
              onSelectSource={(src) => {
                setCurrentSource(src);
                setGeneratedClips([]);
                setPreviewClip(null);
                setFineTuneClip(null);
                setMarkers([]);
                setJob({
                  id: '',
                  status: 'idle',
                  progress: 0,
                  stageMessage: '',
                  totalClipsToGenerate: 0,
                  completedClipsCount: 0,
                });
              }}
              isLoading={job.status !== 'idle' && job.status !== 'completed'}
              lang={lang}
            />

            {/* Google AdSense Slot — Sela-sela Padding Menu 2 */}
            <AdSenseSlot slotId="5462390377" />

            {/* Step 2: Interactive Video Player & Timeline Scrubber (Placed ABOVE configuration) */}
            <VideoTimelineScrubber
              source={currentSource}
              markers={markers}
              onAddMarker={handleAddMarker}
              onRemoveMarker={handleRemoveMarker}
              generatedClips={generatedClips}
              onSelectClipPreview={(c) => setPreviewClip(c)}
              isCustomMarkerMode={config.processingMode === 'manual-custom'}
              lang={lang}
              onUpdateDuration={(newDur) => {
                if (currentSource) {
                  setCurrentSource({
                    ...currentSource,
                    duration: newDur,
                  });
                }
              }}
              onUpdateDimensions={(w, h) => {
                if (currentSource) {
                  setCurrentSource((prev) => (prev ? { ...prev, width: w, height: h } : null));
                }
              }}
            />

            {/* Google AdSense Slot — Sela-sela Padding Menu 3 */}
            <AdSenseSlot slotId="5462390377" />

            {/* Step 3: Engine Configuration & Clip Trigger Button */}
            <ClippingControls
              config={config}
              onChangeConfig={handleConfigChange}
              onRunEngine={handleRunEngine}
              isProcessing={job.status !== 'idle' && job.status !== 'completed'}
              canProcess={!!currentSource}
              lang={lang}
              videoDuration={currentSource?.duration}
              source={currentSource}
            />

            {/* Google AdSense Slot — Sela-sela Padding Menu 4 */}
            <AdSenseSlot slotId="5462390377" />

            {/* Step 4: Clip Management Dashboard */}
            <ClipDashboard
              clips={generatedClips}
              source={currentSource}
              onPreviewClip={(clip) => setPreviewClip(clip)}
              onFineTuneClip={(clip) => setFineTuneClip(clip)}
              onUpdateClipCrop={handleUpdateClipCrop}
              onSelectSampleVideo={handleSelectSampleVideo}
              lang={lang}
              onAttachVideoFile={handleAttachVideoFile}
            />

            {/* Google AdSense Slot — Sela-sela Padding Menu 5 */}
            <AdSenseSlot slotId="5462390377" />

            {/* Why Choose DriaClip Key Advantages */}
            <WhyDriaClipSection lang={lang} />

            {/* Google AdSense Slot — Sela-sela Padding Menu 6 */}
            <AdSenseSlot slotId="5462390377" />

            {/* Step 5: High-Value SEO Informational & FAQ Sections */}
            <SeoSections lang={lang} />
          </div>
        )}

        {/* Tab 2: Standalone Clips Queue */}
        {activeNavTab === 'clips' && (
          <div className="space-y-6">
            <AdSenseSlot slotId="5462390377" />
            <ClipDashboard
              clips={generatedClips}
              source={currentSource}
              onPreviewClip={(clip) => setPreviewClip(clip)}
              onFineTuneClip={(clip) => setFineTuneClip(clip)}
              onUpdateClipCrop={handleUpdateClipCrop}
              onSelectSampleVideo={handleSelectSampleVideo}
              lang={lang}
              onAttachVideoFile={handleAttachVideoFile}
            />
            <AdSenseSlot slotId="5462390377" />
          </div>
        )}

        {/* Tab 3: Step-by-Step Guide View */}
        {activeNavTab === 'guide' && (
          <div className="space-y-6">
            <AdSenseSlot slotId="5462390377" />
            <SeoSections lang={lang} />
            <AdSenseSlot slotId="5462390377" />
          </div>
        )}

        {/* Tab 4: FAQ View */}
        {activeNavTab === 'faq' && (
          <div className="space-y-6">
            <AdSenseSlot slotId="5462390377" />
            <SeoSections lang={lang} />
            <AdSenseSlot slotId="5462390377" />
          </div>
        )}
      </main>

      {/* Modals */}
      {previewClip && (
        <ClipPreviewModal
          clip={previewClip}
          source={currentSource}
          onClose={() => setPreviewClip(null)}
          onDownload={handleDownloadClip}
          onUpdateClip={handleFineTuneSave}
          onUpdateCrop={(cropX) => handleUpdateClipCrop(previewClip.id, cropX)}
          lang={lang}
        />
      )}

      {fineTuneClip && currentSource && (
        <ClipFineTuneModal
          clip={fineTuneClip}
          source={currentSource}
          maxSourceDuration={currentSource.duration}
          onClose={() => setFineTuneClip(null)}
          onSave={handleFineTuneSave}
          lang={lang}
        />
      )}

      <LegalAndInfoPages
        currentPage={legalPageView}
        onClose={() => setLegalPageView('none')}
        lang={lang}
      />

      {/* Production Footer with Copyright & Sub-branding by Driacom */}
      <Footer
        lang={lang}
        onOpenLegalPage={(page) => setLegalPageView(page)}
      />

      {/* Floating Scroll to Top Button */}
      <ScrollToTopButton label={isId ? 'Kembali ke atas' : 'Back to top'} />
    </div>
  );
}
