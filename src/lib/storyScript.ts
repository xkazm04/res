/**
 * Story Script Generation Library
 *
 * Generates cinematic narration scripts from timeline events,
 * creates chapters, and manages playback timing.
 */

import type { TimelineEvent, FindingType } from '@/src/types/research';

// ============================================================================
// Types
// ============================================================================

// Entity reference within a story event
export interface StoryEventEntity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'concept' | 'other';
}

export interface StoryEvent extends TimelineEvent {
  // Extended properties for story mode
  narration: string;
  duration: number; // Duration in seconds
  chapter: string;
  chapterIndex: number;
  importance: 'major' | 'minor' | 'transitional';
  contextPoints?: string[];
  // Additional display properties derived from timeline event
  title: string;
  description: string;
  event_type?: string;
  temporal_context?: string;
  location?: string;
  entities?: StoryEventEntity[];
  tags?: string[];
  source_id?: string;
}

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  startTime: number; // Seconds from start
  endTime: number;
  events: StoryEvent[];
  mood: 'neutral' | 'tension' | 'revelation' | 'resolution' | 'conclusion';
}

export interface StoryScript {
  title: string;
  description: string;
  introduction: string;
  chapters: StoryChapter[];
  conclusion: string;
  totalDuration: number;
  events: StoryEvent[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  currentEventIndex: number;
  currentChapterIndex: number;
  speed: number;
  volume: number;
}

export interface ChapterMarker {
  id: string;
  title: string;
  time: number;
  percentage: number;
  progress: number;
  chapterIndex: number;
  eventCount: number;
}

// Playback speed type
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 3;

// ============================================================================
// Constants
// ============================================================================

const BASE_EVENT_DURATION = 5; // seconds per event
const TRANSITION_DURATION = 2; // seconds between events
const CHAPTER_INTRO_DURATION = 3; // seconds for chapter title
const MIN_EVENT_DURATION = 3;
const MAX_EVENT_DURATION = 10;

// ============================================================================
// Narration Templates
// ============================================================================

const FINDING_TYPE_INTROS: Record<FindingType, string[]> = {
  fact: [
    'Evidence reveals that',
    'Research confirms',
    'Data indicates that',
    'Analysis shows',
  ],
  claim: [
    'Sources suggest that',
    'It is claimed that',
    'Reports indicate',
    'According to sources,',
  ],
  event: [
    'A significant development occurred:',
    'This marks a pivotal moment when',
    'Events unfolded as',
    'History records that',
  ],
  actor: [
    'A key player emerges:',
    'Central to this story is',
    'Notably involved was',
    'Taking center stage,',
  ],
  relationship: [
    'Connections reveal that',
    'The relationship between parties shows',
    'Links were established as',
    'Investigation uncovered ties:',
  ],
  pattern: [
    'A pattern becomes clear:',
    'Recurring themes emerge as',
    'Systematic analysis reveals',
    'Notable trends indicate',
  ],
  gap: [
    'Questions remain about',
    'Uncertainty persists regarding',
    'Missing information suggests',
    'Further investigation needed:',
  ],
  evidence: [
    'Supporting evidence shows',
    'Documentation confirms',
    'Proof emerges that',
    'Verification reveals',
  ],
};

const CHAPTER_MOOD_PHRASES: Record<StoryChapter['mood'], string[]> = {
  neutral: ['During this period,', 'At this time,', 'In this phase,'],
  tension: ['Tensions escalated as', 'Conflict emerged when', 'Challenges arose as'],
  revelation: ['A breakthrough occurred when', 'Discovery revealed that', 'Investigation uncovered'],
  resolution: ['Clarity emerged as', 'Resolution came when', 'Understanding developed as'],
  conclusion: ['In conclusion,', 'Ultimately,', 'The investigation concludes that'],
};

const TRANSITION_PHRASES = [
  'Meanwhile,',
  'Subsequently,',
  'Following this,',
  'As events continued,',
  'In the aftermath,',
  'This led to',
  'Building upon this,',
  'Concurrently,',
];

// ============================================================================
// Helper Functions
// ============================================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calculateEventImportance(
  event: TimelineEvent,
  allEvents: TimelineEvent[]
): 'major' | 'minor' | 'transitional' {
  const confidence = event.confidence ?? 0.5;

  // High confidence events are major
  if (confidence >= 0.8) return 'major';

  // Events with specific types are more important
  if (['event', 'fact', 'evidence'].includes(event.findingType)) {
    return confidence >= 0.5 ? 'major' : 'minor';
  }

  // Gaps and patterns are transitional
  if (['gap', 'pattern'].includes(event.findingType)) {
    return 'transitional';
  }

  return confidence >= 0.6 ? 'minor' : 'transitional';
}

function calculateEventDuration(event: StoryEvent): number {
  const summaryLength = event.summary.length;
  const baseFromLength = Math.min(MAX_EVENT_DURATION, Math.max(MIN_EVENT_DURATION, summaryLength / 30));

  // Adjust based on importance
  const importanceMultiplier =
    event.importance === 'major' ? 1.3 :
    event.importance === 'minor' ? 1 : 0.8;

  return Math.round(baseFromLength * importanceMultiplier);
}

function extractTitle(event: TimelineEvent): string {
  // Extract a title from the summary - take first sentence or first 50 chars
  const summary = event.summary;
  const firstSentence = summary.split(/[.!?]/)[0];

  if (firstSentence.length <= 60) {
    return firstSentence;
  }

  // Truncate at word boundary
  const truncated = summary.slice(0, 57);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

function extractTemporalContext(event: TimelineEvent): string | undefined {
  const date = new Date(event.date);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 7) return 'Recent';
  if (daysDiff < 30) return 'This month';
  if (daysDiff < 365) return 'This year';
  return undefined;
}

function extractTags(event: TimelineEvent): string[] {
  const tags: string[] = [];

  // Add finding type as a tag
  tags.push(event.findingType);

  // Add confidence-based tag
  const confidence = event.confidence ?? 0;
  if (confidence >= 0.8) tags.push('high-confidence');
  else if (confidence >= 0.5) tags.push('moderate-confidence');
  else tags.push('low-confidence');

  return tags;
}

function generateEventNarration(event: TimelineEvent, isFirst: boolean, isTransition: boolean): string {
  const intros = FINDING_TYPE_INTROS[event.findingType] ?? FINDING_TYPE_INTROS.fact;
  let prefix = '';

  if (isFirst) {
    prefix = 'Our story begins when ';
  } else if (isTransition) {
    prefix = pickRandom(TRANSITION_PHRASES) + ' ';
  } else {
    prefix = pickRandom(intros) + ' ';
  }

  // Clean up the summary for narration
  let narration = event.summary
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure it ends with proper punctuation
  if (!/[.!?]$/.test(narration)) {
    narration += '.';
  }

  return prefix + narration;
}

function generateContextPoints(event: TimelineEvent): string[] {
  const points: string[] = [];

  if (event.confidence !== undefined) {
    const confPercent = Math.round(event.confidence * 100);
    if (confPercent >= 80) {
      points.push('High confidence finding');
    } else if (confPercent >= 50) {
      points.push('Moderate confidence');
    } else {
      points.push('Requires verification');
    }
  }

  // Add date context
  const eventDate = new Date(event.date);
  points.push(eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

  // Add type-specific context
  switch (event.findingType) {
    case 'fact':
      points.push('Verified fact');
      break;
    case 'claim':
      points.push('Unverified claim');
      break;
    case 'event':
      points.push('Key event');
      break;
    case 'pattern':
      points.push('Pattern identified');
      break;
    case 'gap':
      points.push('Information gap');
      break;
  }

  return points;
}

// ============================================================================
// Chapter Detection
// ============================================================================

function detectChapters(events: TimelineEvent[]): Array<{ start: number; end: number; mood: StoryChapter['mood'] }> {
  if (events.length === 0) return [];
  if (events.length <= 3) {
    return [{ start: 0, end: events.length - 1, mood: 'neutral' }];
  }

  const chapters: Array<{ start: number; end: number; mood: StoryChapter['mood'] }> = [];
  const targetChapterSize = Math.max(3, Math.ceil(events.length / 4));

  let chapterStart = 0;
  let lastDate = new Date(events[0].date);

  for (let i = 1; i < events.length; i++) {
    const currentDate = new Date(events[i].date);
    const daysDiff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    const eventsInChapter = i - chapterStart;

    // Create new chapter if:
    // 1. Large time gap (more than 30 days)
    // 2. We've accumulated enough events
    const shouldSplit = daysDiff > 30 || eventsInChapter >= targetChapterSize;

    if (shouldSplit && eventsInChapter >= 2) {
      // Determine mood based on event types in this chapter
      const chapterEvents = events.slice(chapterStart, i);
      const mood = determineMood(chapterEvents);

      chapters.push({ start: chapterStart, end: i - 1, mood });
      chapterStart = i;
    }

    lastDate = currentDate;
  }

  // Add final chapter
  if (chapterStart < events.length) {
    const finalEvents = events.slice(chapterStart);
    const mood = chapters.length === 0 ? 'neutral' : 'conclusion';
    chapters.push({ start: chapterStart, end: events.length - 1, mood });
  }

  return chapters;
}

function determineMood(events: TimelineEvent[]): StoryChapter['mood'] {
  const types = events.map((e) => e.findingType);

  if (types.includes('gap') || types.filter((t) => t === 'claim').length > types.length / 2) {
    return 'tension';
  }

  if (types.includes('evidence') || types.filter((t) => t === 'fact').length > types.length / 2) {
    return 'revelation';
  }

  if (types.includes('pattern')) {
    return 'resolution';
  }

  return 'neutral';
}

function generateChapterTitle(events: TimelineEvent[], chapterIndex: number, totalChapters: number): string {
  if (chapterIndex === 0) return 'The Beginning';
  if (chapterIndex === totalChapters - 1) return 'Conclusion';

  const startDate = new Date(events[0].date);
  const endDate = new Date(events[events.length - 1].date);

  // Try to generate a meaningful title from the events
  const eventTypes = new Set(events.map((e) => e.findingType));

  if (eventTypes.has('event')) {
    return `Key Developments`;
  }
  if (eventTypes.has('evidence')) {
    return `Evidence Emerges`;
  }
  if (eventTypes.has('pattern')) {
    return `Patterns Revealed`;
  }
  if (eventTypes.has('gap')) {
    return `Questions Arise`;
  }

  // Default to date-based title
  const monthYear = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return `Chapter ${chapterIndex + 1}: ${monthYear}`;
}

function generateChapterDescription(events: TimelineEvent[], mood: StoryChapter['mood']): string {
  const prefix = pickRandom(CHAPTER_MOOD_PHRASES[mood]);
  const eventCount = events.length;

  if (eventCount === 1) {
    return `${prefix} a significant development shapes the narrative.`;
  }

  return `${prefix} ${eventCount} key moments unfold, revealing new insights.`;
}

// ============================================================================
// Main Script Generation
// ============================================================================

/**
 * Generate a complete story script from timeline events
 */
export function generateStoryScript(
  events: TimelineEvent[],
  title?: string
): StoryScript {
  if (events.length === 0) {
    return {
      title: title ?? 'Research Timeline',
      description: 'An interactive timeline of research findings.',
      introduction: 'No events to narrate.',
      chapters: [],
      conclusion: '',
      totalDuration: 0,
      events: [],
    };
  }

  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Detect chapters
  const chapterRanges = detectChapters(sortedEvents);

  // Generate story events with narration
  const storyEvents: StoryEvent[] = [];
  let currentTime = 0;

  // Introduction duration
  currentTime += 5;

  // Process each event
  sortedEvents.forEach((event, index) => {
    const isFirst = index === 0;
    const importance = calculateEventImportance(event, sortedEvents);

    // Find which chapter this event belongs to
    const chapterRange = chapterRanges.find(
      (c) => index >= c.start && index <= c.end
    );
    const chapterIndex = chapterRanges.indexOf(chapterRange!);

    // Determine if this is a transition point
    const isTransition =
      index > 0 &&
      chapterRanges.findIndex((c) => c.start === index) >= 0;

    const storyEvent: StoryEvent = {
      ...event,
      narration: generateEventNarration(event, isFirst, isTransition),
      duration: 0, // Will be calculated
      chapter: generateChapterTitle(
        sortedEvents.slice(chapterRange!.start, chapterRange!.end + 1),
        chapterIndex,
        chapterRanges.length
      ),
      chapterIndex,
      importance,
      contextPoints: generateContextPoints(event),
      // Derived display properties
      title: extractTitle(event),
      description: event.summary,
      event_type: event.findingType,
      temporal_context: extractTemporalContext(event),
      tags: extractTags(event),
    };

    storyEvent.duration = calculateEventDuration(storyEvent);
    storyEvents.push(storyEvent);
  });

  // Build chapters
  const chapters: StoryChapter[] = chapterRanges.map((range, index) => {
    const chapterEvents = storyEvents.slice(range.start, range.end + 1);
    const title = generateChapterTitle(
      sortedEvents.slice(range.start, range.end + 1),
      index,
      chapterRanges.length
    );

    // Calculate chapter timing
    const chapterStartTime = currentTime;
    currentTime += CHAPTER_INTRO_DURATION;

    chapterEvents.forEach((event, eventIndex) => {
      currentTime += event.duration;
      if (eventIndex < chapterEvents.length - 1) {
        currentTime += TRANSITION_DURATION;
      }
    });

    return {
      id: `chapter-${index}`,
      title,
      description: generateChapterDescription(
        sortedEvents.slice(range.start, range.end + 1),
        range.mood
      ),
      startTime: chapterStartTime,
      endTime: currentTime,
      events: chapterEvents,
      mood: range.mood,
    };
  });

  // Generate introduction
  const firstDate = new Date(sortedEvents[0].date);
  const lastDate = new Date(sortedEvents[sortedEvents.length - 1].date);
  const introduction = generateIntroduction(
    title ?? 'Research Timeline',
    firstDate,
    lastDate,
    sortedEvents.length
  );

  // Generate conclusion
  const conclusion = generateConclusion(sortedEvents, chapters);

  // Add conclusion duration
  currentTime += 5;

  // Generate description
  const description = `A chronological narrative spanning ${formatDateRange(firstDate, lastDate)}, covering ${sortedEvents.length} key events.`;

  return {
    title: title ?? 'Research Timeline',
    description,
    introduction,
    chapters,
    conclusion,
    totalDuration: currentTime,
    events: storyEvents,
  };
}

function generateIntroduction(
  title: string,
  startDate: Date,
  endDate: Date,
  eventCount: number
): string {
  const dateRange = formatDateRange(startDate, endDate);
  return `Welcome to ${title}. This narrative covers ${eventCount} key events spanning ${dateRange}. Let's explore the timeline and uncover the story within the data.`;
}

function generateConclusion(events: TimelineEvent[], chapters: StoryChapter[]): string {
  const majorEvents = events.filter((e) => (e.confidence ?? 0) >= 0.7);
  const patterns = events.filter((e) => e.findingType === 'pattern');
  const gaps = events.filter((e) => e.findingType === 'gap');

  let conclusion = 'In summary, this timeline reveals ';

  if (majorEvents.length > 0) {
    conclusion += `${majorEvents.length} significant findings`;
  } else {
    conclusion += `${events.length} events`;
  }

  if (patterns.length > 0) {
    conclusion += ` and ${patterns.length} identified patterns`;
  }

  conclusion += '.';

  if (gaps.length > 0) {
    conclusion += ` ${gaps.length} areas require further investigation.`;
  }

  conclusion += ' Thank you for exploring this research narrative.';

  return conclusion;
}

function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (startStr === endStr) {
    return startStr;
  }

  return `from ${startStr} to ${endStr}`;
}

// ============================================================================
// Playback Utilities
// ============================================================================

/**
 * Get the current event based on playback time
 */
export function getCurrentEvent(
  script: StoryScript,
  currentTime: number
): StoryEvent | null {
  let accumulatedTime = 5; // Introduction

  for (const chapter of script.chapters) {
    accumulatedTime += CHAPTER_INTRO_DURATION;

    for (let i = 0; i < chapter.events.length; i++) {
      const event = chapter.events[i];
      const eventEndTime = accumulatedTime + event.duration;

      if (currentTime >= accumulatedTime && currentTime < eventEndTime) {
        return event;
      }

      accumulatedTime = eventEndTime;
      if (i < chapter.events.length - 1) {
        accumulatedTime += TRANSITION_DURATION;
      }
    }
  }

  return null;
}

/**
 * Get the current chapter based on playback time
 */
export function getCurrentChapter(
  script: StoryScript,
  currentTime: number
): StoryChapter | null {
  for (const chapter of script.chapters) {
    if (currentTime >= chapter.startTime && currentTime < chapter.endTime) {
      return chapter;
    }
  }
  return null;
}

/**
 * Get chapter markers for the progress bar
 */
export function getChapterMarkers(script: StoryScript): ChapterMarker[] {
  return script.chapters.map((chapter, index) => ({
    id: chapter.id,
    title: chapter.title,
    time: chapter.startTime,
    percentage: (chapter.startTime / script.totalDuration) * 100,
    progress: (chapter.startTime / script.totalDuration),
    chapterIndex: index,
    eventCount: chapter.events.length,
  }));
}

/**
 * Calculate progress percentage
 */
export function getProgress(currentTime: number, totalDuration: number): number {
  if (totalDuration === 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));
}

/**
 * Format time for display (MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get playback state for a specific time
 */
export function getPlaybackStateAtTime(
  script: StoryScript,
  time: number
): { phase: 'intro' | 'chapter-intro' | 'event' | 'transition' | 'conclusion'; eventIndex: number; chapterIndex: number } {
  if (time < 5) {
    return { phase: 'intro', eventIndex: -1, chapterIndex: -1 };
  }

  if (time >= script.totalDuration - 5) {
    return {
      phase: 'conclusion',
      eventIndex: script.events.length - 1,
      chapterIndex: script.chapters.length - 1,
    };
  }

  let accumulatedTime = 5;

  for (let ci = 0; ci < script.chapters.length; ci++) {
    const chapter = script.chapters[ci];

    if (time < accumulatedTime + CHAPTER_INTRO_DURATION) {
      return { phase: 'chapter-intro', eventIndex: -1, chapterIndex: ci };
    }

    accumulatedTime += CHAPTER_INTRO_DURATION;

    for (let ei = 0; ei < chapter.events.length; ei++) {
      const event = chapter.events[ei];
      const eventEndTime = accumulatedTime + event.duration;

      if (time < eventEndTime) {
        return { phase: 'event', eventIndex: ei, chapterIndex: ci };
      }

      accumulatedTime = eventEndTime;

      if (ei < chapter.events.length - 1) {
        if (time < accumulatedTime + TRANSITION_DURATION) {
          return { phase: 'transition', eventIndex: ei, chapterIndex: ci };
        }
        accumulatedTime += TRANSITION_DURATION;
      }
    }
  }

  return { phase: 'conclusion', eventIndex: script.events.length - 1, chapterIndex: script.chapters.length - 1 };
}
