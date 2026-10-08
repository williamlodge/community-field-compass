import { describe, expect, it } from "vitest";
import { resolvePlace } from "../src/domain/geography.js";
import { hoursStatus } from "../src/domain/schedule.js";
import { createSearch, tokenize } from "../src/domain/search.js";
import { createMemoryRepository, loadSampleRecords } from "../src/data/repository.js";
import type { Schedule } from "../src/domain/types.js";

const repo = createMemoryRepository(loadSampleRecords(), "development");
const ids = (r: ReturnType<typeof repo.search>) => r.hits.map((h) => h.resource.id);

describe("geography (FC-01)", () => {
  it("resolves city, ZIP, and county input", () => {
    expect(resolvePlace("Denver")?.counties).toEqual(["Denver"]);
    expect(resolvePlace("Denver, CO")?.counties).toEqual(["Denver"]);
    expect(resolvePlace("80010")?.counties).toEqual(["Arapahoe", "Adams"]);
    expect(resolvePlace("Jefferson County")).toMatchObject({ kind: "county", counties: ["Jefferson"] });
  });

  it("returns null for unknown places instead of guessing", () => {
    expect(resolvePlace("Atlantis")).toBeNull();
    expect(resolvePlace("99999")).toBeNull();
  });
});

describe("published hours (FC-05, T05)", () => {
  const overnight: Schedule = {
    time_zone: "America/Denver",
    regular: [{ day: 1, opens: "15:00", closes: "00:30" }],
    exceptions: [],
    source_id: "s",
  };

  it("keeps an overnight period open after midnight", () => {
    // Tue 2026-10-13 00:15 MDT = 06:15 UTC; Monday's period runs to 00:30.
    expect(hoursStatus(overnight, new Date("2026-10-13T06:15:00Z"))).toMatchObject({ state: "open", closesAt: "00:30" });
    expect(hoursStatus(overnight, new Date("2026-10-13T06:45:00Z")).state).toBe("closed");
  });

  it("applies holiday exceptions", () => {
    const withHoliday: Schedule = { ...overnight, exceptions: [{ date: "2026-10-12", closed: true, label: "Holiday" }] };
    // Mon 2026-10-12 16:00 MDT = 22:00 UTC
    expect(hoursStatus(overnight, new Date("2026-10-12T22:00:00Z")).state).toBe("open");
    expect(hoursStatus(withHoliday, new Date("2026-10-12T22:00:00Z"))).toMatchObject({ state: "closed", exceptionLabel: "Holiday" });
  });

  it("handles daylight-saving changes using Colorado local time", () => {
    const daytime: Schedule = { ...overnight, regular: [{ day: 1, opens: "09:00", closes: "17:00" }] };
    // Mon 2026-11-02 09:30 MST = 16:30 UTC (after DST ends)
    expect(hoursStatus(daytime, new Date("2026-11-02T16:30:00Z")).state).toBe("open");
    expect(hoursStatus(daytime, new Date("2026-11-02T15:30:00Z")).state).toBe("closed");
  });

  it("returns unknown, not closed, when hours are missing", () => {
    expect(hoursStatus(null).state).toBe("unknown");
  });
});

describe("search (FC-02 – FC-04)", () => {
  it("understands synonyms and misspellings", () => {
    expect(tokenize("help with my light bill")).toEqual(["utilities"]);
    expect(ids(repo.search({ q: "daycare" }))).toContain("res-evening-childcare");
    expect(ids(repo.search({ q: "chidlcare" }))).toContain("res-evening-childcare");
    expect(ids(repo.search({ q: "guardería" }))).toContain("res-evening-childcare");
  });

  it("does not return records that only share a broad category", () => {
    expect(ids(repo.search({ q: "light bill", place: resolvePlace("Denver") }))).not.toContain("res-safe-shelter");
  });

  it("T02: matches by service area, not office location", () => {
    // Office is in Aurora (Arapahoe) but Denver is a documented service area.
    const hit = repo.search({ q: "childcare", place: resolvePlace("80205") }).hits.find((h) => h.resource.id === "res-childcare-cost-help");
    expect(hit?.reasons).toContainEqual({ kind: "area", detail: "Denver" });
  });

  it("T03: unknown values stay unknown and are not treated as a match", () => {
    const r = repo.search({ category: "children-families", place: resolvePlace("Denver"), language: "es", free: true, wheelchair: true });
    const incomplete = r.hits.find((h) => h.resource.id === "res-family-home-care");
    expect(incomplete?.unconfirmed.sort()).toEqual(["free", "language", "wheelchair"]);
    expect(incomplete?.reasons.map((x) => x.kind)).not.toContain("free");
    // Records with confirmed facts rank above the incomplete one.
    expect(r.hits[0]?.unconfirmed).toEqual([]);
  });

  it("T04: explains which filter removed results and never invents providers", () => {
    const r = repo.search({ category: "children-families", place: resolvePlace("Boulder") });
    expect(r.total).toBe(0);
    expect(r.relaxations).toContainEqual(expect.objectContaining({ filter: "place" }));
  });

  it("marks ZIP-defined areas as unconfirmed when only a city is given", () => {
    const hit = repo.search({ q: "water bill", place: resolvePlace("Denver") }).hits.find((h) => h.resource.id === "res-water-hardship");
    expect(hit?.unconfirmed).toContain("place");
    const exact = repo.search({ q: "water bill", place: resolvePlace("80205") }).hits.find((h) => h.resource.id === "res-water-hardship");
    expect(exact?.unconfirmed).toEqual([]);
  });

  it("ranks local coverage above statewide coverage", () => {
    const records = loadSampleRecords();
    const clinic = { ...records.find((r) => r.id === "res-shutoff-clinic")!, operating_status: "active" as const };
    const energy = records.find((r) => r.id === "res-energy-bill-help")!;
    const r = createSearch([energy, clinic])({ q: "utilities", place: resolvePlace("80229") });
    expect(r.hits.map((h) => h.resource.id)).toEqual(["res-shutoff-clinic", "res-energy-bill-help"]);
  });

  it("ranks a temporarily closed program below active ones", () => {
    const r = repo.search({ q: "utilities", place: resolvePlace("80229") });
    expect(r.hits.at(-1)?.resource.id).toBe("res-shutoff-clinic");
  });
});

describe("repository publication rules", () => {
  it("hides drafts and reports withdrawn records", () => {
    expect(repo.get("res-draft-unreviewed").status).toBe("not_found");
    expect(repo.get("res-former-rent-fund").status).toBe("withdrawn");
    expect(ids(repo.search({ q: "food" }))).not.toContain("res-draft-unreviewed");
    expect(ids(repo.search({ q: "rent" }))).not.toContain("res-former-rent-fund");
  });

  it("T16: strips confidential addresses from every public projection", () => {
    const found = repo.get("res-safe-shelter");
    expect(found.status).toBe("published");
    expect(JSON.stringify(found)).not.toContain("CONFIDENTIAL-TEST-ADDRESS");
    expect(JSON.stringify(repo.search({ q: "domestic violence" }))).not.toContain("CONFIDENTIAL-TEST-ADDRESS");
  });

  it("refuses sample data in production", () => {
    expect(() => createMemoryRepository(loadSampleRecords(), "production")).toThrow(/sample/i);
  });

  it("search works on an empty dataset", () => {
    expect(createSearch([])({ q: "food" }).total).toBe(0);
  });
});
