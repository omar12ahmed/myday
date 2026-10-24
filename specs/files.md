# Files (shared attachments)

**Status:** started with the owner's "go ahead" on 24 October 2026; the owner's decisions are in §2. Not yet built or
released. Nothing live happens without the owner's yes at each step: the Cloudflare token and bucket CORS (done by the
owner), the database migration, the function deploy, and publishing.
**Based on:** source at 1.65.0. Plans: `specs/projects-vision.md` §12 (attachments, after backups),
`specs/myday-vision.md` §6 ("each file has one identity, and projects refer to it"; files in R2), `deploy/R2.md`, and
the Cybersecurity portfolio's requirements (`specs/study-home-and-lessons.md` §10, by myday-86), which this design
covers as an area of its own.

## 1. The practical problem

A project collects papers: a quote as a PDF, a photo of the damp patch, a spreadsheet of costs. A note often wants
the photo it's about. Today they live elsewhere, and MyDay can only describe them. The vision asks for real files with
one identity each, which projects (and later notes, tasks and the portfolio) refer to, with clear deletion and
recovery, kept privately in R2.

## 2. The owner's decisions (24 October 2026)

1. **Projects and notes** can have files in this first release.
2. **Photos, PDFs and documents, up to 25 MB each:**
   - images: JPEG, PNG, HEIC, WebP;
   - PDF;
   - Word, Excel and PowerPoint;
   - plain text and CSV.
   Photos get a small preview.
3. **Removing a file** from a project or note takes it out of there.
   - If nothing else uses it, it goes to **Recently deleted** for 30 days, where you can put it back.
   - After 30 days it's gone for good.
   - If something else still uses it, only this link goes.
4. **Backups list your files** (names, types, sizes, where they belong); the files themselves stay in your private R2
   bucket. **Opening a file needs a connection.**

Also, per the other decisions on record:
- **Never sent to AI**, neither names nor contents.
- **Files go in R2** (`myday-attachments`).
- **"Delete everything", as a true wipe, deletes them too.**

## 3. What you see

- **A "Files" card** on a project's Overview, in the side column after Resources, and a **Files** section under a
  note's text (in the note editor).
  - **Each file:**
    - a small preview for a photo, or a type badge (PDF, Word, Excel, PowerPoint, Text, CSV);
    - its name and size;
    - **Open** (a photo or PDF opens in a new tab; any other file downloads);
    - **Remove**.
  - **Add a file:** pick one or more files (or drop them on the card).
    - Each shows its progress, then appears.
    - A file that isn't allowed is refused with the reason, e.g. "Only photos, PDFs and documents, up to 25 MB.";
      nothing half-done is left.
    - Offline or signed out: "Adding files needs a connection and your account."
  - **Recently deleted (2):** a disclosure under the card, with each file's name, the day it goes for good, **Put
    back**, and **Delete now** (it asks first) for a file you want gone at once.
- **Opening** asks the function for a link that works for a few minutes and only for that file. Nothing about files
  is public.
- Signed out, or with the function not set up: the card says so plainly, and lists the files you already have without
  opening them.

## 4. How it works

### Saved data (schema stays 5)

- **A top-level `files` section:** `{ items: FileRecord[] }`, where each record is
  `{ id, name, type, size, sha256, area, state, addedOn, deletedOn?, removedFrom? }`.
  - `area` is 'project' or 'note' here, and 'portfolio' later.
  - `state` is 'uploading', 'kept' or 'failed'.
  - `removedFrom` is `{ kind, id }`, used by Put back.
  - Unknown fields from a newer MyDay are kept.
- **Where a file belongs:** an optional `fileIds` on a project (in its own record) and on a note. A file belongs
  wherever its id is listed. Removing takes the id out of that list; Recently deleted holds a file nothing lists any
  more, with `deletedOn` set.
- **Sync:** each file record is its own sync record, of the new kind `file`, deletable. That needs a constraints-only
  migration adding `file` to the two kind lists, as was done for `arabic_word`. `fileIds` travel inside the project and
  note records.
- **Older releases:** the owner's exception for `fileIds` (optional fields in records whose unknown fields the
  previous release keeps). The new `files` section is kept unread by the previous release's normalizer, and the new
  `file` kind is ignored when pulling. All of this is proved with `app-sync-previous`.
- **Export, import and backups:** the `files` section and `fileIds` are part of the data, so backups list your files.
  Contents aren't in backups (owner's decision 4). A restored backup that names a file which was purged shows it as
  "No longer stored".

### On the server (`supabase/functions/files/`: `index.ts` and `handler.ts`)

- **Sign-in first**, as in `backup`: a sign-in token, checked with Supabase Auth. Every R2 key is
  `<userId>/<fileId>` and `<userId>/<fileId>.thumb`, built from the verified user id, never one sent.
- **Per-area rules** (the portfolio's are stricter):
  - **project and note:**
    - allowed types (by content and name): JPEG, PNG, HEIC, WebP, PDF, docx, xlsx, pptx, txt and csv;
    - 25 MB each;
    - never SVG, HTML or any script;
    - downloaded, never rendered, except images and PDFs, which open inline.
  - **portfolio (later):** PNG, JPEG, WebP and PDF; 2 MB each; 200 MB in all.
  - **Removing** goes to Recently deleted in every area by default. That's one behaviour across MyDay, and a mistake
    never loses a file. An area may choose otherwise (the hook stays). The portfolio's choice goes to the owner when
    it starts, with myday-86 recommending this default (24 October 2026).
  - **Every account:** 2 GB in all (an adjustable default, well inside R2's free 10 GB).
- **Actions:**
  - **`POST upload`** `{ fileId, area, name, type, size, md5, sha256 }`: checks the rules and the account's total,
    then returns a **presigned PUT** URL for that one object, valid 5 minutes. It signs in the **Content-Type** (fixed
    by the server from the type), the **Content-MD5** of the file and the **Content-Disposition** (inline for images
    and PDFs; attachment with the file's name for everything else). R2 refuses any upload whose bytes don't match the
    MD5, which pins the exact file, and so its size. R2 doesn't enforce a declared length or SHA-256 checksums on
    presigned uploads, so that's how size is enforced.
  - **`POST confirm`** `{ fileId, area }`: checks the stored object (its size against the rules, and its type by its
    first bytes, read with a Range request), then answers kept, or deletes it and says why. Only then does the app mark
    the file kept. The SHA-256 is worked out on the device and kept in the record, to tell identical files apart.
  - **`POST thumb`** `{ fileId }`: a presigned PUT for the preview (a small WebP the app makes), 200 KB at most.
  - **`POST open`** `{ fileId }`: a **presigned GET**, valid 5 minutes. The object carries the Content-Type and
    Content-Disposition fixed at upload, so images and PDFs open inline, and anything else downloads under its name.
    R2 doesn't document overriding response headers, so nothing is overridden.
  - **`POST delete`** `{ fileIds }`: removes those objects (and their previews).
  - **`POST delete-all`**: every file of the account; for the true wipe.
  - **`GET usage`**: the account's total, for "1.2 GB of 2 GB".
- **Logs:** the action, the outcome and the time only. Never names, keys, ids or links.
- **Secrets:** an Object Read & Write token limited to `myday-attachments` (separate from the backups token), as
  `R2_FILES_ACCESS_KEY_ID`, `R2_FILES_SECRET_ACCESS_KEY` and `R2_FILES_BUCKET`. `R2_ACCOUNT_ID` is shared.
- **The bucket's CORS** allows only the site's address (and localhost for testing), with GET and PUT and the
  headers `Content-Type`, `Content-MD5` and `Content-Disposition`. Uploads and opening go straight between the browser
  and R2 on the short-lived links, which work only on R2's own S3 address, not a custom domain. The format is from
  Cloudflare's R2 CORS page: a JSON array of rules with AllowedOrigins, AllowedMethods, AllowedHeaders,
  ExposeHeaders and MaxAgeSeconds, set under the bucket's Settings, then CORS Policy.

### In the app

- **`app/src/data/files.ts`**: the records, normalizing, add, remove, put back, purge after 30 days, usage, and the
  type and size rules (shared with the function's rules, so device and server agree).
- **`app/src/sync/files.ts`**: hashing (SHA-256 with `crypto.subtle`), the preview (a 320 px WebP from a canvas), the
  upload steps (upload, PUT, confirm, thumb), open, delete, and retrying an upload left 'uploading'.
- **`app/src/files/FilesCard.tsx`**: the shared card, used by the project Overview and the note editor.
- **Upload state:** a record is saved as 'uploading' first. It becomes 'kept' only after confirm. If the upload
  fails, it's offered again ("Try again" or "Remove"). A record left 'uploading' on another device shows as "Being
  added on another device".
- **Purge:** when MyDay opens signed in, files in Recently deleted for more than 30 days are deleted from R2, and then
  their records are deleted.

## 5. Privacy and safety

- Files are never sent to AI: no request builder reads them. The ai-rules [Privacy] check plants a secret file name
  to prove it, and `ai/reach.ts`'s header says so.
- **Isolation** by the verified user id, on every action. Short-lived links for one file and one operation each. No
  public links.
- **Types** are checked by content on the device and on the server. SVG and HTML are refused everywhere. Office files
  are only ever downloaded.
- **Private projects and notes:** their files are as private as they are (never to AI, and only you can open them).
- The R2 token is never in the app, the repository, a `VITE_` variable or chat.

## 6. Setup and release steps

1. Build: the function, the data, the card and the migration file, with tests (local stand-ins only).
2. Independent review (Fable: security, privacy, saved data).
3. **The owner, in Cloudflare** (step-by-step instructions, with a template file created and opened):
   - an Object Read & Write token for `myday-attachments` only;
   - the bucket's CORS policy (the exact JSON will be given).
4. **The owner, in a terminal:** the three secrets through an ignored env file, deleted afterwards.
5. **With the owner's yes:**
   - the migration adding `file` (rehearsed in a transaction that rolls back first);
   - deploy `files`;
   - a direct check with disposable account A;
   - publish, then the live check, tidied.

## 7. Checks

- **Function:**
  - sign-in first;
  - isolation;
  - per-area rules (type by name and content, size, total);
  - presigned URLs (scope and expiry);
  - confirm (size, magic bytes, SHA-256; a mismatch deletes);
  - open (inline vs attachment, fixed content type);
  - delete and delete-all;
  - not configured;
  - CORS;
  - content-free logs.
- **App rules:**
  - normalizing (unknown fields kept, idempotent);
  - add, remove, put back and purge;
  - "used elsewhere" keeps the file;
  - the 30 days;
  - the type and size rules;
  - usage.
- **Browser:**
  - adding a photo and a PDF to a project, and a document to a note;
  - the preview;
  - Open;
  - a refused type;
  - offline and signed-out wording;
  - Remove, then Recently deleted, then Put back;
  - the same file in a project and a note;
  - 320 px;
  - keyboard;
  - drop.
- **Sync and previous release:** a file record and `fileIds` sync between devices, and the previous release keeps
  them.
- **Privacy:** the [Privacy] leak world includes a file with a SECRET- name.
- **Live:** as in §6 step 5, on account A, tidied (its files deleted).
