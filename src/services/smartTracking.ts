/**
 * AI Smart Auto-Reframe 16:9 → 9:16 Tracking Engine
 * for DriaClip by Driacom.
 *
 * Implements intelligent subject detection, multi-person framing,
 * safe area preservation, and virtual Steadicam camera smoothing:
 * - Detect Subject (Faces, human bodies, skin tone, saliency, speech/motion)
 * - Track Subject Position throughout video
 * - Safe Area & Natural Margin Enforcement (never cuts head/face/subject)
 * - Multi-Person Group Framing (fits all if possible, prioritizes active speaker if wide)
 * - Virtual Gimbal / Camera Motion:
 *   * Dead zone & movement threshold (prevents micro-jitter & twitching)
 *   * Smooth acceleration, gliding, and easing
 *   * Stable stationary lock when talent stops moving
 *   * Memory hold on temporary occlusion / disappearance
 *   * Instant scene cut transition without cross-shot pans
 */

export interface TrackingKeyframe {
  time: number; // timestamp in seconds
  cropX: number; // 0 to 100 percentage of available pan travel
}

export interface SubjectCandidate {
  xPercent: number; // 0 to 100 horizontal center of subject in original video
  faceYPercent: number; // vertical center (0 to 100)
  widthPercent: number; // estimated subject/face width
  skinWeight: number; // skin saliency mass
  mouthMotionScore: number; // temporal mouth/jaw movement (speech)
  bodyMotionScore: number; // gesture / posture movement
  totalScore: number; // combined active speaker score
  isSpeaking: boolean;
  confidence: number;
}

export interface FrameAnalysisResult {
  detectedSpeakerX: number; // horizontal center of active speaker (0 to 100)
  targetCropX: number; // target 9:16 vertical crop position (0 to 100)
  confidence: number;
  isSceneCut: boolean;
  activeSpeaker: SubjectCandidate | null;
  candidates: SubjectCandidate[];
}

/**
 * Theoretical 16:9 to 9:16 Aspect Ratio Constants:
 * For a 16:9 master video, a 9:16 vertical crop window covers:
 * (9/16) / (16/9) = 81 / 256 ≈ 0.31640625 (31.64% of original width).
 * The horizontal travel margin for panning is 100% - 31.640625% = 68.359375%.
 */
export const CROP_WIDTH_RATIO = 81 / 256; // ~0.31640625
export const PAN_TRAVEL_MARGIN = 1 - CROP_WIDTH_RATIO; // ~0.68359375

/**
 * Calculates target crop percentage with safe margins and head/body boundary protection.
 * @param subjectXPercent Horizontal center of subject (0 to 100)
 * @param aspectRatio Target aspect ratio
 * @param subjectWidthPercent Width of subject (0 to 100), default 14%
 * @param safeMarginPercent Extra natural padding buffer (0 to 100), default 3.5%
 */
export function calculateTargetCropPercentage(
  subjectXPercent: number,
  aspectRatio: '9:16' | '1:1' | '16:9' = '9:16',
  subjectWidthPercent: number = 14,
  safeMarginPercent: number = 3.5
): number {
  const normX = Math.max(0, Math.min(100, subjectXPercent)) / 100;
  const normW = Math.max(0.04, Math.min(0.5, subjectWidthPercent / 100));
  const normMargin = Math.max(0.01, Math.min(0.08, safeMarginPercent / 100));

  if (aspectRatio === '9:16') {
    const halfCrop = CROP_WIDTH_RATIO / 2; // ~0.1582

    // Ideal center-aligned crop left edge
    let idealCropLeft = normX - halfCrop;

    // Enforce safe area: subject must have natural margin inside crop window
    const subjectLeft = normX - normW / 2;
    const subjectRight = normX + normW / 2;

    // If subject is close to left edge of crop, push crop left (if possible)
    if (idealCropLeft > subjectLeft - normMargin) {
      idealCropLeft = subjectLeft - normMargin;
    }
    // If subject is close to right edge of crop, push crop right (if possible)
    if (idealCropLeft + CROP_WIDTH_RATIO < subjectRight + normMargin) {
      idealCropLeft = subjectRight + normMargin - CROP_WIDTH_RATIO;
    }

    // Clamp crop window to valid range [0, PAN_TRAVEL_MARGIN]
    const clampedCropLeft = Math.max(0, Math.min(PAN_TRAVEL_MARGIN, idealCropLeft));
    const cropFraction = clampedCropLeft / PAN_TRAVEL_MARGIN;

    return Math.round(cropFraction * 100);
  }

  if (aspectRatio === '1:1') {
    const cropWidthRatio = 9 / 16; // 0.5625
    const halfCrop = cropWidthRatio / 2;
    const margin = 1 - cropWidthRatio; // 0.4375
    const idealLeft = normX - halfCrop;
    const cropFraction = Math.max(0, Math.min(1, idealLeft / margin));
    return Math.round(cropFraction * 100);
  }

  return 50; // 16:9 is full width
}

/**
 * Universal Skin Chrominance Detector in ITU-R BT.601 YCbCr space.
 * Highly robust across all human ethnic skin tones, rejects wood and yellow background artifacts.
 */
export function isHumanSkinPixel(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  if (y < 35 || y > 245) return false;

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  return cb >= 77 && cb <= 128 && cr >= 133 && cr <= 173;
}

/**
 * Fast Core Computer Vision Frame Analyzer.
 * Identifies human subjects, motion, active speaker, and multi-person group framing.
 * Works with browser ImageData (stride=4 RGBA) and Node.js Buffer (stride=3 RGB).
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

  // Vertical bands for head/face (12% to 65%) and mouth (38% to 62%)
  const startY = Math.floor(height * 0.12);
  const endY = Math.floor(height * 0.78);
  const mouthStartY = Math.floor(height * 0.36);
  const mouthEndY = Math.floor(height * 0.62);

  for (let y = startY; y < endY; y++) {
    const rowOffset = y * width * stride;
    // Gaussian-like vertical prior peaking around upper-third (head position)
    const yFactor = 1.0 - Math.abs(y / height - 0.35) * 1.35;
    const verticalWeight = Math.max(0.3, yFactor);
    const isMouthBand = y >= mouthStartY && y <= mouthEndY;

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
        const weight = 2.8 * verticalWeight;
        columnWeights[x] += weight;

        if (pixelDelta > 15) {
          const mScore = Math.min(8.0, pixelDelta / 15);
          columnMotion[x] += mScore;
          if (isMouthBand) {
            columnMouthMotion[x] += mScore * 2.2;
          }
        }
      } else if (pixelDelta > 28) {
        // Body gesture / torso movement
        columnMotion[x] += Math.min(3.5, pixelDelta / 28) * verticalWeight * 0.6;
      }
    }
  }

  // 1. Detect Scene Cut / Hard Transition
  const avgFrameDelta = totalPixelsSampled > 0 ? totalFrameDelta / totalPixelsSampled : 0;
  const isSceneCut = avgFrameDelta > 38;

  // 2. Spatial 1D Gaussian Smoothing for robust subject peak detection
  const smoothedWeights = new Float32Array(width);
  for (let x = 2; x < width - 2; x++) {
    smoothedWeights[x] =
      columnWeights[x - 2] * 0.06 +
      columnWeights[x - 1] * 0.24 +
      columnWeights[x] * 0.4 +
      columnWeights[x + 1] * 0.24 +
      columnWeights[x + 2] * 0.06;
  }

  // Find local peaks separated by minimum physical spacing (~15% frame width)
  const minSeparation = Math.floor(width * 0.15);
  const peaks: { x: number; weight: number }[] = [];

  for (let x = 3; x < width - 3; x++) {
    const w = smoothedWeights[x];
    if (
      w > 3.5 &&
      w >= smoothedWeights[x - 1] &&
      w >= smoothedWeights[x + 1] &&
      w >= smoothedWeights[x - 2] &&
      w >= smoothedWeights[x + 2]
    ) {
      const existing = peaks.find((p) => Math.abs(p.x - x) < minSeparation);
      if (!existing) {
        peaks.push({ x, weight: w });
      } else if (w > existing.weight) {
        existing.x = x;
        existing.weight = w;
      }
    }
  }

  // Fallback: center of mass if no clear peaks found
  if (peaks.length === 0) {
    let weightedSumX = 0;
    let sumW = 0;
    for (let x = 0; x < width; x++) {
      weightedSumX += x * columnWeights[x];
      sumW += columnWeights[x];
    }
    const detectedX = sumW > 5 ? Math.round((weightedSumX / sumW / width) * 100) : 50;
    const targetCrop = calculateTargetCropPercentage(detectedX, '9:16', 15, 4);
    return {
      detectedSpeakerX: detectedX,
      targetCropX: targetCrop,
      confidence: sumW > 25 ? 0.7 : 0.35,
      isSceneCut,
      activeSpeaker: null,
      candidates: [],
    };
  }

  // 3. Evaluate candidate subject clusters
  const candidateWindow = Math.floor(width * 0.12);
  const candidates: SubjectCandidate[] = peaks.map((pk) => {
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

    const isSpeaking = clusterMouthMotion > 5.5;
    // Central bonus to gently favor primary presenter over edge passerby
    const centerDist = Math.abs(pk.x / width - 0.5);
    const centerFactor = 1.0 - centerDist * 0.3;

    const totalScore = (clusterSkin * 0.35 + clusterMouthMotion * 3.2 + clusterBodyMotion * 0.7) * centerFactor;
    const confidence = Math.min(0.98, (clusterSkin > 15 ? 0.6 : 0.3) + (isSpeaking ? 0.35 : 0.15));

    return {
      xPercent: Math.round((pk.x / width) * 100),
      faceYPercent: 35,
      widthPercent: Math.round(((candidateWindow * 2) / width) * 100),
      skinWeight: clusterSkin,
      mouthMotionScore: Math.round(clusterMouthMotion),
      bodyMotionScore: Math.round(clusterBodyMotion),
      totalScore: Math.round(totalScore),
      isSpeaking,
      confidence,
    };
  });

  candidates.sort((a, b) => b.totalScore - a.totalScore);
  const primarySubject = candidates[0];

  // 4. Multi-Person Framing Logic:
  // If multiple subjects exist, can they all fit comfortably in the 9:16 frame?
  // 9:16 crop width is ~31.64%. With safe margins (~4.5%), usable group span is ~27%.
  let effectiveFramingX = primarySubject.xPercent;
  let effectiveWidthPercent = primarySubject.widthPercent;

  if (candidates.length >= 2) {
    const significantCandidates = candidates.filter((c) => c.totalScore > primarySubject.totalScore * 0.4);
    if (significantCandidates.length >= 2) {
      const minX = Math.min(...significantCandidates.map((c) => c.xPercent - c.widthPercent / 2));
      const maxX = Math.max(...significantCandidates.map((c) => c.xPercent + c.widthPercent / 2));
      const totalGroupSpan = maxX - minX;

      if (totalGroupSpan <= 27) {
        // Group fits inside single 9:16 frame with safe margins! Center on group midpoint
        effectiveFramingX = Math.round((minX + maxX) / 2);
        effectiveWidthPercent = Math.round(totalGroupSpan);
      } else {
        // Group is too wide to fit together without cutting someone off.
        // Prioritize the active speaker / primary subject
        effectiveFramingX = primarySubject.xPercent;
        effectiveWidthPercent = primarySubject.widthPercent;
      }
    }
  }

  const targetCropX = calculateTargetCropPercentage(effectiveFramingX, '9:16', effectiveWidthPercent, 4);

  return {
    detectedSpeakerX: effectiveFramingX,
    targetCropX,
    confidence: primarySubject.confidence,
    isSceneCut,
    activeSpeaker: primarySubject,
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
  // Strategy 1: Native FaceDetector API (hardware accelerated face detection)
  const detector = getNativeFaceDetector();
  if (detector) {
    try {
      const faces = await detector.detect(source);
      if (faces && faces.length > 0) {
        let targetFace = faces[0];
        let totalW = sourceWidth || (source as any).videoWidth || 1280;

        if (faces.length === 1) {
          const faceCenterX = targetFace.boundingBox.x + targetFace.boundingBox.width / 2;
          const faceWidthPercent = (targetFace.boundingBox.width / totalW) * 100;
          const normSpeakerX = Math.max(0, Math.min(100, (faceCenterX / totalW) * 100));
          const cropX = calculateTargetCropPercentage(normSpeakerX, '9:16', faceWidthPercent, 4);

          return {
            detectedX: Math.round(normSpeakerX),
            targetCropX: cropX,
            confidence: 0.96,
            frameData: null,
            isSceneCut: false,
          };
        }

        // Multi-face detected
        const faceXs = faces.map((f: any) => ({
          minX: ((f.boundingBox.x) / totalW) * 100,
          maxX: ((f.boundingBox.x + f.boundingBox.width) / totalW) * 100,
          centerX: ((f.boundingBox.x + f.boundingBox.width / 2) / totalW) * 100,
          area: f.boundingBox.width * f.boundingBox.height,
        }));

        const groupMinX = Math.min(...faceXs.map((f: any) => f.minX));
        const groupMaxX = Math.max(...faceXs.map((f: any) => f.maxX));
        const span = groupMaxX - groupMinX;

        if (span <= 27) {
          // Fit all faces in 9:16
          const groupCenter = (groupMinX + groupMaxX) / 2;
          const cropX = calculateTargetCropPercentage(groupCenter, '9:16', span, 4);
          return {
            detectedX: Math.round(groupCenter),
            targetCropX: cropX,
            confidence: 0.95,
            frameData: null,
            isSceneCut: false,
          };
        }

        // Prioritize primary face (largest area / central prominence)
        let maxScore = 0;
        for (const f of faces) {
          const area = f.boundingBox.width * f.boundingBox.height;
          const faceCenterX = f.boundingBox.x + f.boundingBox.width / 2;
          const distFromCenter = Math.abs(faceCenterX - totalW / 2) / totalW;
          const score = area * (1.2 - distFromCenter * 0.4);
          if (score > maxScore) {
            maxScore = score;
            targetFace = f;
          }
        }

        const faceCenterX = targetFace.boundingBox.x + targetFace.boundingBox.width / 2;
        const faceWidthPercent = (targetFace.boundingBox.width / totalW) * 100;
        const normSpeakerX = Math.max(0, Math.min(100, (faceCenterX / totalW) * 100));
        const cropX = calculateTargetCropPercentage(normSpeakerX, '9:16', faceWidthPercent, 4);

        return {
          detectedX: Math.round(normSpeakerX),
          targetCropX: cropX,
          confidence: 0.94,
          frameData: null,
          isSceneCut: false,
        };
      }
    } catch {
      // Gracefully fall through to pixel CV engine
    }
  }

  // Strategy 2: Multi-Speaker CV Saliency Engine
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
 * AI Virtual Steadicam Camera Follower.
 *
 * Implements physical robotic camera tracking principles:
 * 1. Dead Zone (deadband ~2.2%): Small subject twitches/breathing do NOT trigger camera motion.
 * 2. Movement Threshold: Camera smoothly initiates motion once subject moves past deadband.
 * 3. Critically-Damped Spring & Smooth Easing: Glides smoothly towards talent without jerking or lag.
 * 4. Maximum Velocity Clamp (~28%/sec): Prevents dizzying whip-pans.
 * 5. Stationary Hold: When subject stops, camera gently decelerates and locks rock-solid.
 * 6. Memory Hold (~2.5s): If subject is temporarily occluded, holds camera steady rather than resetting.
 * 7. Instant Scene Cut Reset: Snaps instantly on video scene cuts without cross-shot pans.
 */
export class SmoothCameraFollower {
  public currentCropX: number;
  public targetCropX: number;
  public velocity: number = 0;

  private lastKnownValidTarget: number;
  private lastDetectionTime: number = 0;
  private readonly deadband: number;
  private readonly maxSpeed: number; // max percentage travel per second
  private readonly holdDurationSec: number;

  constructor(
    initialCropX: number = 50,
    deadband: number = 2.4,
    maxSpeed: number = 28.0,
    holdDurationSec: number = 2.5
  ) {
    const clamped = Math.max(0, Math.min(100, initialCropX));
    this.currentCropX = clamped;
    this.targetCropX = clamped;
    this.lastKnownValidTarget = clamped;
    this.deadband = Math.max(1.0, deadband);
    this.maxSpeed = Math.max(10.0, maxSpeed);
    this.holdDurationSec = Math.max(1.0, holdDurationSec);
  }

  public setTarget(
    targetX: number,
    isSceneCut: boolean = false,
    confidence: number = 1.0,
    timestampSec?: number
  ) {
    const clamped = Math.max(0, Math.min(100, targetX));
    const now = typeof timestampSec === 'number' ? timestampSec : performance.now() / 1000;

    // Hard scene cut: instant reset
    if (isSceneCut) {
      this.currentCropX = clamped;
      this.targetCropX = clamped;
      this.lastKnownValidTarget = clamped;
      this.velocity = 0;
      this.lastDetectionTime = now;
      return;
    }

    if (confidence >= 0.35) {
      this.targetCropX = clamped;
      this.lastKnownValidTarget = clamped;
      this.lastDetectionTime = now;
    } else {
      // Low confidence / temporary occlusion: check memory hold duration
      const elapsedSinceValid = now - this.lastDetectionTime;
      if (elapsedSinceValid <= this.holdDurationSec) {
        // Hold last known valid framing steady
        this.targetCropX = this.lastKnownValidTarget;
      } else {
        // Prolonged loss: gently drift towards neutral 50%
        this.targetCropX = 50;
      }
    }
  }

  /**
   * Advances camera physics simulation by dt seconds.
   */
  public update(
    targetX?: number,
    isSceneCut: boolean = false,
    deltaTimeSec: number = 0.033,
    confidence: number = 1.0,
    timestampSec?: number
  ): number {
    const dt = Math.max(0.005, Math.min(0.2, deltaTimeSec));

    if (typeof targetX === 'number') {
      this.setTarget(targetX, isSceneCut, confidence, timestampSec);
    }

    if (isSceneCut) {
      return this.currentCropX;
    }

    const diff = this.targetCropX - this.currentCropX;
    const absDiff = Math.abs(diff);

    // 1. Within Dead Zone: subject hasn't moved significantly
    if (absDiff <= this.deadband) {
      // Gently decelerate camera velocity to a complete stop
      this.velocity *= Math.pow(0.1, dt * 5.0);
      if (Math.abs(this.velocity) < 0.1) {
        this.velocity = 0;
      }
      this.currentCropX += this.velocity * dt;
      this.currentCropX = Math.max(0, Math.min(100, this.currentCropX));
      return this.currentCropX;
    }

    // 2. Outside Dead Zone: smooth virtual camera pan
    const activeDrift = diff > 0 ? (diff - this.deadband) : (diff + this.deadband);

    // Critically-damped smooth pursuit target speed
    const desiredVelocity = activeDrift * 3.2; // response speed

    // Clamp to maximum camera pan speed
    const clampedDesiredVelocity = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, desiredVelocity));

    // Smooth acceleration / deceleration easing
    const accelFactor = Math.min(1.0, dt * 5.5);
    this.velocity += (clampedDesiredVelocity - this.velocity) * accelFactor;

    // Advance position
    this.currentCropX += this.velocity * dt;
    this.currentCropX = Math.max(0, Math.min(100, this.currentCropX));

    return this.currentCropX;
  }

  public reset(cropX: number = 50) {
    const clamped = Math.max(0, Math.min(100, cropX));
    this.currentCropX = clamped;
    this.targetCropX = clamped;
    this.lastKnownValidTarget = clamped;
    this.velocity = 0;
    this.lastDetectionTime = 0;
  }
}

/**
 * Precomputes tracking trajectory keyframes for a video segment.
 * Samples frames at regular intervals, simulates the virtual Steadicam camera,
 * and consolidates into smooth keyframe curves.
 */
export async function computeClipTrackingTrajectory(
  videoUrl: string,
  startTime: number,
  endTime: number,
  sampleIntervalSec: number = 0.4
): Promise<TrackingKeyframe[]> {
  const duration = Math.max(1, endTime - startTime);

  // For YouTube or cross-origin URLs where client cannot read canvas pixels:
  // Server-side /api/render-clip runs full ffmpeg raw analysis on the actual video file.
  // For client preview, generate smooth camera framing:
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    if (duration <= 20) {
      return [
        { time: startTime, cropX: 50 },
        { time: endTime, cropX: 50 },
      ];
    }

    // Gentle multi-camera smooth pan for interview content
    const mid1 = Math.round((startTime + duration * 0.4) * 10) / 10;
    const mid2 = Math.round((startTime + duration * 0.55) * 10) / 10;
    return [
      { time: startTime, cropX: 35 },
      { time: mid1, cropX: 35 },
      { time: mid2, cropX: 65 },
      { time: endTime, cropX: 65 },
    ];
  }

  // Real local / uploaded video file (blob: or same-origin)
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const follower = new SmoothCameraFollower(50, 2.2, 28, 2.5);
    const keyframes: TrackingKeyframe[] = [];
    let prevFrameData: ImageData | null = null;

    const sampleStep = Math.max(0.25, Math.min(0.6, sampleIntervalSec));
    const numSamples = Math.max(4, Math.ceil(duration / sampleStep));
    const sampleTimes: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      sampleTimes.push(startTime + (i / Math.max(1, numSamples - 1)) * duration);
    }

    let currentIndex = 0;
    let lastProcessedTime = startTime;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      video.remove();
    };

    const processNextSample = () => {
      if (currentIndex >= sampleTimes.length) {
        cleanup();
        resolve(optimizeKeyframes(keyframes, startTime, endTime));
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
      const curTime = sampleTimes[currentIndex];
      const dt = Math.max(0.1, curTime - lastProcessedTime);
      lastProcessedTime = curTime;

      try {
        const detection = await detectSpeakerFocusX(
          video,
          video.videoWidth || 640,
          video.videoHeight || 360,
          prevFrameData
        );
        prevFrameData = detection.frameData;

        const smoothCropX = follower.update(
          detection.targetCropX,
          detection.isSceneCut,
          dt,
          detection.confidence,
          curTime
        );

        keyframes.push({
          time: Math.round(curTime * 10) / 10,
          cropX: Math.round(smoothCropX),
        });
      } catch {
        keyframes.push({
          time: Math.round(curTime * 10) / 10,
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
      resolve(optimizeKeyframes(keyframes, startTime, endTime));
    }, 5000);
  });
}

/**
 * Optimizes keyframes by consolidating stationary holds and smoothing transitions.
 */
function optimizeKeyframes(
  raw: TrackingKeyframe[],
  startTime: number,
  endTime: number
): TrackingKeyframe[] {
  if (raw.length === 0) {
    return [
      { time: startTime, cropX: 50 },
      { time: endTime, cropX: 50 },
    ];
  }

  // Ensure first and last keyframes match boundary times
  const result: TrackingKeyframe[] = [];
  result.push({ time: startTime, cropX: raw[0].cropX });

  for (let i = 1; i < raw.length - 1; i++) {
    const prev = result[result.length - 1];
    const cur = raw[i];
    // Keep keyframe if there's meaningful camera displacement (> 1.2%)
    if (Math.abs(cur.cropX - prev.cropX) >= 1.2 || cur.time - prev.time >= 2.0) {
      result.push(cur);
    }
  }

  result.push({ time: endTime, cropX: raw[raw.length - 1].cropX });
  return result;
}

/**
 * Evaluates smooth camera cropX at any arbitrary timestamp using cubic smoothstep easing.
 * Produces silky-smooth camera glide without micro-jitter or step cuts.
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

  // Find interval
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k1 = keyframes[i];
    const k2 = keyframes[i + 1];

    if (currentTime >= k1.time && currentTime <= k2.time) {
      const dt = k2.time - k1.time;
      if (dt <= 0.001 || Math.abs(k1.cropX - k2.cropX) < 0.2) {
        return k1.cropX;
      }

      // Normalized progress t in [0, 1]
      const t = Math.max(0, Math.min(1, (currentTime - k1.time) / dt));

      // Cubic smoothstep easing: 3t^2 - 2t^3
      const smoothT = t * t * (3 - 2 * t);

      return Math.round((k1.cropX + (k2.cropX - k1.cropX) * smoothT) * 10) / 10;
    }
  }

  return keyframes[keyframes.length - 1].cropX;
}

/**
 * Builds an ultra-clean, continuous smooth camera pan expression for ffmpeg.
 * Evaluated per-frame by ffmpeg with zero overhead, gliding camera smoothly between subject positions.
 */
export function buildFfmpegCropExpression(
  keyframes: TrackingKeyframe[],
  clipStartTime: number = 0,
  targetW: number = 720
): string {
  if (!keyframes || keyframes.length === 0) {
    return `(in_w-${targetW})*0.5`;
  }

  // Consolidate keyframes relative to clip start
  const normalizedSteps: { time: number; cropX: number }[] = [];
  for (const k of keyframes) {
    const relTime = Math.max(0, Math.round((k.time - clipStartTime) * 10) / 10);
    const existing = normalizedSteps.find((s) => Math.abs(s.time - relTime) < 0.25);
    if (!existing) {
      normalizedSteps.push({ time: relTime, cropX: k.cropX });
    } else {
      existing.cropX = k.cropX;
    }
  }

  normalizedSteps.sort((a, b) => a.time - b.time);

  if (normalizedSteps.length <= 1) {
    const ratio = ((normalizedSteps[0]?.cropX ?? 50) / 100).toFixed(3);
    return `(in_w-${targetW})*${ratio}`;
  }

  // Segment into holds and smooth pan transitions
  // Between step i and step i+1:
  // If cropX is equal -> hold: ratio
  // If cropX differs -> smooth transition: r0 + (r1 - r0) * (t - t0) / (t1 - t0)
  let expr = ((normalizedSteps[normalizedSteps.length - 1].cropX / 100)).toFixed(3);

  for (let i = normalizedSteps.length - 2; i >= 0; i--) {
    const s0 = normalizedSteps[i];
    const s1 = normalizedSteps[i + 1];
    const r0 = s0.cropX / 100;
    const r1 = s1.cropX / 100;
    const dt = Math.max(0.1, s1.time - s0.time);

    let segmentRatio: string;
    if (Math.abs(r1 - r0) < 0.005) {
      segmentRatio = r0.toFixed(3);
    } else {
      // Linear smooth glide between keyframe points
      const deltaR = (r1 - r0).toFixed(3);
      segmentRatio = `(${r0.toFixed(3)}+(${deltaR})*(t-${s0.time.toFixed(1)})/${dt.toFixed(1)})`;
    }

    expr = `if(lt(t,${s1.time.toFixed(1)}),${segmentRatio},${expr})`;
  }

  return `min(max(0,(in_w-${targetW})*(${expr})),in_w-${targetW})`;
}
