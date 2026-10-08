// Resource record contract — see docs/FieldCompass-build-handoff.md §4.
// Unknown values are represented explicitly with `null` or "unknown" so the UI
// never infers a favorable answer (acceptance test T03).

export type CategoryId =
  | "food"
  | "housing-utilities"
  | "health"
  | "children-families"
  | "benefits"
  | "work-education"
  | "transportation"
  | "aging-disability"
  | "legal-safety"
  | "community";

export type PublicationStatus = "draft" | "published" | "withdrawn";
export type OperatingStatus = "active" | "temporarily_closed" | "permanently_closed" | "unknown";

/** Where a service is offered. Independent of where its office sits (FC-01, T02). */
export type ServiceArea =
  | { type: "statewide" }
  | { type: "remote" }
  | { type: "counties"; counties: string[] }
  | { type: "zips"; zips: string[] };

export type AccessMode = "in_person" | "virtual" | "phone";

export interface Location {
  id: string;
  access: "physical" | "virtual";
  /** "confidential" addresses must never leave the server (T16). */
  address_visibility: "public" | "confidential";
  address?: { street: string; city: string; zip: string; county: string } | null;
  notes?: string | null;
}

export interface Contact {
  channel: "phone" | "website" | "email" | "text";
  value: string;
  label?: string | null;
  notes?: string | null;
  source_id: string;
}

export interface DayHours {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** "HH:MM" 24h local time. If closes <= opens the period runs past midnight. */
  opens: string;
  closes: string;
}

export interface ScheduleException {
  /** ISO date "YYYY-MM-DD" in the schedule's time zone. */
  date: string;
  closed: boolean;
  hours?: { opens: string; closes: string } | null;
  label?: string | null;
}

export interface Schedule {
  time_zone: string;
  regular: DayHours[];
  exceptions: ScheduleException[];
  intake_cutoff_note?: string | null;
  source_id: string;
}

export type Tristate = "yes" | "no" | "unknown";

export interface Accessibility {
  wheelchair: Tristate;
  notes?: string | null;
}

export interface Cost {
  kind: "free" | "sliding_scale" | "fee" | "unknown";
  details?: string | null;
}

export interface SourceRef {
  id: string;
  name: string;
  url: string;
  /** Rights and attribution requirements from the source agreement (FC-23). */
  rights: string;
}

export interface Resource {
  id: string;
  organization_id: string;
  organization_name: string;
  name: string;
  summary: string;
  description?: string | null;
  category_ids: CategoryId[];
  keywords: string[];
  service_area: ServiceArea;
  modes: AccessMode[];
  locations: Location[];
  contacts: Contact[];
  /** null = not published by the source. */
  eligibility: string | null;
  cost: Cost;
  documents: string[] | null;
  intake: string | null;
  /** ISO 639-1 codes, or null when the source does not say. */
  languages: string[] | null;
  accessibility: Accessibility;
  schedule: Schedule | null;
  operating_status: OperatingStatus;
  sources: SourceRef[];
  source_updated_at: string;
  fetched_at: string;
  reviewed_at: string | null;
  record_version: number;
  publication_status: PublicationStatus;
  /** Marks staged sample/fixture records so they can never ship to production. */
  is_sample: boolean;
}

/** What the public API and pages may see: confidential addresses removed. */
export type PublicResource = Omit<Resource, "publication_status" | "is_sample"> & {
  is_sample: boolean;
};
