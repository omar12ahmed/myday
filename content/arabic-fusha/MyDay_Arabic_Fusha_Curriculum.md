# MyDay Arabic Fuṣḥā curriculum

Version 1.1.1 · researched 10 October 2026, corrected 11 October 2026 · course ID `course.arabic-fusha`

This is a complete curriculum specification for a beginner learning Modern Standard Arabic, with optional specialist extensions. It is designed to support months or years of study in MyDay. It is not a claim that a short list of lessons, a vocabulary streak or a completed textbook produces fluency. The package defines what to learn, how to practise and what evidence would demonstrate progress. An adaptive tutor can choose the next task without changing those underlying outcomes.

## 1. Architecture before content

The learner-facing hierarchy is **Course → Module → Topic → Lesson → Exercise → Assessment → Project**. Skills form a second, cross-cutting graph: a lesson teaches a skill; tasks produce evidence for that skill; prerequisites connect it to earlier skills. Projects combine several skills. A resource is a replaceable way of obtaining input or an explanation, never the definition of the skill itself.

The static course contains 30 modules, 89 topics, 152 lessons and primary skill records, 304 exercises, 60 language practice labs, 182 assessments, 18 projects and 11 paths. Twenty-four modules form the common core. Six are optional specialisms. The 182 assessments comprise 152 lesson knowledge checks and 30 module performance assessments, including four stage checkpoints. These counts describe the package, not a quota that must be completed despite already demonstrated knowledge.

The content model has four layers:

- **Curriculum:** stable IDs, outcomes, prerequisite skills, examples, task specifications, rubrics, projects and verified resource pointers.
- **Assessment keys:** static reference answers, stored separately so an application can reveal them at the appropriate time.
- **Learner evidence:** dated attempts, modality, source, support, prompt novelty, reviewer and observed performance. This belongs in learner-specific records, outside the curriculum.
- **Adaptive policy:** how to select a daily workload, interpret evidence, estimate mastery, schedule review and adjust explanations. The policy has its own version and no dependency on a particular AI model.

IDs use an Arabic namespace, such as `module.arabic-script`, `lesson.arabic-vowel-decoding` and `skill.arabic-vowel-decoding`. This avoids collisions with the cybersecurity package in the same application. IDs describe durable outcomes and must not be reassigned to different meanings. A lesson's reading state and a skill's mastery state are different records.

The JSON is a standalone language-curriculum format with an accompanying schema. It is suitable for importing into a database, but it is not an assertion that the existing MyDay application already supports every language-learning field. An importer or adapter must preserve the relationships and learner evidence. The package is versioned under `content/arabic-fusha`; application integration and deployment are separate work.

## 2. What “Fuṣḥā” means here

The core target is **العربية الفصحى المعاصرة — Modern Standard Arabic (MSA)**: the formal Arabic used in education, much writing, news and many public contexts. Fuṣḥā is also used more broadly for the classical written tradition. Those goals overlap, but they are not identical. The core therefore builds modern language competence; a later bridge introduces historical vocabulary, textual conventions and classical analysis. Qur’anic language study is another optional branch, with recitation and interpretation clearly distinguished.

Regional dialects remain important in daily life. A person can become a strong MSA reader and formal speaker without automatically understanding every family conversation, film or street interaction. The course includes awareness of this reality, but does not require dialect mastery. Everyday transactions are explicitly **MSA learning simulations**, not a promise that every real shop interaction will sound like the exercise. QFI discusses the relationship between Fuṣḥā and regional varieties in Arabic education [resource.arabic-qfi].

Pronunciation aims at intelligibility and meaning-bearing distinctions. It does not require erasing the learner's accent. Ordinary MSA speaking, fully inflected grammatical reading and Qur’anic recitation have different expectations. The task states its convention before endings are assessed. Learners first notice endings and their functions, then use targeted analysis; they do not need perfect case-ending production before beginning communication.

No prior Arabic is assumed. If you already read Qur’anic script, speak a dialect or know some words, placement checks identify which skills transfer. Reading aloud, reciting from memory, understanding a fresh sentence and responding spontaneously must be checked separately.

## 3. Why the sequence is organised this way

**Sound and meaning begin immediately.** Script lessons and sound lessons can be interleaved after orientation; the numbering is a navigable default. Early oral greetings use models before all letter work is finished. Full written lessons require the relevant decoding skills, but the learner does not wait for perfect handwriting before listening or speaking.

**Useful sentences precede comprehensive grammar tables.** Introductions, description, possession, routine and practical questions establish reasons to use grammar. The past, future and negation then support stories and plans. Morphology and dictionary skills follow enough meaningful vocabulary to make roots and patterns useful. The wider verb system, clause relationships and formal precision are added progressively.

**Reading support fades gradually.** Early material uses full or targeted vowel marks and clear print. The learner then moves through selectively marked texts to ordinary unvowelled prose. A difficult word can regain support without restarting the entire module. Transliteration is an optional temporary cue, not the permanent reading channel. W3C's Arabic layout material is used as an implementation reference, not a language course [resource.arabic-w3c].

**Four skills develop throughout.** Modules that focus on reading or writing do not suspend listening and speaking. Their distributed practice includes an appropriate balance of input, output, attention to form and reuse of familiar language. This design is informed by Nation's four-strands framework; the exact weekly allocation is a configurable choice, not a scientifically established formula for this learner [resource.arabic-nation].

**Review is recurrent, not duplicated content.** Each major concept has an introduction point. Later lessons extend its scope or use it in a harder task. For example, possession starts with `كتاب الطالب`, later gains pronoun attachment and longer noun chains, then becomes part of reference analysis in real texts. Those are successive uses of one skill family, not three unrelated beginner units.

**Performance comes before progression claims.** The CEFR provides a framework for describing different kinds of language activity. This curriculum uses its level labels as approximate targets, with original task specifications. It is not formally calibrated or endorsed. ACTFL's OPI illustrates the importance of spontaneous speaking and lists MSA among its languages; its rating does not automatically cover reading or writing. No numerical conversion among MyDay mastery, CEFR, ACTFL and ILR is assumed [resource.arabic-cefr; resource.arabic-actfl-opi].

## 4. Core progression and optional branches

The common core progresses through five broad phases:

1. **Foundations, modules 1–3:** goals, tools, script, vowel marks, sound contrasts, connected speech and pausal awareness.
2. **A1 target, modules 4–8:** introductions, noun phrases, present actions, everyday tasks and a first integrated checkpoint.
3. **A2 target, modules 9–13:** past stories, plans and negation, relationships and case awareness, morphology, dictionary use and connected practical communication.
4. **B1 target, modules 14–19:** a wider verb system, complex clauses, unvowelled reading, longer listening, responsive conversation and connected writing.
5. **B2 target, modules 20–24:** news, argument, precision grammar, extended speaking and writing, and a portfolio built from fresh tasks.

The core can lead to useful intermediate ability well before its final module. A learner may pause at an earlier milestone and consolidate it for personal goals. Finishing the common core is not required before exploring every specialism:

- **Technology communication:** opens after B1-target prerequisites. It connects Arabic with technology interests, without pretending language exercises certify cybersecurity expertise.
- **Literature:** opens after B1 plus the relevant argument/interpretation skills. Selected texts can be approached slowly with support; not all famous works suit the same reading level.
- **Classical prose:** opens after B1 plus the grammar-precision module and ambiguity/lookup skills. The complete media and presentation sequence is not a prerequisite.
- **Qur’anic language study:** follows the classical bridge. It is optional, and does not certify tajwīd, religious expertise or independent exegesis.
- **Translation and mediation:** follows the core B2-target evidence and requires adequate competence in the other working language. Professional specialist translation needs further training.
- **Academic and professional Arabic:** follows the core and works toward advanced/C1-type tasks in a chosen domain. One branch or polished report cannot establish broad C1 proficiency.

The JSON paths include the complete prerequisite closure for their modules. A skill-level diagnostic may shorten the recommended module route. No learner needs all six branches to achieve a substantial Fuṣḥā goal.

## 5. Workload and a realistic time horizon

All time estimates are **design budgets**, not measured predictions about your learning speed. They include lesson introductions, tasks, language labs, assessment, the allocated share of projects, regular reading/listening, productive practice and ordinary spaced revision. Do not add lesson exercise durations or shared project durations a second time. Extra repetition, difficulty obtaining feedback or long interruptions can extend the total; relevant prior knowledge can reduce it.

The cumulative core budgets are:

- Script and sound foundations: **36–54 hours**.
- A1-target route, including foundations: **146–214 hours**.
- A2-target route, from zero: **276–404 hours**.
- B1-target route, from zero: **516–752 hours**.
- B2-target common core, from zero: **791–1,152 hours**.

At five study days a week for 52 weeks, 30 minutes a day provides 130 hours a year; 60 minutes provides 260; 90 minutes provides 390. On that deliberately simple arithmetic, the B2 core represents roughly **6.1–8.9 years at 30 minutes**, **3.0–4.4 years at 60 minutes**, or **2.0–3.0 years at 90 minutes**. Real schedules contain breaks, and time alone does not award a level. Useful early communication and reading develop along the way; there is no need to wait for B2 to benefit.

An individual lesson's 20–60-minute standard duration is its **first structured encounter**, including its small task and checks. It is not the total time needed to make that skill automatic. The substantial distributed-practice budget is intentional: language develops through many different encounters and attempts. A module covering verb patterns is spread over repeated sessions, not presented as “learn every form in an hour.”

For a typical 30-minute day, use five minutes of retrieval, fifteen minutes on one main task, seven minutes of output or transfer and three minutes to record the next step. A ten-minute day still supports a small useful unit. A 90-minute day includes a break and can deepen one task rather than introducing excessive new vocabulary. The adaptive specification supplies examples, not compulsory timetables.

## 6. Practical work and original materials

Every lesson has a specific task, two knowledge-check questions (with an additional Arabic application check in 121 lessons), a changed-prompt mini challenge and observable completion criteria. Every module adds two cumulative language practice labs and a performance assessment. These labs are deliberate practice sessions, such as an information-gap conversation, a listening reconstruction or an editing workshop.

The package includes **16 original starter assets**: fourteen short texts/dialogues, a fictional timetable and a sound-contrast recording specification. It also includes **48 starter vocabulary records**. These are a usable seed, not the complete reading or vocabulary content for 152 lessons. Each lesson defines the input and task needed; later work deliberately requires varied texts, voices, topics and partners. There is no universal word-count threshold that certifies a CEFR level.

**There are no bundled audio recordings.** A written dialogue is not a listening activity until it is spoken or recorded competently. Use suitable verified recordings from the resource catalogue, a competent MSA speaker, or commissioned/reviewed recordings of the original scripts. If synthetic speech is used, verify the actual output and label it. If audio is unavailable today, practise another skill and leave listening untested; do not award listening credit for reading a transcript.

For each new listening input, first attempt the meaning without text, then replay for details, then use the transcript to diagnose gaps. Replays, speed and transcript exposure belong in the evidence record. For speaking, a private recording or competent listener's observation is useful. A speech recogniser can be a clue, but is not a validated pronunciation examiner.

For output, keep the original attempt and the later assisted revision. A polished AI rewrite may be a helpful model; it is not evidence that the learner could have written it independently. Ask the learner to explain a few changes and perform a fresh task later.

## 7. Assessment and mastery from 0–100

The mastery unit is a **defined skill in an observed modality**. Reading, listening, speaking and writing remain separate. A learner can have strong written recognition of a word and weak spoken retrieval. Grammar explanations can be given in English when the goal is conceptual understanding; the actual Arabic performance task still needs Arabic evidence.

- **0–20:** little demonstrated control; perhaps recognises a model but cannot reliably retrieve or use it.
- **21–40:** emerging understanding with substantial support.
- **41–60:** can perform familiar controlled tasks, but transfer is inconsistent.
- **61–80:** increasingly independent and reliable within the defined task scope; some support or review remains.
- **81–100:** repeated independent success, retained after delay and demonstrated on varied fresh inputs or contexts. This is mastery of the named skill, not all of Arabic.

Untested is stored as **unknown/null**, not as a failed score. Reading a lesson, watching a video or maintaining a streak does not create performance evidence.

The proposed score combines understanding (15%), recall (20%), practical performance (45%) and transfer assessment (20%). Each dimension uses the latest three distinct eligible attempts, with more weight on recent evidence. Support reduces the credit used for an independence estimate. Missing dimensions remain visibly unknown and contribute no unsupported points. The exact algorithm and caps are in the separate adaptive JSON.

Caps prevent misleading scores: no independent recall caps the estimate at 20; no independent practical evidence caps it at 40; no fresh transfer caps it at 60; success on fewer than two dates caps it at 70; missing delayed and varied evidence caps it at 80. Above 80 requires at least three independent practical attempts, two fresh transfer attempts, suitable variation, scores of at least 80 on the relevant performance/transfer samples, and delayed success at least seven days later. Pronunciation-sensitive claims require credible audible feedback, not text-only inference.

A skill that requires several modalities uses the weakest required current score for independent prerequisite readiness. The dashboard still displays the separate profile. A strong reading result cannot silently fill an unknown listening result. A learner can preview more advanced material with support; the tutor simply must not describe unsupported prerequisites as mastered.

**Time since practice affects readiness, not the historical record.** The policy keeps the demonstrated score and separately applies a small bounded readiness discount once evidence becomes old. Proposed retention windows are 14 days for new skills, 30 for developing skills and 60 for stable skills. The decay formula is a scheduling heuristic, not a measurement of exactly how much was forgotten. A fresh successful attempt updates the relevant skill; opening a page does not.

For ordinary independent progression the starting policy asks for a current score of at least 70 and relevant independent evidence within 60 days. If evidence is stale, use a short refresh check rather than repeating the whole course. These numbers need piloting and calibration against qualified Arabic-teacher feedback. They are not validated psychometric thresholds.

The common practical rubric gives 40% to task success, 25% to control of the targeted feature, 20% to meaning/intelligibility and 15% to self-correction and honest evidence. Module assessments normally ask for 75 overall and at least 60 in each required observed modality. Stage checkpoints ask for 80 overall and at least 70 in each required modality, plus fresh and delayed evidence. Rubrics describe what to observe; a qualified judgement may still be needed for open speech or writing.

## 8. Adaptation without rewriting the curriculum

The future tutor reads the graph, chosen path, prior evidence, available time and current energy. It may select a new lesson, a targeted repair, a review or a project step. It should state the reason in ordinary language: “Your listening on negation needs a fresh check before this story task,” or “You have already demonstrated this script skill, so we will move to meaning.”

Each lesson has short, standard, extended, revision and practical variants. A short variant records partial work. A revision attempt scores only what was actually observed. An extended task changes the input, speaker or audience, rather than simply adding pages. Prior mastery can skip instruction after a fresh diagnostic, while preserving future review.

Suggested initial review intervals are 1, 3, 7, 14, 30 and 60 days after successful work. They can shorten after retrieval difficulty or lengthen after retained transfer. Research supports spacing and retrieval broadly; it does not establish these exact intervals for every Arabic learner [resource.arabic-ies]. The tutor must manage overdue workload rather than turning missed days into an overwhelming backlog.

If a learner struggles, first identify the type of problem: sound discrimination, letter decoding, missing vocabulary, grammatical relationship, memory or excessive task length. Offer a smaller contrast, a shorter text or selected vowel support. After repeated difficulty, revisit the specific prerequisite. Do not assume every mistake means “study more grammar.”

The first vocabulary intake suggestion is three to eight useful new items on a study day, adjusted to retention and workload; zero new words is appropriate on a review day. Store useful senses, examples, plurals or past–present pairs and collocations. Do not count every inflection as an unrelated new word or award a proficiency level for deck size.

The learner owns the pace and goal. The app can support larger script, brief sessions, quiet written work, audio repetition and alternative input methods. When an accommodation changes the skill actually being assessed, label the change instead of fabricating an equivalent score.

## 9. Resource strategy and web findings

Use one main source at a time for a given outcome. The curriculum remains the organising structure; there is no requirement to complete several overlapping external courses.

- **King Saud University's Interactive Arabic** explicitly describes contemporary MSA and assumes prior alphabet/sound knowledge. It is positioned after the script foundations. Its public description says access is free after registration; the current account and media flow was not tested [resource.arabic-ksu].
- **Al Jazeera Learning Arabic** provides level-labelled courses and material for varied stages. Actual difficulty and register must still be checked for the individual learner [resource.arabic-aljazeera].
- **Georgetown's Alif Baa and Al-Kitaab** are optional structured supports. The publisher describes an integrated formal/colloquial approach, so a Fuṣḥā-only path must select the appropriate strand [resource.arabic-alifbaa; resource.arabic-alkitaab].
- **Ryding's reference grammar** supports focused grammatical questions and dictionary methods. It is a reference, not a beginner reading assignment from cover to cover [resource.arabic-ryding].
- **DLI GLOSS** has an explicit Arabic-MSA selection distinct from dialect options. It is useful for screened later reading/listening tasks, not automatic CEFR placement [resource.arabic-gloss].
- **Qabas** supports lexical verification; it includes material beyond MSA and is not a simple beginner bilingual course [resource.arabic-qabas].
- **The Hindawi about URL currently redirects to Safahat.** The current destination was checked, and the package uses it. Select suitable texts and verify the licence before copying anything into an app [resource.arabic-hindawi].
- **Aswaat Arabiyya** is optional because it is a legacy archive and some intermediate selections are colloquial and some advanced selections mix registers. The descriptive page was verified; playback was not [resource.arabic-aswaat].
- **Quranic Arabic Corpus** is a specialist linguistic aid for the optional branch, with annotations kept distinct from interpretive authority [resource.arabic-quran-corpus].


- **Mastering Arabic 1 (fourth edition)** offers a beginner MSA course with script and publisher-linked audio/video. It is an optional main source, not an additional syllabus to complete in parallel with every other book [resource.arabic-mastering].
- **Oxford Essential Arabic Dictionary** offers alphabetically ordered, vowelled MSA headwords for early bilingual lookup [resource.arabic-oxford-dictionary].
- **LangMedia Arabic** adds university grammar and dictation resources. Its wider collection also includes dialects, so select MSA items and check playback before assigning them [resource.arabic-langmedia].

The full catalogue records official documentation, structured courses, practice resources, references and optional enrichment separately. The catalogue contains 19 primary-source resources checked on 10 October 2026. Most pages were retrieved directly; QFI and Nation were corroborated through indexed primary-source results after direct retrieval failed. This does not mean every enrolment flow, price, audio clip or exercise was tested. No external lesson text, paid course or audio library has been copied into this package.

## 10. MyDay implementation contract

Import the canonical curriculum transactionally. Validate its schema and references first. Upsert stable entity IDs, then relationships; associate attempts with the curriculum version used. Preserve learner evidence when content changes. The starter-materials file is an export subset of the same asset and lexicon IDs, not another set of records to insert as duplicates.

The learner-state schema is separate: goals, learning events, per-skill/per-modality state, lesson attempts, lexeme state, project submissions and daily assignments. Keep dates, prompts, assistance and reviewer provenance. Store generated explanations and assignments as runtime data; do not rewrite authored lessons or prerequisites silently.

Store Arabic in logical Unicode order. Apply `lang="ar"` and `dir="rtl"` to Arabic runs, while isolating English labels, code and numbers appropriately. Preserve hamza, tāʾ marbūṭa and alif maqṣūra distinctions. Ignore optional vowel marks only where the task's comparison mode allows it. An orthography assessment should not normalise away the very error being tested. Preserve Qur’anic source text unchanged and label any separate teaching display.

Serve assessment answers after submission or to the tutor. A separate file is an organisational boundary, not security if both files are shipped publicly. Do not put provider credentials in the curriculum. Recordings and portfolios should be private by default, with consent for third-party voices and external processing.

An adaptive model may propose activity IDs and explanations. The application must validate IDs, time budgets and evidence updates before changing state. A model's confidence is not a learner's performance. The supplied policy includes acceptance scenarios for missing audio, high reading/low listening, stale evidence, prior mastery and hallucinated IDs.

## 11. Quality review and limitations

The package checks the complete prerequisite graph for cycles and forward references, every entity relationship, branch prerequisite closure, project prerequisites, time sums, rubric weights, lesson fields, adaptation variants, answer-key links and separation of static content from learner policy. It also checks for corrupted text and hidden bidirectional control characters. The included validation report records the results and file hashes.

Pedagogical review addressed these common omissions: sound-length contrasts; joining and vowel marks; meaningful comprehension separate from decoding; early interaction repair; non-human plural agreement; iḍāfa; weak and derived verbs; case versus mood; unvowelled ambiguity; selective dictionary use; register; authentic input; writing revision; source attribution; delayed transfer; and optional specialist pathways. Repeated concepts have an introduction followed by progressively harder use.

Arabic examples and starter texts are original teaching material and have been checked during authoring. **They have not yet had an independent Arabic-teacher review.** Before using the package as a high-confidence automated assessment product, have a qualified MSA teacher review examples, pronunciation models, task-level placement and scoring. An automated structural pass cannot certify linguistic correctness or learner proficiency. The policy itself should also be piloted; the package does not claim that an adaptive tutor has already been implemented.

The review added 121 concrete Arabic application checks without replacing existing question IDs, clarified the هَلْ / حَلّ multi-feature sound contrast, and refreshed the resource catalogue. Written checks remain separate from audible performance evidence. Two topic-grouping errors were corrected so the visible lesson order now places questions before origin/location and case roles before longer iḍāfa chains.

The following module catalogue is the complete human-readable Output A. The JSON, schema, separate keys and adaptive specification form Output B and its supporting files.

---

## 12. Complete module catalogue

<a id="module.arabic-learning-start"></a>

### Module 01 — Orientation, placement and learning habits

**ID:** `module.arabic-learning-start` · **Path:** core · **Target:** Pre-A1 · **Difficulty:** 1/6

**Purpose:** Establish goals and separate script familiarity, comprehension and communicative ability.

**Entry prerequisites:** None.

**Other skills used by particular lessons:** None.

**Before entry:** No Arabic is assumed; English explanations and oral-only tasks are available.

**Estimated study time:** 4–6 hours. Initial lessons: 1.67 h; labs: 0.67 h; assessment and delayed check: 0.5 h; allocated project work: 0–0 h; distributed practice/review: 1.16–3.16 h.

**Learning objectives:**

- Distinguish modern formal Arabic, classical Arabic and regional speech

- Record separate starting evidence for the four main language skills

- Build a repeatable practice loop with delayed retrieval

- Use Arabic input and preserve correctly ordered text

- Choose sustainable tasks and honest completion states



**Topics:** Goals and register (`topic.arabic-learning-start-goals-and-register`); Learning workflow (`topic.arabic-learning-start-learning-workflow`)



**Common mistakes:**

- Equating recitation with comprehension

- Treating a streak as ability

- Expecting MSA to replace every local dialect



**Understand before progressing:**

- Choose a Fuṣḥā goal, keep separate skill evidence and use a realistic weekly routine.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Choose a Fuṣḥā goal, keep separate skill evidence and use a realistic weekly routine.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Goals and register

**ID:** `topic.arabic-learning-start-goals-and-register`



<a id="lesson.arabic-fusha-register"></a>

##### Lesson — What Fuṣḥā means and where it is used

**ID:** `lesson.arabic-fusha-register` · **Module:** `module.arabic-learning-start` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 20 min standard; 10 min partial session; 20–40 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** None.

**Skill:** `skill.arabic-fusha-register`

**Learning objectives:**

- Distinguish modern formal Arabic, classical Arabic and regional speech

- Demonstrate the outcome on a changed prompt: Explain which Arabic you want for two real activities.



**Key concepts:** MSA; Classical Arabic; dialect; register.

**Arabic example:** الْعَرَبِيَّةُ الْفُصْحَى — Formal/literary Arabic

**Practical exercise** (`exercise.arabic-fusha-register`): Classify six settings: news bulletin, research article, family conversation, classical poem, formal speech and classroom exchange.

**Evidence to keep:** A goal statement and six setting labels.

**Knowledge check** (`assessment.arabic-fusha-register-check`):

- Does Fuṣḥā mean only Qur'anic Arabic?

- Will studying MSA guarantee understanding every street conversation?



**Mini challenge** (`exercise.arabic-fusha-register-transfer`): Explain which Arabic you want for two real activities.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qfi`, `resource.arabic-nation`, `resource.arabic-ies`. The catalogue below gives verified links.

**Completion criteria:**

- A goal statement and six setting labels submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (10 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (20 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (40 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (20 min): Explain which Arabic you want for two real activities. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-goal-baseline"></a>

##### Lesson — Measure your starting point without guessing

**ID:** `lesson.arabic-goal-baseline` · **Module:** `module.arabic-learning-start` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 20 min standard; 10 min partial session; 20–40 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-fusha-register`

**Skill:** `skill.arabic-goal-baseline`

**Learning objectives:**

- Record separate starting evidence for the four main language skills

- Demonstrate the outcome on a changed prompt: Explain one strength that does not establish another skill.



**Key concepts:** baseline; unknown versus failed; prior learning.

**Arabic example:** أَهْلًا — Hello/welcome

**Practical exercise** (`exercise.arabic-goal-baseline`): Try recognising five letters, understanding a short greeting recording, introducing yourself and writing any known words; leave unavailable audio untested.

**Evidence to keep:** Four baseline notes with assistance and uncertainty recorded.

**Knowledge check** (`assessment.arabic-goal-baseline-check`):

- Can you skip alphabet work after a recognition-only test?

- What does an untested listening score mean?



**Mini challenge** (`exercise.arabic-goal-baseline-transfer`): Explain one strength that does not establish another skill.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qfi`, `resource.arabic-nation`, `resource.arabic-ies`. The catalogue below gives verified links.

**Completion criteria:**

- Four baseline notes with assistance and uncertainty recorded submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (10 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (20 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (40 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (20 min): Explain one strength that does not establish another skill. Evidence: record support, prompt novelty and task conditions.



#### Topic — Learning workflow

**ID:** `topic.arabic-learning-start-learning-workflow`



<a id="lesson.arabic-learning-loop"></a>

##### Lesson — Practise, retrieve and revisit

**ID:** `lesson.arabic-learning-loop` · **Module:** `module.arabic-learning-start` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 20 min standard; 10 min partial session; 20–40 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`

**Skill:** `skill.arabic-learning-loop`

**Learning objectives:**

- Build a repeatable practice loop with delayed retrieval

- Demonstrate the outcome on a changed prompt: Change the person or context in one remembered phrase.



**Key concepts:** recall; feedback; spacing; error log.

**Arabic example:** شُكْرًا — Thank you

**Practical exercise** (`exercise.arabic-learning-loop`): Learn three greeting chunks, recall after a break and schedule a fresh example on another day.

**Evidence to keep:** Three retrieval attempts and one dated follow-up.

**Knowledge check** (`assessment.arabic-learning-loop-check`):

- Is rereading the same answer independent recall?

- Why return on a later day?



**Mini challenge** (`exercise.arabic-learning-loop-transfer`): Change the person or context in one remembered phrase.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qfi`, `resource.arabic-nation`, `resource.arabic-ies`. The catalogue below gives verified links.

**Completion criteria:**

- Three retrieval attempts and one dated follow-up submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (10 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (20 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (40 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (20 min): Change the person or context in one remembered phrase. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-arabic-tools"></a>

##### Lesson — Set up readable Arabic and a recording notebook

**ID:** `lesson.arabic-arabic-tools` · **Module:** `module.arabic-learning-start` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 20 min standard; 10 min partial session; 20–40 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`

**Skill:** `skill.arabic-arabic-tools`

**Learning objectives:**

- Use Arabic input and preserve correctly ordered text

- Demonstrate the outcome on a changed prompt: Display Arabic beside an English label without reversing either.



**Key concepts:** right-to-left; keyboard; audio evidence; privacy.

**Arabic example:** مَرْحَبًا — Hello

**Practical exercise** (`exercise.arabic-arabic-tools`): Type or copy an Arabic greeting, play a sample if available, record a short attempt and organise files by date; handwriting is an equivalent first option.

**Evidence to keep:** One correctly displayed note and a recording or explicit equipment gap.

**Knowledge check** (`assessment.arabic-arabic-tools-check`):

- Should letters be manually reversed for display?

- Does a typed transcript prove pronunciation?



**Mini challenge** (`exercise.arabic-arabic-tools-transfer`): Display Arabic beside an English label without reversing either.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qfi`, `resource.arabic-nation`, `resource.arabic-ies`. The catalogue below gives verified links.

**Completion criteria:**

- One correctly displayed note and a recording or explicit equipment gap submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (10 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (20 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (40 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (20 min): Display Arabic beside an English label without reversing either. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-practice-contract"></a>

##### Lesson — Plan sessions that fit your time and energy

**ID:** `lesson.arabic-practice-contract` · **Module:** `module.arabic-learning-start` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 20 min standard; 10 min partial session; 20–40 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-learning-loop`

**Skill:** `skill.arabic-practice-contract`

**Learning objectives:**

- Choose sustainable tasks and honest completion states

- Demonstrate the outcome on a changed prompt: Reduce your plan to a low-energy week while keeping retrieval.



**Key concepts:** 10-minute fallback; 30–90 minutes; partial completion.

**Arabic example:** أَدْرُسُ الْعَرَبِيَّةَ. — I study Arabic.

**Practical exercise** (`exercise.arabic-practice-contract`): Write a five-day plan mixing understanding, listening, speaking, reading and writing, with a short fallback.

**Evidence to keep:** A normal-week and low-energy-week plan.

**Knowledge check** (`assessment.arabic-practice-contract-check`):

- Must a short session finish a whole lesson?

- What happens after several missed days?



**Mini challenge** (`exercise.arabic-practice-contract-transfer`): Reduce your plan to a low-energy week while keeping retrieval.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qfi`, `resource.arabic-nation`, `resource.arabic-ies`. The catalogue below gives verified links.

**Completion criteria:**

- A normal-week and low-energy-week plan submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (10 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (20 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (40 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (20 min): Reduce your plan to a low-energy week while keeping retrieval. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Orientation, placement and learning habits: guided** (`lab.arabic-learning-start-guided`, 20 min, splittable): Create a baseline with one attempted listening, speaking, reading and writing task; mark untested areas unknown.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Orientation, placement and learning habits: transfer** (`lab.arabic-learning-start-transfer`, 20 min, splittable): Revisit the baseline after a week and identify one observed change without inflating a level.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-learning-start-performance` — Revisit the baseline after a week and identify one observed change without inflating a level.

Allow 20 minutes across short sessions, plus 10 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`)

---



<a id="module.arabic-script"></a>

### Module 02 — Arabic script and decoding

**ID:** `module.arabic-script` · **Path:** core · **Target:** Pre-A1 · **Difficulty:** 1/6

**Purpose:** Connect letter shapes to meaningful words without prolonged transliteration.

**Entry prerequisites:** `skill.arabic-goal-baseline`

**Other skills used by particular lessons:** `skill.arabic-goal-baseline`

**Before entry:** Know that reading aloud and understanding are different; no letter mastery is required.

**Estimated study time:** 16–24 hours. Initial lessons: 4.5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 8.5–16.5 h.

**Learning objectives:**

- Identify the basic alphabet and common dot families

- Join letters while respecting the six common non-left-joining letters

- Decode vowel length from letters and short-vowel marks

- Distinguish a vowelless consonant, a doubled consonant and tanwīn

- Recognise common spellings without treating distinct letters as interchangeable

- Separate orthographic decoding from comprehension



**Topics:** Letters and joining (`topic.arabic-script-letters-and-joining`); Vowels and marks (`topic.arabic-script-vowels-and-marks`); Orthographic distinctions (`topic.arabic-script-orthographic-distinctions`)



**Common mistakes:**

- Learning only isolated letter shapes

- Adding a short vowel after every consonant

- Confusing ة with ه or ى with ي



**Understand before progressing:**

- Read familiar vowelled words, write connected letters and identify ambiguous unvowelled forms.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Read familiar vowelled words, write connected letters and identify ambiguous unvowelled forms.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Letters and joining

**ID:** `topic.arabic-script-letters-and-joining`



<a id="lesson.arabic-letter-families"></a>

##### Lesson — Recognise all 28 basic letter shapes

**ID:** `lesson.arabic-letter-families` · **Module:** `module.arabic-script` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`

**Skill:** `skill.arabic-letter-families`

**Learning objectives:**

- Identify the basic alphabet and common dot families

- Demonstrate the outcome on a changed prompt: Identify ten letters in an unfamiliar clear Naskh font.



**Key concepts:** 28 letters; dot position; shape families.

**Arabic example:** ب ت ث ن ي — A group of visually related letters

**Practical exercise** (`exercise.arabic-letter-families`): Sort all letters into visual families; trace and identify ب ت ث ن ي in mixed order, then the remaining families.

**Evidence to keep:** A complete alphabet inventory and ten mixed identifications.

**Knowledge check** (`assessment.arabic-letter-families-check`):

- What distinguishes ب from ت?

- Does recognising a letter name prove you know its sound in a word?

- Write the three letters described: one dot below; two dots above; three dots above, using the ب/ت/ث family.



**Mini challenge** (`exercise.arabic-letter-families-transfer`): Identify ten letters in an unfamiliar clear Naskh font.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ryding`, `resource.arabic-w3c`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A complete alphabet inventory and ten mixed identifications submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Identify ten letters in an unfamiliar clear Naskh font. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-letter-joining"></a>

##### Lesson — Read connected forms and joining breaks

**ID:** `lesson.arabic-letter-joining` · **Module:** `module.arabic-script` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-letter-families`

**Skill:** `skill.arabic-letter-joining`

**Learning objectives:**

- Join letters while respecting the six common non-left-joining letters

- Demonstrate the outcome on a changed prompt: Reconstruct five words from letter tiles without a model.



**Key concepts:** initial medial final; ا د ذ ر ز و; لا ligature.

**Arabic example:** كِتَاب — Book

**Practical exercise** (`exercise.arabic-letter-joining`): Write باب، بيت، ولد، درس، كتاب and mark where the pen or connection breaks; build ten more familiar words.

**Evidence to keep:** Ten joined words with joining breaks explained.

**Knowledge check** (`assessment.arabic-letter-joining-check`):

- Which common letters do not connect to the following letter on their left?

- Is لا a new alphabet letter?

- Split باب into its three letters. Which letter prevents a connection to the next letter on its left?



**Mini challenge** (`exercise.arabic-letter-joining-transfer`): Reconstruct five words from letter tiles without a model.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ryding`, `resource.arabic-w3c`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Ten joined words with joining breaks explained submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Reconstruct five words from letter tiles without a model. Evidence: record support, prompt novelty and task conditions.



#### Topic — Vowels and marks

**ID:** `topic.arabic-script-vowels-and-marks`



<a id="lesson.arabic-vowel-decoding"></a>

##### Lesson — Short vowels, long vowels and syllables

**ID:** `lesson.arabic-vowel-decoding` · **Module:** `module.arabic-script` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-letter-joining`

**Skill:** `skill.arabic-vowel-decoding`

**Learning objectives:**

- Decode vowel length from letters and short-vowel marks

- Demonstrate the outcome on a changed prompt: Read five new vowelled words using a gloss for meaning.



**Key concepts:** fatḥa kasra ḍamma; ا و ي; long versus short.

**Arabic example:** كَتَبَ / كَاتِب — He wrote / writer

**Practical exercise** (`exercise.arabic-vowel-decoding`): Read and write twelve model syllables and words; mark the long vowel in كتاب and the short vowels in كَتَبَ.

**Evidence to keep:** Twelve annotated items and five new decodings.

**Knowledge check** (`assessment.arabic-vowel-decoding-check`):

- Are و and ي always long vowels?

- Does omitting a short-vowel mark mean no vowel is pronounced?

- In كِتَاب, identify the long vowel. In كَتَبَ, count the written short-vowel marks.



**Mini challenge** (`exercise.arabic-vowel-decoding-transfer`): Read five new vowelled words using a gloss for meaning.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ryding`, `resource.arabic-w3c`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Twelve annotated items and five new decodings submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Read five new vowelled words using a gloss for meaning. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-sukun-shadda"></a>

##### Lesson — Sukūn, shadda and the visible word ending

**ID:** `lesson.arabic-sukun-shadda` · **Module:** `module.arabic-script` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-vowel-decoding`

**Skill:** `skill.arabic-sukun-shadda`

**Learning objectives:**

- Distinguish a vowelless consonant, a doubled consonant and tanwīn

- Demonstrate the outcome on a changed prompt: Copy a short fully marked phrase and explain every visible sign.



**Key concepts:** sukūn; shadda; tanwīn; connected reading.

**Arabic example:** دَرَسَ / دَرَّسَ — He studied / he taught

**Practical exercise** (`exercise.arabic-sukun-shadda`): Mark and read contrast cards for دَرَسَ and دَرَّسَ; recognise three tanwīn signs without memorising case rules yet.

**Evidence to keep:** Six contrast cards and one annotated phrase.

**Knowledge check** (`assessment.arabic-sukun-shadda-check`):

- What does shadda add?

- Does tanwīn belong on every Arabic noun?

- Explain the difference between دَرَسَ and دَرَّسَ using the meanings he studied and he taught.



**Mini challenge** (`exercise.arabic-sukun-shadda-transfer`): Copy a short fully marked phrase and explain every visible sign.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ryding`, `resource.arabic-w3c`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six contrast cards and one annotated phrase submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Copy a short fully marked phrase and explain every visible sign. Evidence: record support, prompt novelty and task conditions.



#### Topic — Orthographic distinctions

**ID:** `topic.arabic-script-orthographic-distinctions`



<a id="lesson.arabic-special-spellings"></a>

##### Lesson — Hamza, tāʾ marbūṭa and alif maqṣūra

**ID:** `lesson.arabic-special-spellings` · **Module:** `module.arabic-script` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-sukun-shadda`

**Skill:** `skill.arabic-special-spellings`

**Learning objectives:**

- Recognise common spellings without treating distinct letters as interchangeable

- Demonstrate the outcome on a changed prompt: Correct four deliberate spelling confusions in a word list.



**Key concepts:** ء أ إ آ; ة versus ه; ى versus ي; hamzat al-waṣl preview.

**Arabic example:** مَدْرَسَة / عَلَى — School / on

**Practical exercise** (`exercise.arabic-special-spellings`): Sort أُمّ، إِبْرَة، مَاء، مَدْرَسَة، هُوَ، عَلَى، فِي and copy accurately; learn seats as examples before the full spelling rule.

**Evidence to keep:** Eight sorted words and four corrections.

**Knowledge check** (`assessment.arabic-special-spellings-check`):

- Are ة and ه interchangeable in careful spelling?

- Does final ى normally indicate the consonant y in MSA?

- Copy and label the final character in مدرسة, على and هو. Which two words in the list end in ة and ى?



**Mini challenge** (`exercise.arabic-special-spellings-transfer`): Correct four deliberate spelling confusions in a word list.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ryding`, `resource.arabic-w3c`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Eight sorted words and four corrections submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Correct four deliberate spelling confusions in a word list. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-script-meaning"></a>

##### Lesson — From accurate decoding to actual meaning

**ID:** `lesson.arabic-script-meaning` · **Module:** `module.arabic-script` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-special-spellings`

**Skill:** `skill.arabic-script-meaning`

**Learning objectives:**

- Separate orthographic decoding from comprehension

- Demonstrate the outcome on a changed prompt: Explain two plausible readings of a familiar ambiguous form after receiving context.



**Key concepts:** word boundaries; partial vowels; context; meaning.

**Arabic example:** بَيْت / بَاب — House / door

**Practical exercise** (`exercise.arabic-script-meaning`): Read a twelve-word pictured set first with full vowels, then with fewer marks; match meanings and type three labels.

**Evidence to keep:** Separate decoding and meaning scores plus three typed labels.

**Knowledge check** (`assessment.arabic-script-meaning-check`):

- Can كتب be pronounced confidently without any context?

- Should missing vowel marks be treated as spelling errors in normal prose?

- Match بَيْت and بَاب to house and door. Then cover the words and write the word for door.



**Mini challenge** (`exercise.arabic-script-meaning-transfer`): Explain two plausible readings of a familiar ambiguous form after receiving context.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ryding`, `resource.arabic-w3c`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Separate decoding and meaning scores plus three typed labels submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain two plausible readings of a familiar ambiguous form after receiving context. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Arabic script and decoding: guided** (`lab.arabic-script-guided`, 45 min, splittable): Build a handwritten and typed mini-dictionary of twenty pictured objects; read new combinations with the same letters.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Arabic script and decoding: transfer** (`lab.arabic-script-transfer`, 75 min, splittable): Decode a fresh set of fifteen fully vowelled words and explain five meanings using pictures or glosses.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-script-performance` — Decode a fresh set of fifteen fully vowelled words and explain five meanings using pictures or glosses.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`)

---



<a id="module.arabic-sound"></a>

### Module 03 — Listening foundations and intelligible pronunciation

**ID:** `module.arabic-sound` · **Path:** core · **Target:** Pre-A1 · **Difficulty:** 1/6

**Purpose:** Train listening distinctions and understandable speech alongside script.

**Entry prerequisites:** `skill.arabic-goal-baseline`

**Other skills used by particular lessons:** `skill.arabic-goal-baseline`

**Before entry:** Be ready to use a verified recording or competent speaker; letter lessons may run in parallel.

**Estimated study time:** 16–24 hours. Initial lessons: 4.5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 3–5 h; distributed practice/review: 5.5–11.5 h.

**Learning objectives:**

- Compare your production with a reliable MSA model

- Preserve meaning-bearing sound length

- Approximate difficult consonants without merging their identities

- Differentiate consonants that English-based approximations often merge

- Recognise article assimilation and common linking patterns

- Read short chunks with sensible pauses and declared ending conventions



**Topics:** Hearing and timing (`topic.arabic-sound-hearing-and-timing`); Consonant contrasts (`topic.arabic-sound-consonant-contrasts`); Connected speech (`topic.arabic-sound-connected-speech`)



**Common mistakes:**

- Trusting speech-to-text as a pronunciation examiner

- Substituting throat strain for articulation

- Ignoring vowel length while perfecting accent



**Understand before progressing:**

- Distinguish key contrasts, preserve vowel and consonant length and produce short intelligible chunks.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Distinguish key contrasts, preserve vowel and consonant length and produce short intelligible chunks.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Hearing and timing

**ID:** `topic.arabic-sound-hearing-and-timing`



<a id="lesson.arabic-listening-noticing"></a>

##### Lesson — Hear before imitating

**ID:** `lesson.arabic-listening-noticing` · **Module:** `module.arabic-sound` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`

**Skill:** `skill.arabic-listening-noticing`

**Learning objectives:**

- Compare your production with a reliable MSA model

- Demonstrate the outcome on a changed prompt: Identify a greeting spoken by a second speaker.



**Key concepts:** auditory discrimination; record compare adjust; intelligibility.

**Arabic example:** صَبَاحُ الْخَيْرِ — Good morning

**Practical exercise** (`exercise.arabic-listening-noticing`): Listen to five short verified greeting clips without text, choose matching meanings, then imitate one after revealing the transcript.

**Evidence to keep:** Five listening decisions and one before/after recording.

**Knowledge check** (`assessment.arabic-listening-noticing-check`):

- Is seeing the transcript compatible with an independent first-pass listening test?

- Is a recogniser's correct transcript proof of accurate sounds?



**Mini challenge** (`exercise.arabic-listening-noticing-transfer`): Identify a greeting spoken by a second speaker.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ksu`, `resource.arabic-cefr`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Five listening decisions and one before/after recording submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Identify a greeting spoken by a second speaker. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-length-contrast"></a>

##### Lesson — Hear and produce vowel length and gemination

**ID:** `lesson.arabic-length-contrast` · **Module:** `module.arabic-sound` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-listening-noticing`

**Skill:** `skill.arabic-length-contrast`

**Learning objectives:**

- Preserve meaning-bearing sound length

- Demonstrate the outcome on a changed prompt: Repeat a new contrast after a delay without the model.



**Key concepts:** short and long vowels; shadda; minimal contrasts.

**Arabic example:** مَلِك / مَالِك — King / owner

**Practical exercise** (`exercise.arabic-length-contrast`): Use ten speaker-verified contrasts including دَرَسَ/دَرَّسَ and مَلِك/مَالِك; classify and record them in random order.

**Evidence to keep:** At least eight of ten listening distinctions plus recorded contrasts.

**Knowledge check** (`assessment.arabic-length-contrast-check`):

- Can consonant length change a word's meaning?

- Must long vowels be exactly twice as long in all speech?

- Using the written forms, explain why مَلِك and مَالِك must not be treated as the same word.



**Mini challenge** (`exercise.arabic-length-contrast-transfer`): Repeat a new contrast after a delay without the model.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ksu`, `resource.arabic-cefr`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- At least eight of ten listening distinctions plus recorded contrasts submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat a new contrast after a delay without the model. Evidence: record support, prompt novelty and task conditions.



#### Topic — Consonant contrasts

**ID:** `topic.arabic-sound-consonant-contrasts`



<a id="lesson.arabic-throat-sounds"></a>

##### Lesson — Distinguish hamza, hāʾ, ḥāʾ, ʿayn, khāʾ and ghayn

**ID:** `lesson.arabic-throat-sounds` · **Module:** `module.arabic-sound` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-listening-noticing`

**Skill:** `skill.arabic-throat-sounds`

**Learning objectives:**

- Approximate difficult consonants without merging their identities

- Demonstrate the outcome on a changed prompt: Ask a listener which of four intended syllables they heard.



**Key concepts:** ء ه ح ع خ غ; voicing; place of articulation.

**Arabic example:** ح / ه / ع / ء — Distinct consonants

**Practical exercise** (`exercise.arabic-throat-sounds`): Use a competent MSA pronunciation model for six sound families. First contrast model syllables هَ/حَ, عَ/أَ and خَ/غَ. Then compare هَلْ and حَلّ, explicitly noticing that the latter also has a doubled ل; do not call those two words a minimal pair.

**Evidence to keep:** A contrast log and four listener-identified syllables.

**Knowledge check** (`assessment.arabic-throat-sounds-check`):

- Are ع and ء the same sound?

- Should practice cause throat pain?

- Which of ح / ه appears in حَلّ, and which appears in هَلْ? Name one additional difference between the two written forms.



**Mini challenge** (`exercise.arabic-throat-sounds-transfer`): Ask a listener which of four intended syllables they heard.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ksu`, `resource.arabic-cefr`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A contrast log and four listener-identified syllables submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Ask a listener which of four intended syllables they heard. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-emphatics-qaf"></a>

##### Lesson — Emphatic sounds, qāf and interdental consonants

**ID:** `lesson.arabic-emphatics-qaf` · **Module:** `module.arabic-sound` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-length-contrast`

**Skill:** `skill.arabic-emphatics-qaf`

**Learning objectives:**

- Differentiate consonants that English-based approximations often merge

- Demonstrate the outcome on a changed prompt: Identify a contrast from a new voice at a comfortable speed.



**Key concepts:** س ص; ت ط; د ض; ذ ظ; ك ق; ث ذ.

**Arabic example:** قَلْب / كَلْب — Heart / dog

**Practical exercise** (`exercise.arabic-emphatics-qaf`): Discriminate a verified ten-item set, then record س/ص and ك/ق contrasts in meaningful words such as قلب and كلب.

**Evidence to keep:** Ten listening responses and five feedback-checked productions.

**Knowledge check** (`assessment.arabic-emphatics-qaf-check`):

- Are ق and ك interchangeable in the course's MSA target?

- Must intelligible speech erase every trace of your first-language accent?

- Match قَلْب and كَلْب to heart and dog. Which initial letter distinguishes them?



**Mini challenge** (`exercise.arabic-emphatics-qaf-transfer`): Identify a contrast from a new voice at a comfortable speed.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ksu`, `resource.arabic-cefr`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Ten listening responses and five feedback-checked productions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Identify a contrast from a new voice at a comfortable speed. Evidence: record support, prompt novelty and task conditions.



#### Topic — Connected speech

**ID:** `topic.arabic-sound-connected-speech`



<a id="lesson.arabic-article-connected-speech"></a>

##### Lesson — Hear the article and connect familiar words

**ID:** `lesson.arabic-article-connected-speech` · **Module:** `module.arabic-sound` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-listening-noticing`

**Skill:** `skill.arabic-article-connected-speech`

**Learning objectives:**

- Recognise article assimilation and common linking patterns

- Demonstrate the outcome on a changed prompt: Recover three familiar words from a linked phrase without seeing spaces.



**Key concepts:** sun and moon letters; ال; hamzat al-waṣl; word boundaries.

**Arabic example:** الْقَمَر / الشَّمْس — The moon / the sun

**Practical exercise** (`exercise.arabic-article-connected-speech`): Hear القمر and الشمس inside short verified phrases; retain ال in writing while imitating the sound; compare starting versus linking the article.

**Evidence to keep:** Six phrase recordings with word boundaries marked afterward.

**Knowledge check** (`assessment.arabic-article-connected-speech-check`):

- Is the lām of ال pronounced identically before every letter?

- Does assimilation remove the written article?

- Which article lām is pronounced: in الْقَمَر or in الشَّمْس? Write the definite form of قمر.



**Mini challenge** (`exercise.arabic-article-connected-speech-transfer`): Recover three familiar words from a linked phrase without seeing spaces.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ksu`, `resource.arabic-cefr`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six phrase recordings with word boundaries marked afterward submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Recover three familiar words from a linked phrase without seeing spaces. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-pause-prosody"></a>

##### Lesson — Phrasing, pausal forms and clear meaning

**ID:** `lesson.arabic-pause-prosody` · **Module:** `module.arabic-sound` · **Difficulty:** 1/6 · **Target:** Pre-A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-goal-baseline`, `skill.arabic-article-connected-speech`, `skill.arabic-length-contrast`

**Skill:** `skill.arabic-pause-prosody`

**Learning objectives:**

- Read short chunks with sensible pauses and declared ending conventions

- Demonstrate the outcome on a changed prompt: Re-record one phrase after a listener describes where meaning became unclear.



**Key concepts:** pausal forms; case ending awareness; question intonation; stress.

**Arabic example:** كَيْفَ حَالُكَ؟ — How are you? (to a male)

**Practical exercise** (`exercise.arabic-pause-prosody`): Compare teacher-modelled pause and connected versions of a simple phrase; record a greeting and a question with meaningful pauses.

**Evidence to keep:** Two short recordings and a stated pausal/connected convention.

**Knowledge check** (`assessment.arabic-pause-prosody-check`):

- Does understanding MSA require pronouncing every case ending in every speaking task?

- Is tajwīd identical to ordinary MSA pronunciation teaching?

- A speaking task asks for ordinary pausal MSA. A learner pauses after طَالِبٌ without pronouncing -un. Is that alone an error, and what must the assessor check?



**Mini challenge** (`exercise.arabic-pause-prosody-transfer`): Re-record one phrase after a listener describes where meaning became unclear.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-alifbaa`, `resource.arabic-ksu`, `resource.arabic-cefr`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-contrast-bank`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Two short recordings and a stated pausal/connected convention submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Re-record one phrase after a listener describes where meaning became unclear. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Listening foundations and intelligible pronunciation: guided** (`lab.arabic-sound-guided`, 45 min, splittable): Use a speaker-verified set of twenty sound contrasts, with unseen order, then record ten words for feedback.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Listening foundations and intelligible pronunciation: transfer** (`lab.arabic-sound-transfer`, 75 min, splittable): Have a listener identify ten intended words without seeing the script and record the confusions.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-sound-performance` — Have a listener identify ten intended words without seeing the script and record the confusions.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`)

##### Project: A sound-and-script field notebook

**ID:** `project.arabic-sound-script-notebook`

**Goal:** Show the difference between recognising, decoding, understanding and producing short Arabic words.

**Required skills:** `skill.arabic-script-meaning`, `skill.arabic-pause-prosody`, `skill.arabic-practice-contract`

**Study time:** 3–5 hours; allocated once to `module.arabic-sound`.

**Deliverables:**

- Twenty handwritten and typed word cards

- Ten recorded contrasts when verified audio support is available

- Five meanings demonstrated with pictures or explanations

- Two dated attempts and an error log



**Assessment criteria:**

- 25% — Letter identity and joining are accurate

- 25% — Sound length and key contrasts are identifiable to a listener

- 25% — Meanings are understood rather than merely recited

- 25% — Assistance and recording conditions are honest



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** A baseline that makes early literacy and pronunciation progress visible.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-first-sentences"></a>

### Module 04 — First meaningful sentences and introductions

**ID:** `module.arabic-first-sentences` · **Path:** core · **Target:** A1 · **Difficulty:** 2/6

**Purpose:** Communicate personal information in simple Fuṣḥā while learning how sentences work.

**Entry prerequisites:** `skill.arabic-script-meaning`, `skill.arabic-listening-noticing`

**Other skills used by particular lessons:** `skill.arabic-listening-noticing`, `skill.arabic-script-meaning`

**Before entry:** Decode familiar vowelled words and recognise a few spoken greetings.

**Estimated study time:** 22–32 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 15.25–25.25 h.

**Learning objectives:**

- Greet and address one person appropriately

- Build simple present-time nominal sentences

- Ask and answer basic information questions

- Use basic prepositions to give origin and location

- Keep a simple exchange going when comprehension fails



**Topics:** Personal exchange (`topic.arabic-first-sentences-personal-exchange`); Simple sentence patterns (`topic.arabic-first-sentences-simple-sentence-patterns`); Interaction repair (`topic.arabic-first-sentences-interaction-repair`)



**Common mistakes:**

- Inserting an unnecessary present-tense is

- Memorising a speech without understanding questions

- Using masculine address for every listener



**Understand before progressing:**

- Introduce yourself, ask basic questions and repair a misunderstanding.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Introduce yourself, ask basic questions and repair a misunderstanding.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Personal exchange

**ID:** `topic.arabic-first-sentences-personal-exchange`



<a id="lesson.arabic-greetings-address"></a>

##### Lesson — Greetings, names and respectful address

**ID:** `lesson.arabic-greetings-address` · **Module:** `module.arabic-first-sentences` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-script-meaning`, `skill.arabic-listening-noticing`

**Skill:** `skill.arabic-greetings-address`

**Learning objectives:**

- Greet and address one person appropriately

- Demonstrate the outcome on a changed prompt: Greet a new partner without reading the script.



**Key concepts:** greeting chunks; أنتَ أنتِ; politeness.

**Arabic example:** أَنَا سَارَةُ. — I am Sarah.

**Practical exercise** (`exercise.arabic-greetings-address`): Use a verified two-person dialogue; alternate greeting, name and thanks with masculine and feminine address.

**Evidence to keep:** A four-turn exchange with correct intended address.

**Knowledge check** (`assessment.arabic-greetings-address-check`):

- What changes between أنتَ and أنتِ?

- Does a formal greeting prescribe one culture's behaviour in every context?

- Write What is your name? to one woman, showing the vowel on the final ك.



**Mini challenge** (`exercise.arabic-greetings-address-transfer`): Greet a new partner without reading the script.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-introduction-dialogue`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A four-turn exchange with correct intended address submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Greet a new partner without reading the script. Evidence: record support, prompt novelty and task conditions.



#### Topic — Simple sentence patterns

**ID:** `topic.arabic-first-sentences-simple-sentence-patterns`



<a id="lesson.arabic-nominal-sentences"></a>

##### Lesson — Say what someone or something is

**ID:** `lesson.arabic-nominal-sentences` · **Module:** `module.arabic-first-sentences` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-script-meaning`, `skill.arabic-listening-noticing`, `skill.arabic-greetings-address`

**Skill:** `skill.arabic-nominal-sentences`

**Learning objectives:**

- Build simple present-time nominal sentences

- Demonstrate the outcome on a changed prompt: Describe a fictional person using three new combinations.



**Key concepts:** subject and predicate; no present copula; pronouns.

**Arabic example:** هُوَ طَالِبٌ. — He is a student.

**Practical exercise** (`exercise.arabic-nominal-sentences`): Make six statements from أنا، هو، هي and job or identity cards; explain the difference between a sentence and a noun label.

**Evidence to keep:** Six meaningful sentences and one explanation.

**Knowledge check** (`assessment.arabic-nominal-sentences-check`):

- Is an Arabic equivalent of is always needed in a present nominal sentence?

- In هو طالب, what information is the predicate?

- Write She is a student using هي and طالبة.



**Mini challenge** (`exercise.arabic-nominal-sentences-transfer`): Describe a fictional person using three new combinations.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-introduction-dialogue`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six meaningful sentences and one explanation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Describe a fictional person using three new combinations. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-simple-questions"></a>

##### Lesson — Ask who, what, where and whether

**ID:** `lesson.arabic-simple-questions` · **Module:** `module.arabic-first-sentences` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-script-meaning`, `skill.arabic-listening-noticing`, `skill.arabic-nominal-sentences`

**Skill:** `skill.arabic-simple-questions`

**Learning objectives:**

- Ask and answer basic information questions

- Demonstrate the outcome on a changed prompt: Identify a person from three answers you hear.



**Key concepts:** مَن ما أين هل; yes/no; question intonation.

**Arabic example:** أَيْنَ الْبَيْتُ؟ — Where is the house?

**Practical exercise** (`exercise.arabic-simple-questions`): Ask six questions about a profile and room picture; answer without repeating the whole model.

**Evidence to keep:** Six question-answer pairs.

**Knowledge check** (`assessment.arabic-simple-questions-check`):

- Which word asks about a person: مَن or أين?

- Does هل normally ask for a yes/no response?

- You want to know the location of the book. Complete ___ الكتاب؟ and give an answer using على المكتب.



**Mini challenge** (`exercise.arabic-simple-questions-transfer`): Identify a person from three answers you hear.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-introduction-dialogue`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six question-answer pairs submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Identify a person from three answers you hear. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-origin-location"></a>

##### Lesson — Describe origin and location

**ID:** `lesson.arabic-origin-location` · **Module:** `module.arabic-first-sentences` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-script-meaning`, `skill.arabic-listening-noticing`, `skill.arabic-simple-questions`

**Skill:** `skill.arabic-origin-location`

**Learning objectives:**

- Use basic prepositions to give origin and location

- Demonstrate the outcome on a changed prompt: Write a new profile for someone living away from their place of origin.



**Key concepts:** مِن في إلى; countries; location phrases.

**Arabic example:** أَنَا فِي الْبَيْتِ. — I am at home.

**Practical exercise** (`exercise.arabic-origin-location`): Create fictional identity cards, then say where each person is from and where they are now; model country names as chunks.

**Evidence to keep:** Four profiles with separate origin and current place.

**Knowledge check** (`assessment.arabic-origin-location-check`):

- How do مِن and في differ here?

- Does memorising a country adjective establish all adjective agreement?

- Explain the difference between أنا من مصر and أنا في مصر.



**Mini challenge** (`exercise.arabic-origin-location-transfer`): Write a new profile for someone living away from their place of origin.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-introduction-dialogue`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Four profiles with separate origin and current place submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Write a new profile for someone living away from their place of origin. Evidence: record support, prompt novelty and task conditions.



#### Topic — Interaction repair

**ID:** `topic.arabic-first-sentences-interaction-repair`



<a id="lesson.arabic-repair-phrases"></a>

##### Lesson — Ask for repetition and check meaning

**ID:** `lesson.arabic-repair-phrases` · **Module:** `module.arabic-first-sentences` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-script-meaning`, `skill.arabic-listening-noticing`, `skill.arabic-simple-questions`

**Skill:** `skill.arabic-repair-phrases`

**Learning objectives:**

- Keep a simple exchange going when comprehension fails

- Demonstrate the outcome on a changed prompt: Continue after a partner changes the question order.



**Key concepts:** repeat; slow down; confirm; do not pretend.

**Arabic example:** لَمْ أَفْهَمْ. — I did not understand. (learn as a chunk here)

**Practical exercise** (`exercise.arabic-repair-phrases`): Practise a partner deliberately giving an unfamiliar name; request repetition, confirm one detail and state what remains unclear.

**Evidence to keep:** A six-turn exchange containing two successful repairs.

**Knowledge check** (`assessment.arabic-repair-phrases-check`):

- Is guessing silently a good repair strategy?

- What evidence shows interactive skill beyond a memorised monologue?

- Write a short MSA phrase to say I did not understand, then ask a male partner to repeat politely using a taught model.



**Mini challenge** (`exercise.arabic-repair-phrases-transfer`): Continue after a partner changes the question order.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-introduction-dialogue`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A six-turn exchange containing two successful repairs submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Continue after a partner changes the question order. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**First meaningful sentences and introductions: guided** (`lab.arabic-first-sentences-guided`, 45 min, splittable): Conduct a six-turn introduction with a partner who changes one detail; exchange a short profile.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**First meaningful sentences and introductions: transfer** (`lab.arabic-first-sentences-transfer`, 75 min, splittable): Introduce an unfamiliar fictional person using a fresh identity card and answer three unexpected simple questions.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-first-sentences-performance` — Introduce an unfamiliar fictional person using a fresh identity card and answer three unexpected simple questions.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** My world in Fuṣḥā (`project.arabic-my-world`)

---



<a id="module.arabic-noun-phrases"></a>

### Module 05 — Nouns, description and possession

**ID:** `module.arabic-noun-phrases` · **Path:** core · **Target:** A1 · **Difficulty:** 2/6

**Purpose:** Describe people and objects using common agreement and possession patterns.

**Entry prerequisites:** `skill.arabic-nominal-sentences`, `skill.arabic-script-meaning`

**Other skills used by particular lessons:** `skill.arabic-nominal-sentences`, `skill.arabic-script-meaning`

**Before entry:** Distinguish a simple sentence from a label and recognise ال.

**Estimated study time:** 22–32 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 15.25–25.25 h.

**Learning objectives:**

- Distinguish common gender patterns and definite reference

- Distinguish a noun-adjective phrase from a subject-predicate sentence

- Use common sound and broken plurals in familiar phrases

- Choose demonstratives for familiar people and objects

- Build basic possession phrases and recognise attached possessors



**Topics:** Noun features (`topic.arabic-noun-phrases-noun-features`); Reference (`topic.arabic-noun-phrases-reference`)



**Common mistakes:**

- Putting ال on the first noun of an iḍāfa

- Matching non-human plurals with plural adjectives automatically

- Treating every noun ending in ة as the only possible feminine pattern



**Understand before progressing:**

- Build descriptions with definiteness, common plurals, demonstratives and possession.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Build descriptions with definiteness, common plurals, demonstratives and possession.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Noun features

**ID:** `topic.arabic-noun-phrases-noun-features`



<a id="lesson.arabic-gender-definiteness"></a>

##### Lesson — Gender and the definite article

**ID:** `lesson.arabic-gender-definiteness` · **Module:** `module.arabic-noun-phrases` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-nominal-sentences`, `skill.arabic-script-meaning`

**Skill:** `skill.arabic-gender-definiteness`

**Learning objectives:**

- Distinguish common gender patterns and definite reference

- Demonstrate the outcome on a changed prompt: Choose definite or indefinite reference in four new descriptions.



**Key concepts:** ال; indefinite reference; grammatical gender; exceptions.

**Arabic example:** كِتَاب / الْكِتَاب — A book / the book

**Practical exercise** (`exercise.arabic-gender-definiteness`): Sort twelve familiar nouns by gender and definiteness; compare كتاب and الكتاب inside meaningful contexts.

**Evidence to keep:** Twelve classifications and four context choices.

**Knowledge check** (`assessment.arabic-gender-definiteness-check`):

- Does a noun always need ال to be a sentence subject?

- Can a feminine noun lack ة?

- Make كتاب definite, and identify whether شمس is grammatically masculine or feminine.



**Mini challenge** (`exercise.arabic-gender-definiteness-transfer`): Choose definite or indefinite reference in four new descriptions.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-room`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Twelve classifications and four context choices submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Choose definite or indefinite reference in four new descriptions. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-adjective-agreement"></a>

##### Lesson — Adjectives and complete statements

**ID:** `lesson.arabic-adjective-agreement` · **Module:** `module.arabic-noun-phrases` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-nominal-sentences`, `skill.arabic-script-meaning`, `skill.arabic-gender-definiteness`

**Skill:** `skill.arabic-adjective-agreement`

**Learning objectives:**

- Distinguish a noun-adjective phrase from a subject-predicate sentence

- Demonstrate the outcome on a changed prompt: Explain why one changed article changes the structure.



**Key concepts:** gender; number; definiteness; adjective position.

**Arabic example:** الْبَيْتُ كَبِيرٌ. — The house is big.

**Practical exercise** (`exercise.arabic-adjective-agreement`): Compare البيت الكبير with البيت كبير; describe six objects using both a label and a statement.

**Evidence to keep:** Six paired labels/statements.

**Knowledge check** (`assessment.arabic-adjective-agreement-check`):

- What does البيت الكبير mean?

- What does البيت كبير mean?

- Write both the big house and the house is big.



**Mini challenge** (`exercise.arabic-adjective-agreement-transfer`): Explain why one changed article changes the structure.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-room`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six paired labels/statements submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain why one changed article changes the structure. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-plural-basics"></a>

##### Lesson — Useful plurals and non-human agreement

**ID:** `lesson.arabic-plural-basics` · **Module:** `module.arabic-noun-phrases` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-nominal-sentences`, `skill.arabic-script-meaning`, `skill.arabic-adjective-agreement`

**Skill:** `skill.arabic-plural-basics`

**Learning objectives:**

- Use common sound and broken plurals in familiar phrases

- Demonstrate the outcome on a changed prompt: Describe new pictured objects using a supplied plural glossary.



**Key concepts:** sound plurals; broken plurals; non-human feminine singular agreement.

**Arabic example:** كُتُبٌ جَدِيدَةٌ — New books

**Practical exercise** (`exercise.arabic-plural-basics`): Learn singular-plural pairs such as كتاب/كتب and طالب/طلاب; describe books and people with suitable adjectives.

**Evidence to keep:** Eight noun pairs and four plural descriptions.

**Knowledge check** (`assessment.arabic-plural-basics-check`):

- What agreement is usual with a non-human plural such as كتب?

- Can every plural be predicted by adding one suffix?

- Complete كتب ___ using جديد with ordinary non-human plural agreement.



**Mini challenge** (`exercise.arabic-plural-basics-transfer`): Describe new pictured objects using a supplied plural glossary.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-room`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Eight noun pairs and four plural descriptions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Describe new pictured objects using a supplied plural glossary. Evidence: record support, prompt novelty and task conditions.



#### Topic — Reference

**ID:** `topic.arabic-noun-phrases-reference`



<a id="lesson.arabic-demonstratives"></a>

##### Lesson — This, that and these

**ID:** `lesson.arabic-demonstratives` · **Module:** `module.arabic-noun-phrases` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-nominal-sentences`, `skill.arabic-script-meaning`, `skill.arabic-gender-definiteness`, `skill.arabic-plural-basics`

**Skill:** `skill.arabic-demonstratives`

**Learning objectives:**

- Choose demonstratives for familiar people and objects

- Demonstrate the outcome on a changed prompt: Give directions to the correct picture using a demonstrative.



**Key concepts:** هذا هذه هؤلاء; near/far; non-human plural reference.

**Arabic example:** هَذِهِ كُتُبٌ. — These are books.

**Practical exercise** (`exercise.arabic-demonstratives`): Identify six people or objects from spoken clues; contrast هذه الكتب and هؤلاء الطلاب.

**Evidence to keep:** Six correctly matched clues and four spoken descriptions.

**Knowledge check** (`assessment.arabic-demonstratives-check`):

- Which near demonstrative normally accompanies non-human plural books?

- Is هذا البيت the same structure as هذا بيت?

- Choose هذه or هؤلاء: ___ الكتب جديدة؛ ___ الطلاب هنا.



**Mini challenge** (`exercise.arabic-demonstratives-transfer`): Give directions to the correct picture using a demonstrative.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-room`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six correctly matched clues and four spoken descriptions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Give directions to the correct picture using a demonstrative. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-idafa-possession"></a>

##### Lesson — Possession with iḍāfa and suffixes

**ID:** `lesson.arabic-idafa-possession` · **Module:** `module.arabic-noun-phrases` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-nominal-sentences`, `skill.arabic-script-meaning`, `skill.arabic-gender-definiteness`

**Skill:** `skill.arabic-idafa-possession`

**Learning objectives:**

- Build basic possession phrases and recognise attached possessors

- Demonstrate the outcome on a changed prompt: Build a new possession phrase without translating an English of word.



**Key concepts:** iḍāfa; head noun; كتابي كتابك; definiteness.

**Arabic example:** كِتَابُ الطَّالِبِ — The student's book

**Practical exercise** (`exercise.arabic-idafa-possession`): Contrast كتاب الطالب and كتابي; describe six possessions and correct ال on the first noun of a simple iḍāfa.

**Evidence to keep:** Six possession phrases and two explained corrections.

**Knowledge check** (`assessment.arabic-idafa-possession-check`):

- Does the first noun of a simple iḍāfa normally take ال?

- In كتاب الطالب, whose book is it?

- Write the student's book and my book.



**Mini challenge** (`exercise.arabic-idafa-possession-transfer`): Build a new possession phrase without translating an English of word.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-room`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six possession phrases and two explained corrections submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Build a new possession phrase without translating an English of word. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Nouns, description and possession: guided** (`lab.arabic-noun-phrases-guided`, 45 min, splittable): Label a room or picture set with twelve phrases, including possession, contrast and plural objects.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Nouns, description and possession: transfer** (`lab.arabic-noun-phrases-transfer`, 75 min, splittable): Describe a new room from memory while a partner selects the matching picture.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-noun-phrases-performance` — Describe a new room from memory while a partner selects the matching picture.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** My world in Fuṣḥā (`project.arabic-my-world`)

---



<a id="module.arabic-present-actions"></a>

### Module 06 — Present actions, preferences and routines

**ID:** `module.arabic-present-actions` · **Path:** core · **Target:** A1 · **Difficulty:** 2/6

**Purpose:** Describe familiar actions using a manageable set of present verb patterns.

**Entry prerequisites:** `skill.arabic-simple-questions`, `skill.arabic-adjective-agreement`

**Other skills used by particular lessons:** `skill.arabic-adjective-agreement`, `skill.arabic-idafa-possession`, `skill.arabic-simple-questions`

**Before entry:** Understand subject information, common pronouns and simple nominal sentences.

**Estimated study time:** 22–32 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 15.25–25.25 h.

**Learning objectives:**

- Use a small set of present-tense person forms

- Match common plural verb forms to their subjects

- Distinguish direct objects from prepositional complements

- Express a few preferences, needs and possessions

- Sequence familiar activities with time words and connectors



**Topics:** Present verbs (`topic.arabic-present-actions-present-verbs`); Verb complements (`topic.arabic-present-actions-verb-complements`); Routine discourse (`topic.arabic-present-actions-routine-discourse`)



**Common mistakes:**

- Assuming one present stem vowel works for every verb

- Using free pronouns where an attached object is needed

- Memorising a table without connecting each form to a person



**Understand before progressing:**

- Describe a routine, ask about it and distinguish basic verbal and nominal structures.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Describe a routine, ask about it and distinguish basic verbal and nominal structures.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Present verbs

**ID:** `topic.arabic-present-actions-present-verbs`



<a id="lesson.arabic-present-person"></a>

##### Lesson — Present verbs for I, you, he and she

**ID:** `lesson.arabic-present-person` · **Module:** `module.arabic-present-actions` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-simple-questions`, `skill.arabic-adjective-agreement`

**Skill:** `skill.arabic-present-person`

**Learning objectives:**

- Use a small set of present-tense person forms

- Demonstrate the outcome on a changed prompt: Describe an unfamiliar person's activity from a picture.



**Key concepts:** prefixes; person; gender; lexical stem vowels.

**Arabic example:** أَدْرُسُ الْعَرَبِيَّةَ. — I study Arabic.

**Practical exercise** (`exercise.arabic-present-person`): Use أدرس، تدرس، يدرس، تدرسين with identity cards; practise five common verbs with a reliable model.

**Evidence to keep:** Eight person-correct clauses.

**Knowledge check** (`assessment.arabic-present-person-check`):

- Does the prefix alone always distinguish you-masculine from she?

- Can every present stem vowel be inferred from the past spelling?

- Complete أنا ___ العربية using درس in the present. Then change the subject to هي.



**Mini challenge** (`exercise.arabic-present-person-transfer`): Describe an unfamiliar person's activity from a picture.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-routine`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Eight person-correct clauses submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Describe an unfamiliar person's activity from a picture. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-present-group"></a>

##### Lesson — We, you all and they in useful actions

**ID:** `lesson.arabic-present-group` · **Module:** `module.arabic-present-actions` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-simple-questions`, `skill.arabic-adjective-agreement`, `skill.arabic-present-person`

**Skill:** `skill.arabic-present-group`

**Learning objectives:**

- Match common plural verb forms to their subjects

- Demonstrate the outcome on a changed prompt: Change a short text from I to we.



**Key concepts:** نحن أنتم هم; feminine plural recognition; person suffixes.

**Arabic example:** نَحْنُ نَدْرُسُ. — We study.

**Practical exercise** (`exercise.arabic-present-group`): Describe a study group using نحن ندرس and هم يدرسون; recognise feminine group forms from a supplied chart.

**Evidence to keep:** Six group clauses and a person-change paragraph.

**Knowledge check** (`assessment.arabic-present-group-check`):

- What does ندرس usually tell you about the speaker group?

- Does recognising a rare form mean you can produce it spontaneously?

- Change هو يدرس to we study and they study for a masculine or mixed group.



**Mini challenge** (`exercise.arabic-present-group-transfer`): Change a short text from I to we.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-routine`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six group clauses and a person-change paragraph submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Change a short text from I to we. Evidence: record support, prompt novelty and task conditions.



#### Topic — Verb complements

**ID:** `topic.arabic-present-actions-verb-complements`



<a id="lesson.arabic-objects-prepositions"></a>

##### Lesson — Say who does what to whom

**ID:** `lesson.arabic-objects-prepositions` · **Module:** `module.arabic-present-actions` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-simple-questions`, `skill.arabic-adjective-agreement`, `skill.arabic-present-person`, `skill.arabic-idafa-possession`

**Skill:** `skill.arabic-objects-prepositions`

**Learning objectives:**

- Distinguish direct objects from prepositional complements

- Demonstrate the outcome on a changed prompt: Replace a repeated object with the appropriate taught suffix.



**Key concepts:** verb valency; object noun; attached pronoun; أقرأه.

**Arabic example:** أَقْرَأُ الْكِتَابَ. — I read the book.

**Practical exercise** (`exercise.arabic-objects-prepositions`): Match five familiar verbs to suitable complements; compare أقرأ الكتاب and أذهب إلى المدرسة.

**Evidence to keep:** Six clauses with complements identified.

**Knowledge check** (`assessment.arabic-objects-prepositions-check`):

- Does every Arabic verb take the same preposition as its English equivalent?

- In أقرأه, what does ه refer to?

- Choose the suitable forms: أذهب ___ المدرسة; أقرأ ___, meaning I read it when it refers to الكتاب.



**Mini challenge** (`exercise.arabic-objects-prepositions-transfer`): Replace a repeated object with the appropriate taught suffix.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-routine`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six clauses with complements identified submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Replace a repeated object with the appropriate taught suffix. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-preference-existence"></a>

##### Lesson — Likes, needs and having things

**ID:** `lesson.arabic-preference-existence` · **Module:** `module.arabic-present-actions` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-simple-questions`, `skill.arabic-adjective-agreement`, `skill.arabic-present-person`, `skill.arabic-idafa-possession`

**Skill:** `skill.arabic-preference-existence`

**Learning objectives:**

- Express a few preferences, needs and possessions

- Demonstrate the outcome on a changed prompt: Find one shared preference with a partner.



**Key concepts:** أحب أريد; عندي لدي; lexical chunks.

**Arabic example:** عِنْدِي كِتَابٌ. — I have a book.

**Practical exercise** (`exercise.arabic-preference-existence`): Conduct a picture-supported exchange about food, study materials and preferences using taught chunks.

**Evidence to keep:** A five-turn exchange with two preferences and one need.

**Knowledge check** (`assessment.arabic-preference-existence-check`):

- Must possession always use an English-style have verb?

- Does أريد alone establish how أن works with verbs?

- Write I have a book and I want water using عندي and أريد.



**Mini challenge** (`exercise.arabic-preference-existence-transfer`): Find one shared preference with a partner.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-routine`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A five-turn exchange with two preferences and one need submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Find one shared preference with a partner. Evidence: record support, prompt novelty and task conditions.



#### Topic — Routine discourse

**ID:** `topic.arabic-present-actions-routine-discourse`



<a id="lesson.arabic-routine-sequence"></a>

##### Lesson — Connect a simple daily routine

**ID:** `lesson.arabic-routine-sequence` · **Module:** `module.arabic-present-actions` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-simple-questions`, `skill.arabic-adjective-agreement`, `skill.arabic-present-group`, `skill.arabic-objects-prepositions`

**Skill:** `skill.arabic-routine-sequence`

**Learning objectives:**

- Sequence familiar activities with time words and connectors

- Demonstrate the outcome on a changed prompt: Retell a routine with one changed activity and time.



**Key concepts:** و ثم; usually; morning evening; daily verbs.

**Arabic example:** أَقْرَأُ ثُمَّ أَكْتُبُ. — I read, then I write.

**Practical exercise** (`exercise.arabic-routine-sequence`): Read a six-sentence routine, order picture cards and describe your own or a fictional routine.

**Evidence to keep:** A six-sentence routine and a 45-second retelling.

**Knowledge check** (`assessment.arabic-routine-sequence-check`):

- Do و and ثم always express the same ordering?

- Can a time word help interpret a present verb?

- Write I read, then I write. Which word explicitly places writing after reading?



**Mini challenge** (`exercise.arabic-routine-sequence-transfer`): Retell a routine with one changed activity and time.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-routine`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A six-sentence routine and a 45-second retelling submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Retell a routine with one changed activity and time. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Present actions, preferences and routines: guided** (`lab.arabic-present-actions-guided`, 45 min, splittable): Compare two fictional daily routines using a short recording and a written timetable.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Present actions, preferences and routines: transfer** (`lab.arabic-present-actions-transfer`, 75 min, splittable): Interview a partner about a changed day and write five accurate statements about their answers.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-present-actions-performance` — Interview a partner about a changed day and write five accurate statements about their answers.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** My world in Fuṣḥā (`project.arabic-my-world`)

---



<a id="module.arabic-daily-tasks"></a>

### Module 07 — Numbers, time, place and everyday tasks

**ID:** `module.arabic-daily-tasks` · **Path:** core · **Target:** A1 · **Difficulty:** 2/6

**Purpose:** Use Fuṣḥā in practical simulations while recognising that everyday local speech often uses dialect.

**Entry prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-demonstratives`, `skill.arabic-repair-phrases`

**Other skills used by particular lessons:** `skill.arabic-demonstratives`, `skill.arabic-origin-location`, `skill.arabic-preference-existence`, `skill.arabic-repair-phrases`, `skill.arabic-routine-sequence`

**Before entry:** Understand simple questions, present actions and familiar descriptive phrases.

**Estimated study time:** 22–32 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 15.25–25.25 h.

**Learning objectives:**

- Recognise both common digit sets and communicate simple prices

- Read a weekly schedule and agree a time

- Use location words and short route instructions

- Complete a short supported purchase simulation

- Write and understand a brief practical message



**Topics:** Quantity and time (`topic.arabic-daily-tasks-quantity-and-time`); Places and transactions (`topic.arabic-daily-tasks-places-and-transactions`)



**Common mistakes:**

- Trying to master the entire number system before using prices

- Reversing digits inside RTL text

- Assuming classroom Fuṣḥā is the only form heard in shops



**Understand before progressing:**

- Read prices and times, follow simple directions and handle a supported transaction.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Read prices and times, follow simple directions and handle a supported transaction.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Quantity and time

**ID:** `topic.arabic-daily-tasks-quantity-and-time`



<a id="lesson.arabic-digits-prices"></a>

##### Lesson — Digits and practical quantities

**ID:** `lesson.arabic-digits-prices` · **Module:** `module.arabic-daily-tasks` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-demonstratives`, `skill.arabic-repair-phrases`

**Skill:** `skill.arabic-digits-prices`

**Learning objectives:**

- Recognise both common digit sets and communicate simple prices

- Demonstrate the outcome on a changed prompt: Spot one transposed-digit price in a listening task.



**Key concepts:** ٠١٢٣٤٥٦٧٨٩; 0123456789; 0–100; price chunks.

**Arabic example:** ١٢ / 12 — Twelve in two digit sets

**Practical exercise** (`exercise.arabic-digits-prices`): Match spoken numbers to written prices, then read ten invented price labels; use fixed counted-noun examples before full agreement rules.

**Evidence to keep:** Ten matched prices and five spoken quantities.

**Knowledge check** (`assessment.arabic-digits-prices-check`):

- Must the order of digits be reversed inside an Arabic sentence?

- Does knowing number names mean all counted-noun grammar is mastered?

- Convert ٢٥ and ١٠٢ to Western digits without reversing their order.



**Mini challenge** (`exercise.arabic-digits-prices-transfer`): Spot one transposed-digit price in a listening task.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-appointment`, `asset.arabic-routine`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Ten matched prices and five spoken quantities submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Spot one transposed-digit price in a listening task. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-clock-calendar"></a>

##### Lesson — Times, weekdays and appointments

**ID:** `lesson.arabic-clock-calendar` · **Module:** `module.arabic-daily-tasks` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-demonstratives`, `skill.arabic-repair-phrases`, `skill.arabic-digits-prices`

**Skill:** `skill.arabic-clock-calendar`

**Learning objectives:**

- Read a weekly schedule and agree a time

- Demonstrate the outcome on a changed prompt: Reschedule an appointment after one changed detail.



**Key concepts:** clock time; weekdays; today tomorrow; appointment chunks.

**Arabic example:** السَّاعَةُ الثَّالِثَةُ — Three o'clock

**Practical exercise** (`exercise.arabic-clock-calendar`): Use a fictional study timetable to ask and answer six time questions; verify the agreed day and time aloud.

**Evidence to keep:** A confirmed weekly timetable and one rescheduling exchange.

**Knowledge check** (`assessment.arabic-clock-calendar-check`):

- Why confirm both the day and the time?

- Are clock expressions identical to bare cardinal-number lists?

- Use the timetable: the conversation is on Tuesday at 15:00. Answer متى المحادثة؟ in Arabic.



**Mini challenge** (`exercise.arabic-clock-calendar-transfer`): Reschedule an appointment after one changed detail.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-appointment`, `asset.arabic-routine`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A confirmed weekly timetable and one rescheduling exchange submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Reschedule an appointment after one changed detail. Evidence: record support, prompt novelty and task conditions.



#### Topic — Places and transactions

**ID:** `topic.arabic-daily-tasks-places-and-transactions`



<a id="lesson.arabic-directions-map"></a>

##### Lesson — Locate places and follow short directions

**ID:** `lesson.arabic-directions-map` · **Module:** `module.arabic-daily-tasks` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-demonstratives`, `skill.arabic-repair-phrases`, `skill.arabic-origin-location`

**Skill:** `skill.arabic-directions-map`

**Learning objectives:**

- Use location words and short route instructions

- Demonstrate the outcome on a changed prompt: Find a destination on a new map with the same vocabulary.



**Key concepts:** أمام خلف بجانب; يمين يسار; map landmarks.

**Arabic example:** الْمَكْتَبَةُ بِجَانِبِ الْمَدْرَسَةِ. — The library is beside the school.

**Practical exercise** (`exercise.arabic-directions-map`): Follow a four-step route read by a partner, then give a different route using a simple map.

**Evidence to keep:** Two completed routes and one spoken repair.

**Knowledge check** (`assessment.arabic-directions-map-check`):

- Does knowing each place name guarantee following the route?

- What should you do after losing a route step?

- Read المكتبة بجانب المدرسة. Which building is next to the school? Answer in Arabic.



**Mini challenge** (`exercise.arabic-directions-map-transfer`): Find a destination on a new map with the same vocabulary.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-appointment`, `asset.arabic-routine`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Two completed routes and one spoken repair submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Find a destination on a new map with the same vocabulary. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-food-shopping"></a>

##### Lesson — Order, choose and ask the price

**ID:** `lesson.arabic-food-shopping` · **Module:** `module.arabic-daily-tasks` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-demonstratives`, `skill.arabic-repair-phrases`, `skill.arabic-digits-prices`, `skill.arabic-preference-existence`

**Skill:** `skill.arabic-food-shopping`

**Learning objectives:**

- Complete a short supported purchase simulation

- Demonstrate the outcome on a changed prompt: Choose an alternative while staying within an invented budget.



**Key concepts:** polite request; quantity; availability; food vocabulary.

**Arabic example:** أُرِيدُ مَاءً، مِنْ فَضْلِكَ. — I would like water, please. (to a male)

**Practical exercise** (`exercise.arabic-food-shopping`): Use a six-item menu to request two items, ask a price and respond when one is unavailable.

**Evidence to keep:** A six-turn dialogue with a successful substitution.

**Knowledge check** (`assessment.arabic-food-shopping-check`):

- Is a memorised order enough if the item is unavailable?

- What identifies this as a Fuṣḥā practice simulation?

- Request water politely from a male addressee using أريد and من فضلك.



**Mini challenge** (`exercise.arabic-food-shopping-transfer`): Choose an alternative while staying within an invented budget.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-appointment`, `asset.arabic-routine`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A six-turn dialogue with a successful substitution submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Choose an alternative while staying within an invented budget. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-messages-needs"></a>

##### Lesson — Short messages and everyday needs

**ID:** `lesson.arabic-messages-needs` · **Module:** `module.arabic-daily-tasks` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-demonstratives`, `skill.arabic-repair-phrases`, `skill.arabic-clock-calendar`

**Skill:** `skill.arabic-messages-needs`

**Learning objectives:**

- Write and understand a brief practical message

- Demonstrate the outcome on a changed prompt: Repair a message with an ambiguous time or location.



**Key concepts:** appointment; transport; simple help request; contact detail.

**Arabic example:** أَيْنَ الْمَوْعِدُ؟ — Where is the appointment?

**Practical exercise** (`exercise.arabic-messages-needs`): Read three short fictional messages and write one confirming a meeting, one asking for help and one cancelling politely.

**Evidence to keep:** Three clear messages of one or two sentences.

**Knowledge check** (`assessment.arabic-messages-needs-check`):

- Should unfamiliar health or emergency language be guessed from one keyword?

- What must a meeting confirmation preserve?

- Read موعدنا يوم الثلاثاء في المكتبة. Copy the agreed day and place into a two-item reply.



**Mini challenge** (`exercise.arabic-messages-needs-transfer`): Repair a message with an ambiguous time or location.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-appointment`, `asset.arabic-routine`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Three clear messages of one or two sentences submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repair a message with an ambiguous time or location. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Numbers, time, place and everyday tasks: guided** (`lab.arabic-daily-tasks-guided`, 45 min, splittable): Complete a simulated outing using a timetable, a map and a menu with invented prices.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Numbers, time, place and everyday tasks: transfer** (`lab.arabic-daily-tasks-transfer`, 75 min, splittable): Respond to one changed price, departure time or unavailable item without restarting the dialogue.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-daily-tasks-performance` — Respond to one changed price, departure time or unavailable item without restarting the dialogue.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** My world in Fuṣḥā (`project.arabic-my-world`)

---



<a id="module.arabic-a1-integration"></a>

### Module 08 — A1 consolidation: my world in Fuṣḥā

**ID:** `module.arabic-a1-integration` · **Path:** core · **Target:** A1 · **Difficulty:** 2/6

**Purpose:** Combine early skills in fresh tasks and close gaps before expanding grammar.

**Entry prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-messages-needs`, `skill.arabic-plural-basics`, `skill.arabic-pause-prosody`

**Other skills used by particular lessons:** `skill.arabic-messages-needs`, `skill.arabic-pause-prosody`, `skill.arabic-plural-basics`, `skill.arabic-routine-sequence`, `skill.arabic-script-meaning`

**Before entry:** Use simple descriptions, routines, questions, time and place with support.

**Estimated study time:** 22–32 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 2.5 h; allocated project work: 4–6 h; distributed practice/review: 9.75–17.75 h.

**Learning objectives:**

- Extract key details from a fresh short MSA dialogue

- Find essential information in unfamiliar simple texts

- Sustain a simple two-minute supported exchange

- Write connected simple personal information

- Demonstrate early communicative functions across separate skill samples



**Topics:** Integrated comprehension (`topic.arabic-a1-integration-integrated-comprehension`); Integrated production (`topic.arabic-a1-integration-integrated-production`); Stage checkpoint (`topic.arabic-a1-integration-stage-checkpoint`)



**Common mistakes:**

- Counting a read-aloud as spontaneous speaking

- Reading the transcript before a listening check

- Mistaking lesson completion for a proficiency award



**Understand before progressing:**

- Handle a short unfamiliar exchange and understand simple audio and text without memorising them.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Handle a short unfamiliar exchange and understand simple audio and text without memorising them.



**Practice across the module:**

- Use fresh, comprehensible word/phrase sets on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Integrated comprehension

**ID:** `topic.arabic-a1-integration-integrated-comprehension`



<a id="lesson.arabic-a1-listening"></a>

##### Lesson — Listen for people, place and time

**ID:** `lesson.arabic-a1-listening` · **Module:** `module.arabic-a1-integration` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-messages-needs`, `skill.arabic-plural-basics`, `skill.arabic-pause-prosody`

**Skill:** `skill.arabic-a1-listening`

**Learning objectives:**

- Extract key details from a fresh short MSA dialogue

- Demonstrate the outcome on a changed prompt: Repeat with a second voice and changed time.



**Key concepts:** gist; details; two-pass listening; transcript after attempt.

**Arabic example:** أَيْنَ؟ مَتَى؟ مَنْ؟ — Where? When? Who?

**Practical exercise** (`exercise.arabic-a1-listening`): Use a verified 30–45-second beginner dialogue; identify participants, place and time before seeing text.

**Evidence to keep:** Gist plus three factual answers with replay count recorded.

**Knowledge check** (`assessment.arabic-a1-listening-check`):

- Can topic recognition alone prove detail comprehension?

- When can the transcript be revealed for this assessment?



**Mini challenge** (`exercise.arabic-a1-listening-transfer`): Repeat with a second voice and changed time.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-room`, `asset.arabic-introduction-dialogue`, `asset.arabic-appointment`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Gist plus three factual answers with replay count recorded submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat with a second voice and changed time. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-a1-reading"></a>

##### Lesson — Read profiles, signs and short messages

**ID:** `lesson.arabic-a1-reading` · **Module:** `module.arabic-a1-integration` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-messages-needs`, `skill.arabic-plural-basics`, `skill.arabic-pause-prosody`, `skill.arabic-script-meaning`

**Skill:** `skill.arabic-a1-reading`

**Learning objectives:**

- Find essential information in unfamiliar simple texts

- Demonstrate the outcome on a changed prompt: Match a new message to the correct timetable.



**Key concepts:** scan for facts; sentence versus phrase; partial vowel support.

**Arabic example:** مَكْتَبَة / مَدْرَسَة — Library / school

**Practical exercise** (`exercise.arabic-a1-reading`): Read three fresh texts of 25–50 words with taught language and answer who, where and when questions.

**Evidence to keep:** At least eight of ten information matches.

**Knowledge check** (`assessment.arabic-a1-reading-check`):

- Is translating every word necessary to find a meeting time?

- How should an unknown word that does not block the task be handled?

- Read أنا ليلى. أدرس العربية في الصباح. Answer ما اسم المتحدثة؟ and متى تدرس العربية؟



**Mini challenge** (`exercise.arabic-a1-reading-transfer`): Match a new message to the correct timetable.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-room`, `asset.arabic-introduction-dialogue`, `asset.arabic-appointment`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- At least eight of ten information matches submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Match a new message to the correct timetable. Evidence: record support, prompt novelty and task conditions.



#### Topic — Integrated production

**ID:** `topic.arabic-a1-integration-integrated-production`



<a id="lesson.arabic-a1-speaking"></a>

##### Lesson — Introduce, ask and repair without a script

**ID:** `lesson.arabic-a1-speaking` · **Module:** `module.arabic-a1-integration` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-messages-needs`, `skill.arabic-plural-basics`, `skill.arabic-pause-prosody`, `skill.arabic-a1-listening`

**Skill:** `skill.arabic-a1-speaking`

**Learning objectives:**

- Sustain a simple two-minute supported exchange

- Demonstrate the outcome on a changed prompt: Answer a changed question that was not on your prompt card.



**Key concepts:** turn taking; personal questions; repair; intelligibility.

**Arabic example:** هَلْ أَنْتَ طَالِبٌ؟ — Are you a student? (to a male)

**Practical exercise** (`exercise.arabic-a1-speaking`): Talk with a partner using only picture prompts; include a greeting, three personal facts, two questions and a repair.

**Evidence to keep:** A two-minute exchange and listener feedback.

**Knowledge check** (`assessment.arabic-a1-speaking-check`):

- Does reading your profile aloud count as this interaction?

- Can asking for repetition be successful communication?

- As written preparation only, form a question asking a male partner whether he is a student.



**Mini challenge** (`exercise.arabic-a1-speaking-transfer`): Answer a changed question that was not on your prompt card.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-room`, `asset.arabic-introduction-dialogue`, `asset.arabic-appointment`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A two-minute exchange and listener feedback submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Answer a changed question that was not on your prompt card. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-a1-writing"></a>

##### Lesson — Write a small useful profile

**ID:** `lesson.arabic-a1-writing` · **Module:** `module.arabic-a1-integration` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-messages-needs`, `skill.arabic-plural-basics`, `skill.arabic-pause-prosody`, `skill.arabic-a1-reading`

**Skill:** `skill.arabic-a1-writing`

**Learning objectives:**

- Write connected simple personal information

- Demonstrate the outcome on a changed prompt: Write a second short profile with different details and no model.



**Key concepts:** sentence boundaries; agreement; legibility; revision.

**Arabic example:** أَسْكُنُ فِي مَدِينَةٍ صَغِيرَةٍ. — I live in a small city.

**Practical exercise** (`exercise.arabic-a1-writing`): Write 50–70 words about a fictional or real routine, then revise two meaning-affecting errors after feedback.

**Evidence to keep:** Original draft, feedback and revised profile.

**Knowledge check** (`assessment.arabic-a1-writing-check`):

- Should copying a model be labelled independent composition?

- Which revision matters first: decorative handwriting or unclear meaning?

- Write two true or fictional sentences using أنا and أسكن في.



**Mini challenge** (`exercise.arabic-a1-writing-transfer`): Write a second short profile with different details and no model.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-room`, `asset.arabic-introduction-dialogue`, `asset.arabic-appointment`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Original draft, feedback and revised profile submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Write a second short profile with different details and no model. Evidence: record support, prompt novelty and task conditions.



#### Topic — Stage checkpoint

**ID:** `topic.arabic-a1-integration-stage-checkpoint`



<a id="lesson.arabic-a1-portfolio"></a>

##### Lesson — A1 checkpoint and personal review plan

**ID:** `lesson.arabic-a1-portfolio` · **Module:** `module.arabic-a1-integration` · **Difficulty:** 2/6 · **Target:** A1

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-routine-sequence`, `skill.arabic-messages-needs`, `skill.arabic-plural-basics`, `skill.arabic-pause-prosody`, `skill.arabic-a1-listening`, `skill.arabic-a1-reading`, `skill.arabic-a1-speaking`, `skill.arabic-a1-writing`

**Skill:** `skill.arabic-a1-portfolio`

**Learning objectives:**

- Demonstrate early communicative functions across separate skill samples

- Demonstrate the outcome on a changed prompt: Explain one persistent error and demonstrate its correction a week later.



**Key concepts:** unseen input; independent evidence; uneven profile; next steps.

**Arabic example:** أَتَعَلَّمُ كُلَّ يَوْمٍ. — I learn every day.

**Practical exercise** (`exercise.arabic-a1-portfolio`): Complete the stage checkpoint over short sessions; retest one weak function on a new day.

**Evidence to keep:** A four-skill portfolio and one delayed fresh task.

**Knowledge check** (`assessment.arabic-a1-portfolio-check`):

- Can excellent reading compensate for untested listening in an all-skills milestone?

- Does this internal checkpoint issue an official CEFR certificate?



**Mini challenge** (`exercise.arabic-a1-portfolio-transfer`): Explain one persistent error and demonstrate its correction a week later.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-profile`, `asset.arabic-room`, `asset.arabic-introduction-dialogue`, `asset.arabic-appointment`, `asset.arabic-timetable`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A four-skill portfolio and one delayed fresh task submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain one persistent error and demonstrate its correction a week later. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**A1 consolidation: my world in Fuṣḥā: guided** (`lab.arabic-a1-integration-guided`, 45 min, splittable): Build a four-skill introduction pack: a profile, a short recording, comprehension answers and a partner exchange.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**A1 consolidation: my world in Fuṣḥā: transfer** (`lab.arabic-a1-integration-transfer`, 75 min, splittable): Use a new identity, timetable and message set to repeat the same functions without rehearsing the answers.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-a1-integration-performance` — Use a new identity, timetable and message set to repeat the same functions without rehearsing the answers.

Allow 120 minutes across short sessions, plus 30 minutes for a changed task on another day.

- Overall rubric at least 80/100

- Every required observed modality at least 70/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** My world in Fuṣḥā (`project.arabic-my-world`)

##### Project: My world in Fuṣḥā

**ID:** `project.arabic-my-world`

**Goal:** Introduce a real or fictional person and complete a small practical exchange.

**Required skills:** `skill.arabic-a1-listening`, `skill.arabic-a1-reading`, `skill.arabic-a1-speaking`, `skill.arabic-a1-writing`

**Study time:** 4–6 hours; allocated once to `module.arabic-a1-integration`.

**Deliverables:**

- 50–70-word profile

- One-minute notes-based recording

- Room or routine description

- Two-minute partner exchange with an unexpected change



**Assessment criteria:**

- 25% — Essential personal details are clear

- 25% — Common descriptions and time/place references work

- 25% — The learner responds to changed input

- 25% — Written and spoken evidence are separately recorded



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Demonstrates useful early communication, not just alphabet knowledge.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-past-stories"></a>

### Module 09 — Past events and simple stories

**ID:** `module.arabic-past-stories` · **Path:** core · **Target:** A2 · **Difficulty:** 3/6

**Purpose:** Move from describing routines to recounting completed events.

**Entry prerequisites:** `skill.arabic-a1-portfolio`, `skill.arabic-objects-prepositions`

**Other skills used by particular lessons:** `skill.arabic-a1-portfolio`, `skill.arabic-adjective-agreement`, `skill.arabic-objects-prepositions`

**Before entry:** Use common present verbs and understand persons, objects and basic sequencing.

**Estimated study time:** 26–38 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 19.25–31.25 h.

**Learning objectives:**

- Use common sound-verb past forms with clear subjects

- Ask and answer questions about completed events

- Distinguish past background from completed actions

- Build a short narrative with a meaningful sequence

- Preserve essential facts while retelling rather than copying



**Topics:** Past forms (`topic.arabic-past-stories-past-forms`); Background and sequence (`topic.arabic-past-stories-background-and-sequence`); Narrative transfer (`topic.arabic-past-stories-narrative-transfer`)



**Common mistakes:**

- Translating English tenses mechanically

- Losing who did the action when suffixes change

- Giving a list of verbs without a coherent event sequence



**Understand before progressing:**

- Retell a short past event with participants, order and basic reasons.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Retell a short past event with participants, order and basic reasons.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Past forms

**ID:** `topic.arabic-past-stories-past-forms`



<a id="lesson.arabic-past-suffixes"></a>

##### Lesson — Past verbs and person endings

**ID:** `lesson.arabic-past-suffixes` · **Module:** `module.arabic-past-stories` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a1-portfolio`, `skill.arabic-objects-prepositions`

**Skill:** `skill.arabic-past-suffixes`

**Learning objectives:**

- Use common sound-verb past forms with clear subjects

- Demonstrate the outcome on a changed prompt: Retell four statements with a changed narrator.



**Key concepts:** perfect/past; تُ تَ تِ; نا وا; context.

**Arabic example:** كَتَبْتُ رِسَالَةً. — I wrote a letter.

**Practical exercise** (`exercise.arabic-past-suffixes`): Conjugate كتب and درس through meaningful subject cards, then write eight statements about a completed study day.

**Evidence to keep:** Eight clauses with person endings and meanings.

**Knowledge check** (`assessment.arabic-past-suffixes-check`):

- How do كَتَبْتُ and كَتَبْتَ differ?

- Does every past verb describe the same time relation in every context?

- Give the meanings of كَتَبْتُ and كَتَبْتِ, and identify the final vowel difference.



**Mini challenge** (`exercise.arabic-past-suffixes-transfer`): Retell four statements with a changed narrator.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Eight clauses with person endings and meanings submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Retell four statements with a changed narrator. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-past-questions"></a>

##### Lesson — Ask what happened and recover details

**ID:** `lesson.arabic-past-questions` · **Module:** `module.arabic-past-stories` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a1-portfolio`, `skill.arabic-objects-prepositions`, `skill.arabic-past-suffixes`

**Skill:** `skill.arabic-past-questions`

**Learning objectives:**

- Ask and answer questions about completed events

- Demonstrate the outcome on a changed prompt: Resolve a contradictory date by asking a follow-up.



**Key concepts:** when; where; who; object questions.

**Arabic example:** مَاذَا قَرَأْتَ؟ — What did you read? (to a male)

**Practical exercise** (`exercise.arabic-past-questions`): Interview a partner using a fictional diary with missing details; ask six past-event questions.

**Evidence to keep:** Six exchanges and one clarified contradiction.

**Knowledge check** (`assessment.arabic-past-questions-check`):

- What helps identify the actor when the subject pronoun is omitted?

- Does repeating the last noun always answer the question?

- Read قرأ سامي كتابًا أمس. Write the question that asks what Sami read.



**Mini challenge** (`exercise.arabic-past-questions-transfer`): Resolve a contradictory date by asking a follow-up.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six exchanges and one clarified contradiction submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Resolve a contradictory date by asking a follow-up. Evidence: record support, prompt novelty and task conditions.



#### Topic — Background and sequence

**ID:** `topic.arabic-past-stories-background-and-sequence`



<a id="lesson.arabic-kana-background"></a>

##### Lesson — Describe past states with kāna

**ID:** `lesson.arabic-kana-background` · **Module:** `module.arabic-past-stories` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a1-portfolio`, `skill.arabic-objects-prepositions`, `skill.arabic-past-suffixes`, `skill.arabic-adjective-agreement`

**Skill:** `skill.arabic-kana-background`

**Learning objectives:**

- Distinguish past background from completed actions

- Demonstrate the outcome on a changed prompt: Add two background sentences to a short event account.



**Key concepts:** كان; nominal sentence; past state; كان يدرس preview.

**Arabic example:** كَانَ الْجَوُّ جَمِيلًا. — The weather was beautiful.

**Practical exercise** (`exercise.arabic-kana-background`): Compare هو متعب and كان متعبا in context; describe a place before and after an event.

**Evidence to keep:** A before/after description with a clear timeline.

**Knowledge check** (`assessment.arabic-kana-background-check`):

- What does كان add to a simple descriptive sentence?

- Does كان plus a present verb always translate with one English tense?

- Put الجو جميل into the past with كان, showing the ending of جميل in a fully inflected model.



**Mini challenge** (`exercise.arabic-kana-background-transfer`): Add two background sentences to a short event account.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A before/after description with a clear timeline submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Add two background sentences to a short event account. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-story-connectors"></a>

##### Lesson — Sequence events and give simple reasons

**ID:** `lesson.arabic-story-connectors` · **Module:** `module.arabic-past-stories` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a1-portfolio`, `skill.arabic-objects-prepositions`, `skill.arabic-past-questions`, `skill.arabic-kana-background`

**Skill:** `skill.arabic-story-connectors`

**Learning objectives:**

- Build a short narrative with a meaningful sequence

- Demonstrate the outcome on a changed prompt: Retell the same story from another person's point of view.



**Key concepts:** أولا ثم بعد ذلك; لأن; before/after chunks.

**Arabic example:** ثُمَّ عُدْتُ إِلَى الْبَيْتِ. — Then I returned home.

**Practical exercise** (`exercise.arabic-story-connectors`): Order a five-event picture story, add one background sentence and give one reason.

**Evidence to keep:** A 90-second story with sequence and reason.

**Knowledge check** (`assessment.arabic-story-connectors-check`):

- Does a string of و necessarily show exact chronology?

- What does لأن introduce?

- Join زرت المكتبة and عدت إلى البيت to show that you returned home afterward.



**Mini challenge** (`exercise.arabic-story-connectors-transfer`): Retell the same story from another person's point of view.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A 90-second story with sequence and reason submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Retell the same story from another person's point of view. Evidence: record support, prompt novelty and task conditions.



#### Topic — Narrative transfer

**ID:** `topic.arabic-past-stories-narrative-transfer`



<a id="lesson.arabic-story-retell"></a>

##### Lesson — Retell a new short story faithfully

**ID:** `lesson.arabic-story-retell` · **Module:** `module.arabic-past-stories` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a1-portfolio`, `skill.arabic-objects-prepositions`, `skill.arabic-story-connectors`

**Skill:** `skill.arabic-story-retell`

**Learning objectives:**

- Preserve essential facts while retelling rather than copying

- Demonstrate the outcome on a changed prompt: Retell a changed ending without importing the first ending.



**Key concepts:** who did what; time; summary; paraphrase.

**Arabic example:** فِي الْمَسَاءِ قَرَأْتُ كِتَابًا. — In the evening I read a book.

**Practical exercise** (`exercise.arabic-story-retell`): Listen to or read a 100-word original story, make brief notes and retell it in six to eight sentences; assess the input modality separately.

**Evidence to keep:** Original notes and a fact-checked retelling.

**Knowledge check** (`assessment.arabic-story-retell-check`):

- Must a faithful retelling use exactly the original words?

- What is the difference between an inference and a stated fact?

- Read زارت ليلى المكتبة، لكنها لم تجد الكتاب. State one thing that happened and one that did not.



**Mini challenge** (`exercise.arabic-story-retell-transfer`): Retell a changed ending without importing the first ending.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Original notes and a fact-checked retelling submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Retell a changed ending without importing the first ending. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Past events and simple stories: guided** (`lab.arabic-past-stories-guided`, 45 min, splittable): Listen to a short weekend account and build an event timeline before retelling it.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Past events and simple stories: transfer** (`lab.arabic-past-stories-transfer`, 75 min, splittable): Use different event cards to tell a new story and answer questions about who, when and why.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-past-stories-performance` — Use different event cards to tell a new story and answer questions about who, when and why.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A week, a problem and a new plan (`project.arabic-week-story`)

---



<a id="module.arabic-plans-negation"></a>

### Module 10 — Plans, negation, requests and possibility

**ID:** `module.arabic-plans-negation` · **Path:** core · **Target:** A2 · **Difficulty:** 3/6

**Purpose:** Express what will, will not or should happen without mixing incompatible patterns.

**Entry prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-group`, `skill.arabic-preference-existence`

**Other skills used by particular lessons:** `skill.arabic-kana-background`, `skill.arabic-objects-prepositions`, `skill.arabic-past-suffixes`, `skill.arabic-preference-existence`, `skill.arabic-present-group`, `skill.arabic-repair-phrases`

**Before entry:** Distinguish nominal descriptions, present verbs and common past forms.

**Estimated study time:** 26–38 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 19.25–31.25 h.

**Learning objectives:**

- Use future markers with familiar verbs

- Distinguish common uses of لا ما لم لن and ليس

- Give simple requests with suitable directness

- Use common modal-like constructions with أن and verb complements

- Respond to an unexpected constraint using connected Fuṣḥā



**Topics:** Time and intention (`topic.arabic-plans-negation-time-and-intention`); Requests and ability (`topic.arabic-plans-negation-requests-and-ability`); Interactive transfer (`topic.arabic-plans-negation-interactive-transfer`)



**Common mistakes:**

- Using one negator for every sentence

- Keeping an indicative ending after every particle

- Treating polite fixed chunks as proof of the entire mood system



**Understand before progressing:**

- Make plans, reject or revise them, give simple instructions and express a need.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Make plans, reject or revise them, give simple instructions and express a need.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Time and intention

**ID:** `topic.arabic-plans-negation-time-and-intention`



<a id="lesson.arabic-future-plans"></a>

##### Lesson — Express future plans and intentions

**ID:** `lesson.arabic-future-plans` · **Module:** `module.arabic-plans-negation` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-group`, `skill.arabic-preference-existence`

**Skill:** `skill.arabic-future-plans`

**Learning objectives:**

- Use future markers with familiar verbs

- Demonstrate the outcome on a changed prompt: Revise two plans after receiving new information.



**Key concepts:** سـ; سوف; time adverbs; intention.

**Arabic example:** سَأَدْرُسُ غَدًا. — I will study tomorrow.

**Practical exercise** (`exercise.arabic-future-plans`): Create a five-item future study plan and compare a definite arrangement with an intention in context.

**Evidence to keep:** Five plans and two meaningful revisions.

**Knowledge check** (`assessment.arabic-future-plans-check`):

- Do سـ and سوف attach to ordinary present-form verbs?

- Does a future marker by itself prove certainty?

- Change أدرس اليوم to I will study tomorrow using سـ.



**Mini challenge** (`exercise.arabic-future-plans-transfer`): Revise two plans after receiving new information.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-changed-plan`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Five plans and two meaningful revisions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise two plans after receiving new information. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-negation-system"></a>

##### Lesson — Choose a negation pattern by sentence and time

**ID:** `lesson.arabic-negation-system` · **Module:** `module.arabic-plans-negation` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-group`, `skill.arabic-preference-existence`, `skill.arabic-future-plans`, `skill.arabic-kana-background`

**Skill:** `skill.arabic-negation-system`

**Learning objectives:**

- Distinguish common uses of لا ما لم لن and ليس

- Demonstrate the outcome on a changed prompt: Correct three sentences where a negator mismatches the intended meaning.



**Key concepts:** verbal versus nominal; past/present/future; mood preview.

**Arabic example:** لَمْ أَدْرُسْ أَمْسِ. — I did not study yesterday.

**Practical exercise** (`exercise.arabic-negation-system`): Sort and complete ten examples including لا أدرس، لم أدرس، لن أدرس and لست طالبا; attend to modelled endings.

**Evidence to keep:** Ten context-based choices and three explanations.

**Knowledge check** (`assessment.arabic-negation-system-check`):

- Which particle normally negates a past event using a jussive present-form verb?

- Is ليس simply interchangeable with لا before every verb?

- Negate درست أمس using لم and identify the form of the following verb.



**Mini challenge** (`exercise.arabic-negation-system-transfer`): Correct three sentences where a negator mismatches the intended meaning.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-changed-plan`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Ten context-based choices and three explanations submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Correct three sentences where a negator mismatches the intended meaning. Evidence: record support, prompt novelty and task conditions.



#### Topic — Requests and ability

**ID:** `topic.arabic-plans-negation-requests-and-ability`



<a id="lesson.arabic-requests-imperatives"></a>

##### Lesson — Request, instruct and prohibit politely

**ID:** `lesson.arabic-requests-imperatives` · **Module:** `module.arabic-plans-negation` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-group`, `skill.arabic-preference-existence`, `skill.arabic-negation-system`, `skill.arabic-repair-phrases`

**Skill:** `skill.arabic-requests-imperatives`

**Learning objectives:**

- Give simple requests with suitable directness

- Demonstrate the outcome on a changed prompt: Give instructions to a partner who asks for clarification.



**Key concepts:** imperative; لا الناهية; من فضلك; address gender.

**Arabic example:** اِفْتَحِ الْكِتَابَ. — Open the book. (connected pronunciation)

**Practical exercise** (`exercise.arabic-requests-imperatives`): Use taught sound verbs to write a four-step study instruction; turn two steps into polite requests and one into a prohibition.

**Evidence to keep:** Four understandable instructions and one repaired exchange.

**Knowledge check** (`assessment.arabic-requests-imperatives-check`):

- Does a prohibition use the same grammatical pattern as a simple statement of not doing?

- Can a grammatically correct command sound too abrupt?

- Give an affirmative and a negative instruction to one male learner with كتب, meaning Write and Do not write.



**Mini challenge** (`exercise.arabic-requests-imperatives-transfer`): Give instructions to a partner who asks for clarification.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-changed-plan`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Four understandable instructions and one repaired exchange submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Give instructions to a partner who asks for clarification. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-modal-complements"></a>

##### Lesson — Want, can and need to do something

**ID:** `lesson.arabic-modal-complements` · **Module:** `module.arabic-plans-negation` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-group`, `skill.arabic-preference-existence`, `skill.arabic-future-plans`, `skill.arabic-objects-prepositions`

**Skill:** `skill.arabic-modal-complements`

**Learning objectives:**

- Use common modal-like constructions with أن and verb complements

- Demonstrate the outcome on a changed prompt: Negotiate one realistic plan with a partner.



**Key concepts:** أريد أن; أستطيع أن; يجب أن; complement patterns.

**Arabic example:** أُرِيدُ أَنْ أَتَعَلَّمَ. — I want to learn.

**Practical exercise** (`exercise.arabic-modal-complements`): Express five goals and constraints using supplied reliable models; compare a noun object with an أن-clause.

**Evidence to keep:** Five complete statements and a negotiated plan.

**Knowledge check** (`assessment.arabic-modal-complements-check`):

- What follows أن in أريد أن أدرس?

- Should English can be translated word for word in every sentence?

- Complete أريد أن ___ العربية using أتعلم, showing the targeted ending.



**Mini challenge** (`exercise.arabic-modal-complements-transfer`): Negotiate one realistic plan with a partner.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-changed-plan`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Five complete statements and a negotiated plan submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Negotiate one realistic plan with a partner. Evidence: record support, prompt novelty and task conditions.



#### Topic — Interactive transfer

**ID:** `topic.arabic-plans-negation-interactive-transfer`



<a id="lesson.arabic-plans-dialogue"></a>

##### Lesson — Negotiate a plan and explain a change

**ID:** `lesson.arabic-plans-dialogue` · **Module:** `module.arabic-plans-negation` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-group`, `skill.arabic-preference-existence`, `skill.arabic-negation-system`, `skill.arabic-requests-imperatives`, `skill.arabic-modal-complements`

**Skill:** `skill.arabic-plans-dialogue`

**Learning objectives:**

- Respond to an unexpected constraint using connected Fuṣḥā

- Demonstrate the outcome on a changed prompt: Repeat with a different problem and fewer prompts.



**Key concepts:** accept/reject; reason; alternative; confirmation.

**Arabic example:** لَا أَسْتَطِيعُ أَنْ أَحْضُرَ. — I cannot attend.

**Practical exercise** (`exercise.arabic-plans-dialogue`): Role-play a study appointment: one person cannot attend, so agree another time and confirm it in writing.

**Evidence to keep:** A three-minute exchange and clear confirmation.

**Knowledge check** (`assessment.arabic-plans-dialogue-check`):

- What makes this an interaction rather than two monologues?

- Which details must survive the written confirmation?

- Reply to هل تستطيع أن تحضر يوم الثلاثاء؟ by declining Tuesday and suggesting Wednesday in simple MSA.



**Mini challenge** (`exercise.arabic-plans-dialogue-transfer`): Repeat with a different problem and fewer prompts.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-changed-plan`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A three-minute exchange and clear confirmation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat with a different problem and fewer prompts. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Plans, negation, requests and possibility: guided** (`lab.arabic-plans-negation-guided`, 45 min, splittable): Plan a fictional weekend with constraints and revise it after a cancellation.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Plans, negation, requests and possibility: transfer** (`lab.arabic-plans-negation-transfer`, 75 min, splittable): Explain what happened, what did not happen and what you intend to do next using fresh details.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-plans-negation-performance` — Explain what happened, what did not happen and what you intend to do next using fresh details.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A week, a problem and a new plan (`project.arabic-week-story`)

---



<a id="module.arabic-relationships-case"></a>

### Module 11 — Relationships, agreement and useful case awareness

**ID:** `module.arabic-relationships-case` · **Path:** core · **Target:** A2 · **Difficulty:** 3/6

**Purpose:** Make relationships among words visible without making full vocalisation a barrier to communication.

**Entry prerequisites:** `skill.arabic-idafa-possession`, `skill.arabic-plural-basics`, `skill.arabic-negation-system`

**Other skills used by particular lessons:** `skill.arabic-adjective-agreement`, `skill.arabic-digits-prices`, `skill.arabic-idafa-possession`, `skill.arabic-kana-background`, `skill.arabic-negation-system`, `skill.arabic-objects-prepositions`, `skill.arabic-plural-basics`, `skill.arabic-present-group`

**Before entry:** Use simple iḍāfa, adjectives, pronouns and familiar sentence patterns.

**Estimated study time:** 26–38 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 19.25–31.25 h.

**Learning objectives:**

- Identify the role of a suffix from its host word

- Explain core case roles in a limited set of fully marked sentences

- Interpret which noun an adjective describes inside a noun chain

- Recognise dual and sound plural forms across common roles

- Use common comparisons and controlled number-noun patterns



**Topics:** Reference chains (`topic.arabic-relationships-case-reference-chains`); Grammar for meaning (`topic.arabic-relationships-case-grammar-for-meaning`)



**Common mistakes:**

- Putting tanwīn on the first noun of iḍāfa

- Scoring pausal speech as if it were full connected recitation

- Matching an adjective to the wrong noun in a possession chain



**Understand before progressing:**

- Track possession and reference, recognise core grammatical roles and edit frequent agreement errors.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Track possession and reference, recognise core grammatical roles and edit frequent agreement errors.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Reference chains

**ID:** `topic.arabic-relationships-case-reference-chains`



<a id="lesson.arabic-pronoun-attachment"></a>

##### Lesson — Attach pronouns to nouns, verbs and prepositions

**ID:** `lesson.arabic-pronoun-attachment` · **Module:** `module.arabic-relationships-case` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-idafa-possession`, `skill.arabic-plural-basics`, `skill.arabic-negation-system`

**Skill:** `skill.arabic-pronoun-attachment`

**Learning objectives:**

- Identify the role of a suffix from its host word

- Demonstrate the outcome on a changed prompt: Replace repeated nouns with suffixes while preserving reference.



**Key concepts:** possessor; object; prepositional pronoun; ة becomes ت.

**Arabic example:** مَدْرَسَتُهَا — Her school

**Practical exercise** (`exercise.arabic-pronoun-attachment`): Compare كتابها، قرأتها، لها and مدرستها; label the host and referent for ten examples.

**Evidence to keep:** Ten labelled examples and a revised paragraph.

**Knowledge check** (`assessment.arabic-pronoun-attachment-check`):

- Does ها always mean the same grammatical relationship?

- What normally happens to ة before a possessive suffix?

- Add her to مدرسة and explain ها in قرأها when it refers to الرسالة.



**Mini challenge** (`exercise.arabic-pronoun-attachment-transfer`): Replace repeated nouns with suffixes while preserving reference.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Ten labelled examples and a revised paragraph submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Replace repeated nouns with suffixes while preserving reference. Evidence: record support, prompt novelty and task conditions.



#### Topic — Grammar for meaning

**ID:** `topic.arabic-relationships-case-grammar-for-meaning`



<a id="lesson.arabic-case-roles"></a>

##### Lesson — Recognise subject, object and prepositional roles

**ID:** `lesson.arabic-case-roles` · **Module:** `module.arabic-relationships-case` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-idafa-possession`, `skill.arabic-plural-basics`, `skill.arabic-negation-system`, `skill.arabic-objects-prepositions`, `skill.arabic-kana-background`

**Skill:** `skill.arabic-case-roles`

**Learning objectives:**

- Explain core case roles in a limited set of fully marked sentences

- Demonstrate the outcome on a changed prompt: Explain a new sentence's roles before adding any endings.



**Key concepts:** nominative; accusative; genitive; case versus mood.

**Arabic example:** قَرَأَ الطَّالِبُ الْكِتَابَ. — The student read the book.

**Practical exercise** (`exercise.arabic-case-roles`): Mark roles in six sentences and compare visible endings; distinguish case teaching from ordinary unvowelled writing.

**Evidence to keep:** Six role maps and one fresh explanation.

**Knowledge check** (`assessment.arabic-case-roles-check`):

- What case commonly follows a preposition?

- Does every grammatical role have a visible short-vowel ending in every word?

- In قرأ الطالبُ الكتابَ في البيتِ, label الطالب, الكتاب and البيت by role and case.



**Mini challenge** (`exercise.arabic-case-roles-transfer`): Explain a new sentence's roles before adding any endings.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Six role maps and one fresh explanation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain a new sentence's roles before adding any endings. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-idafa-chains"></a>

##### Lesson — Longer possession phrases and adjective attachment

**ID:** `lesson.arabic-idafa-chains` · **Module:** `module.arabic-relationships-case` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-idafa-possession`, `skill.arabic-plural-basics`, `skill.arabic-negation-system`, `skill.arabic-pronoun-attachment`, `skill.arabic-case-roles`

**Skill:** `skill.arabic-idafa-chains`

**Learning objectives:**

- Interpret which noun an adjective describes inside a noun chain

- Demonstrate the outcome on a changed prompt: Rewrite an ambiguous phrase as an unambiguous clause.



**Key concepts:** iḍāfa definiteness; no head tanwīn; attachment; ambiguity.

**Arabic example:** بَابُ بَيْتِ الطَّالِبِ — The door of the student's house

**Practical exercise** (`exercise.arabic-idafa-chains`): Build phrases for a student's book and a school library, then revise ambiguous adjective attachment using a clearer sentence.

**Evidence to keep:** Six noun chains and two clarity revisions.

**Knowledge check** (`assessment.arabic-idafa-chains-check`):

- Where does definiteness in a simple iḍāfa come from?

- Can an adjective's placement and agreement affect which noun it describes?

- Who owns the house in باب بيت الطالب? Which noun denotes the door?



**Mini challenge** (`exercise.arabic-idafa-chains-transfer`): Rewrite an ambiguous phrase as an unambiguous clause.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Six noun chains and two clarity revisions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Rewrite an ambiguous phrase as an unambiguous clause. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-dual-sound-plurals"></a>

##### Lesson — Two things and regular plural endings

**ID:** `lesson.arabic-dual-sound-plurals` · **Module:** `module.arabic-relationships-case` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-idafa-possession`, `skill.arabic-plural-basics`, `skill.arabic-negation-system`, `skill.arabic-case-roles`, `skill.arabic-present-group`

**Skill:** `skill.arabic-dual-sound-plurals`

**Learning objectives:**

- Recognise dual and sound plural forms across common roles

- Demonstrate the outcome on a changed prompt: Identify a dual form in a fresh paragraph without a chart.



**Key concepts:** ان/ين; ون/ين; ات; dual pronouns preview.

**Arabic example:** كِتَابَانِ / كِتَابَيْنِ — Two books, nominative / oblique

**Practical exercise** (`exercise.arabic-dual-sound-plurals`): Describe two books and groups of students using supplied nominative and oblique examples; contrast feminine plural endings.

**Evidence to keep:** Eight form-to-role matches and four descriptions.

**Knowledge check** (`assessment.arabic-dual-sound-plurals-check`):

- Do كتابان and كتابين indicate different quantities?

- Do sound feminine plurals take fatḥa in the accusative like every singular noun?

- Write the dual of كتاب as a nominative label, then use the correct form after رأيت to mean I saw two books.



**Mini challenge** (`exercise.arabic-dual-sound-plurals-transfer`): Identify a dual form in a fresh paragraph without a chart.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Eight form-to-role matches and four descriptions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Identify a dual form in a fresh paragraph without a chart. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-quantity-comparison"></a>

##### Lesson — Compare familiar things and count carefully

**ID:** `lesson.arabic-quantity-comparison` · **Module:** `module.arabic-relationships-case` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-idafa-possession`, `skill.arabic-plural-basics`, `skill.arabic-negation-system`, `skill.arabic-digits-prices`, `skill.arabic-adjective-agreement`

**Skill:** `skill.arabic-quantity-comparison`

**Learning objectives:**

- Use common comparisons and controlled number-noun patterns

- Demonstrate the outcome on a changed prompt: Describe a new comparison with one verified counted phrase.



**Key concepts:** أكبر من; أكثر; 1–2 agreement; 3–10 polarity introduction.

**Arabic example:** هَذَا الْبَيْتُ أَكْبَرُ مِنْ ذَلِكَ الْبَيْتِ. — This house is bigger than that house.

**Practical exercise** (`exercise.arabic-quantity-comparison`): Compare two rooms or schedules and use modelled counts from three to ten with singular noun gender identified.

**Evidence to keep:** Five comparisons and five checked number phrases.

**Knowledge check** (`assessment.arabic-quantity-comparison-check`):

- What noun gender is consulted for 3–10 polarity?

- Does a comparative always translate with an English -er ending?

- Write three books using كتاب and a correctly agreeing number.



**Mini challenge** (`exercise.arabic-quantity-comparison-transfer`): Describe a new comparison with one verified counted phrase.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Five comparisons and five checked number phrases submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Describe a new comparison with one verified counted phrase. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Relationships, agreement and useful case awareness: guided** (`lab.arabic-relationships-case-guided`, 45 min, splittable): Annotate a room-description text for owners, head nouns, adjectives and pronoun referents.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Relationships, agreement and useful case awareness: transfer** (`lab.arabic-relationships-case-transfer`, 75 min, splittable): Write a new description with two possession chains and explain possible ambiguity before revising it.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-relationships-case-performance` — Write a new description with two possession chains and explain possible ambiguity before revising it.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A week, a problem and a new plan (`project.arabic-week-story`)

---



<a id="module.arabic-morphology-lookup"></a>

### Module 12 — Roots, patterns and dictionary independence

**ID:** `module.arabic-morphology-lookup` · **Path:** core · **Target:** A2 · **Difficulty:** 3/6

**Purpose:** Use morphology as a helpful hypothesis while verifying actual word meanings.

**Entry prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-person`, `skill.arabic-pronoun-attachment`, `skill.arabic-script-meaning`

**Other skills used by particular lessons:** `skill.arabic-objects-prepositions`, `skill.arabic-past-suffixes`, `skill.arabic-present-person`, `skill.arabic-pronoun-attachment`, `skill.arabic-script-meaning`

**Before entry:** Recognise common prefixes and suffixes and understand simple clauses.

**Estimated study time:** 26–38 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 19.25–31.25 h.

**Learning objectives:**

- Separate a root, a pattern and a specific lexical meaning

- Segment common attachments without damaging the stem

- Locate a lemma and choose the sense that fits a sentence

- Distinguish an action noun from common agent and result forms

- Create separate receptive and productive vocabulary evidence



**Topics:** Morphological families (`topic.arabic-morphology-lookup-morphological-families`); Decoding and dictionary workflow (`topic.arabic-morphology-lookup-dictionary-workflow`); Vocabulary independence (`topic.arabic-morphology-lookup-vocabulary-independence`)



**Common mistakes:**

- Assuming every three visible letters are the root

- Inventing meanings from a pattern alone

- Deleting root letters while stripping suffixes



**Understand before progressing:**

- Separate common clitics, look up a word and store its meaning, pattern and usage in context.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Separate common clitics, look up a word and store its meaning, pattern and usage in context.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Morphological families

**ID:** `topic.arabic-morphology-lookup-morphological-families`



<a id="lesson.arabic-root-pattern"></a>

##### Lesson — See word families without guessing meaning

**ID:** `lesson.arabic-root-pattern` · **Module:** `module.arabic-morphology-lookup` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-person`, `skill.arabic-pronoun-attachment`, `skill.arabic-script-meaning`

**Skill:** `skill.arabic-root-pattern`

**Learning objectives:**

- Separate a root, a pattern and a specific lexical meaning

- Demonstrate the outcome on a changed prompt: Explain one word-family relationship without claiming it is a complete rule.



**Key concepts:** جذر; وزن; كتب family; lexical exceptions.

**Arabic example:** كَاتِب / مَكْتُوب / مَكْتَبَة — Writer / written / library

**Practical exercise** (`exercise.arabic-root-pattern`): Group كتب، كاتب، مكتوب، كتاب، مكتبة and describe what is shared; verify each meaning in a dictionary.

**Evidence to keep:** A five-word family map with verified meanings.

**Knowledge check** (`assessment.arabic-root-pattern-check`):

- Does a shared root make two words synonyms?

- Can a pattern alone always determine meaning?

- Identify the root shared by كاتب, مكتوب and مكتبة, then explain why a dictionary is still needed.



**Mini challenge** (`exercise.arabic-root-pattern-transfer`): Explain one word-family relationship without claiming it is a complete rule.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- A five-word family map with verified meanings submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain one word-family relationship without claiming it is a complete rule. Evidence: record support, prompt novelty and task conditions.



#### Topic — Decoding and dictionary workflow

**ID:** `topic.arabic-morphology-lookup-dictionary-workflow`



<a id="lesson.arabic-clitic-segmentation"></a>

##### Lesson — Find the word inside attached particles

**ID:** `lesson.arabic-clitic-segmentation` · **Module:** `module.arabic-morphology-lookup` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-person`, `skill.arabic-pronoun-attachment`, `skill.arabic-script-meaning`, `skill.arabic-root-pattern`

**Skill:** `skill.arabic-clitic-segmentation`

**Learning objectives:**

- Segment common attachments without damaging the stem

- Demonstrate the outcome on a changed prompt: Analyse a new attached form and justify each boundary.



**Key concepts:** و ف ب ل ك; ال; pronoun suffix; stem ambiguity.

**Arabic example:** وَبِالْكِتَابِ — And with/by the book

**Practical exercise** (`exercise.arabic-clitic-segmentation`): Segment وبالكتاب and وكتابها, then analyse eight similar forms; preserve alternative analyses where needed.

**Evidence to keep:** Ten segmented forms with uncertainty labels.

**Knowledge check** (`assessment.arabic-clitic-segmentation-check`):

- Is every initial و an attached conjunction?

- What should happen when two segmentations fit the spelling?

- Segment وبالكتاب into conjunction, preposition, article and noun.



**Mini challenge** (`exercise.arabic-clitic-segmentation-transfer`): Analyse a new attached form and justify each boundary.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- Ten segmented forms with uncertainty labels submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Analyse a new attached form and justify each boundary. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-dictionary-method"></a>

##### Lesson — Use alphabetical and root-based references

**ID:** `lesson.arabic-dictionary-method` · **Module:** `module.arabic-morphology-lookup` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-person`, `skill.arabic-pronoun-attachment`, `skill.arabic-script-meaning`, `skill.arabic-clitic-segmentation`

**Skill:** `skill.arabic-dictionary-method`

**Learning objectives:**

- Locate a lemma and choose the sense that fits a sentence

- Demonstrate the outcome on a changed prompt: Reject a tempting but wrong sense using contextual evidence.



**Key concepts:** lemma; root lookup; part of speech; register label.

**Arabic example:** كِتَابٌ / كُتُبٌ — Book / books

**Practical exercise** (`exercise.arabic-dictionary-method`): Look up five everyday words in a beginner bilingual reference such as Oxford Essential Arabic Dictionary, using sentence context. Compare alphabetical and root-based lookup with an appropriate reference; optionally inspect one advanced Qabas entry with help. Record the selected sense and one usage example.

**Evidence to keep:** Five justified dictionary entries with source links.

**Knowledge check** (`assessment.arabic-dictionary-method-check`):

- Must every dictionary be searched by root?

- Why inspect a usage example instead of taking the first gloss?

- You meet عين in an unfamiliar sentence. What two pieces of context would you keep before choosing a dictionary sense?



**Mini challenge** (`exercise.arabic-dictionary-method-transfer`): Reject a tempting but wrong sense using contextual evidence.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- Five justified dictionary entries with source links submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Reject a tempting but wrong sense using contextual evidence. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-participles-masdar"></a>

##### Lesson — Recognise common participles and verbal nouns

**ID:** `lesson.arabic-participles-masdar` · **Module:** `module.arabic-morphology-lookup` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-person`, `skill.arabic-pronoun-attachment`, `skill.arabic-script-meaning`, `skill.arabic-root-pattern`, `skill.arabic-objects-prepositions`

**Skill:** `skill.arabic-participles-masdar`

**Learning objectives:**

- Distinguish an action noun from common agent and result forms

- Demonstrate the outcome on a changed prompt: Classify three unfamiliar forms using a dictionary and context.



**Key concepts:** اسم فاعل; اسم مفعول; مصدر; usage context.

**Arabic example:** كِتَابَة — Writing

**Practical exercise** (`exercise.arabic-participles-masdar`): Compare كاتب، مكتوب، كتابة inside short sentences and use each in a supplied frame; verify meaning rather than translate endings mechanically.

**Evidence to keep:** Nine classifications and three original frames.

**Knowledge check** (`assessment.arabic-participles-masdar-check`):

- Does a participle always act exactly like an English verb tense?

- What does كتابة commonly name?

- Match كاتب, مكتوب and كتابة to writer, written and writing as an activity.



**Mini challenge** (`exercise.arabic-participles-masdar-transfer`): Classify three unfamiliar forms using a dictionary and context.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- Nine classifications and three original frames submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Classify three unfamiliar forms using a dictionary and context. Evidence: record support, prompt novelty and task conditions.



#### Topic — Vocabulary independence

**ID:** `topic.arabic-morphology-lookup-vocabulary-independence`



<a id="lesson.arabic-vocabulary-records"></a>

##### Lesson — Learn words with meaning, sound and use

**ID:** `lesson.arabic-vocabulary-records` · **Module:** `module.arabic-morphology-lookup` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-past-suffixes`, `skill.arabic-present-person`, `skill.arabic-pronoun-attachment`, `skill.arabic-script-meaning`, `skill.arabic-dictionary-method`, `skill.arabic-participles-masdar`

**Skill:** `skill.arabic-vocabulary-records`

**Learning objectives:**

- Create separate receptive and productive vocabulary evidence

- Demonstrate the outcome on a changed prompt: Use five cards in a new short message a week later.



**Key concepts:** lemma and sense; plural; verb pair; collocation; retrieval.

**Arabic example:** قَرَأَ / يَقْرَأُ — He read / he reads

**Practical exercise** (`exercise.arabic-vocabulary-records`): Build ten cards from useful context: include meaning, model audio when available, plural or past-present pair, one collocation and your sentence.

**Evidence to keep:** Ten sourced entries and one delayed production task.

**Knowledge check** (`assessment.arabic-vocabulary-records-check`):

- Does recognising a flashcard prove spontaneous use?

- Should all senses of a word be learned at once?

- Create a short record for قرأ containing the past form, present form and a useful object.



**Mini challenge** (`exercise.arabic-vocabulary-records-transfer`): Use five cards in a new short message a week later.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-mastering`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- Ten sourced entries and one delayed production task submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Use five cards in a new short message a week later. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Roots, patterns and dictionary independence: guided** (`lab.arabic-morphology-lookup-guided`, 45 min, splittable): Build a twelve-item vocabulary notebook from one short text, with a justified lookup path for each item.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Roots, patterns and dictionary independence: transfer** (`lab.arabic-morphology-lookup-transfer`, 75 min, splittable): Look up five unfamiliar words from another text and reject one plausible but contextually wrong meaning.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-morphology-lookup-performance` — Look up five unfamiliar words from another text and reject one plausible but contextually wrong meaning.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A week, a problem and a new plan (`project.arabic-week-story`)

---



<a id="module.arabic-a2-integration"></a>

### Module 13 — A2 consolidation: stories, plans and practical reading

**ID:** `module.arabic-a2-integration` · **Path:** core · **Target:** A2 · **Difficulty:** 3/6

**Purpose:** Integrate expanding grammar into useful, comprehensible language.

**Entry prerequisites:** `skill.arabic-story-retell`, `skill.arabic-plans-dialogue`, `skill.arabic-idafa-chains`, `skill.arabic-quantity-comparison`, `skill.arabic-vocabulary-records`

**Other skills used by particular lessons:** `skill.arabic-dictionary-method`, `skill.arabic-idafa-chains`, `skill.arabic-plans-dialogue`, `skill.arabic-quantity-comparison`, `skill.arabic-story-retell`, `skill.arabic-vocabulary-records`

**Before entry:** Narrate simple events, plan future action and use a dictionary selectively.

**Estimated study time:** 26–38 hours. Initial lessons: 3.75 h; labs: 2 h; assessment and delayed check: 2.5 h; allocated project work: 5–8 h; distributed practice/review: 12.75–21.75 h.

**Learning objectives:**

- Follow a verified 60–90-second MSA account

- Read 120–180 words with selective lookup

- Sustain a four-minute task-focused exchange in learning-context MSA

- Write 100–150 words that connect past, present and future

- Demonstrate routine independence across the four skills



**Topics:** Integrated comprehension (`topic.arabic-a2-integration-integrated-comprehension`); Integrated production (`topic.arabic-a2-integration-integrated-production`); Stage checkpoint (`topic.arabic-a2-integration-stage-checkpoint`)



**Common mistakes:**

- Choosing material that requires looking up every line

- Using translation software to hide comprehension gaps

- Rehearsing one task until it no longer tests transfer



**Understand before progressing:**

- Understand supported connected input and exchange routine information with increasing independence.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Understand supported connected input and exchange routine information with increasing independence.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Integrated comprehension

**ID:** `topic.arabic-a2-integration-integrated-comprehension`



<a id="lesson.arabic-a2-listening"></a>

##### Lesson — Follow a short account and practical instructions

**ID:** `lesson.arabic-a2-listening` · **Module:** `module.arabic-a2-integration` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-story-retell`, `skill.arabic-plans-dialogue`, `skill.arabic-idafa-chains`, `skill.arabic-quantity-comparison`, `skill.arabic-vocabulary-records`

**Skill:** `skill.arabic-a2-listening`

**Learning objectives:**

- Follow a verified 60–90-second MSA account

- Demonstrate the outcome on a changed prompt: Try a second recording with one fewer replay.



**Key concepts:** sequence; negation; time change; selective notes.

**Arabic example:** أَمْسِ / غَدًا — Yesterday / tomorrow

**Practical exercise** (`exercise.arabic-a2-listening`): Listen without a transcript, make a five-point timeline and identify one thing that did not happen.

**Evidence to keep:** Gist, timeline and negation check with support recorded.

**Knowledge check** (`assessment.arabic-a2-listening-check`):

- Why can missing a negator reverse comprehension?

- Do pauses and replay make practice invalid?



**Mini challenge** (`exercise.arabic-a2-listening-transfer`): Try a second recording with one fewer replay.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`, `asset.arabic-changed-plan`, `asset.arabic-notice`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Gist, timeline and negation check with support recorded submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Try a second recording with one fewer replay. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-a2-reading"></a>

##### Lesson — Read a short narrative and practical notice

**ID:** `lesson.arabic-a2-reading` · **Module:** `module.arabic-a2-integration` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-story-retell`, `skill.arabic-plans-dialogue`, `skill.arabic-idafa-chains`, `skill.arabic-quantity-comparison`, `skill.arabic-vocabulary-records`, `skill.arabic-dictionary-method`

**Skill:** `skill.arabic-a2-reading`

**Learning objectives:**

- Read 120–180 words with selective lookup

- Demonstrate the outcome on a changed prompt: Summarise a fresh paragraph after at most three lookups.



**Key concepts:** paragraph gist; reference; essential versus optional words.

**Arabic example:** بَعْدَ ذَلِكَ — After that

**Practical exercise** (`exercise.arabic-a2-reading`): Read one original narrative and one notice; identify the purpose, five facts and two pronoun referents.

**Evidence to keep:** Two comprehension records and a lookup log.

**Knowledge check** (`assessment.arabic-a2-reading-check`):

- Must every new word become a flashcard?

- Can an inferred meaning be recorded as certain?

- Read المكتبة مغلقة يوم السبت. تفتح يوم الأحد. State the closed day and the opening day.



**Mini challenge** (`exercise.arabic-a2-reading-transfer`): Summarise a fresh paragraph after at most three lookups.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`, `asset.arabic-changed-plan`, `asset.arabic-notice`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Two comprehension records and a lookup log submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Summarise a fresh paragraph after at most three lookups. Evidence: record support, prompt novelty and task conditions.



#### Topic — Integrated production

**ID:** `topic.arabic-a2-integration-integrated-production`



<a id="lesson.arabic-a2-interaction"></a>

##### Lesson — Exchange information and solve a routine problem

**ID:** `lesson.arabic-a2-interaction` · **Module:** `module.arabic-a2-integration` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-story-retell`, `skill.arabic-plans-dialogue`, `skill.arabic-idafa-chains`, `skill.arabic-quantity-comparison`, `skill.arabic-vocabulary-records`, `skill.arabic-a2-listening`

**Skill:** `skill.arabic-a2-interaction`

**Learning objectives:**

- Sustain a four-minute task-focused exchange in learning-context MSA

- Demonstrate the outcome on a changed prompt: Repeat with a new conflict and fewer visual prompts.



**Key concepts:** follow-up; negotiation; repair; information gap.

**Arabic example:** مَا رَأْيُكَ؟ — What do you think? (to a male)

**Practical exercise** (`exercise.arabic-a2-interaction`): Use different timetable cards with a partner to arrange a shared activity and resolve one conflict.

**Evidence to keep:** A four-minute exchange with an agreed outcome.

**Knowledge check** (`assessment.arabic-a2-interaction-check`):

- Why must partners have different information?

- Is one accent or speaker enough for robust listening evidence?

- You can meet Wednesday but not Tuesday. Write one response and one follow-up question to propose a time.



**Mini challenge** (`exercise.arabic-a2-interaction-transfer`): Repeat with a new conflict and fewer visual prompts.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`, `asset.arabic-changed-plan`, `asset.arabic-notice`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A four-minute exchange with an agreed outcome submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat with a new conflict and fewer visual prompts. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-a2-composition"></a>

##### Lesson — Write a coherent short account and plan

**ID:** `lesson.arabic-a2-composition` · **Module:** `module.arabic-a2-integration` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-story-retell`, `skill.arabic-plans-dialogue`, `skill.arabic-idafa-chains`, `skill.arabic-quantity-comparison`, `skill.arabic-vocabulary-records`, `skill.arabic-a2-reading`

**Skill:** `skill.arabic-a2-composition`

**Learning objectives:**

- Write 100–150 words that connect past, present and future

- Demonstrate the outcome on a changed prompt: Write a shorter message conveying the same essential facts.



**Key concepts:** paragraph sequence; time consistency; reference; revision.

**Arabic example:** فِي الْأُسْبُوعِ الْقَادِمِ — Next week

**Practical exercise** (`exercise.arabic-a2-composition`): Write about a fictional week, include one problem and future response, then revise using a focused checklist.

**Evidence to keep:** Draft, revision and concise alternative.

**Knowledge check** (`assessment.arabic-a2-composition-check`):

- Does longer writing automatically show better control?

- Which errors deserve first attention?

- Write two linked sentences: one thing you did yesterday and one thing you will do tomorrow.



**Mini challenge** (`exercise.arabic-a2-composition-transfer`): Write a shorter message conveying the same essential facts.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`, `asset.arabic-changed-plan`, `asset.arabic-notice`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Draft, revision and concise alternative submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Write a shorter message conveying the same essential facts. Evidence: record support, prompt novelty and task conditions.



#### Topic — Stage checkpoint

**ID:** `topic.arabic-a2-integration-stage-checkpoint`



<a id="lesson.arabic-a2-portfolio"></a>

##### Lesson — A2 checkpoint and choice of reading interests

**ID:** `lesson.arabic-a2-portfolio` · **Module:** `module.arabic-a2-integration` · **Difficulty:** 3/6 · **Target:** A2

**Duration:** 45 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-story-retell`, `skill.arabic-plans-dialogue`, `skill.arabic-idafa-chains`, `skill.arabic-quantity-comparison`, `skill.arabic-vocabulary-records`, `skill.arabic-a2-listening`, `skill.arabic-a2-reading`, `skill.arabic-a2-interaction`, `skill.arabic-a2-composition`

**Skill:** `skill.arabic-a2-portfolio`

**Learning objectives:**

- Demonstrate routine independence across the four skills

- Demonstrate the outcome on a changed prompt: Retest a weak task with new content after seven days.



**Key concepts:** fresh prompts; delayed transfer; interest selection.

**Arabic example:** أُرِيدُ أَنْ أَقْرَأَ أَكْثَرَ. — I want to read more.

**Practical exercise** (`exercise.arabic-a2-portfolio`): Complete four separate checkpoint tasks; choose two interests for the next reading and listening cycle.

**Evidence to keep:** Four evidence samples, delayed check and chosen interests.

**Knowledge check** (`assessment.arabic-a2-portfolio-check`):

- Does a high grammar quiz score replace a live exchange?

- How can a learner proceed with one weaker skill?



**Mini challenge** (`exercise.arabic-a2-portfolio-transfer`): Retest a weak task with new content after seven days.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-ksu`, `resource.arabic-ryding`, `resource.arabic-mastering`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-weekend`, `asset.arabic-changed-plan`, `asset.arabic-notice`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Four evidence samples, delayed check and chosen interests submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (45 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Retest a weak task with new content after seven days. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**A2 consolidation: stories, plans and practical reading: guided** (`lab.arabic-a2-integration-guided`, 45 min, splittable): Create an illustrated account of a real or fictional week with an audio summary and future plan.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**A2 consolidation: stories, plans and practical reading: transfer** (`lab.arabic-a2-integration-transfer`, 75 min, splittable): Respond to an unseen practical problem requiring a short account, a clarification and a revised plan.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-a2-integration-performance` — Respond to an unseen practical problem requiring a short account, a clarification and a revised plan.

Allow 120 minutes across short sessions, plus 30 minutes for a changed task on another day.

- Overall rubric at least 80/100

- Every required observed modality at least 70/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A week, a problem and a new plan (`project.arabic-week-story`)

##### Project: A week, a problem and a new plan

**ID:** `project.arabic-week-story`

**Goal:** Link past events, a practical problem and a future plan coherently.

**Required skills:** `skill.arabic-a2-listening`, `skill.arabic-a2-reading`, `skill.arabic-a2-interaction`, `skill.arabic-a2-composition`

**Study time:** 5–8 hours; allocated once to `module.arabic-a2-integration`.

**Deliverables:**

- 100–150-word account

- Ninety-second retelling from notes

- Partner negotiation with different information cards

- Ten contextual vocabulary entries and one delayed rewrite



**Assessment criteria:**

- 25% — Time and participant reference remain clear

- 25% — The revised plan fits the partner’s information

- 25% — Vocabulary is used in new combinations

- 25% — Retelling preserves source facts



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Shows connected communication and an independent vocabulary method.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-verb-expansion"></a>

### Module 14 — The wider verb system

**ID:** `module.arabic-verb-expansion` · **Path:** core · **Target:** B1 · **Difficulty:** 4/6

**Purpose:** Recognise recurring verb patterns and use high-frequency irregular forms in context.

**Entry prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-root-pattern`, `skill.arabic-case-roles`, `skill.arabic-modal-complements`

**Other skills used by particular lessons:** `skill.arabic-a2-portfolio`, `skill.arabic-case-roles`, `skill.arabic-dual-sound-plurals`, `skill.arabic-modal-complements`, `skill.arabic-negation-system`, `skill.arabic-root-pattern`

**Before entry:** Use common past and present forms, identify roots cautiously and understand basic case/mood distinctions.

**Estimated study time:** 40–58 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 32–50 h.

**Learning objectives:**

- Recognise forms II–X and produce a selected high-frequency subset

- Use selected common weak verbs with person and mood changes

- Recognise common irregular families without flattening them into one rule

- Relate common particles to present-verb endings

- Interpret common passive patterns and agent omission



**Topics:** Verb patterns (`topic.arabic-verb-expansion-verb-patterns`); Mood and voice (`topic.arabic-verb-expansion-mood-and-voice`)



**Common mistakes:**

- Treating a derived form as a guaranteed meaning

- Trying to learn every irregular paradigm in one sitting

- Confusing noun case with verb mood



**Understand before progressing:**

- Interpret frequent derived, weak and passive forms while verifying uncertain morphology.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Interpret frequent derived, weak and passive forms while verifying uncertain morphology.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Verb patterns

**ID:** `topic.arabic-verb-expansion-verb-patterns`



<a id="lesson.arabic-derived-forms"></a>

##### Lesson — Derived forms as families of useful meanings

**ID:** `lesson.arabic-derived-forms` · **Module:** `module.arabic-verb-expansion` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-root-pattern`, `skill.arabic-case-roles`, `skill.arabic-modal-complements`

**Skill:** `skill.arabic-derived-forms`

**Learning objectives:**

- Recognise forms II–X and produce a selected high-frequency subset

- Demonstrate the outcome on a changed prompt: Look up a new derived verb and explain why its meaning fits the sentence.



**Key concepts:** II III IV V VI VII VIII IX X; lexical meaning; form I baseline.

**Arabic example:** عَلَّمَ / تَعَلَّمَ — He taught / he learned

**Practical exercise** (`exercise.arabic-derived-forms`): Group teacher-verified examples across II–X; practise four frequent verbs productively and recognise the remaining patterns across later sessions.

**Evidence to keep:** A pattern map and four contextualised past-present pairs.

**Knowledge check** (`assessment.arabic-derived-forms-check`):

- Does form II always mean cause someone to do something?

- Are all ten forms equally frequent or available for every root?

- Explain the difference between عَلَّمَ سَامِي الطَّالِبَ and تَعَلَّمَ سَامِي العَرَبِيَّةَ.



**Mini challenge** (`exercise.arabic-derived-forms-transfer`): Look up a new derived verb and explain why its meaning fits the sentence.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- A pattern map and four contextualised past-present pairs submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Look up a new derived verb and explain why its meaning fits the sentence. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-weak-verbs"></a>

##### Lesson — Hollow and final-weak verbs in frequent use

**ID:** `lesson.arabic-weak-verbs` · **Module:** `module.arabic-verb-expansion` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-root-pattern`, `skill.arabic-case-roles`, `skill.arabic-modal-complements`, `skill.arabic-derived-forms`

**Skill:** `skill.arabic-weak-verbs`

**Learning objectives:**

- Use selected common weak verbs with person and mood changes

- Demonstrate the outcome on a changed prompt: Explain one weak form found in a new short text.



**Key concepts:** قال يقول; كان يكون; دعا يدعو; رمى يرمي; stem changes.

**Arabic example:** قَالَ / قُلْتُ — He said / I said

**Practical exercise** (`exercise.arabic-weak-verbs`): Practise قال، زار and دعا in limited past/present sets, then check changed forms such as قلت and لم يدع with a reliable paradigm.

**Evidence to keep:** Three verified mini-paradigms and six meaningful clauses.

**Knowledge check** (`assessment.arabic-weak-verbs-check`):

- Does the long vowel in قال remain unchanged in قلت?

- Can a missing final weak letter signal a grammatical change?

- Change قال to I said, then give the jussive form after لم of يدعو.



**Mini challenge** (`exercise.arabic-weak-verbs-transfer`): Explain one weak form found in a new short text.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Three verified mini-paradigms and six meaningful clauses submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain one weak form found in a new short text. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-irregular-families"></a>

##### Lesson — Initial-weak, doubled and hamzated verbs

**ID:** `lesson.arabic-irregular-families` · **Module:** `module.arabic-verb-expansion` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-root-pattern`, `skill.arabic-case-roles`, `skill.arabic-modal-complements`, `skill.arabic-weak-verbs`

**Skill:** `skill.arabic-irregular-families`

**Learning objectives:**

- Recognise common irregular families without flattening them into one rule

- Demonstrate the outcome on a changed prompt: Recover a likely lemma from three unfamiliar inflected forms and verify.



**Key concepts:** وعد يعد; مدّ; أخذ; family-specific change.

**Arabic example:** وَعَدَ / يَعِدُ — He promised / he promises

**Practical exercise** (`exercise.arabic-irregular-families`): Compare verified forms of وعد، مدّ and أخذ; mark where roots are preserved despite surface spelling changes.

**Evidence to keep:** Three family notes and six checked analyses.

**Knowledge check** (`assessment.arabic-irregular-families-check`):

- Is every initial و removable as a conjunction?

- Do all irregular verbs follow the same deletion rule?

- Identify the root of وَعَدَ and compare the first root letter in وَعَدَ and يَعِدُ.



**Mini challenge** (`exercise.arabic-irregular-families-transfer`): Recover a likely lemma from three unfamiliar inflected forms and verify.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Three family notes and six checked analyses submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Recover a likely lemma from three unfamiliar inflected forms and verify. Evidence: record support, prompt novelty and task conditions.



#### Topic — Mood and voice

**ID:** `topic.arabic-verb-expansion-mood-and-voice`



<a id="lesson.arabic-verb-moods"></a>

##### Lesson — Indicative, subjunctive and jussive in use

**ID:** `lesson.arabic-verb-moods` · **Module:** `module.arabic-verb-expansion` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-root-pattern`, `skill.arabic-case-roles`, `skill.arabic-modal-complements`, `skill.arabic-negation-system`, `skill.arabic-dual-sound-plurals`, `skill.arabic-weak-verbs`

**Skill:** `skill.arabic-verb-moods`

**Learning objectives:**

- Relate common particles to present-verb endings

- Demonstrate the outcome on a changed prompt: Edit a short future-and-negation paragraph with three changed persons.



**Key concepts:** مرفوع منصوب مجزوم; أن لن لم; five verbs; نون deletion.

**Arabic example:** لَنْ يَدْرُسُوا. — They will not study.

**Practical exercise** (`exercise.arabic-verb-moods`): Compare يدرسون، لن يدرسوا، لم يدرسوا in meaningful contexts; add dual and feminine-address examples from a chart.

**Evidence to keep:** Ten contextualised forms with mood triggers identified.

**Knowledge check** (`assessment.arabic-verb-moods-check`):

- What changes in يدرسون after لن?

- Are all jussive changes simply adding sukūn?

- Transform هم يدرسون into they will not study using لن. Explain what happens to ن.



**Mini challenge** (`exercise.arabic-verb-moods-transfer`): Edit a short future-and-negation paragraph with three changed persons.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Ten contextualised forms with mood triggers identified submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Edit a short future-and-negation paragraph with three changed persons. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-passive-voice"></a>

##### Lesson — Who acted, and what happened to the object?

**ID:** `lesson.arabic-passive-voice` · **Module:** `module.arabic-verb-expansion` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-root-pattern`, `skill.arabic-case-roles`, `skill.arabic-modal-complements`, `skill.arabic-derived-forms`

**Skill:** `skill.arabic-passive-voice`

**Learning objectives:**

- Interpret common passive patterns and agent omission

- Demonstrate the outcome on a changed prompt: Summarise a fresh passive report while preserving uncertainty.



**Key concepts:** active/passive vowels; نائب فاعل; news usage; unknown agent.

**Arabic example:** كُتِبَ التَّقْرِيرُ. — The report was written.

**Practical exercise** (`exercise.arabic-passive-voice`): Compare كَتَبَ and كُتِبَ, then active/passive versions of four short reports; avoid inventing an agent.

**Evidence to keep:** Four paired reports and a faithful summary.

**Knowledge check** (`assessment.arabic-passive-voice-check`):

- Does a passive sentence always identify who performed the action?

- Can the same unvowelled spelling allow active and passive readings?

- Vocalise كتب التقرير to mean The report was written, and state whether the writer is identified.



**Mini challenge** (`exercise.arabic-passive-voice-transfer`): Summarise a fresh passive report while preserving uncertainty.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Four paired reports and a faithful summary submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Summarise a fresh passive report while preserving uncertainty. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**The wider verb system: guided** (`lab.arabic-verb-expansion-guided`, 45 min, splittable): Annotate verbs in three short texts by root, form, person, time context and voice; verify ambiguous analyses.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**The wider verb system: transfer** (`lab.arabic-verb-expansion-transfer`, 75 min, splittable): Retell an unfamiliar text with changed participants and time, selecting only forms already practised productively.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-verb-expansion-performance` — Retell an unfamiliar text with changed participants and time, selecting only forms already practised productively.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** An independent reading notebook (`project.arabic-reader-notebook`)

---



<a id="module.arabic-clause-building"></a>

### Module 15 — Relative clauses, reported information and conditions

**ID:** `module.arabic-clause-building` · **Path:** core · **Target:** B1 · **Difficulty:** 4/6

**Purpose:** Connect ideas while keeping reference, logic and speaker attribution clear.

**Entry prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-pronoun-attachment`, `skill.arabic-verb-moods`

**Other skills used by particular lessons:** `skill.arabic-a2-portfolio`, `skill.arabic-case-roles`, `skill.arabic-future-plans`, `skill.arabic-kana-background`, `skill.arabic-pronoun-attachment`, `skill.arabic-verb-moods`

**Before entry:** Understand clause roles, attached pronouns and common tense/mood patterns.

**Estimated study time:** 40–58 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 0–0 h; distributed practice/review: 32–50 h.

**Learning objectives:**

- Use common relative constructions with clear antecedents

- Track the noun and predicate after inna and kāna

- Preserve attribution in direct and indirect reports

- Distinguish common إذا إن and لو constructions in context

- Choose connectors that preserve the intended logical relationship



**Topics:** Linking descriptions (`topic.arabic-clause-building-linking-descriptions`); Clause structure (`topic.arabic-clause-building-clause-structure`); Logical relations (`topic.arabic-clause-building-logical-relations`)



**Common mistakes:**

- Omitting a required resumptive pronoun without checking the structure

- Translating that with the same word everywhere

- Ignoring the difference between a real condition and a counterfactual



**Understand before progressing:**

- Interpret and produce connected sentences for description, explanation and conditional plans.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Interpret and produce connected sentences for description, explanation and conditional plans.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Linking descriptions

**ID:** `topic.arabic-clause-building-linking-descriptions`



<a id="lesson.arabic-relative-clauses"></a>

##### Lesson — Describe precisely with relative clauses

**ID:** `lesson.arabic-relative-clauses` · **Module:** `module.arabic-clause-building` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-pronoun-attachment`, `skill.arabic-verb-moods`

**Skill:** `skill.arabic-relative-clauses`

**Learning objectives:**

- Use common relative constructions with clear antecedents

- Demonstrate the outcome on a changed prompt: Describe an unfamiliar object so a partner can identify it.



**Key concepts:** الذي التي; definite/indefinite antecedent; resumptive pronoun.

**Arabic example:** الْكِتَابُ الَّذِي قَرَأْتُهُ — The book that I read

**Practical exercise** (`exercise.arabic-relative-clauses`): Compare الكتاب الذي قرأته with كتاب قرأته; write six descriptions and identify the referent of each suffix.

**Evidence to keep:** Six relative descriptions with referents labelled.

**Knowledge check** (`assessment.arabic-relative-clauses-check`):

- Does an indefinite noun always take الذي before a following descriptive clause?

- What does the ه in الكتاب الذي قرأته refer to?

- Complete الكتاب الذي قرأت___ with the pronoun referring back to the book.



**Mini challenge** (`exercise.arabic-relative-clauses-transfer`): Describe an unfamiliar object so a partner can identify it.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Six relative descriptions with referents labelled submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Describe an unfamiliar object so a partner can identify it. Evidence: record support, prompt novelty and task conditions.



#### Topic — Clause structure

**ID:** `topic.arabic-clause-building-clause-structure`



<a id="lesson.arabic-inna-kana"></a>

##### Lesson — Manage common sentence-changing particles and verbs

**ID:** `lesson.arabic-inna-kana` · **Module:** `module.arabic-clause-building` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-pronoun-attachment`, `skill.arabic-verb-moods`, `skill.arabic-case-roles`, `skill.arabic-kana-background`

**Skill:** `skill.arabic-inna-kana`

**Learning objectives:**

- Track the noun and predicate after inna and kāna

- Demonstrate the outcome on a changed prompt: Explain a new marked sentence without relying only on word order.



**Key concepts:** إنّ أنّ; كان; اسم وخبر; case changes.

**Arabic example:** إِنَّ الطَّالِبَ مُجْتَهِدٌ. — Indeed, the student is diligent.

**Practical exercise** (`exercise.arabic-inna-kana`): Transform four nominal sentences with كان or إنّ, then compare meaning and visible case in fully marked models.

**Evidence to keep:** Eight transformations and two role explanations.

**Knowledge check** (`assessment.arabic-inna-kana-check`):

- After إنّ, what case does its noun normally take?

- After كان, what case does its predicate normally take?

- Add إنّ to الطالبُ مجتهدٌ and show the two endings.



**Mini challenge** (`exercise.arabic-inna-kana-transfer`): Explain a new marked sentence without relying only on word order.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Eight transformations and two role explanations submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain a new marked sentence without relying only on word order. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-reported-information"></a>

##### Lesson — Say who said or believed what

**ID:** `lesson.arabic-reported-information` · **Module:** `module.arabic-clause-building` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-pronoun-attachment`, `skill.arabic-verb-moods`, `skill.arabic-inna-kana`, `skill.arabic-relative-clauses`

**Skill:** `skill.arabic-reported-information`

**Learning objectives:**

- Preserve attribution in direct and indirect reports

- Demonstrate the outcome on a changed prompt: Retell conflicting accounts without merging them into one fact.



**Key concepts:** قال إنّ; ذكر أنّ; quotation; speaker versus narrator.

**Arabic example:** قَالَ إِنَّهُ مُتْعَبٌ. — He said that he was/is tired, as context determines.

**Practical exercise** (`exercise.arabic-reported-information`): Report three fictional statements, separating the source's claim from your own observation; verify each reporting construction.

**Evidence to keep:** Three attributed reports and one uncertainty note.

**Knowledge check** (`assessment.arabic-reported-information-check`):

- Does reporting a claim mean endorsing it?

- Can إنّ and أنّ be swapped mechanically after all reporting verbs?

- Use قال to report the male speaker's statement أنا متعب without treating the statement as your own observation.



**Mini challenge** (`exercise.arabic-reported-information-transfer`): Retell conflicting accounts without merging them into one fact.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Three attributed reports and one uncertainty note submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Retell conflicting accounts without merging them into one fact. Evidence: record support, prompt novelty and task conditions.



#### Topic — Logical relations

**ID:** `topic.arabic-clause-building-logical-relations`



<a id="lesson.arabic-conditionals"></a>

##### Lesson — Express conditions, possibilities and alternatives

**ID:** `lesson.arabic-conditionals` · **Module:** `module.arabic-clause-building` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-pronoun-attachment`, `skill.arabic-verb-moods`, `skill.arabic-future-plans`

**Skill:** `skill.arabic-conditionals`

**Learning objectives:**

- Distinguish common إذا إن and لو constructions in context

- Demonstrate the outcome on a changed prompt: Revise a plan when its condition is no longer possible.



**Key concepts:** real condition; possible condition; counterfactual; response clause.

**Arabic example:** إِذَا دَرَسْتَ، فَسَتَفْهَمُ. — If/when you study, you will understand.

**Practical exercise** (`exercise.arabic-conditionals`): Classify six teacher-checked conditional sentences, then produce three simple إذا plans; introduce لو receptively before free production.

**Evidence to keep:** Six interpretations and three connected plans.

**Knowledge check** (`assessment.arabic-conditionals-check`):

- Does لو always have the same implication as إذا?

- Must conditional meaning be inferred from the particle alone?

- Translate the basic meaning of إذا درست، فستفهم. Does the sentence itself state that studying has already happened?



**Mini challenge** (`exercise.arabic-conditionals-transfer`): Revise a plan when its condition is no longer possible.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Six interpretations and three connected plans submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise a plan when its condition is no longer possible. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-cause-purpose-contrast"></a>

##### Lesson — Explain why, for what purpose and despite what

**ID:** `lesson.arabic-cause-purpose-contrast` · **Module:** `module.arabic-clause-building` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-portfolio`, `skill.arabic-pronoun-attachment`, `skill.arabic-verb-moods`, `skill.arabic-reported-information`, `skill.arabic-conditionals`

**Skill:** `skill.arabic-cause-purpose-contrast`

**Learning objectives:**

- Choose connectors that preserve the intended logical relationship

- Demonstrate the outcome on a changed prompt: Replace a misleading connector and justify the new logic.



**Key concepts:** لأنّ; لكي; لذلك; لكنّ; مع أنّ.

**Arabic example:** أَدْرُسُ لِكَيْ أَفْهَمَ. — I study in order to understand.

**Practical exercise** (`exercise.arabic-cause-purpose-contrast`): Link eight sentence pairs by reason, purpose, result or contrast, then write a coherent explanation of a study decision.

**Evidence to keep:** Eight linked pairs and a 100-word explanation.

**Knowledge check** (`assessment.arabic-cause-purpose-contrast-check`):

- Are reason and purpose the same relationship?

- Can a connector change a reader's interpretation even when all content words stay the same?

- Which sentence gives a purpose: أقرأ لأن الكتاب مفيد or أقرأ لكي أتعلم? Explain both relationships.



**Mini challenge** (`exercise.arabic-cause-purpose-contrast-transfer`): Replace a misleading connector and justify the new logic.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Eight linked pairs and a 100-word explanation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Replace a misleading connector and justify the new logic. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Relative clauses, reported information and conditions: guided** (`lab.arabic-clause-building-guided`, 45 min, splittable): Expand a short factual description using relative clauses, reasons and attributed statements.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Relative clauses, reported information and conditions: transfer** (`lab.arabic-clause-building-transfer`, 75 min, splittable): Read a new paragraph, map its clause relationships and rewrite it more simply without changing meaning.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-clause-building-performance` — Read a new paragraph, map its clause relationships and rewrite it more simply without changing meaning.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** An independent reading notebook (`project.arabic-reader-notebook`)

---



<a id="module.arabic-independent-reading"></a>

### Module 16 — Unvowelled reading and vocabulary growth

**ID:** `module.arabic-independent-reading` · **Path:** core · **Target:** B1 · **Difficulty:** 4/6

**Purpose:** Read for meaning beyond heavily scaffolded passages.

**Entry prerequisites:** `skill.arabic-a2-reading`, `skill.arabic-dictionary-method`, `skill.arabic-relative-clauses`, `skill.arabic-passive-voice`

**Other skills used by particular lessons:** `skill.arabic-a2-reading`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-clitic-segmentation`, `skill.arabic-dictionary-method`, `skill.arabic-passive-voice`, `skill.arabic-relative-clauses`, `skill.arabic-vocabulary-records`

**Before entry:** Understand connected basic prose and use a dictionary without looking up every word.

**Estimated study time:** 40–58 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 6–10 h; distributed practice/review: 26–40 h.

**Learning objectives:**

- Use graded removal of vowel marks while preserving comprehension

- Compare plausible readings instead of making a blind guess

- Track how sentences develop one main idea

- Sustain reading with limited interruption

- Store useful collocations and reuse them in new contexts



**Topics:** Reading independence (`topic.arabic-independent-reading-reading-independence`); Reading organisation (`topic.arabic-independent-reading-reading-organisation`); Vocabulary development (`topic.arabic-independent-reading-vocabulary-development`)



**Common mistakes:**

- Removing all vowel support at once

- Guessing a vocalisation before understanding the sentence

- Turning extensive reading into exhaustive parsing



**Understand before progressing:**

- Read selected unvowelled texts, resolve ambiguity and maintain a useful personal lexicon.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Read selected unvowelled texts, resolve ambiguity and maintain a useful personal lexicon.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Reading independence

**ID:** `topic.arabic-independent-reading-reading-independence`



<a id="lesson.arabic-diacritics-taper"></a>

##### Lesson — Move from full vowels to selective support

**ID:** `lesson.arabic-diacritics-taper` · **Module:** `module.arabic-independent-reading` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-reading`, `skill.arabic-dictionary-method`, `skill.arabic-relative-clauses`, `skill.arabic-passive-voice`

**Skill:** `skill.arabic-diacritics-taper`

**Learning objectives:**

- Use graded removal of vowel marks while preserving comprehension

- Demonstrate the outcome on a changed prompt: Request only the vowel marks needed to resolve a fresh ambiguity.



**Key concepts:** lexical vowels; case marks; ambiguity; support toggle.

**Arabic example:** كتب — An unvowelled form requiring context

**Practical exercise** (`exercise.arabic-diacritics-taper`): Read the same short text fully marked, selectively marked and unmarked on separate passes; then try a new text at the successful support level.

**Evidence to keep:** Three support-level records and a new-text check.

**Knowledge check** (`assessment.arabic-diacritics-taper-check`):

- Should support be removed on a fixed date regardless of performance?

- Does recognising an unmarked word guarantee its exact vocalisation?

- Read كتب سامي رسالة أمس. Give the most plausible reading of كتب and the clue that supports it.



**Mini challenge** (`exercise.arabic-diacritics-taper-transfer`): Request only the vowel marks needed to resolve a fresh ambiguity.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-notice`, `asset.arabic-study-method`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Three support-level records and a new-text check submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Request only the vowel marks needed to resolve a fresh ambiguity. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-context-ambiguity"></a>

##### Lesson — Resolve ambiguous words with syntax and context

**ID:** `lesson.arabic-context-ambiguity` · **Module:** `module.arabic-independent-reading` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-reading`, `skill.arabic-dictionary-method`, `skill.arabic-relative-clauses`, `skill.arabic-passive-voice`, `skill.arabic-diacritics-taper`, `skill.arabic-clitic-segmentation`

**Skill:** `skill.arabic-context-ambiguity`

**Learning objectives:**

- Compare plausible readings instead of making a blind guess

- Demonstrate the outcome on a changed prompt: Explain how a changed surrounding sentence changes one reading.



**Key concepts:** part of speech; active/passive; topic; collocation.

**Arabic example:** عَلِمَ / عِلْم / عَلَم — He knew / knowledge / flag

**Practical exercise** (`exercise.arabic-context-ambiguity`): Analyse five ambiguous forms such as علم and كتب in different sentences; justify the reading using more than one clue.

**Evidence to keep:** Five evidence-based interpretations.

**Knowledge check** (`assessment.arabic-context-ambiguity-check`):

- Why can a dictionary's first entry be wrong for a sentence?

- What should remain in your notes when evidence is insufficient?

- Choose a reading of علم for each context: هذا ___ جميل, meaning This is a beautiful flag; ___ سامي بالخبر, meaning Sami learned of the news.



**Mini challenge** (`exercise.arabic-context-ambiguity-transfer`): Explain how a changed surrounding sentence changes one reading.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-notice`, `asset.arabic-study-method`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Five evidence-based interpretations submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain how a changed surrounding sentence changes one reading. Evidence: record support, prompt novelty and task conditions.



#### Topic — Reading organisation

**ID:** `topic.arabic-independent-reading-reading-organisation`



<a id="lesson.arabic-paragraph-mapping"></a>

##### Lesson — Follow topic, reference and argument across a paragraph

**ID:** `lesson.arabic-paragraph-mapping` · **Module:** `module.arabic-independent-reading` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-reading`, `skill.arabic-dictionary-method`, `skill.arabic-relative-clauses`, `skill.arabic-passive-voice`, `skill.arabic-cause-purpose-contrast`

**Skill:** `skill.arabic-paragraph-mapping`

**Learning objectives:**

- Track how sentences develop one main idea

- Demonstrate the outcome on a changed prompt: Write a one-sentence summary of a new paragraph.



**Key concepts:** topic sentence; pronoun chain; connectors; support.

**Arabic example:** لِذَلِكَ — Therefore/for that reason

**Practical exercise** (`exercise.arabic-paragraph-mapping`): Annotate a 200-word text for its main idea, two supporting points, three pronoun referents and one contrast.

**Evidence to keep:** A paragraph map and faithful summary.

**Knowledge check** (`assessment.arabic-paragraph-mapping-check`):

- Is the first sentence always the main claim?

- Can a correct word translation still leave the paragraph misunderstood?

- Read لم يجد سامي الكتاب في المكتبة. لذلك اشتراه. What does ه refer to, and what relationship does لذلك express?



**Mini challenge** (`exercise.arabic-paragraph-mapping-transfer`): Write a one-sentence summary of a new paragraph.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-notice`, `asset.arabic-study-method`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A paragraph map and faithful summary submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Write a one-sentence summary of a new paragraph. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-extensive-reading"></a>

##### Lesson — Read accessible material for sustained meaning

**ID:** `lesson.arabic-extensive-reading` · **Module:** `module.arabic-independent-reading` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-reading`, `skill.arabic-dictionary-method`, `skill.arabic-relative-clauses`, `skill.arabic-passive-voice`, `skill.arabic-paragraph-mapping`

**Skill:** `skill.arabic-extensive-reading`

**Learning objectives:**

- Sustain reading with limited interruption

- Demonstrate the outcome on a changed prompt: Read another short section and predict the next development with evidence.



**Key concepts:** easy texts; interest; gist; selective lookup.

**Arabic example:** قِصَّة قَصِيرَة — Short story

**Practical exercise** (`exercise.arabic-extensive-reading`): Choose a legal text you can mostly follow, read for fifteen minutes and summarise from memory; simplify the selection if every sentence needs help.

**Evidence to keep:** A reading log with gist and selected vocabulary.

**Knowledge check** (`assessment.arabic-extensive-reading-check`):

- Is an adult literary classic automatically suitable for a beginner?

- Should every unknown word interrupt extensive reading?

- After reading a short passage, state its main event in one Arabic sentence before looking up more words. What belongs in that sentence?



**Mini challenge** (`exercise.arabic-extensive-reading-transfer`): Read another short section and predict the next development with evidence.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-notice`, `asset.arabic-study-method`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A reading log with gist and selected vocabulary submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Read another short section and predict the next development with evidence. Evidence: record support, prompt novelty and task conditions.



#### Topic — Vocabulary development

**ID:** `topic.arabic-independent-reading-vocabulary-development`



<a id="lesson.arabic-collocation-growth"></a>

##### Lesson — Learn how words work together

**ID:** `lesson.arabic-collocation-growth` · **Module:** `module.arabic-independent-reading` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-reading`, `skill.arabic-dictionary-method`, `skill.arabic-relative-clauses`, `skill.arabic-passive-voice`, `skill.arabic-vocabulary-records`, `skill.arabic-extensive-reading`

**Skill:** `skill.arabic-collocation-growth`

**Learning objectives:**

- Store useful collocations and reuse them in new contexts

- Demonstrate the outcome on a changed prompt: Use a learned collocation in a new topic after a delay.



**Key concepts:** word partnerships; verb-preposition patterns; register; sense.

**Arabic example:** اتَّخَذَ قَرَارًا — He made a decision.

**Practical exercise** (`exercise.arabic-collocation-growth`): Collect eight collocations from your readings, verify each and use four in a fresh paragraph and short recording.

**Evidence to keep:** Eight entries plus written and spoken reuse.

**Knowledge check** (`assessment.arabic-collocation-growth-check`):

- Does knowing isolated dictionary meanings ensure natural combinations?

- Why label a collocation's register?

- Complete اتخذ ___ to express made a decision, then use the phrase in a short sentence.



**Mini challenge** (`exercise.arabic-collocation-growth-transfer`): Use a learned collocation in a new topic after a delay.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-notice`, `asset.arabic-study-method`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Eight entries plus written and spoken reuse submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Use a learned collocation in a new topic after a delay. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Unvowelled reading and vocabulary growth: guided** (`lab.arabic-independent-reading-guided`, 45 min, splittable): Read a sequence of three accessible texts on one interest, alternating intensive analysis and fluent rereading.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Unvowelled reading and vocabulary growth: transfer** (`lab.arabic-independent-reading-transfer`, 75 min, splittable): Read a fresh text on a related topic and explain its main point, reference chains and two uncertain words.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-independent-reading-performance` — Read a fresh text on a related topic and explain its main point, reference chains and two uncertain words.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** An independent reading notebook (`project.arabic-reader-notebook`)

##### Project: An independent reading notebook

**ID:** `project.arabic-reader-notebook`

**Goal:** Read three suitable unvowelled texts and explain the language that matters for meaning.

**Required skills:** `skill.arabic-context-ambiguity`, `skill.arabic-paragraph-mapping`, `skill.arabic-collocation-growth`, `skill.arabic-cause-purpose-contrast`

**Study time:** 6–10 hours; allocated once to `module.arabic-independent-reading`.

**Deliverables:**

- Three source cards and concise summaries

- Fifteen selective lexical notes

- Five justified grammar/ambiguity notes

- A fresh-text comprehension sample



**Assessment criteria:**

- 25% — Summaries preserve main ideas

- 25% — Lookup choices are selective and justified

- 25% — Ambiguous forms are resolved with evidence or left open

- 25% — A new text can be read with reduced support



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Documents growing independence beyond textbook passages.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-listening-interaction"></a>

### Module 17 — Longer listening and unrehearsed interaction

**ID:** `module.arabic-listening-interaction` · **Path:** core · **Target:** B1 · **Difficulty:** 4/6

**Purpose:** Understand connected MSA and keep a conversation moving without hiding behind scripts.

**Entry prerequisites:** `skill.arabic-a2-interaction`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-past-questions`

**Other skills used by particular lessons:** `skill.arabic-a2-interaction`, `skill.arabic-article-connected-speech`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-conditionals`, `skill.arabic-past-questions`, `skill.arabic-reported-information`

**Before entry:** Follow short accounts and negotiate routine information with some repetition.

**Estimated study time:** 40–58 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 5–8 h; distributed practice/review: 27–42 h.

**Learning objectives:**

- Use successive listening passes for distinct purposes

- Identify familiar language despite linking and reduced boundaries

- Extend a topic through relevant follow-up questions

- Maintain comprehensible speech when a word or claim is challenged

- Transfer listening across voices while separating MSA from mixed speech



**Topics:** Listening strategies (`topic.arabic-listening-interaction-listening-strategies`); Interactive listening (`topic.arabic-listening-interaction-interactive-listening`)



**Common mistakes:**

- Shadowing sounds without understanding

- Using a visible transcript during a listening test

- Mistaking mixed dialect audio for pure MSA



**Understand before progressing:**

- Take selective notes, distinguish main claims from examples and sustain a topic with repairs.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Take selective notes, distinguish main claims from examples and sustain a topic with repairs.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Listening strategies

**ID:** `topic.arabic-listening-interaction-listening-strategies`



<a id="lesson.arabic-listening-passes"></a>

##### Lesson — Listen for gist, detail and structure

**ID:** `lesson.arabic-listening-passes` · **Module:** `module.arabic-listening-interaction` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-interaction`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-past-questions`

**Skill:** `skill.arabic-listening-passes`

**Learning objectives:**

- Use successive listening passes for distinct purposes

- Demonstrate the outcome on a changed prompt: Try a fresh clip and compare which errors recur.



**Key concepts:** gist first; detail next; transcript last; support log.

**Arabic example:** الفِكْرَةُ الرَّئِيسِيَّةُ — The main idea

**Practical exercise** (`exercise.arabic-listening-passes`): Select a verified two-minute MSA clip; record a gist after one pass, details after a second and corrections after transcript review.

**Evidence to keep:** Three-pass notes with assistance recorded.

**Knowledge check** (`assessment.arabic-listening-passes-check`):

- Why not pause after every word on the first pass?

- Can transcript-assisted understanding be saved as unaided listening?



**Mini challenge** (`exercise.arabic-listening-passes-transfer`): Try a fresh clip and compare which errors recur.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-aswaat`, `resource.arabic-qfi`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Three-pass notes with assistance recorded submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Try a fresh clip and compare which errors recur. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-connected-listening"></a>

##### Lesson — Recover words in connected, naturally paced speech

**ID:** `lesson.arabic-connected-listening` · **Module:** `module.arabic-listening-interaction` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-interaction`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-past-questions`, `skill.arabic-listening-passes`, `skill.arabic-article-connected-speech`

**Skill:** `skill.arabic-connected-listening`

**Learning objectives:**

- Identify familiar language despite linking and reduced boundaries

- Demonstrate the outcome on a changed prompt: Recognise a familiar chunk spoken by another voice.



**Key concepts:** chunking; stress; linking; multiple speakers.

**Arabic example:** بِالإِضَافَةِ إِلَى ذَلِكَ — In addition to that

**Practical exercise** (`exercise.arabic-connected-listening`): Work on three ten-second segments: transcribe only what you hear, compare with a verified transcript and shadow after understanding.

**Evidence to keep:** Three corrected segment records and a new-voice check.

**Knowledge check** (`assessment.arabic-connected-listening-check`):

- Is slowed audio the same evidence as natural-speed comprehension?

- Should every regional pronunciation difference be labelled a mistake?



**Mini challenge** (`exercise.arabic-connected-listening-transfer`): Recognise a familiar chunk spoken by another voice.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-aswaat`, `resource.arabic-qfi`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Three corrected segment records and a new-voice check submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Recognise a familiar chunk spoken by another voice. Evidence: record support, prompt novelty and task conditions.



#### Topic — Interactive listening

**ID:** `topic.arabic-listening-interaction-interactive-listening`



<a id="lesson.arabic-follow-up-questions"></a>

##### Lesson — Ask questions that respond to what was said

**ID:** `lesson.arabic-follow-up-questions` · **Module:** `module.arabic-listening-interaction` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-interaction`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-past-questions`, `skill.arabic-listening-passes`, `skill.arabic-reported-information`

**Skill:** `skill.arabic-follow-up-questions`

**Learning objectives:**

- Extend a topic through relevant follow-up questions

- Demonstrate the outcome on a changed prompt: Ask for an example after a partner gives an abstract answer.



**Key concepts:** open question; confirmation; reason; example request.

**Arabic example:** هَلْ يُمْكِنُ أَنْ تُعْطِيَ مِثَالًا؟ — Can you give an example? (to a male)

**Practical exercise** (`exercise.arabic-follow-up-questions`): Interview a partner about study or work; ask at least four questions based on their actual answers.

**Evidence to keep:** A five-minute exchange with four responsive questions.

**Knowledge check** (`assessment.arabic-follow-up-questions-check`):

- What makes a follow-up question relevant?

- Does waiting to deliver a rehearsed line show active listening?

- A partner says أدرس العربية لأنني أحب القراءة. Write a relevant follow-up question.



**Mini challenge** (`exercise.arabic-follow-up-questions-transfer`): Ask for an example after a partner gives an abstract answer.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-aswaat`, `resource.arabic-qfi`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A five-minute exchange with four responsive questions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Ask for an example after a partner gives an abstract answer. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-opinion-repair"></a>

##### Lesson — Express an opinion and recover from difficulty

**ID:** `lesson.arabic-opinion-repair` · **Module:** `module.arabic-listening-interaction` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-interaction`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-past-questions`, `skill.arabic-follow-up-questions`, `skill.arabic-conditionals`

**Skill:** `skill.arabic-opinion-repair`

**Learning objectives:**

- Maintain comprehensible speech when a word or claim is challenged

- Demonstrate the outcome on a changed prompt: Repeat the discussion on a new familiar topic.



**Key concepts:** circumlocution; paraphrase; clarification; polite disagreement.

**Arabic example:** مِنْ وِجْهَةِ نَظَرِي — From my point of view

**Practical exercise** (`exercise.arabic-opinion-repair`): Discuss a familiar choice; when a word is unavailable, describe it, and when challenged, clarify the claim with a reason.

**Evidence to keep:** A six-minute discussion with two effective repairs.

**Knowledge check** (`assessment.arabic-opinion-repair-check`):

- Is a pause always evidence of failure?

- Should you invent a word confidently when unsure?

- You cannot recall the word مكتبة. Paraphrase a place where people read or borrow books in simple MSA.



**Mini challenge** (`exercise.arabic-opinion-repair-transfer`): Repeat the discussion on a new familiar topic.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-aswaat`, `resource.arabic-qfi`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A six-minute discussion with two effective repairs submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat the discussion on a new familiar topic. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-speaker-variety"></a>

##### Lesson — Understand a second voice and label register shifts

**ID:** `lesson.arabic-speaker-variety` · **Module:** `module.arabic-listening-interaction` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-interaction`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-past-questions`, `skill.arabic-connected-listening`, `skill.arabic-opinion-repair`

**Skill:** `skill.arabic-speaker-variety`

**Learning objectives:**

- Transfer listening across voices while separating MSA from mixed speech

- Demonstrate the outcome on a changed prompt: Summarise a new speaker's point without relying on the first clip's wording.



**Key concepts:** accent; register; MSA/dialect mixture; task scope.

**Arabic example:** بِاللُّغَةِ العَرَبِيَّةِ الفُصْحَى — In Modern Standard/formal Arabic

**Practical exercise** (`exercise.arabic-speaker-variety`): Compare two short verified MSA clips on a familiar theme; label any identified colloquial stretch rather than silently grading it as taught MSA.

**Evidence to keep:** Two voice-specific comprehension samples and register notes.

**Knowledge check** (`assessment.arabic-speaker-variety-check`):

- Are accent and dialect identical concepts?

- Should dialect-only material block completion of an MSA target?



**Mini challenge** (`exercise.arabic-speaker-variety-transfer`): Summarise a new speaker's point without relying on the first clip's wording.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-aswaat`, `resource.arabic-qfi`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Two voice-specific comprehension samples and register notes submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Summarise a new speaker's point without relying on the first clip's wording. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Longer listening and unrehearsed interaction: guided** (`lab.arabic-listening-interaction-guided`, 45 min, splittable): Listen to a two- to three-minute MSA explanation, map it and ask meaningful follow-up questions.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Longer listening and unrehearsed interaction: transfer** (`lab.arabic-listening-interaction-transfer`, 75 min, splittable): Discuss the same theme with an unfamiliar partner or a new set of questions and no full script.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-listening-interaction-performance` — Discuss the same theme with an unfamiliar partner or a new set of questions and no full script.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A genuine information-gap interview (`project.arabic-interview`)

##### Project: A genuine information-gap interview

**ID:** `project.arabic-interview`

**Goal:** Listen and respond to another person rather than recite a prepared dialogue.

**Required skills:** `skill.arabic-follow-up-questions`, `skill.arabic-opinion-repair`, `skill.arabic-speaker-variety`

**Study time:** 5–8 hours; allocated once to `module.arabic-listening-interaction`.

**Deliverables:**

- Five question intentions, not a full script

- Six- to eight-minute MSA exchange

- Consent-based private recording or teacher observation

- Summary confirmed by the partner



**Assessment criteria:**

- 25% — Follow-ups respond to the actual answers

- 25% — Clarification repairs misunderstanding

- 25% — The summary represents the partner accurately

- 25% — Register and audio support are documented



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Strong evidence of listening and interactive speaking.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-connected-writing"></a>

### Module 18 — Paragraphs, correspondence and revision

**ID:** `module.arabic-connected-writing` · **Path:** core · **Target:** B1 · **Difficulty:** 4/6

**Purpose:** Write coherent text for a reader, then revise meaning and language separately.

**Entry prerequisites:** `skill.arabic-a2-composition`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`

**Other skills used by particular lessons:** `skill.arabic-a2-composition`, `skill.arabic-case-roles`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-plans-dialogue`, `skill.arabic-reported-information`, `skill.arabic-special-spellings`

**Before entry:** Write short accounts and understand basic clause relationships.

**Estimated study time:** 40–58 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 5–8 h; distributed practice/review: 27–42 h.

**Learning objectives:**

- Organise a paragraph with relevant development

- Write a concise formal email with clear action and details

- Condense a source while preserving attribution and meaning

- Apply common spelling rules and prioritise recurring errors

- Turn corrections into transferable editing habits



**Topics:** Organisation (`topic.arabic-connected-writing-organisation`); Practical genres (`topic.arabic-connected-writing-practical-genres`); Accuracy and revision (`topic.arabic-connected-writing-accuracy-and-revision`)



**Common mistakes:**

- Joining every idea with و

- Copying translated English structure blindly

- Letting AI rewrite everything without an independent second attempt



**Understand before progressing:**

- Draft a clear email, explanation or report with coherent reference and controlled register.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Draft a clear email, explanation or report with coherent reference and controlled register.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Organisation

**ID:** `topic.arabic-connected-writing-organisation`



<a id="lesson.arabic-paragraph-design"></a>

##### Lesson — Build a paragraph around one clear purpose

**ID:** `lesson.arabic-paragraph-design` · **Module:** `module.arabic-connected-writing` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-composition`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`

**Skill:** `skill.arabic-paragraph-design`

**Learning objectives:**

- Organise a paragraph with relevant development

- Demonstrate the outcome on a changed prompt: Reorganise a shuffled paragraph and justify the order.



**Key concepts:** topic; support; example; closing link.

**Arabic example:** عَلَى سَبِيلِ الْمِثَالِ — For example

**Practical exercise** (`exercise.arabic-paragraph-design`): Plan and write 120–160 words explaining a study habit; remove sentences that do not serve the purpose.

**Evidence to keep:** A plan, draft and reordered example.

**Knowledge check** (`assessment.arabic-paragraph-design-check`):

- Does a paragraph need one sentence of every grammatical type?

- What makes an example useful?

- Add an example after القراءة مفيدة. using على سبيل المثال.



**Mini challenge** (`exercise.arabic-paragraph-design-transfer`): Reorganise a shuffled paragraph and justify the order.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-w3c`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-email`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A plan, draft and reordered example submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Reorganise a shuffled paragraph and justify the order. Evidence: record support, prompt novelty and task conditions.



#### Topic — Practical genres

**ID:** `topic.arabic-connected-writing-practical-genres`



<a id="lesson.arabic-formal-email"></a>

##### Lesson — Write an appropriate request and reply

**ID:** `lesson.arabic-formal-email` · **Module:** `module.arabic-connected-writing` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-composition`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-paragraph-design`, `skill.arabic-plans-dialogue`

**Skill:** `skill.arabic-formal-email`

**Learning objectives:**

- Write a concise formal email with clear action and details

- Demonstrate the outcome on a changed prompt: Adapt the same request to a different recipient.



**Key concepts:** salutation; purpose; polite request; closing.

**Arabic example:** السَّيِّدَةُ المُحْتَرَمَةُ — Respected Madam (a formal address)

**Practical exercise** (`exercise.arabic-formal-email`): Write an email requesting course information and a reply confirming a time; use a verified model for conventions.

**Evidence to keep:** Two original emails and audience notes.

**Knowledge check** (`assessment.arabic-formal-email-check`):

- Does formality require unnecessarily elaborate language?

- Which details make a request actionable?

- Write one polite sentence asking about the course timetable using هل يمكنكم.



**Mini challenge** (`exercise.arabic-formal-email-transfer`): Adapt the same request to a different recipient.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-w3c`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-email`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Two original emails and audience notes submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Adapt the same request to a different recipient. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-summary-notes"></a>

##### Lesson — Summarise without copying or adding claims

**ID:** `lesson.arabic-summary-notes` · **Module:** `module.arabic-connected-writing` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-composition`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-paragraph-design`, `skill.arabic-reported-information`

**Skill:** `skill.arabic-summary-notes`

**Learning objectives:**

- Condense a source while preserving attribution and meaning

- Demonstrate the outcome on a changed prompt: Summarise the same text for a reader with less background.



**Key concepts:** selection; paraphrase; source claim; no invented detail.

**Arabic example:** يُوَضِّحُ النَّصُّ أَنَّ... — The text explains that...

**Practical exercise** (`exercise.arabic-summary-notes`): Read a 250-word text, close it, write a 70–100-word summary and compare against the source.

**Evidence to keep:** Two summaries and a fidelity checklist.

**Knowledge check** (`assessment.arabic-summary-notes-check`):

- May a summary add a plausible cause absent from the text?

- Is changing every word enough to create a good summary?

- Read ستبدأ الدورة يوم الاثنين. سيشارك فيها عشرة طلاب. Write a shorter Arabic summary preserving both facts.



**Mini challenge** (`exercise.arabic-summary-notes-transfer`): Summarise the same text for a reader with less background.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-w3c`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-email`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Two summaries and a fidelity checklist submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Summarise the same text for a reader with less background. Evidence: record support, prompt novelty and task conditions.



#### Topic — Accuracy and revision

**ID:** `topic.arabic-connected-writing-accuracy-and-revision`



<a id="lesson.arabic-orthography-editing"></a>

##### Lesson — Edit hamza, endings and punctuation selectively

**ID:** `lesson.arabic-orthography-editing` · **Module:** `module.arabic-connected-writing` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-composition`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-special-spellings`, `skill.arabic-case-roles`

**Skill:** `skill.arabic-orthography-editing`

**Learning objectives:**

- Apply common spelling rules and prioritise recurring errors

- Demonstrate the outcome on a changed prompt: Revise your own earlier draft without automated rewriting.



**Key concepts:** hamza seats; ة/ت/ه; ى/ي; Arabic punctuation; proofreading.

**Arabic example:** ؟ ، ؛ — Question mark, comma and semicolon

**Practical exercise** (`exercise.arabic-orthography-editing`): Edit a supplied twelve-error paragraph using a reference; distinguish optional vowel marks from mandatory letters.

**Evidence to keep:** An annotated correction sheet and revised paragraph.

**Knowledge check** (`assessment.arabic-orthography-editing-check`):

- Are optional case-vowel omissions the same as wrong consonantal spelling?

- Should أ، إ and ا always be collapsed during spelling assessment?

- Correct هذة مدرسة جميلة and explain the changed letter.



**Mini challenge** (`exercise.arabic-orthography-editing-transfer`): Revise your own earlier draft without automated rewriting.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-w3c`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-email`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- An annotated correction sheet and revised paragraph submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise your own earlier draft without automated rewriting. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-feedback-rewrite"></a>

##### Lesson — Use feedback to improve a new piece of writing

**ID:** `lesson.arabic-feedback-rewrite` · **Module:** `module.arabic-connected-writing` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-a2-composition`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-formal-email`, `skill.arabic-summary-notes`, `skill.arabic-orthography-editing`

**Skill:** `skill.arabic-feedback-rewrite`

**Learning objectives:**

- Turn corrections into transferable editing habits

- Demonstrate the outcome on a changed prompt: Repeat the task a week later with a different purpose.



**Key concepts:** meaning pass; organisation pass; form pass; independent rewrite.

**Arabic example:** المُرَاجَعَةُ — Revision/review

**Practical exercise** (`exercise.arabic-feedback-rewrite`): Classify feedback on a draft, explain three changes and write a new text on a related prompt without seeing the corrected version.

**Evidence to keep:** Before/after drafts, three explanations and a delayed sample.

**Knowledge check** (`assessment.arabic-feedback-rewrite-check`):

- Does accepting every AI suggestion demonstrate learning?

- Why keep the original draft?

- A draft says هذه كتاب جديد. Correct it and explain the agreement choice, then write a new sentence about a school.



**Mini challenge** (`exercise.arabic-feedback-rewrite-transfer`): Repeat the task a week later with a different purpose.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-aljazeera`, `resource.arabic-w3c`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-email`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Before/after drafts, three explanations and a delayed sample submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat the task a week later with a different purpose. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Paragraphs, correspondence and revision: guided** (`lab.arabic-connected-writing-guided`, 45 min, splittable): Write an email and a short explanatory paragraph for different readers; exchange focused feedback.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Paragraphs, correspondence and revision: transfer** (`lab.arabic-connected-writing-transfer`, 75 min, splittable): Write a fresh text for a changed audience and explain three revisions you made yourself.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-connected-writing-performance` — Write a fresh text for a changed audience and explain three revisions you made yourself.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A practical correspondence pack (`project.arabic-correspondence`)

##### Project: A practical correspondence pack

**ID:** `project.arabic-correspondence`

**Goal:** Write for different readers and show what revision improved.

**Required skills:** `skill.arabic-formal-email`, `skill.arabic-summary-notes`, `skill.arabic-feedback-rewrite`

**Study time:** 5–8 hours; allocated once to `module.arabic-connected-writing`.

**Deliverables:**

- Information-request email

- Reply or rescheduling message

- 150-word explanation

- Drafts, focused feedback and delayed new writing



**Assessment criteria:**

- 25% — Purpose and requested action are clear

- 25% — Register suits the reader

- 25% — Reference and organisation support meaning

- 25% — The learner can reproduce improvements independently



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Demonstrates usable writing and editing habits.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-b1-integration"></a>

### Module 19 — B1 consolidation: explain, interact and learn independently

**ID:** `module.arabic-b1-integration` · **Path:** core · **Target:** B1 · **Difficulty:** 4/6

**Purpose:** Establish dependable connected communication before taking on dense media and argument.

**Entry prerequisites:** `skill.arabic-collocation-growth`, `skill.arabic-speaker-variety`, `skill.arabic-feedback-rewrite`, `skill.arabic-passive-voice`

**Other skills used by particular lessons:** `skill.arabic-collocation-growth`, `skill.arabic-feedback-rewrite`, `skill.arabic-opinion-repair`, `skill.arabic-paragraph-design`, `skill.arabic-passive-voice`, `skill.arabic-speaker-variety`

**Before entry:** Read selected unvowelled prose, sustain familiar discussions and revise connected writing.

**Estimated study time:** 40–58 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 2.5 h; allocated project work: 8–12 h; distributed practice/review: 22.5–36.5 h.

**Learning objectives:**

- Extract and compare the main points of audio and text

- Deliver a connected explanation supported by concise notes

- Respond meaningfully to unprepared questions on a familiar subject

- Select accessible material and turn repeated errors into practice

- Demonstrate connected independent performance and identify the next branch



**Topics:** Integrated comprehension (`topic.arabic-b1-integration-integrated-comprehension`); Integrated production (`topic.arabic-b1-integration-integrated-production`); Independent study (`topic.arabic-b1-integration-independent-study`); Stage checkpoint (`topic.arabic-b1-integration-stage-checkpoint`)



**Common mistakes:**

- Claiming equal proficiency in every skill from one strong project

- Using only material already rehearsed

- Confusing a polished recording with unrehearsed interaction



**Understand before progressing:**

- Explain a familiar subject, handle follow-up questions and maintain an independent practice cycle.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Explain a familiar subject, handle follow-up questions and maintain an independent practice cycle.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Integrated comprehension

**ID:** `topic.arabic-b1-integration-integrated-comprehension`



<a id="lesson.arabic-b1-source-task"></a>

##### Lesson — Understand two connected sources on one theme

**ID:** `lesson.arabic-b1-source-task` · **Module:** `module.arabic-b1-integration` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-collocation-growth`, `skill.arabic-speaker-variety`, `skill.arabic-feedback-rewrite`, `skill.arabic-passive-voice`

**Skill:** `skill.arabic-b1-source-task`

**Learning objectives:**

- Extract and compare the main points of audio and text

- Demonstrate the outcome on a changed prompt: Compare a second pair with a different viewpoint.



**Key concepts:** source comparison; overlap; difference; uncertainty.

**Arabic example:** المَصْدَرُ الأَوَّلُ — The first source

**Practical exercise** (`exercise.arabic-b1-source-task`): Use a two- to three-minute MSA clip and a 250–350-word article on a familiar theme; keep listening and reading scores separate.

**Evidence to keep:** Separate comprehension notes and a comparison map.

**Knowledge check** (`assessment.arabic-b1-source-task-check`):

- Does agreement between sources prove every claim true?

- Can reading the article first make the related audio easier?



**Mini challenge** (`exercise.arabic-b1-source-task-transfer`): Compare a second pair with a different viewpoint.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Separate comprehension notes and a comparison map submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Compare a second pair with a different viewpoint. Evidence: record support, prompt novelty and task conditions.



#### Topic — Integrated production

**ID:** `topic.arabic-b1-integration-integrated-production`



<a id="lesson.arabic-b1-explainer"></a>

##### Lesson — Explain a familiar topic clearly

**ID:** `lesson.arabic-b1-explainer` · **Module:** `module.arabic-b1-integration` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-collocation-growth`, `skill.arabic-speaker-variety`, `skill.arabic-feedback-rewrite`, `skill.arabic-passive-voice`, `skill.arabic-b1-source-task`, `skill.arabic-paragraph-design`

**Skill:** `skill.arabic-b1-explainer`

**Learning objectives:**

- Deliver a connected explanation supported by concise notes

- Demonstrate the outcome on a changed prompt: Explain the same idea to a listener with less background.



**Key concepts:** structure; examples; signposting; audience.

**Arabic example:** أَوَّلًا... ثَانِيًا... — First... second...

**Practical exercise** (`exercise.arabic-b1-explainer`): Prepare bullet notes, deliver a three-minute explanation and write a 150–200-word version for a learner audience.

**Evidence to keep:** A notes-based recording and written explanation.

**Knowledge check** (`assessment.arabic-b1-explainer-check`):

- Is reading a full written script equivalent to explaining from notes?

- How can examples improve comprehension?

- Write two brief Arabic signposts that organise a two-part explanation.



**Mini challenge** (`exercise.arabic-b1-explainer-transfer`): Explain the same idea to a listener with less background.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A notes-based recording and written explanation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain the same idea to a listener with less background. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-b1-unprepared"></a>

##### Lesson — Answer questions and manage an unexpected turn

**ID:** `lesson.arabic-b1-unprepared` · **Module:** `module.arabic-b1-integration` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-collocation-growth`, `skill.arabic-speaker-variety`, `skill.arabic-feedback-rewrite`, `skill.arabic-passive-voice`, `skill.arabic-b1-explainer`, `skill.arabic-opinion-repair`

**Skill:** `skill.arabic-b1-unprepared`

**Learning objectives:**

- Respond meaningfully to unprepared questions on a familiar subject

- Demonstrate the outcome on a changed prompt: Handle one changed assumption during the exchange.



**Key concepts:** follow-up; clarification; reformulation; limits.

**Arabic example:** لَسْتُ مُتَأَكِّدًا. — I am not sure. (male speaker)

**Practical exercise** (`exercise.arabic-b1-unprepared`): Have a partner ask four unprepared questions about your explainer, including one request for clarification and one challenge.

**Evidence to keep:** A six- to eight-minute exchange with recorded support.

**Knowledge check** (`assessment.arabic-b1-unprepared-check`):

- Must every question receive a confident answer?

- What shows the response was understood?

- Write a response that admits uncertainty and asks for clarification using لست متأكدًا or لست متأكدة.



**Mini challenge** (`exercise.arabic-b1-unprepared-transfer`): Handle one changed assumption during the exchange.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A six- to eight-minute exchange with recorded support submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Handle one changed assumption during the exchange. Evidence: record support, prompt novelty and task conditions.



#### Topic — Independent study

**ID:** `topic.arabic-b1-integration-independent-study`



<a id="lesson.arabic-b1-independent-cycle"></a>

##### Lesson — Choose input and create a sustainable feedback loop

**ID:** `lesson.arabic-b1-independent-cycle` · **Module:** `module.arabic-b1-integration` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-collocation-growth`, `skill.arabic-speaker-variety`, `skill.arabic-feedback-rewrite`, `skill.arabic-passive-voice`, `skill.arabic-b1-source-task`

**Skill:** `skill.arabic-b1-independent-cycle`

**Learning objectives:**

- Select accessible material and turn repeated errors into practice

- Demonstrate the outcome on a changed prompt: Adjust the plan after a low-energy week using evidence.



**Key concepts:** interest; difficulty fit; source log; error priorities.

**Arabic example:** خُطَّةُ التَّعَلُّمِ — Learning plan

**Practical exercise** (`exercise.arabic-b1-independent-cycle`): Plan a two-week cycle with reading, listening, conversation and writing; pick two recurring errors and design fresh checks.

**Evidence to keep:** A two-week plan and two targeted error checks.

**Knowledge check** (`assessment.arabic-b1-independent-cycle-check`):

- Should harder material always replace comprehensible material?

- How many errors should one short revision task target?



**Mini challenge** (`exercise.arabic-b1-independent-cycle-transfer`): Adjust the plan after a low-energy week using evidence.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A two-week plan and two targeted error checks submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Adjust the plan after a low-energy week using evidence. Evidence: record support, prompt novelty and task conditions.



#### Topic — Stage checkpoint

**ID:** `topic.arabic-b1-integration-stage-checkpoint`



<a id="lesson.arabic-b1-portfolio"></a>

##### Lesson — B1 checkpoint and specialist exploration

**ID:** `lesson.arabic-b1-portfolio` · **Module:** `module.arabic-b1-integration` · **Difficulty:** 4/6 · **Target:** B1

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-collocation-growth`, `skill.arabic-speaker-variety`, `skill.arabic-feedback-rewrite`, `skill.arabic-passive-voice`, `skill.arabic-b1-source-task`, `skill.arabic-b1-explainer`, `skill.arabic-b1-unprepared`, `skill.arabic-b1-independent-cycle`

**Skill:** `skill.arabic-b1-portfolio`

**Learning objectives:**

- Demonstrate connected independent performance and identify the next branch

- Demonstrate the outcome on a changed prompt: Explain your next choice using observed strengths and gaps.



**Key concepts:** fresh input; four-skill profile; transfer; branch prerequisites.

**Arabic example:** أَسْتَطِيعُ أَنْ أَشْرَحَ الْفِكْرَةَ. — I can explain the idea.

**Practical exercise** (`exercise.arabic-b1-portfolio`): Complete four stage tasks plus a delayed changed-topic sample; choose media, technology or a later specialist interest.

**Evidence to keep:** A four-skill checkpoint and evidence-based next-step choice.

**Knowledge check** (`assessment.arabic-b1-portfolio-check`):

- Does completing this course stage establish an official B1 rating?

- Must every specialist branch be completed next?



**Mini challenge** (`exercise.arabic-b1-portfolio-transfer`): Explain your next choice using observed strengths and gaps.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-study-method`, `asset.arabic-community-library`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A four-skill checkpoint and evidence-based next-step choice submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain your next choice using observed strengths and gaps. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**B1 consolidation: explain, interact and learn independently: guided** (`lab.arabic-b1-integration-guided`, 45 min, splittable): Prepare a small explainer from two accessible sources, then deliver it and answer unprepared questions.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**B1 consolidation: explain, interact and learn independently: transfer** (`lab.arabic-b1-integration-transfer`, 75 min, splittable): Repeat the core functions on a new topic with reduced scaffolding and a delayed follow-up.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-b1-integration-performance` — Repeat the core functions on a new topic with reduced scaffolding and a delayed follow-up.

Allow 120 minutes across short sessions, plus 30 minutes for a changed task on another day.

- Overall rubric at least 80/100

- Every required observed modality at least 70/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A source-based Fuṣḥā explainer (`project.arabic-explainer`)

##### Project: A source-based Fuṣḥā explainer

**ID:** `project.arabic-explainer`

**Goal:** Explain a familiar subject and answer questions without a full script.

**Required skills:** `skill.arabic-b1-source-task`, `skill.arabic-b1-explainer`, `skill.arabic-b1-unprepared`

**Study time:** 8–12 hours; allocated once to `module.arabic-b1-integration`.

**Deliverables:**

- Two source notes, including one audio source

- 150–200-word written explanation

- Three-minute notes-based talk

- Unprepared Q&A and delayed changed-topic sample



**Assessment criteria:**

- 25% — Source meanings are accurately represented

- 25% — The explanation is coherent and understandable

- 25% — Responses address the actual questions

- 25% — Limits and assistance are explicit



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** An integrated B1-target portfolio sample with evidence across skills.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-media"></a>

### Module 20 — News, interviews and public information

**ID:** `module.arabic-media` · **Path:** core · **Target:** B2 · **Difficulty:** 5/6

**Purpose:** Read and listen to formal public Arabic while checking attribution and uncertainty.

**Entry prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-reported-information`, `skill.arabic-passive-voice`

**Other skills used by particular lessons:** `skill.arabic-b1-portfolio`, `skill.arabic-passive-voice`, `skill.arabic-quantity-comparison`, `skill.arabic-reported-information`, `skill.arabic-speaker-variety`, `skill.arabic-summary-notes`

**Before entry:** Follow connected MSA on familiar themes and distinguish claims from direct observations.

**Estimated study time:** 55–80 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 8–12 h; distributed practice/review: 39–60 h.

**Learning objectives:**

- Interpret compressed headline language using the lead paragraph

- Preserve degree of certainty and source attribution

- Preserve numbers, units, dates and comparative direction

- Separate the question, answer, example and evasion in formal audio

- Combine sources without erasing their differences



**Topics:** Media reading (`topic.arabic-media-media-reading`); Media detail (`topic.arabic-media-media-detail`); Media listening (`topic.arabic-media-media-listening`); Media synthesis (`topic.arabic-media-media-synthesis`)



**Common mistakes:**

- Assuming a headline is a complete grammatical sentence

- Missing dates, quantities or negation

- Repeating a quoted allegation as an established fact



**Understand before progressing:**

- Summarise reports, understand headlines and compare accounts without importing unsupported facts.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Summarise reports, understand headlines and compare accounts without importing unsupported facts.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Media reading

**ID:** `topic.arabic-media-media-reading`



<a id="lesson.arabic-headlines-leads"></a>

##### Lesson — Read headlines and recover the fuller report

**ID:** `lesson.arabic-headlines-leads` · **Module:** `module.arabic-media` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-reported-information`, `skill.arabic-passive-voice`

**Skill:** `skill.arabic-headlines-leads`

**Learning objectives:**

- Interpret compressed headline language using the lead paragraph

- Demonstrate the outcome on a changed prompt: Write a faithful headline for an unseen short report.



**Key concepts:** nominal headlines; ellipsis; headline versus detail.

**Arabic example:** افْتِتَاحُ مَكْتَبَةٍ جَدِيدَةٍ — Opening of a new library

**Practical exercise** (`exercise.arabic-headlines-leads`): Compare five headlines with their opening paragraphs and identify what the headline leaves unstated.

**Evidence to keep:** Five headline maps and one original headline.

**Knowledge check** (`assessment.arabic-headlines-leads-check`):

- Does a headline always state the event's time and full context?

- Should an omitted actor be invented to make a headline sound complete?

- For the headline افتتاح مكتبة جديدة, list one fact stated and two details not supplied.



**Mini challenge** (`exercise.arabic-headlines-leads-transfer`): Write a faithful headline for an unseen short report.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Five headline maps and one original headline submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Write a faithful headline for an unseen short report. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-news-language"></a>

##### Lesson — Read reporting verbs, passive forms and qualifications

**ID:** `lesson.arabic-news-language` · **Module:** `module.arabic-media` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-reported-information`, `skill.arabic-passive-voice`, `skill.arabic-headlines-leads`

**Skill:** `skill.arabic-news-language`

**Learning objectives:**

- Preserve degree of certainty and source attribution

- Demonstrate the outcome on a changed prompt: Summarise a new report using appropriate attribution.



**Key concepts:** أعلن أفاد بحسب; passive; قد; qualification.

**Arabic example:** بِحَسَبِ التَّقْرِيرِ — According to the report

**Practical exercise** (`exercise.arabic-news-language`): Annotate a report for who claims what, how certain it is and which details are unknown; rewrite two overconfident summaries.

**Evidence to keep:** An attribution map and two corrected summaries.

**Knowledge check** (`assessment.arabic-news-language-check`):

- Does أفاد مسؤول establish the claim independently?

- Can قد be translated identically in every construction?

- Explain the effect of بحسب التقرير in بحسب التقرير، ارتفع العدد.



**Mini challenge** (`exercise.arabic-news-language-transfer`): Summarise a new report using appropriate attribution.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- An attribution map and two corrected summaries submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Summarise a new report using appropriate attribution. Evidence: record support, prompt novelty and task conditions.



#### Topic — Media detail

**ID:** `topic.arabic-media-media-detail`



<a id="lesson.arabic-numbers-data"></a>

##### Lesson — Understand reported quantities and comparisons

**ID:** `lesson.arabic-numbers-data` · **Module:** `module.arabic-media` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-reported-information`, `skill.arabic-passive-voice`, `skill.arabic-quantity-comparison`, `skill.arabic-news-language`

**Skill:** `skill.arabic-numbers-data`

**Learning objectives:**

- Preserve numbers, units, dates and comparative direction

- Demonstrate the outcome on a changed prompt: Describe a small original chart in three Arabic sentences.



**Key concepts:** percentages; increase/decrease; large numbers; units.

**Arabic example:** ارْتَفَعَ العَدَدُ. — The number increased.

**Practical exercise** (`exercise.arabic-numbers-data`): Extract ten quantities from a text or verified audio, normalise both digit sets and check whether each value rose or fell.

**Evidence to keep:** Ten verified data items and a short description.

**Knowledge check** (`assessment.arabic-numbers-data-check`):

- Is an increase of five units the same as five percent?

- Can dropping a unit change the meaning of a correct number?

- A fictional report says ارتفع العدد من ١٠٠ إلى ١٢٠. State the starting value, final value and absolute increase.



**Mini challenge** (`exercise.arabic-numbers-data-transfer`): Describe a small original chart in three Arabic sentences.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Ten verified data items and a short description submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Describe a small original chart in three Arabic sentences. Evidence: record support, prompt novelty and task conditions.



#### Topic — Media listening

**ID:** `topic.arabic-media-media-listening`



<a id="lesson.arabic-interview-notes"></a>

##### Lesson — Follow a formal interview or public explanation

**ID:** `lesson.arabic-interview-notes` · **Module:** `module.arabic-media` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-reported-information`, `skill.arabic-passive-voice`, `skill.arabic-speaker-variety`, `skill.arabic-news-language`

**Skill:** `skill.arabic-interview-notes`

**Learning objectives:**

- Separate the question, answer, example and evasion in formal audio

- Demonstrate the outcome on a changed prompt: Give a two-minute oral summary from notes.



**Key concepts:** speaker roles; topic change; stance; selective notes.

**Arabic example:** أَشَارَ إِلَى أَنَّ... — He indicated that...

**Practical exercise** (`exercise.arabic-interview-notes`): Use a verified four- to five-minute mostly-MSA interview; note two claims, two examples and one unanswered point; label mixed-register stretches.

**Evidence to keep:** Time-stamped listening notes and a faithful summary.

**Knowledge check** (`assessment.arabic-interview-notes-check`):

- Does a long answer always answer the original question?

- Should an untranscribed dialect passage be scored as learned MSA?

- A source says لم نحدد الموعد بعد. Write a note that preserves its uncertainty.



**Mini challenge** (`exercise.arabic-interview-notes-transfer`): Give a two-minute oral summary from notes.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Time-stamped listening notes and a faithful summary submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Give a two-minute oral summary from notes. Evidence: record support, prompt novelty and task conditions.



#### Topic — Media synthesis

**ID:** `topic.arabic-media-media-synthesis`



<a id="lesson.arabic-news-digest"></a>

##### Lesson — Produce a balanced short digest

**ID:** `lesson.arabic-news-digest` · **Module:** `module.arabic-media` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-reported-information`, `skill.arabic-passive-voice`, `skill.arabic-numbers-data`, `skill.arabic-interview-notes`, `skill.arabic-summary-notes`

**Skill:** `skill.arabic-news-digest`

**Learning objectives:**

- Combine sources without erasing their differences

- Demonstrate the outcome on a changed prompt: Update the digest after one new verified detail.



**Key concepts:** cross-source comparison; attribution; date; uncertainty.

**Arabic example:** مِنْ جِهَةٍ أُخْرَى — On the other hand/from another perspective

**Practical exercise** (`exercise.arabic-news-digest`): Create a 200-word digest and a two-minute audio briefing from two current or archived reports on one topic; record publication dates.

**Evidence to keep:** A sourced digest, recording and update note.

**Knowledge check** (`assessment.arabic-news-digest-check`):

- Must two differing sources be forced into one agreed account?

- Why keep source dates?

- Source A says سيبدأ المشروع في يناير; source B says لم يحدد الموعد بعد. Write one Arabic sentence preserving the disagreement.



**Mini challenge** (`exercise.arabic-news-digest-transfer`): Update the digest after one new verified detail.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-aljazeera`, `resource.arabic-gloss`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A sourced digest, recording and update note submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Update the digest after one new verified detail. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**News, interviews and public information: guided** (`lab.arabic-media-guided`, 45 min, splittable): Compare two reports on a non-sensitive public topic such as education, transport or science; track date, source and claim.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**News, interviews and public information: transfer** (`lab.arabic-media-transfer`, 75 min, splittable): Produce a short new digest from unseen sources and explain where the accounts differ.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-media-performance` — Produce a short new digest from unseen sources and explain where the accounts differ.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A small MSA media digest (`project.arabic-media-digest`)

##### Project: A small MSA media digest

**ID:** `project.arabic-media-digest`

**Goal:** Combine reports into a faithful digest while preserving attribution.

**Required skills:** `skill.arabic-news-language`, `skill.arabic-numbers-data`, `skill.arabic-news-digest`

**Study time:** 8–12 hours; allocated once to `module.arabic-media`.

**Deliverables:**

- Two source/date records

- Claim and quantity comparison

- 200-word digest

- Two-minute briefing and one update



**Assessment criteria:**

- 25% — Numbers, dates and negation are accurate

- 25% — Claims remain attributed

- 25% — Differences between sources are preserved

- 25% — The update changes only what the new evidence supports



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Shows practical media comprehension and synthesis.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-argument"></a>

### Module 21 — Argument, viewpoint and critical reading

**ID:** `module.arabic-argument` · **Path:** core · **Target:** B2 · **Difficulty:** 5/6

**Purpose:** Understand and construct reasoned positions rather than only recounting information.

**Entry prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`

**Other skills used by particular lessons:** `skill.arabic-b1-portfolio`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-opinion-repair`, `skill.arabic-paragraph-mapping`, `skill.arabic-relative-clauses`

**Before entry:** Explain a familiar topic, summarise a source and recognise logical connectors.

**Estimated study time:** 55–80 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 8–12 h; distributed practice/review: 39–60 h.

**Learning objectives:**

- Separate assertion, reason, example and evidence

- Qualify claims appropriately

- Distinguish explicit meaning from plausible implication

- Represent another position accurately before responding

- Sustain an evidence-based MSA discussion



**Topics:** Critical reading (`topic.arabic-argument-critical-reading`); Stance and nuance (`topic.arabic-argument-stance-and-nuance`); Reasoned production (`topic.arabic-argument-reasoned-production`)



**Common mistakes:**

- Confusing emotional vocabulary with evidence

- Treating implied meaning as certain

- Using connectors that overstate causal relationships



**Understand before progressing:**

- Evaluate support, distinguish implication from assertion and defend a qualified position.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Evaluate support, distinguish implication from assertion and defend a qualified position.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Critical reading

**ID:** `topic.arabic-argument-critical-reading`



<a id="lesson.arabic-claim-evidence"></a>

##### Lesson — Identify a claim and the support offered for it

**ID:** `lesson.arabic-claim-evidence` · **Module:** `module.arabic-argument` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`

**Skill:** `skill.arabic-claim-evidence`

**Learning objectives:**

- Separate assertion, reason, example and evidence

- Demonstrate the outcome on a changed prompt: Evaluate a fresh paragraph using the same categories.



**Key concepts:** claim; support; counterexample; source quality.

**Arabic example:** الحُجَّةُ وَالدَّلِيلُ — Argument and evidence

**Practical exercise** (`exercise.arabic-claim-evidence`): Mark a 400-word accessible opinion text; classify six statements by role and note unsupported claims.

**Evidence to keep:** An argument map with two justified limitations.

**Knowledge check** (`assessment.arabic-claim-evidence-check`):

- Is a vivid example the same as proof of a general rule?

- Can a text be linguistically clear but poorly supported?

- Read القراءة اليومية مفيدة؛ فقد ساعدتني على تعلم كلمات جديدة. Identify the general claim and the personal example.



**Mini challenge** (`exercise.arabic-claim-evidence-transfer`): Evaluate a fresh paragraph using the same categories.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`, `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- An argument map with two justified limitations submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Evaluate a fresh paragraph using the same categories. Evidence: record support, prompt novelty and task conditions.



#### Topic — Stance and nuance

**ID:** `topic.arabic-argument-stance-and-nuance`



<a id="lesson.arabic-stance-hedging"></a>

##### Lesson — Recognise and express degrees of commitment

**ID:** `lesson.arabic-stance-hedging` · **Module:** `module.arabic-argument` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-claim-evidence`

**Skill:** `skill.arabic-stance-hedging`

**Learning objectives:**

- Qualify claims appropriately

- Demonstrate the outcome on a changed prompt: State a reasoned position while naming one uncertainty.



**Key concepts:** ربما; من المحتمل; يبدو; certainty; scope.

**Arabic example:** مِنَ المُحْتَمَلِ أَنْ... — It is possible/probable that...

**Practical exercise** (`exercise.arabic-stance-hedging`): Rank six claims by certainty and revise three statements that overgeneralise from limited evidence.

**Evidence to keep:** Six stance judgements and three qualified revisions.

**Knowledge check** (`assessment.arabic-stance-hedging-check`):

- Do ربما and بالتأكيد express equal commitment?

- Can a cautious phrase repair a claim whose content is still false?

- Rewrite سيبدأ المشروع غدًا to mark possibility rather than certainty using ربما.



**Mini challenge** (`exercise.arabic-stance-hedging-transfer`): State a reasoned position while naming one uncertainty.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`, `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Six stance judgements and three qualified revisions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): State a reasoned position while naming one uncertainty. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-implicit-meaning"></a>

##### Lesson — Read implications without inventing intentions

**ID:** `lesson.arabic-implicit-meaning` · **Module:** `module.arabic-argument` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-stance-hedging`, `skill.arabic-relative-clauses`

**Skill:** `skill.arabic-implicit-meaning`

**Learning objectives:**

- Distinguish explicit meaning from plausible implication

- Demonstrate the outcome on a changed prompt: Explain an alternative reading of one passage.



**Key concepts:** inference; context; tone; alternative reading.

**Arabic example:** يَبْدُو أَنَّ... — It seems that...

**Practical exercise** (`exercise.arabic-implicit-meaning`): Analyse four short passages or verified clips; list what is said, what may be implied and another possible reading.

**Evidence to keep:** Four evidence-labelled interpretation notes.

**Knowledge check** (`assessment.arabic-implicit-meaning-check`):

- Is an inference automatically a fact about the speaker's intention?

- What strengthens an interpretation?

- Read لم يجب عن السؤال، بل غيّر الموضوع. State what the text says and one possible inference, clearly distinguished.



**Mini challenge** (`exercise.arabic-implicit-meaning-transfer`): Explain an alternative reading of one passage.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`, `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Four evidence-labelled interpretation notes submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain an alternative reading of one passage. Evidence: record support, prompt novelty and task conditions.



#### Topic — Reasoned production

**ID:** `topic.arabic-argument-reasoned-production`



<a id="lesson.arabic-counterargument"></a>

##### Lesson — Present and answer a fair counterargument

**ID:** `lesson.arabic-counterargument` · **Module:** `module.arabic-argument` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-claim-evidence`, `skill.arabic-stance-hedging`

**Skill:** `skill.arabic-counterargument`

**Learning objectives:**

- Represent another position accurately before responding

- Demonstrate the outcome on a changed prompt: Revise your conclusion after a strong objection.



**Key concepts:** concession; rebuttal; shared ground; scope.

**Arabic example:** مَعَ ذَلِكَ — Nevertheless

**Practical exercise** (`exercise.arabic-counterargument`): Write a 250-word argument with a fair opposing view and one concession; discuss it with a partner.

**Evidence to keep:** A reasoned draft and a recorded response.

**Knowledge check** (`assessment.arabic-counterargument-check`):

- Must disagreement mean misrepresenting the other position?

- What distinguishes a concession from abandoning the entire argument?

- Join الكتب الإلكترونية مريحة and قد تشتت الإشعارات الانتباه with a concession or contrast.



**Mini challenge** (`exercise.arabic-counterargument-transfer`): Revise your conclusion after a strong objection.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`, `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A reasoned draft and a recorded response submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise your conclusion after a strong objection. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-supported-debate"></a>

##### Lesson — Hold a structured discussion with evidence

**ID:** `lesson.arabic-supported-debate` · **Module:** `module.arabic-argument` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-cause-purpose-contrast`, `skill.arabic-paragraph-mapping`, `skill.arabic-implicit-meaning`, `skill.arabic-counterargument`, `skill.arabic-opinion-repair`

**Skill:** `skill.arabic-supported-debate`

**Learning objectives:**

- Sustain an evidence-based MSA discussion

- Demonstrate the outcome on a changed prompt: Switch sides and defend the strongest alternative fairly.



**Key concepts:** turn taking; reference to evidence; clarification; synthesis.

**Arabic example:** أَتَفَهَّمُ هَذِهِ الوِجْهَةَ، وَلَكِنْ... — I understand this perspective, but...

**Practical exercise** (`exercise.arabic-supported-debate`): Discuss a familiar education or technology question for eight minutes; reference two sources and summarise the partner's position accurately.

**Evidence to keep:** An eight-minute discussion and balanced closing summary.

**Knowledge check** (`assessment.arabic-supported-debate-check`):

- What does accurately restating the partner's view demonstrate?

- Is speaking fastest the main success criterion?

- Write a sentence that acknowledges another view before disagreeing respectfully.



**Mini challenge** (`exercise.arabic-supported-debate-transfer`): Switch sides and defend the strongest alternative fairly.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-transport-report`, `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- An eight-minute discussion and balanced closing summary submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Switch sides and defend the strongest alternative fairly. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Argument, viewpoint and critical reading: guided** (`lab.arabic-argument-guided`, 45 min, splittable): Map two short opinion pieces on a familiar issue and compare their claims, support and assumptions.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Argument, viewpoint and critical reading: transfer** (`lab.arabic-argument-transfer`, 75 min, splittable): Defend a position to a partner who offers a reasonable alternative, then revise one part of your argument.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-argument-performance` — Defend a position to a partner who offers a reasonable alternative, then revise one part of your argument.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A supported argument and discussion (`project.arabic-debate`)

##### Project: A supported argument and discussion

**ID:** `project.arabic-debate`

**Goal:** Present a qualified position and engage fairly with an alternative.

**Required skills:** `skill.arabic-stance-hedging`, `skill.arabic-counterargument`, `skill.arabic-supported-debate`

**Study time:** 8–12 hours; allocated once to `module.arabic-argument`.

**Deliverables:**

- Two short argument maps

- 250–350-word position piece

- Eight-minute discussion

- Revised conclusion after feedback



**Assessment criteria:**

- 25% — Claims have relevant support

- 25% — Opposing views are represented accurately

- 25% — The learner responds and repairs meaning

- 25% — Uncertainty and concessions are appropriate



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Demonstrates higher-level reasoning through Arabic.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-grammar-precision"></a>

### Module 22 — Grammar and orthography for precise reading

**ID:** `module.arabic-grammar-precision` · **Path:** core · **Target:** B2 · **Difficulty:** 5/6

**Purpose:** Resolve advanced structures that matter for accurate formal reading and editing.

**Entry prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-verb-moods`, `skill.arabic-inna-kana`, `skill.arabic-quantity-comparison`, `skill.arabic-orthography-editing`

**Other skills used by particular lessons:** `skill.arabic-b1-portfolio`, `skill.arabic-case-roles`, `skill.arabic-conditionals`, `skill.arabic-dual-sound-plurals`, `skill.arabic-inna-kana`, `skill.arabic-negation-system`, `skill.arabic-orthography-editing`, `skill.arabic-quantity-comparison`, `skill.arabic-verb-moods`

**Before entry:** Use core sentence patterns, moods, weak forms and selective grammatical analysis.

**Estimated study time:** 55–80 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 6–10 h; distributed practice/review: 41–62 h.

**Learning objectives:**

- Apply core agreement patterns with word-order awareness

- Distinguish common ḥāl and tamyīz from direct objects

- Check frequent number constructions and diptote behaviour with a reference

- Explain what is negated, restricted or excepted

- Edit formal prose while explaining evidence and acceptable alternatives



**Topics:** Precision structures (`topic.arabic-grammar-precision-precision-structures`); Meaning-sensitive grammar (`topic.arabic-grammar-precision-meaning-sensitive-grammar`); Editorial transfer (`topic.arabic-grammar-precision-editorial-transfer`)



**Common mistakes:**

- Applying verb-first agreement rules to every word order

- Treating every accusative as a direct object

- Rejecting acceptable variants without checking a reference



**Understand before progressing:**

- Analyse complex reference and agreement, interpret common advanced structures and edit formal prose.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Analyse complex reference and agreement, interpret common advanced structures and edit formal prose.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Precision structures

**ID:** `topic.arabic-grammar-precision-precision-structures`



<a id="lesson.arabic-word-order-agreement"></a>

##### Lesson — Verb-first and subject-first agreement

**ID:** `lesson.arabic-word-order-agreement` · **Module:** `module.arabic-grammar-precision` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-verb-moods`, `skill.arabic-inna-kana`, `skill.arabic-quantity-comparison`, `skill.arabic-orthography-editing`

**Skill:** `skill.arabic-word-order-agreement`

**Learning objectives:**

- Apply core agreement patterns with word-order awareness

- Demonstrate the outcome on a changed prompt: Explain a fresh sentence's agreement using its structure.



**Key concepts:** VSO; SVO; human plurals; gender; marked order.

**Arabic example:** حَضَرَ الطُّلَّابُ. / الطُّلَّابُ حَضَرُوا. — The students attended, in two word orders.

**Practical exercise** (`exercise.arabic-word-order-agreement`): Compare حضر الطلاب with الطلاب حضروا and parallel feminine examples; edit eight controlled sentences.

**Evidence to keep:** Eight edits and four structural explanations.

**Knowledge check** (`assessment.arabic-word-order-agreement-check`):

- In ordinary verb-first clauses with an overt plural human subject, is the verb usually plural?

- Does moving the subject before the verb leave all agreement unchanged?

- Put the subject first in حضر الطلاب, changing the verb as needed.



**Mini challenge** (`exercise.arabic-word-order-agreement-transfer`): Explain a fresh sentence's agreement using its structure.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Eight edits and four structural explanations submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain a fresh sentence's agreement using its structure. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-hal-tamyiz"></a>

##### Lesson — Circumstance and specification

**ID:** `lesson.arabic-hal-tamyiz` · **Module:** `module.arabic-grammar-precision` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-verb-moods`, `skill.arabic-inna-kana`, `skill.arabic-quantity-comparison`, `skill.arabic-orthography-editing`, `skill.arabic-case-roles`, `skill.arabic-word-order-agreement`

**Skill:** `skill.arabic-hal-tamyiz`

**Learning objectives:**

- Distinguish common ḥāl and tamyīz from direct objects

- Demonstrate the outcome on a changed prompt: Paraphrase three advanced constructions in simpler Arabic.



**Key concepts:** حال; تمييز; accusative functions; context.

**Arabic example:** عَادَ الطَّالِبُ مُتْعَبًا. — The student returned tired.

**Practical exercise** (`exercise.arabic-hal-tamyiz`): Analyse teacher-checked examples such as عاد الطالب متعبا and عشرون كتابا; explain which word describes circumstance or specifies quantity.

**Evidence to keep:** Six labelled examples and three paraphrases.

**Knowledge check** (`assessment.arabic-hal-tamyiz-check`):

- Is every accusative noun a direct object?

- What does متعبا describe in عاد الطالب متعبا?

- In عاد الطالب متعبًا, who was tired? In عشرون كتابًا, what does كتابًا specify?



**Mini challenge** (`exercise.arabic-hal-tamyiz-transfer`): Paraphrase three advanced constructions in simpler Arabic.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Six labelled examples and three paraphrases submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Paraphrase three advanced constructions in simpler Arabic. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-numbers-exceptions"></a>

##### Lesson — Fuller number patterns and restricted declension

**ID:** `lesson.arabic-numbers-exceptions` · **Module:** `module.arabic-grammar-precision` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-verb-moods`, `skill.arabic-inna-kana`, `skill.arabic-quantity-comparison`, `skill.arabic-orthography-editing`, `skill.arabic-dual-sound-plurals`

**Skill:** `skill.arabic-numbers-exceptions`

**Learning objectives:**

- Check frequent number constructions and diptote behaviour with a reference

- Demonstrate the outcome on a changed prompt: Correct a fresh short data paragraph using a reference openly.



**Key concepts:** 11–19; 20–99; hundreds; ممنوع من الصرف; definite/iḍāfa effects.

**Arabic example:** عِشْرُونَ كِتَابًا — Twenty books

**Practical exercise** (`exercise.arabic-numbers-exceptions`): Verify six counted phrases including 13 and 20, then compare مررت بأحمدَ with a supplied regular noun example; do not generalise across all names.

**Evidence to keep:** Six verified counts and four case explanations.

**Knowledge check** (`assessment.arabic-numbers-exceptions-check`):

- Does a diptote normally take tanwīn?

- Can a diptote's genitive marking differ when definite or in iḍāfa?

- Write thirteen books and thirteen letters using كتاب and رسالة.



**Mini challenge** (`exercise.arabic-numbers-exceptions-transfer`): Correct a fresh short data paragraph using a reference openly.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Six verified counts and four case explanations submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Correct a fresh short data paragraph using a reference openly. Evidence: record support, prompt novelty and task conditions.



#### Topic — Meaning-sensitive grammar

**ID:** `topic.arabic-grammar-precision-meaning-sensitive-grammar`



<a id="lesson.arabic-negation-exception"></a>

##### Lesson — Scope, restriction and exception

**ID:** `lesson.arabic-negation-exception` · **Module:** `module.arabic-grammar-precision` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-verb-moods`, `skill.arabic-inna-kana`, `skill.arabic-quantity-comparison`, `skill.arabic-orthography-editing`, `skill.arabic-negation-system`, `skill.arabic-conditionals`

**Skill:** `skill.arabic-negation-exception`

**Learning objectives:**

- Explain what is negated, restricted or excepted

- Demonstrate the outcome on a changed prompt: Rewrite an ambiguous restriction so its intended scope is clear.



**Key concepts:** إلا; إنما; لا النافية للجنس; scope; construction-specific case.

**Arabic example:** لَا شَكَّ فِي ذَلِكَ. — There is no doubt about that.

**Practical exercise** (`exercise.arabic-negation-exception`): Compare limited, teacher-checked sentences expressing only, no and except; paraphrase each before analysing endings.

**Evidence to keep:** Six paraphrases and two clarity revisions.

**Knowledge check** (`assessment.arabic-negation-exception-check`):

- Does moving a negator or exception phrase always preserve meaning?

- Can إلا constructions be assigned one case rule without inspecting the sentence?

- Paraphrase لم يقرأ إلا كتابًا واحدًا without losing the restriction.



**Mini challenge** (`exercise.arabic-negation-exception-transfer`): Rewrite an ambiguous restriction so its intended scope is clear.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- Six paraphrases and two clarity revisions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Rewrite an ambiguous restriction so its intended scope is clear. Evidence: record support, prompt novelty and task conditions.



#### Topic — Editorial transfer

**ID:** `topic.arabic-grammar-precision-editorial-transfer`



<a id="lesson.arabic-precision-edit"></a>

##### Lesson — Integrate grammar with meaning-focused editing

**ID:** `lesson.arabic-precision-edit` · **Module:** `module.arabic-grammar-precision` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-verb-moods`, `skill.arabic-inna-kana`, `skill.arabic-quantity-comparison`, `skill.arabic-orthography-editing`, `skill.arabic-word-order-agreement`, `skill.arabic-hal-tamyiz`, `skill.arabic-numbers-exceptions`, `skill.arabic-negation-exception`

**Skill:** `skill.arabic-precision-edit`

**Learning objectives:**

- Edit formal prose while explaining evidence and acceptable alternatives

- Demonstrate the outcome on a changed prompt: Analyse a new paragraph and identify one unresolved ambiguity responsibly.



**Key concepts:** hamza review; agreement; scope; vocalisation; reference use.

**Arabic example:** التَّدْقِيقُ اللُّغَوِيُّ — Language editing/proofreading

**Practical exercise** (`exercise.arabic-precision-edit`): Edit a 250-word text; explain five changes and leave two acceptable variants unchanged with reasons.

**Evidence to keep:** An edited text, five explanations and an uncertainty note.

**Knowledge check** (`assessment.arabic-precision-edit-check`):

- Should every stylistic preference be marked as a grammar error?

- When is full vocalisation useful here?

- Correct الطلاب يدرس العربية and explain the agreement change.



**Mini challenge** (`exercise.arabic-precision-edit-transfer`): Analyse a new paragraph and identify one unresolved ambiguity responsibly.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-aljazeera`, `resource.arabic-oxford-dictionary`, `resource.arabic-langmedia`. The catalogue below gives verified links.

**Completion criteria:**

- An edited text, five explanations and an uncertainty note submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Analyse a new paragraph and identify one unresolved ambiguity responsibly. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Grammar and orthography for precise reading: guided** (`lab.arabic-grammar-precision-guided`, 45 min, splittable): Edit a 350-word constructed report containing deliberate agreement, number, spelling and reference errors.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Grammar and orthography for precise reading: transfer** (`lab.arabic-grammar-precision-transfer`, 75 min, splittable): Explain three structures from an unseen text, including one genuine ambiguity, without overclaiming certainty.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-grammar-precision-performance` — Explain three structures from an unseen text, including one genuine ambiguity, without overclaiming certainty.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A meaning-focused editing dossier (`project.arabic-editor`)

##### Project: A meaning-focused editing dossier

**ID:** `project.arabic-editor`

**Goal:** Explain how grammar and spelling affect meaning in formal prose.

**Required skills:** `skill.arabic-precision-edit`, `skill.arabic-hal-tamyiz`, `skill.arabic-numbers-exceptions`

**Study time:** 6–10 hours; allocated once to `module.arabic-grammar-precision`.

**Deliverables:**

- Edited 350-word constructed report

- Ten justified corrections

- Two acceptable alternatives retained

- Fresh-paragraph analysis with one ambiguity



**Assessment criteria:**

- 25% — Corrections are supported by structure or reference

- 25% — Meaning improves without unsupported rewriting

- 25% — Style preferences are separated from errors

- 25% — Uncertainty is recorded where appropriate



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Shows careful reading and informed editorial judgement.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-b2-communication"></a>

### Module 23 — Extended speaking, essays and presentations

**ID:** `module.arabic-b2-communication` · **Path:** core · **Target:** B2 · **Difficulty:** 5/6

**Purpose:** Communicate sustained, structured ideas to an audience and respond flexibly.

**Entry prerequisites:** `skill.arabic-supported-debate`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-feedback-rewrite`

**Other skills used by particular lessons:** `skill.arabic-feedback-rewrite`, `skill.arabic-formal-email`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-supported-debate`

**Before entry:** Discuss viewpoints, synthesise sources and revise formal language using references.

**Estimated study time:** 55–80 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 10–15 h; distributed practice/review: 37–57 h.

**Learning objectives:**

- Plan and write a coherent multi-paragraph essay

- Deliver a structured five-minute MSA presentation

- Handle unscripted follow-up without fabricating certainty

- Adapt one message for a formal reader and a learner audience

- Identify the next improvements from observed performance



**Topics:** Extended production (`topic.arabic-b2-communication-extended-production`); Extended interaction (`topic.arabic-b2-communication-extended-interaction`); Audience adaptation (`topic.arabic-b2-communication-audience-adaptation`); Performance review (`topic.arabic-b2-communication-performance-review`)



**Common mistakes:**

- Confusing a polished AI-generated essay with personal competence

- Reading all presentation slides aloud

- Overcorrecting every ending until meaning and fluency collapse



**Understand before progressing:**

- Deliver a substantial presentation, write an organised essay and adapt to follow-up questions.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Deliver a substantial presentation, write an organised essay and adapt to follow-up questions.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Extended production

**ID:** `topic.arabic-b2-communication-extended-production`



<a id="lesson.arabic-essay-architecture"></a>

##### Lesson — Develop an extended written argument

**ID:** `lesson.arabic-essay-architecture` · **Module:** `module.arabic-b2-communication` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-supported-debate`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-feedback-rewrite`

**Skill:** `skill.arabic-essay-architecture`

**Learning objectives:**

- Plan and write a coherent multi-paragraph essay

- Demonstrate the outcome on a changed prompt: Rewrite the outline for a reader with a different concern.



**Key concepts:** thesis; paragraph roles; counterargument; conclusion.

**Arabic example:** فِي الخِتَامِ — In conclusion

**Practical exercise** (`exercise.arabic-essay-architecture`): Write 300–400 words on a familiar public topic using two sources; keep source facts separate from your position.

**Evidence to keep:** Outline, draft and source-attribution notes.

**Knowledge check** (`assessment.arabic-essay-architecture-check`):

- Does each paragraph need a new unrelated idea?

- Can a conclusion introduce an unsupported major claim?

- Write a concluding sentence beginning في الختام that summarises a choice already argued for, without adding a new fact.



**Mini challenge** (`exercise.arabic-essay-architecture-transfer`): Rewrite the outline for a reader with a different concern.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-ryding`, `resource.arabic-aljazeera`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Outline, draft and source-attribution notes submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Rewrite the outline for a reader with a different concern. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-presentation-design"></a>

##### Lesson — Speak from notes to a real audience

**ID:** `lesson.arabic-presentation-design` · **Module:** `module.arabic-b2-communication` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-supported-debate`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-feedback-rewrite`, `skill.arabic-essay-architecture`

**Skill:** `skill.arabic-presentation-design`

**Learning objectives:**

- Deliver a structured five-minute MSA presentation

- Demonstrate the outcome on a changed prompt: Deliver a two-minute version preserving the essential message.



**Key concepts:** opening; signposts; examples; clear ending; timing.

**Arabic example:** سَأَتَنَاوَلُ ثَلَاثَ نِقَاطٍ. — I will address three points.

**Practical exercise** (`exercise.arabic-presentation-design`): Create at most five cue cards, record a five-minute explanation and ask a listener to summarise the main points.

**Evidence to keep:** Cue cards, two recordings and listener feedback.

**Knowledge check** (`assessment.arabic-presentation-design-check`):

- Do attractive slides compensate for unclear speech?

- Why use brief cue cards rather than a full script for this task?

- Write an opening that announces three points using سأتناول.



**Mini challenge** (`exercise.arabic-presentation-design-transfer`): Deliver a two-minute version preserving the essential message.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-ryding`, `resource.arabic-aljazeera`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Cue cards, two recordings and listener feedback submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Deliver a two-minute version preserving the essential message. Evidence: record support, prompt novelty and task conditions.



#### Topic — Extended interaction

**ID:** `topic.arabic-b2-communication-extended-interaction`



<a id="lesson.arabic-qa-spontaneity"></a>

##### Lesson — Answer, clarify and qualify under questioning

**ID:** `lesson.arabic-qa-spontaneity` · **Module:** `module.arabic-b2-communication` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-supported-debate`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-feedback-rewrite`, `skill.arabic-presentation-design`

**Skill:** `skill.arabic-qa-spontaneity`

**Learning objectives:**

- Handle unscripted follow-up without fabricating certainty

- Demonstrate the outcome on a changed prompt: Respond to a polite objection that changes one assumption.



**Key concepts:** question focus; reformulation; limits; example.

**Arabic example:** هَلْ تَقْصِدُ أَنَّ...؟ — Do you mean that...?

**Practical exercise** (`exercise.arabic-qa-spontaneity`): Have a partner ask five unprepared questions; answer directly, clarify one ambiguity and acknowledge one knowledge limit.

**Evidence to keep:** A recorded Q&A with five relevant responses.

**Knowledge check** (`assessment.arabic-qa-spontaneity-check`):

- Is answering a different easier question successful task completion?

- Can admitting uncertainty support a strong performance?

- Write a clarification question beginning هل تقصد أن.



**Mini challenge** (`exercise.arabic-qa-spontaneity-transfer`): Respond to a polite objection that changes one assumption.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-ryding`, `resource.arabic-aljazeera`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A recorded Q&A with five relevant responses submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Respond to a polite objection that changes one assumption. Evidence: record support, prompt novelty and task conditions.



#### Topic — Audience adaptation

**ID:** `topic.arabic-b2-communication-audience-adaptation`



<a id="lesson.arabic-register-adaptation"></a>

##### Lesson — Change audience and purpose while retaining meaning

**ID:** `lesson.arabic-register-adaptation` · **Module:** `module.arabic-b2-communication` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-supported-debate`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-feedback-rewrite`, `skill.arabic-formal-email`, `skill.arabic-essay-architecture`, `skill.arabic-qa-spontaneity`

**Skill:** `skill.arabic-register-adaptation`

**Learning objectives:**

- Adapt one message for a formal reader and a learner audience

- Demonstrate the outcome on a changed prompt: Explain the same issue to two listeners with different background knowledge.



**Key concepts:** register; density; terminology; explanation; MSA boundary.

**Arabic example:** بِعِبَارَةٍ أَبْسَطَ — In simpler terms

**Practical exercise** (`exercise.arabic-register-adaptation`): Turn a technical paragraph into a plain-MSA explanation and a concise formal email; justify what you changed.

**Evidence to keep:** Three versions and an adaptation note.

**Knowledge check** (`assessment.arabic-register-adaptation-check`):

- Does simplifying require switching to dialect?

- Can simplification omit a crucial qualification?

- Paraphrase ينبغي التحقق من المعلومات قبل نشرها in simpler MSA while retaining the obligation to check first.



**Mini challenge** (`exercise.arabic-register-adaptation-transfer`): Explain the same issue to two listeners with different background knowledge.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-ryding`, `resource.arabic-aljazeera`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Three versions and an adaptation note submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain the same issue to two listeners with different background knowledge. Evidence: record support, prompt novelty and task conditions.



#### Topic — Performance review

**ID:** `topic.arabic-b2-communication-performance-review`



<a id="lesson.arabic-b2-output-review"></a>

##### Lesson — Review accuracy, range, fluency and responsiveness

**ID:** `lesson.arabic-b2-output-review` · **Module:** `module.arabic-b2-communication` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-supported-debate`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-feedback-rewrite`, `skill.arabic-register-adaptation`, `skill.arabic-qa-spontaneity`

**Skill:** `skill.arabic-b2-output-review`

**Learning objectives:**

- Identify the next improvements from observed performance

- Demonstrate the outcome on a changed prompt: Demonstrate the two selected improvements a week later.



**Key concepts:** task success; coherence; range; accuracy; intelligibility.

**Arabic example:** وُضُوحُ المَعْنَى — Clarity of meaning

**Practical exercise** (`exercise.arabic-b2-output-review`): Review your essay and presentation using separate writing and speaking rubrics; select two high-impact revisions and repeat on a new topic.

**Evidence to keep:** Dimension scores and two delayed improvement samples.

**Knowledge check** (`assessment.arabic-b2-output-review-check`):

- Can one overall score hide a listening or interaction weakness?

- Does perfect grammar alone establish a successful presentation?



**Mini challenge** (`exercise.arabic-b2-output-review-transfer`): Demonstrate the two selected improvements a week later.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-ryding`, `resource.arabic-aljazeera`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-digital-reading`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Dimension scores and two delayed improvement samples submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Demonstrate the two selected improvements a week later. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Extended speaking, essays and presentations: guided** (`lab.arabic-b2-communication-guided`, 45 min, splittable): Prepare a five-minute source-based presentation and a related 350-word essay with a revision record.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Extended speaking, essays and presentations: transfer** (`lab.arabic-b2-communication-transfer`, 75 min, splittable): Give a shorter version for a different audience and answer unscripted questions with appropriate uncertainty.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-b2-communication-performance` — Give a shorter version for a different audience and answer unscripted questions with appropriate uncertainty.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** One idea for two audiences (`project.arabic-presentation`)

##### Project: One idea for two audiences

**ID:** `project.arabic-presentation`

**Goal:** Adapt an extended argument to different audiences and handle questions.

**Required skills:** `skill.arabic-essay-architecture`, `skill.arabic-qa-spontaneity`, `skill.arabic-register-adaptation`

**Study time:** 10–15 hours; allocated once to `module.arabic-b2-communication`.

**Deliverables:**

- 300–400-word essay

- Five-minute presentation from notes

- Two-minute plain-MSA version

- Unscripted Q&A and revision commentary



**Assessment criteria:**

- 25% — Structure supports the main message

- 25% — Adaptation preserves essential qualifications

- 25% — Speech is intelligible and responsive

- 25% — Independent work and assistance are distinguished



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Provides substantial writing, speaking and audience-adaptation evidence.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-b2-independent"></a>

### Module 24 — B2 consolidation and long-term independence

**ID:** `module.arabic-b2-independent` · **Path:** core · **Target:** B2 · **Difficulty:** 5/6

**Purpose:** Create a defensible evidence portfolio and a realistic route beyond the common core.

**Entry prerequisites:** `skill.arabic-b2-output-review`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`

**Other skills used by particular lessons:** `skill.arabic-b2-output-review`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`

**Before entry:** Understand extended selected media, develop arguments and handle follow-up questions in Fuṣḥā.

**Estimated study time:** 55–80 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 2.5 h; allocated project work: 12–18 h; distributed practice/review: 33.5–52.5 h.

**Learning objectives:**

- Understand extended selected MSA with explicit limits on support

- Produce organised independent language on a fresh suitable prompt

- Build a transparent profile of what you can and cannot yet do

- Choose an assessment matched to the needed skill and register

- Design a continuing plan with balanced practice and evidence



**Topics:** Core exit assessment (`topic.arabic-b2-independent-core-exit-assessment`); Portfolio and continuation (`topic.arabic-b2-independent-portfolio-and-continuation`)



**Common mistakes:**

- Declaring fluent from finishing a syllabus

- Using the same text for practice and final assessment

- Requiring every optional branch before recognising progress



**Understand before progressing:**

- Sustain independent study, assess skill-specific gaps and choose an advanced specialism.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Sustain independent study, assess skill-specific gaps and choose an advanced specialism.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Core exit assessment

**ID:** `topic.arabic-b2-independent-core-exit-assessment`



<a id="lesson.arabic-b2-listening-reading"></a>

##### Lesson — Interpret extended unfamiliar input

**ID:** `lesson.arabic-b2-listening-reading` · **Module:** `module.arabic-b2-independent` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b2-output-review`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`

**Skill:** `skill.arabic-b2-listening-reading`

**Learning objectives:**

- Understand extended selected MSA with explicit limits on support

- Demonstrate the outcome on a changed prompt: Interpret a second speaker's treatment of a related issue.



**Key concepts:** main argument; support; stance; detail; uncertainty.

**Arabic example:** المَوْقِفُ وَالتَّفَاصِيلُ — Position and details

**Practical exercise** (`exercise.arabic-b2-listening-reading`): Use a verified five- to eight-minute formal clip and a separate 600–800-word text; identify structure, claims and qualifications before transcript or dictionary review.

**Evidence to keep:** Separate listening and reading evidence with conditions recorded.

**Knowledge check** (`assessment.arabic-b2-listening-reading-check`):

- Should the text duplicate the recording for independent assessment?

- Is one misunderstood word always a failure?



**Mini challenge** (`exercise.arabic-b2-listening-reading-transfer`): Interpret a second speaker's treatment of a related issue.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Completion criteria:**

- Separate listening and reading evidence with conditions recorded submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Interpret a second speaker's treatment of a related issue. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-b2-unseen-output"></a>

##### Lesson — Write and discuss a fresh task

**ID:** `lesson.arabic-b2-unseen-output` · **Module:** `module.arabic-b2-independent` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b2-output-review`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-b2-listening-reading`

**Skill:** `skill.arabic-b2-unseen-output`

**Learning objectives:**

- Produce organised independent language on a fresh suitable prompt

- Demonstrate the outcome on a changed prompt: Repeat with a new audience after seven to fourteen days.



**Key concepts:** 300–450 words; 8–10-minute interaction; revision separation.

**Arabic example:** مُحَادَثَةٌ دُونَ نَصٍّ جَاهِزٍ — Conversation without a prepared script

**Practical exercise** (`exercise.arabic-b2-unseen-output`): Write an unaided first draft on a fresh familiar-domain prompt and complete an unscripted discussion; save later assisted revisions separately.

**Evidence to keep:** Unaided draft, discussion and separately labelled revision.

**Knowledge check** (`assessment.arabic-b2-unseen-output-check`):

- May an assisted polished version replace the initial evidence record?

- Does a memorised talk meet the interactive part?



**Mini challenge** (`exercise.arabic-b2-unseen-output-transfer`): Repeat with a new audience after seven to fourteen days.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Completion criteria:**

- Unaided draft, discussion and separately labelled revision submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat with a new audience after seven to fourteen days. Evidence: record support, prompt novelty and task conditions.



#### Topic — Portfolio and continuation

**ID:** `topic.arabic-b2-independent-portfolio-and-continuation`



<a id="lesson.arabic-portfolio-audit"></a>

##### Lesson — Audit evidence and describe your ability honestly

**ID:** `lesson.arabic-portfolio-audit` · **Module:** `module.arabic-b2-independent` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b2-output-review`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-b2-unseen-output`

**Skill:** `skill.arabic-portfolio-audit`

**Learning objectives:**

- Build a transparent profile of what you can and cannot yet do

- Demonstrate the outcome on a changed prompt: Ask a qualified teacher to challenge one claim with a new task.



**Key concepts:** dates; prompt novelty; support; raters; skill profile.

**Arabic example:** مِلَفُّ الإِنْجَازِ — Portfolio

**Practical exercise** (`exercise.arabic-portfolio-audit`): Select six evidence items, document conditions and write a short ability statement limited to the demonstrated contexts.

**Evidence to keep:** Six indexed samples and an honest ability statement.

**Knowledge check** (`assessment.arabic-portfolio-audit-check`):

- Can this portfolio guarantee performance in every Arabic-speaking setting?

- What distinguishes a trustworthy portfolio claim?



**Mini challenge** (`exercise.arabic-portfolio-audit-transfer`): Ask a qualified teacher to challenge one claim with a new task.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Completion criteria:**

- Six indexed samples and an honest ability statement submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Ask a qualified teacher to challenge one claim with a new task. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-external-assessment"></a>

##### Lesson — Choose external feedback or assessment if useful

**ID:** `lesson.arabic-external-assessment` · **Module:** `module.arabic-b2-independent` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b2-output-review`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-portfolio-audit`

**Skill:** `skill.arabic-external-assessment`

**Learning objectives:**

- Choose an assessment matched to the needed skill and register

- Demonstrate the outcome on a changed prompt: Draft three questions to ask an assessor about scope and feedback.



**Key concepts:** teacher evaluation; MSA OPI; separate skills; cost verification.

**Arabic example:** تَقْيِيمُ المَهَارَاتِ — Skills assessment

**Practical exercise** (`exercise.arabic-external-assessment`): Compare an independent teacher review with a currently available formal test; verify register, skills tested and purpose before paying.

**Evidence to keep:** An assessment decision with three verified scope questions.

**Knowledge check** (`assessment.arabic-external-assessment-check`):

- Does a speaking-only rating automatically certify reading and writing?

- Is MyDay authorised to issue an official ACTFL or CEFR rating through these tasks?



**Mini challenge** (`exercise.arabic-external-assessment-transfer`): Draft three questions to ask an assessor about scope and feedback.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Completion criteria:**

- An assessment decision with three verified scope questions submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Draft three questions to ask an assessor about scope and feedback. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-lifelong-plan"></a>

##### Lesson — Choose an advanced branch and keep the core alive

**ID:** `lesson.arabic-lifelong-plan` · **Module:** `module.arabic-b2-independent` · **Difficulty:** 5/6 · **Target:** B2

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b2-output-review`, `skill.arabic-news-digest`, `skill.arabic-precision-edit`, `skill.arabic-external-assessment`

**Skill:** `skill.arabic-lifelong-plan`

**Learning objectives:**

- Design a continuing plan with balanced practice and evidence

- Demonstrate the outcome on a changed prompt: Adjust the plan after a new diagnostic without discarding the portfolio.



**Key concepts:** branch choice; maintenance; new domains; periodic review.

**Arabic example:** التَّعَلُّمُ المُسْتَمِرُّ — Continuing learning

**Practical exercise** (`exercise.arabic-lifelong-plan`): Choose one optional branch, plan four weeks and preserve listening, conversation, reading and writing practice relevant to your goals.

**Evidence to keep:** A four-week continuation plan and next checkpoint.

**Knowledge check** (`assessment.arabic-lifelong-plan-check`):

- Must every branch be completed to use Fuṣḥā confidently?

- Does a long break erase all prior achievement?



**Mini challenge** (`exercise.arabic-lifelong-plan-transfer`): Adjust the plan after a new diagnostic without discarding the portfolio.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-gloss`. The catalogue below gives verified links.

**Completion criteria:**

- A four-week continuation plan and next checkpoint submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Adjust the plan after a new diagnostic without discarding the portfolio. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**B2 consolidation and long-term independence: guided** (`lab.arabic-b2-independent-guided`, 45 min, splittable): Build a four-skill dossier from unseen listening, reading, writing and interaction tasks across two topics.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**B2 consolidation and long-term independence: transfer** (`lab.arabic-b2-independent-transfer`, 75 min, splittable): Repeat one weaker task after feedback using a new topic and a second speaker or reader.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-b2-independent-performance` — Repeat one weaker task after feedback using a new topic and a second speaker or reader.

Allow 120 minutes across short sessions, plus 30 minutes for a changed task on another day.

- Overall rubric at least 80/100

- Every required observed modality at least 70/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** The independent Fuṣḥā portfolio (`project.arabic-core-dossier`)

##### Project: The independent Fuṣḥā portfolio

**ID:** `project.arabic-core-dossier`

**Goal:** Demonstrate broad core abilities across fresh tasks and identify remaining gaps.

**Required skills:** `skill.arabic-b2-listening-reading`, `skill.arabic-b2-unseen-output`, `skill.arabic-portfolio-audit`, `skill.arabic-lifelong-plan`

**Study time:** 12–18 hours; allocated once to `module.arabic-b2-independent`.

**Deliverables:**

- Separate extended listening and reading checks

- Unaided 300–450-word draft plus later revision

- Eight- to ten-minute unrehearsed discussion

- Six indexed samples, delayed retest and continuation plan



**Assessment criteria:**

- 25% — Each required skill meets its own rubric

- 25% — Tasks include unseen content and changed contexts

- 25% — Evidence conditions and rater confidence are documented

- 25% — Ability claims stay within the demonstrated scope



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** A transparent record for a teacher, course application or personal development; not certification.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-academic"></a>

### Module 25 — Academic and professional Fuṣḥā

**ID:** `module.arabic-academic` · **Path:** academic-professional · **Target:** C1-extension · **Difficulty:** 6/6

**Purpose:** Develop advanced register and domain-specific communication after demonstrated core independence.

**Entry prerequisites:** `skill.arabic-lifelong-plan`

**Other skills used by particular lessons:** `skill.arabic-lifelong-plan`

**Before entry:** Have a current B2-target four-skill portfolio; domain expertise must be checked separately.

**Estimated study time:** 80–120 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 16–24 h; distributed practice/review: 56–88 h.

**Learning objectives:**

- Identify a specialist text's question, method and qualified conclusions

- Take organised notes while tracking argument and qualification

- Write an original synthesis rather than stitched paraphrases

- Communicate a recommendation with justified scope and alternatives

- Use independent feedback to plan continuing advanced development



**Topics:** Advanced comprehension (`topic.arabic-academic-advanced-comprehension`); Advanced production (`topic.arabic-academic-advanced-production`); Advanced calibration (`topic.arabic-academic-advanced-calibration`)



**Common mistakes:**

- Assuming advanced language equals expertise in the subject

- Importing unexplained terminology

- Claiming C1 after one polished report



**Understand before progressing:**

- Synthesize specialist material and deliver a reviewed professional or academic communication package.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Synthesize specialist material and deliver a reviewed professional or academic communication package.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Advanced comprehension

**ID:** `topic.arabic-academic-advanced-comprehension`



<a id="lesson.arabic-academic-reading"></a>

##### Lesson — Read dense disciplinary prose strategically

**ID:** `lesson.arabic-academic-reading` · **Module:** `module.arabic-academic` · **Difficulty:** 6/6 · **Target:** C1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`

**Skill:** `skill.arabic-academic-reading`

**Learning objectives:**

- Identify a specialist text's question, method and qualified conclusions

- Demonstrate the outcome on a changed prompt: Compare a second text's treatment of the same question.



**Key concepts:** disciplinary genre; abstract; method; limitations.

**Arabic example:** مَنْهَجِيَّةُ البَحْثِ — Research methodology

**Practical exercise** (`exercise.arabic-academic-reading`): Read a selected 800–1200-word accessible specialist text with legitimate access; annotate claim strength and necessary background knowledge.

**Evidence to keep:** A structured source note including limitations.

**Knowledge check** (`assessment.arabic-academic-reading-check`):

- Does understanding the vocabulary prove the method is sound?

- Should a limitation section be omitted from a summary because it is difficult?

- Explain the qualification in تشير النتائج الأولية إلى تحسن محتمل.



**Mini challenge** (`exercise.arabic-academic-reading-transfer`): Compare a second text's treatment of the same question.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A structured source note including limitations submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Compare a second text's treatment of the same question. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-lecture-notes"></a>

##### Lesson — Follow an extended formal talk

**ID:** `lesson.arabic-lecture-notes` · **Module:** `module.arabic-academic` · **Difficulty:** 6/6 · **Target:** C1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-academic-reading`

**Skill:** `skill.arabic-lecture-notes`

**Learning objectives:**

- Take organised notes while tracking argument and qualification

- Demonstrate the outcome on a changed prompt: Produce a concise briefing from notes before seeing the transcript.



**Key concepts:** lecture structure; definitions; examples; uncertainty.

**Arabic example:** تَعْرِيفُ المُصْطَلَحِ — Definition of the term

**Practical exercise** (`exercise.arabic-lecture-notes`): Listen to a verified 10–15-minute mostly-MSA lecture in the chosen field; record claims, definitions and questions, then check with source materials.

**Evidence to keep:** Lecture notes and a checked briefing.

**Knowledge check** (`assessment.arabic-lecture-notes-check`):

- Must notes transcribe every sentence?

- Can an unfamiliar technical term be silently guessed?

- Turn the spoken-style sentence سأعرض أولًا تعريف المصطلح، ثم مثالين into a compact Arabic outline.



**Mini challenge** (`exercise.arabic-lecture-notes-transfer`): Produce a concise briefing from notes before seeing the transcript.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- Lecture notes and a checked briefing submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Produce a concise briefing from notes before seeing the transcript. Evidence: record support, prompt novelty and task conditions.



#### Topic — Advanced production

**ID:** `topic.arabic-academic-advanced-production`



<a id="lesson.arabic-synthesis-citation"></a>

##### Lesson — Synthesize sources and attribute claims carefully

**ID:** `lesson.arabic-synthesis-citation` · **Module:** `module.arabic-academic` · **Difficulty:** 6/6 · **Target:** C1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-academic-reading`, `skill.arabic-lecture-notes`

**Skill:** `skill.arabic-synthesis-citation`

**Learning objectives:**

- Write an original synthesis rather than stitched paraphrases

- Demonstrate the outcome on a changed prompt: Revise a section after discovering conflicting evidence.



**Key concepts:** citation; agreement/disagreement; source quality; terminology.

**Arabic example:** تُشِيرُ النَّتَائِجُ إِلَى... — The results indicate...

**Practical exercise** (`exercise.arabic-synthesis-citation`): Draft a 600–800-word synthesis of three sources, preserving dates, disagreements and limitations; keep quotations minimal and attributed.

**Evidence to keep:** An attributed synthesis and revision log.

**Knowledge check** (`assessment.arabic-synthesis-citation-check`):

- Does translating a source remove the need to attribute it?

- What distinguishes synthesis from a list of summaries?

- Combine اتفق الباحثان على النتيجة and اختلفا في تفسيرها into one sentence.



**Mini challenge** (`exercise.arabic-synthesis-citation-transfer`): Revise a section after discovering conflicting evidence.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- An attributed synthesis and revision log submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise a section after discovering conflicting evidence. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-professional-brief"></a>

##### Lesson — Write for a decision and defend the recommendation

**ID:** `lesson.arabic-professional-brief` · **Module:** `module.arabic-academic` · **Difficulty:** 6/6 · **Target:** C1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-synthesis-citation`

**Skill:** `skill.arabic-professional-brief`

**Learning objectives:**

- Communicate a recommendation with justified scope and alternatives

- Demonstrate the outcome on a changed prompt: Adapt the recommendation for a less technical audience.



**Key concepts:** executive summary; recommendation; trade-off; Q&A.

**Arabic example:** التَّوْصِيَةُ الرَّئِيسِيَّةُ — The main recommendation

**Practical exercise** (`exercise.arabic-professional-brief`): Write a one-page brief and deliver a seven-minute presentation; answer questions about assumptions and alternatives.

**Evidence to keep:** A brief, presentation and unscripted Q&A.

**Knowledge check** (`assessment.arabic-professional-brief-check`):

- Does persuasive style justify overstating evidence?

- What makes a recommendation usable?

- Write a recommendation beginning أوصي بـ and give one reason in a separate clause.



**Mini challenge** (`exercise.arabic-professional-brief-transfer`): Adapt the recommendation for a less technical audience.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A brief, presentation and unscripted Q&A submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Adapt the recommendation for a less technical audience. Evidence: record support, prompt novelty and task conditions.



#### Topic — Advanced calibration

**ID:** `topic.arabic-academic-advanced-calibration`



<a id="lesson.arabic-advanced-review"></a>

##### Lesson — Calibrate advanced performance with expert feedback

**ID:** `lesson.arabic-advanced-review` · **Module:** `module.arabic-academic` · **Difficulty:** 6/6 · **Target:** C1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-professional-brief`

**Skill:** `skill.arabic-advanced-review`

**Learning objectives:**

- Use independent feedback to plan continuing advanced development

- Demonstrate the outcome on a changed prompt: Revise one weak function and demonstrate it in a new domain.



**Key concepts:** multiple tasks; unfamiliar topics; qualified rater; C1 target.

**Arabic example:** مُرَاجَعَةٌ مُسْتَقِلَّةٌ — Independent review

**Practical exercise** (`exercise.arabic-advanced-review`): Have a qualified Arabic teacher review two fresh performances across skills; separate language feedback from domain review.

**Evidence to keep:** External feedback if available, or a clearly provisional self-profile.

**Knowledge check** (`assessment.arabic-advanced-review-check`):

- Does this branch alone certify C1?

- Why use fresh tasks beyond the capstone?



**Mini challenge** (`exercise.arabic-advanced-review-transfer`): Revise one weak function and demonstrate it in a new domain.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-actfl-opi`, `resource.arabic-aljazeera`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- External feedback if available, or a clearly provisional self-profile submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise one weak function and demonstrate it in a new domain. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Academic and professional Fuṣḥā: guided** (`lab.arabic-academic-guided`, 45 min, splittable): Analyse two specialist articles and a formal talk in one chosen field; build a source and terminology map.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Academic and professional Fuṣḥā: transfer** (`lab.arabic-academic-transfer`, 75 min, splittable): Present a recommendation to a knowledgeable reader and revise it after substantive questions.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-academic-performance` — Present a recommendation to a knowledgeable reader and revise it after substantive questions.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A reviewed academic/professional brief (`project.arabic-academic-brief`)

##### Project: A reviewed academic/professional brief

**ID:** `project.arabic-academic-brief`

**Goal:** Synthesize a narrow specialist question for a defined audience.

**Required skills:** `skill.arabic-synthesis-citation`, `skill.arabic-professional-brief`, `skill.arabic-advanced-review`

**Study time:** 16–24 hours; allocated once to `module.arabic-academic`.

**Deliverables:**

- Three verified sources and terminology notes

- 600–800-word synthesis

- One-page recommendation

- Seven-minute presentation and independent feedback



**Assessment criteria:**

- 25% — Source fidelity and limitations are preserved

- 25% — Terminology is accurate in the chosen domain

- 25% — Written structure and spoken response suit the audience

- 25% — Language and subject expertise are evaluated separately



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** A focused advanced communication sample; further tasks are needed for broad C1 claims.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-literature"></a>

### Module 26 — Literary Arabic, stories and style

**ID:** `module.arabic-literature` · **Path:** literature · **Target:** B2-extension · **Difficulty:** 5/6

**Purpose:** Read selected literary works with attention to voice, imagery and cultural context.

**Entry prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-extensive-reading`, `skill.arabic-implicit-meaning`

**Other skills used by particular lessons:** `skill.arabic-b1-portfolio`, `skill.arabic-extensive-reading`, `skill.arabic-implicit-meaning`

**Before entry:** Read connected unvowelled prose and distinguish explicit meaning from inference.

**Estimated study time:** 50–80 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 10–16 h; distributed practice/review: 32–56 h.

**Learning objectives:**

- Select a legal edition and assess language difficulty and context

- Distinguish narrative voice from character speech and author

- Support interpretations of figurative language with textual details

- Explore a poem's meaning, sound and non-prose features

- Present an interpretation while respecting alternative readings



**Topics:** Literary reading (`topic.arabic-literature-literary-reading`); Literary interpretation (`topic.arabic-literature-literary-interpretation`); Literary synthesis (`topic.arabic-literature-literary-synthesis`)



**Common mistakes:**

- Starting with the hardest canonical work

- Treating every metaphor literally

- Assuming one character represents an entire culture



**Understand before progressing:**

- Discuss a selected literary text with textual support and distinguish interpretation from fact.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Discuss a selected literary text with textual support and distinguish interpretation from fact.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Literary reading

**ID:** `topic.arabic-literature-literary-reading`



<a id="lesson.arabic-literary-selection"></a>

##### Lesson — Choose an accessible text and identify its setting

**ID:** `lesson.arabic-literary-selection` · **Module:** `module.arabic-literature` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-extensive-reading`, `skill.arabic-implicit-meaning`

**Skill:** `skill.arabic-literary-selection`

**Learning objectives:**

- Select a legal edition and assess language difficulty and context

- Demonstrate the outcome on a changed prompt: Explain why the chosen text fits your current ability.



**Key concepts:** edition; author; period; genre; reader fit.

**Arabic example:** الأَدَبُ العَرَبِيُّ — Arabic literature

**Practical exercise** (`exercise.arabic-literary-selection`): Preview two short stories or excerpts, verify publication information and choose one you can follow without constant lookup.

**Evidence to keep:** A source card and a reasoned selection.

**Knowledge check** (`assessment.arabic-literary-selection-check`):

- Does a free-to-read page automatically permit redistribution in MyDay?

- Is historical context identical to the narrator's viewpoint?



**Mini challenge** (`exercise.arabic-literary-selection-transfer`): Explain why the chosen text fits your current ability.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-hindawi`, `resource.arabic-ryding`, `resource.arabic-qabas`. The catalogue below gives verified links.

**Completion criteria:**

- A source card and a reasoned selection submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain why the chosen text fits your current ability. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-narrator-character"></a>

##### Lesson — Follow narrator, characters and time

**ID:** `lesson.arabic-narrator-character` · **Module:** `module.arabic-literature` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-extensive-reading`, `skill.arabic-implicit-meaning`, `skill.arabic-literary-selection`

**Skill:** `skill.arabic-narrator-character`

**Learning objectives:**

- Distinguish narrative voice from character speech and author

- Demonstrate the outcome on a changed prompt: Retell one scene from another character's perspective, labelled as your adaptation.



**Key concepts:** narrator; dialogue; viewpoint; time shift.

**Arabic example:** الرَّاوِي وَالشَّخْصِيَّةُ — Narrator and character

**Practical exercise** (`exercise.arabic-narrator-character`): Map characters and a short story's timeline; identify two statements belonging to a narrator or character rather than the author directly.

**Evidence to keep:** A viewpoint map and labelled adaptation.

**Knowledge check** (`assessment.arabic-narrator-character-check`):

- Can a narrator's statement automatically be attributed to the author's beliefs?

- What helps identify a time shift?

- Read قالت ليلى: «هذه المدينة جميلة». Who expresses the judgement, and is it automatically the author's own judgement?



**Mini challenge** (`exercise.arabic-narrator-character-transfer`): Retell one scene from another character's perspective, labelled as your adaptation.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-hindawi`, `resource.arabic-ryding`, `resource.arabic-qabas`. The catalogue below gives verified links.

**Completion criteria:**

- A viewpoint map and labelled adaptation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Retell one scene from another character's perspective, labelled as your adaptation. Evidence: record support, prompt novelty and task conditions.



#### Topic — Literary interpretation

**ID:** `topic.arabic-literature-literary-interpretation`



<a id="lesson.arabic-imagery-style"></a>

##### Lesson — Interpret imagery and stylistic choices

**ID:** `lesson.arabic-imagery-style` · **Module:** `module.arabic-literature` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-extensive-reading`, `skill.arabic-implicit-meaning`, `skill.arabic-narrator-character`

**Skill:** `skill.arabic-imagery-style`

**Learning objectives:**

- Support interpretations of figurative language with textual details

- Demonstrate the outcome on a changed prompt: Discuss an unseen image and explain your evidence.



**Key concepts:** simile; metaphor; repetition; rhythm; register.

**Arabic example:** التَّشْبِيهُ وَالاسْتِعَارَةُ — Simile and metaphor

**Practical exercise** (`exercise.arabic-imagery-style`): Choose three short passages, paraphrase literal meaning and propose a contextual interpretation with an alternative where reasonable.

**Evidence to keep:** Three supported interpretation notes.

**Knowledge check** (`assessment.arabic-imagery-style-check`):

- Must every image have only one defensible interpretation?

- What prevents interpretation from becoming invention?

- In the original teaching sentence المعرفة نور, explain the literal image and one reasonable figurative interpretation.



**Mini challenge** (`exercise.arabic-imagery-style-transfer`): Discuss an unseen image and explain your evidence.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-hindawi`, `resource.arabic-ryding`, `resource.arabic-qabas`. The catalogue below gives verified links.

**Completion criteria:**

- Three supported interpretation notes submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Discuss an unseen image and explain your evidence. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-poetry-entry"></a>

##### Lesson — Read a short poem with support

**ID:** `lesson.arabic-poetry-entry` · **Module:** `module.arabic-literature` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-extensive-reading`, `skill.arabic-implicit-meaning`, `skill.arabic-imagery-style`

**Skill:** `skill.arabic-poetry-entry`

**Learning objectives:**

- Explore a poem's meaning, sound and non-prose features

- Demonstrate the outcome on a changed prompt: Compare a spoken reading with your meaning-based paraphrase.



**Key concepts:** line; imagery; ellipsis; poetic licence; metre awareness.

**Arabic example:** بَيْتٌ شِعْرِيٌّ — A line of poetry

**Practical exercise** (`exercise.arabic-poetry-entry`): Select a short legally accessible poem with a reliable reading and commentary; paraphrase two lines and identify a question for a teacher.

**Evidence to keep:** A brief annotated reading with unresolved questions.

**Knowledge check** (`assessment.arabic-poetry-entry-check`):

- Should poetic word order automatically become the model for everyday MSA prose?

- Does recognising a metre mean the poem is understood?

- Explain why بَيْت in بَيْتٌ شِعْرِيٌّ should not be translated as a house.



**Mini challenge** (`exercise.arabic-poetry-entry-transfer`): Compare a spoken reading with your meaning-based paraphrase.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-hindawi`, `resource.arabic-ryding`, `resource.arabic-qabas`. The catalogue below gives verified links.

**Completion criteria:**

- A brief annotated reading with unresolved questions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Compare a spoken reading with your meaning-based paraphrase. Evidence: record support, prompt novelty and task conditions.



#### Topic — Literary synthesis

**ID:** `topic.arabic-literature-literary-synthesis`



<a id="lesson.arabic-literary-review"></a>

##### Lesson — Write and discuss a supported literary response

**ID:** `lesson.arabic-literary-review` · **Module:** `module.arabic-literature` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-extensive-reading`, `skill.arabic-implicit-meaning`, `skill.arabic-poetry-entry`, `skill.arabic-imagery-style`

**Skill:** `skill.arabic-literary-review`

**Learning objectives:**

- Present an interpretation while respecting alternative readings

- Demonstrate the outcome on a changed prompt: Revise one claim after a partner offers contrary textual evidence.



**Key concepts:** textual evidence; response; comparison; citation.

**Arabic example:** قِرَاءَةٌ نَقْدِيَّةٌ — Critical reading

**Practical exercise** (`exercise.arabic-literary-review`): Write a 400-word review of a story or a shorter response to a poem, then discuss a plausible alternative interpretation.

**Evidence to keep:** A review, discussion and revision.

**Knowledge check** (`assessment.arabic-literary-review-check`):

- Can enjoyment and analytical evaluation differ?

- Must disagreement about interpretation mean one reader misunderstood every word?

- Write one Arabic sentence linking a judgement about a character to a specific event in the chosen story.



**Mini challenge** (`exercise.arabic-literary-review-transfer`): Revise one claim after a partner offers contrary textual evidence.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-hindawi`, `resource.arabic-ryding`, `resource.arabic-qabas`. The catalogue below gives verified links.

**Completion criteria:**

- A review, discussion and revision submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise one claim after a partner offers contrary textual evidence. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Literary Arabic, stories and style: guided** (`lab.arabic-literature-guided`, 45 min, splittable): Read a short legally accessible story over several sessions and keep a character, language and interpretation journal.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Literary Arabic, stories and style: transfer** (`lab.arabic-literature-transfer`, 75 min, splittable): Compare a new short passage with the first work using evidence from both.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-literature-performance` — Compare a new short passage with the first work using evidence from both.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A supported literary response (`project.arabic-literary-response`)

##### Project: A supported literary response

**ID:** `project.arabic-literary-response`

**Goal:** Interpret a selected story or poem with close attention to the text.

**Required skills:** `skill.arabic-narrator-character`, `skill.arabic-imagery-style`, `skill.arabic-literary-review`

**Study time:** 10–16 hours; allocated once to `module.arabic-literature`.

**Deliverables:**

- Legal edition/source record

- Reading journal and selected annotations

- 400-word response or appropriate shorter poetry analysis

- Discussion of an alternative interpretation



**Assessment criteria:**

- 25% — Literal comprehension supports interpretation

- 25% — Claims cite relevant textual features

- 25% — Narrator, character and author are distinguished

- 25% — Alternative readings are considered fairly



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Shows cultural and literary engagement grounded in actual reading.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-classical"></a>

### Module 27 — Bridge from MSA to classical prose

**ID:** `module.arabic-classical` · **Path:** classical · **Target:** B2-extension · **Difficulty:** 5/6

**Purpose:** Develop the additional tools needed for selected premodern texts.

**Entry prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-precision-edit`, `skill.arabic-context-ambiguity`

**Other skills used by particular lessons:** `skill.arabic-b1-portfolio`, `skill.arabic-context-ambiguity`, `skill.arabic-dictionary-method`, `skill.arabic-hal-tamyiz`, `skill.arabic-precision-edit`

**Before entry:** Use reference grammar and dictionary methods; understand core case, mood and complex-clause analysis.

**Estimated study time:** 60–90 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 12–18 h; distributed practice/review: 40–64 h.

**Learning objectives:**

- Distinguish MSA expectations from classical textual conventions

- Build a justified grammatical analysis of short sentences

- Use a suitable lexicon and context to verify older senses

- Separate base text, editor's choices and commentary

- Present a supported reading with clear limits



**Topics:** Classical orientation (`topic.arabic-classical-classical-orientation`); Classical analysis (`topic.arabic-classical-classical-analysis`); Textual context (`topic.arabic-classical-textual-context`); Classical synthesis (`topic.arabic-classical-classical-synthesis`)



**Common mistakes:**

- Assuming modern dictionary senses always fit premodern usage

- Treating full parsing as complete comprehension

- Confusing an editor's vocalisation with an unambiguous manuscript fact



**Understand before progressing:**

- Read short supported classical prose passages while tracking historical meanings and editorial uncertainty.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Read short supported classical prose passages while tracking historical meanings and editorial uncertainty.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Classical orientation

**ID:** `topic.arabic-classical-classical-orientation`



<a id="lesson.arabic-classical-register"></a>

##### Lesson — Recognise what changes across periods and genres

**ID:** `lesson.arabic-classical-register` · **Module:** `module.arabic-classical` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-precision-edit`, `skill.arabic-context-ambiguity`

**Skill:** `skill.arabic-classical-register`

**Learning objectives:**

- Distinguish MSA expectations from classical textual conventions

- Demonstrate the outcome on a changed prompt: Explain three differences without claiming all classical Arabic is one style.



**Key concepts:** period; genre; lexical history; shared grammar.

**Arabic example:** النَّثْرُ الكَلَاسِيكِيُّ — Classical prose

**Practical exercise** (`exercise.arabic-classical-register`): Compare a short modern passage with a teacher-selected classical excerpt; note vocabulary, connectors, sentence density and editorial support.

**Evidence to keep:** A comparative register note.

**Knowledge check** (`assessment.arabic-classical-register-check`):

- Does shared grammar make every classical text easy after MSA?

- Should a historical word sense be inferred only from its modern use?



**Mini challenge** (`exercise.arabic-classical-register-transfer`): Explain three differences without claiming all classical Arabic is one style.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- A comparative register note submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain three differences without claiming all classical Arabic is one style. Evidence: record support, prompt novelty and task conditions.



#### Topic — Classical analysis

**ID:** `topic.arabic-classical-classical-analysis`



<a id="lesson.arabic-classical-parsing"></a>

##### Lesson — Use iʿrāb to support meaning

**ID:** `lesson.arabic-classical-parsing` · **Module:** `module.arabic-classical` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-precision-edit`, `skill.arabic-context-ambiguity`, `skill.arabic-classical-register`, `skill.arabic-hal-tamyiz`

**Skill:** `skill.arabic-classical-parsing`

**Learning objectives:**

- Build a justified grammatical analysis of short sentences

- Demonstrate the outcome on a changed prompt: Explain how an alternative parse would change the interpretation.



**Key concepts:** governor; case/mood; ellipsis; alternative analysis.

**Arabic example:** الإِعْرَابُ — Grammatical analysis/inflection

**Practical exercise** (`exercise.arabic-classical-parsing`): Parse three short teacher-checked sentences, explain their meaning first and cite the rule supporting each analysis.

**Evidence to keep:** Three role maps with supporting references.

**Knowledge check** (`assessment.arabic-classical-parsing-check`):

- Does a case label alone explain the whole sentence?

- What should you do when two analyses are plausible?

- In the original teaching sentence قَرَأَ الطَّالِبُ الْكِتَابَ, identify the verb, agent and object, then explain the overall meaning.



**Mini challenge** (`exercise.arabic-classical-parsing-transfer`): Explain how an alternative parse would change the interpretation.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- Three role maps with supporting references submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain how an alternative parse would change the interpretation. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-historical-lexicon"></a>

##### Lesson — Check historical meanings and particles

**ID:** `lesson.arabic-historical-lexicon` · **Module:** `module.arabic-classical` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-precision-edit`, `skill.arabic-context-ambiguity`, `skill.arabic-classical-parsing`, `skill.arabic-dictionary-method`

**Skill:** `skill.arabic-historical-lexicon`

**Learning objectives:**

- Use a suitable lexicon and context to verify older senses

- Demonstrate the outcome on a changed prompt: Reject one anachronistic interpretation with evidence.



**Key concepts:** lexical period; polysemy; particle functions; citations.

**Arabic example:** دَلَالَةُ اللَّفْظِ — The meaning/signification of an expression

**Practical exercise** (`exercise.arabic-historical-lexicon`): Investigate five words or particles from the passage using appropriate references; record modern and contextual meanings separately.

**Evidence to keep:** Five verified historical-use notes.

**Knowledge check** (`assessment.arabic-historical-lexicon-check`):

- Does a shared spelling guarantee the same meaning across centuries?

- Can one gloss replace the need to understand syntax?

- A historical passage and a modern article use the same written word. State two checks before transferring the modern meaning to the old text.



**Mini challenge** (`exercise.arabic-historical-lexicon-transfer`): Reject one anachronistic interpretation with evidence.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- Five verified historical-use notes submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Reject one anachronistic interpretation with evidence. Evidence: record support, prompt novelty and task conditions.



#### Topic — Textual context

**ID:** `topic.arabic-classical-textual-context`



<a id="lesson.arabic-edition-commentary"></a>

##### Lesson — Use editions and commentary responsibly

**ID:** `lesson.arabic-edition-commentary` · **Module:** `module.arabic-classical` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-precision-edit`, `skill.arabic-context-ambiguity`, `skill.arabic-historical-lexicon`

**Skill:** `skill.arabic-edition-commentary`

**Learning objectives:**

- Separate base text, editor's choices and commentary

- Demonstrate the outcome on a changed prompt: Explain one uncertain reading without silently choosing it as fact.



**Key concepts:** edition; variant; vocalisation; commentary; attribution.

**Arabic example:** النَّصُّ وَالشَّرْحُ — Text and commentary

**Practical exercise** (`exercise.arabic-edition-commentary`): Compare two available presentations of a short passage where permitted; label base text, added vowel marks and commentary rather than blending them.

**Evidence to keep:** An edition comparison and an uncertainty log.

**Knowledge check** (`assessment.arabic-edition-commentary-check`):

- Is commentary part of the original sentence?

- Can one edition's punctuation settle every historical ambiguity?

- An editor supplies vowel marks that are absent from the photographed source. How should the two forms be labelled in a study note?



**Mini challenge** (`exercise.arabic-edition-commentary-transfer`): Explain one uncertain reading without silently choosing it as fact.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- An edition comparison and an uncertainty log submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain one uncertain reading without silently choosing it as fact. Evidence: record support, prompt novelty and task conditions.



#### Topic — Classical synthesis

**ID:** `topic.arabic-classical-classical-synthesis`



<a id="lesson.arabic-classical-commentary"></a>

##### Lesson — Produce an annotated reading of a short passage

**ID:** `lesson.arabic-classical-commentary` · **Module:** `module.arabic-classical` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-precision-edit`, `skill.arabic-context-ambiguity`, `skill.arabic-edition-commentary`

**Skill:** `skill.arabic-classical-commentary`

**Learning objectives:**

- Present a supported reading with clear limits

- Demonstrate the outcome on a changed prompt: Repeat with a fresh shorter passage and less guidance.



**Key concepts:** translation/paraphrase; grammar; lexicon; context.

**Arabic example:** شَرْحٌ مُوجَزٌ — A concise explanation

**Practical exercise** (`exercise.arabic-classical-commentary`): Prepare a 150–250-word passage study with Arabic paraphrase, selected grammatical notes and references; explain it orally to a teacher or peer.

**Evidence to keep:** Two annotated passages with honest assistance labels.

**Knowledge check** (`assessment.arabic-classical-commentary-check`):

- Does analysing one passage establish unrestricted classical reading ability?

- What should an annotation prioritise?



**Mini challenge** (`exercise.arabic-classical-commentary-transfer`): Repeat with a fresh shorter passage and less guidance.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-ryding`, `resource.arabic-qabas`, `resource.arabic-hindawi`, `resource.arabic-oxford-dictionary`. The catalogue below gives verified links.

**Completion criteria:**

- Two annotated passages with honest assistance labels submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat with a fresh shorter passage and less guidance. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Bridge from MSA to classical prose: guided** (`lab.arabic-classical-guided`, 45 min, splittable): Work through a short legally accessible classical prose excerpt with a teacher-selected edition and a grammar notebook.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Bridge from MSA to classical prose: transfer** (`lab.arabic-classical-transfer`, 75 min, splittable): Analyse a second passage using the same method and explain where confident reading stops.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-classical-performance` — Analyse a second passage using the same method and explain where confident reading stops.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** An annotated classical prose study (`project.arabic-classical-study`)

##### Project: An annotated classical prose study

**ID:** `project.arabic-classical-study`

**Goal:** Read a manageable historical passage using a defensible method.

**Required skills:** `skill.arabic-classical-parsing`, `skill.arabic-historical-lexicon`, `skill.arabic-classical-commentary`

**Study time:** 12–18 hours; allocated once to `module.arabic-classical`.

**Deliverables:**

- Edition and passage reference

- 150–250-word selected passage with lawful use

- Arabic paraphrase and grammar/lexicon notes

- A second shorter passage and uncertainty log



**Assessment criteria:**

- 25% — Historical senses are checked

- 25% — Grammatical analyses support meaning

- 25% — Editor and commentator additions are labelled

- 25% — Limits of confidence and assistance remain visible



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Demonstrates a method for supported classical reading.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-quranic"></a>

### Module 28 — Qur’anic Arabic reading and linguistic study

**ID:** `module.arabic-quranic` · **Path:** quranic · **Target:** B2-extension · **Difficulty:** 5/6

**Purpose:** Apply Arabic skills to supported Qur’anic reading while keeping language analysis, recitation and interpretation distinct.

**Entry prerequisites:** `skill.arabic-classical-commentary`

**Other skills used by particular lessons:** `skill.arabic-classical-commentary`, `skill.arabic-classical-parsing`, `skill.arabic-historical-lexicon`

**Before entry:** Read supported classical prose and distinguish text, commentary and linguistic inference.

**Estimated study time:** 60–100 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 12–20 h; distributed practice/review: 40–72 h.

**Learning objectives:**

- Choose a clear linguistic goal and appropriate support

- Distinguish Uthmānic presentation from ordinary modern spelling

- Inspect word segmentation, roots and grammatical labels critically

- Distinguish lexical gloss, sentence meaning and contextual interpretation

- Present what the Arabic supports and where specialist guidance is needed



**Topics:** Study scope (`topic.arabic-quranic-study-scope`); Text and notation (`topic.arabic-quranic-text-and-notation`); Linguistic analysis (`topic.arabic-quranic-linguistic-analysis`); Linguistic synthesis (`topic.arabic-quranic-linguistic-synthesis`)



**Common mistakes:**

- Assuming recitation fluency proves comprehension

- Using an automated parse as the only authority

- Converting a personal language inference into a religious ruling



**Understand before progressing:**

- Use a verified text and established linguistic aids to study selected passages with a qualified teacher when needed.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Use a verified text and established linguistic aids to study selected passages with a qualified teacher when needed.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Study scope

**ID:** `topic.arabic-quranic-study-scope`



<a id="lesson.arabic-quranic-scope"></a>

##### Lesson — Separate language, tafsīr and recitation goals

**ID:** `lesson.arabic-quranic-scope` · **Module:** `module.arabic-quranic` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-classical-commentary`

**Skill:** `skill.arabic-quranic-scope`

**Learning objectives:**

- Choose a clear linguistic goal and appropriate support

- Demonstrate the outcome on a changed prompt: Classify five study questions by language, interpretation or recitation.



**Key concepts:** Qur'anic register; tafsīr; tajwīd; qirāʾāt awareness.

**Arabic example:** التَّفْسِيرُ / التَّجْوِيدُ — Exegesis / recitation rules

**Practical exercise** (`exercise.arabic-quranic-scope`): Write a scope note specifying comprehension, grammar and source consultation; identify who will review recitation if that is a separate goal.

**Evidence to keep:** A goal and source plan with clear boundaries.

**Knowledge check** (`assessment.arabic-quranic-scope-check`):

- Is an Arabic grammar explanation automatically a complete tafsīr?

- Is tajwīd certification an outcome of this MyDay branch?



**Mini challenge** (`exercise.arabic-quranic-scope-transfer`): Classify five study questions by language, interpretation or recitation.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-quran-corpus`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A goal and source plan with clear boundaries submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Classify five study questions by language, interpretation or recitation. Evidence: record support, prompt novelty and task conditions.



#### Topic — Text and notation

**ID:** `topic.arabic-quranic-text-and-notation`



<a id="lesson.arabic-uthmani-script"></a>

##### Lesson — Recognise Qur’anic orthographic conventions

**ID:** `lesson.arabic-uthmani-script` · **Module:** `module.arabic-quranic` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-classical-commentary`, `skill.arabic-quranic-scope`

**Skill:** `skill.arabic-uthmani-script`

**Learning objectives:**

- Distinguish Uthmānic presentation from ordinary modern spelling

- Demonstrate the outcome on a changed prompt: Explain two notation differences using a reliable guide.



**Key concepts:** rasm; ḍabṭ; small letters; pause signs; reference integrity.

**Arabic example:** الرَّسْمُ وَالضَّبْطُ — Consonantal orthography and vocalisation/notation

**Practical exercise** (`exercise.arabic-uthmani-script`): Compare teacher-selected words in a verified muṣḥaf and an explanatory modern-spelling display; keep the source text unchanged.

**Evidence to keep:** A referenced notation sheet and preserved source excerpt.

**Knowledge check** (`assessment.arabic-uthmani-script-check`):

- Should MyDay silently normalise the stored Qur'anic text into modern spelling?

- Are all recitation and pause signs ordinary MSA vowel marks?



**Mini challenge** (`exercise.arabic-uthmani-script-transfer`): Explain two notation differences using a reliable guide.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-quran-corpus`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A referenced notation sheet and preserved source excerpt submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain two notation differences using a reliable guide. Evidence: record support, prompt novelty and task conditions.



#### Topic — Linguistic analysis

**ID:** `topic.arabic-quranic-linguistic-analysis`



<a id="lesson.arabic-quranic-morphology"></a>

##### Lesson — Use morphology annotations as an aid

**ID:** `lesson.arabic-quranic-morphology` · **Module:** `module.arabic-quranic` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-classical-commentary`, `skill.arabic-uthmani-script`, `skill.arabic-classical-parsing`

**Skill:** `skill.arabic-quranic-morphology`

**Learning objectives:**

- Inspect word segmentation, roots and grammatical labels critically

- Demonstrate the outcome on a changed prompt: Explain a new annotated word without merely copying the label.



**Key concepts:** morphology; segmentation; traditional grammar; annotation limits.

**Arabic example:** الصَّرْفُ وَالنَّحْوُ — Morphology and syntax

**Practical exercise** (`exercise.arabic-quranic-morphology`): Use Quranic Arabic Corpus on a selected passage; compare three annotations with an appropriate reference or teacher and note disagreements.

**Evidence to keep:** Three checked analyses and one independent explanation.

**Knowledge check** (`assessment.arabic-quranic-morphology-check`):

- Does a digital annotation eliminate interpretive alternatives?

- What should be retained with every studied word?

- Without quoting a verse, explain how a prefix, stem and suffix can contribute different grammatical information to one written Arabic word.



**Mini challenge** (`exercise.arabic-quranic-morphology-transfer`): Explain a new annotated word without merely copying the label.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-quran-corpus`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- Three checked analyses and one independent explanation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain a new annotated word without merely copying the label. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-quranic-context"></a>

##### Lesson — Study meaning in passage context

**ID:** `lesson.arabic-quranic-context` · **Module:** `module.arabic-quranic` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-classical-commentary`, `skill.arabic-quranic-morphology`, `skill.arabic-historical-lexicon`

**Skill:** `skill.arabic-quranic-context`

**Learning objectives:**

- Distinguish lexical gloss, sentence meaning and contextual interpretation

- Demonstrate the outcome on a changed prompt: Explain which part of one question is linguistic and which needs commentary.



**Key concepts:** pronoun reference; particle function; context; translation limits.

**Arabic example:** السِّيَاقُ — Context

**Practical exercise** (`exercise.arabic-quranic-context`): Study a short passage using a verified text and suitable commentary; record lexical questions separately from interpretive conclusions.

**Evidence to keep:** A contextual reading journal with attributed references.

**Knowledge check** (`assessment.arabic-quranic-context-check`):

- Can one translated English word capture every contextual nuance?

- Should an unfamiliar construction be assigned a theological conclusion by guesswork?



**Mini challenge** (`exercise.arabic-quranic-context-transfer`): Explain which part of one question is linguistic and which needs commentary.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-quran-corpus`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A contextual reading journal with attributed references submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain which part of one question is linguistic and which needs commentary. Evidence: record support, prompt novelty and task conditions.



#### Topic — Linguistic synthesis

**ID:** `topic.arabic-quranic-linguistic-synthesis`



<a id="lesson.arabic-quranic-reading-project"></a>

##### Lesson — Prepare a carefully sourced passage study

**ID:** `lesson.arabic-quranic-reading-project` · **Module:** `module.arabic-quranic` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-classical-commentary`, `skill.arabic-quranic-context`

**Skill:** `skill.arabic-quranic-reading-project`

**Learning objectives:**

- Present what the Arabic supports and where specialist guidance is needed

- Demonstrate the outcome on a changed prompt: Repeat the method on a new short passage with independent checks.



**Key concepts:** exact reference; source integrity; paraphrase; uncertainty.

**Arabic example:** دِرَاسَةٌ لُغَوِيَّةٌ — A linguistic study

**Practical exercise** (`exercise.arabic-quranic-reading-project`): Create a short annotated passage study with vocabulary, selected grammar, source references and unresolved questions; add recitation only if separately reviewed.

**Evidence to keep:** Two documented passage studies and separate recitation status.

**Knowledge check** (`assessment.arabic-quranic-reading-project-check`):

- Does this project certify religious expertise?

- What makes the project useful for future study?



**Mini challenge** (`exercise.arabic-quranic-reading-project-transfer`): Repeat the method on a new short passage with independent checks.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-quran-corpus`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- Two documented passage studies and separate recitation status submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Repeat the method on a new short passage with independent checks. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Qur’anic Arabic reading and linguistic study: guided** (`lab.arabic-quranic-guided`, 45 min, splittable): Select a short passage with an appropriate teacher, preserve its exact reference and study vocabulary and sentence relationships.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Qur’anic Arabic reading and linguistic study: transfer** (`lab.arabic-quranic-transfer`, 75 min, splittable): Apply the same method to a new short passage, recording interpretation questions for appropriate commentary or a qualified teacher.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-quranic-performance` — Apply the same method to a new short passage, recording interpretation questions for appropriate commentary or a qualified teacher.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A sourced Qur’anic language journal (`project.arabic-quranic-study`)

##### Project: A sourced Qur’anic language journal

**ID:** `project.arabic-quranic-study`

**Goal:** Study selected passages linguistically with source integrity and appropriate guidance.

**Required skills:** `skill.arabic-uthmani-script`, `skill.arabic-quranic-morphology`, `skill.arabic-quranic-reading-project`

**Study time:** 12–20 hours; allocated once to `module.arabic-quranic`.

**Deliverables:**

- Exact verified passage references

- Vocabulary and selected morphology notes

- Contextual questions and consulted commentary

- Fresh passage application; recitation status recorded separately



**Assessment criteria:**

- 25% — Source text and references are preserved

- 25% — Linguistic claims have appropriate support

- 25% — Language, interpretation and recitation are distinguished

- 25% — Unresolved questions are referred rather than guessed



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** A personal study method, not religious expertise or recitation certification.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-translation"></a>

### Module 29 — Translation and cross-language mediation

**ID:** `module.arabic-translation` · **Path:** translation · **Target:** B2-extension · **Difficulty:** 5/6

**Purpose:** Transfer meaning across languages with explicit attention to audience, uncertainty and revision.

**Entry prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-summary-notes`

**Other skills used by particular lessons:** `skill.arabic-lifelong-plan`, `skill.arabic-qa-spontaneity`, `skill.arabic-summary-notes`

**Before entry:** Have a current B2-target Arabic profile and sufficient competence in the other working language.

**Estimated study time:** 50–80 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 12–18 h; distributed practice/review: 30–54 h.

**Learning objectives:**

- Write a brief before choosing translation strategies

- Translate coherent units and explain non-literal choices

- Audit semantic fidelity separately from style

- Convey key information while preserving scope and uncertainty

- Present reviewed work and explain competence boundaries



**Topics:** Translation method (`topic.arabic-translation-translation-method`); Quality review (`topic.arabic-translation-quality-review`); Cross-language mediation (`topic.arabic-translation-cross-language-mediation`); Translation synthesis (`topic.arabic-translation-translation-synthesis`)



**Common mistakes:**

- Translating word order instead of meaning

- Treating back-translation as proof of accuracy

- Claiming professional interpreting competence from course exercises



**Understand before progressing:**

- Produce and justify non-specialist translations and summaries within a declared competence range.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Produce and justify non-specialist translations and summaries within a declared competence range.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Translation method

**ID:** `topic.arabic-translation-translation-method`



<a id="lesson.arabic-translation-brief"></a>

##### Lesson — Define audience, purpose and fidelity

**ID:** `lesson.arabic-translation-brief` · **Module:** `module.arabic-translation` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-summary-notes`

**Skill:** `skill.arabic-translation-brief`

**Learning objectives:**

- Write a brief before choosing translation strategies

- Demonstrate the outcome on a changed prompt: Compare two possible briefs for the same source.



**Key concepts:** audience; purpose; genre; direction; limits.

**Arabic example:** الْمَعْنَى وَالسِّيَاقُ — Meaning and context

**Practical exercise** (`exercise.arabic-translation-brief`): Choose a legally usable 150–200-word non-specialist text and specify audience, purpose, direction and what must be preserved.

**Evidence to keep:** A source card and two audience briefs.

**Knowledge check** (`assessment.arabic-translation-brief-check`):

- Is translation always the same as summarising?

- Does Arabic ability alone prove equal writing competence in the target language?

- Explain what must be preserved when translating لم يبدأ المشروع بعد into English.



**Mini challenge** (`exercise.arabic-translation-brief-transfer`): Compare two possible briefs for the same source.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A source card and two audience briefs submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Compare two possible briefs for the same source. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-translation-choices"></a>

##### Lesson — Preserve meaning beyond word-for-word matching

**ID:** `lesson.arabic-translation-choices` · **Module:** `module.arabic-translation` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-summary-notes`, `skill.arabic-translation-brief`

**Skill:** `skill.arabic-translation-choices`

**Learning objectives:**

- Translate coherent units and explain non-literal choices

- Demonstrate the outcome on a changed prompt: Revise one fluent but inaccurate sentence.



**Key concepts:** idiom; collocation; reference; implicit information.

**Arabic example:** التَّرْجَمَةُ — Translation

**Practical exercise** (`exercise.arabic-translation-choices`): Translate the selected text, mark five difficult decisions and explain how context informed each.

**Evidence to keep:** A first translation and five decision notes.

**Knowledge check** (`assessment.arabic-translation-choices-check`):

- Must one source word always map to one target word?

- Can an elegant translation still distort a negation or qualification?

- Translate قد يتغير الموعد and identify the part that marks uncertainty.



**Mini challenge** (`exercise.arabic-translation-choices-transfer`): Revise one fluent but inaccurate sentence.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A first translation and five decision notes submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise one fluent but inaccurate sentence. Evidence: record support, prompt novelty and task conditions.



#### Topic — Quality review

**ID:** `topic.arabic-translation-quality-review`



<a id="lesson.arabic-translation-qa"></a>

##### Lesson — Review omissions, additions and terminology

**ID:** `lesson.arabic-translation-qa` · **Module:** `module.arabic-translation` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-summary-notes`, `skill.arabic-translation-choices`

**Skill:** `skill.arabic-translation-qa`

**Learning objectives:**

- Audit semantic fidelity separately from style

- Demonstrate the outcome on a changed prompt: Audit a new short translation containing three planted meaning errors.



**Key concepts:** omission; addition; numbers; names; terminology; independent review.

**Arabic example:** مُرَاجَعَةُ التَّرْجَمَةِ — Translation review

**Practical exercise** (`exercise.arabic-translation-qa`): Compare source and translation sentence by sentence; check all quantities and negations, then ask a competent reviewer about disputed choices.

**Evidence to keep:** A quality checklist and corrected translation.

**Knowledge check** (`assessment.arabic-translation-qa-check`):

- Is back-translation alone a reliable quality guarantee?

- Should a machine translation be labelled your unaided work?

- A translation of حضر عشرون طالبًا says Twelve students attended. Identify and correct the error.



**Mini challenge** (`exercise.arabic-translation-qa-transfer`): Audit a new short translation containing three planted meaning errors.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A quality checklist and corrected translation submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Audit a new short translation containing three planted meaning errors. Evidence: record support, prompt novelty and task conditions.



#### Topic — Cross-language mediation

**ID:** `topic.arabic-translation-cross-language-mediation`



<a id="lesson.arabic-oral-mediation"></a>

##### Lesson — Relay essential meaning for another person

**ID:** `lesson.arabic-oral-mediation` · **Module:** `module.arabic-translation` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-summary-notes`, `skill.arabic-translation-qa`, `skill.arabic-qa-spontaneity`

**Skill:** `skill.arabic-oral-mediation`

**Learning objectives:**

- Convey key information while preserving scope and uncertainty

- Demonstrate the outcome on a changed prompt: Relay a changed announcement without using the old details.



**Key concepts:** summary; audience needs; memory limits; attribution.

**Arabic example:** نَقْلُ المَعْلُومَاتِ — Relaying information

**Practical exercise** (`exercise.arabic-oral-mediation`): Listen to a short MSA announcement and relay its essential information in the other language; then explain an English notice in simple MSA.

**Evidence to keep:** Two checked relays with declared support.

**Knowledge check** (`assessment.arabic-oral-mediation-check`):

- Does a brief relay task establish professional simultaneous interpreting skill?

- What details are especially important to preserve?

- As a written preparation check, relay the essentials of الاجتماع يوم الأربعاء في الساعة الرابعة.



**Mini challenge** (`exercise.arabic-oral-mediation-transfer`): Relay a changed announcement without using the old details.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- Two checked relays with declared support submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Relay a changed announcement without using the old details. Evidence: record support, prompt novelty and task conditions.



#### Topic — Translation synthesis

**ID:** `topic.arabic-translation-translation-synthesis`



<a id="lesson.arabic-translation-portfolio"></a>

##### Lesson — Create a small reviewed mediation portfolio

**ID:** `lesson.arabic-translation-portfolio` · **Module:** `module.arabic-translation` · **Difficulty:** 5/6 · **Target:** B2-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-lifelong-plan`, `skill.arabic-summary-notes`, `skill.arabic-oral-mediation`

**Skill:** `skill.arabic-translation-portfolio`

**Learning objectives:**

- Present reviewed work and explain competence boundaries

- Demonstrate the outcome on a changed prompt: Defend one disputed translation choice using the source and audience brief.



**Key concepts:** brief; source; draft; review; final; reflection.

**Arabic example:** مِلَفُّ أَعْمَالِ التَّرْجَمَةِ — Translation work portfolio

**Practical exercise** (`exercise.arabic-translation-portfolio`): Compile two short translations and one oral mediation sample with briefs, reviewer comments and revisions; exclude high-stakes professional claims.

**Evidence to keep:** A transparent three-item portfolio.

**Knowledge check** (`assessment.arabic-translation-portfolio-check`):

- Can a portfolio omit the help used to produce it?

- When should a task be referred to a specialist?



**Mini challenge** (`exercise.arabic-translation-portfolio-transfer`): Defend one disputed translation choice using the source and audience brief.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-cefr`, `resource.arabic-qabas`, `resource.arabic-ryding`. The catalogue below gives verified links.

**Completion criteria:**

- A transparent three-item portfolio submitted

- Both knowledge checks explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, two checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Defend one disputed translation choice using the source and audience brief. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Translation and cross-language mediation: guided** (`lab.arabic-translation-guided`, 45 min, splittable): Translate a short non-specialist text, review it for meaning and register, and compare with an independent reviewer.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Translation and cross-language mediation: transfer** (`lab.arabic-translation-transfer`, 75 min, splittable): Produce a fresh translation and an audience-specific summary, explaining different choices.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-translation-performance` — Produce a fresh translation and an audience-specific summary, explaining different choices.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** A transparent translation and mediation pack (`project.arabic-translation-pack`)

##### Project: A transparent translation and mediation pack

**ID:** `project.arabic-translation-pack`

**Goal:** Produce reviewed non-specialist work for defined readers.

**Required skills:** `skill.arabic-translation-qa`, `skill.arabic-oral-mediation`, `skill.arabic-translation-portfolio`

**Study time:** 12–18 hours; allocated once to `module.arabic-translation`.

**Deliverables:**

- Two short source texts with legal access and briefs

- Drafts, decision notes and revised translations

- One oral information-relay sample

- Reviewer comments and competence limits



**Assessment criteria:**

- 25% — Meaning, quantities and qualifications are preserved

- 25% — Style fits the brief

- 25% — Review catches material errors

- 25% — Assistance and professional limits are declared



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** An introductory portfolio for feedback and further study, not a professional qualification.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



<a id="module.arabic-technology"></a>

### Module 30 — Fuṣḥā for technology and cybersecurity communication

**ID:** `module.arabic-technology` · **Path:** technology · **Target:** B1-extension · **Difficulty:** 4/6

**Purpose:** Apply Arabic to technology interests while assessing language separately from technical expertise.

**Entry prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-formal-email`, `skill.arabic-dictionary-method`

**Other skills used by particular lessons:** `skill.arabic-b1-portfolio`, `skill.arabic-dictionary-method`, `skill.arabic-formal-email`, `skill.arabic-reported-information`

**Before entry:** Explain familiar concepts in MSA; learn or verify the underlying technical subject separately.

**Estimated study time:** 35–55 hours. Initial lessons: 5 h; labs: 2 h; assessment and delayed check: 1 h; allocated project work: 8–12 h; distributed practice/review: 19–35 h.

**Learning objectives:**

- Build a source-based Arabic terminology set

- Extract sequence, conditions and cautions from a technical text

- Describe a verified security concept for a non-specialist

- Separate observation, inference and next step in a short report

- Present a technically checked concept and answer simple follow-up questions



**Topics:** Technical reading (`topic.arabic-technology-technical-reading`); Technical communication (`topic.arabic-technology-technical-communication`); Technical synthesis (`topic.arabic-technology-technical-synthesis`)



**Common mistakes:**

- Inventing a term because it resembles an English word

- Conflating technical correctness with Arabic fluency

- Including credentials or private incident data in practice material



**Understand before progressing:**

- Read accessible technical Arabic, explain a concept plainly and write a concise non-sensitive report.

- Explain one typical error and show a correction on a fresh example.



**Able to do after completion:**

- Read accessible technical Arabic, explain a concept plainly and write a concise non-sensitive report.



**Practice across the module:**

- Use fresh, comprehensible texts and recordings on the module topics; record gist and useful details. Suggested unit: 15 minutes.

- Reuse the module language in a new spoken or written situation; get focused feedback. Suggested unit: 20 minutes.

- Contrast two confusing forms from the error log; explain the meaning difference and retry. Suggested unit: 10 minutes.

- Retell, reread or repeat already understood material with less support; prioritise clarity over speed. Suggested unit: 10 minutes.

- Retrieve selected earlier skills on new inputs; log only the modalities observed. Suggested unit: 10 minutes.



#### Topic — Technical reading

**ID:** `topic.arabic-technology-technical-reading`



<a id="lesson.arabic-technical-terminology"></a>

##### Lesson — Verify technical terms in context

**ID:** `lesson.arabic-technical-terminology` · **Module:** `module.arabic-technology` · **Difficulty:** 4/6 · **Target:** B1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-formal-email`, `skill.arabic-dictionary-method`

**Skill:** `skill.arabic-technical-terminology`

**Learning objectives:**

- Build a source-based Arabic terminology set

- Demonstrate the outcome on a changed prompt: Explain one term without using the English label.



**Key concepts:** term; definition; borrowed word; variant; domain.

**Arabic example:** أَمْنُ المَعْلُومَاتِ — Information security

**Practical exercise** (`exercise.arabic-technical-terminology`): Collect ten terms from reputable Arabic technical documentation; record definition, source and alternative wording where relevant.

**Evidence to keep:** Ten verified entries and plain-MSA definitions.

**Knowledge check** (`assessment.arabic-technical-terminology-check`):

- Does an English acronym have one universally used Arabic expansion?

- What makes a glossary entry useful beyond a translation?

- Explain أمن المعلومات in one simple Arabic sentence, then identify one type of evidence that would verify your definition.



**Mini challenge** (`exercise.arabic-technical-terminology-transfer`): Explain one term without using the English label.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-w3c`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-email`, `asset.arabic-technical-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- Ten verified entries and plain-MSA definitions submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain one term without using the English label. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-technical-docs"></a>

##### Lesson — Read instructions and explanations accurately

**ID:** `lesson.arabic-technical-docs` · **Module:** `module.arabic-technology` · **Difficulty:** 4/6 · **Target:** B1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-formal-email`, `skill.arabic-dictionary-method`, `skill.arabic-technical-terminology`

**Skill:** `skill.arabic-technical-docs`

**Learning objectives:**

- Extract sequence, conditions and cautions from a technical text

- Demonstrate the outcome on a changed prompt: Rewrite the process as a simple learner checklist.



**Key concepts:** imperative; prerequisite; conditional; scope; version.

**Arabic example:** شَبَكَةُ الحَاسُوبِ — Computer network

**Practical exercise** (`exercise.arabic-technical-docs`): Read a short official Arabic help article on a harmless feature; summarise its steps and version-dependent assumptions without executing sensitive actions.

**Evidence to keep:** A sourced process summary with applicability notes.

**Knowledge check** (`assessment.arabic-technical-docs-check`):

- Can an old help article be assumed current for every version?

- Why preserve a condition before a step?

- Explain the order in احفظ الملف قبل إغلاق النافذة.



**Mini challenge** (`exercise.arabic-technical-docs-transfer`): Rewrite the process as a simple learner checklist.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-w3c`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-email`, `asset.arabic-technical-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A sourced process summary with applicability notes submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Rewrite the process as a simple learner checklist. Evidence: record support, prompt novelty and task conditions.



#### Topic — Technical communication

**ID:** `topic.arabic-technology-technical-communication`



<a id="lesson.arabic-security-explainer"></a>

##### Lesson — Explain a security concept in plain Fuṣḥā

**ID:** `lesson.arabic-security-explainer` · **Module:** `module.arabic-technology` · **Difficulty:** 4/6 · **Target:** B1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-formal-email`, `skill.arabic-dictionary-method`, `skill.arabic-technical-docs`

**Skill:** `skill.arabic-security-explainer`

**Learning objectives:**

- Describe a verified security concept for a non-specialist

- Demonstrate the outcome on a changed prompt: Explain the same concept without specialist terminology.



**Key concepts:** audience; analogy; definition; technical review.

**Arabic example:** حِمَايَةُ الحِسَابِ — Account protection

**Practical exercise** (`exercise.arabic-security-explainer`): Explain phishing or multi-factor authentication in 150 Arabic words and a two-minute recording; use only fictional examples.

**Evidence to keep:** A checked explainer and audience feedback.

**Knowledge check** (`assessment.arabic-security-explainer-check`):

- Does a memorable analogy replace a correct definition?

- Should the language rubric reward an unsupported technical claim?

- Explain the key idea of المصادقة متعددة العوامل in plain MSA without claiming that two passwords are two different factors.



**Mini challenge** (`exercise.arabic-security-explainer-transfer`): Explain the same concept without specialist terminology.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-w3c`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-email`, `asset.arabic-technical-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A checked explainer and audience feedback submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain the same concept without specialist terminology. Evidence: record support, prompt novelty and task conditions.



<a id="lesson.arabic-incident-summary"></a>

##### Lesson — Write a clear fictional incident summary

**ID:** `lesson.arabic-incident-summary` · **Module:** `module.arabic-technology` · **Difficulty:** 4/6 · **Target:** B1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-formal-email`, `skill.arabic-dictionary-method`, `skill.arabic-security-explainer`, `skill.arabic-reported-information`

**Skill:** `skill.arabic-incident-summary`

**Learning objectives:**

- Separate observation, inference and next step in a short report

- Demonstrate the outcome on a changed prompt: Revise the report after one new fact changes the hypothesis.



**Key concepts:** timeline; observed fact; hypothesis; action; redaction.

**Arabic example:** مُلَخَّصُ الحَادِثَةِ — Incident summary

**Practical exercise** (`exercise.arabic-incident-summary`): Use a supplied fictional account-lockout scenario to write a 200-word MSA report; label what is known and what needs checking.

**Evidence to keep:** A fictional report and a corrected update.

**Knowledge check** (`assessment.arabic-incident-summary-check`):

- Is an unusual login automatically proof of a breach?

- Which practice data should be used?

- Read لم تتوفر بعد معلومات كافية لمعرفة السبب. Write a report note preserving that limit.



**Mini challenge** (`exercise.arabic-incident-summary-transfer`): Revise the report after one new fact changes the hypothesis.

**Suggested resource types:** worked example, reference, graded text.

**Resource pointers:** `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-w3c`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-email`, `asset.arabic-technical-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A fictional report and a corrected update submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Revise the report after one new fact changes the hypothesis. Evidence: record support, prompt novelty and task conditions.



#### Topic — Technical synthesis

**ID:** `topic.arabic-technology-technical-synthesis`



<a id="lesson.arabic-technical-demo"></a>

##### Lesson — Deliver a bilingual technical communication project

**ID:** `lesson.arabic-technical-demo` · **Module:** `module.arabic-technology` · **Difficulty:** 4/6 · **Target:** B1-extension

**Duration:** 60 min standard; 15 min partial session; 30–90 min for a complete/expanded encounter. Further module practice builds retention.

**Prerequisites:** `skill.arabic-b1-portfolio`, `skill.arabic-formal-email`, `skill.arabic-dictionary-method`, `skill.arabic-incident-summary`

**Skill:** `skill.arabic-technical-demo`

**Learning objectives:**

- Present a technically checked concept and answer simple follow-up questions

- Demonstrate the outcome on a changed prompt: Explain a second concept using the same process.



**Key concepts:** terminology consistency; source traceability; audience; Q&A.

**Arabic example:** عَرْضٌ تَوْضِيحِيٌّ — A demonstration/presentation

**Practical exercise** (`exercise.arabic-technical-demo`): Produce a glossary, explainer and fictional report, then give a four-minute demonstration with unprepared questions; score language and subject accuracy separately.

**Evidence to keep:** A three-part portfolio and a recorded Q&A.

**Knowledge check** (`assessment.arabic-technical-demo-check`):

- Does this project certify cybersecurity competence?

- What happens when a question exceeds your technical knowledge?

- Write one Arabic sentence that states you need to verify a technical answer rather than guessing.



**Mini challenge** (`exercise.arabic-technical-demo-transfer`): Explain a second concept using the same process.

**Suggested resource types:** verified audio, live partner, worked example.

**Resource pointers:** `resource.arabic-qabas`, `resource.arabic-ryding`, `resource.arabic-w3c`. The catalogue below gives verified links.

**Optional starter material:** `asset.arabic-email`, `asset.arabic-technical-report`. Match its actual difficulty to the lesson; shorten or preteach if necessary.

**Completion criteria:**

- A three-part portfolio and a recorded Q&A submitted

- All knowledge/application checks completed and explained accurately after feedback

- Targeted practical rubric at least 70/100; record support used

- Transfer task attempted and one error or uncertainty logged



**Adaptable versions:**

- Short (15 min): Recall one concept and complete the first checkpoint of the practical task. Evidence: partial; not whole-lesson completion.

- Standard (60 min): Model, guided attempt, the knowledge/application checks, changed prompt and reflection. Evidence: one full lesson attempt; not durable mastery.

- Extended (90 min): Add a new source, voice, audience or contrast and explain differences. Evidence: additional transfer evidence if genuinely independent.

- Revision (10 min): Retrieve without notes, inspect one previous error, then try a fresh example. Evidence: only the modalities actually observed.

- Practical (30 min): Explain a second concept using the same process. Evidence: record support, prompt novelty and task conditions.



#### Module labs and assessment

**Fuṣḥā for technology and cybersecurity communication: guided** (`lab.arabic-technology-guided`, 45 min, splittable): Build a bilingual glossary from current primary technical sources and use it in an Arabic explainer.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Fuṣḥā for technology and cybersecurity communication: transfer** (`lab.arabic-technology-transfer`, 75 min, splittable): Explain a different technology concept to a non-specialist and check both technical and language accuracy.

Deliver: Dated task response or recording; Comprehension or listener/reader feedback; One corrected attempt and support log. Use the common practical rubric; pass at 75/100.

**Assessment:** `assessment.arabic-technology-performance` — Explain a different technology concept to a non-specialist and check both technical and language accuracy.

Allow 45 minutes across short sessions, plus 15 minutes for a changed task on another day.

- Overall rubric at least 75/100

- Every required observed modality at least 60/100; unknown remains untested

- Fresh input and independent first attempt

- A changed task on another day verifies transfer



**Project connections:** Arabic technology communication pack (`project.arabic-tech-pack`)

##### Project: Arabic technology communication pack

**ID:** `project.arabic-tech-pack`

**Goal:** Explain a checked technical concept accurately in accessible Fuṣḥā.

**Required skills:** `skill.arabic-technical-terminology`, `skill.arabic-security-explainer`, `skill.arabic-technical-demo`

**Study time:** 8–12 hours; allocated once to `module.arabic-technology`.

**Deliverables:**

- Ten-term sourced glossary

- 150-word plain-language explainer

- 200-word fictional incident summary

- Four-minute presentation and Q&A



**Assessment criteria:**

- 25% — Terminology and concepts are technically checked

- 25% — Arabic is clear for the intended reader

- 25% — Observation is separated from inference

- 25% — All example data are fictional or sanitised



**Pass:** 75/100, with honest conditions and evidence. **Portfolio value:** Connects Arabic with technology interests through demonstrable communication.

**Evidence conditions:**

- Preserve unaided drafts and later assisted revisions separately.

- Record date, prompt, modality, support and reviewer.

- Use fresh follow-up tasks for independent mastery evidence.



**Retake:** Keep previous evidence; change source, prompt or audience after feedback.



---



## 13. Paths and milestone evidence

### Script and sound foundations

**ID:** `path.arabic-start`

**Cumulative budget:** 36–54 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`)

Cumulative from zero; approximate targets, not certified levels. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Everyday starting Fuṣḥā: A1 target

**ID:** `path.arabic-a1`

**Cumulative budget:** 146–214 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`)

Cumulative from zero; approximate targets, not certified levels. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Connected everyday Fuṣḥā: A2 target

**ID:** `path.arabic-a2`

**Cumulative budget:** 276–404 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`)

Cumulative from zero; approximate targets, not certified levels. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Independent familiar-domain Fuṣḥā: B1 target

**ID:** `path.arabic-b1`

**Cumulative budget:** 516–752 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`)

Cumulative from zero; approximate targets, not certified levels. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Common core: B2 target

**ID:** `path.arabic-core-b2`

**Cumulative budget:** 791–1152 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`); News, interviews and public information (`module.arabic-media`); Argument, viewpoint and critical reading (`module.arabic-argument`); Grammar and orthography for precise reading (`module.arabic-grammar-precision`); Extended speaking, essays and presentations (`module.arabic-b2-communication`); B2 consolidation and long-term independence (`module.arabic-b2-independent`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`); A small MSA media digest (`project.arabic-media-digest`); A supported argument and discussion (`project.arabic-debate`); A meaning-focused editing dossier (`project.arabic-editor`); One idea for two audiences (`project.arabic-presentation`); The independent Fuṣḥā portfolio (`project.arabic-core-dossier`)

Cumulative from zero; approximate targets, not certified levels. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Academic and professional Fuṣḥā

**ID:** `path.arabic-academic-professional`

**Cumulative budget:** 871–1272 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`); News, interviews and public information (`module.arabic-media`); Argument, viewpoint and critical reading (`module.arabic-argument`); Grammar and orthography for precise reading (`module.arabic-grammar-precision`); Extended speaking, essays and presentations (`module.arabic-b2-communication`); B2 consolidation and long-term independence (`module.arabic-b2-independent`); Academic and professional Fuṣḥā (`module.arabic-academic`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`); A small MSA media digest (`project.arabic-media-digest`); A supported argument and discussion (`project.arabic-debate`); A meaning-focused editing dossier (`project.arabic-editor`); One idea for two audiences (`project.arabic-presentation`); The independent Fuṣḥā portfolio (`project.arabic-core-dossier`); A reviewed academic/professional brief (`project.arabic-academic-brief`)

Includes prerequisite closure from zero. This branch is optional; demonstrated skill-level placement may shorten its module route. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Literary Arabic, stories and style

**ID:** `path.arabic-literature`

**Cumulative budget:** 621–912 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`); Argument, viewpoint and critical reading (`module.arabic-argument`); Literary Arabic, stories and style (`module.arabic-literature`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`); A supported argument and discussion (`project.arabic-debate`); A supported literary response (`project.arabic-literary-response`)

Includes prerequisite closure from zero. This branch is optional; demonstrated skill-level placement may shorten its module route. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Bridge from MSA to classical prose

**ID:** `path.arabic-classical`

**Cumulative budget:** 631–922 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`); Grammar and orthography for precise reading (`module.arabic-grammar-precision`); Bridge from MSA to classical prose (`module.arabic-classical`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`); A meaning-focused editing dossier (`project.arabic-editor`); An annotated classical prose study (`project.arabic-classical-study`)

Includes prerequisite closure from zero. This branch is optional; demonstrated skill-level placement may shorten its module route. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Qur’anic Arabic reading and linguistic study

**ID:** `path.arabic-quranic`

**Cumulative budget:** 691–1022 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`); Grammar and orthography for precise reading (`module.arabic-grammar-precision`); Bridge from MSA to classical prose (`module.arabic-classical`); Qur’anic Arabic reading and linguistic study (`module.arabic-quranic`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`); A meaning-focused editing dossier (`project.arabic-editor`); An annotated classical prose study (`project.arabic-classical-study`); A sourced Qur’anic language journal (`project.arabic-quranic-study`)

Includes prerequisite closure from zero. This branch is optional; demonstrated skill-level placement may shorten its module route. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Translation and cross-language mediation

**ID:** `path.arabic-translation`

**Cumulative budget:** 841–1232 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`); News, interviews and public information (`module.arabic-media`); Argument, viewpoint and critical reading (`module.arabic-argument`); Grammar and orthography for precise reading (`module.arabic-grammar-precision`); Extended speaking, essays and presentations (`module.arabic-b2-communication`); B2 consolidation and long-term independence (`module.arabic-b2-independent`); Translation and cross-language mediation (`module.arabic-translation`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`); A small MSA media digest (`project.arabic-media-digest`); A supported argument and discussion (`project.arabic-debate`); A meaning-focused editing dossier (`project.arabic-editor`); One idea for two audiences (`project.arabic-presentation`); The independent Fuṣḥā portfolio (`project.arabic-core-dossier`); A transparent translation and mediation pack (`project.arabic-translation-pack`)

Includes prerequisite closure from zero. This branch is optional; demonstrated skill-level placement may shorten its module route. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### Fuṣḥā for technology and cybersecurity communication

**ID:** `path.arabic-technology`

**Cumulative budget:** 551–807 hours.

**Required module route:** Orientation, placement and learning habits (`module.arabic-learning-start`); Arabic script and decoding (`module.arabic-script`); Listening foundations and intelligible pronunciation (`module.arabic-sound`); First meaningful sentences and introductions (`module.arabic-first-sentences`); Nouns, description and possession (`module.arabic-noun-phrases`); Present actions, preferences and routines (`module.arabic-present-actions`); Numbers, time, place and everyday tasks (`module.arabic-daily-tasks`); A1 consolidation: my world in Fuṣḥā (`module.arabic-a1-integration`); Past events and simple stories (`module.arabic-past-stories`); Plans, negation, requests and possibility (`module.arabic-plans-negation`); Relationships, agreement and useful case awareness (`module.arabic-relationships-case`); Roots, patterns and dictionary independence (`module.arabic-morphology-lookup`); A2 consolidation: stories, plans and practical reading (`module.arabic-a2-integration`); The wider verb system (`module.arabic-verb-expansion`); Relative clauses, reported information and conditions (`module.arabic-clause-building`); Unvowelled reading and vocabulary growth (`module.arabic-independent-reading`); Longer listening and unrehearsed interaction (`module.arabic-listening-interaction`); Paragraphs, correspondence and revision (`module.arabic-connected-writing`); B1 consolidation: explain, interact and learn independently (`module.arabic-b1-integration`); Fuṣḥā for technology and cybersecurity communication (`module.arabic-technology`)

**Required projects:** A sound-and-script field notebook (`project.arabic-sound-script-notebook`); My world in Fuṣḥā (`project.arabic-my-world`); A week, a problem and a new plan (`project.arabic-week-story`); An independent reading notebook (`project.arabic-reader-notebook`); A genuine information-gap interview (`project.arabic-interview`); A practical correspondence pack (`project.arabic-correspondence`); A source-based Fuṣḥā explainer (`project.arabic-explainer`); Arabic technology communication pack (`project.arabic-tech-pack`)

Includes prerequisite closure from zero. This branch is optional; demonstrated skill-level placement may shorten its module route. Complete required performance evidence or demonstrate prior mastery through fresh diagnostic tasks; verify required modalities separately.



### A1 target checkpoint

- Listening: 30–45-second familiar-topic MSA dialogue; gist and three facts.

- Reading: Three new 25–50-word simple texts with appropriate vowel support.

- Speaking: Two-minute supported exchange with a changed question and repair.

- Writing: 50–70 meaningful words on a familiar profile or routine.



Original MyDay sampling tasks; durations and word counts are design choices, not official CEFR thresholds.

- Use new material and independent first attempts.

- Assess each modality separately; no compensation for an untested modality.

- Verify one weak function again after 7–14 days.

- Use qualified teacher feedback for external level claims.



### A2 target checkpoint

- Listening: 60–90-second MSA account; sequence, key details and negation.

- Reading: 120–180 words; purpose, details and pronoun reference with selective lookup.

- Speaking: Four-minute routine information-gap task with one complication.

- Writing: 100–150 words connecting events and plans.



Original MyDay sampling tasks; durations and word counts are design choices, not official CEFR thresholds.

- Use new material and independent first attempts.

- Assess each modality separately; no compensation for an untested modality.

- Verify one weak function again after 7–14 days.

- Use qualified teacher feedback for external level claims.



### B1 target checkpoint

- Listening: Two- to three-minute selected connected MSA; structure and main details.

- Reading: 250–350-word selected unvowelled text; main ideas, reference and useful inference.

- Speaking: Six- to eight-minute familiar-topic exchange; explanation, follow-ups and repair.

- Writing: 150–200-word coherent explanation or practical correspondence.



Original MyDay sampling tasks; durations and word counts are design choices, not official CEFR thresholds.

- Use new material and independent first attempts.

- Assess each modality separately; no compensation for an untested modality.

- Verify one weak function again after 7–14 days.

- Use qualified teacher feedback for external level claims.



### B2 target checkpoint

- Listening: Five- to eight-minute selected formal MSA; argument, details and qualification.

- Reading: 600–800-word selected unvowelled text; stance, structure and evidence.

- Speaking: Eight- to ten-minute unrehearsed discussion with an unfamiliar question.

- Writing: 300–450-word organised response; independent draft separated from revision.



Original MyDay sampling tasks; durations and word counts are design choices, not official CEFR thresholds.

- Use new material and independent first attempts.

- Assess each modality separately; no compensation for an untested modality.

- Verify one weak function again after 7–14 days.

- Use qualified teacher feedback for external level claims.



## 14. Original starter practice materials

All people, events and data here are fictional or generic teaching examples. These short texts are not long-form B2/C1 assessment passages. Written scripts do not provide audio. Reference answers are in `MyDay_Arabic_Assessment_Keys.json`; reveal them after an attempt.

### A short personal profile

**ID:** `asset.arabic-profile` · **Target:** A1

أَنَا لَيْلَى. أَنَا طَالِبَةٌ. أَسْكُنُ فِي مَدِينَةٍ صَغِيرَةٍ. بَيْتِي قَرِيبٌ مِنَ الْمَدْرَسَةِ. أَدْرُسُ الْعَرَبِيَّةَ فِي الصَّبَاحِ، وَأَقْرَأُ فِي الْمَسَاءِ. عِنْدِي كِتَابٌ جَدِيدٌ وَدَفْتَرٌ صَغِيرٌ.



**Unvowelled practice display:**

أنا ليلى. أنا طالبة. أسكن في مدينة صغيرة. بيتي قريب من المدرسة. أدرس العربية في الصباح، وأقرأ في المساء. عندي كتاب جديد ودفتر صغير.



- What is Layla’s role?

- Is her home far from school?

- When does she read?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A room with books

**ID:** `asset.arabic-room` · **Target:** A1

هَذِهِ غُرْفَةٌ صَغِيرَةٌ. فِي الْغُرْفَةِ مَكْتَبٌ وَكُرْسِيٌّ. عَلَى الْمَكْتَبِ ثَلَاثَةُ كُتُبٍ. الْكُتُبُ جَدِيدَةٌ. هَذَا كِتَابُ لَيْلَى، وَذَلِكَ كِتَابُ سَامِي. بَابُ الْغُرْفَةِ مَفْتُوحٌ.



**Unvowelled practice display:**

هذه غرفة صغيرة. في الغرفة مكتب وكرسي. على المكتب ثلاثة كتب. الكتب جديدة. هذا كتاب ليلى، وذلك كتاب سامي. باب الغرفة مفتوح.



- Where are the books?

- How many books are there?

- Is the room’s door closed?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### Meeting at a language class

**ID:** `asset.arabic-introduction-dialogue` · **Target:** A1

سَامِي: مَرْحَبًا. مَا اسْمُكِ؟



لَيْلَى: اسْمِي لَيْلَى. وَمَا اسْمُكَ؟



سَامِي: اسْمِي سَامِي. هَلْ أَنْتِ طَالِبَةٌ؟



لَيْلَى: نَعَمْ، أَنَا طَالِبَةٌ. هَلْ تَدْرُسُ الْعَرَبِيَّةَ؟



سَامِي: نَعَمْ. أَدْرُسُ الْعَرَبِيَّةَ فِي الْمَسَاءِ.



لَيْلَى: أَنَا أَدْرُسُ فِي الصَّبَاحِ.



**Unvowelled practice display:**

سامي: مرحبا. ما اسمك؟
ليلى: اسمي ليلى. وما اسمك؟
سامي: اسمي سامي. هل أنت طالبة؟
ليلى: نعم، أنا طالبة. هل تدرس العربية؟
سامي: نعم. أدرس العربية في المساء.
ليلى: أنا أدرس في الصباح.



- Who studies in the morning?

- Does Sami study Arabic?

- Which address form shows Sami is speaking to a woman?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### An appointment message

**ID:** `asset.arabic-appointment` · **Target:** A1

مَرْحَبًا يَا سَامِي. مَوْعِدُنَا يَوْمَ الثُّلَاثَاءِ فِي السَّاعَةِ الثَّالِثَةِ. الْمَكْتَبَةُ بِجَانِبِ الْمَدْرَسَةِ. أَنَا فِي الْمَكْتَبَةِ فِي السَّاعَةِ الثَّانِيَةِ. إِلَى اللِّقَاءِ!



لَيْلَى



**Unvowelled practice display:**

مرحبا يا سامي. موعدنا يوم الثلاثاء في الساعة الثالثة. المكتبة بجانب المدرسة. أنا في المكتبة في الساعة الثانية. إلى اللقاء!
ليلى



- When is the agreed meeting?

- Who will already be at the library at two?

- Where is the library?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A study-day routine

**ID:** `asset.arabic-routine` · **Target:** A1

أَسْتَيْقِظُ فِي الصَّبَاحِ. أَشْرَبُ الْمَاءَ، ثُمَّ أَقْرَأُ كِتَابًا. أَدْرُسُ الْعَرَبِيَّةَ نِصْفَ سَاعَةٍ. بَعْدَ ذَلِكَ أَذْهَبُ إِلَى الْعَمَلِ. فِي الْمَسَاءِ أَكْتُبُ جُمَلًا قَصِيرَةً. أَنَا أُحِبُّ الْقِرَاءَةَ، وَلَكِنَّ الْكِتَابَةَ صَعْبَةٌ أَحْيَانًا.



**Unvowelled practice display:**

أستيقظ في الصباح. أشرب الماء، ثم أقرأ كتابا. أدرس العربية نصف ساعة. بعد ذلك أذهب إلى العمل. في المساء أكتب جملا قصيرة. أنا أحب القراءة، ولكن الكتابة صعبة أحيانا.



- How long is Arabic study?

- What happens after study?

- Which skill is sometimes difficult?



Preteach أستيقظ، نصف ساعة، أحيانا as chunks; the text is supported A1 practice, not an unseen test for early lessons.

**Audio:** Not included.



### A changed weekend

**ID:** `asset.arabic-weekend` · **Target:** A2

فِي يَوْمِ السَّبْتِ زُرْتُ صَدِيقِي سَامِي. كَانَ الْجَوُّ جَمِيلًا، فَذَهَبْنَا إِلَى الْحَدِيقَةِ. جَلَسْنَا تَحْتَ شَجَرَةٍ وَتَحَدَّثْنَا عَنِ الدِّرَاسَةِ. بَعْدَ ذَلِكَ أَرَدْنَا أَنْ نَذْهَبَ إِلَى الْمَكْتَبَةِ، وَلَكِنَّهَا كَانَتْ مُغْلَقَةً. لَمْ نَدْخُلِ الْمَكْتَبَةَ. عُدْنَا إِلَى الْبَيْتِ وَقَرَأْنَا قِصَّةً قَصِيرَةً. فِي الْأُسْبُوعِ الْقَادِمِ سَنَزُورُ الْمَكْتَبَةَ يَوْمَ الْجُمُعَةِ. سَأَتَأَكَّدُ مِنْ وَقْتِ افْتِتَاحِهَا قَبْلَ الزِّيَارَةِ.



**Unvowelled practice display:**

في يوم السبت زرت صديقي سامي. كان الجو جميلا، فذهبنا إلى الحديقة. جلسنا تحت شجرة وتحدثنا عن الدراسة. بعد ذلك أردنا أن نذهب إلى المكتبة، ولكنها كانت مغلقة. لم ندخل المكتبة. عدنا إلى البيت وقرأنا قصة قصيرة. في الأسبوع القادم سنزور المكتبة يوم الجمعة. سأتأكد من وقت افتتاحها قبل الزيارة.



- Why did the planned library visit fail?

- Did they enter the library?

- What will the speaker check before the next visit?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### Negotiating another meeting time

**ID:** `asset.arabic-changed-plan` · **Target:** A2

لَيْلَى: أُرِيدُ أَنْ أَدْرُسَ مَعَكِ يَوْمَ الثُّلَاثَاءِ. هَلْ تَسْتَطِيعِينَ أَنْ تَحْضُرِي فِي السَّاعَةِ الثَّالِثَةِ؟



نُور: لَا أَسْتَطِيعُ، لِأَنَّ عِنْدِي مَوْعِدًا. أَسْتَطِيعُ أَنْ أَحْضُرَ يَوْمَ الْأَرْبِعَاءِ.



لَيْلَى: هَلْ تُنَاسِبُكِ السَّاعَةُ الرَّابِعَةُ؟



نُور: نَعَمْ. أَيْنَ سَنَلْتَقِي؟



لَيْلَى: فِي الْمَكْتَبَةِ. سَأُرْسِلُ إِلَيْكِ الْعُنْوَانَ.



نُور: شُكْرًا. إِذَنْ مَوْعِدُنَا يَوْمَ الْأَرْبِعَاءِ فِي السَّاعَةِ الرَّابِعَةِ.



**Unvowelled practice display:**

ليلى: أريد أن أدرس معك يوم الثلاثاء. هل تستطيعين أن تحضري في الساعة الثالثة؟
نور: لا أستطيع، لأن عندي موعدا. أستطيع أن أحضر يوم الأربعاء.
ليلى: هل تناسبك الساعة الرابعة؟
نور: نعم. أين سنلتقي؟
ليلى: في المكتبة. سأرسل إليك العنوان.
نور: شكرا. إذن موعدنا يوم الأربعاء في الساعة الرابعة.



- Why can Noor not attend on Tuesday?

- What is the final agreed time?

- What will Layla send?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A short library notice

**ID:** `asset.arabic-notice` · **Target:** A2

تَفْتَحُ الْمَكْتَبَةُ أَبْوَابَهَا مِنَ السَّاعَةِ التَّاسِعَةِ صَبَاحًا إِلَى السَّاعَةِ الْخَامِسَةِ مَسَاءً. تُغْلَقُ يَوْمَ السَّبْتِ. يَسْتَطِيعُ الْقُرَّاءُ اسْتِعَارَةَ ثَلَاثَةِ كُتُبٍ لِمُدَّةِ أُسْبُوعَيْنِ. لَا يُسْمَحُ بِالطَّعَامِ فِي غُرْفَةِ الْقِرَاءَةِ. لِطَلَبِ الْمُسَاعَدَةِ، يُرْجَى سُؤَالُ الْمُوَظَّفِ عِنْدَ الْمَدْخَلِ.



**Unvowelled practice display:**

تفتح المكتبة أبوابها من الساعة التاسعة صباحا إلى الساعة الخامسة مساء. تغلق يوم السبت. يستطيع القراء استعارة ثلاثة كتب لمدة أسبوعين. لا يسمح بالطعام في غرفة القراءة. لطلب المساعدة، يرجى سؤال الموظف عند المدخل.



- Can a reader visit on Saturday?

- How many books can be borrowed, and for how long?

- Where can a reader request help?



Preteach passive and formal notice chunks if used before the wider-verb module; otherwise use as B1 review.

**Audio:** Not included.



### Choosing a sustainable study method

**ID:** `asset.arabic-study-method` · **Target:** B1

كان سامي يدرس كلمات جديدة كل مساء، لكنه كان ينسى كثيرا منها بعد أيام قليلة. لذلك قرر أن يغير طريقته. بدأ يقرأ نصوصا قصيرة عن الموضوعات التي يحبها، ثم يختار من كل نص كلمات قليلة يحتاج إليها. لم يكتف بكتابة معانيها، بل كتب جملا من عنده واستعمل الكلمات في حديثه مع صديق. في نهاية الأسبوع عاد إلى النص الأول وحاول تلخيصه دون النظر إليه. وجد أنه يتذكر بعض الكلمات بسهولة، وأن كلمات أخرى ما زالت تحتاج إلى مراجعة. لم يعتبر ذلك فشلا؛ فقد ساعده على معرفة ما ينبغي أن يدرسه في الأسبوع التالي.



- What problem prompted the change?

- What did he do beyond writing meanings?

- Did he remember every word?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A fictional community reading project

**ID:** `asset.arabic-community-library` · **Target:** B1

أعلنت مكتبة الحي عن مشروع جديد لتشجيع القراءة بين الكبار. سيجتمع المشاركون مرة كل أسبوع لقراءة قصة قصيرة ومناقشتها. وقالت منسقة المشروع إن الهدف ليس قراءة أكبر عدد من الصفحات، بل فهم النص وتبادل الآراء حوله. يستطيع المشارك أن يختار نسخة مطبوعة أو إلكترونية، كما يمكنه الاستماع إلى تسجيل للقصة إذا كان متاحا بصورة قانونية. لا يشترط المشروع معرفة سابقة بالأدب، لكنه يطلب من كل مشارك أن يأتي بسؤال واحد على الأقل. وسيجرب الفريق هذا النظام لمدة شهر، ثم يجمع الملاحظات قبل أن يقرر الاستمرار فيه. لم يحدد الإعلان بعد عدد المشاركين أو موعد الاجتماع الأول.



- What is the stated goal?

- Is prior literary knowledge required?

- Which details are still unspecified?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A fictional transport report

**ID:** `asset.arabic-transport-report` · **Target:** B2

قالت بلدية مدينة افتراضية إن عدد مستخدمي الحافلات ارتفع من عشرة آلاف إلى اثني عشر ألفا في الشهر الماضي، بعد تخفيض سعر التذكرة. ووصفت البلدية الزيادة بأنها دليل على نجاح التخفيض. غير أن باحثة في النقل أشارت إلى أن الأرقام وحدها لا تكفي لتحديد السبب؛ فقد افتتحت المدينة في الشهر نفسه خطين جديدين، كما أغلقت بعض الشوارع لأعمال الصيانة. وطالبت الباحثة بمقارنة الأعداد على مدى فترة أطول وبمعرفة ما إذا كان الركاب الجدد قد توقفوا عن استخدام سياراتهم. واتفق الطرفان على ضرورة تحسين الخدمة، لكنهما اختلفا في تفسير الزيادة. هذه بيانات تعليمية مختلقة، ولا تصف مدينة حقيقية.



- From what figure to what figure did use rise?

- Name two alternative contributing factors mentioned.

- Does the text establish that lower prices alone caused the rise?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A short argument about digital reading

**ID:** `asset.arabic-digital-reading` · **Target:** B2

يرى بعض القراء أن الكتب الإلكترونية تسهل الوصول إلى المعرفة، لأنها تتيح حمل مكتبة كبيرة والبحث داخل النص بسرعة. ويخشى آخرون أن تؤدي كثرة الإشعارات والروابط إلى تشتت الانتباه. لا يبدو أن السؤال المفيد هو أي النوعين أفضل في جميع الأحوال، بل أيهما أنسب للقارئ وللمهمة. فمن يريد العثور على معلومة محددة قد يستفيد من البحث الرقمي، بينما قد يفضل قارئ آخر نسخة ورقية خلال جلسة طويلة. ويمكن تقليل المشتتات بإغلاق الإشعارات واختيار وقت مناسب للقراءة. ومع ذلك، فإن تفضيل وسيلة معينة لا يثبت وحده أنها تحسن فهم كل قارئ. ينبغي أن يقارن الشخص أداءه في مهام متشابهة، وأن يختار الوسيلة التي تساعده على تحقيق غرضه.



- What absolute choice does the author question?

- What advantage of digital books is stated?

- Does personal preference alone prove better comprehension?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A formal information request

**ID:** `asset.arabic-email` · **Target:** B1

السيدة المحترمة،



أرغب في الحصول على معلومات عن دورة اللغة العربية التي ستبدأ الشهر القادم. هل يمكنكم توضيح مواعيد الدروس وعدد المشاركين المتوقع؟ أعمل في المساء، ولذلك أبحث عن مجموعة تلتقي في الصباح. أود أيضا معرفة ما إذا كانت الدورة تتضمن تدريبات على المحادثة بالفصحى، وما إذا كان هناك اختبار لتحديد المستوى قبل التسجيل.



أشكركم على مساعدتكم، وأتطلع إلى ردكم.



مع خالص التحية،



ليلى



- Why does Layla prefer a morning group?

- Which speaking register does she ask about?

- Has she stated that she is already enrolled?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### A fictional account-access report

**ID:** `asset.arabic-technical-report` · **Target:** B1-extension

في الساعة التاسعة صباحا، أبلغ مستخدم في شركة افتراضية أنه لم يتمكن من الدخول إلى حسابه. أظهرت السجلات خمس محاولات دخول غير ناجحة خلال عشر دقائق، ثم تم قفل الحساب مؤقتا. لم تتوفر بعد معلومات كافية لمعرفة ما إذا كانت المحاولات صادرة عن المستخدم نفسه أو عن شخص آخر. اتصل فريق الدعم بالمستخدم عبر وسيلة معروفة، وطلب منه تأكيد آخر محاولة قام بها. سيقارن الفريق الإجابة بالسجلات قبل اتخاذ الخطوة التالية. لا تتضمن هذه الحالة التعليمية أي بيانات حقيقية أو كلمات مرور.



- How many failed attempts were recorded?

- Has the source of the attempts been established?

- What will the team compare next?



A short practice stimulus, not a complete stage examination.

**Audio:** Not included.



### Fictional weekly study timetable

**ID:** `asset.arabic-timetable` · **Target:** A1

- الاثنين — 09:00 — قراءة — البيت

- الثلاثاء — 15:00 — محادثة — المكتبة

- الأربعاء — 16:00 — دراسة — المكتبة

- الخميس — 10:00 — كتابة — البيت

- الجمعة — 11:00 — مراجعة — البيت



Ask and answer five schedule questions; change one time and reconfirm it.

**Audio:** Not included.



### Sound contrast recording specification

**ID:** `asset.arabic-contrast-bank` · **Target:** Pre-A1

- قَلْب / كَلْب — heart / dog

- مَلِك / مَالِك — king / owner

- دَرَسَ / دَرَّسَ — he studied / he taught

- سَارَ / صَارَ — he walked/went / he became

- تِين / طِين — figs / clay

- هَلْ / حَلّ — whether/question particle / solution

- سَيْف / صَيْف — sword / summer

- عَلَم / أَلَم — flag / pain



A competent MSA speaker records shuffled pairs; first identify the intended word without text, then imitate and obtain listener feedback.

These are written prompts, not audio. Confirm meanings and pronunciation before use; do not score listening from displayed text. هَلْ / حَلّ differs both in the first consonant and in lām length: it is a multi-feature contrast, not a minimal pair. Use isolated model syllables هَ / حَ when training only the first consonant.

**Audio:** Not included.



### Starter vocabulary: 48 records

Each record is a beginning point for separately tested written recognition, audio recognition, spoken retrieval and written retrieval. Add plurals, past–present pairs and collocations as taught. These are not a complete frequency list or a level threshold.

- **أَنَا** — I; pronoun. Example: أَنَا طَالِبٌ. — I am a student. (`lexeme.arabic-seed-001`)

- **أَنْتَ** — you, masculine singular; pronoun. Example: هَلْ أَنْتَ طَالِبٌ؟ — Are you a student? (`lexeme.arabic-seed-002`)

- **أَنْتِ** — you, feminine singular; pronoun. Example: هَلْ أَنْتِ طَالِبَةٌ؟ — Are you a student? (`lexeme.arabic-seed-003`)

- **هُوَ** — he; pronoun. Example: هُوَ فِي الْبَيْتِ. — He is at home. (`lexeme.arabic-seed-004`)

- **هِيَ** — she; pronoun. Example: هِيَ فِي الْمَدْرَسَةِ. — She is at school. (`lexeme.arabic-seed-005`)

- **نَحْنُ** — we; pronoun. Example: نَحْنُ نَدْرُسُ. — We study. (`lexeme.arabic-seed-006`)

- **بَيْت** — house/home; noun. Example: هَذَا بَيْتٌ كَبِيرٌ. — This is a big house. (`lexeme.arabic-seed-007`)

- **بَاب** — door; noun. Example: الْبَابُ مَفْتُوحٌ. — The door is open. (`lexeme.arabic-seed-008`)

- **كِتَاب** — book; noun. Example: عِنْدِي كِتَابٌ. — I have a book. (`lexeme.arabic-seed-009`)

- **كُتُب** — books; noun_plural. Example: هَذِهِ كُتُبٌ جَدِيدَةٌ. — These are new books. (`lexeme.arabic-seed-010`)

- **مَدْرَسَة** — school; noun. Example: الْمَدْرَسَةُ قَرِيبَةٌ. — The school is near. (`lexeme.arabic-seed-011`)

- **مَكْتَبَة** — library/bookshop, choose by context; noun. Example: أَنَا فِي الْمَكْتَبَةِ. — I am in the library. (`lexeme.arabic-seed-012`)

- **طَالِب** — male student; noun. Example: سَامِي طَالِبٌ. — Sami is a student. (`lexeme.arabic-seed-013`)

- **طَالِبَة** — female student; noun. Example: لَيْلَى طَالِبَةٌ. — Layla is a student. (`lexeme.arabic-seed-014`)

- **كَبِير** — big; adjective. Example: الْبَيْتُ كَبِيرٌ. — The house is big. (`lexeme.arabic-seed-015`)

- **صَغِير** — small; adjective. Example: عِنْدِي دَفْتَرٌ صَغِيرٌ. — I have a small notebook. (`lexeme.arabic-seed-016`)

- **جَدِيد** — new; adjective. Example: هَذَا كِتَابٌ جَدِيدٌ. — This is a new book. (`lexeme.arabic-seed-017`)

- **فِي** — in/at; preposition. Example: أَنَا فِي الْبَيْتِ. — I am at home. (`lexeme.arabic-seed-018`)

- **مِنْ** — from; preposition. Example: هُوَ مِنْ مِصْرَ. — He is from Egypt. (`lexeme.arabic-seed-019`)

- **إِلَى** — to; preposition. Example: أَذْهَبُ إِلَى الْمَدْرَسَةِ. — I go to school. (`lexeme.arabic-seed-020`)

- **عَلَى** — on; preposition. Example: الْكِتَابُ عَلَى الْمَكْتَبِ. — The book is on the desk. (`lexeme.arabic-seed-021`)

- **أَيْنَ** — where; question. Example: أَيْنَ الْكِتَابُ؟ — Where is the book? (`lexeme.arabic-seed-022`)

- **مَنْ** — who; question. Example: مَنْ هُوَ؟ — Who is he? (`lexeme.arabic-seed-023`)

- **مَتَى** — when; question. Example: مَتَى الْمَوْعِدُ؟ — When is the appointment? (`lexeme.arabic-seed-024`)

- **هَلْ** — yes/no question marker; particle. Example: هَلْ أَنْتَ فِي الْبَيْتِ؟ — Are you at home? (`lexeme.arabic-seed-025`)

- **شُكْرًا** — thank you; chunk. Example: شُكْرًا لَكَ. — Thank you. (to a male) (`lexeme.arabic-seed-026`)

- **مِنْ فَضْلِكَ** — please, to a male; chunk. Example: مَاءً، مِنْ فَضْلِكَ. — Water, please. (`lexeme.arabic-seed-027`)

- **مِنْ فَضْلِكِ** — please, to a female; chunk. Example: مَاءً، مِنْ فَضْلِكِ. — Water, please. (`lexeme.arabic-seed-028`)

- **صَبَاح** — morning; noun. Example: أَدْرُسُ فِي الصَّبَاحِ. — I study in the morning. (`lexeme.arabic-seed-029`)

- **مَسَاء** — evening; noun. Example: أَقْرَأُ فِي الْمَسَاءِ. — I read in the evening. (`lexeme.arabic-seed-030`)

- **أَمْسِ** — yesterday; adverb. Example: دَرَسْتُ أَمْسِ. — I studied yesterday. (`lexeme.arabic-seed-031`)

- **غَدًا** — tomorrow; adverb. Example: سَأَدْرُسُ غَدًا. — I will study tomorrow. (`lexeme.arabic-seed-032`)

- **الْيَوْم** — today; adverb. Example: أَدْرُسُ الْيَوْمَ. — I study today. (`lexeme.arabic-seed-033`)

- **قَرَأَ** — read, past 3ms; verb. Example: قَرَأَ سَامِي الْكِتَابَ. — Sami read the book. (`lexeme.arabic-seed-034`)

- **يَقْرَأُ** — reads, present 3ms; verb. Example: يَقْرَأُ سَامِي. — Sami reads. (`lexeme.arabic-seed-035`)

- **كَتَبَ** — wrote, past 3ms; verb. Example: كَتَبَ رِسَالَةً. — He wrote a letter. (`lexeme.arabic-seed-036`)

- **يَكْتُبُ** — writes, present 3ms; verb. Example: يَكْتُبُ رِسَالَةً. — He writes a letter. (`lexeme.arabic-seed-037`)

- **دَرَسَ** — studied, past 3ms; verb. Example: دَرَسَ الْعَرَبِيَّةَ. — He studied Arabic. (`lexeme.arabic-seed-038`)

- **يَدْرُسُ** — studies, present 3ms; verb. Example: يَدْرُسُ الْعَرَبِيَّةَ. — He studies Arabic. (`lexeme.arabic-seed-039`)

- **أُرِيدُ** — I want; verb. Example: أُرِيدُ كِتَابًا. — I want a book. (`lexeme.arabic-seed-040`)

- **عِنْدِي** — I have; chunk. Example: عِنْدِي سُؤَالٌ. — I have a question. (`lexeme.arabic-seed-041`)

- **سُؤَال** — question; noun. Example: عِنْدِي سُؤَالٌ. — I have a question. (`lexeme.arabic-seed-042`)

- **لِأَنَّ** — because; connector. Example: أَقْرَأُ لِأَنَّ الْكِتَابَ مُفِيدٌ. — I read because the book is useful. (`lexeme.arabic-seed-043`)

- **ثُمَّ** — then; connector. Example: أَقْرَأُ ثُمَّ أَكْتُبُ. — I read, then I write. (`lexeme.arabic-seed-044`)

- **لَكِنَّ** — but; connector. Example: الْكِتَابُ طَوِيلٌ، لَكِنَّهُ مُفِيدٌ. — The book is long, but it is useful. (`lexeme.arabic-seed-045`)

- **لِذَلِكَ** — therefore; connector. Example: أَنَا مُتْعَبٌ، لِذَلِكَ سَأَرْتَاحُ. — I am tired, so I will rest. (`lexeme.arabic-seed-046`)

- **فِكْرَة** — idea; noun. Example: هَذِهِ فِكْرَةٌ جَيِّدَةٌ. — This is a good idea. (`lexeme.arabic-seed-047`)

- **مَعْنَى** — meaning; noun. Example: مَا مَعْنَى هَذِهِ الْكَلِمَةِ؟ — What does this word mean? (`lexeme.arabic-seed-048`)



## 15. Verified resource catalogue

Checked 10 October 2026. Verification scope and access limitations are stated per entry. No paid purchase or account creation is required by the curriculum itself.

### CEFR Companion Volume and descriptors

**ID:** `resource.arabic-cefr` · **Type:** reference · **Provider:** Council of Europe

[CEFR Companion Volume and descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors)

**Use:** Supports a multidimensional proficiency profile. MyDay targets are original, approximate and not validated CEFR mappings.

**Stage fit:** All stages; design reference

**Access:** Public framework; no accredited certification supplied by MyDay.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Oral Proficiency Interview

**ID:** `resource.arabic-actfl-opi` · **Type:** official documentation · **Provider:** ACTFL

[Oral Proficiency Interview](https://www.actfl.org/assessments/postsecondary-assessments/opi)

**Use:** MSA is listed among available languages. This assesses spontaneous speaking; it does not certify every language skill.

**Stage fit:** Later independent speaking assessment

**Access:** Optional external assessment; verify current availability, provider, format and fee before booking.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Interactive Arabic

**ID:** `resource.arabic-ksu` · **Type:** structured course · **Provider:** King Saud University

[Interactive Arabic](https://learnarabiconline.ksu.edu.sa/Intro/IntroEn.aspx)

**Use:** The university describes contemporary MSA and requires prior alphabet/sound knowledge. Use as one source of beginner practice.

**Stage fit:** After script foundations; A1–A2 support

**Access:** Public description states free access after registration; current account flow and legacy media not tested.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Learning Arabic: courses and graded lessons

**ID:** `resource.arabic-aljazeera` · **Type:** structured course · **Provider:** Al Jazeera Media Network

[Learning Arabic: courses and graded lessons](https://learning.aljazeera.net/en/courses)

**Use:** Choose Fuṣḥā lessons with text, comprehension work and available media. Site level labels are provider labels.

**Stage fit:** A1 through advanced; select actual difficulty

**Access:** Public pages retrieved; interactive features or individual media availability may vary.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Alif Baa: Introduction to Arabic Letters and Sounds

**ID:** `resource.arabic-alifbaa` · **Type:** structured course · **Provider:** Georgetown University Press

[Alif Baa: Introduction to Arabic Letters and Sounds](https://alkitaabtextbook.com/alifbaa/)

**Use:** Established letters-and-sounds course. It integrates formal and colloquial Arabic: select MSA material for this path.

**Stage fit:** Script and sound foundations

**Access:** Optional paid book/companion access; verify edition, licence and current independent-learner access.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Al-Kitaab Part One

**ID:** `resource.arabic-alkitaab` · **Type:** structured course · **Provider:** Georgetown University Press

[Al-Kitaab Part One](https://alkitaabtextbook.com/part1/)

**Use:** Optional textbook spine; contains more than one Arabic variety. Align selected MSA units to MyDay outcomes rather than duplicating a whole second syllabus.

**Stage fit:** After alphabet; supplementary structured study

**Access:** Optional paid text and companion service; current prices not checked.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### A Reference Grammar of Modern Standard Arabic

**ID:** `resource.arabic-ryding` · **Type:** reference · **Provider:** Cambridge University Press; Karin C. Ryding

[A Reference Grammar of Modern Standard Arabic](https://www.cambridge.org/core/books/reference-grammar-of-modern-standard-arabic/207FA6CB610D541184C4B8CB10A4084A)

**Use:** Resolve morphology, syntax and dictionary-use questions. Consult relevant sections instead of reading it linearly as the beginner course.

**Stage fit:** A2 onwards, with teacher support earlier

**Access:** Publisher catalogue and contents retrieved; full book requires legitimate purchase or library access.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Qabas Arabic Lexicon

**ID:** `resource.arabic-qabas` · **Type:** reference · **Provider:** Birzeit University SinaLab

[Qabas Arabic Lexicon](https://sina.birzeit.edu/qabas)

**Use:** Advanced lexical verification and links among entries. Check register: its coverage is broader than MSA alone.

**Stage fit:** A2 onwards; supported lookup

**Access:** Public project and documentation verified; interface is not a beginner bilingual course.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### GLOSS: Arabic-MSA reading and listening

**ID:** `resource.arabic-gloss` · **Type:** practical lab · **Provider:** Defense Language Institute Foreign Language Center

[GLOSS: Arabic-MSA reading and listening](https://gloss.dliflc.edu/Default.aspx)

**Use:** Select Arabic-MSA explicitly. The portal also lists dialects and its levels are not interchangeable with CEFR.

**Stage fit:** B1–B2 and beyond; task-level screening required

**Access:** Public portal retrieved; individual selected lessons and media must be checked before assignment.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Aswaat Arabiyya: Arabic Voices

**ID:** `resource.arabic-aswaat` · **Type:** optional enrichment · **Provider:** University of Texas at Austin, LAITS

[Aswaat Arabiyya: Arabic Voices](https://www.laits.utexas.edu/aswaat/about2.php)

**Use:** Mostly MSA, with some intermediate colloquial selections and advanced mixed-register selections. Screen every chosen clip and use only items that still play and fit the target.

**Stage fit:** B1 onwards; optional listening archive

**Access:** Legacy archive; descriptive page verified, media not playback-tested. Never make progress depend on it.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Safahat Arabic books, linked by Hindawi

**ID:** `resource.arabic-hindawi` · **Type:** optional enrichment · **Provider:** Hindawi Foundation / Safahat

[Safahat Arabic books, linked by Hindawi](https://www.safahat.org/books/categories/novels/)

**Use:** The Hindawi about URL currently redirects to Safahat, whose Arabic catalogue was retrieved. Select texts by actual difficulty and edition, not fame.

**Stage fit:** B1 supported reading; B2/literature/classical selections

**Access:** Public catalogue retrieved. Free reading does not by itself grant redistribution rights for every book.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Quranic Arabic Corpus: linguistic documentation

**ID:** `resource.arabic-quran-corpus` · **Type:** reference · **Provider:** Quranic Arabic Corpus project

[Quranic Arabic Corpus: linguistic documentation](https://corpus.quran.com/documentation/)

**Use:** Word segmentation, morphology and syntax support. Annotations assist study; they do not replace a qualified teacher or contextual commentary.

**Stage fit:** Optional Qur’anic branch after classical bridge

**Access:** Public documentation retrieved; preserve exact passage references and consult appropriate text/recitation sources.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Arabic & Persian Layout Requirements

**ID:** `resource.arabic-w3c` · **Type:** official documentation · **Provider:** W3C

[Arabic & Persian Layout Requirements](https://www.w3.org/TR/alreq/)

**Use:** Implementation reference for Arabic script layout; the retrieved publication is a W3C Group Draft Note dated 2 October 2025, a work in progress rather than an endorsed standard or a teaching course.

**Stage fit:** MyDay implementation and Arabic digital literacy

**Access:** Public technical document; use current linked revisions as implementation evolves.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Arabic education and diglossia: UK reflections

**ID:** `resource.arabic-qfi` · **Type:** reference · **Provider:** QFI

[Arabic education and diglossia: UK reflections](https://www.qfi.org/blog/reflections-and-resource-arabic-in-the-uk/)

**Use:** Context for Fuṣḥā, regional varieties and learner goals. Dialect awareness does not make dialect mastery a course prerequisite.

**Stage fit:** Orientation; teacher/design reference

**Access:** Public education article located through search; direct retrieval unsuccessful in this review.

**Verification:** Indexed primary-source article retrieved on 10 October 2026. Direct opening returned a retrieval error; availability should be rechecked before assignment.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### The Four Strands (2007), publisher abstract

**ID:** `resource.arabic-nation` · **Type:** reference · **Provider:** Paul Nation; Victoria University of Wellington repository

[The Four Strands (2007), publisher abstract](https://www.tandfonline.com/doi/abs/10.2167/illt039.0)

**Use:** Rationale for balancing meaningful input, output, language study and fluency. MyDay allocations are adjustable design choices.

**Stage fit:** Teacher/design reference

**Access:** Publisher abstract and university repository record were retrieved through web search. Direct opening returned a retrieval error; full text was not inspected or reproduced.

**Verification:** Indexed primary-source abstract and repository record retrieved on 10 October 2026; DOI 10.2167/illt039.0. Direct page opening was unsuccessful.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Organizing Instruction and Study to Improve Student Learning

**ID:** `resource.arabic-ies` · **Type:** reference · **Provider:** Institute of Education Sciences / What Works Clearinghouse

[Organizing Instruction and Study to Improve Student Learning](https://ies.ed.gov/ncee/wwc/practiceguide/1)

**Use:** General evidence for spacing, retrieval and explanatory questions. It does not validate this Arabic mastery formula or exact intervals.

**Stage fit:** Teacher/design reference

**Access:** Public practice guide; apply principles with learner-specific adjustments.

**Verification:** Public primary-source page retrieved; enrolment, payment and individual media playback not tested.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Mastering Arabic 1, fourth edition

**ID:** `resource.arabic-mastering` · **Type:** structured course · **Provider:** Bloomsbury Academic; Jane Wightwick and Mahmoud Gaafar

[Mastering Arabic 1, fourth edition](https://www.bloomsbury.com/uk/mastering-arabic-1-9781350367265/)

**Use:** An optional MSA course for beginners with script from the start. Choose this or another main course as a source for MyDay tasks; avoid completing several overlapping beginner books. The publisher links companion audio and video.

**Stage fit:** Beginner through elementary; selected units

**Access:** Optional paid book; publisher describes free online audio/video resources. Prices, region-specific purchasing and individual playback were not tested.

**Verification:** Publisher catalogue and companion resource page retrieved on 10 October 2026; fourth edition and beginner MSA scope confirmed.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### Oxford Essential Arabic Dictionary

**ID:** `resource.arabic-oxford-dictionary` · **Type:** reference · **Provider:** Oxford University Press

[Oxford Essential Arabic Dictionary](https://www.oup.com.au/books/dictionaries/dictionaries/9780199561155)

**Use:** Compact Arabic–English/English–Arabic reference. Publisher describes vowelled MSA headwords in alphabetical rather than root order; useful before root-based lookup becomes comfortable. Inspect context rather than selecting the first gloss.

**Stage fit:** Beginner onward; everyday vocabulary lookup

**Access:** Optional paid reference or legitimate library copy; ISBN 9780199561155. No purchase required and no regional price recommendation.

**Verification:** Official publisher description retrieved on 10 October 2026; alphabetical ordering and vowelled MSA headwords confirmed.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



### LangMedia Arabic collection

**ID:** `resource.arabic-langmedia` · **Type:** practical resource · **Provider:** Five College Center for World Languages

[LangMedia Arabic collection](https://www.langmedia.fivecolleges.edu/languages/arabic)

**Use:** A university resource collection with grammar and dictation categories as well as dialect materials. Select and label the MSA items; do not assign the whole Arabic collection as a fuṣḥā-only course.

**Stage fit:** Selected grammar, dictation and other practice as appropriate

**Access:** Public collection landing page retrieved. Individual media, category filters and exercises need checking when selected.

**Verification:** Official Arabic collection page retrieved on 10 October 2026. A grammar-filter follow-up did not retrieve, so filtered page availability is not claimed.

**Replacement:** Keep the same outcome, register, difficulty and evidence conditions; replace the provider or use teacher-reviewed original material.

**Reuse:** Link to external material; check its specific licence before copying text, media or assessments into MyDay.



## 16. Files and validation

- `MyDay_Arabic_Fusha_Curriculum.json` — canonical static course.

- `MyDay_Arabic_Curriculum.schema.json` — structural schema.

- `MyDay_Arabic_Adaptive_Tutor_Spec.json` — separate model-independent policy and learner-state contract.

- `MyDay_Arabic_Assessment_Keys.json` — reference answers for 425 lesson questions and 42 starter-text questions.

- `MyDay_Arabic_Starter_Materials.json` — subset export using the same asset and lexicon IDs.

- `validate_arabic_curriculum.py` — standard-library package validator.

- `MyDay_Arabic_Validation_Report.json` — results, counts and hashes.

- `MyDay_Arabic_README.md` — import guidance and starting instructions.



Run `python3 validate_arabic_curriculum.py` from the extracted package directory. The validator checks structure, references and curriculum invariants. It does not replace Arabic-teacher review, external media checks or proficiency assessment.
