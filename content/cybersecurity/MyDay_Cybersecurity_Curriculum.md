# MyDay Cybersecurity

## Output A — complete curriculum architecture and learning catalogue

Version 1.0.0 · Resource review: 4 October 2026 · Course ID: `course.cybersecurity`

This is a long-term curriculum specification for a beginner studying for 30–90 minutes on most days. It contains a shared foundation, role-focused branches, progressively harder practical work, and the separate design of an adaptive tutor. It specifies what to learn and how to demonstrate it. It does not require a particular AI model, a particular lab subscription, or completing every cybersecurity specialism.

The complete catalogue contains 27 modules, 116 topics, 146 lessons and skills, 292 exercises, 54 cumulative labs, 173 assessments, and 22 projects. Two lessons are explicitly optional extensions. The practical exercises, knowledge checks, transfer challenges and module assessments are different activities: their counts should not be added together as if each were a separate lesson.

### 1. Architecture and educational decisions

The learner-facing hierarchy is:

**Course → Module → Topic → Lesson → Exercise → Assessment → Project.**

A project may integrate several modules. Those modules refer to the same project record; they do not require the learner to rebuild it repeatedly. Topics group related lessons. Skills form a separate dependency graph, because two lessons can be related without one being a prerequisite for the other. In this first version, each lesson has one principal assessable skill; later versions can add reinforcement lessons without changing that skill’s identity.

The suggested sequence begins with scope, learning evidence and a usable lab; then computer concepts, networking, Linux, Windows, programming and automation. Security principles, applied cryptography and identity lead into web development, hardening, vulnerability assessment and defensive investigation. Career work consolidates evidence from the start. After the shared core, the learner chooses one main role-focused branch.

Several changes from a conventional topic list are deliberate:

- Permission, evidence handling, recovery and troubleshooting begin immediately. They are operational skills, not an ethics paragraph added at the end.
- Networking includes actual service roles, IPv6 awareness, addressing, DNS, time, transport, captures and diagnosis. Memorising port numbers or the OSI labels is not the objective.
- Python and basic data handling come before more complex automation. Bash and PowerShell reinforce familiar workflows. JavaScript and SQL receive enough attention to understand and test web applications. Advanced language features are introduced only when a later task needs them.
- Cryptography is applied: integrity, password storage, key management, TLS and identity flows. Advanced mathematics and implementing cryptographic primitives are optional later study.
- The learner builds and observes a small application before testing it. The same owned app can later support a separate vulnerable branch, repairs, regression tests and a delivery pipeline.
- Hardening, backup recovery, vulnerability remediation, logging and SOC reasoning are shared skills. Defensive work does not wait until after advanced offensive work.
- AD is an enterprise-identity branch, available after the core; it is not a prerequisite for every web-security lesson. Likewise, AD is not required to begin local Linux or Windows privilege-boundary work.
- C, memory, assembly and executable structure precede reverse engineering. Real malware execution is not necessary for the introductory outcomes.
- Cloud operating knowledge, identity, budgets and teardown precede security deployment work. Start with one provider.
- CTFs, revision, technical communication and portfolio work run throughout. A flag, badge or completion streak is not a substitute for demonstrating the underlying skill.

The design is informed by NIST NICE’s distinction between tasks, knowledge and skills, but this is an independently designed curriculum, not an accredited course or an exhaustive NICE mapping. Use the [NICE framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions) to refine role-specific task vocabulary.

### 2. Core path, branches and professional development

Modules 01–14 are the shared core. The numbered specialist catalogue after that is not one mandatory linear sequence. Follow the skill prerequisites for the selected branch.

The core exit evidence is a functioning lab notebook, network diagnosis, Linux investigation, Windows baseline, tested log utility, risk/identity review, local web app, scoped vulnerability assessment, integrated investigation and a portfolio pack. Shared components are reused. The core capstone requires explaining the evidence, testing an alternative explanation and verifying a control improvement.

Then select one focus:

- **SOC/security operations:** AD fundamentals plus SIEM/detection work. Add full incident response or forensics later. Evidence: a tested detection, correct error metrics, two triage tickets, an analyst playbook and an identity-hardening case.
- **Web penetration testing:** web security plus penetration-testing methodology. Evidence: scope, a justified test matrix, bounded findings, useful remediation, limitations and retesting. Add local privilege escalation and AD when expanding into internal testing.
- **Application security:** web security plus secure development. Evidence: an owned vulnerable app repaired at the root cause, selected versioned requirements, code review and regression tests. Development or QA experience can strengthen this route; completing security labs alone is not the same as software-engineering experience.
- **Cloud security/operations:** one provider’s operating model, IAM, networking, storage, auditing, recovery and teardown. Evidence must include live or hosted-sandbox control tests for deployment claims. Add containers and DevSecOps after those foundations.
- **Digital forensics/investigative support:** acquisition principles, provenance, filesystem/host/memory artefacts, corroboration and careful reporting. Add deeper incident response or reverse engineering when relevant.

Later extensions cover internal penetration testing, DevSecOps, reverse engineering, architecture and controlled offensive/defensive campaigns. Architecture and professional offensive work need substantial additional practice and, eventually, supervised or accountable real-world experience. An advanced lab project demonstrates specific capability; it does not certify broad professional competence.

Start exploring vacancies, apprenticeships, IT support, technical support, networking and cloud operations before finishing every branch. Apply when the actual role tasks match your demonstrated evidence. The curriculum’s readiness gates are learning decisions, not universal hiring standards or guarantees. No job-market statistics or local vacancy claims are assumed here.

### 3. Time, workload and avoiding duplication

The shared core is estimated at **215–303 hours**, or approximately **259–409 hours** with a 20–35% allowance for revision, troubleshooting and reattempts. The entry-focused routes total roughly **298–544 hours including that allowance**, depending on the branch. These are planning estimates, not measured learning-time predictions.

At five study days per week, 30–90 minutes per day gives about 2.5–7.5 hours weekly. At an average of five hours weekly, the core is roughly 12–19 months and a core-plus-entry-focus route is roughly 14–25 months. Prior knowledge and successful diagnostics can shorten this; access issues, repeated practice, breaks and deeper projects can lengthen it. The full catalogue is for continued development over years, not a prerequisite to applying for an initial role.

Lesson duration includes its explanation, practical task, two knowledge checks, challenge and reflection. Module lab time is additional cumulative practice. Project hours are incremental synthesis and presentation work, reusing earlier code and evidence where appropriate. Shared-project hours are allocated across contributing modules once. Optional CTFs, optional lessons and extended variants need their own time or must replace equivalent practice; they are not silently included in the base estimate.

A module’s practical requirement grows from short guided actions, to changed-input tasks, to independent investigation and integration. Early modules budget about 2.5–4 hours of cumulative labs; intermediate specialist modules about 5–8; advanced extensions about 7–10, alongside projects. This increases both the amount of practical work and the responsibility to justify it.

Do not complete several overlapping beginner provider paths in full. Choose a primary explanation or lab for a skill; use a second resource only when the first leaves a specific gap. Likewise, certification preparation is optional. Compare current official exam objectives with a chosen role and the learner’s actual gaps before spending money. This curriculum is not an exam cram course.

### 4. How to use the first month

Begin with a short baseline, then learning evidence, scope, a browser-based or simple disposable environment, reproducible notes, and basic troubleshooting. No complex VM installation is required to start. Move into computer and network fundamentals only as the prerequisite evidence permits.

Use these session shapes as defaults, not obligations:

- **15 minutes:** three minutes of retrieval, ten minutes on one task checkpoint, two minutes recording the next step. This is partial work, not automatic completion of a whole lesson.
- **30 minutes:** five minutes retrieval, twenty minutes focused practice, five minutes reflection and a resume note.
- **60 minutes:** ten minutes retrieval, forty minutes new learning or a lab, ten minutes checking and recording results.
- **90 minutes:** ten minutes retrieval, sixty-five minutes practical work, fifteen minutes assessment and reflection. Take short breaks within that allocation as needed.

For variable attention or energy, show one concrete next action, minimise setup changes, keep an explicit resume point, and accept written or spoken explanations where they measure the same skill. A long lab can be split across days. Missed days do not trigger a catch-up burden or a loss of completed-work history. The standard for demonstrated capability stays the same; the route and session size adapt.

### 5. Static curriculum versus adaptive tutor

**Static curriculum:** stable IDs, learning outcomes, prerequisite edges, lesson content specifications, task variants, environments, rubrics, projects and resource references. This is Output B, `MyDay_Cybersecurity_Curriculum.json`.

**Adaptive tutor:** selection of today’s task, workload, explanation style, review timing, scaffolding, reattempts and readiness evaluation from actual learner evidence. Proposed defaults are in the separate `MyDay_Adaptive_Tutor_Spec.json`. No learner scores, conversation history or daily plan belongs inside the static curriculum.

The dependency graph, not semantic similarity or a model’s intuition, determines readiness. Semantic search can help find explanations; it must not invent prerequisites, change rubric thresholds, or declare a skill passed. The tutor may propose content improvements, but curriculum changes need a versioned review.

Module prerequisite lists summarise external skills used somewhere in a module. Do not demand all of them before its first lesson: enforce each lesson’s actual `all` edges as it is scheduled. `any` is reserved for explicit alternatives and is empty in this release. Required prerequisite skills must meet their edge threshold with appropriate practical evidence. Module completion, completion of a video and mastery of a skill are separate states.

Projects shared across modules become final project gates at their last contributing module. Earlier modules can be completed through their own lessons, labs and assessment without a circular requirement to finish a later project. Optional lessons are excluded from required module exit gates. If an optional extension is selected, its prerequisites must then be satisfied.

### 6. Mastery from 0–100

The bands describe the **specific assessed skill and difficulty**, not a person’s overall intelligence or employability:

- **0–20 — not yet evidenced:** unassessed, fragmented recognition or substantial gaps. Zero often means no evidence, not inability.
- **21–40 — emerging understanding:** can explain parts with prompts; performance is inconsistent.
- **41–60 — guided competence:** can perform familiar tasks with support; independent recall or transfer remains weak.
- **61–80 — independent familiar-task competence:** usually explains and performs familiar work independently. Retention, consistency or unfamiliar cases still need evidence.
- **81–100 — durable transfer at this level:** independently succeeds across varied tasks, explains the reasoning and passes a delayed check. A score of 100 is not universal expertise or permanent immunity from forgetting.

Use four evidence dimensions: understanding 25%, recall 20%, practical performance 40%, and independent integrated assessment 15%. A lesson page being read earns no score. Time spent and badges are engagement signals only. Self-confidence can guide questions but cannot establish mastery.

Understanding means explaining why something works, contrasting it with a plausible wrong explanation and identifying limits. Recall means retrieving relevant knowledge without the answer visible. Practical evidence means an observable task result, including meaningful failures and negative tests. Integrated assessment means a separately scored held-out task involving decisions and transfer. One evidence segment must not earn credit in multiple dimensions; separately identify the explanation, recall, execution and synthesis segments if a session contains all four.

For each dimension, use the latest three eligible distinct-context attempts, weighted 0.5, 0.3 and 0.2 from newest to oldest; renormalise if fewer exist. Missing dimensions score zero. Keep meaningful unsuccessful attempts too. Replaying an identical answer is practice, not a new independent context. Assisted practical work can contribute at most 60 to that dimension; later independent evidence can replace it. AI grading without observable support remains provisional.

The historical evidence score is the weighted total. A separate current readiness estimate accounts for time:

`freshness = 2 ^ (−d / H)`

`readiness = historical_score × (0.70 + 0.30 × freshness)`

Here, `d` is the older of the latest independent recall and practical-evidence ages. If either is missing, freshness is zero. The default half-life `H` is 14 days before a delayed pass, 30 after one, and 60 after two or more distinct delayed passes. Round for display only. This is a transparent scheduling heuristic, not a validated biological forgetting model; preserve historical evidence and calibrate the defaults after 4–6 weeks of use.

For example, understanding 80, recall 80, practical 90 and integrated assessment 80 gives historical evidence of 84. With fresh independent evidence, readiness is 84. Thirty days later with `H = 30`, it is 71.4. That calls for a targeted recheck; it does not erase the project, declare the learner incapable or require repeating every prior lesson.

Apply non-compensatory rules:

- No practical evidence: score capped at 40. No independent practical pass: capped at 60.
- No fresh transfer task or no delayed independent recall at least seven days after learning: capped at 80.
- Durable mastery requires at least 81 readiness, each dimension at least 70, practical at least 80, two independent contexts, a new transfer task and a delayed check.
- Ordinary prerequisites default to 70; advanced prerequisites to 75. Practical evidence must be at least 70, and understanding and recall at least 60. Respect the static edge threshold.
- An unresolved critical scope or evidence-integrity failure blocks progression regardless of numerical average. A safety check cannot be compensated for by good quiz answers.

Mark a lesson complete only when its stated criteria are met. Completion permits consolidation; it does not automatically set mastery to 100. For a skip request, use an explanation, independent recall and a fresh practical diagnostic; assess the exact skills, then bypass only what the evidence supports. Do not force repetition of a known skill merely to obtain a completion badge.

Start review suggestions at approximately 1, 3, 7, 14, 30 and 60 days, adapting to independent performance and prerequisite relevance. Following a failure, explain the misconception, offer a smaller task and retry retrieval in 1–3 days. Normally allocate no more than a quarter of weekly time to review; distribute a backlog instead of overwhelming the learner. Before a difficult lesson, a short prerequisite check can refresh stale evidence without repeating the whole module.

### 7. Assessment and project rubrics

Each lesson has two knowledge questions with answer guidance in the appendix, a practical task and a changed-condition challenge. Open questions need substantively correct reasoning; exact wording is not required. Correcting a misconception is part of learning. The task and challenge must generate evidence, not merely a statement that they were completed.

Practical exercises score task outcome 40%, explanation/verification 30%, evidence/limits 20% and scope/restoration 10%. Module transfer assessments score outcome 30%, reasoning/alternatives 25%, reproducible evidence 25%, scope/restoration 10% and communication 10%. Projects have four project-specific criteria at 25% each. An applicable critical check must pass independently of the weighted score.

For each criterion, use these anchors: 0 = missing or incorrect; 25 = substantial errors and extensive help; 50 = partially correct with significant gaps; 75 = correct, reproducible and adequately explained with minor limits; 100 = independent, robust under a fresh variant and candid about edge cases. The weighted total is the sum of each criterion score multiplied by its percentage weight. A module usually needs 70, advanced modules 75; projects need 75. Record assistance separately rather than quietly treating a walkthrough result as independent performance.

Example: project criterion scores of 80, 75, 90 and 75 yield 80 overall. If the evidence is fabricated or the test exceeded scope, that project still does not pass. If a criterion cannot be observed in an offline substitute, leave that evidence unverified rather than award assumed deployment competence.

Module assessments must produce per-skill observations. Do not assign the module’s overall score to every skill automatically. Human review can correct a grading error; retain the original attempt and the reason for the correction.

### 8. Environments and testing your own systems

On a MacBook Air, begin with browser labs, local files and one lightweight guest where compatible. Check the actual CPU architecture, memory, available storage and image requirements; do not assume an x86 Windows Server lab will run conveniently on every Mac. macOS terminal familiarity is useful, but Linux services and administration still need a Linux environment. Use hosted Windows/AD, SIEM, Kubernetes or reverse-engineering labs when local compatibility or capacity is a barrier. Avoid buying hardware or stacking subscriptions until a selected task requires it.

The 11 environment profiles later in this document distinguish actual hands-on alternatives from analysis-only substitutes. Exported Windows events can demonstrate log analysis; they cannot alone prove you administered Windows. A policy file can demonstrate cloud reasoning; a live or hosted control test is needed for deployment claims.

“Dummy” does not mean “authorised.” A publicly reachable fake site, honeypot or test-looking IP still requires permission. You may simulate an unauthorised intruder inside a lab you own or an explicitly assigned range. The curriculum supports that model; it does not direct testing of genuinely unauthorised targets.

When ready, use this progression for your own systems:

1. Complete scope, networking, host administration, recovery and vulnerability-assessment gates. For a web app, also complete HTTP, sessions, API access controls and the relevant web-security lessons.
2. List the exact assets you control, allowed actions, test accounts, maintenance window, traffic limits and stop conditions. Owning an account or domain does not automatically authorise tests against its provider, other tenants or integrations. Check the relevant provider’s current testing conditions.
3. Start with a disposable local copy containing dummy data. Remove production tokens, mail delivery, payment integrations and connections to real user databases. Verify a restore before testing.
4. Inspect configuration, patch state, local listeners, permissions and logs first. Establish expected behaviour and record a baseline.
5. If permitted, use restrained discovery against the exact allowlisted host and ports. Investigate claims against configuration and official advisories before attempting any proof.
6. Test normal and forbidden actions with dummy identities: for example, user A should read A’s note and should not read B’s. Use minimal evidence. Avoid denial-of-service, destructive changes, mass password guessing, broad scanning or unnecessary credential collection.
7. Stop on unexpected impact, ambiguous ownership or out-of-scope reachability. Restore the lab, record findings, repair the cause, verify normal functionality and repeat the failed-security test.
8. Only after a successful isolated rehearsal consider similarly bounded testing of a real owned service, with explicit recovery and impact controls. More invasive testing remains a separate deliberate decision, not an automatic next action by the tutor.

A harmless first example after the relevant fundamentals is a local static service. In a new practice folder, create `practice-public/index.html` containing only dummy text. With Python already installed and understood, run:

```bash
python3 -m http.server 8080 --bind 127.0.0.1 --directory ./practice-public
```

In a second terminal, inspect your own local service:

```bash
curl -I http://127.0.0.1:8080/
```

After service-discovery training, and only if Nmap is installed, a tightly bounded optional check is:

```bash
nmap -sT -sV --version-light -p 8080 127.0.0.1
```

Explain the listener, response headers and service-identification uncertainty. Stop the server with Ctrl+C in its terminal and verify it is no longer listening. These are instructions for a dummy loopback service, not a command template to substitute arbitrary internet targets into. For intentionally vulnerable applications, use the official project’s current setup instructions, explicitly restricted binding and a private disposable environment.

### 9. Resources, reliability and maintenance

All external references are optional supports. The learning outcome, task, evidence and rubric remain in MyDay. If a resource disappears, replace it with an official explanation or equivalent authorised lab without changing the skill’s meaning. The curriculum includes lab specifications; it does not include hosted accounts, every lab image or a complete textbook chapter for each lesson.

The catalogue distinguishes official documentation, structured courses, practical labs, reference material and optional enrichment. Free documentation and owned local work cover much of the core. Provider accounts, premium modules, compute and licences may cost money; check current availability before choosing them. No fixed price, subscription entitlement or exam version is assumed.

The source review corrected several common stale recommendations:

- TryHackMe’s official support material says its older Complete Beginner, Introduction to Cyber Security and Cyber Defense paths were retired. This design references current Pre Security/Cyber Security 101 entry points instead of relying on retired roadmaps. [Official change notice](https://help.tryhackme.com/en/articles/10632551-big-changes-on-tryhackme-retired-three-learning-paths).
- OWASP’s project pages identify released WSTG v4.2 while v5.0 is in development, and identify ASVS 5.0.0. Record versions when citing individual tests or requirements. [WSTG](https://owasp.org/projects/web-security-testing-guide) · [ASVS](https://owasp.org/projects/asvs).
- The Python Tutorial explicitly assumes general programming knowledge. It is a reference after introductory examples here, not the beginner’s only first lesson. [Python Tutorial](https://docs.python.org/3/tutorial/).
- The former picoCTF entry page directs learners to CyLab Security Academy. Use the current official entry point and verify challenge rules. [picoCTF notice](https://picoctf.org/) · [CyLab Security Academy](https://cylabacademy.org/).
- AWS documentation explains that budget notifications can lag resource use. Budget alerts are not treated as a universal spending cap. [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).

Review curriculum content at least quarterly, and recheck environment-dependent or paid resources before use. Preserve stable IDs when meaning is unchanged; version substantive outcome changes and record replacement mappings. Do not delete learner evidence just because an external course or tool changes.

### 10. Quality-control conclusions

The dependency graph has been checked for missing references, cycles and forward prerequisites. Each required branch includes the skills needed for its lessons and projects. Shared-project gates are placed at the final contributing module. Module, lesson and project fields match the requested specification; practical tasks, questions and transfer challenges are explicit.

Foundational additions include technical reading and troubleshooting, paths and encodings, recovery, SQL and structured data, Git hygiene, modern identity, enterprise service roles and time, cloud responsibility/cost, evidence provenance and technical communication. Advanced topics have named foundations. The repeated use of identity, networking, code and logs is deliberate application in new contexts rather than a second introductory course.

Optional topics include the AI-application lesson, binary exploit-reliability lesson, extra CTFs, multi-cloud comparison, deeper cryptographic mathematics, advanced exploit development, mobile, wireless offensive testing, OT/ICS, hardware and specialist regulated-sector work. Those last domains are future branches, not silently implied coverage in this release.

Static validation is not the same as executing every lab or proving learning outcomes. The resource check confirms the listed official/project entry pages; it does not certify every downstream exercise, installation, account entitlement or price. The package’s validation report states exactly what was checked. Review real learning data after 4–6 weeks to revise time budgets, prerequisite granularity and the proposed adaptive defaults.

## 11. Course map and study routes

The following map and all detailed records are generated from the same static JSON used for Output B.

### Shared core

- **01. Learning method, scope and lab setup** — `module.learning-lab`; 5 lessons; approximately 9.6–13.2 hours, including its allocated project work.

- **02. Computer and operating-system fundamentals** — `module.computer-os`; 5 lessons; approximately 9.6–13.2 hours, including its allocated project work.

- **03. Networking and traffic fundamentals** — `module.networking`; 7 lessons; approximately 15.1–21.2 hours, including its allocated project work.

- **04. Linux administration and investigation** — `module.linux`; 5 lessons; approximately 13.6–19.8 hours, including its allocated project work.

- **05. Windows administration and evidence** — `module.windows`; 5 lessons; approximately 11.6–16.8 hours, including its allocated project work.

- **06. Programming, data and Python for security** — `module.programming`; 6 lessons; approximately 13.3–18.5 hours, including its allocated project work.

- **07. Shell automation, Git and reproducible work** — `module.automation-git`; 5 lessons; approximately 14.8–20.5 hours, including its allocated project work.

- **08. Security principles, risk and identity** — `module.security-foundations`; 5 lessons; approximately 13.8–18.5 hours, including its allocated project work.

- **09. Applied cryptography and modern identity** — `module.cryptography-identity`; 5 lessons; approximately 13.8–18.5 hours, including its allocated project work.

- **10. Web, JavaScript, HTTP and APIs** — `module.web-technologies`; 6 lessons; approximately 22.8–33.5 hours, including its allocated project work.

- **11. Hardening, resilience and system design** — `module.secure-systems`; 5 lessons; approximately 13.8–19.5 hours, including its allocated project work.

- **12. Vulnerability assessment and remediation** — `module.vulnerability-assessment`; 5 lessons; approximately 19.8–28.5 hours, including its allocated project work.

- **13. Defensive security, logs and SOC foundations** — `module.defensive-foundations`; 5 lessons; approximately 25.8–36.5 hours, including its allocated project work.

- **14. Professional practice, portfolio and job preparation** — `module.career-portfolio`; 5 lessons; approximately 17.8–24.5 hours, including its allocated project work.


### Specialist catalogue

- **15. Web application and API security testing** — `module.web-security`; 6 lessons; approximately 26.3–36.5 hours. Optional lessons are additional.

- **16. Penetration testing methodology and reporting** — `module.penetration-testing`; 5 lessons; approximately 25.1–35.2 hours. Optional lessons are additional.

- **17. Active Directory and enterprise identity** — `module.active-directory`; 5 lessons; approximately 31.1–45.2 hours. Optional lessons are additional.

- **18. Local privilege boundaries and escalation labs** — `module.privilege-escalation`; 5 lessons; approximately 29.1–41.2 hours. Optional lessons are additional.

- **19. SIEM, detection engineering and analyst practice** — `module.detection-siem`; 6 lessons; approximately 38.3–54.5 hours. Optional lessons are additional.

- **20. Incident response and threat hunting** — `module.incident-response`; 5 lessons; approximately 31.1–45.2 hours. Optional lessons are additional.

- **21. Digital forensics and evidence analysis** — `module.digital-forensics`; 5 lessons; approximately 33.1–47.2 hours. Optional lessons are additional.

- **22. Malware concepts and introductory reverse engineering** — `module.malware-reversing`; 6 lessons; approximately 37.8–54.0 hours. Optional lessons are additional.

- **23. Cloud foundations and practical security** — `module.cloud-security`; 7 lessons; approximately 39.6–55.8 hours. Optional lessons are additional.

- **24. Containers, delivery pipelines and DevSecOps** — `module.containers-devsecops`; 6 lessons; approximately 38.3–54.5 hours. Optional lessons are additional.

- **25. Secure development and application security engineering** — `module.application-security`; 5 lessons; approximately 31.8–46.0 hours. Optional lessons are additional.

- **26. Security architecture, assurance and tradeoffs** — `module.security-architecture`; 5 lessons; approximately 40.3–56.5 hours. Optional lessons are additional.

- **27. Advanced offensive analysis and controlled adversary simulation** — `module.advanced-offensive`; 6 lessons; approximately 46.3–65.5 hours. Optional lessons are additional.


### Route totals and capstones


**Shared foundation** — `path.core`

Core plus: the shared foundation only.

Estimated total: 215–303 hours; 259–409 with the revision/troubleshooting allowance.

Focus capstone(s): Core capstone: investigate and improve a small service (`project.core-investigation`); A role-focused portfolio and application pack (`project.portfolio-pack`). A common base for role selection; not a promise of employment.


**SOC and security operations** — `path.soc`

Core plus: Active Directory and enterprise identity (`module.active-directory`); SIEM, detection engineering and analyst practice (`module.detection-siem`).

Estimated total: 284–403 hours; 342–544 with the revision/troubleshooting allowance.

Focus capstone(s): SOC detection and triage project (`project.soc-detection`); AD lab and identity hardening (`project.ad-lab`). Target junior analyst or operations tasks; practise triage, Windows identity and clear handoffs.

Later options: Incident response and threat hunting (`module.incident-response`); Digital forensics and evidence analysis (`module.digital-forensics`). Add their own prerequisites when selected.


**Web penetration testing** — `path.offensive-web`

Core plus: Web application and API security testing (`module.web-security`); Penetration testing methodology and reporting (`module.penetration-testing`).

Estimated total: 266–375 hours; 320–506 with the revision/troubleshooting allowance.

Focus capstone(s): Web penetration test and repair (`project.web-pentest`). An initial offensive route; broader internal testing requires additional host and identity experience.

Later options: Local privilege boundaries and escalation labs (`module.privilege-escalation`); Active Directory and enterprise identity (`module.active-directory`); Advanced offensive analysis and controlled adversary simulation (`module.advanced-offensive`). Add their own prerequisites when selected.


**Application security** — `path.appsec`

Core plus: Web application and API security testing (`module.web-security`); Secure development and application security engineering (`module.application-security`).

Estimated total: 261–367 hours; 314–496 with the revision/troubleshooting allowance.

Focus capstone(s): Build, break and repair an owned toy app (`project.vulnerable-app-repair`). Develop secure-code review and verification evidence; many roles also expect substantial software experience.

Later options: Containers, delivery pipelines and DevSecOps (`module.containers-devsecops`). Add their own prerequisites when selected.


**Cloud security and operations** — `path.cloud`

Core plus: Cloud foundations and practical security (`module.cloud-security`).

Estimated total: 255–359 hours; 306–485 with the revision/troubleshooting allowance.

Focus capstone(s): Secure a small cloud workload (`project.cloud-review`). Choose one provider; cloud support or operations can be a useful first step toward security ownership.

Later options: Containers, delivery pipelines and DevSecOps (`module.containers-devsecops`); SIEM, detection engineering and analyst practice (`module.detection-siem`). Add their own prerequisites when selected.


**Digital forensics and investigative support** — `path.dfir`

Core plus: Digital forensics and evidence analysis (`module.digital-forensics`).

Estimated total: 248–350 hours; 298–473 with the revision/troubleshooting allowance.

Focus capstone(s): A small forensic case file (`project.forensic-case`). Focus on careful evidence and bounded conclusions; professional casework also requires organisational procedures.

Later options: Incident response and threat hunting (`module.incident-response`); Malware concepts and introductory reverse engineering (`module.malware-reversing`). Add their own prerequisites when selected.


**Internal penetration testing** — `path.internal-pentest`

Core plus: Web application and API security testing (`module.web-security`); Penetration testing methodology and reporting (`module.penetration-testing`); Active Directory and enterprise identity (`module.active-directory`); Local privilege boundaries and escalation labs (`module.privilege-escalation`).

Estimated total: 326–461 hours; 392–623 with the revision/troubleshooting allowance.

Focus capstone(s): Web penetration test and repair (`project.web-pentest`); AD lab and identity hardening (`project.ad-lab`); Linux and Windows privilege-boundary review (`project.privilege-lab`). Extend a sound test method to hosts and enterprise identity.

Later options: Advanced offensive analysis and controlled adversary simulation (`module.advanced-offensive`). Add their own prerequisites when selected.


**DevSecOps and platform security** — `path.devsecops`

Core plus: Cloud foundations and practical security (`module.cloud-security`); Containers, delivery pipelines and DevSecOps (`module.containers-devsecops`).

Estimated total: 293–413 hours; 352–558 with the revision/troubleshooting allowance.

Focus capstone(s): Secure a small cloud workload (`project.cloud-review`); A secure container delivery pipeline (`project.secure-pipeline`). Build on cloud operations and development; avoid treating it as a zero-experience shortcut.

Later options: Web application and API security testing (`module.web-security`); Secure development and application security engineering (`module.application-security`). Add their own prerequisites when selected.


**Malware analysis and reverse-engineering foundations** — `path.malware`

Core plus: Digital forensics and evidence analysis (`module.digital-forensics`); Malware concepts and introductory reverse engineering (`module.malware-reversing`).

Estimated total: 286–404 hours; 344–546 with the revision/troubleshooting allowance.

Focus capstone(s): A small forensic case file (`project.forensic-case`); Benign binary behaviour analysis (`project.binary-case`). An introductory low-level branch; professional reverse engineering needs much more practice.

Later options: SIEM, detection engineering and analyst practice (`module.detection-siem`). Add their own prerequisites when selected.


**Security architecture and assurance** — `path.architecture`

Core plus: Web application and API security testing (`module.web-security`); Secure development and application security engineering (`module.application-security`); Cloud foundations and practical security (`module.cloud-security`); SIEM, detection engineering and analyst practice (`module.detection-siem`); Incident response and threat hunting (`module.incident-response`); Security architecture, assurance and tradeoffs (`module.security-architecture`).

Estimated total: 410–579 hours; 493–783 with the revision/troubleshooting allowance.

Focus capstone(s): Security architecture review (`project.architecture-review`). A later synthesis route, with production experience and peer review still essential.


**Advanced offensive and purple-team work** — `path.advanced-offensive`

Core plus: Web application and API security testing (`module.web-security`); Penetration testing methodology and reporting (`module.penetration-testing`); Active Directory and enterprise identity (`module.active-directory`); Local privilege boundaries and escalation labs (`module.privilege-escalation`); SIEM, detection engineering and analyst practice (`module.detection-siem`); Advanced offensive analysis and controlled adversary simulation (`module.advanced-offensive`).

Estimated total: 411–581 hours; 494–785 with the revision/troubleshooting allowance.

Focus capstone(s): Controlled offensive and defensive capstone (`project.purple-campaign`). Complex lab work after demonstrated foundations; optional binary work has its own extra prerequisites.

Later options: Digital forensics and evidence analysis (`module.digital-forensics`); Malware concepts and introductory reverse engineering (`module.malware-reversing`). Add their own prerequisites when selected.


## 12. Complete module, topic and lesson catalogue

Every module below includes purpose, prerequisites, difficulty, time, objectives, topics, exercises, labs, projects, assessment, common mistakes, progression understanding and completion capability. Each lesson includes all requested fields. Resource IDs resolve to the verified catalogue in section 15; the answer guide is in section 16.


### 01. Learning method, scope and lab setup

**Module ID:** `module.learning-lab`  
**Path:** core  
**Difficulty:** Beginner

**Purpose:** Establish a safe, repeatable learning workflow before using security tools.

**Prerequisites and recommended preparation:** None. Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 9.6–13.2 hours, excluding the extra revision reserve. Required lessons 3.8 h; cumulative labs 2.5–4.0 h; module assessment/delayed check 1.3–2.0 h; allocated project work 2.0–3.5 h.

**Learning objectives:**



- Explain what counts as skill evidence

- Distinguish authorised from merely accessible targets

- Choose a hardware-compatible lab

- Separate fact from inference

- Form a testable troubleshooting hypothesis

**Topics:** Learning evidence; Scope; Lab setup; Study method.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [TryHackMe Pre Security](https://tryhackme.com/path/outline/presecurity) — structured course; [NIST NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions) — reference.


#### Topic: Learning evidence — `topic.learning-lab-learning-evidence`


##### Learning through evidence

**Lesson ID:** `lesson.learning-evidence`  
**Module:** `module.learning-lab`  
**Skill:** `skill.learning-evidence`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** None; begin here or use a diagnostic.

**Learning objectives:** Explain what counts as skill evidence; Record an honest baseline.

**Key concepts:** retrieval, practice, feedback, confidence.

**Practical task — `exercise.learning-evidence`:** Try explaining how a browser opens a website, then mark gaps and create a learning log.

**Evidence to save:** Baseline note with one demonstrated ability and three questions.

**Knowledge check — `assessment.learning-evidence-check`:**

1. Does reading a page prove you can perform the task?

2. Why record uncertainty?

**Mini challenge — `exercise.learning-evidence-challenge`:** Explain a familiar task using an example and a counterexample.

**Suggested resource types:** worked example, structured course, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Baseline note with one demonstrated ability and three questions submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Scope — `topic.learning-lab-scope`


##### Permission, boundaries and stop conditions

**Lesson ID:** `lesson.authorised-scope`  
**Module:** `module.learning-lab`  
**Skill:** `skill.authorised-scope`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Learning through evidence (`skill.learning-evidence`) ≥70

**Learning objectives:** Distinguish authorised from merely accessible targets; Write an explicit scope.

**Key concepts:** ownership, permission, third parties, stop conditions.

**Practical task — `exercise.authorised-scope`:** Write a scope for a disposable single-host lab with allowed tests, excluded actions and a stop contact.

**Evidence to save:** One-page scope with exact assets and allowed actions.

**Knowledge check — `assessment.authorised-scope-check`:**

1. Is a publicly reachable dummy site automatically authorised?

2. Does owning an account mean owning its provider infrastructure?

**Mini challenge — `exercise.authorised-scope-challenge`:** Reject two out-of-scope actions from your own plan and explain why.

**Suggested resource types:** worked example, structured course, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- One-page scope with exact assets and allowed actions submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Lab setup — `topic.learning-lab-lab-setup`


##### Choose and isolate a learning environment

**Lesson ID:** `lesson.lab-isolation`  
**Module:** `module.learning-lab`  
**Skill:** `skill.lab-isolation`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Permission, boundaries and stop conditions (`skill.authorised-scope`) ≥70

**Learning objectives:** Choose a hardware-compatible lab; Explain network isolation and recovery.

**Key concepts:** host, guest, CPU architecture, network exposure, snapshot.

**Practical task — `exercise.lab-isolation`:** Inspect host architecture and available memory; choose browser lab or a disposable guest and document its network boundary.

**Evidence to save:** Lab inventory, compatibility check and recovery plan.

**Knowledge check — `assessment.lab-isolation-check`:**

1. Is NAT alone a complete isolation guarantee?

2. Is a VM snapshot a substitute for independent backup?

**Mini challenge — `exercise.lab-isolation-challenge`:** Explain how you would practise Windows or AD if your Mac cannot run the supplied image.

**Suggested resource types:** worked example, structured course, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Lab inventory, compatibility check and recovery plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Study method — `topic.learning-lab-study-method`


##### Evidence, privacy and reproducible notes

**Lesson ID:** `lesson.technical-notes`  
**Module:** `module.learning-lab`  
**Skill:** `skill.technical-notes`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Permission, boundaries and stop conditions (`skill.authorised-scope`) ≥70

**Learning objectives:** Separate fact from inference; Write reproducible redacted notes.

**Key concepts:** timestamps, source, redaction, reproduction.

**Practical task — `exercise.technical-notes`:** Record the harmless file exercise with steps, expected result, actual result and a privacy check.

**Evidence to save:** Redacted lab-note template and one completed example.

**Knowledge check — `assessment.technical-notes-check`:**

1. Why retain the original observation separately from your conclusion?

2. What should be excluded from a public write-up?

**Mini challenge — `exercise.technical-notes-challenge`:** Rewrite an ambiguous observation so another learner can reproduce it.

**Suggested resource types:** worked example, structured course, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Redacted lab-note template and one completed example submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Read errors and ask useful questions

**Lesson ID:** `lesson.help-and-debugging`  
**Module:** `module.learning-lab`  
**Skill:** `skill.help-and-debugging`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Evidence, privacy and reproducible notes (`skill.technical-notes`) ≥70

**Learning objectives:** Form a testable troubleshooting hypothesis; Request targeted help.

**Key concepts:** symptom, hypothesis, minimal example, documentation.

**Practical task — `exercise.help-and-debugging`:** Cause a harmless missing-file error; record what changed and test one explanation at a time.

**Evidence to save:** Troubleshooting log with a confirmed cause.

**Knowledge check — `assessment.help-and-debugging-check`:**

1. Why change one variable at a time?

2. What belongs in a useful help request?

**Mini challenge — `exercise.help-and-debugging-challenge`:** Solve a second missing-file case with different path spelling.

**Suggested resource types:** worked example, structured course, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Troubleshooting log with a confirmed cause submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Learning method, scope and lab setup — guided** — `lab.learning-lab-guided`; 60–90 minutes, resumable.

Scenario: Prepare a personal learning workspace with dummy data; show the scope, recovery point and redacted notebook.

Inputs: A blank notebook, a harmless text file and a browser-based training environment or disposable VM. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Write a one-host scope and stop conditions

- Create and restore a harmless file

- Record an observation, inference and uncertainty separately

- Repeat the setup without the walkthrough

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Learning method, scope and lab setup — transfer** — `lab.learning-lab-transfer`; 90–150 minutes, resumable.

Scenario: Prepare a personal learning workspace with dummy data; show the scope, recovery point and redacted notebook.

Inputs: A blank notebook, a harmless text file and a browser-based training environment or disposable VM. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Write a one-host scope and stop conditions

- Create and restore a harmless file

- Record an observation, inference and uncertainty separately

- Repeat the setup without the walkthrough

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.learning-lab-transfer`. Prepare a personal learning workspace with dummy data; show the scope, recovery point and redacted notebook. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Treating reading as evidence of skill

- Running copied commands without understanding

- Keeping sensitive data in public notes

**Understand before progressing:** Explain scope, evidence quality and the difference between a learning attempt and independent performance.

**Able to do after completion:** Create a study log, select a suitable lab and stop or restore an exercise safely.

**Project contributions:** A repeatable personal lab (`project.lab-notebook`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** No new shared-project gate yet; save this module’s contribution for its final contributing module.


### 02. Computer and operating-system fundamentals

**Module ID:** `module.computer-os`  
**Path:** core  
**Difficulty:** Beginner

**Purpose:** Build the mental model needed to reason about commands, programs and failures.

**Prerequisites and recommended preparation:** Learning method, scope and lab setup (`module.learning-lab`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 9.6–13.2 hours, excluding the extra revision reserve. Required lessons 3.8 h; cumulative labs 2.5–4.0 h; module assessment/delayed check 1.3–2.0 h; allocated project work 2.0–3.5 h.

**Learning objectives:**



- Explain how programs use resources

- Convert small binary and hexadecimal values

- Navigate a directory tree

- Relate a program to its running process

- Evaluate a software source

**Topics:** Computer model; Data model; OS model.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [TryHackMe Pre Security](https://tryhackme.com/path/outline/presecurity) — structured course.


#### Topic: Computer model — `topic.computer-os-computer-model`


##### CPU, memory, storage and peripherals

**Lesson ID:** `lesson.hardware-resources`  
**Module:** `module.computer-os`  
**Skill:** `skill.hardware-resources`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Choose and isolate a learning environment (`skill.lab-isolation`) ≥70

**Learning objectives:** Explain how programs use resources; Read a basic system inventory.

**Key concepts:** CPU, RAM, storage, I/O, architecture.

**Practical task — `exercise.hardware-resources`:** Record your computer or lab host CPU architecture, RAM, free storage and operating system without publishing identifiers.

**Evidence to save:** Redacted machine inventory and choice rationale.

**Knowledge check — `assessment.hardware-resources-check`:**

1. Why does more storage not necessarily fix a memory shortage?

2. Why does CPU architecture matter for lab images?

**Mini challenge — `exercise.hardware-resources-challenge`:** Choose between a browser lab and a local VM from two hypothetical resource budgets.

**Suggested resource types:** worked example, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Redacted machine inventory and choice rationale submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Data model — `topic.computer-os-data-model`


##### Bits, bytes, text and encodings

**Lesson ID:** `lesson.data-representation`  
**Module:** `module.computer-os`  
**Skill:** `skill.data-representation`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** CPU, memory, storage and peripherals (`skill.hardware-resources`) ≥70

**Learning objectives:** Convert small binary and hexadecimal values; Distinguish encoding from encryption.

**Key concepts:** bits, bytes, hexadecimal, UTF-8, base64.

**Practical task — `exercise.data-representation`:** Represent a short dummy string in UTF-8 bytes, hexadecimal and base64 using a local utility.

**Evidence to save:** Encoding worksheet with round-trip results.

**Knowledge check — `assessment.data-representation-check`:**

1. Does base64 hide a secret securely?

2. How many bits are in a byte?

**Mini challenge — `exercise.data-representation-challenge`:** Explain why a visible character may occupy more than one byte.

**Suggested resource types:** worked example, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Encoding worksheet with round-trip results submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: OS model — `topic.computer-os-os-model`


##### Files, paths and filesystem behaviour

**Lesson ID:** `lesson.files-paths`  
**Module:** `module.computer-os`  
**Skill:** `skill.files-paths`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Bits, bytes, text and encodings (`skill.data-representation`) ≥70

**Learning objectives:** Navigate a directory tree; Distinguish file content from naming.

**Key concepts:** absolute path, relative path, extension, metadata, archive.

**Practical task — `exercise.files-paths`:** Create a nested practice folder; locate the same file using relative and absolute paths and inspect its metadata.

**Evidence to save:** Directory map and successful path examples.

**Knowledge check — `assessment.files-paths-check`:**

1. What determines the meaning of a relative path?

2. Does renaming a text file to .exe make it executable machine code?

**Mini challenge — `exercise.files-paths-challenge`:** Find a file after moving the containing folder and explain the broken reference.

**Suggested resource types:** worked example, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Directory map and successful path examples submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Processes, services, users and privileges

**Lesson ID:** `lesson.processes-users`  
**Module:** `module.computer-os`  
**Skill:** `skill.processes-users`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Files, paths and filesystem behaviour (`skill.files-paths`) ≥70

**Learning objectives:** Relate a program to its running process; Explain user privilege boundaries.

**Key concepts:** process, service, kernel, user, permission.

**Practical task — `exercise.processes-users`:** Observe a harmless application in a process viewer; identify its user and compare normal versus administrative actions.

**Evidence to save:** Process and permission observation note.

**Knowledge check — `assessment.processes-users-check`:**

1. Is a program file the same thing as a process?

2. Why avoid administrative privileges for routine tasks?

**Mini challenge — `exercise.processes-users-challenge`:** Explain why one account can read a file while another cannot.

**Suggested resource types:** worked example, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Process and permission observation note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Software installation, updates and recovery

**Lesson ID:** `lesson.software-recovery`  
**Module:** `module.computer-os`  
**Skill:** `skill.software-recovery`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Processes, services, users and privileges (`skill.processes-users`) ≥70

**Learning objectives:** Evaluate a software source; Demonstrate a small recovery procedure.

**Key concepts:** package, dependency, version, update, backup.

**Practical task — `exercise.software-recovery`:** Inspect an official installation guide; back up a dummy folder, change a file and restore it without replacing unrelated files.

**Evidence to save:** Installation checklist and verified restore record.

**Knowledge check — `assessment.software-recovery-check`:**

1. Why record software versions in a lab?

2. What demonstrates that a backup is useful?

**Mini challenge — `exercise.software-recovery-challenge`:** Diagnose an installation instruction written for the wrong operating system.

**Suggested resource types:** worked example, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Installation checklist and verified restore record submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Computer and operating-system fundamentals — guided** — `lab.computer-os-guided`; 60–90 minutes, resumable.

Scenario: Diagnose a toy workstation with a wrong path, a full working folder and an unnecessary background process.

Inputs: A disposable workspace with three text files, one background application and a synthetic disk-usage listing. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Inventory hardware and OS

- Classify file and process observations

- Reproduce one harmless fault

- Apply the smallest fix and document rollback

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Computer and operating-system fundamentals — transfer** — `lab.computer-os-transfer`; 90–150 minutes, resumable.

Scenario: Diagnose a toy workstation with a wrong path, a full working folder and an unnecessary background process.

Inputs: A disposable workspace with three text files, one background application and a synthetic disk-usage listing. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Inventory hardware and OS

- Classify file and process observations

- Reproduce one harmless fault

- Apply the smallest fix and document rollback

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.computer-os-transfer`. Diagnose a toy workstation with a wrong path, a full working folder and an unnecessary background process. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Confusing storage with memory

- Treating a filename extension as proof of content

- Installing tools before checking platform and permissions

**Understand before progressing:** Explain bits, files, processes, accounts, memory and the boundary between host and guest.

**Able to do after completion:** Inspect an unfamiliar computer and diagnose a simple process, path or permission problem.

**Project contributions:** A repeatable personal lab (`project.lab-notebook`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** A repeatable personal lab (`project.lab-notebook`).


### 03. Networking and traffic fundamentals

**Module ID:** `module.networking`  
**Path:** core  
**Difficulty:** Beginner

**Purpose:** Explain communication end to end and troubleshoot before using network security tools.

**Prerequisites and recommended preparation:** Computer and operating-system fundamentals (`module.computer-os`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 15.1–21.2 hours, excluding the extra revision reserve. Required lessons 5.2 h; cumulative labs 2.5–4.0 h; module assessment/delayed check 1.3–2.0 h; allocated project work 6.0–10.0 h.

**Learning objectives:**



- Trace communication across layers

- Read interface addresses and routes

- Explain how a host finds its destination

- Explain a TCP connection and UDP tradeoff

- Explain common enterprise service roles

- Filter a capture to one conversation

- Test network hypotheses systematically

**Topics:** Network model; Addressing; Network services; Transport; Traffic analysis.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Cisco Networking Academy catalogue](https://www.netacad.com/) — structured course; [Wireshark documentation](https://www.wireshark.org/docs/) — official documentation; [TryHackMe Pre Security](https://tryhackme.com/path/outline/presecurity) — structured course.


#### Topic: Network model — `topic.networking-network-model`


##### Frames, packets and the network journey

**Lesson ID:** `lesson.network-models`  
**Module:** `module.networking`  
**Skill:** `skill.network-models`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Bits, bytes, text and encodings (`skill.data-representation`) ≥70; Processes, services, users and privileges (`skill.processes-users`) ≥70

**Learning objectives:** Trace communication across layers; Distinguish local delivery from routing.

**Key concepts:** Ethernet, MAC, IP, TCP/IP, encapsulation.

**Practical task — `exercise.network-models`:** Draw a browser request travelling from a client through a router to a server and label address changes.

**Evidence to save:** Annotated end-to-end network sketch.

**Knowledge check — `assessment.network-models-check`:**

1. Is a MAC address used for internet-wide routing?

2. Why use layered models?

**Mini challenge — `exercise.network-models-challenge`:** Explain which device needs changing when two subnets cannot communicate.

**Suggested resource types:** worked example, structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Annotated end-to-end network sketch submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Addressing — `topic.networking-addressing`


##### IPv4, IPv6 and practical subnetting

**Lesson ID:** `lesson.ip-addressing`  
**Module:** `module.networking`  
**Skill:** `skill.ip-addressing`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Frames, packets and the network journey (`skill.network-models`) ≥70

**Learning objectives:** Read interface addresses and routes; Determine whether IPv4 addresses share a subnet.

**Key concepts:** IPv4, IPv6, CIDR, loopback, private addresses.

**Practical task — `exercise.ip-addressing`:** Work out network and host ranges for a /24 and /27; identify loopback and link-local addresses on a lab host.

**Evidence to save:** Addressing worksheet with explanations.

**Knowledge check — `assessment.ip-addressing-check`:**

1. What does a CIDR prefix describe?

2. Does IPv6 remove the need for firewall policy?

**Mini challenge — `exercise.ip-addressing-challenge`:** Check whether two addresses belong to the same /27 without a subnet calculator, then verify.

**Suggested resource types:** worked example, structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Addressing worksheet with explanations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Network services — `topic.networking-network-services`


##### Routing, DNS, DHCP and NAT

**Lesson ID:** `lesson.routing-dns-dhcp`  
**Module:** `module.networking`  
**Skill:** `skill.routing-dns-dhcp`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** IPv4, IPv6 and practical subnetting (`skill.ip-addressing`) ≥70

**Learning objectives:** Explain how a host finds its destination; Separate configuration, resolution and routing failures.

**Key concepts:** gateway, DNS, DHCP, NAT, ARP/NDP.

**Practical task — `exercise.routing-dns-dhcp`:** Inspect your lab route and resolver configuration; compare a hostname lookup with a direct connection to a known authorised endpoint.

**Evidence to save:** Network service troubleshooting note.

**Knowledge check — `assessment.routing-dns-dhcp-check`:**

1. Can a working IP connection coexist with broken DNS?

2. Is NAT equivalent to authentication?

**Mini challenge — `exercise.routing-dns-dhcp-challenge`:** Diagnose a wrong resolver using three supplied or self-created observations.

**Suggested resource types:** worked example, structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Network service troubleshooting note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Transport — `topic.networking-transport`


##### TCP, UDP, ports and connection state

**Lesson ID:** `lesson.tcp-ip-basics`  
**Module:** `module.networking`  
**Skill:** `skill.tcp-ip-basics`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Routing, DNS, DHCP and NAT (`skill.routing-dns-dhcp`) ≥70

**Learning objectives:** Explain a TCP connection and UDP tradeoff; Map a listening port to a service hypothesis.

**Key concepts:** handshake, socket, port, retransmission, UDP.

**Practical task — `exercise.tcp-ip-basics`:** Inspect a local listener and draw TCP connection states; compare TCP and UDP behaviour conceptually.

**Evidence to save:** Connection-state diagram and two fault hypotheses.

**Knowledge check — `assessment.tcp-ip-basics-check`:**

1. Does a port number prove which application is running?

2. Why can an application use UDP?

**Mini challenge — `exercise.tcp-ip-basics-challenge`:** Explain a connection timeout versus a refused connection without assuming a single cause.

**Suggested resource types:** worked example, structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Connection-state diagram and two fault hypotheses submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Common services, time and remote administration

**Lesson ID:** `lesson.common-network-services`  
**Module:** `module.networking`  
**Skill:** `skill.common-network-services`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** TCP, UDP, ports and connection state (`skill.tcp-ip-basics`) ≥70

**Learning objectives:** Explain common enterprise service roles; Separate a protocol from its usual port and security configuration.

**Key concepts:** HTTP/HTTPS, SSH/RDP, SMB, SMTP/IMAP, NTP.

**Practical task — `exercise.common-network-services`:** Map web, file sharing, remote administration, email and time synchronisation onto a fictional small network; identify which flows need authentication, encryption and restricted access.

**Evidence to save:** Service-role map and restricted-flow proposal.

**Knowledge check — `assessment.common-network-services-check`:**

1. Does a familiar port prove that a service uses secure authentication or encryption?

2. Why is reliable time important beyond displaying a clock?

**Mini challenge — `exercise.common-network-services-challenge`:** Explain why exposing a management service to every client is unnecessary even when it requires a password.

**Suggested resource types:** worked example, structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Service-role map and restricted-flow proposal submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Traffic analysis — `topic.networking-traffic-analysis`


##### Read a small packet capture

**Lesson ID:** `lesson.packet-analysis`  
**Module:** `module.networking`  
**Skill:** `skill.packet-analysis`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Common services, time and remote administration (`skill.common-network-services`) ≥70

**Learning objectives:** Filter a capture to one conversation; Distinguish visible metadata from encrypted content.

**Key concepts:** capture filter, display filter, five-tuple, TLS metadata.

**Practical task — `exercise.packet-analysis`:** Capture only your own harmless test request or use a curated training capture; identify DNS, transport and encrypted application traffic.

**Evidence to save:** Annotated capture or packet-summary analysis.

**Knowledge check — `assessment.packet-analysis-check`:**

1. Can a normal TLS capture reveal all application plaintext?

2. Why minimise capture scope?

**Mini challenge — `exercise.packet-analysis-challenge`:** Identify one retransmission or explain its absence and the limits of the capture.

**Suggested resource types:** worked example, structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Annotated capture or packet-summary analysis submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Troubleshoot segmentation and connectivity

**Lesson ID:** `lesson.network-diagnostics`  
**Module:** `module.networking`  
**Skill:** `skill.network-diagnostics`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Read a small packet capture (`skill.packet-analysis`) ≥70

**Learning objectives:** Test network hypotheses systematically; Explain segmentation, Wi-Fi and VPN boundaries.

**Key concepts:** firewall, VLAN, wireless trust, VPN, least exposure.

**Practical task — `exercise.network-diagnostics`:** Diagnose three lab scenarios: wrong gateway, blocked service and wrong DNS; identify the smallest decisive test for each.

**Evidence to save:** Three-case diagnostic report and segmentation sketch.

**Knowledge check — `assessment.network-diagnostics-check`:**

1. Does joining a VPN make every application trustworthy?

2. Why can ping fail while a web service works?

**Mini challenge — `exercise.network-diagnostics-challenge`:** Design a small guest network that cannot reach a private lab server.

**Suggested resource types:** worked example, structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Three-case diagnostic report and segmentation sketch submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Networking and traffic fundamentals — guided** — `lab.networking-guided`; 60–90 minutes, resumable.

Scenario: Explain a failed web request using a synthetic network diagram, resolver result and short packet capture.

Inputs: Two private lab hosts or a network simulator; learner-captured dummy traffic or an instructor-authored packet summary. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Assigned browser-based training lab (`environment.browser`); Disposable Linux environment (`environment.linux`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Draw devices and interfaces

- Resolve names and inspect addresses

- Trace one connection

- Diagnose a changed DNS or firewall setting without broad scanning

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Networking and traffic fundamentals — transfer** — `lab.networking-transfer`; 90–150 minutes, resumable.

Scenario: Explain a failed web request using a synthetic network diagram, resolver result and short packet capture.

Inputs: Two private lab hosts or a network simulator; learner-captured dummy traffic or an instructor-authored packet summary. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Assigned browser-based training lab (`environment.browser`); Disposable Linux environment (`environment.linux`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Draw devices and interfaces

- Resolve names and inspect addresses

- Trace one connection

- Diagnose a changed DNS or firewall setting without broad scanning

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.networking-transfer`. Explain a failed web request using a synthetic network diagram, resolver result and short packet capture. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Memorising OSI labels without tracing traffic

- Confusing DNS failure with loss of connectivity

- Assuming a private IP makes a service safe

**Understand before progressing:** Explain addressing, routing, name resolution, ports, transport and the evidence visible in a capture.

**Able to do after completion:** Trace a request, calculate a small subnet and diagnose a network failure from evidence.

**Project contributions:** Network diagnosis casebook (`project.network-diagnosis`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Network diagnosis casebook (`project.network-diagnosis`).


### 04. Linux administration and investigation

**Module ID:** `module.linux`  
**Path:** core  
**Difficulty:** Beginner

**Purpose:** Develop reliable command-line and host investigation skills.

**Prerequisites and recommended preparation:** Computer and operating-system fundamentals (`module.computer-os`); Networking and traffic fundamentals (`module.networking`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 13.6–19.8 hours, excluding the extra revision reserve. Required lessons 3.8 h; cumulative labs 2.5–4.0 h; module assessment/delayed check 1.3–2.0 h; allocated project work 6.0–10.0 h.

**Learning objectives:**



- Use shell help to discover options

- Combine text tools with predictable outputs

- Interpret owner/group/other permissions

- Locate a service failure using logs

- Inspect host exposure

**Topics:** Shell; Administration; Investigation.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners) — official documentation; [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) — practical lab; [HTB Academy Information Security Foundations](https://academy.hackthebox.com/path/preview/information-security-foundations) — structured course.


#### Topic: Shell — `topic.linux-shell`


##### Shell navigation, help and safe file work

**Lesson ID:** `lesson.linux-shell`  
**Module:** `module.linux`  
**Skill:** `skill.linux-shell`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Files, paths and filesystem behaviour (`skill.files-paths`) ≥70; Permission, boundaries and stop conditions (`skill.authorised-scope`) ≥70

**Learning objectives:** Use shell help to discover options; Manipulate files in a scoped workspace.

**Key concepts:** pwd, ls, cd, man, quoting.

**Practical task — `exercise.linux-shell`:** Create and navigate a practice directory with spaces in filenames; copy and compare harmless files without sudo.

**Evidence to save:** Command transcript with explanations.

**Knowledge check — `assessment.linux-shell-check`:**

1. Why quote a path containing spaces?

2. What should you inspect before deleting anything?

**Mini challenge — `exercise.linux-shell-challenge`:** Complete an introductory Bandit-style file search using only help pages when stuck.

**Suggested resource types:** worked example, official documentation, practical lab, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Command transcript with explanations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Streams, search and text pipelines

**Lesson ID:** `lesson.linux-text`  
**Module:** `module.linux`  
**Skill:** `skill.linux-text`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Shell navigation, help and safe file work (`skill.linux-shell`) ≥70

**Learning objectives:** Combine text tools with predictable outputs; Distinguish stdout, stderr and redirection.

**Key concepts:** pipes, grep, sort, uniq, exit status.

**Practical task — `exercise.linux-text`:** Use a small synthetic log to count failed logins; keep errors separate from the result.

**Evidence to save:** Reproducible pipeline and expected count.

**Knowledge check — `assessment.linux-text-check`:**

1. What travels through a normal pipe?

2. Why inspect exit status?

**Mini challenge — `exercise.linux-text-challenge`:** Repeat the count after adding a malformed line and explain the result.

**Suggested resource types:** worked example, official documentation, practical lab, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Reproducible pipeline and expected count submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Administration — `topic.linux-administration`


##### Users, groups and file permissions

**Lesson ID:** `lesson.linux-permissions`  
**Module:** `module.linux`  
**Skill:** `skill.linux-permissions`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Shell navigation, help and safe file work (`skill.linux-shell`) ≥70; Processes, services, users and privileges (`skill.processes-users`) ≥70

**Learning objectives:** Interpret owner/group/other permissions; Apply least privilege to dummy files.

**Key concepts:** uid, gid, rwx, sudo, umask.

**Practical task — `exercise.linux-permissions`:** Create a dummy shared folder in a disposable guest; test allowed and denied access with two accounts.

**Evidence to save:** Before-and-after permissions and negative test.

**Knowledge check — `assessment.linux-permissions-check`:**

1. Why is chmod 777 usually an inadequate fix?

2. Is root identical to the filesystem root directory?

**Mini challenge — `exercise.linux-permissions-challenge`:** Repair one permission problem without granting access to everyone.

**Suggested resource types:** worked example, official documentation, practical lab, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Before-and-after permissions and negative test submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Processes, packages and service logs

**Lesson ID:** `lesson.linux-services`  
**Module:** `module.linux`  
**Skill:** `skill.linux-services`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Users, groups and file permissions (`skill.linux-permissions`) ≥70; Streams, search and text pipelines (`skill.linux-text`) ≥70

**Learning objectives:** Locate a service failure using logs; Explain package and service ownership.

**Key concepts:** ps, systemd, journal, package manager, configuration.

**Practical task — `exercise.linux-services`:** Inspect a benign service, read its logs and diagnose a deliberately wrong configuration path in the disposable guest.

**Evidence to save:** Service investigation and restoration note.

**Knowledge check — `assessment.linux-services-check`:**

1. Why consult logs before reinstalling a service?

2. Does installing a package guarantee a service is running?

**Mini challenge — `exercise.linux-services-challenge`:** Find which process owns a harmless listening service and justify the evidence.

**Suggested resource types:** worked example, official documentation, practical lab, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Service investigation and restoration note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Investigation — `topic.linux-investigation`


##### SSH, sockets and Linux investigation

**Lesson ID:** `lesson.linux-network-investigation`  
**Module:** `module.linux`  
**Skill:** `skill.linux-network-investigation`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Processes, packages and service logs (`skill.linux-services`) ≥70; TCP, UDP, ports and connection state (`skill.tcp-ip-basics`) ≥70

**Learning objectives:** Inspect host exposure; Use SSH with host identity verification.

**Key concepts:** ss, SSH, host key, listener, audit trail.

**Practical task — `exercise.linux-network-investigation`:** List local listening sockets; connect to your lab account using SSH and explain the host-key prompt.

**Evidence to save:** Linux investigation report with exposure and remediation.

**Knowledge check — `assessment.linux-network-investigation-check`:**

1. What risk does host-key verification address?

2. Why distinguish 127.0.0.1 from 0.0.0.0 binding?

**Mini challenge — `exercise.linux-network-investigation-challenge`:** Investigate an unexpected lab listener without terminating unrelated processes.

**Suggested resource types:** worked example, official documentation, practical lab, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Linux investigation report with exposure and remediation submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Linux administration and investigation — guided** — `lab.linux-guided`; 60–90 minutes, resumable.

Scenario: Find a misplaced configuration, over-permissive file and failed service in a disposable Linux lab.

Inputs: One disposable Linux user account, a practice folder, a harmless service and synthetic text logs. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Linux environment (`environment.linux`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Locate and inspect files

- Compare permissions for two dummy users

- Inspect a harmless service and its logs

- Fix one cause and restore the starting state

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Linux administration and investigation — transfer** — `lab.linux-transfer`; 90–150 minutes, resumable.

Scenario: Find a misplaced configuration, over-permissive file and failed service in a disposable Linux lab.

Inputs: One disposable Linux user account, a practice folder, a harmless service and synthetic text logs. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Linux environment (`environment.linux`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Locate and inspect files

- Compare permissions for two dummy users

- Inspect a harmless service and its logs

- Fix one cause and restore the starting state

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.linux-transfer`. Find a misplaced configuration, over-permissive file and failed service in a disposable Linux lab. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Using sudo to hide permission mistakes

- Running destructive commands outside the lab folder

- Assuming macOS commands match Linux exactly

**Understand before progressing:** Explain paths, streams, ownership, execution, services and local network exposure.

**Able to do after completion:** Investigate a Linux host using minimal privileges and produce a reproducible evidence trail.

**Project contributions:** Linux investigation and repair (`project.linux-investigation`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Linux investigation and repair (`project.linux-investigation`).


### 05. Windows administration and evidence

**Module ID:** `module.windows`  
**Path:** core  
**Difficulty:** Beginner

**Purpose:** Understand Windows systems before studying AD, endpoint security or forensics.

**Prerequisites and recommended preparation:** Computer and operating-system fundamentals (`module.computer-os`); Networking and traffic fundamentals (`module.networking`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 11.6–16.8 hours, excluding the extra revision reserve. Required lessons 3.8 h; cumulative labs 2.5–4.0 h; module assessment/delayed check 1.3–2.0 h; allocated project work 4.0–7.0 h.

**Learning objectives:**



- Locate core Windows management surfaces

- Explain access decisions for local users

- Read and filter PowerShell objects

- Read an event with its context

- Choose baseline endpoint protections

**Topics:** Windows model; Administration; Evidence; Endpoint controls.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [PowerShell overview and documentation](https://learn.microsoft.com/en-us/powershell/scripting/overview) — official documentation; [Active Directory Domain Services overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview) — official documentation; [TryHackMe Cyber Security 101](https://tryhackme.com/path/outline/cybersecurity101) — structured course.


#### Topic: Windows model — `topic.windows-windows-model`


##### Windows architecture and everyday administration

**Lesson ID:** `lesson.windows-system`  
**Module:** `module.windows`  
**Skill:** `skill.windows-system`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Processes, services, users and privileges (`skill.processes-users`) ≥70

**Learning objectives:** Locate core Windows management surfaces; Distinguish user and machine configuration.

**Key concepts:** Task Manager, services, registry, filesystem, settings.

**Practical task — `exercise.windows-system`:** Inventory services and processes on a training host; compare user and machine settings without editing production registry keys.

**Evidence to save:** Windows inventory and tool-selection note.

**Knowledge check — `assessment.windows-system-check`:**

1. Is the registry just another name for the filesystem?

2. Why document before changing a setting?

**Mini challenge — `exercise.windows-system-challenge`:** Explain which management surface you would use for a failed service versus a file denial.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Windows inventory and tool-selection note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Local users, groups, NTFS and UAC

**Lesson ID:** `lesson.windows-access`  
**Module:** `module.windows`  
**Skill:** `skill.windows-access`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Windows architecture and everyday administration (`skill.windows-system`) ≥70

**Learning objectives:** Explain access decisions for local users; Test least-privilege folder permissions.

**Key concepts:** SID, ACL, inheritance, UAC, groups.

**Practical task — `exercise.windows-access`:** Use two dummy accounts to test a folder ACL; document effective access including inheritance.

**Evidence to save:** Access matrix with positive and negative tests.

**Knowledge check — `assessment.windows-access-check`:**

1. Does hiding a folder enforce access control?

2. Why can group membership affect a user unexpectedly?

**Mini challenge — `exercise.windows-access-challenge`:** Repair a deny case without adding the user to Administrators.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Access matrix with positive and negative tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Administration — `topic.windows-administration`


##### PowerShell objects and safe inspection

**Lesson ID:** `lesson.powershell-basics`  
**Module:** `module.windows`  
**Skill:** `skill.powershell-basics`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Local users, groups, NTFS and UAC (`skill.windows-access`) ≥70

**Learning objectives:** Read and filter PowerShell objects; Use discovery and help.

**Key concepts:** Get-Help, Get-Command, pipeline, properties, Select-Object.

**Practical task — `exercise.powershell-basics`:** List and filter harmless process or service objects and export a redacted inventory to CSV.

**Evidence to save:** PowerShell inventory command and CSV.

**Knowledge check — `assessment.powershell-basics-check`:**

1. How does an object pipeline differ from a text stream?

2. Why inspect properties before filtering?

**Mini challenge — `exercise.powershell-basics-challenge`:** Rebuild a filter after a displayed column name differs from a property name.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- PowerShell inventory command and CSV submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Evidence — `topic.windows-evidence`


##### Event logs, time and audit context

**Lesson ID:** `lesson.windows-events`  
**Module:** `module.windows`  
**Skill:** `skill.windows-events`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** PowerShell objects and safe inspection (`skill.powershell-basics`) ≥70; Evidence, privacy and reproducible notes (`skill.technical-notes`) ≥70

**Learning objectives:** Read an event with its context; Explain what absent logs cannot establish.

**Key concepts:** Event Viewer, provider, event ID, timestamp, audit policy.

**Practical task — `exercise.windows-events`:** Create a harmless test sign-in on a lab account or read a synthetic event export; annotate account, host, time and result.

**Evidence to save:** Annotated event timeline with limits.

**Knowledge check — `assessment.windows-events-check`:**

1. Does an event ID prove malicious intent?

2. Does no event prove that an action never occurred?

**Mini challenge — `exercise.windows-events-challenge`:** Resolve a UTC-versus-local-time mismatch between two records.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Annotated event timeline with limits submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Endpoint controls — `topic.windows-endpoint-controls`


##### Updates, endpoint controls and recovery

**Lesson ID:** `lesson.windows-hardening`  
**Module:** `module.windows`  
**Skill:** `skill.windows-hardening`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Event logs, time and audit context (`skill.windows-events`) ≥70; Software installation, updates and recovery (`skill.software-recovery`) ≥70

**Learning objectives:** Choose baseline endpoint protections; Verify a recoverable change.

**Key concepts:** patching, firewall, Defender, disk encryption, restore.

**Practical task — `exercise.windows-hardening`:** Review a training host against a short baseline; test one reversible setting and a dummy-file restore.

**Evidence to save:** Windows baseline review and rollback evidence.

**Knowledge check — `assessment.windows-hardening-check`:**

1. Why test a restore as well as a backup?

2. Why avoid disabling endpoint protection just to make a lab easier?

**Mini challenge — `exercise.windows-hardening-challenge`:** Document a justified exception with scope, expiry and compensating control.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Windows baseline review and rollback evidence submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Windows administration and evidence — guided** — `lab.windows-guided`; 60–90 minutes, resumable.

Scenario: Investigate a synthetic failed sign-in and misconfigured folder using a disposable Windows host or exported training events.

Inputs: Windows training host or equivalent exported Event Viewer records, two dummy users and a test folder. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Windows environment (`environment.windows`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Inventory system and accounts

- Test a folder permission

- Read a service configuration

- Correlate three timestamped events

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Windows administration and evidence — transfer** — `lab.windows-transfer`; 90–150 minutes, resumable.

Scenario: Investigate a synthetic failed sign-in and misconfigured folder using a disposable Windows host or exported training events.

Inputs: Windows training host or equivalent exported Event Viewer records, two dummy users and a test folder. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Windows environment (`environment.windows`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Inventory system and accounts

- Test a folder permission

- Read a service configuration

- Correlate three timestamped events

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.windows-transfer`. Investigate a synthetic failed sign-in and misconfigured folder using a disposable Windows host or exported training events. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Running every task as administrator

- Assuming an event ID alone proves an attack

- Confusing local accounts with domain identities

**Understand before progressing:** Explain Windows identity, NTFS access, services, registry and event-log context.

**Able to do after completion:** Inspect a Windows workstation, collect useful events and explain basic hardening choices.

**Project contributions:** Windows baseline and recovery (`project.windows-baseline`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** No new shared-project gate yet; save this module’s contribution for its final contributing module.


### 06. Programming, data and Python for security

**Module ID:** `module.programming`  
**Path:** core  
**Difficulty:** Beginner

**Purpose:** Learn to reason about code and data before automating security work.

**Prerequisites and recommended preparation:** Linux administration and investigation (`module.linux`); Windows administration and evidence (`module.windows`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 13.3–18.5 hours, excluding the extra revision reserve. Required lessons 4.5 h; cumulative labs 2.5–4.0 h; module assessment/delayed check 1.3–2.0 h; allocated project work 5.0–8.0 h.

**Learning objectives:**



- Trace execution by hand

- Break a task into testable functions

- Parse structured records

- Use a bounded pattern for a defined format

- Query a small relational dataset

- Write meaningful automated tests

**Topics:** Programming; Data handling; Testing.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [The Python Tutorial](https://docs.python.org/3/tutorial/) — official documentation; [TryHackMe Pre Security](https://tryhackme.com/path/outline/presecurity) — structured course.


#### Topic: Programming — `topic.programming-programming`


##### Variables, types and control flow

**Lesson ID:** `lesson.code-control-flow`  
**Module:** `module.programming`  
**Skill:** `skill.code-control-flow`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Shell navigation, help and safe file work (`skill.linux-shell`) ≥70; Bits, bytes, text and encodings (`skill.data-representation`) ≥70

**Learning objectives:** Trace execution by hand; Choose appropriate data types.

**Key concepts:** variable, boolean, loop, condition, list.

**Practical task — `exercise.code-control-flow`:** Write a small Python program that classifies five dummy login results and counts failures.

**Evidence to save:** Program and hand-traced expected output.

**Knowledge check — `assessment.code-control-flow-check`:**

1. Why is the string zero different from the number zero?

2. What distinguishes assignment from comparison?

**Mini challenge — `exercise.code-control-flow-challenge`:** Predict output before running a changed conditional.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Program and hand-traced expected output submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Functions, debugging and error handling

**Lesson ID:** `lesson.functions-debugging`  
**Module:** `module.programming`  
**Skill:** `skill.functions-debugging`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Variables, types and control flow (`skill.code-control-flow`) ≥70; Read errors and ask useful questions (`skill.help-and-debugging`) ≥70

**Learning objectives:** Break a task into testable functions; Handle expected failures explicitly.

**Key concepts:** parameter, return, scope, exception, debugger.

**Practical task — `exercise.functions-debugging`:** Refactor the login counter into functions; handle a missing input file and explain a traceback.

**Evidence to save:** Refactored script and debugging note.

**Knowledge check — `assessment.functions-debugging-check`:**

1. Why avoid silently catching every exception?

2. What makes a function easy to test?

**Mini challenge — `exercise.functions-debugging-challenge`:** Fix an off-by-one bug using a minimal failing input.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Refactored script and debugging note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Data handling — `topic.programming-data-handling`


##### Files, CSV, JSON and timestamps

**Lesson ID:** `lesson.structured-data`  
**Module:** `module.programming`  
**Skill:** `skill.structured-data`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Functions, debugging and error handling (`skill.functions-debugging`) ≥70

**Learning objectives:** Parse structured records; Normalise time without discarding source information.

**Key concepts:** CSV, JSON, schema, UTF-8, UTC.

**Practical task — `exercise.structured-data`:** Read synthetic CSV and JSON login events; validate required fields and preserve original timestamps alongside UTC.

**Evidence to save:** Validated parser and rejected-row report.

**Knowledge check — `assessment.structured-data-check`:**

1. Why not split every CSV line on commas?

2. Why preserve an original timestamp?

**Mini challenge — `exercise.structured-data-challenge`:** Handle a missing field and a timezone offset without crashing or silently guessing.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Validated parser and rejected-row report submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Regular expressions and reliable extraction

**Lesson ID:** `lesson.regex-parsing`  
**Module:** `module.programming`  
**Skill:** `skill.regex-parsing`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Files, CSV, JSON and timestamps (`skill.structured-data`) ≥70

**Learning objectives:** Use a bounded pattern for a defined format; Explain pattern limitations.

**Key concepts:** anchor, character class, group, escaping, false match.

**Practical task — `exercise.regex-parsing`:** Extract a username from a known synthetic log format; test valid, invalid and adversarially long inputs.

**Evidence to save:** Pattern test cases and limitation note.

**Knowledge check — `assessment.regex-parsing-check`:**

1. Why can an unanchored pattern match unintended text?

2. When is a real parser better than regex?

**Mini challenge — `exercise.regex-parsing-challenge`:** Find one input your first pattern wrongly accepts and repair it.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Pattern test cases and limitation note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Relational data and SQL queries

**Lesson ID:** `lesson.sql-data`  
**Module:** `module.programming`  
**Skill:** `skill.sql-data`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Files, CSV, JSON and timestamps (`skill.structured-data`) ≥70

**Learning objectives:** Query a small relational dataset; Distinguish rows, keys and joins.

**Key concepts:** table, primary key, SELECT, JOIN, NULL.

**Practical task — `exercise.sql-data`:** Create a local SQLite database of dummy users and login events; query failed attempts per user.

**Evidence to save:** SQL queries with hand-checked totals.

**Knowledge check — `assessment.sql-data-check`:**

1. Why can a join multiply row counts?

2. Is NULL the same as an empty string?

**Mini challenge — `exercise.sql-data-challenge`:** Explain and repair an inflated count caused by a join.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- SQL queries with hand-checked totals submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Testing — `topic.programming-testing`


##### Tests, dependencies and safe tool use

**Lesson ID:** `lesson.testing-safe-code`  
**Module:** `module.programming`  
**Skill:** `skill.testing-safe-code`  
**Difficulty:** Beginner

**Estimated duration:** 45 minutes standard; 30 for a compact complete attempt when feasible; 75 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Regular expressions and reliable extraction (`skill.regex-parsing`) ≥70; Relational data and SQL queries (`skill.sql-data`) ≥70

**Learning objectives:** Write meaningful automated tests; Bound a script’s inputs and effects.

**Key concepts:** unit test, fixture, virtual environment, timeout, dependency.

**Practical task — `exercise.testing-safe-code`:** Test the parser on empty, malformed and duplicate data; document dependencies and avoid constructing shell commands from untrusted input.

**Evidence to save:** Test suite, dependency record and passing results.

**Knowledge check — `assessment.testing-safe-code-check`:**

1. Why test an empty file?

2. Why is shell string interpolation risky with untrusted input?

**Mini challenge — `exercise.testing-safe-code-challenge`:** Make a previously failing edge case pass without weakening the test.

**Suggested resource types:** worked example, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Test suite, dependency record and passing results submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Programming, data and Python for security — guided** — `lab.programming-guided`; 60–90 minutes, resumable.

Scenario: Build a script that reads synthetic login records, rejects invalid rows and reports counts per user.

Inputs: Python environment; learner-created CSV/JSON records with known expected totals and deliberate malformed rows. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Disposable Linux environment (`environment.linux`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Trace a five-line program

- Parse valid and invalid input

- Separate logic into functions

- Test edge cases and compare with hand-calculated results

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Programming, data and Python for security — transfer** — `lab.programming-transfer`; 90–150 minutes, resumable.

Scenario: Build a script that reads synthetic login records, rejects invalid rows and reports counts per user.

Inputs: Python environment; learner-created CSV/JSON records with known expected totals and deliberate malformed rows. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Disposable Linux environment (`environment.linux`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Trace a five-line program

- Parse valid and invalid input

- Separate logic into functions

- Test edge cases and compare with hand-calculated results

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.programming-transfer`. Build a script that reads synthetic login records, rejects invalid rows and reports counts per user. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Copying code without tracing execution

- Ignoring malformed data and time zones

- Assuming a script is correct because it ran once

**Understand before progressing:** Explain variables, control flow, functions, parsing, exceptions, tests and relational queries.

**Able to do after completion:** Write and test a small data-processing tool with explicit failure handling.

**Project contributions:** A tested log-analysis utility (`project.log-toolkit`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** No new shared-project gate yet; save this module’s contribution for its final contributing module.


### 07. Shell automation, Git and reproducible work

**Module ID:** `module.automation-git`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Turn small scripts into reviewable, reliable security work products.

**Prerequisites and recommended preparation:** Programming, data and Python for security (`module.programming`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 14.8–20.5 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 5.0–8.0 h.

**Learning objectives:**



- Track meaningful changes

- Resolve a small merge conflict

- Automate a known local workflow

- Build a reusable inspection function

- Package a tool for another learner

**Topics:** Version control; Automation.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Pro Git](https://git-scm.com/book/en/v2) — reference; [PowerShell overview and documentation](https://learn.microsoft.com/en-us/powershell/scripting/overview) — official documentation; [The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners) — official documentation.


#### Topic: Version control — `topic.automation-git-version-control`


##### Git history, diffs and sensible commits

**Lesson ID:** `lesson.git-history`  
**Module:** `module.automation-git`  
**Skill:** `skill.git-history`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Tests, dependencies and safe tool use (`skill.testing-safe-code`) ≥70

**Learning objectives:** Track meaningful changes; Read a diff before recording it.

**Key concepts:** repository, working tree, staging, commit, diff.

**Practical task — `exercise.git-history`:** Create a local repository for the parser; inspect a diff and commit one logical change at a time.

**Evidence to save:** Local repository with three explained commits.

**Knowledge check — `assessment.git-history-check`:**

1. Is Git itself the same as GitHub?

2. Why inspect staged changes?

**Mini challenge — `exercise.git-history-challenge`:** Recover an earlier harmless file version without deleting current work.

**Suggested resource types:** worked example, reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Local repository with three explained commits submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Branches, review and secret hygiene

**Lesson ID:** `lesson.git-collaboration`  
**Module:** `module.automation-git`  
**Skill:** `skill.git-collaboration`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Git history, diffs and sensible commits (`skill.git-history`) ≥70

**Learning objectives:** Resolve a small merge conflict; Keep sensitive data out of history.

**Key concepts:** branch, merge, conflict, ignore, secret rotation.

**Practical task — `exercise.git-collaboration`:** Make two practice branches that edit the same harmless line; resolve the conflict and inspect tracked files.

**Evidence to save:** Conflict resolution and sanitised repository check.

**Knowledge check — `assessment.git-collaboration-check`:**

1. Does adding a leaked key to .gitignore remove it from history?

2. Why review a merge resolution?

**Mini challenge — `exercise.git-collaboration-challenge`:** Write a review comment that identifies a concrete logic error and its effect.

**Suggested resource types:** worked example, reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Conflict resolution and sanitised repository check submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Automation — `topic.automation-git-automation`


##### Bash scripting with bounded effects

**Lesson ID:** `lesson.bash-automation`  
**Module:** `module.automation-git`  
**Skill:** `skill.bash-automation`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Streams, search and text pipelines (`skill.linux-text`) ≥70; Functions, debugging and error handling (`skill.functions-debugging`) ≥70

**Learning objectives:** Automate a known local workflow; Handle quoting and failure explicitly.

**Key concepts:** arguments, quoting, exit code, dry run, idempotence.

**Practical task — `exercise.bash-automation`:** Write a script that inventories only a named practice directory and refuses an empty target argument.

**Evidence to save:** Bounded Bash script with negative tests.

**Knowledge check — `assessment.bash-automation-check`:**

1. Why quote variable expansions containing paths?

2. What does idempotence mean here?

**Mini challenge — `exercise.bash-automation-challenge`:** Add a dry-run mode and show that it makes no file changes.

**Suggested resource types:** worked example, reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Bounded Bash script with negative tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### PowerShell automation and structured output

**Lesson ID:** `lesson.powershell-automation`  
**Module:** `module.automation-git`  
**Skill:** `skill.powershell-automation`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** PowerShell objects and safe inspection (`skill.powershell-basics`) ≥70; Functions, debugging and error handling (`skill.functions-debugging`) ≥70

**Learning objectives:** Build a reusable inspection function; Export structured data with errors visible.

**Key concepts:** function, parameter, object, ErrorAction, CSV.

**Practical task — `exercise.powershell-automation`:** Write a read-only service inventory function; return objects and handle an unavailable host in a lab scenario.

**Evidence to save:** PowerShell function and error-case evidence.

**Knowledge check — `assessment.powershell-automation-check`:**

1. Why return objects instead of only formatted text?

2. Why distinguish a failed query from zero results?

**Mini challenge — `exercise.powershell-automation-challenge`:** Add an invalid-parameter test without suppressing the error.

**Suggested resource types:** worked example, reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- PowerShell function and error-case evidence submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Documentation and reproducible tooling

**Lesson ID:** `lesson.reproducible-tooling`  
**Module:** `module.automation-git`  
**Skill:** `skill.reproducible-tooling`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Branches, review and secret hygiene (`skill.git-collaboration`) ≥70; Bash scripting with bounded effects (`skill.bash-automation`) ≥70; PowerShell automation and structured output (`skill.powershell-automation`) ≥70

**Learning objectives:** Package a tool for another learner; Explain its assumptions and limitations.

**Key concepts:** README, setup, sample data, version, licence.

**Practical task — `exercise.reproducible-tooling`:** Create a README, safe sample input, expected output and tests for your parser; reproduce the result in a fresh directory.

**Evidence to save:** Reproducible security utility repository.

**Knowledge check — `assessment.reproducible-tooling-check`:**

1. Why provide expected output?

2. Why label synthetic evidence?

**Mini challenge — `exercise.reproducible-tooling-challenge`:** Have a reviewer follow only the README, or simulate a clean-room run yourself.

**Suggested resource types:** worked example, reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Reproducible security utility repository submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Shell automation, Git and reproducible work — guided** — `lab.automation-git-guided`; 90–150 minutes, resumable.

Scenario: Version and package the log-analysis tool; reproduce its output from a clean practice directory.

Inputs: The synthetic parser project, a local Git repository and two harmless configuration versions. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Disposable Linux environment (`environment.linux`); Disposable Windows environment (`environment.windows`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Record a meaningful commit

- Make and review a small branch

- Add input validation and dry-run behaviour

- Reproduce the tool from its README

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Shell automation, Git and reproducible work — transfer** — `lab.automation-git-transfer`; 120–180 minutes, resumable.

Scenario: Version and package the log-analysis tool; reproduce its output from a clean practice directory.

Inputs: The synthetic parser project, a local Git repository and two harmless configuration versions. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Disposable Linux environment (`environment.linux`); Disposable Windows environment (`environment.windows`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Record a meaningful commit

- Make and review a small branch

- Add input validation and dry-run behaviour

- Reproduce the tool from its README

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.automation-git-transfer`. Version and package the log-analysis tool; reproduce its output from a clean practice directory. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Committing credentials or raw personal data

- Automating a task not yet understood manually

- Treating a successful command as proof of the intended result

**Understand before progressing:** Explain version history, branching, shell quoting, object pipelines and safe repeatable automation.

**Able to do after completion:** Deliver a small documented repository that another person can run and audit.

**Project contributions:** A tested log-analysis utility (`project.log-toolkit`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** A tested log-analysis utility (`project.log-toolkit`).


### 08. Security principles, risk and identity

**Module ID:** `module.security-foundations`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Connect technical weaknesses to people, assets, controls and business consequences.

**Prerequisites and recommended preparation:** Networking and traffic fundamentals (`module.networking`); Linux administration and investigation (`module.linux`); Windows administration and evidence (`module.windows`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 13.8–18.5 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 4.0–6.0 h.

**Learning objectives:**



- Relate confidentiality, integrity and availability to assets

- Explain likelihood and impact separately

- Distinguish identity checks from access decisions

- Evaluate a suspicious message using evidence

- Match handling to data sensitivity

**Topics:** Security model; Risk; Identity; People; Governance.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) — reference; [NIST NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions) — reference; [TryHackMe Cyber Security 101](https://tryhackme.com/path/outline/cybersecurity101) — structured course.


#### Topic: Security model — `topic.security-foundations-security-model`


##### Assets, threats and security goals

**Lesson ID:** `lesson.security-goals`  
**Module:** `module.security-foundations`  
**Skill:** `skill.security-goals`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Troubleshoot segmentation and connectivity (`skill.network-diagnostics`) ≥70; Updates, endpoint controls and recovery (`skill.windows-hardening`) ≥70; SSH, sockets and Linux investigation (`skill.linux-network-investigation`) ≥70

**Learning objectives:** Relate confidentiality, integrity and availability to assets; Distinguish weakness from exploitation.

**Key concepts:** CIA, asset, threat, vulnerability, control.

**Practical task — `exercise.security-goals`:** Describe three failures affecting a fictional booking system and map each to a security goal.

**Evidence to save:** Asset-to-goal map with tradeoffs.

**Knowledge check — `assessment.security-goals-check`:**

1. Can a system lose integrity without losing confidentiality?

2. Is every vulnerability already an incident?

**Mini challenge — `exercise.security-goals-challenge`:** Show a control that improves one goal but creates a tradeoff for another.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Asset-to-goal map with tradeoffs submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Risk — `topic.security-foundations-risk`


##### Risk, impact and proportionate decisions

**Lesson ID:** `lesson.risk-prioritisation`  
**Module:** `module.security-foundations`  
**Skill:** `skill.risk-prioritisation`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Assets, threats and security goals (`skill.security-goals`) ≥70

**Learning objectives:** Explain likelihood and impact separately; Prioritise limited remediation effort.

**Key concepts:** risk, likelihood, impact, owner, residual risk.

**Practical task — `exercise.risk-prioritisation`:** Rank five fictional weaknesses using exposure, asset importance and existing controls; state uncertainty.

**Evidence to save:** Risk register with justified priorities.

**Knowledge check — `assessment.risk-prioritisation-check`:**

1. Is a severe technical score automatically the highest business priority?

2. Why assign a risk owner?

**Mini challenge — `exercise.risk-prioritisation-challenge`:** Re-rank the list after learning that one asset holds only disposable test data.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Risk register with justified priorities submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Identity — `topic.security-foundations-identity`


##### Authentication, authorisation and account lifecycle

**Lesson ID:** `lesson.iam-lifecycle`  
**Module:** `module.security-foundations`  
**Skill:** `skill.iam-lifecycle`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Risk, impact and proportionate decisions (`skill.risk-prioritisation`) ≥70; Local users, groups, NTFS and UAC (`skill.windows-access`) ≥70; Users, groups and file permissions (`skill.linux-permissions`) ≥70

**Learning objectives:** Distinguish identity checks from access decisions; Design least-privilege joiner and leaver processes.

**Key concepts:** authentication, authorisation, MFA, RBAC, least privilege.

**Practical task — `exercise.iam-lifecycle`:** Create roles for a fictional app; specify allowed actions and remove a departing user’s access in the design.

**Evidence to save:** Role matrix and joiner/mover/leaver checklist.

**Knowledge check — `assessment.iam-lifecycle-check`:**

1. Can a successfully authenticated user still be denied an action?

2. Why do shared accounts weaken accountability?

**Mini challenge — `exercise.iam-lifecycle-challenge`:** Find a role that accidentally combines incompatible privileges.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Role matrix and joiner/mover/leaver checklist submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: People — `topic.security-foundations-people`


##### Human factors, phishing recognition and reporting

**Lesson ID:** `lesson.human-security`  
**Module:** `module.security-foundations`  
**Skill:** `skill.human-security`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Authentication, authorisation and account lifecycle (`skill.iam-lifecycle`) ≥70

**Learning objectives:** Evaluate a suspicious message using evidence; Design a usable reporting process.

**Key concepts:** pretext, verification, reporting, accessibility, friction.

**Practical task — `exercise.human-security`:** Annotate a clearly synthetic phishing email and draft a calm report; verify a request through an independently known channel.

**Evidence to save:** Synthetic message analysis and usable reporting flow.

**Knowledge check — `assessment.human-security-check`:**

1. Does a familiar display name prove who sent a message?

2. Why avoid blaming users for reporting a mistake?

**Mini challenge — `exercise.human-security-challenge`:** Rewrite an awkward security procedure to reduce workarounds.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Synthetic message analysis and usable reporting flow submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Governance — `topic.security-foundations-governance`


##### Data handling, governance and ethical decisions

**Lesson ID:** `lesson.governance-data`  
**Module:** `module.security-foundations`  
**Skill:** `skill.governance-data`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Human factors, phishing recognition and reporting (`skill.human-security`) ≥70; Evidence, privacy and reproducible notes (`skill.technical-notes`) ≥70

**Learning objectives:** Match handling to data sensitivity; Distinguish policy, procedure and evidence.

**Key concepts:** classification, retention, privacy, policy, assurance.

**Practical task — `exercise.governance-data`:** Classify a fictional dataset; define access, retention, disposal and an exception process without collecting real personal records.

**Evidence to save:** Data-handling plan and evidence checklist.

**Knowledge check — `assessment.governance-data-check`:**

1. Does having a written policy prove it is followed?

2. Why minimise retained sensitive data?

**Mini challenge — `exercise.governance-data-challenge`:** Explain how you would seek jurisdiction-specific advice rather than invent a notification deadline.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Data-handling plan and evidence checklist submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Security principles, risk and identity — guided** — `lab.security-foundations-guided`; 90–150 minutes, resumable.

Scenario: Assess a fictional small organisation with shared accounts, untested backups and an internet-facing service.

Inputs: An invented organisation, five assets, three users and a simple data-flow diagram; no real personal data. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Inventory assets and owners

- Identify credible misuse cases

- Choose preventive and detective controls

- Explain residual risk and verification

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Security principles, risk and identity — transfer** — `lab.security-foundations-transfer`; 120–180 minutes, resumable.

Scenario: Assess a fictional small organisation with shared accounts, untested backups and an internet-facing service.

Inputs: An invented organisation, five assets, three users and a simple data-flow diagram; no real personal data. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Inventory assets and owners

- Identify credible misuse cases

- Choose preventive and detective controls

- Explain residual risk and verification

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.security-foundations-transfer`. Assess a fictional small organisation with shared accounts, untested backups and an internet-facing service. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Confusing a vulnerability with an incident

- Treating compliance as proof of security

- Ignoring people, asset value and operational impact

**Understand before progressing:** Distinguish threats, vulnerabilities, likelihood, impact, authentication, authorisation and control evidence.

**Able to do after completion:** Build an asset and risk register and justify proportionate controls for a small service.

**Project contributions:** Risk and identity design review (`project.risk-identity-review`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** No new shared-project gate yet; save this module’s contribution for its final contributing module.


### 09. Applied cryptography and modern identity

**Module ID:** `module.cryptography-identity`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Understand what cryptographic controls protect and how they fail in operation.

**Prerequisites and recommended preparation:** Security principles, risk and identity (`module.security-foundations`); Programming, data and Python for security (`module.programming`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 13.8–18.5 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 4.0–6.0 h.

**Learning objectives:**



- Distinguish reversible encoding from hashing

- Match symmetric and asymmetric techniques to a goal

- Explain certificate validation

- Explain salted password hashing

- Distinguish delegated access from authentication

**Topics:** Cryptography; Identity.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — reference; [TryHackMe Cyber Security 101](https://tryhackme.com/path/outline/cybersecurity101) — structured course.


#### Topic: Cryptography — `topic.cryptography-identity-cryptography`


##### Encoding, hashes and integrity

**Lesson ID:** `lesson.hashing-integrity`  
**Module:** `module.cryptography-identity`  
**Skill:** `skill.hashing-integrity`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Bits, bytes, text and encodings (`skill.data-representation`) ≥70; Assets, threats and security goals (`skill.security-goals`) ≥70

**Learning objectives:** Distinguish reversible encoding from hashing; Use hashes to compare file contents.

**Key concepts:** hash, digest, collision, integrity, encoding.

**Practical task — `exercise.hashing-integrity`:** Hash two identical dummy files and one modified copy; explain what matching hashes can and cannot establish.

**Evidence to save:** Hash comparison with trust limitations.

**Knowledge check — `assessment.hashing-integrity-check`:**

1. Does a matching hash prove who created a file?

2. Can a base64 string be decoded without a secret key?

**Mini challenge — `exercise.hashing-integrity-challenge`:** Explain why an attacker replacing both a file and its published hash defeats a naive integrity check.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Hash comparison with trust limitations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Encryption, signatures and key lifecycle

**Lesson ID:** `lesson.encryption-keys`  
**Module:** `module.cryptography-identity`  
**Skill:** `skill.encryption-keys`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Encoding, hashes and integrity (`skill.hashing-integrity`) ≥70; Authentication, authorisation and account lifecycle (`skill.iam-lifecycle`) ≥70

**Learning objectives:** Match symmetric and asymmetric techniques to a goal; Explain key storage and rotation.

**Key concepts:** symmetric, public key, signature, key exchange, rotation.

**Practical task — `exercise.encryption-keys`:** Draw a secure-message design using established libraries; identify encryption, signing and key-management responsibilities.

**Evidence to save:** Cryptographic design and key-lifecycle checklist.

**Knowledge check — `assessment.encryption-keys-check`:**

1. Does encryption alone necessarily identify the sender?

2. Which key verifies a public-key signature?

**Mini challenge — `exercise.encryption-keys-challenge`:** Plan recovery when a dummy signing key is exposed.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Cryptographic design and key-lifecycle checklist submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### TLS, certificates and trust chains

**Lesson ID:** `lesson.tls-pki`  
**Module:** `module.cryptography-identity`  
**Skill:** `skill.tls-pki`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Encryption, signatures and key lifecycle (`skill.encryption-keys`) ≥70; TCP, UDP, ports and connection state (`skill.tcp-ip-basics`) ≥70

**Learning objectives:** Explain certificate validation; Diagnose common TLS identity failures.

**Key concepts:** TLS, certificate, hostname, trust chain, expiry.

**Practical task — `exercise.tls-pki`:** Inspect a training TLS connection or certificate; record subject names, issuer and dates without disabling validation.

**Evidence to save:** TLS inspection with three failure explanations.

**Knowledge check — `assessment.tls-pki-check`:**

1. Does TLS prove the website’s business is honest?

2. Why is a hostname mismatch significant?

**Mini challenge — `exercise.tls-pki-challenge`:** Distinguish expiry, unknown issuer and wrong hostname from three examples.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- TLS inspection with three failure explanations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Identity — `topic.cryptography-identity-identity`


##### Password storage, MFA and recovery

**Lesson ID:** `lesson.passwords-mfa`  
**Module:** `module.cryptography-identity`  
**Skill:** `skill.passwords-mfa`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Encryption, signatures and key lifecycle (`skill.encryption-keys`) ≥70; Authentication, authorisation and account lifecycle (`skill.iam-lifecycle`) ≥70

**Learning objectives:** Explain salted password hashing; Evaluate MFA and recovery weaknesses.

**Key concepts:** salt, work factor, password hashing, MFA, recovery.

**Practical task — `exercise.passwords-mfa`:** Review a toy login design; choose an established password-hashing library and document reset and recovery controls.

**Evidence to save:** Password and recovery design review.

**Knowledge check — `assessment.passwords-mfa-check`:**

1. Why not store passwords with a fast general-purpose hash alone?

2. Can weak recovery bypass strong MFA?

**Mini challenge — `exercise.passwords-mfa-challenge`:** Identify how a recovery process could allow account takeover and propose a test.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Password and recovery design review submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Sessions, OAuth, OIDC and tokens

**Lesson ID:** `lesson.federation-tokens`  
**Module:** `module.cryptography-identity`  
**Skill:** `skill.federation-tokens`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Password storage, MFA and recovery (`skill.passwords-mfa`) ≥70; TLS, certificates and trust chains (`skill.tls-pki`) ≥70

**Learning objectives:** Distinguish delegated access from authentication; Explain token scope, expiry and validation.

**Key concepts:** session, OAuth, OIDC, JWT, audience.

**Practical task — `exercise.federation-tokens`:** Trace a simplified login and API call on paper; decode only a dummy JWT and inspect its claims.

**Evidence to save:** Annotated identity flow and validation checklist.

**Knowledge check — `assessment.federation-tokens-check`:**

1. Does decoding a JWT verify its signature?

2. Are OAuth and OIDC interchangeable?

**Mini challenge — `exercise.federation-tokens-challenge`:** Detect an audience mismatch in a synthetic token scenario.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Annotated identity flow and validation checklist submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Applied cryptography and modern identity — guided** — `lab.cryptography-identity-guided`; 90–150 minutes, resumable.

Scenario: Review a fictional app that uses base64 passwords, a leaked token and an expired test certificate.

Inputs: Dummy secrets, local hash utilities, a training certificate and synthetic authentication diagrams. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Compare hash and encryption goals

- Inspect certificate identity and dates

- Trace login and token use

- Recommend key handling and test the failure case

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Applied cryptography and modern identity — transfer** — `lab.cryptography-identity-transfer`; 120–180 minutes, resumable.

Scenario: Review a fictional app that uses base64 passwords, a leaked token and an expired test certificate.

Inputs: Dummy secrets, local hash utilities, a training certificate and synthetic authentication diagrams. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Compare hash and encryption goals

- Inspect certificate identity and dates

- Trace login and token use

- Recommend key handling and test the failure case

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.cryptography-identity-transfer`. Review a fictional app that uses base64 passwords, a leaked token and an expired test certificate. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Confusing encoding, hashing and encryption

- Designing custom cryptography

- Disabling certificate checks to hide configuration errors

**Understand before progressing:** Explain key roles, integrity checks, password storage, trust chains and token boundaries without implementing primitives.

**Able to do after completion:** Choose established cryptographic controls and diagnose an identity or TLS configuration issue.

**Project contributions:** Risk and identity design review (`project.risk-identity-review`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Risk and identity design review (`project.risk-identity-review`).


### 10. Web, JavaScript, HTTP and APIs

**Module ID:** `module.web-technologies`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Understand applications well enough to test and secure them intelligently.

**Prerequisites and recommended preparation:** Programming, data and Python for security (`module.programming`); Applied cryptography and modern identity (`module.cryptography-identity`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 22.8–33.5 hours, excluding the extra revision reserve. Required lessons 6.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 12.0–20.0 h.

**Learning objectives:**



- Trace a web request through components

- Read an HTTP exchange

- Read basic JavaScript and DOM changes

- Implement a small server route

- Trace a session lifecycle

- Document API inputs and access rules

**Topics:** Web model; Client programming; Server programming; Browser security; APIs.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [MDN Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development) — structured course; [The Python Tutorial](https://docs.python.org/3/tutorial/) — official documentation; [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — reference.


#### Topic: Web model — `topic.web-technologies-web-model`


##### Browser, server, HTML and trust boundaries

**Lesson ID:** `lesson.web-architecture`  
**Module:** `module.web-technologies`  
**Skill:** `skill.web-architecture`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** TLS, certificates and trust chains (`skill.tls-pki`) ≥70; Relational data and SQL queries (`skill.sql-data`) ≥70

**Learning objectives:** Trace a web request through components; Identify which component enforces a control.

**Key concepts:** HTML, CSS, DOM, server, database.

**Practical task — `exercise.web-architecture`:** Build a static local page and draw its future server and database boundaries.

**Evidence to save:** Local page and trust-boundary sketch.

**Knowledge check — `assessment.web-architecture-check`:**

1. Can a hidden HTML field be trusted as proof of permission?

2. Why separate browser and server responsibilities?

**Mini challenge — `exercise.web-architecture-challenge`:** Identify where access control belongs in a two-user notes app.

**Suggested resource types:** worked example, structured course, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Local page and trust-boundary sketch submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### HTTP methods, status, headers and cookies

**Lesson ID:** `lesson.http-messages`  
**Module:** `module.web-technologies`  
**Skill:** `skill.http-messages`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Browser, server, HTML and trust boundaries (`skill.web-architecture`) ≥70; TCP, UDP, ports and connection state (`skill.tcp-ip-basics`) ≥70

**Learning objectives:** Read an HTTP exchange; Explain state across requests.

**Key concepts:** method, status, header, body, cookie.

**Practical task — `exercise.http-messages`:** Use browser developer tools and a local request client to inspect your own page’s requests and responses.

**Evidence to save:** Annotated HTTP request and response.

**Knowledge check — `assessment.http-messages-check`:**

1. Does a 200 response always mean the intended action succeeded?

2. Why are cookies often needed?

**Mini challenge — `exercise.http-messages-challenge`:** Explain a redirect chain and which response sets a cookie.

**Suggested resource types:** worked example, structured course, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Annotated HTTP request and response submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Client programming — `topic.web-technologies-client-programming`


##### JavaScript, events and asynchronous requests

**Lesson ID:** `lesson.javascript-basics`  
**Module:** `module.web-technologies`  
**Skill:** `skill.javascript-basics`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** HTTP methods, status, headers and cookies (`skill.http-messages`) ≥70; Variables, types and control flow (`skill.code-control-flow`) ≥70

**Learning objectives:** Read basic JavaScript and DOM changes; Handle asynchronous request success and failure.

**Key concepts:** let/const, function, event, fetch, promise.

**Practical task — `exercise.javascript-basics`:** Add a button that requests dummy JSON from a local server and updates text safely; handle a failed response.

**Evidence to save:** Small JS client with success and error demonstrations.

**Knowledge check — `assessment.javascript-basics-check`:**

1. Why can async work finish after the surrounding code?

2. Why can inserting untrusted HTML be dangerous?

**Mini challenge — `exercise.javascript-basics-challenge`:** Fix a UI that shows success before the request has completed.

**Suggested resource types:** worked example, structured course, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Small JS client with success and error demonstrations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Server programming — `topic.web-technologies-server-programming`


##### Server routes, validation and database operations

**Lesson ID:** `lesson.backend-database`  
**Module:** `module.web-technologies`  
**Skill:** `skill.backend-database`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** JavaScript, events and asynchronous requests (`skill.javascript-basics`) ≥70; Relational data and SQL queries (`skill.sql-data`) ≥70; Tests, dependencies and safe tool use (`skill.testing-safe-code`) ≥70

**Learning objectives:** Implement a small server route; Validate input and parameterise queries.

**Key concepts:** route, request validation, parameter binding, transaction, error.

**Practical task — `exercise.backend-database`:** Build a local add/list note endpoint using parameterised SQLite access and consistent error responses.

**Evidence to save:** Local endpoint with valid and invalid input tests.

**Knowledge check — `assessment.backend-database-check`:**

1. Why is string concatenation a poor way to build SQL with input?

2. Should server validation rely on a disabled UI button?

**Mini challenge — `exercise.backend-database-challenge`:** Reject a malformed note without corrupting the database.

**Suggested resource types:** worked example, structured course, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Local endpoint with valid and invalid input tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Browser security — `topic.web-technologies-browser-security`


##### Sessions, same-origin policy and browser boundaries

**Lesson ID:** `lesson.web-sessions`  
**Module:** `module.web-technologies`  
**Skill:** `skill.web-sessions`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Server routes, validation and database operations (`skill.backend-database`) ≥70; Sessions, OAuth, OIDC and tokens (`skill.federation-tokens`) ≥70

**Learning objectives:** Trace a session lifecycle; Distinguish origin checks from authorisation.

**Key concepts:** origin, cookie flags, session expiry, CORS, CSRF concept.

**Practical task — `exercise.web-sessions`:** Use two dummy users to inspect login, logout and ownership checks in the local app.

**Evidence to save:** Session flow and negative access tests.

**Knowledge check — `assessment.web-sessions-check`:**

1. Does CORS enforce all server-side access control?

2. Why should logout invalidate the relevant session?

**Mini challenge — `exercise.web-sessions-challenge`:** Demonstrate that a logged-out session is rejected in the lab.

**Suggested resource types:** worked example, structured course, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Session flow and negative access tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: APIs — `topic.web-technologies-apis`


##### REST, JSON APIs and observable behaviour

**Lesson ID:** `lesson.api-design`  
**Module:** `module.web-technologies`  
**Skill:** `skill.api-design`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Sessions, same-origin policy and browser boundaries (`skill.web-sessions`) ≥70

**Learning objectives:** Document API inputs and access rules; Use logs to follow a request without recording secrets.

**Key concepts:** REST, JSON, schema, pagination, request ID.

**Practical task — `exercise.api-design`:** Document three routes for the local app and add correlation IDs to safe request logs.

**Evidence to save:** API contract and request/response test set.

**Knowledge check — `assessment.api-design-check`:**

1. Why must object access be checked on every relevant route?

2. Why avoid logging full credentials or tokens?

**Mini challenge — `exercise.api-design-challenge`:** Test a missing field, unauthorised object and empty result with explicit expected responses.

**Suggested resource types:** worked example, structured course, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- API contract and request/response test set submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Web, JavaScript, HTTP and APIs — guided** — `lab.web-technologies-guided`; 90–150 minutes, resumable.

Scenario: Build a localhost-only notes application with two test users, a database and structured request logs.

Inputs: A local development server, browser developer tools, SQLite and a small dummy dataset; framework chosen by learner. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Trace a request from UI to database

- Inspect headers and cookies

- Implement a parameterised database operation

- Test two-user access decisions

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Web, JavaScript, HTTP and APIs — transfer** — `lab.web-technologies-transfer`; 120–180 minutes, resumable.

Scenario: Build a localhost-only notes application with two test users, a database and structured request logs.

Inputs: A local development server, browser developer tools, SQLite and a small dummy dataset; framework chosen by learner. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Trace a request from UI to database

- Inspect headers and cookies

- Implement a parameterised database operation

- Test two-user access decisions

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.web-technologies-transfer`. Build a localhost-only notes application with two test users, a database and structured request logs. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Assuming browser validation protects the server

- Confusing client-side state with trusted data

- Learning attack names before understanding requests and data flows

**Understand before progressing:** Explain browser/server boundaries, requests, JavaScript, sessions, APIs and database access.

**Able to do after completion:** Build and inspect a small local application using dummy data and test accounts.

**Project contributions:** Build a small local web application (`project.local-web-app`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Build a small local web application (`project.local-web-app`).


### 11. Hardening, resilience and system design

**Module ID:** `module.secure-systems`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Apply core concepts to a small service and introduce cloud and container boundaries before specialisation.

**Prerequisites and recommended preparation:** Web, JavaScript, HTTP and APIs (`module.web-technologies`); Security principles, risk and identity (`module.security-foundations`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 13.8–19.5 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 4.0–7.0 h.

**Learning objectives:**



- Identify assets and trust boundaries

- Reduce unnecessary host exposure

- Design explicit allowed network flows

- Define recovery objectives

- Compare IaaS, PaaS and SaaS responsibilities

**Topics:** System design; Controls; Resilience; Modern infrastructure.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) — reference; [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — reference; [Microsoft Learn for Azure](https://learn.microsoft.com/en-us/training/azure/) — structured course.


#### Topic: System design — `topic.secure-systems-system-design`


##### Threat modelling a small service

**Lesson ID:** `lesson.threat-modelling`  
**Module:** `module.secure-systems`  
**Skill:** `skill.threat-modelling`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** REST, JSON APIs and observable behaviour (`skill.api-design`) ≥70; Risk, impact and proportionate decisions (`skill.risk-prioritisation`) ≥70

**Learning objectives:** Identify assets and trust boundaries; Translate a threat into a testable control.

**Key concepts:** data-flow diagram, entry point, trust boundary, misuse case, STRIDE.

**Practical task — `exercise.threat-modelling`:** Draw the notes app and identify at least five credible threats with mitigation and verification ideas.

**Evidence to save:** Threat model with assumptions and verification ideas.

**Knowledge check — `assessment.threat-modelling-check`:**

1. Why begin with system boundaries?

2. Is a threat model a one-time document?

**Mini challenge — `exercise.threat-modelling-challenge`:** Add an external integration and update one threat and control.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Threat model with assumptions and verification ideas submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Controls — `topic.secure-systems-controls`


##### Baseline hardening and change control

**Lesson ID:** `lesson.host-hardening`  
**Module:** `module.secure-systems`  
**Skill:** `skill.host-hardening`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Threat modelling a small service (`skill.threat-modelling`) ≥70; Updates, endpoint controls and recovery (`skill.windows-hardening`) ≥70; SSH, sockets and Linux investigation (`skill.linux-network-investigation`) ≥70

**Learning objectives:** Reduce unnecessary host exposure; Verify a reversible baseline change.

**Key concepts:** patching, least services, configuration, change record, rollback.

**Practical task — `exercise.host-hardening`:** Review one disposable Linux or Windows host; disable an unnecessary lab service and verify the intended service still works.

**Evidence to save:** Hardening diff, functionality test and rollback note.

**Knowledge check — `assessment.host-hardening-check`:**

1. Why check functionality after hardening?

2. Why record exceptions?

**Mini challenge — `exercise.host-hardening-challenge`:** Explain when a proposed control costs more than the risk reduction.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Hardening diff, functionality test and rollback note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Firewalls, segmentation and secure administration

**Lesson ID:** `lesson.network-controls`  
**Module:** `module.secure-systems`  
**Skill:** `skill.network-controls`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Baseline hardening and change control (`skill.host-hardening`) ≥70; Troubleshoot segmentation and connectivity (`skill.network-diagnostics`) ≥70

**Learning objectives:** Design explicit allowed network flows; Test both allowed and denied connectivity.

**Key concepts:** ingress, egress, management plane, VPN, segmentation.

**Practical task — `exercise.network-controls`:** Create a small flow matrix for app, database and administration; test one allow and one deny in a private lab or simulator.

**Evidence to save:** Flow policy and positive/negative connectivity evidence.

**Knowledge check — `assessment.network-controls-check`:**

1. Why test denied traffic as well as allowed traffic?

2. Does putting a database on a private address guarantee isolation?

**Mini challenge — `exercise.network-controls-challenge`:** Find a management interface accidentally reachable by an ordinary client.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Flow policy and positive/negative connectivity evidence submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Resilience — `topic.secure-systems-resilience`


##### Backups, recovery and operational continuity

**Lesson ID:** `lesson.backup-resilience`  
**Module:** `module.secure-systems`  
**Skill:** `skill.backup-resilience`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Baseline hardening and change control (`skill.host-hardening`) ≥70; Software installation, updates and recovery (`skill.software-recovery`) ≥70

**Learning objectives:** Define recovery objectives; Demonstrate a restore against them.

**Key concepts:** RPO, RTO, backup isolation, restore, dependency.

**Practical task — `exercise.backup-resilience`:** Back up dummy app data, remove only the working copy and restore it; measure elapsed time and data loss.

**Evidence to save:** Restore evidence and measured recovery objectives.

**Knowledge check — `assessment.backup-resilience-check`:**

1. What is the difference between RPO and RTO?

2. Why include dependencies in a recovery plan?

**Mini challenge — `exercise.backup-resilience-challenge`:** Explain how a backup stored under the same compromised account could fail.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Restore evidence and measured recovery objectives submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Modern infrastructure — `topic.secure-systems-modern-infrastructure`


##### Cloud, virtual machines and containers

**Lesson ID:** `lesson.cloud-container-overview`  
**Module:** `module.secure-systems`  
**Skill:** `skill.cloud-container-overview`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Firewalls, segmentation and secure administration (`skill.network-controls`) ≥70; Backups, recovery and operational continuity (`skill.backup-resilience`) ≥70

**Learning objectives:** Compare IaaS, PaaS and SaaS responsibilities; Distinguish containers from VMs.

**Key concepts:** shared responsibility, control plane, managed service, container, tenant.

**Practical task — `exercise.cloud-container-overview`:** Map the same small app onto a VM, managed platform and SaaS service; assign identity, patching, backup and logging responsibilities.

**Evidence to save:** Responsibility matrix expressed as a short structured list.

**Knowledge check — `assessment.cloud-container-overview-check`:**

1. Does managed hosting remove responsibility for access policy?

2. Is a container a separate full guest operating system?

**Mini challenge — `exercise.cloud-container-overview-challenge`:** Identify the owner of a misconfigured storage permission in each deployment model.

**Suggested resource types:** worked example, reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Responsibility matrix expressed as a short structured list submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Hardening, resilience and system design — guided** — `lab.secure-systems-guided`; 90–150 minutes, resumable.

Scenario: Review the local notes service, limit its exposure, test a backup restore and model its move to a managed cloud service.

Inputs: The local notes app or a fictional equivalent; dummy backup; small network and cloud-responsibility diagrams. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Linux environment (`environment.linux`); Disposable Windows environment (`environment.windows`); Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Map assets and trust boundaries

- Apply one least-privilege change

- Test a recovery with dummy data

- Compare on-premises and managed-service responsibilities

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Hardening, resilience and system design — transfer** — `lab.secure-systems-transfer`; 120–180 minutes, resumable.

Scenario: Review the local notes service, limit its exposure, test a backup restore and model its move to a managed cloud service.

Inputs: The local notes app or a fictional equivalent; dummy backup; small network and cloud-responsibility diagrams. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Linux environment (`environment.linux`); Disposable Windows environment (`environment.windows`); Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Map assets and trust boundaries

- Apply one least-privilege change

- Test a recovery with dummy data

- Compare on-premises and managed-service responsibilities

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.secure-systems-transfer`. Review the local notes service, limit its exposure, test a backup restore and model its move to a managed cloud service. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Applying a checklist without understanding the service

- Testing backup creation but never recovery

- Assuming cloud services remove customer responsibility

**Understand before progressing:** Explain threat boundaries, hardening tradeoffs, segmentation, recovery objectives and shared responsibility.

**Able to do after completion:** Harden a small service, verify critical controls and document a recovery plan.

**Project contributions:** Windows baseline and recovery (`project.windows-baseline`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Windows baseline and recovery (`project.windows-baseline`).


### 12. Vulnerability assessment and remediation

**Module ID:** `module.vulnerability-assessment`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Learn to find, verify, prioritise and retest weaknesses without confusing scanner output with proof.

**Prerequisites and recommended preparation:** Hardening, resilience and system design (`module.secure-systems`); Shell automation, Git and reproducible work (`module.automation-git`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 19.8–28.5 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 10.0–16.0 h.

**Learning objectives:**



- Write a bounded assessment plan

- Identify services on explicit lab endpoints

- Confirm a weakness using independent evidence

- Distinguish technical severity from priority

- Write a reproducible finding

**Topics:** Assessment method; Discovery; Validation; Communication.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Nmap Reference Guide](https://nmap.org/book/man.html) — official documentation; [NIST SP 800-115](https://csrc.nist.gov/pubs/sp/800/115/final) — reference; [FIRST CVSS](https://www.first.org/cvss/) — reference; [OWASP Web Security Testing Guide](https://owasp.org/projects/web-security-testing-guide) — reference.


#### Topic: Assessment method — `topic.vulnerability-assessment-assessment-method`


##### Assessment scope and safe test planning

**Lesson ID:** `lesson.assessment-scope`  
**Module:** `module.vulnerability-assessment`  
**Skill:** `skill.assessment-scope`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Permission, boundaries and stop conditions (`skill.authorised-scope`) ≥70; Cloud, virtual machines and containers (`skill.cloud-container-overview`) ≥70; Documentation and reproducible tooling (`skill.reproducible-tooling`) ≥70

**Learning objectives:** Write a bounded assessment plan; Choose evidence proportionate to the question.

**Key concepts:** scope, rate limit, maintenance window, stop rule, test accounts.

**Practical task — `exercise.assessment-scope`:** Prepare a plan for one disposable service including excluded actions, backup verification and a finding template.

**Evidence to save:** Approved-by-owner lab scope and test plan.

**Knowledge check — `assessment.assessment-scope-check`:**

1. Does permission to view a website imply permission to scan its hosting network?

2. Why define stop conditions in advance?

**Mini challenge — `exercise.assessment-scope-challenge`:** Amend the plan when a dependency belongs to a third party.

**Suggested resource types:** worked example, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Approved-by-owner lab scope and test plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Discovery — `topic.vulnerability-assessment-discovery`


##### Inventory and low-impact service discovery

**Lesson ID:** `lesson.service-discovery`  
**Module:** `module.vulnerability-assessment`  
**Skill:** `skill.service-discovery`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Assessment scope and safe test planning (`skill.assessment-scope`) ≥70; TCP, UDP, ports and connection state (`skill.tcp-ip-basics`) ≥70

**Learning objectives:** Identify services on explicit lab endpoints; Separate observation from fingerprint inference.

**Key concepts:** allowlist, TCP connect scan, service banner, version, uncertainty.

**Practical task — `exercise.service-discovery`:** Inspect local sockets first, then run a limited service scan only against the known lab host and selected ports.

**Evidence to save:** Scoped inventory with source and confidence.

**Knowledge check — `assessment.service-discovery-check`:**

1. Does a banner reliably prove patch status?

2. Why start with an exact allowlist?

**Mini challenge — `exercise.service-discovery-challenge`:** Explain why a filtered port differs from a proven absent service.

**Suggested resource types:** worked example, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Scoped inventory with source and confidence submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Validation — `topic.vulnerability-assessment-validation`


##### Validate scanner and configuration findings

**Lesson ID:** `lesson.vulnerability-validation`  
**Module:** `module.vulnerability-assessment`  
**Skill:** `skill.vulnerability-validation`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Inventory and low-impact service discovery (`skill.service-discovery`) ≥70; Baseline hardening and change control (`skill.host-hardening`) ≥70

**Learning objectives:** Confirm a weakness using independent evidence; Identify a false positive.

**Key concepts:** CVE, CWE, advisory, configuration, false positive.

**Practical task — `exercise.vulnerability-validation`:** Compare a scanner claim with the vendor advisory and installed configuration in a disposable lab; record confirmed, rejected or uncertain.

**Evidence to save:** Validation worksheet with evidence and uncertainty.

**Knowledge check — `assessment.vulnerability-validation-check`:**

1. Is a matching product name sufficient to establish vulnerability?

2. Why keep an uncertain status?

**Mini challenge — `exercise.vulnerability-validation-challenge`:** Find one environmental condition that prevents the reported issue from applying.

**Suggested resource types:** worked example, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Validation worksheet with evidence and uncertainty submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Severity, exploitability and remediation order

**Lesson ID:** `lesson.finding-priority`  
**Module:** `module.vulnerability-assessment`  
**Skill:** `skill.finding-priority`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Validate scanner and configuration findings (`skill.vulnerability-validation`) ≥70; Risk, impact and proportionate decisions (`skill.risk-prioritisation`) ≥70

**Learning objectives:** Distinguish technical severity from priority; Recommend proportionate treatment.

**Key concepts:** CVSS, exposure, exploitability, asset value, compensating control.

**Practical task — `exercise.finding-priority`:** Rank three validated lab findings, including one low-severity issue on a valuable asset and one isolated high-severity issue.

**Evidence to save:** Prioritised remediation backlog.

**Knowledge check — `assessment.finding-priority-check`:**

1. Is CVSS a complete business risk score?

2. Why record the scoring version and assumptions?

**Mini challenge — `exercise.finding-priority-challenge`:** Re-prioritise after a service is isolated or an effective workaround is verified.

**Suggested resource types:** worked example, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Prioritised remediation backlog submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Communication — `topic.vulnerability-assessment-communication`


##### Findings, remediation and retest

**Lesson ID:** `lesson.security-reporting`  
**Module:** `module.vulnerability-assessment`  
**Skill:** `skill.security-reporting`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Severity, exploitability and remediation order (`skill.finding-priority`) ≥70; Evidence, privacy and reproducible notes (`skill.technical-notes`) ≥70

**Learning objectives:** Write a reproducible finding; Distinguish a proposed fix from verified closure.

**Key concepts:** evidence, impact, reproduction, recommendation, retest.

**Practical task — `exercise.security-reporting`:** Write one finding with scope, evidence, impact, fix and limitations; repair it in the lab and record a retest.

**Evidence to save:** Assessment report and before/after retest.

**Knowledge check — `assessment.security-reporting-check`:**

1. What closes a finding with confidence?

2. Why include limitations?

**Mini challenge — `exercise.security-reporting-challenge`:** Rewrite the finding for a technical owner and a nontechnical manager.

**Suggested resource types:** worked example, official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Assessment report and before/after retest submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Vulnerability assessment and remediation — guided** — `lab.vulnerability-assessment-guided`; 90–150 minutes, resumable.

Scenario: Assess a disposable two-service host, confirm one configuration weakness and one scanner false positive, then retest a repair.

Inputs: A private training host, exact allowlist, benign service configurations and either a limited scan or synthetic scan export. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`); Disposable Linux environment (`environment.linux`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Confirm scope and recovery

- Inventory only allowed services

- Validate a suspected weakness against configuration

- Write and retest the smallest useful finding

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Vulnerability assessment and remediation — transfer** — `lab.vulnerability-assessment-transfer`; 120–180 minutes, resumable.

Scenario: Assess a disposable two-service host, confirm one configuration weakness and one scanner false positive, then retest a repair.

Inputs: A private training host, exact allowlist, benign service configurations and either a limited scan or synthetic scan export. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`); Disposable Linux environment (`environment.linux`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Confirm scope and recovery

- Inventory only allowed services

- Validate a suspected weakness against configuration

- Write and retest the smallest useful finding

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.vulnerability-assessment-transfer`. Assess a disposable two-service host, confirm one configuration weakness and one scanner false positive, then retest a repair. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Scanning beyond the agreed assets

- Copying scanner severity into a report without validation

- Failing to retest the fix

**Understand before progressing:** Explain asset scope, discovery, configuration review, validation, contextual risk and remediation evidence.

**Able to do after completion:** Produce a small scoped assessment with defensible findings and a retest record.

**Project contributions:** A scoped vulnerability assessment (`project.scoped-assessment`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** A scoped vulnerability assessment (`project.scoped-assessment`).


### 13. Defensive security, logs and SOC foundations

**Module ID:** `module.defensive-foundations`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Introduce investigation, evidence and operational decisions before choosing a specialism.

**Prerequisites and recommended preparation:** Vulnerability assessment and remediation (`module.vulnerability-assessment`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 25.8–36.5 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 16.0–24.0 h.

**Learning objectives:**



- Identify useful event sources

- Build a cross-source timeline

- Prioritise an alert by context

- Map behaviour to a useful detection idea

- Choose a proportionate first response

**Topics:** Telemetry; Investigation; Operations.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [MITRE ATT&CK](https://attack.mitre.org/) — reference; [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — reference; [Wazuh documentation](https://documentation.wazuh.com/current/) — official documentation; [TryHackMe Cyber Security 101](https://tryhackme.com/path/outline/cybersecurity101) — structured course.


#### Topic: Telemetry — `topic.defensive-foundations-telemetry`


##### Events, logs and telemetry quality

**Lesson ID:** `lesson.telemetry-basics`  
**Module:** `module.defensive-foundations`  
**Skill:** `skill.telemetry-basics`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Event logs, time and audit context (`skill.windows-events`) ≥70; Processes, packages and service logs (`skill.linux-services`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70

**Learning objectives:** Identify useful event sources; Assess collection quality before drawing conclusions.

**Key concepts:** event, source, timestamp, retention, coverage.

**Practical task — `exercise.telemetry-basics`:** Create five synthetic host and app events; document what each records and what remains invisible.

**Evidence to save:** Telemetry inventory and quality notes.

**Knowledge check — `assessment.telemetry-basics-check`:**

1. Does collecting many logs guarantee useful visibility?

2. Why record time zones and clock offset?

**Mini challenge — `exercise.telemetry-basics-challenge`:** Find a collection gap that could reverse an initial conclusion.

**Suggested resource types:** worked example, reference, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Telemetry inventory and quality notes submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Investigation — `topic.defensive-foundations-investigation`


##### Filtering, timelines and competing hypotheses

**Lesson ID:** `lesson.log-analysis`  
**Module:** `module.defensive-foundations`  
**Skill:** `skill.log-analysis`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Events, logs and telemetry quality (`skill.telemetry-basics`) ≥70; Files, CSV, JSON and timestamps (`skill.structured-data`) ≥70; Relational data and SQL queries (`skill.sql-data`) ≥70

**Learning objectives:** Build a cross-source timeline; Distinguish observation from hypothesis.

**Key concepts:** correlation, duplicate, baseline, timeline, confidence.

**Practical task — `exercise.log-analysis`:** Use your parser to correlate a small synthetic login and web sequence; retain benign and suspicious explanations.

**Evidence to save:** Timeline with two hypotheses and next checks.

**Knowledge check — `assessment.log-analysis-check`:**

1. Does temporal proximity prove causation?

2. Why preserve duplicate-handling rules?

**Mini challenge — `exercise.log-analysis-challenge`:** Add a benign explanation and identify the evidence that would distinguish it.

**Suggested resource types:** worked example, reference, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Timeline with two hypotheses and next checks submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Operations — `topic.defensive-foundations-operations`


##### SOC workflow and alert triage

**Lesson ID:** `lesson.soc-triage`  
**Module:** `module.defensive-foundations`  
**Skill:** `skill.soc-triage`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Filtering, timelines and competing hypotheses (`skill.log-analysis`) ≥70; Risk, impact and proportionate decisions (`skill.risk-prioritisation`) ≥70

**Learning objectives:** Prioritise an alert by context; Write a useful escalation ticket.

**Key concepts:** alert, incident, severity, triage, handoff.

**Practical task — `exercise.soc-triage`:** Triage a synthetic failed-login alert using asset value, expected behaviour and follow-on events; write a concise ticket.

**Evidence to save:** Triage ticket and disposition rationale.

**Knowledge check — `assessment.soc-triage-check`:**

1. Is an alert automatically a confirmed incident?

2. What makes a ticket useful to the next analyst?

**Mini challenge — `exercise.soc-triage-challenge`:** Close a benign alert while retaining enough evidence for review.

**Suggested resource types:** worked example, reference, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Triage ticket and disposition rationale submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Attacker behaviour and defensive visibility

**Lesson ID:** `lesson.attack-defence-mapping`  
**Module:** `module.defensive-foundations`  
**Skill:** `skill.attack-defence-mapping`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** SOC workflow and alert triage (`skill.soc-triage`) ≥70; Assets, threats and security goals (`skill.security-goals`) ≥70

**Learning objectives:** Map behaviour to a useful detection idea; Distinguish a technique from a signature.

**Key concepts:** tactic, technique, observable, indicator, detection gap.

**Practical task — `exercise.attack-defence-mapping`:** Describe a benign simulated sequence and map behaviours to MITRE ATT&CK concepts; name the telemetry needed.

**Evidence to save:** Behaviour-to-telemetry map with coverage gaps.

**Knowledge check — `assessment.attack-defence-mapping-check`:**

1. Does an ATT&CK mapping prove a detection works?

2. Why can static indicators become stale?

**Mini challenge — `exercise.attack-defence-mapping-challenge`:** Propose a behaviour-based check when a file hash changes.

**Suggested resource types:** worked example, reference, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Behaviour-to-telemetry map with coverage gaps submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Containment, escalation and recovery basics

**Lesson ID:** `lesson.response-basics`  
**Module:** `module.defensive-foundations`  
**Skill:** `skill.response-basics`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Attacker behaviour and defensive visibility (`skill.attack-defence-mapping`) ≥70; Backups, recovery and operational continuity (`skill.backup-resilience`) ≥70

**Learning objectives:** Choose a proportionate first response; Preserve evidence and communicate uncertainty.

**Key concepts:** containment, preservation, escalation, recovery, lessons learned.

**Practical task — `exercise.response-basics`:** Run a tabletop for a compromised dummy account; decide what to preserve, revoke, notify internally and verify after recovery.

**Evidence to save:** Response checklist and tabletop decision log.

**Knowledge check — `assessment.response-basics-check`:**

1. Why can immediate wiping harm an investigation?

2. Why agree on an incident owner?

**Mini challenge — `exercise.response-basics-challenge`:** Choose a less disruptive containment action for a critical service.

**Suggested resource types:** worked example, reference, official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Response checklist and tabletop decision log submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Defensive security, logs and SOC foundations — guided** — `lab.defensive-foundations-guided`; 90–150 minutes, resumable.

Scenario: Triage a failed-login burst followed by a successful test login using synthetic host and application logs.

Inputs: Synthetic auth, web and host-event files containing benign noise, duplicates, a clock offset and one documented suspicious sequence. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); SIEM or lightweight query lab (`environment.siem`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Check timestamps and collection gaps

- Build a short timeline

- Compare a benign and suspicious explanation

- Escalate or close with evidence and limitations

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Defensive security, logs and SOC foundations — transfer** — `lab.defensive-foundations-transfer`; 120–180 minutes, resumable.

Scenario: Triage a failed-login burst followed by a successful test login using synthetic host and application logs.

Inputs: Synthetic auth, web and host-event files containing benign noise, duplicates, a clock offset and one documented suspicious sequence. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); SIEM or lightweight query lab (`environment.siem`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Check timestamps and collection gaps

- Build a short timeline

- Compare a benign and suspicious explanation

- Escalate or close with evidence and limitations

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.defensive-foundations-transfer`. Triage a failed-login burst followed by a successful test login using synthetic host and application logs. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Treating every alert as an incident

- Ignoring logging gaps and clock differences

- Containing a host without considering evidence and business impact

**Understand before progressing:** Explain event versus alert versus incident, telemetry limits, triage and escalation.

**Able to do after completion:** Analyse a small suspicious sequence and produce a defensible triage ticket.

**Project contributions:** Core capstone: investigate and improve a small service (`project.core-investigation`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Core capstone: investigate and improve a small service (`project.core-investigation`).


### 14. Professional practice, portfolio and job preparation

**Module ID:** `module.career-portfolio`  
**Path:** core  
**Difficulty:** Foundation application

**Purpose:** Convert evidence into credible applications and an ongoing learning plan.

**Prerequisites and recommended preparation:** Defensive security, logs and SOC foundations (`module.defensive-foundations`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 17.8–24.5 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 3.5–5.5 h; module assessment/delayed check 1.3–2.0 h; allocated project work 8.0–12.0 h.

**Learning objectives:**



- Compare role tasks rather than titles alone

- Select evidence of process and judgement

- Communicate actionable findings

- Translate projects into specific evidence

- Assess readiness against observed tasks

**Topics:** Career planning; Portfolio; Work practice; Career preparation.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [NIST NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions) — reference; [Pro Git](https://git-scm.com/book/en/v2) — reference.


#### Topic: Career planning — `topic.career-portfolio-career-planning`


##### Understand roles and select a first target

**Lesson ID:** `lesson.role-selection`  
**Module:** `module.career-portfolio`  
**Skill:** `skill.role-selection`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Learning through evidence (`skill.learning-evidence`) ≥70; Assets, threats and security goals (`skill.security-goals`) ≥70

**Learning objectives:** Compare role tasks rather than titles alone; Select a realistic next learning focus.

**Key concepts:** SOC, IT support, security operations, AppSec, cloud operations.

**Practical task — `exercise.role-selection`:** Compare three current job descriptions when available; mark mandatory versus desirable requirements and map existing evidence.

**Evidence to save:** Role task comparison and selected target.

**Knowledge check — `assessment.role-selection-check`:**

1. Do all cybersecurity roles require advanced penetration testing?

2. Why include IT support and operations routes?

**Mini challenge — `exercise.role-selection-challenge`:** Explain why one role fits your present evidence better than another.

**Suggested resource types:** worked example, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Role task comparison and selected target submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Portfolio — `topic.career-portfolio-portfolio`


##### Build an honest, useful portfolio

**Lesson ID:** `lesson.portfolio-evidence`  
**Module:** `module.career-portfolio`  
**Skill:** `skill.portfolio-evidence`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Findings, remediation and retest (`skill.security-reporting`) ≥70; Documentation and reproducible tooling (`skill.reproducible-tooling`) ≥70

**Learning objectives:** Select evidence of process and judgement; Redact and label lab work accurately.

**Key concepts:** README, scope, evidence, limitations, reproducibility.

**Practical task — `exercise.portfolio-evidence`:** Turn one project into a public-safe case study with problem, method, result, fix and reflection.

**Evidence to save:** Redacted case study and evidence index.

**Knowledge check — `assessment.portfolio-evidence-check`:**

1. Why is a screenshot of a completion badge insufficient by itself?

2. What should be labelled when AI helped?

**Mini challenge — `exercise.portfolio-evidence-challenge`:** Remove a sensitive field without making the result impossible to understand.

**Suggested resource types:** worked example, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Redacted case study and evidence index submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Work practice — `topic.career-portfolio-work-practice`


##### Tickets, handoffs and responsible disclosure

**Lesson ID:** `lesson.professional-communication`  
**Module:** `module.career-portfolio`  
**Skill:** `skill.professional-communication`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Build an honest, useful portfolio (`skill.portfolio-evidence`) ≥70; SOC workflow and alert triage (`skill.soc-triage`) ≥70

**Learning objectives:** Communicate actionable findings; Follow agreed reporting channels.

**Key concepts:** audience, impact, handoff, scope, disclosure.

**Practical task — `exercise.professional-communication`:** Write a handoff for a lab finding and a separate owner-facing disclosure draft; do not contact real targets for this exercise.

**Evidence to save:** Technical handoff and owner-facing draft.

**Knowledge check — `assessment.professional-communication-check`:**

1. Why follow the owner’s agreed disclosure channel?

2. What should a handoff make clear?

**Mini challenge — `exercise.professional-communication-challenge`:** Answer a stakeholder who asks for certainty the evidence cannot support.

**Suggested resource types:** worked example, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Technical handoff and owner-facing draft submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Career preparation — `topic.career-portfolio-career-preparation`


##### Applications, technical interviews and demonstrations

**Lesson ID:** `lesson.applications-interviews`  
**Module:** `module.career-portfolio`  
**Skill:** `skill.applications-interviews`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Tickets, handoffs and responsible disclosure (`skill.professional-communication`) ≥70; Understand roles and select a first target (`skill.role-selection`) ≥70

**Learning objectives:** Translate projects into specific evidence; Explain a technical decision under questions.

**Key concepts:** CV evidence, STAR, technical demonstration, tradeoff, unknowns.

**Practical task — `exercise.applications-interviews`:** Write three truthful project-based CV bullets and practise a ten-minute demonstration with a failure case.

**Evidence to save:** CV bullets, demonstration outline and reflection.

**Knowledge check — `assessment.applications-interviews-check`:**

1. Why avoid claiming employment experience from a personal lab?

2. How should you respond when you do not know an answer?

**Mini challenge — `exercise.applications-interviews-challenge`:** Explain the same project to a hiring manager and an engineer.

**Suggested resource types:** worked example, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- CV bullets, demonstration outline and reflection submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Readiness review and continuing development

**Lesson ID:** `lesson.learning-roadmap`  
**Module:** `module.career-portfolio`  
**Skill:** `skill.learning-roadmap`  
**Difficulty:** Foundation application

**Estimated duration:** 60 minutes standard; 45 for a compact complete attempt when feasible; 90 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Applications, technical interviews and demonstrations (`skill.applications-interviews`) ≥70; Containment, escalation and recovery basics (`skill.response-basics`) ≥70

**Learning objectives:** Assess readiness against observed tasks; Choose a focused next-quarter plan.

**Key concepts:** skills gap, mentoring, certification fit, practice, review.

**Practical task — `exercise.learning-roadmap`:** Review core evidence and a selected branch plan; choose at most three priorities and a realistic weekly workload.

**Evidence to save:** Readiness review and focused 12-week plan.

**Knowledge check — `assessment.learning-roadmap-check`:**

1. Does finishing the whole curriculum guarantee employment?

2. Should certifications replace practical evidence?

**Mini challenge — `exercise.learning-roadmap-challenge`:** Remove one low-value certification or topic from an overloaded plan and justify the decision.

**Suggested resource types:** worked example, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Readiness review and focused 12-week plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Professional practice, portfolio and job preparation — guided** — `lab.career-portfolio-guided`; 90–150 minutes, resumable.

Scenario: Present one core investigation and one role-specific project; answer follow-up questions without the walkthrough.

Inputs: Your redacted project records, a selected role description and a reusable portfolio template. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Map role tasks to evidence

- Review one project for reproducibility and privacy

- Practise a technical explanation

- Identify a small set of remaining gaps

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Professional practice, portfolio and job preparation — transfer** — `lab.career-portfolio-transfer`; 120–180 minutes, resumable.

Scenario: Present one core investigation and one role-specific project; answer follow-up questions without the walkthrough.

Inputs: Your redacted project records, a selected role description and a reusable portfolio template. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Map role tasks to evidence

- Review one project for reproducibility and privacy

- Practise a technical explanation

- Identify a small set of remaining gaps

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.career-portfolio-transfer`. Present one core investigation and one role-specific project; answer follow-up questions without the walkthrough. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Waiting until every specialism is finished before applying

- Calling guided lab completion independent professional experience

- Publishing credentials, client data or restricted challenge solutions

**Understand before progressing:** Explain your contribution, limits, evidence and relevant role requirements honestly.

**Able to do after completion:** Present a portfolio, handle a technical handoff and target realistic next roles.

**Project contributions:** A role-focused portfolio and application pack (`project.portfolio-pack`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** A role-focused portfolio and application pack (`project.portfolio-pack`).


### 15. Web application and API security testing

**Module ID:** `module.web-security`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Test the security properties of applications using explicit hypotheses and controlled labs.

**Prerequisites and recommended preparation:** Defensive security, logs and SOC foundations (`module.defensive-foundations`); Web, JavaScript, HTTP and APIs (`module.web-technologies`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 26.3–36.5 hours, excluding the extra revision reserve. Required lessons 7.5 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 12.0–18.0 h.

**Learning objectives:**



- Intercept only scoped lab traffic

- Explain data becoming executable syntax

- Distinguish XSS from CSRF

- Test access as different dummy users

- Explain server-side trust boundaries

- Test a stateful workflow for invariant violations

**Topics:** Method; Input handling; Browser boundary; Access control; Server boundary; Application logic.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [PortSwigger Web Security Academy](https://portswigger.net/web-security) — practical lab; [OWASP Web Security Testing Guide](https://owasp.org/projects/web-security-testing-guide) — reference; [OWASP Application Security Verification Standard](https://owasp.org/projects/asvs) — reference; [OWASP Juice Shop](https://owasp.org/projects/juice-shop) — practical lab; [OWASP WebGoat](https://owasp.org/projects/webgoat) — practical lab.


#### Topic: Method — `topic.web-security-method`


##### Proxy workflow and web test planning

**Lesson ID:** `lesson.web-testing-workflow`  
**Module:** `module.web-security`  
**Skill:** `skill.web-testing-workflow`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** REST, JSON APIs and observable behaviour (`skill.api-design`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70; Containment, escalation and recovery basics (`skill.response-basics`) ≥70

**Learning objectives:** Intercept only scoped lab traffic; Build a test matrix from application behaviour.

**Key concepts:** proxy, request replay, scope, test account, WSTG.

**Practical task — `exercise.web-testing-workflow`:** Use browser tools or a proxy on an assigned lab; map endpoints and save a redacted baseline request.

**Evidence to save:** Endpoint map and scoped test matrix.

**Knowledge check — `assessment.web-testing-workflow-check`:**

1. Why define proxy scope?

2. Why save a baseline request before modifying it?

**Mini challenge — `exercise.web-testing-workflow-challenge`:** Test the same function through UI and direct request and explain any difference.

**Suggested resource types:** practical lab, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Endpoint map and scoped test matrix submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Input handling — `topic.web-security-input-handling`


##### SQL and command injection: causes and fixes

**Lesson ID:** `lesson.injection-security`  
**Module:** `module.web-security`  
**Skill:** `skill.injection-security`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Proxy workflow and web test planning (`skill.web-testing-workflow`) ≥70; Server routes, validation and database operations (`skill.backend-database`) ≥70

**Learning objectives:** Explain data becoming executable syntax; Verify parameterisation or safe API use.

**Key concepts:** SQL injection, command injection, parameter binding, context, least privilege.

**Practical task — `exercise.injection-security`:** Complete a beginner assigned injection lab; identify the unsafe sink and demonstrate the minimal lab effect without bulk data extraction.

**Evidence to save:** Minimal reproduction and remediation test.

**Knowledge check — `assessment.injection-security-check`:**

1. Why is input validation alone often insufficient?

2. How do parameterised queries help?

**Mini challenge — `exercise.injection-security-challenge`:** Repair an owned toy query and prove both a normal input and the earlier test are handled safely.

**Suggested resource types:** practical lab, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Minimal reproduction and remediation test submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Browser boundary — `topic.web-security-browser-boundary`


##### XSS, CSRF and cross-origin mistakes

**Lesson ID:** `lesson.browser-security-testing`  
**Module:** `module.web-security`  
**Skill:** `skill.browser-security-testing`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Proxy workflow and web test planning (`skill.web-testing-workflow`) ≥70; Sessions, same-origin policy and browser boundaries (`skill.web-sessions`) ≥70; JavaScript, events and asynchronous requests (`skill.javascript-basics`) ≥70

**Learning objectives:** Distinguish XSS from CSRF; Test a browser defence in context.

**Key concepts:** XSS, CSRF, output encoding, SameSite, CORS.

**Practical task — `exercise.browser-security-testing`:** Use assigned labs with harmless visual markers to study one XSS and one CSRF case; explain the relevant trust boundary.

**Evidence to save:** Browser-boundary analysis and negative tests.

**Knowledge check — `assessment.browser-security-testing-check`:**

1. Does HTML encoding protect every JavaScript context?

2. Does a CSRF token repair an XSS vulnerability?

**Mini challenge — `exercise.browser-security-testing-challenge`:** Compare an unsafe HTML insertion with a safe text insertion in your own app.

**Suggested resource types:** practical lab, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Browser-boundary analysis and negative tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Access control — `topic.web-security-access-control`


##### Authentication, sessions and broken object access

**Lesson ID:** `lesson.access-auth-testing`  
**Module:** `module.web-security`  
**Skill:** `skill.access-auth-testing`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** SQL and command injection: causes and fixes (`skill.injection-security`) ≥70; XSS, CSRF and cross-origin mistakes (`skill.browser-security-testing`) ≥70; Sessions, OAuth, OIDC and tokens (`skill.federation-tokens`) ≥70

**Learning objectives:** Test access as different dummy users; Distinguish identity, role and object ownership checks.

**Key concepts:** IDOR/BOLA, session fixation, reset flow, role, ownership.

**Practical task — `exercise.access-auth-testing`:** Use two lab users to test object reads and changes; evaluate login, reset and logout with synthetic accounts only.

**Evidence to save:** Role/object test matrix and finding.

**Knowledge check — `assessment.access-auth-testing-check`:**

1. Why test both horizontal and vertical access?

2. Does an unpredictable object ID replace authorisation?

**Mini challenge — `exercise.access-auth-testing-challenge`:** Find a route that checks login but forgets ownership, then propose and retest a fix.

**Suggested resource types:** practical lab, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Role/object test matrix and finding submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Server boundary — `topic.web-security-server-boundary`


##### Server-side requests, files and parsers

**Lesson ID:** `lesson.server-side-web`  
**Module:** `module.web-security`  
**Skill:** `skill.server-side-web`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Authentication, sessions and broken object access (`skill.access-auth-testing`) ≥70; Firewalls, segmentation and secure administration (`skill.network-controls`) ≥70

**Learning objectives:** Explain server-side trust boundaries; Use minimal evidence in controlled labs.

**Key concepts:** SSRF, path traversal, file upload, XXE, parser.

**Practical task — `exercise.server-side-web`:** Complete two assigned introductory labs from these families; use only lab-internal mock resources and harmless files.

**Evidence to save:** Two bounded lab findings with prevention ideas.

**Knowledge check — `assessment.server-side-web-check`:**

1. Why can SSRF reach a different trust zone from the browser?

2. Does a filename extension prove an upload is safe?

**Mini challenge — `exercise.server-side-web-challenge`:** Design a test that confirms a traversal flaw without opening unrelated sensitive files.

**Suggested resource types:** practical lab, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Two bounded lab findings with prevention ideas submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Application logic — `topic.web-security-application-logic`


##### API authorisation and business logic testing

**Lesson ID:** `lesson.api-business-logic`  
**Module:** `module.web-security`  
**Skill:** `skill.api-business-logic`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Server-side requests, files and parsers (`skill.server-side-web`) ≥70; REST, JSON APIs and observable behaviour (`skill.api-design`) ≥70

**Learning objectives:** Test a stateful workflow for invariant violations; Explain business impact without exaggeration.

**Key concepts:** API schema, BOLA, state machine, rate limit, business invariant.

**Practical task — `exercise.api-business-logic`:** Test a toy checkout or booking flow with dummy credits; check ownership, repeated actions and invalid state transitions.

**Evidence to save:** Web/API assessment and regression tests.

**Knowledge check — `assessment.api-business-logic-check`:**

1. Why can a workflow be insecure even if all inputs are well formed?

2. Does rate limiting replace authorisation?

**Mini challenge — `exercise.api-business-logic-challenge`:** Write a regression test for a duplicated dummy refund or booking action.

**Suggested resource types:** practical lab, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Web/API assessment and regression tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Web application and API security testing — guided** — `lab.web-security-guided`; 120–180 minutes, resumable.

Scenario: Test a local vulnerable application with two dummy roles and document confirmed issues, failed hypotheses and fixes.

Inputs: PortSwigger assigned instance, or private Juice Shop/WebGoat, or your own disposable app; dummy accounts and exact scope. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Map routes and trust boundaries

- Test one input-handling and one access-control hypothesis

- Capture minimum evidence

- Repair where code is owned and retest

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Web application and API security testing — transfer** — `lab.web-security-transfer`; 180–300 minutes, resumable.

Scenario: Test a local vulnerable application with two dummy roles and document confirmed issues, failed hypotheses and fixes.

Inputs: PortSwigger assigned instance, or private Juice Shop/WebGoat, or your own disposable app; dummy accounts and exact scope. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Map routes and trust boundaries

- Test one input-handling and one access-control hypothesis

- Capture minimum evidence

- Repair where code is owned and retest

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.web-security-transfer`. Test a local vulnerable application with two dummy roles and document confirmed issues, failed hypotheses and fixes. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Trying payload lists without a hypothesis

- Testing only the UI instead of server decisions

- Reporting an issue without impact, controls or retesting

**Understand before progressing:** Explain input interpretation, browser boundaries, authentication and per-object access decisions.

**Able to do after completion:** Assess a small authorised web application and demonstrate and retest a limited finding.

**Project contributions:** Web penetration test and repair (`project.web-pentest`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** No new shared-project gate yet; save this module’s contribution for its final contributing module.


### 16. Penetration testing methodology and reporting

**Module ID:** `module.penetration-testing`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Integrate scope, discovery, controlled validation and reporting into a professional test workflow.

**Prerequisites and recommended preparation:** Web application and API security testing (`module.web-security`); Vulnerability assessment and remediation (`module.vulnerability-assessment`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 25.1–35.2 hours, excluding the extra revision reserve. Required lessons 6.2 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 12.0–18.0 h.

**Learning objectives:**



- Define the purpose of a penetration test

- Use owned or supplied information to guide testing

- Inspect a proof-of-concept before use

- Assess impact without unnecessary collection

- Produce audience-appropriate reporting

**Topics:** Engagement; Discovery; Validation; Delivery.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [NIST SP 800-115](https://csrc.nist.gov/pubs/sp/800/115/final) — reference; [HTB Academy skill and job-role path catalogue](https://academy.hackthebox.com/catalogue/paths) — structured course; [OWASP Web Security Testing Guide](https://owasp.org/projects/web-security-testing-guide) — reference.


#### Topic: Engagement — `topic.penetration-testing-engagement`


##### Rules of engagement and test design

**Lesson ID:** `lesson.pentest-engagement`  
**Module:** `module.penetration-testing`  
**Skill:** `skill.pentest-engagement`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Assessment scope and safe test planning (`skill.assessment-scope`) ≥70; API authorisation and business logic testing (`skill.api-business-logic`) ≥70

**Learning objectives:** Define the purpose of a penetration test; Negotiate explicit constraints and evidence limits.

**Key concepts:** objective, rules of engagement, scope, impact limit, communication.

**Practical task — `exercise.pentest-engagement`:** Write a lab engagement covering one host and one app, allowed proof, excluded denial-of-service and cleanup responsibilities.

**Evidence to save:** Rules of engagement and test objectives.

**Knowledge check — `assessment.pentest-engagement-check`:**

1. How does a penetration test differ from indiscriminate vulnerability scanning?

2. Why define evidence limits?

**Mini challenge — `exercise.pentest-engagement-challenge`:** Respond to a request to include an unowned third-party service.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Rules of engagement and test objectives submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Discovery — `topic.penetration-testing-discovery`


##### Reconnaissance and hypothesis-driven enumeration

**Lesson ID:** `lesson.recon-hypotheses`  
**Module:** `module.penetration-testing`  
**Skill:** `skill.recon-hypotheses`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Rules of engagement and test design (`skill.pentest-engagement`) ≥70; Inventory and low-impact service discovery (`skill.service-discovery`) ≥70

**Learning objectives:** Use owned or supplied information to guide testing; Maintain an evidence-based hypothesis list.

**Key concepts:** asset, service, version, exposure, hypothesis.

**Practical task — `exercise.recon-hypotheses`:** Enumerate only assigned lab endpoints; rank three possible weaknesses by evidence and expected impact.

**Evidence to save:** Enumeration notes and prioritised hypotheses.

**Knowledge check — `assessment.recon-hypotheses-check`:**

1. Why distinguish a guess from a confirmed observation?

2. Should an unexpected hostname automatically enter scope?

**Mini challenge — `exercise.recon-hypotheses-challenge`:** Eliminate one tempting hypothesis using non-exploitative evidence.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Enumeration notes and prioritised hypotheses submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Validation — `topic.penetration-testing-validation`


##### Exploit selection and minimal lab validation

**Lesson ID:** `lesson.controlled-validation`  
**Module:** `module.penetration-testing`  
**Skill:** `skill.controlled-validation`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Reconnaissance and hypothesis-driven enumeration (`skill.recon-hypotheses`) ≥70; Validate scanner and configuration findings (`skill.vulnerability-validation`) ≥70

**Learning objectives:** Inspect a proof-of-concept before use; Demonstrate a weakness with bounded effects.

**Key concepts:** precondition, proof-of-concept, side effect, sandbox, rollback.

**Practical task — `exercise.controlled-validation`:** Review an educational lab proof-of-concept and its assumptions; validate one approved weakness against a snapshot or use the platform’s guided proof.

**Evidence to save:** Validation evidence, assumptions and code-review note.

**Knowledge check — `assessment.controlled-validation-check`:**

1. Why read code before running it?

2. What is sufficient proof in a small lab?

**Mini challenge — `exercise.controlled-validation-challenge`:** Replace an unnecessarily invasive proof with a harmless marker or access check.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Validation evidence, assumptions and code-review note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Post-access judgement and evidence limits

**Lesson ID:** `lesson.access-impact`  
**Module:** `module.penetration-testing`  
**Skill:** `skill.access-impact`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Exploit selection and minimal lab validation (`skill.controlled-validation`) ≥70; Data handling, governance and ethical decisions (`skill.governance-data`) ≥70

**Learning objectives:** Assess impact without unnecessary collection; Preserve an accurate action log.

**Key concepts:** privilege context, scope, data minimisation, cleanup, impact.

**Practical task — `exercise.access-impact`:** In the assigned guest, record the current user and approved test-file access; avoid collecting unrelated secrets or personal data.

**Evidence to save:** Minimal impact statement and action log.

**Knowledge check — `assessment.access-impact-check`:**

1. Does initial access grant permission for every further action?

2. Why distinguish potential impact from demonstrated impact?

**Mini challenge — `exercise.access-impact-challenge`:** Explain an untested risk honestly without presenting it as demonstrated compromise.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Minimal impact statement and action log submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Delivery — `topic.penetration-testing-delivery`


##### Professional pentest report, cleanup and retest

**Lesson ID:** `lesson.pentest-delivery`  
**Module:** `module.penetration-testing`  
**Skill:** `skill.pentest-delivery`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Post-access judgement and evidence limits (`skill.access-impact`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70

**Learning objectives:** Produce audience-appropriate reporting; Verify restoration and remediation.

**Key concepts:** executive summary, finding, evidence, limitation, retest.

**Practical task — `exercise.pentest-delivery`:** Deliver the lab report with scope, coverage, findings, remediation, cleanup and a follow-up test plan.

**Evidence to save:** Complete penetration-test report and cleanup record.

**Knowledge check — `assessment.pentest-delivery-check`:**

1. Why is a negative result limited?

2. Why record test artefact removal?

**Mini challenge — `exercise.pentest-delivery-challenge`:** Explain one finding to a developer and defend its severity under questions.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Complete penetration-test report and cleanup record submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Penetration testing methodology and reporting — guided** — `lab.penetration-testing-guided`; 120–180 minutes, resumable.

Scenario: Conduct an end-to-end assessment of a disposable host and web service using a signed-by-you lab scope.

Inputs: Assigned training range or private vulnerable guest with synthetic data, snapshots, test accounts and a scope file. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Assigned browser-based training lab (`environment.browser`); Disposable Linux environment (`environment.linux`); Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Plan permitted actions

- Prioritise two hypotheses

- Validate one with minimal impact

- Write the report, clean up and retest

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Penetration testing methodology and reporting — transfer** — `lab.penetration-testing-transfer`; 180–300 minutes, resumable.

Scenario: Conduct an end-to-end assessment of a disposable host and web service using a signed-by-you lab scope.

Inputs: Assigned training range or private vulnerable guest with synthetic data, snapshots, test accounts and a scope file. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Assigned browser-based training lab (`environment.browser`); Disposable Linux environment (`environment.linux`); Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Plan permitted actions

- Prioritise two hypotheses

- Validate one with minimal impact

- Write the report, clean up and retest

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.penetration-testing-transfer`. Conduct an end-to-end assessment of a disposable host and web service using a signed-by-you lab scope. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Equating shell access with a finished assessment

- Running unknown exploit code without inspection

- Skipping cleanup or client communication

**Understand before progressing:** Explain rules of engagement, attack hypotheses, minimal proof, evidence handling and retesting.

**Able to do after completion:** Carry out a limited authorised lab test and deliver a reproducible report with cleanup evidence.

**Project contributions:** Web penetration test and repair (`project.web-pentest`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Web penetration test and repair (`project.web-pentest`).


### 17. Active Directory and enterprise identity

**Module ID:** `module.active-directory`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Understand enterprise identity administration and common trust failures before attempting domain attack paths.

**Prerequisites and recommended preparation:** Defensive security, logs and SOC foundations (`module.defensive-foundations`); Applied cryptography and modern identity (`module.cryptography-identity`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 31.1–45.2 hours, excluding the extra revision reserve. Required lessons 6.2 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 18.0–28.0 h.

**Learning objectives:**



- Explain AD DS components

- Trace a simplified Kerberos exchange

- Inspect effective group and policy results

- Identify excessive identity trust

- Verify an identity hardening change

**Topics:** Directory model; Administration; Security review.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Active Directory Domain Services overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview) — official documentation; [PowerShell overview and documentation](https://learn.microsoft.com/en-us/powershell/scripting/overview) — official documentation; [HTB Academy skill and job-role path catalogue](https://academy.hackthebox.com/catalogue/paths) — structured course.


#### Topic: Directory model — `topic.active-directory-directory-model`


##### Domains, forests, objects and DNS

**Lesson ID:** `lesson.ad-structure`  
**Module:** `module.active-directory`  
**Skill:** `skill.ad-structure`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Local users, groups, NTFS and UAC (`skill.windows-access`) ≥70; Routing, DNS, DHCP and NAT (`skill.routing-dns-dhcp`) ≥70; Containment, escalation and recovery basics (`skill.response-basics`) ≥70

**Learning objectives:** Explain AD DS components; Distinguish local, domain and cloud identities.

**Key concepts:** domain, forest, OU, domain controller, DNS.

**Practical task — `exercise.ad-structure`:** Draw a small domain and inspect its objects in an assigned lab; identify the DNS dependency.

**Evidence to save:** AD topology and object inventory.

**Knowledge check — `assessment.ad-structure-check`:**

1. Is an OU the same as a security group?

2. Is AD DS identical to Microsoft Entra ID?

**Mini challenge — `exercise.ad-structure-challenge`:** Diagnose why a client using the wrong DNS server cannot find the domain.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- AD topology and object inventory submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Kerberos, LDAP and authentication flows

**Lesson ID:** `lesson.kerberos-directory`  
**Module:** `module.active-directory`  
**Skill:** `skill.kerberos-directory`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Domains, forests, objects and DNS (`skill.ad-structure`) ≥70; Sessions, OAuth, OIDC and tokens (`skill.federation-tokens`) ≥70

**Learning objectives:** Trace a simplified Kerberos exchange; Explain DNS and time dependencies.

**Key concepts:** Kerberos, ticket, KDC, LDAP, SPN.

**Practical task — `exercise.kerberos-directory`:** Trace a test user’s authentication and directory lookup using diagrams and permitted lab logs.

**Evidence to save:** Authentication trace with failure diagnosis.

**Knowledge check — `assessment.kerberos-directory-check`:**

1. Why does time matter in Kerberos?

2. Is LDAP itself a synonym for Kerberos?

**Mini challenge — `exercise.kerberos-directory-challenge`:** Explain a failed login caused by clock skew without changing security controls blindly.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Authentication trace with failure diagnosis submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Administration — `topic.active-directory-administration`


##### Groups, GPOs and delegated administration

**Lesson ID:** `lesson.ad-policy`  
**Module:** `module.active-directory`  
**Skill:** `skill.ad-policy`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Kerberos, LDAP and authentication flows (`skill.kerberos-directory`) ≥70; PowerShell automation and structured output (`skill.powershell-automation`) ≥70

**Learning objectives:** Inspect effective group and policy results; Apply least-privilege delegation.

**Key concepts:** security group, GPO, inheritance, delegation, effective access.

**Practical task — `exercise.ad-policy`:** In a disposable domain, grant a narrow administrative task to a dummy group and verify its limits.

**Evidence to save:** Policy and delegation tests.

**Knowledge check — `assessment.ad-policy-check`:**

1. Why inspect effective policy rather than only one GPO?

2. Why avoid Domain Admin for routine helpdesk tasks?

**Mini challenge — `exercise.ad-policy-challenge`:** Find a group membership that unintentionally expands access.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Policy and delegation tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Security review — `topic.active-directory-security-review`


##### Identity exposure and attack-path reasoning

**Lesson ID:** `lesson.ad-exposure`  
**Module:** `module.active-directory`  
**Skill:** `skill.ad-exposure`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Groups, GPOs and delegated administration (`skill.ad-policy`) ≥70; Attacker behaviour and defensive visibility (`skill.attack-defence-mapping`) ≥70

**Learning objectives:** Identify excessive identity trust; Explain possible attack paths without unnecessary credential collection.

**Key concepts:** service account, ACL, trust, credential exposure, tiering.

**Practical task — `exercise.ad-exposure`:** Review an assigned lab’s permissions and service accounts; draw one hypothetical path from low privilege to a sensitive resource.

**Evidence to save:** AD exposure graph with verified and hypothetical edges labelled.

**Knowledge check — `assessment.ad-exposure-check`:**

1. Does a graph edge prove exploitation is feasible?

2. Why separate administrative tiers or roles?

**Mini challenge — `exercise.ad-exposure-challenge`:** Remove one edge and explain which paths remain.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- AD exposure graph with verified and hypothetical edges labelled submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### AD hardening, audit and recovery

**Lesson ID:** `lesson.ad-defence`  
**Module:** `module.active-directory`  
**Skill:** `skill.ad-defence`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Identity exposure and attack-path reasoning (`skill.ad-exposure`) ≥70; Backups, recovery and operational continuity (`skill.backup-resilience`) ≥70

**Learning objectives:** Verify an identity hardening change; Plan domain evidence and recovery checks.

**Key concepts:** privileged account, audit policy, backup, trust, retest.

**Practical task — `exercise.ad-defence`:** Fix the lab’s overbroad group or delegation; verify intended access still works, denied access fails and evidence is recorded.

**Evidence to save:** AD hardening report and audit plan.

**Knowledge check — `assessment.ad-defence-check`:**

1. Why test ordinary business access after identity changes?

2. Why is domain recovery more than restoring a single user file?

**Mini challenge — `exercise.ad-defence-challenge`:** Write a detection idea for the original misconfiguration being reintroduced.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- AD hardening report and audit plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Active Directory and enterprise identity — guided** — `lab.active-directory-guided`; 120–180 minutes, resumable.

Scenario: Administer a two-user test domain, diagnose a login problem and repair an overbroad group or delegation.

Inputs: Hosted AD lab or compatible isolated Windows Server and client guests; dummy identities, working DNS and time sync. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Isolated Active Directory range (`environment.ad`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Map domain and trust roles

- Create or inspect users and groups

- Trace authentication and policy application

- Repair one permission issue and verify logs

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Active Directory and enterprise identity — transfer** — `lab.active-directory-transfer`; 180–300 minutes, resumable.

Scenario: Administer a two-user test domain, diagnose a login problem and repair an overbroad group or delegation.

Inputs: Hosted AD lab or compatible isolated Windows Server and client guests; dummy identities, working DNS and time sync. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Isolated Active Directory range (`environment.ad`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Map domain and trust roles

- Create or inspect users and groups

- Trace authentication and policy application

- Repair one permission issue and verify logs

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.active-directory-transfer`. Administer a two-user test domain, diagnose a login problem and repair an overbroad group or delegation. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Confusing AD DS with Microsoft Entra ID

- Treating a domain as a collection of unrelated local accounts

- Practising identity attacks without a disposable domain

**Understand before progressing:** Explain domain structure, DNS, Kerberos, group policy, delegation and privileged identity boundaries.

**Able to do after completion:** Build or use a small isolated domain, inspect effective access and document a safe hardening improvement.

**Project contributions:** AD lab and identity hardening (`project.ad-lab`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** AD lab and identity hardening (`project.ad-lab`).


### 18. Local privilege boundaries and escalation labs

**Module ID:** `module.privilege-escalation`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Understand and repair unsafe local privilege transitions on Linux and Windows.

**Prerequisites and recommended preparation:** Penetration testing methodology and reporting (`module.penetration-testing`); Windows administration and evidence (`module.windows`); Linux administration and investigation (`module.linux`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 29.1–41.2 hours, excluding the extra revision reserve. Required lessons 6.2 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 16.0–24.0 h.

**Learning objectives:**



- Establish current privilege accurately

- Explain an unsafe privileged execution path

- Explain service identity and writable resources

- Explain how exposed secrets extend impact

- Connect root cause to privilege impact

**Topics:** Method; Linux; Windows; Credential hygiene; Delivery.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [HTB Academy skill and job-role path catalogue](https://academy.hackthebox.com/catalogue/paths) — structured course; [The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners) — official documentation; [PowerShell overview and documentation](https://learn.microsoft.com/en-us/powershell/scripting/overview) — official documentation.


#### Topic: Method — `topic.privilege-escalation-method`


##### Local enumeration and execution context

**Lesson ID:** `lesson.privilege-enumeration`  
**Module:** `module.privilege-escalation`  
**Skill:** `skill.privilege-enumeration`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Post-access judgement and evidence limits (`skill.access-impact`) ≥70; Event logs, time and audit context (`skill.windows-events`) ≥70; Users, groups and file permissions (`skill.linux-permissions`) ≥70

**Learning objectives:** Establish current privilege accurately; Prioritise configuration evidence.

**Key concepts:** effective user, group, service identity, writable path, environment.

**Practical task — `exercise.privilege-enumeration`:** Inventory identity, services and relevant permissions on a disposable guest without running escalation tooling blindly.

**Evidence to save:** Privilege-boundary inventory and hypotheses.

**Knowledge check — `assessment.privilege-enumeration-check`:**

1. Why record the initial privilege context?

2. Why distinguish writable files from files actually executed by a privileged process?

**Mini challenge — `exercise.privilege-enumeration-challenge`:** Reject a suspected escalation that has no privileged execution path.

**Suggested resource types:** structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Privilege-boundary inventory and hypotheses submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Linux — `topic.privilege-escalation-linux`


##### Linux privilege misconfigurations

**Lesson ID:** `lesson.linux-escalation`  
**Module:** `module.privilege-escalation`  
**Skill:** `skill.linux-escalation`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Local enumeration and execution context (`skill.privilege-enumeration`) ≥70; Processes, packages and service logs (`skill.linux-services`) ≥70

**Learning objectives:** Explain an unsafe privileged execution path; Validate and repair a lab permission flaw.

**Key concepts:** sudo policy, SUID, capability, scheduled task, path.

**Practical task — `exercise.linux-escalation`:** Use an assigned Linux exercise to demonstrate one misconfiguration through a harmless marker, then fix its permissions or execution policy.

**Evidence to save:** Linux escalation explanation and retest.

**Knowledge check — `assessment.linux-escalation-check`:**

1. Is every SUID executable vulnerable?

2. Why is a writable script run by root risky?

**Mini challenge — `exercise.linux-escalation-challenge`:** Retest the flaw after a minimal fix and verify the intended task still works.

**Suggested resource types:** structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Linux escalation explanation and retest submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Windows — `topic.privilege-escalation-windows`


##### Windows service and task permission flaws

**Lesson ID:** `lesson.windows-escalation`  
**Module:** `module.privilege-escalation`  
**Skill:** `skill.windows-escalation`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Local enumeration and execution context (`skill.privilege-enumeration`) ≥70; Local users, groups, NTFS and UAC (`skill.windows-access`) ≥70

**Learning objectives:** Explain service identity and writable resources; Validate a controlled Windows privilege flaw.

**Key concepts:** service ACL, task, binary path, UAC, token.

**Practical task — `exercise.windows-escalation`:** Use an assigned Windows exercise to inspect a service or scheduled task; prove only the intended lab effect and repair the permission.

**Evidence to save:** Windows privilege finding and remediation evidence.

**Knowledge check — `assessment.windows-escalation-check`:**

1. Does local administrator necessarily imply domain administrator?

2. Why can write access to a privileged service binary matter?

**Mini challenge — `exercise.windows-escalation-challenge`:** Distinguish a suspicious-looking path from a confirmed exploitable permission combination.

**Suggested resource types:** structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Windows privilege finding and remediation evidence submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Credential hygiene — `topic.privilege-escalation-credential-hygiene`


##### Secrets, credentials and local blast radius

**Lesson ID:** `lesson.secret-exposure`  
**Module:** `module.privilege-escalation`  
**Skill:** `skill.secret-exposure`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Linux privilege misconfigurations (`skill.linux-escalation`) ≥70; Windows service and task permission flaws (`skill.windows-escalation`) ≥70; Password storage, MFA and recovery (`skill.passwords-mfa`) ≥70

**Learning objectives:** Explain how exposed secrets extend impact; Use dummy secrets to test handling and remediation.

**Key concepts:** environment variable, config secret, credential reuse, rotation, scope.

**Practical task — `exercise.secret-exposure`:** Plant a fake credential in a private lab configuration; identify it, explain exposure, rotate the dummy value and prevent recurrence.

**Evidence to save:** Secret-handling finding and rotation test.

**Knowledge check — `assessment.secret-exposure-check`:**

1. Does deleting the visible file revoke an exposed credential?

2. Why avoid publishing the actual secret as evidence?

**Mini challenge — `exercise.secret-exposure-challenge`:** Prove rotation worked using a negative test with the old dummy credential.

**Suggested resource types:** structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Secret-handling finding and rotation test submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Delivery — `topic.privilege-escalation-delivery`


##### Escalation report and regression checks

**Lesson ID:** `lesson.privilege-remediation`  
**Module:** `module.privilege-escalation`  
**Skill:** `skill.privilege-remediation`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Secrets, credentials and local blast radius (`skill.secret-exposure`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70

**Learning objectives:** Connect root cause to privilege impact; Build a durable regression check.

**Key concepts:** root cause, least privilege, negative test, monitoring, cleanup.

**Practical task — `exercise.privilege-remediation`:** Write a combined Linux/Windows report showing starting access, exact trust failure, minimal proof, fix and negative retest.

**Evidence to save:** Privilege-boundary report and regression tests.

**Knowledge check — `assessment.privilege-remediation-check`:**

1. Why is cleanup insufficient without fixing the root cause?

2. What makes a regression test valuable?

**Mini challenge — `exercise.privilege-remediation-challenge`:** Explain how monitoring complements but does not replace the permission fix.

**Suggested resource types:** structured course, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Privilege-boundary report and regression tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Local privilege boundaries and escalation labs — guided** — `lab.privilege-escalation-guided`; 120–180 minutes, resumable.

Scenario: Compare a Linux permission flaw and a Windows service permission flaw in assigned disposable labs.

Inputs: Two resettable training hosts or sequential hosted exercises; harmless marker files, dummy identities and known recovery points. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Linux environment (`environment.linux`); Disposable Windows environment (`environment.windows`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Record starting privilege

- Inspect permissions and execution context

- Prove one assigned flaw with a harmless marker

- Repair, retest and restore

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Local privilege boundaries and escalation labs — transfer** — `lab.privilege-escalation-transfer`; 180–300 minutes, resumable.

Scenario: Compare a Linux permission flaw and a Windows service permission flaw in assigned disposable labs.

Inputs: Two resettable training hosts or sequential hosted exercises; harmless marker files, dummy identities and known recovery points. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable Linux environment (`environment.linux`); Disposable Windows environment (`environment.windows`); Assigned browser-based training lab (`environment.browser`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Record starting privilege

- Inspect permissions and execution context

- Prove one assigned flaw with a harmless marker

- Repair, retest and restore

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.privilege-escalation-transfer`. Compare a Linux permission flaw and a Windows service permission flaw in assigned disposable labs. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Launching kernel exploits before checking configuration

- Assuming administrator and domain administrator are equivalent

- Collecting real credentials when a controlled proof is sufficient

**Understand before progressing:** Explain execution identity, writable privileged resources, credentials and reversible proof of escalation.

**Able to do after completion:** Find and repair a deliberately introduced local privilege weakness with before-and-after evidence.

**Project contributions:** Linux and Windows privilege-boundary review (`project.privilege-lab`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Linux and Windows privilege-boundary review (`project.privilege-lab`).


### 19. SIEM, detection engineering and analyst practice

**Module ID:** `module.detection-siem`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Turn reliable telemetry into tested queries, useful detections and clear investigations.

**Prerequisites and recommended preparation:** Defensive security, logs and SOC foundations (`module.defensive-foundations`); Shell automation, Git and reproducible work (`module.automation-git`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 38.3–54.5 hours, excluding the extra revision reserve. Required lessons 7.5 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 24.0–36.0 h.

**Learning objectives:**



- Validate events before analysis

- Translate an investigation question into a query

- State the behaviour a rule detects

- Calculate a confusion matrix

- Investigate a rule hit using context

- Manage a detection as maintained code

**Topics:** Data pipeline; Analyst queries; Detection design; Detection evaluation; Operations.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Wazuh documentation](https://documentation.wazuh.com/current/) — official documentation; [Sigma documentation](https://sigmahq.io/docs/) — official documentation; [MITRE ATT&CK](https://attack.mitre.org/) — reference; [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — reference.


#### Topic: Data pipeline — `topic.detection-siem-data-pipeline`


##### Ingestion, schemas and time normalisation

**Lesson ID:** `lesson.siem-ingestion`  
**Module:** `module.detection-siem`  
**Skill:** `skill.siem-ingestion`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Events, logs and telemetry quality (`skill.telemetry-basics`) ≥70; Documentation and reproducible tooling (`skill.reproducible-tooling`) ≥70

**Learning objectives:** Validate events before analysis; Document missing fields and collection gaps.

**Key concepts:** ingestion, parser, schema, UTC, retention.

**Practical task — `exercise.siem-ingestion`:** Load synthetic auth and web logs into a SIEM or SQLite; count source and loaded records and reconcile rejected rows.

**Evidence to save:** Ingestion reconciliation and schema map.

**Knowledge check — `assessment.siem-ingestion-check`:**

1. Why reconcile record counts?

2. Why retain source provenance?

**Mini challenge — `exercise.siem-ingestion-challenge`:** Detect a parser that drops records when a field is absent.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Ingestion reconciliation and schema map submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Analyst queries — `topic.detection-siem-analyst-queries`


##### Search, aggregation and correlation

**Lesson ID:** `lesson.siem-querying`  
**Module:** `module.detection-siem`  
**Skill:** `skill.siem-querying`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Ingestion, schemas and time normalisation (`skill.siem-ingestion`) ≥70; Relational data and SQL queries (`skill.sql-data`) ≥70

**Learning objectives:** Translate an investigation question into a query; Avoid misleading aggregation.

**Key concepts:** filter, grouping, time window, join, deduplication.

**Practical task — `exercise.siem-querying`:** Query failed logins by user and time window; compare results with hand-counted synthetic ground truth.

**Evidence to save:** Query pack with expected results.

**Knowledge check — `assessment.siem-querying-check`:**

1. Why can a join inflate alert counts?

2. Why specify the time window explicitly?

**Mini challenge — `exercise.siem-querying-challenge`:** Find a query that misses a burst crossing a window boundary.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Query pack with expected results submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Detection design — `topic.detection-siem-detection-design`


##### Detection hypotheses and Sigma-style rules

**Lesson ID:** `lesson.detection-logic`  
**Module:** `module.detection-siem`  
**Skill:** `skill.detection-logic`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Search, aggregation and correlation (`skill.siem-querying`) ≥70; Attacker behaviour and defensive visibility (`skill.attack-defence-mapping`) ≥70

**Learning objectives:** State the behaviour a rule detects; Document prerequisites and blind spots.

**Key concepts:** hypothesis, logsource, selection, condition, false positive.

**Practical task — `exercise.detection-logic`:** Write a Sigma-format rule or equivalent query for a benign simulated behaviour and list required fields.

**Evidence to save:** Rule, data requirements and behavioural rationale.

**Knowledge check — `assessment.detection-logic-check`:**

1. Does portable rule syntax guarantee equivalent behaviour on every backend?

2. Why include likely false positives?

**Mini challenge — `exercise.detection-logic-challenge`:** Explain how a missing field would change the rule’s sensitivity.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Rule, data requirements and behavioural rationale submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Detection evaluation — `topic.detection-siem-detection-evaluation`


##### Evaluate precision, recall and base rates

**Lesson ID:** `lesson.detection-evaluation`  
**Module:** `module.detection-siem`  
**Skill:** `skill.detection-evaluation`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Detection hypotheses and Sigma-style rules (`skill.detection-logic`) ≥70; Variables, types and control flow (`skill.code-control-flow`) ≥70

**Learning objectives:** Calculate a confusion matrix; Avoid overfitting a tiny lab dataset.

**Key concepts:** TP, FP, FN, precision, recall, base rate.

**Practical task — `exercise.detection-evaluation`:** Evaluate the rule on a labelled holdout dataset and calculate precision and recall; state sample-size limits.

**Evidence to save:** Confusion matrix, error review and limitations.

**Knowledge check — `assessment.detection-evaluation-check`:**

1. Can high accuracy conceal missed rare attacks?

2. What happens to a metric with a zero denominator?

**Mini challenge — `exercise.detection-evaluation-challenge`:** Tune the rule and show both the gained and lost detections.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Confusion matrix, error review and limitations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Operations — `topic.detection-siem-operations`


##### Triage a correlated alert and write a playbook

**Lesson ID:** `lesson.analyst-investigation`  
**Module:** `module.detection-siem`  
**Skill:** `skill.analyst-investigation`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Evaluate precision, recall and base rates (`skill.detection-evaluation`) ≥70; SOC workflow and alert triage (`skill.soc-triage`) ≥70

**Learning objectives:** Investigate a rule hit using context; Produce a repeatable analyst procedure.

**Key concepts:** enrichment, baseline, evidence, escalation, disposition.

**Practical task — `exercise.analyst-investigation`:** Investigate one true-positive simulation and one benign match; create a playbook with evidence checks and escalation criteria.

**Evidence to save:** Two triage tickets and an analyst playbook.

**Knowledge check — `assessment.analyst-investigation-check`:**

1. Why should enrichment sources have provenance?

2. Why include a benign closure route?

**Mini challenge — `exercise.analyst-investigation-challenge`:** Handle an alert with missing host data without treating absence as innocence.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Two triage tickets and an analyst playbook submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Detection change control and operational metrics

**Lesson ID:** `lesson.detection-lifecycle`  
**Module:** `module.detection-siem`  
**Skill:** `skill.detection-lifecycle`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Triage a correlated alert and write a playbook (`skill.analyst-investigation`) ≥70; Branches, review and secret hygiene (`skill.git-collaboration`) ≥70

**Learning objectives:** Manage a detection as maintained code; Choose metrics that reflect useful outcomes.

**Key concepts:** versioning, tests, coverage, latency, retirement.

**Practical task — `exercise.detection-lifecycle`:** Version the rule, test data and playbook; record deployment assumptions, review date and a rollback plan.

**Evidence to save:** Detection repository and maintenance plan.

**Knowledge check — `assessment.detection-lifecycle-check`:**

1. Does more alert volume necessarily mean better security?

2. Why retest after a parser change?

**Mini challenge — `exercise.detection-lifecycle-challenge`:** Retire a redundant rule and explain how coverage is preserved.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Detection repository and maintenance plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**SIEM, detection engineering and analyst practice — guided** — `lab.detection-siem-guided`; 120–180 minutes, resumable.

Scenario: Detect a synthetic login anomaly while distinguishing expected admin activity and collection failures.

Inputs: A local or hosted SIEM, or SQLite as a lightweight query substitute; labelled synthetic events split into development and holdout sets. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: SIEM or lightweight query lab (`environment.siem`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Validate fields and time coverage

- Implement a query

- Test positive and negative examples

- Measure errors and write the analyst response

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**SIEM, detection engineering and analyst practice — transfer** — `lab.detection-siem-transfer`; 180–300 minutes, resumable.

Scenario: Detect a synthetic login anomaly while distinguishing expected admin activity and collection failures.

Inputs: A local or hosted SIEM, or SQLite as a lightweight query substitute; labelled synthetic events split into development and holdout sets. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: SIEM or lightweight query lab (`environment.siem`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Validate fields and time coverage

- Implement a query

- Test positive and negative examples

- Measure errors and write the analyst response

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.detection-siem-transfer`. Detect a synthetic login anomaly while distinguishing expected admin activity and collection failures. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Writing detections before checking available fields

- Measuring only alert counts

- Suppressing false positives without testing missed attacks

**Understand before progressing:** Explain ingestion quality, query logic, correlation, base rates, precision and recall.

**Able to do after completion:** Build and evaluate a small detection with labelled test data and a triage playbook.

**Project contributions:** SOC detection and triage project (`project.soc-detection`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** SOC detection and triage project (`project.soc-detection`).


### 20. Incident response and threat hunting

**Module ID:** `module.incident-response`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Practise investigation, response decisions and evidence-based learning from incidents.

**Prerequisites and recommended preparation:** SIEM, detection engineering and analyst practice (`module.detection-siem`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 31.1–45.2 hours, excluding the extra revision reserve. Required lessons 6.2 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 18.0–28.0 h.

**Learning objectives:**



- Assign response responsibilities

- Estimate affected users and assets

- Create a falsifiable hunt hypothesis

- Compare containment options

- Write an evidence-based incident narrative

**Topics:** Response planning; Investigation; Response actions; Communication.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — reference; [MITRE ATT&CK](https://attack.mitre.org/) — reference; [Wazuh documentation](https://documentation.wazuh.com/current/) — official documentation.


#### Topic: Response planning — `topic.incident-response-response-planning`


##### Preparation, roles and evidence preservation

**Lesson ID:** `lesson.response-preparation`  
**Module:** `module.incident-response`  
**Skill:** `skill.response-preparation`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Detection change control and operational metrics (`skill.detection-lifecycle`) ≥70; Containment, escalation and recovery basics (`skill.response-basics`) ≥70

**Learning objectives:** Assign response responsibilities; Prepare evidence and communication procedures.

**Key concepts:** incident owner, playbook, preservation, authority, communications.

**Practical task — `exercise.response-preparation`:** Write a response plan for a fictional small service, including who may isolate systems and where evidence is stored.

**Evidence to save:** Response plan and decision authority map.

**Knowledge check — `assessment.response-preparation-check`:**

1. Why separate technical response from approval authority?

2. Why define evidence handling before an incident?

**Mini challenge — `exercise.response-preparation-challenge`:** Adapt the plan for an unavailable system owner.

**Suggested resource types:** reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Response plan and decision authority map submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Investigation — `topic.incident-response-investigation`


##### Scope an incident and build a defensible timeline

**Lesson ID:** `lesson.incident-scoping`  
**Module:** `module.incident-response`  
**Skill:** `skill.incident-scoping`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Preparation, roles and evidence preservation (`skill.response-preparation`) ≥70; Filtering, timelines and competing hypotheses (`skill.log-analysis`) ≥70

**Learning objectives:** Estimate affected users and assets; Qualify timeline uncertainty.

**Key concepts:** scope, timeline, evidence gap, hypothesis, confidence.

**Practical task — `exercise.incident-scoping`:** Investigate a synthetic login-to-process sequence; identify confirmed effects, suspected effects and unknowns.

**Evidence to save:** Incident timeline with confidence and gap list.

**Knowledge check — `assessment.incident-scoping-check`:**

1. Does one compromised account prove all accounts are compromised?

2. Why record both event and collection time?

**Mini challenge — `exercise.incident-scoping-challenge`:** Revise your conclusion when a clock offset is discovered.

**Suggested resource types:** reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Incident timeline with confidence and gap list submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Hypothesis-driven hunting and intelligence use

**Lesson ID:** `lesson.threat-hunting`  
**Module:** `module.incident-response`  
**Skill:** `skill.threat-hunting`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Scope an incident and build a defensible timeline (`skill.incident-scoping`) ≥70; Search, aggregation and correlation (`skill.siem-querying`) ≥70

**Learning objectives:** Create a falsifiable hunt hypothesis; Evaluate threat intelligence relevance.

**Key concepts:** hypothesis, behaviour, indicator, source quality, falsification.

**Practical task — `exercise.threat-hunting`:** Hunt for a benign simulated sequence in synthetic logs; document searches that support and weaken the hypothesis.

**Evidence to save:** Hunt notebook with negative results and limits.

**Knowledge check — `assessment.threat-hunting-check`:**

1. How does a hunt differ from searching random indicators?

2. Why assess intelligence age and relevance?

**Mini challenge — `exercise.threat-hunting-challenge`:** Conclude a hunt without a finding and explain what was actually tested.

**Suggested resource types:** reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Hunt notebook with negative results and limits submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Response actions — `topic.incident-response-response-actions`


##### Containment, eradication and verified recovery

**Lesson ID:** `lesson.containment-recovery`  
**Module:** `module.incident-response`  
**Skill:** `skill.containment-recovery`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Hypothesis-driven hunting and intelligence use (`skill.threat-hunting`) ≥70; Backups, recovery and operational continuity (`skill.backup-resilience`) ≥70

**Learning objectives:** Compare containment options; Verify restored functionality and reduced exposure.

**Key concepts:** isolation, token revocation, root cause, restore, monitoring.

**Practical task — `exercise.containment-recovery`:** Run a tabletop involving a stolen dummy session; choose containment and recovery steps and test revoked-session behaviour locally.

**Evidence to save:** Decision log, recovery checks and residual-risk note.

**Knowledge check — `assessment.containment-recovery-check`:**

1. Does resetting a password always revoke existing sessions?

2. Why address root cause before declaring recovery complete?

**Mini challenge — `exercise.containment-recovery-challenge`:** Choose a containment option when taking the whole service offline would cause harm.

**Suggested resource types:** reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Decision log, recovery checks and residual-risk note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Communication — `topic.incident-response-communication`


##### Incident reports and learning without blame

**Lesson ID:** `lesson.incident-reporting`  
**Module:** `module.incident-response`  
**Skill:** `skill.incident-reporting`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Containment, eradication and verified recovery (`skill.containment-recovery`) ≥70; Tickets, handoffs and responsible disclosure (`skill.professional-communication`) ≥70

**Learning objectives:** Write an evidence-based incident narrative; Turn lessons into owned improvements.

**Key concepts:** executive update, technical timeline, root cause, action owner, review date.

**Practical task — `exercise.incident-reporting`:** Produce a report separating observations, inferences, response actions and open questions; propose three owned improvements.

**Evidence to save:** Incident report and improvement backlog.

**Knowledge check — `assessment.incident-reporting-check`:**

1. Why avoid unsupported attribution?

2. Why assign owners and dates to improvements?

**Mini challenge — `exercise.incident-reporting-challenge`:** Deliver a short update while an important fact remains unknown.

**Suggested resource types:** reference, official documentation. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Incident report and improvement backlog submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Incident response and threat hunting — guided** — `lab.incident-response-guided`; 120–180 minutes, resumable.

Scenario: Investigate a compromised dummy account, test alternative explanations and run a proportionate recovery tabletop.

Inputs: Synthetic identity and endpoint logs, a fictional asset owner, response contacts and a recovery plan. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: SIEM or lightweight query lab (`environment.siem`); Offline files and diagrams (`environment.offline`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Declare scope and roles

- Build a timeline and competing hypotheses

- Choose reversible containment

- Verify recovery and identify a control improvement

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Incident response and threat hunting — transfer** — `lab.incident-response-transfer`; 180–300 minutes, resumable.

Scenario: Investigate a compromised dummy account, test alternative explanations and run a proportionate recovery tabletop.

Inputs: Synthetic identity and endpoint logs, a fictional asset owner, response contacts and a recovery plan. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: SIEM or lightweight query lab (`environment.siem`); Offline files and diagrams (`environment.offline`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Declare scope and roles

- Build a timeline and competing hypotheses

- Choose reversible containment

- Verify recovery and identify a control improvement

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.incident-response-transfer`. Investigate a compromised dummy account, test alternative explanations and run a proportionate recovery tabletop. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Hunting without a falsifiable question

- Equating a single indicator match with attribution

- Taking irreversible containment action before considering evidence and impact

**Understand before progressing:** Explain preparation, detection, response, recovery, evidence limits and hypothesis-based hunting.

**Able to do after completion:** Lead a small simulated investigation and produce a recovery-focused incident report.

**Project contributions:** Incident investigation and hunt (`project.incident-hunt`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Incident investigation and hunt (`project.incident-hunt`).


### 21. Digital forensics and evidence analysis

**Module ID:** `module.digital-forensics`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Learn careful acquisition, analysis and reporting using synthetic or explicitly released evidence.

**Prerequisites and recommended preparation:** Defensive security, logs and SOC foundations (`module.defensive-foundations`); Programming, data and Python for security (`module.programming`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 33.1–47.2 hours, excluding the extra revision reserve. Required lessons 6.2 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 20.0–30.0 h.

**Learning objectives:**



- Preserve evidence context

- Interpret file metadata cautiously

- Correlate independent host artefacts

- Explain volatile evidence value

- Reconstruct a bounded sequence

**Topics:** Forensic method; Disk analysis; Host analysis; Memory analysis; Reporting.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Autopsy](https://www.sleuthkit.org/autopsy/) — official documentation; [Volatility 3 documentation](https://volatility3.readthedocs.io/en/latest/) — official documentation; [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — reference.


#### Topic: Forensic method — `topic.digital-forensics-forensic-method`


##### Evidence handling, acquisition and provenance

**Lesson ID:** `lesson.forensic-handling`  
**Module:** `module.digital-forensics`  
**Skill:** `skill.forensic-handling`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Evidence, privacy and reproducible notes (`skill.technical-notes`) ≥70; Encoding, hashes and integrity (`skill.hashing-integrity`) ≥70; Containment, escalation and recovery basics (`skill.response-basics`) ≥70

**Learning objectives:** Preserve evidence context; Explain live versus dead acquisition tradeoffs.

**Key concepts:** chain of custody, hash, working copy, write protection, acquisition.

**Practical task — `exercise.forensic-handling`:** Create a small dummy evidence archive, record its source and hash, and analyse a copied working version.

**Evidence to save:** Evidence manifest and handling record.

**Knowledge check — `assessment.forensic-handling-check`:**

1. Does a hash prove the acquisition was complete or lawful?

2. Why can live acquisition alter evidence?

**Mini challenge — `exercise.forensic-handling-challenge`:** Document a break in custody transparently rather than inventing continuity.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Evidence manifest and handling record submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Disk analysis — `topic.digital-forensics-disk-analysis`


##### Filesystem structures and recoverable artefacts

**Lesson ID:** `lesson.filesystem-forensics`  
**Module:** `module.digital-forensics`  
**Skill:** `skill.filesystem-forensics`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Evidence handling, acquisition and provenance (`skill.forensic-handling`) ≥70; Files, paths and filesystem behaviour (`skill.files-paths`) ≥70

**Learning objectives:** Interpret file metadata cautiously; Explain deletion and recovery limitations.

**Key concepts:** filesystem metadata, allocation, deleted file, timestamp, journal.

**Practical task — `exercise.filesystem-forensics`:** Use a small synthetic disk image or exported metadata to compare created, modified and deleted dummy files.

**Evidence to save:** Artefact inventory and recovery limitations.

**Knowledge check — `assessment.filesystem-forensics-check`:**

1. Does deleting a filename always erase its content immediately?

2. Why can SSD trimming affect recovery?

**Mini challenge — `exercise.filesystem-forensics-challenge`:** Explain why one recovered filename does not prove the file was opened.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Artefact inventory and recovery limitations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Host analysis — `topic.digital-forensics-host-analysis`


##### Windows, Linux and browser artefact correlation

**Lesson ID:** `lesson.host-artefacts`  
**Module:** `module.digital-forensics`  
**Skill:** `skill.host-artefacts`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Filesystem structures and recoverable artefacts (`skill.filesystem-forensics`) ≥70; Event logs, time and audit context (`skill.windows-events`) ≥70; Processes, packages and service logs (`skill.linux-services`) ≥70

**Learning objectives:** Correlate independent host artefacts; Avoid overinterpreting one trace.

**Key concepts:** event log, shell history, browser history, persistence artefact, corroboration.

**Practical task — `exercise.host-artefacts`:** Compare synthetic browser, event and shell records for one dummy user activity sequence.

**Evidence to save:** Correlated host-activity timeline.

**Knowledge check — `assessment.host-artefacts-check`:**

1. Does a shell-history entry prove successful execution?

2. Why corroborate across sources?

**Mini challenge — `exercise.host-artefacts-challenge`:** Resolve conflicting timestamps using provenance and clock context.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Correlated host-activity timeline submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Memory analysis — `topic.digital-forensics-memory-analysis`


##### Memory evidence and process relationships

**Lesson ID:** `lesson.memory-forensics`  
**Module:** `module.digital-forensics`  
**Skill:** `skill.memory-forensics`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Windows, Linux and browser artefact correlation (`skill.host-artefacts`) ≥70; Processes, services, users and privileges (`skill.processes-users`) ≥70

**Learning objectives:** Explain volatile evidence value; Interpret a curated memory-analysis result.

**Key concepts:** process tree, memory image, socket, module, tool compatibility.

**Practical task — `exercise.memory-forensics`:** Use a released training memory image or a clearly labelled synthetic process/socket export; identify an unusual relationship and its limits.

**Evidence to save:** Memory-analysis note with provenance and alternative explanation.

**Knowledge check — `assessment.memory-forensics-check`:**

1. Does an unusual process name prove malware?

2. Why record tool and image compatibility?

**Mini challenge — `exercise.memory-forensics-challenge`:** Find a benign explanation for an apparently suspicious parent-child relationship.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Memory-analysis note with provenance and alternative explanation submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Reporting — `topic.digital-forensics-reporting`


##### Timelines, confidence and forensic reporting

**Lesson ID:** `lesson.forensic-reporting`  
**Module:** `module.digital-forensics`  
**Skill:** `skill.forensic-reporting`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Memory evidence and process relationships (`skill.memory-forensics`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70

**Learning objectives:** Reconstruct a bounded sequence; Separate findings from interpretation.

**Key concepts:** timeline, corroboration, confidence, reproducibility, limitation.

**Practical task — `exercise.forensic-reporting`:** Write a report for the training evidence set with hashes, methods, findings and unanswered questions.

**Evidence to save:** Forensic report and reproducible evidence index.

**Knowledge check — `assessment.forensic-reporting-check`:**

1. Why should another analyst be able to reproduce your steps?

2. Can missing artefacts establish that an event never happened?

**Mini challenge — `exercise.forensic-reporting-challenge`:** Defend a cautious conclusion when asked for a stronger claim than the evidence supports.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Forensic report and reproducible evidence index submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Digital forensics and evidence analysis — guided** — `lab.digital-forensics-guided`; 120–180 minutes, resumable.

Scenario: Reconstruct a synthetic user activity sequence from a small disk image or exported artefacts and optional curated memory image.

Inputs: Learner-created dummy filesystem image or released training artefacts; working copies; acquisition manifest and expected ground truth kept separate. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Training evidence analysis (`environment.forensics`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Record provenance and hash

- Work only on a copy

- Extract a small set of artefacts

- Cross-check the timeline and state alternative explanations

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Digital forensics and evidence analysis — transfer** — `lab.digital-forensics-transfer`; 180–300 minutes, resumable.

Scenario: Reconstruct a synthetic user activity sequence from a small disk image or exported artefacts and optional curated memory image.

Inputs: Learner-created dummy filesystem image or released training artefacts; working copies; acquisition manifest and expected ground truth kept separate. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Training evidence analysis (`environment.forensics`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Record provenance and hash

- Work only on a copy

- Extract a small set of artefacts

- Cross-check the timeline and state alternative explanations

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.digital-forensics-transfer`. Reconstruct a synthetic user activity sequence from a small disk image or exported artefacts and optional curated memory image. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Analysing the only original copy

- Treating timestamps as unquestionable truth

- Reporting a recovered artefact without provenance or limitations

**Understand before progressing:** Explain preservation, hashes, chain of custody, filesystem artefacts, volatile data and confidence.

**Able to do after completion:** Analyse a small training evidence set and write reproducible, bounded findings.

**Project contributions:** A small forensic case file (`project.forensic-case`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** A small forensic case file (`project.forensic-case`).


### 22. Malware concepts and introductory reverse engineering

**Module ID:** `module.malware-reversing`  
**Path:** specialist  
**Difficulty:** Advanced professional extension

**Purpose:** Understand executable behaviour using benign programs and inert or released training artefacts.

**Prerequisites and recommended preparation:** Digital forensics and evidence analysis (`module.digital-forensics`); Programming, data and Python for security (`module.programming`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 37.8–54.0 hours, excluding the extra revision reserve. Required lessons 9.0 h; cumulative labs 7.0–10.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 20.0–32.0 h.

**Learning objectives:**



- Classify behaviour rather than filenames

- Read a small C program

- Follow a short instruction sequence

- Inspect executable structure and imports

- Observe harmless execution systematically

- Write an evidence-based behaviour summary

**Topics:** Analysis method; Executable foundations; Static analysis; Dynamic analysis; Reporting.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Ghidra project](https://github.com/NationalSecurityAgency/ghidra) — official documentation; [OpenSecurityTraining2](https://p.ost2.fyi/) — optional enrichment; [Volatility 3 documentation](https://volatility3.readthedocs.io/en/latest/) — official documentation.


#### Topic: Analysis method — `topic.malware-reversing-analysis-method`


##### Malware categories and analysis boundaries

**Lesson ID:** `lesson.malware-analysis-safety`  
**Module:** `module.malware-reversing`  
**Skill:** `skill.malware-analysis-safety`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Evidence handling, acquisition and provenance (`skill.forensic-handling`) ≥75; Choose and isolate a learning environment (`skill.lab-isolation`) ≥75; Tests, dependencies and safe tool use (`skill.testing-safe-code`) ≥75

**Learning objectives:** Classify behaviour rather than filenames; Define an appropriate analysis environment.

**Key concepts:** trojan, ransomware, loader, sandbox, egress.

**Practical task — `exercise.malware-analysis-safety`:** Design an offline analysis plan for a benign training binary; disable shared folders and document networking and restoration.

**Evidence to save:** Analysis plan and behaviour classification worksheet.

**Knowledge check — `assessment.malware-analysis-safety-check`:**

1. Does a VM by itself guarantee containment?

2. Is live malware execution required for this module?

**Mini challenge — `exercise.malware-analysis-safety-challenge`:** Explain why a public online scanner is inappropriate for a confidential file.

**Suggested resource types:** official documentation, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Analysis plan and behaviour classification worksheet submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Executable foundations — `topic.malware-reversing-executable-foundations`


##### C, memory, pointers and program layout

**Lesson ID:** `lesson.c-memory`  
**Module:** `module.malware-reversing`  
**Skill:** `skill.c-memory`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Malware categories and analysis boundaries (`skill.malware-analysis-safety`) ≥75; Variables, types and control flow (`skill.code-control-flow`) ≥75

**Learning objectives:** Read a small C program; Explain stack, heap and pointer bounds.

**Key concepts:** C syntax, pointer, array, stack, heap.

**Practical task — `exercise.c-memory`:** Write a harmless program that copies bounded dummy input, prints a transformed string and exits; trace memory ownership.

**Evidence to save:** Small C program and memory diagram.

**Knowledge check — `assessment.c-memory-check`:**

1. Why does a pointer not automatically include a valid length?

2. How do stack and heap allocation differ conceptually?

**Mini challenge — `exercise.c-memory-challenge`:** Identify a potential bounds mistake in toy source and repair it before execution.

**Suggested resource types:** official documentation, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Small C program and memory diagram submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Registers, instructions and calling conventions

**Lesson ID:** `lesson.assembly-basics`  
**Module:** `module.malware-reversing`  
**Skill:** `skill.assembly-basics`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** C, memory, pointers and program layout (`skill.c-memory`) ≥75; Bits, bytes, text and encodings (`skill.data-representation`) ≥75

**Learning objectives:** Follow a short instruction sequence; Relate machine state to source-level logic.

**Key concepts:** register, instruction, branch, stack frame, calling convention.

**Practical task — `exercise.assembly-basics`:** Disassemble your benign program for its actual architecture and annotate one function and conditional branch.

**Evidence to save:** Annotated short disassembly.

**Knowledge check — `assessment.assembly-basics-check`:**

1. Is assembly identical across CPU architectures?

2. Why inspect calling conventions?

**Mini challenge — `exercise.assembly-basics-challenge`:** Predict a register or variable change before single-stepping.

**Suggested resource types:** official documentation, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Annotated short disassembly submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Static analysis — `topic.malware-reversing-static-analysis`


##### Executable formats and static analysis

**Lesson ID:** `lesson.binary-analysis`  
**Module:** `module.malware-reversing`  
**Skill:** `skill.binary-analysis`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Registers, instructions and calling conventions (`skill.assembly-basics`) ≥75

**Learning objectives:** Inspect executable structure and imports; Qualify decompiler inferences.

**Key concepts:** PE/ELF, section, import, string, decompiler.

**Practical task — `exercise.binary-analysis`:** Inspect the benign binary with a suitable static tool; compare strings, imports and one decompiled function with source.

**Evidence to save:** Static-analysis worksheet with confirmed and inferred behaviour.

**Knowledge check — `assessment.binary-analysis-check`:**

1. Does a suspicious string prove it is used at runtime?

2. Is decompiled code the original source?

**Mini challenge — `exercise.binary-analysis-challenge`:** Find a compiler optimisation that obscures a source-level construct.

**Suggested resource types:** official documentation, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Static-analysis worksheet with confirmed and inferred behaviour submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Dynamic analysis — `topic.malware-reversing-dynamic-analysis`


##### Controlled observation and debugging

**Lesson ID:** `lesson.dynamic-analysis`  
**Module:** `module.malware-reversing`  
**Skill:** `skill.dynamic-analysis`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Executable formats and static analysis (`skill.binary-analysis`) ≥75; Windows, Linux and browser artefact correlation (`skill.host-artefacts`) ≥75

**Learning objectives:** Observe harmless execution systematically; Compare static predictions with runtime evidence.

**Key concepts:** breakpoint, file activity, process activity, instrumentation, coverage.

**Practical task — `exercise.dynamic-analysis`:** Run only the reviewed benign binary in the disposable environment; observe its dummy-file access and step through one branch.

**Evidence to save:** Runtime observation log and source comparison.

**Knowledge check — `assessment.dynamic-analysis-check`:**

1. Does observing one execution cover every possible path?

2. Why compare baseline and instrumented runs?

**Mini challenge — `exercise.dynamic-analysis-challenge`:** Choose an input that exercises a previously unobserved benign branch.

**Suggested resource types:** official documentation, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Runtime observation log and source comparison submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Reporting — `topic.malware-reversing-reporting`


##### Behaviour reports and detection ideas

**Lesson ID:** `lesson.malware-reporting`  
**Module:** `module.malware-reversing`  
**Skill:** `skill.malware-reporting`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Controlled observation and debugging (`skill.dynamic-analysis`) ≥75; Attacker behaviour and defensive visibility (`skill.attack-defence-mapping`) ≥75

**Learning objectives:** Write an evidence-based behaviour summary; Propose a bounded detection with caveats.

**Key concepts:** capability, indicator, behaviour, YARA concept, false positive.

**Practical task — `exercise.malware-reporting`:** Write a report for the benign binary and a training-only pattern or rule; test it against a second benign file.

**Evidence to save:** Binary-analysis report and tested training detection.

**Knowledge check — `assessment.malware-reporting-check`:**

1. Does a rule match establish malicious intent?

2. Why separate capability from observed action?

**Mini challenge — `exercise.malware-reporting-challenge`:** Identify a false positive and narrow the rule without pretending universal coverage.

**Suggested resource types:** official documentation, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Binary-analysis report and tested training detection submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Malware concepts and introductory reverse engineering — guided** — `lab.malware-reversing-guided`; 180–240 minutes, resumable.

Scenario: Compile and analyse a harmless program that reads a dummy file, transforms text and exits; compare source, disassembly and runtime evidence.

Inputs: Self-written benign C program or published inert training artefact, compatible compiler, debugger and optional Ghidra; disposable offline guest. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Benign binary analysis guest (`environment.binary`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Review source and expected effects

- Compile for a known architecture

- Inspect strings and control flow

- Observe harmless runtime behaviour and compare conclusions

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Malware concepts and introductory reverse engineering — transfer** — `lab.malware-reversing-transfer`; 240–360 minutes, resumable.

Scenario: Compile and analyse a harmless program that reads a dummy file, transforms text and exits; compare source, disassembly and runtime evidence.

Inputs: Self-written benign C program or published inert training artefact, compatible compiler, debugger and optional Ghidra; disposable offline guest. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Benign binary analysis guest (`environment.binary`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Review source and expected effects

- Compile for a known architecture

- Inspect strings and control flow

- Observe harmless runtime behaviour and compare conclusions

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.malware-reversing-transfer`. Compile and analyse a harmless program that reads a dummy file, transforms text and exits; compare source, disassembly and runtime evidence. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 75; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Executing an unknown sample on the everyday computer

- Treating decompiler output as original source

- Inferring malicious intent from one string or indicator

**Understand before progressing:** Explain C memory basics, machine instructions, executable structure and the limits of static and dynamic evidence.

**Able to do after completion:** Analyse a small benign binary and describe behaviour with evidence and uncertainty.

**Project contributions:** Benign binary behaviour analysis (`project.binary-case`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Benign binary behaviour analysis (`project.binary-case`).


### 23. Cloud foundations and practical security

**Module ID:** `module.cloud-security`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Build operational understanding of one cloud before trying to secure several.

**Prerequisites and recommended preparation:** Defensive security, logs and SOC foundations (`module.defensive-foundations`); Hardening, resilience and system design (`module.secure-systems`); Shell automation, Git and reproducible work (`module.automation-git`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 39.6–55.8 hours, excluding the extra revision reserve. Required lessons 8.8 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 24.0–36.0 h.

**Learning objectives:**



- Map cloud resources to operational responsibility

- Create a bounded cloud lab plan

- Grant narrowly scoped access

- Explain workload exposure

- Trace administrative actions in cloud logs

- Review a declarative infrastructure change

- Deliver a verified cloud control review

**Topics:** Cloud model; Sandbox operations; Identity; Infrastructure; Audit operations; Automation; Delivery.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html) — official documentation; [Managing costs with AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html) — official documentation; [Microsoft Learn for Azure](https://learn.microsoft.com/en-us/training/azure/) — structured course; [Google Cloud security documentation](https://docs.cloud.google.com/docs/security) — official documentation.


#### Topic: Cloud model — `topic.cloud-security-cloud-model`


##### Cloud services, regions and shared responsibility

**Lesson ID:** `lesson.cloud-operating-model`  
**Module:** `module.cloud-security`  
**Skill:** `skill.cloud-operating-model`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Cloud, virtual machines and containers (`skill.cloud-container-overview`) ≥70; Containment, escalation and recovery basics (`skill.response-basics`) ≥70

**Learning objectives:** Map cloud resources to operational responsibility; Distinguish control plane from data plane.

**Key concepts:** account/project, region, IaaS/PaaS/SaaS, control plane, data plane.

**Practical task — `exercise.cloud-operating-model`:** Choose AWS, Azure or Google Cloud for the branch; map a small workload and list customer/provider responsibilities.

**Evidence to save:** Single-provider architecture and responsibility map.

**Knowledge check — `assessment.cloud-operating-model-check`:**

1. Does a provider securing infrastructure fix a customer’s public storage policy?

2. Why distinguish control and data planes?

**Mini challenge — `exercise.cloud-operating-model-challenge`:** Explain how responsibilities change when moving a VM-hosted database to a managed database.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Single-provider architecture and responsibility map submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Sandbox operations — `topic.cloud-security-sandbox-operations`


##### Accounts, budgets and lab teardown

**Lesson ID:** `lesson.cloud-sandbox-costs`  
**Module:** `module.cloud-security`  
**Skill:** `skill.cloud-sandbox-costs`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Cloud services, regions and shared responsibility (`skill.cloud-operating-model`) ≥70; Permission, boundaries and stop conditions (`skill.authorised-scope`) ≥70

**Learning objectives:** Create a bounded cloud lab plan; Understand cost alerts and residual resources.

**Key concepts:** training tenant, MFA, budget alert, quota, teardown.

**Practical task — `exercise.cloud-sandbox-costs`:** Before provisioning, list every planned service and region, estimated cost source, maximum intended duration and cleanup checks; prefer provider-managed labs if uncertain.

**Evidence to save:** Cloud lab cost and teardown checklist.

**Knowledge check — `assessment.cloud-sandbox-costs-check`:**

1. Does a budget notification necessarily stop all spending?

2. Why check resources after stopping a VM?

**Mini challenge — `exercise.cloud-sandbox-costs-challenge`:** Identify a resource that survives the main deployment’s deletion.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Cloud lab cost and teardown checklist submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Identity — `topic.cloud-security-identity`


##### Cloud IAM, roles and policy evaluation

**Lesson ID:** `lesson.cloud-iam`  
**Module:** `module.cloud-security`  
**Skill:** `skill.cloud-iam`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Accounts, budgets and lab teardown (`skill.cloud-sandbox-costs`) ≥70; Sessions, OAuth, OIDC and tokens (`skill.federation-tokens`) ≥70

**Learning objectives:** Grant narrowly scoped access; Test allow and deny decisions with temporary identities.

**Key concepts:** principal, role, policy, condition, temporary credential.

**Practical task — `exercise.cloud-iam`:** Write a training policy for one dummy resource and validate an allowed read plus denied write and unrelated-resource access.

**Evidence to save:** IAM policy with positive and negative tests.

**Knowledge check — `assessment.cloud-iam-check`:**

1. Why prefer short-lived credentials where supported?

2. Why is testing only allowed access incomplete?

**Mini challenge — `exercise.cloud-iam-challenge`:** Remove a wildcard permission and show the intended workflow still works.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- IAM policy with positive and negative tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Infrastructure — `topic.cloud-security-infrastructure`


##### Cloud networks, storage and encryption controls

**Lesson ID:** `lesson.cloud-network-data`  
**Module:** `module.cloud-security`  
**Skill:** `skill.cloud-network-data`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Cloud IAM, roles and policy evaluation (`skill.cloud-iam`) ≥70; Firewalls, segmentation and secure administration (`skill.network-controls`) ≥70; Encryption, signatures and key lifecycle (`skill.encryption-keys`) ≥70

**Learning objectives:** Explain workload exposure; Verify network and storage boundaries.

**Key concepts:** virtual network, security rule, object storage, encryption, key policy.

**Practical task — `exercise.cloud-network-data`:** Inspect a training virtual network and private dummy storage; test that only the intended principal and network path can access them.

**Evidence to save:** Exposure review and access-test evidence.

**Knowledge check — `assessment.cloud-network-data-check`:**

1. Does encryption at rest prevent an overprivileged account from reading data?

2. Why review both identity and network controls?

**Mini challenge — `exercise.cloud-network-data-challenge`:** Find a policy change that makes encrypted storage unintentionally public.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Exposure review and access-test evidence submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Audit operations — `topic.cloud-security-audit-operations`


##### Cloud audit trails and incident questions

**Lesson ID:** `lesson.cloud-audit-response`  
**Module:** `module.cloud-security`  
**Skill:** `skill.cloud-audit-response`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Cloud networks, storage and encryption controls (`skill.cloud-network-data`) ≥70; Filtering, timelines and competing hypotheses (`skill.log-analysis`) ≥70

**Learning objectives:** Trace administrative actions in cloud logs; Recognise visibility and retention gaps.

**Key concepts:** audit event, principal, resource, region, retention.

**Practical task — `exercise.cloud-audit-response`:** Perform a harmless configuration change in the sandbox and locate its audit record; compare with a synthetic anomalous event.

**Evidence to save:** Cloud audit investigation note.

**Knowledge check — `assessment.cloud-audit-response-check`:**

1. Does absence from one regional view prove no event occurred?

2. Why record identity context for assumed roles?

**Mini challenge — `exercise.cloud-audit-response-challenge`:** Write a query or filter that distinguishes expected deployment changes from an unfamiliar identity.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Cloud audit investigation note submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Automation — `topic.cloud-security-automation`


##### Infrastructure as code and configuration review

**Lesson ID:** `lesson.cloud-iac`  
**Module:** `module.cloud-security`  
**Skill:** `skill.cloud-iac`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Cloud audit trails and incident questions (`skill.cloud-audit-response`) ≥70; Branches, review and secret hygiene (`skill.git-collaboration`) ≥70; Tests, dependencies and safe tool use (`skill.testing-safe-code`) ≥70

**Learning objectives:** Review a declarative infrastructure change; Protect configuration state and secrets.

**Key concepts:** IaC, plan, state, drift, policy test.

**Practical task — `exercise.cloud-iac`:** Describe the training workload using one provider-supported declarative format; inspect a plan and test for public exposure before applying in a sandbox.

**Evidence to save:** Reviewed infrastructure definition and plan.

**Knowledge check — `assessment.cloud-iac-check`:**

1. Why is an IaC state file potentially sensitive?

2. Why review deletions in a plan?

**Mini challenge — `exercise.cloud-iac-challenge`:** Detect a configuration drift and choose whether to reconcile or update the source.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Reviewed infrastructure definition and plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Delivery — `topic.cloud-security-delivery`


##### Cloud security review, restore and teardown

**Lesson ID:** `lesson.cloud-security-review`  
**Module:** `module.cloud-security`  
**Skill:** `skill.cloud-security-review`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Infrastructure as code and configuration review (`skill.cloud-iac`) ≥70; Backups, recovery and operational continuity (`skill.backup-resilience`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70

**Learning objectives:** Deliver a verified cloud control review; Confirm recovery and cleanup.

**Key concepts:** least privilege, recovery, logging, residual risk, cost closure.

**Practical task — `exercise.cloud-security-review`:** Restore dummy data, verify denied access, record audit evidence and tear down the training workload; check for remaining resources.

**Evidence to save:** Cloud review, recovery evidence and teardown record.

**Knowledge check — `assessment.cloud-security-review-check`:**

1. Why keep teardown evidence in a project?

2. Does a static policy review equal a live control test?

**Mini challenge — `exercise.cloud-security-review-challenge`:** Explain one control you could not test and the exact remaining limitation.

**Suggested resource types:** official documentation, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Cloud review, recovery evidence and teardown record submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Cloud foundations and practical security — guided** — `lab.cloud-security-guided`; 120–180 minutes, resumable.

Scenario: Deploy or inspect a private dummy-data service, enforce narrow access, collect audit evidence and verify teardown.

Inputs: One isolated training account or hosted sandbox; dummy data, explicit service and region choices, cost plan and expiry; offline policy fixtures for preparation only. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Single-provider training tenant (`environment.cloud`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Choose one provider and deployment model

- Test allowed and denied identity actions

- Review storage and network exposure

- Inspect audit events, restore dummy data and remove billable resources

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Cloud foundations and practical security — transfer** — `lab.cloud-security-transfer`; 180–300 minutes, resumable.

Scenario: Deploy or inspect a private dummy-data service, enforce narrow access, collect audit evidence and verify teardown.

Inputs: One isolated training account or hosted sandbox; dummy data, explicit service and region choices, cost plan and expiry; offline policy fixtures for preparation only. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Single-provider training tenant (`environment.cloud`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Choose one provider and deployment model

- Test allowed and denied identity actions

- Review storage and network exposure

- Inspect audit events, restore dummy data and remove billable resources

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.cloud-security-transfer`. Deploy or inspect a private dummy-data service, enforce narrow access, collect audit evidence and verify teardown. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Learning three providers at once

- Assuming a budget alert is a spending cap

- Using production accounts or long-lived administrator keys for experiments

**Understand before progressing:** Explain cloud responsibility, identity policy, networking, storage controls, audit evidence and teardown.

**Able to do after completion:** Secure and verify a small cloud workload in one provider or a hosted training tenant.

**Project contributions:** Secure a small cloud workload (`project.cloud-review`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Secure a small cloud workload (`project.cloud-review`).


### 24. Containers, delivery pipelines and DevSecOps

**Module ID:** `module.containers-devsecops`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Secure repeatable software delivery and understand container trust boundaries.

**Prerequisites and recommended preparation:** Cloud foundations and practical security (`module.cloud-security`); Web, JavaScript, HTTP and APIs (`module.web-technologies`); Shell automation, Git and reproducible work (`module.automation-git`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 38.3–54.5 hours, excluding the extra revision reserve. Required lessons 7.5 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 24.0–36.0 h.

**Learning objectives:**



- Explain image and runtime layers

- Reduce runtime privilege

- Design a bounded build pipeline

- Interpret dependency findings in context

- Explain pods, services and service accounts

- Choose useful pipeline security gates

**Topics:** Container model; Container controls; Delivery pipeline; Supply chain; Orchestration; Delivery governance.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [Docker Get started](https://docs.docker.com/get-started/) — official documentation; [Kubernetes security documentation](https://kubernetes.io/docs/concepts/security/) — official documentation; [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf) — reference; [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — reference.


#### Topic: Container model — `topic.containers-devsecops-container-model`


##### Images, containers, registries and networks

**Lesson ID:** `lesson.container-foundations`  
**Module:** `module.containers-devsecops`  
**Skill:** `skill.container-foundations`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Cloud, virtual machines and containers (`skill.cloud-container-overview`) ≥70; Documentation and reproducible tooling (`skill.reproducible-tooling`) ≥70

**Learning objectives:** Explain image and runtime layers; Run an explicitly scoped containerised app.

**Key concepts:** image, layer, registry, container, network.

**Practical task — `exercise.container-foundations`:** Build or inspect a small app image; bind the practice service only to loopback and document volumes and networks.

**Evidence to save:** Container inventory and reproducible run instructions.

**Knowledge check — `assessment.container-foundations-check`:**

1. Is an image the same as a running container?

2. Why inspect port binding explicitly?

**Mini challenge — `exercise.container-foundations-challenge`:** Recreate the app from its image without losing a deliberately mounted dummy-data volume.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Container inventory and reproducible run instructions submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Container controls — `topic.containers-devsecops-container-controls`


##### Container runtime and image hardening

**Lesson ID:** `lesson.container-hardening`  
**Module:** `module.containers-devsecops`  
**Skill:** `skill.container-hardening`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Images, containers, registries and networks (`skill.container-foundations`) ≥70; Baseline hardening and change control (`skill.host-hardening`) ≥70

**Learning objectives:** Reduce runtime privilege; Explain secrets and host boundary risks.

**Key concepts:** non-root, capability, read-only filesystem, secret mount, image provenance.

**Practical task — `exercise.container-hardening`:** Run the app without unnecessary privileges, remove build-time dummy secrets and test required functionality.

**Evidence to save:** Container hardening diff and negative tests.

**Knowledge check — `assessment.container-hardening-check`:**

1. Does deleting a secret in a later image layer erase it from earlier layers?

2. Why is mounting the host runtime socket dangerous?

**Mini challenge — `exercise.container-hardening-challenge`:** Remove one excessive capability and show the app still works.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Container hardening diff and negative tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Delivery pipeline — `topic.containers-devsecops-delivery-pipeline`


##### CI/CD, build identity and protected changes

**Lesson ID:** `lesson.ci-cd-security`  
**Module:** `module.containers-devsecops`  
**Skill:** `skill.ci-cd-security`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Container runtime and image hardening (`skill.container-hardening`) ≥70; Cloud IAM, roles and policy evaluation (`skill.cloud-iam`) ≥70; Branches, review and secret hygiene (`skill.git-collaboration`) ≥70

**Learning objectives:** Design a bounded build pipeline; Separate untrusted changes from privileged deployment.

**Key concepts:** pipeline, runner, workflow permission, secret, approval.

**Practical task — `exercise.ci-cd-security`:** Create a local or practice CI pipeline with tests and a build; document which identities can publish or deploy.

**Evidence to save:** Pipeline definition and permission review.

**Knowledge check — `assessment.ci-cd-security-check`:**

1. Why should untrusted pull requests not receive production secrets?

2. Why separate build and deployment permissions?

**Mini challenge — `exercise.ci-cd-security-challenge`:** Reject a pipeline change that grants broad write permissions without need.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Pipeline definition and permission review submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Supply chain — `topic.containers-devsecops-supply-chain`


##### Dependencies, SBOMs and provenance

**Lesson ID:** `lesson.software-supply-chain`  
**Module:** `module.containers-devsecops`  
**Skill:** `skill.software-supply-chain`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** CI/CD, build identity and protected changes (`skill.ci-cd-security`) ≥70; Validate scanner and configuration findings (`skill.vulnerability-validation`) ≥70

**Learning objectives:** Interpret dependency findings in context; Record build inputs and provenance.

**Key concepts:** dependency lock, SBOM, SCA, signature, provenance.

**Practical task — `exercise.software-supply-chain`:** Generate or manually inventory dependencies for the toy app; review one finding and record the affected path and remediation.

**Evidence to save:** Dependency inventory, finding triage and provenance record.

**Knowledge check — `assessment.software-supply-chain-check`:**

1. Does a signed artefact guarantee it has no vulnerabilities?

2. Why distinguish direct from transitive dependencies?

**Mini challenge — `exercise.software-supply-chain-challenge`:** Explain a scanner result that is present but unreachable in the app’s current use.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Dependency inventory, finding triage and provenance record submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Orchestration — `topic.containers-devsecops-orchestration`


##### Kubernetes objects and security boundaries

**Lesson ID:** `lesson.kubernetes-basics`  
**Module:** `module.containers-devsecops`  
**Skill:** `skill.kubernetes-basics`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Container runtime and image hardening (`skill.container-hardening`) ≥70; Cloud networks, storage and encryption controls (`skill.cloud-network-data`) ≥70; Cloud IAM, roles and policy evaluation (`skill.cloud-iam`) ≥70

**Learning objectives:** Explain pods, services and service accounts; Review basic cluster access controls.

**Key concepts:** pod, deployment, service, RBAC, network policy, secret.

**Practical task — `exercise.kubernetes-basics`:** Use a hosted lab or local disposable cluster to inspect one namespace; compare broad and narrow service-account permissions.

**Evidence to save:** Cluster boundary review and scoped access test.

**Knowledge check — `assessment.kubernetes-basics-check`:**

1. Is a namespace alone a complete security boundary?

2. Does storing a value in a Secret guarantee safe handling everywhere?

**Mini challenge — `exercise.kubernetes-basics-challenge`:** Restrict one training workload’s network or API access and test the result.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Cluster boundary review and scoped access test submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Delivery governance — `topic.containers-devsecops-delivery-governance`


##### Security gates, exceptions and rollback

**Lesson ID:** `lesson.devsecops-gates`  
**Module:** `module.containers-devsecops`  
**Skill:** `skill.devsecops-gates`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Dependencies, SBOMs and provenance (`skill.software-supply-chain`) ≥70; Kubernetes objects and security boundaries (`skill.kubernetes-basics`) ≥70; Infrastructure as code and configuration review (`skill.cloud-iac`) ≥70

**Learning objectives:** Choose useful pipeline security gates; Handle exceptions with accountable review.

**Key concepts:** SAST, DAST, policy check, exception, rollback.

**Practical task — `exercise.devsecops-gates`:** Add a check that fails for an intentionally insecure practice configuration; fix it and demonstrate a clean build plus rollback plan.

**Evidence to save:** Tested pipeline security controls and exception template.

**Knowledge check — `assessment.devsecops-gates-check`:**

1. Why can too many low-quality gates make delivery less secure?

2. What belongs in a temporary exception?

**Mini challenge — `exercise.devsecops-gates-challenge`:** Tune a noisy gate without hiding the underlying risk.

**Suggested resource types:** official documentation, reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Tested pipeline security controls and exception template submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Containers, delivery pipelines and DevSecOps — guided** — `lab.containers-devsecops-guided`; 120–180 minutes, resumable.

Scenario: Package the dummy-data app, run local security checks and reject a deliberately insecure change in a practice pipeline.

Inputs: A disposable container runtime or hosted lab, the local app repository and a private or local CI runner with dummy secrets. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable container/cluster lab (`environment.container`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Build and inspect an image

- Run with restricted privileges

- Add tests and dependency checks

- Demonstrate a failing and repaired pipeline and document cleanup

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Containers, delivery pipelines and DevSecOps — transfer** — `lab.containers-devsecops-transfer`; 180–300 minutes, resumable.

Scenario: Package the dummy-data app, run local security checks and reject a deliberately insecure change in a practice pipeline.

Inputs: A disposable container runtime or hosted lab, the local app repository and a private or local CI runner with dummy secrets. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Disposable container/cluster lab (`environment.container`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Build and inspect an image

- Run with restricted privileges

- Add tests and dependency checks

- Demonstrate a failing and repaired pipeline and document cleanup

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.containers-devsecops-transfer`. Package the dummy-data app, run local security checks and reject a deliberately insecure change in a practice pipeline. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Treating containers as equivalent to full VM isolation

- Passing secrets through image layers or build logs

- Blocking every dependency finding without context

**Understand before progressing:** Explain image provenance, runtime permissions, pipeline identity, supply-chain evidence and policy checks.

**Able to do after completion:** Build a reproducible pipeline with scoped permissions, tested controls and a documented rollback.

**Project contributions:** A secure container delivery pipeline (`project.secure-pipeline`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** A secure container delivery pipeline (`project.secure-pipeline`).


### 25. Secure development and application security engineering

**Module ID:** `module.application-security`  
**Path:** specialist  
**Difficulty:** Intermediate specialist

**Purpose:** Move from finding individual bugs to preventing and verifying classes of application failures.

**Prerequisites and recommended preparation:** Web application and API security testing (`module.web-security`); Shell automation, Git and reproducible work (`module.automation-git`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 31.8–46.0 hours, excluding the extra revision reserve. Required lessons 5.0 h; cumulative labs 5.0–8.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 20.0–30.0 h.

Optional lessons add 1.2 standard hours plus any additional practice.

**Learning objectives:**



- Translate threats into testable requirements

- Trace untrusted input to sensitive operations

- Create durable security regression tests

- Manage a finding through remediation

- Recognise untrusted model inputs and outputs

**Topics:** Secure lifecycle; Code review; Verification; Operations; Emerging applications.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [OWASP Application Security Verification Standard](https://owasp.org/projects/asvs) — reference; [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — reference; [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf) — reference; [MDN Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development) — structured course.


#### Topic: Secure lifecycle — `topic.application-security-secure-lifecycle`


##### Security requirements and abuse cases

**Lesson ID:** `lesson.security-requirements`  
**Module:** `module.application-security`  
**Skill:** `skill.security-requirements`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Threat modelling a small service (`skill.threat-modelling`) ≥70; API authorisation and business logic testing (`skill.api-business-logic`) ≥70

**Learning objectives:** Translate threats into testable requirements; Select a proportionate verification scope.

**Key concepts:** ASVS, abuse case, requirement, acceptance test, assurance.

**Practical task — `exercise.security-requirements`:** Choose a small, version-recorded ASVS subset relevant to the toy app and write acceptance tests without claiming full compliance.

**Evidence to save:** Requirement-to-test map with scope limits.

**Knowledge check — `assessment.security-requirements-check`:**

1. Why record the ASVS version?

2. Does passing a small subset prove full application security?

**Mini challenge — `exercise.security-requirements-challenge`:** Rewrite a vague requirement such as be secure into an observable control.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Requirement-to-test map with scope limits submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Code review — `topic.application-security-code-review`


##### Code review for trust boundaries and unsafe sinks

**Lesson ID:** `lesson.secure-code-review`  
**Module:** `module.application-security`  
**Skill:** `skill.secure-code-review`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Security requirements and abuse cases (`skill.security-requirements`) ≥70; Server routes, validation and database operations (`skill.backend-database`) ≥70; Branches, review and secret hygiene (`skill.git-collaboration`) ≥70

**Learning objectives:** Trace untrusted input to sensitive operations; Propose a root-cause fix.

**Key concepts:** source, sink, data flow, authorisation, error handling.

**Practical task — `exercise.secure-code-review`:** Review the app’s request-to-database and request-to-template paths; record one real flaw and one rejected suspicion.

**Evidence to save:** Annotated review and minimal corrective change.

**Knowledge check — `assessment.secure-code-review-check`:**

1. Why follow the full data path rather than search only keywords?

2. Why include negative findings from review?

**Mini challenge — `exercise.secure-code-review-challenge`:** Find a security bug in business logic that a simple string search misses.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Annotated review and minimal corrective change submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Verification — `topic.application-security-verification`


##### Security tests, fuzzing concepts and failure handling

**Lesson ID:** `lesson.security-regression`  
**Module:** `module.application-security`  
**Skill:** `skill.security-regression`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Code review for trust boundaries and unsafe sinks (`skill.secure-code-review`) ≥70; Tests, dependencies and safe tool use (`skill.testing-safe-code`) ≥70

**Learning objectives:** Create durable security regression tests; Use bounded input variation to explore failures.

**Key concepts:** negative test, property, fuzzing, boundary value, rate limit.

**Practical task — `exercise.security-regression`:** Add tests for cross-user access, malformed input and session expiry; run bounded input variations only against the local toy app.

**Evidence to save:** Security test suite and coverage limitations.

**Knowledge check — `assessment.security-regression-check`:**

1. Why can a test suite pass while an important vulnerability remains?

2. What makes fuzzing different from proving correctness?

**Mini challenge — `exercise.security-regression-challenge`:** Turn a discovered edge case into a stable regression test.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Security test suite and coverage limitations submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Operations — `topic.application-security-operations`


##### Vulnerability intake, secrets and secure change ownership

**Lesson ID:** `lesson.appsec-operations`  
**Module:** `module.application-security`  
**Skill:** `skill.appsec-operations`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Security tests, fuzzing concepts and failure handling (`skill.security-regression`) ≥70; Tickets, handoffs and responsible disclosure (`skill.professional-communication`) ≥70

**Learning objectives:** Manage a finding through remediation; Assign sustainable ownership and review.

**Key concepts:** intake, triage, secret rotation, dependency owner, release.

**Practical task — `exercise.appsec-operations`:** Run a fictional vulnerability intake for the toy app: reproduce, prioritise, fix, review, release and retest.

**Evidence to save:** Vulnerability lifecycle record and release verification.

**Knowledge check — `assessment.appsec-operations-check`:**

1. Why is a scanner finding without an owner often ineffective?

2. Does closing a ticket prove the deployed service is fixed?

**Mini challenge — `exercise.appsec-operations-challenge`:** Handle an exposed dummy secret as a lifecycle issue, including rotation and affected copies.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Vulnerability lifecycle record and release verification submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Emerging applications — `topic.application-security-emerging-applications`


##### Optional AI application trust boundaries — optional extension

**Lesson ID:** `lesson.ai-application-security`  
**Module:** `module.application-security`  
**Skill:** `skill.ai-application-security`  
**Difficulty:** Intermediate specialist

**Estimated duration:** 75 minutes standard; 60 for a compact complete attempt when feasible; 105 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Vulnerability intake, secrets and secure change ownership (`skill.appsec-operations`) ≥70; REST, JSON APIs and observable behaviour (`skill.api-design`) ≥70; Data handling, governance and ethical decisions (`skill.governance-data`) ≥70

**Learning objectives:** Recognise untrusted model inputs and outputs; Keep authorisation outside model judgement.

**Key concepts:** prompt injection, tool permission, data boundary, output validation, human approval.

**Practical task — `exercise.ai-application-security`:** Threat-model a fictional MyDay-style tutor that reads notes and suggests tasks; test with synthetic hostile note text and no real credentials.

**Evidence to save:** AI-feature threat model and boundary tests.

**Knowledge check — `assessment.ai-application-security-check`:**

1. Can a model’s instruction text enforce database authorisation by itself?

2. Why treat retrieved content as untrusted?

**Mini challenge — `exercise.ai-application-security-challenge`:** Design a test proving a note cannot cause an unapproved tool action.

**Suggested resource types:** reference, structured course. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

Additional reference: [OWASP LLM application risks](https://owasp.org/projects/top-10-for-large-language-model-applications).

**Completion criteria:**



- AI-feature threat model and boundary tests submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Secure development and application security engineering — guided** — `lab.application-security-guided`; 120–180 minutes, resumable.

Scenario: Harden the vulnerable notes app against selected access, input and session failures and verify each change.

Inputs: Owned toy app with dummy accounts, source control, tests and a deliberately limited ASVS requirement selection. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Choose explicit requirements and version

- Review trust-sensitive code paths

- Repair root causes

- Run positive and negative regression tests and document uncovered areas

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Secure development and application security engineering — transfer** — `lab.application-security-transfer`; 180–300 minutes, resumable.

Scenario: Harden the vulnerable notes app against selected access, input and session failures and verify each change.

Inputs: Owned toy app with dummy accounts, source control, tests and a deliberately limited ASVS requirement selection. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Local or assigned web lab (`environment.web`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Choose explicit requirements and version

- Review trust-sensitive code paths

- Repair root causes

- Run positive and negative regression tests and document uncovered areas

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.application-security-transfer`. Harden the vulnerable notes app against selected access, input and session failures and verify each change. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 70; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Treating the OWASP Top 10 as a complete verification standard

- Confusing scan completion with assurance

- Ignoring business logic and abuse cases

**Understand before progressing:** Explain requirements, secure design, code review, regression testing and vulnerability ownership.

**Able to do after completion:** Repair a toy application and provide repeatable evidence for selected security requirements.

**Project contributions:** Build, break and repair an owned toy app (`project.vulnerable-app-repair`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Build, break and repair an owned toy app (`project.vulnerable-app-repair`).


### 26. Security architecture, assurance and tradeoffs

**Module ID:** `module.security-architecture`  
**Path:** specialist  
**Difficulty:** Advanced professional extension

**Purpose:** Integrate business goals, identity, data, resilience and operations into defensible design decisions.

**Prerequisites and recommended preparation:** Cloud foundations and practical security (`module.cloud-security`); Secure development and application security engineering (`module.application-security`); Incident response and threat hunting (`module.incident-response`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 40.3–56.5 hours, excluding the extra revision reserve. Required lessons 7.5 h; cumulative labs 7.0–10.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 24.0–36.0 h.

**Learning objectives:**



- Translate business constraints into security requirements

- Design access around explicit identity and context

- Reduce single points of failure

- Define evidence for security claims

- Defend a design with alternatives

**Topics:** Architecture method; Trust design; System design; Assurance; Delivery.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) — reference; [OWASP Application Security Verification Standard](https://owasp.org/projects/asvs) — reference; [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf) — reference.


#### Topic: Architecture method — `topic.security-architecture-architecture-method`


##### Business requirements, assets and design constraints

**Lesson ID:** `lesson.architecture-requirements`  
**Module:** `module.security-architecture`  
**Skill:** `skill.architecture-requirements`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Cloud security review, restore and teardown (`skill.cloud-security-review`) ≥75; Vulnerability intake, secrets and secure change ownership (`skill.appsec-operations`) ≥75; Incident reports and learning without blame (`skill.incident-reporting`) ≥75

**Learning objectives:** Translate business constraints into security requirements; Identify assumptions needing validation.

**Key concepts:** asset, risk appetite, availability, privacy, constraint.

**Practical task — `exercise.architecture-requirements`:** Write requirements for a fictional service with limited operations staff, sensitive records and a recovery target.

**Evidence to save:** Architecture brief and assumption register.

**Knowledge check — `assessment.architecture-requirements-check`:**

1. Why start with constraints instead of buying controls?

2. Why make assumptions explicit?

**Mini challenge — `exercise.architecture-requirements-challenge`:** Compare two requirements that conflict and propose a justified tradeoff.

**Suggested resource types:** reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Architecture brief and assumption register submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Trust design — `topic.security-architecture-trust-design`


##### Identity-centred access and zero-trust principles

**Lesson ID:** `lesson.zero-trust-design`  
**Module:** `module.security-architecture`  
**Skill:** `skill.zero-trust-design`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Business requirements, assets and design constraints (`skill.architecture-requirements`) ≥75; Cloud IAM, roles and policy evaluation (`skill.cloud-iam`) ≥75; Firewalls, segmentation and secure administration (`skill.network-controls`) ≥75

**Learning objectives:** Design access around explicit identity and context; Avoid implicit trust from network location.

**Key concepts:** least privilege, device posture, policy decision, segmentation, continuous verification.

**Practical task — `exercise.zero-trust-design`:** Design access to the fictional service for staff, administrators and automation; identify enforcement points.

**Evidence to save:** Access architecture and failure-mode analysis.

**Knowledge check — `assessment.zero-trust-design-check`:**

1. Does zero trust mean refusing every connection?

2. Does internal network location prove a request is safe?

**Mini challenge — `exercise.zero-trust-design-challenge`:** Explain what happens when the identity provider is unavailable.

**Suggested resource types:** reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Access architecture and failure-mode analysis submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: System design — `topic.security-architecture-system-design`


##### Resilience, segmentation and data protection

**Lesson ID:** `lesson.resilient-architecture`  
**Module:** `module.security-architecture`  
**Skill:** `skill.resilient-architecture`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Identity-centred access and zero-trust principles (`skill.zero-trust-design`) ≥75; Backups, recovery and operational continuity (`skill.backup-resilience`) ≥75; Encryption, signatures and key lifecycle (`skill.encryption-keys`) ≥75

**Learning objectives:** Reduce single points of failure; Balance recovery, privacy and key management.

**Key concepts:** dependency, blast radius, RPO/RTO, key lifecycle, data flow.

**Practical task — `exercise.resilient-architecture`:** Compare two deployment designs under a simulated regional or identity failure; justify recovery and key-management choices.

**Evidence to save:** Resilience design and restore test plan.

**Knowledge check — `assessment.resilient-architecture-check`:**

1. Can redundancy substitute for a backup against logical corruption?

2. Why map dependencies for failover?

**Mini challenge — `exercise.resilient-architecture-challenge`:** Identify a recovery design that restores service but violates a data-access requirement.

**Suggested resource types:** reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Resilience design and restore test plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Assurance — `topic.security-architecture-assurance`


##### Control evidence, reviews and supplier boundaries

**Lesson ID:** `lesson.control-assurance`  
**Module:** `module.security-architecture`  
**Skill:** `skill.control-assurance`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Resilience, segmentation and data protection (`skill.resilient-architecture`) ≥75; Validate scanner and configuration findings (`skill.vulnerability-validation`) ≥75

**Learning objectives:** Define evidence for security claims; Assess inherited and third-party controls.

**Key concepts:** control objective, evidence, assurance, supplier, exception.

**Practical task — `exercise.control-assurance`:** For five architecture controls, define owner, test, expected evidence and review interval; examine a fictional supplier claim critically.

**Evidence to save:** Control evidence plan and supplier question set.

**Knowledge check — `assessment.control-assurance-check`:**

1. Does a certification automatically cover your exact deployment?

2. Why link each claim to evidence?

**Mini challenge — `exercise.control-assurance-challenge`:** Replace an unsupported assurance claim with a testable, bounded one.

**Suggested resource types:** reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Control evidence plan and supplier question set submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Delivery — `topic.security-architecture-delivery`


##### Architecture decisions and design review

**Lesson ID:** `lesson.architecture-review`  
**Module:** `module.security-architecture`  
**Skill:** `skill.architecture-review`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Control evidence, reviews and supplier boundaries (`skill.control-assurance`) ≥75; Tickets, handoffs and responsible disclosure (`skill.professional-communication`) ≥75

**Learning objectives:** Defend a design with alternatives; Communicate residual risk and operating requirements.

**Key concepts:** ADR, tradeoff, residual risk, operating model, review.

**Practical task — `exercise.architecture-review`:** Present two alternatives, recommend one and run a tabletop that challenges its assumptions; revise the design if evidence warrants.

**Evidence to save:** Architecture decision record and review response.

**Knowledge check — `assessment.architecture-review-check`:**

1. Why preserve rejected alternatives?

2. Does an architecture diagram prove controls operate?

**Mini challenge — `exercise.architecture-review-challenge`:** Respond to a budget cut without silently abandoning a critical requirement.

**Suggested resource types:** reference. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Architecture decision record and review response submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Security architecture, assurance and tradeoffs — guided** — `lab.security-architecture-guided`; 180–240 minutes, resumable.

Scenario: Design and review a fictional small organisation service under a limited budget and a recovery requirement.

Inputs: A written business scenario, data classification, two architecture options and constraints on staff, money and downtime. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Single-provider training tenant (`environment.cloud`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Define requirements and trust boundaries

- Compare control placements and failure modes

- Specify evidence and ownership

- Run a tabletop and revise the design

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Security architecture, assurance and tradeoffs — transfer** — `lab.security-architecture-transfer`; 240–360 minutes, resumable.

Scenario: Design and review a fictional small organisation service under a limited budget and a recovery requirement.

Inputs: A written business scenario, data classification, two architecture options and constraints on staff, money and downtime. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Offline files and diagrams (`environment.offline`); Single-provider training tenant (`environment.cloud`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Define requirements and trust boundaries

- Compare control placements and failure modes

- Specify evidence and ownership

- Run a tabletop and revise the design

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.security-architecture-transfer`. Design and review a fictional small organisation service under a limited budget and a recovery requirement. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 75; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Presenting a product list as an architecture

- Calling a network trusted because it is internal

- Ignoring failure modes, ownership and operating cost

**Understand before progressing:** Explain trust assumptions, security requirements, control coverage, recovery and assurance evidence.

**Able to do after completion:** Present an architecture decision with alternatives, tests, operational ownership and residual risks.

**Project contributions:** Security architecture review (`project.architecture-review`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Security architecture review (`project.architecture-review`).


### 27. Advanced offensive analysis and controlled adversary simulation

**Module ID:** `module.advanced-offensive`  
**Path:** specialist  
**Difficulty:** Advanced professional extension

**Purpose:** Extend an established methodology to complex lab attack paths and disciplined professional judgement.

**Prerequisites and recommended preparation:** Penetration testing methodology and reporting (`module.penetration-testing`); Local privilege boundaries and escalation labs (`module.privilege-escalation`); Active Directory and enterprise identity (`module.active-directory`); Malware concepts and introductory reverse engineering (`module.malware-reversing`). Exact lesson-level skill requirements appear below; module recommendations are navigation, not a blanket completion lock.

**Estimated study time:** 46.3–65.5 hours, excluding the extra revision reserve. Required lessons 7.5 h; cumulative labs 7.0–10.0 h; module assessment/delayed check 1.8–3.0 h; allocated project work 30.0–45.0 h.

Optional lessons add 1.5 standard hours plus any additional practice.

**Learning objectives:**



- Validate a multi-step application hypothesis

- Explain inconsistent interpretation across components

- Explain a permitted multi-hop route

- Evaluate an enterprise identity attack path

- Distinguish a crash from a usable exploit

- Plan a limited evidence-producing campaign

**Topics:** Advanced web; Network paths; Identity paths; Binary extension; Professional extension.

**Practical exercises:** Each lesson contains a specific practice task and transfer challenge. The cumulative labs below combine these skills.

**Resource options:** [PortSwigger Web Security Academy](https://portswigger.net/web-security) — practical lab; [HTB Academy skill and job-role path catalogue](https://academy.hackthebox.com/catalogue/paths) — structured course; [OWASP Web Security Testing Guide](https://owasp.org/projects/web-security-testing-guide) — reference; [MITRE ATT&CK](https://attack.mitre.org/) — reference; [OpenSecurityTraining2](https://p.ost2.fyi/) — optional enrichment.


#### Topic: Advanced web — `topic.advanced-offensive-advanced-web`


##### Advanced authentication and multi-step web flaws

**Lesson ID:** `lesson.advanced-web-logic`  
**Module:** `module.advanced-offensive`  
**Skill:** `skill.advanced-web-logic`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Professional pentest report, cleanup and retest (`skill.pentest-delivery`) ≥75; API authorisation and business logic testing (`skill.api-business-logic`) ≥75

**Learning objectives:** Validate a multi-step application hypothesis; Explain each security boundary crossed.

**Key concepts:** OAuth flow, JWT validation, business logic, state, precondition.

**Practical task — `exercise.advanced-web-logic`:** Complete an assigned advanced authentication or business-logic lab; document each verified prerequisite and minimal final effect.

**Evidence to save:** Validated multi-step lab report.

**Knowledge check — `assessment.advanced-web-logic-check`:**

1. Why can two real flaws fail to form a usable chain?

2. Why distinguish an assumed from a verified step?

**Mini challenge — `exercise.advanced-web-logic-challenge`:** Break one link with a targeted fix and retest the whole path.

**Suggested resource types:** practical lab, structured course, reference, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Validated multi-step lab report submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


##### Request ambiguity, race conditions and cache boundaries

**Lesson ID:** `lesson.protocol-race-analysis`  
**Module:** `module.advanced-offensive`  
**Skill:** `skill.protocol-race-analysis`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Advanced authentication and multi-step web flaws (`skill.advanced-web-logic`) ≥75; HTTP methods, status, headers and cookies (`skill.http-messages`) ≥75

**Learning objectives:** Explain inconsistent interpretation across components; Test timing-sensitive behaviour only in assigned labs.

**Key concepts:** request smuggling, race condition, cache key, parser disagreement, invariant.

**Practical task — `exercise.protocol-race-analysis`:** Use an assigned lab for one protocol ambiguity and one race or cache issue; keep traffic within its documented limits.

**Evidence to save:** Advanced web evidence with reproducibility limits.

**Knowledge check — `assessment.protocol-race-analysis-check`:**

1. Why do front-end and back-end parsing differences matter?

2. Why can a race result be hard to reproduce?

**Mini challenge — `exercise.protocol-race-analysis-challenge`:** Propose an atomic or canonical handling fix and describe a verification test.

**Suggested resource types:** practical lab, structured course, reference, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Advanced web evidence with reproducibility limits submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Network paths — `topic.advanced-offensive-network-paths`


##### Network reachability and pivoting in an isolated range

**Lesson ID:** `lesson.lab-pivoting`  
**Module:** `module.advanced-offensive`  
**Skill:** `skill.lab-pivoting`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Professional pentest report, cleanup and retest (`skill.pentest-delivery`) ≥75; Escalation report and regression checks (`skill.privilege-remediation`) ≥75; Firewalls, segmentation and secure administration (`skill.network-controls`) ≥75

**Learning objectives:** Explain a permitted multi-hop route; Constrain lab forwarding to exact destinations.

**Key concepts:** route, proxy, tunnel, segmentation, scope.

**Practical task — `exercise.lab-pivoting`:** In a hosted range designed for pivoting, map a two-segment path, use its permitted forwarding method and observe the connection logs.

**Evidence to save:** Lab path diagram, scoped proof and cleanup record.

**Knowledge check — `assessment.lab-pivoting-check`:**

1. Does gaining access to one host authorise all networks it can reach?

2. Why record routes and forwarding state during cleanup?

**Mini challenge — `exercise.lab-pivoting-challenge`:** Demonstrate that an out-of-scope segment remains unreachable without probing real systems.

**Suggested resource types:** practical lab, structured course, reference, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Lab path diagram, scoped proof and cleanup record submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Identity paths — `topic.advanced-offensive-identity-paths`


##### Advanced AD path validation and mitigation

**Lesson ID:** `lesson.ad-attack-path-validation`  
**Module:** `module.advanced-offensive`  
**Skill:** `skill.ad-attack-path-validation`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** AD hardening, audit and recovery (`skill.ad-defence`) ≥75; Escalation report and regression checks (`skill.privilege-remediation`) ≥75; Network reachability and pivoting in an isolated range (`skill.lab-pivoting`) ≥75

**Learning objectives:** Evaluate an enterprise identity attack path; Link mitigations to validated prerequisites.

**Key concepts:** delegation, service identity, ACL path, trust, credential boundary.

**Practical task — `exercise.ad-attack-path-validation`:** Use an assigned AD exercise with dummy identities; verify one allowed identity path and compare a permission or delegation repair.

**Evidence to save:** AD path analysis with mitigation and audit evidence.

**Knowledge check — `assessment.ad-attack-path-validation-check`:**

1. Why is graph reachability not the same as confirmed exploitability?

2. Why use dedicated dummy identities?

**Mini challenge — `exercise.ad-attack-path-validation-challenge`:** Remove one path edge and test whether an alternative authorised lab path remains.

**Suggested resource types:** practical lab, structured course, reference, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- AD path analysis with mitigation and audit evidence submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Binary extension — `topic.advanced-offensive-binary-extension`


##### Optional binary vulnerability and exploit-reliability concepts — optional extension

**Lesson ID:** `lesson.exploit-reliability`  
**Module:** `module.advanced-offensive`  
**Skill:** `skill.exploit-reliability`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Executable formats and static analysis (`skill.binary-analysis`) ≥75; Controlled observation and debugging (`skill.dynamic-analysis`) ≥75; Exploit selection and minimal lab validation (`skill.controlled-validation`) ≥75

**Learning objectives:** Distinguish a crash from a usable exploit; Explain modern memory protections.

**Key concepts:** memory corruption, crash, ASLR, NX, stack canary, reliability.

**Practical task — `exercise.exploit-reliability`:** Analyse a deliberately faulty benign toy program in an offline guest, reproduce its crash and repair the bounds error; do not develop a deployable payload.

**Evidence to save:** Crash analysis, fix and regression test.

**Knowledge check — `assessment.exploit-reliability-check`:**

1. Does a reproducible crash prove arbitrary code execution?

2. Why do mitigations change exploitability?

**Mini challenge — `exercise.exploit-reliability-challenge`:** Explain why the crash disappears after a bounds fix without disabling mitigations.

**Suggested resource types:** practical lab, structured course, reference, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Crash analysis, fix and regression test submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Topic: Professional extension — `topic.advanced-offensive-professional-extension`


##### Scoped adversary simulation and professional synthesis

**Lesson ID:** `lesson.purple-team-campaign`  
**Module:** `module.advanced-offensive`  
**Skill:** `skill.purple-team-campaign`  
**Difficulty:** Advanced professional extension

**Estimated duration:** 90 minutes standard; 75 for a compact complete attempt when feasible; 120 with extra depth, split as needed. A 15-minute checkpoint and 10-minute revision variant are available without claiming full completion.

**Prerequisites:** Request ambiguity, race conditions and cache boundaries (`skill.protocol-race-analysis`) ≥75; Advanced AD path validation and mitigation (`skill.ad-attack-path-validation`) ≥75; Detection change control and operational metrics (`skill.detection-lifecycle`) ≥75

**Learning objectives:** Plan a limited evidence-producing campaign; Evaluate defensive visibility and prevention.

**Key concepts:** objective, emulation, telemetry, deconfliction, retest.

**Practical task — `exercise.purple-team-campaign`:** Run one authorised lab path using harmless markers; compare expected versus observed telemetry and report controls that blocked or missed it.

**Evidence to save:** Purple-team report, detection gaps and retest plan.

**Knowledge check — `assessment.purple-team-campaign-check`:**

1. Does a failed test prove the organisation is secure?

2. Why include deconfliction and stop signals?

**Mini challenge — `exercise.purple-team-campaign-challenge`:** Revise the campaign after a missing log source invalidates a detection conclusion.

**Suggested resource types:** practical lab, structured course, reference, optional enrichment. Use the module’s verified options. The tutor can supply a worked example aligned with these objectives and checked against the reference material.

**Completion criteria:**



- Purple-team report, detection gaps and retest plan submitted

- Explain both knowledge-check answers accurately

- Practical rubric at least 70; scope checks pass

- Attempt the transfer challenge and record hints and unresolved errors

**Adaptable practice:** Shorten to one checkpoint; revise using the two questions; expand with a second input or failure case; reassess with a fresh challenge. Record partial completion and assistance explicitly.


#### Cumulative labs


**Advanced offensive analysis and controlled adversary simulation — guided** — `lab.advanced-offensive-guided`; 180–240 minutes, resumable.

Scenario: Run a scoped lab campaign with a web-to-host or identity path, limited proof and a purple-team review.

Inputs: Dedicated hosted advanced range or isolated multi-host lab; explicit permitted techniques, synthetic data, reset points and telemetry. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Assigned browser-based training lab (`environment.browser`); Isolated Active Directory range (`environment.ad`); Benign binary analysis guest (`environment.binary`); SIEM or lightweight query lab (`environment.siem`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Choose one objective and bounded path

- Validate every precondition

- Record attacker and defender observations

- Report broken links, fixes, cleanup and retest

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


**Advanced offensive analysis and controlled adversary simulation — transfer** — `lab.advanced-offensive-transfer`; 240–360 minutes, resumable.

Scenario: Run a scoped lab campaign with a web-to-host or identity path, limited proof and a purple-team review.

Inputs: Dedicated hosted advanced range or isolated multi-host lab; explicit permitted techniques, synthetic data, reset points and telemetry. Create synthetic inputs from this specification or use an explicitly assigned training instance; included starter logs are optional.

Environment choices: Assigned browser-based training lab (`environment.browser`); Isolated Active Directory range (`environment.ad`); Benign binary analysis guest (`environment.binary`); SIEM or lightweight query lab (`environment.siem`). Analysis-only substitutes retain the profile’s evidence limits.

Steps:



- Change at least two scenario inputs; state new expected results

- Choose one objective and bounded path

- Validate every precondition

- Record attacker and defender observations

- Report broken links, fixes, cleanup and retest

- Complete without the walkthrough; declare any hints and test an alternative explanation

Evidence: Scope and environment record; Observed results for each step; One failure or negative test; Explanation, limits and restoration note.

Pass criteria: Demonstrate the scenario outcome; Explain the evidence and at least one alternative; Pass all scope and evidence checks.

Reset: Restore the disposable state, remove test artefacts or end the assigned instance; retain only redacted evidence.


#### Module assessment and progression

**Assessment:** `assessment.advanced-offensive-transfer`. Run a scoped lab campaign with a web-to-host or identity path, limited proof and a purple-team review. Use a changed input or configuration, justify the conclusion and show a negative test.

**Rubric:** Correct scenario outcome 30%; Reasoning and alternatives 25%; Reproducible evidence and verification 25%; Scope and restoration 10%; Clear communication of limits 10%.

**Pass requirements:** Score at least 75; No critical scope or evidence failure; Individually record which skills were actually observed; do not copy one score to every skill. Required skill evidence must also satisfy the module exit threshold; optional lessons do not block it. The separate tutor policy checks evidence freshness and independence.

**Common mistakes:**



- Treating challenge difficulty as permission to exceed scope

- Chaining speculative findings as if every step was proved

- Omitting defender evidence and cleanup

**Understand before progressing:** Explain multi-step preconditions, protocol ambiguity, identity paths, lab routing and proof reliability.

**Able to do after completion:** Evaluate a complex training scenario, document each validated link and propose prevention and detection.

**Project contributions:** Controlled offensive and defensive capstone (`project.purple-campaign`). Full project briefs and criteria are in section 13.

**Final project gates at this module:** Controlled offensive and defensive capstone (`project.purple-campaign`).


## 13. Complete project progression

Use the goal and deliverables as the brief. Required skills describe starting readiness for independent synthesis, not a ban on guided project preparation. Each criterion carries 25%; total pass mark is 75 with the critical checks passed. The general anchors in section 7 apply. These hours are already included once in the route estimates; do not add them a second time.


### Project 1. A repeatable personal lab

**Project ID:** `project.lab-notebook`  
**Level:** beginner  
**Modules:** Learning method, scope and lab setup (`module.learning-lab`); Computer and operating-system fundamentals (`module.computer-os`)

**Goal:** Create a lab another learner could understand and recover.

**Skills required:** Permission, boundaries and stop conditions (`skill.authorised-scope`) ≥70; Choose and isolate a learning environment (`skill.lab-isolation`) ≥70; Files, paths and filesystem behaviour (`skill.files-paths`) ≥70; Software installation, updates and recovery (`skill.software-recovery`) ≥70; Evidence, privacy and reproducible notes (`skill.technical-notes`) ≥70

**Estimated time:** 4–7 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Lab inventory and scope

- Recovery demonstration

- Redacted notebook with three troubleshooting entries

**Assessment criteria:**



- Scope identifies exact assets and permitted actions — 25%

- A harmless change is successfully reversed — 25%

- Another learner can follow the notes — 25%

- Evidence distinguishes observation and inference — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Shows disciplined setup, troubleshooting and documentation rather than tool collecting.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 2. Network diagnosis casebook

**Project ID:** `project.network-diagnosis`  
**Level:** beginner  
**Modules:** Networking and traffic fundamentals (`module.networking`)

**Goal:** Explain and diagnose a small network using observable evidence.

**Skills required:** IPv4, IPv6 and practical subnetting (`skill.ip-addressing`) ≥70; Routing, DNS, DHCP and NAT (`skill.routing-dns-dhcp`) ≥70; TCP, UDP, ports and connection state (`skill.tcp-ip-basics`) ≥70; Read a small packet capture (`skill.packet-analysis`) ≥70; Troubleshoot segmentation and connectivity (`skill.network-diagnostics`) ≥70

**Estimated time:** 6–10 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Annotated topology

- Three fault investigations

- Small redacted capture or packet summary

- Addressing worksheet

**Assessment criteria:**



- Addressing and routing explanations are correct — 25%

- Tests distinguish DNS, transport and application faults — 25%

- Capture conclusions match visible evidence — 25%

- Limits and remediation are explicit — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Useful evidence for support, networking and SOC entry routes.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 3. Linux investigation and repair

**Project ID:** `project.linux-investigation`  
**Level:** beginner  
**Modules:** Linux administration and investigation (`module.linux`)

**Goal:** Diagnose a Linux permission, file-location and service problem.

**Skills required:** Shell navigation, help and safe file work (`skill.linux-shell`) ≥70; Streams, search and text pipelines (`skill.linux-text`) ≥70; Users, groups and file permissions (`skill.linux-permissions`) ≥70; Processes, packages and service logs (`skill.linux-services`) ≥70; SSH, sockets and Linux investigation (`skill.linux-network-investigation`) ≥70

**Estimated time:** 6–10 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Command transcript

- Three findings with evidence

- One repair and negative retest

- Rollback record

**Assessment criteria:**



- Uses minimum necessary privileges — 25%

- Identifies actual causes rather than symptoms — 25%

- Explains commands and output — 25%

- Restores the lab and records limits — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Demonstrates command-line confidence and practical host investigation.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 4. Windows baseline and recovery

**Project ID:** `project.windows-baseline`  
**Level:** beginner  
**Modules:** Windows administration and evidence (`module.windows`); Hardening, resilience and system design (`module.secure-systems`)

**Goal:** Inspect a Windows training host and verify a small hardening and recovery plan.

**Skills required:** Local users, groups, NTFS and UAC (`skill.windows-access`) ≥70; PowerShell objects and safe inspection (`skill.powershell-basics`) ≥70; Event logs, time and audit context (`skill.windows-events`) ≥70; Updates, endpoint controls and recovery (`skill.windows-hardening`) ≥70; Backups, recovery and operational continuity (`skill.backup-resilience`) ≥70

**Estimated time:** 8–14 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Redacted host inventory

- ACL positive and negative tests

- Short event timeline

- Restore demonstration

**Assessment criteria:**



- Access tests use separate dummy identities — 25%

- Events are interpreted with time and provider context — 25%

- Hardening preserves required function — 25%

- Recovery matches the stated objective — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Shows operational Windows skills useful beyond offensive security.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 5. A tested log-analysis utility

**Project ID:** `project.log-toolkit`  
**Level:** intermediate  
**Modules:** Programming, data and Python for security (`module.programming`); Shell automation, Git and reproducible work (`module.automation-git`)

**Goal:** Build a reliable small tool that summarises synthetic security events.

**Skills required:** Files, CSV, JSON and timestamps (`skill.structured-data`) ≥70; Regular expressions and reliable extraction (`skill.regex-parsing`) ≥70; Relational data and SQL queries (`skill.sql-data`) ≥70; Tests, dependencies and safe tool use (`skill.testing-safe-code`) ≥70; Documentation and reproducible tooling (`skill.reproducible-tooling`) ≥70

**Estimated time:** 10–16 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Source repository

- CSV/JSON sample input and expected outputs

- Tests for malformed and empty data

- README and limitations

**Assessment criteria:**



- Counts match hand-calculated ground truth — 25%

- Bad records are visible rather than silently lost — 25%

- Tests exercise meaningful failure cases — 25%

- A clean setup reproduces the result — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Demonstrates coding, testing, Git and evidence quality.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 6. Risk and identity design review

**Project ID:** `project.risk-identity-review`  
**Level:** intermediate  
**Modules:** Security principles, risk and identity (`module.security-foundations`); Applied cryptography and modern identity (`module.cryptography-identity`)

**Goal:** Recommend proportionate controls for a fictional small organisation.

**Skills required:** Risk, impact and proportionate decisions (`skill.risk-prioritisation`) ≥70; Authentication, authorisation and account lifecycle (`skill.iam-lifecycle`) ≥70; Data handling, governance and ethical decisions (`skill.governance-data`) ≥70; TLS, certificates and trust chains (`skill.tls-pki`) ≥70; Password storage, MFA and recovery (`skill.passwords-mfa`) ≥70; Sessions, OAuth, OIDC and tokens (`skill.federation-tokens`) ≥70

**Estimated time:** 8–12 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Asset and risk register

- Role and account-lifecycle design

- Crypto and session decisions

- Verification plan

**Assessment criteria:**



- Risks connect to concrete assets and impact — 25%

- Identity rules include negative cases — 25%

- Cryptographic choices use established controls — 25%

- Residual risk and ownership are clear — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Shows judgement and communication as well as technical vocabulary.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 7. Build a small local web application

**Project ID:** `project.local-web-app`  
**Level:** intermediate  
**Modules:** Web, JavaScript, HTTP and APIs (`module.web-technologies`)

**Goal:** Understand an application by building a localhost-only notes service with two dummy users.

**Skills required:** JavaScript, events and asynchronous requests (`skill.javascript-basics`) ≥70; Server routes, validation and database operations (`skill.backend-database`) ≥70; Sessions, same-origin policy and browser boundaries (`skill.web-sessions`) ≥70; REST, JSON APIs and observable behaviour (`skill.api-design`) ≥70

**Estimated time:** 12–20 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Source and setup instructions

- Route and data-flow map

- Dummy dataset

- Access and input tests

- Safe request logs

**Assessment criteria:**



- Server enforces user ownership — 25%

- Queries are parameterised — 25%

- Client and server responsibilities are explained — 25%

- No real secrets or personal data enter the repository — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Provides an owned system to inspect, later make deliberately vulnerable in a separate lab branch, and repair.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 8. A scoped vulnerability assessment

**Project ID:** `project.scoped-assessment`  
**Level:** intermediate  
**Modules:** Vulnerability assessment and remediation (`module.vulnerability-assessment`)

**Goal:** Find, validate, prioritise and retest weaknesses in an authorised disposable service.

**Skills required:** Assessment scope and safe test planning (`skill.assessment-scope`) ≥70; Inventory and low-impact service discovery (`skill.service-discovery`) ≥70; Validate scanner and configuration findings (`skill.vulnerability-validation`) ≥70; Severity, exploitability and remediation order (`skill.finding-priority`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70

**Estimated time:** 10–16 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Rules and target allowlist

- Inventory

- Confirmed and rejected findings

- Prioritised report

- Retest and cleanup evidence

**Assessment criteria:**



- All actions stay within scope — 25%

- Evidence supports each confirmed finding — 25%

- False positives are investigated — 25%

- Remediation is verified and limitations are stated — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** A credible early assessment sample showing the full finding lifecycle.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 9. Core capstone: investigate and improve a small service

**Project ID:** `project.core-investigation`  
**Level:** intermediate  
**Modules:** Defensive security, logs and SOC foundations (`module.defensive-foundations`)

**Goal:** Integrate networking, host, coding, web, risk and defensive reasoning in one investigation.

**Skills required:** Troubleshoot segmentation and connectivity (`skill.network-diagnostics`) ≥70; Filtering, timelines and competing hypotheses (`skill.log-analysis`) ≥70; SOC workflow and alert triage (`skill.soc-triage`) ≥70; Containment, escalation and recovery basics (`skill.response-basics`) ≥70; Findings, remediation and retest (`skill.security-reporting`) ≥70; Threat modelling a small service (`skill.threat-modelling`) ≥70

**Estimated time:** 16–24 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Scoped scenario and asset map

- Correlated synthetic evidence

- Competing hypotheses

- Owner-facing report

- One verified control improvement

**Assessment criteria:**



- Timeline reconciles time zones and duplicates — 25%

- Alternative explanations are tested — 25%

- Response is proportionate and recoverable — 25%

- Conclusions distinguish proved, inferred and unknown facts — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** The common foundation portfolio piece; completes the core evidence gate before a chosen role capstone.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 10. A role-focused portfolio and application pack

**Project ID:** `project.portfolio-pack`  
**Level:** intermediate  
**Modules:** Professional practice, portfolio and job preparation (`module.career-portfolio`)

**Goal:** Present your strongest existing evidence honestly for a chosen entry route.

**Skills required:** Understand roles and select a first target (`skill.role-selection`) ≥70; Build an honest, useful portfolio (`skill.portfolio-evidence`) ≥70; Tickets, handoffs and responsible disclosure (`skill.professional-communication`) ≥70; Applications, technical interviews and demonstrations (`skill.applications-interviews`) ≥70; Readiness review and continuing development (`skill.learning-roadmap`) ≥70

**Estimated time:** 8–12 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Two selected case studies

- Evidence index

- Three CV project bullets

- Ten-minute demonstration

- Focused next-quarter plan

**Assessment criteria:**



- Claims match actual independent work — 25%

- Private and restricted material is removed — 25%

- Role requirements map to evidence or stated gaps — 25%

- Demonstration includes a failure case and lessons learned — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Directly supports applications; update the same pack as branch projects improve.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 11. Web penetration test and repair

**Project ID:** `project.web-pentest`  
**Level:** advanced  
**Modules:** Web application and API security testing (`module.web-security`); Penetration testing methodology and reporting (`module.penetration-testing`)

**Goal:** Assess an authorised application and communicate verified security properties and weaknesses.

**Skills required:** Proxy workflow and web test planning (`skill.web-testing-workflow`) ≥75; Authentication, sessions and broken object access (`skill.access-auth-testing`) ≥75; API authorisation and business logic testing (`skill.api-business-logic`) ≥75; Professional pentest report, cleanup and retest (`skill.pentest-delivery`) ≥75

**Estimated time:** 24–36 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Scope and test matrix

- At least three justified test families

- Reproducible findings or well-supported negative results

- Repair tests where source is owned

- Technical and executive reports

**Assessment criteria:**



- Covers input, identity and application logic — 25%

- Uses minimal proof and correct scope — 25%

- Explains root causes and impact — 25%

- Retests and documents untested areas — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Strong evidence for junior web testing; demonstrates methodology beyond collecting flags.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 12. Build, break and repair an owned toy app

**Project ID:** `project.vulnerable-app-repair`  
**Level:** advanced  
**Modules:** Secure development and application security engineering (`module.application-security`)

**Goal:** Create a separate deliberately vulnerable lab branch, then repair two explicit flaws with regression tests.

**Skills required:** Server routes, validation and database operations (`skill.backend-database`) ≥75; Security requirements and abuse cases (`skill.security-requirements`) ≥75; Code review for trust boundaries and unsafe sinks (`skill.secure-code-review`) ≥75; Security tests, fuzzing concepts and failure handling (`skill.security-regression`) ≥75; Vulnerability intake, secrets and secure change ownership (`skill.appsec-operations`) ≥75

**Estimated time:** 20–30 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Local-only vulnerable branch with dummy data

- Threat model

- Minimal reproductions

- Fixed branch

- Version-recorded requirement tests

- Change review

**Assessment criteria:**



- Vulnerable app never becomes publicly exposed — 25%

- Each flaw has an explained data or trust-boundary cause — 25%

- Fixes address root causes — 25%

- Tests cover legitimate and forbidden behaviour — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Demonstrates developer empathy, secure coding and repeatable assurance for AppSec roles.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 13. AD lab and identity hardening

**Project ID:** `project.ad-lab`  
**Level:** advanced  
**Modules:** Active Directory and enterprise identity (`module.active-directory`)

**Goal:** Build or use a small isolated domain and verify least-privilege administration.

**Skills required:** Domains, forests, objects and DNS (`skill.ad-structure`) ≥75; Kerberos, LDAP and authentication flows (`skill.kerberos-directory`) ≥75; Groups, GPOs and delegated administration (`skill.ad-policy`) ≥75; Identity exposure and attack-path reasoning (`skill.ad-exposure`) ≥75; AD hardening, audit and recovery (`skill.ad-defence`) ≥75

**Estimated time:** 18–28 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Domain and DNS diagram

- Dummy user/group configuration

- Login diagnosis

- Permission review

- Hardening and audit retest

**Assessment criteria:**



- Authentication explanation includes DNS and time — 25%

- Effective access is tested — 25%

- One exposure is repaired without breaking required tasks — 25%

- Recovery and lab limitations are documented — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Useful evidence for enterprise operations, SOC and internal security testing.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 14. Linux and Windows privilege-boundary review

**Project ID:** `project.privilege-lab`  
**Level:** advanced  
**Modules:** Local privilege boundaries and escalation labs (`module.privilege-escalation`)

**Goal:** Explain two local escalation root causes and show effective remediation.

**Skills required:** Local enumeration and execution context (`skill.privilege-enumeration`) ≥75; Linux privilege misconfigurations (`skill.linux-escalation`) ≥75; Windows service and task permission flaws (`skill.windows-escalation`) ≥75; Secrets, credentials and local blast radius (`skill.secret-exposure`) ≥75; Escalation report and regression checks (`skill.privilege-remediation`) ≥75

**Estimated time:** 16–24 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Starting-access record

- One Linux and one Windows case

- Harmless proof

- Fix and negative test

- Cleanup notes

**Assessment criteria:**



- Privilege change is demonstrated rather than assumed — 25%

- No unrelated data is collected — 25%

- Root-cause fix preserves functionality — 25%

- All artefacts are removed or the range reset — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Shows platform-specific technical depth with restraint and reporting.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 15. SOC detection and triage project

**Project ID:** `project.soc-detection`  
**Level:** advanced  
**Modules:** SIEM, detection engineering and analyst practice (`module.detection-siem`)

**Goal:** Build a tested detection and demonstrate that an analyst can use it.

**Skills required:** Ingestion, schemas and time normalisation (`skill.siem-ingestion`) ≥75; Search, aggregation and correlation (`skill.siem-querying`) ≥75; Detection hypotheses and Sigma-style rules (`skill.detection-logic`) ≥75; Evaluate precision, recall and base rates (`skill.detection-evaluation`) ≥75; Triage a correlated alert and write a playbook (`skill.analyst-investigation`) ≥75; Detection change control and operational metrics (`skill.detection-lifecycle`) ≥75

**Estimated time:** 24–36 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Synthetic labelled dataset and holdout split

- Ingestion checks

- Rule and query

- Confusion matrix

- True/false-positive tickets

- Playbook and maintenance plan

**Assessment criteria:**



- Dataset labels and assumptions are auditable — 25%

- Rule catches the defined behaviour — 25%

- Precision and recall calculations are correct — 25%

- Limitations and operational actions are clear — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** A primary SOC portfolio piece that shows investigation and detection quality.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 16. Incident investigation and hunt

**Project ID:** `project.incident-hunt`  
**Level:** advanced  
**Modules:** Incident response and threat hunting (`module.incident-response`)

**Goal:** Run a complete synthetic incident investigation and a falsifiable follow-up hunt.

**Skills required:** Scope an incident and build a defensible timeline (`skill.incident-scoping`) ≥75; Hypothesis-driven hunting and intelligence use (`skill.threat-hunting`) ≥75; Containment, eradication and verified recovery (`skill.containment-recovery`) ≥75; Incident reports and learning without blame (`skill.incident-reporting`) ≥75

**Estimated time:** 18–28 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Incident timeline

- Hypotheses and searches

- Containment decision record

- Recovery tests

- Management update

- Improvement backlog

**Assessment criteria:**



- Evidence and chronology are reproducible — 25%

- Alternative explanations are addressed — 25%

- Response choices consider business impact — 25%

- Action items have owners and success checks — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Demonstrates analyst judgement, operational communication and continued improvement.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 17. A small forensic case file

**Project ID:** `project.forensic-case`  
**Level:** advanced  
**Modules:** Digital forensics and evidence analysis (`module.digital-forensics`)

**Goal:** Reconstruct a bounded activity sequence from synthetic or released training evidence.

**Skills required:** Evidence handling, acquisition and provenance (`skill.forensic-handling`) ≥75; Filesystem structures and recoverable artefacts (`skill.filesystem-forensics`) ≥75; Windows, Linux and browser artefact correlation (`skill.host-artefacts`) ≥75; Memory evidence and process relationships (`skill.memory-forensics`) ≥75; Timelines, confidence and forensic reporting (`skill.forensic-reporting`) ≥75

**Estimated time:** 20–30 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Provenance and hash manifest

- Working-copy analysis

- Correlated timeline

- Findings and confidence

- Repeatable analysis steps

**Assessment criteria:**



- Original evidence is preserved — 25%

- Tool outputs are corroborated — 25%

- Timestamp and acquisition limits are explicit — 25%

- Claims do not exceed evidence — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Shows disciplined evidence work relevant to DFIR and investigative support.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 18. Benign binary behaviour analysis

**Project ID:** `project.binary-case`  
**Level:** advanced  
**Modules:** Malware concepts and introductory reverse engineering (`module.malware-reversing`)

**Goal:** Explain how a small program works using source, disassembly and controlled observation.

**Skills required:** C, memory, pointers and program layout (`skill.c-memory`) ≥75; Registers, instructions and calling conventions (`skill.assembly-basics`) ≥75; Executable formats and static analysis (`skill.binary-analysis`) ≥75; Controlled observation and debugging (`skill.dynamic-analysis`) ≥75; Behaviour reports and detection ideas (`skill.malware-reporting`) ≥75

**Estimated time:** 20–32 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Benign source and build recipe

- Annotated disassembly

- Static/dynamic comparison

- Behaviour report

- Training detection and false-positive test

**Assessment criteria:**



- Architecture and build assumptions are explicit — 25%

- Claims distinguish observed from possible behaviour — 25%

- No unknown live sample is needed — 25%

- Detection limitations are demonstrated — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Introduces reverse-engineering evidence without overstating professional malware expertise.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 19. Secure a small cloud workload

**Project ID:** `project.cloud-review`  
**Level:** advanced  
**Modules:** Cloud foundations and practical security (`module.cloud-security`)

**Goal:** Deploy or inspect and harden a dummy-data workload in one provider.

**Skills required:** Accounts, budgets and lab teardown (`skill.cloud-sandbox-costs`) ≥75; Cloud IAM, roles and policy evaluation (`skill.cloud-iam`) ≥75; Cloud networks, storage and encryption controls (`skill.cloud-network-data`) ≥75; Cloud audit trails and incident questions (`skill.cloud-audit-response`) ≥75; Infrastructure as code and configuration review (`skill.cloud-iac`) ≥75; Cloud security review, restore and teardown (`skill.cloud-security-review`) ≥75

**Estimated time:** 24–36 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Architecture and cost plan

- Scoped IAM and network policies

- Positive/negative access tests

- Audit evidence

- Restore test

- Teardown record

**Assessment criteria:**



- No unrestricted administrator credentials in code — 25%

- Identity and network boundaries are both verified — 25%

- Recovery and logging work as claimed — 25%

- Residual resources and costs are checked — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** A concrete cloud operations and security sample; offline-only work must be labelled as design evidence.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 20. A secure container delivery pipeline

**Project ID:** `project.secure-pipeline`  
**Level:** advanced  
**Modules:** Containers, delivery pipelines and DevSecOps (`module.containers-devsecops`)

**Goal:** Deliver the toy app through a reproducible, least-privilege pipeline with meaningful security checks.

**Skills required:** Container runtime and image hardening (`skill.container-hardening`) ≥75; CI/CD, build identity and protected changes (`skill.ci-cd-security`) ≥75; Dependencies, SBOMs and provenance (`skill.software-supply-chain`) ≥75; Kubernetes objects and security boundaries (`skill.kubernetes-basics`) ≥75; Security gates, exceptions and rollback (`skill.devsecops-gates`) ≥75

**Estimated time:** 24–36 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Image and runtime configuration

- Dependency inventory

- Pipeline and permissions

- Fail/pass security-gate demonstration

- Kubernetes review

- Rollback and exception records

**Assessment criteria:**



- Secrets stay out of images and logs — 25%

- Pipeline identity is constrained — 25%

- Checks find the deliberate insecure change — 25%

- Delivery and rollback remain usable — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Evidence for junior DevSecOps or platform-security development after operational foundations.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 21. Security architecture review

**Project ID:** `project.architecture-review`  
**Level:** professional extension  
**Modules:** Security architecture, assurance and tradeoffs (`module.security-architecture`)

**Goal:** Defend a security design under realistic operational and budget constraints.

**Skills required:** Business requirements, assets and design constraints (`skill.architecture-requirements`) ≥75; Identity-centred access and zero-trust principles (`skill.zero-trust-design`) ≥75; Resilience, segmentation and data protection (`skill.resilient-architecture`) ≥75; Control evidence, reviews and supplier boundaries (`skill.control-assurance`) ≥75; Architecture decisions and design review (`skill.architecture-review`) ≥75

**Estimated time:** 24–36 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Requirements and threat model

- Two alternatives

- Decision record

- Control evidence plan

- Recovery tabletop

- Residual-risk register

**Assessment criteria:**



- Controls trace to requirements and threats — 25%

- Failure modes and dependencies are analysed — 25%

- Tradeoffs and ownership are explicit — 25%

- Review feedback changes the design when justified — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Shows developing design judgement; does not substitute for production architecture responsibility.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


### Project 22. Controlled offensive and defensive capstone

**Project ID:** `project.purple-campaign`  
**Level:** professional extension  
**Modules:** Advanced offensive analysis and controlled adversary simulation (`module.advanced-offensive`)

**Goal:** Validate a bounded lab attack path and assess prevention and detection together.

**Skills required:** Advanced authentication and multi-step web flaws (`skill.advanced-web-logic`) ≥75; Request ambiguity, race conditions and cache boundaries (`skill.protocol-race-analysis`) ≥75; Network reachability and pivoting in an isolated range (`skill.lab-pivoting`) ≥75; Advanced AD path validation and mitigation (`skill.ad-attack-path-validation`) ≥75; Scoped adversary simulation and professional synthesis (`skill.purple-team-campaign`) ≥75

**Estimated time:** 30–45 hours, in 30–90 minute checkpoints.

**Deliverables:**



- Rules of engagement

- Path with verified links

- Minimal proof and action log

- Detection coverage assessment

- Fix/retest report

- Cleanup evidence

**Assessment criteria:**



- Every tested action has explicit scope — 25%

- Every claimed path link has evidence — 25%

- Defensive conclusions match actual telemetry — 25%

- Report includes limits, operational impact and restoration — 25%

**Critical checks:** Authorised scope and appropriate data; Authentic evidence and honest assistance labels; Reproducible method and safe restoration.

**Portfolio value:** Professional-style synthesis for later development after a substantial practical foundation.

**Reattempt:** Change inputs or scenario after feedback; preserve previous evidence.


## 14. Environment profiles and CTF progression


### Offline files and diagrams — `environment.offline`

Compute: Any computer with editor and local file access.

Cost/access: No cloud bill; optional local tools.

Boundary: Synthetic files and dry-run scenarios.

Evidence limitation: Does not prove live administration or deployment skill.


### Assigned browser-based training lab — `environment.browser`

Compute: Modern browser and stable internet.

Cost/access: Provider access may be paid or time limited.

Boundary: Only the instance and actions assigned by the provider.

Evidence limitation: Equivalent live tasks count when evidence matches the rubric.


### Disposable Linux environment — `environment.linux`

Compute: Compatible local guest or hosted Linux environment.

Cost/access: Resource budget varies; one small guest at a time.

Boundary: Private lab network or loopback; dummy accounts and recovery point.

Evidence limitation: macOS is not Linux; verify command and service differences.


### Disposable Windows environment — `environment.windows`

Compute: Compatible licensed/evaluation guest or hosted Windows lab.

Cost/access: Check licence, expiry, CPU architecture and resource requirements.

Boundary: Dummy users, isolated exposure and restorable state.

Evidence limitation: Exported events prove analysis only, not Windows administration.


### Local or assigned web lab — `environment.web`

Compute: Browser and local development server, or hosted training instance.

Cost/access: No public deployment required.

Boundary: Loopback/private binding; dummy data; no unrelated integrations.

Evidence limitation: A vulnerable copy must never share production secrets or users.


### Isolated Active Directory range — `environment.ad`

Compute: Hosted AD range or compatible server and client guests.

Cost/access: Often heavier than a single workstation; use hosted option on a constrained Mac.

Boundary: Synthetic identities, no trust to real domains, private network.

Evidence limitation: A diagram alone cannot prove domain administration skills.


### SIEM or lightweight query lab — `environment.siem`

Compute: SQLite first; hosted or compatible local SIEM for platform practice.

Cost/access: Full ingestion stacks can be resource intensive.

Boundary: Synthetic labelled data with documented ground truth.

Evidence limitation: SQL-only analysis does not demonstrate SIEM deployment.


### Training evidence analysis — `environment.forensics`

Compute: Released or learner-created images; compatible forensic tools.

Cost/access: Small exported artefacts reduce hardware requirements.

Boundary: Work on copies; hash and record provenance.

Evidence limitation: Synthetic exports have less evidential richness than acquired images.


### Benign binary analysis guest — `environment.binary`

Compute: Compatible compiler/debugger; offline disposable environment.

Cost/access: Match the training architecture; no live malware required.

Boundary: Reviewed benign source; no host shares or unnecessary network access.

Evidence limitation: Unknown live-sample analysis is outside this introductory environment.


### Single-provider training tenant — `environment.cloud`

Compute: One isolated account/project or assigned hosted sandbox.

Cost/access: Check live prices, duration, region, quotas and residual resources.

Boundary: Dummy data; least-privilege identity; explicit teardown.

Evidence limitation: Budgets are alerts unless separately enforced; static review is not deployment evidence.


### Disposable container/cluster lab — `environment.container`

Compute: Compatible runtime or hosted container and Kubernetes lab.

Cost/access: One small workload; cluster may need hosted resources.

Boundary: Loopback/private exposure, no production sockets or credentials.

Evidence limitation: Containers share important host boundaries; verify runtime isolation.


### Optional challenge checkpoints


**Foundational puzzles** — `challenge-series.foundations`

Prerequisites: Streams, search and text pipelines (`skill.linux-text`) ≥70; Bits, bytes, text and encodings (`skill.data-representation`) ≥70

Task: Locate a file, decode a harmless string and explain each step. Sessions: 30, 60 or 90 minutes.

Evidence: Method and hypotheses; Assistance used; Result or honest unresolved state; Prevention or detection reflection. Flag count and speed do not establish mastery; choose a fresh variant for assessment. Budget separately or substitute only when the same rubric is met.

Resource: OverTheWire Bandit (`resource.bandit`).


**Web and API challenges** — `challenge-series.web`

Prerequisites: Proxy workflow and web test planning (`skill.web-testing-workflow`) ≥70; Authentication, sessions and broken object access (`skill.access-auth-testing`) ≥70

Task: Solve one assigned access-control or input-handling puzzle and propose a fix. Sessions: 30, 60 or 90 minutes.

Evidence: Method and hypotheses; Assistance used; Result or honest unresolved state; Prevention or detection reflection. Flag count and speed do not establish mastery; choose a fresh variant for assessment. Budget separately or substitute only when the same rubric is met.

Resource: PortSwigger Web Security Academy (`resource.portswigger`).


**Blue-team investigation challenge** — `challenge-series.defence`

Prerequisites: SOC workflow and alert triage (`skill.soc-triage`) ≥70; Filtering, timelines and competing hypotheses (`skill.log-analysis`) ≥70

Task: Investigate a synthetic alert and reject one plausible false explanation. Sessions: 30, 60 or 90 minutes.

Evidence: Method and hypotheses; Assistance used; Result or honest unresolved state; Prevention or detection reflection. Flag count and speed do not establish mastery; choose a fresh variant for assessment. Budget separately or substitute only when the same rubric is met.

Resource: TryHackMe Cyber Security 101 (`resource.thm-101`).


**Advanced mixed challenge** — `challenge-series.advanced`

Prerequisites: Professional pentest report, cleanup and retest (`skill.pentest-delivery`) ≥70; AD hardening, audit and recovery (`skill.ad-defence`) ≥70

Task: Attempt a bounded unfamiliar range and document dead ends, fixes and visibility. Sessions: 30, 60 or 90 minutes.

Evidence: Method and hypotheses; Assistance used; Result or honest unresolved state; Prevention or detection reflection. Flag count and speed do not establish mastery; choose a fresh variant for assessment. Budget separately or substitute only when the same rubric is met.

Resource: CyLab Security Academy (`resource.cylab`).


## 15. Verified resource catalogue

Checked 4 October 2026. Entry-page retrieval is not a guarantee of every subcourse, tool installation, account entitlement or future availability. These resources support the original curriculum design; the project and lesson briefs are independently authored rather than copied course content. No resource is mandatory.


### Official documentation

- **[The Python Tutorial](https://docs.python.org/3/tutorial/)** — `resource.python`; Python Software Foundation. The tutorial assumes programming familiarity; use as a reference after MyDay introductory examples.

- **[The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners)** — `resource.ubuntu`; Canonical. The page advertises a replacement tutorial; check current instructions and distro differences.

- **[PowerShell overview and documentation](https://learn.microsoft.com/en-us/powershell/scripting/overview)** — `resource.powershell`; Microsoft. Use help and documentation matching the installed version.

- **[Active Directory Domain Services overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)** — `resource.ms-ad`; Microsoft. AD DS conceptual reference; compatible hosted labs avoid local architecture constraints.

- **[Wireshark documentation](https://www.wireshark.org/docs/)** — `resource.wireshark`; Wireshark Foundation. Read relevant user-guide sections and inspect only authorised captures.

- **[Sigma documentation](https://sigmahq.io/docs/)** — `resource.sigma`; SigmaHQ. Portable detection format; backend fields and semantics still require testing.

- **[Wazuh documentation](https://documentation.wazuh.com/current/)** — `resource.wazuh`; Wazuh. One SIEM implementation option; lightweight SQL practice can precede a full deployment.

- **[Autopsy](https://www.sleuthkit.org/autopsy/)** — `resource.autopsy`; The Sleuth Kit / Autopsy project. Forensic tool entry point; use synthetic or appropriately released evidence.

- **[Volatility 3 documentation](https://volatility3.readthedocs.io/en/latest/)** — `resource.volatility`; Volatility Foundation. Check image and plugin compatibility; outputs need corroboration.

- **[Ghidra project](https://github.com/NationalSecurityAgency/ghidra)** — `resource.ghidra`; National Security Agency. Analyse compatible benign training binaries before unknown samples.

- **[AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)** — `resource.aws-iam`; AWS. AWS track reference; test provider-specific policy semantics.

- **[Managing costs with AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)** — `resource.aws-budgets`; AWS. Budget notifications can lag usage and are not a universal hard spending cap.

- **[Google Cloud security documentation](https://docs.cloud.google.com/docs/security)** — `resource.gcp-security`; Google Cloud. Alternative provider track; avoid simultaneous multi-cloud study at first.

- **[Docker Get started](https://docs.docker.com/get-started/)** — `resource.docker`; Docker. Check architecture and licensing before installation; local runtime is optional.

- **[Kubernetes security documentation](https://kubernetes.io/docs/concepts/security/)** — `resource.kubernetes`; Kubernetes project. Use after container, identity and network fundamentals.

- **[Nmap Reference Guide](https://nmap.org/book/man.html)** — `resource.nmap`; Nmap project. Use explicit authorised targets and restrained options; prefer local inspection first.


### Structured course

- **[TryHackMe Pre Security](https://tryhackme.com/path/outline/presecurity)** — `resource.thm-pre`; TryHackMe. Select missing foundations; do not duplicate the entire path when MyDay evidence already covers them.

- **[TryHackMe Cyber Security 101](https://tryhackme.com/path/outline/cybersecurity101)** — `resource.thm-101`; TryHackMe. Use selected beginner labs; availability and paid access vary.

- **[HTB Academy Information Security Foundations](https://academy.hackthebox.com/path/preview/information-security-foundations)** — `resource.htb-foundations`; Hack The Box. Use relevant modules and assigned instances; check access requirements.

- **[HTB Academy skill and job-role path catalogue](https://academy.hackthebox.com/catalogue/paths)** — `resource.htb-paths`; Hack The Box. Select role-specific host, enterprise or web material after the stated foundations; check current prerequisites and access.

- **[MDN Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development)** — `resource.mdn`; MDN. Use foundational HTML, JavaScript and web explanations before security exercises.

- **[Cisco Networking Academy catalogue](https://www.netacad.com/)** — `resource.cisco`; Cisco. Select introductory networking material; catalogue and access can change.

- **[Microsoft Learn for Azure](https://learn.microsoft.com/en-us/training/azure/)** — `resource.azure-training`; Microsoft. Alternative provider track; inspect current lab availability before depending on it.


### Practical lab

- **[PortSwigger Web Security Academy](https://portswigger.net/web-security)** — `resource.portswigger`; PortSwigger. Begin with introductory labs; select tasks by prerequisite and use only assigned instances.

- **[OWASP Juice Shop](https://owasp.org/projects/juice-shop)** — `resource.juice-shop`; OWASP. Intentionally vulnerable; use private local or explicitly assigned training instances.

- **[OWASP WebGoat](https://owasp.org/projects/webgoat)** — `resource.webgoat`; OWASP. Intentionally vulnerable; keep the training instance isolated.

- **[OverTheWire Bandit](https://overthewire.org/wargames/bandit/)** — `resource.bandit`; OverTheWire. Beginner command-line wargame; honour the provider rules and avoid publishing restricted solutions.


### Reference

- **[NIST NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions)** — `resource.nice`; NIST. Role and task vocabulary; no claim of formal NICE accreditation or exhaustive mapping.

- **[OWASP Web Security Testing Guide](https://owasp.org/projects/web-security-testing-guide)** — `resource.owasp-wstg`; OWASP. Use released v4.2 for versioned test references; development content is separately labelled.

- **[OWASP Application Security Verification Standard](https://owasp.org/projects/asvs)** — `resource.owasp-asvs`; OWASP. Version 5.0.0 is identified on the project page; record exact version and selected requirements.

- **[OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)** — `resource.owasp-cheats`; OWASP. Targeted implementation guidance, not a linear beginner course.

- **[Pro Git](https://git-scm.com/book/en/v2)** — `resource.git`; Git project. Read selected workflow chapters and practise locally before remote collaboration.

- **[MITRE ATT&CK](https://attack.mitre.org/)** — `resource.mitre`; MITRE. Behaviour vocabulary and defensive reasoning; not proof that a detection works.

- **[NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)** — `resource.nist-ir`; NIST. Incident-response reference; use current terminology with concrete operational exercises.

- **[NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)** — `resource.nist-ssdf`; NIST. Secure lifecycle reference; record the version used rather than assuming draft status.

- **[NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)** — `resource.nist-csf`; NIST. Risk and control organisation; a framework is not a turnkey control implementation.

- **[NIST SP 800-115](https://csrc.nist.gov/pubs/sp/800/115/final)** — `resource.nist-testing`; NIST. Established testing process reference; older tool examples are not current installation instructions.

- **[FIRST CVSS](https://www.first.org/cvss/)** — `resource.cvss`; FIRST. Record scoring version; technical severity is only one input to priority.

- **[OWASP Top 10 for LLM Applications](https://owasp.org/projects/top-10-for-large-language-model-applications)** — `resource.owasp-ai`; OWASP. Optional AI application threat reference; application permissions remain outside model judgement.


### Optional enrichment

- **[CyLab Security Academy](https://cylabacademy.org/)** — `resource.cylab`; Carnegie Mellon University. The former picoCTF entry page points here; choose challenges matching learned skills.

- **[OpenSecurityTraining2](https://p.ost2.fyi/)** — `resource.ost2`; OpenSecurityTraining2. Further architecture and low-level training after programming foundations.


## 16. Knowledge-check answer guide

Attempt each question before reading its guide. Accept equivalent accurate wording. In the app, release answers after submission or keep them in the tutor’s restricted assessment context. Seeing an answer is not an independent recall attempt.


**Learning through evidence — `lesson.learning-evidence`**

1. No; performance needs observable evidence.

2. It identifies what must be checked rather than guessed.


**Permission, boundaries and stop conditions — `lesson.authorised-scope`**

1. No; access and permission are different.

2. No; scope must exclude unapproved shared infrastructure.


**Choose and isolate a learning environment — `lesson.lab-isolation`**

1. No; verify actual connectivity, forwarding and exposure.

2. No; they address different failure modes.


**Evidence, privacy and reproducible notes — `lesson.technical-notes`**

1. Another reviewer can evaluate the inference.

2. Credentials, personal data and unapproved target details.


**Read errors and ask useful questions — `lesson.help-and-debugging`**

1. It makes cause and effect easier to identify.

2. Goal, environment, exact redacted error, attempted steps and result.


**CPU, memory, storage and peripherals — `lesson.hardware-resources`**

1. RAM and persistent storage serve different roles.

2. Executable and guest compatibility depend on architecture and virtualisation support.


**Bits, bytes, text and encodings — `lesson.data-representation`**

1. No; it is reversible encoding without a secret key.

2. Eight.


**Files, paths and filesystem behaviour — `lesson.files-paths`**

1. The current working directory.

2. No; its bytes do not change.


**Processes, services, users and privileges — `lesson.processes-users`**

1. No; a process is a running instance with state.

2. They increase the consequences of mistakes and compromise.


**Software installation, updates and recovery — `lesson.software-recovery`**

1. Results and instructions may vary across versions.

2. A successful restore with verified contents.


**Frames, packets and the network journey — `lesson.network-models`**

1. No; IP routing connects networks, while link-layer addresses serve local links.

2. They separate responsibilities and help localise faults.


**IPv4, IPv6 and practical subnetting — `lesson.ip-addressing`**

1. The number of network-prefix bits.

2. No; reachability still needs access control.


**Routing, DNS, DHCP and NAT — `lesson.routing-dns-dhcp`**

1. Yes; name resolution is a separate step.

2. No; address translation does not verify identity.


**TCP, UDP, ports and connection state — `lesson.tcp-ip-basics`**

1. No; it is a clue that needs validation.

2. It may prefer low overhead or implement its own delivery behaviour.


**Common services, time and remote administration — `lesson.common-network-services`**

1. No; actual protocol behaviour and configuration must be checked.

2. Authentication, certificates and cross-system evidence depend on it.


**Read a small packet capture — `lesson.packet-analysis`**

1. No; encryption generally conceals it without session secrets or endpoint access.

2. It reduces unrelated sensitive traffic and simplifies analysis.


**Troubleshoot segmentation and connectivity — `lesson.network-diagnostics`**

1. No; it changes connectivity and trust boundaries, not application correctness.

2. ICMP may be blocked while TCP is allowed.


**Shell navigation, help and safe file work — `lesson.linux-shell`**

1. To preserve it as one argument.

2. The current directory and exact target path.


**Streams, search and text pipelines — `lesson.linux-text`**

1. Standard output unless redirected otherwise.

2. It signals success or failure independently of visible output.


**Users, groups and file permissions — `lesson.linux-permissions`**

1. It grants excessive access and obscures the cause.

2. No; one is an account and the other a path.


**Processes, packages and service logs — `lesson.linux-services`**

1. They may reveal a specific, smaller fault.

2. No; installation and runtime state differ.


**SSH, sockets and Linux investigation — `lesson.linux-network-investigation`**

1. Connecting to an impersonating or changed server.

2. They expose a service on different interfaces.


**Windows architecture and everyday administration — `lesson.windows-system`**

1. No; it is a configuration database.

2. It supports diagnosis and rollback.


**Local users, groups, NTFS and UAC — `lesson.windows-access`**

1. No; permissions must deny unauthorised access.

2. Effective permissions combine applicable access rules.


**PowerShell objects and safe inspection — `lesson.powershell-basics`**

1. It passes structured properties rather than only formatted text.

2. Display columns may not show all available data.


**Event logs, time and audit context — `lesson.windows-events`**

1. No; context and corroboration are required.

2. No; logging, collection and retention may be incomplete.


**Updates, endpoint controls and recovery — `lesson.windows-hardening`**

1. Recoverability must be demonstrated.

2. It changes the environment and may expose the host.


**Variables, types and control flow — `lesson.code-control-flow`**

1. Their types and supported operations differ.

2. Assignment changes a binding; comparison tests a relation.


**Functions, debugging and error handling — `lesson.functions-debugging`**

1. It can hide bugs and corrupted results.

2. Clear inputs, outputs and limited side effects.


**Files, CSV, JSON and timestamps — `lesson.structured-data`**

1. Quoted values can contain commas.

2. It helps audit conversion and source ambiguity.


**Regular expressions and reliable extraction — `lesson.regex-parsing`**

1. It may match a substring rather than the whole field.

2. When the data format is nested or has complex grammar.


**Relational data and SQL queries — `lesson.sql-data`**

1. Multiple matching rows produce multiple combinations.

2. No; NULL represents missing or unknown data.


**Tests, dependencies and safe tool use — `lesson.testing-safe-code`**

1. It exposes assumptions hidden by normal data.

2. Input may be interpreted as commands rather than data.


**Git history, diffs and sensible commits — `lesson.git-history`**

1. No; Git is version control and GitHub is a hosting service.

2. They may differ from the changes you intended to record.


**Branches, review and secret hygiene — `lesson.git-collaboration`**

1. No; revoke or rotate the key and handle existing history.

2. A syntactically valid merge can still change meaning.


**Bash scripting with bounded effects — `lesson.bash-automation`**

1. To preserve whitespace and prevent unintended splitting or expansion.

2. Repeating the action leaves the intended state unchanged.


**PowerShell automation and structured output — `lesson.powershell-automation`**

1. Downstream tools can filter and export structured fields.

2. They imply different system states.


**Documentation and reproducible tooling — `lesson.reproducible-tooling`**

1. It lets another user check installation and behaviour.

2. It prevents a lab result being misrepresented as a real incident.


**Assets, threats and security goals — `lesson.security-goals`**

1. Yes; unauthorised alteration need not disclose data.

2. No; a weakness may exist without observed exploitation.


**Risk, impact and proportionate decisions — `lesson.risk-prioritisation`**

1. No; context affects urgency and impact.

2. Someone must decide treatment and accept remaining exposure.


**Authentication, authorisation and account lifecycle — `lesson.iam-lifecycle`**

1. Yes; authorisation is a separate decision.

2. Actions cannot reliably be attributed to one person.


**Human factors, phishing recognition and reporting — `lesson.human-security`**

1. No; the visible name can mislead.

2. It discourages early reporting and slows response.


**Data handling, governance and ethical decisions — `lesson.governance-data`**

1. No; implementation evidence is required.

2. It reduces exposure and unnecessary handling.


**Encoding, hashes and integrity — `lesson.hashing-integrity`**

1. No; source authenticity needs additional trust evidence.

2. Yes.


**Encryption, signatures and key lifecycle — `lesson.encryption-keys`**

1. No; authenticity depends on the construction and trust model.

2. The signer’s public key within a trusted identity binding.


**TLS, certificates and trust chains — `lesson.tls-pki`**

1. No; it protects the connection and authenticates the certified identity under a trust model.

2. The certificate may not identify the requested endpoint.


**Password storage, MFA and recovery — `lesson.passwords-mfa`**

1. It makes large-scale guessing cheaper and lacks appropriate password-hardening design.

2. Yes; recovery is another authentication path.


**Sessions, OAuth, OIDC and tokens — `lesson.federation-tokens`**

1. No.

2. No; OIDC adds an identity layer to OAuth flows.


**Browser, server, HTML and trust boundaries — `lesson.web-architecture`**

1. No; the client controls submitted data.

2. Their trust, visibility and execution environments differ.


**HTTP methods, status, headers and cookies — `lesson.http-messages`**

1. No; application semantics also matter.

2. HTTP requests do not inherently carry application session state.


**JavaScript, events and asynchronous requests — `lesson.javascript-basics`**

1. It is scheduled and completes later through promises or callbacks.

2. It can turn data into executable browser content.


**Server routes, validation and database operations — `lesson.backend-database`**

1. Input may be interpreted as SQL syntax.

2. No; clients can send requests directly.


**Sessions, same-origin policy and browser boundaries — `lesson.web-sessions`**

1. No; it primarily controls browser access to cross-origin responses.

2. A still-valid session can otherwise continue access.


**REST, JSON APIs and observable behaviour — `lesson.api-design`**

1. A protected UI does not prevent direct API access.

2. Logs become another path to sensitive data exposure.


**Threat modelling a small service — `lesson.threat-modelling`**

1. Threats depend on how data and authority cross them.

2. No; relevant changes require review.


**Baseline hardening and change control — `lesson.host-hardening`**

1. A control that breaks needed work may be bypassed or rolled back.

2. They identify deliberate remaining exposure and review dates.


**Firewalls, segmentation and secure administration — `lesson.network-controls`**

1. It verifies that boundaries actually enforce the policy.

2. No; routes and rules still determine access.


**Backups, recovery and operational continuity — `lesson.backup-resilience`**

1. RPO concerns tolerated data loss in time; RTO concerns recovery duration.

2. Data alone may not restore a functioning service.


**Cloud, virtual machines and containers — `lesson.cloud-container-overview`**

1. No; customers still control important configuration and identities.

2. Usually no; it shares the host kernel boundary.


**Assessment scope and safe test planning — `lesson.assessment-scope`**

1. No; scope must cover each action and asset.

2. Unexpected impact needs an immediate, agreed response.


**Inventory and low-impact service discovery — `lesson.service-discovery`**

1. No; version strings can be modified and patches backported.

2. It constrains accidental contact with unrelated assets.


**Validate scanner and configuration findings — `lesson.vulnerability-validation`**

1. No; affected versions, conditions and configuration matter.

2. Evidence may not justify either confirmation or rejection.


**Severity, exploitability and remediation order — `lesson.finding-priority`**

1. No; context and business impact must be added.

2. Interpretation and reproducibility depend on them.


**Findings, remediation and retest — `lesson.security-reporting`**

1. Evidence that the relevant weakness is fixed and the required behaviour still works.

2. They prevent unsupported claims about untested areas.


**Events, logs and telemetry quality — `lesson.telemetry-basics`**

1. No; quality, coverage and context matter.

2. Correlation can be wrong without normalisation.


**Filtering, timelines and competing hypotheses — `lesson.log-analysis`**

1. No; it is evidence to investigate, not proof by itself.

2. Counts and sequences depend on them.


**SOC workflow and alert triage — `lesson.soc-triage`**

1. No; investigation is needed.

2. Evidence, timestamps, affected assets, actions, uncertainty and next steps.


**Attacker behaviour and defensive visibility — `lesson.attack-defence-mapping`**

1. No; the logic and data must be tested.

2. Infrastructure and artefacts can change while behaviour persists.


**Containment, escalation and recovery basics — `lesson.response-basics`**

1. It can destroy evidence before it is preserved.

2. Response actions and communication need coordination.


**Understand roles and select a first target — `lesson.role-selection`**

1. No; roles involve different tasks and responsibilities.

2. They can develop relevant operational foundations and experience.


**Build an honest, useful portfolio — `lesson.portfolio-evidence`**

1. It shows limited evidence of reasoning or independent performance.

2. The assistance and which parts you verified independently.


**Tickets, handoffs and responsible disclosure — `lesson.professional-communication`**

1. It helps the right people act while respecting scope and confidentiality.

2. Current status, evidence, decisions, ownership and next action.


**Applications, technical interviews and demonstrations — `lesson.applications-interviews`**

1. It misrepresents context and responsibility.

2. State the gap and describe a sound way to investigate it.


**Readiness review and continuing development — `lesson.learning-roadmap`**

1. No; hiring depends on role fit, evidence, opportunities and other factors.

2. No; they may complement it when relevant to target roles.


**Proxy workflow and web test planning — `lesson.web-testing-workflow`**

1. To avoid capturing or altering unrelated browsing.

2. It provides a comparison for interpreting results.


**SQL and command injection: causes and fixes — `lesson.injection-security`**

1. Allowed input can still be unsafe if interpreted in the wrong context.

2. They separate values from SQL syntax.


**XSS, CSRF and cross-origin mistakes — `lesson.browser-security-testing`**

1. No; the output context determines the safe handling.

2. No; they address different failures.


**Authentication, sessions and broken object access — `lesson.access-auth-testing`**

1. They cover peer-user and role-boundary failures.

2. No.


**Server-side requests, files and parsers — `lesson.server-side-web`**

1. The server has its own network position and permissions.

2. No; content, handling and execution context matter.


**API authorisation and business logic testing — `lesson.api-business-logic`**

1. The sequence may violate a business rule.

2. No.


**Rules of engagement and test design — `lesson.pentest-engagement`**

1. It tests scoped hypotheses and consequences under agreed rules.

2. Proof should not require unnecessary data access or disruption.


**Reconnaissance and hypothesis-driven enumeration — `lesson.recon-hypotheses`**

1. It prevents unsupported findings and wasted testing.

2. No; verify authorisation first.


**Exploit selection and minimal lab validation — `lesson.controlled-validation`**

1. It may do more than its description and may not fit the target.

2. The minimum observable result that establishes the scoped security failure.


**Post-access judgement and evidence limits — `lesson.access-impact`**

1. No; the original scope still applies.

2. They carry different evidence strength.


**Professional pentest report, cleanup and retest — `lesson.pentest-delivery`**

1. It reflects the methods, access and time of the test rather than proving universal security.

2. It confirms the environment was left in an agreed state.


**Domains, forests, objects and DNS — `lesson.ad-structure`**

1. No; they serve different organisational and access purposes.

2. No; they provide different identity services and protocols.


**Kerberos, LDAP and authentication flows — `lesson.kerberos-directory`**

1. Time-based checks help resist replay and require reasonable synchronisation.

2. No; directory queries and authentication protocols have different roles.


**Groups, GPOs and delegated administration — `lesson.ad-policy`**

1. Multiple policies and precedence determine the result.

2. It grants far more power than most tasks require.


**Identity exposure and attack-path reasoning — `lesson.ad-exposure`**

1. No; prerequisites and environmental conditions need validation.

2. It reduces paths from lower-trust systems to privileged identities.


**AD hardening, audit and recovery — `lesson.ad-defence`**

1. Removing excess rights can accidentally remove needed rights.

2. Directory state, credentials, dependencies and trust must remain consistent.


**Local enumeration and execution context — `lesson.privilege-enumeration`**

1. It defines what changed and whether the proof demonstrates escalation.

2. Only the latter establishes a possible execution path.


**Linux privilege misconfigurations — `lesson.linux-escalation`**

1. No; security depends on behaviour and configuration.

2. A lower-privileged user may change code executed with higher privileges.


**Windows service and task permission flaws — `lesson.windows-escalation`**

1. No.

2. The service may execute modified code at higher privilege.


**Secrets, credentials and local blast radius — `lesson.secret-exposure`**

1. No; the credential must be invalidated or rotated where it is used.

2. It extends the exposure.


**Escalation report and regression checks — `lesson.privilege-remediation`**

1. The same path may remain available.

2. It detects the original failure while preserving required behaviour.


**Ingestion, schemas and time normalisation — `lesson.siem-ingestion`**

1. Silent loss or duplication can distort detections.

2. It supports troubleshooting and evidence evaluation.


**Search, aggregation and correlation — `lesson.siem-querying`**

1. One-to-many matches may duplicate events.

2. It changes meaning and makes the query reproducible.


**Detection hypotheses and Sigma-style rules — `lesson.detection-logic`**

1. No; field mapping and backend semantics must be tested.

2. Analysts need context to interpret matches.


**Evaluate precision, recall and base rates — `lesson.detection-evaluation`**

1. Yes; class imbalance can make accuracy misleading.

2. Treat it as undefined and explain rather than inventing a value.


**Triage a correlated alert and write a playbook — `lesson.analyst-investigation`**

1. Unreliable context can distort the decision.

2. A useful playbook supports justified closure as well as escalation.


**Detection change control and operational metrics — `lesson.detection-lifecycle`**

1. No; noise may consume capacity without better coverage.

2. The rule may depend on changed fields or semantics.


**Preparation, roles and evidence preservation — `lesson.response-preparation`**

1. Some actions affect business continuity and require an accountable decision.

2. Urgency makes ad hoc handling error-prone.


**Scope an incident and build a defensible timeline — `lesson.incident-scoping`**

1. No; scope requires evidence.

2. Delayed collection can distort chronology.


**Hypothesis-driven hunting and intelligence use — `lesson.threat-hunting`**

1. It starts from a justified question and defined evidence.

2. Old or mismatched intelligence can create misleading priorities.


**Containment, eradication and verified recovery — `lesson.containment-recovery`**

1. Not necessarily; token and session invalidation must be checked.

2. The same compromise path may persist.


**Incident reports and learning without blame — `lesson.incident-reporting`**

1. Evidence may establish behaviour without identifying the actor.

2. Otherwise lessons may not lead to change.


**Evidence handling, acquisition and provenance — `lesson.forensic-handling`**

1. No; it only supports specific integrity comparisons.

2. The running system and collection activity change state.


**Filesystem structures and recoverable artefacts — `lesson.filesystem-forensics`**

1. No; behaviour depends on filesystem, storage and subsequent activity.

2. It may invalidate or erase data after logical deletion.


**Windows, Linux and browser artefact correlation — `lesson.host-artefacts`**

1. No; history may record input without the outcome.

2. Each artefact has different gaps and reliability limits.


**Memory evidence and process relationships — `lesson.memory-forensics`**

1. No; names can be misleading in either direction.

2. Unsupported parsing can produce incorrect results.


**Timelines, confidence and forensic reporting — `lesson.forensic-reporting`**

1. It enables review of the conclusions.

2. Not without considering acquisition, logging and retention limits.


**Malware categories and analysis boundaries — `lesson.malware-analysis-safety`**

1. No; configuration, shared integrations and vulnerabilities matter.

2. No; benign and inert training artefacts meet the objectives.


**C, memory, pointers and program layout — `lesson.c-memory`**

1. It represents an address; bounds require separate reasoning.

2. They have different lifetime and management rules.


**Registers, instructions and calling conventions — `lesson.assembly-basics`**

1. No; instructions and conventions differ.

2. They help interpret argument passing and returns.


**Executable formats and static analysis — `lesson.binary-analysis`**

1. No; it may be unused data or misleading context.

2. No; it is a reconstructed approximation.


**Controlled observation and debugging — `lesson.dynamic-analysis`**

1. No; inputs and environment may change behaviour.

2. Instrumentation can influence observations.


**Behaviour reports and detection ideas — `lesson.malware-reporting`**

1. No; matches need context and may include benign files.

2. Static evidence and runtime evidence support different claims.


**Cloud services, regions and shared responsibility — `lesson.cloud-operating-model`**

1. No; customer configuration remains relevant.

2. Administration and workload data have different paths and controls.


**Accounts, budgets and lab teardown — `lesson.cloud-sandbox-costs`**

1. No; alerts and optional controls differ and may be delayed.

2. Storage, addresses and other services may remain billable.


**Cloud IAM, roles and policy evaluation — `lesson.cloud-iam`**

1. They reduce the lifetime of exposed credentials.

2. A policy may also grant unintended actions.


**Cloud networks, storage and encryption controls — `lesson.cloud-network-data`**

1. No; authorised decryption paths can still expose it.

2. They constrain different access paths.


**Cloud audit trails and incident questions — `lesson.cloud-audit-response`**

1. No; scope and service coverage may differ.

2. The visible session may need tracing to the originating principal.


**Infrastructure as code and configuration review — `lesson.cloud-iac`**

1. It may contain resource details or secrets.

2. They may affect data or dependent resources.


**Cloud security review, restore and teardown — `lesson.cloud-security-review`**

1. It shows operational care and supports cost control.

2. No; implementation and provider semantics must be verified.


**Images, containers, registries and networks — `lesson.container-foundations`**

1. No; an image is a template and a container is a runtime instance.

2. Defaults may expose a vulnerable service beyond the intended interface.


**Container runtime and image hardening — `lesson.container-hardening`**

1. No; earlier layers may retain it.

2. It can grant powerful control over the host or other containers.


**CI/CD, build identity and protected changes — `lesson.ci-cd-security`**

1. Their code may expose or misuse those secrets.

2. It reduces the consequences of a compromised stage.


**Dependencies, SBOMs and provenance — `lesson.software-supply-chain`**

1. No; signing establishes specific provenance or integrity claims.

2. They affect ownership and upgrade options.


**Kubernetes objects and security boundaries — `lesson.kubernetes-basics`**

1. No; isolation depends on multiple configured controls.

2. No; access, storage and exposure still require controls.


**Security gates, exceptions and rollback — `lesson.devsecops-gates`**

1. Teams may bypass them or ignore useful findings among noise.

2. Reason, owner, compensating controls, expiry and review evidence.


**Security requirements and abuse cases — `lesson.security-requirements`**

1. Requirement identifiers and content can change.

2. No; claims must match tested scope.


**Code review for trust boundaries and unsafe sinks — `lesson.secure-code-review`**

1. Safety depends on transformations and context.

2. They show how hypotheses were tested and bounded.


**Security tests, fuzzing concepts and failure handling — `lesson.security-regression`**

1. It only covers the behaviours and assumptions encoded in tests.

2. It explores inputs and finds failures without exhaustive proof.


**Vulnerability intake, secrets and secure change ownership — `lesson.appsec-operations`**

1. There is no accountable path to remediation.

2. No; deployment and retest need evidence.


**Optional AI application trust boundaries — `lesson.ai-application-security`**

1. No; permissions must be enforced by trusted application controls.

2. It may contain misleading data or instructions.


**Business requirements, assets and design constraints — `lesson.architecture-requirements`**

1. The design must fit actual needs and operating capacity.

2. They determine where the design may fail or need review.


**Identity-centred access and zero-trust principles — `lesson.zero-trust-design`**

1. No; access is explicitly evaluated and constrained.

2. No.


**Resilience, segmentation and data protection — `lesson.resilient-architecture`**

1. No; corruption may replicate.

2. A supposedly redundant component may share a critical dependency.


**Control evidence, reviews and supplier boundaries — `lesson.control-assurance`**

1. No; scope, responsibilities and implementation matter.

2. It makes assurance reviewable rather than purely descriptive.


**Architecture decisions and design review — `lesson.architecture-review`**

1. They explain decisions and help when constraints change.

2. No; implementation and ongoing evidence are required.


**Advanced authentication and multi-step web flaws — `lesson.advanced-web-logic`**

1. Their preconditions may not coexist.

2. The chain’s claimed impact depends on every required link.


**Request ambiguity, race conditions and cache boundaries — `lesson.protocol-race-analysis`**

1. They may disagree about request boundaries or meaning.

2. Timing and concurrent state affect the outcome.


**Network reachability and pivoting in an isolated range — `lesson.lab-pivoting`**

1. No.

2. They can persist beyond the test and change exposure.


**Advanced AD path validation and mitigation — `lesson.ad-attack-path-validation`**

1. Some edges require additional conditions or access.

2. They keep the experiment bounded and avoid exposing real credentials.


**Optional binary vulnerability and exploit-reliability concepts — `lesson.exploit-reliability`**

1. No; additional conditions and evidence are required.

2. They constrain how a memory error can affect execution.


**Scoped adversary simulation and professional synthesis — `lesson.purple-team-campaign`**

1. No; it establishes a bounded result for the tested scenario.

2. Other operators need to distinguish the exercise from a real incident.


## 17. Output B and implementation handoff

`MyDay_Cybersecurity_Curriculum.json` is the canonical static content. It uses normalised entity arrays and stable references, rather than duplicating a project under every lesson. `MyDay_Curriculum.schema.json` defines its structure. `MyDay_Adaptive_Tutor_Spec.json` is a separate proposed policy, not a dependency on any AI provider. `validate_curriculum.py` checks structure and curriculum relationships using Python’s standard library. `Validation_Report.json` records the result and its limits.

The accompanying README explains database mapping, answer-key access, versioning and safe import. The starter datasets are explicitly synthetic, small practice fixtures rather than real incident evidence or production logs. Keep learner state, attempt history, evidence, scheduled reviews and daily plans in separate per-user storage. Preserve content IDs through updates and never overwrite evidence when changing the curriculum.
