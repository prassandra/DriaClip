export type VideoFormat = 'mp4' | 'webm' | 'mov';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type VerticalStyle = 'center-crop' | 'blur-background' | 'letterbox' | 'auto-track';

export interface TrackingKeyframe {
  time: number; // in seconds
  cropX: number; // 0 to 100 percentage
}

export type ProcessingMode = 'manual-equal' | 'manual-custom' | 'auto-ai';

export type ExportQuality = '1080p' | '720p' | '480p' | '360p';

export interface VideoSourceMetadata {
  id: string;
  title: string;
  sourceType: 'upload' | 'url' | 'sample';
  url: string;
  filename?: string;
  duration: number; // in seconds
  width: number;
  height: number;
  sizeBytes?: number;
  format: string;
  thumbnailUrl?: string;
  youtubeId?: string;
  file?: File;
}

export interface SplitMarker {
  id: string;
  time: number; // in seconds
  label?: string;
}

export type WatermarkPosition = 'safe-top-left' | 'safe-top-right' | 'center-top' | 'safe-bottom-left' | 'safe-bottom-right';
export type WatermarkStyle = 'neon-glow' | 'glass-blur' | 'minimal-dark' | 'gradient-accent';

export interface ClipConfig {
  durationMode: 'preset' | 'custom' | 'range';
  presetDuration: number; // 15, 30, 60, 90, etc.
  customDuration?: number; // custom seconds set by user
  minDuration: number;
  maxDuration: number;
  processingMode?: ProcessingMode;
  aspectRatio: AspectRatio;
  verticalStyle: VerticalStyle;
  zoomOutPercent?: number; // 0 to 50% zoom-out (default 20%)
  exportQuality: ExportQuality;
  addCaptions: boolean;
  detectSceneChanges: boolean;
  minSpeechEnergy: number; // 0 to 100
  cropPositionX?: number; // 0 to 100 (0 = Left, 50 = Center, 100 = Right)
  autoTrackSpeaker?: boolean; // automatically follow active speaker
  watermark?: boolean; // Secure DriaClip watermark on output clips (default: true)
  watermarkText?: string; // Custom watermark label inputted by user (default: 'DriaClip')
  watermarkPosition?: WatermarkPosition; // Strategic anti-crop placement
  watermarkStyle?: WatermarkStyle; // Visual badge theme style
}

export interface GeneratedClip {
  id: string;
  sourceId: string;
  title: string;
  hookText: string;
  startTime: number;
  endTime: number;
  duration: number;
  aspectRatio: AspectRatio;
  verticalStyle: VerticalStyle;
  cropPositionX?: number; // 0 to 100 (0 = Left, 50 = Center, 100 = Right)
  zoomOutPercent?: number; // e.g. 20%
  trackingKeyframes?: TrackingKeyframe[]; // Dynamic camera path following the speaker
  autoTrackEnabled?: boolean;
  watermark?: boolean;
  watermarkText?: string;
  watermarkPosition?: WatermarkPosition;
  watermarkStyle?: WatermarkStyle;
  exportQuality: ExportQuality;
  status: 'ready' | 'processing' | 'failed';
  videoBlobUrl?: string;
  videoExtension?: 'mp4' | 'webm';
  thumbnailBlobUrl?: string;
  fileSizeBytes?: number;
  estimatedSizeBytes?: number;
  score?: number; // Viral/highlight potential 0-100
  tags: string[];
}

export interface ProcessingJob {
  id: string;
  status: 'idle' | 'analyzing' | 'cutting' | 'transcoding' | 'completed' | 'error';
  progress: number; // 0 to 100
  stageMessage: string;
  totalClipsToGenerate: number;
  completedClipsCount: number;
  error?: string;
}
