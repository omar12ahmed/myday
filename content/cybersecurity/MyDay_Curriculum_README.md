# MyDay Cybersecurity implementation package

Version 1.0.0 · 4 October 2026

Start with `MyDay_Cybersecurity_Curriculum.md`. Its architecture comes first, followed by the full module/lesson catalogue, projects, environments, verified resources and answer guide.

## Files

- `MyDay_Cybersecurity_Curriculum.md`: Output A, the complete human-readable curriculum.
- `MyDay_Cybersecurity_Curriculum.json`: Output B, canonical static content with stable IDs.
- `MyDay_Curriculum.schema.json`: JSON Schema 2020-12 structural contract for the static content.
- `MyDay_Adaptive_Tutor_Spec.json`: separate proposed mastery, review and scheduling policy; model-independent and not an implemented tutor.
- `validate_curriculum.py`: dependency-free validation for this schema and the curriculum graph. It implements the schema keywords used here, not the whole JSON Schema standard.
- `Validation_Report.json`: counts, checks, dependency order, hashes and validation limits.
- `starter-data/`: explicitly synthetic log fixtures, a task description and a separate tutor answer key.

The catalogue contains 27 modules, 116 topics, 146 lessons/skills, 292 exercises, 54 cumulative labs, 173 assessments, 22 projects, 41 verified resource entry points, 11 study paths and 11 environment profiles. Two lessons are optional extensions. The four optional CTF checkpoints are separate from those 11 study paths.

## Validate before importing

From the extracted package directory:

```bash
python3 validate_curriculum.py
```

Alternatively pass the directory containing the JSON files as the first argument. The validator returns exit status 0 for PASS and 1 for FAIL and writes `Validation_Report.json`. It checks required fields, types, references, ownership, order, prerequisite cycles, branch closure, rubric weights, time arithmetic and adaptive-policy separation. It does not deploy a lab, run an AI tutor, verify current account access or establish learning outcomes.

## Database mapping

This is a provider-neutral content package, not a migration for an unseen existing MyDay schema. Map it into staging before changing application content.

Use a versioned content namespace. A practical relational key is `(curriculum_version, entity_id)` for static records, while the stable entity ID retains its meaning across versions. A stable ID such as `skill.ip-addressing` is never repurposed for a different outcome.

Suggested content entities are courses, modules, topics, lessons, skills, exercises, labs, assessments, projects, resources, paths and environments. They correspond directly to the JSON’s entity arrays. Suggested relationships include lesson_skills, skill_prerequisites, module_lessons, lesson_resources, project_skills, project_modules and path_modules. A prerequisite edge stores the target skill, required skill and threshold. The `all` edges are conjunctive. `any` is reserved and empty in version 1.0.0; implementing alternatives needs a deliberate schema and validator revision.

Module lesson/topic/skill lists are convenient inverse navigation fields. A relational implementation can derive them from canonical ownership relationships rather than store a second independently editable copy. Likewise, a shared project has one record with several contributing modules. Insert entities and then relationship rows inside a transaction, or use deferred constraints where your chosen schema requires them. Validate before activating the new content version.

An implementation may initially store validated records as JSON documents or JSONB. That does not remove the need to check cross-record references, dependency cycles and per-user permissions. Use the supplied schema and graph validator as import gates.

## Keep learner state separate

Do not write learner-specific scores into the curriculum JSON. Keep per-user skill_state, attempt, evidence, review_event and daily_plan records as described in the separate tutor specification. Record the content version and rubric version used for every assessment. Retain genuine failed attempts, hint use and score corrections.

The tutor selects a lesson or exercise ID; the application fetches the authoritative record. A language model can explain or suggest a variant, but application code should enforce prerequisite thresholds, privacy, answer-key release and scope boundaries. Model output alone is not proof that a task was completed correctly.

Use explicit reason codes for daily choices, such as `review_due`, `prerequisite_gap`, `ready_next_lesson`, `project_checkpoint` or `user_choice`. A user can change their workload or focus without erasing their evidence. The scheduler should work with any model or a rules-only implementation.

## Assessment handling

Knowledge-check answer keys are included for self-study completeness. In the running app, keep unreleased answers out of the learner-visible payload and out of a pre-answer hint prompt. Serve them after submission or through a restricted assessment workflow. Keep the starter dataset’s `Tutor_Ground_Truth.json` separate for the same reason.

Assess the skill actually observed. One module score must not automatically populate every skill. A task transcript, code change, query result or other observable artefact supports practical evidence; a user or AI saying done does not. Mark unverified AI judgement provisional. Separate evidence segments prevent double counting one answer across understanding, recall, practical work and integration.

The policy’s weights, thresholds and freshness formula are explicit initial design choices, not validated psychometric measures. Preserve historical evidence and tune workload and review behaviour after 4–6 weeks. Do not infer intelligence, disability, motivation or employability from a low score.

## Scheduling details

Use each lesson’s prerequisites. A module’s external-skill list summarises requirements used throughout that module and is not a blanket entry lock. Required skill IDs exclude optional lessons. Shared project gates appear only at the final contributing module, which prevents a later project from blocking its own earlier foundation.

Each required route is prerequisite-closed. Optional recommended modules may have further dependencies: compute their transitive closure before adding them. For example, choosing a container/DevSecOps extension also requires the relevant cloud foundation. Selecting the optional binary exploit-reliability lesson adds C, assembly and binary-analysis requirements that do not otherwise block the advanced campaign.

Lesson time already includes the practical task, knowledge check and mini challenge. Labs and project time are additional synthesis, with shared projects counted once. Do not add project estimates again to the route totals. Optional CTFs, optional lessons and expanded variants require separate time unless they replace an activity with equivalent assessed outcomes.

Prefer one new skill per short session, a small amount of retrieval and a resumable checkpoint. Short work can be valuable without being a full lesson completion. Skipping requires a fresh diagnostic; repeated guided success does not establish independent mastery.

## Content and resource maintenance

The curriculum owns the skill and rubric. Resources are replaceable supports, all marked non-mandatory. Entry pages were checked on 4 October 2026; every downstream lesson, subscription entitlement, software version and price was not exhaustively tested. Recheck before installing tools, buying access or provisioning paid infrastructure. Use the same outcome and evidence standard when replacing a resource.

Review content quarterly. Use a new content version for corrections, and a new stable ID when an outcome’s meaning changes. Maintain an explicit replacement mapping and preserve earlier attempt evidence. Do not automatically copy mastery onto a substantively different replacement skill.

The optional starter datasets support parsing and basic investigations. They are not a realistic benchmark or substitute for native Windows administration, real memory-image parsing, SIEM deployment or a live cloud control test. The curriculum contains task and lab specifications, not every hosted lab instance or a complete textbook.

## First implementation milestone

Import and validate the static package in staging; display the core path and exact prerequisites; render the first five lessons; record one real task attempt with evidence and hint use; then calculate one skill’s score transparently. Add daily scheduling and spaced review only after that record-and-assess flow works. This avoids building adaptation on unverified completion data.
