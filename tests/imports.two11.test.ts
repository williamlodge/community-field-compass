import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeTwo11Result, type Two11Result, type Two11SearchResponse } from "../src/imports/two11.js";
import { parseResource } from "../src/data/schema.js";

const sample = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/imports/two11-search.sample.json", import.meta.url)), "utf8"),
) as Two11SearchResponse;

describe("2-1-1 Colorado scraper normalization", () => {
  const fetchedAt = "2026-10-12T12:00:00.000Z";
  const [publicResult, secondResult, , confidentialResult] = sample.results as [
    Two11Result,
    Two11Result,
    Two11Result,
    Two11Result,
  ];

  it("produces schema-valid draft records", () => {
    for (const r of sample.results) {
      const resource = normalizeTwo11Result(r, fetchedAt);
      expect(() => parseResource(resource)).not.toThrow();
      expect(resource.publication_status).toBe("draft");
    }
  });

  it("derives stable source ids", () => {
    expect(normalizeTwo11Result(publicResult, fetchedAt).id).toBe(`co211-ps-${publicResult.program_site_id}`);
  });

  it("strips HTML from description, eligibility, and intake", () => {
    const resource = normalizeTwo11Result(publicResult, fetchedAt);
    expect(resource.description).not.toMatch(/<[^>]+>/);
    expect(resource.eligibility).not.toMatch(/<[^>]+>/);
    expect(resource.description).toMatch(/Hours \(as stated by source\)/);
  });

  it("maps taxonomy categories to FieldCompass categories", () => {
    const resource = normalizeTwo11Result(publicResult, fetchedAt);
    expect(resource.category_ids).toContain("food");
  });

  it("splits semicolon-separated languages", () => {
    const resource = normalizeTwo11Result(secondResult, fetchedAt);
    expect(resource.languages).toEqual(expect.arrayContaining(["en", "es"]));
  });

  it("maps source status to operating status", () => {
    expect(normalizeTwo11Result(publicResult, fetchedAt).operating_status).toBe("active");
  });

  it("treats service_fees=false as free", () => {
    expect(normalizeTwo11Result(secondResult, fetchedAt).cost.kind).toBe("free");
  });

  it("maps wheelchair accessibility only when explicitly stated", () => {
    expect(normalizeTwo11Result(publicResult, fetchedAt).accessibility.wheelchair).toBe("yes");
  });

  it("never exposes a confidential address (T16)", () => {
    const resource = normalizeTwo11Result(confidentialResult, fetchedAt);
    expect(resource.locations[0]!.address_visibility).toBe("confidential");
    expect(resource.locations[0]!.address).toBeNull();
  });

  it("keeps a public address with county for public locations", () => {
    const resource = normalizeTwo11Result(publicResult, fetchedAt);
    expect(resource.locations[0]!.address_visibility).toBe("public");
    expect(resource.locations[0]!.address?.county).toBe("Denver County");
  });

  it("records provenance with review-required rights", () => {
    const resource = normalizeTwo11Result(publicResult, fetchedAt);
    expect(resource.sources[0]!.id).toBe("co211");
    expect(resource.sources[0]!.rights).toMatch(/review required/i);
  });

  it("drops placeholder phone values like 'Visit Website'", () => {
    const r = { ...publicResult, agency_phones: { phone_1: "Visit Website" }, program_site_phones: null };
    const resource = normalizeTwo11Result(r as Two11Result, fetchedAt);
    expect(resource.contacts.every((c) => c.channel !== "phone" || /[()\d]/.test(c.value))).toBe(true);
  });

  it("moves phone extensions into notes so the value stays valid", () => {
    const r = { ...publicResult, agency_phones: { phone_1: "(303) 393-8050 Ext 3" }, program_site_phones: null };
    const resource = normalizeTwo11Result(r as Two11Result, fetchedAt);
    const phone = resource.contacts.find((c) => c.channel === "phone");
    expect(phone?.value).toBe("(303) 393-8050");
    expect(phone?.notes).toMatch(/Ext 3/);
  });

  it("maps long language names and moves interpretation offers out of languages", () => {
    const r = { ...publicResult, languages: "English;American Sign Language;Interpretation Available" };
    const resource = normalizeTwo11Result(r as Two11Result, fetchedAt);
    expect(resource.languages).toEqual(expect.arrayContaining(["en", "asl"]));
    expect(resource.languages?.join(" ")).not.toMatch(/Interpretation/);
    expect(resource.description).toMatch(/Interpretation available/);
  });

  it("treats 'No Physical Address' placeholders as missing addresses", () => {
    const r = { ...publicResult, address_1: "No Physical Address", private_physical_address: false };
    const resource = normalizeTwo11Result(r as Two11Result, fetchedAt);
    expect(resource.locations[0]!.address).toBeNull();
    expect(resource.modes).not.toContain("in_person");
  });
});
