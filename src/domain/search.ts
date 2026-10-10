// Deterministic directory search (FC-02 – FC-04, FC-07). Works without AI.

import { CATEGORIES } from "./categories.js";
import { countiesForZip, type ResolvedPlace } from "./geography.js";
import type { AccessMode, CategoryId, Resource } from "./types.js";

export interface SearchFilters {
  q?: string;
  place?: ResolvedPlace | null;
  category?: CategoryId;
  language?: string;
  free?: boolean;
  mode?: AccessMode;
  wheelchair?: boolean;
}

export type FilterKey = "place" | "category" | "language" | "free" | "mode" | "wheelchair";

export interface MatchReason {
  kind: "area" | "category" | "text" | "language" | "free" | "mode" | "wheelchair";
  /** For area: which county or "statewide"/"remote". */
  detail?: string;
}

export interface SearchHit {
  resource: Resource;
  score: number;
  reasons: MatchReason[];
  /** Filters this record could not confirm because the source does not say (FC-03). */
  unconfirmed: FilterKey[];
}

export interface Relaxation {
  /** "q" means: the same filters with a different or empty search phrase. */
  filter: FilterKey | "q";
  count: number;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  /** When no hits: which single filter removal would produce results. */
  relaxations: Relaxation[];
  /** Words recognized as categories, synonyms, or fuzzy matches. */
  interpretedCategories: CategoryId[];
}

// Plain-language synonyms → canonical tokens. Accent-free, lowercase.
const SYNONYMS: Record<string, string> = {
  daycare: "childcare",
  "day care": "childcare",
  "child care": "childcare",
  babysitting: "childcare",
  guarderia: "childcare",
  "light bill": "utilities",
  "electric bill": "utilities",
  "power bill": "utilities",
  "gas bill": "utilities",
  "heating bill": "utilities",
  "water bill": "utilities",
  shutoff: "utilities",
  "shut off": "utilities",
  energy: "utilities",
  luz: "utilities",
  groceries: "food",
  pantry: "food",
  comida: "food",
  "food bank": "food",
  ride: "transportation",
  rides: "transportation",
  paratransit: "transportation",
  transporte: "transportation",
};

const STOPWORDS = new Set([
  "i", "a", "an", "the", "and", "or", "for", "to", "of", "in", "on", "my", "me", "need", "help",
  "with", "find", "looking", "near", "some", "get", "want", "is", "it", "at", "by", "can",
  "necesito", "ayuda", "con", "para", "de", "la", "el", "los", "las", "un", "una", "en", "mi",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(q: string): string[] {
  let text = normalize(q);
  for (const [phrase, canon] of Object.entries(SYNONYMS)) {
    if (phrase.includes(" ")) text = text.replace(new RegExp(`\\b${phrase}\\b`, "g"), canon);
  }
  return text
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t))
    .map((t) => SYNONYMS[t] ?? t);
}

/** Bounded Levenshtein: returns early once distance exceeds max. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

function fuzzyEquals(token: string, term: string): boolean {
  if (token === term) return true;
  if (token.length >= 4 && term.startsWith(token)) return true;
  const max = token.length >= 8 ? 2 : token.length >= 5 ? 1 : 0;
  return max > 0 && editDistance(token, term, max) <= max;
}

function categoriesForToken(token: string): CategoryId[] {
  const out: CategoryId[] = [];
  for (const c of CATEGORIES) {
    if (c.terms.some((t) => fuzzyEquals(token, t))) out.push(c.id);
  }
  return out;
}

interface Indexed {
  resource: Resource;
  nameTerms: string[];
  bodyTerms: string[];
}

function indexResource(r: Resource): Indexed {
  return {
    resource: r,
    nameTerms: tokenize(`${r.name} ${r.organization_name}`),
    bodyTerms: tokenize(`${r.summary} ${r.description ?? ""} ${r.keywords.join(" ")}`),
  };
}

/**
 * Match a service area (not an office address) against the person's place.
 * Returns the matched county/ZIP/"statewide"/"remote", "unknown" when a
 * ZIP-defined area overlaps a city or county but can't be confirmed, or null.
 */
function areaMatch(r: Resource, place: ResolvedPlace): string | null {
  const a = r.service_area;
  if (a.type === "statewide") return "statewide";
  if (a.type === "remote") return "remote";
  if (a.type === "counties") return place.counties.find((c) => a.counties.includes(c)) ?? null;
  if (a.type === "zips") {
    if (place.zip) return a.zips.includes(place.zip) ? place.zip : null;
    const overlaps = a.zips.some((z) => countiesForZip(z).some((c) => place.counties.includes(c)));
    return overlaps ? "unknown" : null;
  }
  return null;
}

type FilterOutcome = "match" | "unknown" | "fail";

function checkFilter(r: Resource, key: FilterKey, f: SearchFilters): FilterOutcome {
  switch (key) {
    case "place": {
      if (!f.place) return "match";
      const area = areaMatch(r, f.place);
      return area === "unknown" ? "unknown" : area ? "match" : "fail";
    }
    case "category":
      return !f.category || r.category_ids.includes(f.category) ? "match" : "fail";
    case "language":
      if (!f.language) return "match";
      if (r.languages === null) return "unknown";
      return r.languages.includes(f.language) ? "match" : "fail";
    case "free":
      if (!f.free) return "match";
      if (r.cost.kind === "unknown") return "unknown";
      return r.cost.kind === "free" ? "match" : "fail";
    case "mode":
      return !f.mode || r.modes.includes(f.mode) ? "match" : "fail";
    case "wheelchair":
      if (!f.wheelchair) return "match";
      if (r.accessibility.wheelchair === "unknown") return "unknown";
      return r.accessibility.wheelchair === "yes" ? "match" : "fail";
  }
}

const FILTER_KEYS: FilterKey[] = ["place", "category", "language", "free", "mode", "wheelchair"];

function activeFilters(f: SearchFilters): FilterKey[] {
  return FILTER_KEYS.filter((k) => {
    if (k === "place") return !!f.place;
    return !!f[k];
  });
}

function runSearch(index: Indexed[], f: SearchFilters): { hits: SearchHit[]; cats: CategoryId[] } {
  const tokens = f.q ? tokenize(f.q) : [];
  const cats = [...new Set(tokens.flatMap(categoriesForToken))];
  const hits: SearchHit[] = [];

  for (const item of index) {
    const r = item.resource;
    if (r.operating_status === "permanently_closed") continue;

    const unconfirmed: FilterKey[] = [];
    let failed = false;
    for (const key of activeFilters(f)) {
      const outcome = checkFilter(r, key, f);
      if (outcome === "fail") failed = true;
      if (outcome === "unknown") unconfirmed.push(key);
    }
    if (failed) continue;

    const reasons: MatchReason[] = [];
    let score = 0;

    if (tokens.length > 0) {
      let matched = 0;
      for (const tok of tokens) {
        const inName = item.nameTerms.some((t) => fuzzyEquals(tok, t));
        const inBody = item.bodyTerms.some((t) => fuzzyEquals(tok, t));
        const inCat = categoriesForToken(tok).some((c) => r.category_ids.includes(c));
        if (inName) score += 5;
        if (inBody) score += 2;
        // A broad category ("housing & utilities") boosts ranking but is not
        // enough on its own: the record's own text must mention the need.
        if (inCat && (inName || inBody)) score += 3;
        if (inName || inBody) matched++;
      }
      // Require most of the meaningful words to match something.
      if (matched === 0 || matched < Math.ceil(tokens.length / 2)) continue;
      score += (matched / tokens.length) * 4;
      reasons.push({ kind: "text" });
      if (cats.some((c) => r.category_ids.includes(c))) reasons.push({ kind: "category" });
    }

    if (f.place && !unconfirmed.includes("place")) {
      const area = areaMatch(r, f.place)!;
      reasons.push({ kind: "area", detail: area });
      // Documented local coverage ranks above statewide/remote coverage.
      score += area === "statewide" || area === "remote" ? 1 : 3;
    }
    if (f.category) reasons.push({ kind: "category" });
    if (f.language && !unconfirmed.includes("language")) reasons.push({ kind: "language", detail: f.language });
    if (f.free && !unconfirmed.includes("free")) reasons.push({ kind: "free" });
    if (f.mode) reasons.push({ kind: "mode", detail: f.mode });
    if (f.wheelchair && !unconfirmed.includes("wheelchair")) reasons.push({ kind: "wheelchair" });

    // Information quality: incomplete records rank lower but are not excluded (FC-04).
    score -= unconfirmed.length * 2;
    if (r.reviewed_at) score += 0.5;
    if (r.operating_status === "temporarily_closed") score -= 3;

    hits.push({ resource: r, score, reasons: dedupe(reasons), unconfirmed });
  }

  hits.sort((a, b) => b.score - a.score || a.resource.name.localeCompare(b.resource.name));
  return { hits, cats };
}

function dedupe(reasons: MatchReason[]): MatchReason[] {
  const seen = new Set<string>();
  return reasons.filter((r) => {
    const k = `${r.kind}:${r.detail ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function createSearch(resources: Resource[]) {
  const index = resources.map(indexResource);
  return function search(filters: SearchFilters): SearchResult {
    const { hits, cats } = runSearch(index, filters);
    const relaxations: Relaxation[] = [];
    if (hits.length === 0) {
      // FC-07: say which constraint removed the results; never invent providers.
      for (const key of activeFilters(filters)) {
        const relaxed = { ...filters, [key]: undefined };
        const count = runSearch(index, relaxed).hits.length;
        if (count > 0) relaxations.push({ filter: key, count });
      }
      if (filters.q) {
        const count = runSearch(index, { ...filters, q: undefined }).hits.length;
        if (count > 0) relaxations.push({ filter: "q", count });
      }
    }
    return { hits, total: hits.length, relaxations, interpretedCategories: cats };
  };
}
