# Explore — Architecture construction sequence

## Cinematic construction — 10 October 2026

A design brief asked for five things: a blueprint that is *produced* rather than faded in, an exploded
system that assembles, a more dimensional language, scroll-driven cinematic transitions, and a final
composition that reads as a designed artefact. This section supersedes the visual description in the
older sections below; their timing rules, sticky range, fallbacks and safeguards are unchanged.

**What the reader sees (desktop, sticky board).** The drawing and the system share the existing scroll
clock. Layer `i` still inks at `0.12 + i × 0.18` and its system plane still follows exactly `0.12` later.

| Scroll progress | Blueprint (sheet 01) | Proposed system (sheet 02) |
|---|---|---|
| 0 | Faint paper grid only; camera slightly closer (scale 1.075) | Four tinted planes, tilted back 28° and apart in depth; perspective grid hidden |
| 0–12% | Major grid unrolls (clip), frame and construction lines drawn in sequence, registration marks stamp in, A–C column axes drop in, compass arcs open, each role outlined → filled → labelled, faint relationship baselines pencilled last | Perspective grid rises from the bottom (clip) and drifts slower than the page (parallax) |
| per layer | The layer's accent line draws; its numbered keynote lands as the line passes the midpoint | 12% later: the plane rotates flat, moves forward and seats with an offset shadow plane; its joint to the plane above draws; the relationship count slides in; rules and arrows resolve as before |
| → 95% | Camera pulls back to scale 1 and settles | All four planes assembled and joined |
| 95–100% | Hold on the completed drawing set before the sticky board releases | |

**Final composition.** The two panels read as sheets of one drawing set. Each has a title block
(sheet 01 / 02, scale none; sheet 02 / 02, view assembled), and they share one numbering:
- **Numbering:** the same circled 01–04 appears as keynotes on the drawing, on the planes and in the legend.
- **Line weights:** hairline grid and construction, inked roles, heaviest outline for the hub.
- **Colour:** one colour family per layer — a light line colour on the dark drawing, an ink edge and a
  tint on the light sheet.
- **Typography:** panel titles are slightly larger and tighter, with letter-spaced mono labels.

**Phones (stacked).** The drawing is drafted as it rises into view (SVG top from the bottom edge to 82%),
then relationships draw as before. Each plane starts tilted 12° and locks in as it is reached.
No camera move; keynotes show as coloured dots, because 22-unit text would be too small at that scale.

**What did not change.**
- No text waits on motion except the role labels inside the drawing during the first 12% of the hold.
  The participant key beneath the drawing, the system relationships and the reading below are always
  readable. The planes' text is readable while tilted and fully flat once seated.
- Pause, MyDay animations off, OS reduced motion, a blocked motion download and a mid-setup failure
  all show the finished drawing set. GSAP leaves a residual matrix on reverted SVG elements, so
  `clearSvgTransforms` removes it after every revert (pause, breakpoint change, failure, unmount).
- There is still no pinning by GSAP, no WebGL/Three.js, no timers and no new dependency. The depth is CSS
  perspective and layered SVG. Full 3D was not used because it would not explain more.

**Fit.** The planes' gaps and padding were tuned so the board still fits under the toolbar at every held
size. Measured board bottom against the viewport:

| Viewport | Margin to the bottom edge |
|---|---|
| 1440 × 900 | −17 px |
| 1100 × 900 | −26 px |
| 1024 × 900 | −38 px |
| 900 × 980 | −46 px |
| 768 × 1000 | −48 px |
| 680 × 980 | −10 px |

**Contrast.** Measured against the rendered pixels behind each text line (text hidden, screenshot,
brightest 1% of background), the finished board passes WCAG AA for all 206 measured lines at 1440 × 1000,
1024 × 900 and 390 × 844. That includes the title blocks, axis letters, keynote numbers, counts and
circled numbers.

**Tests.** `tests/app-architecture.test.js` keeps its 90 checks. It gains 32 more:
- **Desktop:** undrafted sheet at 0; roles drafted before any relationship; keynotes waiting and landing;
  planes apart, then each locking in with its layer; camera settling.
- **Phones:** drafting as the drawing enters; planes locking in once reached.
- **Static states:** every drafting mark and assembled plane present and untransformed after pause,
  reduced motion, animations off and setup failure.

**Files.** `Diagram.tsx` (sheet, axes, registration marks, keynotes, camera group, perspective grid, title
blocks, plane joints and counts), `architecture.css`, `Motion.tsx` (drafting, keynotes, assembly, camera,
cleanup) and the test suite. No content, schema, storage, route or dependency changes.
Current build sizes: Explore JS 139,076 bytes, Motion JS 122,004, Explore CSS 31,515.

**Limits.**
- Chromium emulation only; no physical Safari, iOS or Android check, and no frame-rate claim.
- Keynotes sit on each layer's first relationship and are tuned for the seven-slot layout; a much denser
  architecture would need another visual review.
- The Context and Flow scenes still use staggered tweens, where only the first element gets its starting
  offset (a small jump on the others). Architecture no longer does; the other scenes were left unchanged.

---

## Follow-up: visible motion across window sizes

6 October 2026. A user report exposed two gaps: the 662 × 827 pane used a barely visible stacked
sequence, and shorter wide windows had no Architecture animation. The following changes supersede
the original short-height fallback and mobile timing described below:

- Wide windows below the sticky height threshold now animate the same two-panel sequence in normal
  document flow. Taller windows retain the existing sticky sequence and exact 12% system lag.
- The stacked blueprint draws from the SVG's entrance (top at 82% of viewport height) until its top
  reaches 25%. The original figure trigger began construction while the drawing was still below view.
- Narrow diagrams use their available panel width and natural aspect ratio. Accent strokes remain
  1.8 CSS pixels at every size, instead of shrinking with the SVG.
- Dash distances account for the SVG's displayed scale and refresh when the viewport changes, so the
  visible construction follows the same scroll progress at every size. This follows the screen-space
  treatment documented in [GSAP's DrawSVG implementation](https://github.com/greensock/GSAP/blob/master/src/DrawSVGPlugin.js);
  no additional plugin or dependency is loaded.
- System arrows resolve with their corresponding lines. All relationship text remains fully readable.
- In the existing narrow Context and How It Works layouts, vertical connectors develop as each step
  enters view. Flow symbols now follow their own step rather than a timeline spanning the entire list.
- Mobile title/reveal offsets are slightly clearer (12–16 px). Photo parallax remains desktop-only.

Only `Motion.tsx`, `architecture.css`, `explore.css`, the focused regression suite and documentation
change in this follow-up. There are no dependencies, content, storage, route or project changes.
CSS defaults show complete connectors. Pause, app animations off, reduced motion, failed animation
loading and cleanup continue to reveal the complete static reading.

The original report and its historical verification results follow. Follow-up verification is recorded
at the end of this report.

---

6 October 2026. Focused refinement of the existing Architecture scene. Flow and the other scenes retain
their previous behavior. Open a project → **Explore this idea** → **The operating architecture**.

## 1. Scope and files

Architecture was chosen because its existing goods, information, money and coordination relationships
map directly to blueprint → proposed system. Flow explains one order journey; a second presentation
there would repeat the process instead of explaining the system's responsibilities.

Modified:

- `src/explore/Diagram.tsx`: existing schematic plus a coordinated relationship reading, both derived
  directly from the same validated nodes and connections; the complete textual alternative remains.
- `src/explore/Motion.tsx`: replaces the old Architecture layer-note animation with the construction
  timeline. Other scene animations are unchanged.
- `src/explore/explore.css`: Architecture-specific styles moved into a focused stylesheet.
- `../tests/app-explore.test.js`: mobile expectation now checks the numbered drawing alongside its
  accessible text, instead of requiring the drawing to be hidden.
- `../tests/run.sh` and `../tests/README.md`: register and document the new regression suite.
- `EXPLORE_PHASE2.md`: points readers to this newer Architecture behavior.

Created:

- `src/explore/architecture.css`: Architecture-only two-panel, stacked and sticky compositions.
- `../tests/app-architecture.test.js`: focused browser behavior, failure, accessibility and screenshot checks.
- This report, `EXPLORE_ARCHITECTURE.md`.

No dependencies, data fields, routes, persistent state or images were added. Task-start SHA-256
comparisons confirm that `App.tsx`, project entry behavior, storage, scene schema, curated JSON,
economics, Action, scene registry, other narrative scenes, service worker and dependency manifests
are unchanged. Earlier workspace changes are preserved and are not part of this refinement.

## 2. Scroll sequence

Both panels begin with readable labels and faint underlying relationships. Scrolling constructs accent
lines in the existing schematic and then resolves the corresponding proposed-system band. No text
waits for motion to become readable. Goods, information, money and coordination remain the four layers.

The proposed-system panel is a responsibility assembly: the actual from/to relationships are grouped
into goods movement, orders/availability, payments/settlement and coordinated handovers. It is not a
second graph or stored model. Missing layers explicitly say they are not specified in the brief.

One normalized GSAP timeline is attached to the Architecture range with `scrub: true` and linear easing.
There is no timed playback. Forward, backward and fast scroll all derive the same state from position.
The drawing's baseline is always present, including while its accent line is incomplete.

## 3. The 12% lag

Foundation occupies progress 0–12%. For layer index `i` (0–3):

- Blueprint accent begins at `0.12 + i × 0.18`.
- The corresponding proposed-system band begins exactly `0.12` later.
- Each construction step lasts `0.17` of total scroll progress.
- The final coordinated system completes at 95%; the remaining 5% holds the completed board.

The right panel's line, subtle background resolution and 3 px settlement share that later interval.
Twin rules beneath each layer make the relationship visible: thin for blueprint, solid for system.
The lag is a spatial offset in the same scroll timeline, never a timer or delayed reaction to input.

## 4. Native sticky range

CSS `position: sticky` keeps the complete board beneath the existing toolbar. A normal-flow pseudo-element
supplies 125 viewport heights of bounded travel. ScrollTrigger measures the sequence height minus the
board height, so the timeline ends at the natural sticky release. There is no GSAP pin, spacer injection,
wheel interception, custom scroller or scroll listener added by this feature.

The explanatory responsibilities remain below the board, followed by the existing Economics scene.
The initial implementation used parent padding for the range; screenshot and position checks exposed
that the board left the viewport. Using normal-flow content corrected the sticky containing range.

## 5. Desktop and mobile

- At 901 px and wider, a viewport at least 900 px tall receives the sticky sequence.
- At 680–900 px wide, at least 980 px height is required, allowing space for the existing two-row toolbar.
- Shorter viewports receive a complete normal-flow two-panel board, avoiding inaccessible clipped content.
- Below 680 px, blueprint and proposed system stack in that order, without a sticky hold. The blueprint
  draws as it is read; each later system layer resolves on entering view. The fixed desktop 12% offset is
  deliberately simplified into physical reading order.
- At narrower widths the schematic uses legible role numbers with a full HTML participant key. Phones
  use 15 px relationship labels and retain the complete role responsibilities and four-layer narrative.
- Existing navigation and motion controls retain at least 44 px targets. No new controls were introduced.

The 768 px layout was tightened during visual review so the completed board, captions and layer rules
fit beneath the toolbar without clipping. Native page scrolling remains the only scroll surface.

## 6. Reduced and disabled motion

MyDay's existing preference and OS `prefers-reduced-motion` still decide whether Motion mounts. Without
it, both panels render complete: no partially drawn paths or transforms. The text schedule remains
visible at every size. The range stays stable on sufficiently tall screens, also when motion is disabled,
so toggling the session control does not move the reader to another part of the page.

Blocking the motion chunk and injecting a synthetic animation-setup failure are separately tested.
This is resilience to animation failure; the React application itself still requires JavaScript.

## 7. Pause and resume / cleanup

The existing Pause control unmounts Motion; `useGSAP` and `gsap.matchMedia` revert styles and triggers.
The reader receives the complete drawing without changing the scroll range or reading position.
Resume constructs the timeline from the current scroll position, not from the beginning.

Selectors are scoped to the Explore root and then the Architecture element. Match-media contexts clean
up on breakpoint changes, reduced motion, pause, unmount and route/project changes. A setup failure
reverts partial enhancements and clears the construction marker even if it interrupts the match-media
callback before that callback can register its normal cleanup. There is no new animation-control system or application RAF loop.

## 8. Accessibility

All role labels, from/to relationships, optional status and relationship descriptions come from existing
data. A full responsibility list and four explanatory layer sections remain readable HTML at every size.
The SVG also has a title and relationship description. Numbered labels and different baseline patterns
supplement layer colors. The drawn accents and progress rules carry no exclusive information.

The proposed-system list includes each relationship's description for assistive technology; the full
visible description is also in the reading below. Existing keyboard chapter navigation, return link and
motion controls are preserved. Automated checks measure the new panel text against WCAG AA contrast.

## 9. Performance

No additional media or dependencies. The existing Explore and Motion chunks remain lazy loaded. The
feature adds 14 text relationship entries at most plus four small SVG rules, using the existing bounded
schema. It reuses the original schematic paths rather than cloning another diagram or introducing a
renderer. Animation reads geometry at setup/refresh and writes SVG dash offsets, small transforms and
four restrained band colors during scroll.

| Build asset | Before (bytes) | After (bytes) | Gzip before → after |
|---|---:|---:|---:|
| Explore JS | 132,174 | 135,573 | 38,505 → 39,167 |
| Motion JS | 116,553 | 118,360 | 44,999 → 45,468 |
| Explore CSS | 24,336 | 28,200 | 5,943 → 6,637 |

Combined change: **9,070 bytes raw / 1,825 bytes gzip**. New image bytes: **0**. Gzip is measured locally at level 9. These are build
sizes, not a claim about frame rates on physical devices. Existing app/Cybersecurity chunk-size and AI
import warnings remain outside this change.

## 10. Validation

Production build and lint pass. The final five-suite Explore run passes **189 checks** with no failures:
55 Architecture, 46 core Explore, 20 content/economics, 28 asset and 40 visual/motion checks.
Across the required 20 app regression suites plus those five Explore suites, **25 suites / 1,659 unique
checks passed across the verification runs**. This was not one uninterrupted green run.

The initial broad run had browser disconnects/timeouts and intermittent failures around reloads in
Calendar, Patterns, Cybersecurity, Study, Workout and the cross-app suite. Fresh serial retries passed
without changing those app features or their assertions. The diagnostic retry only added rendered-page
logging if an assertion failed; it did not relax waits or assertions. The first focused visual run also
caught the sticky range and tablet fit defects described above. A stricter injected Architecture setup
failure then reproduced a stale construction marker; that cleanup was fixed and the full five-suite
Explore run repeated successfully.

Checks cover 1440×1000, 768×1000, 390×900 and 320×900; 1440×900 fit and shorter 1440/768×800 static
fallbacks; small forward steps, fast forward/back, 12% lag, absence of autoplay, sticky alignment/release,
refresh, history, repeated entry/exit, live project switching, stored-data identity, explicit task creation,
app motion off, OS reduced motion, pause/resume, blocked motion download and mid-setup animation failure.
Offline checks use a previously installed cache. The new text contrast assertions pass.

The required app suites cover storage compatibility, Today, Calendar/Pay, Finance, Inbox, Tasks,
Projects, Connect, Understand rules, Patterns, Cybersecurity, Study, Workout, Food, cross-app behavior,
website builds, installation and service-worker rules. No live account or AI provider was used.
All browser tests use synthetic projects and disposable profiles; the user's real localStorage is never
edited by the test harness.

Reproduce the focused verification with:

```sh
tests/run.sh app-architecture app-explore explore-rules explore-assets app-explore-visual
```

Per-suite results and build measurements are saved locally in `/tmp/myday-architecture-review/results.json`
and `performance.json`. Original failed and successful run logs are retained alongside them for audit.

## 11. Screenshots and visual review

Screenshots are local review artifacts, excluded from the application and offline cache:
`/tmp/myday-architecture-review/`.

- `architecture-1440-{0,25,50,75,100}.png`: full desktop sequence, including the final calm state.
- `architecture-768-{0,25,50,75,100}.png`: tablet sequence and viewport fit.
- `architecture-{390,320}-{beginning,middle,complete}.png`: stacked mobile reading order.
- `architecture-paused.png`, `architecture-reduced.png`, `architecture-app-motion-off.png`.
- `architecture-offline.png`, `architecture-no-animation.png`.

The images were inspected for panel balance, alignment, typography, construction progress, natural
release, mobile readability, contrast, clipping and overflow. Desktop thin/solid progress rules show
the left drawing ahead of the right assembly. The right panel remains textually readable throughout.
Mobile completion naturally continues into the responsibility schedule; it does not squeeze the full
architecture into one viewport. The initial sticky and tablet clipping defects were fixed and retested.

Example captures:

- [Desktop, 25%](/tmp/myday-architecture-review/architecture-1440-25.png)
- [Desktop, 75%](/tmp/myday-architecture-review/architecture-1440-75.png)
- [Desktop, complete](/tmp/myday-architecture-review/architecture-1440-100.png)
- [Tablet, complete](/tmp/myday-architecture-review/architecture-768-100.png)
- [Phone, blueprint](/tmp/myday-architecture-review/architecture-390-beginning.png)
- [Phone, system](/tmp/myday-architecture-review/architecture-390-middle.png)
- [Small phone, completion](/tmp/myday-architecture-review/architecture-320-complete.png)
- [Reduced motion](/tmp/myday-architecture-review/architecture-reduced.png)
- [Paused](/tmp/myday-architecture-review/architecture-paused.png)

## 12. Limits and visual decisions

- The two-panel treatment is confined to Architecture. It deliberately adds no AI, scores, research
  claims, simulation, 3D, editor or new scene types.
- Small screen height selects the complete unpinned board. On phones the conceptual delay is reading
  order, rather than an exact 12% two-panel timing. See the explicit thresholds above.
- The existing seven-node/fourteen-connection schema remains authoritative. This is not an arbitrary
  graph layout engine; radically different or dense architectures would need another visual review.
- Browser checks use Chromium desktop/device/media emulation. Physical phones, Safari, real screen-reader
  traversal and live Supabase were not tested in this refinement. No frame-rate claim is made.
- Offline refresh requires a previously cached release. A first uncached offline visit cannot load the app.
- Existing photography remains concept imagery with unknown reuse rights, as detailed below.
- Nothing was committed, pushed or deployed by this task. The local built preview is updated.

## Image/reference decision and provenance

> **Superseded on 10 October 2026:** these user-supplied references were replaced by openly licensed
> Wikimedia Commons photographs. See [Asset provenance in EXPLORE.md](EXPLORE.md#asset-provenance).

The supplied architectural annotation reference (`21704.jpg`) informed the thin rules, registration
language and relationship reading. It was not added to the page. The warehouse and logistics references
would compete with the diagram and could imply real facilities, so none was added. No image replacement
or external search was needed to improve this Architecture-only scene: the existing data-derived SVG
communicates its subject more clearly. No supplied image was deleted or altered in this refinement.

The four already-used assets in the other Explore scenes were retained unchanged:

| Asset | Supplied original | Dimensions | File bytes | Existing role |
|---|---|---:|---:|---|
| `street-reference.jpg` | `21703.jpg` | 736 × 920 | 153,884 | Hero reference |
| `market-reference.webp` | `21713.jpg` | 736 × 1102 | 214,970 | Context reference |
| `access-reference.webp` | `21712.jpg` | 736 × 1308 | 82,122 | Problem reference |
| `delivery-reference.webp` | `21714.jpg` | 736 × 1308 | 69,980 | Delivery handover reference |

Source: user-supplied files in `/Users/nrt/Documents/Cyber security /myday/images/attachments/`.
Creator, original source URLs and reuse licenses were not supplied. The existing asset catalogue records
“User-supplied reference; reuse licence not established”, unverified location and appropriate captions/alt
text. No photograph is asserted to document Hargeisa. The market watermark remains intact.

All four remain unsuitable as cleared public-release assets until reuse rights are confirmed. Their
736 px width also limits sharpness when enlarged, especially the full-width Hero on high-density displays.
The other supplied images remain unused references; this task does not establish publication rights for
any of them. Replacements in a later image-specific task should improve authenticity/resolution and have
clear rights, without changing the Architecture drawing.

## Follow-up verification — 8 October 2026

The final Explore run passes **224 checks**: Architecture 90, core Explore 46, content/economics 20,
assets 28 and visual/motion 40. Production build, lint and whitespace checks pass. The 20 required
application suites also pass across the broad run and focused retries: **25 suites / 1,694 unique
passing checks** in total. This was not one uninterrupted green run.

The original reproduction failed 11 assertions. During refinement, completion-position checks exposed
timing that needed adjustment on the narrow layouts. The final SVG-based trigger finishes while the
drawing is still visible. The broader run also had a Study browser disconnect and a reload-related
damaged-section notification failure. Fresh serial retries passed (Study 178; cross-app 74), without
changing those features or their assertions. The final runner reported a temporary-profile cleanup
warning after all checks passed; it did not affect assertion results or user data.

Coverage includes 1440/768 px dual panels, short 800 px windows, 662 × 827, 390 × 900 and 320 × 900
stacked layouts; visible drawing progress and width; correct dash distance after resizing; narrow
Context/Flow connectors; pause cleanup; reduced/app-disabled motion; failed animation download/setup;
navigation; project changes; preserved storage; and previously cached offline refresh.

The real local preview was reloaded and visually checked at 946 × 826 and 662 × 827. Scroll input visibly
constructed the diagram; no browser errors were logged. Temporary viewport overrides were reset.
Screenshots: `/tmp/myday-motion-fix/desktop-scroll.png` and `narrow-scroll.png`. Logs, aggregated results
and size measurements are in `/tmp/myday-motion-fix/`.

The final Motion chunk is 119,289 bytes raw / 45,722 gzip; Explore CSS is 28,459 / 6,714. Compared with
the original dual-panel build, all Explore assets together add 1,188 bytes raw / 329 gzip. There are no
new image bytes or dependencies. Twelve protected source/dependency files still match the earlier
baseline, including routing, storage, scene schema, curated data, economics and project entry behavior.

Physical phones and Safari remain untested. Nothing was committed, pushed or deployed. The local
preview is updated. A useful next design phase would tighten repeated explanations and make individual
relationships easier to inspect; the current work establishes reliable, visible motion first.
