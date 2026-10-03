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

## 1. Create the project

1. On https://supabase.com/dashboard, choose **New project**. Pick a name (e.g. `myday`) and a region near you
   (e.g. London). Choose a strong database password and keep it in your password manager.
2. Wait until the project says it's ready.

## 2. Create MyDay's tables (the migration)

The database changes are in `supabase/migrations/20261002120000_sync_lists_and_days.sql`. Apply them **one** of
these two ways (not both):

**A. With the Supabase CLI (recommended: it records which migrations have run).** From the `myday-site` folder:

```bash
npx supabase login                               # opens the browser to sign in
npx supabase init                                # only if supabase/config.toml doesn't exist; answer N to the editor questions
npx supabase link --project-ref <your-project-ref>   # the ref is the abcdefghijklm part of the URL; asks for the database password
npx supabase db push                             # shows the migration it will apply, then applies it
```

**B. In the dashboard.** SQL Editor → New query → paste the whole migration file → Run. (If you later switch to
the CLI, first run `npx supabase migration repair --status applied 20261002120000`, so it isn't applied twice.)

This creates four record tables (`task_lists`, `task_queue`, `day_plans`, `day_context`), two bookkeeping
tables, and two functions (`sync_push`, `sync_pull`). Row Level Security is switched on for all six tables.

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
public by design, and committing them means the published site is built from exactly what's in Git. (If you'd
rather not commit them, use `app/.env.production.local`, which Git ignores; then only builds made on this Mac
include sync.) Then follow `deploy/README.md` as usual (export backups on every device first). Without either
file, the published app has no sync, as now. `tests/run.sh` always builds its test copies without sync settings.

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

## Where things are

| File | What it does |
|---|---|
| `functions/ai-plan/handler.ts` | The Edge Function's logic: signed-in accounts only, request checks, limits, one bounded model call, no content in logs. |
| `functions/ai-plan/index.ts` | Connects that to Supabase (Auth and the limit functions run as the signed-in user; no secret key needed). |
| `functions/_shared/ai/` | Shared by the function, the app and the evaluation: `schema.ts` (what's sent and returned), `prompt.ts` (the instructions), `providers.ts` (the model adapter), `mock.ts` (the practice planner). |
| `migrations/20261003120000_ai_usage.sql` | Request, token and spending limits per account (counts only, never content). |
| `ai-secrets.example.env` | The settings, as a template with placeholders only (fill in a copy that Git ignores; the key ends up only in Supabase). |

## Try it without any AI (practice mode)

Put `VITE_AI=mock` in `app/.env.development.local` and run `npm run dev` in `app/` (http://localhost:5173). Suggestions
then come from simple rules on your Mac — no account, no key, nothing sent. This is what to review first.

## Set it up with a real model (when you're ready)

1. **Apply the second migration**, as before: SQL Editor → New query → paste
   `migrations/20261003120000_ai_usage.sql` → Run (or `npx supabase db push`).
2. **Choose a model**, ideally after running the evaluation (`../ai-eval/README.md`). Create an API key in that
   provider's console, and **set a spending cap there too** (a second safety net). For Qwen on Alibaba Cloud Model
   Studio, note your workspace id and region: the address is your workspace's own, and it must be in the same region
   as the key.
3. **Fill in the settings** — in a copy, never in the template: copy `ai-secrets.example.env` to
   `supabase/.ai-secrets.env` (Git ignores it, like every `.env` file under `supabase/`), fill in the key and your
   workspace's address there, then:
   ```bash
   npx supabase login
   npx supabase link --project-ref nkslcgnbmxuhznvldfnz
   npx supabase secrets set --env-file supabase/.ai-secrets.env
   npx supabase secrets list            # names only; values aren't shown
   ```
   The template keeps placeholders only (an empty key, `YOUR-WORKSPACE-ID`); the model ids, settings and list prices
   in it are public and were checked against the providers' documentation (3 Oct 2026).
4. **Deploy the function** (no Docker needed with `--use-api`):
   ```bash
   npx supabase functions deploy ai-plan --use-api
   ```
   This keeps Supabase's platform check (`verify_jwt`) **on**: the platform validates the sign-in token on every
   request before the function runs (both the older and the new signing keys). The function then checks again
   itself — see "Who can use it" below. If the browser's pre-flight check (CORS) were ever refused in your project,
   deploying with `--no-verify-jwt` would switch the platform check off; only do that knowing the function's own
   check is then the only one (it is a real check, not just reading the token — see below).
   If the function can't read the project's public key, also set `MYDAY_PUBLISHABLE_KEY` (your `sb_publishable_…`
   key) as a secret.
5. **Switch it on in the app**: `VITE_AI=edge` in `app/.env.development.local` to try it locally (signed in), and only
   later in `app/.env.production` for the website.

The limits (per account): `AI_DAILY_LIMIT` requests a day (default 20), `AI_MONTHLY_BUDGET_USD` (default US$1; each
request reserves the most it could cost before the model is called), `AI_MIN_SECONDS_BETWEEN` (default 5),
`AI_MAX_OUTPUT_TOKENS` (default 600) and `AI_TIMEOUT_MS` (default 25 s). Without prices for a real model, the function
refuses to call it.

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

Sent for each suggestion: today's date, time and time zone (your device's — MyDay has no time zone setting), energy,
last night's and tonight's sleep if recorded, today's tasks (titles, minutes, times, done or not), busy blocks as
kinds and times (work, appointment, workout, sleep, prep/travel — **no appointment names**), free time, the number of
Study items due, and your note. Nothing from Finance, Health records or Study notes. Nothing is stored on the server
except counts (requests, tokens, the budget used); the function's logs hold only an outcome and a time.
