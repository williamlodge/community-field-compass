import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeFbrLocation, type FbrLocation } from "../src/imports/fbr.js";
import { parseResource } from "../src/data/schema.js";

const sample = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/imports/fbr-locations.sample.json", import.meta.url)), "utf8"),
) as { item1: FbrLocation[] };

describe("FBR scraper normalization", () => {
  const fetchedAt = "2026-10-12T12:00:00.000Z";

  it("produces schema-valid draft records", () => {
    for (const loc of sample.item1) {
      const resource = normalizeFbrLocation(loc, fetchedAt);
      expect(() => parseResource(resource)).not.toThrow();
      expect(resource.publication_status).toBe("draft");
      expect(resource.is_sample).toBe(false);
    }
  });

  it("derives stable source ids for idempotent re-runs", () => {
    const [a, b] = sample.item1;
    expect(normalizeFbrLocation(a!, fetchedAt).id).toBe(`fbr-loc-${a!.locationId}`);
    expect(normalizeFbrLocation(a!, fetchedAt).id).toBe(normalizeFbrLocation(a!, fetchedAt).id);
    expect(normalizeFbrLocation(b!, fetchedAt).id).not.toBe(normalizeFbrLocation(a!, fetchedAt).id);
  });

  it("maps food programs to food category and keywords", () => {
    const resource = normalizeFbrLocation(sample.item1[0]!, fetchedAt);
    expect(resource.category_ids).toContain("food");
    expect(resource.keywords.join(" ")).toMatch(/food pantry/i);
  });

  it("keeps unknown facts explicit instead of inventing them", () => {
    const resource = normalizeFbrLocation(sample.item1[0]!, fetchedAt);
    expect(resource.eligibility).toBeNull();
    expect(resource.schedule).toBeNull();
    expect(resource.cost.kind).toBe("unknown");
    expect(resource.accessibility.wheelchair).toBe("unknown");
    expect(resource.reviewed_at).toBeNull();
  });

  it("trims padded zips from the source payload", () => {
    const resource = normalizeFbrLocation(sample.item1[0]!, fetchedAt);
    const zip = resource.locations[0]?.address?.zip ?? "";
    expect(zip).toMatch(/^\d{5}$/);
  });

  it("records provenance with review-required rights", () => {
    const resource = normalizeFbrLocation(sample.item1[0]!, fetchedAt);
    expect(resource.sources).toHaveLength(1);
    expect(resource.sources[0]!.id).toBe("fbr");
    expect(resource.sources[0]!.rights).toMatch(/review required/i);
    expect(resource.contacts.every((c) => c.source_id === "fbr")).toBe(true);
  });

  it("marks out-of-network locations with the source disclaimer", () => {
    const loc = { ...sample.item1[0]!, inNetWorkInd: false };
    const resource = normalizeFbrLocation(loc, fetchedAt, { regionId: 79, regionMapId: 116, outOfNetworkNote: "Not part of the network." });
    expect(resource.description).toMatch(/not part of the network/i);
  });
});
