import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import type { IncomingMessage, ServerResponse } from 'http';
import { 
  analyzePixelBuffer, 
  SmoothCameraFollower, 
  buildFfmpegCropExpression, 
  TrackingKeyframe 
} from '../services/smartTracking.ts';

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
  verticalStyle?: 'auto-track' | 'blur-background' | 'letterbox';
  cropPositionX?: number;
  trackingKeyframes?: TrackingKeyframe[];
  quality?: '1080p' | '720p' | '480p' | '360p';
  title?: string;
}

/**
 * Server-side High Speed Video Frame Analyzer.
 * Extracts 1 sample frame per second directly via ffmpeg stdout pipe (zero disk IO),
 * runs the multi-face & active-speaker detection engine, and produces smooth tracking keyframes.
 */
async function analyzeVideoFileForTracking(
  videoFilePath: string,
  targetW: number = 720
): Promise<string> {
  return new Promise((resolve) => {
    const frameW = 160;
    const frameH = 90;
    const bytesPerFrame = frameW * frameH * 3; // RGB24 stride 3

    const ffmpegProc = spawn('/usr/bin/ffmpeg', [
      '-i',
      videoFilePath,
      '-vf',
      `fps=1.2,scale=${frameW}:${frameH}`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-',
    ]);

    const chunks: Buffer[] = [];
    ffmpegProc.stdout.on('data', (d) => chunks.push(d));

    ffmpegProc.on('error', () => {
      resolve(`(in_w-${targetW})*0.5`);
    });

    ffmpegProc.on('close', () => {
      try {
        const fullBuffer = Buffer.concat(chunks);
        const totalFrames = Math.floor(fullBuffer.length / bytesPerFrame);

        if (totalFrames <= 0) {
          resolve(`(in_w-${targetW})*0.5`);
          return;
        }

        const follower = new SmoothCameraFollower(50, 0.1, 1.8);
        const keyframes: TrackingKeyframe[] = [];
        let prevFrame: Uint8Array | null = null;

        for (let i = 0; i < totalFrames; i++) {
          const offset = i * bytesPerFrame;
          const frameBytes = fullBuffer.subarray(offset, offset + bytesPerFrame);
          const timeSec = Math.round((i / 1.2) * 10) / 10;

          const analysis = analyzePixelBuffer(frameBytes, frameW, frameH, prevFrame, 3);
          prevFrame = frameBytes;

          const smoothCropX = follower.update(analysis.targetCropX, analysis.isSceneCut);
          keyframes.push({
            time: timeSec,
            cropX: smoothCropX,
          });
        }

        const expr = buildFfmpegCropExpression(keyframes, 0, targetW);
        resolve(expr);
      } catch {
        resolve(`(in_w-${targetW})*0.5`);
      }
    });

    // Safety timeout after 5 seconds
    setTimeout(() => {
      try {
        ffmpegProc.kill();
      } catch {}
      resolve(`(in_w-${targetW})*0.5`);
    }, 5500);
  });
}

/**
 * Core handler to download & render clip into an authentic MP4 using yt-dlp and ffmpeg
 * with dynamic AI camera follow / active speaker tracking.
 */
export async function handleRenderClip(body: RenderClipRequest): Promise<{ filePath: string; fileName: string; cleanup: () => void }> {
  const {
    url,
    youtubeId,
    startTime = 0,
    endTime = 15,
    aspectRatio = '9:16',
    verticalStyle = 'auto-track',
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

  try {
    // 1. Download target section with yt-dlp
    const ytDlpArgs = [
      '--js-runtimes',
      'node:/usr/local/bin/node',
      '--no-check-certificates',
    ];

    const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
    if (fs.existsSync(cookiesPath)) {
      ytDlpArgs.push('--cookies', cookiesPath);
    }

    ytDlpArgs.push(
      '--download-sections',
      `*${safeStart}-${safeEnd}`,
      '--force-keyframes-at-cuts',
      '-f',
      '18/b[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
      targetUrl,
      '-o',
      rawClipPath
    );

    try {
      await execFileAsync(YT_DLP_PATH, ytDlpArgs, { timeout: 60000 });
    } catch (ytErr: any) {
      const errOut = ytErr?.stderr || ytErr?.stdout || ytErr?.message || '';
      if (errOut.includes('Sign in to confirm you’re not a bot') || errOut.includes('bot')) {
        throw new Error('YOUTUBE_BOT_PROTECTION: YouTube mendeteksi bot scraping pada IP server. Generator dialihkan ke peramban.');
      }
      throw new Error(`Gagal mengunduh bagian klip dari sumber YouTube: ${ytErr?.message || 'yt-dlp error'}`);
    }

    if (!fs.existsSync(rawClipPath)) {
      throw new Error('Gagal mengunduh bagian klip dari sumber YouTube/video.');
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

    const ffmpegArgs: string[] = ['-y', '-i', rawClipPath];

    if (aspectRatio === '9:16') {
      if (verticalStyle === 'blur-background') {
        // Crisp centered 16:9, blurred video backdrop filling top and bottom
        ffmpegArgs.push(
          '-filter_complex',
          `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=20:5[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`,
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          '23',
          '-c:a',
          'aac',
          finalClipPath
        );
      } else if (verticalStyle === 'letterbox') {
        // Crisp 16:9 centered with pure black letterbox bars top & bottom
        ffmpegArgs.push(
          '-vf',
          `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`,
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          '23',
          '-c:a',
          'aac',
          finalClipPath
        );
      } else {
        // Dynamic AI Steadicam Auto-Tracking Camera Follow
        let cropExpression: string;

        if (trackingKeyframes && trackingKeyframes.length > 0) {
          // Use client precomputed keyframes
          cropExpression = buildFfmpegCropExpression(trackingKeyframes, safeStart, targetW);
        } else {
          // Run server-side frame analysis directly on the downloaded video clip
          cropExpression = await analyzeVideoFileForTracking(rawClipPath, targetW);
        }

        ffmpegArgs.push(
          '-vf',
          `scale=-1:${targetH},crop=${targetW}:${targetH}:'${cropExpression}':0`,
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          '23',
          '-c:a',
          'aac',
          finalClipPath
        );
      }
    } else if (aspectRatio === '1:1') {
      const dim = targetW;
      const ratio = Math.max(0, Math.min(100, Number(cropPositionX) || 50)) / 100;
      ffmpegArgs.push(
        '-vf',
        `scale=-1:${dim},crop=${dim}:${dim}:(in_w-${dim})*${ratio}:0`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        finalClipPath
      );
    } else {
      // 16:9 landscape format
      ffmpegArgs.push(
        '-vf',
        `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        finalClipPath
      );
    }

    await execFileAsync('/usr/bin/ffmpeg', ffmpegArgs, { timeout: 60000 });

    const outputPath = fs.existsSync(finalClipPath) ? finalClipPath : rawClipPath;
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
