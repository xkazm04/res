/**
 * Story Mode Visualizations
 *
 * Animated story mode with auto-narrated timeline playback
 * and exportable video timeline summaries.
 */

// Main component
export { StoryModePlayer } from './StoryModePlayer';

// Sub-components
export { TimelineAnimator } from './TimelineAnimator';
export { EventHighlighter } from './EventHighlighter';
export { ContextCard } from './ContextCard';
export { ChapterNavigator } from './ChapterNavigator';
export { PlaybackControls } from './PlaybackControls';
export { StoryExporter } from './StoryExporter';

// Re-export types from the library
export type {
  StoryScript,
  StoryEvent,
  StoryChapter,
  ChapterMarker,
  PlaybackSpeed,
} from '@/src/lib/storyScript';

// Re-export hook
export { useStoryPlayback } from '@/src/hooks/useStoryPlayback';
export type {
  PlaybackState,
  StoryPlaybackState,
  StoryPlaybackActions,
  UseStoryPlaybackReturn,
} from '@/src/hooks/useStoryPlayback';
