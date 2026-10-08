import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { handleRenderClip, handleRenderLocalClip } from './src/server/clipRenderer.ts';

const app = express();
const PORT = 3000;

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
    console.error('Error rendering clip:', err);
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat memproses video', 
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

const isProd = process.env.NODE_ENV === 'production';
const distPath = path.resolve(process.cwd(), 'dist');

if (isProd && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Mount Vite middleware in development
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DriaClip Full-Stack Engine running on http://0.0.0.0:${PORT}`);
});
