export type VideoFormat = 'mp4' | 'webm' | 'mov';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type VerticalStyle = 'auto-track' | 'blur-background' | 'letterbox';

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
}

export interface SplitMarker {
  id: string;
  time: number; // in seconds
  label?: string;
}

export interface ClipConfig {
  durationMode: 'preset' | 'custom' | 'range';
  presetDuration: number; // 15, 30, 60, 90, etc.
  customDuration?: number; // custom seconds set by user
  minDuration: number;
  maxDuration: number;
  processingMode?: ProcessingMode;
  aspectRatio: AspectRatio;
  verticalStyle: VerticalStyle;
  exportQuality: ExportQuality;
  addCaptions: boolean;
  detectSceneChanges: boolean;
  minSpeechEnergy: number; // 0 to 100
  cropPositionX?: number; // 0 to 100 (0 = Left, 50 = Center, 100 = Right)
  autoTrackSpeaker?: boolean; // automatically follow active speaker
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
  trackingKeyframes?: TrackingKeyframe[]; // Dynamic camera path following the speaker
  autoTrackEnabled?: boolean;
  exportQuality: ExportQuality;
  status: 'ready' | 'processing' | 'failed';
  videoBlobUrl?: string;
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
