import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { IncomingMessage, ServerResponse } from 'http';

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
  quality?: '1080p' | '720p' | '480p' | '360p';
  title?: string;
}

/**
 * Core handler to download & render clip into an authentic MP4 using yt-dlp and ffmpeg
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
      '--download-sections',
      `*${safeStart}-${safeEnd}`,
      '--force-keyframes-at-cuts',
      '-f',
      '18/b[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
      targetUrl,
      '-o',
      rawClipPath,
    ];

    await execFileAsync(YT_DLP_PATH, ytDlpArgs, { timeout: 60000 });

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
        // Crisp 16:9 centered, blurred video filling the 9:16 frame top & bottom
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
        // Crisp 16:9 centered with solid black letterbox bars top & bottom
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
        // auto-track: crop 9:16 slice centered or tracking focal point
        const ratio = Math.max(0, Math.min(100, Number(cropPositionX) || 50)) / 100;
        ffmpegArgs.push(
          '-vf',
          `scale=-1:${targetH},crop=${targetW}:${targetH}:(in_w-${targetW})*${ratio}:0`,
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

    await execFileAsync('/usr/bin/ffmpeg', ffmpegArgs, { timeout: 45000 });

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
