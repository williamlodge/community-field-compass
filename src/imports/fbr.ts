// Food Bank of the Rockies scraper.
//
// The source's own "Find Food" page embeds the Vivery/AccessFood locator
// widget, which reads a public JSON API. The widget authenticates with the
// map GUID as `X-Vivery-Map-Token`; no private credentials are involved.
// We call the same endpoints the widget calls, politely and with hard caps.

import type { Resource } from "../domain/types.js";
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
  COLORADO_TZ,
} from "./normalize.js";

const API_BASE = "https://api.accessfood.org/api/MapInformation/";
/** Map GUID published in the widget embed on https://foodbankrockies.org/find-food/ */
const DEFAULT_MAP_TOKEN = "422a8e7c-472d-474f-8fb6-00654b7b887d";
const DEFAULT_CENTER = { lat: 39.7392, lng: -105.0169 }; // Denver
const DEFAULT_RADIUS_MILES = 200; // Covers the Rockies' CO/WY service footprint.
const PAGE_SIZE = 20; // The API returns 20 per page.

export interface FbrLocation {
  locationId: number;
  organizationId: number;
  locationName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website: string;
  aboutUs: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  foodPrograms: string;
  foodServiceTypes: string;
  foodOfferings: string;
  serviceLanguages: string;
  locationFeatures: string;
  serviceArea: string;
  inNetWorkInd: boolean;
  timeZoneName: string;
  networkAffiliations: string;
  [key: string]: unknown;
}

interface FbrSearchResponse {
  item1: FbrLocation[];
  /** Current page. */
  item3: number;
  /** Total pages. */
  item4: number;
  /** Total results. */
  item5: number;
  [key: string]: unknown;
}

interface FbrRegionMap {
  regionId: number;
  regionMapId: number;
  outOfNetworkNote: string | null;
  [key: string]: unknown;
}

export interface FbrScraperOptions {
  mapToken?: string;
  http?: HttpClient;
  apiBase?: string;
  maxPages?: number;
  center?: { lat: number; lng: number };
  radiusMiles?: number;
}

export class FbrScraper {
  private readonly http: HttpClient;
  private readonly mapToken: string;
  private readonly apiBase: string;
  private readonly maxPages: number;
  private readonly center: { lat: number; lng: number };
  private readonly radiusMiles: number;

  constructor(options: FbrScraperOptions = {}) {
    this.http = options.http ?? createHttpClient();
    this.mapToken = options.mapToken ?? DEFAULT_MAP_TOKEN;
    this.apiBase = options.apiBase ?? API_BASE;
    this.maxPages = options.maxPages ?? 40; // Hard cap: 40 pages × 20 = 800 records.
    this.center = options.center ?? DEFAULT_CENTER;
    this.radiusMiles = options.radiusMiles ?? DEFAULT_RADIUS_MILES;
  }

  private headers(): Record<string, string> {
    return { "X-Vivery-Map-Token": this.mapToken };
  }

  async fetchRegionMap(): Promise<FbrRegionMap> {
    const res = await this.http.get(`${this.apiBase}RegionMap?isMapV2=true`, this.headers());
    return (await res.json()) as FbrRegionMap;
  }

  /** Fetch one page (1-based). Exported for tests. */
  async fetchLocationPage(region: FbrRegionMap, page: number): Promise<FbrSearchResponse> {
    const q = new URLSearchParams({
      radius: String(this.radiusMiles),
      lat: String(this.center.lat),
      lng: String(this.center.lng),
      regionId: String(region.regionId),
      regionMapId: String(region.regionMapId),
      showOutOfNetwork: "1",
      page: String(page),
      includeLocationOperatingHours: "false",
      isMapV2: "true",
    });
    const res = await this.http.get(`${this.apiBase}LocationSearch?${q}`, this.headers());
    return (await res.json()) as FbrSearchResponse;
  }

  /** Fetch all locations, page by page, up to the hard cap. */
  async fetchAllLocations(): Promise<{ locations: FbrLocation[]; region: FbrRegionMap; pagesFetched: number }> {
    const region = await this.fetchRegionMap();
    const first = await this.fetchLocationPage(region, 1);
    const locations = [...first.item1];
    const totalPages = Math.min(Math.max(first.item4 ?? 1, 1), this.maxPages);
    for (let page = 2; page <= totalPages && locations.length < first.item5; page++) {
      const next = await this.fetchLocationPage(region, page);
      if (next.item1.length === 0) break;
      locations.push(...next.item1);
    }
    return { locations, region, pagesFetched: totalPages };
  }
}

/**
 * Map one FBR directory location to a FieldCompass Resource.
 * The result is always a draft — scraping never publishes (brief §3).
 */
export function normalizeFbrLocation(
  loc: FbrLocation,
  fetchedAt: string,
  region?: FbrRegionMap,
): Resource {
  const source = sourceRef("fbr");
  const programs = splitList(loc.foodPrograms);
  const serviceTypes = splitList(loc.foodServiceTypes);
  const offerings = splitList(loc.foodOfferings);
  const languages = splitList(loc.serviceLanguages);
  const features = splitList(loc.locationFeatures).map((f) => f.split("|")[0]!.trim());
  const about = stripHtml(loc.aboutUs);
  const coverage = cleanString(loc.serviceArea);
  const outOfNetwork = loc.inNetWorkInd === false;
  const outOfNetworkNote = outOfNetwork ? cleanString(region?.outOfNetworkNote) : null;

  const city = cleanString(loc.city) ?? "Colorado";
  const descriptionParts = [
    about,
    coverage ? `Coverage (as stated by source): ${coverage}` : null,
    outOfNetworkNote ? `Note: ${outOfNetworkNote}` : null,
  ].filter((p): p is string => p !== null);

  const phone = cleanPhone(loc.contactPhone) ?? cleanPhone(loc.phone);
  const website = cleanUrl(loc.website);
  const email = cleanEmailSafe(loc.contactEmail);
  const zip = trimZip(loc.zipCode);

  const address = cleanString(loc.address1)
    ? {
        street: [cleanString(loc.address1), cleanString(loc.address2)].filter((s): s is string => s !== null).join(", "),
        city,
        zip: zip ?? "",
        county: "", // The FBR directory does not publish county; left blank rather than guessed.
      }
    : null;

  return {
    id: `fbr-loc-${loc.locationId}`,
    organization_id: `fbr-org-${loc.organizationId}`,
    organization_name: "Food Bank of the Rockies (Find Food directory)",
    name: cleanString(loc.locationName) ?? `FBR location ${loc.locationId}`,
    summary:
      programs.length > 0
        ? `${programs.join(", ")} in ${city}.`
        : `Community food location in ${city}, listed in the Food Bank of the Rockies Find Food directory.`,
    description: descriptionParts.length > 0 ? descriptionParts.join("\n\n") : null,
    category_ids: ["food"],
    keywords: [...new Set([...programs, ...serviceTypes, ...offerings])].slice(0, 30),
    service_area: coverage
      ? { type: "counties", counties: [] } // Free-text coverage kept in description; no structured mapping assumed.
      : { type: "counties", counties: [] },
    modes: address ? ["in_person"] : ["phone"],
    locations: [
      {
        id: `fbr-loc-${loc.locationId}-l1`,
        access: "physical",
        address_visibility: "public",
        address,
        notes: features.length > 0 ? `Features listed by source: ${features.join(", ")}` : null,
      },
    ],
    contacts: [
      phone ? { channel: "phone" as const, value: phone, label: cleanString(loc.contactName) ?? null, notes: null, source_id: source.id } : null,
      website ? { channel: "website" as const, value: website, label: null, notes: null, source_id: source.id } : null,
      email ? { channel: "email" as const, value: email, label: null, notes: null, source_id: source.id } : null,
    ].filter((c): c is NonNullable<typeof c> => c !== null),
    eligibility: null, // Not stated per-location in the directory.
    cost: { kind: "unknown", details: null }, // Never assume "free" without a source statement.
    documents: null,
    intake: null,
    languages: languages.length > 0 ? languages.map((l) => l.slice(0, 10)) : null,
    accessibility: { wheelchair: "unknown", notes: null },
    schedule: null, // Hours are not exposed per-location in the list payload; left to reviewers.
    operating_status: "active", // Listed in the source's live directory at fetch time.
    sources: [source],
    source_updated_at: fetchedAt, // The directory does not publish per-record updated timestamps.
    fetched_at: fetchedAt,
    reviewed_at: null,
    record_version: 1,
    publication_status: "draft",
    is_sample: false,
  };
}
