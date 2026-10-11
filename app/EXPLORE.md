# Explore: first vertical slice

This records the Phase 1 foundation. The subsequent visual upgrade and its verification are documented in
[EXPLORE_PHASE2.md](EXPLORE_PHASE2.md). The current photographs are recorded under
[Asset provenance](#asset-provenance) below.

Implemented locally on 5–6 October 2026. Open an existing project and choose **Explore this idea**.
The route is `#projects/p/<projectId>/explore`. Hargeisa Marketplace is my real project (being researched,
not a demo): any project whose title names Hargeisa (Hargeisa, Hargesia, Hargeysa or Hargaysa) and a market
(“Hargeisa Marketplace”, “Hargesia market”) opens its seven-scene exploration. Other projects open their own three-scene starting brief
(Hero, Architecture, Recommended Action), with a **See how Hargeisa Marketplace is explored** link for
reference. Viewing it from another project never renames or populates that project, and its next step
can't create a task in the wrong project.

## Scope and sequencing

The first implementation contained only the validated model, existing-hash route extension, immersive
shell, registry, static Hero and static Architecture. Before adding the other scenes or GSAP, it passed
16 Explore browser checks, 12 schema/routing checks and all 73 existing project checks. Then the remaining
five scene types and the optional motion layer were added. This is not a full Explore/Decide product,
a generic scene-builder, an AI generator, or a publication/deployment.

## Architecture

`Project → contentForProject → ExploreData validation → typed scene registry → scene renderer → optional motion`

- `App.tsx` recognises the Explore suffix before the existing project screen. The hash router, sign-in gate,
  import controls, damaged-data protections, toast provider and shared store stay in place.
- On this route the ordinary app header, sidebar/mobile navigation and footer unmount. The document uses
  native scrolling with a compact project return link, chapter selector and desktop chapter rail.
- Explore and its styles are lazy-loaded. GSAP has a separate lazy chunk and mounts only after the scene
  container exists. A route boundary offers a safe exit on loading failure; a separate motion boundary
  leaves the complete static experience available if its enhancement fails.
- Pending automatic note placement is paused while this route is open. The normal app resumes its existing
  behavior after exit. No Explore AI request is made. Already-running account synchronization remains active.
- Entry remembers the project's scroll position in a bounded in-memory map; returning restores position
  and focuses the entry link. Direct links, refresh, browser history, missing projects and malformed IDs
  are handled without replacing the router.

## Content contract and saved data

`schema.ts` defines a strict Zod discriminated union for exactly seven scene types:
`hero`, `context`, `problem`, `flow`, `architecture`, `economics`, `action`.

Documents have `schemaVersion: 1`, an edition/content ID, project ID, title, edition (`curated` or `starter`)
and 2–7 scenes. The boundary enforces a leading hero, unique scene IDs/types, bounded text/arrays, unique
diagram nodes and valid edge references. Documents over 64 KB or with unknown presentation fields/types
are rejected. Hero assets are selected from an enum, not arbitrary URLs. Content is rendered as escaped
React text; it cannot supply frontend code, HTML, CSS, SVG markup or executable formulas.

Scenes identify their basis as `brief`, `assumption` or `example` (shown as “Placeholder figures”). The
Hargeisa exploration states hypotheses to test, not findings: research hasn't confirmed them yet. The context
drawing is explicitly schematic, not a verified geographic map. The economics uses placeholder figures until
research replaces them; changes made on the page aren't saved.

There are **no new saved Explore records, localStorage keys, schema migrations, sync record kinds or database
changes**. Curated JSON ships with the app. `myday.data.v4` remains schema version 4. The chapter, motion pause
and economics inputs use React state; scenario edits reset on refresh and are labelled as unsaved.

Only **Create this task** changes saved data. It calls the existing `addTask` through `updateSaved`, attaches
the existing `projectId` field and uses a bounded source marker in the existing `notes` string to prevent
repeat creation. It does not alter project stage, next step, task due date, Today or Calendar. The ordinary
save sequence/log advances normally. Failed saves are reported without adding a phantom task; stale-tab
checks remain those of `storage.ts`. Generated tasks continue through the existing backup and sync paths.

## Scene treatments

| Scene | Presentation | Meaning |
|---|---|---|
| Hero | Large typography, deep ink background, one reference photo | What the marketplace offers |
| Context | Muted plan-like SVG and annotated roles | Who might participate; optional international supply |
| Problem | Numbered editorial rows on warm paper | Three hypotheses to test, with no invented market statistics |
| How It Works | Ordered process diagram and scroll-drawn connection | Ownership of each proposed handover |
| Architecture | Reusable node/edge SVG on a blueprint grid | Goods, coordination and payment responsibilities |
| Economics | Adjustable assumptions, signed bar chart and two ledgers | Merchant economics separated from platform revenue |
| Recommended Action | One validation activity with explicit task creation | A concrete next step, plus return/revisit choices |

The existing Plus Jakarta Sans font is reused. Styling is confined to `.explore` and scene classes.
No unrelated screen is redesigned by this feature. The workspace already contained an earlier general
UI refresh when implementation began; those changes were preserved.

## Economics

One illustrative USD order starts with merchandise value 40, merchant product cost 28, inbound logistics 2,
delivery 3, platform operating cost 1.50 and commission 10%. Inputs are finite, nonnegative and bounded.
Calculations round money to cents; output losses are not clamped away.

- Customer pays: merchandise + delivery = **43**.
- Platform revenue: merchandise × commission = **4**.
- Merchant gross profit: merchandise − product cost − inbound logistics − commission = **6**.
- Merchant gross margin: gross profit / merchandise = **15%**; undefined when merchandise value is zero.
- Platform contribution: commission − platform operating cost = **2.50**.
- Delivery: 3 collected and 3 paid out, assumed zero platform margin.

This is an agency marketplace example. Merchant costs are not subtracted a second time from platform revenue.
The contribution is not net profit; fixed overhead, tax, returns, payment failure and other unmodelled costs
are excluded. There is no success score, probability of success or inferred market forecast.

## Motion, mobile and offline

**Entrances (10 October 2026).** Each section now arrives once, as it comes into view:
- **Headings:** title lines rise out of masks and the kickers are wiped in.
- **Photos:** each opens like a curtain while the picture settles from a slight zoom.
- **Questions:** each is revealed and underlined.
- **Order journey:** steps arrive in order, each number stamped in after its card.
- **Money:** ledgers slide open and the chart bars grow from zero.
- **Next step:** the task card assembles piece by piece.
- **Hero:** the city opens out from a window and the title rises line by line. With depth enabled, the
  photo slowly closes in as you leave while the title lifts away faster.

Safeguards:
- Anything already on screen (a refresh, a chapter jump, resuming motion) is shown finished, never hidden.
- Each entrance clears its own styles when it ends, so a finished section is exactly the static page.
- Each element carries only one animation per property, so pause and reverts restore it exactly.
- Reduced motion, MyDay's animations setting and the Pause control still show everything static.

**Motion graphics (10 October 2026).** Two places explain more in motion than as a still drawing:
- **Order journey (desktop):** one order token rides the tip of the journey line as you scroll. Its status
  changes at each responsibility (order placed → stock confirmed → payment agreed → collected →
  delivered), and each stage's number fills as the order passes. It is scrubbed by scroll (never
  autoplayed) and hidden whenever motion is off.
- **Money split (`MoneySplit.tsx`):** the customer's payment divides into merchant, platform commission
  and courier streams. Stream widths are to scale and recalculated from the sliders, and the same figures
  are listed as text beside the drawing. On arrival the streams draw out and one highlight runs along each
  once; there is no looping.

Considered and not used: the `cth9191/animate` Claude Code plugin. It renders procedural canvas animations
to MP4 video (Playwright, ffmpeg, Python), which suits a short pitch video outside the app. It doesn't suit
Explore, which must follow scrolling, react to the sliders and adapt to any project's data within a 600 KB
media budget. Three.js was also not used, for the reasons recorded in this conversation's notes: bundle
size, battery, a separate fallback, and no gain for a story about relationships and money.

These supersede the older "8–18 px, never opacity-zero" rule: text is hidden only until its own section
arrives, and only while motion is on. Checks in `tests/app-explore-visual.test.js`: an off-screen
section waits, on-screen content is never left hidden, the section arrives when reached, played entrances
leave no styles, and reduced motion hides nothing.


Dependencies added: `zod ^4.6.5`, `gsap ^3.15.0`, `@gsap/react ^2.1.2`.

`Motion.tsx` registers ScrollTrigger and uses `useGSAP` with a scoped context plus `gsap.matchMedia`.
Reveals move content only 8–18 px; essential text is never hidden by initial CSS or an opacity-zero state.
The flow's accent line draws with scroll above a permanently visible baseline. A small image parallax runs
only with a fine pointer, desktop width and motion permission. There is no pinning, continuous background
animation, scroll interception, Three.js integration or smooth-scrolling library. Chapter jumps use native
smooth scrolling only when permitted.

MyDay's existing animations preference and live OS `prefers-reduced-motion` changes govern enhancement.
A session-only Pause/Resume control can further reduce motion, without overriding either preference.
GSAP contexts and observers are cleaned up on pause, route exit and component removal. Errors fall back to
readable content rather than stopping the narrative.

At 900 px and below, the hero becomes vertical, chapters move into a full-width selector, context becomes
an annotated role sequence, architecture becomes an accessible participant/relationship list, the flow
becomes vertical, and economics becomes a stacked table with full-size controls. Parallax is disabled.
Desktop SVG descriptions and mobile text contain the same underlying content. All primary controls have
at least 44 px targets. There is no canvas/WebGL or sensor-based performance detection.

The existing service worker includes the new chunks and the six photos (about 590 KB) in its release cache. Once the
built app has loaded and cached online, Explore, photography, scenarios, and task creation work offline.
No new remote asset/API dependency is required. A first visit still needs the app itself to be available.

## Asset provenance

Updated 10 October 2026 (second pass). The photographs no longer need to be of Hargeisa. Each one tells one
beat of the story, and the last brings the story back to Hargeisa for the first real conversation. Five come
from Pexels and one from Wikimedia Commons. The Hargeisa-only set chosen earlier the same day was replaced
because these tell each beat more directly. The user's original references remain in
`/Users/nrt/Documents/Cyber security /myday/images/attachments/`; nothing was deleted there.

| Story beat | Asset id → file | Source page | Author | Licence | Changes | Pixels | Bytes |
|---|---|---|---|---|---|---:|---:|
| Hero: a connected city | `market-aerial` → `market-aerial.webp` | [Pexels 31853996](https://www.pexels.com/photo/aerial-view-of-busy-market-street-in-enugu-nigeria-31853996/) (Enugu, Nigeria) | Chukwuemeka Joel | Pexels License | Cropped, resized | 1440 × 1800 | 209,524 |
| Context: its people | `market-crowd` → `market-crowd.webp` | [Pexels 28468236](https://www.pexels.com/photo/bustling-african-market-street-scene-28468236/) | Al-amin Muhammad | Pexels License | Resized | 840 × 1120 | 132,668 |
| Can I find what I need? | `packed-shop` → `packed-shop.webp` | [Pexels 30848031](https://www.pexels.com/photo/small-shop-interior-with-local-shopkeeper-30848031/) | Kalz Michael | Pexels License | Cropped, resized | 960 × 960 | 95,326 |
| Who owns the handover? | `parcel-handover` → `parcel-handover.webp` | [Pexels 12725460](https://www.pexels.com/photo/man-delivering-box-to-woman-12725460/) | Roman Odintsov | Pexels License | Cropped, resized | 1100 × 1100 | 43,754 |
| What will it really cost? | `cash-handover` → `cash-handover.webp` | [Pexels 10400717](https://www.pexels.com/photo/a-person-handing-money-to-a-person-10400717/) | cottonbro studio | Pexels License | Cropped, resized | 1100 × 1100 | 22,486 |
| Next step: back in Hargeisa | `market-street` → `hargeisa-fruit-market.webp` | [Commons HG 0272.jpg](https://commons.wikimedia.org/wiki/File:HG_0272.jpg) (Hargeisa, Oct 2021) | O. Mustafin | CC0 1.0 | Cropped, resized, sign text blurred | 900 × 1125 | 88,960 |

**Story.** The page moves from a city to people to stock to two handovers to a first conversation:
- **City and people:** an aerial market street shows trade already moving through the city; a street-level
  crowd shows the people every handover depends on.
- **Stock:** a shop packed to the ceiling shows stock that exists but can't be seen from outside.
- **Two handovers:** hands passing a parcel, then hands passing cash. The pair separates the goods
  handover from the payment.
- **First conversation:** the Action scene returns to a real Hargeisa street, where the first retailer
  interview could happen. The cart's sign (phone numbers and a name) is blurred so the page doesn't point
  at a real seller.
- **Not illustrated:** flow, architecture and economics keep their drawings.

**Licences and credits.**
- **The terms:** the [Pexels License](https://www.pexels.com/license/) allows free use and editing
  without attribution. People must not be shown in a bad light, copies must not be sold unaltered, and
  endorsement must not be implied. The captions describe each scene neutrally and don't suggest anyone
  takes part in this project.
- **Credits shown:** every caption credits the author, links to the photo's page and its licence, and says
  what was changed. Credit is optional under Pexels and CC0; it is given anyway.
- **Locations:** only Enugu (from the Pexels page) and Hargeisa (the photographer's description) are named;
  the other photos give no location, so none is claimed.

**Searching.** Openverse (Flickr, Wikimedia, StockSnap, Rawpixel) gave weak matches for story beats. Pexels
was searched by beat (aerial market, crowd, packed shop, parcel handover, cash exchange). Unsplash blocked
scripted access. About 30 candidates were compared on contact sheets.

**Rules kept.**
- **Weight:** each file is under 250 KB, and all six together are 592,718 bytes, under the 600 KB limit.
  The two busiest scenes needed lower WebP quality (0.50–0.52) to fit; they were checked visually.
- **Catalogue:** it accepts only reviewed ids and local files. Sources are limited to Commons or Pexels
  pages, the licence must match the source, and every catalogue photo must be used by the story
  (`tests/explore-assets.test.js`).
- **Contrast:** hero and caption text measured against the photos' pixels passes WCAG AA everywhere. The
  phone hero gradient was strengthened for the aerial photo, from 2.58:1 to 5.82:1.

## File inventory for this feature

Created under `app/src/explore/`:

- `schema.ts`: validated content contract and inferred types.
- `content.ts`, `content/hargeisa.json`: curated example and honest starter brief.
- `route.ts`: route parsing, encoded links and entry position restoration.
- `ExploreScreen.tsx`, `ExploreBoundary.tsx`: immersive shell and failure containment.
- `sceneContext.ts`, `scenes.tsx`, `SceneHeading.tsx`: renderer contract, finite registry and shared heading.
- `NarrativeScenes.tsx`, `Diagram.tsx`, `EconomicsScene.tsx`, `ActionScene.tsx`: reusable scene presentations.
- `economics.ts`: deterministic cent-based model.
- `Motion.tsx`, `useMotionPreference.ts`: optional animation controller and live preference subscription.
- `explore.css`: scoped visual language and responsive layouts.

Also created: the photographs in `app/public/explore/` (see Asset provenance), this document, `tests/app-explore.test.js`,
`tests/explore-rules.test.js`.

Modified for Explore: `app/src/App.tsx`, `app/src/projects/ProjectView.tsx`, `app/package.json`,
`app/package-lock.json`, `app/README.md`, `tests/README.md`, `tests/run.sh`.
The test runner adds Explore suites to the default run; no storage, sync, backend or existing router module
was replaced.

## Verification and limits

Final verification: production build and lint passed; all 23 selected suites passed across the complete run
and targeted reruns, totaling **1,578 checks**. This includes **46 Explore browser checks** and **20 content /
economics checks**. Two existing suites were rerun after their disposable browser connection closed; both
passed. The flow-progress check was corrected to scroll the actual flow diagram, not just its scene heading.
No live account or real device data was used.

The browser harness uses synthetic records in a disposable Chrome profile; the user's browser storage is
never seeded or cleared. Screenshots are written to `/tmp/myday-explore-*.png`. The Explore checks cover
320/390/768/1440 px layouts, static rendering, task creation and deduplication, storage failure, saved-data
preservation, refresh, browser Back/Forward, different projects, exit, OS reduced motion, app animations off,
live pause/resume, progressive flow drawing, offline refresh and blocked animation downloads. Pure checks
cover malformed/oversized/injected scene data and economics including negative outcomes and rounding.

Limitations: one curated business example; other projects have a starting brief, not generated analysis.
No AI generation, research fetching, authored-content editor, saved scenarios, additional scene types,
market integrations or verified Hargeisa facts. Runtime validation is ready for a future adapter but does
not make factual claims true. Device coverage uses Chromium emulation, not physical Safari/iOS or Android.
Existing large app/Cybersecurity build chunks and pre-existing AI import warnings are outside this feature.

Recommended next phase: review this slice on physical phones, then add explicit project-specific content
selection/editing and source-backed evidence. If persistent Explore drafts are wanted, design their versioned
storage, backup and sync contract before adding them. AI should eventually populate this validated contract,
with source provenance and review, never generate frontend code.
