# MyDay Arabic Fuṣḥā package

Version 1.1.1 · 11 October 2026 · `course.arabic-fusha`

The target is Modern Standard Arabic (MSA). The common core has 24 modules; six optional modules extend it into academic/professional communication, literature, classical prose, Qur’anic language study, translation and technology communication.

## Open these first

- **Output A:** `MyDay_Arabic_Fusha_Curriculum.html` is an offline reader with module navigation. Use the browser’s Find command for a lesson or topic. The complete content is also in `MyDay_Arabic_Fusha_Curriculum.md`.
- **Output B:** `MyDay_Arabic_Fusha_Curriculum.json` is the canonical static course.
- `MyDay_Arabic_Adaptive_Tutor_Spec.json` is a separate proposed adaptive policy and learner-state contract. No AI provider or model is required.
- `MyDay_Arabic_Assessment_Keys.json` contains reference answers. Keep these behind the intended reveal/authorisation boundary when building the application.

## What is included

30 modules; 89 topics; 152 lessons and primary skills; 304 exercises; 60 language practice labs; 182 assessments; 18 projects; 11 prerequisite-closed paths; 19 researched resource pointers; 16 original starter assets and 48 vocabulary seed records.

Every module includes its purpose, prerequisites, level, time budget, objectives, topics, practical work, labs, projects, assessment, common mistakes, progression understanding and exit capabilities. Every lesson includes its ID, parent module/topic, difficulty, duration, prerequisites, objectives, concepts, practical task, two knowledge questions plus an Arabic application question in 121 lessons, mini challenge, resource types and completion criteria.

The learning sequence and original starter material are usable independently of any one external course. Later language development needs varied suitable texts, recordings and conversation; the starter bank is intentionally not represented as the entire lesson-content library.

**No audio files are included.** Texts and recording specifications are not audio. Use verified resource recordings or a competent MSA speaker. Do not award listening or pronunciation mastery from text-only work.

## Start learning

1. Open the orientation module and set a concrete goal: for example, reading modern Arabic and discussing familiar topics in Fuṣḥā.
2. Attempt brief separate baselines for script, meaning, listening, speaking and writing. Leave unavailable evidence unknown.
3. Begin the script and sound modules together, using short sessions. Greetings and meaningful chunks can be spoken before all letters are mastered.
4. Keep a small dated record of attempts, corrections and help used. Choose a short revision task on low-energy days.
5. Progress using the actual skill dependencies. If you already demonstrate a skill on a fresh task, skip its introduction and retain a delayed check.

A useful 30-minute session is five minutes of retrieval, fifteen of one main task, seven of output/transfer and three to record what to revisit. Do not force an entire module or a new vocabulary quota into every day.

## Planning estimates

The cumulative design budgets, including repeated practice and ordinary revision, are 36–54 hours for foundations, 146–214 through the A1 target, 276–404 through A2, 516–752 through B1 and 791–1,152 through the B2-target core. These are original curriculum budgets, not official CEFR hour requirements or guaranteed completion times.

At five 60-minute study days per week, the core budget is roughly three to four-and-a-half years before allowing for breaks. Useful abilities are developed and assessed at earlier milestones. A lesson’s first encounter is much shorter than the total practice needed to retain its skill.

## Validate before import

Python 3 with its standard library is sufficient:

```bash
python3 validate_arabic_curriculum.py
```

Or provide the extracted folder:

```bash
python3 validate_arabic_curriculum.py /absolute/path/to/package
```

The command writes `MyDay_Arabic_Validation_Report.json` and exits non-zero on failure. It checks the structural schema subset used here, IDs, references, lesson fields, graph ordering/cycles, branch closure, project prerequisites, hour arithmetic, rubrics, answer keys, text integrity and policy separation. The full schema can also be used with a standard JSON Schema draft-2020-12 validator.

Structural checks do not independently proofread Arabic or verify every external media player. Original examples have been checked during authoring but have not had an independent Arabic-teacher review. Review language content and calibrate assessment rubrics before relying on automated high-confidence mastery claims.

## Database import and relationships

Treat `package_type: myday.language-curriculum` and `schema_version` as the format identifier. It is a language extension, not an assertion of drop-in compatibility with an existing MyDay database.

1. Parse and validate the package without altering live learner data.
2. Upsert course, modules, topics, skills, lessons, exercises, labs, assessments, projects, resources, assets, vocabulary seeds and milestones using their stable IDs.
3. Store relationship arrays as join records or validated JSON fields as appropriate to the existing data model.
4. Preserve the skill prerequisite graph. `all` means all listed skills; `any` is reserved for explicitly authored alternatives and is empty in this version.
5. Import path membership and project relationships. Shared project time has one owner module to avoid double counting.
6. Store answer keys separately from the learner-facing question response, with application-level access/reveal controls.
7. Create learner progress/evidence tables separately using the adaptive specification. Do not write learner scores into the static course.
8. Retain `curriculum_version` on every attempt. Update or migrate content explicitly without resetting learner history.

`MyDay_Arabic_Starter_Materials.json` is a subset export of `assets` and `lexicon_seed` from the main file. Its IDs are identical. Import it as a convenience only; do not create duplicates.

The package uses `*.arabic-*` entity IDs so it can coexist with other MyDay courses. The scalar `stage_target` is an approximate design label. It is not a certified learner level or a conversion to ACTFL/ILR.

## Adaptive behaviour

The static package describes content and evidence requirements. The separate policy proposes daily selection, support fading, retrieval intervals, workload adjustment and a 0–100 evidence model. The model weights understanding, recall, practical performance and transfer; caps prevent reading or one rehearsed task from establishing mastery. Historical evidence and estimated current readiness remain separate.

The policy is not executable AI integration. Its thresholds, freshness estimates and review intervals are configurable heuristics that need piloting. Validate any model-selected IDs before accepting them and never infer a speaking score from typed text or an audio score from a visible transcript.

## Arabic display and scoring

- Store logical Unicode order in UTF-8. Use `lang="ar"` and `dir="rtl"` for Arabic text, with appropriate isolation for Latin strings and numbers.
- Do not reverse text manually or replace distinct Arabic letters to simplify scoring.
- Declare whether optional diacritics matter for a task. Do not treat absence of vowel marks in ordinary prose as a universal error.
- Preserve hamza, ة/ه and ى/ي distinctions when testing spelling.
- Preserve Qur’anic source text exactly; keep pedagogical displays and commentary separate.
- Label fully inflected reading, ordinary pausal MSA and Qur’anic recitation as different task conditions.
- Record audio, transcript exposure, hints, playback speed and reviewer confidence honestly.

## Resources and rights

Nineteen primary-source resources were checked on 10 October 2026, using direct page retrieval or indexed primary-source results where direct access failed. The catalogue states these differences. The catalogue distinguishes official documentation, structured courses, practical resources, references and enrichment. It also records mixed-register materials, legacy media and paid-access possibilities. Prices, account flows and every audio file were not verified.

External resources are optional and replaceable. Link to external texts/media unless their specific licence permits copying into MyDay. The package does not include copied course chapters, commercial audio or external examination materials.

## Regenerate the reader

After editing the canonical JSON, run `python3 authoring/render_curriculum.py`. The architecture introduction is in `authoring/architecture.md`. Recheck reported counts if the scope changes, then run the validator.

## Scope of this delivery

This is a curriculum, content seed, assessment specification and import package. It is versioned in the MyDay repository under `content/arabic-fusha`. Application integration is pending; the package does not include a deployed adaptive tutor, audio library or accredited proficiency test. None of the optional branches is required merely to demonstrate the common core.

## Version 1.1.1 correction

Restores the sukūn on the definite article's lām before a moon letter in six fully vowelled beginner examples (Pre-A1 and A1 lessons), so they match the starter texts and words: الْعَرَبِيَّةُ الْفُصْحَى, أَدْرُسُ الْعَرَبِيَّةَ (two lessons), صَبَاحُ الْخَيْرِ, أَيْنَ الْبَيْتُ؟ and أَنَا فِي الْبَيْتِ. B1 and later examples keep their selective vowelling, as the support-fading policy intends. No ID, question, answer or meaning changes; attempts recorded under 1.1.0 keep that version.

## Version 1.1.0 review

Adds 121 Arabic application checks, producing 425 lesson questions plus 42 starter-text questions. Existing skill, lesson and question IDs retain their meanings. Existing learner completions must remain associated with their original curriculum version. The resource catalogue adds an MSA beginner course, a beginner dictionary and university practice materials. The review also labels a multi-feature sound contrast correctly and strengthens text-versus-audio evidence handling.

The validator also checks the order in the human reader, not just the database graph. This review corrected two forward-prerequisite display errors and aligned a third topic grouping with its intended lesson sequence. Freshness states are explicitly defined, including what happens when all current evidence is older than the scoring window.
