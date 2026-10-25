# Live checks

Checks that run against the real services: the published site (or a local production build) talking to the real
Supabase project, its Edge Functions and the R2 buckets. They write made-up records to the live database and tidy
them, so **each run needs the owner's yes** (AGENTS.md, "Releases and external actions"). Local suites
(`tests/run.sh`) use the stand-in; only these touch the real project.

## Running one

```
python3 -I tests/live/run.py live-files.js --version 1.77.0 --src <published commit>
python3 -I tests/live/run.py files-direct.mjs --version 1.77.0 --src <commit> --account C --other B
python3 -I tests/live/run.py live-files.js --version 1.77.0 --src <commit> --local    # before publishing
```

- **Accounts:** disposable `@example.com` accounts only, `TEST_<X>_EMAIL` / `TEST_<X>_PASSWORD` in the main
  checkout's ignored `supabase/live-check*.secret.env` (or a folder named by `MYDAY_LIVE_SECRETS`). `--account`
  picks one (default `MYDAY_LIVE_ACCOUNT`, else A); `--other` a second for isolation checks (default B). Each
  session has its own account, so their checks never meet: agree which before running one.
- **`--local`:** builds this worktree's app for production and serves it at `http://127.0.0.1:5500/myday/`, one of
  the addresses the files function and the attachments bucket allow. Use it before publishing whenever the release
  depends on a changed Edge Function, a migration or storage: it tries the exact build against the real services.
- **Browser checks** (`.js`) get a throwaway headless Chrome (`MYDAY_LIVE_CDP_PORT`, default 9587) whose profile is
  removed afterwards; API checks (`.mjs`) don't need one. A failed run keeps its temporary folder for a look and says
  where; remove it when done.
- Nothing about the accounts, tokens or links is printed.

## The checks

| Check | What it proves |
|---|---|
| `live-files.js` | Files on two devices: add a photo, a PDF and a text file (kept in R2), the preview, Open (a PDF inline; a document saved under its name), an SVG refused, the phone at 320 px, Remove / Recently deleted / Put back / Delete now, the storage line, then the project deleted and nothing left in R2. |
| `files-direct.mjs` | The files function and R2 directly: sign-in first, the signed headers and five-minute links, R2 refusing a longer body, other bytes or another type, the bucket's CORS for the site, the server's check of what was stored, previews only for photos, isolation from another account, delete's known areas, usage. |
| `live-wipe.js` | Delete everything on two devices. **It wipes the whole account.** |

## Writing one

- Made-up data only, named "(made up)"; tidy first (anything an earlier stopped run left) and last.
- `synced(d)`: wait half a second (the badge shows a change 300 ms after it), then for the badge to say synced and
  nothing to be waiting (`link.out` empty). Read the account only after that.
- Never ask the page anything while it may be reloading itself (after a wipe, say): wait, then `open()` again.
- Return plain values from `ev()` (`!!document.querySelector(…)`, never an element).
- `devices.js` is `tests/cdp-devices.js` with one difference: a page load that stalls (the live site sometimes does,
  from here) is stopped and retried, up to four times.
- Pull rows carry `record_id` (not `id`); keep the newest row per record.
