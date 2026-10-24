# Resources for a project (web links)

**Status:** approved by the owner on 24 October 2026 ("yes" to Phase 2's next part; resource links; a side-column
card after Learning; project search finds a link's title and note). Phase 2, release 3 of `specs/projects-vision.md`
(after Study links in 1.56.0 and 1.58.0). Not yet released.
**Based on:** source at 1.60.0, then rebased onto 1.61.0 (one AI privacy filter).

## 1. The practical problem

A project gathers useful pages: a supplier's page, a guide, a form to fill in, the council's planning portal. Today
they end up in notes as pasted addresses, or nowhere, and finding them again means searching the browser's history.
The vision (§12) asks for related-resource links on a project.

## 2. What changes

- **A "Resources" card** on the project's Overview, in the side column after Learning (before Manage).
  - **Nothing kept:** one line, "Keep the links you need for this project: a supplier's page, a guide, a form.",
    and **Add a link**.
  - **Each link:**
    - its title, or the site when there's no title, opening in a new tab (↗, announced as "opens in a new tab");
    - the site in small text (e.g. "example-timber.co.uk", without "www."), when the link has a title (otherwise
      the site is already its name);
    - "Note: …" when you wrote one;
    - **Edit** and **Remove**, as quiet text buttons.
  - Remove asks first: "Remove “Timber merchant”? The link and your note go; the page itself isn't affected."
- **Add a link** (and **Edit**):
  - **Web address** (required): typed as you like. "example.com/page" becomes "https://example.com/page".
  - Only web addresses are kept: http or https, with a real site name. Anything else, e.g. "javascript:…", an
    address with a user name or password in it, or a "mailto:", is refused with "That doesn't look like a web
    address. Try something like example.com/page."
  - **Title** (optional, up to 120 characters).
  - **Note** (optional, up to 300 characters).
  - The same address can't be kept twice in one project. At most 30 links a project.
  - Escape or Cancel closes the form without saving.
  - If saving doesn't happen (e.g. another tab saved first), the form stays open with what you typed. If a link
    can't be added for a reason the form didn't check (e.g. the project reached 30 on another device), it says
    "That link couldn't be kept just now. This project may already have 30 links." (found in review).
- **Project search** also looks at each link's title and note (your own words, never the address). A result is
  labelled "Link"; it opens the Overview with that link brought into view and focused. The "nothing found" hint
  ends "…decisions and links" (a case's: "…its timeline, evidence, issues and links").
- The board, At a glance and Today don't change.

## 3. Saved data, sync and AI

- **Saved data:** an optional `resources` on the project, with no schema change. Each link is
  `{ id, title, url, note?, addedOn }`.
  - A project without links is saved exactly as before.
  - On reading, a web address is made whole with the same rule as when adding. A link with no id or no address is
    counted and left out.
  - A link whose address this MyDay doesn't accept (e.g. from a later MyDay with wider rules, or a browser that reads an
    unusual address differently) is kept as it is and shown as "Can't be opened here", with no link. That way,
    editing the project on this device never deletes it for your other devices (found in review, as Study links keep
    a kind they don't know). `webAddress` must not be loosened without keeping that in mind.
  - Titles and notes are tidied the same way every time, cut on whole characters, so saved text reads back unchanged.
  - A site with a non-Latin name shows in its encoded form (e.g. "xn--mnchen-3ya.de"). This is safe, because a
    lookalike can't pass as a familiar site, but it's unfriendly; a later release could decode it.
  - Unknown fields from a newer MyDay are kept.
- **Older releases:** the owner's exception in AGENTS.md. The previous release keeps the field unread through read,
  edit, save and sync (proved with `app-sync-previous`), but doesn't show it, so update every device.
- **Sync:** links travel in the project's own record (the split project sync). The sync-conflict details show them
  as "Links: …".
- **Export and import:** links are included, as the rest of the project is.
- **Deleting a project** removes its links.
- **AI:** nothing is sent.
  - Every AI request builder now asks `aiReach` (1.61.0), and none of them reads `resources`.
  - The ai-rules [Privacy] check plants a secret in each link's title, address and note to keep it that way.

## 4. Decisions

1. Web links only (http/https) for now. Files and attachments come later, after automatic backups (vision §12;
   the owner chose Cloudflare R2 for files).
2. A side-column card after Learning (owner's choice), shown even when empty, as one line.
3. Search finds titles and notes, not addresses (owner's choice).
4. Remove asks first, because the link and note are your own words, unlike unlinking Study, which leaves the item in
   Study.
5. No per-link relationship ("supports this decision") yet: the vision says links shouldn't need classifying.

## 5. Checks

- **Rules:**
  - `webAddress` (bare addresses, http/https, refused schemes, user/password, no site name, length);
  - normalising (valid, invalid, duplicates, unknown fields kept, the tidy reads back unchanged, over 30 from
    elsewhere kept);
  - add, edit and remove (duplicates, the 30 cap, invalid addresses, no change returns false);
  - the site label;
  - search hits for titles and notes but not addresses;
  - the conflict line;
  - the [Privacy] check.
- **Browser:**
  - the empty card and its place;
  - adding with a bare address, the title, site and note;
  - opening in a new tab with `rel="noopener"`;
  - the refusal message;
  - editing, Escape, and removing with its question;
  - search finding a link and focusing it;
  - keyboard, and a phone at 320 px.
- **Previous release:** `app-sync-previous` keeps `resources` through read, edit, save and sync.
- **Visual (Taste skill):** the card empty and with links, desktop and phone, light and dark.
