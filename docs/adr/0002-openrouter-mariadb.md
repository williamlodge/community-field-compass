# ADR 0002 — OpenRouter pilot and MariaDB integration

Accepted for development, October 11, 2026. Supersedes ADR 0001's proposed PostgreSQL choice; retains the existing Express/TypeScript application.

William selected OpenRouter's `z-ai/glm-4.5-air:free` and plans to host community resource data in MariaDB. No live credentials or source schema have been supplied. Do not assume the Food Bank of the Rockies data has been imported or licensed for republication.

## Pilot boundary

The model interprets a short request into search terms, not SQL or public resource facts. The server validates the output, searches approved records, and builds source-linked responses from those records. No generated contacts, eligibility determinations, hours, or promises of availability are displayed. Missing credentials, invalid model output, privacy-incompatible routing, timeouts, and quotas fall back to ordinary directory search. Only the named free model is allowed; no paid fallback.

The pilot is not an emergency responder, medical/legal adviser, or a full conversational caseworker. It does not store chat messages. AI use requires a disclosure and an explicit checkbox; directory-only search remains available. Provider privacy settings cannot guarantee no retention: review the actual eligible provider before public launch.

MariaDB stores validated FieldCompass resource JSON in a dedicated integration table. It does not change or guess the owner's upstream schema. The application uses SELECT-only credentials, validates records, excludes drafts and confidential addresses, and refuses sample records in production. Search uses the existing deterministic ranking over a bounded dataset; larger deployments need indexed SQL search. No migrations run automatically.

## Design inventory

Reference: `docs/colorado-community-mobile-v3.png`, previously approved mobile concept. Preserve white backgrounds, pale-blue assistant surface, blue actions, dark navy text, system sans typography, rounded controls, thin dividers, and Discover / Ask / Guides / Saved navigation. Main headline: “Your community. Your next step.” Supporting copy: “Find local support for everyday life.” Assistant prompt: “What can we help you find?” Primary action: “Start a chat.”

Tokens: white #fff, ink #111b35, secondary #53617b, line #e2e8f2, primary #0065e8, pale blue #eaf4ff, 12px controls / 18px panels, 48px touch targets, system sans, 16px body, 32–56px display. Outline icons reuse the existing vector family consistently.

Intentional deviations: FieldCompass wordmark replaces Colorado Community; prominent sample-data disclosure stays; no false 24/7 availability claim; no inactive voice/phone controls; explicit AI privacy consent; no sample weather portrayed as live. Existing search and saved-plan flows are preserved. Desktop expands into two columns while mobile stays single-column. Weather, reviewed guides, phone, and operations remain separate milestones.
