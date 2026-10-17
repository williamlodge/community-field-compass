import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { listPublishedGuides } from "../src/data/guides.js";
import type { QueryPool } from "../src/data/mariadb.js";
import { createMemoryRepository, loadSampleRecords } from "../src/data/repository.js";

describe("published guides", () => {
  it("renders only validated guide steps and escapes uploaded text", async () => {
    const pool = { query: vi.fn().mockResolvedValue([
      { slug: "safe-guide", title: "<script>alert(1)</script>", summary: "A short guide", category: "food", minutes: 5,
        steps: '[{"title":"Start","body":"Call first <img src=x onerror=alert(1)>"}]', updated_at: new Date("2026-10-16T12:00:00Z") },
      { slug: "broken-guide", title: "Broken", summary: null, category: "food", minutes: 5,
        steps: "not JSON", updated_at: new Date("2026-10-16T12:00:00Z") },
    ]) } as unknown as QueryPool;
    const listGuides = () => listPublishedGuides(pool);
    const app = createApp(createMemoryRepository(loadSampleRecords(), "development"), { listGuides });
    const page = await request(app).get("/guides");
    const api = await request(app).get("/api/guides");
    expect(page.status).toBe(200);
    expect(page.text).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(page.text).not.toContain("<img src=x");
    expect(page.text).not.toContain("Broken");
    expect(api.body.results).toHaveLength(1);
    expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({ sql: expect.stringContaining("WHERE active = 1") }));
  });
});
