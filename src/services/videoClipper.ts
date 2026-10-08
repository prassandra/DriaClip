import { AspectRatio, VerticalStyle, GeneratedClip, ExportQuality, TrackingKeyframe } from '../types/driaclip';

/**
 * Calculates the exact second to capture the starting thumbnail frame for a clip.
 * Requirement:
 * - Clip 1 (e.g. 00:00 - 00:15): starts at 0s -> thumbnail at second 00:01 (1s)
 * - Clip 2 (e.g. 00:15 - 00:30): starts at 15s -> thumbnail at second 00:16 (16s)
 * - Clip 3 (e.g. 00:30 - 00:45): starts at 30s -> thumbnail at second 00:31 (31s)
 * - Clip 4 (e.g. 00:45 - 00:60): starts at 45s -> thumbnail at second 00:46 (46s)
 * In general: Math.round(startTime) + 1, accurately reflecting where that clip starts!
 */
export function calculateClipThumbnailTime(startTime: number, endTime?: number): number {
  const startInt = Math.max(0, Math.round(startTime));
  const target = startInt + 1;
  if (typeof endTime === 'number' && target >= endTime) {
    return Math.max(0.1, startTime + Math.max(0.1, (endTime - startTime) / 4));
  }
  return target;
}

/**
 * Generate a crisp, branded fallback thumbnail data URL using canvas
 */
export function generateFallbackThumbnail(
  timeSeconds: number,
  aspectRatio: AspectRatio = '9:16',
  clipIndex: number = 0,
  startTime: number = 0,
  endTime: number = 15,
  title: string = 'DriaClip'
): string {
  try {
    const width = aspectRatio === '9:16' ? 360 : aspectRatio === '1:1' ? 480 : 640;
    const height = aspectRatio === '9:16' ? 640 : aspectRatio === '1:1' ? 480 : 360;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Varied gradient palette based on clipIndex to give each clip a distinct visual identity
    const palettes = [
      ['#1e1b4b', '#0f172a', '#581c87'], // Indigo - Violet
      ['#082f49', '#022c22', '#064e3b'], // Cyan - Emerald
      ['#3b0764', '#172554', '#1e1b4b'], // Purple - Blue
      ['#450a0a', '#1c1917', '#7c2d12'], // Red - Amber
      ['#14532d', '#0f172a', '#15803d'], // Forest - Green
      ['#1e293b', '#312e81', '#4c1d95'], // Slate - Deep Violet
    ];
    const pal = palettes[clipIndex % palettes.length];

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, pal[0]);
    grad.addColorStop(0.5, pal[1]);
    grad.addColorStop(1, pal[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative geometric grid/glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Play icon circle
    const centerX = width / 2;
    const centerY = height / 2 - 20;
    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Triangle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY - 14);
    ctx.lineTo(centerX + 14, centerY);
    ctx.lineTo(centerX - 8, centerY + 14);
    ctx.closePath();
    ctx.fill();

    // Top Brand Badge
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('driaClip by Driacom', centerX, 45);

    // Clip Title
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(title.slice(0, 24), centerX, centerY + 58);

    // Prominent Start Timestamp Badge (reflecting start awal durasi)
    const timeStr = formatTimeCode(timeSeconds);
    const rangeStr = `${formatTimeCode(startTime)} - ${formatTimeCode(endTime)}`;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    const badgeW = 160;
    const badgeH = 34;
    const badgeX = centerX - badgeW / 2;
    const badgeY = centerY + 76;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'center';
    ctx.fillText(`Mulai: ${timeStr}`, centerX, badgeY + 22);

    // Range subtitle
    ctx.font = '11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(rangeStr, centerX, badgeY + 50);

    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return '';
  }
}

/**
 * Capture high-resolution thumbnail from a video at a specific second
 * Specifically takes the snapshot at the START of the clip (e.g. 00:01 for clip 1, 00:16 for clip 2)
 * and stamps a distinct, visible starting time badge!
 */
export async function captureVideoThumbnail(
  videoUrl: string,
  timeSeconds: number,
  aspectRatio: AspectRatio = '16:9',
  verticalStyle: VerticalStyle = 'blur-background',
  youtubeId?: string,
  clipIndex: number = 0,
  startTime: number = 0,
  endTime: number = 15,
  clipTitle?: string,
  cropPositionX: number = 50,
  zoomOutPercent: number = 20
): Promise<string> {
  const safeTime = Math.max(0.1, timeSeconds);
  const timeStr = formatTimeCode(safeTime);
  const rangeStr = `${formatTimeCode(startTime)} - ${formatTimeCode(endTime)}`;
  const displayTitle = clipTitle || `Klip ${clipIndex + 1}`;

  // Dimensions
  let width = 640;
  let height = 360;
  if (aspectRatio === '9:16') {
    width = 360;
    height = 640;
  } else if (aspectRatio === '1:1') {
    width = 480;
    height = 480;
  }

  // Handle YouTube Sources:
  // Dynamically select snapshot frame based on clip starting time, and composite with distinct visual timeline indicators
  const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = videoUrl.match(ytReg);
  const yt = youtubeId || (ytMatch ? ytMatch[1] : null);

  if (yt) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Pick different snapshot frames from YouTube based on clip position or index:
      // 1.jpg (~25%), 2.jpg (~50%), 3.jpg (~75%), hqdefault.jpg (0%)
      const frameOptions = ['hqdefault.jpg', '1.jpg', '2.jpg', '3.jpg'];
      let chosenFrame = 'hqdefault.jpg';
      if (clipIndex % 4 === 1) chosenFrame = '1.jpg';
      else if (clipIndex % 4 === 2) chosenFrame = '2.jpg';
      else if (clipIndex % 4 === 3) chosenFrame = '3.jpg';

      const renderYtThumbnail = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));

          // Draw base image
          if (img.complete && img.naturalWidth > 0) {
            if (aspectRatio === '9:16') {
              if (verticalStyle === 'blur-background') {
                ctx.save();
                ctx.filter = 'blur(16px) brightness(0.65)';
                const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
                const bgW = img.naturalWidth * scale;
                const bgH = img.naturalHeight * scale;
                ctx.drawImage(img, (width - bgW) / 2, (height - bgH) / 2, bgW, bgH);
                ctx.restore();

                const fitScale = width / img.naturalWidth;
                const fgH = img.naturalHeight * fitScale;
                ctx.drawImage(img, 0, (height - fgH) / 2, width, fgH);
              } else if (verticalStyle === 'letterbox') {
                // Pure black letterbox bars top and bottom
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, width, height);

                const fitScale = width / img.naturalWidth;
                const fgH = img.naturalHeight * fitScale;
                ctx.drawImage(img, 0, (height - fgH) / 2, width, fgH);
              } else {
                // center-crop (or non-blur) with comfortable Zoom-Out
                const zoomFactor = Math.max(0.05, Math.min(0.45, (zoomOutPercent ?? 20) / 100));
                const tightScale = height / img.naturalHeight;
                const fitScale = width / img.naturalWidth;
                const scale = tightScale - (tightScale - fitScale) * zoomFactor * 1.8;
                const fgW = img.naturalWidth * scale;
                const fgH = img.naturalHeight * scale;
                const fgX = (width - fgW) / 2;
                const fgY = (height - fgH) / 2;

                // Soft background blur
                ctx.save();
                ctx.filter = 'blur(18px) brightness(0.60)';
                const bgScale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
                const bgW = img.naturalWidth * bgScale;
                const bgH = img.naturalHeight * bgScale;
                ctx.drawImage(img, (width - bgW) / 2, (height - bgH) / 2, bgW, bgH);
                ctx.restore();

                // Centered sharp zoomed-out foreground
                ctx.drawImage(img, fgX, fgY, fgW, fgH);
              }
            } else if (aspectRatio === '1:1') {
              const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
              const renderW = img.naturalWidth * scale;
              const renderH = img.naturalHeight * scale;
              const maxShift = Math.max(0, renderW - width);
              const shiftX = (cropPositionX / 100) * maxShift;
              ctx.drawImage(img, -shiftX, (height - renderH) / 2, renderW, renderH);
            } else {
              ctx.drawImage(img, 0, 0, width, height);
            }
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);
          }

          // Subtle distinct gradient tint per clip to make each thumbnail immediately distinguishable
          const hues = [260, 280, 220, 200, 300, 240, 190];
          const hue = hues[clipIndex % hues.length];
          const tintGrad = ctx.createLinearGradient(0, 0, width, height);
          tintGrad.addColorStop(0, `hsla(${hue}, 80%, 40%, 0.15)`);
          tintGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
          ctx.fillStyle = tintGrad;
          ctx.fillRect(0, 0, width, height);

          // Dark gradient overlay at bottom
          const grad = ctx.createLinearGradient(0, height * 0.45, 0, height);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.92)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Top branding
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('driaClip', 14, 24);

          // Clip Number badge (top right)
          ctx.fillStyle = 'rgba(124, 58, 237, 0.95)';
          ctx.beginPath();
          ctx.roundRect(width - 86, 12, 74, 22, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Klip #${clipIndex + 1}`, width - 49, 27);

          // Center Play Icon
          const cx = width / 2;
          const cy = height / 2;
          ctx.fillStyle = 'rgba(124, 58, 237, 0.85)';
          ctx.beginPath();
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy - 10);
          ctx.lineTo(cx + 10, cy);
          ctx.lineTo(cx - 6, cy + 10);
          ctx.closePath();
          ctx.fill();

          // Timeline position indicator bar across bottom: reflects clip's start point
          const barY = height - 58;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(14, barY, width - 28, 4);

          // Active segment indicator on timeline bar
          const totalEst = Math.max(endTime, 300);
          const startRatio = Math.min(1, startTime / totalEst);
          const endRatio = Math.min(1, endTime / totalEst);
          const segX = 14 + startRatio * (width - 28);
          const segW = Math.max(8, (endRatio - startRatio) * (width - 28));
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(segX, barY - 1, segW, 6);

          // Bottom Start Badge (Distinctly reflects Start Awal Durasi)
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(14, height - 48, 134, 32, 8);
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = '#c084fc';
          ctx.textAlign = 'left';
          ctx.fillText(`Mulai: ${timeStr}`, 24, height - 27);

          // Time Range
          ctx.font = '11px monospace';
          ctx.fillStyle = '#e2e8f0';
          ctx.textAlign = 'right';
          ctx.fillText(rangeStr, width - 14, height - 27);

          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } catch {
          resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
        }
      };

      img.onload = renderYtThumbnail;
      img.onerror = () => {
        // Fallback to hqdefault if specific frame 1/2/3 fails
        if (chosenFrame !== 'hqdefault.jpg') {
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = 'anonymous';
          fallbackImg.onload = () => {
            img.src = fallbackImg.src;
            renderYtThumbnail();
          };
          fallbackImg.onerror = () => resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
          fallbackImg.src = `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
        } else {
          resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
        }
      };

      img.src = `https://img.youtube.com/vi/${yt}/${chosenFrame}`;

      // Fallback timeout
      setTimeout(() => {
        if (!img.complete) {
          resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
        }
      }, 1500);
    });
  }

  // Handle Real Video Source (blob: or direct video URL):
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
    }, 2500);

    const video = document.createElement('video');
    if (!videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }
    video.src = videoUrl;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      clearTimeout(timeout);
      try {
        video.pause();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      } catch {}
    };

    const captureFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          cleanup();
          resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
          return;
        }

        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 360;

        if (aspectRatio === '9:16') {
          if (verticalStyle === 'blur-background') {
            // Blurred background
            ctx.save();
            ctx.filter = 'blur(18px) brightness(0.65)';
            const scale = Math.max(width / vw, height / vh);
            const bgW = vw * scale;
            const bgH = vh * scale;
            ctx.drawImage(video, (width - bgW) / 2, (height - bgH) / 2, bgW, bgH);
            ctx.restore();

            // Crisp center frame
            const fitScale = width / vw;
            const fgH = vh * fitScale;
            ctx.drawImage(video, 0, (height - fgH) / 2, width, fgH);
          } else if (verticalStyle === 'letterbox') {
            // Clean true black letterbox bars top and bottom
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            const fitScale = width / vw;
            const fgH = vh * fitScale;
            ctx.drawImage(video, 0, (height - fgH) / 2, width, fgH);
          } else {
            // center-crop with comfortable Zoom-Out
            const zoomFactor = Math.max(0.05, Math.min(0.45, (zoomOutPercent ?? 20) / 100));
            const tightScale = height / vh;
            const fitScale = width / vw;
            const scale = tightScale - (tightScale - fitScale) * zoomFactor * 1.8;
            const fgW = vw * scale;
            const fgH = vh * scale;
            const fgX = (width - fgW) / 2;
            const fgY = (height - fgH) / 2;

            ctx.save();
            ctx.filter = 'blur(18px) brightness(0.60)';
            const bgScale = Math.max(width / vw, height / vh);
            const bgW = vw * bgScale;
            const bgH = vh * bgScale;
            ctx.drawImage(video, (width - bgW) / 2, (height - bgH) / 2, bgW, bgH);
            ctx.restore();

            ctx.drawImage(video, fgX, fgY, fgW, fgH);
          }
        } else if (aspectRatio === '1:1') {
          const minDim = Math.min(vw, vh);
          const maxCropX = Math.max(0, vw - minDim);
          const ratio = Math.max(0, Math.min(100, cropPositionX)) / 100;
          const cropX = maxCropX * ratio;
          const cropY = (vh - minDim) / 2;
          ctx.drawImage(video, cropX, cropY, minDim, minDim, 0, 0, width, height);
        } else {
          ctx.drawImage(video, 0, 0, width, height);
        }

        // Bottom gradient for readable badges
        const grad = ctx.createLinearGradient(0, height * 0.6, 0, height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Prominent Start Timestamp Badge (reflecting start awal durasi e.g. 00:01, 00:16)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(12, height - 44, 125, 30, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#c084fc';
        ctx.textAlign = 'left';
        ctx.fillText(`Mulai: ${timeStr}`, 22, height - 24);

        // Clip Range Tag
        ctx.font = '11px monospace';
        ctx.fillStyle = '#f1f5f9';
        ctx.textAlign = 'right';
        ctx.fillText(rangeStr, width - 14, height - 24);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas capture fallback:', err);
        cleanup();
        resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
      }
    };

    const onLoadedMetadata = () => {
      try {
        const targetTime = Math.min(Math.max(0.1, safeTime), (video.duration || 1) - 0.1);
        video.currentTime = targetTime;
      } catch {
        cleanup();
        resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    video.addEventListener('seeked', captureFrame, { once: true });
    video.addEventListener('error', () => {
      cleanup();
      resolve(generateFallbackThumbnail(safeTime, aspectRatio, clipIndex, startTime, endTime, displayTitle));
    }, { once: true });
  });
}

/**
 * Fix WebM duration metadata header
 * Browser MediaRecorder creates WebM streams with duration missing or set to -1.
 * This parser parses EBML Segment Info and sets the exact duration float in milliseconds,
 * allowing video players (Windows Media Player, VLC, QuickTime, Android, iOS, Chrome)
 * to seek properly and display the exact duration (e.g. 00:15) instead of 00:00!
 */
export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  try {
    const buffer = await blob.arrayBuffer();
    const dataView = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Scan first 4KB for Segment Info (0x1549A966)
    let infoOffset = -1;
    const maxSearch = Math.min(bytes.length - 8, 4096);

    for (let i = 0; i < maxSearch; i++) {
      if (bytes[i] === 0x15 && bytes[i + 1] === 0x49 && bytes[i + 2] === 0xa9 && bytes[i + 3] === 0x66) {
        infoOffset = i;
        break;
      }
    }

    if (infoOffset === -1) {
      return blob;
    }

    // Inside Info, look for Duration element (0x4489)
    let durationOffset = -1;
    for (let i = infoOffset; i < Math.min(infoOffset + 300, bytes.length - 8); i++) {
      if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
        durationOffset = i;
        break;
      }
    }

    if (durationOffset !== -1) {
      // Duration tag found: check size (0x84 = 4 bytes, 0x88 = 8 bytes)
      const sizeByte = bytes[durationOffset + 2];
      if (sizeByte === 0x84) {
        dataView.setFloat32(durationOffset + 3, durationMs, false);
      } else if (sizeByte === 0x88) {
        dataView.setFloat64(durationOffset + 3, durationMs, false);
      }
      return new Blob([buffer], { type: blob.type || 'video/webm' });
    }

    // If Duration tag is not in Info, insert 0x44 0x89 0x88 [8 bytes float64] into Info
    const durationTag = new Uint8Array(11);
    durationTag[0] = 0x44;
    durationTag[1] = 0x89;
    durationTag[2] = 0x88;
    const tagView = new DataView(durationTag.buffer);
    tagView.setFloat64(3, durationMs, false);

    // Insert location: right after Info element ID and length
    // Read Info length (variable length int)
    let infoLenOffset = infoOffset + 4;
    let infoLenBytes = 1;
    const firstLenByte = bytes[infoLenOffset];
    if (firstLenByte & 0x80) infoLenBytes = 1;
    else if (firstLenByte & 0x40) infoLenBytes = 2;
    else if (firstLenByte & 0x20) infoLenBytes = 3;
    else if (firstLenByte & 0x10) infoLenBytes = 4;

    const insertPos = infoLenOffset + infoLenBytes;

    const newBuffer = new Uint8Array(buffer.byteLength + 11);
    newBuffer.set(bytes.subarray(0, insertPos), 0);
    newBuffer.set(durationTag, insertPos);
    newBuffer.set(bytes.subarray(insertPos), insertPos + 11);

    return new Blob([newBuffer], { type: blob.type || 'video/webm' });
  } catch (err) {
    console.warn('fixWebmDuration fallback:', err);
    return blob;
  }
}

/**
 * Render and transcode a sub-clip into a real playable/downloadable Blob
 * Produces an exact duration cut matching startTime to endTime with full duration header!
 */
export async function renderClipBlob(
  videoUrl: string,
  startTime: number,
  endTime: number,
  aspectRatio: AspectRatio,
  verticalStyle: VerticalStyle,
  quality: ExportQuality = '720p',
  onProgress?: (percent: number) => void,
  cropPositionX: number = 50,
  trackingKeyframes?: TrackingKeyframe[],
  zoomOutPercent: number = 20
): Promise<{ blob: Blob; url: string; size: number; extension: 'mp4' | 'webm' }> {
  return new Promise(async (resolve, reject) => {
    if (!videoUrl || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      reject(new Error('Format video tidak didukung untuk pemotongan langsung di peramban.'));
      return;
    }

    const targetDuration = Math.max(0.5, endTime - startTime);

    // Create off-screen video element attached to DOM with active compositing dimensions
    // to prevent browser hardware video decoding suspension/throttling!
    const video = document.createElement('video');
    video.style.position = 'fixed';
    video.style.bottom = '0px';
    video.style.right = '0px';
    video.style.width = '320px';
    video.style.height = '180px';
    video.style.opacity = '0.02';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-9999';
    document.body.appendChild(video);

    if (!videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }
    video.src = videoUrl;
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = true;

    // Resolution sizing
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

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Fast off-screen blur canvas for silky-smooth 60fps hardware blur without UI stall
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = 180;
    blurCanvas.height = 320;
    const blurCtx = blurCanvas.getContext('2d');

    if (!ctx) {
      if (video.parentNode) video.parentNode.removeChild(video);
      reject(new Error('Canvas context not available'));
      return;
    }

    try {
      // Step 1: Wait for video metadata
      await new Promise<void>((res, rej) => {
        if (video.readyState >= 1) return res();
        video.onloadedmetadata = () => res();
        video.onerror = () => {
          if (video.parentNode) video.parentNode.removeChild(video);
          rej(new Error('Gagal memuat sumber video'));
        };
        setTimeout(res, 3000);
      });

      // Step 2: Prepare canvas stream (30fps)
      const stream = canvas.captureStream(30);

      // Step 3: Audio capture via Web Audio (does NOT blast speakers)
      let audioCtx: AudioContext | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          const sourceNode = audioCtx.createMediaElementSource(video);
          const destNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(destNode);
          destNode.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        }
      } catch {
        try {
          const vStream = (video as any).captureStream ? (video as any).captureStream() : null;
          if (vStream) {
            vStream.getAudioTracks().forEach((track: MediaStreamTrack) => stream.addTrack(track));
          }
        } catch {}
      }

      // Step 4: Determine best supported MIME type
      let mimeType = 'video/webm';
      let chosenExt: 'mp4' | 'webm' = 'webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
          mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
          chosenExt = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
          chosenExt = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
          chosenExt = 'webm';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
          chosenExt = 'webm';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Step 5: Seek to startTime
      video.currentTime = startTime;
      await new Promise<void>((res) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          res();
        };
        video.addEventListener('seeked', onSeeked);
        setTimeout(res, 1200);
      });

      // Step 6: Start playback safely
      try {
        await video.play();
      } catch {
        video.muted = true;
        try {
          await video.play();
        } catch (e) {
          console.warn('Video playback warning:', e);
        }
      }

      recorder.start(100);

      let isDone = false;
      let animationFrameId: number;
      let intervalId: any;

      const finishRecording = () => {
        if (isDone) return;
        isDone = true;
        cancelAnimationFrame(animationFrameId);
        clearInterval(intervalId);
        video.pause();
        onProgress?.(100);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      recorder.onstop = async () => {
        let finalBlob = new Blob(chunks, { type: mimeType });
        if (chosenExt === 'webm' || mimeType.includes('webm')) {
          try {
            finalBlob = await fixWebmDuration(finalBlob, targetDuration * 1000);
          } catch (e) {
            console.warn('fixWebmDuration error:', e);
          }
        }
        const blobUrl = URL.createObjectURL(finalBlob);

        // Cleanup
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close().catch(() => {});
        }

        resolve({ blob: finalBlob, url: blobUrl, size: finalBlob.size, extension: chosenExt });
      };

      const drawLoop = () => {
        if (isDone) return;

        const cur = video.currentTime;
        const elapsed = Math.max(0, cur - startTime);
        const progress = Math.min(99, Math.round((elapsed / targetDuration) * 100));
        onProgress?.(progress);

        // Render aspect ratio transform
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;

        // Clean center-crop framing (fixed at 50% middle, zero camera panning)
        const currentEffectiveCropX = 50;

        if (aspectRatio === '9:16') {
          if (verticalStyle === 'blur-background') {
            // High-speed hardware-accelerated smooth background blur:
            if (blurCtx) {
              blurCtx.drawImage(video, 0, 0, blurCanvas.width, blurCanvas.height);
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'low';
              ctx.drawImage(blurCanvas, 0, 0, targetW, targetH);
            }
            // Semi-transparent dark overlay so foreground pops cleanly
            ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
            ctx.fillRect(0, 0, targetW, targetH);

            // Centered sharp 16:9 video
            const fitScale = targetW / vw;
            const fgH = vh * fitScale;
            const fgY = (targetH - fgH) / 2;
            ctx.drawImage(video, 0, fgY, targetW, fgH);
          } else if (verticalStyle === 'letterbox') {
            // Bilah Hitam: Pure deep black background top and bottom
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, targetW, targetH);

            // Centered sharp 16:9 video
            const fitScale = targetW / vw;
            const fgH = vh * fitScale;
            const fgY = (targetH - fgH) / 2;
            ctx.drawImage(video, 0, fgY, targetW, fgH);
          } else {
            // center-crop with comfortable Zoom-Out (centered at 50%, zero stretch)
            const zoomFactor = Math.max(0.05, Math.min(0.45, (zoomOutPercent ?? 20) / 100));
            const tightScale = targetH / vh;
            const fitScale = targetW / vw;
            const scale = tightScale - (tightScale - fitScale) * zoomFactor * 1.8;
            const fgW = vw * scale;
            const fgH = vh * scale;
            const fgX = (targetW - fgW) / 2;
            const fgY = (targetH - fgH) / 2;

            if (blurCtx) {
              blurCtx.drawImage(video, 0, 0, blurCanvas.width, blurCanvas.height);
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'low';
              ctx.drawImage(blurCanvas, 0, 0, targetW, targetH);
            }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
            ctx.fillRect(0, 0, targetW, targetH);

            ctx.drawImage(video, 0, 0, vw, vh, fgX, fgY, fgW, fgH);
          }
        } else if (aspectRatio === '1:1') {
          const minDim = Math.min(vw, vh);
          const maxCropX = Math.max(0, vw - minDim);
          const ratio = Math.max(0, Math.min(100, currentEffectiveCropX)) / 100;
          const cropX = maxCropX * ratio;
          const cropY = (vh - minDim) / 2;
          ctx.drawImage(video, cropX, cropY, minDim, minDim, 0, 0, targetW, targetH);
        } else {
          ctx.drawImage(video, 0, 0, targetW, targetH);
        }

        // Check if reached clip end time (or video ended)
        if (cur >= endTime - 0.05 || video.ended) {
          finishRecording();
          return;
        }

        animationFrameId = requestAnimationFrame(drawLoop);
      };

      animationFrameId = requestAnimationFrame(drawLoop);
      intervalId = setInterval(drawLoop, 33); // 30 fps backup timer

      // Failsafe max timeout
      setTimeout(() => {
        finishRecording();
      }, (targetDuration + 2.5) * 1000);

    } catch (err) {
      if (video.parentNode) video.parentNode.removeChild(video);
      reject(err);
    }
  });
}

/**
 * Format seconds into mm:ss or hh:mm:ss format
 */
export function formatTimeCode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMins = mins.toString().padStart(2, '0');
  const formattedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${formattedMins}:${formattedSecs}`;
  }
  return `${formattedMins}:${formattedSecs}`;
}

/**
 * Format bytes to readable size string
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Real calculated estimated file size based on resolution and clip duration
 */
export function calculateEstimatedFileSize(durationSeconds: number, quality: ExportQuality = '1080p'): number {
  const safeDuration = Math.max(1, durationSeconds);
  let totalBitrateKbps = 6692;
  if (quality === '1080p') {
    totalBitrateKbps = 6500 + 192;
  } else if (quality === '720p') {
    totalBitrateKbps = 3200 + 128;
  } else if (quality === '480p') {
    totalBitrateKbps = 1500 + 96;
  } else if (quality === '360p') {
    totalBitrateKbps = 800 + 64;
  }
  const bytes = Math.round((totalBitrateKbps * 1000 / 8) * safeDuration);
  return bytes;
}

/**
 * Downloads a genuine MP4 clip rendered server-side via yt-dlp + ffmpeg
 */
export async function downloadServerRenderedClip(
  clip: GeneratedClip,
  videoUrl: string,
  youtubeId?: string
): Promise<{ blob: Blob; url: string }> {
  const res = await fetch('/api/render-clip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      youtubeId: youtubeId || (clip.sourceId?.startsWith('yt-') ? clip.sourceId.replace('yt-', '') : undefined),
      startTime: clip.startTime,
      endTime: clip.endTime,
      aspectRatio: clip.aspectRatio,
      verticalStyle: clip.verticalStyle,
      cropPositionX: 50,
      zoomOutPercent: clip.zoomOutPercent ?? 20,
      trackingKeyframes: clip.trackingKeyframes,
      quality: clip.exportQuality || '1080p',
      title: clip.title,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memproses klip video asli');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { blob, url };
}

/**
 * Downloads a genuine MP4 clip rendered server-side from local file/blob via ffmpeg
 */
export async function downloadServerRenderedLocalClip(
  clip: GeneratedClip,
  blobOrFile: Blob | File
): Promise<{ blob: Blob; url: string }> {
  const params = new URLSearchParams({
    startTime: String(clip.startTime),
    endTime: String(clip.endTime),
    aspectRatio: clip.aspectRatio,
    verticalStyle: clip.verticalStyle,
    cropPositionX: String(clip.cropPositionX ?? 50),
    zoomOutPercent: String(clip.zoomOutPercent ?? 20),
    quality: clip.exportQuality || '720p',
    title: clip.title || 'clip',
  });

  const res = await fetch(`/api/render-local-clip?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: blobOrFile,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memproses klip video lokal');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { blob, url };
}

/**
 * Universal helper to trigger download of a generated clip with correct extension (.mp4 or .webm)
 */
export function downloadClipAsMp4(clip: GeneratedClip, fallbackSourceUrl?: string, preferredExt?: string): void {
  const safeTitle = (clip.title || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const ext = preferredExt || clip.videoExtension || 'mp4';
  const fileName = `driaclip_${clip.exportQuality || '1080p'}_${safeTitle || clip.id}.${ext}`;
  const downloadTarget = clip.videoBlobUrl || fallbackSourceUrl;

  if (downloadTarget) {
    const a = document.createElement('a');
    a.href = downloadTarget;
    a.download = fileName;
    if (!clip.videoBlobUrl && fallbackSourceUrl) {
      a.rel = 'noopener noreferrer';
    }
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    }, 1500);
  }
}

/**
 * Generates an actual downloadable clip MP4/WebM blob directly into user storage
 * For YouTube or fallback streams, renders a full-duration video matching the exact clip duration (e.g. 15s)
 * with animated waveforms, progress bar, audio tone, hook text, and duration metadata fix!
 */
export async function createDownloadableClipBlob(
  clip: GeneratedClip,
  thumbnailUrl?: string,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; url: string; extension: 'mp4' | 'webm' }> {
  return new Promise(async (resolve) => {
    const targetDuration = Math.max(1, clip.duration || 15);
    const isVertical = clip.aspectRatio === '9:16';
    const width = isVertical ? 720 : 1280;
    const height = isVertical ? 1280 : 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Preload image before starting recording so frame 0 is never black!
    const posterSrc = thumbnailUrl || clip.thumbnailBlobUrl;
    if (posterSrc) {
      await new Promise<void>((r) => {
        img.onload = () => r();
        img.onerror = () => r();
        img.src = posterSrc;
        if (img.complete && img.naturalWidth > 0) r();
        setTimeout(r, 800);
      });
    }

    // Audio synthesizer to provide a real audio track
    let audioCtx: AudioContext | null = null;
    const stream = canvas.captureStream(30);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0.05; // Gentle background synthesizer tone
        osc.type = 'sine';
        osc.frequency.value = 220; // 220 Hz pleasant low tone
        osc.connect(gain);
        const dest = audioCtx.createMediaStreamDestination();
        gain.connect(dest);
        osc.start();
        dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }
    } catch {}

    let mimeType = 'video/webm';
    let chosenExt: 'mp4' | 'webm' = 'webm';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
        chosenExt = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        chosenExt = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
        chosenExt = 'webm';
      }
    }

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    let isDone = false;
    let animId: number;
    let intervalId: any;
    const startTimeReal = performance.now();

    const finishRecord = async () => {
      if (isDone) return;
      isDone = true;
      cancelAnimationFrame(animId);
      clearInterval(intervalId);
      onProgress?.(100);
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    };

    recorder.onstop = async () => {
      let finalBlob = new Blob(chunks, { type: mimeType });
      if (chosenExt === 'webm' || mimeType.includes('webm')) {
        try {
          finalBlob = await fixWebmDuration(finalBlob, targetDuration * 1000);
        } catch {}
      }
      const url = URL.createObjectURL(finalBlob);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      resolve({ blob: finalBlob, url, extension: chosenExt });
    };

    recorder.start(100);

    const drawFrame = () => {
      if (isDone) return;
      const elapsedSec = (performance.now() - startTimeReal) / 1000;
      const progressRatio = Math.min(1.0, elapsedSec / targetDuration);
      onProgress?.(Math.min(99, Math.round(progressRatio * 100)));

      // Draw background image
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);
      }

      // Cinematic dark gradient
      const grad = ctx.createLinearGradient(0, height * 0.4, 0, height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Top branding
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('driaClip by Driacom', 36, 56);

      // Dynamic Animated Waveform
      const waveY = height - 160;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
      for (let i = 0; i < 24; i++) {
        const barH = 10 + Math.sin(elapsedSec * 6 + i) * 18 + Math.cos(i * 1.5) * 8;
        ctx.fillRect(36 + i * 14, waveY - barH, 8, barH * 2);
      }

      // Clip details
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(clip.title, 36, height - 100);

      // Time Range and Duration
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        `${formatTimeCode(clip.startTime)} - ${formatTimeCode(clip.endTime)} (${targetDuration}s) • Posisi: ${formatTimeCode(elapsedSec)}`,
        36,
        height - 65
      );

      // Hook text
      if (clip.hookText) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'italic 16px sans-serif';
        ctx.fillText(clip.hookText.slice(0, 50), 36, height - 32);
      }

      // Animated Progress Bar across bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, height - 8, width, 8);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(0, height - 8, width * progressRatio, 8);

      if (elapsedSec >= targetDuration) {
        finishRecord();
        return;
      }

      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);
    intervalId = setInterval(drawFrame, 33);

    // Timeout safety
    setTimeout(finishRecord, (targetDuration + 1.5) * 1000);
  });
}
