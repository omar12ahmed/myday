# Myday architecture and cybersecurity integration

Analysis and implementation: 5 October 2026. Source checkout: `myday-site`. The parent `Myday` directory is a workspace, not the Git repository.

## Existing architecture

| Area | How it works |
| --- | --- |
| Front end | React 19, TypeScript, Vite and Tailwind; shared Card, Button, Field and link components. Warm theme tokens, responsive navigation, accessible form labels and optional reduced motion. |
| Navigation | `App.tsx` subscribes to the URL hash. `shell/sections.ts` selects Today, Calendar, Projects, Finance, Health or Study. Each feature interprets its own nested hash routes. Older Inbox/Notes links are rewritten. |
| State | `data/storage.ts` owns `myday.data.v4`. Components read a `useSyncExternalStore` snapshot through `useMyDay` and write cloned drafts with `update`. Transient presentation state stays in React. Normalisers validate loading, import and sync. Corrupt/newer data is protected; exports and imports are already available. |
| Data model | One version-4 document contains daily lists/plans, context, calendar/rota/pay, Study, health, finance, notes, tasks, patterns and projects. Study is topic → stage → course → module → section → task, with separate sessions, concepts and revision attempts. |
| Account sync | Supabase Auth plus version-checked push/pull RPCs. `sync/records.ts` maps the document to singleton settings/roadmap records and individual records for sessions, notes, projects, etc. Conflicts are surfaced. SQL grants and per-account RLS protect the data. |
| AI | The browser calls the authenticated `ai-plan` Edge Function. It validates a bounded request, checks rate and spending limits, then calls the configured provider. Keys stay on the server. Existing planning/task suggestions are validated and explicitly applied by the user. AI has no direct store or database write capability. |
| Offline/install | A generated service worker caches the built release, including lazy chunks and public assets. Device data stays in the normal storage layer. The Android app is a web wrapper around the published site. |

Existing uncommitted work in `data/notes.ts`, `data/types.ts` and `data/understand.ts` was preserved. Only the cybersecurity type addition was made to the shared types file.

## What is implemented

- **Study → Cybersecurity** is available on both an empty and an existing Study dashboard. The workspace loads separately from the initial app bundle.
- Browse all 11 paths, their required/optional modules, every lesson, practical exercise, knowledge check, cumulative lab, module assessment and project. The toolkit includes 11 environment specifications, optional challenges and the synthetic practice files. Resource links retain the package's verification date; no new claim of current access or pricing is made.
- Import a selected path into the existing roadmap. Imports use a versioned namespace with stable IDs, are additive and repeatable, and preserve existing courses, progress, notes and Today. Switching paths retains earlier imports. Imported lessons can use existing study sessions/check-ins; sessions and task pages link back to the full lesson.
- Record drafts, input/scenario, environment, assistance, answers, redacted evidence, rubric rows, critical checks and a resume point. Drafts survive reload. Submissions are retained; retries create separate attempts.
- Show a transparent **provisional task score**, using the supplied rubric. Assisted practical scores are capped at 60, unresolved critical checks result in 0, and historical rubric versions are not rescored using the current rubric. Knowledge checks without a numerical rubric receive no invented numerical grade.
- Show knowledge-check answer guides only after a saved submission and an explicit request. The guide is in a separate chunk and never enters the tutor prompt. This is a self-study presentation rule: the static site's assets, including the guide, are inspectable by the device owner and cached offline. It is not secure exam delivery. The separate starter-data tutor ground truth is not published.
- Optional AI explanations use the existing authenticated provider and budget pipeline. Requests contain only a known lesson ID, curriculum version and the question explicitly typed into the tutor box. The server selects lesson content from its generated catalogue; notebook entries and check answers are not supplied. Responses must match the selected lesson and a bounded text-only contract. Responses are displayed as unverified explanations and cannot award scores or change stored work. Mock mode is labelled as rules-only.
- Fixed malformed Study URL decoding, which previously could throw and blank the Study screen. Fixed AI abort-listener cleanup and cancellation after asynchronous sign-in lookup. Named AI actions are now rejected by the planning validator so an invalid tutor request cannot bypass its stricter validator.

## Static content and learner records

### Free-first assignments and in-app practice

`content/cybersecurity/MyDay_Practice_Activities.json` is an independently versioned overlay. It currently contains **12 external assignments and 3 in-app interactives**, attached to relevant lessons and the introductory lab. The original curriculum remains intact. This is a curated starting set, not a claim that every lesson has an equivalent third-party lab.

- TryHackMe: the tutorial, networking room Tasks 1–4 and Linux Part 1 Tasks 3–6. Public room instructions were checked on 5 October 2026; authenticated machine allowances were not tested. Access limits are stated and alternatives provided.
- OverTheWire: the first Bandit connection and file-reading level.
- PortSwigger: three free Academy labs covering introductory injection, reflected browser input and administrative access control.
- Ubuntu, Python, Pro Git, MDN and Microsoft Learn: specific MyDay-authored exercises using free official documentation. Local tool requirements are stated separately from account requirements.
- MyDay: four scope decisions with feedback; three configurable network fault scenarios with a connection trace; a filterable synthetic authentication dataset with validation/deduplication count checks and an evidence-based investigation prompt.

The **Practice** shelf filters for in-app or no-personal-account activities and searches by provider, lesson or title. Assignments show time, steps, scope, evidence prompts, source-check date and an alternative. Starting creates a draft; an ordinary external link opens the provider separately. No launch marks work complete. On return the learner records completed, partial or blocked work, evidence, assistance and a resume point. Submitted records remain immutable; retrying makes a new one. Completion is explicitly self-reported and cannot complete roadmap tasks or satisfy mastery gates.

The overlay reuses `CyberAttempt` without a saved-schema change or additional database kind. Its `rubricVersion` is `practice-<overlay version>`; answers use the already-supported `assessment.practice.*` namespace. Old versions remain readable and are not regraded. Normalisation, export/import, classic preservation and account records all use the existing notebook pipeline. Interactive checks are deterministic and local; they assess choices/counts, never claim to assess the free-text explanation or real-world skill. Network settings and the latest run are saved, but intermediate simulation runs within a draft are not separate history entries. The simulation sends no traffic and documents its assumptions.

The build gate validates IDs, lesson references, provider HTTPS URLs against an allowlist, fallbacks and fallback cycles. It generates the overlay and a fixed-format synthetic log fixture. New provider hosts must be explicitly added to the validator. When changing tasks or checker semantics, bump the overlay version so prior attempts are retained without reinterpretation.

No API keys, MCP server, provider credentials, scraping, embedded provider sessions or automatic progress sync are involved. Optional AI tutor explanations remain separate. All observations belong in the learner's notebook; no provider challenge flags are required.

Both curriculum and practice submissions require a confirmed local write before showing success. If browser storage is full or blocked, the draft stays editable and the UI reports the failed save; no completion is claimed. Draft editing keeps the app's existing storage-warning and backup behaviour.

The supplied package is retained under `content/cybersecurity/`, including the human curriculum, canonical JSON, schema, tutor specification, validator, report and synthetic fixtures. The canonical JSON remains separate from learner data.

`npm run curriculum:prepare` runs the package's structural/graph validator and generates the learner catalogue, separate answer guide, server tutor lesson catalogue and downloadable synthetic fixtures. `npm run build` runs this gate automatically. Python 3 and the existing Node dependencies are needed; no new runtime dependencies were added. Run the preparation command after editing the canonical content when using the development server directly.

The version-4 saved document gains a top-level `cybersecurity` section:

- `pathId`: preferred path.
- `attempts`: individually identified records with content/rubric versions, timestamps, activity, environment, input variant, assistance, evidence, answers, rubric scores, critical-check result and resume point.

This is an additive section, with an empty default for older backups. The classic app preserves unknown top-level sections, so no rewriting of existing user data or destructive schema migration is needed. Normalisation rejects damaged attempts and reports them through the existing damaged-data UI. Self-assessed records cannot set `verified: true` through import.

Sync mapping: `cybersecurity:preferences` is a singleton; `cyber_attempt:<id>` is one record per attempt. This avoids making every notebook entry part of one large roadmap conflict. Each still uses the existing conflict/version checks. The new migration widens only the allowed record kinds and deletion rules, leaving existing rows, grants, RPCs and RLS unchanged.

## Deliberate limits

The supplied adaptive tutor policy calls itself a proposed policy, not an implemented tutor. This integration delivers the package's record-and-assess milestone and the complete content browser. It does **not** claim to implement calibrated longitudinal mastery, verified assessment, automatic prerequisite advancement, or the full spaced-review/daily-scheduling policy. Self-assessment is always provisional; exact prerequisite thresholds are shown and never treated as satisfied by reading, a timer, a checkbox or AI output. Learners can explore lessons manually. Existing general Study revision continues unchanged.

The curriculum is a catalogue of objectives, activities and resources, not a complete textbook or hosted lab service. No labs or paid/cloud environments are provisioned. Evidence text is included in the user's ordinary backup and account sync, so the UI asks for redacted work rather than sensitive lab data.

## Release order

This work is local and has not been published, applied to a live account or committed.

1. Back up live Myday data using the existing Export control.
2. Apply `supabase/migrations/20261007120000_sync_cybersecurity.sql` to the production database before publishing a client that sends the new record kinds.
3. Deploy the updated `ai-plan` function (including generated `tutor-lessons.ts`) before enabling tutor requests in the new client. Existing AI provider configuration and limits are reused.
4. Publish a tested application release through the existing deployment workflow. The Android wrapper will load it without a new wrapper build.

Without steps 2 and 3, the previous production backend does not accept the new record kinds or tutor action. The application and notebook work in a local preview without account/AI configuration. Deployment of the migration and function is still required for production account sync and AI explanations.

## Verification

The implementation adds `cybersecurity-rules` and `app-cybersecurity` suites and includes them in the default test runner. They exercise content import and preservation, all path mappings, normalisation, attempt scoring/failure retention, answer release, request/response privacy contracts, authenticated mock tutor calls, first-five-lesson rendering, timer links, reload, classic compatibility and phone layouts. The database suite also checks new record kinds, cross-account isolation, stale writes and tombstones.

Tests use synthetic work and temporary browser profiles/local Supabase stand-ins. They do not validate live model quality, live Supabase deployment, lab correctness or learning outcomes.

Initial integration verified on 5 October 2026: package validation, TypeScript/production build, lint and diff whitespace checks passed. All 25 selected regression suites passed on their final runs, including 28 browser curriculum checks, 29 curriculum/AI contract checks, 70 database checks and 103 two-device account-sync checks. Three older compatibility expectations were updated to assert the additional empty learner section and preference record explicitly; the affected suites were rerun successfully. Light/dark desktop and phone screenshots were visually inspected. Vite still reports large bundles; the curriculum is lazy-loaded, while the pre-existing main bundle warning remains.

Free-first practice verified on 5 October 2026: all 25 selected regression suites passed again, covering the broader app, account stand-in, AI, offline installation and curriculum. After the confirmed-write submission fix, the final focused run passed **53 browser checks and 57 curriculum/practice/AI contract checks**, including forced storage failures that leave drafts editable. Build, lint and whitespace checks passed. The three interactive checkers and all 15 overlay references validate; 12 external assignments and 3 interactives connect to 51 distinct lessons. Phone (dark) and desktop (light) practice screenshots were inspected. Provider sign-in and live backend deployment remain untested. A final attempt to inspect the user's in-app preview was blocked by automatic approval review due to its usage limit; no browser workaround was attempted.
