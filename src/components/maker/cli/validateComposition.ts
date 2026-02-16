/**
 * Validates and sanitizes AI-composed scene compositions.
 * Ensures all scenes exist in the registry, data fits rendering constraints,
 * and total duration is reasonable.
 */

import type { ComposedScene, TransitionType, Pacing, Mood, NarrativeBeat } from './types';
import { SCENE_CATALOG, VALID_SCENE_COMPONENTS, SCENE_VARIANTS, type SceneFieldSchema } from './sceneCatalog';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: ComposedScene[];
}

const MIN_DURATION = 2;
const MAX_DURATION = 10;
const MAX_SCENES = 12;
const MAX_TOTAL_DURATION = 90;
const MAX_NARRATION_LENGTH = 500;

const VALID_TRANSITIONS = new Set<TransitionType>(['flash-cut', 'wipe-right', 'wipe-left', 'zoom-through', 'slide-up', 'fade']);
const VALID_PACINGS = new Set<Pacing>(['fast', 'normal', 'slow', 'dramatic']);
const VALID_MOODS = new Set<Mood>(['neutral', 'danger', 'success', 'dramatic']);
const VALID_BEATS = new Set<NarrativeBeat>(['question', 'context', 'mechanism', 'evidence', 'verdict']);

export function validateComposition(scenes: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sanitized: ComposedScene[] = [];

  if (!Array.isArray(scenes)) {
    return { valid: false, errors: ['sceneComposition must be an array'], warnings, sanitized };
  }

  if (scenes.length === 0) {
    return { valid: false, errors: ['sceneComposition must have at least 1 scene'], warnings, sanitized };
  }

  if (scenes.length > MAX_SCENES) {
    warnings.push(`Trimmed from ${scenes.length} to ${MAX_SCENES} scenes`);
  }

  const trimmed = scenes.slice(0, MAX_SCENES);

  for (let i = 0; i < trimmed.length; i++) {
    const scene = trimmed[i];
    if (!scene || typeof scene !== 'object') {
      errors.push(`Scene ${i}: invalid object`);
      continue;
    }

    const { component, durationSeconds, data, sceneId, narration, beat, transition, pacing, mood, variant } = scene as Record<string, unknown>;

    // Validate component exists
    if (typeof component !== 'string' || !VALID_SCENE_COMPONENTS.has(component)) {
      warnings.push(`Scene ${i}: unknown component "${component}", skipped`);
      continue;
    }

    // Clamp duration
    let duration = typeof durationSeconds === 'number' ? durationSeconds : 4;
    if (duration < MIN_DURATION) {
      warnings.push(`Scene ${i} (${component}): duration ${duration}s clamped to ${MIN_DURATION}s`);
      duration = MIN_DURATION;
    }
    if (duration > MAX_DURATION) {
      warnings.push(`Scene ${i} (${component}): duration ${duration}s clamped to ${MAX_DURATION}s`);
      duration = MAX_DURATION;
    }

    // Validate and sanitize data
    const sceneData = typeof data === 'object' && data !== null ? { ...(data as Record<string, unknown>) } : {};
    const catalogEntry = SCENE_CATALOG.find(e => e.component === component);

    if (catalogEntry) {
      // Check required fields
      for (const [fieldName, schema] of Object.entries(catalogEntry.dataSchema)) {
        if (schema.required && (sceneData[fieldName] === undefined || sceneData[fieldName] === null)) {
          errors.push(`Scene ${i} (${component}): missing required field "${fieldName}"`);
        }
      }

      // Sanitize data according to schema
      for (const [fieldName, value] of Object.entries(sceneData)) {
        const schema = catalogEntry.dataSchema[fieldName];
        if (!schema) continue;
        sceneData[fieldName] = sanitizeField(value, schema, `Scene ${i}.${fieldName}`, warnings);
      }
    }

    // Validate and truncate narration
    let sanitizedNarration: string | undefined;
    if (narration !== undefined && narration !== null) {
      if (typeof narration !== 'string') {
        warnings.push(`Scene ${i} (${component}): narration must be a string, skipped`);
      } else if (narration.length > MAX_NARRATION_LENGTH) {
        warnings.push(`Scene ${i} (${component}): narration truncated from ${narration.length} to ${MAX_NARRATION_LENGTH} chars`);
        sanitizedNarration = narration.slice(0, MAX_NARRATION_LENGTH);
      } else {
        sanitizedNarration = narration;
      }
    }

    // Validate beat
    let sanitizedBeat: NarrativeBeat | undefined;
    if (beat !== undefined && beat !== null) {
      if (typeof beat === 'string' && VALID_BEATS.has(beat as NarrativeBeat)) {
        sanitizedBeat = beat as NarrativeBeat;
      } else {
        warnings.push(`Scene ${i} (${component}): invalid beat "${beat}", dropped`);
      }
    }

    // Validate transition
    let sanitizedTransition: ComposedScene['transition'];
    if (transition && typeof transition === 'object') {
      const t = transition as Record<string, unknown>;
      const enter = typeof t.enter === 'string' && VALID_TRANSITIONS.has(t.enter as TransitionType) ? t.enter as TransitionType : undefined;
      const exit = typeof t.exit === 'string' && VALID_TRANSITIONS.has(t.exit as TransitionType) ? t.exit as TransitionType : undefined;
      if (typeof t.enter === 'string' && !enter) warnings.push(`Scene ${i} (${component}): invalid transition.enter "${t.enter}", dropped`);
      if (typeof t.exit === 'string' && !exit) warnings.push(`Scene ${i} (${component}): invalid transition.exit "${t.exit}", dropped`);
      if (enter || exit) sanitizedTransition = { ...(enter && { enter }), ...(exit && { exit }) };
    }

    // Validate pacing
    let sanitizedPacing: Pacing | undefined;
    if (pacing !== undefined && pacing !== null) {
      if (typeof pacing === 'string' && VALID_PACINGS.has(pacing as Pacing)) {
        sanitizedPacing = pacing as Pacing;
      } else {
        warnings.push(`Scene ${i} (${component}): invalid pacing "${pacing}", dropped`);
      }
    }

    // Validate mood
    let sanitizedMood: Mood | undefined;
    if (mood !== undefined && mood !== null) {
      if (typeof mood === 'string' && VALID_MOODS.has(mood as Mood)) {
        sanitizedMood = mood as Mood;
      } else {
        warnings.push(`Scene ${i} (${component}): invalid mood "${mood}", dropped`);
      }
    }

    // Validate variant
    let sanitizedVariant: string | undefined;
    if (variant !== undefined && variant !== null && typeof variant === 'string') {
      const validVariants = SCENE_VARIANTS[component];
      if (validVariants && validVariants.includes(variant)) {
        sanitizedVariant = variant;
      } else {
        warnings.push(`Scene ${i} (${component}): invalid variant "${variant}", dropped`);
      }
    }

    sanitized.push({
      sceneId: typeof sceneId === 'string' ? sceneId : `scene-${i}`,
      component,
      durationSeconds: duration,
      data: sceneData,
      ...(sanitizedNarration !== undefined && { narration: sanitizedNarration }),
      ...(sanitizedBeat && { beat: sanitizedBeat }),
      ...(sanitizedTransition && { transition: sanitizedTransition }),
      ...(sanitizedPacing && { pacing: sanitizedPacing }),
      ...(sanitizedMood && { mood: sanitizedMood }),
      ...(sanitizedVariant && { variant: sanitizedVariant }),
    });
  }

  // Check total duration
  const totalDuration = sanitized.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (totalDuration > MAX_TOTAL_DURATION) {
    warnings.push(`Total duration ${totalDuration}s exceeds ${MAX_TOTAL_DURATION}s limit`);
  }

  const hasRequiredErrors = errors.some(e => e.includes('missing required'));
  return {
    valid: sanitized.length > 0 && !hasRequiredErrors,
    errors,
    warnings,
    sanitized,
  };
}

function sanitizeField(value: unknown, schema: SceneFieldSchema, path: string, warnings: string[]): unknown {
  // String truncation
  if (schema.type === 'string' && typeof value === 'string' && schema.maxLength) {
    if (value.length > schema.maxLength) {
      warnings.push(`${path}: truncated from ${value.length} to ${schema.maxLength} chars`);
      return value.slice(0, schema.maxLength);
    }
  }

  // Array trimming + item sanitization
  if (schema.type === 'array' && Array.isArray(value)) {
    let arr = value;
    if (schema.maxItems && arr.length > schema.maxItems) {
      warnings.push(`${path}: trimmed from ${arr.length} to ${schema.maxItems} items`);
      arr = arr.slice(0, schema.maxItems);
    }

    // Sanitize array items if they're objects with field schemas
    if (schema.fields) {
      // Detect simple string array: schema.fields only has an "item" key
      const isSimpleStringArray = schema.fields.item && Object.keys(schema.fields).length === 1;

      return arr.map((item, idx) => {
        // Simple string array: accept plain strings
        if (typeof item === 'string' && isSimpleStringArray && schema.fields?.item?.maxLength) {
          if (item.length > schema.fields.item.maxLength) {
            warnings.push(`${path}[${idx}]: truncated to ${schema.fields.item.maxLength} chars`);
            return item.slice(0, schema.fields.item.maxLength);
          }
          return item;
        }
        // Simple string array: unwrap {item: "text"} objects from AI
        if (isSimpleStringArray && typeof item === 'object' && item !== null && 'item' in item) {
          let text = String((item as Record<string, unknown>).item);
          if (schema.fields?.item?.maxLength && text.length > schema.fields.item.maxLength) {
            warnings.push(`${path}[${idx}]: truncated to ${schema.fields.item.maxLength} chars`);
            text = text.slice(0, schema.fields.item.maxLength);
          }
          return text;
        }
        // Object array: sanitize each field
        if (typeof item === 'object' && item !== null) {
          const sanitizedItem: Record<string, unknown> = { ...item };
          for (const [fk, fv] of Object.entries(schema.fields!)) {
            if (fk === 'item') continue; // simple string array
            if (sanitizedItem[fk] !== undefined) {
              sanitizedItem[fk] = sanitizeField(sanitizedItem[fk], fv, `${path}[${idx}].${fk}`, warnings);
            }
          }
          return sanitizedItem;
        }
        return item;
      });
    }

    return arr;
  }

  // Number clamping for scores
  if (schema.type === 'number' && typeof value === 'number') {
    return value;
  }

  return value;
}
