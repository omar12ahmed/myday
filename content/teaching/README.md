# MyDay lesson teaching

Start with the [cybersecurity lessons](cybersecurity-lessons.md) or [Arabic Fuṣḥā lessons](arabic-fusha-lessons.md). The same explanations and assignments appear directly in MyDay's lesson screens, above the existing practical tasks.

Arabic pages also include a remembered Show / Hide transliteration choice and an expandable pronunciation key. See [Arabic pronunciation support](pronunciation/README.md) for coverage, reading conventions and sources.

This companion adds original teaching to all 146 cybersecurity and 152 Arabic lessons: an explanation, worked example, guided exercise, explained answer and specific resource assignments. There are 168 distinct assigned resources, including 15 cybersecurity video/course pages and 13 Arabic video/audio lesson pages. The resources include official documentation, named lectures, grammar lessons, narrated texts, dictionaries and primary literary texts. A repeated reference has a task-specific instruction, rather than being assigned as an undirected course homepage.

Use the short explanation and exercise as the minimum session. Continue with the first assigned resource, then the course's existing practical task and later review. Full lectures, chapters and optional references may need several sessions; these additions do not promise that every resource fits the original lesson estimate.

The original course IDs, assessment keys, progress records and rubrics retain their meaning. The companion is versioned separately as 1.0.0. Reading or revealing an answer does not automatically mark a lesson complete or award mastery. The new explained answers are self-study content, not a secure examination boundary.

## Sources and access

The [source audit](source-audit.json) records the destinations reviewed on 16 October 2026. Pages and relevant topics were retrieved; media players were identified but playback was not tested. External resources open at their original providers. Optional paid certificates, tutoring and subscriptions are not assigned. Provider labs or courses may require registration. Videos may depend on provider availability, region or browser support.

Arabic listening tasks explicitly separate unaided listening from transcript-supported reading. A transcript is a useful fallback reading task, not a substitute for listening evidence. The core target remains MSA; classical, Qur'anic and literary work are labelled optional extensions. The Doha dictionary is a historical lookup tool, so sense and date must be checked before using an entry for modern production. The poem link is a community transcription of the primary text and should be checked against an edition for close textual work. External references can contain errors; compare their explanations with context and record unresolved discrepancies.

No external textbook, transcript or video has been copied into the package. The teaching and small practice examples are original; longer works are linked to their providers. Cybersecurity tasks use synthetic evidence, owned disposable environments or assigned training instances.

## Authoring and validation

Edit `authoring/cybersecurity.txt`, `authoring/arabic-fusha.txt` and `authoring/sources.tsv`. Each teaching row has six fields separated by ` | `: lesson ID without `lesson.`, explanation, worked example, guided practice, explained solution, assignments. An assignment is `source-id~instruction`; separate assignments with a semicolon immediately followed by the next `source-id~`. Ordinary semicolons in prose are retained.

From the repository root:

```bash
node app/scripts/prepare-teaching.mjs
node app/scripts/prepare-teaching.mjs --check
```

The generator rejects missing/unknown/duplicate lessons, duplicate explanations, unfinished fields, unpaired code markers, unknown assignments, unsafe URLs and missing/stale source-audit entries. It generates the two JSON companions, Markdown readers and [coverage report](coverage.json). `npm run build` in `app/` runs this validation automatically. Validation checks structure and coverage; it does not certify every explanation, external media playback or proficiency outcomes.

The app imports each course's teaching only on opening a lesson. The shared component renders mixed Arabic/English safely as text, keeps answers hidden until requested, resets the reveal on lesson navigation, and handles a failed content load without removing the existing practical activities.

For browser regression checks after installing app dependencies:

```bash
bash tests/run.sh app-teaching app-arabic app-cybersecurity
```
