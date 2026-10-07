import express from 'express';
import { createServer as createViteServer } from 'vite';
import { handleRenderClip } from './src/server/clipRenderer';

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Mount Vite middleware in development
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
  appType: 'spa',
});
app.use(vite.middlewares);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DriaClip Full-Stack Engine running on http://0.0.0.0:${PORT}`);
});
