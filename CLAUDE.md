# MyDay instructions for Claude Code

The canonical repository instructions are in `AGENTS.md`. Read and follow that file before changing this repository.

Claude-specific helper definitions remain in `.claude/agents/`. They are workflow helpers, not additional product requirements. The main session remains responsible for reviewing their output, preserving user changes, and following the safety, verification, and external-action boundaries in `AGENTS.md`.

## When to use the helpers

The owner has asked Claude to decide for itself when to use agents; don't wait to be asked. The aim is to keep long, wordy, routine work off the main model, so the main session's context and allowance go on thinking, decisions and review.

- **Hand off** work that is long or prints a lot and needs no judgement: `test-runner` for build, lint and anything beyond a quick single suite (several suites, a full run, `ai-deno`, a flake rerun); `test-writer` for new checks of behaviour already specified and built; `docs-drafter` for README text from facts you give it. A read-only search or audit across many files can go to an `Explore` or general-purpose agent.
- **Keep in the main session:** planning and every decision with the owner; code or test changes touching saved data, `storage.ts`, sync, migrations, `supabase/`, `index.html`, AI instructions or reply validation, security or secrets; design and UI wording; judging AI evaluation replies; commits, merges, publishing and every external action (GitHub, Supabase, live checks, live AI evaluations).
- **Don't hand off** a one-line command or a quick search: a helper starts cold, so a small job costs more delegated than done.
- **Independent review:** before a release that changes code beyond a trivial fix, have a separate agent review the diff read-only and report findings with evidence. Use the `fable` model for that review when the change touches saved data, sync, migrations, privacy or security; otherwise the default model is enough.
- **Every hand-off names** the worktree, the four test ports (one run per set of ports at a time), the exact files or suites, and what "done" looks like. For `ai-deno` in a worktree without its own `tests/.denotools`, pass `MYDAY_DENO` pointing at another checkout's copy, since Deno may not be on PATH.
- **Check before reporting:** read everything a helper produces, re-check anything that looks off, and redo work that isn't good enough. If a helper fails or hits its usage limit, do the job in the main session and say so.
