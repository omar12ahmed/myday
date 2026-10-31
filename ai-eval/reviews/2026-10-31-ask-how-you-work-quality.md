# Ask MyDay uses how you work (instructions myday-ask-v26), 31 Oct 2026

The owner chose to let Ask MyDay use what you've confirmed in What MyDay has noticed, and learn from what you do with
its suggestions (`specs/ask-how-you-work.md`), within the safeguards set the same day (`myday-vision.md` §1: doubt,
forget, wait, withdraw, inspect and delete). This is the check before switching it on.

All results are from **real API calls** on Ask's model, GLM-5.3-Flash. The ten scenarios `hw01`–`hw10` in
`ask-scenarios.ts` each carry `howYouWork` lines as the app would send them; two are controls without:
- study tasks with a confirmed longest;
- packing steps with an admin longest;
- "when should I do the lesson?";
- a tired afternoon;
- a plain request (nothing to quote back);
- spreading admin with a day limit;
- rarely added notes;
- shortened learning tasks.

Accuracy decides. I read every reply.

## What it does well

- **Lengths.** With "Learning tasks: 20 min at most", study tasks came at 15–20 minutes (25–45 in the control). With
  "Admin tasks: 15 min at most", packing steps came at 15 (20–45 in the control). One run of three overshot. The app
  holds suggestions to your longest whenever it's switched on, and says "as you prefer".
- **Not quoting it back.** "Add a task to ring the bank tomorrow" was answered plainly, nine times out of nine.
- **Advice that fits.** On a tired afternoon it led with the shorter learning task. Asked to spread admin over the
  week, it asked what the admin was rather than inventing it.
- **The "rarely adds notes" pattern** was followed once the scenario asked a fair question. The first version asked
  "what should I capture?", which invites notes.

## What was fixed

- **Saying more than was observed.** "You study most between 07:00 and 09:00" became "your best window" or "when
  you're sharpest" in 2 of 3 replies. An observation the person agreed with isn't a judgement of what suits them best.
  The instructions now say each line is an observation, put no more strongly than written. With the app's real
  wording ("You usually study in the morning") it came back as written, 9 of 9.
- **A message cut short by its own quote.** The model wrote a title in straight quotes, which closes the reply's text:
  "I can see ", and "low energy: ". This happened 3 times in about 150 replies. Every request is now told to use
  curly quotes. The app also refuses an unfinished answer that ends in a space, which is how the cut shows, and offers
  to try again rather than show a broken sentence.
- **The day limit.** "At most 2 tasks a day on the plan" is now explained as a limit for the day's plan when
  spreading things over days, not a cap on how many to suggest.

## Regression

The rule about quotes changed every request's instructions, so a sample of 63 other Ask scenarios (four from each
group) was run once. Every one ran in the end; the provider's connection dropped twice during the run. There was no
new miss. Two pre-existing ones remain: a milestone date, and an answer from Today's page where a lookup was expected.

## Cost

About US$0.0006 a reply, with 5 s typical and 15 s at the slowest. These runs cost about US$0.11 in all.

## Conclusion

**Switch it on with v26, the safeguards included.** It adapts where it should and doesn't overstate.

Limits:
- made-up statements and requests;
- one reader (me);
- the replies are kept outside the repository (`ai-eval/results/` is ignored).
