// Resource repository. In-memory for the vertical slice; the interface is what
// a PostgreSQL/PostGIS implementation will satisfy in W03.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createSearch, type SearchFilters, type SearchResult } from "../domain/search.js";
import type { Resource } from "../domain/types.js";
import type { AppEnv } from "../config.js";

export type Lookup =
  | { status: "published"; resource: Resource }
  | { status: "withdrawn"; id: string; record_version: number }
  | { status: "not_found" };

export interface ResourceRepository {
  search(filters: SearchFilters): SearchResult;
  get(id: string): Lookup;
  /** True when any loaded record is fixture data. */
  hasSampleData(): boolean;
}

/**
 * Public projection: strips confidential addresses (T16). Everything that
 * leaves the server — pages, API, future AI tools, exports — goes through this.
 */
export function toPublic(r: Resource): Resource {
  return {
    ...r,
    locations: r.locations.map((l) =>
      l.address_visibility === "confidential" ? { ...l, address: null } : l,
    ),
  };
}

export function createMemoryRepository(records: Resource[], env: AppEnv): ResourceRepository {
  if (env === "production" && records.some((r) => r.is_sample)) {
    throw new Error("Refusing to serve sample fixture records in production.");
  }
  const published = records.filter((r) => r.publication_status === "published").map(toPublic);
  const byId = new Map(records.map((r) => [r.id, r]));
  const search = createSearch(published);

  return {
    search,
    get(id) {
      const r = byId.get(id);
      if (!r || r.publication_status === "draft") return { status: "not_found" };
      if (r.publication_status === "withdrawn") return { status: "withdrawn", id: r.id, record_version: r.record_version };
      return { status: "published", resource: toPublic(r) };
    },
    hasSampleData: () => published.some((r) => r.is_sample),
  };
}

export function loadSampleRecords(): Resource[] {
  const path = fileURLToPath(new URL("./fixtures/resources.sample.json", import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")) as Resource[];
}
