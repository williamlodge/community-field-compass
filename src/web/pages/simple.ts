import { clientMessages, t } from "../../i18n/index.js";
import { html } from "../html.js";
import { icon } from "../icons.js";
import { layout, type PageContext } from "../layout.js";

export function savedPage(ctx: PageContext): string {
  const { lang } = ctx;
  const body = html`<div class="wrap page narrow">
  <h1 class="page-title">${t(lang, "saved.title")}</h1>
  <p class="lede">${t(lang, "saved.lede")}</p>
  <noscript><p class="notice">${t(lang, "saved.noScript")}</p></noscript>
  <p class="notice" id="plan-status" role="status" hidden></p>
  <div id="plan-root"></div>
  <div class="plan-tools" id="plan-tools" hidden>
    <button class="btn btn-secondary" type="button" id="plan-export">${t(lang, "saved.export")}</button>
    <button class="btn btn-secondary" type="button" id="plan-print">${t(lang, "saved.print")}</button>
    <button class="btn btn-danger" type="button" id="plan-clear">${t(lang, "saved.clear")}</button>
    <p class="fine">${t(lang, "saved.exportNote")}</p>
  </div>
</div>`;
  return layout(ctx, { title: t(lang, "saved.title"), nav: "saved", body, scripts: ["plan.js"], data: { lang, messages: clientMessages(lang) } });
}

export function askPage(ctx: PageContext): string {
  const { lang } = ctx;
  const body = html`<div class="wrap page narrow">
  <h1 class="page-title">${t(lang, "ask.title")}</h1>
  <p class="lede">${t(lang, "ask.body")}</p>
  <p><a class="btn btn-primary" href="/search">${icon("search")}<span>${t(lang, "ask.searchInstead")}</span></a></p>
  <p class="human-route">${icon("phone")}<span>${t(lang, "search.noMatch.human")}</span> <a href="tel:211">211</a></p>
</div>`;
  return layout(ctx, { title: t(lang, "nav.ask"), nav: "ask", body });
}

export function guidesPage(ctx: PageContext): string {
  const { lang } = ctx;
  const body = html`<div class="wrap page narrow">
  <h1 class="page-title">${t(lang, "guides.title")}</h1>
  <p class="lede">${t(lang, "guides.body")}</p>
  <p><a class="btn btn-primary" href="/search">${icon("search")}<span>${t(lang, "ask.searchInstead")}</span></a></p>
</div>`;
  return layout(ctx, { title: t(lang, "guides.title"), nav: "guides", body });
}

export function urgentPage(ctx: PageContext): string {
  const { lang } = ctx;
  const card = (title: string, action: string, href: string, note?: string) =>
    html`<li class="urgent-card"><h2>${title}</h2><a class="btn btn-urgent" href="${href}">${icon("phone")}<span>${action}</span></a>${note ? html`<p class="fine">${note}</p>` : ""}</li>`;
  const body = html`<div class="wrap page narrow">
  <div class="exit-row"><a class="btn btn-quiet js-quick-exit" href="https://www.weather.gov/" rel="noreferrer">${t(lang, "urgent.exit")}</a><span class="fine">${t(lang, "urgent.exitNote")}</span></div>
  <h1 class="page-title">${t(lang, "urgent.title")}</h1>
  <p class="lede">${t(lang, "urgent.lede")}</p>
  <ul class="urgent-list">
    ${card(t(lang, "urgent.911.title"), t(lang, "urgent.911.action"), "tel:911")}
    ${card(t(lang, "urgent.988.title"), t(lang, "urgent.988.action"), "tel:988")}
    ${card(t(lang, "urgent.211.title"), t(lang, "urgent.211.action"), "tel:211", t(lang, "urgent.211.note"))}
  </ul>
  <p>${t(lang, "urgent.boundary")}</p>
</div>`;
  return layout(ctx, { title: t(lang, "urgent.title"), nav: "urgent", body, scripts: ["exit.js"] });
}

export function messagePage(ctx: PageContext, title: string, text?: string): string {
  const body = html`<div class="wrap page narrow"><h1 class="page-title">${title}</h1>${text ? html`<p>${text}</p>` : ""}
  <p><a class="btn btn-primary" href="/">${t(ctx.lang, "nav.discover")}</a> <a class="btn btn-quiet" href="/urgent">${t(ctx.lang, "nav.urgent")}</a></p></div>`;
  return layout(ctx, { title, nav: null, body });
}
