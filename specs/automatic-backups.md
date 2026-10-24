# Automatic backups

**Status:** started with the owner's "go ahead" on 24 October 2026; the owner's decisions are below. Not yet built or
released. Nothing live (Cloudflare, Supabase secrets, the function deploy, publishing) happens without the owner's
yes at each of those steps.
**Based on:** source at 1.62.0. Plans: `specs/projects-vision.md` §12 and §17 (backups before attachments),
`specs/myday-vision.md` (files and backups; "delete everything" a true wipe), `deploy/R2.md`.

## 1. The practical problem

All of MyDay lives on your devices and, when signed in, in your account. "Export my data" makes a complete file, but
only when you remember to press it. A bad import, a mistaken bulk change or a sync problem could leave no copy to go
back to, and daily use is about to grow (files will follow). The vision puts automatic backups before attachments.

## 2. The owner's decisions (24 October 2026)

1. **From your devices, daily.** When MyDay is open and signed in, at most once a local day per device, it sends the
   same file "Export my data" makes to a small backup function. The function keeps it privately in the
   `myday-backups` R2 bucket under your account. No scheduled job is involved: a backup happens on days you open
   MyDay.
2. **Kept: the last 14 days, plus one a month for 12 months**, for each device: the newest 14 daily backups, and
   the earliest backup of each of the last 12 calendar months. Anything older is deleted by the function after each
   new backup.
3. **"Delete everything" deletes the backups too** (when that becomes a true wipe; see `specs/myday-vision.md`). A
   "Delete all backups" action exists from the start. **The true wipe must call `deleteAllBackups()`
   (`app/src/sync/backup.ts`)**; it's left unwired until the wipe is built, by whoever builds it (agreed with
   myday-83, 24 October 2026).
4. **The buckets stay as they are:** Western Europe location hint, no EU jurisdiction, Standard storage, private,
   empty until the first backup.

## 3. What you see

- **"Your backups"** in the footer (beside Export and Import) opens a page, `#backups`:
  - "Backed up today at 09:12 from this device." (or "Not backed up yet on this device.") and **Back up now**.
  - The list, newest first: the day, the device ("This device", or the device's name such as "Mac" or "iPhone"),
    and the size. Each has **Download** (a `.json` file like "Export my data") and **Restore**.
  - **Restore** first keeps a copy of your MyDay as it is now (today's backup from this device), then opens the
    backup with the same checks and the same question as Import ("Replace your saved MyDay data with this file?",
    with what it holds). Signed in, it replaces your MyDay on all your devices. There's no sync review pause any
    more (since 1.9.0), so the copy is what makes a restore undoable. If the copy can't be made, nothing is restored
    (found in review).
  - **Delete all backups** asks first, then removes every backup of your account from every device.
  - It explains plainly: backups are kept privately in your own storage, for 14 days plus one a month for a year.
    They hold everything, including private notes and projects, and are never sent to AI.
- **No backup, no fuss:**
  - Signed out, offline, or with the function not set up yet, the page says so ("Automatic backups aren't set up
    yet." / "Sign in to keep backups."), and nothing else changes.
  - A failed daily backup tries again the next time MyDay is opened. After three failed days in a row, the page says
    so; there's no pop-up. "Offline" is said only when the browser says it's offline; a timeout or a refused request
    counts as a failure.
  - The browser blocks storage: the page says backups need it. A browser too old to compress: it says so, and Export
    my data still works.

## 4. How it works

### In the app (`app/src/sync/backup.ts`, `app/src/shell/BackupsView.tsx`)

- **When:** about 30 seconds after MyDay opens or comes back to the screen, if all of these hold:
  - signed in (the sync link exists) and online;
  - the saved data is readable (not damaged, not from a newer version);
  - this device hasn't backed up successfully today.
- **What:** `exportText()`'s file, compressed with the browser's `CompressionStream('gzip')`, sent with the session
  token to `${SYNC.url}/functions/v1/backup` (`PUT ?day=YYYY-MM-DD&device=<id>`), with the device's label in a
  header.
- **This device:** a random id and a label from the browser ("Mac", "iPhone", "iPad", "Android", "Windows",
  "Linux" or "This browser"). Both are kept device-only in `localStorage` key `myday.backup.v1`, with the last
  success and the failed-days count. This isn't part of your data, isn't synced and isn't exported.
- **Restore:** fetch, then `DecompressionStream`, then `parseImport`, then the existing Import question, then
  `replaceAll`. The same code path as Import, so the same checks and the same sync pause apply.

### On the server (`supabase/functions/backup/`: `index.ts` and `handler.ts`)

- **Who:** the caller's token is checked with Supabase Auth, as `ai-plan` does. Every object key starts with that
  verified user id, so an account can only ever reach its own backups. A user id in the request is never trusted.
- **Where:** `myday-backups/<userId>/<deviceId>/<YYYY-MM-DD>.json.gz`, written over R2's S3 API (signed requests,
  `aws4fetch`) with the server-side secrets `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and
  `R2_BACKUP_BUCKET`. The object's metadata holds the device label and the app version; R2 keeps the time.
- **Sign-in first:** a sign-in token (not the public key) is checked before anything else, so nobody else learns
  whether backups are set up.
- **Actions:**
  - `PUT` saves a backup. The body must be gzip (its first bytes are checked) and at most 10 MB, counted while
    reading, so a larger one is refused without being read in full. The day and device id are checked against
    strict formats. Saving the same day and device again replaces it, but not within 60 seconds of the last save. At
    most 10 devices an account. Retention runs after each save.
  - `GET` lists the account's backups.
  - `GET` with the header `x-myday-key` returns one, which must be under the account's prefix. The key goes in a
    header so it isn't in request addresses.
  - `DELETE` removes all of the account's backups, a few at a time side by side.
- **Retention**, for every device of the account after each save: keep the 14 newest days and the earliest day of
  each of the last 12 calendar months (by the backup's own day), and nothing from before those 12 months. A device
  that stops is cleared within a year, and its label goes when it has no backups left (found in review).
- **CORS:** an allow-list from `BACKUP_ALLOWED_ORIGINS`, falling back to the site's origins, as `ai-plan` does.
- **Logs:** the outcome and timing only. Never file names, keys, sizes per user or content.
- **Not set up** (secrets missing): every action answers `503 {error: 'not-configured'}`, and the app shows "aren't
  set up yet".

## 5. Privacy and safety

- A backup is the whole of your saved data, including private notes and projects, and lives in your own private
  bucket (encrypted at rest by Cloudflare), reachable only through the function with your sign-in. There's no extra
  passphrase: a lost passphrase would make every backup useless.
- Nothing is sent to AI, and nothing about backups reaches an AI request.
- **The token for R2** is an Object Read & Write token limited to `myday-backups`, kept only in Supabase's secret
  store. It's never in the app, the repository or a `VITE_` variable, and never pasted into chat.
- **Restoring** is never automatic, and always goes through the Import checks and question.

## 6. Setup and release steps

1. Build the function and the app part, with tests (local stand-ins only).
2. Independent review (security, privacy, saved data).
3. **The owner, in Cloudflare:** R2, then Manage API tokens, then create an **Object Read & Write** token for
   `myday-backups` only. Keep the Access Key ID, Secret Access Key and account ID in your password manager.
4. **The owner, in a terminal:** put the four values in `supabase/backup.secret.env`, which git ignores, then
   `npx supabase secrets set --env-file supabase/backup.secret.env --project-ref <ref>`, then delete the file. This
   keeps them out of the shell history (found in review).
5. **With the owner's yes:** deploy the `backup` function (`npx supabase functions deploy backup --use-api
   --project-ref <ref>`; JWT verification stays on, so no `--no-verify-jwt`). Then check it with disposable account
   A from a throwaway profile: back up, list, download, restore on a second profile, and delete all. Before deploying,
   `deno check` the entry (done locally).
6. **With the owner's yes:** publish the app release, then the live check, tidied.

Deploy the function before (or with) the app release, and confirm on the live site that the page reads correctly.
Until the function answers, the page says backups aren't set up yet, or reports a failure.

## 7. Checks

- **Function (Deno, with a stand-in store):**
  - refuses a missing or wrong token;
  - stays within the account's prefix (`..`, other user ids, encoded slashes);
  - formats and the gzip and size checks;
  - the 60-second rule;
  - retention (14 days plus 12 months, across month and year ends);
  - list, get and delete-all;
  - not-configured;
  - CORS;
  - logs carry no keys or content.
- **App rules:**
  - when a daily backup is due (signed in, online, readable, not yet today);
  - the device label;
  - the failed-days count;
  - gzip round trip;
  - restore goes through `parseImport`.
- **Browser (with the function stood in):**
  - the footer link and the page;
  - Back up now;
  - the list and "This device";
  - Download gives the same JSON as Export;
  - Restore asks the Import question and then replaces;
  - Delete all asks first;
  - signed out and not set up;
  - a phone at 320 px.
- **Live, after the owner's yes:** as in §6 step 5, on disposable account A, tidied (its backups deleted).
