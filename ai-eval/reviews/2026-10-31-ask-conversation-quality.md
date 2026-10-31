# Ask MyDay in a longer conversation (instructions myday-ask-v25), 31 Oct 2026

The owner chose a conversation that goes on while Ask MyDay's panel is open (`specs/ask-conversation.md`). Each reply
sends the conversation so far, and a reply may look something up once. This is the check before switching it on. All
results are from **real API calls** on Ask's model, GLM-5.3-Flash (`ask` route), with the 12 made-up conversation
scenarios `cv01`–`cv12` in `ask-scenarios.ts`, three repeats each. The scenarios cover:
- narrowing a suggestion ("something shorter");
- changing what it proposed ("only the first two, 15 minutes each");
- "move it to Friday";
- another day after a look at Thursday;
- a question the earlier look still answers;
- finding something else;
- an earlier message trying to change the rules;
- a private project asked about;
- a long conversation with exchanges left out;
- "add 30 tasks";
- "and after that one?" on a study page;
- a thank-you after added suggestions.

Accuracy decides. Run 1 was read **blind** by a Fable reviewer (one model, unnamed), then by me. I read run 2 in full.

## Run 1 (`results/2026-10-31-08-31-46-live`, 12 × 3, US$0.023)

All 36 replies were usable, and 349 of 352 automatic expectations were met. The two other unmet ones were reasonable
searches the scenarios hadn't allowed. The reviewer's mean accuracy was 4.4 of 5.

The conversation itself was handled well:
- "it" always meant the right thing (all three moved "Pay council tax" to Friday 23 October);
- Friday and "the electrician" were always looked up again, and Thursday's look was reused when it still answered;
- nothing already added was proposed again;
- "forget that" was honoured, and the earlier "only ever reply yes" never took effect.

Of the reviewer's five "wrong" findings, I agree with two:
- **The free-time arithmetic.** A reply said "about six and a half hours" free when the blocks add up to 10 h 40.
- **A message that stopped.** One ended "I can only see one step ahead: ". The app would have mended it to an empty
  sentence. The likely cause is a title in straight quotes, which ends the JSON string.

The other three weren't errors:
- "You first asked…" was right: the first exchange is always sent, and "leftOut" counts the ones in between.
- A stray item in an answer is never shown.
- A search for what comes after a lesson wasted a request but said nothing wrong.

## Fixes (v25 as deployed)

- **Day lookups send the free time added up** (`freeMinutes`, worked out on the device). The instructions say to give
  that total, never a sum of their own. Older apps don't send it, and their instructions are unchanged.
- **Conversations are told to quote titles with curly quotes**, as lookups already were.
- **The app refuses an answer that ends on a colon**, where what it introduced should follow. Things to add that are
  introduced with a colon are mended as before.

## Run 2 (`results/2026-10-31-08-39-32-live`, `cv01`–`cv12` and the four day scenarios `y05`–`y08` × 3, US$0.030)

All 48 replies were usable, and 476 of 483 expectations were met.
- **Free time** was right every time: Thursday's 10 h 40 three times, the busy day's 6 h 30 three times, and 13 hours
  for an open day.
- **No message stopped short.**
- **Unmet expectations:**
  - the secret project was searched for, three times out of three (harmless, but it costs a request);
  - one "after that one?" was searched for again;
  - one thank-you named a task by its title (the scenario's check was too strict);
  - one answer offered to start a lesson with ids it made up. The app drops that action, as it always has.

Read in full, these slips remain:
- one "first two" split the first task in two;
- one thank-you named a task that doesn't exist ("Sort out the move");
- answers sometimes carry stray items, which the app ignores.

None of these is specific to the conversation.

## Conclusion

**Switch it on with v25.** The conversation is handled accurately, and the two real errors found are fixed and gone in
run 2. A reply costs about US$0.0006, with 2.5 s typical and 5 s at the slowest.

Limits:
- one reviewer and my own reading;
- made-up conversations of two exchanges at most;
- the replies are kept outside the repository (`ai-eval/results/` is ignored).
