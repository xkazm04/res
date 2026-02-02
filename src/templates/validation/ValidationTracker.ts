/**
 * ValidationTracker
 *
 * Tracks validation records for Claude vs Gemini quality comparison.
 * Stores approval/rejection status with notes to JSON file.
 *
 * Progress: 30 validations required (3 per template).
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAvailableTemplates } from '../configs';

// ============================================
// INTERFACES
// ============================================

/**
 * A single validation record.
 */
export interface ValidationRecord {
  /** Unique identifier */
  id: string;

  /** Template ID (e.g., 'tech_market') */
  templateId: string;

  /** Research query that was validated */
  query: string;

  /** Gemini session ID used for comparison */
  geminiSessionId: string;

  /** Claude session ID (null if not persisted) */
  claudeSessionId: string | null;

  /** Validation status */
  status: 'approved' | 'rejected' | 'pending';

  /** Reviewer notes */
  notes: string;

  /** Metrics from both systems */
  metrics: {
    gemini: { findings: number; sources: number; perspectives: number };
    claude: { findings: number; sources: number; perspectives: number };
  };

  /** Timestamp of validation */
  validatedAt: string;

  /** Who performed validation */
  validatedBy: string;
}

/**
 * Progress toward validation completion.
 */
export interface ValidationProgress {
  /** Total validations required (30) */
  total: number;

  /** Number of approved validations */
  approved: number;

  /** Number of rejected validations */
  rejected: number;

  /** Number of pending validations */
  pending: number;

  /** Progress per template */
  byTemplate: Record<string, { approved: number; required: number }>;

  /** Whether all templates have enough approvals */
  isComplete: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const VALIDATIONS_DIR = '.validations';
const VALIDATIONS_FILE = path.join(VALIDATIONS_DIR, 'validations.json');
const REQUIRED_PER_TEMPLATE = 3;

// ============================================
// VALIDATION TRACKER CLASS
// ============================================

/**
 * Tracks and persists validation records.
 *
 * @example
 * ```typescript
 * const tracker = new ValidationTracker();
 *
 * // Add a new validation
 * tracker.addValidation({
 *   templateId: 'tech_market',
 *   query: 'AI chip market',
 *   geminiSessionId: 'sess_123',
 *   claudeSessionId: null,
 *   status: 'approved',
 *   notes: 'Comparable quality',
 *   metrics: { gemini: {...}, claude: {...} },
 *   validatedBy: 'cli',
 * });
 *
 * // Check progress
 * console.log(tracker.formatProgressReport());
 * ```
 */
export class ValidationTracker {
  private records: ValidationRecord[] = [];

  constructor() {
    this.ensureDir();
    this.load();
  }

  /**
   * Ensure validations directory exists.
   */
  private ensureDir(): void {
    if (!fs.existsSync(VALIDATIONS_DIR)) {
      fs.mkdirSync(VALIDATIONS_DIR, { recursive: true });
    }
  }

  /**
   * Load records from JSON file.
   */
  private load(): void {
    if (fs.existsSync(VALIDATIONS_FILE)) {
      const content = fs.readFileSync(VALIDATIONS_FILE, 'utf-8');
      this.records = JSON.parse(content);
    }
  }

  /**
   * Save records to JSON file.
   */
  private save(): void {
    fs.writeFileSync(VALIDATIONS_FILE, JSON.stringify(this.records, null, 2));
  }

  /**
   * Add a new validation record.
   *
   * @param record - Validation data (id and validatedAt auto-generated)
   * @returns The created record with ID and timestamp
   */
  addValidation(record: Omit<ValidationRecord, 'id' | 'validatedAt'>): ValidationRecord {
    const newRecord: ValidationRecord = {
      ...record,
      id: `val_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      validatedAt: new Date().toISOString(),
    };

    this.records.push(newRecord);
    this.save();
    return newRecord;
  }

  /**
   * Update an existing validation record.
   *
   * @param id - Record ID to update
   * @param updates - Fields to update (status and/or notes)
   */
  updateValidation(id: string, updates: Partial<Pick<ValidationRecord, 'status' | 'notes'>>): void {
    const record = this.records.find((r) => r.id === id);
    if (record) {
      Object.assign(record, updates);
      this.save();
    }
  }

  /**
   * Calculate progress toward 30 validations.
   *
   * @returns Progress metrics with per-template breakdown
   */
  getProgress(): ValidationProgress {
    const templates = getAvailableTemplates();
    const byTemplate: Record<string, { approved: number; required: number }> = {};

    for (const t of templates) {
      const approved = this.records.filter((r) => r.templateId === t && r.status === 'approved').length;
      byTemplate[t] = { approved, required: REQUIRED_PER_TEMPLATE };
    }

    const approved = this.records.filter((r) => r.status === 'approved').length;
    const rejected = this.records.filter((r) => r.status === 'rejected').length;
    const pending = this.records.filter((r) => r.status === 'pending').length;
    const total = templates.length * REQUIRED_PER_TEMPLATE;

    const isComplete = Object.values(byTemplate).every((t) => t.approved >= t.required);

    return {
      total,
      approved,
      rejected,
      pending,
      byTemplate,
      isComplete,
    };
  }

  /**
   * Get all validation records.
   *
   * @returns Copy of all records
   */
  getRecords(): ValidationRecord[] {
    return [...this.records];
  }

  /**
   * Get validation records for a specific template.
   *
   * @param templateId - Template to filter by
   * @returns Records matching the template
   */
  getByTemplate(templateId: string): ValidationRecord[] {
    return this.records.filter((r) => r.templateId === templateId);
  }

  /**
   * Generate ASCII progress report.
   *
   * @returns Formatted progress report string
   */
  formatProgressReport(): string {
    const progress = this.getProgress();
    const lines = [
      '='.repeat(60),
      'VALIDATION PROGRESS',
      '='.repeat(60),
      '',
      `Total Required: ${progress.total} (${REQUIRED_PER_TEMPLATE} per template)`,
      `Approved:       ${progress.approved}`,
      `Rejected:       ${progress.rejected}`,
      `Pending:        ${progress.pending}`,
      '',
      'By Template:',
      '-'.repeat(40),
    ];

    for (const [template, stats] of Object.entries(progress.byTemplate)) {
      const status = stats.approved >= stats.required ? '[x]' : '[ ]';
      lines.push(`  ${status} ${template.padEnd(20)} ${stats.approved}/${stats.required}`);
    }

    lines.push('');
    lines.push('-'.repeat(60));
    lines.push(
      progress.isComplete
        ? '[x] ALL TEMPLATES VALIDATED - Ready for migration!'
        : `    ${progress.total - progress.approved} more approvals needed`
    );
    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}
