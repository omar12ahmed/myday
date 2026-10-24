# Delete everything (the true wipe)

**Status:** released in 1.73.0 (24 October 2026): the owner's decision ("delete everything" is a true wipe,
`specs/myday-vision.md`) with the details chosen on 24 October 2026 (§2). Fable review: ship with changes (all made).
With the owner's yes: the migration rehearsed (rolled back) and applied 21:44:25–29Z after a backup (every row,
policy, constraint and earlier function identical); backup (v3) and files (v4) redeployed before the app; published.
**Based on:** source at 1.71.0. Related: `specs/files.md` (files go with the wipe), `specs/automatic-backups.md`
(backups go with the wipe), `supabase/PROJECT_STORAGE.md` (the pre-1.44.0 project copies).

## 1. The practical problem

Before MyDay holds real data, there must be one honest way to make it forget everything: not "this device starts
again", not "your account keeps deletion markers and old copies", but everything you put in, everywhere it was kept.
Today there is no such button: Import of a blank file replaces the data, but deletion markers, the pre-1.44.0 project
copies, files and backups stay, and another device can send its old copy straight back.

## 2. The owner's decisions

From the vision (24 Oct 2026): your data on the device and in your account, the deletion markers and the pre-1.44.0
project copies all go; **your sign-in stays**. From Files and backups: **files and backups go too**. Chosen on 24 Oct:

1. **Confirm by typing** "delete everything" before the button works.
2. **Offer a download first:** "Download a copy first" (the same file as Export my data) in the confirm step.
3. **Other devices clear themselves** the next time they sync, and say so: "Everything was deleted from another
   device on 24 Oct." Nothing comes back from them.
4. **On the device it's done on, everything but sign-in goes:** MyDay's data, sync's notes about it, and every
   device-only choice (theme lives in the data; sayings on/off, Focus, voice and transliteration choices, the step and
   session you were on, the one-time offers, the backup schedule) and the device's saved copies of files. Downloaded
   lesson audio stays (it's MyDay's content, not yours; it only shows which clips were played on this device, nothing
   typed). Another tab of MyDay open on the device reloads as soon as the wipe is noted.

Decided in the build (flagged to the owner):
- **AI usage counts stay** (`ai_usage`: counts and spending only, no content), so the daily and monthly limits keep
  working.
- **An older MyDay can't write a wiped account back:** after the first wipe, the database refuses sync writes, backups
  and file uploads from a release that doesn't know the wipe (it shows a problem until it's updated, then clears
  itself).

## 3. What you see

- **Where:** at the end of **Your account** (`#sync`), a "Delete everything" section with one line ("Your data on
  every device and in your account, your files and your backups. Your sign-in stays.") and a button that opens
  `#delete-everything`.
- **The page** says plainly what goes and what stays, then:
  - **Download a copy first** (Export my data);
  - a field: "Type delete everything to confirm";
  - **Delete everything** (disabled until the phrase matches, ignoring case and spaces at the ends).
- **While it runs:** "Deleting…" with the steps as they finish: your account's data, this device, your files, your
  backups.
- **Afterwards:** MyDay as on a new device (the starter lists and defaults), still signed in, with a notice on Today:
  "Everything was deleted." (dismissable).
- **If something can't be done:**
  - offline, signed out, or this device not syncing with your account: nothing is deleted, and the page says why
    ("Deleting everything needs a connection and your account.");
  - your account's data couldn't be deleted: nothing is deleted anywhere ("That didn't work just now. Nothing was
    deleted. Try again.");
  - your data is gone but files or backups couldn't be deleted yet: "Your data is deleted. Your files and backups
    couldn't be deleted yet; MyDay will try again." This device keeps trying (on every open, signed in), and the
    page has Try again.
- **On another device**, at its next sync: its copy is cleared, everything but sign-in as in §2.4, and Today says
  "Everything was deleted from another device on 24 Oct." Anything changed there and not yet sent is gone too (that's
  the point of the wipe).
- **On a device still running an older MyDay:** its changes, backups and uploads are refused ("Needs attention: The
  cloud refused the request: This account was cleared with Delete everything. Update MyDay to sync it."); once it
  updates (it does on the next open), it clears itself as above.

## 4. How it works

### In the database (migration `20261025160000_wipe.sql`)

- `sync_accounts` gains `epoch integer not null default 0`, `wiped_at timestamptz` and `wiped_seq bigint`. `last_seq`
  is kept through a wipe, so change numbers keep rising and every device's cursor stays meaningful.
- **`sync_state(account)`** (signed-in account only): `{ epoch, wiped_at, wiped_seq, last_seq }` (zeros for an
  account with no row).
- **`sync_wipe(account)`** (signed-in account only), in one transaction:
  - deletes the account's rows from `sync_records` (data and deletion markers), `sync_changes`, `task_lists`,
    `task_queue`, `day_plans`, `day_context` and `sync_project_legacy`;
  - sets `epoch = epoch + 1`, `wiped_at = now()`, `wiped_seq = last_seq`;
  - returns the new state. `ai_usage` is untouched.
- **`sync_push_v3(account, changes, device, epoch)`**: answers `{ error: 'wiped', epoch }` when `epoch` isn't the
  account's; otherwise sets a transaction-local flag (`myday.epoch`) and returns `sync_push_v2(…)` unchanged.
- **The guard:** BEFORE INSERT OR UPDATE triggers on `sync_records`, `task_lists`, `task_queue`, `day_plans` and
  `day_context` raise "update-required" when the row's account has `epoch > 0` and the flag isn't that epoch. So an
  account never wiped behaves exactly as now (every released MyDay keeps working), and after a wipe only a MyDay that
  knows the current epoch can write. `sync_pull_v2` is unchanged (reading never brings anything back).

### In the functions

- **`backup`** and **`files`**: for an account with `epoch > 0`, an upload (`backup` PUT; `files` upload and thumb)
  must carry `x-myday-epoch` equal to the account's epoch, or it's refused (409 `wiped`). The epoch is read with the
  user's own token (`sync_state`). Lists, downloads, opening and deleting are unaffected.

### In the app

- **`sync/state.ts`:** `Link.epoch?` (absent = 0).
- **`sync/engine.ts`:**
  - each run reads `sync_state` first (a missing function, before the migration, counts as epoch 0);
  - if the account's epoch is above this device's, **clear here** (`clearAfterWipe`, below), then continue (the pull
    starts at `wiped_seq`);
  - pushes go through `sync_push_v3` with the link's epoch (falling back to v2 only if v3 doesn't exist yet); a
    `wiped` answer with a newer epoch runs the check again at once; an account whose epoch is below this device's
    (restored from before a wipe) is a problem shown on the badge ("Needs attention"), retried with backoff, never a
    loop;
  - `checkedThisLoad()`: true once a run of this page load has read the epoch and synced; the daily backup and the
    files tidy wait for it, so a device never backs up or tidies its old copy before it has heard about a wipe.
- **`sync/wipe.ts`:**
  - `deleteEverything()`: under the sync lock: (1) `sync_wipe`; (2) clear this device (`clearAfterWipe` with the new
    and "here"); (3) delete every file (`files` delete-all) and every backup (`backup` delete-all); (4) done. A
    failure at (1) changes nothing, unless the answer was lost and the epoch shows it went through (asked again three
    times). A failure at (3) leaves `myday.wipe.pending` `{ user, left }`, retried on every open (and when the page
    is shown again, and back online) and from Try again, but only while that account is signed in. If this device
    couldn't be cleared (storage full or blocked) the page says so and the next sync tries again. While it runs, the
    sign-in gate stays out of the way (`sync/wiping.ts`).
  - `clearAfterWipe(state, from)`: replaces MyDay's data with a fresh start (`freshData()`); removes every
    localStorage key starting `myday.` except the sign-in (`myday.sync.auth`) and sync's notes; rewrites sync's notes
    with no link and nothing kept aside (same device id), so the device joins the account afresh, taking the
    account's versions (the join reads the new epoch first); clears the files cache (IndexedDB `myday-files`, awaited
    before any reload); sets `myday.wiped` `{ at, from }` for the notice. `wiped_seq` is recorded for diagnosis.
  - Uploads send `x-myday-epoch` (backups, files).
- **The notice:** Today shows `myday.wiped` until dismissed.

## 5. Going back a release

- Saved data is unchanged in shape (a wipe makes it fresh). The sync notes gain an optional `epoch`, which older
  releases ignore.
- An account never wiped: every release keeps working, unchanged.
- After a wipe: an older release can still read (its pulls work) but can't write (the guard), back up or upload
  (the functions). It says "Your account had a problem answering." until updated. Proved with `app-sync-previous`.

## 6. Privacy and safety

- Nothing is sent to AI; the page is local.
- The wipe deletes only the signed-in account's rows and objects (keys and rows by the verified user id).
- Logs stay content-free.
- The download offered first is the person's own file, saved by their browser.

## 7. Checks

- **sync-db:** the migration (columns, functions, triggers), `sync_wipe` deletes exactly the account's rows in every
  table (another account's untouched), keeps `last_seq`, bumps the epoch; the guard (v2 writes refused after a wipe,
  allowed before; v3 with the right epoch allowed, the wrong one answered `wiped`); `sync_state`; isolation.
- **backup / files:** uploads refused without or with the wrong `x-myday-epoch` after a wipe; unaffected before.
- **app-sync (two devices):** delete everything on one (typed phrase, download first, steps); the other clears itself
  at its next sync with the notice; neither sends anything back; files and backups gone; device-only keys cleared,
  sign-in kept, audio cache kept; a failure at each step; the pending retry; 320 px; keyboard.
- **app-sync-previous:** after a wipe, the previous release can't write back, and nothing of its copy reaches the
  account; once on this release it clears itself.
- **Live:** rehearse the migration in a transaction that rolls back; then on disposable account A only, with the
  owner's yes: a made-up project, file and backup, then delete everything; the second device clears itself; the
  account, R2 and both devices are empty; another account untouched.
