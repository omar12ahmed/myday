# MyDay repository guidance

## Purpose and sources of truth

MyDay is an ADHD-friendly daily planner built by an owner who is learning while building it. The current app is React, Vite, Tailwind CSS and TypeScript in `app/`; `index.html` is the classic fallback. Both are published at the same origin and share saved data.

This repository is public. Never add personal details, real saved data, email addresses, account or organisation names, cloud project identifiers, private notes, credentials, signing material, or private service URLs to code, tests, commits, screenshots, or documentation. Use made-up data.

Read only the documentation relevant to the task:

- `app/README.md`: product behaviour, saved data, design, feature locations and release history.
- `tests/README.md`: suites, prerequisites and test behaviour.
- `deploy/README.md`: publishing and rollback.
- `supabase/README.md`: sync, migrations and server deployment.
- `supabase/PROJECT_STORAGE.md`: project-record conversion, coordinated rollout and rollback.
- `ai-eval/README.md`: AI evaluations.
- `android/README.md`: the Trusted Web Activity.
- `design-system/myday/MASTER.md`: detailed design decisions.
- `CYBERSECURITY_INTEGRATION.md`: Cybersecurity curriculum boundaries.
- `specs/`: approved or proposed feature specifications.

Do not duplicate release numbers, suite counts, model versions, deployed settings, or completed-work logs here. Check the current source and the relevant documentation instead.

These are the canonical repository instructions; `CLAUDE.md` is an entry point and `.claude/agents/` contains optional helpers. Read any more specific `AGENTS.md` in the files' directory path before editing. Review findings, proposed specs and archived notes are context, not authorisation to implement their suggestions.

## Repository and branch safety

- `react-rebuild` is the source branch. `main` contains only the built GitHub Pages website; never edit or commit to it by hand.
- Verify the current branch and worktree before editing. Preserve existing user changes and do not switch branches merely because the branch is not `react-rebuild`.
- Record the initial working-tree status. Never stash, reset, clean or discard someone else's changes to make a check or release succeed. Keep neighbouring worktrees and private support folders outside the task unless explicitly requested.
- Feature work normally uses a branch and its own worktree from `react-rebuild`. Do not create, merge, tag, push, publish, or rewrite branches unless the task authorises that action.
- The owner makes product decisions. Implement an agreed request; do not build undecided ideas from old notes or release history. If a missing decision would materially change the result, explain the choice and ask.
- Cloud sessions are not part of the current workflow. Files under `cloud-tasks/` are archived records unless the user explicitly reactivates one.

## Product principles

- MyDay turns vague intentions into manageable action through **capture → understand → organise → explore → decide → act → reflect**. Projects are the spine, and a project's one next step is what reaches Today.
- Keep the app calm, minimal and understandable. Start simple, avoid unnecessary rewrites, and explain the practical problem before proposing a new feature.
- Use friendly, supportive, non-judgemental plain British English. Never use guilt, shame, pressure, punishment, scores, or percentages for personal progress. Prefer places and counts; missed days cost nothing.
- Preserve the app's established names and wording. Do not present an unbuilt or placeholder feature as working.
- The owner decides plans and product direction. Offer concise choices with a recommendation when a decision is genuinely needed.

## Architecture and implementation

- Keep UI components, storage, and calculation logic separate and understandable. Relevant code lives in `app/src/components/`, `app/src/data/`, and the feature folders under `app/src/`.
- Port shared behaviour from `index.html` rather than reinventing it. The classic app stays unchanged unless the task requires it, but shared saved fields and behaviour must remain compatible.
- Screens use hash addresses. Preserve legacy-link handling in `app/src/shell/legacyLinks.ts` and Vite's relative `base` behaviour.
- Prefer existing components, tokens and patterns. Do not add another UI framework or a new production dependency without a clear need and the owner's agreement.
- Keep unrelated changes separate. Do not reformat or rewrite files outside the task.
- Treat comments and documentation as part of the implementation when behaviour, commands, routes, data shape, or safety boundaries change.
- Curriculum and audio preparation runs before production builds and writes generated files. Change the canonical sources and preparation scripts rather than patching generated catalogues or manifests; follow the relevant content README for validation.

Common local commands:

- Use a Node version satisfying `app/package.json` and the selected check's prerequisites in `tests/README.md`; the test runner requires Node 22 or newer, Chrome and Python 3.
- Install app packages when needed: `cd app && npm ci --no-audit --no-fund`.
- Development server: `cd app && npm run dev`.
- Production build and lint: `cd app && npm run build && npm run lint`.
- Tests from the repository root: `tests/run.sh <suite ...>`; omit suite names only for a justified full run.

## Saved data and sync

Saved data is a high-risk area. Before changing it, inspect the current types, normalisers, migrations, storage path, sync records, classic app compatibility, and relevant tests.

- Both apps share localStorage key `myday.data.v4`; its `schemaVersion` is `SCHEMA_VERSION` in `app/src/data/normalize.ts`, matched in `index.html`. A field read by the classic app must be changed in `index.html` and `app/src/data/` together.
- New-app-only sections must remain optional and must be preserved unread by older copies. Unknown fields and sections must survive round trips unchanged.
- In the React app, all saved-data reads and writes go through `app/src/data/storage.ts`. Do not bypass its validation, stale-write detection, or damaged-data reporting.
- Treat a failed write as a failed action: keep the previous saved snapshot and the user's draft, and do not announce success. Preserve the explicit storage-unavailable mode and its warning.
- Preserve backwards compatibility. Use an explicit migration when the structure changes; never reset or silently discard data. Before applying a migration to real data, ensure backups can be exported, explain the effect and rollback behaviour, and obtain the owner's confirmation.
- A release that adds or changes saved fields must update the schema version and compatibility paths. Verify what happens when returning to the previous release. Exception (owner's decision, 24 Oct 2026): an optional field in a new-app-only section, which the previous release keeps unread on the device and syncs as a new record kind the previous release ignores, keeps the current schema; prove the second part with the opt-in `app-sync-previous` against the actual previous release, and say in the release note that a device which spends time on the previous release receives other devices' changes of that kind only when they next change.
- Keep package release versions, saved-data schema versions and sync protocol versions distinct. A schema change must cover types, normalisers, both apps, import/export and migration tests together; changing a version number alone is insufficient. A wire-only sync change does not by itself change the local saved-data schema.
- Never split a UTF-16 character. Keep `mendHalves` in the save, parse and sync paths.
- Sync record definitions live in `app/src/sync/records.ts`; split project records also use `app/src/data/projectRecords.ts`, `app/src/sync/projectParts.ts` and `app/src/sync/projectUpgrade.ts`. Every synced record must survive a round trip unchanged. A new sync kind requires a new migration. Never edit an applied migration. Follow `supabase/PROJECT_STORAGE.md` before changing project wire format, upgrade or rollback behaviour.
- Keep Row Level Security enabled, grants minimal, and account records isolated. Only a publishable key may enter the client. Secret, service-role, provider and signing keys never belong in `VITE_` variables, client code, logs, fixtures, or Git.
- The Supabase URL and publishable key are public by design and stay committed in `app/.env.production` (owner's decision, 23 Oct 2026), so every build from Git syncs. Keep everything else deployment-specific (secrets, tokens, other project identifiers) in ignored local files or deployment settings; public documentation and committed templates use placeholders. Do not read or print local secrets just to review instructions or run mocked tests.
- Tests use disposable accounts and made-up data. Local sync tests use the stand-in; do not claim the real project was tested unless the explicit live check ran.

## AI boundaries

- AI replies are proposals. The app validates them and saves only after the user confirms. Models never write directly to storage or the database.
- Respect the privacy rules documented in `app/README.md` and represented by the current request-building code. Private notes are never sent. Case timelines, evidence and issues are never sent. Do not broaden any AI payload without an explicit product decision, visible preview, validation and tests.
- Check each AI job's actual request builder; the project's Private switch is not currently a guarantee across every AI tool. Previews must describe the actual payload, and changes to source data or privacy settings must invalidate stale previews, replies and proposals.
- AI/provider keys stay in server secrets. Logs contain no user content. Evaluations use synthetic material; live evaluations require an explicit `--live` run and a budget.
- Keep request schemas, server instructions, client validation and tests aligned. Use current official provider documentation when changing model identifiers, prices, endpoints or supported settings.
- Do not deploy `ai-plan`, change its secrets, apply migrations, or make live provider calls unless the user explicitly requests that external action.

## Design and accessibility

- Follow the Clarity design system in `app/README.md` and `design-system/myday/MASTER.md`; use the existing tokens in `app/src/styles/tokens.css`.
- Maintain WCAG AA text contrast in light and dark themes, keyboard access, visible focus, reduced-motion behaviour, and tap targets of at least 44 px.
- Check wide and phone layouts for affected UI. On phones, essential actions must remain reachable without horizontal scrolling.
- Use images only when they serve a clear story role, with legitimate licences, provenance and required credits. Never expose real people's contact details.

## Verification

Run checks that match the change. Targeted coverage is the default; a release by itself does not require every suite.

- App code: from `app/`, run `npm run build` and `npm run lint`, then the affected browser and rules suites from the repository root.
- Display-only changes: cover the affected screens, navigation, relevant themes, phone layout and saved-data preservation where applicable.
- `index.html`: run the relevant classic suites and new-app compatibility checks when shared data or behaviour is involved.
- Saved data, sync or migrations: include the relevant `storage`, `app-storage`, `sync-db`, `sync-records` and `app-sync` coverage according to the paths changed. Project record, size or upgrade changes also need the relevant `project-sync` and `project-sync-db` checks.
- AI changes: include the relevant `ai-rules`, `ai-server`, `app-ai`, and opt-in `ai-deno` checks. Do not call a mock or stand-in result a live provider test.
- Documentation-only changes: inspect the rendered/content result as appropriate and run `git diff --check`; do not build the app or run browser suites without a specific reason.
- Run `tests/run.sh` with no suite names only when the change's reach, uncertain dependencies, shared-core impact, or regression evidence makes targeted coverage insufficient. Explain that reason before starting a long full run.
- Use isolated `MYDAY_HTTP_PORT`, `MYDAY_CDP_PORT`, `MYDAY_SUPA_PORT`, and `MYDAY_LS_PORT` values when another run or Live Server may be active. Never use the owner's real plan for testing.
- Run builds and build-triggering suites sequentially within one worktree: distinct ports and output directories do not isolate generated curriculum/audio files. Use separate worktrees and ports if concurrent runs are necessary. Stop only processes and remove only temporary profiles created by the task.
- Account for every requested suite. Preserve failed and partial results. A documented flake may be rerun once alone, with both outcomes reported; do not weaken a valid check to obtain a pass.
- Do not repeat a passed check without new code, a failure, or an unresolved concern that justifies it.

## Releases and external actions

Do not publish, deploy, push, apply a migration, change service secrets, run a live AI evaluation, or use disposable live accounts unless the user requests that action.

When a release is requested:

1. Remind the owner to export backups on every device.
2. Bump `app/package.json`, keep its lockfile version aligned, and update relevant documentation.
3. Run build, lint and justified checks; report the actual scope rather than implying a full pass.
4. Ensure each required migration or server deployment has the owner's explicit go-ahead; do not ask again for an action already authorised in the session.
5. Follow `deploy/README.md` for building and publishing `main`.
6. Perform only the authorised live checks with disposable accounts and throwaway browser profiles, then remove them.

Never claim something is deployed, published, live-tested, backed up or rolled back unless it was actually verified.

## Completion

- Inspect `git status` and the full diff. Preserve unrelated and pre-existing changes; remove only files created by the task that are no longer needed.
- Update focused tests and documentation when behaviour changes.
- Report what changed, every check actually run with its outcome, failures or limitations, and any remaining authorised work. Keep completed checks separate from suggested or unrun checks.
