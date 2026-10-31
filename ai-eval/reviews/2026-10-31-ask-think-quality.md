# Ask MyDay helps you think (instructions myday-ask-v27), 31 Oct 2026

The owner chose how Ask MyDay should help with an open question (`specs/ask-help-you-think.md`):
- ask before ideas, one question at a time, with up to four choices to tap or your own words;
- up to your limit (5 unless you change it), then reflect your thinking back and offer one step to add or leave;
- "just give me ideas" and plain requests are answered at once;
- it never decides for you.

This is level 3 of "How MyDay should think" (`myday-vision.md` §1). This is the check before switching it on, and
the owner also asked whether GLM or Gemini suits it better.

All results are from **real API calls**. The twelve scenarios `th01`–`th12` in `ask-scenarios.ts` carry `thinking` as
the app sends it:
- open goals and decisions (an online business, changing jobs, delivery for a project, learning something new);
- two plain controls (add a task, break packing down);
- "just give me ideas";
- a choice tapped mid-way;
- at the limit of 5, and with a limit of 1;
- "I don't know where to start" on a task;
- "just tell me yes or no" on quitting a job.

Each ran 3 times on GLM-5.3-Flash (Ask's model), Gemini 3.5 Flash-Lite and Gemini 3.8 Flash. I read all 108 replies
**blind**: shuffled per scenario, without knowing the model, and scored each 1–5 before unblinding.

## Which model

| Model | Mean (1–5) | Scored 5 | Scored 2 or less | Cost of these 36 replies |
| --- | --- | --- | --- | --- |
| Gemini 3.8 Flash | 4.11 | 5 | 0 | US$0.13 |
| GLM-5.3-Flash | 4.00 | 11 | 2 | US$0.025 |
| Gemini 3.5 Flash-Lite | 3.44 | 1 | 5 | US$0.06 |

- **GLM and Gemini 3.8 Flash are close.** Gemini 3.8 Flash was steadier; GLM wrote the best replies more often, at a
  fifth of the cost. That is no reason to move Ask, which the 10 Oct roles keep on GLM.
- **Gemini 3.5 Flash-Lite isn't suitable.** Twice it misread the conversation and offered its earlier choices back
  ("Here are a few ways to answer that. Shall we add your choice?"). Once it suggested three projects with no names.
  Three more times it asked another question where it should have stopped or answered.

## What GLM does well

- **It asks before ideas.** All 12 open goals and decisions got one question first, with fitting choices: what you
  hope to get out of it, what's wearing you down at work, which part of delivery to work out first. It often says why
  it asks ("so we can see whether a change would fix it").
- **It uses what it knows.** It suggested building on your existing projects, or on what you're already studying.
- **It reflects back in your words.** At the limit it summed up ("extra income from teaching maths, a mix of live and
  made-once, about 5 hours a week — and weekends stay yours") and offered one project or task to add or leave.
- **Plain requests stay plain.** "Ring the bank" and "break the packing down" were answered at once, 6 times out of 6.
  So was "just give me ideas", 3 times out of 3.
- **It never decides.** On "just tell me yes or no" about quitting a job, it said the call is yours, and then either
  pointed to the evidence still missing (the 10 offices not yet listed) or asked what you'd need to see first.

## What was fixed (after a first run and the code review)

- **A question ends with the question.** The rule for answers asked for "one clear next step", which a thinking
  question shouldn't have. The new instructions say a question has no step after it, and that the one step at the
  end is a single item you can add or leave, never a bare offer.
- **Choices never come with an action.** Once, "today feels like too much" came with both choices and Help me
  adjust today. The instructions now say choices only go with a thinking question, and the server and the app drop
  choices that come with an action.
- **Your limit is kept by the app too.** Once in three, GLM asked again with a limit of 1. Past your limit the app
  now leaves the choices out, so the question isn't shown or counted as another one.
- **Not for what a professional should advise on.** Medication, symptoms, legal trouble, debts or investments get a
  kind pointer to who to ask, not a thought-through choice. "Should I stop taking my medication?" passed 3 of 3.

## Still to know

- **"I don't know where to start" on a task** got small steps 2 times in 3, not a question. Both are kind and useful;
  the steps were good ones.
- **After one tapped choice** it sometimes moves to a step that builds on your existing ideas, rather than asking a
  second question. Fair, if a little quick.
- **On "yes or no" about a big decision** every model asks what you'd need to see, rather than answering at once.
  Given "never decide for them", that's right. The scenario now expects only that it never decides.

## Regression

The instructions are sent with every Ask request now, so 18 existing scenarios were run 3 times with the final
wording:
- adding;
- breakdowns;
- "what first?";
- "today feels like too much";
- medication;
- "choose for me";
- milestones;
- "will it work?";
- a course plan;
- a lookup;
- a day;
- a conversation;
- how you work.

None started asking questions where it shouldn't. There were 3 misses in 599, neither about thinking:
- a course plan repeated the lesson that's next (2 of 3); the app shows it unticked, as already there;
- a breakdown used an id it wasn't given (1 of 3); the app leaves it out.

## Cost

GLM costs about US$0.0007 a reply, typically 4 s and 7–9 s at the slowest. The runs for this release cost about
US$0.31 in all, the Gemini comparison included.

## Conclusion

**Switch it on with v27, on GLM.** It asks good questions, keeps to the limit, reflects back without deciding, and
leaves plain requests alone.

Limits:
- made-up conversations;
- one reader (me);
- the replies are kept outside the repository (`ai-eval/results/` is ignored).
