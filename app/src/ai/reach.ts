// What of your MyDay may reach AI help: the privacy rules every AI request follows, in one place, so no feature decides
// for itself (specs/ai-tools.md §2). The owner's decisions:
//   - a private note, and a private project with everything of it (its tasks, notes and appointments), never reach AI —
//     except that AI help with notes may offer a private project's name and summary as a place to file a note
//     (17 Oct 2026), and Help me adjust today sends a private project's task on today's plan as "a private task",
//     without its title (24 Oct 2026); and busy time (Help me adjust today, Ask MyDay's look at a day) counts every
//     appointment, a private project's too, by kind and time only, so a day is never shown free when it isn't;
//   - a note's text goes only with "AI help with notes" on;
//   - a task's steps (its checklist's words, done or not) go with it — on its own page, its project's page and Ask
//     MyDay's look at a project — and what it starts after by title, never by id (25 Oct 2026); never a private
//     project's;
//   - never: a case's timeline, evidence and issues; the files you attach (their names and contents); a project's
//     research (questions, findings, sources and conclusions, specs/projects-research.md); a project's outcome, what
//     counts as finished and where you left off; who a task is waiting on (Ask MyDay's waiting lookup sends only that
//     it waits, since and until); where a deadline's date comes from and who checked it (specs/projects-deadlines.md;
//     a task's date goes as it always has); your name, email, preferences and patterns; Finance and Health records (each
//     request builder simply doesn't read them).
// Every request builder asks here, and tests/ai-rules.test.js feeds them all the same private data to prove none leaks.
import { privateProjectIds } from '../data/projects';
import type { Commitment, DateKey, MyDayData, Note, Project, TaskItem } from '../data/types';

export function aiReach(data: MyDayData) {
  const privateProjects = privateProjectIds(data);
  const ofPrivate = new Set(data.projects.items.filter(p => p.private).flatMap(p => p.commitmentIds));
  const inPrivate = (projectId?: string | null) => !!projectId && privateProjects.has(projectId);
  const note = (n?: Pick<Note, 'private' | 'projectId'> | null) => !!n && !n.private && !inPrivate(n.projectId);
  return {
    privateProjects,
    inPrivate,
    /** A project, and anything of it, may reach AI: not one you made private. */
    project: (p?: Pick<Project, 'private'> | null) => !!p && !p.private,
    /** A note may reach AI: not private, and not in a private project. */
    note,
    /** …and its text too: only with "AI help with notes" on. */
    noteText: (n?: Pick<Note, 'private' | 'projectId'> | null) => note(n) && !!data.patterns.prefs.aiNotes,
    /** A task from Inbox → Tasks: not one of a private project. */
    task: (t?: Pick<TaskItem, 'projectId'> | null) => !!t && !inPrivate(t.projectId),
    /** The plan copies on day k of a private project's tasks (by their uid on that day's plan). */
    heldOnPlan: (k: DateKey) => new Set(data.tasks.items.filter(t => t.plannedOn === k && t.planUid && inPrivate(t.projectId)).map(t => t.planUid as string)),
    /** An appointment: not one made from a private project. */
    appointment: (c: Pick<Commitment, 'id'>) => !ofPrivate.has(c.id),
    /** Something made from a note (a revision card): only while that note may reach AI (a deleted note's card stands alone). */
    fromNote: (noteId?: unknown) => { const n = typeof noteId === 'string' ? data.notes.items.find(x => x.id === noteId) : undefined; return !n || note(n); },
  };
}
export type AiReach = ReturnType<typeof aiReach>;
