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
    <h1 class="display">${t(lang, "discover.title")}</h1>
    <p class="lede">${t(lang, "discover.lede")}</p>
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
      <h2 class="callout-title">${t(lang, "discover.askTitle")}</h2>
      <p>${t(lang, "discover.askBody")}</p>
    </div>
    <a class="btn btn-secondary" href="/ask">${icon("chat")}<span>${t(lang, "nav.ask")}</span></a>
  </div>
</section>`;
  return layout(ctx, { title: t(lang, "nav.discover"), nav: "discover", body });
}
