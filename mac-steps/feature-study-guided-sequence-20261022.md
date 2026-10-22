# Guided Study — PR #2 release follow-up

Source branch: `feature/study-guided-sequence-20261022`.
[PR #2](https://github.com/omar12ahmed/myday/pull/2) remains a draft. Live is still 1.42.1;
this branch has not been merged or published and no real learning data has been reset.

## Review and checks

The review fixes stale-backup authorisation, failed-save success reporting, partial Cybersecurity attempt
completion, obsolete draft resume, optional-lesson completion, pinned general courses and Arabic next-step
selection. A general-course check-in continues the session's own course before falling back to another course,
and names that course. The Study browser run also caught an uncaught skipped-theme-transition rejection;
its animation promise is now handled while theme changes still apply. Direct Cybersecurity start imports the
path and starts its timer in one saved change.

Build/typecheck and lint pass. The new reset suite passes 32 checks against the local PostgreSQL/Auth stand-in:
full downloaded backup, checked-file gate, cancellation, failed saves, incoming progress before/during
confirmation, deletion markers reaching another device, retained content, and restoring the downloaded file
through Import on both devices. This is not verification against a live Supabase project.

**Final local verification: 15 targeted suites, 1,394 passed, 0 failed.**

| Suite | Passed | Failed |
|---|---:|---:|
| `study-learning-rules` | 22 | 0 |
| `cybersecurity-rules` | 69 | 0 |
| `study` | 135 | 0 |
| `app-storage` | 47 | 0 |
| `app-topics` | 77 | 0 |
| `app-today` | 241 | 0 |
| `app-design` | 42 | 0 |
| `sync-records` | 55 | 0 |
| `app-sync` | 132 | 0 |
| `app-cybersecurity` | 93 | 0 |
| `app-arabic` | 72 | 0 |
| `app-study-reset` | 32 | 0 |
| `app-study` | 245 | 0 |
| `arabic-rules` | 49 | 0 |
| `study-guided-rules` | 83 | 0 |

An initial final Study run was 243/1: `FAIL no uncaught JavaScript errors` with
`AbortError: Transition was skipped. New ViewTransition started`. After handling the rejected animation
promise and adding a deterministic native skipped-transition check, only Study and layout reran (245/0,42/0).
All failed-run diagnostics are preserved locally; the fixture/setup issues were corrected without weakening
progress, backup, deletion, restore or uncaught-error assertions.

For another relevant code change, run the affected suites rather than repeating every check:

```sh
cd app
npm run build
npm run lint
cd ..
MYDAY_HTTP_PORT=8895 MYDAY_CDP_PORT=9465 MYDAY_SUPA_PORT=54355 MYDAY_LS_PORT=5605 \
  tests/run.sh study-guided-rules app-study app-arabic app-cybersecurity app-study-reset app-sync sync-records
```

Run builds that prepare shared curriculum/audio files sequentially in a worktree. Separate browser ports do
not isolate generated assets. A concurrent audio preparation caused one Arabic rules bundler setup failure
during this review; only that suite reran in isolation and passed 49/0. No full suite was run.

## Remaining before release

1. Review the final head and GitHub Actions results. Fetch without changing the current checkout:

   ```sh
   git fetch origin
   git diff origin/react-rebuild...origin/feature/study-guided-sequence-20261022
   ```

2. Preview the candidate on this Mac with the existing public sync configuration, using
   `deploy/preview-site.sh switch` (see [publishing instructions](../deploy/README.md)). Sign in with a
   disposable account in two isolated temporary browser profiles. Keep real accounts and saved plans out of
   these profiles. Record the candidate commit shown in the footer.
3. With made-up course, session, review, Arabic and Cybersecurity attempt/card data synced on both profiles,
   download and check a full backup. Verify cancellation and stale-backup blocking after a remote change,
   including a change while confirmation is open. Then reset and verify all progress deletions and fresh
   schedules reach the second profile while course content and separate notes stay. Import that downloaded
   backup and verify restored records/cards on both profiles after reload, without duplicates or conflicts.
   This disposable live-service check remains required before releasing reset for real synced records.
4. Record the live-service results, resolve any failures, complete final review and mark the PR ready only
   when its safeguards pass. Merging/publishing is a separate release step; this review did neither.
5. Before a release, follow [deploy/README.md](../deploy/README.md): fresh backups on every real device,
   choose/bump the release version, commit the source and run the checks justified by the final changes.
   No database migration or server deployment is required by this PR. Publish with `deploy/publish-main.sh`
   and `git push origin main` only as part of the authorised release, then do the disposable live smoke check.
   Rolling back the app does not restore reset learning history; use the full backup through Import.
6. Update public/private release notes and remove this file once these steps are complete. Delete only the
   disposable test profiles and their made-up account records after verification.
