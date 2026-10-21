# Arabic teaching audio — 1.42.0 candidate, not published

Work is on `arabic-teaching-audio`. The current live release remains 1.41.0.

1. Run the final full release checks against the approved manifest. The pre-listening run was stopped after owner
   approval to restart with the approved clips. Build/lint and the 125 pronunciation-rule checks passed; the new
   teaching-voice browser checks passed 32/0.
2. Owner listened to both batches and confirmed "both fine" (21 October 2026). All 357 exact files were matched
   against the checklist and marked checked; six held clips remain left out. To regenerate future listening pages:
   ```sh
   MYDAY_AUDIO_REVIEW_BATCH=179 node app/scripts/review-arabic-audio.mjs teaching sounds-families lesson-checks
   python3 -m http.server 8801 --bind 127.0.0.1 --directory site/audio-review
   ```
   Open http://127.0.0.1:8801/ and http://127.0.0.1:8801/batch-2.html. Confirm both batches or request retakes by clip
   number. The checklist identifies the exact text and file in `site/audio-review/review-index.json`.
3. Provenance and docs record approval. Do not approve the six `left out` clips.
4. Build/lint and run the full release checks with the approved clip manifest. Use isolated test ports:
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
