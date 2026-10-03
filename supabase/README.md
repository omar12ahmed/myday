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
