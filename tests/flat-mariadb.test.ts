import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { createFlatMariaRepository, mapFlatResource } from "../src/data/flat-mariadb.js";
import type { QueryPool } from "../src/data/mariadb.js";
import { resolvePlace } from "../src/domain/geography.js";

const row = (id = 42) => ({
  id, name: `Example pantry ${id}`, category: "food", description: "Groceries by appointment.",
  address: "123 Main St", city: "Denver", state: "CO", zip: "80202",
  phone: "(303) 555-0100", email: null, website: "https://example.org",
  hours: "Monday 9am–5pm", eligibility: null, services: '["groceries"]',
  cost: "unknown", languages: "English, Spanish", source_name: "211 Colorado",
  source_url: null, verified_at: null, active: true, updated_at: new Date("2026-10-15T12:00:00Z"),
});

describe("co_resources public bridge", () => {
  it("keeps unverified claims unknown and shows text hours without claiming open now", () => {
    const resource = mapFlatResource(row());
    expect(resource.service_area).toEqual({ type: "unknown" });
    expect(resource.reviewed_at).toBeNull();
    expect(resource.source_updated_at).toBeNull();
    expect(resource.published_hours_text).toBe("Monday 9am–5pm");
    expect(resource.sources[0]?.url).toBe("https://search.211colorado.org/");
    expect(mapFlatResource({ ...row(), address: "P.O. Box 123" }).locations).toEqual([]);
  });

  it("removes confidential addresses from both HTML and API", async () => {
    const pool = { query: vi.fn().mockResolvedValue([{ ...row(), address: "Confidential location" }]) } as unknown as QueryPool;
    const app = createApp(createFlatMariaRepository(pool, "production"));
    const page = await request(app).get("/resources/co-42");
    const api = await request(app).get("/api/resources/co-42");
    expect(page.text).toContain("Address kept confidential");
    expect(page.text).not.toContain("Confidential location");
    expect(JSON.stringify(api.body)).not.toContain("Confidential location");
  });

  it("paginates a large directory on the public search page", async () => {
    const pool = { query: vi.fn().mockResolvedValue(Array.from({ length: 35 }, (_, i) => row(i + 1))) } as unknown as QueryPool;
    const app = createApp(createFlatMariaRepository(pool, "production"));
    const first = await request(app).get("/search");
    const second = await request(app).get("/search?page=2");
    expect(first.text.match(/class="result"/g)).toHaveLength(30);
    expect(first.text).toContain('href="/search?page=2"');
    expect(second.text.match(/class="result"/g)).toHaveLength(5);
  });

  it("prioritizes a nearby office without claiming that it serves the search area", async () => {
    const pool = { query: vi.fn().mockResolvedValue([
      { ...row(1), city: "Boulder" }, row(2),
    ]) } as unknown as QueryPool;
    const result = await createFlatMariaRepository(pool, "production").search({ place: resolvePlace("Denver") });
    expect(result.hits[0]?.resource.id).toBe("co-2");
    expect(result.hits[0]?.unconfirmed).toContain("place");
    expect(result.hits[0]?.reasons).toContainEqual({ kind: "office", detail: "Denver" });
  });
});
