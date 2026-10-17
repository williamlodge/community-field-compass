# Server connection handoff

The public directory at `fieldcompass.site` uses a read-only bridge to the existing `admin_co_resources.resources` and `guides` tables. This does not mean the wider product launch checklist is complete: source reuse permissions, content verification, Spanish review, and other integrations remain open. AI generation is disabled on the public site.

## Run locally

Use Node 22.12 or newer. Install with `npm ci`, then `npm run build` and `npm start`. The server listens on **127.0.0.1:3000**; expose it only behind your HTTPS reverse proxy. Copy `.env.example` to an ignored `.env` and populate secrets privately on the server, not in chat or Git. The server reads `.env` at startup; process environment takes precedence.

Default mode loads fictional fixtures with a visible warning. `APP_ENV=production` rejects fixtures. Ordinary directory search and the chat screen's directory-only mode work with no model credentials.

## OpenRouter

Set `OPENROUTER_API_KEY` in the server environment and `AI_ENABLED=true` only after provider privacy review. The fixed model is `z-ai/glm-4.5-air:free`. No paid model or automatic paid fallback is configured. The default application budget is 40 attempted AI calls per UTC day and 15 per minute, across this process, leaving some headroom below typical free-tier limits. Set `AI_DAILY_LIMIT=0` to turn generation off without breaking search.

The local budget resets on process restart and is NOT durable or shared. Before public launch, add a shared rate-limit store, per-client abuse controls, a durable account-wide quota, and provider-side controls. Provider outages, limits and invalid output cause deterministic directory-search fallback. No automatic retry loop consumes additional calls.

The user opts in before up to six of their messages are sent to OpenRouter and the serving model provider. City/ZIP field is used locally, not included as a separate model field. Users may still type sensitive data into messages; disclosure is not a redaction system. The app never stores chat transcripts, logs prompt text, or sends saved plans to the AI. Provider routing sets `data_collection: deny`, with provider fallback disabled. This is not a zero-retention guarantee; a free model may have no eligible route, in which case ordinary search remains available.

The model only translates requests into search keywords. Public resource facts and next-step links are rendered from approved directory records. This intentionally limited assistant does not provide open-ended health/legal guidance, determine eligibility, manage appointments, or complete applications.

Official references: [OpenRouter API](https://openrouter.ai/docs/quickstart), [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection), [provider logging](https://openrouter.ai/docs/guides/privacy/provider-logging).

## Your MariaDB resources

The live bridge uses the flat `resources` table in `admin_co_resources`. It reads active Colorado rows from 211 Colorado and Food Bank of the Rockies, excluding seed rows. Source URLs in the table are empty, so the site links to each source's general directory. No row currently has a verification date; the public site labels service area and verification as unconfirmed. Food Bank of the Rockies and 211 reuse/attribution requirements still need confirmation.

The older `mariadb` adapter still expects a separate `fc_resources` integration table from `db/001_resources.sql`. The `co_resources` adapter reads the existing flat table directly and never writes to it. Both adapters validate the public resource shape; sample records are rejected in production.

Use a dedicated SELECT-only database account. Set `RESOURCE_SOURCE=co_resources`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. Remote connections require `DB_TLS=true` and certificate validation; optionally supply `DB_CA_FILE` for a private CA. Never open MariaDB publicly just to connect the app—run it alongside the server or use private networking.

The pilot performs a bounded read of up to 10,000 published records per search. Beyond that, it fails closed rather than silently dropping listings. Before large-scale use, implement indexed database search, load testing, approved import staging/rollback, and operational monitoring. Database failures do not silently substitute sample data. `/healthz` is a process-liveness check, not a database/provider readiness check.

## Still required before public launch

- Source reuse permission review, item-level provenance, and a correction workflow.
- Live MariaDB and OpenRouter integration tests with approved credentials.
- NWS weather/alerts and official Denver alert access, reviewed guides, phone/voice.
- Human review of Spanish copy and resource translations, accessibility audit, realistic AI evaluations.
- Rate limiting, backup/restore drills, monitoring, incident ownership, deployment/domain configuration.

The free model is a development starting point, not a 24/7 availability guarantee.
