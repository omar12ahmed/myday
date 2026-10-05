// AI help placing notes (1.15.0; what's sent and returned: supabase/functions/_shared/ai/connect.ts). Only once you've
// switched it on (Notes → "AI help with notes"), and only for notes MyDay can't place by itself: never private notes,
// never notes already in a project, never blank ones, and never the same words twice. Every answer is checked here; a
// note is linked only if it's still unplaced and unchanged since it was sent — listed under "MyDay connected these"
// with Undo, like the device's own links. Nothing you wrote is changed.
import { CONNECT_LIMITS, NOTE_KINDS, type ConnectContext, type NoteKind } from '../../../supabase/functions/_shared/ai/connect.ts';
import { isBlank } from '../data/notes';
import type { MyDayData, Note } from '../data/types';
import { projectMatches } from '../data/understand';

// A fingerprint of a note's words (FNV-1a, 32 bits): the same words give the same fingerprint on every device.
export function fingerprintNote(n: Pick<Note, 'title' | 'text'>): string {
  const s = `${n.title}\n${n.text}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// The notes AI help may look at, newest first: not private, not in a project, with words in them, not already looked
// at as they are now, and not ones MyDay places by itself (those are linked on the device, with nothing sent).
export function notesForAi(data: MyDayData): Note[] {
  return data.notes.items
    .filter(n => !n.private && !n.projectId && !isBlank(n) && n.aiSeen !== fingerprintNote(n) && !projectMatches(data, n)[0]?.sure)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

const bytes = (s: string) => new TextEncoder().encode(s).length;
// The request: up to 8 of those notes (each cut to 600 characters) and up to 20 open projects (newest first), fewer
// notes if it would be over the size limit. Null when there's nothing to ask (no such notes, or no open projects).
export function connectContext(data: MyDayData): { ctx: ConnectContext; seen: Record<string, string> } | null {
  const L = CONNECT_LIMITS;
  const projects = data.projects.items.filter(p => p.status !== 'done').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, L.projects)
    .map(p => ({ id: p.id, title: p.title.slice(0, L.projectTitleChars), summary: p.summary.slice(0, L.projectSummaryChars) }));
  const picked = notesForAi(data).slice(0, L.notes);
  if (!picked.length || !projects.length) return null;
  let notes = picked.map(n => ({ id: n.id, title: n.title.slice(0, L.noteTitleChars), text: n.text.slice(0, L.noteChars) }));
  const ctx = (): ConnectContext => ({ version: 1, action: 'connect', notes, projects });
  while (notes.length > 1 && bytes(JSON.stringify({ context: ctx() })) > L.bytes) notes = notes.slice(0, -1);
  if (bytes(JSON.stringify({ context: ctx() })) > L.bytes) return null;
  const seen = Object.fromEntries(notes.map(x => [x.id, fingerprintNote(picked.find(n => n.id === x.id)!)]));
  return { ctx: ctx(), seen };
}

export interface ConnectAnswer { id: string; projectId: string | null; kind: NoteKind; why: string }
// The model's reply, checked: only notes that were sent (once each), only projects that were sent (or none), a kind
// from the list and a short reason. Anything else is left out and counted.
export function readConnectReply(text: string, ctx: ConnectContext): { answers: ConnectAnswer[]; leftOut: number } {
  let raw: unknown;
  try { raw = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); } catch { return { answers: [], leftOut: ctx.notes.length }; }
  const list = raw && typeof raw === 'object' && Array.isArray((raw as { notes?: unknown }).notes) ? (raw as { notes: unknown[] }).notes : null;
  if (!list) return { answers: [], leftOut: ctx.notes.length };
  const noteIds = new Set(ctx.notes.map(n => n.id)), projectIds = new Set(ctx.projects.map(p => p.id)), done = new Set<string>();
  const answers: ConnectAnswer[] = [];
  let leftOut = 0;
  for (const item of list) {
    const a = item as Record<string, unknown>;
    const ok = a && typeof a === 'object' && typeof a.id === 'string' && noteIds.has(a.id) && !done.has(a.id)
      && (a.projectId === null || (typeof a.projectId === 'string' && projectIds.has(a.projectId)))
      && NOTE_KINDS.includes(a.kind as NoteKind) && typeof a.why === 'string';
    if (!ok) { leftOut++; continue; }
    done.add(a.id as string);
    answers.push({ id: a.id as string, projectId: a.projectId as string | null, kind: a.kind as NoteKind, why: (a.why as string).replace(/\s+/g, ' ').trim().slice(0, CONNECT_LIMITS.whyChars) });
  }
  return { answers, leftOut };
}

// Use the answers (on the data being saved). A note is looked at again only if you change its words, so each sent note
// is marked as seen — even one the reply left out. It's linked only if it's still not private, not in a project and
// unchanged since it was sent, and the project is open and not one you took it out of. Returns how many were linked.
export function applyConnect(d: MyDayData, seen: Record<string, string>, answers: ConnectAnswer[]): number {
  let linked = 0;
  for (const [id, fp] of Object.entries(seen)) {
    const n = d.notes.items.find(x => x.id === id);
    if (!n || n.private || isBlank(n) || fingerprintNote(n) !== fp) continue; // changed or gone meanwhile: asked again later
    n.aiSeen = fp;
    const a = answers.find(x => x.id === id);
    if (!a) continue;
    n.aiKind = a.kind;
    const p = a.projectId ? d.projects.items.find(x => x.id === a.projectId) : null;
    if (p && p.status !== 'done' && !n.projectId && !(n.notProjects ?? []).includes(p.id)) {
      n.projectId = p.id; n.linkedBy = 'ai'; n.linkWhy = a.why || 'placed by AI help';
      linked++;
    }
  }
  return linked;
}
