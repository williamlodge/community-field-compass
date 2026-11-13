import { describe, expect, it } from "vitest";
import { stageRecords } from "../src/imports/pipeline.js";
import { normalizeFbrLocation, type FbrLocation } from "../src/imports/fbr.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Resource } from "../src/domain/types.js";

const fetchedAt = "2026-10-12T12:00:00.000Z";

function makeRecords(): Resource[] {
  const sample = JSON.parse(
    readFileSync(fileURLToPath(new URL("./fixtures/imports/fbr-locations.sample.json", import.meta.url)), "utf8"),
  ) as { item1: FbrLocation[] };
  return sample.item1.map((l) => normalizeFbrLocation(l, fetchedAt));
}

describe("import pipeline", () => {
  it("stages drafts into a batch with counts and provenance", () => {
    const records = makeRecords();
    const result = stageRecords(records, { sourceId: "fbr", now: new Date("2026-10-12T12:00:00Z") });
    expect(result.batch.source_id).toBe("fbr");
    expect(result.batch.counts.staged).toBe(records.length);
    expect(result.staged.every((s) => s.batch_id === result.batch.batch_id)).toBe(true);
    expect(result.staged.every((s) => s.resource.publication_status === "draft")).toBe(true);
  });

  it("is idempotent: existing ids are skipped, not duplicated", () => {
    const records = makeRecords();
    const first = stageRecords(records, { sourceId: "fbr" });
    const existing = new Set(first.staged.map((s) => s.resource.id));
    const second = stageRecords(records, { sourceId: "fbr", existingIds: existing });
    expect(second.batch.counts.staged).toBe(0);
    expect(second.batch.counts.skipped_existing).toBe(records.length);
    expect(second.skipped.every((s) => s.reason === "already_exists")).toBe(true);
  });

  it("refuses to stage anything that is not a draft", () => {
    const records = makeRecords();
    const published = { ...records[0]!, publication_status: "published" as const };
    expect(() => stageRecords([published], { sourceId: "fbr" })).toThrow(/non-draft/);
  });

  it("skips invalid records instead of staging them", () => {
    const records = makeRecords();
    const broken = { ...records[0]!, id: "fbr-loc-broken", category_ids: [] } as unknown as Resource;
    const result = stageRecords([...records, broken], { sourceId: "fbr" });
    expect(result.batch.counts.skipped_invalid).toBe(1);
    expect(result.staged.some((s) => s.resource.id === "fbr-loc-broken")).toBe(false);
  });

  it("batch ids are unique per run", () => {
    const records = makeRecords();
    const a = stageRecords(records, { sourceId: "fbr", now: new Date("2026-10-12T12:00:00Z") });
    const b = stageRecords(records, { sourceId: "fbr", now: new Date("2026-10-12T12:00:01Z") });
    expect(a.batch.batch_id).not.toBe(b.batch.batch_id);
  });
});
