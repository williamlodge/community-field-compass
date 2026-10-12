import { z } from "zod";
import { CATEGORIES } from "../domain/categories.js";
import type { Resource } from "../domain/types.js";

const text = z.string().max(12000);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const optional = text.nullable().optional();
const date = z.string().refine(v => Number.isFinite(Date.parse(v)), "Invalid date");
const url = z.string().url().refine(v => /^https?:\/\//i.test(v), "HTTP(S) URL required");
const hours = z.object({ opens: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), closes: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) });

// Object schemas strip unrecognized properties, so upstream private fields do
// not silently leak into the public API. Confidential locations lose all notes.
const schema = z.object({
  id, organization_id: id, organization_name: text, name: text, summary: text, description: optional,
  category_ids: z.array(z.string().refine(v => CATEGORIES.some(c => c.id === v))).min(1).max(10),
  keywords: z.array(text).max(100),
  service_area: z.discriminatedUnion("type", [
    z.object({ type: z.literal("statewide") }), z.object({ type: z.literal("remote") }),
    z.object({ type: z.literal("counties"), counties: z.array(text).max(64) }),
    z.object({ type: z.literal("zips"), zips: z.array(z.string().regex(/^\d{5}$/)).max(2000) }),
  ]),
  modes: z.array(z.enum(["in_person", "virtual", "phone"])).max(3),
  locations: z.array(z.object({ id, access: z.enum(["physical", "virtual"]), address_visibility: z.enum(["public", "confidential"]),
    address: z.object({ street: text, city: text, zip: text, county: text }).nullable().optional(), notes: optional,
  })).max(100),
  contacts: z.array(z.object({ channel: z.enum(["phone", "website", "email", "text"]), value: text, label: optional, notes: optional, source_id: id })).max(50),
  eligibility: text.nullable(), cost: z.object({ kind: z.enum(["free", "sliding_scale", "fee", "unknown"]), details: optional }),
  documents: z.array(text).max(100).nullable(), intake: text.nullable(), languages: z.array(z.string().max(10)).max(100).nullable(),
  accessibility: z.object({ wheelchair: z.enum(["yes", "no", "unknown"]), notes: optional }),
  schedule: z.object({ time_zone: z.string().refine(v => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }),
    regular: z.array(hours.extend({ day: z.number().int().min(0).max(6) })).max(100),
    exceptions: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), closed: z.boolean(), hours: hours.nullable().optional(), label: optional })).max(500),
    intake_cutoff_note: optional, source_id: id,
  }).nullable(),
  operating_status: z.enum(["active", "temporarily_closed", "permanently_closed", "unknown"]),
  sources: z.array(z.object({ id, name: text, url, rights: text })).min(1).max(50),
  source_updated_at: date, fetched_at: date, reviewed_at: date.nullable(),
  record_version: z.number().int().positive(), publication_status: z.enum(["draft", "published", "withdrawn"]), is_sample: z.boolean(),
});

export function parseResource(value: unknown): Resource {
  const parsed = schema.safeParse(value);
  // Never include validation input or values in errors/logs.
  if (!parsed.success) throw new Error("Resource record failed validation");
  const r = parsed.data as Resource;
  const sourceIds = new Set(r.sources.map(s => s.id));
  if (r.contacts.some(c => !sourceIds.has(c.source_id)) || (r.schedule && !sourceIds.has(r.schedule.source_id))) throw new Error("Unknown resource source");
  for (const c of r.contacts) {
    if (c.channel === "website" && !url.safeParse(c.value).success) throw new Error("Invalid contact URL");
    if ((c.channel === "phone" || c.channel === "text") && !/^[+\d() .-]{3,40}$/.test(c.value)) throw new Error("Invalid phone contact");
    if (c.channel === "email" && !z.string().email().safeParse(c.value).success) throw new Error("Invalid email contact");
  }
  return r;
}
