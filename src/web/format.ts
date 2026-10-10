import { languageName, t, type Lang } from "../i18n/index.js";
import { formatTime, hoursStatus } from "../domain/schedule.js";
import type { MatchReason } from "../domain/search.js";
import type { Resource } from "../domain/types.js";
import { html, type SafeHtml } from "./html.js";
import { icon } from "./icons.js";

export const locale = (lang: Lang) => (lang === "es" ? "es-US" : "en-US");

export function formatDate(lang: Lang, iso: string): string {
  return new Intl.DateTimeFormat(locale(lang), { dateStyle: "medium", timeZone: "America/Denver" }).format(new Date(iso));
}

function list(lang: Lang, items: string[]): string {
  return new Intl.ListFormat(locale(lang), { type: "conjunction" }).format(items);
}

export function areaText(lang: Lang, r: Resource): string {
  const a = r.service_area;
  if (a.type === "statewide") return t(lang, "area.statewide");
  if (a.type === "remote") return t(lang, "area.remote");
  if (a.type === "counties") return t(lang, a.counties.length > 1 ? "area.countiesPlural" : "area.counties", { list: list(lang, a.counties) });
  return t(lang, "area.zips", { list: a.zips.join(", ") });
}

export function languagesText(lang: Lang, codes: string[]): string {
  return list(lang, codes.map((c) => languageName(lang, c)));
}

export function reasonText(lang: Lang, r: MatchReason): string | null {
  switch (r.kind) {
    case "area":
      if (r.detail === "statewide") return t(lang, "reason.area.statewide");
      if (r.detail === "remote") return t(lang, "reason.area.remote");
      if (r.detail && /^\d{5}$/.test(r.detail)) return t(lang, "reason.area.zip", { detail: r.detail });
      return t(lang, "reason.area.county", { detail: r.detail ?? "" });
    case "language":
      return t(lang, "reason.language", { detail: languageName(lang, r.detail ?? "") });
    case "free":
      return t(lang, "reason.free");
    case "wheelchair":
      return t(lang, "reason.wheelchair");
    default:
      return null;
  }
}

/** Status line for published hours. Never claims capacity (FC-05). */
export function hoursLine(lang: Lang, r: Resource, now = new Date()): SafeHtml {
  if (r.operating_status === "temporarily_closed") {
    return html`<p class="hours hours-closed">${icon("clock")}<span>${t(lang, "status.temporarily_closed")}</span></p>`;
  }
  const s = hoursStatus(r.schedule, now);
  if (s.state === "unknown") return html`<p class="hours hours-unknown">${icon("clock")}<span>${t(lang, "hours.unknown")}</span></p>`;
  const label = s.exceptionLabel ? html` <span class="hours-ex">${t(lang, "hours.exception", { label: s.exceptionLabel })}</span>` : "";
  if (s.state === "open") {
    return html`<p class="hours hours-open">${icon("clock")}<span>${t(lang, "hours.open", { time: formatTime(s.closesAt, locale(lang)) })}${label}</span></p>`;
  }
  return html`<p class="hours hours-closed">${icon("clock")}<span>${t(lang, "hours.closed")}${label}</span></p>`;
}

export function costText(lang: Lang, r: Resource): string {
  const base = t(lang, `cost.${r.cost.kind}` as const);
  return r.cost.details ? `${base}. ${r.cost.details}` : base;
}

/** tel: href from an approved, validated phone value. */
export function telHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}
