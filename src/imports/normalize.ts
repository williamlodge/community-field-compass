// Shared normalization helpers. Rule: never invent facts. Anything the source
// does not state stays null / "unknown" / empty so reviewers see the gap
// instead of an inferred answer (acceptance T03, brief §1).

/** Strip HTML tags and collapse whitespace. Returns null when nothing remains. */
export function stripHtml(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h\d)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return text.length > 0 ? text : null;
}

/** Split source list fields (" English;Spanish ", "a|b") into clean items. */
export function splitList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[|;]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v !== ",")
    .slice(0, 100);
}

/** Normalize a phone-ish string; null when empty. */
export function cleanPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length >= 3 ? v : null;
}

/** Normalize a website value to a full http(s) URL; null when unusable. */
export function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (v.length === 0) return null;
  if (/^https?:\/\//i.test(v)) return v;
  // 211 often stores bare domains; keep https by default.
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?([\/?#].*)?$/.test(v)) return `https://${v}`;
  return null;
}

/** Basic email sanity check; null when invalid. */
export function cleanEmailSafe(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : null;
}

export function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.replace(/\s+/g, " ").trim();
  return v.length > 0 ? v : null;
}

/** First sentence or first ~240 chars of a longer text, for summaries. */
export function summarize(text: string): string {
  const m = /^.{10,240}?(?<=[.!?])\s/.exec(text);
  if (m?.[0]) return m[0].trim();
  return text.length <= 280 ? text : `${text.slice(0, 277).trimEnd()}…`;
}

export function trimZip(value: unknown): string | null {
  const m = typeof value === "string" ? /^\s*(\d{5})/.exec(value) : null;
  return m ? m[1]! : null;
}

export const COLORADO_TZ = "America/Denver";
