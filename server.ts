import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { handleRenderClip, handleRenderLocalClip } from './src/server/clipRenderer.ts';

const app = express();
const PORT = 3000;
const httpServer = http.createServer(app);

// 301 Permanent Redirect from driaclip.pages.dev to clip.driacom.com
app.use((req, res, next) => {
  const host = (req.headers.host || '').toLowerCase();
  if (host.includes('driaclip.pages.dev')) {
    return res.redirect(301, `https://clip.driacom.com${req.originalUrl}`);
  }
  next();
});

app.use(express.json());

const UPLOAD_TMP_DIR = path.join(os.tmpdir(), 'driaclip_uploads');
if (!fs.existsSync(UPLOAD_TMP_DIR)) {
  fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
}

/**
 * High-performance backend route for genuine MP4 clipping and aspect ratio transformation
 * Powered by yt-dlp + ffmpeg
 */
app.post('/api/render-clip', async (req, res) => {
  try {
    const { filePath, fileName, cleanup } = await handleRenderClip(req.body);

    res.download(filePath, fileName, (err) => {
      cleanup();
    });
  } catch (err: any) {
    if (err?.message?.includes('YOUTUBE_BOT_PROTECTION')) {
      console.warn('[DriaClip] Notice: YouTube bot verification required for cloud server request.');
      return res.status(403).json({ 
        code: 'YOUTUBE_BOT_PROTECTION',
        error: err.message, 
        details: err.message 
      });
    }
    console.error('Error rendering clip:', err);
    res.status(500).json({ 
      error: err?.message || 'Terjadi kesalahan saat memproses video', 
      details: err?.message || String(err) 
    });
  }
});

/**
 * Route to render uploaded or local video directly into an authentic MP4 using ffmpeg
 */
app.post('/api/render-local-clip', (req, res) => {
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const inputPath = path.join(UPLOAD_TMP_DIR, `${uploadId}.mp4`);
  const writeStream = fs.createWriteStream(inputPath);

  req.pipe(writeStream);

  writeStream.on('finish', async () => {
    try {
      const { filePath, fileName, cleanup } = await handleRenderLocalClip(inputPath, {
        startTime: Number(req.query.startTime) || 0,
        endTime: Number(req.query.endTime) || 15,
        aspectRatio: (req.query.aspectRatio as any) || '9:16',
        verticalStyle: (req.query.verticalStyle as any) || 'center-crop',
        cropPositionX: Number(req.query.cropPositionX) || 50,
        zoomOutPercent: Number(req.query.zoomOutPercent) || 20,
        quality: (req.query.quality as any) || '720p',
        title: (req.query.title as string) || 'clip',
        watermark: req.query.watermark !== 'false',
        watermarkText: (req.query.watermarkText as string) || 'DriaClip',
        watermarkPosition: (req.query.watermarkPosition as any) || 'safe-top-left',
        watermarkStyle: (req.query.watermarkStyle as any) || 'neon-glow',
      });

      res.download(filePath, fileName, () => {
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        } catch {}
        cleanup();
      });
    } catch (err: any) {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      } catch {}
      console.error('Error rendering local clip:', err);
      res.status(500).json({ 
        error: 'Gagal memproses klip lokal', 
        details: err?.message || String(err) 
      });
    }
  });

  writeStream.on('error', (err) => {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch {}
    res.status(500).json({ error: 'Gagal menerima stream video' });
  });
});

/**
 * Route to receive chunked uploads for large video files (> 25MB)
 * Bypasses cloud proxy body limits completely.
 */
app.post('/api/upload-chunk', (req, res) => {
  const uploadId = (req.headers['x-upload-id'] as string) || `chunk_${Date.now()}`;
  const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  const chunkIndex = parseInt((req.headers['x-chunk-index'] as string) || '0', 10);
  const totalChunks = parseInt((req.headers['x-total-chunks'] as string) || '1', 10);

  const targetPath = path.join(UPLOAD_TMP_DIR, `${safeUploadId}.mp4`);
  const writeStream = fs.createWriteStream(targetPath, { flags: chunkIndex === 0 ? 'w' : 'a' });

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    res.json({
      success: true,
      uploadId: safeUploadId,
      chunkIndex,
      isComplete: chunkIndex + 1 >= totalChunks,
    });
  });

  writeStream.on('error', (err) => {
    console.error('Upload chunk error:', err);
    res.status(500).json({ error: 'Gagal menyimpan potongan video' });
  });
});

/**
 * Route to render video previously uploaded via chunked upload
 */
app.post('/api/render-chunked-clip', async (req, res) => {
  try {
    const { uploadId, ...options } = req.body;
    if (!uploadId) {
      return res.status(400).json({ error: 'Parameter uploadId wajib disertakan' });
    }
    const safeUploadId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const targetPath = path.join(UPLOAD_TMP_DIR, `${safeUploadId}.mp4`);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'File video tidak ditemukan di server' });
    }

    const { filePath, fileName, cleanup } = await handleRenderLocalClip(targetPath, options);

    res.download(filePath, fileName, () => {
      try {
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
      } catch {}
      cleanup();
    });
  } catch (err: any) {
    console.error('Error rendering chunked clip:', err);
    res.status(500).json({
      error: 'Gagal memproses video klip',
      details: err?.message || String(err),
    });
  }
});

const COOKIES_PATH = path.resolve(process.cwd(), 'cookies.txt');

/**
 * Endpoint to check YouTube cookies status
 */
app.get('/api/youtube-cookies', (_req, res) => {
  try {
    if (fs.existsSync(COOKIES_PATH)) {
      const stat = fs.statSync(COOKIES_PATH);
      const content = fs.readFileSync(COOKIES_PATH, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
      res.json({
        active: true,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
        cookieCount: lines,
      });
    } else {
      res.json({ active: false, sizeBytes: 0, updatedAt: null, cookieCount: 0 });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membaca status cookies' });
  }
});

/**
 * Endpoint to save YouTube cookies (Netscape format)
 */
app.post('/api/youtube-cookies', (req, res) => {
  try {
    const { cookies } = req.body;
    if (!cookies || typeof cookies !== 'string' || !cookies.trim()) {
      return res.status(400).json({ error: 'Format cookies tidak boleh kosong' });
    }

    const cleanCookies = cookies.trim() + '\n';
    fs.writeFileSync(COOKIES_PATH, cleanCookies, 'utf-8');
    const stat = fs.statSync(COOKIES_PATH);
    const lines = cleanCookies.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;

    res.json({
      success: true,
      message: 'Cookie YouTube berhasil disimpan dan aktif!',
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
      cookieCount: lines,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal menyimpan file cookies' });
  }
});

/**
 * Endpoint to delete YouTube cookies
 */
app.delete('/api/youtube-cookies', (_req, res) => {
  try {
    if (fs.existsSync(COOKIES_PATH)) {
      fs.unlinkSync(COOKIES_PATH);
    }
    res.json({ success: true, message: 'Cookie YouTube berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus cookies' });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const distPath = path.resolve(process.cwd(), 'dist');

let vite: ViteDevServer | null = null;

if (isProd && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Mount Vite middleware in development with HMR multiplexed over httpServer
  vite = await createViteServer({
    server: { 
      middlewareMode: true, 
      hmr: process.env.DISABLE_HMR !== 'true' ? { server: httpServer } : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`DriaClip Full-Stack Engine running on http://0.0.0.0:${PORT}`);
});

const handleShutdown = async () => {
  try {
    if (vite) await vite.close();
  } catch {}
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1500).unref();
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
