import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { IncomingMessage, ServerResponse } from 'http';
import type { TrackingKeyframe } from '../types/driaclip.ts';

const execFileAsync = promisify(execFile);

const CACHE_DIR = path.join(os.tmpdir(), 'driaclip_cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Locate yt-dlp binary and make sure executable
function getYtDlpPath(): string {
  const candidates = [
    '/usr/local/bin/yt-dlp',
    path.resolve(process.cwd(), 'bin/yt-dlp'),
    path.resolve('/app/applet/bin/yt-dlp'),
    '/usr/bin/yt-dlp',
    'yt-dlp',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        fs.chmodSync(c, 0o755);
      } catch {}
      return c;
    }
  }
  return 'yt-dlp';
}

function getNodePath(): string {
  if (fs.existsSync('/usr/local/bin/node')) return '/usr/local/bin/node';
  if (fs.existsSync('/usr/bin/node')) return '/usr/bin/node';
  return 'node';
}

const YT_DLP_PATH = getYtDlpPath();

export interface RenderClipRequest {
  url?: string;
  youtubeId?: string;
  startTime?: number;
  endTime?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  verticalStyle?: 'center-crop' | 'auto-track' | 'blur-background' | 'letterbox';
  cropPositionX?: number;
  zoomOutPercent?: number;
  trackingKeyframes?: TrackingKeyframe[];
  quality?: '1080p' | '720p' | '480p' | '360p';
  title?: string;
  watermark?: boolean;
  watermarkText?: string;
  watermarkPosition?: 'safe-top-left' | 'safe-top-right' | 'center-top' | 'safe-bottom-left' | 'safe-bottom-right';
  watermarkStyle?: 'neon-glow' | 'glass-blur' | 'minimal-dark' | 'gradient-accent';
}

function getBaseEncoderArgs(outputPath: string): string[] {
  return [
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-threads',
    '0',
    '-crf',
    '20',
    '-r',
    '30',
    '-vsync',
    'cfr',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-level',
    '4.1',
    '-avoid_negative_ts',
    'make_zero',
    '-movflags',
    '+faststart',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '44100',
    '-ac',
    '2',
    '-af',
    'aresample=async=1000',
    outputPath,
  ];
}

/**
 * Generates strategic FFmpeg drawtext watermark filter.
 * Positioned in the anti-crop vertical safe zone with visitor's custom text.
 */
function getWatermarkFilter(
  targetW: number,
  targetH: number,
  aspectRatio: '16:9' | '9:16' | '1:1',
  position: 'safe-top-left' | 'safe-top-right' | 'center-top' | 'safe-bottom-left' | 'safe-bottom-right' = 'safe-top-left',
  customText: string = 'DriaClip',
  style: string = 'neon-glow'
): string {
  const fs = Math.max(18, Math.round(targetW * 0.033));
  const bw = Math.max(6, Math.round(fs * 0.35));

  // Sanitize text for FFmpeg drawtext (drop escape-breaking chars)
  const cleanText = (customText || 'DriaClip')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%')
    .slice(0, 35) || 'DriaClip';

  let xExpr = '36';
  let yExpr = '88';

  if (aspectRatio === '9:16') {
    const safeTop = Math.round(targetH * 0.068);
    const safeBottom = Math.round(targetH * 0.82);
    const safeMarginX = Math.round(targetW * 0.05);

    if (position === 'safe-top-right') {
      xExpr = `w-tw-${safeMarginX}`;
      yExpr = `${safeTop}`;
    } else if (position === 'center-top') {
      xExpr = `(w-tw)/2`;
      yExpr = `${Math.round(targetH * 0.062)}`;
    } else if (position === 'safe-bottom-left') {
      xExpr = `${safeMarginX}`;
      yExpr = `${safeBottom}`;
    } else if (position === 'safe-bottom-right') {
      xExpr = `w-tw-${safeMarginX}`;
      yExpr = `${safeBottom}`;
    } else {
      // safe-top-left (Default - most tamper-resistant)
      xExpr = `${safeMarginX}`;
      yExpr = `${safeTop}`;
    }
  } else if (aspectRatio === '1:1') {
    const margin = Math.round(targetW * 0.04);
    if (position === 'safe-top-right') {
      xExpr = `w-tw-${margin}`;
      yExpr = `${margin}`;
    } else if (position === 'center-top') {
      xExpr = `(w-tw)/2`;
      yExpr = `${margin}`;
    } else if (position === 'safe-bottom-left') {
      xExpr = `${margin}`;
      yExpr = `h-th-${margin}`;
    } else if (position === 'safe-bottom-right') {
      xExpr = `w-tw-${margin}`;
      yExpr = `h-th-${margin}`;
    } else {
      xExpr = `${margin}`;
      yExpr = `${margin}`;
    }
  } else {
    // 16:9
    const marginX = Math.round(targetW * 0.035);
    const marginY = Math.round(targetH * 0.05);
    if (position === 'safe-top-right') {
      xExpr = `w-tw-${marginX}`;
      yExpr = `${marginY}`;
    } else if (position === 'center-top') {
      xExpr = `(w-tw)/2`;
      yExpr = `${marginY}`;
    } else if (position === 'safe-bottom-left') {
      xExpr = `${marginX}`;
      yExpr = `h-th-${marginY}`;
    } else if (position === 'safe-bottom-right') {
      xExpr = `w-tw-${marginX}`;
      yExpr = `h-th-${marginY}`;
    } else {
      xExpr = `${marginX}`;
      yExpr = `${marginY}`;
    }
  }

  const boxColor = style === 'glass-blur' ? 'black@0.45' : 'black@0.55';
  return `drawtext=text='[  ${cleanText.toUpperCase()}  ]':fontcolor=white@0.98:fontsize=${fs}:box=1:boxcolor=${boxColor}:boxborderw=${bw}:shadowcolor=black@0.90:shadowx=2:shadowy=2:x=${xExpr}:y=${yExpr}`;
}

/**
 * Core handler to download & render clip into an authentic MP4 using yt-dlp and ffmpeg
 * with comfortable zoomed-out center-crop and optional full blur/letterbox.
 */
export async function handleRenderClip(body: RenderClipRequest): Promise<{ filePath: string; fileName: string; cleanup: () => void }> {
  const {
    url,
    youtubeId,
    startTime = 0,
    endTime = 15,
    aspectRatio = '9:16',
    verticalStyle = 'center-crop',
    cropPositionX = 50,
    trackingKeyframes,
    quality = '720p',
    title = 'clip',
  } = body;

  const targetUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : url;
  if (!targetUrl) {
    throw new Error('Parameter video URL atau youtubeId wajib disertakan');
  }

  const safeStart = Math.max(0, Math.round(Number(startTime) || 0));
  const safeEnd = Math.max(safeStart + 1, Math.round(Number(endTime) || 15));
  const safeTitle = (String(title) || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

  const clipId = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rawClipPath = path.join(CACHE_DIR, `${clipId}_raw.mp4`);
  const finalClipPath = path.join(CACHE_DIR, `${clipId}_final.mp4`);

  const findDownloadedRawFile = (): string | null => {
    if (fs.existsSync(rawClipPath)) {
      try {
        if (fs.statSync(rawClipPath).size > 1000) return rawClipPath;
      } catch {}
    }
    try {
      const files = fs.readdirSync(CACHE_DIR);
      for (const f of files) {
        if (f.startsWith(`${clipId}_raw`) && !f.endsWith('.part') && !f.endsWith('.ytdl')) {
          const full = path.join(CACHE_DIR, f);
          try {
            if (fs.statSync(full).size > 1000) return full;
          } catch {}
        }
      }
    } catch {}
    return null;
  };

  const cleanup = () => {
    try {
      if (fs.existsSync(rawClipPath)) fs.unlinkSync(rawClipPath);
      if (fs.existsSync(finalClipPath)) fs.unlinkSync(finalClipPath);
      const files = fs.readdirSync(CACHE_DIR);
      for (const f of files) {
        if (f.startsWith(clipId)) {
          try { fs.unlinkSync(path.join(CACHE_DIR, f)); } catch {}
        }
      }
    } catch {}
  };

  // 1. Direct local sample optimization: if file is already on server, slice directly with ffmpeg!
  let localSamplePath: string | null = null;
  if (targetUrl.startsWith('/samples/')) {
    localSamplePath = path.join(process.cwd(), 'public', targetUrl);
  } else if (targetUrl.includes('/samples/')) {
    try {
      const u = new URL(targetUrl);
      if (u.pathname.startsWith('/samples/')) {
        localSamplePath = path.join(process.cwd(), 'public', u.pathname);
      }
    } catch {}
  }

  // 1b. Check if local video file matching YouTube ID or filename already exists on server
  const effectiveYtId = youtubeId || (targetUrl.match(/(?:v=|youtu\.be\/|\/shorts\/)([^"&?/\s]{11})/i)?.[1]);
  if (effectiveYtId) {
    const searchDirs = [
      process.cwd(),
      path.join(process.cwd(), 'public', 'samples'),
      CACHE_DIR,
    ];
    for (const sDir of searchDirs) {
      if (fs.existsSync(sDir)) {
        try {
          const files = fs.readdirSync(sDir);
          for (const f of files) {
            if (f.includes(effectiveYtId) && (f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mkv'))) {
              localSamplePath = path.join(sDir, f);
              break;
            }
          }
        } catch {}
        if (localSamplePath) break;
      }
    }
  }

  if (localSamplePath && fs.existsSync(localSamplePath)) {
    console.log(`[DriaClip] Using local matched video for ${effectiveYtId || targetUrl}: ${localSamplePath}`);
    return await handleRenderLocalClip(localSamplePath, body);
  }

  try {
    const clipDuration = Math.max(1, safeEnd - safeStart);
    const ytDlpTimeoutMs = Math.max(60000, clipDuration * 2500);
    const ffmpegTimeoutMs = Math.max(120000, clipDuration * 3000);

    const targetHeight = quality === '1080p' ? 1080 : quality === '720p' ? 720 : quality === '480p' ? 480 : 360;

    // Multi-strategy resilient downloader designed specifically to bypass YouTube datacenter bot challenges
    // Tested strategies:
    // 1. Mobile Web (mweb) + Node.js challenge solver: Bypasses desktop BotGuard checks on datacenter IPs
    // 2. Mobile Native & TV (android,ios,tv): Accesses mobile Googlevideo streams
    // 3. TV client endpoint: Skips web challenges
    // 4. Progressive MP4 fallback (format 18): High-speed direct CDN stream
    const downloadStrategies = [
      {
        name: 'mweb-hq',
        extractorArgs: ['--extractor-args', 'youtube:player_client=mweb'],
        format: `bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}]/18/best`,
      },
      {
        name: 'android-tv-hq',
        extractorArgs: ['--extractor-args', 'youtube:player_client=android,ios,tv'],
        format: `bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}]/18/best`,
      },
      {
        name: 'mweb-progressive',
        extractorArgs: ['--extractor-args', 'youtube:player_client=mweb'],
        format: '18/best',
      },
      {
        name: 'android-tv-progressive',
        extractorArgs: ['--extractor-args', 'youtube:player_client=android,tv'],
        format: '18/best',
      },
      {
        name: 'tv-direct',
        extractorArgs: ['--extractor-args', 'youtube:player_client=tv'],
        format: 'best',
      },
      {
        name: 'default-fallback',
        extractorArgs: [],
        format: 'best',
      },
    ];

    let downloaded = false;
    let actualRawPath: string | null = null;
    let lastError: any = null;
    const nodeRuntime = getNodePath();

    for (const strat of downloadStrategies) {
      if (downloaded) break;

      const ytDlpArgs = [
        '--js-runtimes',
        `node:${nodeRuntime}`,
        ...strat.extractorArgs,
        '--user-agent',
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
        '--referer',
        'https://www.youtube.com/',
        '--no-check-certificates',
        '--socket-timeout',
        '15',
        '--retries',
        '2',
        '--no-playlist',
        '--no-write-subs',
        '--no-write-auto-subs',
        '--no-embed-subs',
        '--sub-langs',
        'none',
        '--download-sections',
        `*${safeStart}-${safeEnd}`,
        '--force-keyframes-at-cuts',
        '--merge-output-format',
        'mp4',
        '-f',
        strat.format,
        targetUrl,
        '-o',
        rawClipPath,
      ];

      const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
      if (fs.existsSync(cookiesPath)) {
        ytDlpArgs.push('--cookies', cookiesPath);
      }

      try {
        await execFileAsync(YT_DLP_PATH, ytDlpArgs, { timeout: ytDlpTimeoutMs });
        const found = findDownloadedRawFile();
        if (found) {
          actualRawPath = found;
          downloaded = true;
          break;
        }
      } catch (ytErr: any) {
        lastError = ytErr;
        const found = findDownloadedRawFile();
        if (found) {
          actualRawPath = found;
          downloaded = true;
          break;
        }

        const errOut = ytErr?.stderr || ytErr?.stdout || ytErr?.message || '';
        if (errOut.includes('Video unavailable') || errOut.includes('Private video')) {
          break; // Stop immediately if video is fundamentally private or deleted
        }
        // Otherwise continue to next resilient strategy
      }
    }

    const finalRawPath = actualRawPath || findDownloadedRawFile();
    if (!finalRawPath || !fs.existsSync(finalRawPath)) {
      const errOut = lastError?.stderr || lastError?.stdout || lastError?.message || '';
      if (errOut.includes('Sign in to confirm you’re not a bot') || errOut.includes('bot')) {
        throw new Error('YOUTUBE_BOT_PROTECTION: YouTube menerapkan proteksi bot pada cloud server. Pasang Cookie YouTube (cookies.txt) melalui menu "Cookie YouTube" di atas atau unduh video di perangkat Anda lalu unggah file MP4.');
      }
      throw new Error(`Gagal mengunduh bagian klip dari sumber video: ${lastError?.message || 'Download gagal'}`);
    }

    // Cache master raw video for future clips from same video
    if (effectiveYtId) {
      try {
        const cachedMaster = path.join(CACHE_DIR, `${effectiveYtId}_master.mp4`);
        if (!fs.existsSync(cachedMaster)) {
          fs.copyFileSync(finalRawPath, cachedMaster);
        }
      } catch {}
    }

    // 2. Determine target width & height
    let targetW = 720;
    let targetH = 1280;
    if (quality === '1080p') {
      targetW = aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920;
      targetH = aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;
    } else if (quality === '720p') {
      targetW = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 720 : 1280;
      targetH = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 720 : 720;
    } else if (quality === '480p') {
      targetW = aspectRatio === '9:16' ? 480 : aspectRatio === '1:1' ? 480 : 854;
      targetH = aspectRatio === '9:16' ? 854 : aspectRatio === '1:1' ? 480 : 480;
    } else if (quality === '360p') {
      targetW = aspectRatio === '9:16' ? 360 : aspectRatio === '1:1' ? 360 : 640;
      targetH = aspectRatio === '9:16' ? 640 : aspectRatio === '1:1' ? 360 : 360;
    }

    // Ensure even dimensions for H.264 encoder
    targetW = targetW % 2 === 0 ? targetW : targetW - 1;
    targetH = targetH % 2 === 0 ? targetH : targetH - 1;

    const enableWatermark = body.watermark !== false;
    const wmFilter = enableWatermark
      ? getWatermarkFilter(targetW, targetH, aspectRatio, body.watermarkPosition, body.watermarkText || 'DriaClip', body.watermarkStyle || 'neon-glow')
      : null;

    // -sn strictly disables and drops all subtitle streams so no captions appear or get cut off!
    const ffmpegArgs: string[] = ['-y', '-sn', '-i', finalRawPath];

    if (aspectRatio === '9:16') {
      if (verticalStyle === 'blur-background') {
        // High-speed downscale-blur-upscale backdrop + sharp centered foreground
        const filterComplex = wmFilter
          ? `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[comp];[comp]${wmFilter}[outv]`
          : `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`;

        ffmpegArgs.push(
          '-filter_complex',
          filterComplex,
          '-map',
          '[outv]',
          '-map',
          '0:a?',
          ...getBaseEncoderArgs(finalClipPath)
        );
      } else if (verticalStyle === 'letterbox') {
        // Crisp 16:9 centered with pure black letterbox bars top & bottom
        const vfStr = wmFilter
          ? `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black,${wmFilter}`
          : `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;

        ffmpegArgs.push(
          '-vf',
          vfStr,
          '-map',
          '0:v',
          '-map',
          '0:a?',
          ...getBaseEncoderArgs(finalClipPath)
        );
      } else {
        // Direct automatic 9:16 vertical crop with manual pan (cropPositionX)
        const cropRatio = Math.max(0, Math.min(100, Number(cropPositionX ?? 50))) / 100;
        const vfStr = wmFilter
          ? `scale=-2:${targetH},crop=${targetW}:${targetH}:(in_w-${targetW})*${cropRatio.toFixed(3)}:0,${wmFilter}`
          : `scale=-2:${targetH},crop=${targetW}:${targetH}:(in_w-${targetW})*${cropRatio.toFixed(3)}:0`;

        ffmpegArgs.push(
          '-vf',
          vfStr,
          '-map',
          '0:v',
          '-map',
          '0:a?',
          ...getBaseEncoderArgs(finalClipPath)
        );
      }
    } else if (aspectRatio === '1:1') {
      const dim = targetW;
      const ratio = Math.max(0, Math.min(100, Number(cropPositionX) || 50)) / 100;
      const vfStr = wmFilter
        ? `scale=-2:${dim},crop=${dim}:${dim}:(in_w-${dim})*${ratio}:0,${wmFilter}`
        : `scale=-2:${dim},crop=${dim}:${dim}:(in_w-${dim})*${ratio}:0`;

      ffmpegArgs.push(
        '-vf',
        vfStr,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        ...getBaseEncoderArgs(finalClipPath)
      );
    } else {
      // 16:9 landscape format
      const vfStr = wmFilter
        ? `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black,${wmFilter}`
        : `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;

      ffmpegArgs.push(
        '-vf',
        vfStr,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        ...getBaseEncoderArgs(finalClipPath)
      );
    }

    await execFileAsync('/usr/bin/ffmpeg', ffmpegArgs, { timeout: ffmpegTimeoutMs });

    const outputPath = fs.existsSync(finalClipPath) ? finalClipPath : finalRawPath;
    const fileName = `driaclip_${quality}_${safeTitle}.mp4`;

    return { filePath: outputPath, fileName, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

/**
 * Handle rendering a local video file with accurate trimming and aspect ratio transformation
 */
export async function handleRenderLocalClip(
  sourceFilePath: string,
  options: RenderClipRequest
): Promise<{ filePath: string; fileName: string; cleanup: () => void }> {
  const {
    startTime = 0,
    endTime = 15,
    aspectRatio = '9:16',
    verticalStyle = 'center-crop',
    cropPositionX = 50,
    zoomOutPercent = 20,
    quality = '720p',
    title = 'clip',
  } = options;

  const safeStart = Math.max(0, Number(startTime) || 0);
  const safeEnd = Math.max(safeStart + 0.5, Number(endTime) || 15);
  const safeDuration = safeEnd - safeStart;
  const safeTitle = (String(title) || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

  const clipId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalClipPath = path.join(CACHE_DIR, `${clipId}_final.mp4`);

  const cleanup = () => {
    try {
      if (fs.existsSync(finalClipPath)) fs.unlinkSync(finalClipPath);
    } catch {}
  };

  try {
    let targetW = 720;
    let targetH = 1280;
    if (quality === '1080p') {
      targetW = aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920;
      targetH = aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;
    } else if (quality === '720p') {
      targetW = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 720 : 1280;
      targetH = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 720 : 720;
    } else if (quality === '480p') {
      targetW = aspectRatio === '9:16' ? 480 : aspectRatio === '1:1' ? 480 : 854;
      targetH = aspectRatio === '9:16' ? 854 : aspectRatio === '1:1' ? 480 : 480;
    } else if (quality === '360p') {
      targetW = aspectRatio === '9:16' ? 360 : aspectRatio === '1:1' ? 360 : 640;
      targetH = aspectRatio === '9:16' ? 640 : aspectRatio === '1:1' ? 360 : 360;
    }

    targetW = targetW % 2 === 0 ? targetW : targetW - 1;
    targetH = targetH % 2 === 0 ? targetH : targetH - 1;

    const enableWatermark = options.watermark !== false;
    const wmFilter = enableWatermark
      ? getWatermarkFilter(targetW, targetH, aspectRatio, options.watermarkPosition, options.watermarkText || 'DriaClip', options.watermarkStyle || 'neon-glow')
      : null;

    const ffmpegTimeoutMs = Math.max(300000, safeDuration * 5000);

    const ffmpegArgs: string[] = [
      '-y',
      '-ss',
      String(safeStart),
      '-accurate_seek',
      '-i',
      sourceFilePath,
      '-t',
      String(safeDuration),
      '-sn',
      '-avoid_negative_ts',
      'make_zero',
    ];

    if (aspectRatio === '9:16') {
      if (verticalStyle === 'blur-background') {
        const filterComplex = wmFilter
          ? `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[comp];[comp]${wmFilter}[outv]`
          : `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`;

        ffmpegArgs.push(
          '-filter_complex',
          filterComplex,
          '-map',
          '[outv]',
          '-map',
          '0:a?',
          ...getBaseEncoderArgs(finalClipPath)
        );
      } else if (verticalStyle === 'letterbox') {
        const vfStr = wmFilter
          ? `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black,${wmFilter}`
          : `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;

        ffmpegArgs.push(
          '-vf',
          vfStr,
          '-map',
          '0:v',
          '-map',
          '0:a?',
          ...getBaseEncoderArgs(finalClipPath)
        );
      } else {
        // Direct automatic 9:16 vertical crop with manual pan (cropPositionX)
        const cropRatio = Math.max(0, Math.min(100, Number(options.cropPositionX ?? 50))) / 100;
        const vfStr = wmFilter
          ? `scale=-2:${targetH},crop=${targetW}:${targetH}:(in_w-${targetW})*${cropRatio.toFixed(3)}:0,${wmFilter}`
          : `scale=-2:${targetH},crop=${targetW}:${targetH}:(in_w-${targetW})*${cropRatio.toFixed(3)}:0`;

        ffmpegArgs.push(
          '-vf',
          vfStr,
          '-map',
          '0:v',
          '-map',
          '0:a?',
          ...getBaseEncoderArgs(finalClipPath)
        );
      }
    } else if (aspectRatio === '1:1') {
      const dim = targetW;
      const ratio = Math.max(0, Math.min(100, Number(cropPositionX) || 50)) / 100;
      const vfStr = wmFilter
        ? `scale=-2:${dim},crop=${dim}:${dim}:(in_w-${dim})*${ratio}:0,${wmFilter}`
        : `scale=-2:${dim},crop=${dim}:${dim}:(in_w-${dim})*${ratio}:0`;

      ffmpegArgs.push(
        '-vf',
        vfStr,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        ...getBaseEncoderArgs(finalClipPath)
      );
    } else {
      const vfStr = wmFilter
        ? `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black,${wmFilter}`
        : `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;

      ffmpegArgs.push(
        '-vf',
        vfStr,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        ...getBaseEncoderArgs(finalClipPath)
      );
    }

    await execFileAsync('/usr/bin/ffmpeg', ffmpegArgs, { timeout: ffmpegTimeoutMs });

    const outputPath = fs.existsSync(finalClipPath) ? finalClipPath : sourceFilePath;
    const fileName = `driaclip_${quality}_${safeTitle}.mp4`;

    return { filePath: outputPath, fileName, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

/**
 * Connect/Vite/Express middleware for /api/render-clip
 */
export async function renderClipMiddleware(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let bodyStr = '';
  req.on('data', (chunk) => {
    bodyStr += chunk;
  });

  req.on('end', async () => {
    try {
      const body = JSON.parse(bodyStr || '{}');
      const { filePath, fileName, cleanup } = await handleRenderClip(body);

      const stat = fs.statSync(filePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      readStream.on('close', () => {
        cleanup();
      });
      readStream.on('error', () => {
        cleanup();
      });
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Gagal memproses klip video' }));
    }
  });
}
