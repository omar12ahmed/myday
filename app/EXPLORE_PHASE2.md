# Explore — Phase 2 visual upgrade

Architecture was subsequently refined in the focused [dual-panel construction report](./EXPLORE_ARCHITECTURE.md).
Its current motion and mobile behavior supersede the Architecture details below; this document records the original Phase 2 delivery.

Local implementation, 6 October 2026. Open a project and choose **Explore this idea**.
The Hargeisa Marketplace example now moves from an environmental photograph through an annotated
setting, questions to investigate, an order journey, a layered system drawing, money flow and one
validation action. The seven existing scene types and Phase 1 architecture remain in place.

## 1. Files created

Under `app/src/explore/`:

- `assets.ts`: a reviewed, runtime-validated local image catalogue with provenance and dimensions.
- `ReferenceImage.tsx`: consistent image markup, captions, alt text and loading priority.
- `FlowSymbol.tsx`: reusable SVG illustrations selected by the stage's responsibility.
- `StoryHandoff.tsx`: a small, reusable editorial transition between scenes.

Also created:

- `app/public/explore/market-reference.webp`
- `app/public/explore/access-reference.webp`
- `app/public/explore/delivery-reference.webp`
- `tests/explore-assets.test.js`
- `tests/app-explore-visual.test.js`
- This report, `app/EXPLORE_PHASE2.md`.

Generated review files live in `/tmp/myday-explore-phase2/`, outside the production app. They contain
synthetic test records and are not included in the service-worker cache or deployment.

## 2. Files modified

Under `app/src/explore/`:

- `schema.ts`: optional reviewed image references, context relationships, flow responsibilities,
  action reflections and the coordination relationship kind; context references are also validated.
- `content/hargeisa.json`: reference selections, questions to validate, explicit responsibilities,
  four architecture layers and a concluding distinction between the model and missing evidence.
- `scenes.tsx`: environmental Hero and scene transitions, including shorter starter narratives.
- `NarrativeScenes.tsx`: spatial Context, editorial Problem and illustrated Flow.
- `Diagram.tsx`: reusable four-layer technical drawing and complete textual alternatives.
- `EconomicsScene.tsx`: clearer customer, merchant, platform and delivery money presentation.
- `ActionScene.tsx`: model/evidence reflection before the existing recommendation and task control.
- `Motion.tsx`: all new animation, with scoped cleanup and device-aware enhancement.
- `explore.css`: scoped compositions, typography, palette and responsive transformations.

Documentation and harness changes: `app/README.md`, `app/EXPLORE.md`, `tests/README.md`, `tests/run.sh`.
The default runner now includes the two new Phase 2 suites.

This phase does not modify `App.tsx`, `ProjectView.tsx`, `route.ts`, the store, synchronization,
service worker or task-creation function. Earlier uncommitted changes elsewhere in the workspace
remain intact; they are not Phase 2 changes.

## 3. Dependencies

**None added in Phase 2.** Existing GSAP, ScrollTrigger, `@gsap/react`, Zod, React and Lucide are reused.
No Three.js integration, React Three Fiber, smooth-scroll library or image service was introduced.

## 4–6. Images, provenance and selection

> **Superseded on 10 October 2026:** these user-supplied references were replaced by openly licensed
> Wikimedia Commons photographs. See [Asset provenance in EXPLORE.md](EXPLORE.md#asset-provenance).

Four images are used in total, including the existing street photograph. New supplied JPEG references
were converted to WebP at their original pixel dimensions. No image was generated, retouched, hotlinked
or fetched from an external image service.

| Local asset | Supplied original | Dimensions | Bytes | Narrative role and reason |
|---|---|---:|---:|---|
| `street-reference.jpg` — retained unchanged | `21703.jpg` | 736 × 920 | 153,884 | Hero environment. Street-level activity makes the proposition tangible. |
| `market-reference.webp` — new | `21713.jpg` | 736 × 1102 | 214,970 | Context. Market activity provides a visual base for proposed participant relationships; this role was missing from the single-photo version. |
| `access-reference.webp` — new | `21712.jpg` | 736 × 1308 | 82,122 | First problem question. A physical shop entrance introduces the question of finding reliable product information. |
| `delivery-reference.webp` — new | `21714.jpg` | 736 × 1308 | 69,980 | Second problem question. A parcel handover makes responsibility and delivered cost concrete. |

Source directory supplied by the user:
`/Users/nrt/Documents/Cyber security /myday/images/attachments/`.
No source URL or photographer attribution was supplied, so the catalogue records `sourceUrl: null`
and `creator: "Not supplied"`. The recorded licence is **“User-supplied reference; reuse licence not
established.”** Location is explicitly unverified for every image. The delivery image is labelled an
illustrative reference; its origin/authenticity is not asserted. The market image's visible watermark
is retained, and its full frame uses `object-fit: contain`.

The original street caption is preserved exactly:

> Street life, at trading pace. Reference photograph supplied for this concept; location unverified.

Other captions also identify reference/illustrative status. None is presented as documentation of
Hargeisa, actual merchants, measured demand or validated market conditions. The supplied assets were
visually suitable, so replacement web sourcing was unnecessary. A public release should use confirmed
reuse rights and preferably higher-resolution, authenticated local photography.

The catalogue accepts only reviewed IDs and relative `./explore/` asset paths, bounded dimensions,
alt text and provenance. Scene data cannot introduce arbitrary remote images, scripts or SVG markup.

## 7. Scene-by-scene changes

| Scene | Visual treatment | What it explains |
|---|---|---|
| Hero | Full-width environmental image, large editorial title, restrained gradients, proposition and small annotation | What the marketplace is before asking the reader to investigate it |
| Context | Market image meets an annotated SVG relationship study, with construction lines and an optional supply extension | Proposed participants and handovers; explicitly schematic, not a geographic map |
| Problem | Alternating image/text compositions, large questions and a final typographic question on warm paper | Three hypotheses to validate, with no invented statistics |
| Flow | Five architectural SVG symbols on a shared plane, a drawn connection and named responsibilities | Order → stock confirmation → payment → fulfilment → receipt/delivery |
| Architecture | Blueprint grid, registration marks, node plinths, directional connections and four explanatory layers | Physical goods, information, money and platform coordination |
| Economics | Large customer total, signed merchant bars, a distinct platform band, operating-cost deduction and delivery pass-through | Who receives each part of the payment and which costs belong to whom |
| Action | Calm sage background, model/evidence reflection, one recommended interview and explicit task creation | A practical next step and a return to ordinary MyDay |

Retailers and warehouses are alternative stock sources. The flow deliberately does not imply that
every order must pass through both. International supply remains an optional extension.

The visual review's answer to the quality question is **yes**: the curated edition reads as an
illustrated explanation of an idea. It uses continuous narrative sections and technical drawings,
rather than repeated dashboard cards. The remaining prototype limitations are recorded below.

## 8. Motion

Everything remains inside `Motion.tsx`, using `useGSAP`, its scoped context, `gsap.matchMedia` and
ScrollTrigger. No unrelated MyDay component gains animation logic.

- Hero text settles by 18 px on desktop and 7 px on narrow/coarse-pointer layouts. Essential text is
  never hidden while waiting for animation.
- Heading movement is limited to 20 px desktop / 6 px narrow layouts, following native scroll.
- Context accent paths draw as the diagram enters; annotations settle into their assigned positions.
- Flow symbols arrive in sequence above a permanently visible connection baseline. Stage labels and
  responsibilities remain fully visible throughout.
- Architecture accent paths draw by system layer as the corresponding responsibility notes are read.
  Baseline relationships remain present before enhancement and after cleanup.
- Money sections move a small distance in their reading direction. Amounts update directly from the
  existing deterministic calculation; there are no count-up effects or optimistic intermediate values.
- Hero depth uses only ±1.5% vertical movement and scale 1.045. It requires desktop width, a fine
  pointer, motion permission, more than four reported hardware threads and no reported Save-Data request.

Contexts are reverted on pause, unmount, project/route changes and media-query changes. The original
motion boundary still handles loading errors. There is no scroll interception, pinning, continuous
background animation, video, canvas or WebGL.

## 9. Scene continuity

Fine ruled handoffs carry the argument from idea → environment → friction → process → responsibilities
→ economics → real evidence. They pair a short explanation with a restrained line reveal. They do not
attempt complex visual morphing. Short starter briefs transition from architecture directly to a next
step rather than suggesting a missing economics scene.

## 10. Mobile

At 900 px and below, imagery remains prominent, the Hero's proposition has its own readable band,
the chapter selector occupies a full row, Context becomes a full-size participant/relationship sequence,
and Flow becomes a vertical illustrated journey. Architecture becomes an ordered responsibility schedule
followed by the four layer explanations. Its relationships and optional status are retained.

Economics stacks customer payment, full-width controls and the merchant/platform/delivery explanation;
the signed chart has a readable labelled numerical alternative. Primary targets are at least 44 px.
No horizontal scrolling or heavy parallax is required. The responsive threshold is also used for tablet
layouts rather than squeezing a desktop diagram into tiny labels.

## 11. Reduced, disabled and paused motion

The existing app preference, live OS `prefers-reduced-motion` and session Pause/Resume remain authoritative.
Disabling animation removes transforms/parallax and restores the complete drawing. Desktop static,
reduced and paused readers also receive the full textual architecture schedule. Mobile always receives it.
Scene ordering, images, economics controls, task creation and navigation stay available. Blocking the
motion chunk still leaves the narrative usable. This is animation-failure resilience, not a claim that
the React application works with JavaScript entirely disabled.

## 12–14. Performance and asset weight

Production chunk measurements and Phase 1 comparison are recorded in
`/tmp/myday-explore-phase2/performance.json`. Sizes are bytes; gzip is measured locally and actual
wire sizes depend on server compression.

| Asset | Final bytes | Gzip bytes | Change from Phase 1 |
|---|---:|---:|---:|
| Explore JS (`ExploreScreen-BMH61TUa.js`) | **132,174** | **38,505** | +13,782 raw / +3,792 gzip |
| Motion JS (`Motion-BBDgheES.js`) | 116,553 | 44,999 | +1,654 raw / +468 gzip |
| Explore CSS (`ExploreScreen-TiIWZNYb.css`) | 24,336 | 5,943 | +8,988 raw / +1,991 gzip |

Total incremental runtime assets attributable to this phase: **391,496 bytes** raw, comprising
24,424 additional JS/CSS bytes plus 367,072 new image bytes. Using gzip for the JS/CSS deltas and
the compressed image files as stored gives approximately **373,323 bytes** additional transfer weight.
Build-generated filenames/manifest references can add a few bytes elsewhere; the figures isolate the
Explore chunks and media, rather than mixing in unrelated app assets or review screenshots.

New image bytes: **367,072** (367.07 decimal KB / 358.47 KiB).
All four images: **520,956** bytes (520.96 decimal KB / 508.75 KiB).
Only the Hero is eager/high-priority; the other three images are lazy and asynchronously decoded.
Every image has intrinsic dimensions and a reserved CSS composition. Explore and the motion controller
retain separate lazy chunks; no new dependency enters the app's main route bundle.

Automated budgets enforce <160,000 bytes for Explore JS, <130,000 for motion JS, <400,000 new image bytes,
<600,000 total image bytes and <250,000 for any individual image. These are bundle/media measurements,
not a claim of measured frame rate or physical-device performance.

## 15. Service worker and cache

The existing whole-release cache automatically includes the three new images and changed chunks.
No cache policy, registration code or saved-data behavior changes. After an online install/cache fill,
all four images and the complete narrative load on offline refresh. Normal explicit task creation
continues through MyDay's existing offline store.

Lazy image markup defers rendering-related requests where the browser permits, but the existing service
worker also precaches the entire release. Therefore it downloads the new images during cache installation
even for a user who does not scroll through Explore. Release updates briefly coexist with the old cache
until activation removes it. There is no new remote asset dependency. A first-ever uncached visit still
requires the app to be available online.

## 16. Test results

Production build and lint pass. The final four Explore suites pass **134 checks**: 46 core browser,
20 content/economics, 28 asset-validation and 40 visual/responsiveness/motion checks. The final focused
run includes the starter-brief transition adjustment and conservative parallax guard; it additionally
checks low reported hardware capacity and Save-Data behavior.

**All 40 default regression suites passed: 2,799 checks, zero failures.** The later focused Explore run
above contains repeated coverage plus two additional device-condition checks; it is not added to that
total as if every assertion were unique. The final source also passes the production build and lint.
The local preview was rebuilt with its normal configuration after the test harness's isolated builds.

Logs: [full suite](/tmp/myday-explore-phase2-full-suite.log),
[final Explore run](/tmp/myday-explore-phase2-final-explore.log),
[production build](/tmp/myday-explore-phase2-build.log).

The optional `ai-concurrency` and `ai-deno` environment-specific suites are outside the default runner
and were not run. No AI implementation changed. Existing large main/Cybersecurity chunk and AI import
warnings remain in the build; this phase does not alter those unrelated bundles.
The complete default runner includes classic-app checks, the React app, storage/import/export, projects,
tasks, account record/database/stand-in sync, AI rules/stand-in behavior, cybersecurity, service worker
and all four Explore suites. It uses disposable browser profiles and synthetic records; no live account
or user browser data is seeded or cleared.

Asset checks reject remote/traversal/unknown image references, false verified-location metadata,
invalid dimensions and broken context relationships. Browser checks cover 320/390/768/1440 px,
history, refresh, different projects, exit, failed saves, task deduplication, app motion off, live OS
reduced motion, pause/resume, animation download failure, repeated entry and offline image decoding.

`economics.ts` is unchanged, verified against its pre-phase SHA-1:
`30ba88a1ba3a968025d40c1b611677bc8e671db2`.
The default example still gives $43 customer payment, $4 platform revenue, $6 merchant gross profit,
15% merchant gross margin and $2.50 platform contribution. Existing negative-value, zero-order and
cent-rounding tests remain applicable. No success score or forecast is introduced.

## 17. Screenshots and visual inspection

The Phase 2 visual suite writes to `/tmp/myday-explore-phase2/`:

- `hero`, `context`, `problem`, `flow`, `architecture`, `economics`, `action`, each at 390, 768 and
  1440 px (`<scene>-<width>.png`).
- Detailed Context, Problem, Architecture, Economics and Action views at all three widths
  (`<scene>-detail-<width>.png`).
- `architecture-paused-1440.png`, `architecture-reduced-1440.png`, `hero-reduced-390.png`,
  `context-offline-390.png`, `action-offline-390.png`.

That is **41 Phase 2 screenshots**, plus the existing core Explore captures under
`/tmp/myday-explore-*.png`. Screenshots are temporary review artifacts, not application assets.
The local [review gallery](/tmp/myday-explore-phase2/index.html) links to all full-size images.
Visual inspection covers the actual rendered compositions, normal motion, paused/reduced motion and
offline states. It led to fixes for dark-background heading contrast, photo-caption layering and precise
flow-line alignment. Normal-motion screenshots intentionally show partially drawn accent paths; complete
baseline relationships remain visible. Test devices are emulated Chromium, not physical mobile devices.

## 18. Remaining visual limitations

- The retained Hero is 736 px wide; it is visibly softer on large/high-density displays. Higher-resolution
  licensed local photography would improve the result more than another animation layer.
- Image origin, location and reuse rights have not been established. References are illustrative and
  consistently labelled; they are not factual evidence about the market.
- The technical drawing uses a bounded, deterministic seven-position layout. It is reusable for the
  current contract, not an automatic arbitrary-graph layout engine. Long node text is shortened in the
  drawing and available in its SVG description/title and the textual schedule.
- Tablet/phone architecture prioritizes readable text over the wide drawing; reviewing relationships
  requires more vertical scrolling. A future compact interaction could reduce this without hiding content.
- One business example is curated. Other projects retain their existing starter briefs. There is no
  authored-content editor, persistent exploration/scenario storage, research fetching or AI generation.
- Physical iOS/Safari, low-end Android, screen-reader and measured frame-time testing remain future checks.

## 19. Where 3D might be justified later

Only add 3D if verified input makes it answer a question that the present diagrams cannot:

- A measured warehouse layout with rack heights and loading clearances could explain storage volume,
  stacking limits and access constraints that a flat plan cannot show.
- A verified delivery network could justify terrain or multi-level access modelling if elevation changes
  the routes and service coverage. A flat network with route times should stay a 2D map.
- A measured multi-level supply-chain facility could show how vertical transfers and loading spaces
  constrain throughput. Ordinary supplier-to-customer relationships should remain a 2D diagram.

A decorative 3D city would not improve this brief. Verified locations, distances and operating constraints
should precede any WebGL investment. Each candidate needs a static alternative and a device performance
budget before implementation.

## 20. Before Phase 3

Review the narrative on physical phones, confirm image reuse rights and replace low-resolution references
with authentic photography where available. Validate the retailer interview and money-flow assumptions
before adding factual market claims. If project-specific authored documents or saved scenarios are next,
agree their versioned storage/backup/sync contract first. If AI is subsequently added, its output should
remain validated ExploreData with reviewable sources and explicit assumptions, never frontend code.

The route is still `#projects/p/<projectId>/explore`; ExploreData stays version 1 and the existing saved
application data remains version 4. This phase introduces no localStorage keys, migrations, persisted
Explore records, sync types or automatic tasks.
