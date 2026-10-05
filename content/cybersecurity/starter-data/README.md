# Synthetic practice data

These files are optional starting fixtures for programming, log analysis and triage. They contain no real incident evidence. Names beginning with `lab-` are labels, not targets to contact.

- `synthetic_auth.csv`: practise schema validation, timezone normalisation, duplicate handling and grouping. Reject invalid timestamps and empty results; deduplicate by event ID for the stated ground truth.
- `synthetic_web.jsonl`: practise JSON Lines parsing, request correlation and interpreting an access denial.
- `synthetic_host_events.json`: abstract host-event examples, deliberately not represented as authentic Windows EVTX records or actual Windows event IDs.
- `Tutor_Ground_Truth.json`: answer key. Read after your own attempt or keep it out of the learner-facing context in MyDay.

Your task: load the records, state the validation rules, count accepted/rejected/duplicate records, build a UTC timeline, propose competing explanations and name one missing source. Do not assume the suspicious label establishes an actual attacker or a confirmed data breach.

These tiny fixtures are not a realistic evaluation benchmark. For the SOC project, author additional benign and suspicious scenarios, preserve separate labels and hold out new variants before tuning. For native Windows administration or memory forensics, obtain an appropriate authorised live environment or released image; these exports do not prove those skills.
