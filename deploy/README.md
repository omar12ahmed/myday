# Publishing MyDay

MyDay is published with GitHub Pages at **https://omar12ahmed.github.io/myday/**.

Pages publishes the `main` branch as it is ("Deploy from a branch: main, /"). Until version 1.0.0, that branch
held only `index.html`, an older copy of the current MyDay.

## How a release is published

Pages publishes the `main` branch as it is, so `main` holds only the built website. The app's source is on
the `react-rebuild` branch.

1. Export backups first: on the website, Today → "Export my data", **on each device you use** (e.g. your Mac
   and your phone). Saved data lives separately in each browser.
2. Commit the source on `react-rebuild`, and check it: `tests/run.sh`.
3. Run `deploy/publish-main.sh` (the default layout is **switch**). It builds the website from that commit and
   commits it to `main` in a temporary checkout. Your working folder isn't touched.
4. Run `git push origin main`. Pages publishes within a few minutes. Browsers may keep the previous page for
   up to about 10 minutes (Pages' normal caching); a reload after that shows the new release. There's no
   service worker or offline cache, so nothing else needs clearing, and saved data is never cleared.
5. Check the version at the bottom of any screen (e.g. "MyDay 1.0.0 · a1b2c3d · built 2026-10-02"). The
   commit in it is the `react-rebuild` commit it was built from.

| File | What it does |
|---|---|
| `deploy/build-site.sh` | Builds the website exactly as it will be published, into `site/` (or a folder you name). |
| `deploy/preview-site.sh` | Builds it and serves it at http://localhost:8080/myday/ (the same sub-folder as Pages), to check first. |
| `deploy/publish-main.sh` | Builds it from the current commit and commits it to `main` (step 3 above). |
| `deploy/github-pages-workflow.example.yml` | An example, not in use: publishing from GitHub Actions instead of the branch (instructions at its top). |
| `tests/app-site.test.js` | Checks both layouts from a sub-folder: every file loads, `#addresses` work, data is shared, older data is sent to the current MyDay. |

There are two layouts. Both put the two apps on the same website, so **they share the same saved data**
(browser storage belongs to the website, `omar12ahmed.github.io`, and the key stays `myday.data.v4`):

- **switch** (published): the new app is at https://omar12ahmed.github.io/myday/, and the previous kind of
  MyDay (this branch's `index.html`) stays available at https://omar12ahmed.github.io/myday/classic/.
- **trial**: the current MyDay stays at the main address, and the new app is at `/myday/next/`.

The new app needs no server set-up. It uses relative file paths (Vite's `base: './'`), so it works from any
folder, and its screens are `#addresses` (e.g. `#study/roadmap`), so a link or a reload never asks the
server for a page that doesn't exist. Data from a much older MyDay (`myday.data.v3` or earlier) is still moved
by the classic app; the new app links there (set when building, with `VITE_CLASSIC_URL`).

## Publishing with cloud sync

From release 1.1.0 the published app includes sync: it's built with the Supabase project's URL and publishable key
from `app/.env.production` (public values; see [`../supabase/README.md`](../supabase/README.md), step 4). Without that
file, it would be built without sync, as 1.0.0 was. The release before 1.1.0 is tagged `live-before-1.1.0`. Sync's notes (`myday.sync.v1`) and the sign-in session (`myday.sync.auth`) live beside the saved
data in each browser. Going back to a release without sync leaves them unused; it doesn't affect your MyDay data.

## Publishing with AI help

From release 1.2.0 the published app is built with `VITE_AI=edge` (`app/.env.production`), so signed-in accounts see
AI help on Today. It needs, in the Supabase project: the AI migration, the `ai-plan` function deployed with the same
shared code as the release, and the website's address in its `AI_ALLOWED_ORIGINS` setting (see
[`../supabase/README.md`](../supabase/README.md)). Signed-out visitors see the buttons but get "Sign in to use AI
help"; nothing is sent. The release before 1.2.0 is tagged `live-before-1.2.0`; the one before 1.3.0,
`live-before-1.3.0`. Going back from 1.3.0 keeps Notes and Goal in your saved data (1.2.0 keeps whole sections it doesn't
know, so they're there again when you return). Study topics don't survive it: 1.2.0 shows every stage as one roadmap
and, the first time it saves, drops the topic grouping (your stages, courses and tasks stay). Export a backup before
going back, and import it after returning.

To switch AI help off quickly, without a release: `npx supabase secrets set AI_PROVIDER=off --project-ref
nkslcgnbmxuhznvldfnz` (any value other than a known provider) — the cards then say it isn't set up, and nothing is
sent. Set it back to `openai-compatible` to switch it on again. To remove the buttons too: delete `VITE_AI=edge` from `app/.env.production` and publish again.

## Going back

The release before the new app is tagged **`live-before-1.0.0`**. To publish it again:

```bash
git switch main && git revert --no-edit HEAD && git push origin main    # undoes the last publish commit
# or put exactly that release back:
git switch main && git checkout live-before-1.0.0 -- . && git commit -m "Go back to the release before 1.0.0" && git push origin main
```

**Going back to the code doesn't go back to the data.** Your saved data stays in each browser as the new app
last saved it. That old release has no Study and doesn't keep sections it doesn't know, so the first time it
saves, it leaves your Study records out. Export a backup from the new app before going back, and import it
again after returning to the new app.

## Check it locally first

```bash
deploy/preview-site.sh trial     # or: deploy/preview-site.sh switch
# then open http://localhost:8080/myday/ (and …/myday/next/ for the trial)
```

The preview is a different address from Live Server, so its saved data starts empty. Import a backup to see
real data there.

## Checklist after publishing

1. Open the address you published. Your plan, task lists, shifts, pay settings, workouts, recipes, shopping
   list and Study records should all be there. Nothing should ask to start fresh.
2. If you see "Your data needs a quick update first", use its link to open the current MyDay once. It moves
   the data, then the new app opens it.
3. Export a backup from the new app (Today → Export my data). Check the file has all your sections:
   `lists`, `days`, `rota`, `pay`, `health`, `study`, and anything else from your old backup.
4. Change something small (e.g. the theme), reload, and check it's kept. Then open the other app (`next/`
   or `classic/`) and check it shows the same change. Both use the same saved data.
5. On your phone, open each section from the bottom navigation and check nothing is cut off.
6. If a message says some saved entries couldn't be read, press "Download a copy" before doing anything
   else, and keep that file.
