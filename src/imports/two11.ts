// 2-1-1 Colorado scraper.
//
// The public search app at search.211colorado.org is a Backbone/Rails
// application. Observed live behavior (October 2026):
//   1. GET /search returns the page with a Rails CSRF meta tag and session cookie.
//   2. POST /search (JSON, X-CSRF-Token header) with a Search model payload
//      returns JSON results. Key payload fields: term, location, coords
//      {lng, lat}, service_area, page, per_page.
//   3. Each result is a full program-site record (agency, address, phones,
//      eligibility, hours text, taxonomies) — no per-record detail call needed.
//
// This module reproduces those calls politely and maps results to drafts.
// Note: authorization to reuse 211 data is NOT documented (FC-23) — every
// record stays a draft until a human reviewer clears provenance.

import type { CategoryId, Resource } from "../domain/types.js";
import { createHttpClient, type HttpClient } from "./http.js";
import { sourceRef } from "./sources.js";
import {
  cleanEmailSafe,
  cleanPhone,
  cleanString,
  cleanUrl,
  splitList,
  stripHtml,
  summarize,
  trimZip,
} from "./normalize.js";

const ORIGIN = "https://search.211colorado.org";
const DEFAULT_TERM = "food";
const DEFAULT_LOCATION = "Denver, CO";
const DEFAULT_COORDS = { lat: 39.7392, lng: -105.0169 };
const DEFAULT_RADIUS_MILES = 15;
const RESULTS_PER_PAGE = 25; // The API returns 25 regardless of per_page.

export interface Two11Taxonomy {
  code: string;
  name: string;
  category?: string | null;
  [key: string]: unknown;
}

export interface Two11PhoneBlock {
  phone_1?: string;
  phone_2?: string;
  phone_3?: string;
  phone_hotline?: string;
  phone_toll_free?: string;
  phone_1_name?: string;
  [key: string]: unknown;
}

export interface Two11Result {
  program_site_id: number;
  agency_id: number;
  agency_number: number;
  agency_name: string;
  agency_website?: string | null;
  agency_phones?: Two11PhoneBlock | null;
  name: string;
  alternate_name?: string | null;
  description?: string | null;
  eligibility?: string | null;
  application_process?: string | null;
  documents_required?: string | null;
  hours_of_operation?: string | null;
  service_fees?: unknown;
  fee_structure_source?: string | null;
  languages?: unknown;
  status?: string | null;
  website?: string | null;
  program_website?: string | null;
  mainEmailAddress?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  postal_code?: string | null;
  location?: string | null;
  private_physical_address?: boolean | null;
  virtual_program?: boolean | null;
  wheelchair_accessibility?: string | null;
  disabilities_access?: string | null;
  coverage?: string | null;
  taxonomies?: Two11Taxonomy[];
  updated_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface Two11SearchResponse {
  results: Two11Result[];
  total_results: number;
  [key: string]: unknown;
}

/** Map source taxonomy names/categories onto FieldCompass categories. */
const TAXONOMY_CATEGORY_MAP: Record<string, CategoryId> = {
  "emergency food": "food",
  "food": "food",
  "housing/shelter": "housing-utilities",
  "housing": "housing-utilities",
  "utilities": "housing-utilities",
  "health care": "health",
  "health": "health",
  "mental health": "health",
  "child care": "children-families",
  "children/families": "children-families",
  "income support": "benefits",
  "benefits": "benefits",
  "employment": "work-education",
  "education": "work-education",
  "transportation": "transportation",
  "senior services": "aging-disability",
  "disabilities": "aging-disability",
  "legal services": "legal-safety",
};

export interface Two11ScraperOptions {
  http?: HttpClient;
  origin?: string;
  maxPages?: number;
}

interface CsrfSession {
  token: string;
  cookie: string;
}

export class Two11Scraper {
  private readonly http: HttpClient;
  private readonly origin: string;
  private readonly maxPages: number;
  private session: CsrfSession | null = null;

  constructor(options: Two11ScraperOptions = {}) {
    this.http = options.http ?? createHttpClient();
    this.origin = options.origin ?? ORIGIN;
    this.maxPages = options.maxPages ?? 40; // Hard cap: 40 pages × 25 = 1000 records.
  }

  /**
   * Bootstrap a session: load /search, capture the CSRF token and cookie.
   * Exported for tests; the CLI calls it implicitly via searchAll().
   */
  async establishSession(): Promise<void> {
    const res = await this.http.get(`${this.origin}/search`, { accept: "text/html" });
    const html = await res.text();
    const token = /name="csrf-token" content="([^"]+)"/.exec(html)?.[1] ?? null;
    const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? "";
    if (!token) throw new Error("2-1-1 search page did not expose a CSRF token");
    this.session = { token, cookie };
  }

  private headers(): Record<string, string> {
    if (!this.session) throw new Error("Session not established");
    return {
      "X-CSRF-Token": this.session.token,
      "X-Requested-With": "XMLHttpRequest",
      cookie: this.session.cookie,
    };
  }

  /** Run one search page. Exported for tests. */
  async searchPage(term: string, page: number): Promise<Two11SearchResponse> {
    if (!this.session) await this.establishSession();
    const payload = {
      term,
      location: DEFAULT_LOCATION,
      coords: { lng: DEFAULT_COORDS.lng, lat: DEFAULT_COORDS.lat },
      service_area: "colorado",
      page,
      per_page: RESULTS_PER_PAGE,
      radius: DEFAULT_RADIUS_MILES,
    };
    const res = await this.http.post(`${this.origin}/search`, payload, this.headers());
    return (await res.json()) as Two11SearchResponse;
  }

  /**
   * Search repeatedly across taxonomy-driven terms to cover the major
   * FieldCompass categories. 2-1-1 search is term-based; a single query only
   * surfaces what matches that term, so we sweep a curated term list.
   */
  async searchAll(terms: string[] = DEFAULT_TERMS): Promise<{ results: Two11Result[]; pagesFetched: number }> {
    const byId = new Map<number, Two11Result>();
    let pagesFetched = 0;
    for (const term of terms) {
      for (let page = 1; page <= this.maxPages; page++) {
        const res = await this.searchPage(term, page);
        pagesFetched++;
        for (const r of res.results ?? []) byId.set(r.program_site_id, r);
        if ((res.results ?? []).length < RESULTS_PER_PAGE) break;
      }
    }
    return { results: [...byId.values()], pagesFetched };
  }
}

/** Curated term sweep aligned with FieldCompass categories. */
export const DEFAULT_TERMS = [
  "food pantry",
  "food assistance",
  "health clinic",
  "mental health",
  "child care",
  "housing assistance",
  "rent assistance",
  "utility assistance",
  "transportation",
  "job search",
  "legal aid",
  "senior services",
  "disability services",
  "benefits enrollment",
];

function parseLanguages(value: unknown): { codes: string[] | null; interpretation: boolean } {
  if (typeof value !== "string") return { codes: null, interpretation: false };
  let interpretation = false;
  const mapped: string[] = [];
  for (const part of value.split(/[;,]/)) {
    const p = part.trim();
    if (!/^[A-Za-z][A-Za-z ()-]{1,30}$/.test(p)) continue;
    const lower = p.toLowerCase();
    if (/interpret|translator/.test(lower)) {
      interpretation = true;
      continue;
    }
    if (lower.startsWith("spanish")) mapped.push("es");
    else if (lower.startsWith("english")) mapped.push("en");
    else if (lower.startsWith("american sign")) mapped.push("asl");
    else if (p.length <= 10) mapped.push(p);
    // Longer unmapped language names are dropped rather than truncated into
    // something meaningless; reviewers can restore them from the source.
  }
  const unique = [...new Set(mapped)];
  return { codes: unique.length > 0 ? unique : null, interpretation };
}

/**
 * Parse a phone-ish value strictly. 2-1-1 phone fields sometimes contain
 * placeholders ("Visit Website") — those become null. Extensions are split
 * into notes so the value passes the phone contract.
 */
export function parsePhone(value: unknown): { value: string; ext: string | null } | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  const m = /^([+()\d .-]{3,40}?)(?:\s*(?:ext\.?|extension|x)\s*([A-Za-z0-9-]{1,10}))?\.?$/.exec(v);
  if (!m || !m[1] || !/[()\d]/.test(m[1])) return null;
  return { value: m[1].trim(), ext: m[2] ?? null };
}

function collectPhones(blocks: Array<Two11PhoneBlock | null | undefined>): { value: string; notes: string | null }[] {
  const seen = new Set<string>();
  const out: { value: string; notes: string | null }[] = [];
  for (const b of blocks) {
    for (const key of ["phone_1", "phone_hotline", "phone_toll_free", "phone_2", "phone_3"] as const) {
      const parsed = parsePhone(b?.[key]);
      if (parsed && !seen.has(parsed.value)) {
        seen.add(parsed.value);
        out.push({ value: parsed.value, notes: parsed.ext ? `Ext ${parsed.ext}` : null });
      }
    }
  }
  return out.slice(0, 5);
}

function mapCategories(taxonomies: Two11Taxonomy[] | undefined): CategoryId[] {
  const ids = new Set<CategoryId>();
  for (const t of taxonomies ?? []) {
    for (const key of [t.category, t.name]) {
      const k = key?.trim().toLowerCase();
      if (k && TAXONOMY_CATEGORY_MAP[k]) ids.add(TAXONOMY_CATEGORY_MAP[k]);
    }
  }
  if (ids.size === 0) ids.add("community");
  return [...ids].slice(0, 5);
}

function mapOperatingStatus(status: unknown): Resource["operating_status"] {
  const s = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (s === "active") return "active";
  if (s.includes("temporar")) return "temporarily_closed";
  if (s.includes("permanent") || s.includes("closed")) return "permanently_closed";
  return "unknown";
}

function mapCost(serviceFees: unknown, feeText: unknown): Resource["cost"] {
  const text = [typeof serviceFees === "string" ? serviceFees : null, typeof feeText === "string" ? feeText : null]
    .filter((s): s is string => s !== null && s.trim().length > 0)
    .join(" ");
  if (serviceFees === false) return { kind: "free", details: cleanString(typeof feeText === "string" ? feeText : null) };
  if (/free|no cost|no fee/i.test(text) && !/sliding/i.test(text)) return { kind: "free", details: text || null };
  if (/sliding/i.test(text)) return { kind: "sliding_scale", details: text };
  if (/fee|cost|charge|\$/i.test(text)) return { kind: "fee", details: text };
  return { kind: "unknown", details: text || null };
}

/**
 * Map one 2-1-1 program-site result to a FieldCompass Resource.
 * Always a draft. Confidential addresses never produce a public address
 * (T16): when the source flags private_physical_address, the location is
 * kept with address_visibility "confidential" and no address details.
 */
export function normalizeTwo11Result(result: Two11Result, fetchedAt: string): Resource {
  const source = sourceRef("co211");
  const description = stripHtml(result.description);
  const eligibility = stripHtml(result.eligibility);
  const intake = stripHtml(result.application_process);
  const documentsRaw = stripHtml(result.documents_required);
  const hours = stripHtml(result.hours_of_operation);
  const coverage = cleanString(result.coverage);
  const accessNotes = stripHtml(result.disabilities_access);
  const { codes: languages, interpretation } = parseLanguages(result.languages);

  const descriptionParts = [
    description,
    hours ? `Hours (as stated by source): ${hours}` : null,
    coverage ? `Coverage (as stated by source): ${coverage}` : null,
    interpretation ? "Interpretation available (as stated by source)." : null,
  ].filter((p): p is string => p !== null);

  const confidential = result.private_physical_address === true;
  const streetRaw = cleanString(result.address_1);
  // Sites sometimes publish placeholder street values instead of leaving it blank.
  const street = streetRaw && !/^(no physical address|none|n\/a)$/i.test(streetRaw) ? streetRaw : null;
  const zip = trimZip(result.postal_code);
  const hasAddress = !confidential && street !== null;
  const address = hasAddress
    ? {
        street: [street, cleanString(result.address_2)].filter((s): s is string => s !== null).join(", "),
        city: cleanString(result.city) ?? "",
        zip: zip ?? "",
        county: cleanString(result.county) ?? "",
      }
    : null;

  const phones = collectPhones([result.agency_phones, (result as { program_site_phones?: Two11PhoneBlock }).program_site_phones]);
  const website = cleanUrl(result.program_website) ?? cleanUrl(result.website) ?? cleanUrl(result.agency_website);
  const email = cleanEmailSafe(result.mainEmailAddress);

  const wheelchairRaw = (result.wheelchair_accessibility ?? "").trim().toLowerCase();
  const wheelchair = wheelchairRaw.startsWith("yes") ? "yes" : wheelchairRaw.startsWith("no") ? "no" : "unknown";

  const updatedAt = result.updated_at && Number.isFinite(Date.parse(result.updated_at)) ? result.updated_at : fetchedAt;

  return {
    id: `co211-ps-${result.program_site_id}`,
    organization_id: `co211-ag-${result.agency_id ?? result.agency_number}`,
    organization_name: cleanString(result.agency_name) ?? "Unknown 2-1-1 agency",
    name: cleanString(result.name) ?? `2-1-1 program site ${result.program_site_id}`,
    summary: description ? summarize(description) : `${cleanString(result.name) ?? "Community resource"} listed by 2-1-1 Colorado.`,
    description: descriptionParts.length > 0 ? descriptionParts.join("\n\n") : null,
    category_ids: mapCategories(result.taxonomies),
    keywords: (result.taxonomies ?? []).map((t) => t.name).slice(0, 30),
    service_area: { type: "counties", counties: [] }, // Free-text coverage kept in description.
    modes: [
      ...(hasAddress ? ["in_person" as const] : []),
      ...(result.virtual_program === true ? ["virtual" as const] : []),
      ...(phones.length > 0 ? ["phone" as const] : []),
    ].slice(0, 3) as Resource["modes"],
    locations: [
      {
        id: `co211-ps-${result.program_site_id}-l1`,
        access: "physical",
        address_visibility: confidential ? "confidential" : "public",
        address,
        notes: accessNotes,
      },
    ],
    contacts: [
      ...phones.map((p) => ({ channel: "phone" as const, value: p.value, label: null, notes: p.notes, source_id: source.id })),
      website ? { channel: "website" as const, value: website, label: null, notes: null, source_id: source.id } : null,
      email ? { channel: "email" as const, value: email, label: null, notes: null, source_id: source.id } : null,
    ].filter((c): c is NonNullable<typeof c> => c !== null),
    eligibility,
    cost: mapCost(result.service_fees, result.fee_structure_source),
    documents: documentsRaw ? documentsRaw.split(/\n|•|-\s/).map((d) => d.trim()).filter((d) => d.length > 2).slice(0, 100) : null,
    intake,
    languages,
    accessibility: { wheelchair, notes: accessNotes },
    schedule: null, // Hours arrive as free text; parsing them into structured schedules is a reviewer task.
    operating_status: mapOperatingStatus(result.status),
    sources: [source],
    source_updated_at: updatedAt,
    fetched_at: fetchedAt,
    reviewed_at: null,
    record_version: 1,
    publication_status: "draft",
    is_sample: false,
  };
}
