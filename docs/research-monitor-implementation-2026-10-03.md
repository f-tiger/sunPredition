# SEC disclosure monitor — implementation record

## Delivered scope

- Twelve issuer CIKs verified against the SEC official ticker file on 2026-10-03; all twelve submissions JSON files validated using the production parser.
- Company disclosure metadata and original SEC document links. Reports, current reports, amendments and selected issuance documents are monitored. Form 4 and 13F interpretation, paid news/research and financial metric extraction are outside this version.
- Initial snapshot records up to five relevant historical documents per issuer (60 in the live source sample). It establishes a baseline without backfill notifications. Same accession never becomes a new signal merely because its fetch timestamp changed.
- Source filing date, report date, raw acceptance timestamp and SunWatch first-observed time remain separate. The raw SEC acceptance timestamp is not independently timezone-verified.
- Durable owner outbox, bounded delivery, retained failures, one outage warning after grace and recovery acknowledgement. Existing 30-minute cron; no extra paid scheduler.
- `/research` and `/en/research`, `/api/research`, bounded public `POST /api/research-refresh`. Public refresh sends no Telegram messages. Existing portfolio and trading rule parameters are untouched.
- `/research`, `/research_pause`, `/research_resume` owner commands. Missing webhook headers are rejected; the private webhook secret derives from bot credentials and replaces the old public constant.
- 33 legacy core records receive pending-review status. A 30-day publication-age expiry is an operational policy; it is not an invented review. No record has a fabricated `reviewed_at`, invalidation condition or fresh endorsement.
- Public pages use canonical/hreflang, original evidence links, sitemap and llms discovery. Optional GA4 uses the AGI property, only after consent; private bot data and URL query strings are excluded. Existing IndexNow release mechanism handles the new canonical pages.

## Validation

18 focused tests cover issuer/schema validation, future dates, path validation, provenance, baseline/new/late events, rollback/history gaps, legacy review status, concurrency, failed acknowledgements, bounded batches, pause/resume, source outage/recovery, stale reads, public refresh permissions, private owner controls and bilingual SSR/analytics boundaries. Existing portfolio, mechanical rules, growth and ledger suites pass.

Both mobile (390px) and desktop (1280px) pages are rendered with Playwright. Mobile overflow and English visible-text checks pass. Production smoke additionally checks all twelve source statuses, public no-send behavior, duplicate polling, private webhook registration, unauthenticated webhook rejection, SEO discovery and both rendered languages.

## Important limits

This is evidence monitoring, not an assessment of current fair value or a trading recommendation. Financial deltas are explicitly unverified. The new strategy does not claim better returns. No source rights are assumed for commercial redistribution of premium feeds. Telegram acknowledgement and durable persistence cannot be one atomic transaction; a crash between them can repeat a message. Missing history anchors or rollbacks stop that issuer instead of silently substituting data. A delivery backlog over 500 ids stops ingestion for affected issuers until it drains. New filings discovered after baseline are retained up to the visible window; pending events are protected from eviction. Raw source snapshots for arbitrary past-time backtests are not offered.

Deployment and live receipts are verified separately from these source-code tests.

## Private configuration migration

Deployment moves missing legacy cross-service and payment bindings from the previous revision into the same existing Cloudflare Worker secrets, before new code deploys. Existing bindings are preserved; values are never printed. The current source and task history no longer embed those values. Historical Git objects are not rewritten; the legacy integration key has not been rotated across its counterpart services by this migration. New research controls use the separately derived private webhook secret.

## Release state

Prepared and locally committed; not deployed. Automatic approval review rejected publishing the full repository changes because they retain existing internal project records and payment/operations descriptions in a public repository, even after the plaintext credential and address removal. No alternative upload channel was used. Explicit authorization to publish those materials is required before another attempt. The private-binding migration is prepared, not executed. Three additional offline tests verify missing-binding migration, preservation of existing secrets and fail-closed behavior.

2026-10-03 authorization update: the user explicitly approved public publication of this code and the existing project documents, including payment/operations descriptions after plaintext credential/address removal, and deployment. The previous approval gate is resolved. Deployment verification follows.

First deployment: private-binding migration, build and existing production smoke checks succeeded. The SEC live gate caught an unsupported redirect mode before the monitor was reported as healthy. Fix uses manual redirect mode with non-2xx rejection, backed by a request-boundary regression test. Collector revision causes one new check without resetting baselines or notifications.
