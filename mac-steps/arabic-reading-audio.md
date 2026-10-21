# Arabic reading audio — 1.41.0 prepared, not published

Branch: `arabic-reading-audio`, based on `react-rebuild` at 1.40.0. The changes are in this worktree; live remains
1.40.0. No database migration or `ai-plan` deployment is needed.

## Already done

- The eight vowelled texts have whole-text Listen, sentence controls and a current-sentence highlight. The shared
  player stops or changes cleanly, keeps Slower and stops when leaving the text. Hiding vowels keeps the same audio
  and authored transliteration. The six unvowelled B1/B2 texts still have no recording.
- There are 59 sentence positions and 58 distinct spoken texts; three reuse checked clips. The 55 new clips were
  made with the same TTS voice (2,177 characters, about 596 KB, 149 seconds of new audio). The temporary TTS-only
  key was deleted. No key was written to the repository.
- Every new clip was transcribed blind by Gemini 3.8 Flash. The main session read all 55 transcriptions against
  the text: the words agree; punctuation and optional spelling marks differ. Cost US$0.00886875. The record is
  `content/arabic-audio/cross-check-reading-texts.json`.
- The owner listened to all 55 on 21 October 2026 and said **"all fine"**. They are checked in the audit. The build
  includes 286 clips in total and all 58 reading sentence texts. No saved-data change.
- Independent test writing, documentation and code review were completed and reviewed by the main session.
  Focused checks: pronunciation rules 96/0, player 34/0 and reading browser fixture 43/0, including native MP3
  playback and automatic next-sentence advancement. Screenshots were reviewed at 375 and 1024 px.
- Final build and lint passed. The full run against version 1.41.0 and the checked clips reported every one of
  53 suites: **4,894 passed, 0 failed**, in 24.2 minutes. The earlier Calendar network wait passed on this run
  (108/0); there were no final FAIL, HARNESS or stopped-early lines.
- The owner confirmed fresh backups exported on every device before publishing.

## Finish on the Mac

1. Review the diff and final validation results. Do not treat an interrupted test run as a full pass. The initial
   run was stopped when owner listening finished; one classic Calendar check was still showing “Checking gov.uk…”
   in its real-network `file://` case. Keep the exact failure and final rerun result in the validation record.
2. Export a backup from MyDay on **every device used**, as required by `deploy/README.md`. Confirm that this has
   been done before publishing.
3. Commit the reviewed source on this branch, including the checked audio, source, tests and docs. Follow the normal
   source-branch release process in `CLAUDE.md`; never commit built files to the source branch or edit `main` by hand.
   If validation needs running again, use this worktree's separate ports:

   ```bash
   cd app
   npm run build
   npm run lint
   cd ..
   MYDAY_HTTP_PORT=8875 MYDAY_CDP_PORT=9443 MYDAY_SUPA_PORT=54339 MYDAY_LS_PORT=5599 tests/run.sh
   ```

4. No backend steps. Prepare and publish through `deploy/publish-main.sh` and the release/tag procedure; update
   prepared/unpublished wording only after publication is verified.
5. Check the live footer is 1.41.0, play a complete early reading and an individual sentence, switch vowel marks,
   test Stop/Slower, and confirm played clips work offline. Use disposable accounts and throwaway browsers for the
   normal two-device live check. The six bare texts must still say no recording.
6. Delete this handoff file after the release steps are complete. Round three (b) remains separate work.

Going back to 1.40.0 is safe: saved data has not changed, and the earlier app simply has no reading-text controls.
