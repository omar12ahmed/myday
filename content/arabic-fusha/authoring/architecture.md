# MyDay Arabic Fuṣḥā curriculum

Version 1.1.2 · researched 10 October 2026, corrected 11 and 24 October 2026 · course ID `course.arabic-fusha`

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
