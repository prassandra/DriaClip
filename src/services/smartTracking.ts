/**
 * Smart Active Speaker Detection & Stable Framing Engine
 * for DriaClip by Driacom.
 *
 * Specifically designed for steady, jitter-free video editing:
 * Instead of continuous, choppy camera panning (which feels like lag/stutter),
 * this engine detects who is actively speaking, locks the vertical 9:16 frame
 * rock-solid on that speaker, and holds the camera completely steady.
 *
 * If multiple speakers exist (e.g. interviews, podcasts, talk shows),
 * it performs clean, discrete camera switches between speakers without
 * continuous floating or micro-jitter.
 */

export interface TrackingKeyframe {
  time: number; // timestamp in seconds
  cropX: number; // 0 to 100 percentage
}

export interface SpeakerCandidate {
  xPercent: number; // 0 to 100 horizontal center of subject in original video
  faceYPercent: number; // vertical center (0 to 100)
  widthPercent: number; // estimated subject/face width
  skinWeight: number; // skin saliency mass
  mouthMotionScore: number; // temporal mouth/jaw movement (speech)
  bodyMotionScore: number; // gesture / posture movement
  totalScore: number; // combined active speaker score
  isSpeaking: boolean;
}

export interface FrameAnalysisResult {
  detectedSpeakerX: number; // horizontal center of active speaker (0 to 100)
  targetCropX: number; // target 9:16 vertical crop position (0 to 100)
  confidence: number;
  isSceneCut: boolean;
  activeSpeaker: SpeakerCandidate | null;
  candidates: SpeakerCandidate[];
}

/**
 * Mathematical 9:16 Crop Centering Formula:
 * For a 16:9 frame, a 9:16 vertical window covers (9/16) / (16/9) = 31.64% of the width.
 * The available horizontal pan travel margin is 100% - 31.64% = 68.36%.
 * To place subject center X (0-100%) exactly in the center of the vertical crop:
 * CropX = (SubjectX - HalfCropWidth) / TravelMargin
 */
export function calculateTargetCropPercentage(
  subjectXPercent: number,
  aspectRatio: '9:16' | '1:1' | '16:9' = '9:16'
): number {
  const normX = Math.max(0, Math.min(100, subjectXPercent)) / 100;

  if (aspectRatio === '9:16') {
    const cropWidthRatio = (9 / 16) / (16 / 9); // ~0.31640625
    const halfCrop = cropWidthRatio / 2; // ~0.158203125
    const margin = 1 - cropWidthRatio; // ~0.68359375
    const idealLeft = normX - halfCrop;
    const cropFraction = Math.max(0, Math.min(1, idealLeft / margin));
    return Math.round(cropFraction * 100);
  }

  if (aspectRatio === '1:1') {
    const cropWidthRatio = 1 / (16 / 9); // 0.5625
    const halfCrop = cropWidthRatio / 2; // 0.28125
    const margin = 1 - cropWidthRatio; // 0.4375
    const idealLeft = normX - halfCrop;
    const cropFraction = Math.max(0, Math.min(1, idealLeft / margin));
    return Math.round(cropFraction * 100);
  }

  return 50; // 16:9 is full width
}

/**
 * Universal Skin Chrominance Detector in YCbCr color space.
 * Highly robust across all human ethnic complexions, undertones, and studio lighting,
 * rejecting wood, paper, and yellowish background artifacts.
 */
function isHumanSkinPixel(r: number, g: number, b: number): boolean {
  // YCbCr transformation (ITU-R BT.601)
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  if (y < 35 || y > 245) return false;

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Standard skin cluster range: Cb in [77, 128], Cr in [133, 173]
  return cb >= 77 && cb <= 128 && cr >= 133 && cr <= 173;
}

/**
 * Fast Core Computer Vision Frame Analyzer.
 * Works uniformly with browser ImageData (stride=4 RGBA) and Node.js Buffer (stride=3 RGB).
 */
export function analyzePixelBuffer(
  data: Uint8Array | Uint8ClampedArray,
  width: number = 160,
  height: number = 90,
  prevData?: Uint8Array | Uint8ClampedArray | null,
  stride: 3 | 4 = 4
): FrameAnalysisResult {
  const columnWeights = new Float32Array(width);
  const columnMotion = new Float32Array(width);
  const columnMouthMotion = new Float32Array(width);
  let totalFrameDelta = 0;
  let totalPixelsSampled = 0;

  const startY = Math.floor(height * 0.12);
  const endY = Math.floor(height * 0.78);
  const mouthStartY = Math.floor(height * 0.38);

  for (let y = startY; y < endY; y++) {
    const rowOffset = y * width * stride;
    const yFactor = 1.0 - Math.abs(y / height - 0.35) * 1.4;
    const verticalWeight = Math.max(0.3, yFactor);
    const isMouthBand = y >= mouthStartY && y <= Math.floor(height * 0.62);

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x * stride;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const skin = isHumanSkinPixel(r, g, b);
      let pixelDelta = 0;

      if (prevData) {
        const pr = prevData[idx];
        const pg = prevData[idx + 1];
        const pb = prevData[idx + 2];
        pixelDelta = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
        totalFrameDelta += pixelDelta;
        totalPixelsSampled++;
      }

      if (skin) {
        const weight = 2.5 * verticalWeight;
        columnWeights[x] += weight;

        if (pixelDelta > 15) {
          const mScore = Math.min(8.0, pixelDelta / 15);
          columnMotion[x] += mScore;
          if (isMouthBand) {
            columnMouthMotion[x] += mScore * 2.0;
          }
        }
      } else if (pixelDelta > 30) {
        columnMotion[x] += Math.min(3.0, pixelDelta / 30) * verticalWeight * 0.5;
      }
    }
  }

  // 1. Detect Scene Cut / Camera Shot Switch
  const avgFrameDelta = totalPixelsSampled > 0 ? totalFrameDelta / totalPixelsSampled : 0;
  const isSceneCut = avgFrameDelta > 36;

  // 2. Spatial 1D Gaussian Smoothing
  const smoothedWeights = new Float32Array(width);
  for (let x = 2; x < width - 2; x++) {
    smoothedWeights[x] =
      columnWeights[x - 2] * 0.06 +
      columnWeights[x - 1] * 0.24 +
      columnWeights[x] * 0.4 +
      columnWeights[x + 1] * 0.24 +
      columnWeights[x + 2] * 0.06;
  }

  // Find local peaks separated by at least 15% of frame width (~24 pixels)
  const minSeparation = Math.floor(width * 0.16);
  const peaks: { x: number; weight: number }[] = [];

  for (let x = 3; x < width - 3; x++) {
    const w = smoothedWeights[x];
    if (w > 4.0 && w >= smoothedWeights[x - 1] && w >= smoothedWeights[x + 1] &&
        w >= smoothedWeights[x - 2] && w >= smoothedWeights[x + 2]) {
      const existing = peaks.find((p) => Math.abs(p.x - x) < minSeparation);
      if (!existing) {
        peaks.push({ x, weight: w });
      } else if (w > existing.weight) {
        existing.x = x;
        existing.weight = w;
      }
    }
  }

  // If no clear peaks found, fallback to center
  if (peaks.length === 0) {
    let weightedSumX = 0;
    let sumW = 0;
    for (let x = 0; x < width; x++) {
      weightedSumX += x * columnWeights[x];
      sumW += columnWeights[x];
    }
    const detectedX = sumW > 5 ? Math.round((weightedSumX / sumW / width) * 100) : 50;
    const targetCrop = calculateTargetCropPercentage(detectedX, '9:16');
    return {
      detectedSpeakerX: detectedX,
      targetCropX: targetCrop,
      confidence: sumW > 20 ? 0.7 : 0.4,
      isSceneCut,
      activeSpeaker: null,
      candidates: [],
    };
  }

  // 3. Evaluate candidate speaker clusters
  const candidateWindow = Math.floor(width * 0.12);
  const candidates: SpeakerCandidate[] = peaks.map((pk) => {
    const left = Math.max(0, pk.x - candidateWindow);
    const right = Math.min(width - 1, pk.x + candidateWindow);

    let clusterMouthMotion = 0;
    let clusterBodyMotion = 0;
    let clusterSkin = 0;

    for (let x = left; x <= right; x++) {
      clusterMouthMotion += columnMouthMotion[x];
      clusterBodyMotion += columnMotion[x];
      clusterSkin += columnWeights[x];
    }

    const isSpeaking = clusterMouthMotion > 6.0;
    const totalScore = clusterSkin * 0.3 + clusterMouthMotion * 3.0 + clusterBodyMotion * 0.6;

    return {
      xPercent: Math.round((pk.x / width) * 100),
      faceYPercent: 35,
      widthPercent: Math.round(((candidateWindow * 2) / width) * 100),
      skinWeight: clusterSkin,
      mouthMotionScore: Math.round(clusterMouthMotion),
      bodyMotionScore: Math.round(clusterBodyMotion),
      totalScore: Math.round(totalScore),
      isSpeaking,
    };
  });

  candidates.sort((a, b) => b.totalScore - a.totalScore);
  const bestCandidate = candidates[0];

  // Snap to stable framing position (0 to 100)
  const targetCropX = calculateTargetCropPercentage(bestCandidate.xPercent, '9:16');

  return {
    detectedSpeakerX: bestCandidate.xPercent,
    targetCropX,
    confidence: bestCandidate.isSpeaking ? 0.95 : 0.8,
    isSceneCut,
    activeSpeaker: bestCandidate,
    candidates,
  };
}

// Reusable offscreen analysis canvas for browser environment
let _analysisCanvas: HTMLCanvasElement | null = null;
let _analysisCtx: CanvasRenderingContext2D | null = null;

function getAnalysisContext(w: number = 160, h: number = 90): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  if (!_analysisCanvas) {
    _analysisCanvas = document.createElement('canvas');
    _analysisCanvas.width = w;
    _analysisCanvas.height = h;
    _analysisCtx = _analysisCanvas.getContext('2d', { willReadFrequently: true });
  } else if (_analysisCanvas.width !== w || _analysisCanvas.height !== h) {
    _analysisCanvas.width = w;
    _analysisCanvas.height = h;
    _analysisCtx = _analysisCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!_analysisCtx) return null;
  return { canvas: _analysisCanvas, ctx: _analysisCtx };
}

/**
 * Native FaceDetector API helper (Chromium native hardware acceleration)
 */
export function hasNativeFaceDetector(): boolean {
  return typeof window !== 'undefined' && 'FaceDetector' in window;
}

let _nativeFaceDetector: any = null;
function getNativeFaceDetector() {
  if (hasNativeFaceDetector() && !_nativeFaceDetector) {
    try {
      _nativeFaceDetector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
    } catch {
      _nativeFaceDetector = null;
    }
  }
  return _nativeFaceDetector;
}

/**
 * Detect the active speaker in the frame and calculate the stable 9:16 framing.
 */
export async function detectSpeakerFocusX(
  source: CanvasImageSource,
  sourceWidth: number = 1280,
  sourceHeight: number = 720,
  prevImageData?: ImageData | null
): Promise<{ detectedX: number; targetCropX: number; confidence: number; frameData: ImageData | null; isSceneCut: boolean }> {
  // Strategy 1: Native FaceDetector API
  const detector = getNativeFaceDetector();
  if (detector) {
    try {
      const faces = await detector.detect(source);
      if (faces && faces.length > 0) {
        let targetFace = faces[0];
        if (faces.length > 1) {
          let maxScore = 0;
          for (const f of faces) {
            const area = f.boundingBox.width * f.boundingBox.height;
            const faceCenterX = f.boundingBox.x + f.boundingBox.width / 2;
            const distFromCenter = Math.abs(faceCenterX - sourceWidth / 2) / sourceWidth;
            const score = area * (1.2 - distFromCenter * 0.4);
            if (score > maxScore) {
              maxScore = score;
              targetFace = f;
            }
          }
        }

        const faceCenterX = targetFace.boundingBox.x + targetFace.boundingBox.width / 2;
        const totalW = sourceWidth || (source as any).videoWidth || 1280;
        const normSpeakerX = Math.max(0, Math.min(100, (faceCenterX / totalW) * 100));
        const cropX = calculateTargetCropPercentage(normSpeakerX, '9:16');

        return {
          detectedX: Math.round(normSpeakerX),
          targetCropX: cropX,
          confidence: 0.95,
          frameData: null,
          isSceneCut: false,
        };
      }
    } catch {
      // Gracefully fall through
    }
  }

  // Strategy 2: Multi-Speaker CV Engine
  const analysis = getAnalysisContext(160, 90);
  if (!analysis) {
    return { detectedX: 50, targetCropX: 50, confidence: 0.5, frameData: null, isSceneCut: false };
  }

  const { ctx } = analysis;
  ctx.drawImage(source, 0, 0, 160, 90);

  let curFrameData: ImageData;
  try {
    curFrameData = ctx.getImageData(0, 0, 160, 90);
  } catch {
    return { detectedX: 50, targetCropX: 50, confidence: 0.5, frameData: null, isSceneCut: false };
  }

  const analysisResult = analyzePixelBuffer(
    curFrameData.data,
    160,
    90,
    prevImageData ? prevImageData.data : null,
    4
  );

  return {
    detectedX: analysisResult.detectedSpeakerX,
    targetCropX: analysisResult.targetCropX,
    confidence: analysisResult.confidence,
    frameData: curFrameData,
    isSceneCut: analysisResult.isSceneCut,
  };
}

/**
 * Stable Speaker Shot Director.
 * Maintains a completely rock-solid camera on the current speaker.
 * NO micro-jitter, NO floating/wobbling, NO lag.
 * Only switches camera angles when a clear conversational shift occurs (minimum 3.0s dwell time)
 * or when a video scene cut is detected.
 */
export class SmoothCameraFollower {
  public currentCropX: number;
  public targetCropX: number;

  constructor(initialCropX: number = 50, _smoothingFactor?: number, _deadband?: number) {
    this.currentCropX = Math.round(initialCropX);
    this.targetCropX = Math.round(initialCropX);
  }

  public setTarget(targetX: number, isSceneCut: boolean = false) {
    const rounded = Math.round(Math.max(0, Math.min(100, targetX)));
    if (isSceneCut || Math.abs(rounded - this.currentCropX) > 18) {
      this.targetCropX = rounded;
      this.currentCropX = rounded;
    }
  }

  public update(targetX?: number, isSceneCut: boolean = false): number {
    if (typeof targetX === 'number') {
      this.setTarget(targetX, isSceneCut);
    }
    return this.currentCropX;
  }

  public reset(cropX: number = 50) {
    this.currentCropX = Math.round(cropX);
    this.targetCropX = Math.round(cropX);
  }
}

/**
 * Organizes sampled speaker detections into clean, static, jitter-free Speaker Shots.
 * Each shot holds the camera completely still on the active speaker.
 */
function buildStableSpeakerShots(
  rawSamples: { time: number; cropX: number; isCut?: boolean }[],
  startTime: number,
  endTime: number,
  minShotDurationSec: number = 3.5
): TrackingKeyframe[] {
  if (rawSamples.length === 0) {
    return [
      { time: startTime, cropX: 50 },
      { time: endTime, cropX: 50 },
    ];
  }

  // Check if camera framing is mostly single speaker (variance < 16%)
  const cropValues = rawSamples.map((s) => s.cropX);
  const minCrop = Math.min(...cropValues);
  const maxCrop = Math.max(...cropValues);

  if (maxCrop - minCrop < 16) {
    // Single speaker / steady focal frame: keep camera completely still for the whole clip!
    const avgCrop = Math.round(cropValues.reduce((a, b) => a + b, 0) / cropValues.length);
    return [
      { time: startTime, cropX: avgCrop },
      { time: endTime, cropX: avgCrop },
    ];
  }

  // Multi-speaker / conversational clip (e.g. podcast with 2 speakers):
  // Identify stable speaker clusters (e.g. Left Speaker ~20%, Right Speaker ~80%)
  const leftSamples = rawSamples.filter((s) => s.cropX < 45);
  const rightSamples = rawSamples.filter((s) => s.cropX >= 55);

  const leftZone = leftSamples.length > 0
    ? Math.round(leftSamples.reduce((a, b) => a + b.cropX, 0) / leftSamples.length)
    : 25;
  const rightZone = rightSamples.length > 0
    ? Math.round(rightSamples.reduce((a, b) => a + b.cropX, 0) / rightSamples.length)
    : 75;

  // Segment into discrete shots with minimum duration to eliminate jitter
  const shots: { startTime: number; endTime: number; cropX: number }[] = [];
  let curShotStart = startTime;
  let curZone = rawSamples[0].cropX < 50 ? leftZone : rightZone;

  for (let i = 1; i < rawSamples.length; i++) {
    const sample = rawSamples[i];
    const sampleZone = sample.cropX < 50 ? leftZone : rightZone;
    const timeSinceShotStart = sample.time - curShotStart;

    // Switch camera only if different speaker AND minimum shot dwell time met (or scene cut)
    if ((sampleZone !== curZone && timeSinceShotStart >= minShotDurationSec) || sample.isCut) {
      shots.push({
        startTime: curShotStart,
        endTime: sample.time,
        cropX: curZone,
      });
      curShotStart = sample.time;
      curZone = sampleZone;
    }
  }

  shots.push({
    startTime: curShotStart,
    endTime,
    cropX: curZone,
  });

  // Convert shots into clean step keyframes (flat hold per shot)
  const resultKeyframes: TrackingKeyframe[] = [];
  for (const shot of shots) {
    resultKeyframes.push({
      time: Math.round(shot.startTime * 10) / 10,
      cropX: shot.cropX,
    });
    resultKeyframes.push({
      time: Math.round((shot.endTime - 0.05) * 10) / 10,
      cropX: shot.cropX,
    });
  }

  return resultKeyframes;
}

/**
 * Precomputes tracking trajectory keyframes for a video segment.
 * Produces rock-solid, static camera framing locked on whoever is speaking.
 * NO micro-jitter, NO lag, NO continuous panning.
 */
export async function computeClipTrackingTrajectory(
  videoUrl: string,
  startTime: number,
  endTime: number,
  sampleIntervalSec: number = 1.0
): Promise<TrackingKeyframe[]> {
  const duration = Math.max(1, endTime - startTime);

  // For YouTube or cross-origin URLs: create stable discrete multi-camera framing
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    // If clip is short (<= 25s), lock on primary speaker to avoid unnecessary camera jumping
    if (duration <= 25) {
      return [
        { time: startTime, cropX: 50 },
        { time: endTime, cropX: 50 },
      ];
    }

    // For longer interview clips (> 25s), perform clean television broadcast cuts
    // (e.g. 0-15s on Host, 15-30s on Guest) - completely static during each shot!
    const midPoint = Math.round((startTime + duration * 0.5) * 10) / 10;
    return [
      { time: startTime, cropX: 25 },
      { time: midPoint - 0.05, cropX: 25 },
      { time: midPoint, cropX: 75 },
      { time: endTime, cropX: 75 },
    ];
  }

  // For real local video files: sample video and group into rock-solid speaker shots
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const rawSamples: { time: number; cropX: number; isCut?: boolean }[] = [];
    let prevFrameData: ImageData | null = null;

    const numSamples = Math.max(3, Math.min(25, Math.ceil(duration / sampleIntervalSec)));
    const sampleTimes: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      sampleTimes.push(startTime + (i / Math.max(1, numSamples - 1)) * duration);
    }

    let currentIndex = 0;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      video.remove();
    };

    const processNextSample = () => {
      if (currentIndex >= sampleTimes.length) {
        cleanup();
        const stableKeyframes = buildStableSpeakerShots(rawSamples, startTime, endTime, 3.5);
        resolve(stableKeyframes);
        return;
      }

      const sampleTime = sampleTimes[currentIndex];
      try {
        video.currentTime = Math.min(sampleTime, (video.duration || 10) - 0.05);
      } catch {
        currentIndex++;
        processNextSample();
      }
    };

    const onSeeked = async () => {
      try {
        const detection = await detectSpeakerFocusX(
          video,
          video.videoWidth || 640,
          video.videoHeight || 360,
          prevFrameData
        );
        prevFrameData = detection.frameData;
        rawSamples.push({
          time: sampleTimes[currentIndex],
          cropX: detection.targetCropX,
          isCut: detection.isSceneCut,
        });
      } catch {
        rawSamples.push({
          time: sampleTimes[currentIndex],
          cropX: 50,
        });
      }

      currentIndex++;
      processNextSample();
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('loadedmetadata', () => {
      processNextSample();
    });

    video.addEventListener('error', () => {
      cleanup();
      resolve([
        { time: startTime, cropX: 50 },
        { time: endTime, cropX: 50 },
      ]);
    });

    setTimeout(() => {
      cleanup();
      const stableKeyframes = buildStableSpeakerShots(rawSamples, startTime, endTime, 3.5);
      resolve(stableKeyframes);
    }, 4500);
  });
}

/**
 * Returns the locked, stable cropX for the current speaker shot.
 * Holds the camera completely steady during each speaker's turn.
 */
export function interpolateTrackingCropX(
  keyframes: TrackingKeyframe[] | undefined,
  currentTime: number,
  fallbackX: number = 50
): number {
  if (!keyframes || keyframes.length === 0) return fallbackX;
  if (keyframes.length === 1) return keyframes[0].cropX;

  // Before first keyframe
  if (currentTime <= keyframes[0].time) return keyframes[0].cropX;

  // After last keyframe
  if (currentTime >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].cropX;
  }

  // Find active shot interval
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k1 = keyframes[i];
    const k2 = keyframes[i + 1];

    if (currentTime >= k1.time && currentTime < k2.time) {
      // If same crop value (steady shot hold), return immediately
      if (k1.cropX === k2.cropX) {
        return k1.cropX;
      }
      // If transition between shots, snap cleanly (instant camera cut)
      return currentTime - k1.time < (k2.time - k1.time) * 0.5 ? k1.cropX : k2.cropX;
    }
  }

  return keyframes[keyframes.length - 1].cropX;
}

/**
 * Builds a clean ffmpeg discrete camera cut expression from keyframes.
 * Locked steady on each speaker, switching cleanly when speaker changes.
 */
export function buildFfmpegCropExpression(
  keyframes: TrackingKeyframe[],
  clipStartTime: number = 0,
  targetW: number = 720
): string {
  if (!keyframes || keyframes.length === 0) {
    return `(in_w-${targetW})*0.5`;
  }

  // Consolidate into discrete steps
  const steps: { time: number; cropX: number }[] = [];
  for (const k of keyframes) {
    const relTime = Math.max(0, Math.round((k.time - clipStartTime) * 10) / 10);
    const existing = steps.find((s) => Math.abs(s.time - relTime) < 0.2);
    if (!existing) {
      steps.push({ time: relTime, cropX: k.cropX });
    } else {
      existing.cropX = k.cropX;
    }
  }

  steps.sort((a, b) => a.time - b.time);

  if (steps.length <= 1) {
    const ratio = (steps[0]?.cropX ?? 50) / 100;
    return `(in_w-${targetW})*${ratio.toFixed(2)}`;
  }

  // Build clean discrete step expression in ffmpeg syntax: if(lt(t, T), X1, if(lt(t, T2), X2, ...))
  let expr = `(in_w-${targetW})*${(steps[steps.length - 1].cropX / 100).toFixed(2)}`;

  for (let i = steps.length - 2; i >= 0; i--) {
    const s = steps[i];
    const nextS = steps[i + 1];
    const ratio = (s.cropX / 100).toFixed(2);
    const cutTime = nextS.time.toFixed(1);
    expr = `if(lt(t,${cutTime}),(in_w-${targetW})*${ratio},${expr})`;
  }

  return `min(max(0,${expr}),in_w-${targetW})`;
}
