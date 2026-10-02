import { ClipConfig } from '../types/driaclip';

export interface ProposedClipCandidate {
  title: string;
  hookText: string;
  startTime: number;
  endTime: number;
  score: number;
  tags: string[];
}

const hookTemplates = [
  'Perhatikan apa yang terjadi tepat di momen ini',
  'Rahasia penting yang jarang disadari banyak orang',
  'Titik balik paling menarik dari video ini',
  'Tonton ini sebelum Anda membuat keputusan berikutnya',
  'Momen pembuka yang langsung menarik perhatian penonton',
  'Klimaks terbaik dengan retensi penonton tertinggi',
  'Penjelasan kunci yang wajib Anda pahami',
  'Bagian penting yang menjadi sorotan utama'
];

/**
 * High-performance, offline/local video highlight & trimming engine for DriaClip by Driacom.
 * Automatically slices videos sequentially based on target/custom duration.
 */
export async function generateHighlights(
  videoTitle: string,
  videoDuration: number,
  config: ClipConfig,
  customMarkers?: number[]
): Promise<ProposedClipCandidate[]> {
  const safeDuration = Math.max(5, Math.round(videoDuration));
  
  // Determine target duration per clip (preset, custom, or range)
  let targetDuration: number;
  if (config.durationMode === 'custom' && config.customDuration && config.customDuration > 0) {
    targetDuration = Math.max(5, Math.round(config.customDuration));
  } else if (config.durationMode === 'preset') {
    targetDuration = Math.max(5, Math.round(config.presetDuration || 60));
  } else {
    targetDuration = Math.round((config.minDuration + config.maxDuration) / 2);
  }

  // If manual markers are present and specified
  if (config.processingMode === 'manual-custom' && customMarkers && customMarkers.length > 0) {
    const sorted = [0, ...customMarkers.filter(m => m > 0 && m < safeDuration), safeDuration].sort((a, b) => a - b);
    const unique = sorted.filter((val, i, arr) => i === 0 || val > arr[i - 1] + 1);
    const clips: ProposedClipCandidate[] = [];

    for (let i = 0; i < unique.length - 1; i++) {
      const start = unique[i];
      const end = unique[i + 1];
      if (end - start < 3) continue;

      clips.push({
        title: `Klip ${i + 1}`,
        hookText: `Sorotan pilihan dari menit ${Math.floor(start / 60)}:${(start % 60).toString().padStart(2, '0')}`,
        startTime: Math.round(start),
        endTime: Math.round(end),
        score: 94,
        tags: [`Klip${i + 1}`, 'CustomCut', 'DriaClip']
      });
    }
    return clips;
  }

  // Standard Automatic Sequential Slicing:
  // e.g. 6m 20s (380s) with 60s per clip -> Klip 1-6 = 60s, Klip 7 = 20s (sisa)
  // e.g. 30s per clip -> Klip 1: 00:00-00:30, Klip 2: 00:30-01:00, Klip 3: 01:00-01:30, dst.
  const clips: ProposedClipCandidate[] = [];
  const step = Math.max(5, targetDuration);
  let currentStart = 0;
  let clipIndex = 1;

  while (currentStart < safeDuration) {
    const currentEnd = Math.min(safeDuration, currentStart + step);
    const clipDur = currentEnd - currentStart;
    if (clipDur <= 0) break;

    const isRemainder = currentEnd === safeDuration && clipDur < step;
    const hook = hookTemplates[(clipIndex - 1) % hookTemplates.length];
    const score = Math.min(99, 90 + ((clipIndex * 3 + 2) % 9));

    clips.push({
      title: isRemainder ? `Klip ${clipIndex} (Sisa ${clipDur}s)` : `Klip ${clipIndex}`,
      hookText: `"${hook}"`,
      startTime: Math.round(currentStart),
      endTime: Math.round(currentEnd),
      score,
      tags: [`Klip${clipIndex}`, 'DriaClip', 'Shorts']
    });

    currentStart = currentEnd;
    clipIndex++;
  }

  // Fallback if video is very short
  if (clips.length === 0) {
    clips.push({
      title: 'Klip 1',
      hookText: '"Momen terbaik yang wajib Anda tonton"',
      startTime: 0,
      endTime: safeDuration,
      score: 95,
      tags: ['Klip1', 'DriaClip']
    });
  }

  return clips;
}
