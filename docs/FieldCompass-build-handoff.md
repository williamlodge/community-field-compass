# FieldCompass developer handoff

**Version:** 1.0 · October 7, 2026  
**Working name:** FieldCompass  
**Product authority:** [Product scope](FieldCompass-product-scope.md)  
**Design reference:** [Community-focused mobile concept](colorado-community-mobile-v3.png)

## 1. Assignment and boundaries

Build a Colorado community resource navigator for everyday needs, with an accessible mobile website, grounded 24/7 AI chat, reliable resource discovery, practical guides, and saved next-step plans. Weather and official local alerts are supporting features. Browser voice and a dedicated AI phone number follow after the core pilot is reliable.

The product is for the whole community. Give food, healthcare, childcare, housing, employment, transportation, benefits, and other community needs balanced attention. Use FieldCompass as a configurable working name with the descriptor “Colorado Community Resource Navigator.” The name has not been cleared or registered.

This handoff describes proposed implementation work. It does not confirm repository access, data rights, hosting, credentials, production integrations, or ownership of the current website. Begin with discovery when implementation is authorized. Do not publish, purchase services, migrate a domain, create a public phone line, or contact outside organizations solely because those actions appear in this document.

The written scope takes precedence over generated mockup details. Replace the old “Colorado Community” wordmark, remove unsupported counts and availability badges, and keep AI phone separate from calling a human through 211.

## 2. Inspect before making architectural choices

Record the repository, framework, deployment platform, database, current chat implementation, directory source, data-update jobs, analytics, and existing authentication. Inspect secrets by presence and configuration only; do not print values. Identify what can be retained safely and what needs replacement.

Produce a short architecture decision record that answers:

- Can the existing application support accessible server-rendered public resource pages?
- Is the current directory licensed for reuse, and can its update path be maintained?
- Which capabilities already work, and how were they verified?
- Which data is public, private, confidential, or restricted by the source owner?
- Which integrations require credentials, agreements, a paid service, or new infrastructure?
- What must be migrated, redirected, backed up, or preserved?

If this is a new build, a typed web application, server API, relational database with geographic querying, background job worker, and administrative interface are a reasonable starting shape. Retain a suitable existing stack. Do not introduce a separate vector database, microservices, or an app-store client without a demonstrated need.

Use isolated development and staging environments with clearly marked sample records. No staged sample provider or weather value may appear in a public production response.

## 3. Work packages and order

The FC identifiers below refer to requirements in the product scope. Each package should become an estimateable epic with smaller implementation tasks, an owner, a dependency list, and proof of completion. P0 packages are launch scope, not optional polish.

| Package | Release | Deliverable | Dependencies | Requirement coverage |
| --- | --- | --- | --- | --- |
| W01 Discovery and source access | P0 | Existing-system audit, source permissions, decisions and coverage sample | Owner access | FC-23 |
| W02 Design and content model | P0 | Screen inventory, responsive components, category structure, language patterns | W01 findings | FC-01, FC-16, FC-31, FC-32 |
| W03 Directory foundation | P0 | Canonical records, staging import, deduplication, provenance, rollback | W01 | FC-23, FC-24, FC-25 |
| W04 Discovery and details | P0 | Search, filters, ranking, detail pages, source links, no-match states | W02, W03 | FC-01 through FC-07 |
| W05 Operations console | P0 | Roles, corrections, guide review, source freshness and audit history | W03 | FC-25, FC-26, FC-34 |
| W06 AI chat | P0 | Grounded tools, citations, context, abstention, fallback and urgent-help routing | W04; privacy design | FC-08 through FC-13 |
| W07 Plans and guides | P0 | Explicit local saving, progress, export, deletion, reviewed guides | W02, W04; W06 for generated plans | FC-11, FC-14, FC-15, FC-16 |
| W08 Weather and alerts | P0 | NWS connector, source-aware alert display, official Denver links | W02; connector review | FC-20 through FC-22 |
| W09 Privacy and accessibility | P0 | Consent, shared-device behavior, access checks, multilingual and low-data QA | Starts with W02; applies throughout | FC-27 through FC-33 |
| W10 Monitoring and recovery | P0 | Dashboards, redacted logs, spend limits, backups, incident controls | W03 onward | FC-12, FC-35, FC-36 |
| W11 Evaluation and pilot | P0 | Reviewed scenarios, quality report, usability sessions, launch checklist | All other P0 packages | All P0 requirements |
| W12 Browser voice | P1 | Voice session UI, interruption, text fallback, voice evaluation | W06, W09, W11 | FC-18 |
| W13 AI phone pilot | P1 | Dedicated number, routing, disclosure, session and cost controls | W12 learnings; approved carrier setup | FC-19 |
| W14 Sync and reminders | P1 | Optional accounts, private plan sync, revocable sharing, opt-in reminders | W07, W09; delivery-service setup | FC-15, FC-17, FC-28, FC-29 |
| W15 Provider participation | P1 | Provider verification, claims, moderated updates and conflict handling | W05; operations staffing | FC-24, FC-26, FC-34 |
| W16 Partner referrals | P2 | Consented referrals and confirmed status exchanges | Agreements, receiving systems and support | Separate detailed scope required |

Within P0, start with a complete vertical slice: an authorized record enters staging, is reviewed, appears in search, opens a usable detail page, and supports a next-step plan. Add AI only after that path works without it.

## 4. Resource record contract

The database must distinguish an organization from a service and a service from its locations. Use stable internal IDs and source IDs. Preserve the source's original data where permitted, and normalize it for search without discarding provenance.

At minimum, a returned resource needs:

- `id`, `organization_id`, `name`, `summary`, and `category_ids`.
- `service_area` with explicit area type and coverage, separate from office coordinates.
- `locations` with physical or virtual access and an address-visibility rule.
- `contacts` with channel, value, source, and any scope-specific notes.
- `eligibility`, `cost`, `documents`, `intake`, `languages`, and `accessibility`, with unknown values represented explicitly.
- `schedule` with time zone, regular hours, exceptions, and intake cutoffs where supplied.
- `operating_status`, independently from any time-limited `capacity_status`.
- `sources`, `source_updated_at`, `fetched_at`, `reviewed_at`, and `record_version`.
- `publication_status`, rights or attribution requirements, and applicable confidentiality flags.

Validate contact values and links before publication. Render approved structured facts directly; do not ask the model to recreate a telephone number, URL, or address from prose.

For conflicting source values, retain both as evidence and route important conflicts to review. A provider-confirmed change should not be erased by an older import. Deletion or withdrawal must propagate to public pages, search indexes, caches, and generated recommendations. Saved plans should display that a referenced resource has changed or is no longer available rather than silently redirecting it to a different organization.

Maintain a mapping to the chosen Open Referral HSDS profile where useful. Do not declare formal conformance until the exported representation is validated against that profile.

## 5. Proposed public and administrative interfaces

These are logical contracts, not a mandate to replace existing routes. Version external interfaces if they will be consumed by partners. Every response should carry a request ID and a safe, actionable error state.

| Interface | Purpose | Key controls |
| --- | --- | --- |
| `GET /api/resources` | Search with query, area, filters and pagination | Input bounds; deterministic filters; source versions; no private fields |
| `GET /api/resources/{id}` | Approved resource details | Publication and confidentiality checks; meaningful freshness |
| `POST /api/chat/sessions` | Create short-lived conversation | Rate limits; privacy choices; no account requirement in P0 |
| `POST /api/chat/sessions/{id}/messages` | Process a message and stream a response | Session authorization; cancellation; message-size bounds; grounded tools |
| `DELETE /api/chat/sessions/{id}` | Clear retained session data under the policy | Session authorization; actual removal and retention explanation |
| `GET /api/guides` and `/api/guides/{slug}` | Read published, language-specific guides | Published revision only; review date and sources |
| `GET /api/weather` and `/api/alerts` | Source-aware local information | Geographic validation; source timestamps; stale and unavailable states |
| `POST /api/corrections` | Submit a bounded resource correction | Abuse controls; minimal personal data; moderation before publication |
| Administrative import and publish actions | Stage and approve resource batches | Staff authorization; validation; diff; audit log; rollback |
| Administrative guide and correction actions | Review and publish content changes | Roles; history; explicit review state |

P0 plans live on the user's device only after an explicit save. A plan export can be produced on-device. Do not add cloud plan endpoints just to implement a local save button.

P1 authenticated plan APIs must enforce object ownership on every read, write, export, delete, and share operation. Sharing requires unguessable tokens, expiration, revocation, no indexing, and a clear statement about what recipients can see. Secrets or personal details must not be embedded in URLs.

## 6. AI execution contract

The application controls retrieval, allowed actions, and output validation. The model interprets the need and communicates supported results.

1. Accept the message and permitted session context. Detect obvious urgent-help needs without blocking access to the urgent-help page.
2. Extract only relevant search intent and constraints. Preserve the distinction between what the user said and what the system inferred.
3. Ask a useful follow-up if an essential detail is missing; otherwise search.
4. Retrieve approved records with geographic and publication rules enforced by the server.
5. Construct an evidence bundle containing record IDs, source URLs, factual fields, versions, and freshness.
6. Generate a concise answer and structured suggested actions.
7. Validate that every recommended record exists in the returned evidence and that contacts and links come from approved fields. Reject invalid references.
8. Render results and sources. Offer a plan, another search, or human contact as appropriate.

Initial tool set: `search_resources`, `get_resource`, `search_guides`, `get_guide`, and `get_local_conditions`. Tools are read-only in P0. Producing a draft plan is allowed; persisting it remains an explicit interface action. No arbitrary browsing, shell access, outgoing email, application submission, or provider contact is available to the chat model.

Recommended response structure includes answer text, resource IDs, source references, missing information, suggested next steps, and a safe error or escalation state. Do not expose hidden reasoning or internal scores. Present plain explanations such as “This program lists your county as a service area.”

If a provider record is unavailable or an answer cannot be grounded, retry retrieval within a bounded policy or return a clear limitation. Do not hide retrieval failure behind a fluent answer. Test instructions embedded in imported records, fabricated citations, and requests to reveal private data.

Version prompts, tool schemas, models, and the evaluation dataset. A model change requires regression evaluation. Keep operational traces redacted and independent from any optional user conversation history.

## 7. Plans and conversation persistence

Suggested plan fields are `id`, `title`, `language`, optional general `area`, `created_at`, `updated_at`, `items`, and `source_snapshots`. Each item includes the action, resource ID where applicable, contact or official application route, things to confirm, optional personal note, and user-reported status.

P0 conversation context is short-lived. P0 plan storage begins only after the person selects “Save on this device.” Avoid persistent chat transcripts in local storage and do not log raw messages by default. A reload may restore a saved plan without restoring an unsaved conversation.

On return, check resource versions when online and flag relevant changes. Do not erase personal progress because a record changed. Exports should include the date, source information, and a reminder to confirm hours or availability where relevant.

Deleting a local plan removes local copies controlled by the application. Explain that downloaded files, screenshots, and externally shared copies cannot be recalled. P1 must specify deletion behavior for synchronization, shares, backups, and vendor systems before release.

## 8. Weather and alert integration details

For NWS, resolve the selected location to the relevant forecast geography through documented API discovery, rather than hardcoding a Denver forecast grid forever. Honor caching and retry behavior, identify requests as required, and keep observations and forecasts separate.

For alerts, persist source IDs and versions, affected area, status, effective and expiration times, original instructions, fetched time, and link. Apply geography and current status before showing an active-alert count. Deduplicate updates without losing cancellation or expiration events.

Use separate states for loading, available, stale, unavailable, and no active alerts from the successfully checked source. “No active NWS alerts for this area” must not imply that no city or public-safety emergency exists.

For Denver city notifications, start with a verified official link. A feed adapter stays disabled until its access method, authority, maintenance, and redistribution rules are confirmed. Do not scrape social-media posts and label them official city alerts without a separately reviewed integration.

## 9. Voice and phone implementation requirements

Browser voice and telephone sessions share approved search tools and answer rules, but need their own interaction and quality testing. Keep audio credentials on the server and use the provider's intended short-lived client-session mechanism for browser audio.

A phone implementation needs a dedicated number, carrier connection, inbound request verification, per-call configuration, session lifecycle tracking, rate and cost limits, language handling, and recovery behavior. Verify the current provider documentation during implementation instead of copying a fixed model name from this handoff.

The caller hears AI identification before substantive assistance. Any recording or summary delivery follows the approved privacy design. Confirm recipient and content before sending a text or email. Never use a displayed caller number as sufficient proof to reveal an existing private plan.

Treat transfer as a multistep outcome: user asks or agrees, the destination is checked, transfer is attempted, and a successful connection or fallback is observed. If the carrier only acknowledges the transfer request, do not report that a person answered. Maintain a verified full-number destination for any managed 211 referral if such routing is approved.

Test repeat, pause, interruption, noisy audio, accent variation, long silence, reconnect behavior, and the ability to end the call. Use plain fallback language if AI is unavailable. Emergency routing does not imply that the system can call emergency services on the user's behalf.

## 10. Acceptance scenarios

Maintain test records in an isolated fixture dataset with no real personal information. Add ordinary software tests where they protect behavior, but validate the user experience through rendered pages and real interaction as well.

| Test | Scenario | Required outcome |
| --- | --- | --- |
| T01 | Location permission is refused | City or ZIP entry still works; no repeated permission loop |
| T02 | Provider office is outside the user's county but serves it | Relevant service remains eligible for matching |
| T03 | A resource has no published eligibility or accessibility detail | UI says unknown or asks to confirm; does not infer a favorable answer |
| T04 | All filters eliminate results | Explain the lack of a match and offer specific changes without inventing results |
| T05 | Published hours cross midnight or include a holiday exception | Correct local schedule behavior; no unsupported capacity claim |
| T06 | User changes city or need halfway through chat | Subsequent search uses the corrected context |
| T07 | A source contains instructions to change assistant behavior | Treat them as data; tools and policy remain unchanged |
| T08 | Model references a resource or phone number not in retrieved evidence | Validation prevents unsupported contact information from reaching the user |
| T09 | AI service fails or reaches a spending limit | Directory and urgent-help routes remain usable; chat explains the failure |
| T10 | Immediate danger or crisis language appears | Show reviewed urgent-help guidance promptly; no blocking questionnaire |
| T11 | Person saves a plan and reloads | Explicitly saved plan persists on the device with progress intact |
| T12 | Person clears saved information on a shared device | App-controlled saved data is removed; limitations of downloaded copies are explained |
| T13 | A saved resource changes or is withdrawn | Plan indicates the change and offers alternatives without erasing personal status |
| T14 | Spanish user follows a complete journey | Interface, chat, guide, plan, and fallback remain understandable and consistent |
| T15 | Keyboard, screen reader, large text, or narrow viewport is used | All core tasks remain possible without traps, clipped controls, or hidden status |
| T16 | A restricted address is present in source data | Public pages, AI tools, exports, and logs do not disclose it |
| T17 | An alert expires, is cancelled, or is replaced | Active display and counts reflect the latest valid status |
| T18 | Weather or alert fetch fails | Show unavailable or dated cached information, never an inferred all-clear |
| T19 | A correction is malicious or mistaken | It remains pending until authorized review; live records are unchanged |
| T20 | An import is incomplete or unexpectedly removes many services | Quarantine or review the batch; preserve the last approved dataset |
| T21 | P1 user requests another user's plan ID or old revoked share link | Server denies access on every route, including export |
| T22 | P1 caller interrupts, stays silent, or disconnects | Voice state recovers or ends cleanly; no uncontrolled call or billing loop |
| T23 | P1 carrier acknowledges transfer but destination fails | No false success claim; caller receives the tested fallback where technically possible |
| T24 | P1 reminder consent is withdrawn | Future delivery is suppressed and revocation is recorded |

AI evaluation must include more cases than these examples. Use at least 100 reviewed realistic prompts, mark which are answerable from the fixture data, and score relevance, grounded facts, useful next steps, uncertainty handling, and language quality. Report failures by type rather than one blended score.

## 11. Operational targets and recovery

Treat the product scope's latency and availability figures as proposed pilot targets. Specify load and measurement boundaries before using them as acceptance criteria. Record directory uptime and AI uptime separately; measure phone success separately once released.

The operator needs switches to disable a failing source, AI generation, notifications, browser voice, or phone routing independently. An outage response must preserve safe public navigation whenever possible.

Prepare runbooks for bad directory data, wrong public contact information, AI-provider outage, suspected private-data exposure, stale alert ingestion, excessive spend, failed import, and database restoration. Run at least one backup restoration and one AI-outage exercise before public launch. Set and approve recovery-time and recovery-point targets based on hosting and operating budget.

Monitor error rates and aggregate actions without copying sensitive message text into analytics. Protect administrative sessions, require stronger authentication for staff, audit publishing and access changes, and maintain a process for revoking staff access.

## 12. Design delivery checklist

- [ ] Finalize the working wordmark and descriptor without implying official 211 ownership.
- [ ] Deliver mobile and desktop Discover, Search, Detail, Ask, Guides, Saved, Alerts, and Urgent Help screens.
- [ ] Include first use, loading, empty, error, stale, offline, unknown, and permission-denied states.
- [ ] Specify text sizes, spacing, touch targets, focus, contrast, reduced motion, and responsive behavior.
- [ ] Provide English and Spanish copy for the entire P0 journey.
- [ ] Show save-on-device wording, deletion controls, export, and shared-device cautions in context.
- [ ] Keep actual emergency instructions and high-risk guide content subject to editorial review.
- [ ] Design voice and phone separately as P1, including disclosure, mute, end, failure, and human-contact states.
- [ ] Verify that every public button is functional or intentionally absent until its feature launches.

## 13. Engineering handoff completion checklist

- [ ] Repository and deployment inventory, setup instructions, and architecture decisions are documented.
- [ ] Source agreements, attribution rules, and directory update ownership are documented.
- [ ] Field mappings, nullable values, geographic rules, and confidential-field rules are tested.
- [ ] Imports support validation, staged publishing, rollback, and deletion propagation.
- [ ] Search works without AI and includes a useful no-match path.
- [ ] Chat recommendations resolve to approved records and source links.
- [ ] Privacy choices, access controls, retention, and deletion are implemented and tested.
- [ ] Plans survive intended reloads, export cleanly, and can be removed.
- [ ] Priority guides have named owners, reviewed translations, sources, and review dates.
- [ ] Weather and alerts handle stale data, geography, expiry, cancellation, and failures.
- [ ] Accessibility and user testing cover the required devices and launch languages.
- [ ] Monitoring, spend controls, backups, and incident ownership are in place.
- [ ] Evaluation results and unresolved defects are delivered with the release.
- [ ] Production claims match actual coverage, integrations, and supported hours.
- [ ] The product owner reviews a working staging release before a separate launch decision.

## 14. First implementation milestone

After repository access and implementation authorization, complete W01 and define a small, representative authorized dataset. Build one end-to-end journey covering childcare or utility assistance: search, detail, grounded chat, a saved plan, and a no-match fallback.

Use that milestone to validate the data model, design, quality controls, and effort estimate. Then expand categories and complete the other P0 packages. Present evidence of working behavior and remaining dependencies rather than claiming completion from screenshots or a successful build alone.
