# Arabic teaching audio — 1.42.0 candidate, not published

Work is on `arabic-teaching-audio`. The current live release remains 1.41.0.

1. Final checks are complete against the approved manifest: build/lint passed, 54 default suites verified,
   4,956 passed and 0 failed. An outdated headline-only assertion was corrected and rerun (66/0); app-ai passed
   alone (207/0) after the documented Chrome disconnect. The new teaching-voice suite passed 32/0.
2. Owner listened to both batches and confirmed "both fine" (21 October 2026). All 357 exact files were matched
   against the checklist and marked checked; six held clips remain left out. The existing local pages and
   `site/audio-review/review-index.json` identify the exact approved text and files. Do not regenerate them with
   no pending clips.
3. Provenance and docs record approval. Do not approve the six `left out` clips.
4. The final release checks used these isolated test ports:
   ```sh
   cd app && npm run build && npm run lint
   cd ..
   MYDAY_HTTP_PORT=8885 MYDAY_CDP_PORT=9453 MYDAY_SUPA_PORT=54349 MYDAY_LS_PORT=5599 tests/run.sh
   ```
5. Follow deploy/README.md from the Mac. Backup confirmation from this session is already recorded. No migration
   or server deployment is needed. Commit and fast-forward source, tag v1.42.0 and live-before-1.42.0 correctly,
   publish using deploy/publish-main.sh, then push and verify Pages. Use the repository's existing release identity.
6. Check live in two throwaway browsers with disposable accounts: footer, teaching playback, reveal/hide,
   prompt/reference gate, sound pairs, family playback ownership, phone targets, Slower, offline cache, and learning
   data unchanged. Remove test profiles and stop the listening server after approval/release. Delete this file when done.

No saved-data change; going back to 1.41.0 is safe. Six unresolved recordings remain held for a fluent reviewer;
see content/arabic-audio/cross-check-teaching.json. No private credentials belong in this file or in commits.
