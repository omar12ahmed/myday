// Areas (specs/projects-areas-archive.md): the parts of your life your projects belong to — Home, Work, a business idea,
// Study — made as you go, each with a soft colour that's always shown with its name. An area is simply the name on its
// projects (`project.area`), with its colour beside it (`project.areaColour`), so it syncs with them and needs nothing
// else. Choosing, renaming or recolouring an area is organising, not work: a project's "updated" time stays.
// And finishing: how a project ended (achieved, or stopped on purpose), and bringing it back from the archive.
import { localStamp, todayKey } from './dates';
import { PROJECT_LIMITS } from './projects';
import type { DateKey, MyDayData, Project } from './types';

export const AREA_COLOURS = ['sage', 'sky', 'sand', 'rose', 'lilac', 'teal', 'clay', 'slate'] as const;
export type AreaColour = typeof AREA_COLOURS[number];
export const COLOUR_LABEL: Record<AreaColour, string> = { sage: 'Sage', sky: 'Sky', sand: 'Sand', rose: 'Rose', lilac: 'Lilac', teal: 'Teal', clay: 'Clay', slate: 'Slate' };
// An area's name as written: single spaces, up to 40 characters.
export const tidyArea = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, PROJECT_LIMITS.area);
const tidy = tidyArea;
// Names match whatever the capitals and spacing ("home" is Home), the same on every device.
export const sameArea = (a: string, b: string) => tidy(a).toLowerCase() === tidy(b).toLowerCase();
const same = sameArea;
const known = (c: unknown): c is AreaColour => AREA_COLOURS.includes(c as AreaColour);
// The colour itself, from styles/tokens.css (made for light and dark).
export const areaVar = (c: AreaColour) => `var(--area-${c})`;

// ---------- Looking at them ----------
export interface Area { name: string; colour: AreaColour; count: number }
// An area's colour: its projects' (the most common, if two devices chose differently; ties go to the palette's order).
// A colour this version doesn't know reads as the first.
export function colourOf(data: MyDayData, name: string): AreaColour {
  const tally = new Map<AreaColour, number>();
  for (const p of data.projects.items) if (p.area && same(p.area, name) && known(p.areaColour)) tally.set(p.areaColour, (tally.get(p.areaColour) ?? 0) + 1);
  let best: AreaColour = AREA_COLOURS[0], n = 0;
  for (const c of AREA_COLOURS) if ((tally.get(c) ?? 0) > n) { best = c; n = tally.get(c)!; }
  return best;
}
// The areas in use, in name order, with their colour and how many projects (not finished ones) each has.
export function areasOf(data: MyDayData): Area[] {
  const names = new Map<string, string>();
  for (const p of data.projects.items) if (p.area && !names.has(tidy(p.area).toLowerCase())) names.set(tidy(p.area).toLowerCase(), tidy(p.area));
  return [...names.values()].sort((a, b) => a.localeCompare(b))
    .map(name => ({ name, colour: colourOf(data, name), count: data.projects.items.filter(p => p.status !== 'done' && p.area && same(p.area, name)).length }));
}
// The colour a new area gets: the first no area uses (when all are, the least used).
export function nextColour(data: MyDayData): AreaColour {
  const used = areasOf(data).map(a => a.colour);
  return AREA_COLOURS.find(c => !used.includes(c)) ?? [...AREA_COLOURS].sort((a, b) => used.filter(x => x === a).length - used.filter(x => x === b).length)[0];
}
// A project's area as shown: its name and its area's colour (null when it has none).
export const areaOfProject = (data: MyDayData, p: Project): { name: string; colour: AreaColour } | null => (p.area ? { name: tidy(p.area), colour: colourOf(data, p.area) } : null);

// ---------- Changing them (each returns whether anything changed) ----------
// Puts a project in an area — one already used (whatever the capitals: its name and colour), or a new one (the next
// free colour) — or none.
export function setArea(d: MyDayData, projectId: string, name: string | null): boolean {
  const p = d.projects.items.find(x => x.id === projectId), n = name === null ? '' : tidy(name);
  if (!p) return false;
  if (!n) { if (!p.area) return false; delete p.area; delete p.areaColour; return true; }
  const existing = areasOf(d).find(a => same(a.name, n)), toName = existing?.name ?? n, toColour = existing ? existing.colour : nextColour(d);
  if (p.area === toName && p.areaColour === toColour) return false;
  p.area = toName; p.areaColour = toColour;
  return true;
}
// Renames an area on every project in it; to a name already used, the two become one (with that area's colour).
export function renameArea(d: MyDayData, from: string, to: string): boolean {
  const n = tidy(to), into = areasOf(d).find(a => same(a.name, n) && !same(a.name, from));
  if (!n || !d.projects.items.some(p => p.area && same(p.area, from))) return false;
  const colour = into ? into.colour : colourOf(d, from), name = into ? into.name : n;
  let changed = false;
  for (const p of d.projects.items) if (p.area && same(p.area, from) && (p.area !== name || p.areaColour !== colour)) { p.area = name; p.areaColour = colour; changed = true; }
  return changed;
}
export function recolourArea(d: MyDayData, name: string, colour: AreaColour): boolean {
  if (!known(colour)) return false;
  let changed = false;
  for (const p of d.projects.items) if (p.area && same(p.area, name) && p.areaColour !== colour) { p.areaColour = colour; changed = true; }
  return changed;
}

// ---------- Finishing ----------
export type FinishedHow = 'achieved' | 'stopped';
export const FINISHED_LABEL: Record<FinishedHow, string> = { achieved: 'Achieved', stopped: 'Stopped on purpose' };
export const finishedLabel = (p: Project) => (p.finished?.how === 'achieved' || p.finished?.how === 'stopped' ? FINISHED_LABEL[p.finished.how] : 'Finished');
// Finished: achieved or stopped on purpose, with a note if you like, today. It moves to the archive (status 'done').
export function finishProject(d: MyDayData, projectId: string, how: FinishedHow, note = '', k: DateKey = todayKey()): boolean {
  const p = d.projects.items.find(x => x.id === projectId);
  if (!p || (how !== 'achieved' && how !== 'stopped')) return false;
  p.status = 'done'; p.finished = { how, note: note.trim().slice(0, PROJECT_LIMITS.finishedNote), on: k }; p.updatedAt = localStamp();
  delete p.waiting; // (finishing ends its wait: specs/projects-project-waiting.md)
  return true;
}
// The archive: finished projects, the most recently finished first (one finished before this release by when it was
// last changed).
export function archive(data: MyDayData): Project[] {
  const when = (p: Project) => p.finished?.on ?? p.updatedAt.slice(0, 10);
  return data.projects.items.filter(p => p.status === 'done').sort((a, b) => when(b).localeCompare(when(a)) || b.updatedAt.localeCompare(a.updatedAt));
}
