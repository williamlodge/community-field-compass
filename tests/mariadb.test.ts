import { describe, expect, it, vi } from "vitest";
import { createMariaRepository, openResourcePool, type QueryPool } from "../src/data/mariadb.js";
import { loadSampleRecords } from "../src/data/repository.js";
import { parseResource } from "../src/data/schema.js";

const realShape = () => ({ ...loadSampleRecords()[0]!, is_sample: false });
const row = (r = realShape()) => ({ id: r.id, publication_status: r.publication_status, record_json: JSON.stringify(r) });
const poolFor = (rows: unknown[]) => ({ query: vi.fn().mockResolvedValue(rows) }) as unknown as QueryPool;

describe("MariaDB contract (mock pool; no production database)", () => {
  it("validates the existing resource contract", () => {
    for (const r of loadSampleRecords()) expect(parseResource(r).id).toBe(r.id);
  });
  it("uses parameters for ID lookup", async () => {
    const pool = poolFor([row()]);
    const repo = createMariaRepository(pool, "production");
    await repo.get("' OR 1=1 --");
    expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({ sql: expect.stringContaining("WHERE id = ?") }), ["' OR 1=1 --"]);
  });
  it("returns approved records and never advertises samples", async () => {
    const repo = createMariaRepository(poolFor([row()]), "production");
    expect((await repo.search({})).total).toBe(1); expect(repo.hasSampleData()).toBe(false);
  });
  it("rejects sample records, inconsistent envelopes, and invalid JSON", async () => {
    for (const rows of [[row({ ...realShape(), is_sample: true })], [{ ...row(), id: "wrong" }], [{ ...row(), record_json: "invalid" }]]) {
      await expect(createMariaRepository(poolFor(rows), "production").search({})).rejects.toThrow();
    }
  });
  it("strips extra fields and confidential location notes", async () => {
    const r = { ...loadSampleRecords().find(r => r.id === "res-safe-shelter")!, is_sample: false, private_client_name: "SECRET" };
    r.locations = r.locations.map(l => ({ ...l, notes: "CONFIDENTIAL-NOTES" }));
    const result = await createMariaRepository(poolFor([row(r)]), "production").get(r.id);
    expect(JSON.stringify(result)).not.toContain("CONFIDENTIAL-"); expect(JSON.stringify(result)).not.toContain("private_client_name");
  });
  it("fails closed beyond the bounded pilot dataset", async () => {
    await expect(createMariaRepository(poolFor(Array(10001).fill(row())), "production").search({})).rejects.toThrow(/limit/);
  });
  it("rejects dangerous URLs and invalid fields", () => {
    expect(() => parseResource({ ...realShape(), sources: [{ id: "x", name: "x", rights: "x", url: "javascript:alert(1)" }] })).toThrow();
    expect(() => parseResource({ ...realShape(), publication_status: "public" })).toThrow();
  });
  it("requires TLS for remote databases before making a connection", () => {
    expect(() => openResourcePool({ DB_HOST: "db.example.com", DB_NAME: "fc", DB_USER: "reader", DB_PASSWORD: "test" })).toThrow(/TLS/);
  });
});
