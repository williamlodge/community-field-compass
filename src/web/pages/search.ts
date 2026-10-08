import { CATEGORIES } from "../../domain/categories.js";
import type { SearchFilters, SearchHit, SearchResult } from "../../domain/search.js";
import { t, type Lang, type MessageKey } from "../../i18n/index.js";
import { areaText, hoursLine, languagesText, reasonText } from "../format.js";
import { html, raw, type SafeHtml } from "../html.js";
import { icon } from "../icons.js";
import { layout, type PageContext } from "../layout.js";

export interface SearchView {
  /** Raw query parameters, echoed back into the form. */
  params: { q: string; place: string; category: string; language: string; free: boolean; mode: string; wheelchair: boolean };
  filters: SearchFilters;
  placeUnrecognized: boolean;
  result: SearchResult;
}

const FILTER_LABEL: Record<string, MessageKey> = {
  place: "search.filter.place",
  language: "search.filter.language",
  free: "search.filter.free",
  wheelchair: "search.filter.wheelchair",
};

function queryString(p: SearchView["params"], drop?: string): string {
  const u = new URLSearchParams();
  if (p.q && drop !== "q") u.set("q", p.q);
  if (p.place && drop !== "place") u.set("place", p.place);
  if (p.category && drop !== "category") u.set("category", p.category);
  if (p.language && drop !== "language") u.set("language", p.language);
  if (p.free && drop !== "free") u.set("free", "1");
  if (p.mode && drop !== "mode") u.set("mode", p.mode);
  if (p.wheelchair && drop !== "wheelchair") u.set("wheelchair", "1");
  return u.toString();
}

function resultCard(lang: Lang, hit: SearchHit): SafeHtml {
  const r = hit.resource;
  const reasons = hit.reasons.map((x) => reasonText(lang, x)).filter((x): x is string => !!x);
  return html`<li class="result">
  <article>
    <h3 class="result-title"><a href="/resources/${r.id}">${r.name}</a></h3>
    <p class="result-org">${r.organization_name}</p>
    <p class="result-summary">${r.summary}</p>
    ${hoursLine(lang, r)}
    ${reasons.length ? html`<ul class="reasons" aria-label="${t(lang, "search.whyMatches")}">${reasons.map((x) => html`<li>${icon("check")}<span>${x}</span></li>`)}</ul>` : ""}
    ${hit.unconfirmed.length ? html`<p class="unconfirmed">${icon("info")}<span>${t(lang, "search.unconfirmed", { items: hit.unconfirmed.map((k) => t(lang, FILTER_LABEL[k] ?? "search.filters")).join(", ") })}</span></p>` : ""}
    <p class="result-meta">${areaText(lang, r)}${r.languages ? ` · ${languagesText(lang, r.languages)}` : ""}</p>
  </article>
</li>`;
}

export function searchPage(ctx: PageContext, view: SearchView): string {
  const { lang } = ctx;
  const { params: p, result, filters } = view;
  const confirmed = result.hits.filter((h) => h.unconfirmed.length === 0);
  const mayFit = result.hits.filter((h) => h.unconfirmed.length > 0);
  const countKey = result.total === 1 ? "search.count.one" : "search.count.other";
  const placeLabel = filters.place?.label ?? p.place;

  const summaryParts = [t(lang, countKey, { n: result.total })];
  if (p.q) summaryParts.push(t(lang, "search.forQuery", { q: p.q }));
  if (filters.place) summaryParts.push(t(lang, "search.inPlace", { place: filters.place.label }));

  const sel = (cond: boolean) => (cond ? raw("selected") : "");
  const chk = (cond: boolean) => (cond ? raw("checked") : "");

  const form = html`<form class="filters" action="/search" method="get">
  <div class="filters-main">
    <div class="field"><label for="q">${t(lang, "discover.searchLabel")}</label>
      <div class="input-icon">${icon("search")}<input id="q" name="q" type="search" maxlength="200" value="${p.q}"></div></div>
    <div class="field"><label for="place">${t(lang, "discover.placeLabel")}</label>
      <div class="input-icon">${icon("pin")}<input id="place" name="place" type="text" maxlength="60" value="${p.place}" ${view.placeUnrecognized ? raw('aria-invalid="true" aria-describedby="place-error"') : ""}></div>
      ${view.placeUnrecognized ? html`<p class="field-error" id="place-error">${t(lang, "search.placeUnknown", { place: p.place })}</p>` : ""}
    </div>
  </div>
  <details class="filters-more" ${p.category || p.language || p.free || p.mode || p.wheelchair ? raw("open") : ""}>
    <summary>${t(lang, "search.filters")}</summary>
    <div class="filters-grid">
      <div class="field"><label for="category">${t(lang, "search.filter.category")}</label>
        <select id="category" name="category"><option value="">${t(lang, "search.filter.any")}</option>
          ${CATEGORIES.map((c) => html`<option value="${c.id}" ${sel(p.category === c.id)}>${t(lang, `category.${c.id}.name` as const)}</option>`)}
        </select></div>
      <div class="field"><label for="language">${t(lang, "search.filter.language")}</label>
        <select id="language" name="language"><option value="">${t(lang, "search.filter.any")}</option>
          <option value="en" ${sel(p.language === "en")}>${languagesText(lang, ["en"])}</option>
          <option value="es" ${sel(p.language === "es")}>${languagesText(lang, ["es"])}</option>
        </select></div>
      <div class="field"><label for="mode">${t(lang, "search.filter.mode")}</label>
        <select id="mode" name="mode"><option value="">${t(lang, "search.filter.any")}</option>
          ${(["in_person", "virtual", "phone"] as const).map((m) => html`<option value="${m}" ${sel(p.mode === m)}>${t(lang, `mode.${m}`)}</option>`)}
        </select></div>
      <div class="checks">
        <label class="check"><input type="checkbox" name="free" value="1" ${chk(p.free)}> ${t(lang, "search.filter.free")}</label>
        <label class="check"><input type="checkbox" name="wheelchair" value="1" ${chk(p.wheelchair)}> ${t(lang, "search.filter.wheelchair")}</label>
      </div>
    </div>
  </details>
  <div class="filters-actions">
    <button class="btn btn-primary" type="submit">${t(lang, "search.apply")}</button>
    <a class="btn btn-quiet" href="/search">${t(lang, "search.clear")}</a>
  </div>
</form>`;

  const noMatch = html`<section class="no-match" aria-labelledby="nomatch-h">
  <h2 id="nomatch-h">${t(lang, "search.noMatch.title")}</h2>
  ${result.relaxations.length
    ? html`<p>${t(lang, "search.noMatch.body")}</p>
      <ul class="relax-list">${result.relaxations.map(
        (rx) => html`<li><a class="btn btn-secondary" href="/search?${queryString(p, rx.filter)}">${t(lang, `search.relax.${rx.filter}`, { n: rx.count, place: placeLabel })}</a></li>`,
      )}</ul>`
    : html`<p>${t(lang, "search.noMatch.none")}</p>`}
  <p class="human-route">${icon("phone")}<span>${t(lang, "search.noMatch.human")}</span> <a href="tel:211">211</a></p>
</section>`;

  const body = html`
<div class="wrap page">
  <h1 class="page-title">${t(lang, "search.title")}</h1>
  ${form}
  <p class="result-count" role="status">${summaryParts.join(" ")}</p>
  ${!filters.place && !view.placeUnrecognized ? html`<p class="hint">${icon("pin")}<span>${t(lang, "search.placeMissing")}</span></p>` : ""}
  ${result.total === 0 ? noMatch : ""}
  ${confirmed.length ? html`<ol class="results">${confirmed.map((h) => resultCard(lang, h))}</ol>` : ""}
  ${mayFit.length
    ? html`<section class="may-fit" aria-labelledby="mayfit-h"><h2 id="mayfit-h" class="section-title">${t(lang, "search.mayFit")}</h2>
      <p class="fine">${t(lang, "search.mayFitBody")}</p>
      <ol class="results">${mayFit.map((h) => resultCard(lang, h))}</ol></section>`
    : ""}
</div>`;
  return layout(ctx, { title: t(lang, "search.title"), nav: "discover", body });
}
