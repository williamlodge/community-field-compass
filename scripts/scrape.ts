// CLI: run a scraper and stage the result as a draft import batch.
//
//   npm run scrape -- fbr [--dry-run] [--out var/imports] [--max-pages 10]
//   npm run scrape -- 211 [--term "food pantry"] [--terms-only a,b,c]
//
// Without --dry-run the batch is written to <out>/<batch-id>.json containing
// batch metadata plus the staged draft records. Records always land as
// drafts; nothing is published by this tool.

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FbrScraper, normalizeFbrLocation } from "../src/imports/fbr.js";
import { Two11Scraper, normalizeTwo11Result, DEFAULT_TERMS } from "../src/imports/two11.js";
import { stageRecords, type StagedRecord } from "../src/imports/pipeline.js";
import { SOURCES } from "../src/imports/sources.js";
import type { Resource } from "../src/domain/types.js";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

/** Ids already staged in previous batch files, for idempotent re-runs. */
async function readExistingIds(dir: string): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const batch = JSON.parse(await readFile(join(dir, f), "utf8")) as { staged?: StagedRecord[] };
      for (const s of batch.staged ?? []) ids.add(s.resource.id);
    }
  } catch {
    // Directory missing: first run, nothing exists yet.
  }
  return ids;
}

async function main(): Promise<void> {
  const source = process.argv[2];
  const dryRun = hasFlag("--dry-run");
  const outDir = argValue("--out") ?? "var/imports";
  const maxPages = Number(argValue("--max-pages") ?? "40");

  if (source !== "fbr" && source !== "211") {
    console.error('Usage: npm run scrape -- fbr|211 [--dry-run] [--out dir] [--max-pages n] [--term "text"]');
    process.exit(2);
  }

  const fetchedAt = new Date().toISOString();
  let records: Resource[];
  let fetched = 0;

  if (source === "fbr") {
    const scraper = new FbrScraper({ maxPages });
    const { locations, region } = await scraper.fetchAllLocations();
    fetched = locations.length;
    records = locations.map((l) => normalizeFbrLocation(l, fetchedAt, region));
  } else {
    const terms = argValue("--terms-only")?.split(",").map((t) => t.trim()).filter(Boolean)
      ?? (argValue("--term") ? [argValue("--term")!] : DEFAULT_TERMS);
    const scraper = new Two11Scraper({ maxPages });
    const { results } = await scraper.searchAll(terms);
    fetched = results.length;
    records = results.map((r) => normalizeTwo11Result(r, fetchedAt));
  }

  const existing = dryRun ? new Set<string>() : await readExistingIds(outDir);
  const result = stageRecords(records, { sourceId: SOURCES[source === "fbr" ? "fbr" : "co211"].id, existingIds: existing });

  if (!dryRun && result.staged.length > 0) {
    await mkdir(outDir, { recursive: true });
    const path = join(outDir, `${result.batch.batch_id}.json`);
    await writeFile(path, JSON.stringify({ batch: result.batch, staged: result.staged, skipped: result.skipped }, null, 2));
    console.log(`Batch written: ${path}`);
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}${source}: fetched=${fetched} staged=${result.batch.counts.staged} ` +
      `skipped_existing=${result.batch.counts.skipped_existing} skipped_invalid=${result.batch.counts.skipped_invalid}`,
  );
  if (result.skipped.length > 0) {
    for (const s of result.skipped.slice(0, 20)) console.log(`  skipped ${s.id}: ${s.reason}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
