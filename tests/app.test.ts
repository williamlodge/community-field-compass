import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createMemoryRepository, loadSampleRecords } from "../src/data/repository.js";

const app = createApp(createMemoryRepository(loadSampleRecords(), "development"));

describe("public pages", () => {
  it("renders Discover with search, categories, urgent help, and the sample banner", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBeTruthy();
    expect(res.headers["content-security-policy"]).toContain("script-src 'self'");
    expect(res.text).toContain('action="/search"');
    expect(res.text).toContain('href="/urgent"');
    expect(res.text).toContain("Sample data");
  });

  it("T01: city or ZIP search works without device location", async () => {
    const res = await request(app).get("/search").query({ q: "childcare", place: "80205" });
    expect(res.status).toBe(200);
    expect(res.text).toContain("Evening and Overnight Childcare (Sample)");
    expect(res.text).toContain("Lists Denver County as a service area");
  });

  it("T04: shows a no-match state with specific changes and a human route", async () => {
    const res = await request(app).get("/search").query({ category: "children-families", place: "Boulder" });
    expect(res.text).toContain("No listings match all of your choices");
    expect(res.text).toContain("Search outside Boulder");
    expect(res.text).toContain('href="tel:211"');
  });

  it("flags an unrecognized place instead of silently ignoring it", async () => {
    const res = await request(app).get("/search").query({ q: "food", place: "Atlantis" });
    expect(res.text).toContain('aria-invalid="true"');
  });

  it("escapes user input", async () => {
    const res = await request(app).get("/search").query({ q: '<script>alert(1)</script>' });
    expect(res.text).not.toContain("<script>alert(1)</script>");
    expect(res.text).toContain("&lt;script&gt;");
  });

  it("renders resource details from approved fields with unknowns labeled (T03)", async () => {
    const res = await request(app).get("/resources/res-family-home-care");
    expect(res.status).toBe(200);
    expect(res.text).toContain('href="tel:3035550131"');
    expect(res.text).toContain("Not published by the source");
    expect(res.text).toContain("Hours not published");
  });

  it("T16: confidential address never appears on the detail page", async () => {
    const res = await request(app).get("/resources/res-safe-shelter");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("CONFIDENTIAL-TEST-ADDRESS");
    expect(res.text).toContain("Address kept confidential");
  });

  it("returns 410 for withdrawn and 404 for draft listings", async () => {
    expect((await request(app).get("/resources/res-former-rent-fund")).status).toBe(410);
    expect((await request(app).get("/resources/res-draft-unreviewed")).status).toBe(404);
  });

  it("T10: urgent help is reachable directly and lists 911, 988, and 211", async () => {
    const res = await request(app).get("/urgent");
    expect(res.status).toBe(200);
    for (const n of ["tel:911", "tel:988", "tel:211"]) expect(res.text).toContain(n);
  });

  it("T14: switches to Spanish and remembers the choice", async () => {
    const res = await request(app).get("/").query({ lang: "es" });
    expect(res.text).toContain('<html lang="es">');
    expect(res.text).toContain("Ayuda urgente");
    const cookie = res.headers["set-cookie"];
    const next = await request(app).get("/urgent").set("Cookie", cookie as unknown as string[]);
    expect(next.text).toContain("Llame al 911");
  });
});

describe("JSON API", () => {
  it("searches with bounded paging", async () => {
    const res = await request(app).get("/api/resources").query({ q: "utilities", page_size: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.page_size).toBe(50);
    expect(res.body.request_id).toBeTruthy();
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("returns resource details and withdrawn status for saved-plan checks (T13)", async () => {
    const ok = await request(app).get("/api/resources/res-evening-childcare");
    expect(ok.body).toMatchObject({ status: "published", resource: { id: "res-evening-childcare", record_version: 1 } });
    const gone = await request(app).get("/api/resources/res-former-rent-fund");
    expect(gone.status).toBe(410);
    expect(gone.body.status).toBe("withdrawn");
  });

  it("T16: confidential address is absent from API output", async () => {
    const all = await request(app).get("/api/resources").query({ page_size: 50 });
    expect(JSON.stringify(all.body)).not.toContain("CONFIDENTIAL-TEST-ADDRESS");
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.request_id).toBeTruthy();
  });
});
