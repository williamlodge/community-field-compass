import { t, type Lang, type MessageKey } from "../i18n/index.js";
import { html, raw, type SafeHtml } from "./html.js";
import { brandMark, icon } from "./icons.js";

export type NavKey = "discover" | "ask" | "guides" | "saved" | "urgent" | null;

export interface PageContext {
  lang: Lang;
  /** Current path + query, used to build the language switch link. */
  url: string;
  showSampleBanner: boolean;
}

interface LayoutOptions {
  title: string;
  nav: NavKey;
  body: SafeHtml;
  /** Extra scripts served from /static (same-origin only). */
  scripts?: string[];
  /** JSON payload exposed to client scripts via a non-executable script tag. */
  data?: unknown;
}

const NAV: { key: Exclude<NavKey, "urgent" | null>; href: string; icon: string; label: MessageKey }[] = [
  { key: "discover", href: "/", icon: "compass", label: "nav.discover" },
  { key: "ask", href: "/ask", icon: "chat", label: "nav.ask" },
  { key: "guides", href: "/guides", icon: "book", label: "nav.guides" },
  { key: "saved", href: "/saved", icon: "bookmark", label: "nav.saved" },
];

function switchLangUrl(url: string, to: Lang): string {
  const u = new URL(url, "http://local");
  u.searchParams.set("lang", to);
  return `${u.pathname}?${u.searchParams.toString()}`;
}

export function layout(ctx: PageContext, opts: LayoutOptions): string {
  const { lang } = ctx;
  const other: Lang = lang === "en" ? "es" : "en";
  const navItems = NAV.map(
    (n) => html`<li><a href="${n.href}" ${n.key === opts.nav ? raw('aria-current="page"') : ""}>${icon(n.icon)}<span>${t(lang, n.label)}</span></a></li>`,
  );
  const dataJson = opts.data === undefined ? "" : JSON.stringify(opts.data).replace(/</g, "\\u003c");

  return html`<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${opts.title} · FieldCompass</title>
<meta name="description" content="${t(lang, "brand.descriptor")}">
<meta name="color-scheme" content="light dark">
<link rel="stylesheet" href="/static/styles.css">
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
</head>
<body>
<a class="skip-link" href="#main">${t(lang, "nav.skip")}</a>
${ctx.showSampleBanner ? html`<p class="sample-banner" role="note">${t(lang, "sample.banner")}</p>` : ""}
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/">
      ${brandMark()}
      <span class="brand-text"><span class="brand-name">FieldCompass</span><span class="brand-descriptor">${t(lang, "brand.descriptor")}</span></span>
    </a>
    <nav class="top-nav" aria-label="${t(lang, "nav.primary")}"><ul>${navItems}</ul></nav>
    <div class="header-actions">
      <a class="lang-switch" href="${switchLangUrl(ctx.url, other)}" hreflang="${other}" lang="${other}" aria-label="${t(lang, "lang.switchLabel")}"><span class="lang-long">${t(lang, "lang.switch")}</span><span class="lang-short" aria-hidden="true">${other.toUpperCase()}</span></a>
      <a class="urgent-link" href="/urgent" ${opts.nav === "urgent" ? raw('aria-current="page"') : ""}>${icon("alert")}<span>${t(lang, "nav.urgent")}</span></a>
    </div>
  </div>
</header>
<main id="main" tabindex="-1">
${opts.body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p>${t(lang, "footer.about")}</p>
    <p>${t(lang, "footer.disclaimer")}</p>
  </div>
</footer>
<nav class="bottom-nav" aria-label="${t(lang, "nav.primary")}"><ul>${navItems}</ul></nav>
${dataJson ? html`<script type="application/json" id="fc-data">${raw(dataJson)}</script>` : ""}
${(opts.scripts ?? []).map((s) => html`<script src="/static/${s}" defer></script>`)}
</body>
</html>`.value;
}
