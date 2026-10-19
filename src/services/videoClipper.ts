import { AspectRatio, VerticalStyle, GeneratedClip, ExportQuality, TrackingKeyframe, WatermarkPosition, WatermarkStyle } from '../types/driaclip';

/**
 * Draws a distinct, tamper-resistant customized watermark badge onto a canvas frame.
 * Positioned in the anti-crop vertical safe zone with support for custom visitor text and styles.
 */
export function drawDriaClipWatermark(
  ctx: CanvasRenderingContext2D,
  targetW: number,
  targetH: number,
  aspectRatio: AspectRatio = '9:16',
  position: WatermarkPosition = 'safe-top-left',
  customText: string = 'DriaClip',
  style: WatermarkStyle = 'neon-glow'
): void {
  ctx.save();

  const displayText = (customText || 'DriaClip').trim().slice(0, 35) || 'DriaClip';
  const fontSize = Math.max(14, Math.round(targetW * 0.032));
  ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;

  const textMetrics = ctx.measureText(displayText);
  const textW = textMetrics.width;

  const pillPadX = Math.round(fontSize * 0.9);
  const pillPadY = Math.round(fontSize * 0.45);
  const dotRadius = Math.max(3, Math.round(fontSize * 0.22));
  const dotSpacing = Math.round(fontSize * 0.52);

  const badgeW = pillPadX * 2 + dotRadius * 2 + dotSpacing + textW;
  const badgeH = fontSize + pillPadY * 2;
  const badgeRadius = Math.round(badgeH / 2);

  let badgeX = 36;
  let badgeY = 88;

  if (aspectRatio === '9:16') {
    const safeTop = Math.round(targetH * 0.068);
    const safeBottom = Math.round(targetH * 0.82);
    const safeMarginX = Math.round(targetW * 0.05);

    if (position === 'safe-top-right') {
      badgeX = targetW - badgeW - safeMarginX;
      badgeY = safeTop;
    } else if (position === 'center-top') {
      badgeX = Math.round((targetW - badgeW) / 2);
      badgeY = Math.round(targetH * 0.062);
    } else if (position === 'safe-bottom-left') {
      badgeX = safeMarginX;
      badgeY = safeBottom;
    } else if (position === 'safe-bottom-right') {
      badgeX = targetW - badgeW - safeMarginX;
      badgeY = safeBottom;
    } else {
      badgeX = safeMarginX;
      badgeY = safeTop;
    }
  } else if (aspectRatio === '1:1') {
    const margin = Math.round(targetW * 0.04);
    if (position === 'safe-top-right') {
      badgeX = targetW - badgeW - margin;
      badgeY = margin;
    } else if (position === 'center-top') {
      badgeX = Math.round((targetW - badgeW) / 2);
      badgeY = margin;
    } else if (position === 'safe-bottom-left') {
      badgeX = margin;
      badgeY = targetH - badgeH - margin;
    } else if (position === 'safe-bottom-right') {
      badgeX = targetW - badgeW - margin;
      badgeY = targetH - badgeH - margin;
    } else {
      badgeX = margin;
      badgeY = margin;
    }
  } else {
    // 16:9
    const marginX = Math.round(targetW * 0.035);
    const marginY = Math.round(targetH * 0.05);
    if (position === 'safe-top-right') {
      badgeX = targetW - badgeW - marginX;
      badgeY = marginY;
    } else if (position === 'center-top') {
      badgeX = Math.round((targetW - badgeW) / 2);
      badgeY = marginY;
    } else if (position === 'safe-bottom-left') {
      badgeX = marginX;
      badgeY = targetH - badgeH - marginY;
    } else if (position === 'safe-bottom-right') {
      badgeX = targetW - badgeW - marginX;
      badgeY = targetH - badgeH - marginY;
    } else {
      badgeX = marginX;
      badgeY = marginY;
    }
  }

  // 1. Semi-transparent backdrop with crisp shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  let cornerColor = '#a855f7'; // violet default
  let glyphColor = '#c084fc';
  let bgColor = 'rgba(10, 10, 15, 0.78)';

  if (style === 'glass-blur') {
    cornerColor = '#38bdf8';
    glyphColor = '#7dd3fc';
    bgColor = 'rgba(15, 23, 42, 0.70)';
  } else if (style === 'gradient-accent') {
    cornerColor = '#f59e0b';
    glyphColor = '#fbbf24';
    bgColor = 'rgba(30, 27, 75, 0.78)';
  } else if (style === 'minimal-dark') {
    cornerColor = '#94a3b8';
    glyphColor = '#cbd5e1';
    bgColor = 'rgba(10, 10, 15, 0.85)';
  }

  // Draw container background
  ctx.fillStyle = bgColor;
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

  // 2. Draw 4 Corner Accent Lines ("garis sudut" framing - zero animation, distinct modern look)
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = cornerColor;
  ctx.lineWidth = Math.max(1.8, Math.round(fontSize * 0.12));
  const cornerLen = Math.max(6, Math.round(fontSize * 0.45));

  // Top-Left corner
  ctx.beginPath();
  ctx.moveTo(badgeX, badgeY + cornerLen);
  ctx.lineTo(badgeX, badgeY);
  ctx.lineTo(badgeX + cornerLen, badgeY);
  ctx.stroke();

  // Top-Right corner
  ctx.beginPath();
  ctx.moveTo(badgeX + badgeW - cornerLen, badgeY);
  ctx.lineTo(badgeX + badgeW, badgeY);
  ctx.lineTo(badgeX + badgeW, badgeY + cornerLen);
  ctx.stroke();

  // Bottom-Left corner
  ctx.beginPath();
  ctx.moveTo(badgeX, badgeY + badgeH - cornerLen);
  ctx.lineTo(badgeX, badgeY + badgeH);
  ctx.lineTo(badgeX + cornerLen, badgeY + badgeH);
  ctx.stroke();

  // Bottom-Right corner
  ctx.beginPath();
  ctx.moveTo(badgeX + badgeW - cornerLen, badgeY + badgeH);
  ctx.lineTo(badgeX + badgeW, badgeY + badgeH);
  ctx.lineTo(badgeX + badgeW, badgeY + badgeH - cornerLen);
  ctx.stroke();

  // 3. Static Star Glyph (✦)
  ctx.fillStyle = glyphColor;
  ctx.font = `bold ${Math.round(fontSize * 0.85)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const glyphX = badgeX + pillPadX * 0.7;
  const centerY = badgeY + badgeH / 2;
  ctx.fillText('✦', glyphX, centerY);

  // 4. Clean Monospace Watermark Text
  ctx.fillStyle = '#f8fafc';
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace, system-ui`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const textX = glyphX + fontSize * 0.9;
  ctx.fillText(displayText.toUpperCase(), textX, centerY);

  ctx.restore();
}

/**
 * Pre-renders the custom watermark badge once onto an offscreen canvas
 * so per-frame drawing during video recording takes < 0.05ms (zero CPU stutter).
 */
export function createWatermarkOffscreenCanvas(
  targetW: number,
  targetH: number,
  aspectRatio: AspectRatio = '9:16',
  position: WatermarkPosition = 'safe-top-left',
  customText: string = 'DriaClip',
  style: WatermarkStyle = 'neon-glow'
): { canvas: HTMLCanvasElement; x: number; y: number } {
  const displayText = (customText || 'DriaClip').trim().slice(0, 35) || 'DriaClip';
  const fontSize = Math.max(14, Math.round(targetW * 0.032));

  // Measure text
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.font = `600 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  const textW = tempCtx.measureText(displayText).width;

  const pillPadX = Math.round(fontSize * 0.9);
  const pillPadY = Math.round(fontSize * 0.45);
  const dotRadius = Math.max(3, Math.round(fontSize * 0.22));
  const dotSpacing = Math.round(fontSize * 0.52);

  const badgeW = pillPadX * 2 + dotRadius * 2 + dotSpacing + textW;
  const badgeH = fontSize + pillPadY * 2;
  const badgeRadius = Math.round(badgeH / 2);

  let badgeX = 36;
  let badgeY = 88;

  if (aspectRatio === '9:16') {
    const safeTop = Math.round(targetH * 0.068);
    const safeBottom = Math.round(targetH * 0.82);
    const safeMarginX = Math.round(targetW * 0.05);

    if (position === 'safe-top-right') {
      badgeX = targetW - badgeW - safeMarginX;
      badgeY = safeTop;
    } else if (position === 'center-top') {
      badgeX = Math.round((targetW - badgeW) / 2);
      badgeY = Math.round(targetH * 0.062);
    } else if (position === 'safe-bottom-left') {
      badgeX = safeMarginX;
      badgeY = safeBottom;
    } else if (position === 'safe-bottom-right') {
      badgeX = targetW - badgeW - safeMarginX;
      badgeY = safeBottom;
    } else {
      badgeX = safeMarginX;
      badgeY = safeTop;
    }
  } else if (aspectRatio === '1:1') {
    const margin = Math.round(targetW * 0.04);
    if (position === 'safe-top-right') {
      badgeX = targetW - badgeW - margin;
      badgeY = margin;
    } else if (position === 'center-top') {
      badgeX = Math.round((targetW - badgeW) / 2);
      badgeY = margin;
    } else if (position === 'safe-bottom-left') {
      badgeX = margin;
      badgeY = targetH - badgeH - margin;
    } else if (position === 'safe-bottom-right') {
      badgeX = targetW - badgeW - margin;
      badgeY = targetH - badgeH - margin;
    } else {
      badgeX = margin;
      badgeY = margin;
    }
  } else {
    const marginX = Math.round(targetW * 0.035);
    const marginY = Math.round(targetH * 0.05);
    if (position === 'safe-top-right') {
      badgeX = targetW - badgeW - marginX;
      badgeY = marginY;
    } else if (position === 'center-top') {
      badgeX = Math.round((targetW - badgeW) / 2);
      badgeY = marginY;
    } else if (position === 'safe-bottom-left') {
      badgeX = marginX;
      badgeY = targetH - badgeH - marginY;
    } else if (position === 'safe-bottom-right') {
      badgeX = targetW - badgeW - marginX;
      badgeY = targetH - badgeH - marginY;
    } else {
      badgeX = marginX;
      badgeY = marginY;
    }
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(badgeW) + 20;
  offscreen.height = Math.ceil(badgeH) + 20;
  const octx = offscreen.getContext('2d')!;

  const bx = 6;
  const by = 6;

  octx.save();

  // 1. Clean translucent background
  octx.fillStyle = style === 'glass-blur'
    ? 'rgba(15, 23, 42, 0.60)'
    : style === 'minimal-dark'
    ? 'rgba(10, 10, 15, 0.75)'
    : style === 'gradient-accent'
    ? 'rgba(30, 15, 50, 0.70)'
    : 'rgba(5, 5, 10, 0.65)';
  octx.fillRect(bx, by, badgeW, badgeH);

  // 2. 4 Framing Corner Lines (Garis Sudut HUD - Tidak Kotak Biasa & Tanpa Animasi Berat)
  let cornerColor = '#a855f7';
  if (style === 'glass-blur') cornerColor = '#38bdf8';
  else if (style === 'minimal-dark') cornerColor = '#e2e8f0';
  else if (style === 'gradient-accent') cornerColor = '#fbbf24';

  const cornerLen = Math.max(5, Math.round(fontSize * 0.45));
  const cornerWidth = Math.max(1.8, Math.round(fontSize * 0.12));

  octx.strokeStyle = cornerColor;
  octx.lineWidth = cornerWidth;
  octx.lineCap = 'square';
  octx.lineJoin = 'miter';

  octx.beginPath();
  // Top-Left corner
  octx.moveTo(bx, by + cornerLen);
  octx.lineTo(bx, by);
  octx.lineTo(bx + cornerLen, by);

  // Top-Right corner
  octx.moveTo(bx + badgeW - cornerLen, by);
  octx.lineTo(bx + badgeW, by);
  octx.lineTo(bx + badgeW, by + cornerLen);

  // Bottom-Left corner
  octx.moveTo(bx, by + badgeH - cornerLen);
  octx.lineTo(bx, by + badgeH);
  octx.lineTo(bx + cornerLen, by + badgeH);

  // Bottom-Right corner
  octx.moveTo(bx + badgeW - cornerLen, by + badgeH);
  octx.lineTo(bx + badgeW, by + badgeH);
  octx.lineTo(bx + badgeW, by + badgeH - cornerLen);
  octx.stroke();

  // 3. Static Star Glyph (✦)
  octx.font = `600 ${Math.round(fontSize * 0.85)}px monospace`;
  octx.fillStyle = cornerColor;
  octx.textAlign = 'left';
  octx.textBaseline = 'middle';
  const glyphX = bx + pillPadX * 0.8;
  const glyphY = by + badgeH / 2;
  octx.fillText('✦', glyphX, glyphY);

  // 4. Clean High-Contrast Typography
  octx.font = `bold ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  octx.fillStyle = '#f8fafc';
  octx.textAlign = 'left';
  octx.textBaseline = 'middle';
  octx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  octx.shadowBlur = 3;
  const textX = glyphX + fontSize * 0.9;
  const textY = by + badgeH / 2;
  octx.fillText(displayText.toUpperCase(), textX, textY);
  octx.restore();

  return { canvas: offscreen, x: badgeX - 6, y: badgeY - 6 };
}

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
                // Direct automatic 9:16 center-crop with manual pan (cropPositionX)
                const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
                const fgW = img.naturalWidth * scale;
                const fgH = img.naturalHeight * scale;
                const panRatio = Math.max(0, Math.min(100, cropPositionX ?? 50)) / 100;
                const fgX = (width - fgW) * panRatio;
                const fgY = (height - fgH) / 2;
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
            // Direct automatic 9:16 vertical crop with manual pan (cropPositionX)
            const scale = Math.max(width / vw, height / vh);
            const fgW = vw * scale;
            const fgH = vh * scale;
            const panRatio = Math.max(0, Math.min(100, cropPositionX ?? 50)) / 100;
            const fgX = (width - fgW) * panRatio;
            const fgY = (height - fgH) / 2;
            ctx.drawImage(video, 0, 0, vw, vh, fgX, fgY, fgW, fgH);
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
  zoomOutPercent: number = 20,
  watermark: boolean = true,
  watermarkPosition: WatermarkPosition = 'safe-top-left',
  watermarkText: string = 'DriaClip',
  watermarkStyle: WatermarkStyle = 'neon-glow'
): Promise<{ blob: Blob; url: string; size: number; extension: 'mp4' | 'webm' }> {
  return new Promise(async (resolve, reject) => {
    if (!videoUrl || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      reject(new Error('Format video tidak didukung untuk pemotongan langsung di peramban.'));
      return;
    }

    const targetDuration = Math.max(0.5, endTime - startTime);

    // Create offscreen video element attached to DOM
    const video = document.createElement('video');
    video.style.position = 'fixed';
    video.style.left = '-9999px';
    video.style.top = '-9999px';
    video.style.width = '320px';
    video.style.height = '180px';
    video.style.opacity = '0.01';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    const isSameOrigin = videoUrl.startsWith('/') || (typeof window !== 'undefined' && videoUrl.startsWith(window.location.origin));
    if (!videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:') && !isSameOrigin) {
      video.crossOrigin = 'anonymous';
    }
    video.src = videoUrl;
    video.preload = 'auto';
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // Attempt crystal-clear Web Audio capture
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1.0;

    // Use memory-efficient 720p maximum in browser mode to prevent freezing & memory spikes
    let targetW = 720;
    let targetH = 1280;
    if (aspectRatio === '9:16') {
      targetW = 720;
      targetH = 1280;
    } else if (aspectRatio === '1:1') {
      targetW = 720;
      targetH = 720;
    } else {
      targetW = 1280;
      targetH = 720;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    // Lightweight blur helper canvas for fast backdrop rendering
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = 120;
    blurCanvas.height = Math.round(120 * (targetH / targetW));
    const blurCtx = blurCanvas.getContext('2d', { alpha: false });

    if (!ctx) {
      if (video.parentNode) video.parentNode.removeChild(video);
      reject(new Error('Canvas context not available'));
      return;
    }

    // Pre-cache watermark badge offscreen so per-frame drawing takes < 0.05ms (zero CPU stutter)
    let wmInfo: { canvas: HTMLCanvasElement; x: number; y: number } | null = null;
    if (watermark) {
      wmInfo = createWatermarkOffscreenCanvas(targetW, targetH, aspectRatio, watermarkPosition, watermarkText, watermarkStyle);
    }

    try {
      // Step 1: Wait for video metadata with resilient CORS and timeout fallback
      await new Promise<void>((res, rej) => {
        if (video.readyState >= 1) return res();

        let retriedWithoutCors = false;
        let timer: any = null;

        const onLoaded = () => {
          cleanup();
          res();
        };

        const onError = () => {
          if (video.crossOrigin && !retriedWithoutCors) {
            console.warn('[DriaClip] Retrying video load without crossOrigin...');
            retriedWithoutCors = true;
            video.removeAttribute('crossorigin');
            video.src = videoUrl;
            video.load();
            return;
          }
          cleanup();
          if (video.parentNode) video.parentNode.removeChild(video);
          rej(new Error('Gagal memuat sumber video. Pastikan format video didukung oleh peramban.'));
        };

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('canplay', onLoaded);
          video.removeEventListener('error', onError);
          if (timer) clearTimeout(timer);
        };

        video.addEventListener('loadedmetadata', onLoaded, { once: true });
        video.addEventListener('canplay', onLoaded, { once: true });
        video.addEventListener('error', onError);

        timer = setTimeout(() => {
          cleanup();
          res();
        }, 4000);
      });

      // Step 2: Prepare canvas stream (30fps)
      const stream = canvas.captureStream(30);

      // Step 3: Audio capture via Web Audio (Routing into destination stream ONLY - NOT physical speakers!)
      let audioCtx: AudioContext | null = null;
      let audioSourceNode: MediaElementAudioSourceNode | null = null;
      let audioDestNode: MediaStreamAudioDestinationNode | null = null;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          audioSourceNode = audioCtx.createMediaElementSource(video);
          audioDestNode = audioCtx.createMediaStreamDestination();
          // Connect to destNode ONLY. Never connect to audioCtx.destination!
          audioSourceNode.connect(audioDestNode);
          audioDestNode.stream.getAudioTracks().forEach((track) => {
            stream.addTrack(track);
          });
        }
      } catch (audioErr) {
        console.warn('AudioContext routing notice:', audioErr);
        try {
          const vStream = (video as any).captureStream ? (video as any).captureStream() : null;
          if (vStream) {
            vStream.getAudioTracks().forEach((track: MediaStreamTrack) => stream.addTrack(track));
          }
        } catch {}
      }

      // Step 4: Determine best supported MIME type
      let mimeType = 'video/webm;codecs=vp9,opus';
      let chosenExt: 'mp4' | 'webm' = 'webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
          mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
          chosenExt = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
          mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
          chosenExt = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
          chosenExt = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
          chosenExt = 'webm';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          mimeType = 'video/webm;codecs=vp8,opus';
          chosenExt = 'webm';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
          chosenExt = 'webm';
        }
      }

      // Constrain bitrate to 3.5 Mbps with 192k audio for fluid playback without CPU starvation
      const recorder = new MediaRecorder(
        stream,
        mimeType
          ? { mimeType, videoBitsPerSecond: 3500000, audioBitsPerSecond: 192000 }
          : { videoBitsPerSecond: 3500000, audioBitsPerSecond: 192000 }
      );
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
        setTimeout(res, 800);
      });

      // Step 6: Start playback safely with unmuted stream (fallback to muted if browser autoplay blocks)
      try {
        if (audioCtx && audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        await video.play();
      } catch (playErr) {
        console.warn('Playback resume retry:', playErr);
        try {
          video.muted = true;
          if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
          await video.play();
        } catch (e) {
          console.warn('Playback fallback notice:', e);
        }
      }

      recorder.start(100);

      let isDone = false;
      let frameCounter = 0;
      let lastReportedProgress = -1;
      let lastReportedTime = 0;
      let rvfcId: number | null = null;
      let rafId: number | null = null;
      let failsafeTimeoutId: any = null;

      const finishRecording = () => {
        if (isDone) return;
        isDone = true;
        if (failsafeTimeoutId) clearTimeout(failsafeTimeoutId);
        if (rvfcId !== null && (video as any).cancelVideoFrameCallback) {
          try {
            (video as any).cancelVideoFrameCallback(rvfcId);
          } catch {}
          rvfcId = null;
        }
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
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

        // Cleanup DOM and audio context
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close().catch(() => {});
        }

        resolve({ blob: finalBlob, url: blobUrl, size: finalBlob.size, extension: chosenExt });
      };

      // Synchronous, non-blocking frame drawing
      const renderCurrentFrame = (curTime: number) => {
        if (isDone) return;

        // Auto-resume if paused unexpectedly
        if (video.paused && !video.ended && video.readyState >= 2) {
          video.play().catch(() => {});
        }

        const elapsed = Math.max(0, curTime - startTime);
        const progress = Math.min(99, Math.round((elapsed / targetDuration) * 100));

        // Throttle progress callback to avoid freezing the browser main thread
        const now = performance.now();
        if (progress !== lastReportedProgress && now - lastReportedTime > 250) {
          lastReportedProgress = progress;
          lastReportedTime = now;
          onProgress?.(progress);
        }

        frameCounter++;
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const currentEffectiveCropX = Math.max(0, Math.min(100, Number(cropPositionX ?? 50)));

        if (aspectRatio === '9:16') {
          if (verticalStyle === 'blur-background') {
            if (blurCtx && frameCounter % 3 === 0) {
              blurCtx.drawImage(video, 0, 0, blurCanvas.width, blurCanvas.height);
            }
            if (blurCtx) {
              ctx.drawImage(blurCanvas, 0, 0, targetW, targetH);
            }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
            ctx.fillRect(0, 0, targetW, targetH);

            const fitScale = targetW / vw;
            const fgH = vh * fitScale;
            const fgY = (targetH - fgH) / 2;
            ctx.drawImage(video, 0, fgY, targetW, fgH);
          } else if (verticalStyle === 'letterbox') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, targetW, targetH);

            const fitScale = targetW / vw;
            const fgH = vh * fitScale;
            const fgY = (targetH - fgH) / 2;
            ctx.drawImage(video, 0, fgY, targetW, fgH);
          } else {
            // Direct automatic 9:16 vertical crop with manual frame shift (cropPositionX)
            const scale = Math.max(targetW / vw, targetH / vh);
            const fgW = vw * scale;
            const fgH = vh * scale;

            // Shift frame horizontally according to user positioning:
            // 0% = Left subject aligned, 50% = Center subject, 100% = Right subject aligned
            const panRatio = currentEffectiveCropX / 100;
            const fgX = (targetW - fgW) * panRatio;
            const fgY = (targetH - fgH) / 2;

            ctx.drawImage(video, 0, 0, vw, vh, fgX, fgY, fgW, fgH);
          }
        } else if (aspectRatio === '1:1') {
          const minDim = Math.min(vw, vh);
          const maxCropX = Math.max(0, vw - minDim);
          const ratio = currentEffectiveCropX / 100;
          const cropX = maxCropX * ratio;
          const cropY = (vh - minDim) / 2;
          ctx.drawImage(video, cropX, cropY, minDim, minDim, 0, 0, targetW, targetH);
        } else {
          ctx.drawImage(video, 0, 0, targetW, targetH);
        }

        // Blit pre-cached watermark badge in 0.05ms
        if (wmInfo) {
          ctx.drawImage(wmInfo.canvas, wmInfo.x, wmInfo.y);
        }

        // Check if reached clip end time (or video ended)
        if (curTime >= endTime - 0.04 || video.ended) {
          finishRecording();
        }
      };

      // Zero-latency frame callback synchronization:
      // Always register the next frame immediately BEFORE drawing to avoid skipped frames
      if (typeof (video as any).requestVideoFrameCallback === 'function') {
        const onVideoFrame = (_now: DOMHighResTimeStamp, metadata?: any) => {
          if (isDone) return;
          rvfcId = (video as any).requestVideoFrameCallback(onVideoFrame);
          const mediaTime = metadata?.mediaTime ?? (video as HTMLVideoElement).currentTime;
          renderCurrentFrame(mediaTime);
        };
        rvfcId = (video as any).requestVideoFrameCallback(onVideoFrame);
      } else {
        let lastTime = -1;
        const onRaf = () => {
          if (isDone) return;
          rafId = requestAnimationFrame(onRaf);
          const cur = (video as HTMLVideoElement).currentTime;
          if (cur !== lastTime) {
            lastTime = cur;
            renderCurrentFrame(cur);
          }
        };
        rafId = requestAnimationFrame(onRaf);
      }

      // Failsafe max timeout
      failsafeTimeoutId = setTimeout(() => {
        finishRecording();
      }, (targetDuration + 3.0) * 1000);

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
      watermark: clip.watermark !== false,
      watermarkText: clip.watermarkText || 'DriaClip',
      watermarkPosition: clip.watermarkPosition || 'safe-top-left',
      watermarkStyle: clip.watermarkStyle || 'neon-glow',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.details || err.error || 'Gagal memproses klip video asli';
    const errorObj = new Error(message);
    if (err.code) {
      (errorObj as any).code = err.code;
    }
    throw errorObj;
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
  // If file is larger than 25MB, upload in 8MB chunks to bypass cloud proxy payload caps completely
  if (blobOrFile.size > 25 * 1024 * 1024) {
    const CHUNK_SIZE = 8 * 1024 * 1024;
    const totalChunks = Math.ceil(blobOrFile.size / CHUNK_SIZE);
    const uploadId = `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(blobOrFile.size, (i + 1) * CHUNK_SIZE);
      const chunkBlob = blobOrFile.slice(start, end);

      const chunkRes = await fetch('/api/upload-chunk', {
        method: 'POST',
        headers: {
          'x-upload-id': uploadId,
          'x-chunk-index': String(i),
          'x-total-chunks': String(totalChunks),
          'Content-Type': 'application/octet-stream',
        },
        body: chunkBlob,
      });

      if (!chunkRes.ok) {
        throw new Error('Gagal mengunggah potongan video ke server');
      }
    }

    const renderRes = await fetch('/api/render-chunked-clip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        startTime: clip.startTime,
        endTime: clip.endTime,
        aspectRatio: clip.aspectRatio,
        verticalStyle: clip.verticalStyle,
        cropPositionX: clip.cropPositionX ?? 50,
        zoomOutPercent: clip.zoomOutPercent ?? 20,
        quality: clip.exportQuality || '720p',
        title: clip.title || 'clip',
        watermark: clip.watermark !== false,
        watermarkText: clip.watermarkText || 'DriaClip',
        watermarkPosition: clip.watermarkPosition || 'safe-top-left',
        watermarkStyle: clip.watermarkStyle || 'neon-glow',
      }),
    });

    if (!renderRes.ok) {
      const err = await renderRes.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Gagal memproses klip video besar');
    }

    const blob = await renderRes.blob();
    const url = URL.createObjectURL(blob);
    return { blob, url };
  }

  const params = new URLSearchParams({
    startTime: String(clip.startTime),
    endTime: String(clip.endTime),
    aspectRatio: clip.aspectRatio,
    verticalStyle: clip.verticalStyle,
    cropPositionX: String(clip.cropPositionX ?? 50),
    zoomOutPercent: String(clip.zoomOutPercent ?? 20),
    quality: clip.exportQuality || '720p',
    title: clip.title || 'clip',
    watermark: String(clip.watermark !== false),
    watermarkText: clip.watermarkText || 'DriaClip',
    watermarkPosition: clip.watermarkPosition || 'safe-top-left',
    watermarkStyle: clip.watermarkStyle || 'neon-glow',
  });

  const res = await fetch(`/api/render-local-clip?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: blobOrFile,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details || err.error || 'Gagal memproses klip video lokal');
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
 * Downloadable clip blob helper:
 * Returns the clip's genuine video Blob if already generated, or throws an error
 * instead of generating a fake static-image video.
 */
export async function createDownloadableClipBlob(
  clip: GeneratedClip,
  _thumbnailUrl?: string,
  _onProgress?: (percent: number) => void
): Promise<{ blob: Blob; url: string; extension: 'mp4' | 'webm' }> {
  if (clip.videoBlobUrl) {
    const res = await fetch(clip.videoBlobUrl);
    const blob = await res.blob();
    return { blob, url: clip.videoBlobUrl, extension: clip.videoExtension || 'mp4' };
  }
  throw new Error('Aliran video tidak dapat diproses dari gambar diam. Harap gunakan unduhan server langsung.');
}
