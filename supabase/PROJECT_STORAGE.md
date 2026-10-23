# Split project sync — release 1.44.0

Projects can exceed 512 KiB in total. The new wire format gives each milestone, decision, previous-choice snapshot,
Case timeline entry, evidence item and issue its own account record. Project details, Business Model and Case
metadata each have a separate record. The existing database limit remains **524,288 bytes per record**.
`data/projectSize.ts` applies a conservative **380,000-byte per-record editing allowance** to every project save,
including manual changes, checked AI batches and imports. Existing oversized items remain readable and may shrink.
No history is pruned to make room. The total localStorage quota still applies; this is not unlimited device storage.

Local data and exports retain complete nested projects under `myday.data.v4`. Release 1.44.0 uses schema 5 for
the optional decision-history field. Both bundled apps read schemas 2–4 and write schema 5 on save. The classic
app preserves projects unread. Previous releases refuse version-5 data without overwriting it and require their
pre-upgrade exports to resume local editing; old clients cannot cloud-sync after the migration. The wire split
itself introduces no additional main-data field.

## Ownership, order and conflicts

All parts stay in `sync_records`, scoped by `user_id` and the existing RLS. Child identities encode the project,
optional decision and item ids as UTF-8 hex components. Incoming envelopes must agree with those identities.
Children require a live parent. Deleting a project, decision or Case metadata tombstones its descendants.
A child edit advances its parent revisions, so a stale parent deletion conflicts rather than erasing a newer edit.
Independent edits to different items merge. Editing the same item on two devices retains the version-check
conflict flow.

Array positions travel with each child, inside its record. Removing or reordering an item therefore also rewrites
every later sibling's position. If another device edits one of those siblings before it hears about the change, that
sibling becomes an ordinary conflict, not a merge: both versions are kept until the person chooses. Additions
append, so they do not move existing items. Concurrent additions at the same position use record identity as a
consistent tie-breaker; this does not claim an exact time ordering across devices. Pull pages are collected before
one local save, then parents and children are applied in dependency order. A parent-deletion conflict retains its
complete local subtree; choosing the account keeps all displaced records in the existing downloadable file. Choosing
this device restores parents before children. Readable unknown value fields travel with their item.

## Upgrade and rollout

The migration is `migrations/20261023120000_split_project_sync.sql`. It was **applied to the live project on 23 Oct
2026** for release 1.44.0, after a backup of the sync tables and a rehearsal on the live database (test data only)
that rolled back. Every original project was archived unchanged and split into its expected parts; every other
record and the change log stayed identical by fingerprint. It locks the account and record tables in one
transaction, archives original live project payloads and versions in `sync_project_legacy`, then converts them
without pruning. Unrecognised shapes, invalid identities or size violations abort the transaction. The recovery
table permits only each account's own reads; clients cannot modify it. It has no automatic expiry.

The new client calls `sync_push_v2` and `sync_pull_v2`. The legacy endpoints refuse reads and writes with an
update-required message, preventing old clients from uploading a complete project over its converted core.
The new client uses the account's archived original to convert its prior sync baselines before sending offline
edits. If the prior baseline cannot be proved, it uses version conflicts instead of assuming the cloud is empty.
Sync notes remain device-local and are not backup data.

Before any live upgrade:

1. Export MyDay backups on **every device**, including offline edits, and take a database backup.
2. Finish the release's schema/previous-release checks, build and targeted tests. Prepare the matching client
   and this migration together. Obtain the owner's explicit migration and publication approval.
3. Apply the migration in a maintenance window; old clients stop syncing at that point. Publish the matching
   client promptly. A new client opened before the migration shows that the database is not ready and retains
   local data. Keep original exports and database backups until all devices have upgraded and reconciled.
4. With separately authorised disposable live accounts, verify upgrade, independent edits, conflicts,
   offline retries, parent deletion/restoration and complete export/import on the hosted service.

A SQL error before commit rolls the entire conversion back. After commit, **do not publish an old sync client or
simply remove the new endpoints**: legacy rows are archived pre-upgrade snapshots, not a copy of subsequent edits.
Operational rollback needs a coordinated maintenance window and restoration of a verified database backup, or
reconstruction of complete nested projects from all current split records before returning to the old protocol.
Preserve device exports and reconcile any changes made after the backup. No live rollback has been run.

## R2 boundary

This fix stores structured project data in Supabase. R2 is reserved for the separate attachments, backup and public
asset integration described in `../deploy/R2.md`. Creating R2 buckets alone does not change project sync limits,
schedule backups, increase browser storage or add file uploads. No AI context or preview allowance is enlarged.
