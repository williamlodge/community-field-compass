// Import pipeline for scraped (and later CSV) records.
//
// Guarantees (brief §3 — bulk imports):
//   * Scraped records are always staged as drafts; this module refuses to
//     stage anything that is not publication_status "draft".
//   * Idempotency: staging is keyed by the stable source-derived record id
//     (e.g. fbr-loc-13243, co211-ps-400018085). Re-running a scrape skips
//     records that already exist in the target instead of duplicating them.
//   * Provenance: every staged record carries its source in `sources[]` and
//     the batch id in which it arrived, so changes can be reviewed and
//     reversed without destroying later edits.
//   * Nothing here ever overwrites a record a staff member already touched;
//     the caller passes in the set of existing ids and decides the update
//     policy. The default policy is skip-existing.

import type { Resource } from "../domain/types.js";
import { parseResource } from "../data/schema.js";

export interface StagedRecord {
  resource: Resource;
  batch_id: string;
}

export interface SkippedRecord {
  id: string;
  reason: "already_exists" | "invalid_record";
}

export interface ImportBatch {
  batch_id: string;
  source_id: string;
  started_at: string;
  finished_at: string;
  counts: {
    fetched: number;
    staged: number;
    skipped_existing: number;
    skipped_invalid: number;
  };
}

export interface StageResult {
  batch: ImportBatch;
  staged: StagedRecord[];
  skipped: SkippedRecord[];
}

export interface StageOptions {
  sourceId: string;
  existingIds?: ReadonlySet<string>;
  now?: Date;
}

function newBatchId(sourceId: string, now: Date): string {
  const stamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `imp-${sourceId}-${stamp}-${rand}`;
}

/**
 * Validate and stage a set of scraped records as an import batch.
 * Records that fail schema validation are skipped, never partially staged,
 * and never appear in any list.
 */
export function stageRecords(records: Resource[], options: StageOptions): StageResult {
  const now = options.now ?? new Date();
  const batchId = newBatchId(options.sourceId, now);
  const existing = options.existingIds ?? new Set<string>();
  const staged: StagedRecord[] = [];
  const skipped: SkippedRecord[] = [];
  let skippedExisting = 0;
  let skippedInvalid = 0;

  for (const record of records) {
    if (record.publication_status !== "draft") {
      // Hard guard: the import pipeline must never publish (brief §3).
      throw new Error(`Refusing to stage non-draft record ${record.id}`);
    }
    if (existing.has(record.id)) {
      skipped.push({ id: record.id, reason: "already_exists" });
      skippedExisting++;
      continue;
    }
    let validated: Resource;
    try {
      validated = parseResource(record);
    } catch {
      skipped.push({ id: record.id, reason: "invalid_record" });
      skippedInvalid++;
      continue;
    }
    staged.push({ resource: validated, batch_id: batchId });
  }

  return {
    batch: {
      batch_id: batchId,
      source_id: options.sourceId,
      started_at: now.toISOString(),
      finished_at: new Date().toISOString(),
      counts: {
        fetched: records.length,
        staged: staged.length,
        skipped_existing: skippedExisting,
        skipped_invalid: skippedInvalid,
      },
    },
    staged,
    skipped,
  };
}

/**
 * Where staged drafts go. The admin control panel's review queue implements
 * this over MariaDB; the CLI writes batches to disk.
 */
export interface ImportTarget {
  /** Ids of records already present, for idempotent re-runs. */
  existingIds(): Promise<Set<string>> | Set<string>;
  /** Persist staged drafts. Implementations must keep them as drafts. */
  insertStaged(staged: StagedRecord[]): Promise<void> | void;
}
