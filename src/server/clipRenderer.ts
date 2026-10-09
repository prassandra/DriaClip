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
const YT_DLP_PATH = path.resolve(process.cwd(), 'bin/yt-dlp');
if (fs.existsSync(YT_DLP_PATH)) {
  try {
    fs.chmodSync(YT_DLP_PATH, 0o755);
  } catch {}
}

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

  const cleanup = () => {
    try {
      if (fs.existsSync(rawClipPath)) fs.unlinkSync(rawClipPath);
      if (fs.existsSync(finalClipPath)) fs.unlinkSync(finalClipPath);
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

  if (localSamplePath && fs.existsSync(localSamplePath)) {
    return await handleRenderLocalClip(localSamplePath, body);
  }

  try {
    const clipDuration = Math.max(1, safeEnd - safeStart);
    const ytDlpTimeoutMs = Math.max(60000, clipDuration * 2500);
    const ffmpegTimeoutMs = Math.max(120000, clipDuration * 3000);

    let formatSpec = '18/b[ext=mp4]/best';
    if (quality === '1080p') {
      formatSpec = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/18/best';
    } else if (quality === '480p' || quality === '360p') {
      formatSpec = '18/bestvideo[height<=480]+bestaudio/best[height<=480]/best';
    }

    // Fast-first client strategy: default solver first (fastest & handles visionos/web), then fallbacks
    const clientCandidates: (string | null)[] = [
      null, // standard default
      'youtube:player_client=tv,web',
      'youtube:player_client=ios,mweb',
    ];

    let downloaded = false;
    let lastError: any = null;

    for (const clientArg of clientCandidates) {
      if (downloaded) break;

      const ytDlpArgs = [
        '--js-runtimes',
        'node:/usr/local/bin/node',
        '--no-check-certificates',
        '--socket-timeout',
        '15',
        '--retries',
        '1',
        '--download-sections',
        `*${safeStart}-${safeEnd}`,
        '--force-keyframes-at-cuts',
        '-f',
        formatSpec,
        targetUrl,
        '-o',
        rawClipPath,
      ];

      if (clientArg) {
        ytDlpArgs.push('--extractor-args', clientArg);
      }

      const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
      if (fs.existsSync(cookiesPath)) {
        ytDlpArgs.push('--cookies', cookiesPath);
      }

      try {
        await execFileAsync(YT_DLP_PATH, ytDlpArgs, { timeout: ytDlpTimeoutMs });
        if (fs.existsSync(rawClipPath) && fs.statSync(rawClipPath).size > 1000) {
          downloaded = true;
          break;
        }
      } catch (ytErr: any) {
        lastError = ytErr;
        const errOut = ytErr?.stderr || ytErr?.stdout || ytErr?.message || '';
        if (errOut.includes('Video unavailable') || errOut.includes('Private video')) {
          break;
        }
        continue;
      }
    }

    if (!downloaded || !fs.existsSync(rawClipPath)) {
      const errOut = lastError?.stderr || lastError?.stdout || lastError?.message || '';
      if (errOut.includes('Sign in to confirm you’re not a bot') || errOut.includes('bot')) {
        throw new Error('YOUTUBE_BOT_PROTECTION: YouTube menerapkan verifikasi bot pada video ini di cloud server. Silakan coba unggah file video (MP4/WebM) secara langsung atau coba link video lain.');
      }
      throw new Error(`Gagal mengunduh bagian klip dari sumber video: ${lastError?.message || 'Download gagal'}`);
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

    const ffmpegArgs: string[] = ['-y', '-i', rawClipPath];

    if (aspectRatio === '9:16') {
      if (verticalStyle === 'blur-background') {
        // High-speed downscale-blur-upscale backdrop + sharp centered foreground
        ffmpegArgs.push(
          '-filter_complex',
          `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
          '-map',
          '[outv]',
          '-map',
          '0:a?',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-threads',
          '0',
          '-crf',
          '23',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          finalClipPath
        );
      } else if (verticalStyle === 'letterbox') {
        // Crisp 16:9 centered with pure black letterbox bars top & bottom
        ffmpegArgs.push(
          '-vf',
          `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`,
          '-map',
          '0:v',
          '-map',
          '0:a?',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-threads',
          '0',
          '-crf',
          '23',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          finalClipPath
        );
      } else {
        // center-crop: Centered at 50% with comfortable Zoom-Out and high-speed blurred backdrop
        const zoomFactor = Math.max(0.05, Math.min(0.45, (Number(body.zoomOutPercent) || 20) / 100));
        const tightH = targetH;
        const fitH = Math.round(targetW / (16 / 9));
        const rawFgH = Math.round(tightH - (tightH - fitH) * zoomFactor * 1.8);
        const safeFgH = rawFgH % 2 === 0 ? rawFgH : rawFgH - 1;

        ffmpegArgs.push(
          '-filter_complex',
          `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=-2:${safeFgH}[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
          '-map',
          '[outv]',
          '-map',
          '0:a?',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-threads',
          '0',
          '-crf',
          '23',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          finalClipPath
        );
      }
    } else if (aspectRatio === '1:1') {
      const dim = targetW;
      const ratio = Math.max(0, Math.min(100, Number(cropPositionX) || 50)) / 100;
      ffmpegArgs.push(
        '-vf',
        `scale=-2:${dim},crop=${dim}:${dim}:(in_w-${dim})*${ratio}:0`,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-threads',
        '0',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        finalClipPath
      );
    } else {
      // 16:9 landscape format
      ffmpegArgs.push(
        '-vf',
        `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-threads',
        '0',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        finalClipPath
      );
    }

    await execFileAsync('/usr/bin/ffmpeg', ffmpegArgs, { timeout: ffmpegTimeoutMs });

    const outputPath = fs.existsSync(finalClipPath) ? finalClipPath : rawClipPath;
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

    const ffmpegTimeoutMs = Math.max(300000, safeDuration * 5000);

    const ffmpegArgs: string[] = [
      '-y',
      '-ss',
      String(safeStart),
      '-t',
      String(safeDuration),
      '-i',
      sourceFilePath,
    ];

    if (aspectRatio === '9:16') {
      if (verticalStyle === 'blur-background') {
        ffmpegArgs.push(
          '-filter_complex',
          `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
          '-map',
          '[outv]',
          '-map',
          '0:a?',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-threads',
          '0',
          '-crf',
          '23',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          finalClipPath
        );
      } else if (verticalStyle === 'letterbox') {
        ffmpegArgs.push(
          '-vf',
          `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`,
          '-map',
          '0:v',
          '-map',
          '0:a?',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-threads',
          '0',
          '-crf',
          '23',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          finalClipPath
        );
      } else {
        // center-crop with comfortable Zoom-Out
        const zoomFactor = Math.max(0.05, Math.min(0.45, (Number(zoomOutPercent) || 20) / 100));
        const tightH = targetH;
        const fitH = Math.round(targetW / (16 / 9));
        const rawFgH = Math.round(tightH - (tightH - fitH) * zoomFactor * 1.8);
        const safeFgH = rawFgH % 2 === 0 ? rawFgH : rawFgH - 1;

        ffmpegArgs.push(
          '-filter_complex',
          `[0:v]scale=180:320:force_original_aspect_ratio=increase,crop=180:320:(in_w-180)/2:(in_h-320)/2,boxblur=5:2,scale=${targetW}:${targetH}[bg];[0:v]scale=-2:${safeFgH}[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
          '-map',
          '[outv]',
          '-map',
          '0:a?',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-threads',
          '0',
          '-crf',
          '23',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          finalClipPath
        );
      }
    } else if (aspectRatio === '1:1') {
      const dim = targetW;
      const ratio = Math.max(0, Math.min(100, Number(cropPositionX) || 50)) / 100;
      ffmpegArgs.push(
        '-vf',
        `scale=-2:${dim},crop=${dim}:${dim}:(in_w-${dim})*${ratio}:0`,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-threads',
        '0',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        finalClipPath
      );
    } else {
      ffmpegArgs.push(
        '-vf',
        `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`,
        '-map',
        '0:v',
        '-map',
        '0:a?',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-threads',
        '0',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        finalClipPath
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
