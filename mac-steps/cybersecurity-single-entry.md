# Single Cybersecurity entry — 1.42.1 candidate

The owner asked to keep only the correct Cybersecurity entry. On Study home, the current guided course stays;
matching older topic cards become saved-course links inside it. Original data and routes stay unchanged.

1. Focused app-topics regressions passed 77/0 (HTTP 8891, CDP 9461, SUPA 54351, LS 5601); main reviewed the
   test changes. Desktop and phone screenshots were checked.
2. Run build/lint and all 54 default suites. Account for every result; rerun documented flakes once alone.
3. Commit with existing public release identity, fast-forward source, tag v1.42.1 and live-before-1.42.1
   (previous main e083037). Follow deploy/README.md and normal publish script. Backups were already confirmed
   on every device in this session. No server deployment, migration or saved-data change.
4. Validate built main: version/source, classic fallback, exact 643 checked audio files, no held recordings,
   service-worker lists. Atomically push source/main/tags and wait for Pages.
5. Live-check two disposable accounts in throwaway browsers: one correct entry, saved-course links, other topics,
   current lesson, phone 44px/no overflow, learning data byte-identical. Private helpers must stay private.
6. Record results in release histories, remove this handoff, clean up task-only browsers/server and the feature
   worktree. Going back to 1.42.0 is safe.
