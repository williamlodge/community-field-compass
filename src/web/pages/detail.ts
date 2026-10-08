import { formatTime } from "../../domain/schedule.js";
import type { Resource } from "../../domain/types.js";
import { clientMessages, t, type Lang } from "../../i18n/index.js";
import { areaText, costText, formatDate, hoursLine, languagesText, locale, telHref } from "../format.js";
import { html, type SafeHtml } from "../html.js";
import { icon } from "../icons.js";
import { layout, type PageContext } from "../layout.js";

function unknown(lang: Lang): SafeHtml {
  return html`<p class="unknown">${icon("info")}<span>${t(lang, "detail.unknown")}</span></p>`;
}

function section(title: string, content: SafeHtml | string): SafeHtml {
  return html`<section class="detail-section"><h2>${title}</h2>${typeof content === "string" ? html`<p>${content}</p>` : content}</section>`;
}

function scheduleTable(lang: Lang, r: Resource): SafeHtml {
  const s = r.schedule;
  if (!s || s.regular.length === 0) return unknown(lang);
  const loc = locale(lang);
  const rows = [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const periods = s.regular.filter((p) => p.day === day);
    const text = periods.length
      ? periods.map((p) => `${formatTime(p.opens, loc)} – ${formatTime(p.closes, loc)}`).join(", ")
      : "—";
    return html`<tr><th scope="row">${t(lang, `day.${day}` as "day.0")}</th><td>${text}</td></tr>`;
  });
  const exceptions = s.exceptions.map(
    (e) => html`<li>${formatDate(lang, `${e.date}T12:00:00Z`)}: ${e.label ?? ""} ${e.closed ? "—" : e.hours ? `${formatTime(e.hours.opens, loc)} – ${formatTime(e.hours.closes, loc)}` : ""}</li>`,
  );
  return html`<table class="hours-table"><tbody>${rows}</tbody></table>
    ${exceptions.length ? html`<ul class="exceptions">${exceptions}</ul>` : ""}
    ${s.intake_cutoff_note ? html`<p>${s.intake_cutoff_note}</p>` : ""}
    <p class="fine">${t(lang, "hours.disclaimer")}</p>`;
}

export function detailPage(ctx: PageContext, r: Resource, backHref: string | null): string {
  const { lang } = ctx;
  const phones = r.contacts.filter((c) => c.channel === "phone");
  const sites = r.contacts.filter((c) => c.channel === "website");
  const primaryPhone = phones[0];

  // Snapshot stored with a plan item, built only from approved fields.
  const saveData = {
    id: r.id,
    name: r.name,
    organization: r.organization_name,
    record_version: r.record_version,
    phone: primaryPhone?.value ?? null,
    website: sites[0]?.value ?? null,
    source_updated_at: r.source_updated_at,
    category: r.category_ids[0] ?? null,
  };

  const contactBlock = html`<ul class="contact-list">
    ${phones.map((c) => html`<li><a class="contact" href="${telHref(c.value)}">${icon("phone")}<span><span class="contact-label">${c.label ?? t(lang, "detail.call")}</span><span class="contact-value">${c.value}</span></span></a>${c.notes ? html`<p class="fine">${c.notes}</p>` : ""}</li>`)}
    ${sites.map((c) => html`<li><a class="contact" href="${c.value}" rel="noopener noreferrer">${icon("link")}<span><span class="contact-label">${t(lang, "detail.website")}</span><span class="contact-value">${new URL(c.value).host}</span></span></a></li>`)}
  </ul>`;

  const locations = r.locations.length
    ? html`<ul class="plain-list">${r.locations.map((l) => {
        if (l.access === "virtual") return html`<li>${t(lang, "detail.virtual")}${l.notes ? ` — ${l.notes}` : ""}</li>`;
        if (l.address_visibility === "confidential" || !l.address) return html`<li>${t(lang, "detail.confidentialAddress")}</li>`;
        return html`<li><address>${l.address.street}<br>${l.address.city}, CO ${l.address.zip}</address></li>`;
      })}</ul>`
    : unknown(lang);

  const body = html`
<div class="wrap page detail">
  ${backHref ? html`<p><a class="back-link" href="${backHref}">${icon("back")}<span>${t(lang, "detail.back")}</span></a></p>` : ""}
  <header class="detail-head">
    <p class="eyebrow">${r.organization_name}</p>
    <h1 class="page-title">${r.name}</h1>
    <p class="lede">${r.summary}</p>
    ${hoursLine(lang, r)}
    <div class="detail-actions">
      ${primaryPhone ? html`<a class="btn btn-primary" href="${telHref(primaryPhone.value)}">${icon("phone")}<span>${t(lang, "detail.call")} ${primaryPhone.value}</span></a>` : ""}
      <button class="btn btn-secondary js-save" type="button" hidden data-resource="${JSON.stringify(saveData)}">${icon("bookmark")}<span>${t(lang, "detail.save")}</span></button>
    </div>
  </header>

  <div class="detail-grid">
    <div class="detail-main">
      ${r.description ? section(t(lang, "detail.whatItOffers"), r.description) : ""}
      ${section(t(lang, "detail.whoItServes"), r.eligibility ?? unknown(lang))}
      ${section(t(lang, "detail.howToStart"), r.intake ?? unknown(lang))}
      ${section(
        t(lang, "detail.documents"),
        r.documents === null ? unknown(lang) : r.documents.length === 0 ? t(lang, "detail.noDocuments") : html`<ul class="plain-list">${r.documents.map((d) => html`<li>${d}</li>`)}</ul>`,
      )}
      ${section(t(lang, "detail.hours"), scheduleTable(lang, r))}
    </div>
    <aside class="detail-side">
      ${section(t(lang, "detail.contact"), contactBlock)}
      ${section(t(lang, "detail.cost"), r.cost.kind === "unknown" ? unknown(lang) : costText(lang, r))}
      ${section(t(lang, "detail.serviceArea"), areaText(lang, r))}
      ${section(t(lang, "detail.locations"), locations)}
      ${section(t(lang, "detail.languages"), r.languages ? languagesText(lang, r.languages) : unknown(lang))}
      ${section(
        t(lang, "detail.accessibility"),
        html`<p>${t(lang, `wheelchair.${r.accessibility.wheelchair}`)}</p>${r.accessibility.notes ? html`<p>${r.accessibility.notes}</p>` : ""}`,
      )}
      ${section(
        t(lang, "detail.source"),
        html`<ul class="plain-list fine">
          ${r.sources.map((s) => html`<li><a href="${s.url}" rel="noopener noreferrer">${s.name}</a></li>`)}
          <li>${t(lang, "detail.sourceUpdated", { date: formatDate(lang, r.source_updated_at) })}</li>
          <li>${t(lang, "detail.fetched", { date: formatDate(lang, r.fetched_at) })}</li>
          <li>${r.reviewed_at ? t(lang, "detail.reviewed", { date: formatDate(lang, r.reviewed_at) }) : t(lang, "detail.notReviewed")}</li>
          <li>${t(lang, "detail.version", { v: r.record_version })}</li>
        </ul>`,
      )}
    </aside>
  </div>
</div>
<dialog class="consent" id="consent-dialog" aria-labelledby="consent-h">
  <form method="dialog">
    <h2 id="consent-h">${t(lang, "consent.title")}</h2>
    <p>${t(lang, "consent.body")}</p>
    <div class="dialog-actions">
      <button class="btn btn-primary" value="confirm">${t(lang, "consent.confirm")}</button>
      <button class="btn btn-quiet" value="cancel">${t(lang, "consent.cancel")}</button>
    </div>
  </form>
</dialog>`;

  return layout(ctx, {
    title: r.name,
    nav: "discover",
    body,
    scripts: ["plan.js"],
    data: { lang, messages: clientMessages(lang) },
  });
}

export function goneOrMissingPage(ctx: PageContext, kind: "withdrawn" | "not_found"): string {
  const { lang } = ctx;
  const body = html`<div class="wrap page narrow">
    <h1 class="page-title">${t(lang, kind === "withdrawn" ? "detail.withdrawn.title" : "detail.notFound.title")}</h1>
    ${kind === "withdrawn" ? html`<p>${t(lang, "detail.withdrawn.body")}</p>` : ""}
    <p><a class="btn btn-primary" href="/search">${t(lang, "ask.searchInstead")}</a> <a class="btn btn-quiet" href="/saved">${t(lang, "nav.saved")}</a></p>
  </div>`;
  return layout(ctx, { title: t(lang, kind === "withdrawn" ? "detail.withdrawn.title" : "detail.notFound.title"), nav: null, body });
}
