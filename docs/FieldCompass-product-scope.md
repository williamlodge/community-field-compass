# FieldCompass product scope

**Working name:** FieldCompass  
**Descriptor:** Colorado Community Resource Navigator  
**Version:** 1.0 · October 7, 2026  
**Audience:** Product owner, design, engineering, resource operations, and implementation partners  
**Companion document:** [Developer handoff](FieldCompass-build-handoff.md)

## 1. Product definition

FieldCompass helps people find community resources, understand which options may fit, and take the next step. It serves people managing everyday needs across Colorado: childcare, groceries, healthcare, bills, housing, transportation, employment, benefits, and more. Housing instability is one important use case within this wider purpose.

The intended experience combines a useful resource directory with 24/7 AI chat, practical guides, and saved action plans. Browser voice and a dedicated AI phone line extend that experience in a later release. Denver weather and official alerts provide local context without taking over the homepage.

The product must support the full journey:

**Describe a need → find suitable options → understand requirements → take action → save progress → find an alternative when needed.**

The breadth of 211 Colorado is the reference point for coverage. The proposed improvement is a more accessible mobile experience, contextual matching, conversations that retain relevant context, and follow-through. This is a product direction, not a measured claim that FieldCompass outperforms 211.

### Recommended launch decision

Launch a responsive website with a Denver-area pilot and a data model that supports all Colorado counties. Show statewide resources only where usable, authorized information exists. Release AI chat alongside ordinary search, resource details, guides, saved plans, weather, and an official-alerts page. Follow with voice, phone, and optional reminders after the core resource experience passes evaluation.

Public browsing and AI resource help should be free to the person seeking assistance. Funding, operating budget, and the organization responsible for the service remain owner decisions.

### Scope status

The existing deliverables are visual concepts. The functionality described here is proposed work; it has not been built or connected to live systems in this chat. Prior mockup phone buttons, sample weather, resource examples, and availability claims are not evidence of an operating service.

## 2. Name and positioning

**FieldCompass is a provisional name.** It suggests finding direction, leaves room for expansion beyond Colorado, and does not label users by a hardship. It can also sound like a fieldwork or outdoor product, so pair it with the descriptor **Colorado Community Resource Navigator** until the purpose is obvious.

Recommended naming hierarchy:

- Product: **FieldCompass**.
- Regional descriptor: **Community resources for Colorado**.
- Assistant: **FieldCompass AI guide**.
- Saved work: **My plans**.
- Editorial content: **Guides**.
- Proposed phone service: **FieldCompass AI line**.

Possible homepage copy: “Find the right local support.” Supporting copy: “Explore community resources, talk with an AI guide, and make a plan for your next step.” This is proposed copy for design work, not a final brand decision.

Before adopting the name, check trademark conflicts, domain and social-handle availability, pronunciation, spelling by phone, and reactions from community members. No name, trademark, domain, or legal clearance has been performed. Do not purchase or register anything as part of this handoff.

FieldCompass must not present itself as the official 211 Colorado service or imply a partnership unless one is established. A reference or link to 211 is different from permission to redistribute its directory. The existing homelesscolorado.com domain can remain an entry point while the owner considers a broader brand. Any domain migration requires a separate redirect and launch plan.

## 3. People and resource coverage

Design for residents seeking help for themselves, parents and caregivers, older adults, people with disabilities, young adults, veterans, newcomers, and people helping a friend or family member. Also support librarians, outreach workers, and resource navigators using public information with permission from the person they are helping.

Do not require people to disclose income, disability, immigration status, or other sensitive information merely to browse. Ask for an eligibility detail only when it affects the current search, explain why, and allow skipping it.

| Resource family | Included subjects |
| --- | --- |
| Food and household essentials | Groceries, meals, diapers, clothing, hygiene, showers, laundry |
| Housing and utilities | Rent assistance, housing navigation, shelter, eviction prevention, energy and water bills |
| Health and wellbeing | Primary care, dental care, mental health, substance-use recovery, pregnancy support |
| Children and families | Childcare, after-school programs, parenting, child development, family support |
| Benefits and financial support | Public benefits navigation, document preparation, tax assistance, financial counseling |
| Work and education | Jobs, training, adult education, digital literacy, school support |
| Transportation and access | Transit assistance, accessible transportation, travel to appointments, internet access |
| Aging and disability | Independent living, caregiver support, accessibility, assistive resources |
| Legal and personal safety | Legal aid, domestic violence resources, victim services, confidential support |
| Community and life transitions | Veterans, immigrant and refugee services, reentry, youth transitions, social connection |

These are organizing categories, not promises of local coverage. Maintain a coverage report by county, category, language, and freshness. A missing listing means FieldCompass lacks a match, not that no help exists.

## 4. Core journeys

### A parent needs childcare

The person describes evening work and a childcare need. The guide asks for city and age range only as necessary, then searches for relevant services and assistance programs. Results explain schedule information, costs, eligibility uncertainty, and how to contact the provider. The person saves a plan to check openings and financial assistance. The guide never claims an opening exists without a current source.

### A household needs help with bills

The person chooses utilities or describes an overdue bill. The guide asks the service area and any relevant deadline, retrieves programs, and explains application steps and documents from source material. The person marks a step completed or returns with “I was turned down.” FieldCompass records a user-reported status and searches for alternatives without claiming an official application decision.

### An older adult needs accessible transportation

The person can use search, a screen reader, or a later voice channel. Matches account for service area, accessibility information, advance booking, and rider requirements. Unknown accessibility is clearly distinguished from confirmed accessibility. Phone numbers are easy to read and call.

### Someone needs urgent help

A persistent urgent-help route offers the appropriate emergency or crisis contact without requiring a chat, account, or questionnaire. For immediate danger, show 911. For suicide or mental-health crisis support, show 988. Community navigation remains distinct from emergency response. Do not imply that FieldCompass dispatches help or continuously monitors conversations.

### A first option does not work

The person returns to a saved plan and selects “Could not reach them,” “Not eligible,” or “No availability.” The guide asks whether to search further, considers the new constraint, and preserves useful progress. A user report is not automatically published as a change to the provider's listing.

### A person wants to talk

Browser voice and the later dedicated phone line use the same approved resource information and rules as text chat. The assistant identifies itself as AI, can repeat or slow down, and offers human contact options. Sending a summary or initiating an available transfer requires the caller's choice.

## 5. Release boundaries

P0 is the required public-pilot scope. P1 is the next release after core quality and operating readiness are demonstrated. P2 is expansion that requires additional agreements, staffing, or validation. “Later” is a sequencing decision, not removal from the product vision.

| Capability | P0 public pilot | P1 follow-through and voice | P2 expansion |
| --- | --- | --- | --- |
| Resource discovery | Search, browse, filters, details, contact links | Better personalization and comparisons | Wider verified geographic coverage |
| AI | 24/7 text entry point with outage fallback | Browser voice and dedicated AI phone pilot | Additional languages and evaluated enhancements |
| Plans | Explicit on-device save, edit, delete, print or download | Optional account sync, private sharing, reminders | Consented collaboration with navigators |
| Guides | Reviewed priority guides in English and Spanish | More guides and audio versions | Region-specific editorial programs |
| Weather and alerts | NWS weather and alerts; official Denver links | Authorized city feed if available; opt-in notifications | Additional local sources and jurisdictions |
| Resource operations | Authorized import, review, corrections, audit log | Provider claim and update workflow | Partner referral integrations |
| Accessibility | Responsive web, keyboard and screen-reader support, low-data experience | Voice accessibility and more device coverage | Additional assisted-access channels |
| Referrals | Contact and official application links | User-controlled contact summaries | Confirmed closed-loop referrals with partners |

Do not include native app-store apps, automatic benefit applications, identity-document uploads, payments, unsolicited outbound calls, emergency dispatch, clinical diagnosis, legal representation, or eligibility adjudication in P0. Do not promise guaranteed service access, real-time capacity, or guaranteed human availability.

## 6. Experience and design requirements

Use the current community-focused mobile concept as the visual direction: [reference mockup](colorado-community-mobile-v3.png). Its previous “Colorado Community” name is superseded by the working FieldCompass name. The earlier homelessness-focused concepts are not the product brief.

Keep the Apple-inspired simplicity: readable system typography, generous touch targets, restrained rounded surfaces, clear focus states, and a small number of obvious actions. Avoid styling that depends on blur, motion, color alone, or a high-end phone. Housing should receive the same treatment as other categories.

Mobile navigation should use **Discover, Ask, Guides, Saved**. Weather and alerts are reachable from Discover and a dedicated page. Urgent help is accessible from every primary screen. Desktop supports the same tasks with wider layouts; it must not require a mobile app.

| Screen or state | Required content and behavior |
| --- | --- |
| Discover | Location selection, AI entry, category browsing, language control, compact weather and alerts |
| Search results | Editable filters, useful summaries, result count, source freshness, list-first layout |
| Resource detail | What it offers, who it serves, cost, hours, intake, documents, contact, accessibility, source |
| Ask | Chat, suggested replies, sources, stop and retry, reset, save-plan action, human contact |
| Guides | Searchable topics, steps, official links, review date, related resources |
| Saved | Plans and resources, progress, export, delete, clear shared-device warning |
| Weather and alerts | Source, affected area, active times, last refresh, official links, unavailable state |
| Urgent help | Clear contact choices and direct actions, available when AI is down |
| Administration | Imports, correction queue, review history, guide publishing, access management |

Design loading, no-match, unknown-hours, stale-data, offline, denied-location, expired-plan-link, AI-unavailable, and unavailable-language states. A public button must perform its advertised action. Proposed features can appear in prototypes; hide or explicitly disable them in production until enabled.

## 7. Search and matching

**FC-01 Location:** Accept city, ZIP code, or county. Offer device location only after the person chooses it. Support statewide, remote, and service-area-based programs. Do not equate a provider's office location with its service boundary.

**FC-02 Search:** Support plain language, category terms, provider names, misspellings, and common synonyms. Directory browsing must work independently of AI. Make it easy to clear filters and change the question.

**FC-03 Filtering:** Include need, area, language, cost where known, service mode, accessibility where known, and relevant eligibility attributes. Unknown values remain unknown. Show which constraints reduced results and offer to relax them.

**FC-04 Ranking:** Rank by relevance, documented service coverage, stated constraints, and information quality. Explain important matches. Do not rank paid sponsors above appropriate services. Treat incomplete records carefully rather than assuming missing evidence proves ineligibility.

**FC-05 Time and availability:** “Open according to published hours” is not “has space available.” Evaluate local time, overnight schedules, holidays, and intake cutoffs separately. When reliable hours are missing, provide “Call to confirm.” Do not manufacture “open now” badges.

**FC-06 Resource detail:** Render names, phone numbers, addresses, and URLs directly from approved records. Support virtual services, multiple locations, language availability, fees, required documents, and last-reviewed information. Protect confidential locations.

**FC-07 No match:** Offer nearby or statewide options when relevant, user-approved filter changes, and human contact. Never invent a provider to fill an empty result list.

## 8. AI chat

**FC-08 Conversation:** Maintain the person's stated need and chosen constraints during the session. Ask one useful question at a time and avoid repeating supplied answers. Allow corrections, skipped questions, conversation reset, and switching back to browsing.

**FC-09 Grounding:** Search approved resource records before recommending a service. Every recommended resource must resolve to a real record and source. Do not use the model's general memory as a provider directory. Label uncertain eligibility and missing information plainly.

**FC-10 Useful answers:** Give a small set of relevant options, explain why each may fit, identify what still needs confirmation, and offer the next action. Keep the first answer short, with detail available on demand.

**FC-11 Plans:** Convert the conversation into an editable checklist connected to resource records and source dates. The person decides whether to save it. Saving a plan is distinct from retaining the full conversation.

**FC-12 Failure and human options:** When retrieval fails or AI is unavailable, offer ordinary search, the last successfully loaded information with freshness labels, and verified human contact routes. Show actual service hours where known. The proposed 24/7 AI service does not establish 24/7 human coverage.

**FC-13 Boundaries:** The assistant cannot guarantee eligibility, openings, funds, appointments, or outcomes. It does not submit applications, contact providers, or share personal information without a separately supported and consented workflow. Benefit and legal guidance should link to official program material and qualified assistance.

Treat imported descriptions, webpages, and user messages as untrusted content. They cannot change system rules or authorize tool actions. Retrieval must not expose private records, hidden addresses, administrative notes, or another person's saved plan.

## 9. Saved plans and guides

**FC-14 Save and return:** P0 supports a deliberate “Save on this device” action for plans and resources. Explain that shared devices expose saved information and that clearing browser data may remove it. Keep unsaved conversations out of persistent browser storage by default. Provide “Clear saved information” and an export option.

Each plan needs a title, preferred language, optional general location, ordered actions, resource IDs, source snapshots, creation and update dates, and user-controlled status. Useful statuses are To do, Contacted, Waiting, Completed, and Need another option. These are personal progress labels, not provider confirmations.

**FC-15 Export and sharing:** P0 includes a readable print or download format with contacts, instructions, and source dates. Warn that downloaded files remain on the device after clearing the site. P1 adds optional account synchronization and revocable, expiring read-only links. Do not make plans publicly searchable or place personal information in link addresses.

**FC-16 Guides:** Begin with 10 reviewed guides: affordable childcare, food assistance, utility bills, rental support, low-cost healthcare, mental-health resources, benefits preparation, replacing identification, accessible transportation, and caregiver support. Add weather preparedness as local conditions warrant.

A guide includes intended audience, plain-language steps, what to prepare, official links, related resources, what to do if a step fails, language, content owner, and review date. AI may explain a guide but must not silently rewrite its published requirements.

**FC-17 Follow-up:** P1 offers reminders only after an explicit opt-in with channel, timing, quiet hours, and an easy stop mechanism. Prefer neutral notification wording on lock screens. A calendar reminder does not mean the provider has scheduled an appointment.

## 10. Voice and the AI phone line

**FC-18 Browser voice:** P1 adds an explicit microphone start control, visible listening state, mute and end controls, text fallback, and readable transcript where appropriate. Respect interruption, slower speech, silence, background noise, and correction of misunderstood names or locations.

**FC-19 Dedicated phone:** P1 adds a separate FieldCompass telephone number connected to the same approved search and planning capabilities. OpenAI documents incoming phone connections using SIP and call-transfer support; this establishes technical feasibility, not an existing FieldCompass phone service. [S2]

The call must begin with AI identification and an understandable explanation of any processing or recording choices. Do not retain raw recordings by default. A real-time audio service still processes audio; “not saved by FieldCompass” must not be described as “no audio processing or retention anywhere.” Review actual vendor terms before final privacy language.

Call flows must handle language selection, speech failure, keypad fallback where supported, long silence, disconnection, no matches, urgent requests, and a failed transfer. Read important phone numbers slowly and offer repetition. Do not use caller ID alone to authenticate access to a saved plan.

Human transfers require supported routing, tested destination numbers, and receiving-party arrangements where needed. Do not assume dialing the three-digit 211 code through a carrier reaches the correct Colorado service. A separate “Call 211” action on a user's device is not the same as a managed transfer.

Budget for the number, carrier minutes, AI audio usage, monitoring, abuse prevention, and support. Set concurrency and spend controls without silently abandoning a caller. Outbound calls and automated follow-up calls require a later approved scope.

## 11. Weather and Denver alerts

**FC-20 Weather:** Use an approved weather source, with National Weather Service forecasts as the proposed starting point. NWS documents forecasts, observations, and alerts through its API. Distinguish observed current conditions from forecast periods and show units, location, source, and update time. [S3]

**FC-21 Alerts:** Show the issuing authority, original headline and instructions, affected area, effective time, expiration, and official link. Filter by geography. Handle updated, cancelled, expired, and duplicate alerts. If the feed fails, say alerts are unavailable or show clearly dated cached information; never infer “all clear.”

**FC-22 Denver city information:** Treat NWS weather alerts and City and County of Denver emergency notifications as separate integrations. The city references an official notification signup route. P0 can link to that route; an in-product city-alert feed requires verification of an authorized, maintained source. No reliable city API has been established by this scope. [S4]

Translate supporting interface text, retain authoritative wording and links, and label machine-translated emergency instructions if used. Do not let AI change an official alert's severity or invent an evacuation instruction.

Weather-related resource suggestions can point to verified warming, cooling, or other relevant services. Do not claim a temporary center is activated unless a current authoritative source says so. Notification delivery and local-alert coverage are not guaranteed replacements for official emergency channels.

## 12. Resource data and trust

**FC-23 Source permission:** Before bulk ingestion, document the source owner, permitted use, redistribution rights, required attribution, update method, and deletion obligations. The existing website's reference to 211 data does not prove authorization to reuse it. If an agreement is unavailable, use a separately authorized dataset or link to the source service; do not silently substitute scraping.

**FC-24 Publishing pipeline:** Import into staging, validate schema, detect duplicates and suspicious changes, review exceptions, and publish a versioned dataset. Retain a rollback path. Changes must not overwrite manually reviewed information without an explicit conflict policy.

Separate organizations, services, locations, and service coverage. Open Referral's Human Services Data Specification provides a relevant exchange model for these relationships. Mapping to it is recommended; the exact version and partner profile must be chosen during integration. [S5]

**FC-25 Freshness:** Store source-updated, fetched, and reviewed dates separately. A fresh import of an old record is not a fresh provider verification. Define category-specific review windows, surface overdue records, and hide claims of live availability when the underlying evidence expires.

**FC-26 Corrections:** Let anyone report a broken link, incorrect number, closed service, or outdated detail. Collect only what is necessary. Queue the report for review; never allow a public report to overwrite a listing automatically. Provide a way to flag possible scams or harmful listings.

Directory inclusion, corrections, and ranking need a published policy and a named resource-operations owner. Source provenance should be visible on every detail page, and applicable redistribution restrictions must carry through exports, caches, and search indexes.

## 13. Core information model

| Entity | Required purpose and fields |
| --- | --- |
| Organization | Stable ID, approved name, description, source references, contact routes |
| Service | Stable ID, organization, taxonomy, summary, cost, eligibility, intake, documents, status |
| Location and service location | Physical or virtual access, address visibility, coordinates where appropriate, location-specific details |
| Service area | Counties, ZIP codes, geographic boundaries, statewide or remote coverage |
| Schedule | Time zone, regular hours, holiday exceptions, intake cutoffs, source date |
| Contact | Channel, validated value, language or accessibility notes, scope and provenance |
| Source record | Source ID, source URL, rights, imported version, timestamps, field provenance |
| Verification and correction | Reviewer, report category, evidence, decision, old and new values, audit time |
| Guide | Slug, language, steps, sources, owner, revision, review date |
| Conversation | Session ID, consent choices, short-lived context, permitted tool activity |
| Plan and plan item | Owner or local-only identifier, steps, resource references, personal status, source snapshots |
| Alert | Source ID, issuing authority, geography, status, effective and expiry times, original instructions |
| Consent and preference | Purpose, channel, choice, timestamp, revocation, language and accessibility preferences |

Every person-owned object must have an enforceable access boundary. Public service records must not be mixed with private plans or conversation storage. Store time in a consistent machine format and display Colorado-local time with the correct daylight-saving behavior.

## 14. Technical direction

Use a responsive web application with progressive-web-app capabilities where helpful. The hosting choice and framework should follow inspection of the existing site's code and deployment, which has not occurred in this conversation. Do not assume a rebuild is necessary or adopt a vendor before that inspection.

Recommended logical components:

1. Public web interface for search, resource details, guides, alerts, and chat.
2. Server API enforcing access, input validation, rate limits, consent, and safe tool boundaries.
3. Resource database with structured and geographic search; semantic retrieval can supplement it.
4. AI orchestration that calls approved search tools and validates cited records.
5. Import and editorial jobs with staged publishing and monitoring.
6. Private plan storage only when cross-device saving is introduced; P0 can remain local-only.
7. Weather and alert connectors independent of the AI service.
8. Separate voice and telephone adapter sharing the same resource tools in P1.

Keep service selection and important filters deterministic where possible. Use the model to interpret requests and explain results, while the server controls what can be retrieved and returned. Public browsing must remain available during an AI-provider outage.

Store secrets on the server, separate development and production environments, log operational events without full sensitive conversations, and maintain backups and tested restoration. See the companion handoff for API contracts and delivery work packages.

## 15. Privacy and responsible operation

**FC-27 Data minimization:** No account is required for P0 discovery. Do not collect Social Security numbers, identity documents, precise home addresses, or full medical histories for general navigation. Default location to city or ZIP. Mask sensitive values in logs and error reports.

**FC-28 Clear choices:** Explain AI use, location access, on-device saving, optional sync, sharing, reminders, and audio processing at the point they matter. Keep choices separate. Declining one capability must not block basic browsing.

**FC-29 Access and deletion:** Enforce server-side access controls on every private object and export. Staff access is role-based, limited, and audited. Provide deletion and retention rules that include caches, indexes, logs, backups, and vendors. Exact periods are a launch decision, not an assumption of unlimited retention.

**FC-30 Sensitive circumstances:** Protect confidential service locations; provide an understandable exit route on sensitive pages; explain that exiting does not erase browser history. Use neutral saved-plan titles and reminder text when the person prefers them. Do not sell personal need profiles or use distress-related data for advertising.

Production review must address applicable privacy, communications, recording, accessibility, and child-related obligations with qualified reviewers. These are review work items, not a declaration that a particular law applies or that the product is compliant. Do not claim HIPAA compliance without establishing the role, contracts, and controls that would make the claim appropriate.

## 16. Accessibility and language

**FC-31 Accessible interface:** Set WCAG 2.2 AA as the conformance target and test it, rather than claiming compliance from a visual style. Include keyboard navigation, visible focus, headings, field labels, screen-reader announcements, contrast, reflow, reduced motion, and accessible error recovery. [S6]

Use a product design target of at least 44 by 44 CSS pixels for important touch controls; that is a usability target, not a statement that WCAG 2.2 AA universally requires that size. Avoid horizontal scrolling for primary tasks at narrow widths. Support large text and zoom.

**FC-32 Language:** Launch with English and Spanish interface and priority guides. Validate Spanish conversations with fluent reviewers, keep official program names understandable, and label translated source content when needed. Additional languages are enabled only when the end-to-end experience can be evaluated. Do not advertise every language a model can technically generate.

**FC-33 Low-connectivity use:** Keep browsing lightweight, make resource text available without decorative media, and provide printable plans. Label offline copies with their saved date. Never describe cached weather or alerts as live. Offline caching must not retain private conversations or plans without a deliberate user choice.

Include usability sessions with people using assistive technology, older phones, limited data, and people unfamiliar with service-system language. Check privacy on shared devices as part of accessibility and access testing.

## 17. Resource operations and support

**FC-34 Administration:** Staff need role-based access to imports, duplicate resolution, corrections, guide publishing, source freshness, and audit history. Provider self-service is P1 and requires verification before edits can be published.

**FC-35 Monitoring:** Monitor public search, chat failures, citation validation, source imports, stale alerts, correction queues, latency, and spend. Phone monitoring later adds routing, abandoned calls, voice failures, transfer outcomes, and cost per completed session. Use aggregate statistics and redacted diagnostics wherever possible.

**FC-36 Incident response:** Document who can disable AI, an individual source, alerts, or phone service independently. Prepare user-facing fallback text, rollback steps, and a notification path for the on-call operator. A safety-critical wrong listing or unauthorized disclosure must be removable immediately.

| Responsibility | Required accountable role |
| --- | --- |
| Product scope and launch decisions | Product owner |
| Directory rights and provider relationships | Partnership and data lead |
| Listings, guides, corrections, freshness | Resource operations lead |
| App, AI tools, integrations, security controls | Engineering lead |
| Accessible interaction and usability | Design and accessibility lead |
| AI evaluation and quality reporting | QA and AI quality lead |
| Privacy and communications review | Qualified reviewer designated by owner |
| Outage response and service support | Named operations owner |

One person may fill several roles, but each responsibility must be assigned. A 24/7 AI interface still needs an operating plan for failures outside office hours. Human referral availability must be described using verified hours.

## 18. Quality and launch acceptance

The following are proposed release targets to confirm during discovery. They are not current measured performance or contractual guarantees.

| Area | Proposed pilot acceptance |
| --- | --- |
| Resource integrity | Every recommendation resolves to an approved record; no fabricated contacts, addresses, or service names in the release evaluation |
| Critical failures | No unresolved critical privacy, security, accessibility, or unsafe-guidance defects |
| AI relevance | At least 90 percent of answerable evaluation scenarios return a relevant option in the top three, as scored by resource reviewers |
| Unanswerable needs | Evaluation includes no-match and unavailable-source cases; the guide abstains and offers an appropriate next step |
| Source attribution | Every recommended listing exposes a source and meaningful freshness information |
| Search performance | Proposed p95 search response within 2 seconds under the agreed pilot load |
| Chat responsiveness | Proposed p95 first useful response within 8 seconds under the agreed pilot load |
| Availability | Proposed 99.5 percent monthly pilot availability for the public directory, with chat measured separately |
| Accessibility | Key journeys pass keyboard, mobile screen-reader, zoom, and manual WCAG checks in both launch languages |
| Plan handling | Save, edit, export, reload, deletion, and shared-device behavior pass testing |
| Weather and alerts | Geography, expiry, cancellation, outage, and stale-cache scenarios all pass |

Build a reviewed evaluation set of at least 100 realistic scenarios before broad public launch. Include rural needs, multiple languages, conflicting constraints, overnight hours, rejected suggestions, unknown eligibility, sensitive services, and attempts to manipulate the assistant through source text. Test urgent-help routing separately and review every critical failure.

For P1 phone, add tests for noisy audio, interruption, accents, keypad input, disconnection, repeated numbers, spending limits, transfer refusal, failed transfer, and AI disclosure. A successful technical connection is not proof that a person reached a suitable human service.

## 19. Success measures

The primary outcome is whether people can identify a suitable next action and, when they choose to report it, reach useful help. Conversation length and total messages are not primary success measures.

Track discovery-to-contact actions, plan creation and return, user-reported usefulness, reported successful connections, alternative searches after a failed option, no-match rate, stale-record rate, correction turnaround, answer relevance, and operating cost per helpful session.

Distinguish a clicked phone link from a completed call, a submitted application from an approved application, and a self-reported outcome from a provider-confirmed one. Show denominators and feedback response rates. Compare outcomes by language, geography, and channel where this can be done without exposing small or sensitive groups.

Avoid collecting full chat transcripts for analytics by default. An optional feedback question can ask whether the person found a useful next step without demanding details about their situation.

## 20. Delivery sequence and budget

### Stage 0 Foundation

Confirm the owner, provisional brand, geographic pilot, operating model, data rights, existing codebase, launch categories, and staffing. Audit a representative source sample. Validate the main journeys with community members. Exit with a source-access decision, design brief, evaluation plan, and prioritized backlog.

### Stage 1 Core directory

Build the canonical data import, search, resource details, language structure, accessible navigation, corrections, guides, and operational visibility. Demonstrate useful browsing before AI is introduced.

### Stage 2 Guided help

Connect grounded AI chat, action plans, explicit on-device saving, export, source links, urgent-help routing, weather, and alerts. Test outages and no-match cases. Complete privacy choices and content review.

### Stage 3 Controlled pilot

Run the quality suite, invite a limited pilot group, review real failure patterns, resolve serious issues, and verify support ownership. Open broader access only after the release checklist is satisfied.

### Stage 4 Voice and follow-through

Add browser voice, then a capped phone pilot, followed by optional account sync, reminders, and provider self-service. Validate each channel before advertising it as available. Partner referral workflows come later.

A launch date or price cannot be responsibly fixed without repository inspection, data-access confirmation, staffing, and expected traffic. Estimate each stage after those inputs are available; source agreements and content operations may be the longest dependencies.

Budget categories include design and engineering, data licensing or partnership work, directory maintenance, translations, accessibility review, AI text usage, hosting and storage, monitoring, security review, and support. P1 adds phone numbers, carrier minutes, AI audio, message delivery, and more operational coverage.

Use scenario-based estimates: monthly fixed operations + chat sessions × average AI cost + voice minutes × AI and carrier cost + messages × delivery cost + data and review labor. Obtain current rates when selecting suppliers. This handoff does not include provider quotes or procurement authorization.

## 21. Decisions and dependencies

| Decision | Recommended default | When it must be resolved |
| --- | --- | --- |
| Final name | FieldCompass with a Colorado descriptor, subject to clearance | Before public branding or domain changes |
| Relationship to 211 | Independent service with accurate attribution; pursue authorized access | Before using or redistributing 211 records |
| Initial geography | Denver pilot; expose other areas only with supported coverage | Before content acceptance |
| Existing-site strategy | Inspect and reuse useful code and data only where authorized | Before engineering estimates |
| Funding | Free public access with an explicit operating sponsor | Before public launch |
| Saving model | Explicit local-only saving first; optional sync later | Before saved-plan implementation |
| Chat retention | Minimum needed for the session and chosen features | Before production AI configuration |
| Phone timing | P1 capped pilot after chat quality is established | Before number purchase or service advertising |
| City-alert source | Official links first; feed only after verification | Before claiming integrated city alerts |
| Languages | English and Spanish evaluated end to end | Before launch copy and QA sign-off |
| Human support | Verified external contacts; no unarranged transfer promise | Before launch and phone pilot |
| Owners and incident coverage | Named product, data, engineering, and operations leads | Before production access |

These choices do not block a prototype or detailed estimates. They do block the dependent public claims, data imports, purchases, or operational launches. Keep a dated decision log so the implementation team can distinguish an owner choice from a proposed default.

## 22. Sources and implementation notes

Sources were consulted on October 7, 2026. They establish specific capabilities and reference standards; they do not establish a FieldCompass partnership, license, integration, or conformance status. All feature priorities, release targets, and operating policies in this document are proposed product requirements.

- **S1 · 211 Colorado:** [Official service and resource categories](https://www.211colorado.org/). Reference for the breadth of community needs and published contact routes. Do not copy earlier mockup resource counts or assume human hours from the proposed 24/7 AI service.
- **S2 · OpenAI:** [Telephony and SIP documentation](https://developers.openai.com/api/docs/guides/voice-sip?voice-api=realtime). Supports the feasibility of a phone-number connection and call transfer. Actual carrier setup, access, costs, and receiving destinations must be confirmed.
- **S3 · National Weather Service:** [API web service documentation](https://www.weather.gov/documentation/services-web-api). Reference for forecast and alert integration, caching, request identification, and geographic lookup.
- **S4 · City and County of Denver:** [Emergency preparedness presentation](https://www.denvergov.org/files/assets/public/v/1/city-council/documents/d5/new-folder/rno-leadership-lunch-presentation-on-emergency-preparedness.pdf). Identifies the city's emergency notification signup route. The destination must be rechecked during implementation; this does not establish an available feed API.
- **S5 · Open Referral:** [Human Services Data Specification overview](https://docs.openreferral.org/en/v3.3.1/hsds/overview.html). Reference for exchanging organization, service, and location information.
- **S6 · W3C:** [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/). Reference for the proposed accessibility target and evaluation.

## 23. Handoff instructions

Use the [developer handoff](FieldCompass-build-handoff.md) for work packages, interfaces, acceptance scenarios, and the first implementation sequence. Use the [community-focused mockup](colorado-community-mobile-v3.png) as visual reference only; this written scope takes precedence when labels, feature availability, or behavior differ.

The next authorized project stage should identify the repository and hosting environment, validate source access, and produce implementation estimates. Publishing the site, purchasing a phone number, enrolling users in notifications, or migrating the domain are separate actions that have not been performed by this handoff.
