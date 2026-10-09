import { VideoSourceMetadata } from '../types/driaclip';

export interface SampleVideoItem extends VideoSourceMetadata {
  description: string;
  category: string;
  presetHighlights: Array<{
    title: string;
    hookText: string;
    startTime: number;
    endTime: number;
    score: number;
    tags: string[];
  }>;
}

export const SAMPLE_VIDEOS: SampleVideoItem[] = [
  {
    id: 'sample-tech-keynote',
    title: 'Next-Gen AI Systems Architecture & Quantum Runtime',
    sourceType: 'sample',
    url: '/samples/sample_keynote.mp4',
    duration: 60,
    width: 1280,
    height: 720,
    sizeBytes: 56000000,
    format: 'mp4',
    category: 'Tech Talk / Keynote',
    description: 'High-energy technology keynote showcasing distributed parallel GPU clusters and latency optimization.',
    presetHighlights: [
      {
        title: 'The Breakthrough in GPU Parallelism',
        hookText: 'Why 99% of engineering teams get cluster scaling wrong',
        startTime: 0,
        endTime: 15,
        score: 96,
        tags: ['AI Scaling', 'Hardware', 'DriaClip Highlight']
      },
      {
        title: 'Real-time Sub-10ms Inference Loop',
        hookText: 'Watch what happens when you remove the network bottleneck',
        startTime: 15,
        endTime: 30,
        score: 92,
        tags: ['Performance', 'Engineering', 'Architecture']
      }
    ]
  },
  {
    id: 'sample-podcast',
    title: 'The Future of Content Creation & Creator Economy',
    sourceType: 'sample',
    url: '/samples/sample_podcast.mp4',
    duration: 60,
    width: 1280,
    height: 720,
    sizeBytes: 430000,
    format: 'mp4',
    category: 'Podcast Discussion',
    description: 'Long-form podcast discussion on viral hooks, short-form retention curves, and algorithmic distribution.',
    presetHighlights: [
      {
        title: 'The 3-Second Retention Hook Formula',
        hookText: 'If you do not grab them in 2.5 seconds, the algorithm kills the video',
        startTime: 2,
        endTime: 18,
        score: 98,
        tags: ['Viral Hook', 'TikTok Strategy', 'Retention']
      },
      {
        title: 'Why Long-form Still Wins Long Term',
        hookText: 'Short clips are top of funnel, but trust is built in 40 minutes',
        startTime: 20,
        endTime: 40,
        score: 91,
        tags: ['Audience Building', 'Monetization']
      },
      {
        title: 'Automation vs Pure Craftsmanship',
        hookText: 'The creators using AI clipping tools are publishing 10x faster',
        startTime: 42,
        endTime: 59,
        score: 94,
        tags: ['Workflows', 'Productivity', 'Driacom Tools']
      }
    ]
  },
  {
    id: 'sample-cinematic',
    title: 'Open Source CGI Production & Motion VFX Showcase',
    sourceType: 'sample',
    url: '/samples/sample_gaming.mp4',
    duration: 60,
    width: 1280,
    height: 720,
    sizeBytes: 2600000,
    format: 'mp4',
    category: 'Cinematic / VFX',
    description: 'Studio cinematography showcasing lighting transitions, optical sound design, and color grading.',
    presetHighlights: [
      {
        title: 'Cinematic Reveal & Drone Establishing Shot',
        hookText: 'This single camera movement cost 3 weeks of rendering',
        startTime: 5,
        endTime: 25,
        score: 89,
        tags: ['Cinematography', 'VFX', 'Visual Hook']
      },
      {
        title: 'High-Impact Action Sequence & Sound Design',
        hookText: 'Turn your headphones up for this audio mix',
        startTime: 30,
        endTime: 55,
        score: 95,
        tags: ['Action', 'Sound FX', 'Trending Audio']
      }
    ]
  }
];
