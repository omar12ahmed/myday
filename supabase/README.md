> Since release 1.44.0 (23 Oct 2026), projects sync as separate records: the split-project migration is applied
> and older clients can't sync. Read [PROJECT_STORAGE.md](PROJECT_STORAGE.md) for recovery and rollback.

# Cloud sync with Supabase: setting it up

MyDay can keep your **task lists, queue, daily plans and each day's context (energy and sleep)** in step between
your Mac and your phone, through your own free Supabase project. Everything else (Calendar and Pay, Health, Study,
appointments, settings) stays on each device. Sync is optional: without these steps, MyDay works exactly as before.

What you need: a free Supabase account (https://supabase.com), about 20 minutes, and backups exported from **both**
devices first (Today → Export my data, on the Mac and on the phone).

## The values MyDay needs

| Value | Where to find it | Where it goes | Secret? |
|---|---|---|---|
| Project URL, e.g. `https://abcdefghijklm.supabase.co` | Project Settings → Data API (or the project's Connect dialog) | `VITE_SUPABASE_URL` | No |
| Publishable key, `sb_publishable_…` | Project Settings → API Keys → "Publishable key" | `VITE_SUPABASE_PUBLISHABLE_KEY` | No — it's made to be public. Row Level Security protects the data. |
| Database password | Chosen when you create the project | Only typed into the Supabase CLI (step 2), never saved in MyDay | **Yes** |
| Secret key `sb_secret_…` / legacy `service_role` key | Project Settings → API Keys | **Nowhere in MyDay.** MyDay never needs it. | **Yes** |

Anything starting `VITE_` is built into the app that every visitor downloads. That's fine for the URL and the
publishable key. It must never be a secret key, so `app/vite.config.ts` refuses to build if it finds one.
The URL and publishable key are public by design (they are visible in the built client) and are committed in
`app/.env.production`. Keep every other deployment-specific value out of this public repository and its
documentation: secrets and tokens go in ignored local files or deployment settings, and examples use placeholders.

## 1. Create the project

1. On https://supabase.com/dashboard, choose **New project**. Pick a name (e.g. `myday`) and a region near you
   (e.g. London). Choose a strong database password and keep it in your password manager.
2. Wait until the project says it's ready.

## 2. Create MyDay's tables (the migration)

The database changes are in `supabase/migrations/`, applied in order: `20261002120000_sync_lists_and_days.sql` (the
first part of sync), `20261003120000_ai_usage.sql` (AI help's limits), `20261005120000_sync_everything.sql`
(everything else syncs, from 1.8.0 — apply it **before** publishing 1.8.0; older versions of the app keep working with
it) and `20261006120000_sync_projects.sql` (projects sync, from 1.12.0: the record table accepts one more kind,
`project`; nothing else changes — apply it **before** publishing 1.12.0; older versions keep working with it),
`20261007120000_sync_cybersecurity.sql` (Cybersecurity, from 1.14.0: two more kinds, `cybersecurity` and
`cyber_attempt`), `20261011120000_sync_arabic.sql` (Arabic Fuṣḥā sessions: two more kinds, `arabic` and
`arabic_attempt` — apply it **before** publishing the release that saves Arabic sessions; older versions keep working
with it) and `20261012120000_sync_arabic_cards.sql` (Arabic in revision: one more kind, `arabic_card` — apply it
**before** publishing the release that brings Arabic into revision; older versions keep working with it) and
`20261014120000_sync_cyber_cards.sql` (Cybersecurity's own checks in revision: one more kind, `cyber_card` — apply it
before publishing the release that brings them into revision; older versions keep working with it) and
`20261016120000_sync_daily.sql` (Daily exercises in Health: one more kind, `daily`, a single record that's never
deleted — apply it before publishing 1.23.0; older versions keep working with it) and
`20261017120000_sync_books.sql` (Study → Reading: one more kind, `book`, one record per book, deletable — apply it
before publishing 1.24.0; older versions keep working with it). Apply them
**one** of these two ways (not both):

**A. With the Supabase CLI (recommended: it records which migrations have run).** From the `myday-site` folder:

These commands change a hosted project. Review every pending migration and obtain the owner's approval before
applying it. The split-project migration is already applied (1.44.0); before any further change to project
sync, follow [PROJECT_STORAGE.md](PROJECT_STORAGE.md) and prepare the matching client with the migration.

```bash
npx supabase login                               # opens the browser to sign in
npx supabase init                                # only if supabase/config.toml doesn't exist; answer N to the editor questions
npx supabase link --project-ref <your-project-ref>   # the ref is the abcdefghijklm part of the URL; asks for the database password
npx supabase db push                             # shows the migration it will apply, then applies it
```

**B. In the dashboard.** SQL Editor → New query → paste the whole migration file → Run. (If you later switch to
the CLI, first run `npx supabase migration repair --status applied 20261002120000`, so it isn't applied twice.)

The first creates four record tables (`task_lists`, `task_queue`, `day_plans`, `day_context`), two bookkeeping
tables, and two functions (`sync_push`, `sync_pull`). The third adds one more record table, `sync_records` (every
other part of MyDay, by kind and id), and replaces the two functions so they handle it too (same names and
arguments). Row Level Security is on for every table; nobody can write to them directly.

## 3. Accounts: only the ones you create

1. Authentication → Sign In / Providers: keep **Email** enabled, and switch **off** "Allow new users to sign up".
   Then nobody else can make an account in your project.
2. Authentication → Users → **Add user → Create new user**: your email and a strong password, with **Auto
   Confirm User** ticked. This is the account both devices sign in to.
3. For checking (step 5), add **two more, disposable** users the same way, e.g. `myday-test-a@…` and
   `myday-test-b@…` with throwaway passwords. You'll delete them afterwards.

MyDay signs in with email and password only, so no email links or redirect addresses are needed.

## 4. Tell MyDay about the project

**To try it on this Mac first** (recommended), create `app/.env.development.local` (it's ignored by Git, and only
`npm run dev` reads it, so builds for Live Server and for publishing stay without sync. Not `app/.env.local`:
Vite reads that one for every build, including the published one):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Then `cd app && npm run dev`, and open http://localhost:5173. That address has its own, separate saved data, so
it's a safe place to try: import a backup there, or use made-up data.

**To publish with sync**, put the same two lines in `app/.env.production` and commit that file. Both values are
public by design, and committing them means the published site is built from exactly what's in Git (the owner's
decision, kept on 23 Oct 2026). Then follow `deploy/README.md` as usual (export backups on every device first).
Without them, the published app has no sync. `tests/run.sh` always builds its test copies without sync settings,
or pointing at the local stand-in.

## 5. Check the project with the two disposable accounts

From the `myday-site` folder (use the **publishable** key and the two *test* users, never your own account):

```bash
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
TEST_A_EMAIL=myday-test-a@... TEST_A_PASSWORD=... TEST_B_EMAIL=myday-test-b@... TEST_B_PASSWORD=... \
node tests/sync-live-check.js
```

It checks sign-in, that each account sees and changes only its own records (including direct table access and
signed-out access), version conflicts, retried requests and deletions. It refuses to run if either account already
has MyDay records. Afterwards, delete the two test users (Authentication → Users), which deletes their records too.

## 6. Start syncing on each device

On the Mac first, then the phone:

1. Open MyDay. The status beside "MyDay" at the top says **Saved locally**. Tap it.
2. Sign in with your account.
3. **Download a backup** (the button is right there), then **See what would change**. MyDay compares this device
   with your account and lists what it would save here, what it would send, and anything that's different on each.
   For each difference, you choose which version to keep. Nothing is saved or sent until you press
   **Start syncing**.
4. On the phone, you'll see the Mac's records. Where both devices have a different version of the same thing
   (for example the same day's plan, or a task list), you choose. The version you don't choose from the phone is
   kept on the phone ("This device's earlier versions" on the sync screen), and you can download it.

After that, changes sync by themselves: they're sent shortly after you make them, and fetched whenever you come
back to MyDay. The status shows **Synced**, **Syncing**, **Saved locally** (offline, signed out, or waiting) or
**Needs attention** (something for you to decide). Tap it for details.

## How it keeps your data safe

- **Local first.** Everything is saved on the device first, as before. Sync never makes you wait, and works
  around being offline: changes stay saved on the device (also after a reload) and are sent later.
- **Nothing is overwritten silently.** Each change is sent with the version it was based on. If the record was
  changed on another device in the meantime, the database refuses it and MyDay shows both versions for you to
  choose. It doesn't rely on device clocks.
- **No double saves.** Each change has its own id, so a retried request (after a lost reply) is recognised
  and not applied twice.
- **Deletions stick.** A deleted day plan is kept in the database as a deletion marker, so a device that still has
  the old copy can't bring it back. It's shown as a conflict instead.
- **One account per device.** A device syncs with one account. Signing in to a different account sends and
  fetches nothing; to switch, you stop syncing first and then see a review (with a warning that the device holds
  the other account's records) before anything is sent. The database also refuses any request naming a different
  account from the one signed in.
- **Restoring a backup** (or anything that changes more than 30 records at once, e.g. in the classic MyDay) pauses
  sync until you've reviewed what it would change in your account.
- **Row Level Security**: each account can read only its own rows, and can't write to the tables directly. All
  writes go through `sync_push`, which checks versions. Signed-out visitors get nothing.

## Good to know (limitations of this first version)

- A task list is one record (so its order is kept), and so is the queue. If the same list is changed on two
  devices before they've synced, even different tasks in it, MyDay asks you to choose a version instead of mixing
  them.
- Changes made in the classic MyDay (`/classic/`) are synced the next time the new app is open on that device.
- The sign-in session is stored in the browser (`myday.sync.auth`), and sync's notes in `myday.sync.v1`. Neither
  is part of "Export my data", which still contains all of your MyDay data.
- Signing out keeps your data on the device. Anyone who can use that browser can still see MyDay's data there,
  as before.
- No live updates while both devices are open: the other device's changes arrive when you come back to MyDay,
  every 5 minutes while it's open, or with "Sync now".
- Free Supabase projects can be paused after a while without use (currently about a week). Sync then shows
  "Saved locally" until you restore the project in the dashboard. Nothing is lost on the devices.

---

# AI planning prototype: "Help me adjust today"

A secondary button on Today's plan. You can add a short note (e.g. "I slept badly and only have 20 minutes"); MyDay
gathers today's tasks, energy, sleep, shifts, appointments and free time (appointment names are left out), sends them
for **one** suggestion, checks it against MyDay's own rules, and shows it for you to review. Nothing changes until you
press **Use this plan**, which saves through the same path as "Review my plan" (one step of Undo straight after).
The model never writes anything: it only replies, and the app decides what's allowed.

## Automatic backups (the `backup` function)

MyDay keeps a daily copy of each device's data (the same file as Export my data, compressed) in your private R2 bucket
`myday-backups`, through the Edge Function `supabase/functions/backup`. The spec is `../specs/automatic-backups.md`.
Until the function is set up, MyDay just says "Automatic backups aren't set up yet".

1. **Cloudflare:** R2, then Manage API Tokens, then Create API token. Choose **Object Read & Write**, limited to the
   bucket `myday-backups` only. Keep the **Access Key ID**, the **Secret Access Key** and your **Account ID** in your
   password manager. Never paste them into a chat, a file in this repository or a `VITE_` variable.
2. **Supabase secrets.** In your own editor, create `supabase/backup.secret.env`, which git ignores, with four
   lines: `R2_ACCOUNT_ID=…`, `R2_ACCESS_KEY_ID=…`, `R2_SECRET_ACCESS_KEY=…` and `R2_BACKUP_BUCKET=myday-backups`.
   Then run `npx supabase secrets set --env-file supabase/backup.secret.env --project-ref <ref>` and **delete the
   file**. That keeps the values out of your shell history.
3. **Deploy:** `npx supabase functions deploy backup --use-api --project-ref <ref>`. Leave JWT verification on (no
   `--no-verify-jwt`).
4. **Check** with a disposable account in a throwaway browser profile: Back up now, the list, Download, Restore on a
   second profile, and Delete all backups.

Each account reaches only its own backups (the function prefixes every key with the signed-in user's id). The logs
hold the action, the outcome and the time only.

## Attached files (the `files` function)

Projects and notes can keep photos, PDFs and documents in your private R2 bucket `myday-attachments`, through the Edge
Function `supabase/functions/files` (spec: `../specs/files.md`). Until it's set up, MyDay says "Files aren't set up
yet".

1. **Cloudflare, a token:** R2, then Manage API tokens, then Create Account API token. Choose **Object Read & Write**,
   **Apply to specific buckets only**, and pick `myday-attachments` (not the backups bucket). Keep its Access Key ID and
   Secret Access Key in your password manager.
2. **Cloudflare, the bucket's CORS:** R2, then `myday-attachments`, then Settings, then CORS Policy, then Add CORS
   policy. On the JSON tab, paste this and save:
   ```json
   [
     {
       "AllowedOrigins": ["https://omar12ahmed.github.io", "http://localhost:5173", "http://127.0.0.1:5500"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["Content-Type", "Content-MD5", "Content-Disposition"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. **Supabase secrets.** Create `supabase/files.secret.env` (git ignores it) with `R2_FILES_ACCESS_KEY_ID=…`,
   `R2_FILES_SECRET_ACCESS_KEY=…` and `R2_FILES_BUCKET=myday-attachments` (`R2_ACCOUNT_ID` is already set for
   backups). Then run `npx supabase secrets set --env-file supabase/files.secret.env --project-ref <ref>`, and delete
   the file. If the site's address ever changes, change it in the CORS policy above and set `FILES_ALLOWED_ORIGINS`
   (the allowed addresses, comma-separated) for the function too.
4. **The database** accepts file records once `migrations/20261025120000_sync_files.sql` is applied (done 24 Oct
   2026). Rehearse it in a transaction that rolls back first, and re-read the live kind lists before applying.
5. **Deploy:** `npx supabase functions deploy files --use-api --project-ref <ref>` (JWT verification stays on).
6. **Check** with a disposable account: add a photo and a PDF, open them, Remove, Put back, Delete now. The test
   stand-in can't catch a wrong CORS policy, so this is where the upload's preflight is proved; check too whether R2
   refuses a body of the wrong length (the MD5 and the server's check refuse it either way).

## Where things are

| File | What it does |
|---|---|
| `functions/ai-plan/handler.ts` | The Edge Function's logic: signed-in accounts only, request checks, limits, one bounded model call, no content in logs. |
| `functions/ai-plan/index.ts` | Connects that to Supabase (Auth and the limit functions run as the signed-in user; no secret key needed). |
| `functions/_shared/ai/` | Shared by the function, the app and the evaluation: `schema.ts` (what's sent and returned), `prompt.ts` (the instructions), `providers.ts` (the model adapter, and which model does which job: `routeFor`), `mock.ts` (the practice planner). |
| `migrations/20261003120000_ai_usage.sql` | Request, token and spending limits per account (counts only, never content). |
| `migrations/20261005120000_sync_everything.sql` | Sync for everything else: the `sync_records` table, and `sync_push` / `sync_pull` handling it. |
| `migrations/20261006120000_sync_projects.sql` | Projects sync (1.12.0): `sync_records` accepts `project` records (its two kind checks replaced by named ones; nothing else touched). |
| `migrations/20261007120000_sync_cybersecurity.sql` | Cybersecurity (1.14.0): `sync_records` accepts the learning path and notebook attempts (`cybersecurity`, `cyber_attempt`). |
| `migrations/20261011120000_sync_arabic.sql` | Arabic Fuṣḥā: `sync_records` accepts the chosen path and lesson sessions (`arabic`, `arabic_attempt`; sessions can be deleted, the path can't). Nothing else changes. |
| `migrations/20261017120000_sync_books.sql` | Study → Reading: `sync_records` accepts one more kind, `book` (one record per book: title, author, pages, where you are, notes, finished day), which can be deleted (a book removed). Only the two lists of allowed kinds change; existing rows, version checks, grants and per-user RLS are unchanged. |
| `migrations/20261016120000_sync_daily.sql` | Daily exercises (Health): `sync_records` accepts one more kind, `daily` (the record `daily:moves`: the exercises and each day's sets; never deleted). Only the list of allowed kinds changes; existing rows, version checks, grants and per-user RLS are unchanged. |
| `migrations/20261014120000_sync_cyber_cards.sql` | Cybersecurity in revision: `sync_records` accepts revision cards (`cyber_card`: a lesson's knowledge-check question by the course's id, with its schedule; cards can be deleted). Answers use the existing `review` kind. Nothing else changes. |
| `migrations/20261012120000_sync_arabic_cards.sql` | Arabic in revision: `sync_records` accepts revision cards (`arabic_card`: a starter word or lesson check by the course's id, with its schedule; cards can be deleted). Answers use the existing `review` kind. Nothing else changes. |
| `migrations/20261023120000_split_project_sync.sql` | 1.44.0 (applied 23 Oct 2026): split project items, isolated original-project recovery rows, versioned RPCs and update-required legacy endpoints. See [rollout and rollback](PROJECT_STORAGE.md). |
| `migrations/20261024120000_sync_arabic_lessons.sql` | Adaptive Study (1.47.0, applied 24 Oct 2026): `sync_records` accepts `arabic_lesson`, your place on one Arabic lesson (Ready to move on, Needs revision, your latest check marks), deletable. Only the two kind lists change; rows, RPCs, project triggers, grants and RLS are unchanged. Older clients ignore the kind (`tests/app-sync-previous.test.js`). |
| `migrations/20261024180000_sync_arabic_words.sql` | Keep a word (1.57.0, applied 24 Oct 2026): `sync_records` accepts `arabic_word`, a word you kept in Arabic (the Arabic as written, your meaning and note, where it came from, its two revision schedules), deletable. Only the two kind lists change; rows, RPCs, project triggers, grants and RLS are unchanged. Older clients ignore the kind (`tests/app-sync-previous.test.js` [7]). |
| `migrations/20261024200000_sync_arabic_practice.sql` | Practise again (applied 24 Oct 2026): `sync_records` accepts `arabic_practice`, one Arabic lesson to practise again (the last days you did its Try it and mini challenge, what you've ticked in a session still open, its place in revision), deletable (a Study reset clears it). Only the two kind lists change; rows, RPCs, project triggers, grants and RLS are unchanged. Older clients ignore the kind (`tests/app-sync-previous.test.js` [9]). |
| `functions/backup/` | Automatic backups (1.65.0): `handler.ts` (the rules: signed-in accounts only, your own prefix, the 14 daily and 12 monthly copies), `index.ts` (Supabase Auth and R2). |
| `functions/files/` | Attached files: `handler.ts` (the actions, testable as it is: signed-in accounts only, your own prefix, the type and size rules, a check of what was stored before a file counts as kept), `index.ts` (Supabase Auth, and R2's S3 API with five-minute presigned links). Optional `FILES_ALLOWED_ORIGINS` replaces its list of allowed sites. |
| `functions/_shared/files/rules.ts` | What MyDay keeps, shared by the app and the function: the types (by name and first bytes), the sizes per area, the account's 10 GB, safe names. |
| `migrations/20261025120000_sync_files.sql` | Files (1.68.0, applied 24 Oct 2026): `sync_records` accepts `file`, one attached file's record (its name, type, size, where it was removed from, its state; never its contents), deletable. Only the two kind lists change; rows, RPCs, project triggers, grants and RLS are unchanged. Older clients ignore the kind (`tests/app-sync-previous.test.js`). |
| `migrations/20261025140000_sync_cyber_portfolio.sql` | Cybersecurity portfolio (not yet applied): `sync_records` accepts `cyber_portfolio`, one portfolio entry (its title, the attempt's evidence as you kept it, a note, the day reviewed and its files' ids; the files are the shared `file` records), deletable. Only the two kind lists change; rows, RPCs, project triggers, grants and RLS are unchanged. Older clients ignore the kind (`tests/app-sync-previous.test.js` [11]). |
| `ai-secrets.example.env` | The settings, as a template with placeholders only (fill in a copy that Git ignores; the key ends up only in Supabase). |

## Two models, one per kind of job (AI roles, step 2)

The function can hold a second, learning model (Gemini) beside the main one (GLM). Its settings are the main ones'
names starting `AI_LEARN_`, and `AI_ROUTES` says which jobs go to it, e.g. `{"tutor": "learn"}`; any job it doesn't name
(planning, brain dumps, notes) stays with the main model, and so does any job if no learning model is set up. If the
chosen model can't answer at all (no connection, no answer in time, a provider error, an empty reply), the other gets
**one** try, still inside the app's 40 seconds (`AI_TOTAL_TIMEOUT_MS`, 38 s by default); a reply that's cut short or
filtered isn't passed on. Both models' worst cases are reserved against the monthly budget before the request, since
both could be billed. Logs stay content-free: an outcome, which job and which model slot, e.g.
`ai-plan ok:tutor/main,after-learn-http 200 812ms`. The block is in `ai-secrets.example.env` (commented out), and
`node supabase/check-ai-secrets.mjs` checks it against the evaluated settings like the main one.

Not switched on: the learning model is chosen by the tutor evaluation first (`../ai-eval/README.md`), which needs a
Gemini API key on the paid tier (a Google Cloud project with billing — Google allows only paid services for apps used in
the UK — and a monthly spend cap set in AI Studio). Then its settings go into the function's secrets, and `ai-plan` is
deployed again (with an Edge Functions token), each with your go-ahead.

## Try it without any AI (practice mode)

Put `VITE_AI=mock` in `app/.env.development.local` and run `npm run dev` in `app/` (http://localhost:5173). Suggestions
then come from simple rules on your Mac — no account, no key, nothing sent. This is what to review first.

## Development trial with GLM-5.3-Flash (set up in the project on 3 Oct 2026)

The app only *suggests* through this path; every reply is still checked by the app's rules, shown for you to confirm,
saved through "Review my plan"'s save path (refused if the plan changed meanwhile), with one step of Undo. The
published website is unaffected: `app/.env.production` has no `VITE_AI`, so AI help stays off there.

**Before**: export a backup on every device. Replace the Z.ai key if it was ever shared, and set a spending limit in
Z.ai's console (top up small amounts). Consider trying it first with one of the disposable test accounts.

**What a request sends to Z.ai**: today's tasks (titles, minutes, times, done or not), your energy rating, sleep
times, busy times (no appointment names), free time, the number of Study items due and your optional note — see
"What's sent, and what isn't" below. Using a
suggestion changes today's plan, which then syncs to your other devices like any other change.

### What changes in Supabase (four steps, all additions — done on 3 Oct 2026)

All four were done on 3 Oct 2026 with a token limited to the Myday project (Database, Edge Functions and Edge
Function Secrets, read-write): the migration applied in one transaction (sync tables' row counts unchanged), the 16
settings stored (checked against the file by SHA-256 fingerprint), `ai-plan` version 1 deployed with `verify_jwt` on,
and `VITE_AI=edge` on the dev server. Checked without a model call: the pre-flight is answered for
http://localhost:5173 only, and no sign-in, the publishable key as a sign-in, or a made-up token are refused (the
first two by the function's own check — Supabase's platform check let them through). The migration is now applied:
never edit it; add a new one for any change.

1. **Database: `migrations/20261003120000_ai_usage.sql`.** Adds one table, `ai_usage` (counts only: requests, money
   reserved, tokens — no content; Row Level Security on; no direct access), and two functions, `ai_begin` and
   `ai_finish`, that signed-in accounts can call for their own counts only. Existing tables and data are not touched.
   Apply it the way you applied the first migration — SQL Editor → New query → paste the file → Run — or
   `npx supabase db push` if you use the CLI. Its locking has been tested with simultaneous requests in a real
   PostgreSQL (`tests/run.sh ai-concurrency`).
2. **The function's settings ("secrets").** `supabase/.ai-secrets.env` (Git ignores it) is prepared from
   `ai-secrets.example.env` with GLM-5.3-Flash's evaluated settings and your public key; only the Z.ai key is
   missing. Add the new key there, then:
   ```bash
   node supabase/check-ai-secrets.mjs      # must say "Same request settings as evaluated" and "Ready"; never prints the key
   npx supabase login
   npx supabase secrets set --env-file supabase/.ai-secrets.env --project-ref nkslcgnbmxuhznvldfnz
   npx supabase secrets list --project-ref nkslcgnbmxuhznvldfnz    # names only; values aren't shown
   ```
   The settings: Z.ai's general API (`https://api.z.ai/api/paas/v4`, not the Coding Plan address), `glm-5.3-flash`,
   thinking on at the lowest effort, `max_tokens` 2048, JSON output, 30-second time limit (under the app's 40),
   prices 0.15 / 0.5 US$ per million tokens; limits 20 requests a day, US$1 a month, 5 seconds apart; only
   `http://localhost:5173` (the dev server) allowed to call it — and, from release 1.2.0, the website
   (`https://omar12ahmed.github.io`).
3. **Deploy the function** (no Docker needed with `--use-api`):
   ```bash
   npx supabase functions deploy ai-plan --use-api --project-ref nkslcgnbmxuhznvldfnz
   ```
   This keeps Supabase's platform check (`verify_jwt`) **on**. The function then checks the caller itself — see "Who
   can use it" below. Don't add `--no-verify-jwt`. Before deploying, its entry has been run under Deno with mocked
   requests (`tests/run.sh ai-deno`) — plain Deno, not Supabase's own runtime, which is built on it.
4. **On your computer only**: `VITE_AI=edge` in `app/.env.development.local`, then `npm run dev` in `app/`, open
   http://localhost:5173, sign in (sync on), and use "Help me adjust today" on Today. `VITE_AI=mock` goes back to
   practice mode (no AI, nothing sent) at any time.

**To check it**: a request shows a suggestion to review (or a kind message if something's off); the function's logs
in the dashboard hold only an outcome and a time; SQL Editor → `select * from ai_usage;` shows the counts.

**To turn it off or remove it**: `VITE_AI=mock` (or delete the line) in `app/.env.development.local`. To remove it
from Supabase too: `npx supabase functions delete ai-plan --project-ref nkslcgnbmxuhznvldfnz`, then
`npx supabase secrets unset AI_API_KEY --project-ref nkslcgnbmxuhznvldfnz` (and the other `AI_…` names), and in the
SQL Editor: `drop function public.ai_finish(integer, integer); drop function public.ai_begin(integer, numeric,
numeric, integer); drop table public.ai_usage;` — this removes only the AI counts, nothing else.

To use another model later (e.g. Qwen), replace the GLM block in the settings copy with the commented one in the
template; `check-ai-secrets.mjs` compares any model in `ai-eval/models.json` with its evaluated settings.

The limits (per account): `AI_DAILY_LIMIT` requests a day (default 20), `AI_MONTHLY_BUDGET_USD` (default US$1; each
request reserves the most it could cost before the model is called, and that reservation is never refunded, so real
spending is lower), `AI_MIN_SECONDS_BETWEEN` (default 5), `AI_MAX_OUTPUT_TOKENS` (default 600, at most 2048) and
`AI_TIMEOUT_MS` (default 25 s). Without prices for a real model, the function refuses to call it.

## Who can use it

Every request goes through these, in this order, and stops at the first that fails:
1. **Supabase's platform check** (`verify_jwt`, on by default): a valid, unexpired token from this project. Note that
   this check also lets the project's publishable or secret key through in the `Authorization` header — they aren't
   a sign-in, so the function refuses them itself (step 2).
2. **The function's own check, before anything else happens**: anything that isn't shaped like a sign-in token (a
   JWT), including an `sb_publishable_…` or `sb_secret_…` key, is refused straight away; otherwise it asks Supabase Auth to verify the token
   (`auth.getUser(token)` in `functions/ai-plan/index.ts`). That's a server-side verification — the signature, the
   expiry, and that the account still exists — not just reading (decoding) the token. A forged or expired token gets
   401 **before** the request is even read, any allowance is charged, or the model is called (tested in
   `tests/ai-server.test.js`).
3. **The limits** run in the database *as that user* (`ai_begin`), so the database verifies the token once more and
   can only ever count that account's requests — an account named in the request body is ignored. Each account's
   requests are taken one at a time (a lock on the account, held until the reservation is saved), so two requests
   at once — even either side of midnight — can't both slip under the daily limit or the monthly budget.
   Tokens are recorded for every call the provider answered, usable or not (a reply cut off at the length limit is
   still billed).
4. Only then is the model called, with the key from the function's secrets.

## What's sent, and what isn't

**"Help me adjust today"** — sent for each suggestion: today's date, time and time zone (your device's — MyDay has no time zone setting), energy,
last night's and tonight's sleep if recorded, today's tasks (titles, minutes, times, done or not), busy blocks as
kinds and times (work, appointment, workout, sleep, prep/travel — **no appointment names**), free time, the number of
Study items due, and your note. Nothing from Finance, Health records or Study notes. Nothing is stored on the server
except counts (requests, tokens, the budget used); the function's logs hold only an outcome and a time.

**"Add what's on my mind"** — sent: only what you write (up to 1,500 characters) and today's date and weekday. Not
your lists, queue, plan or anything else (the app finds duplicates itself). It goes through the same function, sign-in
check and limits (it counts towards the same daily requests and monthly budget). The deployed `ai-plan` version 1
predates it: the function must be deployed again (step 3 above) before it works with a real model; until then the
app shows "Couldn't get a suggestion just now. Nothing was added." Practice mode works without it.
