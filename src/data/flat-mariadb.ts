import { z } from "zod";
import type { AppEnv } from "../config.js";
import type { CategoryId, Resource } from "../domain/types.js";
import { createMemoryRepository, toPublic, type ResourceRepository } from "./repository.js";
import type { QueryPool } from "./mariadb.js";
import { parseResource } from "./schema.js";

type FlatRow = {
  id: number; name: string; category: string; description: string | null;
  address: string | null; city: string; state: string; zip: string | null;
  phone: string | null; email: string | null; website: string | null;
  hours: string | null; eligibility: string | null; services: string | null;
  cost: string; languages: string | null; source_name: string;
  source_url: string | null; verified_at: Date | null; active: boolean;
  updated_at: Date;
};

const FIELDS = "id, name, category, description, address, city, state, zip, phone, email, website, hours, eligibility, services, cost, languages, source_name, source_url, verified_at, active, updated_at";
const CATEGORY: Record<string, CategoryId> = {
  shelter: "housing-utilities", food: "food", health: "health", mental_health: "health",
  crisis: "health", legal: "legal-safety", employment: "work-education",
  benefits: "benefits", hygiene: "community", education: "work-education",
  transportation: "transportation", other: "community",
};
const SOURCE_URL: Record<string, string> = {
  "211 Colorado": "https://search.211colorado.org/",
  "Food Bank of the Rockies": "https://www.foodbankrockies.org/",
};

function httpUrl(value: string | null): string | null {
  if (!value) return null;
  try { return /^https?:$/.test(new URL(value).protocol) ? value : null; }
  catch { return null; }
}

function keywords(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 100) : [];
  } catch { return []; }
}

export function mapFlatResource(row: FlatRow): Resource {
  const id = `co-${row.id}`;
  const sourceId = "source";
  const site = httpUrl(row.website);
  const sourceUrl = httpUrl(row.source_url) ?? SOURCE_URL[row.source_name];
  if (!sourceUrl) throw new Error("Resource source URL unavailable");
  const phone = row.phone && /^[+\d() .-]{3,40}$/.test(row.phone) ? row.phone : null;
  const email = row.email && z.email().safeParse(row.email).success ? row.email : null;
  const address = row.address?.trim() ?? "";
  const confidential = /confidential|undisclosed|private location|withheld|call for (address|location)|safe ?house/i.test(address);
  const postalBox = /\bp\.?o\.? box\b/i.test(address);
  const publicAddress = address && !confidential && !postalBox;
  const description = row.description?.trim() || null;
  const summary = description && description.length > 160
    ? `${description.slice(0, 160).replace(/\s+\S*$/, "").trimEnd()}…` : description;
  const langs = [row.languages && /\benglish\b/i.test(row.languages) ? "en" : "", row.languages && /\bspanish\b|español/i.test(row.languages) ? "es" : ""].filter(Boolean);
  const updatedAt = new Date(row.updated_at).toISOString();
  return parseResource({
    id, organization_id: `org-${row.id}`, organization_name: row.name,
    name: row.name, summary: summary ?? "Details have not been supplied.",
    description, category_ids: [CATEGORY[row.category] ?? "community"], keywords: keywords(row.services),
    service_area: { type: "unknown" }, modes: [],
    locations: address && !postalBox ? [{ id: `loc-${row.id}`, access: "physical", address_visibility: confidential ? "confidential" : "public",
      address: publicAddress ? { street: address, city: row.city, zip: row.zip ?? "", county: "" } : null }] : [],
    contacts: [
      ...(phone ? [{ channel: "phone", value: phone, source_id: sourceId }] : []),
      ...(site ? [{ channel: "website", value: site, source_id: sourceId }] : []),
      ...(email ? [{ channel: "email", value: email, source_id: sourceId }] : []),
    ],
    eligibility: row.eligibility || null,
    cost: { kind: row.cost === "paid" ? "fee" : row.cost === "sliding" ? "sliding_scale" : row.cost === "free" ? "free" : "unknown" },
    documents: null, intake: null, languages: langs.length ? langs : null,
    accessibility: { wheelchair: "unknown" }, schedule: null,
    published_hours_text: row.hours || null, operating_status: "unknown",
    sources: [{ id: sourceId, name: row.source_name, url: sourceUrl, rights: "Reuse terms not recorded" }],
    source_updated_at: null, fetched_at: updatedAt,
    reviewed_at: row.verified_at ? new Date(row.verified_at).toISOString() : null,
    record_version: Math.max(1, Math.floor(Date.parse(updatedAt) / 1000)),
    publication_status: row.active ? "published" : "withdrawn", is_sample: false,
  });
}

/** Read-only bridge from the existing co_resources schema to the public directory. */
export function createFlatMariaRepository(pool: QueryPool, env: AppEnv): ResourceRepository {
  let cache: ReturnType<typeof createMemoryRepository> | null = null;
  let cachedAt = 0;
  async function snapshot() {
    if (cache && Date.now() - cachedAt < 60_000) return cache;
    const rows = await pool.query({ sql: `SELECT ${FIELDS} FROM resources WHERE active = 1 AND source_name <> 'seed' AND state = 'CO' ORDER BY id LIMIT 10001`, timeout: 10000 }) as FlatRow[];
    if (rows.length > 10000) throw new Error("Directory limit exceeded; indexed search required");
    let invalid = 0;
    const records = rows.flatMap(row => {
      try { return [mapFlatResource(row)]; }
      catch { invalid++; return []; }
    });
    if (invalid) console.warn(`Skipped ${invalid} invalid public resource rows`);
    cache = createMemoryRepository(records, env);
    cachedAt = Date.now();
    return cache;
  }
  return {
    hasSampleData: () => false,
    async search(filters) { return (await snapshot()).search(filters); },
    async get(id) {
      if (!/^co-[1-9]\d{0,9}$/.test(id)) return { status: "not_found" };
      const rows = await pool.query({ sql: `SELECT ${FIELDS} FROM resources WHERE id = ? AND source_name <> 'seed' AND state = 'CO' LIMIT 1`, timeout: 5000 }, [Number(id.slice(3))]) as FlatRow[];
      if (!rows.length) return { status: "not_found" };
      const row = rows[0]!;
      if (!row.active) return { status: "withdrawn", id, record_version: Math.max(1, Math.floor(new Date(row.updated_at).getTime() / 1000)) };
      try { return { status: "published", resource: toPublic(mapFlatResource(row)) }; }
      catch { return { status: "not_found" }; }
    },
  };
}
