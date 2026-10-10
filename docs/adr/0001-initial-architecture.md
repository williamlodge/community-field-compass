# ADR 0001 — Initial architecture for the first vertical slice

**Status:** Accepted for the pilot slice · October 8, 2026
**Covers:** W01 (partial), W02 (partial), W03 (in-memory foundation), W04, W07 (local plans), W09 (baseline)

## Context

The handoff (§2) asks for an inspection of any existing system before choosing an architecture. This repository held only planning documents. No existing application code, database, chat implementation, directory import, or deployment config was available to inspect, so this is treated as a **new build**. The live williamlodge.com / homeless-resource sites were **not** inspected. If they hold code or data worth keeping, revisit this ADR.

## Answers to the handoff's §2 questions

| Question | Answer today |
| --- | --- |
| Can the existing application support accessible server-rendered public pages? | No existing app in this repo. The new app server-renders every public page (works without JavaScript except on-device plans). |
| Is the current directory licensed for reuse? | **Unknown — open blocker (FC-23).** No real source data is loaded. Only fictional fixtures are used. |
| Which capabilities already work, and how were they verified? | Search, filters, detail, no-match, urgent help, EN/ES, on-device plans. Verified by `npm test` (32 tests) and a headless-browser walkthrough at 390px and 1360px. |
| Which data is public, private, confidential? | Resource records are public except `address_visibility: "confidential"` locations, which are stripped by `toPublic()` before any output. Plans are private and live only in the browser. |
| Which integrations need credentials, agreements, or paid services? | AI provider (W06), NWS (W08, needs a User-Agent contact only), hosting, and the directory data source agreement. None are configured. |
| What must be migrated or preserved? | Nothing yet. |

## Decisions

1. **TypeScript + Node 20+ + Express 5**, server-rendered HTML via a tiny auto-escaping template helper (`src/web/html.ts`). No front-end framework: keeps pages light (FC-33) and accessible by default. This matches William's existing Node toolchain and runs behind OpenLiteSpeed as a reverse proxy on the VPS.
2. **Repository interface** (`src/data/repository.ts`) with an in-memory implementation over fixtures. W03 replaces it with **PostgreSQL + PostGIS** (relational with geographic queries, as recommended in the handoff). Search logic is pure and reusable.
3. **Deterministic search** (`src/domain/search.ts`): synonyms, typo tolerance, service-area matching (never office location), explicit unknowns, ranking by coverage/quality, and filter-relaxation suggestions. AI will call this same function as its `search_resources` tool (W06).
4. **Plans are local-only in P0** (`public/plan.js`): nothing is stored until the person confirms "Save on this device"; export/print/clear provided; saved items are re-checked against `/api/resources/:id` for version changes and withdrawals.
5. **Sample-data guard:** fixture records carry `is_sample: true`; the repository throws if they're loaded with `APP_ENV=production`, and every page shows a sample-data banner while they're present.
6. **Security baseline:** strict CSP (no inline script), `X-Request-Id` on every response, bounded inputs, no query text in logs.

## Not yet built (next packages)

- W03: Postgres/PostGIS schema, staging import, dedupe, provenance, rollback.
- W05: operations console and the correction queue (the "Report a problem" button is intentionally absent until it works).
- W06: grounded AI chat (the Ask tab is a holding page).
- W08: NWS weather and alerts (no weather is shown rather than sample values).
- Reviewed guides (FC-16), fluent Spanish review (FC-32), WCAG 2.2 AA audit (FC-31).

## Open decisions for the product owner

- Data source and permission (FC-23) — blocks any real listings.
- Final name/wordmark clearance.
- Hosting target (VPS + OpenLiteSpeed proxy assumed) and domain.
- AI provider and spend limits.
