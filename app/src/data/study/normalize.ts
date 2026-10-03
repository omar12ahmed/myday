// Checks saved Study data exactly as normalizeStudy() in the current MyDay does: every item needs a title,
// ids are unique across the whole outline, bad entries are dropped (and counted), numbers are kept in
// range, links must be web links, and only one session can be in progress.
import { isDateKey, todayKey } from '../dates';
import { intIn, isObj, listOf, uid } from '../util';
import type { Clarity, Concept, Outcome, Rating, Review, StudyCourse, StudyData, StudyModule, StudySection, StudySession, StudyStage, StudyTask, Support } from '../types';
import { CLARITY, emptyStudy, OUTCOME, RATING, safeUrl, str, SUPPORT } from './common';

export function normalizeStudy(raw: unknown, report = { dropped: 0 }): StudyData {
  const st = emptyStudy();
  if (!isObj(raw)) return st;
  const seen = new Set<string>();
  const item = (o: unknown, prefix: string): { id: string; title: string } | null => {
    if (!isObj(o) || !str(o.title)) { report.dropped++; return null; }
    const id = typeof o.id === 'string' && o.id && !seen.has(o.id) ? o.id : prefix + uid();
    seen.add(id);
    return { id, title: str(o.title, 120) };
  };
  for (const sgRaw of listOf(raw.stages)) {
    const sgBase = item(sgRaw, 'sg');
    if (!sgBase) continue;
    const tid = (sgRaw as Record<string, unknown>).topicId; // its Study topic (in the same place as the current MyDay keeps it)
    const sg: StudyStage = { ...sgBase, ...(typeof tid === 'string' && tid ? { topicId: tid.slice(0, 64) } : {}), courses: [] };
    for (const cRaw of listOf((sgRaw as Record<string, unknown>).courses)) {
      const cBase = item(cRaw, 'co');
      if (!cBase) continue;
      const cr = cRaw as Record<string, unknown>;
      const c: StudyCourse = { ...cBase, url: safeUrl(str(cr.url, 400)), minutes: intIn(cr.minutes, 5, 600, 30), listId: typeof cr.listId === 'string' ? cr.listId : null, archived: cr.archived === true, modules: [] };
      for (const mRaw of listOf(cr.modules)) {
        const mBase = item(mRaw, 'md');
        if (!mBase) continue;
        const m: StudyModule = { ...mBase, sections: [] };
        for (const sRaw of listOf((mRaw as Record<string, unknown>).sections)) {
          const sBase = item(sRaw, 'sc');
          if (!sBase) continue;
          const s: StudySection = { ...sBase, tasks: [] };
          for (const tRaw of listOf((sRaw as Record<string, unknown>).tasks)) {
            const tBase = item(tRaw, 'tk');
            if (!tBase) continue;
            const tr = tRaw as Record<string, unknown>;
            const done = tr.done === true;
            const t: StudyTask = { ...tBase, minutes: intIn(tr.minutes, 5, 600, 30), url: safeUrl(str(tr.url, 400)), kind: tr.kind === 'practical' ? 'practical' : 'learn', note: str(tr.note, 300), done, doneOn: done && isDateKey(tr.doneOn) ? tr.doneOn : null };
            s.tasks.push(t);
          }
          m.sections.push(s);
        }
        c.modules.push(m);
      }
      sg.courses.push(c);
    }
    st.stages.push(sg);
  }
  if (st.stages.some(sg => sg.courses.some(c => c.id === raw.focusCourseId))) st.focusCourseId = raw.focusCourseId as string;
  // Study topics (as the current MyDay keeps them): each with an id and a title.
  if (Array.isArray(raw.topics)) {
    const seenT = new Set<string>();
    st.topics = [];
    for (const t of raw.topics) {
      if (!isObj(t) || typeof t.id !== 'string' || !t.id || seenT.has(t.id) || !str(t.title)) { report.dropped++; continue; }
      seenT.add(t.id);
      st.topics.push({ id: t.id.slice(0, 64), title: str(t.title, 60) });
    }
  }
  if (isObj(raw.settings)) { st.settings.vault = str(raw.settings.vault, 100); st.settings.showClock = raw.settings.showClock !== false; }

  const taskIds = new Set(st.stages.flatMap(sg => sg.courses.flatMap(c => c.modules.flatMap(m => m.sections.flatMap(s => s.tasks.map(t => t.id))))));
  for (const x of listOf(raw.concepts)) {
    if (!isObj(x) || !str(x.title)) { report.dropped++; continue; }
    const id = typeof x.id === 'string' && x.id && !seen.has(x.id) ? x.id : 'cp' + uid();
    seen.add(id);
    const choices = listOf(x.choices).slice(0, 6).map(c => (typeof c === 'string' ? c.trim().slice(0, 200) : ''));
    const rv = isObj(x.review) ? x.review : {};
    const concept: Concept = {
      id, title: str(x.title, 120), taskIds: [...new Set(listOf(x.taskIds).filter((t): t is string => typeof t === 'string' && taskIds.has(t)))], createdOn: isDateKey(x.createdOn) ? x.createdOn : todayKey(),
      kind: x.kind === 'choice' ? 'choice' : 'written', prompt: str(x.prompt, 1000), answer: str(x.answer, 2000), explanation: str(x.explanation, 4000),
      choices, correct: Number.isInteger(x.correct) && choices[x.correct as number] ? (x.correct as number) : null, hint: str(x.hint, 500), source: str(x.source, 400), note: str(x.note, 300),
      review: { reps: intIn(rv.reps, 0, 100000, 0), interval: intIn(rv.interval, 0, 365, 0), lapses: intIn(rv.lapses, 0, 100000, 0), due: isDateKey(rv.due) ? rv.due : null },
    };
    st.concepts.push(concept);
  }
  const conceptIds = new Set(st.concepts.map(c => c.id));
  for (const x of listOf(raw.sessions)) {
    if (!isObj(x) || typeof x.id !== 'string' || !x.id || seen.has(x.id) || !isDateKey(x.date)) { report.dropped++; continue; }
    seen.add(x.id);
    const ci = isObj(x.checkin) ? x.checkin : null;
    const s: StudySession = {
      id: x.id, courseId: typeof x.courseId === 'string' ? x.courseId : null, taskId: typeof x.taskId === 'string' ? x.taskId : null,
      title: str(x.title, 250) || 'Study session', date: x.date, startedAt: str(x.startedAt, 20), plannedMin: intIn(x.plannedMin, 1, 600, 30), short: x.short === true,
      status: x.status === 'active' ? 'active' : 'done', runningSince: Number.isFinite(x.runningSince) ? (x.runningSince as number) : null,
      activeMs: Number.isFinite(x.activeMs) && (x.activeMs as number) >= 0 ? (x.activeMs as number) : 0, endedAt: typeof x.endedAt === 'string' ? x.endedAt : null,
      checkin: ci ? { conceptIds: listOf(ci.conceptIds).filter((c): c is string => typeof c === 'string' && conceptIds.has(c)), clarity: CLARITY[ci.clarity as Clarity] ? (ci.clarity as Clarity) : null, takeaway: str(ci.takeaway, 500), question: str(ci.question, 500), note: str(ci.note, 300) } : null,
      taskDone: x.taskDone === true ? true : x.taskDone === false ? false : null, todayUid: typeof x.todayUid === 'string' ? x.todayUid : null,
    };
    st.sessions.push(s);
  }
  for (const x of listOf(raw.reviews)) {
    if (!isObj(x) || typeof x.conceptId !== 'string' || !isDateKey(x.date) || !RATING[x.rating as Rating]) { report.dropped++; continue; }
    const id = typeof x.id === 'string' && x.id && !seen.has(x.id) ? x.id : 'rv' + uid();
    seen.add(id);
    const r: Review = {
      id, conceptId: x.conceptId, title: str(x.title, 120), date: x.date, at: str(x.at, 20), kind: x.kind === 'choice' ? 'choice' : 'written',
      outcome: OUTCOME[x.outcome as Outcome] ? (x.outcome as Outcome) : null, graded: x.graded === 'auto' || x.graded === 'self' ? x.graded : null,
      chosen: Number.isInteger(x.chosen) ? (x.chosen as number) : null, support: SUPPORT[x.support as Support] ? (x.support as Support) : 'own', rating: x.rating as Rating,
      gap: intIn(x.gap, 1, 180, 1), due: isDateKey(x.due) ? x.due : null,
    };
    st.reviews.push(r);
  }
  // Only one session can be in progress.
  const active = st.sessions.filter(x => x.status === 'active');
  const keep = active.find(x => x.id === raw.activeId) || active[0] || null;
  for (const x of active) if (x !== keep) { x.status = 'done'; x.runningSince = null; }
  st.activeId = keep ? keep.id : null;
  return st;
}
