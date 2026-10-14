# Revision cards: which model writes, which checks (13–14 Oct 2026)

AI roles step 3, part B: "More practice" on a Cybersecurity lesson asks one model to write up to 10 revision cards
on the lesson's key ideas and a second model to check each one; only cards the checker keeps reach the learner, who
then chooses which to add. Two questions: which model writes the most accurate cards, and which one catches mistakes
best. Quality and accuracy decide, not speed (a learner revises from every card that gets through).

Everything here is synthetic or curriculum material: four Cybersecurity lessons, no learner's data. All results come
from **real API calls** (paid tiers), US$0.34 in all from reported token usage.

## 1. Writers

GLM-5.3-Flash, Gemini 3.8 Flash and Gemini 3.5 Flash-Lite each wrote 10 cards for four lessons where precision
matters (routing/DNS/DHCP/NAT, TCP/UDP, Linux permissions, password storage and MFA), twice
(`results/2026-10-13-22-08-20-live`, instructions `myday-cards-v1`, US$0.069). The course's own two questions for
each lesson were sent as "existing", as they would be for a learner who has them in revision.

Every card was then read and judged **blind**: each lesson's sets shuffled and labelled A–F, the key opened only
after every card was scored. Per card: **sound**, **slip** (imprecise, overstated or debatable) or **wrong** (the
answer, the marked option or the explanation is false). Per set: **teaching**, 1–5 (tests understanding rather than
definitions, applied scenarios, clear, varied, on the lesson's objectives). Reviewer: Claude (an AI reading other AIs'
cards, not a qualified teacher). Two slips were missed by the review and found later by a checker (below); they're
counted here.

| Writer | Cards usable | Wrong | Slips | Teaching | Typical / slow time | Cost per set of 10 |
|---|---|---|---|---|---|---|
| **Gemini 3.8 Flash** | **80/80** | **0** | **0** | 4.38 | 12 s / 13 s | US$0.005 |
| GLM-5.3-Flash | 75/80 | 2 | 9 | **4.88** | 26 s / 33 s | US$0.0008 |
| Gemini 3.5 Flash-Lite | 60/80 (2 sets not usable JSON) | 1 | 6 | 3.25 | 4 s / 5 s | US$0.003 |

- **Gemini 3.8 Flash** wrote 80 cards without a single error or imprecision: precise, mostly applied, a little more
  definitional than GLM ("which state is LISTEN?").
- **GLM-5.3-Flash** taught best — scenario cards (an account that can list but not open files; what an attacker who
  steals a well-hashed database must still do) — but wrote two wrong cards in one set: "Can a user with write
  permission on a file, but not on its directory, delete it? — Yes" (the explanation then says deletion depends on the
  directory: it can't), and "a umask of 002 strips group write" (it strips write for others). Its slips: the 4- or
  5-tuple called "a socket", file permissions said to "still apply" to a process elevated to root, a DHCP failure
  said to leave a machine unable to "communicate at all", a debatable recovery design. It also dropped 5 cards of its
  own in the shape check (too long).
- **Gemini 3.5 Flash-Lite** was fast but weakest: two unusable replies, definitional cards (what does 7 mean in
  rwx?), one wrong explanation (number-matching push "binds the session to the site"), NAT presented as a security
  feature, "SMS is unencrypted", work factor said to slow credential stuffing.

## 2. Checkers

### On seeded mistakes: too easy to tell them apart

A labelled set of 40 cards written for the evaluation, 14 with deliberate mistakes (a wrong option marked right, a
right answer with a wrong explanation, a half-truth) — `CHECK_SCENARIOS` in `cards-scenarios.ts`, 3 repeats
(`results/2026-10-13-22-13-38-live`, US$0.033). GLM and Gemini 3.8 Flash both dropped all 42 mistakes and kept all 78
sound cards; Gemini 3.5 Flash-Lite caught every mistake but also dropped a third of the sound cards. The seeded
mistakes were too obvious to separate the two strong models.

### On the writers' real drafts: GLM misses subtle mistakes

So the checkers were given the 215 cards the writers had actually produced, each with the blind review's label
(`cards-drafts.json`, `--action cards-drafts`; 3 wrong cards and 15 slips), twice each:

| Checker | Wrong cards caught | Slips caught | Sound cards kept | Typical / slow time |
|---|---|---|---|---|
| GLM-5.3-Flash (its usual low reasoning) | 1/6 | 1–2/30 | 394/394 | 6 s / 8 s |
| GLM-5.3-Flash, high reasoning | 3/6 | 5/30 | 394/394 | 10 s / 19 s |
| **Gemini 3.8 Flash** | **4/6** | 5–6/30 | 391/394 | 4 s / 6 s |

(`results/2026-10-13-22-18-43-live` with checking instructions v1; `…23-20-50-live` with v2; `…23-30-05-live` GLM at
high reasoning, v2. Rescored after the two missed slips were relabelled.)

- At its usual setting GLM kept almost everything: the "Yes, you can delete it" card both times, and the umask card
  once. It reasons very little at "low" (about 30 reasoning tokens a check).
- Clearer checking instructions (`myday-cards-check-v2`: work out the answer before reading the card's, check the
  answer and explanation agree, check every option and every number) changed nothing measurable, but are kept: they
  say what a careful check is.
- At high reasoning GLM caught the umask card both times and the push card once, and found the two slips the blind
  review had missed. It still kept the "Yes, you can delete it" card.
- Gemini 3.8 Flash caught both of GLM's wrong cards both times and kept 391 of 394 sound cards; the three it dropped
  were fair (an off-outline setgid card, "nothing unusual" when TCP retransmits, "only the owner" when root can too).
  Everyone missed the number-matching push card at least once. Once in 104 checks Gemini wrote a stray word inside its
  JSON — the server treats that as "couldn't check", so no cards are shown that time.

## 3. Conclusion

The two roles must be different models, and Gemini 3.8 Flash is the best at both. On accuracy:

- **Gemini writes, GLM (high reasoning) checks** — the writer made no mistakes and no slips in 80 cards, and the
  checker catches about half of the subtle ones. Fewest wrong or imprecise cards reaching the learner. Teaching 4.38.
  About US$0.006 and 20–30 s a tap.
- GLM writes, Gemini checks — the best teaching (4.88) and the strongest checker, but GLM's slips get through more
  often (Gemini caught 2 of its 9). About US$0.003 and 30–40 s a tap.

**Recommendation: Gemini 3.8 Flash writes, GLM-5.3-Flash checks at high reasoning** (`AI_ROUTES={"cards": "learn"}`,
`AI_CHECKER_EXTRA_BODY` — see `../../supabase/ai-secrets.example.env`). Swapping the roles is configuration only
(drop `"cards": "learn"` from the routes). Either way the learner sees "Written by …, checked by … — not by your
course" and can untick any card; every kept card says in its source that it was AI-written.

Limits: one reviewer, four lessons, 215 cards, 3 wrong ones — a small sample; "0 wrong in 80" doesn't mean never.
The tutor stays on GLM (`2026-10-13-tutor-quality.md`).
