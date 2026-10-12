import { CATEGORIES } from "../../domain/categories.js";
import { t } from "../../i18n/index.js";
import { html } from "../html.js";
import { icon } from "../icons.js";
import { layout, type PageContext } from "../layout.js";

export function discoverPage(ctx: PageContext): string {
  const { lang } = ctx;
  const body = html`
<section class="hero">
  <div class="wrap">
    <h1 class="display">${lang === "es" ? "Su comunidad." : "Your community."}<br>${lang === "es" ? "Su próximo paso." : "Your next step."}</h1>
    <p class="lede">${lang === "es" ? "Encuentre apoyo local para la vida diaria." : "Find local support for everyday life."}</p>
    <div class="assistant-panel">
      <p class="ai-label">${lang === "es" ? "GUÍA DE RECURSOS CON IA · PILOTO" : "AI RESOURCE GUIDE · PILOT"}</p>
      <h2>${lang === "es" ? "¿Qué necesita encontrar?" : "What can we help you find?"}</h2>
      <p>${lang === "es" ? "Guardería, comida, ayuda con facturas…" : "Childcare, groceries, help with bills…"}</p>
      <a href="/ask" class="btn btn-primary">${icon("chat")}${lang === "es" ? "Iniciar un chat" : "Start a chat"}</a>
      <p class="fine">${lang === "es" ? "Explore opciones. Haga un plan." : "Explore options. Make a plan."}</p>
    </div>
    <form class="search-panel" action="/search" method="get" role="search">
      <div class="field field-q">
        <label for="q">${t(lang, "discover.searchLabel")}</label>
        <div class="input-icon">${icon("search")}<input id="q" name="q" type="search" maxlength="200" autocomplete="off" placeholder="${t(lang, "discover.searchPlaceholder")}"></div>
      </div>
      <div class="field field-place">
        <label for="place">${t(lang, "discover.placeLabel")}</label>
        <div class="input-icon">${icon("pin")}<input id="place" name="place" type="text" maxlength="60" autocomplete="address-level2" placeholder="${t(lang, "discover.placePlaceholder")}"></div>
      </div>
      <button class="btn btn-primary" type="submit">${t(lang, "discover.submit")}</button>
    </form>
    <p class="fine">${t(lang, "discover.coverage")}</p>
  </div>
</section>

<section class="wrap section" aria-labelledby="browse-h">
  <h2 id="browse-h" class="section-title">${t(lang, "discover.browse")}</h2>
  <ul class="category-grid">
    ${CATEGORIES.map(
      (c) => html`<li><a class="category-tile" href="/search?category=${c.id}">${icon(c.icon)}<span>${t(lang, `category.${c.id}.name` as const)}</span>${icon("chevron", "icon chev")}</a></li>`,
    )}
  </ul>
</section>

<section class="wrap section">
  <div class="callout">
    <div>
      <h2 class="callout-title">${lang === "es" ? "Un poco de claridad ayuda mucho." : "A little clarity goes a long way."}</h2>
      <p>${lang === "es" ? "Compare opciones y guarde sus próximos pasos en este dispositivo." : "Compare your options and save your next steps on this device."}</p>
    </div>
    <a class="btn btn-secondary" href="/saved">${icon("bookmark")}<span>${t(lang, "nav.saved")}</span></a>
  </div>
</section>`;
  return layout(ctx, { title: t(lang, "nav.discover"), nav: "discover", body });
}
